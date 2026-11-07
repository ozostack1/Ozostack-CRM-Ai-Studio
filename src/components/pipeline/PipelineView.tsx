import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  Search,
  Download,
  Plus,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  Building,
  Target,
  BarChart3,
  Kanban,
  ListFilter,
  Layers,
  Sparkles,
  Flame,
  Filter,
  Check,
  ChevronRight,
} from 'lucide-react';
import { Deal, DealStage, Lead } from '../../types/crm';
import { INITIAL_DEALS } from '../../data/mockData';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useSystemCurrency } from '../../data/currencyService';
import { useCrmConfig } from '../../data/crmConfig';
import { LeadActionModal, ContactActionType } from '../leads/LeadActionModal';
import { PipelineKanban } from './PipelineKanban';
import { PipelineTable } from './PipelineTable';
import { PipelineAnalytics } from './PipelineAnalytics';
import { DealDetailsModal } from './DealDetailsModal';
import { NewDealModal } from './NewDealModal';

type ViewMode = 'board' | 'list' | 'analytics';
type FilterChip = 'all' | 'high-value' | 'closing-soon' | 'hot';

const PIPELINE_STAGES: { stage: DealStage; label: string; prob: number; color: string }[] = [
  { stage: 'Discovery', label: 'Discovery', prob: 25, color: '#38bdf8' },
  { stage: 'Proposal Sent', label: 'Proposal Sent', prob: 50, color: '#0ea5e9' },
  { stage: 'Negotiation', label: 'Negotiation', prob: 75, color: '#0284c7' },
  { stage: 'Contract Sent', label: 'Contract Sent', prob: 90, color: '#0369a1' },
  { stage: 'Won', label: 'Closed Won', prob: 100, color: '#10b981' },
];

export const PipelineView: React.FC = () => {
  const { theme, setActiveNav } = useTheme();
  const { scopeFilter } = useAuth();
  const { config } = useCrmConfig();
  const isLight = theme === 'white-sky';
  const { currency } = useSystemCurrency();
  const pipelineStages = useMemo(
    () =>
      config.pipelineStages.length > 0
        ? config.pipelineStages.map((s) => ({
            stage: s.name as DealStage,
            label: s.label,
            prob: s.prob,
            color: s.color,
          }))
        : PIPELINE_STAGES,
    [config.pipelineStages]
  );

  const reloadDeals = () => {
    try {
      const saved = localStorage.getItem('ozostack_deals_v2');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      /* fallback */
    }
    return INITIAL_DEALS;
  };

  // Deals State
  const [deals, setDeals] = useState<Deal[]>(reloadDeals);
  useEffect(() => {
    try {
      localStorage.setItem('ozostack_deals_v2', JSON.stringify(deals));
    } catch {
      /* ignore */
    }
  }, [deals]);
  useEffect(() => {
    const onConfigChanged = () => setDeals(reloadDeals());
    window.addEventListener('ozostack-crm-config-changed', onConfigChanged);
    return () => window.removeEventListener('ozostack-crm-config-changed', onConfigChanged);
  }, []);
  const visibleDeals = useMemo(
    () => scopeFilter(deals, (d) => ({ owner: d.owner })),
    [deals, scopeFilter]
  );
  const [viewMode, setViewMode] = useState<ViewMode>('board');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>('all');
  const [selectedOwnerFilter, setSelectedOwnerFilter] = useState<string>('all');
  const [activeChip, setActiveChip] = useState<FilterChip>('all');
  const [sortBy, setSortBy] = useState<'value-desc' | 'close-soon' | 'prob-desc'>('value-desc');

  // Modals
  const [isNewDealOpen, setIsNewDealOpen] = useState(false);
  const [newDealDefaultStage, setNewDealDefaultStage] = useState<DealStage>('Discovery');
  const [activeDealDetails, setActiveDealDetails] = useState<Deal | null>(null);

  // Contact Action Modal
  const [contactLead, setContactLead] = useState<Lead | null>(null);
  const [actionType, setActionType] = useState<ContactActionType>('whatsapp');
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const cardBg = isLight
    ? 'bg-white border-sky-100/90 shadow-2xs'
    : 'bg-[#0f172a]/90 border-slate-800/80';

  // Pipeline Key Metrics
  const metrics = useMemo(() => {
    const totalPipeline = visibleDeals.reduce((acc, d) => acc + d.value, 0);
    const weightedForecast = visibleDeals.reduce((acc, d) => {
      const prob = (d.probability ?? 50) / 100;
      return acc + d.value * prob;
    }, 0);

    const wonDeals = visibleDeals.filter((d) => d.stage === 'Won');
    const wonValue = wonDeals.reduce((acc, d) => acc + d.value, 0);
    const quotaTarget = 650000;
    const quotaPacing = Math.min(Math.round((totalPipeline / quotaTarget) * 100), 100);

    return {
      totalPipeline,
      weightedForecast: Math.round(weightedForecast),
      wonValue,
      dealCount: visibleDeals.length,
      avgDealSize: visibleDeals.length > 0 ? Math.round(totalPipeline / visibleDeals.length) : 0,
      quotaTarget,
      quotaPacing,
    };
  }, [visibleDeals]);

  // Stage Breakdown Stats
  const stageStats = useMemo(() => {
    return pipelineStages.map((s) => {
      const stageDeals = visibleDeals.filter((d) => d.stage === s.stage);
      const stageTotal = stageDeals.reduce((acc, d) => acc + d.value, 0);
      return {
        stage: s.stage,
        label: s.label,
        count: stageDeals.length,
        value: stageTotal,
        prob: s.prob,
        color: s.color,
      };
    });
  }, [visibleDeals, pipelineStages]);

  // Quick Change Stage Function
  const handleSetStage = (dealId: string, newStage: DealStage) => {
    const stageProbMap: Record<string, number> = {
      Discovery: 25,
      'Proposal Sent': 50,
      Negotiation: 75,
      'Contract Sent': 90,
      Won: 100,
      Lost: 0,
    };
    pipelineStages.forEach((s) => {
      stageProbMap[s.stage] = s.prob;
    });

    setDeals((prev) =>
      prev.map((d) => {
        if (d.id === dealId) {
          showToast(`Deal "${d.dealName}" updated to ${newStage}!`);
          const updated = {
            ...d,
            stage: newStage,
            probability: stageProbMap[newStage] ?? d.probability ?? 50,
          };
          if (activeDealDetails?.id === dealId) {
            setActiveDealDetails(updated);
          }
          return updated;
        }
        return d;
      })
    );
  };

  // Quick 1-Step Advance Stage
  const handleAdvanceStage = (dealId: string) => {
    const stageOrder: DealStage[] = pipelineStages.map((s) => s.stage);
    const currentDeal = deals.find((d) => d.id === dealId);
    if (!currentDeal) return;

    const currentIndex = stageOrder.indexOf(currentDeal.stage);
    if (currentIndex >= 0 && currentIndex < stageOrder.length - 1) {
      handleSetStage(dealId, stageOrder[currentIndex + 1]);
    }
  };

  // Add Deal Handler
  const handleAddDeal = (newDeal: Deal) => {
    setDeals((prev) => [newDeal, ...prev]);
    showToast(`Opportunity "${newDeal.dealName}" added to pipeline!`);
  };

  // Quick Add from Stage Column
  const handleQuickAdd = (stage: DealStage) => {
    setNewDealDefaultStage(stage);
    setIsNewDealOpen(true);
  };

  // Open Direct Contact
  const handleOpenContact = (deal: Deal, type: ContactActionType) => {
    const tempLead: Lead = {
      id: deal.id,
      name: deal.contactName || 'Executive Decision Maker',
      email:
        deal.contactEmail ||
        `contact@${deal.company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      phone: deal.contactPhone || '+1 (555) 000-1234',
      whatsapp: (deal.contactWhatsApp || deal.contactPhone || '+15550001234').replace(
        /[^0-9+]/g,
        ''
      ),
      company: deal.company,
      title: 'Enterprise Stakeholder',
      status: deal.stage === 'Won' ? 'Won' : 'Negotiation',
      priority: deal.priority === 'High' ? 'Hot' : 'Warm',
      value: deal.value,
      source: 'Others',
      owner: deal.owner,
      score: deal.probability || 70,
      createdAt: deal.createdAt || '2025-05-01',
      notes: deal.notes,
    };
    setContactLead(tempLead);
    setActionType(type);
    setIsContactModalOpen(true);
  };

  // Filtered & Sorted Deals
  const filteredDeals = useMemo(() => {
    return visibleDeals
      .filter((d) => {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          d.dealName.toLowerCase().includes(query) ||
          d.company.toLowerCase().includes(query) ||
          d.owner.toLowerCase().includes(query) ||
          (d.contactName && d.contactName.toLowerCase().includes(query));

        const matchesStage =
          selectedStageFilter === 'all' || d.stage === selectedStageFilter;

        const matchesOwner =
          selectedOwnerFilter === 'all' ||
          d.owner.toLowerCase().includes(selectedOwnerFilter.toLowerCase());

        let matchesChip = true;
        if (activeChip === 'high-value') {
          matchesChip = d.value >= 30000;
        } else if (activeChip === 'hot') {
          matchesChip = d.priority === 'High';
        } else if (activeChip === 'closing-soon') {
          matchesChip = d.closeDate.includes('May') || d.closeDate.includes('Jun');
        }

        return matchesSearch && matchesStage && matchesOwner && matchesChip;
      })
      .sort((a, b) => {
        if (sortBy === 'value-desc') {
          return b.value - a.value;
        } else if (sortBy === 'prob-desc') {
          return (b.probability ?? 50) - (a.probability ?? 50);
        } else {
          return a.closeDate.localeCompare(b.closeDate);
        }
      });
  }, [visibleDeals, searchQuery, selectedStageFilter, selectedOwnerFilter, activeChip, sortBy]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Deal ID',
      'Deal Name',
      'Company',
      'Stage',
      'Value ($)',
      'Win Prob (%)',
      'Weighted Value ($)',
      'Close Date',
      'Owner',
    ];
    const rows = filteredDeals.map((d) => {
      const prob = d.probability ?? 50;
      const weighted = Math.round(d.value * (prob / 100));
      return [
        d.id,
        `"${d.dealName.replace(/"/g, '""')}"`,
        `"${d.company.replace(/"/g, '""')}"`,
        d.stage,
        d.value,
        prob,
        weighted,
        d.closeDate,
        `"${d.owner}"`,
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `ozostack-pipeline-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Pipeline CSV exported successfully!');
  };

  return (
    <div className="space-y-4 pb-10">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-900 text-white dark:bg-sky-500 dark:text-slate-950 font-semibold text-xs shadow-xl animate-fade-in border border-sky-400">
          <CheckCircle2 className="w-4 h-4 text-sky-400 dark:text-slate-950" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Header Banner */}
      <div
        className={`flex flex-col md:flex-row items-start md:items-center justify-between gap-3 p-4 rounded-xl border ${
          isLight
            ? 'bg-gradient-to-r from-sky-500/10 via-sky-400/5 to-white border-sky-200/80'
            : 'bg-gradient-to-r from-sky-500/10 via-sky-400/5 to-transparent border-slate-800'
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveNav('Dashboard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              isLight
                ? 'text-sky-700 bg-white border-sky-200 hover:bg-sky-50'
                : 'text-sky-300 bg-slate-800 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2
                className={`text-base sm:text-lg font-bold tracking-tight ${
                  isLight ? 'text-slate-800' : 'text-white'
                }`}
              >
                Sales Pipeline
              </h2>
              <span
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider border ${
                  isLight
                    ? 'bg-sky-50 text-sky-700 border-sky-200'
                    : 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                <span>{deals.length} Deals</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-normal mt-0.5">
              Live stage progression, revenue forecasting, and deal conversion.
            </p>
          </div>
        </div>

        {/* View Switcher & Actions */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* View Mode Switcher */}
          <div
            className={`flex items-center p-0.5 rounded-lg border ${
              isLight
                ? 'bg-slate-100 border-sky-100'
                : 'bg-slate-800 border-slate-700'
            }`}
          >
            <button
              onClick={() => setViewMode('board')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                viewMode === 'board'
                  ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-white'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Board</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-white'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
            <button
              onClick={() => setViewMode('analytics')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                viewMode === 'analytics'
                  ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Funnel</span>
            </button>
          </div>

          {/* New Opportunity Button */}
          <button
            onClick={() => {
              setNewDealDefaultStage('Discovery');
              setIsNewDealOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-sky-500 text-white hover:bg-sky-600 shadow-xs active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Deal</span>
          </button>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            title="Export pipeline to CSV"
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors shadow-2xs ${
              isLight
                ? 'bg-white text-slate-700 border-sky-200 hover:bg-sky-50'
                : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Top 4 Pipeline KPIs - Matching Project Style */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Gross Pipeline */}
        <div className={`p-3.5 rounded-xl border transition-all ${cardBg}`}>
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold tracking-wider uppercase">Gross Pipeline</span>
            <DollarSign className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-xl font-bold text-slate-800 dark:text-white tabular-nums tracking-tight">
            {currency.symbol}{metrics.totalPipeline.toLocaleString()}
          </div>
          <div className="text-[10px] text-sky-600 dark:text-sky-400 font-medium mt-0.5">
            {metrics.dealCount} active opportunities
          </div>
        </div>

        {/* Weighted Forecast */}
        <div className={`p-3.5 rounded-xl border transition-all ${cardBg}`}>
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold tracking-wider uppercase">Weighted Forecast</span>
            <Sparkles className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-xl font-bold text-sky-600 dark:text-sky-400 tabular-nums tracking-tight">
            {currency.symbol}{metrics.weightedForecast.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 font-normal">
            Probability-adjusted
          </div>
        </div>

        {/* Closed Won */}
        <div className={`p-3.5 rounded-xl border transition-all ${cardBg}`}>
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold tracking-wider uppercase">Closed Won</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums tracking-tight">
            {currency.symbol}{metrics.wonValue.toLocaleString()}
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
            100% Realized revenue
          </div>
        </div>

        {/* Average Deal Value */}
        <div className={`p-3.5 rounded-xl border transition-all ${cardBg}`}>
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold tracking-wider uppercase">Avg Deal Size</span>
            <Target className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-xl font-bold text-slate-800 dark:text-white tabular-nums tracking-tight">
            {currency.symbol}{metrics.avgDealSize.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 font-normal">
            Across active tiers
          </div>
        </div>
      </div>

      {/* Target Quota Progress Bar */}
      <div className={`px-4 py-3 rounded-xl border ${cardBg}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              Quarterly Target: {currency.symbol}{metrics.quotaTarget.toLocaleString()}
            </span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-300">
              {metrics.quotaPacing}% Paced
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-normal">
            {currency.symbol}{(metrics.quotaTarget - metrics.totalPipeline > 0 ? metrics.quotaTarget - metrics.totalPipeline : 0).toLocaleString()} remaining to quota
          </span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-sky-400 to-sky-600 rounded-full transition-all duration-500"
            style={{ width: `${metrics.quotaPacing}%` }}
          />
        </div>
      </div>

      {/* Interactive Visual Stage Stepper */}
      <div className={`p-3.5 rounded-xl border ${cardBg}`}>
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-[11px] font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">
            Pipeline Stage Flow & Breakdown
          </span>
          {selectedStageFilter !== 'all' && (
            <button
              onClick={() => setSelectedStageFilter('all')}
              className="text-xs font-medium text-sky-600 dark:text-sky-400 hover:underline"
            >
              Clear Filter ({selectedStageFilter})
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {stageStats.map((st, idx) => {
            const isSelected = selectedStageFilter === st.stage;

            return (
              <button
                key={st.stage}
                onClick={() => setSelectedStageFilter(isSelected ? 'all' : st.stage)}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-sky-500 bg-sky-50/70 shadow-xs ring-1 ring-sky-400'
                    : isLight
                    ? 'bg-slate-50/70 hover:bg-sky-50/60 border-sky-100 hover:border-sky-300'
                    : 'bg-slate-900/60 hover:bg-slate-800 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
                    {idx + 1}. {st.label}
                  </span>
                  <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                    {st.count}
                  </span>
                </div>
                <div className="text-sm font-bold text-slate-800 dark:text-white tabular-nums">
                  {currency.symbol}{st.value.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                  <span>Probability:</span>
                  <span className="font-semibold text-sky-600 dark:text-sky-400">{st.prob}%</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className={`p-3 rounded-xl border flex flex-col md:flex-row gap-2.5 items-center justify-between ${cardBg}`}>
        {/* Search & Quick Chips */}
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto flex-1">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search opportunity, company, owner..."
              className={`w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border outline-none font-normal transition-all ${
                isLight
                  ? 'bg-sky-50/40 border-sky-200 text-slate-800 focus:border-sky-500 focus:bg-white'
                  : 'bg-slate-900 border-slate-700 text-white focus:border-sky-400'
              }`}
            />
          </div>

          {/* Quick Filter Chips */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setActiveChip('all')}
              className={`px-2.5 py-1 text-xs rounded-lg border transition-all shrink-0 ${
                activeChip === 'all'
                  ? 'bg-sky-500 text-white border-sky-500 font-semibold shadow-2xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-sky-200 dark:border-slate-700 hover:bg-sky-50 font-medium'
              }`}
            >
              All Deals ({deals.length})
            </button>

            <button
              onClick={() => setActiveChip(activeChip === 'high-value' ? 'all' : 'high-value')}
              className={`px-2.5 py-1 text-xs rounded-lg border transition-all shrink-0 ${
                activeChip === 'high-value'
                  ? 'bg-sky-500 text-white border-sky-500 font-semibold shadow-2xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-sky-200 dark:border-slate-700 hover:bg-sky-50 font-medium'
              }`}
            >
              High Value ({currency.symbol}30k+)
            </button>

            <button
              onClick={() => setActiveChip(activeChip === 'hot' ? 'all' : 'hot')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg border transition-all shrink-0 ${
                activeChip === 'hot'
                  ? 'bg-rose-500 text-white border-rose-500 font-semibold shadow-2xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-sky-200 dark:border-slate-700 hover:bg-rose-50 hover:text-rose-600 font-medium'
              }`}
            >
              <Flame className="w-3 h-3 text-rose-500" />
              <span>Hot Priority</span>
            </button>

            <button
              onClick={() => setActiveChip(activeChip === 'closing-soon' ? 'all' : 'closing-soon')}
              className={`px-2.5 py-1 text-xs rounded-lg border transition-all shrink-0 ${
                activeChip === 'closing-soon'
                  ? 'bg-sky-500 text-white border-sky-500 font-semibold shadow-2xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-sky-200 dark:border-slate-700 hover:bg-sky-50 font-medium'
              }`}
            >
              Closing Soon
            </button>
          </div>
        </div>

        {/* Dropdowns */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <select
            value={selectedOwnerFilter}
            onChange={(e) => setSelectedOwnerFilter(e.target.value)}
            className={`text-xs px-2.5 py-1.5 rounded-lg border outline-none font-medium ${
              isLight
                ? 'bg-white border-sky-200 text-slate-700'
                : 'bg-slate-900 border-slate-700 text-slate-300'
            }`}
          >
            <option value="all">All Owners</option>
            <option value="Sayed">Sayed (CEO)</option>
            <option value="Amit">Amit Kumar</option>
            <option value="Neha">Neha Sharma</option>
            <option value="Rizwan">Rizwan Khan</option>
            <option value="Priya">Priya Singh</option>
            <option value="Vikram">Vikram Joshi</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className={`text-xs px-2.5 py-1.5 rounded-lg border outline-none font-medium ${
              isLight
                ? 'bg-white border-sky-200 text-slate-700'
                : 'bg-slate-900 border-slate-700 text-slate-300'
            }`}
          >
            <option value="value-desc">Highest Value</option>
            <option value="prob-desc">Win Probability</option>
            <option value="close-soon">Close Date</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === 'board' && (
        <PipelineKanban
          deals={filteredDeals}
          onSelectDeal={(deal) => setActiveDealDetails(deal)}
          onAdvanceStage={handleAdvanceStage}
          onOpenContact={handleOpenContact}
          onQuickAdd={handleQuickAdd}
        />
      )}

      {viewMode === 'list' && (
        <div className={`rounded-xl border overflow-hidden ${cardBg}`}>
          <div className="px-4 py-2.5 border-b border-sky-100/40 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                Opportunities List
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-sky-500/10 text-sky-600 dark:text-sky-300">
                {filteredDeals.length} deals
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-normal">
              Click any row for details
            </span>
          </div>

          <PipelineTable
            deals={filteredDeals}
            onSelectDeal={(deal) => setActiveDealDetails(deal)}
            onSetStage={handleSetStage}
            onAdvanceStage={handleAdvanceStage}
            onOpenContact={handleOpenContact}
          />
        </div>
      )}

      {viewMode === 'analytics' && (
        <PipelineAnalytics deals={deals} />
      )}

      {/* New Opportunity Modal */}
      <NewDealModal
        isOpen={isNewDealOpen}
        onClose={() => setIsNewDealOpen(false)}
        onAddDeal={handleAddDeal}
        defaultStage={newDealDefaultStage}
      />

      {/* Deal Details & Stage Progression Inspector */}
      <DealDetailsModal
        deal={activeDealDetails}
        isOpen={!!activeDealDetails}
        onClose={() => setActiveDealDetails(null)}
        onSetStage={handleSetStage}
        onAdvanceStage={handleAdvanceStage}
        onOpenContact={handleOpenContact}
      />

      {/* Direct Contact Modal */}
      <LeadActionModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        lead={contactLead}
        actionType={actionType}
        onLogActivity={(leadId, desc) => {
          showToast(`Activity logged for ${desc.slice(0, 30)}...`);
        }}
      />
    </div>
  );
};
