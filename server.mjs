import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MongoClient } from 'mongodb';
import nodemailer from 'nodemailer';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.join(__dirname, 'dist');

const PORT = Number(process.env.PORT) || 8080;
const HOSTNAME = process.env.HOSTNAME || '0.0.0.0';
const MONGO_URI = process.env.MONGO_URL || process.env.MONGODB_URI || '';
const DB_NAME = process.env.DB_NAME || 'ozo_one';

const KV_COLLECTION = 'ozostack_crm_kv';
const META_COLLECTION = 'ozostack_crm_meta';
const MIGRATION_ID = 'ozostack_ai_studio_migrated_v1';
const SMTP_KV_KEY = 'ozostack_smtp_config_v1';

let dbInstance = null;
let dbConnectPromise = null;

async function getDb() {
  if (dbInstance) return dbInstance;
  if (!MONGO_URI) return null;
  if (dbConnectPromise) return dbConnectPromise;

  dbConnectPromise = (async () => {
    try {
      const client = new MongoClient(MONGO_URI, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
      });
      await client.connect();
      const db = client.db(DB_NAME);

      try {
        const metaCol = db.collection(META_COLLECTION);
        const migrated = await metaCol.findOne({ _id: MIGRATION_ID });
        if (!migrated) {
          const collections = await db.listCollections().toArray();
          for (const col of collections) {
            if (
              col.name !== KV_COLLECTION &&
              col.name !== META_COLLECTION &&
              !col.name.startsWith('system.')
            ) {
              await db.collection(col.name).drop().catch(() => {});
            }
          }
          await metaCol.updateOne(
            { _id: MIGRATION_ID },
            { $set: { migratedAt: new Date().toISOString() } },
            { upsert: true }
          );
        }
      } catch (cleanupErr) {
        console.warn('[MongoDB] Legacy collection cleanup warning:', cleanupErr?.message);
      }

      dbInstance = db;
      console.log(`[MongoDB] Connected to database "${DB_NAME}"`);
      return dbInstance;
    } catch (err) {
      console.warn('[MongoDB] Connection unavailable:', err?.message);
      dbConnectPromise = null;
      return null;
    }
  })();

  return dbConnectPromise;
}

getDb().catch(() => {});

async function resolveSmtpConfig(bodyConfig) {
  let stored = null;
  try {
    const db = await getDb();
    if (db) {
      const doc = await db.collection(KV_COLLECTION).findOne({ _id: SMTP_KV_KEY });
      if (doc && typeof doc.value === 'string') {
        stored = JSON.parse(doc.value);
      }
    }
  } catch {
    /* ignore */
  }

  return {
    senderName: process.env.SMTP_SENDER_NAME || 'OzoStack CRM',
    senderEmail: process.env.SMTP_FROM || process.env.SMTP_USER || 'ozostack@gmail.com',
    replyToEmail: process.env.SMTP_FROM || process.env.SMTP_USER || 'ozostack@gmail.com',
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    imapHost: process.env.IMAP_HOST || '',
    imapPort: Number(process.env.IMAP_PORT) || 993,
    encryption: 'TLS',
    username: process.env.SMTP_USER || 'ozostack@gmail.com',
    password: process.env.SMTP_PASS || '',
    ...(stored || {}),
    ...(bodyConfig || {}),
  };
}

function isPlaceholderPassword(pw) {
  const s = String(pw || '').trim();
  return !s || s === 'ozo-smtp-connected-v1' || s.startsWith('••••');
}

function buildNodemailerTransport(cfg) {
  const host = (cfg.host || 'smtp.gmail.com').trim();
  const port = Number(cfg.port) || 587;
  const isSecure = port === 465 || cfg.encryption === 'SSL';
  const rawPassword = String(cfg.password || '').trim();
  const cleanPass = host.includes('gmail.com') ? rawPassword.replace(/\s+/g, '') : rawPassword;
  const authUser = (cfg.username || cfg.senderEmail || 'ozostack@gmail.com').trim();

  return {
    host,
    port,
    isSecure,
    authUser,
    cleanPass,
    transporter: nodemailer.createTransport({
      host,
      port,
      secure: isSecure,
      auth: {
        user: authUser,
        pass: cleanPass,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      tls: {
        rejectUnauthorized: false,
      },
    }),
  };
}

function inferImapHost(cfg) {
  if (cfg.imapHost && String(cfg.imapHost).trim()) {
    return String(cfg.imapHost).trim();
  }
  const smtpHost = String(cfg.host || '').toLowerCase();
  const email = String(cfg.senderEmail || '').toLowerCase();
  if (smtpHost.includes('hostinger')) return 'imap.hostinger.com';
  if (smtpHost.includes('titan')) return 'imap.titan.email';
  if (smtpHost.includes('zoho.in')) return 'imap.zoho.in';
  if (smtpHost.includes('zoho')) return 'imap.zoho.com';
  if (smtpHost.includes('office365') || smtpHost.includes('outlook')) return 'outlook.office365.com';
  if (smtpHost.includes('gmail') || email.endsWith('@gmail.com')) return 'imap.gmail.com';
  if (smtpHost.startsWith('smtp.')) return smtpHost.replace(/^smtp\./, 'imap.');
  return 'imap.hostinger.com';
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
};

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(body);
}

function readJsonBody(req, maxBytes = 25 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    req.on('data', (chunk) => {
      total += chunk.length;
      if (total > maxBytes) {
        reject(new Error('Payload too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      });
      res.end();
      return;
    }

    const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const pathname = decodeURIComponent(parsedUrl.pathname);

    // Health check endpoint
    if (pathname === '/api/health' && req.method === 'GET') {
      const db = await getDb();
      sendJson(res, 200, {
        ok: true,
        dbConnected: Boolean(db),
        service: 'ozostack-crm-ai-studio',
      });
      return;
    }

    // Verify real SMTP credentials
    if (pathname === '/api/verify-smtp' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const cfg = await resolveSmtpConfig(body.smtpConfig);

      if (isPlaceholderPassword(cfg.password)) {
        sendJson(res, 200, {
          ok: false,
          verified: false,
          code: 'NO_PASSWORD',
          error:
            'Please enter your real email password (for @ozostack.in Domain Mail) or 16-digit Google App Password (for @gmail.com) to authenticate live SMTP.',
        });
        return;
      }

      const { transporter, host, port, authUser } = buildNodemailerTransport(cfg);
      try {
        await transporter.verify();
        sendJson(res, 200, {
          ok: true,
          verified: true,
          host,
          port,
          authUser,
          message: `Live SMTP Verified! Connected to ${host}:${port} as ${authUser}.`,
        });
      } catch (err) {
        const msg = err?.message || 'SMTP verification failed.';
        const isGmail = host.includes('gmail.com');
        sendJson(res, 200, {
          ok: false,
          verified: false,
          code: 'AUTH_FAILED',
          error: isGmail
            ? `Gmail SMTP rejected the password (${msg}). Note: Gmail requires a 16-digit Google App Password from myaccount.google.com/apppasswords, OR use your @ozostack.in Domain Mail (Hostinger/Titan) with your normal email password.`
            : `SMTP authentication failed on ${host}:${port} — ${msg}`,
        });
      }
      return;
    }

    // Direct SMTP Email Dispatch Endpoint
    if (pathname === '/api/send-email' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const to = (body.to || '').trim();
      const cc = (body.cc || '').trim();
      const bcc = (body.bcc || '').trim();
      const subject = (body.subject || 'Message from OzoStack CRM').trim();
      const text = body.text || '';
      const html = body.html || '';

      if (!to) {
        sendJson(res, 400, { ok: false, error: 'Recipient email address (to) is required.' });
        return;
      }

      const cfg = await resolveSmtpConfig(body.smtpConfig);
      const { transporter, host, port, authUser, cleanPass } = buildNodemailerTransport(cfg);
      const fromName = (cfg.senderName || 'OzoStack CRM').replace(/"/g, '');
      const fromEmail = (cfg.senderEmail || authUser || 'ozostack@gmail.com').trim();
      const renderedHtml =
        html ||
        `<div style="font-family:Inter,Arial,sans-serif;font-size:14px;line-height:1.6;color:#0f172a;white-space:pre-wrap;">${escapeHtml(
          text
        )}</div>`;

      if (isPlaceholderPassword(cleanPass)) {
        sendJson(res, 200, {
          ok: false,
          sentViaSmtp: false,
          realExternalDelivery: false,
          code: 'NO_PASSWORD',
          senderEmail: fromEmail,
          error:
            'Real SMTP password is not entered yet. Enter your @ozostack.in Domain Mail password or 16-digit Gmail App Password in Mail Settings for direct inbox delivery.',
        });
        return;
      }

      try {
        const mailOptions = {
          from: `"${fromName}" <${fromEmail}>`,
          to,
          replyTo: body.replyTo || cfg.replyToEmail || fromEmail,
          subject,
          text,
          html: renderedHtml,
        };
        if (cc) mailOptions.cc = cc;
        if (bcc) mailOptions.bcc = bcc;

        const info = await transporter.sendMail(mailOptions);

        sendJson(res, 200, {
          ok: true,
          sentViaSmtp: true,
          realExternalDelivery: true,
          messageId: info.messageId,
          senderEmail: fromEmail,
          mode: 'smtp-direct',
        });
      } catch (smtpErr) {
        const msg = smtpErr?.message || 'SMTP transmission failed.';
        const isGmail = host.includes('gmail.com');
        sendJson(res, 200, {
          ok: false,
          sentViaSmtp: false,
          realExternalDelivery: false,
          code: 'AUTH_FAILED',
          senderEmail: fromEmail,
          error: isGmail
            ? `Gmail rejected the password (535 BadCredentials). For @gmail.com you must paste a 16-character Google App Password (myaccount.google.com/apppasswords), OR switch to your @ozostack.in Domain Mail (Hostinger/Titan) which works with your normal email password.`
            : `SMTP Error (${host}:${port}): ${msg}`,
        });
      }
      return;
    }

    // Real IMAP Inbox Sync Endpoint (fetches actual incoming emails from Domain Mail / Gmail)
    if (pathname === '/api/sync-inbox' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const cfg = await resolveSmtpConfig(body.smtpConfig);
      const rawPassword = String(cfg.password || '').trim();

      if (isPlaceholderPassword(rawPassword)) {
        sendJson(res, 200, {
          ok: false,
          synced: false,
          code: 'NO_PASSWORD',
          error:
            'Enter your Domain Mail (@ozostack.in) password or 16-digit Gmail App Password in Mail Settings to sync live incoming emails via IMAP.',
        });
        return;
      }

      const imapHost = inferImapHost(cfg);
      const imapPort = Number(cfg.imapPort) || 993;
      const authUser = (cfg.username || cfg.senderEmail || '').trim();
      const cleanPass = imapHost.includes('gmail.com')
        ? rawPassword.replace(/\s+/g, '')
        : rawPassword;

      const client = new ImapFlow({
        host: imapHost,
        port: imapPort,
        secure: imapPort === 993,
        auth: {
          user: authUser,
          pass: cleanPass,
        },
        logger: false,
        tls: {
          rejectUnauthorized: false,
        },
      });

      try {
        await client.connect();
        const lock = await client.getMailboxLock('INBOX');
        const messages = [];
        try {
          const total = client.mailbox.exists || 0;
          if (total > 0) {
            const startSeq = Math.max(1, total - 19);
            for await (const msg of client.fetch(`${startSeq}:*`, {
              uid: true,
              flags: true,
              envelope: true,
              source: true,
            })) {
              try {
                const parsed = await simpleParser(msg.source);
                const fromAddr =
                  parsed.from?.value?.[0]?.address ||
                  msg.envelope?.from?.[0]?.address ||
                  'unknown@sender.com';
                const fromName =
                  parsed.from?.value?.[0]?.name ||
                  msg.envelope?.from?.[0]?.name ||
                  fromAddr.split('@')[0];
                const toAddr =
                  parsed.to?.value?.[0]?.address ||
                  msg.envelope?.to?.[0]?.address ||
                  authUser;
                const isSeen = msg.flags && msg.flags.has('\\Seen');

                messages.push({
                  id: `imap-${imapHost}-${msg.uid}`,
                  messageId: parsed.messageId || `uid-${msg.uid}`,
                  folder: 'inbox',
                  fromName,
                  fromEmail: fromAddr,
                  toEmail: toAddr,
                  subject: parsed.subject || '(No Subject)',
                  body: parsed.text || parsed.html?.replace(/<[^>]+>/g, ' ') || '',
                  html: parsed.html || '',
                  read: Boolean(isSeen),
                  starred: Boolean(msg.flags && msg.flags.has('\\Flagged')),
                  deliveryStatus: 'Received via IMAP',
                  timestamp: (parsed.date || msg.envelope?.date || new Date()).toISOString(),
                });
              } catch {
                /* skip malformed message */
              }
            }
          }
        } finally {
          lock.release();
        }
        await client.logout().catch(() => {});

        messages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        sendJson(res, 200, {
          ok: true,
          synced: true,
          imapHost,
          count: messages.length,
          messages,
        });
      } catch (imapErr) {
        await client.close().catch(() => {});
        sendJson(res, 200, {
          ok: false,
          synced: false,
          imapHost,
          error: `IMAP Sync failed on ${imapHost}:${imapPort} — ${imapErr?.message || 'Unable to connect'}`,
        });
      }
      return;
    }

    // Fetch all synced CRM key-value pairs from MongoDB
    if (pathname === '/api/crm-state' && req.method === 'GET') {
      const db = await getDb();
      if (!db) {
        sendJson(res, 200, { ok: true, dbConnected: false, items: {} });
        return;
      }
      const docs = await db.collection(KV_COLLECTION).find({}).toArray();
      const items = {};
      for (const doc of docs) {
        if (doc && typeof doc._id === 'string' && typeof doc.value === 'string') {
          items[doc._id] = doc.value;
        }
      }
      sendJson(res, 200, { ok: true, dbConnected: true, items });
      return;
    }

    // Upsert / delete synced CRM key-value pairs in MongoDB
    if (pathname === '/api/crm-state' && req.method === 'POST') {
      const db = await getDb();
      if (!db) {
        sendJson(res, 200, { ok: true, dbConnected: false, count: 0 });
        return;
      }
      const body = await readJsonBody(req);
      const col = db.collection(KV_COLLECTION);

      if (body.clearAll === true) {
        await col.deleteMany({});
      }

      const ops = [];
      const now = new Date().toISOString();

      if (body.updates && typeof body.updates === 'object') {
        for (const [key, value] of Object.entries(body.updates)) {
          if (typeof key === 'string' && typeof value === 'string') {
            ops.push({
              updateOne: {
                filter: { _id: key },
                update: { $set: { value, updatedAt: now } },
                upsert: true,
              },
            });
          }
        }
      }

      if (Array.isArray(body.deletes)) {
        for (const key of body.deletes) {
          if (typeof key === 'string') {
            ops.push({
              deleteOne: { filter: { _id: key } },
            });
          }
        }
      }

      if (ops.length > 0) {
        await col.bulkWrite(ops, { ordered: false });
      }

      sendJson(res, 200, { ok: true, dbConnected: true, count: ops.length });
      return;
    }

    // Serve static files from dist/
    let safePath = path.normalize(pathname).replace(/^(\.\.(\/|\\|$))+/, '');
    if (safePath === '/' || safePath === '\\') {
      safePath = '/index.html';
    }

    let filePath = path.join(DIST_DIR, safePath);
    let stat = null;
    try {
      stat = fs.statSync(filePath);
    } catch {
      stat = null;
    }

    if (!stat || !stat.isFile()) {
      filePath = path.join(DIST_DIR, 'index.html');
      try {
        stat = fs.statSync(filePath);
      } catch {
        sendJson(res, 404, { error: 'Build output not found. Run npm run build first.' });
        return;
      }
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const isImmutableAsset = pathname.startsWith('/assets/') && ext !== '.html';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': isImmutableAsset
        ? 'public, max-age=31536000, immutable'
        : 'no-cache, no-store, must-revalidate',
      'X-Frame-Options': 'ALLOWALL',
      'Content-Security-Policy': 'frame-ancestors *;',
    });

    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    console.error('[Server Error]', err);
    if (!res.headersSent) {
      sendJson(res, 500, { ok: false, error: 'Internal Server Error' });
    }
  }
});

server.listen(PORT, HOSTNAME, () => {
  console.log(`OzoStack CRM Server listening on http://${HOSTNAME}:${PORT}`);
});
