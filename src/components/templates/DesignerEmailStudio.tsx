import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Code2,
  Cpu,
  Loader2,
  Mail,
  Monitor,
  Palette,
  Play,
  Save,
  Send,
  Smartphone,
  Sparkles,
  Square,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { sendDirectEmail } from '../../data/emailService';
import {
  appendCampaignLog,
  CampaignRecipient,
  DesignerEmailTemplate,
  EmailCampaignRunRecord,
  generateDesignerEmailWithAi,
  getCompanyBrandLogo,
  isValidLeadEmail,
  loadCampaignLogs,
  loadDesignerTemplates,
  personalizeDesignerEmail,
  saveDesignerTemplates,
  sleepCancellable,
} from '../../data/designerEmailService';
import { Lead } from '../../types/crm';

interface DesignerEmailStudioProps {
  mode: 'designer' | 'campaign';
  onSwitchToCampaign: (templateId: string) => void;
  initialCampaignTemplateId?: string | null;
  onNotify: (msg: string) => void;
}

const STARTER_PROMPTS = [
  'Modern high-converting Website Development & CRM offer with 25% launch discount badge and Book Free Call button',
  'Local business Google Reviews, SEO & WhatsApp Automation proposal for clinics, hotels & real estate firms',
  'Polite executive follow-up email with 3 key benefits card and Schedule 10-Min Demo CTA button',
  'Festive / New Month special package announcement with clean luxury navy-gold corporate design',
];

const BRAND_COLORS = ['#0284c7', '#4f46e5', '#059669', '#d97706', '#dc2626', '#0f172a'];

export const DesignerEmailStudio: React.FC<DesignerEmailStudioProps> = ({
  mode,
  onSwitchToCampaign,
  initialCampaignTemplateId,
  onNotify,
}) => {
  const { theme } = useTheme();
  const { currentUser, scopeFilter } = useAuth();
  const isDark = theme === 'midnight';
  const userId = currentUser?.id || 'default';

  const [templates, setTemplates] = useState<DesignerEmailTemplate[]>(() =>
    loadDesignerTemplates(userId)
  );
  const [campaignLogs, setCampaignLogs] = useState<EmailCampaignRunRecord[]>(() =>
    loadCampaignLogs(userId)
  );

  // Designer Studio state
  const [editingId, setEditingId] = useState<string | null>(templates[0]?.id || null);
  const [tplName, setTplName] = useState(templates[0]?.name || '');
  const [tplSubject, setTplSubject] = useState(templates[0]?.subject || '');
  const [tplHtml, setTplHtml] = useState(templates[0]?.html || '');
  const [tplPlainText, setTplPlainText] = useState(templates[0]?.plainText || '');
  const [aiPrompt, setAiPrompt] = useState('');
  const [accentColor, setAccentColor] = useState(templates[0]?.accentColor || '#0284c7');
  const [ctaText, setCtaText] = useState(templates[0]?.ctaText || 'Book a Free Consultation');
  const [ctaUrl, setCtaUrl] = useState(templates[0]?.ctaUrl || 'https://ozostack.in');
  const [logoUrl, setLogoUrl] = useState(() => getCompanyBrandLogo());
  const [tone, setTone] = useState<'Professional' | 'Friendly' | 'Hinglish' | 'Luxury Corporate'>(
    'Professional'
  );
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile' | 'code'>('desktop');
  const [isGenerating, setIsGenerating] = useState(false);

  // Direct Send to Any Lead modal state
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [sendLeadId, setSendLeadId] = useState('');
  const [sendToEmail, setSendToEmail] = useState('');
  const [sendToName, setSendToName] = useState('');
  const [sendToCompany, setSendToCompany] = useState('');
  const [isSendingOne, setIsSendingOne] = useState(false);

  // Campaign Runner state
  const [campaignTplId, setCampaignTplId] = useState<string>(
    initialCampaignTemplateId || templates[0]?.id || ''
  );
  const [audienceSource, setAudienceSource] = useState<'crm' | 'agents'>('crm');
  const [crmStageFilter, setCrmStageFilter] = useState<string>('All');
  const [delaySec, setDelaySec] = useState<number>(4);
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>([]);
  const [isCampaignRunning, setIsCampaignRunning] = useState(false);
  const [campaignProgress, setCampaignProgress] = useState<{
    total: number;
    sent: number;
    failed: number;
    currentLabel: string;
    countdown: number;
    statuses: Record<string, { state: 'pending' | 'sending' | 'sent' | 'failed'; error?: string }>;
  } | null>(null);
  const stopCampaignRef = useRef(false);

  // Reload per-user templates cleanly on user switch
  useEffect(() => {
    const loaded = loadDesignerTemplates(userId);
    setTemplates(loaded);
    setCampaignLogs(loadCampaignLogs(userId));
    if (loaded[0]) {
      setEditingId(loaded[0].id);
      setTplName(loaded[0].name);
      setTplSubject(loaded[0].subject);
      setTplHtml(loaded[0].html);
      setTplPlainText(loaded[0].plainText);
      setAccentColor(loaded[0].accentColor || '#0284c7');
      setCampaignTplId(initialCampaignTemplateId || loaded[0].id);
    }
    setSelectedRecipientIds([]);
  }, [userId]);

  useEffect(() => {
    if (initialCampaignTemplateId) {
      setCampaignTplId(initialCampaignTemplateId);
    }
  }, [initialCampaignTemplateId]);

  // Load real CRM Leads & AI Agents Leads with valid email addresses
  const crmLeadsWithEmail = useMemo<CampaignRecipient[]>(() => {
    try {
      const raw = localStorage.getItem('ozostack_leads_v2');
      const all: Lead[] = raw ? JSON.parse(raw) : [];
      const scoped = scopeFilter(Array.isArray(all) ? all : [], (l) => ({ owner: l.owner }));
      return scoped
        .filter(
          (l) =>
            isValidLeadEmail(l.email) &&
            (crmStageFilter === 'All' || l.status === crmStageFilter)
        )
        .map((l) => ({
          id: l.id,
          name: l.name,
          company: l.company || l.name,
          email: l.email.trim(),
          category: l.title || l.source,
        }));
    } catch {
      return [];
    }
  }, [scopeFilter, crmStageFilter, mode, isSendModalOpen]);

  const agentLeadsWithEmail = useMemo<CampaignRecipient[]>(() => {
    try {
      const raw = localStorage.getItem(`ozostack_ai_agent_leads_user_v1_${userId}`);
      const all: any[] = raw ? JSON.parse(raw) : [];
      return (Array.isArray(all) ? all : [])
        .filter((l) => isValidLeadEmail(l.email))
        .map((l) => ({
          id: l.id,
          name: l.name,
          company: l.name,
          email: String(l.email).trim(),
          category: l.searchCategory || l.category,
          city: l.city,
        }));
    } catch {
      return [];
    }
  }, [userId, mode]);

  const activeAudience = audienceSource === 'crm' ? crmLeadsWithEmail : agentLeadsWithEmail;

  const crmStages = useMemo(() => {
    try {
      const raw = localStorage.getItem('ozostack_leads_v2');
      const all: Lead[] = raw ? JSON.parse(raw) : [];
      const set = new Set<string>();
      all.forEach((l) => {
        if (l.status) set.add(l.status);
      });
      return ['All', ...Array.from(set)];
    } catch {
      return ['All'];
    }
  }, [mode]);

  const selectTemplateIntoEditor = (t: DesignerEmailTemplate) => {
    setEditingId(t.id);
    setTplName(t.name);
    setTplSubject(t.subject);
    setTplHtml(t.html);
    setTplPlainText(t.plainText);
    setAccentColor(t.accentColor || '#0284c7');
    setCtaText(t.ctaText || 'Book a Free Consultation');
    setCtaUrl(t.ctaUrl || 'https://ozostack.in');
  };

  const handleGenerateWithAi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) {
      onNotify('Describe the designer email you want AI to build.');
      return;
    }
    setIsGenerating(true);
    const res = await generateDesignerEmailWithAi({
      prompt: aiPrompt.trim(),
      accentColor,
      ctaText: ctaText.trim(),
      ctaUrl: ctaUrl.trim(),
      tone,
      logoUrl: logoUrl.trim() || undefined,
      userId,
    });
    setIsGenerating(false);

    if (!res.ok || !res.template) {
      onNotify(res.error || 'AI generation failed. Please try again.');
      return;
    }

    setEditingId(null);
    setTplName(res.template.name);
    setTplSubject(res.template.subject);
    setTplHtml(res.template.html);
    setTplPlainText(res.template.plainText);
    setPreviewMode('desktop');
    onNotify('AI Designer Email generated! Preview below and click Save or Send.');
  };

  const handleSaveTemplate = () => {
    if (!tplName.trim() || !tplSubject.trim() || !tplHtml.trim()) {
      onNotify('Template Name, Subject, and HTML are required.');
      return;
    }
    const now = new Date().toISOString();
    const id = editingId || `des-tpl-${Date.now()}`;
    const existing = templates.find((t) => t.id === id);
    const saved: DesignerEmailTemplate = {
      id,
      name: tplName.trim(),
      subject: tplSubject.trim(),
      html: tplHtml,
      plainText: tplPlainText,
      prompt: aiPrompt.trim() || existing?.prompt,
      accentColor,
      ctaText,
      ctaUrl,
      useCount: existing?.useCount || 0,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    const next = existing
      ? templates.map((t) => (t.id === id ? saved : t))
      : [saved, ...templates];
    setTemplates(next);
    setEditingId(id);
    setCampaignTplId(id);
    saveDesignerTemplates(next, userId);
    onNotify(`Designer template "${saved.name}" saved!`);
  };

  const handleDeleteTemplate = (id: string) => {
    const next = templates.filter((t) => t.id !== id);
    setTemplates(next);
    saveDesignerTemplates(next, userId);
    if (editingId === id) {
      if (next[0]) selectTemplateIntoEditor(next[0]);
      else {
        setEditingId(null);
        setTplName('');
        setTplSubject('');
        setTplHtml('');
      }
    }
    onNotify('Designer template removed.');
  };

  const handleDirectSendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidLeadEmail(sendToEmail)) {
      onNotify('Please enter a valid recipient email address.');
      return;
    }
    setIsSendingOne(true);
    const personalized = personalizeDesignerEmail(
      { subject: tplSubject, html: tplHtml, plainText: tplPlainText },
      {
        name: sendToName || sendToEmail.split('@')[0],
        company: sendToCompany || sendToName || 'your business',
        owner: currentUser?.name || 'OzoStack Team',
      }
    );

    const res = await sendDirectEmail({
      to: sendToEmail.trim(),
      recipientName: sendToName.trim() || undefined,
      subject: personalized.subject,
      body: personalized.plainText,
      html: personalized.html,
      allowGmailFallback: false,
    });
    setIsSendingOne(false);

    if (res.ok) {
      onNotify(`Designer HTML Email delivered to ${sendToEmail}!`);
      setIsSendModalOpen(false);
    } else {
      onNotify(res.error || res.message || 'SMTP send failed. Check Settings → My Email & SMTP.');
    }
  };

  const handleStartCampaign = async () => {
    const chosenTpl = templates.find((t) => t.id === campaignTplId);
    if (!chosenTpl) {
      onNotify('Select a Designer Email Template first.');
      return;
    }
    const targets = activeAudience.filter((r) => selectedRecipientIds.includes(r.id));
    if (targets.length === 0) {
      onNotify('Select at least one recipient with a valid email address.');
      return;
    }

    stopCampaignRef.current = false;
    setIsCampaignRunning(true);

    const initStatuses: Record<string, { state: 'pending' | 'sending' | 'sent' | 'failed'; error?: string }> = {};
    targets.forEach((t) => {
      initStatuses[t.id] = { state: 'pending' };
    });

    let sentCount = 0;
    let failedCount = 0;

    setCampaignProgress({
      total: targets.length,
      sent: 0,
      failed: 0,
      currentLabel: `Starting campaign for ${targets.length} recipients...`,
      countdown: 0,
      statuses: { ...initStatuses },
    });

    for (let i = 0; i < targets.length; i++) {
      if (stopCampaignRef.current) break;
      const rec = targets[i];
      initStatuses[rec.id] = { state: 'sending' };
      setCampaignProgress({
        total: targets.length,
        sent: sentCount,
        failed: failedCount,
        currentLabel: `Sending (${i + 1}/${targets.length}) to ${rec.name} <${rec.email}>...`,
        countdown: 0,
        statuses: { ...initStatuses },
      });

      const personalized = personalizeDesignerEmail(chosenTpl, {
        name: rec.name,
        company: rec.company,
        category: rec.category,
        city: rec.city,
        owner: currentUser?.name || 'OzoStack Team',
      });

      const res = await sendDirectEmail({
        to: rec.email,
        recipientName: rec.name,
        subject: personalized.subject,
        body: personalized.plainText,
        html: personalized.html,
        allowGmailFallback: false,
      });

      if (res.ok) {
        sentCount += 1;
        initStatuses[rec.id] = { state: 'sent' };
      } else {
        failedCount += 1;
        initStatuses[rec.id] = { state: 'failed', error: res.error || res.message };
      }

      setCampaignProgress({
        total: targets.length,
        sent: sentCount,
        failed: failedCount,
        currentLabel:
          i < targets.length - 1 && !stopCampaignRef.current
            ? `Safe ${delaySec}s pause before next email...`
            : 'Finishing campaign...',
        countdown: i < targets.length - 1 ? delaySec : 0,
        statuses: { ...initStatuses },
      });

      if (i < targets.length - 1 && !stopCampaignRef.current) {
        await sleepCancellable(delaySec * 1000, () => stopCampaignRef.current);
      }
    }

    const updatedLogs = appendCampaignLog(
      {
        id: `camp-${Date.now()}`,
        templateName: chosenTpl.name,
        subject: chosenTpl.subject,
        source: audienceSource === 'crm' ? 'CRM Leads' : 'AI Agents',
        total: targets.length,
        sent: sentCount,
        failed: failedCount,
        delaySeconds: delaySec,
        timestamp: new Date().toLocaleString(),
      },
      userId
    );
    setCampaignLogs(updatedLogs);

    // Bump template use count
    const bumped = templates.map((t) =>
      t.id === chosenTpl.id ? { ...t, useCount: (t.useCount || 0) + sentCount } : t
    );
    setTemplates(bumped);
    saveDesignerTemplates(bumped, userId);

    setIsCampaignRunning(false);
    setCampaignProgress((prev) =>
      prev
        ? {
            ...prev,
            currentLabel: stopCampaignRef.current
              ? `Campaign stopped by user (${sentCount} sent, ${failedCount} failed).`
              : `Campaign completed! ${sentCount} delivered, ${failedCount} failed.`,
            countdown: 0,
          }
        : null
    );
    onNotify(`Campaign finished: ${sentCount} delivered, ${failedCount} failed.`);
  };

  const previewRendered = useMemo(
    () =>
      personalizeDesignerEmail(
        { subject: tplSubject, html: tplHtml, plainText: tplPlainText },
        {
          name: 'Rahul Sharma',
          company: 'Apex Dental Studio',
          category: 'Dental Clinic',
          city: 'Mumbai',
          owner: currentUser?.name || 'Sayed',
        }
      ),
    [tplSubject, tplHtml, tplPlainText, currentUser?.name]
  );

  const cardCls = isDark
    ? 'bg-slate-900/90 border-slate-800'
    : 'bg-white border-slate-200 shadow-xs';
  const inputCls = `w-full px-3 py-2 rounded-xl border text-xs font-medium outline-none ${
    isDark
      ? 'bg-slate-800 border-slate-700 text-white focus:border-sky-400'
      : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-sky-500'
  }`;

  if (mode === 'campaign') {
    const selectedCampaignTpl = templates.find((t) => t.id === campaignTplId);
    const allAudienceSelected =
      activeAudience.length > 0 &&
      activeAudience.every((r) => selectedRecipientIds.includes(r.id));

    return (
      <div className="space-y-4 animate-fade-in">
        <div className={`p-5 rounded-2xl border space-y-4 ${cardCls}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-sky-500" />
                <span>Automated Designer Email Campaign (Safe 3–8s Pause)</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Pick a Designer Template, select leads from CRM or AI Agents, and send automatically
                with safe anti-spam delay via your live SMTP.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
            <div className="md:col-span-5">
              <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">
                1. Choose Designer Email Template
              </label>
              <select
                value={campaignTplId}
                onChange={(e) => setCampaignTplId(e.target.value)}
                disabled={isCampaignRunning}
                className={inputCls}
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} — ({t.subject})
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3">
              <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">
                2. Lead Source
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  disabled={isCampaignRunning}
                  onClick={() => {
                    setAudienceSource('crm');
                    setSelectedRecipientIds([]);
                  }}
                  className={`py-2 px-2 rounded-xl font-bold border text-[11px] flex items-center justify-center gap-1 ${
                    audienceSource === 'crm'
                      ? 'bg-sky-500 text-white border-sky-500'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>CRM ({crmLeadsWithEmail.length})</span>
                </button>
                <button
                  type="button"
                  disabled={isCampaignRunning}
                  onClick={() => {
                    setAudienceSource('agents');
                    setSelectedRecipientIds([]);
                  }}
                  className={`py-2 px-2 rounded-xl font-bold border text-[11px] flex items-center justify-center gap-1 ${
                    audienceSource === 'agents'
                      ? 'bg-violet-600 text-white border-violet-600'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>AI Agents ({agentLeadsWithEmail.length})</span>
                </button>
              </div>
            </div>

            {audienceSource === 'crm' && (
              <div className="md:col-span-2">
                <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">
                  Stage Filter
                </label>
                <select
                  value={crmStageFilter}
                  onChange={(e) => setCrmStageFilter(e.target.value)}
                  disabled={isCampaignRunning}
                  className={inputCls}
                >
                  {crmStages.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className={audienceSource === 'crm' ? 'md:col-span-2' : 'md:col-span-4'}>
              <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">
                Safe Pause Delay
              </label>
              <select
                value={delaySec}
                onChange={(e) => setDelaySec(Number(e.target.value))}
                disabled={isCampaignRunning}
                className={inputCls}
              >
                <option value={3}>3 Seconds</option>
                <option value={4}>4 Seconds (Recommended)</option>
                <option value={5}>5 Seconds</option>
                <option value={8}>8 Seconds (Ultra Safe)</option>
              </select>
            </div>
          </div>

          {/* Live Progress Bar */}
          {campaignProgress && (
            <div className="p-4 rounded-xl bg-sky-500/10 border border-sky-500/25 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
                <span className="text-sky-700 dark:text-sky-300 flex items-center gap-2">
                  {isCampaignRunning && <Loader2 className="w-4 h-4 animate-spin" />}
                  {campaignProgress.currentLabel}
                </span>
                <span className="text-slate-700 dark:text-slate-200">
                  Sent: <strong className="text-emerald-600">{campaignProgress.sent}</strong> ·
                  Failed: <strong className="text-rose-500">{campaignProgress.failed}</strong> /{' '}
                  {campaignProgress.total}
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{
                    width: `${Math.round(
                      ((campaignProgress.sent + campaignProgress.failed) /
                        Math.max(1, campaignProgress.total)) *
                        100
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Recipients Selection List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Recipients with Valid Emails ({activeAudience.length})
              </span>
              <div className="flex items-center gap-2">
                {activeAudience.length > 0 && !isCampaignRunning && (
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedRecipientIds(
                        allAudienceSelected ? [] : activeAudience.map((r) => r.id)
                      )
                    }
                    className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline"
                  >
                    {allAudienceSelected ? 'Unselect All' : `Select All (${activeAudience.length})`}
                  </button>
                )}

                {isCampaignRunning ? (
                  <button
                    type="button"
                    onClick={() => {
                      stopCampaignRef.current = true;
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold"
                  >
                    <Square className="w-3.5 h-3.5" />
                    <span>Stop Campaign</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={selectedRecipientIds.length === 0 || !selectedCampaignTpl}
                    onClick={handleStartCampaign}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-bold shadow-xs"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>
                      Send Campaign ({selectedRecipientIds.length}) · {delaySec}s Delay
                    </span>
                  </button>
                )}
              </div>
            </div>

            {activeAudience.length === 0 ? (
              <div className="p-8 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-center text-xs text-slate-500">
                No leads with valid email addresses found in{' '}
                {audienceSource === 'crm' ? 'CRM Leads' : 'AI Agents Staging'}. Add leads or scrape
                leads with email extraction enabled.
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl">
                {activeAudience.map((rec) => {
                  const checked = selectedRecipientIds.includes(rec.id);
                  const st = campaignProgress?.statuses?.[rec.id];
                  return (
                    <label
                      key={rec.id}
                      className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          disabled={isCampaignRunning}
                          checked={checked}
                          onChange={() =>
                            setSelectedRecipientIds((prev) =>
                              prev.includes(rec.id)
                                ? prev.filter((x) => x !== rec.id)
                                : [...prev, rec.id]
                            )
                          }
                          className="rounded accent-sky-500"
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-slate-800 dark:text-white truncate">
                            {rec.name}{' '}
                            {rec.company && rec.company !== rec.name && (
                              <span className="font-normal text-slate-400">· {rec.company}</span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">{rec.email}</div>
                        </div>
                      </div>

                      {st && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                            st.state === 'sent'
                              ? 'bg-emerald-500/15 text-emerald-600'
                              : st.state === 'failed'
                              ? 'bg-rose-500/15 text-rose-500'
                              : st.state === 'sending'
                              ? 'bg-sky-500/15 text-sky-600'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                          }`}
                          title={st.error}
                        >
                          {st.state === 'sent'
                            ? 'Sent ✓'
                            : st.state === 'failed'
                            ? 'Failed'
                            : st.state === 'sending'
                            ? 'Sending...'
                            : 'Queued'}
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Campaign History */}
        {campaignLogs.length > 0 && (
          <div className={`p-5 rounded-2xl border space-y-3 ${cardCls}`}>
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-white">
              Recent Campaign Runs ({campaignLogs.length})
            </h3>
            <div className="space-y-2">
              {campaignLogs.slice(0, 8).map((log) => (
                <div
                  key={log.id}
                  className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-800 dark:text-white">
                      {log.templateName}{' '}
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400">
                        {log.source}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {log.timestamp} · {log.delaySeconds}s pause
                    </div>
                  </div>
                  <div className="text-xs font-bold">
                    <span className="text-emerald-600">{log.sent} Sent</span>
                    {log.failed > 0 && (
                      <span className="text-rose-500 ml-2">{log.failed} Failed</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* AI Designer Prompt Card */}
      <form onSubmit={handleGenerateWithAi} className={`p-5 rounded-2xl border space-y-3.5 ${cardCls}`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-500" />
              <span>AI Designer Email Generator (Free Gemini API)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Describe your offer or message — AI builds a full responsive HTML designer email with
              banner, cards, CTA button &amp; {'{firstName}'} / {'{company}'} personalization.
            </p>
          </div>
        </div>

        <textarea
          rows={2}
          value={aiPrompt}
          onChange={(e) => setAiPrompt(e.target.value)}
          placeholder="e.g. Website Development & CRM offer ke liye modern navy-blue designer email banao, 25% discount card aur Book Free Demo button ke saath..."
          className={inputCls}
        />

        <div className="flex flex-wrap gap-1.5">
          {STARTER_PROMPTS.map((sp, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setAiPrompt(sp)}
              className="px-2.5 py-1 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 text-violet-700 dark:text-violet-300 text-[11px] font-semibold text-left"
            >
              Spark #{i + 1}: {sp.slice(0, 44)}...
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 text-xs items-end">
          <div className="lg:col-span-3">
            <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
              CTA Button Text
            </label>
            <input
              value={ctaText}
              onChange={(e) => setCtaText(e.target.value)}
              placeholder="Book Free Demo"
              className={inputCls}
            />
          </div>
          <div className="lg:col-span-3">
            <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
              CTA Button Link
            </label>
            <input
              value={ctaUrl}
              onChange={(e) => setCtaUrl(e.target.value)}
              placeholder="https://ozostack.in"
              className={inputCls}
            />
          </div>
          <div className="lg:col-span-2">
            <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
              Tone
            </label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value as any)}
              className={inputCls}
            >
              <option value="Professional">Professional</option>
              <option value="Luxury Corporate">Luxury Corporate</option>
              <option value="Friendly">Friendly</option>
              <option value="Hinglish">Hinglish</option>
            </select>
          </div>
          <div className="lg:col-span-2">
            <label className="font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1 mb-1">
              <Palette className="w-3 h-3" />
              <span>Brand Color</span>
            </label>
            <div className="flex items-center gap-1.5 py-1">
              {BRAND_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setAccentColor(c)}
                  className={`w-5 h-5 rounded-full border-2 ${
                    accentColor === c ? 'border-slate-900 dark:border-white scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="lg:col-span-2">
            <button
              type="submit"
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-xs font-bold shadow-xs"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Designing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Live Editor + Sandboxed Desktop/Mobile Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Saved Templates List */}
        <div className={`lg:col-span-4 p-4 rounded-2xl border space-y-3 ${cardCls}`}>
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-white">
              Saved Designer Templates ({templates.length})
            </h3>
          </div>
          <div className="space-y-2 max-h-[540px] overflow-y-auto">
            {templates.map((t) => (
              <div
                key={t.id}
                onClick={() => selectTemplateIntoEditor(t)}
                className={`p-3 rounded-xl border cursor-pointer transition-colors space-y-1.5 ${
                  editingId === t.id
                    ? 'border-sky-500 bg-sky-500/10'
                    : 'border-slate-200 dark:border-slate-800 hover:border-sky-400/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {t.name}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">{t.subject}</div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTemplate(t.id);
                    }}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-500"
                    title="Delete template"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>Sent {t.useCount || 0}×</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSwitchToCampaign(t.id);
                    }}
                    className="text-sky-600 dark:text-sky-400 font-bold hover:underline"
                  >
                    Use in Campaign →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Preview & Save/Send Controls */}
        <div className={`lg:col-span-8 p-4 rounded-2xl border space-y-3 ${cardCls}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div>
              <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Template Name
              </label>
              <input
                value={tplName}
                onChange={(e) => setTplName(e.target.value)}
                placeholder="e.g. Website Offer Email"
                className={inputCls}
              />
            </div>
            <div>
              <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Email Subject (supports {'{firstName}'}, {'{company}'})
              </label>
              <input
                value={tplSubject}
                onChange={(e) => setTplSubject(e.target.value)}
                placeholder="Quick growth idea for {company}"
                className={inputCls}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setPreviewMode('desktop')}
                className={`px-2.5 py-1 rounded-lg flex items-center gap-1 ${
                  previewMode === 'desktop'
                    ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-white shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Desktop</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('mobile')}
                className={`px-2.5 py-1 rounded-lg flex items-center gap-1 ${
                  previewMode === 'mobile'
                    ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-white shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mobile</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('code')}
                className={`px-2.5 py-1 rounded-lg flex items-center gap-1 ${
                  previewMode === 'code'
                    ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-white shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Edit HTML</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleSaveTemplate}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Template</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSendLeadId('');
                  setSendToEmail('');
                  setSendToName('');
                  setSendToCompany('');
                  setIsSendModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send to Any Lead</span>
              </button>
            </div>
          </div>

          {previewMode === 'code' ? (
            <textarea
              rows={18}
              value={tplHtml}
              onChange={(e) => setTplHtml(e.target.value)}
              className={`${inputCls} font-mono text-[11px]`}
            />
          ) : (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-950 p-3 flex justify-center overflow-auto">
              <iframe
                title="Designer Email Preview"
                sandbox="allow-same-origin"
                srcDoc={previewRendered.html}
                className="bg-white rounded-lg shadow-sm border border-slate-200 transition-all"
                style={{
                  width: previewMode === 'mobile' ? '375px' : '100%',
                  height: '460px',
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Direct Send to Any Lead Modal */}
      {isSendModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <form
            onSubmit={handleDirectSendSubmit}
            className={`w-full max-w-md rounded-2xl border p-5 space-y-4 shadow-2xl ${cardCls}`}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-emerald-500" />
                <span>Send Designer Email to Lead</span>
              </h3>
              <button type="button" onClick={() => setIsSendModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {crmLeadsWithEmail.length > 0 && (
              <div className="text-xs">
                <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">
                  Pick from CRM Leads ({crmLeadsWithEmail.length} with email)
                </label>
                <select
                  value={sendLeadId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSendLeadId(id);
                    const found = crmLeadsWithEmail.find((l) => l.id === id);
                    if (found) {
                      setSendToEmail(found.email);
                      setSendToName(found.name);
                      setSendToCompany(found.company);
                    }
                  }}
                  className={inputCls}
                >
                  <option value="">-- Select a CRM Lead (or type email below) --</option>
                  {crmLeadsWithEmail.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.company}) — {l.email}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-2.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">
                  Recipient Email *
                </label>
                <input
                  type="email"
                  required
                  value={sendToEmail}
                  onChange={(e) => setSendToEmail(e.target.value)}
                  placeholder="client@business.com"
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">
                    Recipient Name
                  </label>
                  <input
                    value={sendToName}
                    onChange={(e) => setSendToName(e.target.value)}
                    placeholder="Rahul"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">
                    Company
                  </label>
                  <input
                    value={sendToCompany}
                    onChange={(e) => setSendToCompany(e.target.value)}
                    placeholder="Apex Dental"
                    className={inputCls}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsSendModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSendingOne}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white text-xs font-bold"
              >
                {isSendingOne ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>{isSendingOne ? 'Sending...' : 'Send Designer Email'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
