import React, { useState } from 'react';
import {
  Network,
  Plus,
  Play,
  Mail,
  MessageSquare,
  Bell,
  CalendarCheck2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Trash2,
  Edit3,
  Webhook,
  Activity,
  X,
  ChevronDown,
  ChevronUp,
  Zap,
  Globe,
  Lock,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useSmtpConfig } from '../../data/emailService';
import { useWhatsAppCenter } from '../../data/whatsappService';
import {
  useWorkflowsCenter,
  CrmWorkflowRule,
  ExternalWebhookSource,
  WorkflowTriggerType,
  saveWorkflows,
  saveWebhookSources,
  runSingleWorkflowRule,
  clearWorkflowLogs,
} from '../../data/workflowService';

const TRIGGER_LABELS: Record<WorkflowTriggerType, string> = {
  lead_created: 'When New Lead is Created',
  lead_stage_changed: 'When Lead Stage Changes',
  deal_won: 'When Deal is Marked Won',
  invoice_created: 'When Invoice is Created',
};

const SOURCE_GUIDES: Record<ExternalWebhookSource['id'], { title: string; steps: string[] }> = {
  justdial: {
    title: 'JustDial Integration Steps',
    steps: [
      'Turn ON the JustDial switch above and copy your Webhook URL.',
      'Share this URL with your JustDial Account Manager or paste it in JustDial Business Dashboard → Lead API / Webhook Push.',
      'JustDial sends GET or POST parameters (name, mobile, email, category, city) — our server automatically captures the Lead into CRM and triggers your Email / WhatsApp!',
    ],
  },
  indiamart: {
    title: 'IndiaMART CRM Push API Steps',
    steps: [
      'Turn ON the IndiaMART switch above and copy your Webhook URL.',
      'In IndiaMART Seller Panel → Settings → CRM API → Push API Webhook, paste this URL.',
      'IndiaMART sends SENDER_NAME, SENDER_MOBILE, SENDER_EMAIL, QUERY_PRODUCT_NAME — automatically saved to CRM Leads + auto-reply sent!',
    ],
  },
  facebook: {
    title: 'Facebook / Instagram Lead Ads Steps',
    steps: [
      'Turn ON the Facebook Lead Ads switch above and copy your Webhook URL.',
      'Connect your Facebook Lead Form via Meta Webhooks, Pabbly, Make, or Zapier (POST JSON with full_name, phone_number, email, company_name).',
      'Every ad lead will instantly appear in your CRM Leads and receive your auto-Email / WhatsApp!',
    ],
  },
  website: {
    title: 'Website / Landing Form Integration Steps',
    steps: [
      'Turn ON the Website Form switch above and copy your Webhook URL.',
      'POST JSON { name, phone, email, company, message } from your website form or Elementor / Webflow / Google Forms webhook.',
      'Every submission creates a CRM Lead and fires your welcome Email / WhatsApp automatically.',
    ],
  },
};

export const WorkflowsView: React.FC = () => {
  const { theme, setActiveNav } = useTheme();
  const { currentUser } = useAuth();
  const { config: smtpConfig } = useSmtpConfig();
  const { config: waConfig } = useWhatsAppCenter();
  const { workflows, webhookSources, logs, refresh } = useWorkflowsCenter();
  const isLight = theme === 'white-sky';

  const [activeTab, setActiveTab] = useState<'workflows' | 'webhooks' | 'logs'>('workflows');
  const [banner, setBanner] = useState<{ type: 'ok' | 'info' | 'err'; text: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [expandedGuide, setExpandedGuide] = useState<string | null>('justdial');
  const [editingWebhookId, setEditingWebhookId] = useState<string | null>(null);

  // Create / Edit Workflow Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [wfName, setWfName] = useState('');
  const [wfDesc, setWfDesc] = useState('');
  const [wfTrigger, setWfTrigger] = useState<WorkflowTriggerType>('lead_created');
  const [wfStage, setWfStage] = useState('Proposal Sent');
  const [wfSendEmail, setWfSendEmail] = useState(true);
  const [wfSendWhatsApp, setWfSendWhatsApp] = useState(false);
  const [wfCreateFollowup, setWfCreateFollowup] = useState(true);
  const [wfCreateNotif, setWfCreateNotif] = useState(true);
  const [wfEmailSubject, setWfEmailSubject] = useState('Welcome to OzoStack, {firstName}!');
  const [wfEmailBody, setWfEmailBody] = useState(
    'Hi {firstName},\n\nThank you for connecting with OzoStack regarding {company}. Our team will get in touch shortly.\n\nRegards,\n{owner}'
  );
  const [wfWaBody, setWfWaBody] = useState(
    'Hi {firstName}, thanks for connecting with OzoStack regarding {company}! We will reach out shortly.'
  );

  const isSmtpReady = Boolean(
    smtpConfig.senderEmail &&
      smtpConfig.password &&
      smtpConfig.password !== 'ozo-smtp-connected-v1'
  );
  const isWaReady = Boolean(
    waConfig.qrConnected || (waConfig.metaPhoneNumberId && waConfig.metaAccessToken)
  );

  const showBanner = (type: 'ok' | 'info' | 'err', text: string) => {
    setBanner({ type, text });
    setTimeout(() => setBanner((prev) => (prev?.text === text ? null : prev)), 6000);
  };

  const baseOrigin =
    typeof window !== 'undefined' && window.location.origin.startsWith('http')
      ? window.location.origin
      : 'https://ozostack.in';

  const getWebhookUrl = (src: ExternalWebhookSource) =>
    `${baseOrigin}/api/webhooks/lead?source=${src.id}&userId=${encodeURIComponent(
      currentUser?.id || ''
    )}&token=${encodeURIComponent(src.token)}`;

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Toggle CRM Workflow ON/OFF or Channel
  const handleToggleWorkflow = (id: string) => {
    const next = workflows.map((w) => (w.id === id ? { ...w, enabled: !w.enabled } : w));
    saveWorkflows(next);
  };

  const handleToggleWorkflowAction = (
    id: string,
    field: keyof CrmWorkflowRule['actions']
  ) => {
    const next = workflows.map((w) =>
      w.id === id ? { ...w, actions: { ...w.actions, [field]: !w.actions[field] } } : w
    );
    saveWorkflows(next);
  };

  const handleDeleteWorkflow = (id: string) => {
    saveWorkflows(workflows.filter((w) => w.id !== id));
    showBanner('info', 'Workflow rule removed.');
  };

  const openCreateModal = () => {
    setEditingRuleId(null);
    setWfName('');
    setWfDesc('');
    setWfTrigger('lead_created');
    setWfStage('Proposal Sent');
    setWfSendEmail(true);
    setWfSendWhatsApp(false);
    setWfCreateFollowup(true);
    setWfCreateNotif(true);
    setWfEmailSubject('Welcome to OzoStack, {firstName}!');
    setWfEmailBody(
      'Hi {firstName},\n\nThank you for connecting with OzoStack regarding {company}. Our team will connect with you shortly.\n\nBest regards,\n{owner}'
    );
    setWfWaBody(
      'Hi {firstName}, thank you for connecting with OzoStack regarding {company}! Our team will reach out shortly.'
    );
    setIsModalOpen(true);
  };

  const openEditModal = (rule: CrmWorkflowRule) => {
    setEditingRuleId(rule.id);
    setWfName(rule.name);
    setWfDesc(rule.description);
    setWfTrigger(rule.trigger);
    setWfStage(rule.stageCondition || 'Proposal Sent');
    setWfSendEmail(rule.actions.sendEmail);
    setWfSendWhatsApp(rule.actions.sendWhatsApp);
    setWfCreateFollowup(rule.actions.createFollowup);
    setWfCreateNotif(rule.actions.createNotification);
    setWfEmailSubject(rule.emailSubject);
    setWfEmailBody(rule.emailBody);
    setWfWaBody(rule.whatsappBody);
    setIsModalOpen(true);
  };

  const handleSaveWorkflowModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wfName.trim()) return;
    if (editingRuleId) {
      const updated = workflows.map((w) =>
        w.id === editingRuleId
          ? {
              ...w,
              name: wfName.trim(),
              description: wfDesc.trim() || TRIGGER_LABELS[wfTrigger],
              trigger: wfTrigger,
              stageCondition: wfTrigger === 'lead_stage_changed' ? wfStage : undefined,
              actions: {
                sendEmail: wfSendEmail,
                sendWhatsApp: wfSendWhatsApp,
                createFollowup: wfCreateFollowup,
                createNotification: wfCreateNotif,
              },
              emailSubject: wfEmailSubject,
              emailBody: wfEmailBody,
              whatsappBody: wfWaBody,
            }
          : w
      );
      saveWorkflows(updated);
      showBanner('ok', `Workflow "${wfName.trim()}" updated!`);
    } else {
      const created: CrmWorkflowRule = {
        id: `wf-${Date.now()}`,
        ownerUserId: currentUser?.id || 'default',
        name: wfName.trim(),
        description: wfDesc.trim() || TRIGGER_LABELS[wfTrigger],
        trigger: wfTrigger,
        stageCondition: wfTrigger === 'lead_stage_changed' ? wfStage : undefined,
        enabled: true,
        actions: {
          sendEmail: wfSendEmail,
          sendWhatsApp: wfSendWhatsApp,
          createFollowup: wfCreateFollowup,
          createNotification: wfCreateNotif,
        },
        emailSubject: wfEmailSubject,
        emailBody: wfEmailBody,
        whatsappBody: wfWaBody,
        runCount: 0,
        createdAt: new Date().toISOString(),
      };
      saveWorkflows([created, ...workflows]);
      showBanner('ok', `Workflow "${created.name}" created and activated!`);
    }
    setIsModalOpen(false);
  };

  // Test Run a CRM Workflow (sends test to logged-in user's own email / sample)
  const handleTestWorkflow = async (rule: CrmWorkflowRule) => {
    setTestingId(rule.id);
    try {
      const targetEmail = smtpConfig.senderEmail || currentUser?.email || '';
      const log = await runSingleWorkflowRule(rule, {
        name: currentUser?.name || 'Test Lead',
        email: targetEmail,
        phone: waConfig.connectedPhone || '',
        company: 'OzoStack Test Company',
        stage: rule.stageCondition || 'New Lead',
        value: '₹45,000',
        source: 'Workflow Test Run',
        owner: currentUser?.name || 'OzoStack',
      });
      showBanner(
        log.emailStatus === 'Sent' || log.whatsappStatus === 'Sent' ? 'ok' : 'info',
        `Test Run Complete — Email: ${log.emailStatus}, WhatsApp: ${log.whatsappStatus}. (${log.detail})`
      );
    } finally {
      setTestingId(null);
    }
  };

  // Update External Webhook Source
  const handleUpdateWebhookSource = (
    id: ExternalWebhookSource['id'],
    partial: Partial<ExternalWebhookSource>
  ) => {
    const next = webhookSources.map((s) => (s.id === id ? { ...s, ...partial } : s));
    saveWebhookSources(next);
  };

  // Live End-to-End Webhook Test against /api/webhooks/lead
  const handleTestExternalWebhook = async (src: ExternalWebhookSource) => {
    setTestingId(src.id);
    try {
      const res = await fetch(getWebhookUrl(src), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isTest: true,
          name: `${src.label.split(' ')[0]} Test Inquiry`,
          mobile: '+91 98765 43210',
          email: smtpConfig.senderEmail || currentUser?.email || 'test@ozostack.in',
          company: `${src.label.split(' ')[0]} Demo Client`,
          city: 'Mumbai',
          category: 'CRM Software Inquiry',
        }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.ok) {
        // Pull updated CRM state (new lead + log) immediately
        window.dispatchEvent(new Event('storage'));
        refresh();
        showBanner(
          'ok',
          `${src.label} Webhook Verified! Lead created in CRM · Email: ${
            data.emailSent ? 'Sent' : data.emailNote || 'Skipped'
          } · WhatsApp: ${data.whatsappSent ? 'Sent' : data.whatsappNote || 'Skipped'}`
        );
      } else {
        showBanner('err', data?.error || 'Webhook test failed.');
      }
    } catch (err: any) {
      showBanner('err', err?.message || 'Network error testing webhook.');
    } finally {
      setTestingId(null);
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

  const activeWorkflowsCount = workflows.filter((w) => w.enabled).length;
  const activeWebhooksCount = webhookSources.filter((s) => s.enabled).length;

  return (
    <div className="space-y-4">
      {/* Live Feedback Banner */}
      {banner && (
        <div
          className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs font-bold ${
            banner.type === 'ok'
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
              : banner.type === 'err'
              ? 'bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-300'
              : 'bg-sky-500/15 border-sky-500/40 text-sky-700 dark:text-sky-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {banner.type === 'ok' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{banner.text}</span>
          </div>
          <button onClick={() => setBanner(null)} className="p-1 rounded-lg hover:bg-black/10">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header & Channel Readiness Strip */}
      <div className={`p-4 sm:p-5 rounded-2xl border ${cardBg} space-y-4`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center shadow-md shrink-0">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                CRM Workflows &amp; External Lead Automation
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                <span>
                  Per-user isolated automation for <strong>{currentUser?.name}</strong> — Auto Email live now, WhatsApp &amp; JustDial/IndiaMART/Facebook Webhooks plug-and-play ready.
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={openCreateModal}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Workflow</span>
            </button>
          </div>
        </div>

        {/* Channel Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div
            className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
              isSmtpReady
                ? 'bg-emerald-500/5 border-emerald-500/30'
                : 'bg-amber-500/5 border-amber-500/30'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded-lg bg-sky-500/15 text-sky-500 shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                  Auto Email Engine (SMTP)
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {isSmtpReady
                    ? `Active & Ready (${smtpConfig.senderEmail})`
                    : 'Configure your SMTP in Email & Inbox to deliver real emails'}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveNav('Email')}
              className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold border border-sky-500/30 text-sky-600 dark:text-sky-400 hover:bg-sky-500/10 shrink-0 cursor-pointer"
            >
              {isSmtpReady ? 'Mail Settings' : 'Setup Email →'}
            </button>
          </div>

          <div
            className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
              isWaReady
                ? 'bg-emerald-500/5 border-emerald-500/30'
                : 'bg-slate-500/5 border-slate-500/20'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-500 shrink-0">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                  Auto WhatsApp Module (Meta API / QR Ready)
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {isWaReady
                    ? `Connected (${waConfig.connectedPhone || waConfig.metaPhoneNumberId})`
                    : 'Module ready — toggle ON anytime once you add Meta Cloud API or QR'}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveNav('WhatsApp')}
              className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 shrink-0 cursor-pointer"
            >
              {isWaReady ? 'Manage WA' : 'Connect Later →'}
            </button>
          </div>
        </div>

        {/* 3 Main Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => setActiveTab('workflows')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'workflows'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Module 1: Basic CRM Workflows ({activeWorkflowsCount}/{workflows.length} ON)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('webhooks')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'webhooks'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Webhook className="w-3.5 h-3.5" />
            <span>Module 2: External Webhooks — JustDial / IndiaMART / FB ({activeWebhooksCount}/4 ON)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'logs'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Execution Logs ({logs.length})</span>
          </button>
        </div>
      </div>

      {/* =================================================================== */}
      {/* TAB 1: MODULE 1 — BASIC CRM WORKFLOWS (ACTIVE NOW)                  */}
      {/* =================================================================== */}
      {activeTab === 'workflows' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {workflows.map((wf) => (
            <div key={wf.id} className={`p-5 rounded-2xl border flex flex-col justify-between gap-4 ${cardBg}`}>
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        {wf.name}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          wf.enabled
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : 'bg-slate-500/15 text-slate-500'
                        }`}
                      >
                        {wf.enabled ? 'ACTIVE' : 'PAUSED'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {wf.description}
                    </p>
                  </div>

                  {/* Master ON/OFF Switch */}
                  <button
                    type="button"
                    onClick={() => handleToggleWorkflow(wf.id)}
                    className={`w-11 h-6 rounded-full transition-colors p-0.5 shrink-0 cursor-pointer ${
                      wf.enabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                    title={wf.enabled ? 'Pause workflow' : 'Activate workflow'}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                        wf.enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Trigger Badge */}
                <div className="p-2.5 rounded-xl bg-sky-500/5 border border-sky-500/20 text-xs flex items-center gap-2">
                  <span className="font-extrabold text-sky-600 dark:text-sky-400 uppercase text-[10px]">
                    IF Trigger:
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {TRIGGER_LABELS[wf.trigger]}
                    {wf.stageCondition ? ` → "${wf.stageCondition}"` : ''}
                  </span>
                </div>

                {/* Action Channel Toggles */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleWorkflowAction(wf.id, 'sendEmail')}
                    className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1 cursor-pointer ${
                      wf.actions.sendEmail
                        ? 'bg-sky-500/15 border-sky-500/40 text-sky-600 dark:text-sky-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-400'
                    }`}
                  >
                    <Mail className="w-3 h-3" />
                    <span>Auto Email {wf.actions.sendEmail ? 'ON' : 'OFF'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleWorkflowAction(wf.id, 'sendWhatsApp')}
                    className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1 cursor-pointer ${
                      wf.actions.sendWhatsApp
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-400'
                    }`}
                  >
                    <MessageSquare className="w-3 h-3" />
                    <span>Auto WhatsApp {wf.actions.sendWhatsApp ? 'ON' : 'OFF'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleWorkflowAction(wf.id, 'createFollowup')}
                    className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1 cursor-pointer ${
                      wf.actions.createFollowup
                        ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-600 dark:text-indigo-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-400'
                    }`}
                  >
                    <CalendarCheck2 className="w-3 h-3" />
                    <span>Follow-up {wf.actions.createFollowup ? 'ON' : 'OFF'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleWorkflowAction(wf.id, 'createNotification')}
                    className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1 cursor-pointer ${
                      wf.actions.createNotification
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-400'
                    }`}
                  >
                    <Bell className="w-3 h-3" />
                    <span>Bell Alert</span>
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 text-[11px]">
                <span className="text-slate-400">
                  Runs: <strong className="text-slate-700 dark:text-slate-200">{wf.runCount}</strong>
                  {wf.lastRunAt && ` · Last: ${new Date(wf.lastRunAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleTestWorkflow(wf)}
                    disabled={testingId === wf.id}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Play className="w-3 h-3" />
                    <span>{testingId === wf.id ? 'Testing...' : 'Test Run'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditModal(wf)}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-sky-500 cursor-pointer"
                    title="Edit workflow & templates"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteWorkflow(wf.id)}
                    className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/40 text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                    title="Delete workflow"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: MODULE 2 — EXTERNAL LEAD WEBHOOKS (JUSTDIAL/INDIAMART/FB)    */}
      {/* =================================================================== */}
      {activeTab === 'webhooks' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl border bg-indigo-500/5 border-indigo-500/20 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-3">
            <Globe className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900 dark:text-white">
                Plug &amp; Play External Lead Capture (JustDial, IndiaMART, Facebook Ads &amp; Website):
              </strong>{' '}
              Jab bhi aap JustDial, IndiaMART, ya Facebook connect karein, sirf neeche diye gaye source ka switch <strong>ON</strong> karein aur uska Webhook URL paste kar dein. Har nayi lead automatically aapke CRM <strong>Leads</strong> page me save hogi aur instant <strong>Email / WhatsApp</strong> trigger ho jayega.
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {webhookSources.map((src) => {
              const url = getWebhookUrl(src);
              const guide = SOURCE_GUIDES[src.id];
              const isGuideOpen = expandedGuide === src.id;
              const isEditingTpl = editingWebhookId === src.id;

              return (
                <div key={src.id} className={`p-5 rounded-2xl border space-y-3.5 ${cardBg}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                          {src.label}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            src.enabled
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                              : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {src.enabled ? 'LIVE / ON' : 'READY (OFF)'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {src.description}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleUpdateWebhookSource(src.id, { enabled: !src.enabled })}
                      className={`w-11 h-6 rounded-full transition-colors p-0.5 shrink-0 cursor-pointer ${
                        src.enabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                      title={src.enabled ? 'Turn OFF source' : 'Turn ON source'}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                          src.enabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Webhook URL Copy Box */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      Your Live Webhook URL (GET / POST Supported):
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={url}
                        className={`${inputCls} font-mono text-[11px]`}
                      />
                      <button
                        type="button"
                        onClick={() => handleCopy(src.id, url)}
                        className="px-3 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        {copiedId === src.id ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>{copiedId === src.id ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Per-Source Auto Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateWebhookSource(src.id, { autoCreateLead: !src.autoCreateLead })
                      }
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold cursor-pointer ${
                        src.autoCreateLead
                          ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-600 dark:text-indigo-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-400'
                      }`}
                    >
                      Auto Add Lead {src.autoCreateLead ? 'ON' : 'OFF'}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateWebhookSource(src.id, { autoEmail: !src.autoEmail })
                      }
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1 cursor-pointer ${
                        src.autoEmail
                          ? 'bg-sky-500/15 border-sky-500/40 text-sky-600 dark:text-sky-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-400'
                      }`}
                    >
                      <Mail className="w-3 h-3" />
                      <span>Auto Email {src.autoEmail ? 'ON' : 'OFF'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateWebhookSource(src.id, { autoWhatsApp: !src.autoWhatsApp })
                      }
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1 cursor-pointer ${
                        src.autoWhatsApp
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-400'
                      }`}
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>Auto WhatsApp {src.autoWhatsApp ? 'ON' : 'OFF'}</span>
                    </button>
                  </div>

                  {/* Collapsible Template Editor */}
                  {isEditingTpl && (
                    <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                      <div>
                        <label className="font-bold block mb-1">Auto Email Subject</label>
                        <input
                          type="text"
                          value={src.emailSubject}
                          onChange={(e) =>
                            handleUpdateWebhookSource(src.id, { emailSubject: e.target.value })
                          }
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className="font-bold block mb-1">Auto Email Body</label>
                        <textarea
                          rows={3}
                          value={src.emailBody}
                          onChange={(e) =>
                            handleUpdateWebhookSource(src.id, { emailBody: e.target.value })
                          }
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className="font-bold block mb-1">Auto WhatsApp Message (when Meta API / QR enabled)</label>
                        <textarea
                          rows={2}
                          value={src.whatsappBody}
                          onChange={(e) =>
                            handleUpdateWebhookSource(src.id, { whatsappBody: e.target.value })
                          }
                          className={inputCls}
                        />
                      </div>
                    </div>
                  )}

                  {/* Collapsible Setup Guide */}
                  {isGuideOpen && (
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800 space-y-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                      <div className="font-extrabold text-slate-800 dark:text-white">
                        {guide.title}:
                      </div>
                      <ol className="list-decimal list-inside space-y-1">
                        {guide.steps.map((st, idx) => (
                          <li key={idx}>{st}</li>
                        ))}
                      </ol>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setExpandedGuide(isGuideOpen ? null : src.id)}
                        className="text-sky-500 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        {isGuideOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        <span>Setup Guide</span>
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => setEditingWebhookId(isEditingTpl ? null : src.id)}
                        className="text-indigo-500 font-bold cursor-pointer"
                      >
                        {isEditingTpl ? 'Hide Templates' : 'Edit Auto-Reply'}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleTestExternalWebhook(src)}
                      disabled={testingId === src.id}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Play className="w-3 h-3" />
                      <span>{testingId === src.id ? 'Testing...' : 'Test Webhook Live'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 3: EXECUTION LOGS                                               */}
      {/* =================================================================== */}
      {activeTab === 'logs' && (
        <div className={`rounded-2xl border overflow-hidden ${cardBg}`}>
          <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Recent Workflow &amp; Webhook Executions ({logs.length})
            </h3>
            {logs.length > 0 && (
              <button
                type="button"
                onClick={() => clearWorkflowLogs()}
                className="text-xs font-bold text-rose-500 hover:underline cursor-pointer"
              >
                Clear Logs
              </button>
            )}
          </div>

          {logs.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No workflow executions yet. Click <strong>"Test Run"</strong> on any workflow or create a new Lead to see live logs here.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <div className="font-extrabold text-slate-900 dark:text-white flex flex-wrap items-center gap-2">
                      <span>{log.workflowName}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-500">
                        {log.source}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Lead: <strong>{log.recipientName}</strong>
                      {log.recipientEmail ? ` · ${log.recipientEmail}` : ''}
                      {log.recipientPhone ? ` · ${log.recipientPhone}` : ''}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{log.detail}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        log.emailStatus === 'Sent'
                          ? 'bg-emerald-500/15 text-emerald-500'
                          : log.emailStatus === 'Failed'
                          ? 'bg-rose-500/15 text-rose-500'
                          : 'bg-slate-500/15 text-slate-400'
                      }`}
                    >
                      Email: {log.emailStatus}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        log.whatsappStatus === 'Sent'
                          ? 'bg-emerald-500/15 text-emerald-500'
                          : 'bg-slate-500/15 text-slate-400'
                      }`}
                    >
                      WA: {log.whatsappStatus}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(log.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* CREATE / EDIT WORKFLOW MODAL                                        */}
      {/* =================================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className={`w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden max-h-[90vh] flex flex-col ${cardBg}`}>
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                {editingRuleId ? 'Edit Workflow Rule' : 'Create Custom CRM Workflow'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveWorkflowModal} className="p-6 space-y-3.5 text-xs overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Workflow Name *</label>
                  <input
                    type="text"
                    required
                    value={wfName}
                    onChange={(e) => setWfName(e.target.value)}
                    placeholder="e.g. Hot Lead Instant Welcome"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Trigger Event</label>
                  <select
                    value={wfTrigger}
                    onChange={(e) => setWfTrigger(e.target.value as WorkflowTriggerType)}
                    className={inputCls}
                  >
                    <option value="lead_created">When New Lead is Created</option>
                    <option value="lead_stage_changed">When Lead Stage Changes</option>
                    <option value="deal_won">When Deal is Marked Won</option>
                    <option value="invoice_created">When Invoice is Created</option>
                  </select>
                </div>
              </div>

              {wfTrigger === 'lead_stage_changed' && (
                <div>
                  <label className="font-bold block mb-1">Target Stage</label>
                  <select
                    value={wfStage}
                    onChange={(e) => setWfStage(e.target.value)}
                    className={inputCls}
                  >
                    <option value="Any">Any Stage Change</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Qualified">Qualified</option>
                    <option value="Proposal Sent">Proposal Sent</option>
                    <option value="Negotiation">Negotiation</option>
                    <option value="Won">Won</option>
                  </select>
                </div>
              )}

              <div>
                <label className="font-bold block mb-1">Description</label>
                <input
                  type="text"
                  value={wfDesc}
                  onChange={(e) => setWfDesc(e.target.value)}
                  placeholder="Short note about what this automation does..."
                  className={inputCls}
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <label className="flex items-center gap-1.5 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={wfSendEmail}
                    onChange={(e) => setWfSendEmail(e.target.checked)}
                  />
                  <span>Auto Send Email</span>
                </label>
                <label className="flex items-center gap-1.5 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={wfSendWhatsApp}
                    onChange={(e) => setWfSendWhatsApp(e.target.checked)}
                  />
                  <span>Auto Send WhatsApp</span>
                </label>
                <label className="flex items-center gap-1.5 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={wfCreateFollowup}
                    onChange={(e) => setWfCreateFollowup(e.target.checked)}
                  />
                  <span>Auto Schedule Follow-up</span>
                </label>
                <label className="flex items-center gap-1.5 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={wfCreateNotif}
                    onChange={(e) => setWfCreateNotif(e.target.checked)}
                  />
                  <span>Notification Bell</span>
                </label>
              </div>

              <div>
                <label className="font-bold block mb-1">
                  Email Subject (placeholders: {'{firstName}'}, {'{company}'}, {'{stage}'}, {'{value}'})
                </label>
                <input
                  type="text"
                  value={wfEmailSubject}
                  onChange={(e) => setWfEmailSubject(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Email Body</label>
                <textarea
                  rows={4}
                  value={wfEmailBody}
                  onChange={(e) => setWfEmailBody(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div>
                <label className="font-bold block mb-1">WhatsApp Message Body (Ready when Meta API / QR linked)</label>
                <textarea
                  rows={2}
                  value={wfWaBody}
                  onChange={(e) => setWfWaBody(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold cursor-pointer"
                >
                  Save Workflow
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
