import { useState, useEffect, useCallback } from 'react';

export interface SmtpConfig {
  provider: 'gmail' | 'workspace' | 'office365' | 'hostinger' | 'custom';
  senderName: string;
  senderEmail: string;
  replyToEmail: string;
  host: string;
  port: number;
  encryption: 'TLS' | 'SSL' | 'NONE';
  username: string;
  password: string;
  signature: string;
  enabled: boolean;
  updatedAt: string;
}

export interface SentEmailRecord {
  id: string;
  to: string;
  recipientName?: string;
  from: string;
  subject: string;
  bodyPreview: string;
  status: 'Delivered via SMTP' | 'Opened in Gmail Direct';
  sentAt: string;
}

export const SMTP_STORAGE_KEY = 'ozostack_smtp_config_v1';
export const SENT_EMAILS_STORAGE_KEY = 'ozostack_sent_emails_v1';

export const DEFAULT_SMTP_CONFIG: SmtpConfig = {
  provider: 'gmail',
  senderName: 'OzoStack CRM',
  senderEmail: 'ozostack@gmail.com',
  replyToEmail: 'ozostack@gmail.com',
  host: 'smtp.gmail.com',
  port: 587,
  encryption: 'TLS',
  username: 'ozostack@gmail.com',
  password: '',
  signature: 'Best regards,\nSayed\nOzoStack CRM · https://ozostack.in',
  enabled: true,
  updatedAt: new Date().toISOString(),
};

export function getSmtpConfig(): SmtpConfig {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(SMTP_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          return {
            ...DEFAULT_SMTP_CONFIG,
            ...parsed,
            senderEmail: (parsed.senderEmail || DEFAULT_SMTP_CONFIG.senderEmail).trim(),
            username: (parsed.username || parsed.senderEmail || DEFAULT_SMTP_CONFIG.username).trim(),
            host: (parsed.host || DEFAULT_SMTP_CONFIG.host).trim(),
            port: Number(parsed.port) || 587,
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
  const updated: SmtpConfig = {
    ...current,
    ...partial,
    senderEmail: nextEmail,
    replyToEmail: (partial.replyToEmail ?? nextEmail).trim(),
    username: (partial.username ?? nextEmail).trim(),
    port: Number(partial.port ?? current.port) || 587,
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

export async function sendDirectEmail(params: {
  to: string;
  subject: string;
  body: string;
  recipientName?: string;
  allowGmailFallback?: boolean;
}): Promise<{
  ok: boolean;
  mode: 'smtp' | 'gmail-direct';
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
      senderEmail: config.senderEmail,
      message: 'Recipient email address is required.',
      error: 'Recipient email address is required.',
    };
  }

  // 1. Attempt direct server-side SMTP delivery via /api/send-email
  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: toEmail,
        subject,
        text: body,
        replyTo: config.replyToEmail || config.senderEmail,
        smtpConfig: config,
      }),
    });
    const data = await res.json().catch(() => null);

    if (res.ok && data && data.ok && data.sentViaSmtp) {
      recordSentEmail({
        to: toEmail,
        recipientName: params.recipientName,
        from: config.senderEmail,
        subject,
        bodyPreview: body.slice(0, 140),
        status: 'Delivered via SMTP',
      });
      return {
        ok: true,
        mode: 'smtp',
        senderEmail: config.senderEmail,
        message: `Email sent directly from ${config.senderEmail} to ${toEmail}!`,
      };
    }

    if (!allowFallback) {
      return {
        ok: false,
        mode: 'smtp',
        senderEmail: config.senderEmail,
        message: data?.error || 'Failed to send via SMTP.',
        error: data?.error || 'Failed to send via SMTP.',
      };
    }
  } catch (err: any) {
    if (!allowFallback) {
      return {
        ok: false,
        mode: 'smtp',
        senderEmail: config.senderEmail,
        message: err?.message || 'Network error while connecting to SMTP server.',
        error: err?.message || 'Network error while connecting to SMTP server.',
      };
    }
  }

  // 2. Fallback: Open Gmail Direct Web Compose authenticated as config.senderEmail (ozostack@gmail.com)
  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&tf=1&authuser=${encodeURIComponent(
    config.senderEmail
  )}&to=${encodeURIComponent(toEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(
    body
  )}`;
  window.open(gmailUrl, '_blank', 'noopener,noreferrer');

  recordSentEmail({
    to: toEmail,
    recipientName: params.recipientName,
    from: config.senderEmail,
    subject,
    bodyPreview: body.slice(0, 140),
    status: 'Opened in Gmail Direct',
  });

  return {
    ok: true,
    mode: 'gmail-direct',
    senderEmail: config.senderEmail,
    message: `Opened direct Gmail dispatch from ${config.senderEmail} to ${toEmail}. (Add your SMTP App Password in Settings → Email & SMTP for 1-click silent background delivery).`,
  };
}

export function useSmtpConfig() {
  const [config, setConfig] = useState<SmtpConfig>(getSmtpConfig);
  const [sentLog, setSentLog] = useState<SentEmailRecord[]>(getSentEmailsLog);

  const refresh = useCallback(() => {
    setConfig(getSmtpConfig());
    setSentLog(getSentEmailsLog());
  }, []);

  useEffect(() => {
    window.addEventListener('ozostack-smtp-changed', refresh);
    window.addEventListener('ozostack-crm-config-changed', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('ozostack-smtp-changed', refresh);
      window.removeEventListener('ozostack-crm-config-changed', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [refresh]);

  const updateSmtpConfig = useCallback((partial: Partial<SmtpConfig>) => {
    const next = saveSmtpConfig(partial);
    setConfig(next);
    return next;
  }, []);

  return { config, sentLog, updateSmtpConfig, refresh };
}
