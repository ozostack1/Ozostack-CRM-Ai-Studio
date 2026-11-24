import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  Cpu,
  Download,
  ExternalLink,
  FolderKanban,
  Globe,
  KeyRound,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Tag,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useCrmConfig } from '../../data/crmConfig';
import { Lead } from '../../types/crm';

interface DiscoveredLead {
  id: string;
  cid?: string;
  name: string;
  searchCategory?: string;
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
  googleMapsUrl?: string;
  latitude?: number | null;
  longitude?: number | null;
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
  'CA Firm',
  'Travel Agency',
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
  const { config: crmConfig } = useCrmConfig();
  const isLight = theme === 'white-sky';
  const userId = currentUser?.id || 'default';

  const canImportLeads = can('AI Agents', 'create') || can('Leads', 'create');
  const canExportCsv = can('AI Agents', 'export') || can('Leads', 'export');

  // Server Maps status
  const [serverMapsReady, setServerMapsReady] = useState(false);

  // Search form state
  const [category, setCategory] = useState('Dental Clinic');
  const [city, setCity] = useState('Mumbai');
  const [limit, setLimit] = useState<number>(10);
  const [maxReviewsFilter, setMaxReviewsFilter] = useState<string>('0'); // '0' = Any, '20','50','100','200','500','custom'
  const [customMaxReviews, setCustomMaxReviews] = useState<string>('50');
  const [maxRatingFilter, setMaxRatingFilter] = useState<string>('0'); // '0' = Any, '4.5','4.0','3.5','3.0'
  const [enrichWebsites, setEnrichWebsites] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  // Pagination tracker per (category|city) so "Load More" always grabs brand-new pages
  const [pageCursorByQuery, setPageCursorByQuery] = useState<Record<string, number>>({});
  const [hasMoreByQuery, setHasMoreByQuery] = useState<Record<string, boolean>>({});

  // Per-user config & persistent staging vault (NEVER auto-cleared on new searches)
  const [agentCfg, setAgentCfg] = useState<AgentUserConfig>(DEFAULT_CONFIG);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [leads, setLeads] = useState<DiscoveredLead[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filterMode, setFilterMode] = useState<
    'all' | 'verified' | 'email' | 'phone' | 'new' | 'low-reviews-50' | 'low-reviews-100' | 'low-rating'
  >('all');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('ALL');

  // Push-to-CRM Category & Stage Controls
  const [pushCategoryMode, setPushCategoryMode] = useState<string>('__AUTO__');
  const [customPushCategory, setCustomPushCategory] = useState<string>('');
  const [pushStage, setPushStage] = useState<string>('New Lead');
  const [pushSource, setPushSource] = useState<string>('Google Maps');

  const [isVerifyingAi, setIsVerifyingAi] = useState(false);
  const [pitchModalLead, setPitchModalLead] = useState<DiscoveredLead | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [crmLeadsTick, setCrmLeadsTick] = useState(0);
  const [banner, setBanner] = useState<{ type: 'ok' | 'err' | 'info'; text: string } | null>(null);

  const showBanner = (type: 'ok' | 'err' | 'info', text: string) => {
    setBanner({ type, text });
    setTimeout(() => setBanner((prev) => (prev?.text === text ? null : prev)), 6500);
  };

  useEffect(() => {
    fetch('/api/ai/status')
      .then((r) => r.json())
      .then((d) => {
        if (d?.googleMapsConfigured) setServerMapsReady(true);
      })
      .catch(() => {});
  }, []);

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
    setActiveCategoryFilter('ALL');
    setPitchModalLead(null);
    setConfirmClearAll(false);
    setPageCursorByQuery({});
    setHasMoreByQuery({});
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

  // Existing CRM duplicate lookup sets
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

  // Distinct categories saved in staging vault (so user can switch/push by category)
  const savedCategories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const l of leads) {
      const grp = String(l.searchCategory || l.category || 'General').trim();
      counts.set(grp, (counts.get(grp) || 0) + 1);
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [leads]);

  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      const grp = String(l.searchCategory || l.category || 'General').trim();
      if (activeCategoryFilter !== 'ALL' && grp !== activeCategoryFilter) return false;
      if (filterMode === 'verified') return l.verificationStatus === 'Verified';
      if (filterMode === 'email') return Boolean(l.email);
      if (filterMode === 'phone') return l.phoneVerified;
      if (filterMode === 'new') return !isDuplicateInCrm(l);
      if (filterMode === 'low-reviews-50') return (l.reviewsCount ?? 0) <= 50;
      if (filterMode === 'low-reviews-100') return (l.reviewsCount ?? 0) <= 100;
      if (filterMode === 'low-rating') return l.rating !== null && l.rating <= 4.0;
      return true;
    });
  }, [leads, filterMode, activeCategoryFilter, existingDuplicateSets]);

  const stats = useMemo(() => {
    const total = filteredLeads.length;
    const mxVerified = filteredLeads.filter((l) => l.emailStatus === 'verified').length;
    const withPhone = filteredLeads.filter((l) => l.phoneVerified).length;
    const aiScored = filteredLeads.filter((l) => typeof l.aiScore === 'number').length;
    const duplicates = filteredLeads.filter((l) => isDuplicateInCrm(l)).length;
    return { total, mxVerified, withPhone, aiScored, duplicates };
  }, [filteredLeads, existingDuplicateSets]);

  const resolvedMaxReviews =
    maxReviewsFilter === 'custom'
      ? Math.max(0, Number(customMaxReviews) || 0)
      : Math.max(0, Number(maxReviewsFilter) || 0);
  const resolvedMaxRating = Math.max(0, Number(maxRatingFilter) || 0);

  const currentQueryKey = `${category.trim().toLowerCase()}|${city.trim().toLowerCase()}|r${resolvedMaxReviews}|s${resolvedMaxRating}`;
  const currentNextPage = pageCursorByQuery[currentQueryKey] || 1;
  const canLoadMoreCurrent = hasMoreByQuery[currentQueryKey] === true;

  const runLeadDiscovery = async (isLoadMore: boolean) => {
    const catClean = category.trim();
    const cityClean = city.trim();
    if (!catClean || !cityClean) {
      showBanner('err', 'Please enter both Business Category and City.');
      return;
    }

    setIsSearching(true);
    try {
      // Collect every already-found business name & CID so backend skips them and returns BRAND-NEW leads!
      const excludeKeys: string[] = [];
      for (const l of leads) {
        if (l.name) excludeKeys.push(l.name.toLowerCase());
        if (l.cid) excludeKeys.push(`cid:${l.cid.toLowerCase()}`);
      }

      const startPage = isLoadMore ? currentNextPage : pageCursorByQuery[currentQueryKey] || 1;

      const res = await fetch('/api/agents/lead-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: catClean,
          city: cityClean,
          limit,
          startPage,
          maxReviews: resolvedMaxReviews > 0 ? resolvedMaxReviews : undefined,
          maxRating: resolvedMaxRating > 0 ? resolvedMaxRating : undefined,
          excludeKeys,
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
      if (data.nextPage) {
        setPageCursorByQuery((prev) => ({ ...prev, [currentQueryKey]: Number(data.nextPage) }));
      }
      setHasMoreByQuery((prev) => ({ ...prev, [currentQueryKey]: Boolean(data.hasMore) }));

      if (found.length === 0) {
        showBanner(
          'info',
          `No additional new leads found for "${catClean}" in "${cityClean}". Try another locality/city or category — your previous ${leads.length} leads are still safely kept below.`
        );
      } else {
        // APPEND/PREPEND new leads while keeping ALL previous leads intact!
        const existingSet = new Set(
          leads.flatMap((l) => [
            l.name.trim().toLowerCase(),
            l.cid ? `cid:${l.cid.toLowerCase()}` : '',
          ]).filter(Boolean)
        );
        const brandNew = found.filter((f) => {
          const nKey = f.name.trim().toLowerCase();
          const cKey = f.cid ? `cid:${f.cid.toLowerCase()}` : '';
          if (existingSet.has(nKey) || (cKey && existingSet.has(cKey))) return false;
          existingSet.add(nKey);
          if (cKey) existingSet.add(cKey);
          return true;
        });

        const merged = [...brandNew, ...leads];
        persistLeads(merged);
        setActiveCategoryFilter(catClean);
        showBanner(
          'ok',
          `Added ${brandNew.length} NEW "${catClean}" leads via ${data.sourceEngine}! Total saved in staging: ${merged.length} (previous leads kept safely).`
        );
      }
    } catch (err: any) {
      showBanner('err', err?.message || 'Network error while searching leads.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runLeadDiscovery(false);
  };

  const handleRunAiVerifier = async () => {
    const targetLeads = filteredLeads.slice(0, 20);
    if (targetLeads.length === 0) return;
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
          leads: targetLeads,
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
          aiScore:
            typeof ai.aiScore === 'number'
              ? Math.max(0, Math.min(100, Math.round(ai.aiScore)))
              : l.aiScore,
          priority: (['Hot', 'Warm', 'Cold'].includes(ai.priority) ? ai.priority : 'Warm') as
            | 'Hot'
            | 'Warm'
            | 'Cold',
          opportunity: String(ai.opportunity || '').trim(),
          pitchEmailSubject: String(ai.pitchEmailSubject || '').trim(),
          pitchEmailBody: String(ai.pitchEmailBody || '').trim(),
          pitchWhatsApp: String(ai.pitchWhatsApp || '').trim(),
        };
      });

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

  const handleSelectAllFilteredImportable = () => {
    const importable = filteredLeads.filter((l) => !isDuplicateInCrm(l)).map((l) => l.id);
    const allSelected =
      importable.length > 0 && importable.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !importable.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...importable])));
    }
  };

  const handleRemoveOneLead = (id: string) => {
    persistLeads(leads.filter((l) => l.id !== id));
    setSelectedIds((prev) => prev.filter((x) => x !== id));
  };

  const handleImportSelected = () => {
    if (!canImportLeads) {
      showBanner('err', 'You do not have permission to push leads into CRM.');
      return;
    }
    const chosen = leads.filter((l) => selectedIds.includes(l.id) && !isDuplicateInCrm(l));
    if (chosen.length === 0) {
      showBanner('info', 'Select at least one new (non-duplicate) lead to push into CRM.');
      return;
    }

    const resolvedCustomCat =
      pushCategoryMode === '__CUSTOM__'
        ? customPushCategory.trim()
        : pushCategoryMode === '__AUTO__'
        ? ''
        : pushCategoryMode;

    const existing = loadExistingCrmLeads();
    const today = new Date().toISOString().split('T')[0];
    const ownerName = currentUser?.name || 'Administrator';

    const newCrmLeads: Lead[] = chosen.map((item, idx) => {
      const assignedCat = resolvedCustomCat || item.searchCategory || item.category || 'Business Lead';
      const socialLines = [
        item.socials?.instagram ? `Instagram: ${item.socials.instagram}` : '',
        item.socials?.facebook ? `Facebook: ${item.socials.facebook}` : '',
        item.socials?.linkedin ? `LinkedIn: ${item.socials.linkedin}` : '',
      ].filter(Boolean);

      const noteLines = [
        `Category: ${assignedCat} (${item.category})`,
        `Full Address: ${item.address}`,
        `City: ${item.city}`,
        item.rating !== null
          ? `Google Rating: ${item.rating} ★${item.reviewsCount ? ` (${item.reviewsCount} reviews)` : ''}`
          : '',
        item.website ? `Website: ${item.website} (${item.websiteLive ? 'Live' : 'Unchecked'})` : '',
        item.googleMapsUrl ? `Google Maps: ${item.googleMapsUrl}` : '',
        item.email ? `Email: ${item.email} (${item.emailStatus === 'verified' ? 'DNS MX Verified' : 'Unverified'})` : '',
        item.whatsapp ? `WhatsApp: ${item.whatsapp}` : '',
        ...socialLines,
        item.opportunity ? `AI Opportunity: ${item.opportunity}` : '',
        `Source Engine: ${item.sourceEngine}`,
      ].filter(Boolean);

      return {
        id: `lead-ag-${Date.now()}-${idx}`,
        name: item.name,
        company: item.name,
        title: assignedCat,
        email: item.email || 'no-email@lead.local',
        phone: item.phone || '+91 00000 00000',
        whatsapp: item.whatsapp || item.phone || '',
        status: (pushStage || 'New Lead') as any,
        priority: item.priority || (item.verificationStatus === 'Verified' ? 'Hot' : 'Warm'),
        value: 25000,
        source: (pushSource || 'Google Maps') as any,
        owner: ownerName,
        score: item.aiScore || (item.verificationStatus === 'Verified' ? 82 : 65),
        createdAt: today,
        notes: noteLines.join('\n'),
        tags: Array.from(
          new Set([assignedCat, item.city, item.verificationStatus, 'AI Agent'].filter(Boolean))
        ),
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
      `Pushed ${newCrmLeads.length} lead(s) into CRM Leads under Stage "${pushStage}"${
        resolvedCustomCat ? ` & Category "${resolvedCustomCat}"` : ''
      } with full business details!`
    );
  };

  const handleExportCsv = () => {
    if (!canExportCsv || filteredLeads.length === 0) return;
    const header =
      'Business Name,Search Category,Google Category,City,Full Address,Phone,WhatsApp,Email,Email MX Status,Website,Website Live,Google Rating,Reviews,Google Maps URL,Instagram,Facebook,LinkedIn,Verification,AI Score,Priority,AI Opportunity,Source\n';
    const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = filteredLeads
      .map((l) =>
        [
          l.name,
          l.searchCategory || l.category,
          l.category,
          l.city,
          l.address,
          l.phone,
          l.whatsapp,
          l.email,
          l.emailStatus,
          l.website,
          l.websiteLive ? 'Yes' : 'No',
          l.rating ?? '',
          l.reviewsCount ?? '',
          l.googleMapsUrl ?? '',
          l.socials?.instagram ?? '',
          l.socials?.facebook ?? '',
          l.socials?.linkedin ?? '',
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
    a.download = `ozostack_leads_${activeCategoryFilter === 'ALL' ? 'all' : activeCategoryFilter.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showBanner('ok', `Exported ${filteredLeads.length} leads with complete details to CSV.`);
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

  const activeEngineLabel =
    agentCfg.serperApiKey || serverMapsReady
      ? 'Google Maps Live Engine (Connected) + Website Extractor + DNS MX'
      : agentCfg.googlePlacesApiKey
      ? 'Google Places API + Website Extractor + DNS MX'
      : 'Free OpenStreetMap Engine + Website Extractor + DNS MX';

  const stageNames = useMemo(() => {
    const list = (crmConfig.leadStages || []).map((s) => s.name).filter(Boolean);
    return list.length > 0 ? list : ['New Lead', 'Contacted', 'Qualified', 'Proposal Sent'];
  }, [crmConfig.leadStages]);

  const sourceNames = useMemo(() => {
    const base = (crmConfig.leadSources || []).map((s) => s.name).filter(Boolean);
    return Array.from(new Set(['Google Maps', 'Lead Finder', ...base]));
  }, [crmConfig.leadSources]);

  const categoryChoices = useMemo(() => {
    return Array.from(new Set([...savedCategories.map(([c]) => c), ...QUICK_CATEGORIES]));
  }, [savedCategories]);

  return (
    <div className="space-y-4 pb-10 animate-fade-in">
      {/* Header Banner */}
      <div
        className={`p-5 rounded-2xl border ${cardCls} border-sky-500/25 bg-gradient-to-r from-sky-500/10 via-indigo-500/5 to-transparent`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/15 text-sky-500 shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex flex-wrap items-center gap-2">
                <span>AI Agents — Google Maps Lead Discovery &amp; Verifier</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  {activeEngineLabel}
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Fetch exact lead counts from Google Maps with full business details (Phone, WhatsApp,
                Website, MX-Verified Email, Rating, Address &amp; Socials). Previous searches stay saved
                — organize by category and push cleanly to CRM Leads.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsSettingsOpen((v) => !v)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shrink-0"
          >
            <KeyRound className="w-3.5 h-3.5 text-sky-500" />
            <span>Pitch &amp; API Settings</span>
          </button>
        </div>

        {/* Collapsible Pitch & Optional Override Keys Drawer */}
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
                Personal Serper API Key Override{' '}
                {serverMapsReady && (
                  <span className="text-emerald-600 dark:text-emerald-400">
                    (Server Google Maps Key Already Active!)
                  </span>
                )}
              </label>
              <input
                type="password"
                value={agentCfg.serperApiKey}
                onChange={(e) => persistConfig({ ...agentCfg, serperApiKey: e.target.value })}
                placeholder={
                  serverMapsReady
                    ? 'Leave blank — server Google Maps key is active'
                    : 'Optional Serper.dev API key'
                }
                className={inputCls}
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">
                Optional: Google Places API Key Override
              </label>
              <input
                type="password"
                value={agentCfg.googlePlacesApiKey}
                onChange={(e) => persistConfig({ ...agentCfg, googlePlacesApiKey: e.target.value })}
                placeholder="Leave blank to use default engine"
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
      <form onSubmit={handleSearchSubmit} className={`p-5 rounded-2xl border space-y-4 ${cardCls}`}>
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

          <div className="lg:col-span-3">
            <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">
              City / Area *
            </label>
            <input
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Mumbai, Andheri, Kolkata"
              className={inputCls}
            />
          </div>

          <div className="lg:col-span-2">
            <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">
              Exact Leads Count
            </label>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className={inputCls}
            >
              <option value={8}>8 New Leads</option>
              <option value={10}>10 New Leads</option>
              <option value={15}>15 New Leads</option>
              <option value={20}>20 New Leads</option>
              <option value={30}>30 New Leads</option>
            </select>
          </div>

          <div className="lg:col-span-3 flex items-end gap-2">
            <button
              type="submit"
              disabled={isSearching}
              className="flex-1 flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:opacity-60 text-white text-xs font-bold shadow-xs transition-colors"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Fetching...</span>
                </>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5" />
                  <span>Find &amp; Add Leads</span>
                </>
              )}
            </button>

            {canLoadMoreCurrent && (
              <button
                type="button"
                disabled={isSearching}
                onClick={() => runLeadDiscovery(true)}
                className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-bold shadow-xs transition-colors shrink-0"
                title={`Fetch next ${limit} brand-new leads (Page ${currentNextPage})`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Next {limit}</span>
              </button>
            )}
          </div>
        </div>

        {/* Low Reviews & Low Star Rating Search Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="lg:col-span-4">
            <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">
              Reviews Count Filter (Target Low-Review Businesses)
            </label>
            <select
              value={maxReviewsFilter}
              onChange={(e) => setMaxReviewsFilter(e.target.value)}
              className={inputCls}
            >
              <option value="0">Any Review Count</option>
              <option value="20">Under 20 Reviews (≤ 20)</option>
              <option value="50">Under 50 Reviews (≤ 50)</option>
              <option value="100">Under 100 Reviews (≤ 100)</option>
              <option value="200">Under 200 Reviews (≤ 200)</option>
              <option value="500">Under 500 Reviews (≤ 500)</option>
              <option value="custom">Custom Max Reviews...</option>
            </select>
          </div>

          {maxReviewsFilter === 'custom' && (
            <div className="lg:col-span-2">
              <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">
                Max Reviews
              </label>
              <input
                type="number"
                min={1}
                max={10000}
                value={customMaxReviews}
                onChange={(e) => setCustomMaxReviews(e.target.value)}
                placeholder="e.g. 75"
                className={inputCls}
              />
            </div>
          )}

          <div className={maxReviewsFilter === 'custom' ? 'lg:col-span-3' : 'lg:col-span-4'}>
            <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">
              Star Rating Filter (Target Low-Rated Businesses)
            </label>
            <select
              value={maxRatingFilter}
              onChange={(e) => setMaxRatingFilter(e.target.value)}
              className={inputCls}
            >
              <option value="0">Any Star Rating</option>
              <option value="4.5">4.5 ★ &amp; Below</option>
              <option value="4.0">4.0 ★ &amp; Below (Low Rated)</option>
              <option value="3.5">3.5 ★ &amp; Below</option>
              <option value="3.0">3.0 ★ &amp; Below</option>
            </select>
          </div>

          <div
            className={`${
              maxReviewsFilter === 'custom' ? 'lg:col-span-3' : 'lg:col-span-4'
            } flex items-end`}
          >
            <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-600 dark:text-slate-300 cursor-pointer select-none pb-2">
              <input
                type="checkbox"
                checked={enrichWebsites}
                onChange={(e) => setEnrichWebsites(e.target.checked)}
                className="rounded accent-sky-500"
              />
              <span>Extract Email, Phone, WhatsApp &amp; Socials + DNS MX</span>
            </label>
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
        </div>
      </form>

      {/* Persistent Staging Vault & Push-to-CRM Controls */}
      <div className={`p-5 rounded-2xl border space-y-4 ${cardCls}`}>
        {/* Saved Categories Strip (Keeps All Previous Searches Intact!) */}
        {savedCategories.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1 mr-1">
              <FolderKanban className="w-3.5 h-3.5 text-sky-500" />
              Saved Categories:
            </span>
            <button
              type="button"
              onClick={() => setActiveCategoryFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                activeCategoryFilter === 'ALL'
                  ? 'bg-sky-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              All Saved ({leads.length})
            </button>
            {savedCategories.map(([catName, count]) => (
              <button
                key={catName}
                type="button"
                onClick={() => setActiveCategoryFilter(catName)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                  activeCategoryFilter === catName
                    ? 'bg-sky-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-sky-500/15'
                }`}
              >
                {catName} ({count})
              </button>
            ))}
          </div>
        )}

        {/* Push-to-CRM Category & Stage Selector Bar */}
        {canImportLeads && leads.length > 0 && (
          <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 grid grid-cols-1 md:grid-cols-12 gap-2.5 items-end text-xs">
            <div className="md:col-span-4">
              <label className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1 mb-1">
                <Tag className="w-3 h-3" />
                <span>Push Category (Assigned in CRM Leads)</span>
              </label>
              <select
                value={pushCategoryMode}
                onChange={(e) => setPushCategoryMode(e.target.value)}
                className={inputCls}
              >
                <option value="__AUTO__">Use Each Lead&apos;s Own Category</option>
                {categoryChoices.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                <option value="__CUSTOM__">+ Custom Category Name...</option>
              </select>
            </div>

            {pushCategoryMode === '__CUSTOM__' && (
              <div className="md:col-span-3">
                <label className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 block mb-1">
                  Custom Category Label
                </label>
                <input
                  value={customPushCategory}
                  onChange={(e) => setCustomPushCategory(e.target.value)}
                  placeholder="e.g. Healthcare Mumbai"
                  className={inputCls}
                />
              </div>
            )}

            <div className={pushCategoryMode === '__CUSTOM__' ? 'md:col-span-2' : 'md:col-span-3'}>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                CRM Stage
              </label>
              <select
                value={pushStage}
                onChange={(e) => setPushStage(e.target.value)}
                className={inputCls}
              >
                {stageNames.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div className={pushCategoryMode === '__CUSTOM__' ? 'md:col-span-3' : 'md:col-span-2'}>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                CRM Source
              </label>
              <select
                value={pushSource}
                onChange={(e) => setPushSource(e.target.value)}
                className={inputCls}
              >
                {sourceNames.map((src) => (
                  <option key={src} value={src}>
                    {src}
                  </option>
                ))}
              </select>
            </div>

            <div className={pushCategoryMode === '__CUSTOM__' ? 'md:col-span-12 flex justify-end' : 'md:col-span-3'}>
              <button
                type="button"
                disabled={selectedIds.length === 0}
                onClick={handleImportSelected}
                className="w-full md:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Push Selected to CRM ({selectedIds.length})</span>
              </button>
            </div>
          </div>
        )}

        {/* KPI Strip + AI Verifier / CSV / Clear */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
              Showing: {stats.total}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
              Valid Phones: {stats.withPhone}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              MX Verified Emails: {stats.mxVerified}
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
              disabled={filteredLeads.length === 0 || isVerifyingAi}
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

            {canExportCsv && filteredLeads.length > 0 && (
              <button
                type="button"
                onClick={handleExportCsv}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>
            )}

            {leads.length > 0 &&
              (confirmClearAll ? (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      persistLeads([]);
                      setSelectedIds([]);
                      setActiveCategoryFilter('ALL');
                      setPageCursorByQuery({});
                      setHasMoreByQuery({});
                      setConfirmClearAll(false);
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-[11px] font-bold"
                  >
                    Confirm Clear All
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClearAll(false)}
                    className="px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-500"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmClearAll(true)}
                  className="flex items-center gap-1 px-2.5 py-2 rounded-xl border border-rose-500/20 text-rose-500 hover:bg-rose-500/10 text-xs font-bold"
                  title="Clear all staging leads"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              ))}
          </div>
        </div>

        {/* Sub-Filter Pills */}
        {leads.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  ['all', `All (${filteredLeads.length})`],
                  ['verified', 'Verified Only'],
                  ['phone', 'Has Phone'],
                  ['email', 'Has Email'],
                  ['low-reviews-50', '≤ 50 Reviews'],
                  ['low-reviews-100', '≤ 100 Reviews'],
                  ['low-rating', '≤ 4.0 ★'],
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
                onClick={handleSelectAllFilteredImportable}
                className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline"
              >
                Select / Unselect All New in View
              </button>
            )}
          </div>
        )}

        {/* Lead Cards List */}
        {filteredLeads.length === 0 ? (
          <div className="py-10 text-center space-y-2">
            <Cpu className="w-9 h-9 text-slate-300 dark:text-slate-700 mx-auto" />
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
              {leads.length === 0
                ? 'No discovered leads saved yet'
                : 'No leads match the selected filter'}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Search any Business Category &amp; City above — exact lead count will be fetched from
              Google Maps and added safely without removing your earlier searches.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredLeads.map((lead) => {
              const dup = isDuplicateInCrm(lead);
              const checked = selectedIds.includes(lead.id);
              const waDigits = normalizeDigits(lead.whatsapp || lead.phone);
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
                    {/* Left: Checkbox + Full Business Details */}
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <input
                        type="checkbox"
                        disabled={dup || !canImportLeads}
                        checked={checked}
                        onChange={() => toggleSelect(lead.id)}
                        className="mt-1 w-4 h-4 rounded accent-sky-500 shrink-0 disabled:opacity-40"
                      />
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                            {lead.name}
                          </h3>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-300">
                            {lead.searchCategory || lead.category}
                          </span>
                          {lead.category &&
                            lead.searchCategory &&
                            lead.category.toLowerCase() !== lead.searchCategory.toLowerCase() && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                                {lead.category}
                              </span>
                            )}
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
                              {lead.reviewsCount ? ` (${lead.reviewsCount} reviews)` : ''}
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-1">
                          <MapPin className="w-3 h-3 shrink-0 text-slate-400 mt-0.5" />
                          <span>
                            {lead.address}
                            {lead.city && !lead.address.toLowerCase().includes(lead.city.toLowerCase())
                              ? `, ${lead.city}`
                              : ''}
                          </span>
                        </p>

                        {/* Complete Contact & Links Strip */}
                        <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[11px]">
                          {lead.phone ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-sky-500/10 text-sky-700 dark:text-sky-300 font-semibold">
                              <Phone className="w-3 h-3" />
                              {lead.phone}
                            </span>
                          ) : (
                            <span className="text-slate-400">No Phone</span>
                          )}

                          {waDigits.length >= 10 && (
                            <a
                              href={`https://wa.me/91${waDigits}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 font-semibold"
                            >
                              <MessageSquare className="w-3 h-3" />
                              <span>WhatsApp</span>
                            </a>
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

                          {lead.googleMapsUrl && (
                            <a
                              href={lead.googleMapsUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-300 hover:bg-rose-500/20 font-semibold"
                            >
                              <MapPin className="w-3 h-3" />
                              <span>Maps</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}

                          {lead.socials?.instagram && (
                            <a
                              href={lead.socials.instagram}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-0.5 rounded-lg bg-pink-500/10 text-pink-600 dark:text-pink-300 font-semibold"
                            >
                              Instagram
                            </a>
                          )}
                          {lead.socials?.facebook && (
                            <a
                              href={lead.socials.facebook}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-300 font-semibold"
                            >
                              Facebook
                            </a>
                          )}
                          {lead.socials?.linkedin && (
                            <a
                              href={lead.socials.linkedin}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-0.5 rounded-lg bg-sky-600/10 text-sky-700 dark:text-sky-300 font-semibold"
                            >
                              LinkedIn
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: AI Score, Pitch & Remove */}
                    <div className="flex flex-col sm:items-end gap-1.5 shrink-0 lg:max-w-xs">
                      <div className="flex items-center gap-1.5">
                        {typeof lead.aiScore === 'number' ? (
                          <>
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
                                <span>Pitch</span>
                              </button>
                            )}
                          </>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            Ready for AI Verifier
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveOneLead(lead.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10"
                          title="Remove from staging list"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {lead.opportunity && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 sm:text-right">
                          {lead.opportunity}
                        </p>
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
                        `Subject: ${pitchModalLead.pitchEmailSubject || ''}\n\n${
                          pitchModalLead.pitchEmailBody || ''
                        }`
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
