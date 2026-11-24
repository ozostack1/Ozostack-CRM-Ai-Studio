import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  Cpu,
  Download,
  ExternalLink,
  Globe,
  KeyRound,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Lead } from '../../types/crm';

interface DiscoveredLead {
  id: string;
  name: string;
  category: string;
  address: string;
  city: string;
  phone: string;
  phoneVerified: boolean;
  whatsapp: string;
  email: string;
  emailStatus: 'verified' | 'unverified' | 'missing';
  website: string;
  websiteLive: boolean;
  rating: number | null;
  reviewsCount: number | null;
  sourceEngine: string;
  socials?: { instagram?: string; facebook?: string; linkedin?: string };
  verificationStatus: 'Verified' | 'Partial' | 'Unverified';
  aiScore?: number;
  priority?: 'Hot' | 'Warm' | 'Cold';
  opportunity?: string;
  pitchEmailSubject?: string;
  pitchEmailBody?: string;
  pitchWhatsApp?: string;
}

interface AgentUserConfig {
  businessOffer: string;
  pitchTone: 'Professional' | 'Friendly' | 'Hinglish';
  serperApiKey: string;
  googlePlacesApiKey: string;
}

const DEFAULT_CONFIG: AgentUserConfig = {
  businessOffer: 'Website Development, Custom CRM & Digital Growth Services',
  pitchTone: 'Professional',
  serperApiKey: '',
  googlePlacesApiKey: '',
};

const QUICK_CATEGORIES = [
  'Dental Clinic',
  'Real Estate',
  'Hotel',
  'Restaurant',
  'Gym',
  'Digital Marketing',
  'School',
  'Hospital',
  'Interior Design',
];

const LEADS_STORAGE_KEY = (uid: string) => `ozostack_ai_agent_leads_user_v1_${uid}`;
const CFG_STORAGE_KEY = (uid: string) => `ozostack_ai_agent_cfg_user_v1_${uid}`;
const AI_USER_KEY_STORAGE = (uid: string) => `ozostack_gemini_key_user_v1_${uid}`;

function normalizeDigits(val?: string): string {
  const d = String(val || '').replace(/[^0-9]/g, '');
  return d.length > 10 ? d.slice(-10) : d;
}

function loadExistingCrmLeads(): Lead[] {
  try {
    const raw = localStorage.getItem('ozostack_leads_v2');
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export const AiAgentsView: React.FC = () => {
  const { theme } = useTheme();
  const { currentUser, can } = useAuth();
  const isLight = theme === 'white-sky';
  const userId = currentUser?.id || 'default';

  const canImportLeads = can('AI Agents', 'create') || can('Leads', 'create');
  const canExportCsv = can('AI Agents', 'export') || can('Leads', 'export');

  // Search form state
  const [category, setCategory] = useState('Dental Clinic');
  const [city, setCity] = useState('Mumbai');
  const [limit, setLimit] = useState<number>(12);
  const [enrichWebsites, setEnrichWebsites] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  // Per-user config & staging leads
  const [agentCfg, setAgentCfg] = useState<AgentUserConfig>(DEFAULT_CONFIG);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [leads, setLeads] = useState<DiscoveredLead[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filterMode, setFilterMode] = useState<'all' | 'verified' | 'email' | 'phone' | 'new'>('all');
  const [isVerifyingAi, setIsVerifyingAi] = useState(false);
  const [pitchModalLead, setPitchModalLead] = useState<DiscoveredLead | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [crmLeadsTick, setCrmLeadsTick] = useState(0);
  const [banner, setBanner] = useState<{ type: 'ok' | 'err' | 'info'; text: string } | null>(null);

  const showBanner = (type: 'ok' | 'err' | 'info', text: string) => {
    setBanner({ type, text });
    setTimeout(() => setBanner((prev) => (prev?.text === text ? null : prev)), 6000);
  };

  // Load per-user isolated state & reset cleanly on user switch
  useEffect(() => {
    try {
      const savedLeads = localStorage.getItem(LEADS_STORAGE_KEY(userId));
      setLeads(savedLeads ? JSON.parse(savedLeads) : []);
    } catch {
      setLeads([]);
    }
    try {
      const savedCfg = localStorage.getItem(CFG_STORAGE_KEY(userId));
      setAgentCfg(savedCfg ? { ...DEFAULT_CONFIG, ...JSON.parse(savedCfg) } : DEFAULT_CONFIG);
    } catch {
      setAgentCfg(DEFAULT_CONFIG);
    }
    setSelectedIds([]);
    setPitchModalLead(null);
    setCrmLeadsTick((t) => t + 1);
  }, [userId]);

  const persistLeads = (next: DiscoveredLead[]) => {
    setLeads(next);
    try {
      localStorage.setItem(LEADS_STORAGE_KEY(userId), JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const persistConfig = (next: AgentUserConfig) => {
    setAgentCfg(next);
    try {
      localStorage.setItem(CFG_STORAGE_KEY(userId), JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  // Build existing CRM duplicate lookup sets (by normalized 10-digit phone, email, or name+company)
  const existingDuplicateSets = useMemo(() => {
    const crmLeads = loadExistingCrmLeads();
    const phones = new Set<string>();
    const emails = new Set<string>();
    const names = new Set<string>();
    for (const l of crmLeads) {
      const p = normalizeDigits(l.phone);
      if (p.length >= 10) phones.add(p);
      const e = String(l.email || '').trim().toLowerCase();
      if (e && !e.endsWith('.local')) emails.add(e);
      const n = String(l.company || l.name || '').trim().toLowerCase();
      if (n) names.add(n);
    }
    return { phones, emails, names };
  }, [crmLeadsTick, leads.length]);

  const isDuplicateInCrm = (lead: DiscoveredLead): boolean => {
    const p = normalizeDigits(lead.phone);
    if (p.length >= 10 && existingDuplicateSets.phones.has(p)) return true;
    const e = String(lead.email || '').trim().toLowerCase();
    if (e && existingDuplicateSets.emails.has(e)) return true;
    const n = String(lead.name || '').trim().toLowerCase();
    if (n && existingDuplicateSets.names.has(n)) return true;
    return false;
  };

  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      if (filterMode === 'verified') return l.verificationStatus === 'Verified';
      if (filterMode === 'email') return Boolean(l.email);
      if (filterMode === 'phone') return l.phoneVerified;
      if (filterMode === 'new') return !isDuplicateInCrm(l);
      return true;
    });
  }, [leads, filterMode, existingDuplicateSets]);

  const stats = useMemo(() => {
    const total = leads.length;
    const mxVerified = leads.filter((l) => l.emailStatus === 'verified').length;
    const withPhone = leads.filter((l) => l.phoneVerified).length;
    const aiScored = leads.filter((l) => typeof l.aiScore === 'number').length;
    const duplicates = leads.filter((l) => isDuplicateInCrm(l)).length;
    return { total, mxVerified, withPhone, aiScored, duplicates };
  }, [leads, existingDuplicateSets]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category.trim() || !city.trim()) {
      showBanner('err', 'Please enter both Business Category and City.');
      return;
    }

    setIsSearching(true);
    setSelectedIds([]);
    try {
      const res = await fetch('/api/agents/lead-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: category.trim(),
          city: city.trim(),
          limit,
          enrichWebsites,
          serperApiKey: agentCfg.serperApiKey.trim() || undefined,
          googlePlacesApiKey: agentCfg.googlePlacesApiKey.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        showBanner('err', data?.error || 'Lead discovery search failed.');
        setIsSearching(false);
        return;
      }

      const found: DiscoveredLead[] = Array.isArray(data.leads) ? data.leads : [];
      persistLeads(found);
      if (found.length === 0) {
        showBanner(
          'info',
          `No public listings matched "${category}" in "${city}". Try a broader category like "Clinic", "Hotel", "Restaurant", or "Office".`
        );
      } else {
        showBanner(
          'ok',
          `Discovered ${found.length} public businesses via ${data.sourceEngine} with contact & DNS MX checks.`
        );
      }
    } catch (err: any) {
      showBanner('err', err?.message || 'Network error while searching public directories.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleRunAiVerifier = async () => {
    if (leads.length === 0) return;
    setIsVerifyingAi(true);
    try {
      let customGeminiKey = '';
      try {
        customGeminiKey = localStorage.getItem(AI_USER_KEY_STORAGE(userId)) || '';
      } catch {
        /* ignore */
      }

      const res = await fetch('/api/agents/verify-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leads,
          businessOffer: agentCfg.businessOffer,
          tone: agentCfg.pitchTone,
          customApiKey: customGeminiKey || undefined,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok || !Array.isArray(data.results)) {
        showBanner('err', data?.error || 'AI Verification Agent failed.');
        setIsVerifyingAi(false);
        return;
      }

      const byId = new Map<string, any>();
      for (const r of data.results) {
        if (r?.id) byId.set(String(r.id), r);
      }

      const updated = leads.map((l) => {
        const ai = byId.get(l.id);
        if (!ai) return l;
        return {
          ...l,
          aiScore: typeof ai.aiScore === 'number' ? Math.max(0, Math.min(100, Math.round(ai.aiScore))) : l.aiScore,
          priority: (['Hot', 'Warm', 'Cold'].includes(ai.priority) ? ai.priority : 'Warm') as 'Hot' | 'Warm' | 'Cold',
          opportunity: String(ai.opportunity || '').trim(),
          pitchEmailSubject: String(ai.pitchEmailSubject || '').trim(),
          pitchEmailBody: String(ai.pitchEmailBody || '').trim(),
          pitchWhatsApp: String(ai.pitchWhatsApp || '').trim(),
        };
      });

      // Sort highest AI score first
      updated.sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0));
      persistLeads(updated);
      showBanner(
        'ok',
        `AI Verification Agent (${data.model || 'Gemini'}) scored ${data.results.length} leads & drafted custom Email/WhatsApp pitches!`
      );
    } catch (err: any) {
      showBanner('err', err?.message || 'Error contacting AI Verification Agent.');
    } finally {
      setIsVerifyingAi(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSelectAllImportable = () => {
    const importable = filteredLeads.filter((l) => !isDuplicateInCrm(l)).map((l) => l.id);
    if (selectedIds.length === importable.length && importable.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(importable);
    }
  };

  const handleImportSelected = () => {
    if (!canImportLeads) {
      showBanner('err', 'You do not have permission to import leads into CRM.');
      return;
    }
    const chosen = leads.filter((l) => selectedIds.includes(l.id) && !isDuplicateInCrm(l));
    if (chosen.length === 0) {
      showBanner('info', 'Select at least one new (non-duplicate) lead to import.');
      return;
    }

    const existing = loadExistingCrmLeads();
    const today = new Date().toISOString().split('T')[0];
    const ownerName = currentUser?.name || 'Administrator';

    const newCrmLeads: Lead[] = chosen.map((item, idx) => {
      const noteLines = [
        `Discovered via AI Agents (${item.sourceEngine})`,
        `Category: ${item.category} | Address: ${item.address}`,
        item.website ? `Website: ${item.website} (${item.websiteLive ? 'Live' : 'Unreachable'})` : '',
        item.emailStatus === 'verified' ? 'Email: DNS MX Verified' : '',
        item.opportunity ? `AI Opportunity: ${item.opportunity}` : '',
      ].filter(Boolean);

      return {
        id: `lead-ag-${Date.now()}-${idx}`,
        name: item.name,
        company: item.name,
        title: item.category || 'Business Lead',
        email: item.email || 'no-email@lead.local',
        phone: item.phone || '+91 00000 00000',
        whatsapp: item.whatsapp || item.phone || '',
        status: 'New Lead',
        priority: item.priority || (item.verificationStatus === 'Verified' ? 'Hot' : 'Warm'),
        value: 25000,
        source: 'Lead Finder' as any,
        owner: ownerName,
        score: item.aiScore || (item.verificationStatus === 'Verified' ? 80 : 60),
        createdAt: today,
        notes: noteLines.join('\n'),
        tags: ['AI Agent', item.verificationStatus, item.city].filter(Boolean),
      };
    });

    const merged = [...newCrmLeads, ...existing];
    localStorage.setItem('ozostack_leads_v2', JSON.stringify(merged));
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('ozostack-crm-config-changed'));

    setSelectedIds([]);
    setCrmLeadsTick((t) => t + 1);
    showBanner(
      'ok',
      `Imported ${newCrmLeads.length} verified lead(s) cleanly into CRM Leads (no auto-spam emails triggered).`
    );
  };

  const handleExportCsv = () => {
    if (!canExportCsv || filteredLeads.length === 0) return;
    const header =
      'Business Name,Category,City,Address,Phone,WhatsApp,Email,Email MX Status,Website,Verification,AI Score,Priority,AI Opportunity,Source\n';
    const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = filteredLeads
      .map((l) =>
        [
          l.name,
          l.category,
          l.city,
          l.address,
          l.phone,
          l.whatsapp,
          l.email,
          l.emailStatus,
          l.website,
          l.verificationStatus,
          l.aiScore ?? '',
          l.priority ?? '',
          l.opportunity ?? '',
          l.sourceEngine,
        ]
          .map(esc)
          .join(',')
      )
      .join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ozostack_ai_leads_${city.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showBanner('ok', `Exported ${filteredLeads.length} leads to CSV.`);
  };

  const copyText = (key: string, text: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 1800);
  };

  const cardCls = isLight
    ? 'bg-white border-sky-100/90 shadow-xs'
    : 'bg-[#0f172a]/95 border-slate-800';
  const inputCls = `w-full px-3 py-2 rounded-xl border text-xs font-medium outline-none ${
    isLight
      ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-sky-500'
      : 'bg-slate-900 border-slate-700 text-white focus:border-sky-400'
  }`;

  const activeEngineLabel = agentCfg.serperApiKey
    ? 'Google Maps (Serper API) + Website Extractor'
    : agentCfg.googlePlacesApiKey
    ? 'Google Places API + Website Extractor'
    : '100% Free Public Engine (OpenStreetMap + Website Extractor + DNS MX)';

  return (
    <div className="space-y-4 pb-10 animate-fade-in">
      {/* Header Banner */}
      <div className={`p-5 rounded-2xl border ${cardCls} border-sky-500/25 bg-gradient-to-r from-sky-500/10 via-indigo-500/5 to-transparent`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/15 text-sky-500 shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex flex-wrap items-center gap-2">
                <span>AI Agents — Public Lead Discovery &amp; Verification</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  {activeEngineLabel}
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Discover public businesses, extract emails &amp; WhatsApp from live websites, verify
                domains via DNS MX, score with Gemini AI, and import only clean non-duplicate leads into
                CRM.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsSettingsOpen((v) => !v)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shrink-0"
          >
            <KeyRound className="w-3.5 h-3.5 text-sky-500" />
            <span>Pitch &amp; Optional Maps Keys</span>
          </button>
        </div>

        {/* Collapsible Pitch & Optional Keys Drawer */}
        {isSettingsOpen && (
          <div className="mt-4 pt-4 border-t border-slate-200/70 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">
                What Your Company Offers (Used by AI Pitch Agent)
              </label>
              <input
                value={agentCfg.businessOffer}
                onChange={(e) => persistConfig({ ...agentCfg, businessOffer: e.target.value })}
                placeholder="e.g. Website Development, CRM & Digital Marketing"
                className={inputCls}
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">
                AI Pitch Tone
              </label>
              <select
                value={agentCfg.pitchTone}
                onChange={(e) =>
                  persistConfig({
                    ...agentCfg,
                    pitchTone: e.target.value as AgentUserConfig['pitchTone'],
                  })
                }
                className={inputCls}
              >
                <option value="Professional">Professional (English)</option>
                <option value="Friendly">Friendly &amp; Consultative</option>
                <option value="Hinglish">Hinglish (India Business Friendly)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">
                Optional: Serper.dev API Key (2,500 Free Google Maps Searches — No Card)
              </label>
              <input
                type="password"
                value={agentCfg.serperApiKey}
                onChange={(e) => persistConfig({ ...agentCfg, serperApiKey: e.target.value })}
                placeholder="Leave blank to use 100% Free OpenStreetMap Engine"
                className={inputCls}
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">
                Optional: Google Places API Key (Official Maps Places v1)
              </label>
              <input
                type="password"
                value={agentCfg.googlePlacesApiKey}
                onChange={(e) => persistConfig({ ...agentCfg, googlePlacesApiKey: e.target.value })}
                placeholder="Leave blank to use 100% Free OpenStreetMap Engine"
                className={inputCls}
              />
            </div>
          </div>
        )}
      </div>

      {/* Status Banner */}
      {banner && (
        <div
          className={`flex items-center justify-between gap-2 px-4 py-3 rounded-xl border text-xs font-semibold ${
            banner.type === 'ok'
              ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-700 dark:text-emerald-300'
              : banner.type === 'err'
              ? 'bg-rose-500/10 border-rose-500/25 text-rose-700 dark:text-rose-300'
              : 'bg-sky-500/10 border-sky-500/25 text-sky-700 dark:text-sky-300'
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
          <button type="button" onClick={() => setBanner(null)}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Search Card */}
      <form onSubmit={handleSearch} className={`p-5 rounded-2xl border space-y-4 ${cardCls}`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 text-xs">
          <div className="lg:col-span-4">
            <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">
              Business Category / Niche *
            </label>
            <input
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Dental Clinic, Real Estate, Hotel"
              className={inputCls}
            />
          </div>

          <div className="lg:col-span-4">
            <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">
              City / Location *
            </label>
            <input
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Mumbai, Kolkata, Delhi, Bengaluru"
              className={inputCls}
            />
          </div>

          <div className="lg:col-span-2">
            <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">
              Batch Limit
            </label>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className={inputCls}
            >
              <option value={8}>8 Leads (Fast)</option>
              <option value={12}>12 Leads (Balanced)</option>
              <option value={20}>20 Leads (Max)</option>
            </select>
          </div>

          <div className="lg:col-span-2 flex items-end">
            <button
              type="submit"
              disabled={isSearching}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:opacity-60 text-white text-xs font-bold shadow-xs transition-colors"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Scanning...</span>
                </>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5" />
                  <span>Find Leads</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 mr-1">Quick Niches:</span>
            {QUICK_CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold transition-colors ${
                  category.toLowerCase() === c.toLowerCase()
                    ? 'bg-sky-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-sky-500/15'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-600 dark:text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={enrichWebsites}
              onChange={(e) => setEnrichWebsites(e.target.checked)}
              className="rounded accent-sky-500"
            />
            <span>Extract Emails &amp; WhatsApp from Public Websites + DNS MX Verify</span>
          </label>
        </div>
      </form>

      {/* Results Toolbar & Staging Table */}
      <div className={`p-5 rounded-2xl border space-y-4 ${cardCls}`}>
        {/* KPI Strip + Action Buttons */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
              Found: {stats.total}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              MX Verified Emails: {stats.mxVerified}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
              Valid Phones: {stats.withPhone}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
              AI Scored: {stats.aiScored}
            </span>
            {stats.duplicates > 0 && (
              <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                Already in CRM: {stats.duplicates}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={leads.length === 0 || isVerifyingAi}
              onClick={handleRunAiVerifier}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-colors"
            >
              {isVerifyingAi ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>AI Verifying...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Run AI Verifier &amp; Pitch Agent</span>
                </>
              )}
            </button>

            {canImportLeads && (
              <button
                type="button"
                disabled={selectedIds.length === 0}
                onClick={handleImportSelected}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Import Selected ({selectedIds.length})</span>
              </button>
            )}

            {canExportCsv && leads.length > 0 && (
              <button
                type="button"
                onClick={handleExportCsv}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>
            )}

            {leads.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  persistLeads([]);
                  setSelectedIds([]);
                }}
                className="p-2 rounded-xl border border-rose-500/20 text-rose-500 hover:bg-rose-500/10"
                title="Clear staging results"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills */}
        {leads.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  ['all', `All (${leads.length})`],
                  ['verified', 'Verified Only'],
                  ['email', 'Has Email'],
                  ['phone', 'Has Phone'],
                  ['new', 'Not in CRM Yet'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFilterMode(id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                    filterMode === id
                      ? 'bg-sky-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {canImportLeads && (
              <button
                type="button"
                onClick={handleSelectAllImportable}
                className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline"
              >
                {selectedIds.length > 0 ? 'Unselect All' : 'Select All New Leads'}
              </button>
            )}
          </div>
        )}

        {/* Table / Empty State */}
        {filteredLeads.length === 0 ? (
          <div className="py-10 text-center space-y-2">
            <Cpu className="w-9 h-9 text-slate-300 dark:text-slate-700 mx-auto" />
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
              {leads.length === 0
                ? 'No discovered leads in staging yet'
                : 'No leads match the selected filter'}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Enter a Business Category and City above, click <strong>Find Leads</strong>, run the{' '}
              <strong>AI Verifier Agent</strong>, and import only clean verified businesses to your CRM.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredLeads.map((lead) => {
              const dup = isDuplicateInCrm(lead);
              const checked = selectedIds.includes(lead.id);
              return (
                <div
                  key={lead.id}
                  className={`p-4 rounded-xl border transition-colors ${
                    checked
                      ? 'border-sky-500 bg-sky-500/5'
                      : 'border-slate-200/80 dark:border-slate-800 hover:border-sky-500/40'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                    {/* Left: Checkbox + Business Info */}
                    <div className="flex items-start gap-3 min-w-0">
                      <input
                        type="checkbox"
                        disabled={dup || !canImportLeads}
                        checked={checked}
                        onChange={() => toggleSelect(lead.id)}
                        className="mt-1 w-4 h-4 rounded accent-sky-500 shrink-0 disabled:opacity-40"
                      />
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white truncate">
                            {lead.name}
                          </h3>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 capitalize">
                            {lead.category}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              lead.verificationStatus === 'Verified'
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                : lead.verificationStatus === 'Partial'
                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                            }`}
                          >
                            {lead.verificationStatus}
                          </span>
                          {dup && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                              Already in CRM
                            </span>
                          )}
                          {lead.rating !== null && (
                            <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-amber-500">
                              <Star className="w-3 h-3 fill-amber-400" />
                              {lead.rating}
                              {lead.reviewsCount ? ` (${lead.reviewsCount})` : ''}
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                          <span className="truncate">{lead.address}</span>
                        </p>

                        {/* Contact Badges */}
                        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                          {lead.phone ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-sky-500/10 text-sky-700 dark:text-sky-300 font-semibold">
                              <Phone className="w-3 h-3" />
                              {lead.phone}
                            </span>
                          ) : (
                            <span className="text-slate-400">No Phone</span>
                          )}

                          {lead.email ? (
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg font-semibold ${
                                lead.emailStatus === 'verified'
                                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              <Mail className="w-3 h-3" />
                              {lead.email}
                              {lead.emailStatus === 'verified' && (
                                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                              )}
                            </span>
                          ) : (
                            <span className="text-slate-400">No Public Email</span>
                          )}

                          {lead.website && (
                            <a
                              href={lead.website}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-sky-500 font-semibold"
                            >
                              <Globe className="w-3 h-3" />
                              <span>{lead.websiteLive ? 'Live Website' : 'Website'}</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: AI Score & Opportunity */}
                    <div className="flex flex-col sm:items-end gap-1.5 shrink-0 lg:max-w-xs">
                      {typeof lead.aiScore === 'number' ? (
                        <>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                lead.priority === 'Hot'
                                  ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                                  : lead.priority === 'Warm'
                                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                                  : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              AI Score: {lead.aiScore}/100 • {lead.priority}
                            </span>
                            {(lead.pitchEmailBody || lead.pitchWhatsApp) && (
                              <button
                                type="button"
                                onClick={() => setPitchModalLead(lead)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet-500/15 hover:bg-violet-500/25 text-violet-600 dark:text-violet-300 text-[11px] font-bold"
                              >
                                <Sparkles className="w-3 h-3" />
                                <span>View AI Pitch</span>
                              </button>
                            )}
                          </div>
                          {lead.opportunity && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 sm:text-right">
                              {lead.opportunity}
                            </p>
                          )}
                        </>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">
                          Run AI Verifier for score &amp; pitch
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* AI Pitch Modal */}
      {pitchModalLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className={`w-full max-w-lg rounded-2xl border p-5 space-y-4 shadow-2xl ${cardCls}`}>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-violet-500" />
                  <span>AI Personalized Pitch — {pitchModalLead.name}</span>
                </h3>
                {pitchModalLead.opportunity && (
                  <p className="text-[11px] text-slate-500 mt-0.5">{pitchModalLead.opportunity}</p>
                )}
              </div>
              <button type="button" onClick={() => setPitchModalLead(null)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {pitchModalLead.pitchEmailBody && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-sky-500" />
                    Cold Email Draft
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      copyText(
                        'email',
                        `Subject: ${pitchModalLead.pitchEmailSubject || ''}\n\n${pitchModalLead.pitchEmailBody || ''}`
                      )
                    }
                    className="flex items-center gap-1 text-[11px] font-bold text-sky-600 dark:text-sky-400"
                  >
                    {copiedField === 'email' ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>{copiedField === 'email' ? 'Copied' : 'Copy Email'}</span>
                  </button>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
                  {pitchModalLead.pitchEmailSubject && (
                    <div className="font-bold text-slate-800 dark:text-slate-100">
                      Subject: {pitchModalLead.pitchEmailSubject}
                    </div>
                  )}
                  <p className="whitespace-pre-wrap text-slate-600 dark:text-slate-300 leading-relaxed">
                    {pitchModalLead.pitchEmailBody}
                  </p>
                </div>
              </div>
            )}

            {pitchModalLead.pitchWhatsApp && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                    WhatsApp Intro Draft
                  </span>
                  <button
                    type="button"
                    onClick={() => copyText('wa', pitchModalLead.pitchWhatsApp || '')}
                    className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400"
                  >
                    {copiedField === 'wa' ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>{copiedField === 'wa' ? 'Copied' : 'Copy WhatsApp'}</span>
                  </button>
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs whitespace-pre-wrap text-slate-700 dark:text-slate-200 leading-relaxed">
                  {pitchModalLead.pitchWhatsApp}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setPitchModalLead(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-sky-500 text-white text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
