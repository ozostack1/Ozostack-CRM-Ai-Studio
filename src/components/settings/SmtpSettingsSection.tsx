import React, { useState } from 'react';
import {
  Mail,
  Server,
  Lock,
  Eye,
  EyeOff,
  Send,
  CheckCircle2,
  AlertCircle,
  Save,
  Trash2,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import {
  useSmtpConfig,
  SmtpConfig,
  sendDirectEmail,
  clearSentEmailsLog,
  DEFAULT_SMTP_CONFIG,
} from '../../data/emailService';
import { useTheme } from '../../context/ThemeContext';

interface SmtpSettingsSectionProps {
  onNotify: (msg: string) => void;
}

const PROVIDER_PRESETS: {
  id: SmtpConfig['provider'];
  label: string;
  host: string;
  port: number;
  encryption: SmtpConfig['encryption'];
}[] = [
  { id: 'gmail', label: 'Gmail (ozostack@gmail.com)', host: 'smtp.gmail.com', port: 587, encryption: 'TLS' },
  { id: 'workspace', label: 'Google Workspace SMTP', host: 'smtp.gmail.com', port: 587, encryption: 'TLS' },
  { id: 'office365', label: 'Microsoft 365 / Outlook', host: 'smtp.office365.com', port: 587, encryption: 'TLS' },
  { id: 'hostinger', label: 'Hostinger / Domain Mail', host: 'smtp.hostinger.com', port: 465, encryption: 'SSL' },
  { id: 'custom', label: 'Custom SMTP Server', host: 'smtp.yourdomain.com', port: 587, encryption: 'TLS' },
];

export const SmtpSettingsSection: React.FC<SmtpSettingsSectionProps> = ({ onNotify }) => {
  const { theme } = useTheme();
  const isLight = theme === 'white-sky';
  const { config, sentLog, updateSmtpConfig } = useSmtpConfig();

  const [form, setForm] = useState<SmtpConfig>(config);
  const [showPassword, setShowPassword] = useState(false);
  const [testRecipient, setTestRecipient] = useState(config.senderEmail || 'ozostack@gmail.com');
  const [isTesting, setIsTesting] = useState(false);
  const [testFeedback, setTestFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const cardCls = isLight
    ? 'bg-white border-sky-100/90 shadow-xs'
    : 'bg-[#0f172a]/95 border-slate-800';
  const inputCls = `w-full px-3 py-2 rounded-xl border text-xs font-medium outline-none ${
    isLight
      ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-sky-500 focus:bg-white'
      : 'bg-slate-900 border-slate-700 text-white focus:border-sky-400'
  }`;

  const handleSelectProvider = (preset: (typeof PROVIDER_PRESETS)[number]) => {
    setForm((prev) => ({
      ...prev,
      provider: preset.id,
      host: preset.host,
      port: preset.port,
      encryption: preset.encryption,
    }));
  };

  const handleSenderEmailChange = (newEmail: string) => {
    setForm((prev) => {
      const shouldSyncUsername = !prev.username || prev.username === prev.senderEmail;
      const shouldSyncReplyTo = !prev.replyToEmail || prev.replyToEmail === prev.senderEmail;
      return {
        ...prev,
        senderEmail: newEmail,
        username: shouldSyncUsername ? newEmail : prev.username,
        replyToEmail: shouldSyncReplyTo ? newEmail : prev.replyToEmail,
      };
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.senderEmail.trim() || !form.senderEmail.includes('@')) {
      onNotify('Please enter a valid Sender Email address.');
      return;
    }
    const saved = updateSmtpConfig(form);
    setForm(saved);
    setTestFeedback({
      ok: true,
      text: `Saved! Outbound CRM emails are now connected to ${saved.senderEmail}.`,
    });
    onNotify(`Email & SMTP settings saved (${saved.senderEmail}).`);
  };

  const handleResetToDefaultGmail = () => {
    const saved = updateSmtpConfig({
      ...DEFAULT_SMTP_CONFIG,
      password: form.password,
    });
    setForm(saved);
    setTestRecipient(saved.senderEmail);
    onNotify('Reconnected default ozostack@gmail.com account.');
  };

  const handleSendTestEmail = async () => {
    const target = testRecipient.trim() || form.senderEmail;
    if (!target || !target.includes('@')) {
      onNotify('Enter a valid recipient email for the test.');
      return;
    }

    // Save current form values first
    const saved = updateSmtpConfig(form);
    setForm(saved);

    setIsTesting(true);
    setTestFeedback(null);

    try {
      const res = await sendDirectEmail({
        to: target,
        subject: `OzoStack CRM — Direct SMTP Test (${saved.senderEmail})`,
        body: `Hello,\n\nThis is a live test email from your OzoStack CRM workspace.\n\nConnected Sender: ${saved.senderName} <${saved.senderEmail}>\nSMTP Host: ${saved.host}:${saved.port} (${saved.encryption})\n\n${saved.signature}`,
        recipientName: 'SMTP Verification',
        allowGmailFallback: !saved.password.trim(),
      });

      if (res.ok && res.mode === 'smtp') {
        setTestFeedback({
          ok: true,
          text: `Test email delivered directly via SMTP from ${saved.senderEmail} to ${target}!`,
        });
        onNotify(`Test email sent directly to ${target}!`);
      } else if (res.ok && res.mode === 'gmail-direct') {
        setTestFeedback({
          ok: true,
          text: `Opened Gmail direct composer for ${saved.senderEmail}. Enter your 16-digit Gmail App Password below to send silently in the background without opening a tab.`,
        });
        onNotify(`Opened Gmail compose for ${saved.senderEmail}.`);
      } else {
        setTestFeedback({
          ok: false,
          text: res.error || 'SMTP connection failed. Check your SMTP Host, Port, and App Password.',
        });
      }
    } finally {
      setIsTesting(false);
    }
  };

  const hasAppPassword = Boolean(form.password && form.password.trim().length > 0);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Top Status Banner */}
      <div
        className={`p-5 rounded-2xl border flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${cardCls} border-sky-500/30`}
      >
        <div className="flex items-start gap-3.5">
          <div className="p-3 rounded-xl bg-sky-500/15 text-sky-500 shrink-0">
            <Mail className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                Direct Email &amp; SMTP Integration
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                Connected: {config.senderEmail}
              </span>
              {hasAppPassword ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-600 dark:text-sky-400">
                  1-Click Silent SMTP Active
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  Gmail Direct Relay Active
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-3xl">
              All outbound emails from Leads, Contacts, AI Follow-up Assistant, and Outreach Templates are
              routed through <strong className="text-slate-800 dark:text-slate-200">{config.senderEmail}</strong>. You can change your sender email or SMTP credentials below at any time.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {config.senderEmail !== 'ozostack@gmail.com' && (
            <button
              type="button"
              onClick={handleResetToDefaultGmail}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Restore ozostack@gmail.com
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Columns: Editable SMTP & Sender Email Form */}
        <form onSubmit={handleSave} className={`lg:col-span-2 p-5 rounded-2xl border space-y-4 ${cardCls}`}>
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Sender Account &amp; SMTP Server Configuration
              </h3>
              <p className="text-[11px] text-slate-400">
                Change your connected email address or switch SMTP providers anytime
              </p>
            </div>
            <Server className="w-4 h-4 text-sky-500" />
          </div>

          {/* Provider Quick Presets */}
          <div>
            <label className="text-xs font-bold block mb-1.5 text-slate-600 dark:text-slate-300">
              Mail Provider Preset
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PROVIDER_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectProvider(preset)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    form.provider === preset.id
                      ? 'bg-sky-500 text-white border-sky-500 shadow-xs'
                      : isLight
                      ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-sky-50'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Primary Sender Email & Display Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            <div>
              <label className="font-bold block mb-1 text-slate-700 dark:text-slate-200">
                Connected Sender Email (From) <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={form.senderEmail}
                onChange={(e) => handleSenderEmailChange(e.target.value)}
                placeholder="ozostack@gmail.com"
                className={inputCls}
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Change this anytime to switch your active outbound email address
              </span>
            </div>

            <div>
              <label className="font-bold block mb-1 text-slate-700 dark:text-slate-200">
                Sender Display Name
              </label>
              <input
                type="text"
                value={form.senderName}
                onChange={(e) => setForm({ ...form, senderName: e.target.value })}
                placeholder="OzoStack CRM"
                className={inputCls}
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Shown in recipient inboxes (e.g. OzoStack CRM &lt;{form.senderEmail}&gt;)
              </span>
            </div>
          </div>

          {/* SMTP Host, Port, Encryption */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
            <div>
              <label className="font-bold block mb-1">SMTP Host</label>
              <input
                type="text"
                required
                value={form.host}
                onChange={(e) => setForm({ ...form, host: e.target.value })}
                placeholder="smtp.gmail.com"
                className={inputCls}
              />
            </div>

            <div>
              <label className="font-bold block mb-1">SMTP Port</label>
              <input
                type="number"
                required
                value={form.port}
                onChange={(e) => setForm({ ...form, port: Number(e.target.value) || 587 })}
                placeholder="587"
                className={inputCls}
              />
            </div>

            <div>
              <label className="font-bold block mb-1">Encryption</label>
              <select
                value={form.encryption}
                onChange={(e) => {
                  const enc = e.target.value as SmtpConfig['encryption'];
                  setForm({
                    ...form,
                    encryption: enc,
                    port: enc === 'SSL' ? 465 : enc === 'TLS' ? 587 : form.port,
                  });
                }}
                className={inputCls}
              >
                <option value="TLS">STARTTLS (Port 587)</option>
                <option value="SSL">SSL / TLS (Port 465)</option>
                <option value="NONE">None (Port 25)</option>
              </select>
            </div>
          </div>

          {/* SMTP Auth Username & App Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            <div>
              <label className="font-bold block mb-1">SMTP Username / Login</label>
              <input
                type="text"
                required
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="ozostack@gmail.com"
                className={inputCls}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold">SMTP Password / Gmail App Password</label>
                <a
                  href="https://myaccount.google.com/apppasswords"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-bold text-sky-500 hover:underline flex items-center gap-0.5"
                >
                  <span>Get Gmail App Password</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="16-char Google App Password (e.g. xxxx xxxx xxxx xxxx)"
                  className={`${inputCls} pr-9`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-sky-500"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Reply-To & Signature */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            <div>
              <label className="font-bold block mb-1">Reply-To Email Address</label>
              <input
                type="email"
                value={form.replyToEmail}
                onChange={(e) => setForm({ ...form, replyToEmail: e.target.value })}
                placeholder="ozostack@gmail.com"
                className={inputCls}
              />
            </div>

            <div>
              <label className="font-bold block mb-1">Default Email Signature</label>
              <textarea
                rows={2}
                value={form.signature}
                onChange={(e) => setForm({ ...form, signature: e.target.value })}
                className={`${inputCls} resize-none`}
              />
            </div>
          </div>

          {testFeedback && (
            <div
              className={`p-3 rounded-xl border text-xs font-semibold flex items-start gap-2 ${
                testFeedback.ok
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
              }`}
            >
              {testFeedback.ok ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span>{testFeedback.text}</span>
            </div>
          )}

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Synced with your cloud database across all sessions</span>
            </div>

            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-extrabold shadow-md shadow-sky-500/20 transition-all cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Email &amp; SMTP Settings</span>
            </button>
          </div>
        </form>

        {/* Right Column: Test Dispatch & How Direct Send Works */}
        <div className="space-y-4">
          <div className={`p-5 rounded-2xl border space-y-3.5 ${cardCls}`}>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Send className="w-4 h-4 text-sky-500" />
              <span>Test Direct Email Delivery</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Send a live test message from <strong className="text-sky-500">{form.senderEmail}</strong> to verify your outbound configuration.
            </p>

            <div className="space-y-2 text-xs">
              <label className="font-bold block">Send Test Email To</label>
              <input
                type="email"
                value={testRecipient}
                onChange={(e) => setTestRecipient(e.target.value)}
                placeholder="recipient@example.com"
                className={inputCls}
              />
              <button
                type="button"
                onClick={handleSendTestEmail}
                disabled={isTesting}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-extrabold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                {isTesting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Sending Test Email...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Live Test Email</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-[11px] text-slate-600 dark:text-slate-300 space-y-1.5">
              <div className="font-extrabold text-sky-600 dark:text-sky-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>How Direct Gmail Delivery Works:</span>
              </div>
              <p>
                1. <strong>With SMTP App Password:</strong> Emails send 100% silently in the background via{' '}
                <code>smtp.gmail.com</code> without opening any popup.
              </p>
              <p>
                2. <strong>Without App Password:</strong> Clicking "Send Email" anywhere in CRM opens Gmail Web pre-logged into <strong>{form.senderEmail}</strong> with recipient, subject, and message ready.
              </p>
            </div>
          </div>

          {/* Recent Outbound Emails Log */}
          <div className={`p-5 rounded-2xl border space-y-3 ${cardCls}`}>
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Recent Outbound Emails ({sentLog.length})
              </h3>
              {sentLog.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    clearSentEmailsLog();
                    onNotify('Cleared outbound email log.');
                  }}
                  className="text-[11px] text-rose-500 hover:underline flex items-center gap-1 font-semibold"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              )}
            </div>

            {sentLog.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                No outbound emails sent yet in this session.
              </p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {sentLog.slice(0, 15).map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-800 dark:text-white truncate">
                        To: {item.to}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-bold shrink-0">
                        {item.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">{item.subject}</div>
                    <div className="text-[10px] text-slate-400 flex items-center justify-between">
                      <span>From: {item.from}</span>
                      <span>{new Date(item.sentAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
