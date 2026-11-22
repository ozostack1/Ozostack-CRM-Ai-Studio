import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MongoClient } from 'mongodb';
import nodemailer from 'nodemailer';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import pino from 'pino';

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

async function resolveSmtpConfig(bodyConfig, userId) {
  let stored = null;
  try {
    if (userId) {
      const db = await getDb();
      if (db) {
        const doc = await db
          .collection(KV_COLLECTION)
          .findOne({ _id: `ozostack_smtp_user_v2_${userId}` });
        if (doc && typeof doc.value === 'string') {
          stored = JSON.parse(doc.value);
        }
      }
    }
  } catch {
    /* ignore */
  }

  return {
    senderName: 'OzoStack User',
    senderEmail: '',
    replyToEmail: '',
    host: 'smtp.hostinger.com',
    port: 465,
    imapHost: 'imap.hostinger.com',
    imapPort: 993,
    encryption: 'SSL',
    username: '',
    password: '',
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

// ============================================================================
// Per-User Isolated WhatsApp Session Manager (Baileys Multi-Device QR + Meta API)
// ============================================================================
const waSessions = new Map();

function sanitizeWaUserId(userId) {
  const clean = String(userId || '').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  return clean || 'anonymous';
}

function getOrCreateWaSessionEntry(userId) {
  const safeId = sanitizeWaUserId(userId);
  if (!waSessions.has(safeId)) {
    const authDir = path.join(os.tmpdir(), `ozostack_wa_auth_${safeId}`);
    const session = {
      userId: safeId,
      authDir,
      storeFile: path.join(authDir, 'ozostack_wa_sync_cache.json'),
      sock: null,
      status: 'disconnected',
      qrDataUrl: '',
      phoneNumber: '',
      pushName: '',
      lastError: '',
      incomingMessages: [],
      messagesMap: new Map(), // msgId -> message payload
      contactsMap: new Map(), // digits -> { id, phone, jid, name, notify }
      chatsMap: new Map(), // digits -> { id, phone, jid, name, unreadCount, lastTimestamp }
      lidToPhone: new Map(), // lidUser -> digits
      rawMessagesForRetry: new Map(), // msgId -> proto.IMessage
      waiters: [],
      starting: false,
      saveTimer: null,
    };
    loadWaSessionCacheFromDisk(session);
    loadWaSessionCacheFromDb(session).catch(() => {});
    waSessions.set(safeId, session);
  }
  return waSessions.get(safeId);
}

function loadWaSessionCacheFromDisk(session) {
  try {
    if (fs.existsSync(session.storeFile)) {
      const raw = JSON.parse(fs.readFileSync(session.storeFile, 'utf8'));
      applySerializedWaStore(session, raw);
    }
  } catch {
    /* ignore */
  }
}

async function loadWaSessionCacheFromDb(session) {
  try {
    const db = await getDb();
    if (!db) return;
    const doc = await db
      .collection(KV_COLLECTION)
      .findOne({ _id: `server_wa_store_v1_${session.userId}` });
    if (doc && typeof doc.value === 'string') {
      const raw = JSON.parse(doc.value);
      applySerializedWaStore(session, raw);
    }
  } catch {
    /* ignore */
  }
}

function applySerializedWaStore(session, raw) {
  if (!raw || typeof raw !== 'object') return;
  if (Array.isArray(raw.lidPairs)) {
    for (const [k, v] of raw.lidPairs) {
      if (k && v) session.lidToPhone.set(k, v);
    }
  }
  if (Array.isArray(raw.contacts)) {
    for (const c of raw.contacts) {
      if (c && c.id) {
        session.contactsMap.set(String(c.id), c);
      }
    }
  }
  if (Array.isArray(raw.chats)) {
    for (const ch of raw.chats) {
      if (!ch || !ch.id) continue;
      const chatId = String(ch.id);
      const isGroup = Boolean(ch.isGroup || chatId.endsWith('@g.us'));
      const contactLookup = !isGroup ? session.contactsMap.get(chatId) : null;
      const resolvedName =
        (ch.name && !String(ch.name).startsWith('+') ? ch.name : '') ||
        (contactLookup?.name && !String(contactLookup.name).startsWith('+')
          ? contactLookup.name
          : '') ||
        contactLookup?.notify ||
        ch.name ||
        ch.phone ||
        chatId;
      session.chatsMap.set(chatId, {
        ...ch,
        id: chatId,
        isGroup,
        name: resolvedName,
      });
    }
  }
  if (Array.isArray(raw.messages)) {
    for (const m of raw.messages) {
      if (!m || !m.id) continue;
      const rawTarget = m.chatId || m.contactPhone || m.phone || '';
      const isGroup = Boolean(m.isGroup || String(rawTarget).endsWith('@g.us'));
      const chatKey = isGroup
        ? `${String(rawTarget).split('@')[0]}@g.us`
        : normalizeWaDigits(rawTarget);
      if (!chatKey) continue;

      const contactLookup = !isGroup ? session.contactsMap.get(chatKey) : null;
      const existingChat = session.chatsMap.get(chatKey);
      const bestName =
        (m.contactName && !String(m.contactName).startsWith('+') ? m.contactName : '') ||
        (m.pushName && !String(m.pushName).startsWith('+') ? m.pushName : '') ||
        (existingChat?.name && !String(existingChat.name).startsWith('+') ? existingChat.name : '') ||
        (contactLookup?.name && !String(contactLookup.name).startsWith('+')
          ? contactLookup.name
          : '') ||
        contactLookup?.notify ||
        (isGroup ? 'WhatsApp Group' : `+${chatKey}`);

      const enrichedMsg = {
        ...m,
        chatId: chatKey,
        isGroup,
        contactName: bestName,
        pushName: bestName,
      };
      session.messagesMap.set(m.id, enrichedMsg);

      if (!session.chatsMap.has(chatKey)) {
        session.chatsMap.set(chatKey, {
          id: chatKey,
          isGroup,
          phone: isGroup ? 'WhatsApp Group' : `+${chatKey}`,
          jid: isGroup ? chatKey : `${chatKey}@s.whatsapp.net`,
          name: bestName,
          unreadCount: 0,
          lastTimestamp: m.timestamp || new Date().toISOString(),
        });
      }
    }
  }
}

async function restoreWaAuthFromDb(session) {
  try {
    const credsPath = path.join(session.authDir, 'creds.json');
    if (fs.existsSync(credsPath)) return true;
    const db = await getDb();
    if (!db) return false;
    const doc = await db
      .collection(KV_COLLECTION)
      .findOne({ _id: `server_wa_auth_v1_${session.userId}` });
    if (!doc || typeof doc.value !== 'string') return false;
    const filesMap = JSON.parse(doc.value);
    if (!filesMap || typeof filesMap !== 'object' || !filesMap['creds.json']) return false;
    fs.mkdirSync(session.authDir, { recursive: true });
    for (const [fileName, content] of Object.entries(filesMap)) {
      if (typeof fileName === 'string' && typeof content === 'string') {
        fs.writeFileSync(path.join(session.authDir, fileName), content, 'utf8');
      }
    }
    return true;
  } catch {
    return false;
  }
}

function scheduleSaveWaAuthToDb(session) {
  if (session.authSaveTimer) return;
  session.authSaveTimer = setTimeout(async () => {
    session.authSaveTimer = null;
    try {
      if (!fs.existsSync(session.authDir)) return;
      const files = fs.readdirSync(session.authDir);
      const filesMap = {};
      for (const f of files) {
        if (f.endsWith('.json') && f !== 'ozostack_wa_sync_cache.json') {
          filesMap[f] = fs.readFileSync(path.join(session.authDir, f), 'utf8');
        }
      }
      if (!filesMap['creds.json']) return;
      const db = await getDb();
      if (db) {
        await db.collection(KV_COLLECTION).updateOne(
          { _id: `server_wa_auth_v1_${session.userId}` },
          { $set: { value: JSON.stringify(filesMap), updatedAt: new Date().toISOString() } },
          { upsert: true }
        );
      }
    } catch {
      /* ignore */
    }
  }, 2000);
}

function scheduleSaveWaSessionCache(session) {
  if (session.saveTimer) return;
  session.saveTimer = setTimeout(async () => {
    session.saveTimer = null;
    try {
      const messagesArr = Array.from(session.messagesMap.values()).slice(-1500);
      const payload = {
        contacts: Array.from(session.contactsMap.values()).slice(0, 3000),
        chats: Array.from(session.chatsMap.values()).slice(0, 1000),
        messages: messagesArr,
        lidPairs: Array.from(session.lidToPhone.entries()).slice(0, 3000),
        updatedAt: new Date().toISOString(),
      };
      const serialized = JSON.stringify(payload);
      fs.mkdirSync(session.authDir, { recursive: true });
      fs.writeFileSync(session.storeFile, serialized, 'utf8');
      const db = await getDb();
      if (db) {
        await db.collection(KV_COLLECTION).updateOne(
          { _id: `server_wa_store_v1_${session.userId}` },
          { $set: { value: serialized, updatedAt: payload.updatedAt } },
          { upsert: true }
        );
      }
    } catch {
      /* ignore */
    }
  }, 1500);
}

function resolveWaWaiters(session) {
  const list = session.waiters.splice(0, session.waiters.length);
  for (const fn of list) {
    try {
      fn();
    } catch {
      /* ignore */
    }
  }
}

function normalizeWaDigits(raw) {
  const s = String(raw || '').trim();
  if (s.endsWith('@g.us')) return s;
  const d = s.split(':')[0].split('@')[0].replace(/[^0-9]/g, '');
  if (d.length === 10) return `91${d}`;
  return d;
}

function isValidDirectPhoneDigits(digits) {
  const d = String(digits || '').replace(/[^0-9]/g, '');
  return d.length >= 10 && d.length <= 13;
}

function registerWaLidMapping(session, jidA, jidB) {
  if (!jidA || !jidB) return;
  const a = String(jidA);
  const b = String(jidB);
  let lidKey = '';
  let phoneDigits = '';
  if (a.endsWith('@lid') && b.includes('@s.whatsapp.net')) {
    lidKey = a.split(':')[0].split('@')[0].replace(/[^0-9]/g, '');
    phoneDigits = normalizeWaDigits(b);
  } else if (b.endsWith('@lid') && a.includes('@s.whatsapp.net')) {
    lidKey = b.split(':')[0].split('@')[0].replace(/[^0-9]/g, '');
    phoneDigits = normalizeWaDigits(a);
  }
  if (!lidKey || !isValidDirectPhoneDigits(phoneDigits)) return;

  session.lidToPhone.set(lidKey, phoneDigits);

  // Retroactively merge any contact, chat, or message stored under lidKey into phoneDigits
  if (session.contactsMap.has(lidKey)) {
    const lidContact = session.contactsMap.get(lidKey);
    const pnContact = session.contactsMap.get(phoneDigits);
    const bestName =
      (pnContact?.name && !String(pnContact.name).startsWith('+') ? pnContact.name : '') ||
      (lidContact?.name && !String(lidContact.name).startsWith('+') ? lidContact.name : '') ||
      pnContact?.notify ||
      lidContact?.notify ||
      `+${phoneDigits}`;
    session.contactsMap.set(phoneDigits, {
      id: phoneDigits,
      phone: `+${phoneDigits}`,
      jid: `${phoneDigits}@s.whatsapp.net`,
      name: bestName,
      notify: pnContact?.notify || lidContact?.notify || '',
    });
    session.contactsMap.delete(lidKey);
  }

  if (session.chatsMap.has(lidKey)) {
    const lidChat = session.chatsMap.get(lidKey);
    const pnChat = session.chatsMap.get(phoneDigits);
    const contactInfo = session.contactsMap.get(phoneDigits);
    const bestName =
      (pnChat?.name && !String(pnChat.name).startsWith('+') ? pnChat.name : '') ||
      (lidChat?.name && !String(lidChat.name).startsWith('+') ? lidChat.name : '') ||
      (contactInfo?.name && !String(contactInfo.name).startsWith('+') ? contactInfo.name : '') ||
      `+${phoneDigits}`;
    session.chatsMap.set(phoneDigits, {
      ...(lidChat || {}),
      ...(pnChat || {}),
      id: phoneDigits,
      isGroup: false,
      phone: `+${phoneDigits}`,
      jid: `${phoneDigits}@s.whatsapp.net`,
      name: bestName,
      unreadCount: (pnChat?.unreadCount || 0) + (lidChat?.unreadCount || 0),
    });
    session.chatsMap.delete(lidKey);
  }

  for (const [, msg] of session.messagesMap.entries()) {
    if (msg && msg.chatId === lidKey) {
      msg.chatId = phoneDigits;
      msg.phone = `+${phoneDigits}`;
      msg.contactPhone = `+${phoneDigits}`;
      const c = session.contactsMap.get(phoneDigits);
      if (c?.name && !String(c.name).startsWith('+') && String(msg.contactName || '').startsWith('+')) {
        msg.contactName = c.name;
        msg.pushName = c.name;
      }
    }
  }
}

function registerAllJidMappingsFromObject(session, obj) {
  if (!obj || typeof obj !== 'object') return;
  const candidates = [
    obj.id,
    obj.jid,
    obj.lid,
    obj.lidJid,
    obj.pnJid,
    obj.phoneNumber,
    obj.newJid,
    obj.oldJid,
    obj.senderPn,
    obj.participantPn,
    obj.remoteJid,
    obj.remoteJidAlt,
  ]
    .filter(Boolean)
    .map(String);

  const lidJids = candidates.filter((c) => c.endsWith('@lid'));
  const pnJids = candidates.filter((c) => c.includes('@s.whatsapp.net'));
  for (const lid of lidJids) {
    for (const pn of pnJids) {
      registerWaLidMapping(session, lid, pn);
    }
  }
}

function resolveWaJidToIdentity(session, rawJid, altJid) {
  if (rawJid && altJid) {
    registerWaLidMapping(session, rawJid, altJid);
  }
  const jid = String(rawJid || altJid || '').trim();
  if (
    !jid ||
    jid === 'status@broadcast' ||
    jid.endsWith('@broadcast') ||
    jid.endsWith('@newsletter')
  ) {
    return null;
  }

  // WhatsApp Group JID
  if (jid.endsWith('@g.us')) {
    const cleanGroupJid = `${jid.split('@')[0]}@g.us`;
    return {
      isGroup: true,
      digits: cleanGroupJid,
      phone: 'WhatsApp Group',
      jid: cleanGroupJid,
    };
  }

  const userPart = jid.split(':')[0].split('@')[0].replace(/[^0-9]/g, '');
  if (!userPart) return null;

  // Linked Identity (@lid): map to phone number if known, otherwise preserve @lid chat so 1-on-1 chats are never dropped
  if (jid.endsWith('@lid')) {
    const mappedPhone =
      session.lidToPhone.get(userPart) ||
      (altJid && String(altJid).includes('@s.whatsapp.net') ? normalizeWaDigits(altJid) : '');
    if (mappedPhone && isValidDirectPhoneDigits(mappedPhone)) {
      return {
        isGroup: false,
        digits: mappedPhone,
        phone: `+${mappedPhone}`,
        jid: `${mappedPhone}@s.whatsapp.net`,
      };
    }
    return {
      isGroup: false,
      isLid: true,
      digits: userPart,
      phone: `+${userPart}`,
      jid: `${userPart}@lid`,
    };
  }

  const digits = normalizeWaDigits(userPart);
  if (!digits || digits.length < 7) return null;

  return {
    isGroup: false,
    digits,
    phone: `+${digits}`,
    jid: `${digits}@s.whatsapp.net`,
  };
}

function upsertWaServerContact(session, rawContact) {
  if (!rawContact) return;
  registerAllJidMappingsFromObject(session, rawContact);
  const primaryJid =
    rawContact.phoneNumber || rawContact.pnJid || rawContact.id || rawContact.jid || rawContact.lid;
  const secondaryJid =
    rawContact.id !== primaryJid ? rawContact.id : rawContact.lid || rawContact.phoneNumber;
  const identity = resolveWaJidToIdentity(session, primaryJid, secondaryJid);
  if (!identity || identity.isGroup) return;

  // Skip user's own number
  const myDigits = normalizeWaDigits(session.phoneNumber);
  if (myDigits && identity.digits === myDigits) return;

  const existing = session.contactsMap.get(identity.digits);
  const candidateName =
    rawContact.name ||
    rawContact.verifiedName ||
    rawContact.notify ||
    rawContact.pushName ||
    existing?.name ||
    '';
  const cleanName =
    candidateName && !String(candidateName).startsWith('+') ? String(candidateName).trim() : '';

  if (!cleanName && !existing) return;

  const resolvedName = cleanName || existing?.name || identity.phone;
  session.contactsMap.set(identity.digits, {
    id: identity.digits,
    phone: identity.phone,
    jid: identity.jid,
    name: resolvedName,
    notify: rawContact.notify || rawContact.pushName || existing?.notify || '',
  });

  // Also enrich existing chat name if chat currently has a raw +number name
  if (cleanName && session.chatsMap.has(identity.digits)) {
    const ch = session.chatsMap.get(identity.digits);
    if (ch && (!ch.name || String(ch.name).startsWith('+'))) {
      ch.name = cleanName;
    }
  }
}

function upsertWaServerChat(session, rawChat) {
  if (!rawChat) return;
  registerAllJidMappingsFromObject(session, rawChat);
  const identity = resolveWaJidToIdentity(
    session,
    rawChat.pnJid || rawChat.phoneNumber || rawChat.id || rawChat.jid,
    rawChat.id || rawChat.lidJid
  );
  if (!identity) return;

  if (!identity.isGroup) {
    const myDigits = normalizeWaDigits(session.phoneNumber);
    if (myDigits && identity.digits === myDigits) return;
  }

  const existingChat = session.chatsMap.get(identity.digits);
  const existingContact = !identity.isGroup ? session.contactsMap.get(identity.digits) : null;
  const rawName =
    rawChat.subject ||
    rawChat.name ||
    rawChat.displayName ||
    (existingChat?.name && !existingChat.name.startsWith('+') && existingChat.name !== 'WhatsApp Group'
      ? existingChat.name
      : '') ||
    (existingContact?.name && !existingContact.name.startsWith('+') ? existingContact.name : '') ||
    (identity.isGroup ? 'WhatsApp Group' : identity.phone);

  if (!identity.isGroup && rawName && !String(rawName).startsWith('+')) {
    upsertWaServerContact(session, {
      id: identity.jid,
      name: rawName,
    });
  }

  const tsNum = Number(
    rawChat.conversationTimestamp?.low ||
      rawChat.conversationTimestamp ||
      rawChat.lastMessageRecvTimestamp ||
      0
  );
  const tsIso =
    tsNum > 0
      ? new Date(tsNum > 1e12 ? tsNum : tsNum * 1000).toISOString()
      : existingChat?.lastTimestamp || new Date().toISOString();

  const participantCount = Array.isArray(rawChat.participants)
    ? rawChat.participants.length
    : rawChat.size || existingChat?.participantCount || undefined;

  session.chatsMap.set(identity.digits, {
    id: identity.digits,
    isGroup: Boolean(identity.isGroup),
    phone: identity.isGroup
      ? participantCount
        ? `WhatsApp Group · ${participantCount} members`
        : 'WhatsApp Group'
      : identity.phone,
    jid: identity.jid,
    name: String(rawName).trim() || (identity.isGroup ? 'WhatsApp Group' : identity.phone),
    participantCount,
    unreadCount:
      typeof rawChat.unreadCount === 'number' && rawChat.unreadCount >= 0
        ? rawChat.unreadCount
        : existingChat?.unreadCount || 0,
    lastTimestamp: tsIso,
  });

  if (Array.isArray(rawChat.messages)) {
    for (const item of rawChat.messages) {
      const m = item?.message || item;
      if (m && m.key) {
        ingestWaMessage(session, m, true);
      }
    }
  }
}

function unwrapWaMessageObject(msgObj) {
  let m = msgObj;
  for (let i = 0; i < 6 && m; i++) {
    if (m.ephemeralMessage?.message) {
      m = m.ephemeralMessage.message;
    } else if (m.viewOnceMessage?.message) {
      m = m.viewOnceMessage.message;
    } else if (m.viewOnceMessageV2?.message) {
      m = m.viewOnceMessageV2.message;
    } else if (m.viewOnceMessageV2Extension?.message) {
      m = m.viewOnceMessageV2Extension.message;
    } else if (m.documentWithCaptionMessage?.message) {
      m = m.documentWithCaptionMessage.message;
    } else if (m.editedMessage?.message?.protocolMessage?.editedMessage) {
      m = m.editedMessage.message.protocolMessage.editedMessage;
    } else if (m.editedMessage?.message) {
      m = m.editedMessage.message;
    } else {
      break;
    }
  }
  return m;
}

function extractWaMessageText(rawMessage) {
  const m = unwrapWaMessageObject(rawMessage);
  if (!m) return '';
  if (m.protocolMessage || m.senderKeyDistributionMessage || m.fastRatchetKeySenderKeyDistributionMessage) {
    return '';
  }

  const directText =
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    m.documentMessage?.caption ||
    m.buttonsResponseMessage?.selectedDisplayText ||
    m.listResponseMessage?.title ||
    m.templateButtonReplyMessage?.selectedDisplayText ||
    m.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson ||
    '';

  if (directText && String(directText).trim()) {
    return String(directText).trim();
  }

  if (m.imageMessage) return '📷 [Photo]';
  if (m.videoMessage) return '🎥 [Video]';
  if (m.audioMessage) return m.audioMessage.ptt ? '🎤 [Voice Message]' : '🎵 [Audio]';
  if (m.documentMessage) return `📄 [Document: ${m.documentMessage.fileName || 'File'}]`;
  if (m.stickerMessage) return '🏷️ [Sticker]';
  if (m.contactMessage) return `👤 [Contact: ${m.contactMessage.displayName || 'Shared'}]`;
  if (m.contactsArrayMessage) return '👥 [Shared Contacts]';
  if (m.locationMessage || m.liveLocationMessage) return '📍 [Location Shared]';
  if (m.pollCreationMessage || m.pollCreationMessageV2 || m.pollCreationMessageV3) {
    const pollName =
      m.pollCreationMessage?.name ||
      m.pollCreationMessageV2?.name ||
      m.pollCreationMessageV3?.name ||
      'Poll';
    return `📊 [Poll: ${pollName}]`;
  }
  return '';
}

function ingestWaMessage(session, msg, isHistory = false) {
  try {
    if (!msg || !msg.key) return;
    const remoteJid = msg.key.remoteJid || '';
    const altJid = msg.key.senderPn || msg.key.participantPn || msg.key.remoteJidAlt || '';
    const identity = resolveWaJidToIdentity(session, remoteJid, altJid);
    if (!identity) return;

    if (!identity.isGroup) {
      const myDigits = normalizeWaDigits(session.phoneNumber);
      if (myDigits && identity.digits === myDigits) return;
    }

    const text = extractWaMessageText(msg.message);
    if (!text) return;

    const fromMe = Boolean(msg.key.fromMe);
    if (msg.key.id && msg.message) {
      session.rawMessagesForRetry.set(msg.key.id, msg.message);
      if (session.rawMessagesForRetry.size > 500) {
        const firstKey = session.rawMessagesForRetry.keys().next().value;
        session.rawMessagesForRetry.delete(firstKey);
      }
    }

    if (!identity.isGroup && !fromMe && msg.pushName) {
      upsertWaServerContact(session, {
        id: identity.jid,
        notify: msg.pushName,
        name: msg.pushName,
      });
    }

    const contactEntry = !identity.isGroup ? session.contactsMap.get(identity.digits) : null;
    const chatEntry = session.chatsMap.get(identity.digits);
    const resolvedName = identity.isGroup
      ? chatEntry?.name || 'WhatsApp Group'
      : (contactEntry?.name && !contactEntry.name.startsWith('+') ? contactEntry.name : '') ||
        (chatEntry?.name && !chatEntry.name.startsWith('+') ? chatEntry.name : '') ||
        (!fromMe && msg.pushName ? msg.pushName : '') ||
        contactEntry?.notify ||
        identity.phone;

    const participantSender = identity.isGroup && !fromMe ? msg.pushName || '' : '';

    const rawTs = Number(msg.messageTimestamp?.low || msg.messageTimestamp || 0);
    const ts =
      rawTs > 0
        ? new Date(rawTs > 1e12 ? rawTs : rawTs * 1000).toISOString()
        : new Date().toISOString();

    const msgId = `wa-live-${msg.key.id || `${identity.digits}-${rawTs || Date.now()}`}`;
    const payload = {
      id: msgId,
      chatId: identity.digits,
      isGroup: Boolean(identity.isGroup),
      phone: chatEntry?.phone || identity.phone,
      contactPhone: chatEntry?.phone || identity.phone,
      pushName: resolvedName,
      contactName: resolvedName,
      participantSender,
      fromMe,
      isHistory: Boolean(isHistory),
      direction: fromMe ? 'outbound' : 'inbound',
      text,
      body: text,
      timestamp: ts,
      status: fromMe ? 'delivered' : 'received',
      read: Boolean(isHistory || fromMe),
      via: 'qr_session',
    };

    const alreadyHad = session.messagesMap.has(msgId);
    session.messagesMap.set(msgId, payload);
    if (session.messagesMap.size > 2000) {
      const oldestKey = session.messagesMap.keys().next().value;
      session.messagesMap.delete(oldestKey);
    }

    session.chatsMap.set(identity.digits, {
      id: identity.digits,
      isGroup: Boolean(identity.isGroup),
      phone: chatEntry?.phone || identity.phone,
      jid: identity.jid,
      name: resolvedName,
      participantCount: chatEntry?.participantCount,
      unreadCount: !fromMe && !isHistory ? (chatEntry?.unreadCount || 0) + 1 : chatEntry?.unreadCount || 0,
      lastTimestamp: ts,
    });

    if (!alreadyHad) {
      session.incomingMessages.push(payload);
      if (session.incomingMessages.length > 1500) {
        session.incomingMessages.splice(0, session.incomingMessages.length - 1500);
      }
    }
  } catch {
    /* ignore malformed message */
  }
}

async function startBaileysSocket(session) {
  if (session.starting) return;
  session.starting = true;
  try {
    try {
      session.sock?.end?.();
    } catch {
      /* ignore */
    }
    session.sock = null;

    fs.mkdirSync(session.authDir, { recursive: true });
    await restoreWaAuthFromDb(session);
    const { state, saveCreds } = await useMultiFileAuthState(session.authDir);
    const origSet = state.keys.set.bind(state.keys);
    state.keys.set = async (data) => {
      await origSet(data);
      scheduleSaveWaAuthToDb(session);
    };

    let version = [2, 3000, 1017531287];
    try {
      const latest = await fetchLatestBaileysVersion();
      if (latest?.version) version = latest.version;
    } catch {
      /* fallback default */
    }

    const sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      logger: pino({ level: 'silent' }),
      browser: ['OzoStack CRM', 'Chrome', '120.0.0'],
      syncFullHistory: true,
      shouldSyncHistoryMessage: () => true,
      markOnlineOnConnect: false,
      getMessage: async (key) => {
        return session.rawMessagesForRetry.get(key?.id) || undefined;
      },
    });

    session.sock = sock;
    if (session.status !== 'connected') {
      session.status = 'qr_pending';
    }

    // Ensure Baileys event buffer never traps history/contacts events
    const flushInterval = setInterval(() => {
      if (session.sock !== sock) {
        clearInterval(flushInterval);
        return;
      }
      try {
        if (sock.ev?.isBuffering?.()) {
          sock.ev.flush(true);
        }
      } catch {
        /* ignore */
      }
    }, 1500);

    sock.ev.on('creds.update', async (update) => {
      try {
        if (update && typeof update === 'object') {
          Object.assign(state.creds, update);
        }
        await saveCreds();
        scheduleSaveWaAuthToDb(session);
        if (update?.myAppStateKeyId) {
          // App state sync key arrived: decode full address book contacts & chat state
          setTimeout(async () => {
            try {
              await sock.resyncAppState?.(
                ['critical_block', 'critical_unblock_low', 'regular_high', 'regular_low', 'regular'],
                true
              );
            } catch {
              /* ignore */
            }
            try {
              sock.ev?.flush?.(true);
            } catch {
              /* ignore */
            }
          }, 400);
        }
      } catch {
        /* ignore */
      }
    });

    // 1. Full History Sync (Chats + Contacts + Past Messages from phone)
    sock.ev.on('messaging-history.set', (historyData) => {
      try {
        const { chats = [], contacts = [], messages = [] } = historyData || {};
        for (const c of contacts) {
          upsertWaServerContact(session, c);
        }
        for (const ch of chats) {
          upsertWaServerChat(session, ch);
        }
        for (const m of messages) {
          ingestWaMessage(session, m, true);
        }
        scheduleSaveWaSessionCache(session);
      } catch {
        /* ignore */
      }
    });

    // 2. Contacts Sync (Address book & pushNames)
    sock.ev.on('contacts.upsert', (contacts) => {
      if (!Array.isArray(contacts)) return;
      for (const c of contacts) {
        upsertWaServerContact(session, c);
      }
      scheduleSaveWaSessionCache(session);
    });

    sock.ev.on('contacts.update', (updates) => {
      if (!Array.isArray(updates)) return;
      for (const u of updates) {
        upsertWaServerContact(session, u);
      }
      scheduleSaveWaSessionCache(session);
    });

    // 3. Chats & Groups Sync
    sock.ev.on('chats.upsert', (chats) => {
      if (!Array.isArray(chats)) return;
      for (const ch of chats) {
        upsertWaServerChat(session, ch);
      }
      scheduleSaveWaSessionCache(session);
    });

    sock.ev.on('chats.update', (updates) => {
      if (!Array.isArray(updates)) return;
      for (const ch of updates) {
        upsertWaServerChat(session, ch);
      }
      scheduleSaveWaSessionCache(session);
    });

    sock.ev.on('groups.upsert', (groups) => {
      if (!Array.isArray(groups)) return;
      for (const g of groups) {
        upsertWaServerChat(session, g);
      }
      scheduleSaveWaSessionCache(session);
    });

    sock.ev.on('groups.update', (updates) => {
      if (!Array.isArray(updates)) return;
      for (const g of updates) {
        upsertWaServerChat(session, g);
      }
      scheduleSaveWaSessionCache(session);
    });

    // 4. Live & Appended Messages Sync (Both Inbound & Outbound from phone)
    sock.ev.on('messages.upsert', (m) => {
      if (!m || !Array.isArray(m.messages)) return;
      const isHistory = m.type !== 'notify';
      for (const msg of m.messages) {
        ingestWaMessage(session, msg, isHistory);
      }
      scheduleSaveWaSessionCache(session);
    });

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        try {
          session.qrDataUrl = await QRCode.toDataURL(qr, { width: 320, margin: 1 });
          session.status = 'qr_pending';
          session.lastError = '';
          resolveWaWaiters(session);
        } catch (qrErr) {
          session.lastError = qrErr?.message || 'Failed to generate QR image';
        }
      }

      if (connection === 'open') {
        session.status = 'connected';
        session.qrDataUrl = '';
        session.lastError = '';
        const rawJid = sock.user?.id || '';
        const digits = rawJid.split(':')[0].split('@')[0].replace(/[^0-9]/g, '');
        session.phoneNumber = digits ? `+${digits}` : session.phoneNumber || 'Linked WhatsApp';
        session.pushName = sock.user?.name || session.pushName || 'WhatsApp Linked';
        resolveWaWaiters(session);

        // Proactively flush buffer, resync app state contacts, and harvest contacts from participating groups
        setTimeout(async () => {
          try {
            sock.ev?.flush?.(true);
          } catch {
            /* ignore */
          }
          try {
            if (state.creds?.myAppStateKeyId) {
              await sock.resyncAppState?.(
                ['critical_block', 'critical_unblock_low', 'regular_high', 'regular_low', 'regular'],
                false
              );
            }
          } catch {
            /* ignore */
          }
          try {
            const groups = await sock.groupFetchAllParticipating?.();
            if (groups && typeof groups === 'object') {
              for (const g of Object.values(groups)) {
                if (g && g.id) {
                  upsertWaServerChat(session, g);
                }
              }
              scheduleSaveWaSessionCache(session);
            }
          } catch {
            /* ignore */
          }
        }, 1800);
      }

      if (connection === 'close') {
        clearInterval(flushInterval);
        const statusCode =
          lastDisconnect?.error?.output?.statusCode ||
          lastDisconnect?.error?.statusCode ||
          0;
        const isLoggedOut = statusCode === DisconnectReason.loggedOut;
        const isRestartRequired =
          statusCode === DisconnectReason.restartRequired || statusCode === 515;

        session.sock = null;

        if (isLoggedOut) {
          session.status = 'disconnected';
          session.qrDataUrl = '';
          session.phoneNumber = '';
          session.pushName = '';
          session.incomingMessages = [];
          session.messagesMap.clear();
          session.contactsMap.clear();
          session.chatsMap.clear();
          session.lidToPhone.clear();
          try {
            fs.rmSync(session.authDir, { recursive: true, force: true });
          } catch {
            /* ignore */
          }
          try {
            const db = await getDb();
            if (db) {
              await db.collection(KV_COLLECTION).deleteMany({
                _id: {
                  $in: [
                    `server_wa_store_v1_${session.userId}`,
                    `server_wa_auth_v1_${session.userId}`,
                    `ozostack_wa_chats_user_v1_${session.userId}`,
                  ],
                },
              });
            }
          } catch {
            /* ignore */
          }
          resolveWaWaiters(session);
        } else if (isRestartRequired) {
          // Immediately restart stream after QR scan pairing
          setTimeout(() => {
            startBaileysSocket(session).catch(() => {});
          }, 300);
        } else {
          // If credentials already exist on disk, attempt automatic reconnect
          const credsFile = path.join(session.authDir, 'creds.json');
          if (fs.existsSync(credsFile)) {
            setTimeout(() => {
              startBaileysSocket(session).catch(() => {});
            }, 1500);
          } else {
            session.status = 'disconnected';
            resolveWaWaiters(session);
          }
        }
      }
    });
  } finally {
    session.starting = false;
  }
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
      const cfg = await resolveSmtpConfig(body.smtpConfig, body.userId);

      if (!cfg.senderEmail || !String(cfg.senderEmail).includes('@')) {
        sendJson(res, 200, {
          ok: false,
          verified: false,
          code: 'NO_EMAIL',
          error: 'Please enter your own email address first.',
        });
        return;
      }

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

      const cfg = await resolveSmtpConfig(body.smtpConfig, body.userId);
      if (!cfg.senderEmail || !String(cfg.senderEmail).includes('@')) {
        sendJson(res, 200, {
          ok: false,
          sentViaSmtp: false,
          realExternalDelivery: false,
          code: 'NO_EMAIL',
          senderEmail: '',
          error: 'You have not configured your email account yet. Please set up your email in Mail Settings.',
        });
        return;
      }

      const { transporter, host, port, authUser, cleanPass } = buildNodemailerTransport(cfg);
      const fromName = (cfg.senderName || 'OzoStack User').replace(/"/g, '');
      const fromEmail = (cfg.senderEmail || authUser).trim();
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
      const cfg = await resolveSmtpConfig(body.smtpConfig, body.userId);
      const rawPassword = String(cfg.password || '').trim();

      if (!cfg.senderEmail || !String(cfg.senderEmail).includes('@')) {
        sendJson(res, 200, {
          ok: false,
          synced: false,
          code: 'NO_EMAIL',
          error: 'Please configure your own email address and password first.',
        });
        return;
      }

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

                const rawText = parsed.text || parsed.html?.replace(/<[^>]+>/g, ' ') || '';
                const cleanPreviewText = rawText
                  .replace(/<https?:\/\/[^>]+>/g, '')
                  .replace(/https?:\/\/\S{60,}/g, '[Link]')
                  .replace(/\n{3,}/g, '\n\n')
                  .trim();

                messages.push({
                  id: `imap-${imapHost}-${msg.uid}`,
                  messageId: parsed.messageId || `uid-${msg.uid}`,
                  folder: 'inbox',
                  fromName,
                  fromEmail: fromAddr,
                  toEmail: toAddr,
                  subject: parsed.subject || '(No Subject)',
                  body: cleanPreviewText || rawText,
                  html: parsed.html || parsed.textAsHtml || '',
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

    // ========================================================================
    // Per-User WhatsApp Endpoints (QR Multi-Device Session & Meta Cloud API)
    // ========================================================================

    // 1. Start or fetch per-user WhatsApp QR session
    if (pathname === '/api/whatsapp/connect' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const userId = body.userId;
      const forceReset = Boolean(body.forceReset);
      if (!userId) {
        sendJson(res, 400, { ok: false, error: 'userId is required for isolated WhatsApp session.' });
        return;
      }

      const session = getOrCreateWaSessionEntry(userId);

      if (forceReset) {
        try {
          await session.sock?.logout?.();
        } catch {
          /* ignore */
        }
        try {
          session.sock?.end?.();
        } catch {
          /* ignore */
        }
        session.sock = null;
        session.status = 'disconnected';
        session.qrDataUrl = '';
      }

      // If user asks for a fresh QR and isn't connected, reset stale socket & old cached data
      if (session.status !== 'connected' && (!session.sock || !session.qrDataUrl)) {
        session.incomingMessages = [];
        session.messagesMap.clear();
        session.contactsMap.clear();
        session.chatsMap.clear();
        session.lidToPhone.clear();
        try {
          fs.rmSync(session.authDir, { recursive: true, force: true });
        } catch {
          /* ignore */
        }
        try {
          const db = await getDb();
          if (db) {
            await db.collection(KV_COLLECTION).deleteMany({
              _id: {
                $in: [
                  `server_wa_store_v1_${session.userId}`,
                  `server_wa_auth_v1_${session.userId}`,
                ],
              },
            });
          }
        } catch {
          /* ignore */
        }
        session.qrDataUrl = '';
        await startBaileysSocket(session);
      }

      // Wait up to 6.5 seconds for QR generation or connection open
      if (session.status !== 'connected' && !session.qrDataUrl) {
        await new Promise((resolve) => {
          const timer = setTimeout(resolve, 6500);
          session.waiters.push(() => {
            clearTimeout(timer);
            resolve();
          });
        });
      }

      sendJson(res, 200, {
        ok: true,
        status: session.status,
        qrDataUrl: session.qrDataUrl,
        phoneNumber: session.phoneNumber,
        pushName: session.pushName,
        error: session.lastError || undefined,
      });
      return;
    }

    // 2. Poll per-user WhatsApp session status, contacts, chats & live/history messages
    if (pathname === '/api/whatsapp/status' && req.method === 'GET') {
      const userId = parsedUrl.searchParams.get('userId');
      const fullSync = parsedUrl.searchParams.get('full') === '1';
      if (!userId) {
        sendJson(res, 200, { ok: false, status: 'disconnected', incomingMessages: [] });
        return;
      }

      const session = getOrCreateWaSessionEntry(userId);

      // Auto-resume Baileys socket if creds exist on disk or in MongoDB and socket isn't running
      if (!session.sock && !session.starting && session.status === 'disconnected') {
        const hasAuth = await restoreWaAuthFromDb(session);
        const credsFile = path.join(session.authDir, 'creds.json');
        if (hasAuth || fs.existsSync(credsFile)) {
          await loadWaSessionCacheFromDb(session);
          startBaileysSocket(session).catch(() => {});
        }
      }

      // If user is NOT connected, never return stale cached chats or messages
      if (session.status !== 'connected') {
        sendJson(res, 200, {
          ok: true,
          status: session.status,
          qrDataUrl: session.qrDataUrl,
          phoneNumber: '',
          pushName: '',
          incomingMessages: [],
          syncedChats: [],
          totalChats: 0,
          totalMessages: 0,
        });
        return;
      }

      // Flush any buffered Baileys events immediately
      try {
        if (session.sock?.ev?.isBuffering?.()) {
          session.sock.ev.flush(true);
        }
      } catch {
        /* ignore */
      }

      // If fullSync requested and socket is open, refresh app-state & participating WhatsApp groups
      if (fullSync && session.sock && session.status === 'connected') {
        try {
          await session.sock.resyncAppState?.(
            ['critical_block', 'critical_unblock_low', 'regular_high', 'regular_low', 'regular'],
            false
          );
        } catch {
          /* ignore */
        }
        try {
          const groups = await session.sock.groupFetchAllParticipating?.();
          if (groups && typeof groups === 'object') {
            for (const g of Object.values(groups)) {
              if (g && g.id) {
                upsertWaServerChat(session, g);
              }
            }
            scheduleSaveWaSessionCache(session);
          }
        } catch {
          /* ignore */
        }
        try {
          session.sock.ev?.flush?.(true);
        } catch {
          /* ignore */
        }
      }

      // Enrich chat names from contactsMap if any 1-on-1 chat still has a raw number as its name
      for (const [k, ch] of session.chatsMap.entries()) {
        if (!ch.isGroup && (!ch.name || String(ch.name).startsWith('+'))) {
          const c = session.contactsMap.get(String(k));
          const candidate = c?.name && !String(c.name).startsWith('+') ? c.name : c?.notify;
          if (candidate && !String(candidate).startsWith('+')) {
            ch.name = candidate;
          }
        }
      }

      let incomingMessages;
      if (fullSync) {
        session.incomingMessages.splice(0, session.incomingMessages.length);
        incomingMessages = Array.from(session.messagesMap.values());
      } else {
        incomingMessages = session.incomingMessages.splice(0, session.incomingMessages.length);
      }

      const syncedChats = Array.from(session.chatsMap.values());

      sendJson(res, 200, {
        ok: true,
        status: session.status,
        qrDataUrl: session.qrDataUrl,
        phoneNumber: session.phoneNumber,
        pushName: session.pushName,
        incomingMessages,
        syncedChats,
        totalChats: syncedChats.length,
        totalMessages: session.messagesMap.size,
      });
      return;
    }

    // 3. Send outbound WhatsApp message via user's QR session or Meta Cloud API
    if (pathname === '/api/whatsapp/send' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const userId = body.userId;
      const rawTarget = String(body.toPhone || body.to || '').trim();
      const isGroupTarget = rawTarget.endsWith('@g.us');
      const targetKey = isGroupTarget ? `${rawTarget.split('@')[0]}@g.us` : normalizeWaDigits(rawTarget);
      const text = String(body.text || '').trim();

      if (!targetKey || !text) {
        sendJson(res, 400, { ok: false, error: 'Recipient phone number / group and message text are required.' });
        return;
      }

      const session = userId ? getOrCreateWaSessionEntry(userId) : null;

      // Priority A: Active Baileys QR session for this user
      if (session && session.status === 'connected' && session.sock) {
        try {
          const knownChat = session.chatsMap.get(targetKey) || session.contactsMap.get(targetKey);
          const jid = isGroupTarget
            ? targetKey
            : knownChat?.jid || `${targetKey}@s.whatsapp.net`;
          const sent = await session.sock.sendMessage(jid, { text });
          const msgId = `wa-live-${sent?.key?.id || Date.now()}`;
          const nowIso = new Date().toISOString();
          session.messagesMap.set(msgId, {
            id: msgId,
            chatId: targetKey,
            isGroup: isGroupTarget,
            phone: isGroupTarget ? 'WhatsApp Group' : `+${targetKey}`,
            contactPhone: isGroupTarget ? 'WhatsApp Group' : `+${targetKey}`,
            pushName: knownChat?.name || (isGroupTarget ? 'WhatsApp Group' : `+${targetKey}`),
            contactName: knownChat?.name || (isGroupTarget ? 'WhatsApp Group' : `+${targetKey}`),
            fromMe: true,
            isHistory: false,
            direction: 'outbound',
            text,
            body: text,
            timestamp: nowIso,
            status: 'delivered',
            read: true,
            via: 'qr_session',
          });
          scheduleSaveWaSessionCache(session);
          sendJson(res, 200, {
            ok: true,
            realDelivered: true,
            via: 'qr_session',
            messageId: msgId,
          });
          return;
        } catch (sendErr) {
          sendJson(res, 200, {
            ok: false,
            realDelivered: false,
            via: 'qr_session',
            error: `WhatsApp QR session send error: ${sendErr?.message || 'Failed to deliver'}`,
          });
          return;
        }
      }

      const digits = targetKey;

      // Priority B: Official Meta WhatsApp Cloud API (if configured by this user)
      const meta = body.metaConfig;
      if (meta && meta.phoneNumberId && meta.accessToken) {
        try {
          const graphRes = await fetch(
            `https://graph.facebook.com/v20.0/${encodeURIComponent(String(meta.phoneNumberId).trim())}/messages`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${String(meta.accessToken).trim()}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: digits,
                type: 'text',
                text: { preview_url: false, body: text },
              }),
            }
          );
          const graphData = await graphRes.json().catch(() => ({}));
          if (graphRes.ok && graphData?.messages?.[0]?.id) {
            sendJson(res, 200, {
              ok: true,
              realDelivered: true,
              via: 'meta_cloud_api',
              messageId: graphData.messages[0].id,
            });
            return;
          }
          sendJson(res, 200, {
            ok: false,
            realDelivered: false,
            via: 'meta_cloud_api',
            error:
              graphData?.error?.message ||
              'Meta WhatsApp Cloud API rejected the message. Verify your Phone Number ID and Access Token.',
          });
          return;
        } catch (metaErr) {
          sendJson(res, 200, {
            ok: false,
            realDelivered: false,
            via: 'meta_cloud_api',
            error: `Meta Cloud API network error: ${metaErr?.message || 'Unknown error'}`,
          });
          return;
        }
      }

      sendJson(res, 200, {
        ok: false,
        realDelivered: false,
        via: 'wa_web_link',
        error: 'WhatsApp is not linked yet. Scan your WhatsApp QR Code or connect Meta Cloud API.',
      });
      return;
    }

    // 4. Disconnect & wipe per-user WhatsApp session
    if (pathname === '/api/whatsapp/disconnect' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const userId = body.userId;
      if (userId) {
        const session = getOrCreateWaSessionEntry(userId);
        try {
          await session.sock?.logout?.();
        } catch {
          /* ignore */
        }
        try {
          session.sock?.end?.();
        } catch {
          /* ignore */
        }
        session.sock = null;
        session.status = 'disconnected';
        session.qrDataUrl = '';
        session.phoneNumber = '';
        session.pushName = '';
        session.incomingMessages = [];
        session.messagesMap.clear();
        session.contactsMap.clear();
        session.chatsMap.clear();
        session.lidToPhone.clear();
        try {
          fs.rmSync(session.authDir, { recursive: true, force: true });
        } catch {
          /* ignore */
        }
        try {
          const db = await getDb();
          if (db) {
            await db
              .collection(KV_COLLECTION)
              .deleteMany({
                _id: {
                  $in: [
                    `server_wa_store_v1_${session.userId}`,
                    `server_wa_auth_v1_${session.userId}`,
                    `ozostack_wa_chats_user_v1_${session.userId}`,
                  ],
                },
              });
          }
        } catch {
          /* ignore */
        }
      }
      sendJson(res, 200, { ok: true, status: 'disconnected' });
      return;
    }

    // 5. Official Meta WhatsApp Cloud API Webhook Verification & Inbound Receiver
    if (pathname === '/api/whatsapp/webhook' && req.method === 'GET') {
      const mode = parsedUrl.searchParams.get('hub.mode');
      const challenge = parsedUrl.searchParams.get('hub.challenge') || '';
      if (mode === 'subscribe' && challenge) {
        res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(challenge);
        return;
      }
      sendJson(res, 200, { ok: true, webhook: 'ozostack-whatsapp-webhook-ready' });
      return;
    }

    if (pathname === '/api/whatsapp/webhook' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const targetUserId = parsedUrl.searchParams.get('userId');
      try {
        const entries = Array.isArray(body?.entry) ? body.entry : [];
        for (const entry of entries) {
          const changes = Array.isArray(entry?.changes) ? entry.changes : [];
          for (const change of changes) {
            const val = change?.value;
            const contacts = Array.isArray(val?.contacts) ? val.contacts : [];
            const messages = Array.isArray(val?.messages) ? val.messages : [];
            for (const m of messages) {
              const fromDigits = String(m?.from || '').replace(/[^0-9]/g, '');
              const text = m?.text?.body || m?.button?.text || '';
              if (!fromDigits || !text) continue;
              const profileName =
                contacts.find((c) => String(c?.wa_id || '').replace(/[^0-9]/g, '') === fromDigits)
                  ?.profile?.name || `+${fromDigits}`;
              const payloadMsg = {
                id: `wa-meta-${m.id || Date.now()}`,
                phone: `+${fromDigits}`,
                contactPhone: `+${fromDigits}`,
                pushName: profileName,
                contactName: profileName,
                fromMe: false,
                direction: 'inbound',
                text,
                body: text,
                timestamp: m.timestamp
                  ? new Date(Number(m.timestamp) * 1000).toISOString()
                  : new Date().toISOString(),
                status: 'received',
                read: false,
                via: 'meta_cloud_api',
              };
              if (targetUserId) {
                const s = getOrCreateWaSessionEntry(targetUserId);
                s.incomingMessages.push(payloadMsg);
              } else {
                for (const s of waSessions.values()) {
                  s.incomingMessages.push(payloadMsg);
                }
              }
            }
          }
        }
      } catch {
        /* ignore malformed webhook payload */
      }
      sendJson(res, 200, { ok: true });
      return;
    }

    // ========================================================================
    // External Lead Webhook Receiver (JustDial, IndiaMART, Facebook, Website)
    // Supports BOTH GET query params (JustDial) and POST JSON/Form payloads
    // ========================================================================
    if (pathname === '/api/webhooks/lead' && (req.method === 'POST' || req.method === 'GET')) {
      let body = {};
      if (req.method === 'POST') {
        try {
          body = await readJsonBody(req);
        } catch {
          body = {};
        }
      }
      const qp = Object.fromEntries(parsedUrl.searchParams.entries());
      const merged = { ...qp, ...(body?.RESPONSE || body?.data || body || {}) };

      const sourceRaw = String(qp.source || merged.source || 'website').trim().toLowerCase();
      const userId = String(qp.userId || merged.userId || '').trim();
      const token = String(qp.token || merged.token || '').trim();
      const isTest = Boolean(merged.isTest === true || qp.isTest === 'true');

      if (!userId) {
        sendJson(res, 400, { ok: false, error: 'userId query parameter is required.' });
        return;
      }

      const sourceLabelMap = {
        justdial: 'JustDial',
        indiamart: 'IndiaMART',
        facebook: 'Facebook Ads',
        website: 'Website',
      };
      const sourceLabel = sourceLabelMap[sourceRaw] || 'Website';

      // Extract standardized lead fields across JustDial, IndiaMART, Facebook & Website formats
      const leadName = String(
        merged.name ||
          merged.SENDER_NAME ||
          merged.full_name ||
          merged.contact_name ||
          merged.prefix ||
          `${sourceLabel} Lead`
      ).trim();
      const leadPhone = String(
        merged.mobile ||
          merged.phone ||
          merged.SENDER_MOBILE ||
          merged.phone_number ||
          merged.phone1 ||
          ''
      ).trim();
      const leadEmail = String(
        merged.email || merged.SENDER_EMAIL || merged.email_id || ''
      ).trim();
      const leadCompany = String(
        merged.company ||
          merged.SENDER_COMPANY ||
          merged.company_name ||
          merged.category ||
          merged.QUERY_PRODUCT_NAME ||
          merged.city ||
          sourceLabel
      ).trim();
      const leadNotes = String(
        merged.message ||
          merged.QUERY_MESSAGE ||
          merged.area ||
          merged.city ||
          `Captured automatically via ${sourceLabel} webhook`
      ).trim();

      const db = await getDb();
      let sourceCfg = null;
      let ownerName = userId;

      if (db) {
        try {
          const col = db.collection(KV_COLLECTION);
          // Resolve owner name from auth store
          const authDoc = await col.findOne({ _id: 'ozo-auth-store-v5' });
          if (authDoc?.value) {
            const parsedAuth = JSON.parse(authDoc.value);
            const foundUser = (parsedAuth?.users || []).find((u) => u.id === userId);
            if (foundUser?.name) ownerName = foundUser.name;
          }

          // Load user's external webhook source configuration
          const srcDoc = await col.findOne({ _id: `ozostack_webhook_sources_user_v1_${userId}` });
          if (srcDoc?.value) {
            const list = JSON.parse(srcDoc.value);
            if (Array.isArray(list)) {
              sourceCfg = list.find((s) => s.id === sourceRaw) || null;
            }
          }
        } catch {
          /* ignore */
        }
      }

      if (sourceCfg && sourceCfg.token && sourceCfg.token !== token) {
        sendJson(res, 403, { ok: false, error: 'Invalid or missing webhook token.' });
        return;
      }

      if (sourceCfg && !sourceCfg.enabled && !isTest) {
        sendJson(res, 200, {
          ok: true,
          ignored: true,
          message: `${sourceLabel} webhook is currently turned OFF in CRM Workflows. Turn it ON when ready.`,
        });
        return;
      }

      const nowIso = new Date().toISOString();
      const leadId = `lead-wh-${Date.now()}`;

      // 1. Auto Create Lead in MongoDB ozostack_leads_v2
      const shouldCreateLead = sourceCfg ? sourceCfg.autoCreateLead !== false : true;
      if (db && shouldCreateLead) {
        try {
          const col = db.collection(KV_COLLECTION);
          const leadsDoc = await col.findOne({ _id: 'ozostack_leads_v2' });
          const existingLeads = leadsDoc?.value ? JSON.parse(leadsDoc.value) : [];
          const normalizedPhone = normalizeWaDigits(leadPhone);
          const newLead = {
            id: leadId,
            name: leadName,
            title: sourceLabel + ' Inquiry',
            company: leadCompany,
            email: leadEmail || 'no-email@lead.local',
            phone: leadPhone || '+91 00000 00000',
            whatsapp: normalizedPhone ? `+${normalizedPhone}` : leadPhone,
            value: 25000,
            status: 'New Lead',
            priority: 'Hot',
            source: sourceLabel,
            owner: ownerName,
            score: 82,
            createdAt: nowIso.split('T')[0],
            lastActivity: 'Just now',
            notes: leadNotes,
          };
          const nextLeads = Array.isArray(existingLeads) ? [newLead, ...existingLeads] : [newLead];
          await col.updateOne(
            { _id: 'ozostack_leads_v2' },
            { $set: { value: JSON.stringify(nextLeads), updatedAt: nowIso } },
            { upsert: true }
          );
        } catch {
          /* ignore */
        }
      }

      const interpolate = (tpl) => {
        const firstName = leadName.split(' ')[0] || 'there';
        return String(tpl || '')
          .replace(/\{firstName\}/g, firstName)
          .replace(/\{name\}/g, leadName)
          .replace(/\{company\}/g, leadCompany)
          .replace(/\{source\}/g, sourceLabel)
          .replace(/\{owner\}/g, ownerName);
      };

      // 2. Auto Send Welcome Email via user's configured SMTP
      let emailSent = false;
      let emailNote = 'Skipped';
      const shouldEmail = sourceCfg ? Boolean(sourceCfg.autoEmail) : true;
      if (shouldEmail && leadEmail && leadEmail.includes('@') && !leadEmail.endsWith('.local')) {
        const cfg = await resolveSmtpConfig(null, userId);
        if (cfg.senderEmail && !isPlaceholderPassword(cfg.password)) {
          try {
            const { transporter, authUser } = buildNodemailerTransport(cfg);
            const fromName = (cfg.senderName || ownerName || 'OzoStack').replace(/"/g, '');
            const fromEmail = (cfg.senderEmail || authUser).trim();
            const subject = interpolate(
              sourceCfg?.emailSubject || `Thank you for your ${sourceLabel} inquiry — OzoStack`
            );
            const text = interpolate(
              sourceCfg?.emailBody ||
                `Hi {firstName},\n\nThank you for connecting with us via {source} regarding {company}. Our team will reach out shortly.\n\nRegards,\n{owner}`
            );
            await transporter.sendMail({
              from: `"${fromName}" <${fromEmail}>`,
              to: leadEmail,
              replyTo: cfg.replyToEmail || fromEmail,
              subject,
              text,
              html: `<div style="font-family:Inter,Arial,sans-serif;font-size:14px;line-height:1.6;color:#0f172a;white-space:pre-wrap;">${escapeHtml(
                text
              )}</div>`,
            });
            emailSent = true;
            emailNote = 'Sent';
          } catch (mailErr) {
            emailNote = `Failed (${mailErr?.message || 'SMTP error'})`;
          }
        } else {
          emailNote = 'SMTP not configured';
        }
      }

      // 3. Auto Send Welcome WhatsApp (if enabled AND QR session or Meta Cloud API is active)
      let whatsappSent = false;
      let whatsappNote = 'Skipped';
      const shouldWa = sourceCfg ? Boolean(sourceCfg.autoWhatsApp) : false;
      if (shouldWa && leadPhone) {
        const digits = normalizeWaDigits(leadPhone);
        const waText = interpolate(
          sourceCfg?.whatsappBody ||
            `Hi {firstName}, thanks for your ${sourceLabel} inquiry regarding {company}! Our team will connect shortly.`
        );
        const session = getOrCreateWaSessionEntry(userId);
        if (session && session.status === 'connected' && session.sock && digits) {
          try {
            await session.sock.sendMessage(`${digits}@s.whatsapp.net`, { text: waText });
            whatsappSent = true;
            whatsappNote = 'Sent via QR';
          } catch {
            whatsappNote = 'Failed';
          }
        } else if (db && digits) {
          try {
            const waDoc = await db
              .collection(KV_COLLECTION)
              .findOne({ _id: `ozostack_wa_config_user_v1_${userId}` });
            const waCfg = waDoc?.value ? JSON.parse(waDoc.value) : null;
            if (waCfg?.metaPhoneNumberId && waCfg?.metaAccessToken) {
              const gRes = await fetch(
                `https://graph.facebook.com/v20.0/${encodeURIComponent(waCfg.metaPhoneNumberId)}/messages`,
                {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${waCfg.metaAccessToken}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    messaging_product: 'whatsapp',
                    recipient_type: 'individual',
                    to: digits,
                    type: 'text',
                    text: { preview_url: false, body: waText },
                  }),
                }
              );
              if (gRes.ok) {
                whatsappSent = true;
                whatsappNote = 'Sent via Meta Cloud API';
              } else {
                whatsappNote = 'Meta Cloud API rejected';
              }
            } else {
              whatsappNote = 'Not Linked (Meta API / QR pending)';
            }
          } catch {
            whatsappNote = 'Not Linked (Meta API / QR pending)';
          }
        } else {
          whatsappNote = 'Not Linked (Meta API / QR pending)';
        }
      }

      // 4. Record Execution Log & Notification in MongoDB
      if (db) {
        try {
          const col = db.collection(KV_COLLECTION);
          const logKey = `ozostack_workflow_logs_user_v1_${userId}`;
          const logDoc = await col.findOne({ _id: logKey });
          const existingLogs = logDoc?.value ? JSON.parse(logDoc.value) : [];
          const newLog = {
            id: `wflog-wh-${Date.now()}`,
            workflowName: `${sourceLabel} External Webhook`,
            source: sourceLabel,
            recipientName: leadName,
            recipientEmail: leadEmail || undefined,
            recipientPhone: leadPhone || undefined,
            emailStatus: emailSent ? 'Sent' : emailNote === 'Skipped' ? 'Skipped' : 'Failed',
            whatsappStatus: whatsappSent
              ? 'Sent'
              : whatsappNote.includes('Not Linked')
              ? 'Not Linked'
              : 'Skipped',
            detail: `Lead created (${leadId}) · Email: ${emailNote} · WA: ${whatsappNote}`,
            timestamp: nowIso,
          };
          const nextLogs = Array.isArray(existingLogs)
            ? [newLog, ...existingLogs].slice(0, 100)
            : [newLog];
          await col.updateOne(
            { _id: logKey },
            { $set: { value: JSON.stringify(nextLogs), updatedAt: nowIso } },
            { upsert: true }
          );
        } catch {
          /* ignore */
        }
      }

      sendJson(res, 200, {
        ok: true,
        leadId,
        source: sourceLabel,
        emailSent,
        emailNote,
        whatsappSent,
        whatsappNote,
      });
      return;
    }

    // ========================================================================
    // Google Gemini AI Endpoints (Server-Side Free Tier Key + Optional Override)
    // ========================================================================
    if (pathname === '/api/ai/status' && req.method === 'GET') {
      const configured = Boolean(String(process.env.GEMINI_API_KEY || '').trim());
      sendJson(res, 200, {
        ok: true,
        configured,
        model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      });
      return;
    }

    if (pathname === '/api/ai/generate' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const apiKey = String(body.userApiKey || process.env.GEMINI_API_KEY || '').trim();
      const prompt = String(body.prompt || '').trim();
      const systemInstruction = String(body.systemInstruction || '').trim();
      const jsonMode = Boolean(body.jsonMode);
      const preferredModel = String(
        body.model || process.env.GEMINI_MODEL || 'gemini-2.5-flash'
      ).trim();

      if (!apiKey) {
        sendJson(res, 200, {
          ok: false,
          error: 'Gemini API key is not configured on the server yet.',
        });
        return;
      }

      if (!prompt) {
        sendJson(res, 400, { ok: false, error: 'Prompt is required.' });
        return;
      }

      const modelsToTry = [
        preferredModel,
        'gemini-2.5-flash',
        'gemini-2.5-flash-lite',
        'gemini-flash-latest',
        'gemini-flash-lite-latest',
      ].filter((v, i, arr) => v && arr.indexOf(v) === i);

      let lastErr = 'Gemini API request failed.';
      for (const modelName of modelsToTry) {
        try {
          const payload = {
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: jsonMode ? 0.2 : 0.7,
              ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
            },
          };
          if (systemInstruction) {
            payload.systemInstruction = { parts: [{ text: systemInstruction }] };
          }

          const gRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
              modelName
            )}:generateContent?key=${encodeURIComponent(apiKey)}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            }
          );

          const gData = await gRes.json().catch(() => ({}));
          if (gRes.ok) {
            const parts = gData?.candidates?.[0]?.content?.parts || [];
            const text = parts
              .map((p) => p?.text || '')
              .join('')
              .trim();
            if (text) {
              sendJson(res, 200, { ok: true, text, model: modelName });
              return;
            }
          }

          lastErr = gData?.error?.message || `HTTP ${gRes.status} from ${modelName}`;
          // Retry next model only if model not found / overloaded
          if (gRes.status !== 404 && gRes.status !== 503 && gRes.status !== 429) {
            break;
          }
        } catch (err) {
          lastErr = err?.message || 'Network error calling Gemini API.';
        }
      }

      sendJson(res, 200, { ok: false, error: lastErr });
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
        if (
          doc &&
          typeof doc._id === 'string' &&
          !doc._id.startsWith('server_') &&
          typeof doc.value === 'string'
        ) {
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
