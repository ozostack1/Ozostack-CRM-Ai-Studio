import React, { useState } from 'react';
import {
  Mail,
  Server,
  Eye,
  EyeOff,
  Send,
  CheckCircle2,
  AlertCircle,
  Save,
  Trash2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  Inbox,
  Globe,
} from 'lucide-react';
import {
  useSmtpConfig,
  SmtpConfig,
  MAIL_PROVIDER_PRESETS,
  sendDirectEmail,
  verifySmtpConnection,
  openGmailDirectCompose,
  clearSentEmailsLog,
  hasRealSmtpPassword,
  DEFAULT_SMTP_CONFIG,
} from '../../data/emailService';
import { useTheme } from '../../context/ThemeContext';

interface SmtpSettingsSectionProps {
  onNotify: (msg: string) => void;
}

export const SmtpSettingsSection: React.FC<SmtpSettingsSectionProps> = ({ onNotify }) => {
  const { theme, setActiveNav } = useTheme();
  const isLight = theme === 'white-sky';
  const { config, sentLog, updateSmtpConfig } = useSmtpConfig();

  const [form, setForm] = useState<SmtpConfig>(config);
  const [showPassword, setShowPassword] = useState(false);
  const [testRecipient, setTestRecipient] = useState('work.ozostack@gmail.com');
  const [isTesting, setIsTesting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [testFeedback, setTestFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const cardCls = isLight
    ? 'bg-white border-sky-100/90 shadow-xs'
    : 'bg-[#0f172a]/95 border-slate-800';
  const inputCls = `w-full px-3 py-2 rounded-xl border text-xs font-medium outline-none ${
    isLight
      ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-sky-500 focus:bg-white'
      : 'bg-slate-900 border-slate-700 text-white focus:border-sky-400'
  }`;

  const handleSelectProvider = (preset: (typeof MAIL_PROVIDER_PRESETS)[number]) => {
    setForm((prev) => {
      const nextEmail =
        preset.id !== 'gmail' && prev.senderEmail === 'ozostack@gmail.com'
          ? preset.placeholderEmail
          : preset.id === 'gmail' && prev.senderEmail.endsWith('@ozostack.in')
          ? 'ozostack@gmail.com'
          : prev.senderEmail;
      return {
        ...prev,
        provider: preset.id,
        host: preset.host,
        port: preset.port,
        imapHost: preset.imapHost,
        imapPort: preset.imapPort,
        encryption: preset.encryption,
        senderEmail: nextEmail,
        username: nextEmail,
        replyToEmail: nextEmail,
      };
    });
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.senderEmail.trim() || !form.senderEmail.includes('@')) {
      onNotify('Please enter a valid Sender Email address.');
      return;
    }
    const saved = updateSmtpConfig(form);
    setForm(saved);

    if (hasRealSmtpPassword(saved.password)) {
      setIsVerifying(true);
      setTestFeedback(null);
      try {
        const v = await verifySmtpConnection(saved);
        setTestFeedback({ ok: v.verified, text: v.message });
        onNotify(v.verified ? `Live SMTP Verified (${saved.senderEmail})!` : v.message);
      } finally {
        setIsVerifying(false);
      }
    } else {
      setTestFeedback({
        ok: false,
        text: `Saved ${saved.senderEmail}. Enter your @ozostack.in Domain Mail password or 16-digit Gmail App Password in the Password field below so emails deliver directly to external inboxes.`,
      });
      onNotify(`Saved ${saved.senderEmail}. Add password to enable live external SMTP.`);
    }
  };

  const handleSendTestEmail = async () => {
    const target = testRecipient.trim() || 'work.ozostack@gmail.com';
    if (!target || !target.includes('@')) {
      onNotify('Enter a valid recipient email for the test.');
      return;
    }

    const saved = updateSmtpConfig(form);
    setForm(saved);

    setIsTesting(true);
    setTestFeedback(null);

    try {
      const res = await sendDirectEmail({
        to: target,
        subject: `OzoStack CRM — Live SMTP Delivery Test (${saved.senderEmail})`,
        body: `Hello,\n\nThis is a live test email sent from your OzoStack CRM workspace.\n\nConnected Sender: ${saved.senderName} <${saved.senderEmail}>\nSMTP Server: ${saved.host}:${saved.port} (${saved.encryption})\nIMAP Server: ${saved.imapHost}:${saved.imapPort}\n\n${saved.signature}`,
        recipientName: 'SMTP Verification',
        allowGmailFallback: false,
      });

      if (res.ok && res.realExternalDelivery) {
        setTestFeedback({
          ok: true,
          text: `Live SMTP Success! Real email delivered from ${saved.senderEmail} to ${target}. Check your ${target} inbox!`,
        });
        onNotify(`Real email delivered to ${target}!`);
      } else {
        setTestFeedback({
          ok: false,
          text:
            res.error ||
            'To send directly in the background without opening Gmail, enter your @ozostack.in Domain Mail password or 16-digit Gmail App Password.',
        });
      }
    } finally {
      setIsTesting(false);
    }
  };

  const activePreset =
    MAIL_PROVIDER_PRESETS.find((p) => p.id === form.provider) || MAIL_PROVIDER_PRESETS[0];
  const isPasswordSet = hasRealSmtpPassword(config.password);

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
                Domain Mail (@ozostack.in) &amp; Gmail SMTP / IMAP Configuration
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30">
                Active Email: {config.senderEmail}
              </span>
              {isPasswordSet && config.verified ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  Live External SMTP &amp; IMAP Verified ✅
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  Password Required for Live External SMTP
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-3xl">
              Connect either your <strong>Domain Mail</strong> (e.g. <code>admin@ozostack.in</code> / <code>info@ozostack.in</code> on Hostinger or Titan using your normal email password) OR <strong>Gmail</strong> (<code>ozostack@gmail.com</code> using a 16-digit Google App Password).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveNav('Email')}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white text-xs font-extrabold shadow-md shadow-sky-500/20 transition-all cursor-pointer"
          >
            <Inbox className="w-4 h-4" />
            <span>Open Mail Center &amp; Inbox &rarr;</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Columns: Editable SMTP & IMAP Form */}
        <form
          onSubmit={handleSave}
          autoComplete="off"
          className={`lg:col-span-2 p-5 rounded-2xl border space-y-4 ${cardCls}`}
        >
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-sky-500" />
                <span>Select Domain Mail (@ozostack.in) or Gmail Provider</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Your domain <code>ozostack.in</code> is on Hostinger DNS — Hostinger &amp; Titan Domain Mail work directly with your normal email password!
              </p>
            </div>
            <Server className="w-4 h-4 text-sky-500" />
          </div>

          {/* Provider Quick Presets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {MAIL_PROVIDER_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectProvider(preset)}
                className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                  form.provider === preset.id
                    ? 'bg-sky-500/10 border-sky-500 ring-2 ring-sky-500/20'
                    : isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-sky-50/50'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                  {preset.label}
                </div>
                <div className="text-[10px] font-bold text-sky-500 mt-0.5">{preset.badge}</div>
              </button>
            ))}
          </div>

          {/* Primary Sender Email & Display Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            <div>
              <label className="font-bold block mb-1 text-slate-700 dark:text-slate-200">
                Connected Email Address (From) <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                autoComplete="off"
                value={form.senderEmail}
                onChange={(e) => handleSenderEmailChange(e.target.value)}
                placeholder={activePreset.placeholderEmail}
                className={inputCls}
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Use <code>admin@ozostack.in</code> / <code>info@ozostack.in</code> or <code>ozostack@gmail.com</code>
              </span>
            </div>

            <div>
              <label className="font-bold block mb-1 text-slate-700 dark:text-slate-200">
                Sender Display Name
              </label>
              <input
                type="text"
                autoComplete="off"
                value={form.senderName}
                onChange={(e) => setForm({ ...form, senderName: e.target.value })}
                placeholder="OzoStack CRM"
                className={inputCls}
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Shown in recipient inbox: {form.senderName || 'OzoStack CRM'} &lt;{form.senderEmail}&gt;
              </span>
            </div>
          </div>

          {/* SMTP Username & Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            <div>
              <label className="font-bold block mb-1">SMTP / IMAP Username</label>
              <input
                type="text"
                required
                autoComplete="off"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder={form.senderEmail}
                className={inputCls}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-900 dark:text-white">
                  Email Password / App Password <span className="text-rose-500">*</span>
                </label>
                {form.host.includes('gmail.com') && (
                  <a
                    href="https://myaccount.google.com/apppasswords"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-bold text-sky-500 hover:underline flex items-center gap-0.5"
                  >
                    <span>Generate 16-Digit Gmail App Password</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder={activePreset.passwordHint}
                  className={`${inputCls} pr-9 border-sky-500/50`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-sky-500"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <span className="text-[10px] text-amber-500 font-semibold mt-0.5 block">
                {activePreset.passwordHint}
              </span>
            </div>
          </div>

          {/* Outbound SMTP & Inbound IMAP Host/Port */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
            <div className="sm:col-span-2">
              <label className="font-bold block mb-1">Outbound SMTP Host</label>
              <input
                type="text"
                required
                value={form.host}
                onChange={(e) => setForm({ ...form, host: e.target.value })}
                placeholder="smtp.hostinger.com"
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
                className={inputCls}
              />
            </div>

            <div>
              <label className="font-bold block mb-1">Inbound IMAP Host</label>
              <input
                type="text"
                value={form.imapHost}
                onChange={(e) => setForm({ ...form, imapHost: e.target.value })}
                placeholder="imap.hostinger.com"
                className={inputCls}
              />
            </div>

            <div>
              <label className="font-bold block mb-1">IMAP Port</label>
              <input
                type="number"
                value={form.imapPort}
                onChange={(e) => setForm({ ...form, imapPort: Number(e.target.value) || 993 })}
                className={inputCls}
              />
            </div>
          </div>

          {testFeedback && (
            <div
              className={`p-3 rounded-xl border text-xs font-semibold flex items-start gap-2 ${
                testFeedback.ok
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
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
              disabled={isVerifying}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white text-xs font-extrabold shadow-md shadow-sky-500/20 transition-all cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>
                {isVerifying ? 'Verifying SMTP Server...' : 'Save & Verify Live SMTP Settings'}
              </span>
            </button>
          </div>
        </form>

        {/* Right Column: Live Delivery Test & Outbound Log */}
        <div className="space-y-4">
          <div className={`p-5 rounded-2xl border space-y-3.5 ${cardCls}`}>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Send className="w-4 h-4 text-sky-500" />
              <span>Test Real External Inbox Delivery</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Send a real email from <strong className="text-sky-500">{form.senderEmail}</strong> to your actual inbox (e.g. <code>work.ozostack@gmail.com</code>).
            </p>

            <div className="space-y-2 text-xs">
              <label className="font-bold block">Recipient Email Address</label>
              <input
                type="email"
                value={testRecipient}
                onChange={(e) => setTestRecipient(e.target.value)}
                placeholder="work.ozostack@gmail.com"
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
                    <span>Sending via Live SMTP...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Live SMTP Test Email</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() =>
                  openGmailDirectCompose({
                    from: form.senderEmail,
                    to: testRecipient.trim() || 'work.ozostack@gmail.com',
                    subject: `OzoStack CRM — Direct Email from ${form.senderEmail}`,
                    body: `Hello,\n\nTesting direct email delivery from OzoStack CRM.\n\n${form.signature}`,
                  })
                }
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-sky-500/40 text-sky-500 hover:bg-sky-500/10 text-xs font-bold transition-all cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Or Send Immediately via Gmail Web</span>
              </button>
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
                No outbound emails sent yet.
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
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0 ${
                          item.status === 'Delivered via Live SMTP'
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : 'bg-sky-500/10 text-sky-500'
                        }`}
                      >
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
