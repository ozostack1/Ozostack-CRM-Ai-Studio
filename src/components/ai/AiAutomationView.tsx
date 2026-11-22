import React, { useState, useEffect, useMemo } from 'react';
import {
  Bot,
  Sparkles,
  Flame,
  Mail,
  MessageSquare,
  Send,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  FileText,
  Inbox,
  X,
  Check,
  Wand2,
  TrendingUp,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useSystemCurrency } from '../../data/currencyService';
import {
  useSmtpConfig,
  sendDirectEmail,
} from '../../data/emailService';
import { sendDirectWhatsApp, useWhatsAppCenter } from '../../data/whatsappService';
import { Lead } from '../../types/crm';

interface AiLeadScoreItem {
  leadId: string;
  score: number;
  priority: 'Hot' | 'Warm' | 'Cold';
  reason: string;
  nextAction: string;
}

const AI_USER_KEY_STORAGE = (userId: string) => `ozostack_gemini_key_user_v1_${userId}`;

export const AiAutomationView: React.FC = () => {
  const { theme } = useTheme();
  const { currentUser, scopeFilter } = useAuth();
  const currency = useSystemCurrency();
  const { config: smtpConfig, messages: mailboxMessages } = useSmtpConfig();
  const { config: waConfig } = useWhatsAppCenter();
  const isLight = theme === 'white-sky';

  const userId = currentUser?.id || 'default';

  // Server & Optional User Gemini Key State
  const [serverAiReady, setServerAiReady] = useState<boolean>(false);
  const [serverModel, setServerModel] = useState<string>('gemini-2.5-flash');
  const [customApiKey, setCustomApiKey] = useState<string>(() => {
    try {
      return localStorage.getItem(AI_USER_KEY_STORAGE(userId)) || '';
    } catch {
      return '';
    }
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'scoring' | 'followup' | 'inbox' | 'briefing'>(
    'scoring'
  );
  const [banner, setBanner] = useState<{ type: 'ok' | 'err' | 'info'; text: string } | null>(null);

  // Tab 1: AI Lead Scoring
  const [isScoring, setIsScoring] = useState(false);
  const [aiScores, setAiScores] = useState<Record<string, AiLeadScoreItem>>({});
  const [scoresApplied, setScoresApplied] = useState(false);

  // Tab 2: AI Follow-up Generator
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [followupChannel, setFollowupChannel] = useState<'email' | 'whatsapp'>('email');
  const [followupTone, setFollowupTone] = useState<
    'Professional' | 'Friendly' | 'Urgent Close' | 'Hinglish'
  >('Professional');
  const [genSubject, setGenSubject] = useState('');
  const [genBody, setGenBody] = useState('');
  const [isGeneratingFollowup, setIsGeneratingFollowup] = useState(false);
  const [isSendingFollowup, setIsSendingFollowup] = useState(false);

  // Tab 3: AI Inbox Reply Assistant
  const [selectedEmailId, setSelectedEmailId] = useState<string>('');
  const [replyTone, setReplyTone] = useState<'Professional' | 'Friendly' | 'Short' | 'Hinglish'>(
    'Professional'
  );
  const [replyDraft, setReplyDraft] = useState('');
  const [isGeneratingReply, setIsGeneratingReply] = useState(false);
  const [isSendingReply, setIsSendingReply] = useState(false);

  // Tab 4: AI Daily Briefing
  const [briefingLang, setBriefingLang] = useState<'English' | 'Hinglish'>('Hinglish');
  const [briefingText, setBriefingText] = useState('');
  const [isGeneratingBriefing, setIsGeneratingBriefing] = useState(false);

  const showBanner = (type: 'ok' | 'err' | 'info', text: string) => {
    setBanner({ type, text });
    setTimeout(() => setBanner((prev) => (prev?.text === text ? null : prev)), 6000);
  };

  // Check Server Gemini API status on mount
  useEffect(() => {
    fetch('/api/ai/status', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (d?.ok) {
          setServerAiReady(Boolean(d.configured));
          if (d.model) setServerModel(d.model);
        }
      })
      .catch(() => {});
  }, []);

  // Load scoped CRM Leads
  const [leadsTick, setLeadsTick] = useState(0);
  const leads = useMemo<Lead[]>(() => {
    try {
      const raw = localStorage.getItem('ozostack_leads_v2');
      const parsed = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(parsed)) return [];
      return scopeFilter(parsed, (l: Lead) => ({ owner: l.owner }));
    } catch {
      return [];
    }
  }, [scopeFilter, leadsTick]);

  useEffect(() => {
    if (!selectedLeadId && leads.length > 0) {
      setSelectedLeadId(leads[0].id);
    }
  }, [leads, selectedLeadId]);

  const inboxEmails = useMemo(
    () => mailboxMessages.filter((m) => m.folder === 'inbox').slice(0, 25),
    [mailboxMessages]
  );

  useEffect(() => {
    if (!selectedEmailId && inboxEmails.length > 0) {
      setSelectedEmailId(inboxEmails[0].id);
    }
  }, [inboxEmails, selectedEmailId]);

  const selectedLead = useMemo(
    () => leads.find((l) => l.id === selectedLeadId) || leads[0] || null,
    [leads, selectedLeadId]
  );

  const selectedEmail = useMemo(
    () => inboxEmails.find((e) => e.id === selectedEmailId) || inboxEmails[0] || null,
    [inboxEmails, selectedEmailId]
  );

  const callGeminiApi = async (params: {
    prompt: string;
    systemInstruction?: string;
    jsonMode?: boolean;
  }): Promise<{ ok: boolean; text?: string; error?: string }> => {
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: params.prompt,
          systemInstruction: params.systemInstruction,
          jsonMode: params.jsonMode,
          userApiKey: customApiKey.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.ok && data.text) {
        return { ok: true, text: data.text };
      }
      return { ok: false, error: data?.error || 'Gemini API request failed.' };
    } catch (err: any) {
      return { ok: false, error: err?.message || 'Network error calling Gemini API.' };
    }
  };

  // 1. Run Gemini AI Lead Scoring
  const handleRunAiLeadScoring = async () => {
    if (leads.length === 0) {
      showBanner('info', 'No leads found to analyze. Add leads in CRM first.');
      return;
    }
    setIsScoring(true);
    setScoresApplied(false);
    try {
      const compactLeads = leads.slice(0, 20).map((l) => ({
        leadId: l.id,
        name: l.name,
        company: l.company,
        status: l.status,
        value: l.value,
        source: l.source,
        notes: l.notes || '',
      }));

      const res = await callGeminiApi({
        jsonMode: true,
        systemInstruction:
          'You are a B2B CRM Sales Intelligence AI. Analyze each lead and return a JSON array of objects with exact keys: leadId (string), score (integer 0-100), priority ("Hot" | "Warm" | "Cold"), reason (short 1-line explanation), nextAction (short 1-line recommended next step).',
        prompt: `Analyze these CRM leads and score their likelihood to close:\n${JSON.stringify(
          compactLeads
        )}`,
      });

      if (!res.ok || !res.text) {
        showBanner('err', res.error || 'Gemini AI scoring failed.');
        return;
      }

      const parsed = JSON.parse(res.text);
      const list: AiLeadScoreItem[] = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.leads)
        ? parsed.leads
        : [];
      const map: Record<string, AiLeadScoreItem> = {};
      for (const item of list) {
        if (item?.leadId) {
          map[item.leadId] = {
            leadId: item.leadId,
            score: Math.max(0, Math.min(100, Number(item.score) || 50)),
            priority:
              item.priority === 'Hot' || item.priority === 'Warm' || item.priority === 'Cold'
                ? item.priority
                : 'Warm',
            reason: item.reason || 'Analyzed by Gemini AI',
            nextAction: item.nextAction || 'Follow up via Email / Call',
          };
        }
      }
      setAiScores(map);
      showBanner('ok', `Gemini AI analyzed and scored ${Object.keys(map).length} leads!`);
    } catch {
      showBanner('err', 'Could not parse Gemini AI JSON response. Please try again.');
    } finally {
      setIsScoring(false);
    }
  };

  const handleApplyScoresToLeads = () => {
    try {
      const raw = localStorage.getItem('ozostack_leads_v2');
      const allLeads: Lead[] = raw ? JSON.parse(raw) : [];
      const updated = allLeads.map((l) => {
        const ai = aiScores[l.id];
        return ai ? { ...l, score: ai.score, priority: ai.priority } : l;
      });
      localStorage.setItem('ozostack_leads_v2', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('ozostack-crm-config-changed'));
      setLeadsTick((t) => t + 1);
      setScoresApplied(true);
      showBanner('ok', 'AI scores & Hot/Warm/Cold priorities saved directly into CRM Leads!');
    } catch {
      showBanner('err', 'Failed to update leads.');
    }
  };

  // 2. Generate Personalized Follow-up with Gemini AI
  const handleGenerateFollowup = async () => {
    if (!selectedLead) return;
    setIsGeneratingFollowup(true);
    try {
      const res = await callGeminiApi({
        jsonMode: true,
        systemInstruction:
          'You are an expert B2B sales copywriter for OzoStack CRM. Return a JSON object with exact keys: subject (string, concise email subject) and body (string, ready-to-send personalized message with proper spacing and sign-off). No markdown fences.',
        prompt: `Write a personalized ${followupChannel} follow-up in "${followupTone}" tone for this lead:
Name: ${selectedLead.name}
Company: ${selectedLead.company}
Current Stage: ${selectedLead.status}
Deal Value: ${currency.symbol}${selectedLead.value.toLocaleString()}
Source: ${selectedLead.source}
Notes: ${selectedLead.notes || 'None'}
Sender Name: ${smtpConfig.senderName || currentUser?.name || 'OzoStack Team'}`,
      });

      if (!res.ok || !res.text) {
        showBanner('err', res.error || 'Gemini AI generation failed.');
        return;
      }

      const parsed = JSON.parse(res.text);
      setGenSubject(parsed.subject || `Follow-up regarding ${selectedLead.company}`);
      setGenBody(parsed.body || '');
      showBanner('ok', `Fresh ${followupTone} ${followupChannel} draft generated by Gemini AI!`);
    } catch {
      showBanner('err', 'Could not parse Gemini AI draft. Please try again.');
    } finally {
      setIsGeneratingFollowup(false);
    }
  };

  const handleSendGeneratedFollowup = async () => {
    if (!selectedLead || !genBody.trim()) return;
    setIsSendingFollowup(true);
    try {
      if (followupChannel === 'email') {
        const res = await sendDirectEmail({
          to: selectedLead.email,
          subject: genSubject || `Follow-up for ${selectedLead.company}`,
          body: genBody,
          recipientName: selectedLead.name,
        });
        if (res.ok && res.realExternalDelivery) {
          showBanner('ok', `AI Email delivered to ${selectedLead.email} via ${res.senderEmail}!`);
        } else {
          showBanner('err', res.error || res.message || 'Email delivery failed.');
        }
      } else {
        const res = await sendDirectWhatsApp({
          toPhone: selectedLead.whatsapp || selectedLead.phone,
          contactName: selectedLead.name,
          company: selectedLead.company,
          text: genBody,
          allowWebFallback: true,
        });
        showBanner(res.realDelivered ? 'ok' : 'info', res.message);
      }
    } finally {
      setIsSendingFollowup(false);
    }
  };

  // 3. Generate Smart Inbox Email Reply with Gemini AI
  const handleGenerateInboxReply = async () => {
    if (!selectedEmail) return;
    setIsGeneratingReply(true);
    try {
      const res = await callGeminiApi({
        systemInstruction:
          'You are an executive email assistant for OzoStack. Write a clear, helpful, ready-to-send email reply body only (no Subject line needed, include polite greeting and sign-off).',
        prompt: `Write a "${replyTone}" reply to this incoming email:
From: ${selectedEmail.fromName} <${selectedEmail.fromEmail}>
Subject: ${selectedEmail.subject}
Email Body:
${(selectedEmail.body || '').slice(0, 1500)}

Reply Sender Name: ${smtpConfig.senderName || currentUser?.name || 'OzoStack Team'}`,
      });
      if (!res.ok || !res.text) {
        showBanner('err', res.error || 'Gemini AI reply generation failed.');
        return;
      }
      setReplyDraft(res.text);
      showBanner('ok', 'Smart reply drafted by Gemini AI! Review and click Send Reply.');
    } finally {
      setIsGeneratingReply(false);
    }
  };

  const handleSendInboxReply = async () => {
    if (!selectedEmail || !replyDraft.trim()) return;
    setIsSendingReply(true);
    try {
      const subject = selectedEmail.subject.startsWith('Re:')
        ? selectedEmail.subject
        : `Re: ${selectedEmail.subject}`;
      const res = await sendDirectEmail({
        to: selectedEmail.fromEmail,
        subject,
        body: replyDraft,
        recipientName: selectedEmail.fromName,
      });
      if (res.ok && res.realExternalDelivery) {
        showBanner('ok', `Reply delivered to ${selectedEmail.fromEmail}!`);
        setReplyDraft('');
      } else {
        showBanner('err', res.error || res.message || 'Reply failed.');
      }
    } finally {
      setIsSendingReply(false);
    }
  };

  // 4. Generate Daily CEO / Sales Briefing with Gemini AI
  const handleGenerateBriefing = async () => {
    setIsGeneratingBriefing(true);
    try {
      const readList = (key: string) => {
        try {
          const r = localStorage.getItem(key);
          const p = r ? JSON.parse(r) : [];
          return Array.isArray(p) ? p : [];
        } catch {
          return [];
        }
      };

      const deals = readList('ozostack_deals_v2');
      const followups = readList('ozostack_followups_v2');
      const invoices = readList('ozostack_invoices_v1');
      const unreadInbox = inboxEmails.filter((e) => !e.read).length;

      const summaryData = {
        userName: currentUser?.name,
        totalLeads: leads.length,
        hotLeads: leads.filter((l) => l.priority === 'Hot').map((l) => `${l.name} (${l.company})`),
        recentLeads: leads.slice(0, 5).map((l) => `${l.name} - ${l.company} (${l.status}, ${currency.symbol}${l.value})`),
        openDealsCount: deals.filter((d: any) => d.stage !== 'Closed Won' && d.stage !== 'Closed Lost').length,
        pendingFollowups: followups.filter((f: any) => f.status !== 'Completed').slice(0, 5).map((f: any) => `${f.title} (Due: ${f.dueDate})`),
        unpaidInvoices: invoices.filter((i: any) => i.status !== 'Paid').length,
        unreadEmailsCount: unreadInbox,
      };

      const res = await callGeminiApi({
        systemInstruction: `You are an AI Chief of Staff & Sales Director for OzoStack CRM. Write a crisp, actionable daily priority briefing in ${briefingLang} using clean bullet points: 1) Top Priorities Today, 2) Leads to Follow Up Immediately, 3) Quick Revenue Wins.`,
        prompt: `Generate today's CRM action briefing from this live workspace data:\n${JSON.stringify(
          summaryData,
          null,
          2
        )}`,
      });

      if (!res.ok || !res.text) {
        showBanner('err', res.error || 'Gemini AI briefing failed.');
        return;
      }
      setBriefingText(res.text);
      showBanner('ok', 'Daily AI Briefing generated from your live CRM data!');
    } finally {
      setIsGeneratingBriefing(false);
    }
  };

  const handleSaveCustomKey = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (customApiKey.trim()) {
        localStorage.setItem(AI_USER_KEY_STORAGE(userId), customApiKey.trim());
      } else {
        localStorage.removeItem(AI_USER_KEY_STORAGE(userId));
      }
    } catch {}
    setIsSettingsOpen(false);
    showBanner(
      'ok',
      customApiKey.trim()
        ? 'Custom Gemini API key saved for your account.'
        : 'Switched back to server Free Tier Gemini API key.'
    );
  };

  const cardBg = isLight
    ? 'bg-white border-sky-100/90 shadow-xs'
    : 'bg-[#0f172a]/95 border-slate-800';
  const inputCls = `w-full px-3 py-2 rounded-xl border text-xs font-medium outline-none ${
    isLight
      ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-sky-500 focus:bg-white'
      : 'bg-slate-900 border-slate-700 text-white focus:border-sky-400'
  }`;

  const isGeminiActive = serverAiReady || Boolean(customApiKey.trim());

  return (
    <div className="space-y-4">
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

      {/* Header */}
      <div className={`p-4 sm:p-5 rounded-2xl border ${cardBg} space-y-4`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500 via-sky-500 to-emerald-500 text-white flex items-center justify-center shadow-md shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                  AI Automation Studio
                </h1>
                {isGeminiActive ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Gemini API Active ({serverModel})</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    Gemini API Key Required
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                100% live Google Gemini AI powered Lead Scoring, Personalized Email/WhatsApp Follow-ups, Inbox Replies, and Daily Sales Briefings.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsSettingsOpen((p) => !p)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 hover:border-sky-500 cursor-pointer self-start lg:self-auto"
          >
            <KeyRound className="w-3.5 h-3.5 text-sky-500" />
            <span>AI API Settings</span>
          </button>
        </div>

        {/* Collapsible Optional Custom API Key Override */}
        {isSettingsOpen && (
          <form
            onSubmit={handleSaveCustomKey}
            className="p-4 rounded-xl bg-sky-500/5 border border-sky-500/20 flex flex-col sm:flex-row items-end gap-3 text-xs"
          >
            <div className="flex-1 w-full">
              <label className="font-bold block mb-1">
                Optional Custom Gemini API Key (Leave blank to use Server Free Tier Key)
              </label>
              <input
                type="password"
                value={customApiKey}
                onChange={(e) => setCustomApiKey(e.target.value)}
                placeholder="AIza... (optional override)"
                className={inputCls}
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold cursor-pointer shrink-0"
            >
              Save AI Key
            </button>
          </form>
        )}

        {/* 4 Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => setActiveTab('scoring')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'scoring'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>1. AI Lead Scoring ({leads.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('followup')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'followup'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>2. AI Follow-up Sender</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('inbox')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'inbox'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Inbox className="w-3.5 h-3.5" />
            <span>3. AI Inbox Replies ({inboxEmails.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('briefing')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'briefing'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>4. AI Daily Briefing</span>
          </button>
        </div>
      </div>

      {/* =================================================================== */}
      {/* TAB 1: AI LEAD SCORING & HOT FINDER                                 */}
      {/* =================================================================== */}
      {activeTab === 'scoring' && (
        <div className={`p-5 rounded-2xl border space-y-4 ${cardBg}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Gemini AI Lead Scoring &amp; Priority Engine
              </h2>
              <p className="text-xs text-slate-500">
                Let Gemini AI evaluate your live Leads, assign 0–100 closing scores, and suggest the exact next action for each lead.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {Object.keys(aiScores).length > 0 && (
                <button
                  type="button"
                  onClick={handleApplyScoresToLeads}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{scoresApplied ? 'Applied to CRM Leads!' : 'Apply AI Scores to Leads'}</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleRunAiLeadScoring}
                disabled={isScoring}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isScoring ? 'animate-spin' : ''}`} />
                <span>{isScoring ? 'Analyzing with Gemini...' : 'Analyze Leads with Gemini AI'}</span>
              </button>
            </div>
          </div>

          {leads.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
              No leads in your workspace yet. Add leads in the Leads section first.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {leads.map((lead) => {
                const ai = aiScores[lead.id];
                return (
                  <div
                    key={lead.id}
                    className="py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{lead.name}</span>
                        <span className="text-sky-500 font-semibold">· {lead.company}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {lead.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {lead.email} · {lead.phone} · Value: {currency.symbol}
                        {lead.value.toLocaleString()}
                      </div>
                      {ai && (
                        <div className="text-[11px] text-indigo-600 dark:text-indigo-300 pt-1">
                          <strong>AI Insight:</strong> {ai.reason} → <strong>Next:</strong>{' '}
                          {ai.nextAction}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold ${
                          (ai?.priority || lead.priority) === 'Hot'
                            ? 'bg-rose-500/15 text-rose-500'
                            : (ai?.priority || lead.priority) === 'Warm'
                            ? 'bg-amber-500/15 text-amber-500'
                            : 'bg-sky-500/15 text-sky-500'
                        }`}
                      >
                        {ai ? `AI: ${ai.priority} (${ai.score}/100)` : `${lead.priority} (${lead.score}/100)`}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedLeadId(lead.id);
                          setActiveTab('followup');
                        }}
                        className="px-3 py-1.5 rounded-lg border border-sky-500/30 text-sky-600 dark:text-sky-400 hover:bg-sky-500/10 text-[11px] font-bold cursor-pointer"
                      >
                        AI Follow-up →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: AI PERSONALIZED FOLLOW-UP GENERATOR & DIRECT SENDER          */}
      {/* =================================================================== */}
      {activeTab === 'followup' && (
        <div className={`p-5 rounded-2xl border space-y-4 ${cardBg}`}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div className="md:col-span-2">
              <label className="font-bold block mb-1">Select CRM Lead</label>
              <select
                value={selectedLead?.id || ''}
                onChange={(e) => setSelectedLeadId(e.target.value)}
                className={inputCls}
              >
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} — {l.company} ({l.status})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-bold block mb-1">Channel</label>
              <select
                value={followupChannel}
                onChange={(e) => setFollowupChannel(e.target.value as 'email' | 'whatsapp')}
                className={inputCls}
              >
                <option value="email">Direct Email (SMTP)</option>
                <option value="whatsapp">WhatsApp ({waConfig.qrConnected ? 'Linked' : 'Ready'})</option>
              </select>
            </div>
            <div>
              <label className="font-bold block mb-1">AI Tone / Language</label>
              <select
                value={followupTone}
                onChange={(e) => setFollowupTone(e.target.value as any)}
                className={inputCls}
              >
                <option value="Professional">Professional</option>
                <option value="Friendly">Friendly</option>
                <option value="Urgent Close">Urgent Close</option>
                <option value="Hinglish">Hindi / Hinglish</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGenerateFollowup}
            disabled={isGeneratingFollowup || !selectedLead}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 disabled:opacity-50 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className={`w-4 h-4 ${isGeneratingFollowup ? 'animate-spin' : ''}`} />
            <span>
              {isGeneratingFollowup
                ? 'Writing personalized draft with Gemini AI...'
                : 'Generate Personalized Draft with Gemini AI'}
            </span>
          </button>

          {followupChannel === 'email' && (
            <div className="text-xs">
              <label className="font-bold block mb-1">Generated Subject</label>
              <input
                type="text"
                value={genSubject}
                onChange={(e) => setGenSubject(e.target.value)}
                placeholder="Click Generate above..."
                className={inputCls}
              />
            </div>
          )}

          <div className="text-xs">
            <label className="font-bold block mb-1">Generated Message (Editable)</label>
            <textarea
              rows={7}
              value={genBody}
              onChange={(e) => setGenBody(e.target.value)}
              placeholder="Gemini AI generated message will appear here..."
              className={inputCls}
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSendGeneratedFollowup}
              disabled={isSendingFollowup || !genBody.trim() || !selectedLead}
              className={`px-5 py-2.5 rounded-xl text-white text-xs font-extrabold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer ${
                followupChannel === 'email'
                  ? 'bg-sky-600 hover:bg-sky-500'
                  : 'bg-emerald-600 hover:bg-emerald-500'
              }`}
            >
              {followupChannel === 'email' ? (
                <Mail className="w-3.5 h-3.5" />
              ) : (
                <MessageSquare className="w-3.5 h-3.5" />
              )}
              <span>
                {isSendingFollowup
                  ? 'Sending...'
                  : followupChannel === 'email'
                  ? `Send Direct Email to ${selectedLead?.email || ''}`
                  : `Send WhatsApp to ${selectedLead?.name || ''}`}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 3: AI INBOX EMAIL REPLY ASSISTANT                               */}
      {/* =================================================================== */}
      {activeTab === 'inbox' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className={`lg:col-span-5 rounded-2xl border overflow-hidden ${cardBg}`}>
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 text-xs font-extrabold text-slate-500 uppercase">
              Your Synced Inbox Emails ({inboxEmails.length})
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[420px] overflow-y-auto">
              {inboxEmails.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No synced inbox emails yet. Open <strong>Email &amp; Inbox</strong> and click Sync Inbox first.
                </div>
              ) : (
                inboxEmails.map((em) => (
                  <div
                    key={em.id}
                    onClick={() => {
                      setSelectedEmailId(em.id);
                      setReplyDraft('');
                    }}
                    className={`p-3.5 cursor-pointer text-xs ${
                      selectedEmail?.id === em.id
                        ? 'bg-sky-500/10 border-l-4 border-l-sky-500'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="font-extrabold text-slate-900 dark:text-white truncate">
                      {em.fromName}
                    </div>
                    <div className="text-[11px] font-semibold text-sky-500 truncate">
                      {em.subject}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate mt-0.5">{em.body}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className={`lg:col-span-7 p-5 rounded-2xl border space-y-3.5 ${cardBg}`}>
            {!selectedEmail ? (
              <div className="py-16 text-center text-xs text-slate-400">
                Select an incoming email on the left to draft an instant Gemini AI reply.
              </div>
            ) : (
              <>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800 text-xs space-y-1">
                  <div className="font-extrabold text-slate-900 dark:text-white">
                    {selectedEmail.subject}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    From: {selectedEmail.fromName} &lt;{selectedEmail.fromEmail}&gt;
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-300 max-h-24 overflow-y-auto whitespace-pre-wrap pt-1">
                    {(selectedEmail.body || '').slice(0, 500)}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <select
                    value={replyTone}
                    onChange={(e) => setReplyTone(e.target.value as any)}
                    className={`${inputCls} w-auto`}
                  >
                    <option value="Professional">Professional Reply</option>
                    <option value="Friendly">Friendly Reply</option>
                    <option value="Short">Short &amp; Crisp</option>
                    <option value="Hinglish">Hinglish Reply</option>
                  </select>

                  <button
                    type="button"
                    onClick={handleGenerateInboxReply}
                    disabled={isGeneratingReply}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isGeneratingReply ? 'animate-spin' : ''}`} />
                    <span>{isGeneratingReply ? 'Drafting Reply...' : 'Draft Smart Reply with Gemini'}</span>
                  </button>
                </div>

                <textarea
                  rows={6}
                  value={replyDraft}
                  onChange={(e) => setReplyDraft(e.target.value)}
                  placeholder="Click 'Draft Smart Reply with Gemini' to generate a context-aware reply..."
                  className={inputCls}
                />

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleSendInboxReply}
                    disabled={isSendingReply || !replyDraft.trim()}
                    className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSendingReply ? 'Sending Reply...' : `Send Reply to ${selectedEmail.fromEmail}`}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 4: AI DAILY SALES & CEO BRIEFING                                */}
      {/* =================================================================== */}
      {activeTab === 'briefing' && (
        <div className={`p-5 rounded-2xl border space-y-4 ${cardBg}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Gemini AI Daily Priority Briefing
              </h2>
              <p className="text-xs text-slate-500">
                Scans your live Leads, Deals, Follow-ups, Invoices, and Unread Emails to create today&apos;s exact action plan.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={briefingLang}
                onChange={(e) => setBriefingLang(e.target.value as 'English' | 'Hinglish')}
                className={`${inputCls} w-auto`}
              >
                <option value="Hinglish">Hinglish</option>
                <option value="English">English</option>
              </select>
              <button
                type="button"
                onClick={handleGenerateBriefing}
                disabled={isGeneratingBriefing}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>
                  {isGeneratingBriefing ? 'Generating Briefing...' : 'Generate Today’s AI Briefing'}
                </span>
              </button>
            </div>
          </div>

          {briefingText ? (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 text-xs leading-relaxed whitespace-pre-wrap text-slate-800 dark:text-slate-100">
              {briefingText}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">
              Click <strong>&quot;Generate Today&apos;s AI Briefing&quot;</strong> to get your live Gemini AI action plan.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
