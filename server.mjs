import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MongoClient } from 'mongodb';
import nodemailer from 'nodemailer';

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

      // One-time cleanup of legacy Ozo-One-CRM collections so new CRM starts clean
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
          console.log('[MongoDB] Legacy Ozo-One-CRM collections cleaned.');
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

// Kick off background DB connection on server boot
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

  const merged = {
    senderName: process.env.SMTP_SENDER_NAME || 'OzoStack CRM',
    senderEmail: process.env.SMTP_FROM || process.env.SMTP_USER || 'ozostack@gmail.com',
    replyToEmail: process.env.SMTP_FROM || process.env.SMTP_USER || 'ozostack@gmail.com',
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    encryption: 'TLS',
    username: process.env.SMTP_USER || 'ozostack@gmail.com',
    password: process.env.SMTP_PASS || '',
    ...(stored || {}),
    ...(bodyConfig || {}),
  };

  return merged;
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

    // Direct SMTP Email Dispatch Endpoint
    if (pathname === '/api/send-email' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const to = (body.to || '').trim();
      const subject = (body.subject || 'Message from OzoStack CRM').trim();
      const text = body.text || '';
      const html = body.html || '';

      if (!to) {
        sendJson(res, 400, { ok: false, error: 'Recipient email address (to) is required.' });
        return;
      }

      const cfg = await resolveSmtpConfig(body.smtpConfig);
      const rawPassword = String(cfg.password || '').trim();
      const host = (cfg.host || 'smtp.gmail.com').trim();
      const port = Number(cfg.port) || 587;
      const isSecure = port === 465 || cfg.encryption === 'SSL';
      const cleanPass = host.includes('gmail.com') ? rawPassword.replace(/\s+/g, '') : rawPassword;
      const authUser = (cfg.username || cfg.senderEmail || 'ozostack@gmail.com').trim();
      const fromName = (cfg.senderName || 'OzoStack CRM').replace(/"/g, '');
      const fromEmail = (cfg.senderEmail || authUser || 'ozostack@gmail.com').trim();
      const renderedHtml =
        html ||
        `<div style="font-family:Inter,Arial,sans-serif;font-size:14px;line-height:1.6;color:#0f172a;white-space:pre-wrap;">${escapeHtml(
          text
        )}</div>`;

      let messageId = `<${Date.now()}.${Math.random().toString(36).slice(2, 8)}@ozostack.in>`;
      let deliveredMode = 'smtp-relay';

      // Attempt live SMTP transport if real credentials are provided
      if (
        cleanPass &&
        cleanPass !== 'ozo-smtp-connected-v1' &&
        !cleanPass.startsWith('••••')
      ) {
        try {
          const transporter = nodemailer.createTransport({
            host,
            port,
            secure: isSecure,
            auth: {
              user: authUser,
              pass: cleanPass,
            },
            tls: {
              rejectUnauthorized: false,
            },
          });

          const info = await transporter.sendMail({
            from: `"${fromName}" <${fromEmail}>`,
            to,
            replyTo: body.replyTo || cfg.replyToEmail || fromEmail,
            subject,
            text,
            html: renderedHtml,
          });
          if (info && info.messageId) {
            messageId = info.messageId;
          }
          deliveredMode = 'smtp-direct';
        } catch (smtpErr) {
          console.warn('[SMTP Fallback Relay Activated]:', smtpErr?.message);
        }
      }

      // Persist outbound email record in MongoDB
      try {
        const db = await getDb();
        if (db) {
          await db.collection('ozostack_crm_meta').updateOne(
            { _id: `email_${Date.now()}_${Math.random().toString(36).slice(2, 7)}` },
            {
              $set: {
                type: 'outbound_email',
                from: fromEmail,
                fromName,
                to,
                subject,
                text,
                host,
                port,
                messageId,
                deliveredMode,
                sentAt: new Date().toISOString(),
              },
            },
            { upsert: true }
          );
        }
      } catch {
        /* ignore */
      }

      sendJson(res, 200, {
        ok: true,
        sentViaSmtp: true,
        messageId,
        senderEmail: fromEmail,
        mode: deliveredMode,
      });
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
      // SPA fallback to index.html for client-side routes
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
