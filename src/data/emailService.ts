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
  verified?: boolean;
  enabled: boolean;
  updatedAt: string;
}

export type MailFolder = 'inbox' | 'sent' | 'drafts' | 'trash';

export interface MailMessage {
  id: string;
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
  to: string;
  recipientName?: string;
  from: string;
  subject: string;
  bodyPreview: string;
  status: 'Delivered via Live SMTP' | 'Opened in Gmail Web';
  sentAt: string;
}

export const SMTP_STORAGE_KEY = 'ozostack_smtp_config_v1';
export const SENT_EMAILS_STORAGE_KEY = 'ozostack_sent_emails_v1';
export const MAILBOX_STORAGE_KEY = 'ozostack_mailbox_messages_v1';

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
    placeholderEmail: 'admin@ozostack.in',
    passwordHint: 'Use your normal @ozostack.in Hostinger email password',
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
    placeholderEmail: 'info@ozostack.in',
    passwordHint: 'Use your normal @ozostack.in Titan email password',
  },
  {
    id: 'gmail',
    label: 'Gmail (ozostack@gmail.com)',
    badge: 'Requires 16-digit App Password',
    host: 'smtp.gmail.com',
    port: 587,
    imapHost: 'imap.gmail.com',
    imapPort: 993,
    encryption: 'TLS',
    placeholderEmail: 'ozostack@gmail.com',
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
    placeholderEmail: 'sayed@ozostack.in',
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
    placeholderEmail: 'contact@ozostack.in',
    passwordHint: 'Use your Zoho Mail password or App Password',
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
    placeholderEmail: 'admin@ozostack.in',
    passwordHint: 'Use your Microsoft 365 password or App Password',
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
    placeholderEmail: 'admin@ozostack.in',
    passwordHint: 'Use your custom mail server password',
  },
];

export const DEFAULT_SMTP_CONFIG: SmtpConfig = {
  provider: 'gmail',
  senderName: 'OzoStack CRM',
  senderEmail: 'ozostack@gmail.com',
  replyToEmail: 'ozostack@gmail.com',
  host: 'smtp.gmail.com',
  port: 587,
  imapHost: 'imap.gmail.com',
  imapPort: 993,
  encryption: 'TLS',
  username: 'ozostack@gmail.com',
  password: '',
  signature: 'Best regards,\nSayed\nOzoStack CRM · https://ozostack.in',
  verified: false,
  enabled: true,
  updatedAt: new Date().toISOString(),
};

export const INITIAL_MAILBOX_MESSAGES: MailMessage[] = [
  {
    id: 'msg-welcome-1',
    folder: 'inbox',
    fromName: 'Vikram Mehta (FinEdge Systems)',
    fromEmail: 'v.mehta@finedge.io',
    toName: 'Sayed',
    toEmail: 'ozostack@gmail.com',
    subject: 'Enterprise AI CRM & Cloud Architecture Proposal Review',
    body: `Hi Sayed,\n\nWe reviewed the OzoStack architecture proposal shared earlier today. Our technical board is ready to proceed with the Phase 1 enterprise rollout.\n\nCould you share the final commercial invoice and kickoff schedule?\n\nBest regards,\nVikram Mehta\nCTO, FinEdge Systems`,
    read: false,
    starred: true,
    deliveryStatus: 'Received',
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
  },
  {
    id: 'msg-welcome-2',
    folder: 'inbox',
    fromName: 'Elena Rostova (TechVision Inc.)',
    fromEmail: 'erostova@techvision.com',
    toName: 'Sayed',
    toEmail: 'ozostack@gmail.com',
    subject: 'Re: Q4 Automation & Custom Stage Pipeline Integration',
    body: `Hello Sayed,\n\nThank you for the demo session. Our operations team loved the bulk lead upload and custom stage workflow. Let's lock in Thursday at 3:00 PM IST for contract sign-off.\n\nWarm regards,\nElena Rostova\nVP of Operations, TechVision Inc.`,
    read: false,
    starred: false,
    deliveryStatus: 'Received',
    timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
];

export function hasRealSmtpPassword(pw?: string): boolean {
  const s = (pw || '').trim();
  return Boolean(s && s !== 'ozo-smtp-connected-v1' && !s.startsWith('••••'));
}

export function getSmtpConfig(): SmtpConfig {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(SMTP_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          const cleanPw =
            parsed.password === 'ozo-smtp-connected-v1' ? '' : (parsed.password || '');
          return {
            ...DEFAULT_SMTP_CONFIG,
            ...parsed,
            senderEmail: (parsed.senderEmail || DEFAULT_SMTP_CONFIG.senderEmail).trim(),
            username: (parsed.username || parsed.senderEmail || DEFAULT_SMTP_CONFIG.username).trim(),
            host: (parsed.host || DEFAULT_SMTP_CONFIG.host).trim(),
            port: Number(parsed.port) || 587,
            imapHost: (parsed.imapHost || DEFAULT_SMTP_CONFIG.imapHost).trim(),
            imapPort: Number(parsed.imapPort) || 993,
            password: cleanPw,
          };
        }
      }
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_SMTP_CONFIG;
}

export function saveSmtpConfig(partial: Partial<SmtpConfig>): SmtpConfig {
  const current = getSmtpConfig();
  const nextEmail = (partial.senderEmail ?? current.senderEmail).trim() || 'ozostack@gmail.com';
  const rawPw = partial.password ?? current.password;
  const cleanPw = rawPw === 'ozo-smtp-connected-v1' ? '' : rawPw.trim();

  const updated: SmtpConfig = {
    ...current,
    ...partial,
    senderEmail: nextEmail,
    replyToEmail: (partial.replyToEmail ?? nextEmail).trim(),
    username: (partial.username ?? nextEmail).trim(),
    port: Number(partial.port ?? current.port) || 587,
    imapPort: Number(partial.imapPort ?? current.imapPort) || 993,
    password: cleanPw,
    updatedAt: new Date().toISOString(),
  };

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(SMTP_STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('ozostack-smtp-changed', { detail: updated }));
      window.dispatchEvent(new CustomEvent('ozostack-crm-config-changed'));
    }
  } catch {
    /* ignore */
  }
  return updated;
}

export function getMailboxMessages(): MailMessage[] {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(MAILBOX_STORAGE_KEY);
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    }
  } catch {
    /* ignore */
  }
  return INITIAL_MAILBOX_MESSAGES;
}

export function saveMailboxMessages(messages: MailMessage[]): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(MAILBOX_STORAGE_KEY, JSON.stringify(messages));
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
  triggerNotification = true
): MailMessage {
  const current = getMailboxMessages();
  const full: MailMessage = {
    ...msg,
    id: msg.id || `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: msg.timestamp || new Date().toISOString(),
  };
  saveMailboxMessages([full, ...current]);

  if (triggerNotification) {
    if (full.folder === 'inbox') {
      addNotification({
        title: `New Email Received: ${full.subject}`,
        subtitle: `From ${full.fromName} <${full.fromEmail}>`,
        type: 'lead',
        read: false,
        targetNav: 'Email',
        targetId: full.id,
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
        priority: 'medium',
      });
    }
  }

  return full;
}

export function getSentEmailsLog(): SentEmailRecord[] {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(SENT_EMAILS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    }
  } catch {
    /* ignore */
  }
  return [];
}

export function recordSentEmail(entry: Omit<SentEmailRecord, 'id' | 'sentAt'>): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const current = getSentEmailsLog();
      const next: SentEmailRecord[] = [
        {
          ...entry,
          id: `mail-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          sentAt: new Date().toISOString(),
        },
        ...current,
      ].slice(0, 100);
      window.localStorage.setItem(SENT_EMAILS_STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent('ozostack-smtp-changed'));
    }
  } catch {
    /* ignore */
  }
}

export function clearSentEmailsLog(): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(SENT_EMAILS_STORAGE_KEY, JSON.stringify([]));
      window.dispatchEvent(new CustomEvent('ozostack-smtp-changed'));
    }
  } catch {
    /* ignore */
  }
}

export async function verifySmtpConnection(
  customConfig?: SmtpConfig
): Promise<{ ok: boolean; verified: boolean; message: string }> {
  const cfg = customConfig || getSmtpConfig();
  try {
    const res = await fetch('/api/verify-smtp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ smtpConfig: cfg }),
    });
    const data = await res.json().catch(() => null);
    if (res.ok && data && data.ok && data.verified) {
      saveSmtpConfig({ ...cfg, verified: true });
      return {
        ok: true,
        verified: true,
        message: data.message || `Live SMTP Verified on ${cfg.host}:${cfg.port}!`,
      };
    }
    saveSmtpConfig({ ...cfg, verified: false });
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
  const cfg = customConfig || getSmtpConfig();
  try {
    const res = await fetch('/api/sync-inbox', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ smtpConfig: cfg }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data || !data.ok) {
      return {
        ok: false,
        newCount: 0,
        totalFetched: 0,
        message:
          data?.error ||
          'IMAP sync requires a valid Domain Mail (@ozostack.in) password or 16-digit Gmail App Password.',
      };
    }

    const incoming: MailMessage[] = Array.isArray(data.messages) ? data.messages : [];
    const existing = getMailboxMessages();
    const existingIds = new Set(existing.map((m) => m.id));
    const existingMsgIds = new Set(existing.map((m) => m.messageId).filter(Boolean));

    const fresh: MailMessage[] = [];
    for (const item of incoming) {
      if (!existingIds.has(item.id) && (!item.messageId || !existingMsgIds.has(item.messageId))) {
        fresh.push(item);
      }
    }

    if (fresh.length > 0) {
      saveMailboxMessages([...fresh, ...existing]);
      fresh.slice(0, 3).forEach((m) => {
        addNotification({
          title: `New Email Received: ${m.subject}`,
          subtitle: `From ${m.fromName} <${m.fromEmail}>`,
          type: 'lead',
          read: false,
          targetNav: 'Email',
          targetId: m.id,
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
          ? `Synced ${fresh.length} new incoming email(s) from ${data.imapHost}!`
          : `Inbox is up to date (${incoming.length} emails checked on ${data.imapHost}).`,
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
  const fromEmail = params.from || getSmtpConfig().senderEmail;
  let gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&tf=1&authuser=${encodeURIComponent(
    fromEmail
  )}&to=${encodeURIComponent(params.to)}&su=${encodeURIComponent(
    params.subject
  )}&body=${encodeURIComponent(params.body)}`;
  if (params.cc) gmailUrl += `&cc=${encodeURIComponent(params.cc)}`;
  if (params.bcc) gmailUrl += `&bcc=${encodeURIComponent(params.bcc)}`;
  window.open(gmailUrl, '_blank', 'noopener,noreferrer');
}

export async function sendDirectEmail(params: {
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  body: string;
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
  const config = getSmtpConfig();
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

  let serverError = '';

  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: toEmail,
        cc: params.cc,
        bcc: params.bcc,
        subject,
        text: body,
        replyTo: config.replyToEmail || config.senderEmail,
        smtpConfig: config,
      }),
    });
    const data = await res.json().catch(() => null);

    if (res.ok && data && data.ok && data.realExternalDelivery) {
      saveSmtpConfig({ ...config, verified: true });

      recordSentEmail({
        to: toEmail,
        recipientName: params.recipientName,
        from: config.senderEmail,
        subject,
        bodyPreview: body.slice(0, 140),
        status: 'Delivered via Live SMTP',
      });

      addMailboxMessage(
        {
          folder: 'sent',
          fromName: config.senderName || 'OzoStack CRM',
          fromEmail: config.senderEmail,
          toName: params.recipientName || toEmail.split('@')[0],
          toEmail,
          cc: params.cc,
          bcc: params.bcc,
          subject,
          body,
          read: true,
          starred: false,
          deliveryStatus: 'Delivered via Live SMTP',
        },
        true
      );

      if (toEmail.toLowerCase() === config.senderEmail.toLowerCase()) {
        addMailboxMessage(
          {
            folder: 'inbox',
            fromName: config.senderName || 'OzoStack CRM',
            fromEmail: config.senderEmail,
            toName: config.senderName,
            toEmail,
            subject,
            body,
            read: false,
            starred: false,
            deliveryStatus: 'Received',
          },
          true
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

  recordSentEmail({
    to: toEmail,
    recipientName: params.recipientName,
    from: config.senderEmail,
    subject,
    bodyPreview: body.slice(0, 140),
    status: 'Opened in Gmail Web',
  });

  addMailboxMessage(
    {
      folder: 'sent',
      fromName: config.senderName || 'OzoStack CRM',
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
    true
  );

  return {
    ok: true,
    mode: 'gmail-direct',
    realExternalDelivery: false,
    senderEmail: config.senderEmail,
    message: `Opened Gmail Web (${config.senderEmail}) to send to ${toEmail}. For 1-click silent background delivery without opening Gmail, enter your @ozostack.in Domain Mail password or 16-digit Gmail App Password in Mail Settings.`,
  };
}

export function useSmtpConfig() {
  const [config, setConfig] = useState<SmtpConfig>(getSmtpConfig);
  const [sentLog, setSentLog] = useState<SentEmailRecord[]>(getSentEmailsLog);
  const [messages, setMessages] = useState<MailMessage[]>(getMailboxMessages);

  const refresh = useCallback(() => {
    setConfig(getSmtpConfig());
    setSentLog(getSentEmailsLog());
    setMessages(getMailboxMessages());
  }, []);

  useEffect(() => {
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
