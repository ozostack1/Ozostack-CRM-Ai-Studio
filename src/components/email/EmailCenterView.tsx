import React, { useState, useMemo, useEffect } from 'react';
import {
  Mail,
  Inbox,
  Send,
  Star,
  FileText,
  Trash2,
  Plus,
  RefreshCw,
  Search,
  Settings,
  CheckCircle2,
  AlertCircle,
  Reply,
  Forward,
  MailOpen,
  ExternalLink,
  Bell,
  Eye,
  EyeOff,
  X,
  Globe,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import {
  useSmtpConfig,
  MailMessage,
  MailFolder,
  MAIL_PROVIDER_PRESETS,
  SmtpConfig,
  sendDirectEmail,
  syncInboxViaImap,
  verifySmtpConnection,
  saveMailboxMessages,
  addMailboxMessage,
  openGmailDirectCompose,
  hasRealSmtpPassword,
} from '../../data/emailService';
import { INITIAL_LEADS, INITIAL_CONTACTS } from '../../data/mockData';
import { DEFAULT_TEMPLATES, LeadMessageTemplate } from '../leads/LeadActionModal';

/**
 * Cleans plain-text fallback strings that contain giant tracking URLs in angle brackets
 * e.g. <https://www.vistaprint.in/...> so snippets and plain-text views look clean.
 */
function formatCleanPlainText(raw?: string): string {
  if (!raw) return '';
  return raw
    .replace(/<(https?:\/\/[^>]+)>/g, (_, url: string) => {
      try {
        const u = new URL(url);
        return `(${u.hostname})`;
      } catch {
        return '';
      }
    })
    .replace(/https?:\/\/\S{70,}/g, (url: string) => {
      try {
        const u = new URL(url);
        return `${u.origin}/...`;
      } catch {
        return url;
      }
    })
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Renders an email's original HTML design (images, tables, buttons, styling) inside an isolated
 * auto-sizing iframe, identical to how Gmail & modern webmail clients render original HTML emails.
 */
const OriginalEmailHtmlViewer: React.FC<{ html: string; plainText?: string }> = ({
  html,
  plainText,
}) => {
  const [iframeHeight, setIframeHeight] = useState<number>(480);
  const [viewMode, setViewMode] = useState<'html' | 'text'>('html');

  const preparedSrcDoc = useMemo(() => {
    const baseStyle = `
      <base target="_blank" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <style>
        html, body {
          margin: 0;
          padding: 12px 16px;
          background-color: #ffffff;
          color: #0f172a;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          font-size: 14px;
          line-height: 1.6;
          word-break: break-word;
          overflow-x: auto;
        }
        img {
          max-width: 100% !important;
          height: auto !important;
        }
        table {
          max-width: 100% !important;
        }
        a {
          color: #0284c7;
        }
      </style>
    `;
    if (/<head[\s>]/i.test(html)) {
      return html.replace(/<head([^>]*)>/i, `<head$1>${baseStyle}`);
    }
    return `<!DOCTYPE html><html><head>${baseStyle}</head><body>${html}</body></html>`;
  }, [html]);

  return (
    <div className="flex flex-col">
      <div className="px-5 py-1.5 bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
        <span className="text-slate-400 font-medium">
          Viewing in {viewMode === 'html' ? 'Original HTML Design' : 'Clean Text Format'}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setViewMode('html')}
            className={`px-2 py-0.5 rounded font-bold cursor-pointer ${
              viewMode === 'html'
                ? 'bg-sky-500 text-white'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            Original View
          </button>
          <button
            type="button"
            onClick={() => setViewMode('text')}
            className={`px-2 py-0.5 rounded font-bold cursor-pointer ${
              viewMode === 'text'
                ? 'bg-sky-500 text-white'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            Plain Text
          </button>
        </div>
      </div>

      {viewMode === 'html' ? (
        <div className="w-full bg-white overflow-y-auto max-h-[520px] border-b border-slate-100 dark:border-slate-800">
          <iframe
            title="Original Email Content"
            srcDoc={preparedSrcDoc}
            sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
            style={{ width: '100%', height: `${iframeHeight}px`, border: 'none', display: 'block' }}
            onLoad={(e) => {
              try {
                const doc = e.currentTarget.contentDocument || e.currentTarget.contentWindow?.document;
                if (doc && doc.documentElement) {
                  const h = Math.max(
                    doc.documentElement.scrollHeight || 0,
                    doc.body?.scrollHeight || 0,
                    360
                  );
                  setIframeHeight(Math.min(h + 24, 2400));
                }
              } catch {
                /* cross-origin fallback */
              }
            }}
          />
        </div>
      ) : (
        <div className="p-5 text-xs sm:text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap break-words leading-relaxed max-h-[460px] overflow-y-auto">
          {formatCleanPlainText(plainText)}
        </div>
      )}
    </div>
  );
};

export const EmailCenterView: React.FC = () => {
  const { theme } = useTheme();
  const { currentUser, scopeFilter } = useAuth();
  const isLight = theme === 'white-sky';
  const { config, messages, updateSmtpConfig } = useSmtpConfig();

  const isEmailConfigured = Boolean(config.senderEmail && config.senderEmail.includes('@'));
  const isPasswordConfigured = hasRealSmtpPassword(config.password);

  const [activeFolder, setActiveFolder] = useState<'inbox' | 'sent' | 'starred' | 'drafts' | 'trash'>('inbox');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'unread'>('all');
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(
    messages.find((m) => m.folder === 'inbox')?.id || messages[0]?.id || null
  );

  // Compose Modal State
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeTo, setComposeTo] = useState('');
  const [composeCc, setComposeCc] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Quick Reply State inside Reading Pane
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);

  // IMAP Sync & SMTP Config Drawer State (Auto-open if user hasn't configured their own email yet)
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(!isEmailConfigured);
  const [smtpForm, setSmtpForm] = useState<SmtpConfig>(config);
  const [showPw, setShowPw] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyNotice, setVerifyNotice] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    setSmtpForm(config);
    if (!config.senderEmail || !config.senderEmail.includes('@')) {
      setIsSettingsOpen(true);
    }
  }, [config.ownerUserId, config.senderEmail]);

  // In-page Toast / Notification Banner
  const [bannerAlert, setBannerAlert] = useState<{
    type: 'sent' | 'received' | 'info' | 'error';
    title: string;
    subtitle: string;
  } | null>(null);

  const showBanner = (
    type: 'sent' | 'received' | 'info' | 'error',
    title: string,
    subtitle: string
  ) => {
    setBannerAlert({ type, title, subtitle });
    setTimeout(() => {
      setBannerAlert((prev) => (prev?.title === title ? null : prev));
    }, 6000);
  };

  // CRM Leads & Contacts scoped to current user
  const crmRecipients = useMemo(() => {
    const list: { name: string; email: string; company: string }[] = [];
    const seen = new Set<string>();
    const add = (name?: string, email?: string, company?: string) => {
      const e = (email || '').trim();
      if (!e || !e.includes('@') || seen.has(e.toLowerCase())) return;
      seen.add(e.toLowerCase());
      list.push({ name: name || e.split('@')[0], email: e, company: company || 'CRM' });
    };

    try {
      const rawLeads = localStorage.getItem('ozostack_leads_v2');
      const leads = rawLeads ? JSON.parse(rawLeads) : INITIAL_LEADS;
      if (Array.isArray(leads)) {
        const scoped = scopeFilter(leads, (l: any) => ({ owner: l.owner }));
        scoped.forEach((l: any) => add(l.name, l.email, l.company));
      }
    } catch {}

    try {
      const rawContacts = localStorage.getItem('ozostack_contacts_v1');
      const contacts = rawContacts ? JSON.parse(rawContacts) : INITIAL_CONTACTS;
      if (Array.isArray(contacts)) {
        const scoped = scopeFilter(contacts, (c: any) => ({ owner: c.owner }));
        scoped.forEach((c: any) => add(c.name, c.email, c.company));
      }
    } catch {}

    return list;
  }, [scopeFilter]);

  // Load templates
  const templates = useMemo<LeadMessageTemplate[]>(() => {
    try {
      const saved = localStorage.getItem('ozostack_lead_message_templates');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_TEMPLATES;
  }, []);

  // Folder counts (strictly for the signed-in user's mailbox)
  const counts = useMemo(() => {
    const inboxAll = messages.filter((m) => m.folder === 'inbox');
    return {
      inboxTotal: inboxAll.length,
      inboxUnread: inboxAll.filter((m) => !m.read).length,
      sent: messages.filter((m) => m.folder === 'sent').length,
      starred: messages.filter((m) => m.starred && m.folder !== 'trash').length,
      drafts: messages.filter((m) => m.folder === 'drafts').length,
      trash: messages.filter((m) => m.folder === 'trash').length,
    };
  }, [messages]);

  // Filtered messages for current folder
  const filteredMessages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return messages.filter((m) => {
      if (activeFolder === 'starred') {
        if (!m.starred || m.folder === 'trash') return false;
      } else if (m.folder !== activeFolder) {
        return false;
      }

      if (filterMode === 'unread' && m.read) return false;

      if (q) {
        return (
          m.subject.toLowerCase().includes(q) ||
          m.fromName.toLowerCase().includes(q) ||
          m.fromEmail.toLowerCase().includes(q) ||
          m.toEmail.toLowerCase().includes(q) ||
          m.body.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [messages, activeFolder, filterMode, searchQuery]);

  const selectedMessage = useMemo(
    () => messages.find((m) => m.id === selectedMessageId) || filteredMessages[0] || null,
    [messages, selectedMessageId, filteredMessages]
  );

  const handleSelectMessage = (msg: MailMessage) => {
    setSelectedMessageId(msg.id);
    setReplyText('');
    if (!msg.read) {
      const updated = messages.map((m) => (m.id === msg.id ? { ...m, read: true } : m));
      saveMailboxMessages(updated);
    }
  };

  const handleToggleStar = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const updated = messages.map((m) => (m.id === id ? { ...m, starred: !m.starred } : m));
    saveMailboxMessages(updated);
  };

  const handleToggleRead = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const updated = messages.map((m) => (m.id === id ? { ...m, read: !m.read } : m));
    saveMailboxMessages(updated);
  };

  const handleDeleteMessage = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const target = messages.find((m) => m.id === id);
    if (!target) return;
    if (target.folder === 'trash') {
      const next = messages.filter((m) => m.id !== id);
      saveMailboxMessages(next);
      showBanner('info', 'Message Deleted Permanently', `"${target.subject}" was removed.`);
    } else {
      const next = messages.map((m) =>
        m.id === id ? { ...m, folder: 'trash' as MailFolder } : m
      );
      saveMailboxMessages(next);
      showBanner('info', 'Moved to Trash', `"${target.subject}" moved to Trash.`);
    }
  };

  // Sync live IMAP inbox
  const handleSyncInbox = async () => {
    if (!isEmailConfigured) {
      setIsSettingsOpen(true);
      showBanner(
        'error',
        'Set Up Your Email First',
        'Please enter your personal/domain email address and password below to sync your inbox.'
      );
      return;
    }
    setIsSyncing(true);
    try {
      const res = await syncInboxViaImap(config);
      if (res.ok) {
        showBanner(
          res.newCount > 0 ? 'received' : 'info',
          res.newCount > 0 ? `New Mail Received (${res.newCount})` : 'Inbox Synced',
          res.message
        );
      } else {
        showBanner('error', 'IMAP Sync Notice', res.message);
        setIsSettingsOpen(true);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Receive test incoming mail into the signed-in user's private inbox
  const handleReceiveTestInboundMail = () => {
    const targetEmail = config.senderEmail || currentUser?.email || 'my-inbox@ozostack.in';
    const senders = [
      {
        name: 'Rohan Kapoor (Apex Global)',
        email: 'rohan.kapoor@apexglobal.in',
        subject: `Project & Commercial Inquiry for ${currentUser?.name || 'OzoStack'}`,
        body: `Hello ${currentUser?.name || 'there'},\n\nWe would like to schedule an implementation call this week regarding our enterprise CRM rollout.\n\nPlease share your available time slots.\n\nRegards,\nRohan Kapoor\nManaging Director, Apex Global`,
      },
      {
        name: 'Ananya Deshmukh (CloudScale Labs)',
        email: 'ananya@cloudscalelabs.io',
        subject: 'Proposal Approval & Next Steps',
        body: `Hi ${currentUser?.name || 'Team'},\n\nOur team reviewed the scope and approved the proposal. Let us know the next steps to begin onboarding.\n\nBest,\nAnanya Deshmukh`,
      },
    ];
    const pick = senders[Math.floor(Math.random() * senders.length)];
    const msg = addMailboxMessage(
      {
        folder: 'inbox',
        fromName: pick.name,
        fromEmail: pick.email,
        toName: currentUser?.name || config.senderName,
        toEmail: targetEmail,
        subject: pick.subject,
        body: pick.body,
        read: false,
        starred: false,
        deliveryStatus: 'Received',
      },
      true
    );
    setActiveFolder('inbox');
    setSelectedMessageId(msg.id);
    showBanner(
      'received',
      `New Email Received in Your Inbox (${targetEmail})`,
      `${pick.subject} — Notification added to your Notification Bell!`
    );
  };

  // Send New Compose Email
  const handleSendCompose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeTo.trim()) return;
    if (!isEmailConfigured) {
      setIsComposeOpen(false);
      setIsSettingsOpen(true);
      showBanner(
        'error',
        'Set Up Your Email First',
        'Please configure your own email address in "My Email & SMTP Setup" below before sending.'
      );
      return;
    }

    setIsSending(true);
    try {
      const fullBody =
        config.signature && !composeBody.includes(config.signature)
          ? `${composeBody}\n\n${config.signature}`
          : composeBody;

      const res = await sendDirectEmail({
        to: composeTo.trim(),
        cc: composeCc.trim() || undefined,
        subject: composeSubject.trim() || 'Message from OzoStack CRM',
        body: fullBody,
        allowGmailFallback: true,
      });

      setIsComposeOpen(false);
      setComposeTo('');
      setComposeCc('');
      setComposeSubject('');
      setComposeBody('');
      setActiveFolder('sent');

      if (res.realExternalDelivery) {
        showBanner('sent', 'Email Delivered via Live SMTP', res.message);
      } else {
        showBanner('info', 'Opened Gmail Web & Logged in Your Sent Mail', res.message);
      }
    } finally {
      setIsSending(false);
    }
  };

  // Save as Draft
  const handleSaveDraft = () => {
    if (!composeSubject.trim() && !composeBody.trim()) return;
    const draft = addMailboxMessage(
      {
        folder: 'drafts',
        fromName: config.senderName || currentUser?.name || 'Me',
        fromEmail: config.senderEmail || currentUser?.email || '',
        toEmail: composeTo.trim() || '(No Recipient)',
        cc: composeCc.trim() || undefined,
        subject: composeSubject.trim() || '(Draft — No Subject)',
        body: composeBody,
        read: true,
        starred: false,
        deliveryStatus: 'Draft',
      },
      false
    );
    setIsComposeOpen(false);
    setActiveFolder('drafts');
    setSelectedMessageId(draft.id);
    showBanner('info', 'Saved to Your Drafts', `"${draft.subject}" saved in Drafts.`);
  };

  // Quick Reply from Reading Pane
  const handleSendQuickReply = async () => {
    if (!selectedMessage || !replyText.trim()) return;
    if (!isEmailConfigured) {
      setIsSettingsOpen(true);
      showBanner(
        'error',
        'Set Up Your Email First',
        'Please configure your own email address and password before replying.'
      );
      return;
    }
    setIsReplying(true);
    try {
      const replyTarget =
        selectedMessage.folder === 'sent' ? selectedMessage.toEmail : selectedMessage.fromEmail;
      const replySubject = selectedMessage.subject.toLowerCase().startsWith('re:')
        ? selectedMessage.subject
        : `Re: ${selectedMessage.subject}`;
      const fullBody = `${replyText.trim()}\n\n${config.signature}\n\n--- On ${new Date(
        selectedMessage.timestamp
      ).toLocaleString()}, ${selectedMessage.fromName} <${selectedMessage.fromEmail}> wrote: ---\n${
        selectedMessage.body
      }`;

      const res = await sendDirectEmail({
        to: replyTarget,
        subject: replySubject,
        body: fullBody,
        recipientName: selectedMessage.fromName,
        allowGmailFallback: true,
      });

      setReplyText('');
      if (res.realExternalDelivery) {
        showBanner('sent', `Reply Delivered to ${replyTarget}`, res.message);
      } else {
        showBanner('info', `Reply Opened in Gmail Web (${replyTarget})`, res.message);
      }
    } finally {
      setIsReplying(false);
    }
  };

  // Save & Verify Domain Mail / SMTP Settings
  const handleSaveAndVerifySmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smtpForm.senderEmail.trim() || !smtpForm.senderEmail.includes('@')) {
      showBanner('error', 'Email Required', 'Please enter your valid email address.');
      return;
    }
    const saved = updateSmtpConfig(smtpForm);
    setSmtpForm(saved);
    setIsVerifying(true);
    setVerifyNotice(null);
    try {
      const v = await verifySmtpConnection(saved);
      setVerifyNotice({ ok: v.verified, text: v.message });
      if (v.verified) {
        showBanner(
          'sent',
          `Connected & Verified: ${saved.senderEmail}`,
          `Live SMTP & IMAP active on ${saved.host}:${saved.port}`
        );
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const cardBg = isLight
    ? 'bg-white border-sky-100/90 shadow-xs'
    : 'bg-[#0f172a]/95 border-slate-800';
  const inputCls = `w-full px-3 py-2 rounded-xl border text-xs font-medium outline-none ${
    isLight
      ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-sky-500 focus:bg-white'
      : 'bg-slate-900 border-slate-700 text-white focus:border-sky-400'
  }`;

  return (
    <div className="space-y-4">
      {/* =================================================================== */}
      {/* IN-PAGE LIVE SENT / RECEIVED NOTIFICATION BANNER                    */}
      {/* =================================================================== */}
      {bannerAlert && (
        <div
          className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 shadow-lg animate-fade-in ${
            bannerAlert.type === 'received'
              ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-600 dark:text-indigo-300'
              : bannerAlert.type === 'sent'
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
              : bannerAlert.type === 'error'
              ? 'bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-300'
              : 'bg-sky-500/15 border-sky-500/40 text-sky-700 dark:text-sky-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10">
              {bannerAlert.type === 'received' ? (
                <Bell className="w-4 h-4 animate-bounce" />
              ) : bannerAlert.type === 'sent' ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
            </div>
            <div>
              <div className="text-xs font-extrabold">{bannerAlert.title}</div>
              <div className="text-[11px] opacity-90">{bannerAlert.subtitle}</div>
            </div>
          </div>
          <button
            onClick={() => setBannerAlert(null)}
            className="p-1 rounded-lg hover:bg-black/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* =================================================================== */}
      {/* TOP HEADER: PERSONAL MAILBOX, DOMAIN MAIL SETUP & SYNC CONTROLS     */}
      {/* =================================================================== */}
      <div className={`p-4 sm:p-5 rounded-2xl border ${cardBg}`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-sky-500/20 shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                  {currentUser?.name || 'My'} — Personal Mail &amp; Inbox
                </h1>
                {isEmailConfigured ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30">
                    Connected: {config.senderEmail}
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    No Email Configured Yet
                  </span>
                )}
                {isEmailConfigured && isPasswordConfigured && config.verified ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Live SMTP &amp; IMAP Active</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setSmtpForm(config);
                      setIsSettingsOpen(true);
                    }}
                    className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-500 border border-sky-500/30 hover:bg-sky-500/25 transition-colors cursor-pointer"
                  >
                    ⚙️ Connect Your Own Email &amp; Password
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>
                  <strong>100% Private Mailbox:</strong> Only you ({currentUser?.name}) can see your configured email address, inbox, and sent messages.
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleReceiveTestInboundMail}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                isLight
                  ? 'border-indigo-200 bg-indigo-50/70 text-indigo-700 hover:bg-indigo-100'
                  : 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20'
              }`}
              title="Simulate receiving an incoming email in your private inbox"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Test Incoming Mail Alert</span>
            </button>

            <button
              type="button"
              onClick={handleSyncInbox}
              disabled={isSyncing}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                isLight
                  ? 'border-sky-200 bg-white text-slate-700 hover:bg-sky-50'
                  : 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 text-sky-500 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing IMAP...' : 'Sync My Inbox'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSmtpForm(config);
                setIsSettingsOpen((prev) => !prev);
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                isSettingsOpen
                  ? 'bg-sky-500/15 border-sky-500 text-sky-500'
                  : isLight
                  ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  : 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>My Email &amp; SMTP Setup</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (!isEmailConfigured) {
                  setIsSettingsOpen(true);
                  showBanner(
                    'info',
                    'Set Up Your Email First',
                    'Enter your email address and password below to start sending and receiving emails.'
                  );
                  return;
                }
                setComposeTo('');
                setComposeCc('');
                setComposeSubject('');
                setComposeBody('');
                setIsComposeOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 shadow-md shadow-sky-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Compose Email</span>
            </button>
          </div>
        </div>

        {/* =================================================================== */}
        {/* PER-USER EMAIL & DOMAIN MAIL (@ozostack.in / GMAIL) SETUP DRAWER    */}
        {/* =================================================================== */}
        {isSettingsOpen && (
          <form
            onSubmit={handleSaveAndVerifySmtp}
            autoComplete="off"
            className="mt-4 pt-4 border-t border-slate-200/80 dark:border-slate-800 space-y-4 animate-fade-in"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Globe className="w-4 h-4 text-sky-500" />
                  <span>Set Up Your Personal or Domain Email ({currentUser?.name})</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Connect your own <code>@ozostack.in</code> Domain Mail or personal Gmail account. Your credentials and emails are visible only to you.
                </p>
              </div>
              {isEmailConfigured && (
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-white self-end sm:self-auto"
                >
                  Close Setup ✕
                </button>
              )}
            </div>

            {/* Provider Presets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {MAIL_PROVIDER_PRESETS.slice(0, 4).map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() =>
                    setSmtpForm((prev) => ({
                      ...prev,
                      provider: preset.id,
                      host: preset.host,
                      port: preset.port,
                      imapHost: preset.imapHost,
                      imapPort: preset.imapPort,
                      encryption: preset.encryption,
                    }))
                  }
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    smtpForm.provider === preset.id
                      ? 'border-sky-500 bg-sky-500/10 ring-2 ring-sky-500/20'
                      : isLight
                      ? 'border-slate-200 bg-slate-50/70 hover:bg-sky-50/50'
                      : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800'
                  }`}
                >
                  <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                    {preset.label}
                  </div>
                  <div className="text-[10px] text-sky-500 font-bold mt-0.5">{preset.badge}</div>
                  <div className="text-[10px] text-slate-400 mt-1 font-mono">
                    SMTP: {preset.host}:{preset.port}
                  </div>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="font-bold block mb-1">
                  Your Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  autoComplete="off"
                  value={smtpForm.senderEmail}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSmtpForm((prev) => ({
                      ...prev,
                      senderEmail: val,
                      username: val,
                      replyToEmail: val,
                    }));
                  }}
                  placeholder="yourname@ozostack.in or yourname@gmail.com"
                  className={inputCls}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold">
                    Your Email Password / App Password <span className="text-rose-500">*</span>
                  </label>
                  {smtpForm.host.includes('gmail.com') && (
                    <a
                      href="https://myaccount.google.com/apppasswords"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-bold text-sky-500 hover:underline flex items-center gap-0.5"
                    >
                      <span>Get App Password</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={smtpForm.password}
                    onChange={(e) => setSmtpForm({ ...smtpForm, password: e.target.value })}
                    placeholder={
                      smtpForm.host.includes('gmail.com')
                        ? '16-digit Gmail App Password'
                        : 'Your @ozostack.in email password'
                    }
                    className={`${inputCls} pr-9`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-sky-500"
                  >
                    {showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">SMTP Server &amp; Port</label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={smtpForm.host}
                    onChange={(e) => setSmtpForm({ ...smtpForm, host: e.target.value })}
                    placeholder="smtp.hostinger.com"
                    className={`${inputCls} flex-1`}
                  />
                  <input
                    type="number"
                    value={smtpForm.port}
                    onChange={(e) => setSmtpForm({ ...smtpForm, port: Number(e.target.value) || 465 })}
                    className={`${inputCls} w-20`}
                  />
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">IMAP Server &amp; Port (Inbox)</label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={smtpForm.imapHost}
                    onChange={(e) => setSmtpForm({ ...smtpForm, imapHost: e.target.value })}
                    placeholder="imap.hostinger.com"
                    className={`${inputCls} flex-1`}
                  />
                  <input
                    type="number"
                    value={smtpForm.imapPort}
                    onChange={(e) =>
                      setSmtpForm({ ...smtpForm, imapPort: Number(e.target.value) || 993 })
                    }
                    className={`${inputCls} w-20`}
                  />
                </div>
              </div>
            </div>

            {verifyNotice && (
              <div
                className={`p-3 rounded-xl border text-xs font-semibold flex items-start gap-2 ${
                  verifyNotice.ok
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
                }`}
              >
                {verifyNotice.ok ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <span>{verifyNotice.text}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <p className="text-[11px] text-slate-400">
                🔒 Your email configuration is linked strictly to your user ID (<strong>{currentUser?.email}</strong>).
              </p>
              <button
                type="submit"
                disabled={isVerifying}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white text-xs font-extrabold shadow-md shadow-sky-500/20 transition-all cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {isVerifying ? 'Verifying Live SMTP...' : 'Save & Connect My Email'}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* =================================================================== */}
      {/* 3-PANE MAIL WORKSPACE: FOLDERS | MESSAGE LIST | READING & REPLY     */}
      {/* =================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[620px]">
        {/* LEFT PANE: FOLDERS & MAILBOX SUMMARY (2 cols) */}
        <div className={`lg:col-span-2 p-3.5 rounded-2xl border flex flex-col justify-between ${cardBg}`}>
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => {
                if (!isEmailConfigured) {
                  setIsSettingsOpen(true);
                  return;
                }
                setIsComposeOpen(true);
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-extrabold shadow-md shadow-sky-500/20 mb-3 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Email</span>
            </button>

            {[
              {
                id: 'inbox',
                label: 'My Inbox',
                icon: Inbox,
                badge: counts.inboxUnread > 0 ? counts.inboxUnread : counts.inboxTotal,
                highlight: counts.inboxUnread > 0,
              },
              { id: 'sent', label: 'Sent Mail', icon: Send, badge: counts.sent },
              { id: 'starred', label: 'Starred', icon: Star, badge: counts.starred },
              { id: 'drafts', label: 'Drafts', icon: FileText, badge: counts.drafts },
              { id: 'trash', label: 'Trash', icon: Trash2, badge: counts.trash },
            ].map((f) => {
              const Icon = f.icon;
              const active = activeFolder === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setActiveFolder(f.id as any)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    active
                      ? 'bg-sky-500 text-white shadow-xs'
                      : isLight
                      ? 'text-slate-700 hover:bg-sky-50'
                      : 'text-slate-300 hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{f.label}</span>
                  </div>
                  {f.badge > 0 && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                        active
                          ? 'bg-white text-sky-600'
                          : f.highlight
                          ? 'bg-sky-500 text-white'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {f.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-[11px]">
            <div className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
              My Connected Mail
            </div>
            <div className="font-bold text-slate-800 dark:text-slate-200 truncate">
              {config.senderEmail || 'Not configured yet'}
            </div>
            {isEmailConfigured && (
              <>
                <div className="text-[10px] text-slate-400 font-mono truncate">
                  SMTP: {config.host}:{config.port}
                </div>
                <div className="text-[10px] text-slate-400 font-mono truncate">
                  IMAP: {config.imapHost}:{config.imapPort}
                </div>
              </>
            )}
          </div>
        </div>

        {/* MIDDLE PANE: MESSAGE LIST & SEARCH (4 cols) */}
        <div className={`lg:col-span-4 rounded-2xl border flex flex-col overflow-hidden ${cardBg}`}>
          <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {activeFolder} ({filteredMessages.length})
              </h3>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setFilterMode('all')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                    filterMode === 'all'
                      ? 'bg-sky-500 text-white'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('unread')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                    filterMode === 'unread'
                      ? 'bg-sky-500 text-white'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Unread ({counts.inboxUnread})
                </button>
              </div>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search your emails..."
                className={`${inputCls} pl-8 py-1.5`}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 max-h-[540px]">
            {filteredMessages.length === 0 ? (
              <div className="py-16 px-4 text-center space-y-2">
                <Mail className="w-8 h-8 text-slate-400 mx-auto opacity-50" />
                <p className="text-xs font-bold text-slate-500">
                  Your {activeFolder} folder is empty
                </p>
                <p className="text-[11px] text-slate-400">
                  {isEmailConfigured
                    ? 'Click "Sync My Inbox" to fetch incoming emails or "Compose Email" to send a message.'
                    : 'Set up your personal or domain email above to start sending and receiving emails.'}
                </p>
              </div>
            ) : (
              filteredMessages.map((msg) => {
                const isSelected = selectedMessage?.id === msg.id;
                const displayParty =
                  msg.folder === 'sent' ? `To: ${msg.toEmail}` : msg.fromName || msg.fromEmail;

                return (
                  <div
                    key={msg.id}
                    onClick={() => handleSelectMessage(msg)}
                    className={`p-3.5 cursor-pointer transition-colors ${
                      isSelected
                        ? isLight
                          ? 'bg-sky-50/90 border-l-4 border-l-sky-500'
                          : 'bg-sky-500/10 border-l-4 border-l-sky-400'
                        : !msg.read
                        ? isLight
                          ? 'bg-sky-50/30 hover:bg-slate-50'
                          : 'bg-slate-800/40 hover:bg-slate-800/70'
                        : isLight
                        ? 'hover:bg-slate-50'
                        : 'hover:bg-slate-800/30'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {!msg.read && (
                          <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
                        )}
                        <span
                          className={`text-xs truncate ${
                            !msg.read
                              ? 'font-extrabold text-slate-900 dark:text-white'
                              : 'font-semibold text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {displayParty}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] text-slate-400">
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleToggleStar(msg.id, e)}
                          className="text-slate-400 hover:text-amber-400"
                        >
                          <Star
                            className={`w-3.5 h-3.5 ${
                              msg.starred ? 'fill-amber-400 text-amber-400' : ''
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    <div
                      className={`text-xs truncate mb-1 ${
                        !msg.read
                          ? 'font-bold text-slate-900 dark:text-white'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {msg.subject}
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] text-slate-400 truncate flex-1">
                        {formatCleanPlainText(msg.body).replace(/\s+/g, ' ').slice(0, 75)}
                      </p>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold shrink-0 ${
                          msg.deliveryStatus === 'Delivered via Live SMTP'
                            ? 'bg-emerald-500/15 text-emerald-500'
                            : msg.deliveryStatus === 'Opened in Gmail Web'
                            ? 'bg-sky-500/15 text-sky-500'
                            : 'bg-indigo-500/15 text-indigo-400'
                        }`}
                      >
                        {msg.deliveryStatus}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANE: FULL EMAIL READING PANE & DIRECT REPLY (6 cols) */}
        <div className={`lg:col-span-6 rounded-2xl border flex flex-col justify-between overflow-hidden ${cardBg}`}>
          {!selectedMessage ? (
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center space-y-2">
              <MailOpen className="w-10 h-10 text-slate-400 opacity-40" />
              <h3 className="text-sm font-extrabold text-slate-600 dark:text-slate-300">
                Select an email to read or reply
              </h3>
              <p className="text-xs text-slate-400 max-w-xs">
                {isEmailConfigured
                  ? 'Choose any message from your Inbox or Sent folder, or click "Compose Email" to send a new message.'
                  : 'Connect your personal or @ozostack.in domain email above to start managing your inbox.'}
              </p>
            </div>
          ) : (
            <>
              <div>
                {/* Reading Toolbar */}
                <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        selectedMessage.deliveryStatus === 'Delivered via Live SMTP'
                          ? 'bg-emerald-500/15 text-emerald-500'
                          : selectedMessage.deliveryStatus === 'Opened in Gmail Web'
                          ? 'bg-sky-500/15 text-sky-500'
                          : 'bg-indigo-500/15 text-indigo-400'
                      }`}
                    >
                      {selectedMessage.deliveryStatus}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(selectedMessage.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleToggleStar(selectedMessage.id)}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                      title="Star message"
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${
                          selectedMessage.starred ? 'fill-amber-400 text-amber-400' : ''
                        }`}
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleRead(selectedMessage.id)}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                      title="Toggle Read/Unread"
                    >
                      <MailOpen className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setComposeTo('');
                        setComposeSubject(`Fwd: ${selectedMessage.subject}`);
                        setComposeBody(
                          `\n\n---------- Forwarded message ---------\nFrom: ${selectedMessage.fromName} <${selectedMessage.fromEmail}>\nDate: ${new Date(
                            selectedMessage.timestamp
                          ).toLocaleString()}\nSubject: ${selectedMessage.subject}\nTo: ${
                            selectedMessage.toEmail
                          }\n\n${selectedMessage.body}`
                        );
                        setIsComposeOpen(true);
                      }}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                      title="Forward email"
                    >
                      <Forward className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteMessage(selectedMessage.id)}
                      className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/40 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-500"
                      title="Delete email"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Subject & Sender Metadata */}
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 space-y-3">
                  <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white leading-snug">
                    {selectedMessage.subject}
                  </h2>

                  <div className="flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-sky-500/15 text-sky-500 font-extrabold flex items-center justify-center uppercase">
                        {(selectedMessage.fromName || selectedMessage.fromEmail || 'U')[0]}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">
                          {selectedMessage.fromName}{' '}
                          <span className="font-mono text-slate-400 font-normal">
                            &lt;{selectedMessage.fromEmail}&gt;
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          To: <span className="font-mono">{selectedMessage.toEmail}</span>
                          {selectedMessage.cc && (
                            <span className="ml-2">CC: {selectedMessage.cc}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        openGmailDirectCompose({
                          from: config.senderEmail,
                          to:
                            selectedMessage.folder === 'sent'
                              ? selectedMessage.toEmail
                              : selectedMessage.fromEmail,
                          subject: selectedMessage.subject.startsWith('Re:')
                            ? selectedMessage.subject
                            : `Re: ${selectedMessage.subject}`,
                          body: `\n\n${config.signature}`,
                        })
                      }
                      className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-sky-500 hover:bg-sky-500/10 flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Open in Gmail</span>
                    </button>
                  </div>
                </div>

                {/* Email Body (Original HTML View or Clean Formatted Plain Text) */}
                {selectedMessage.html && selectedMessage.html.trim().length > 0 ? (
                  <OriginalEmailHtmlViewer
                    key={selectedMessage.id}
                    html={selectedMessage.html}
                    plainText={selectedMessage.body}
                  />
                ) : /<[a-z][\s\S]*>/i.test(selectedMessage.body) &&
                  (/<(html|body|table|div|p|img|a|span)\b/i.test(selectedMessage.body)) ? (
                  <OriginalEmailHtmlViewer
                    key={selectedMessage.id}
                    html={selectedMessage.body}
                    plainText={selectedMessage.body.replace(/<[^>]+>/g, ' ')}
                  />
                ) : (
                  <div className="p-5 text-xs sm:text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap break-words leading-relaxed max-h-[420px] overflow-y-auto">
                    {formatCleanPlainText(selectedMessage.body)}
                  </div>
                )}
              </div>

              {/* Quick Reply Box */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <Reply className="w-3.5 h-3.5 text-sky-500" />
                    <span>
                      Reply to{' '}
                      {selectedMessage.folder === 'sent'
                        ? selectedMessage.toEmail
                        : selectedMessage.fromEmail}
                    </span>
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Sending as{' '}
                    <strong className="text-sky-500">
                      {config.senderEmail || 'Setup Email Required'}
                    </strong>
                  </span>
                </div>

                <textarea
                  rows={3}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write your reply here..."
                  className={`${inputCls} resize-none`}
                />

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleSendQuickReply}
                    disabled={isReplying || !replyText.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white text-xs font-extrabold shadow-md shadow-sky-500/20 transition-all cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isReplying ? 'Sending Reply...' : 'Send Direct Reply'}</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* =================================================================== */}
      {/* COMPOSE NEW EMAIL MODAL                                             */}
      {/* =================================================================== */}
      {isComposeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden ${cardBg}`}>
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-sky-500/15 text-sky-500">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Compose Outbound Email
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    From:{' '}
                    <strong className="text-sky-500">
                      {config.senderName || currentUser?.name} &lt;{config.senderEmail}&gt;
                    </strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsComposeOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendCompose} className="p-6 space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="font-bold block mb-1">
                    To (Recipient Email) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={composeTo}
                    onChange={(e) => setComposeTo(e.target.value)}
                    placeholder="recipient@company.com"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1">Quick Pick CRM Lead/Contact</label>
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) setComposeTo(e.target.value);
                    }}
                    className={inputCls}
                  >
                    <option value="">Select CRM Contact...</option>
                    {crmRecipients.map((r) => (
                      <option key={r.email} value={r.email}>
                        {r.name} ({r.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">CC (Optional)</label>
                  <input
                    type="text"
                    value={composeCc}
                    onChange={(e) => setComposeCc(e.target.value)}
                    placeholder="cc@company.com"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1">Load Outreach Template</label>
                  <select
                    value=""
                    onChange={(e) => {
                      const tpl = templates.find((t) => t.id === e.target.value);
                      if (tpl) {
                        setComposeSubject(tpl.subject || tpl.label);
                        setComposeBody(tpl.text);
                      }
                    }}
                    className={inputCls}
                  >
                    <option value="">Choose a saved template...</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">
                  Subject <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  placeholder="Enter email subject..."
                  className={inputCls}
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Message Body</label>
                <textarea
                  rows={8}
                  required
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  placeholder="Write your email message here..."
                  className={`${inputCls} resize-none leading-relaxed`}
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Save as Draft
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!composeTo.trim()) return;
                      openGmailDirectCompose({
                        from: config.senderEmail,
                        to: composeTo.trim(),
                        cc: composeCc.trim() || undefined,
                        subject: composeSubject.trim() || 'Message from OzoStack CRM',
                        body: `${composeBody}\n\n${config.signature}`,
                      });
                    }}
                    className="px-3.5 py-2 rounded-xl border border-sky-500/40 text-sky-500 hover:bg-sky-500/10 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Send via Gmail Web</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isSending}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white text-xs font-extrabold shadow-md shadow-sky-500/20 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSending ? 'Sending...' : 'Send Direct Email'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
