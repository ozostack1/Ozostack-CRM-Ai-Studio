import { useState, useEffect, useCallback } from 'react';
import { addNotification } from './notificationService';

export type MailProviderId =
  | 'hostinger'
  | 'titan'
  | 'gmail'
  | 'workspace'
  | 'zoho'
  | 'office365'
  | 'custom';

export interface SmtpConfig {
  ownerUserId?: string;
  provider: MailProviderId;
  senderName: string;
  senderEmail: string;
  replyToEmail: string;
  host: string;
  port: number;
  imapHost: string;
  imapPort: number;
  encryption: 'TLS' | 'SSL' | 'NONE';
  username: string;
  password: string;
  signature: string;
  configured?: boolean;
  verified?: boolean;
  enabled: boolean;
  updatedAt: string;
}

export type MailFolder = 'inbox' | 'sent' | 'drafts' | 'trash';

export interface MailMessage {
  id: string;
  ownerUserId?: string;
  messageId?: string;
  folder: MailFolder;
  fromName: string;
  fromEmail: string;
  toName?: string;
  toEmail: string;
  cc?: string;
  bcc?: string;
  subject: string;
  body: string;
  html?: string;
  read: boolean;
  starred: boolean;
  deliveryStatus:
    | 'Delivered via Live SMTP'
    | 'Opened in Gmail Web'
    | 'Received via IMAP'
    | 'Received'
    | 'Draft';
  timestamp: string;
}

export interface SentEmailRecord {
  id: string;
  ownerUserId?: string;
  to: string;
  recipientName?: string;
  from: string;
  subject: string;
  bodyPreview: string;
  status: 'Delivered via Live SMTP' | 'Opened in Gmail Web';
  sentAt: string;
}

interface ActiveSessionUser {
  id: string;
  name: string;
  email: string;
  roleId: string;
}

/**
 * Reads the currently signed-in user from sessionStorage ('ozo-auth-session-v3')
 * and looks up their account in localStorage ('ozo-auth-store-v5').
 * Ensures 100% strict per-user isolation of email configs, inboxes, and sent logs.
 */
export function getActiveMailUser(): ActiveSessionUser {
  try {
    if (typeof window !== 'undefined') {
      const rawSession = window.sessionStorage?.getItem('ozo-auth-session-v3');
      if (rawSession && rawSession !== 'SIGNED_OUT') {
        const parsedSession = JSON.parse(rawSession);
        const userId = parsedSession?.userId;
        if (userId) {
          const rawStore = window.localStorage?.getItem('ozo-auth-store-v5');
          if (rawStore) {
            const store = JSON.parse(rawStore);
            const found = Array.isArray(store?.users)
              ? store.users.find((u: any) => u.id === userId)
              : null;
            if (found) {
              return {
                id: found.id,
                name: found.name || 'User',
                email: found.email || '',
                roleId: found.roleId || 'employee',
              };
            }
          }
          return {
            id: String(userId),
            name: 'User',
            email: '',
            roleId: 'employee',
          };
        }
      }
    }
  } catch {
    /* ignore */
  }
  return {
    id: 'anonymous',
    name: 'User',
    email: '',
    roleId: 'employee',
  };
}

export function getUserSmtpKey(userId?: string): string {
  const id = userId || getActiveMailUser().id;
  return `ozostack_smtp_user_v2_${id}`;
}

export function getUserMailboxKey(userId?: string): string {
  const id = userId || getActiveMailUser().id;
  return `ozostack_mailbox_user_v2_${id}`;
}

export function getUserSentLogKey(userId?: string): string {
  const id = userId || getActiveMailUser().id;
  return `ozostack_sentlog_user_v2_${id}`;
}

export const MAIL_PROVIDER_PRESETS: {
  id: MailProviderId;
  label: string;
  badge: string;
  host: string;
  port: number;
  imapHost: string;
  imapPort: number;
  encryption: SmtpConfig['encryption'];
  placeholderEmail: string;
  passwordHint: string;
}[] = [
  {
    id: 'hostinger',
    label: 'Domain Mail — Hostinger (@ozostack.in)',
    badge: 'Recommended for @ozostack.in',
    host: 'smtp.hostinger.com',
    port: 465,
    imapHost: 'imap.hostinger.com',
    imapPort: 993,
    encryption: 'SSL',
    placeholderEmail: 'yourname@ozostack.in',
    passwordHint: 'Enter your @ozostack.in Hostinger email password',
  },
  {
    id: 'titan',
    label: 'Domain Mail — Titan (@ozostack.in)',
    badge: 'Titan Mail',
    host: 'smtp.titan.email',
    port: 465,
    imapHost: 'imap.titan.email',
    imapPort: 993,
    encryption: 'SSL',
    placeholderEmail: 'yourname@ozostack.in',
    passwordHint: 'Enter your @ozostack.in Titan email password',
  },
  {
    id: 'gmail',
    label: 'Personal / Work Gmail (@gmail.com)',
    badge: 'Requires 16-digit App Password',
    host: 'smtp.gmail.com',
    port: 587,
    imapHost: 'imap.gmail.com',
    imapPort: 993,
    encryption: 'TLS',
    placeholderEmail: 'yourname@gmail.com',
    passwordHint: 'Requires 16-digit Google App Password (myaccount.google.com/apppasswords)',
  },
  {
    id: 'workspace',
    label: 'Google Workspace (@ozostack.in)',
    badge: 'Google Domain',
    host: 'smtp.gmail.com',
    port: 587,
    imapHost: 'imap.gmail.com',
    imapPort: 993,
    encryption: 'TLS',
    placeholderEmail: 'yourname@ozostack.in',
    passwordHint: 'Requires 16-digit Google Workspace App Password',
  },
  {
    id: 'zoho',
    label: 'Zoho Domain Mail (@ozostack.in)',
    badge: 'Zoho Mail',
    host: 'smtp.zoho.in',
    port: 465,
    imapHost: 'imap.zoho.in',
    imapPort: 993,
    encryption: 'SSL',
    placeholderEmail: 'yourname@ozostack.in',
    passwordHint: 'Enter your Zoho Mail password or App Password',
  },
  {
    id: 'office365',
    label: 'Microsoft 365 / Outlook',
    badge: 'Office 365',
    host: 'smtp.office365.com',
    port: 587,
    imapHost: 'outlook.office365.com',
    imapPort: 993,
    encryption: 'TLS',
    placeholderEmail: 'yourname@ozostack.in',
    passwordHint: 'Enter your Microsoft 365 password or App Password',
  },
  {
    id: 'custom',
    label: 'Custom Domain SMTP / IMAP',
    badge: 'Custom Server',
    host: 'mail.ozostack.in',
    port: 587,
    imapHost: 'mail.ozostack.in',
    imapPort: 993,
    encryption: 'TLS',
    placeholderEmail: 'yourname@ozostack.in',
    passwordHint: 'Enter your custom mail server password',
  },
];

export function buildDefaultUserSmtpConfig(user?: ActiveSessionUser): SmtpConfig {
  const activeUser = user || getActiveMailUser();
  return {
    ownerUserId: activeUser.id,
    provider: 'hostinger',
    senderName: activeUser.name || 'OzoStack User',
    senderEmail: '',
    replyToEmail: '',
    host: 'smtp.hostinger.com',
    port: 465,
    imapHost: 'imap.hostinger.com',
    imapPort: 993,
    encryption: 'SSL',
    username: '',
    password: '',
    signature: `Best regards,\n${activeUser.name || 'OzoStack Team'}\nOzoStack CRM · https://ozostack.in`,
    configured: false,
    verified: false,
    enabled: true,
    updatedAt: new Date().toISOString(),
  };
}

export const DEFAULT_SMTP_CONFIG: SmtpConfig = buildDefaultUserSmtpConfig({
  id: 'default',
  name: 'OzoStack User',
  email: '',
  roleId: 'employee',
});

export function hasRealSmtpPassword(pw?: string): boolean {
  const s = (pw || '').trim();
  return Boolean(s && s !== 'ozo-smtp-connected-v1' && !s.startsWith('••••'));
}

export function getSmtpConfig(forUserId?: string): SmtpConfig {
  const activeUser = getActiveMailUser();
  const targetUserId = forUserId || activeUser.id;
  const baseDefault = buildDefaultUserSmtpConfig(
    forUserId ? { id: forUserId, name: 'User', email: '', roleId: 'employee' } : activeUser
  );

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const key = getUserSmtpKey(targetUserId);
      const raw = window.localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          const cleanPw =
            parsed.password === 'ozo-smtp-connected-v1' ? '' : (parsed.password || '');
          const senderEmail = (parsed.senderEmail || '').trim();
          return {
            ...baseDefault,
            ...parsed,
            ownerUserId: targetUserId,
            senderEmail,
            replyToEmail: (parsed.replyToEmail || senderEmail).trim(),
            username: (parsed.username || senderEmail).trim(),
            host: (parsed.host || baseDefault.host).trim(),
            port: Number(parsed.port) || 465,
            imapHost: (parsed.imapHost || baseDefault.imapHost).trim(),
            imapPort: Number(parsed.imapPort) || 993,
            password: cleanPw,
            configured: Boolean(senderEmail && senderEmail.includes('@')),
          };
        }
      }
    }
  } catch {
    /* ignore */
  }
  return baseDefault;
}

export function saveSmtpConfig(partial: Partial<SmtpConfig>, forUserId?: string): SmtpConfig {
  const activeUser = getActiveMailUser();
  const targetUserId = forUserId || activeUser.id;
  const current = getSmtpConfig(targetUserId);
  const nextEmail = (partial.senderEmail ?? current.senderEmail).trim();
  const rawPw = partial.password ?? current.password;
  const cleanPw = rawPw === 'ozo-smtp-connected-v1' ? '' : rawPw.trim();

  const updated: SmtpConfig = {
    ...current,
    ...partial,
    ownerUserId: targetUserId,
    senderEmail: nextEmail,
    replyToEmail: (partial.replyToEmail ?? nextEmail).trim(),
    username: (partial.username ?? nextEmail).trim(),
    port: Number(partial.port ?? current.port) || 465,
    imapPort: Number(partial.imapPort ?? current.imapPort) || 993,
    password: cleanPw,
    configured: Boolean(nextEmail && nextEmail.includes('@')),
    updatedAt: new Date().toISOString(),
  };

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(getUserSmtpKey(targetUserId), JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('ozostack-smtp-changed', { detail: updated }));
      window.dispatchEvent(new CustomEvent('ozostack-crm-config-changed'));
    }
  } catch {
    /* ignore */
  }
  return updated;
}

export function getMailboxMessages(forUserId?: string): MailMessage[] {
  const targetUserId = forUserId || getActiveMailUser().id;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(getUserMailboxKey(targetUserId));
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (m: MailMessage) => !m.ownerUserId || m.ownerUserId === targetUserId
          );
        }
      }
    }
  } catch {
    /* ignore */
  }
  // Every user starts with a clean, isolated empty mailbox (never sees Admin or another user's mail)
  return [];
}

export function saveMailboxMessages(messages: MailMessage[], forUserId?: string): void {
  const targetUserId = forUserId || getActiveMailUser().id;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const tagged = messages.map((m) => ({ ...m, ownerUserId: targetUserId }));
      window.localStorage.setItem(getUserMailboxKey(targetUserId), JSON.stringify(tagged));
      window.dispatchEvent(new CustomEvent('ozostack-mailbox-changed'));
      window.dispatchEvent(new CustomEvent('ozostack-smtp-changed'));
      window.dispatchEvent(new CustomEvent('ozostack-crm-config-changed'));
    }
  } catch {
    /* ignore */
  }
}

export function addMailboxMessage(
  msg: Omit<MailMessage, 'id' | 'timestamp'> & { id?: string; timestamp?: string },
  triggerNotification = true,
  forUser?: { id: string; name: string }
): MailMessage {
  const activeUser = forUser || getActiveMailUser();
  const current = getMailboxMessages(activeUser.id);
  const full: MailMessage = {
    ...msg,
    ownerUserId: activeUser.id,
    id: msg.id || `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: msg.timestamp || new Date().toISOString(),
  };
  saveMailboxMessages([full, ...current], activeUser.id);

  if (triggerNotification) {
    if (full.folder === 'inbox') {
      addNotification({
        title: `New Email Received: ${full.subject}`,
        subtitle: `From ${full.fromName} <${full.fromEmail}>`,
        type: 'lead',
        read: false,
        targetNav: 'Email',
        targetId: full.id,
        owner: activeUser.name,
        recipient: activeUser.name,
        priority: 'high',
      });
    } else if (full.folder === 'sent') {
      addNotification({
        title: `Email Sent: ${full.subject}`,
        subtitle: `To ${full.toEmail} · ${full.deliveryStatus}`,
        type: 'lead',
        read: false,
        targetNav: 'Email',
        targetId: full.id,
        owner: activeUser.name,
        recipient: activeUser.name,
        priority: 'medium',
      });
    }
  }

  return full;
}

export function getSentEmailsLog(forUserId?: string): SentEmailRecord[] {
  const targetUserId = forUserId || getActiveMailUser().id;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(getUserSentLogKey(targetUserId));
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (r: SentEmailRecord) => !r.ownerUserId || r.ownerUserId === targetUserId
          );
        }
      }
    }
  } catch {
    /* ignore */
  }
  return [];
}

export function recordSentEmail(
  entry: Omit<SentEmailRecord, 'id' | 'sentAt'>,
  forUserId?: string
): void {
  const targetUserId = forUserId || getActiveMailUser().id;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const current = getSentEmailsLog(targetUserId);
      const next: SentEmailRecord[] = [
        {
          ...entry,
          ownerUserId: targetUserId,
          id: `mail-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          sentAt: new Date().toISOString(),
        },
        ...current,
      ].slice(0, 100);
      window.localStorage.setItem(getUserSentLogKey(targetUserId), JSON.stringify(next));
      window.dispatchEvent(new CustomEvent('ozostack-smtp-changed'));
    }
  } catch {
    /* ignore */
  }
}

export function clearSentEmailsLog(forUserId?: string): void {
  const targetUserId = forUserId || getActiveMailUser().id;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(getUserSentLogKey(targetUserId), JSON.stringify([]));
      window.dispatchEvent(new CustomEvent('ozostack-smtp-changed'));
    }
  } catch {
    /* ignore */
  }
}

export async function verifySmtpConnection(
  customConfig?: SmtpConfig
): Promise<{ ok: boolean; verified: boolean; message: string }> {
  const activeUser = getActiveMailUser();
  const cfg = customConfig || getSmtpConfig(activeUser.id);
  try {
    const res = await fetch('/api/verify-smtp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ smtpConfig: cfg, userId: activeUser.id }),
    });
    const data = await res.json().catch(() => null);
    if (res.ok && data && data.ok && data.verified) {
      saveSmtpConfig({ ...cfg, verified: true, configured: true }, activeUser.id);
      return {
        ok: true,
        verified: true,
        message: data.message || `Live SMTP Verified on ${cfg.host}:${cfg.port}!`,
      };
    }
    saveSmtpConfig({ ...cfg, verified: false }, activeUser.id);
    return {
      ok: false,
      verified: false,
      message: data?.error || 'SMTP verification failed. Please check your host, port, and password.',
    };
  } catch (err: any) {
    return {
      ok: false,
      verified: false,
      message: err?.message || 'Unable to reach SMTP verification endpoint.',
    };
  }
}

export async function syncInboxViaImap(customConfig?: SmtpConfig): Promise<{
  ok: boolean;
  newCount: number;
  totalFetched: number;
  message: string;
}> {
  const activeUser = getActiveMailUser();
  const cfg = customConfig || getSmtpConfig(activeUser.id);

  if (!cfg.senderEmail || !cfg.senderEmail.includes('@')) {
    return {
      ok: false,
      newCount: 0,
      totalFetched: 0,
      message: 'Please configure your own email address and password first.',
    };
  }

  try {
    const res = await fetch('/api/sync-inbox', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ smtpConfig: cfg, userId: activeUser.id }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data || !data.ok) {
      return {
        ok: false,
        newCount: 0,
        totalFetched: 0,
        message:
          data?.error ||
          'IMAP sync requires your valid Domain Mail (@ozostack.in) password or 16-digit Gmail App Password.',
      };
    }

    const incoming: MailMessage[] = Array.isArray(data.messages) ? data.messages : [];
    const existing = getMailboxMessages(activeUser.id);
    const existingIds = new Set(existing.map((m) => m.id));
    const existingMsgIds = new Set(existing.map((m) => m.messageId).filter(Boolean));
    const incomingById = new Map<string, MailMessage>();
    incoming.forEach((item) => {
      incomingById.set(item.id, item);
      if (item.messageId) incomingById.set(item.messageId, item);
    });

    const fresh: MailMessage[] = [];
    for (const item of incoming) {
      if (!existingIds.has(item.id) && (!item.messageId || !existingMsgIds.has(item.messageId))) {
        fresh.push({ ...item, ownerUserId: activeUser.id });
      }
    }

    // Also upgrade any existing synced messages so their original HTML and cleaned preview body are up to date
    const upgradedExisting = existing.map((m) => {
      const match = incomingById.get(m.id) || (m.messageId ? incomingById.get(m.messageId) : undefined);
      if (match) {
        return {
          ...m,
          html: match.html || m.html,
          body: match.body || m.body,
        };
      }
      return m;
    });

    saveMailboxMessages([...fresh, ...upgradedExisting], activeUser.id);

    if (fresh.length > 0) {
      fresh.slice(0, 3).forEach((m) => {
        addNotification({
          title: `New Email Received: ${m.subject}`,
          subtitle: `From ${m.fromName} <${m.fromEmail}>`,
          type: 'lead',
          read: false,
          targetNav: 'Email',
          targetId: m.id,
          owner: activeUser.name,
          recipient: activeUser.name,
          priority: 'high',
        });
      });
    }

    return {
      ok: true,
      newCount: fresh.length,
      totalFetched: incoming.length,
      message:
        fresh.length > 0
          ? `Synced ${fresh.length} new incoming email(s) into your personal inbox from ${data.imapHost}!`
          : `Your inbox is up to date (${incoming.length} emails checked on ${data.imapHost}).`,
    };
  } catch (err: any) {
    return {
      ok: false,
      newCount: 0,
      totalFetched: 0,
      message: err?.message || 'Network error while syncing IMAP inbox.',
    };
  }
}

export function openGmailDirectCompose(params: {
  from?: string;
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  body: string;
}) {
  const fromEmail = (params.from || getSmtpConfig().senderEmail || '').trim();
  const authUserParam = fromEmail ? `&authuser=${encodeURIComponent(fromEmail)}` : '';
  let gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&tf=1${authUserParam}&to=${encodeURIComponent(
    params.to
  )}&su=${encodeURIComponent(params.subject)}&body=${encodeURIComponent(params.body)}`;
  if (params.cc) gmailUrl += `&cc=${encodeURIComponent(params.cc)}`;
  if (params.bcc) gmailUrl += `&bcc=${encodeURIComponent(params.bcc)}`;
  window.open(gmailUrl, '_blank', 'noopener,noreferrer');
}

/**
 * Finds if a recipient email belongs to another CRM user account so internal
 * emails also land directly in that specific recipient user's private CRM Inbox.
 */
function findInternalRecipientUser(toEmail: string): ActiveSessionUser | null {
  try {
    const clean = toEmail.trim().toLowerCase();
    if (!clean || typeof window === 'undefined' || !window.localStorage) return null;
    const rawStore = window.localStorage.getItem('ozo-auth-store-v5');
    if (!rawStore) return null;
    const store = JSON.parse(rawStore);
    if (!Array.isArray(store?.users)) return null;

    for (const u of store.users) {
      const uSmtp = getSmtpConfig(u.id);
      if (
        (u.email && u.email.toLowerCase() === clean) ||
        (uSmtp.senderEmail && uSmtp.senderEmail.toLowerCase() === clean)
      ) {
        return {
          id: u.id,
          name: u.name || 'User',
          email: u.email || clean,
          roleId: u.roleId || 'employee',
        };
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}

export async function sendDirectEmail(params: {
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  body: string;
  html?: string;
  recipientName?: string;
  allowGmailFallback?: boolean;
}): Promise<{
  ok: boolean;
  mode: 'smtp' | 'gmail-direct';
  realExternalDelivery: boolean;
  senderEmail: string;
  message: string;
  error?: string;
}> {
  const activeUser = getActiveMailUser();
  const config = getSmtpConfig(activeUser.id);
  const toEmail = (params.to || '').trim();
  const subject = (params.subject || 'Message from OzoStack CRM').trim();
  const body = params.body || '';
  const allowFallback = params.allowGmailFallback !== false;

  if (!toEmail) {
    return {
      ok: false,
      mode: 'smtp',
      realExternalDelivery: false,
      senderEmail: config.senderEmail,
      message: 'Recipient email address is required.',
      error: 'Recipient email address is required.',
    };
  }

  if (!config.senderEmail || !config.senderEmail.includes('@')) {
    return {
      ok: false,
      mode: 'smtp',
      realExternalDelivery: false,
      senderEmail: '',
      message: 'Please set up your personal/work email account in Mail Settings before sending.',
      error: 'Please set up your personal/work email account in Mail Settings before sending.',
    };
  }

  let serverError = '';

  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: activeUser.id,
        to: toEmail,
        cc: params.cc,
        bcc: params.bcc,
        subject,
        text: body,
        html: params.html || undefined,
        replyTo: config.replyToEmail || config.senderEmail,
        smtpConfig: config,
      }),
    });
    const data = await res.json().catch(() => null);

    if (res.ok && data && data.ok && data.realExternalDelivery) {
      saveSmtpConfig({ ...config, verified: true, configured: true }, activeUser.id);

      recordSentEmail(
        {
          to: toEmail,
          recipientName: params.recipientName,
          from: config.senderEmail,
          subject,
          bodyPreview: body.slice(0, 140),
          status: 'Delivered via Live SMTP',
        },
        activeUser.id
      );

      addMailboxMessage(
        {
          folder: 'sent',
          fromName: config.senderName || activeUser.name,
          fromEmail: config.senderEmail,
          toName: params.recipientName || toEmail.split('@')[0],
          toEmail,
          cc: params.cc,
          bcc: params.bcc,
          subject,
          body,
          html: params.html || undefined,
          read: true,
          starred: false,
          deliveryStatus: 'Delivered via Live SMTP',
        },
        true,
        activeUser
      );

      // If recipient is a user inside the CRM (or self), deliver a copy to that recipient's isolated inbox
      const internalTarget = findInternalRecipientUser(toEmail);
      if (internalTarget) {
        addMailboxMessage(
          {
            folder: 'inbox',
            fromName: config.senderName || activeUser.name,
            fromEmail: config.senderEmail,
            toName: internalTarget.name,
            toEmail,
            subject,
            body,
            read: false,
            starred: false,
            deliveryStatus: 'Received',
          },
          true,
          internalTarget
        );
      }

      return {
        ok: true,
        mode: 'smtp',
        realExternalDelivery: true,
        senderEmail: config.senderEmail,
        message: `Email delivered directly to ${toEmail} via Live SMTP (${config.senderEmail})!`,
      };
    }

    serverError = data?.error || 'Live SMTP password is not configured.';
  } catch (err: any) {
    serverError = err?.message || 'Network error while connecting to SMTP server.';
  }

  if (!allowFallback) {
    return {
      ok: false,
      mode: 'smtp',
      realExternalDelivery: false,
      senderEmail: config.senderEmail,
      message: serverError,
      error: serverError,
    };
  }

  openGmailDirectCompose({
    from: config.senderEmail,
    to: toEmail,
    cc: params.cc,
    bcc: params.bcc,
    subject,
    body,
  });

  recordSentEmail(
    {
      to: toEmail,
      recipientName: params.recipientName,
      from: config.senderEmail,
      subject,
      bodyPreview: body.slice(0, 140),
      status: 'Opened in Gmail Web',
    },
    activeUser.id
  );

  addMailboxMessage(
    {
      folder: 'sent',
      fromName: config.senderName || activeUser.name,
      fromEmail: config.senderEmail,
      toName: params.recipientName || toEmail.split('@')[0],
      toEmail,
      cc: params.cc,
      bcc: params.bcc,
      subject,
      body,
      read: true,
      starred: false,
      deliveryStatus: 'Opened in Gmail Web',
    },
    true,
    activeUser
  );

  const internalTarget = findInternalRecipientUser(toEmail);
  if (internalTarget) {
    addMailboxMessage(
      {
        folder: 'inbox',
        fromName: config.senderName || activeUser.name,
        fromEmail: config.senderEmail,
        toName: internalTarget.name,
        toEmail,
        subject,
        body,
        read: false,
        starred: false,
        deliveryStatus: 'Received',
      },
      true,
      internalTarget
    );
  }

  return {
    ok: true,
    mode: 'gmail-direct',
    realExternalDelivery: false,
    senderEmail: config.senderEmail,
    message: `Opened Gmail Web (${config.senderEmail}) to send to ${toEmail}. Enter your email password in Mail Settings for silent background SMTP delivery.`,
  };
}

export function useSmtpConfig() {
  const [config, setConfig] = useState<SmtpConfig>(() => getSmtpConfig());
  const [sentLog, setSentLog] = useState<SentEmailRecord[]>(() => getSentEmailsLog());
  const [messages, setMessages] = useState<MailMessage[]>(() => getMailboxMessages());

  const refresh = useCallback(() => {
    setConfig(getSmtpConfig());
    setSentLog(getSentEmailsLog());
    setMessages(getMailboxMessages());
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener('ozostack-smtp-changed', refresh);
    window.addEventListener('ozostack-mailbox-changed', refresh);
    window.addEventListener('ozostack-crm-config-changed', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('ozostack-smtp-changed', refresh);
      window.removeEventListener('ozostack-mailbox-changed', refresh);
      window.removeEventListener('ozostack-crm-config-changed', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [refresh]);

  const updateSmtpConfig = useCallback((partial: Partial<SmtpConfig>) => {
    const next = saveSmtpConfig(partial);
    setConfig(next);
    return next;
  }, []);

  return { config, sentLog, messages, updateSmtpConfig, refresh };
}
