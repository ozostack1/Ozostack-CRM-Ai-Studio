import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  Plus,
  Search,
  Filter,
  Download,
  LayoutList,
  Kanban,
  DollarSign,
  TrendingUp,
  Percent,
  Calendar,
  Sparkles,
  User,
  Building,
  Edit2,
  Trash2,
  MessageSquare,
  Mail,
  Phone,
  Flame,
  Zap,
  Snowflake,
  ArrowRight,
  ArrowLeft as ArrowLeftIcon,
  CheckCircle,
  Briefcase,
  Target,
  CheckSquare,
  Square,
  ArrowUpDown,
  CheckCircle2,
} from 'lucide-react';
import { Deal, DealStage } from '../../types/crm';
import { INITIAL_DEALS } from '../../data/mockData';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useCrmConfig } from '../../data/crmConfig';
import { useSystemCurrency } from '../../data/currencyService';
import { DealModal } from './DealModal';
import { AiDealAdvisorModal } from './AiDealAdvisorModal';
import { LeadActionModal, ContactActionType } from '../leads/LeadActionModal';
import { Lead } from '../../types/crm';

const DEAL_KANBAN_STAGES: DealStage[] = [
  'Discovery',
  'Proposal Sent',
  'Negotiation',
  'Contract Sent',
  'Won',
];

const ALL_OWNERS = ['Sayed (CEO)', 'Amit Kumar', 'Neha Sharma', 'Rizwan Khan', 'Priya Singh', 'Vikram Joshi'];

type DealSortOption =
  | 'value-desc'
  | 'value-asc'
  | 'prob-desc'
  | 'name-asc'
  | 'close-date';

export const DealsView: React.FC = () => {
  const { theme, setActiveNav } = useTheme();
  const { scopeFilter } = useAuth();
  const { config } = useCrmConfig();
  const currency = useSystemCurrency();
  const isLight = theme === 'white-sky';
  const dealKanbanStages = useMemo(
    () =>
      config.pipelineStages.length > 0
        ? config.pipelineStages.map((s) => s.name as DealStage)
        : DEAL_KANBAN_STAGES,
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

  // View Mode: 'list' | 'kanban'
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedOwner, setSelectedOwner] = useState<string>('all');
  const [quickFilter, setQuickFilter] = useState<'all' | 'high' | 'negotiation' | 'won'>('all');
  const [sortBy, setSortBy] = useState<DealSortOption>('value-desc');
  const [defaultStage, setDefaultStage] = useState<DealStage>('Discovery');

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Selected row IDs for bulk actions
  const [selectedDealIds, setSelectedDealIds] = useState<string[]>([]);

  // Modals state
  const [isDealModalOpen, setIsDealModalOpen] = useState(false);
  const [dealToEdit, setDealToEdit] = useState<Deal | null>(null);

  // AI Advisor Modal
  const [advisorDeal, setAdvisorDeal] = useState<Deal | null>(null);
  const [isAdvisorOpen, setIsAdvisorOpen] = useState(false);

  // Contact Action Modal (WhatsApp, Mail, Call)
  const [contactLead, setContactLead] = useState<Lead | null>(null);
  const [actionType, setActionType] = useState<ContactActionType>('whatsapp');
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  // Drag and Drop State for Kanban
  const [draggedDealId, setDraggedDealId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<DealStage | null>(null);

  const cardBg = isLight
    ? 'bg-white border-sky-100/90 shadow-xs'
    : 'bg-[#0f172a]/90 border-slate-800/80';

  // Filtered Deals
  const filteredDeals = useMemo(() => {
    const list = visibleDeals.filter((deal) => {
      // Search
      const query = searchQuery.toLowerCase();
      const clientName = (deal.company || deal.client || '').toLowerCase();
      const projectName = (deal.dealName || deal.project || '').toLowerCase();
      const matchesSearch =
        clientName.includes(query) ||
        projectName.includes(query) ||
        (deal.contactName && deal.contactName.toLowerCase().includes(query)) ||
        (deal.serviceCategory && deal.serviceCategory.toLowerCase().includes(query));

      if (!matchesSearch) return false;

      // Stage filter
      if (selectedStage !== 'all' && deal.stage !== selectedStage) return false;

      // Priority filter
      if (selectedPriority !== 'all' && deal.priority !== selectedPriority) return false;

      // Owner filter
      if (selectedOwner !== 'all' && deal.owner !== selectedOwner) return false;

      // Quick filter
      if (quickFilter === 'high' && deal.priority !== 'High') return false;
      if (quickFilter === 'negotiation' && deal.stage !== 'Negotiation' && deal.stage !== 'Contract Sent')
        return false;
      if (quickFilter === 'won' && deal.stage !== 'Won') return false;

      return true;
    });

    return list.sort((a, b) => {
      switch (sortBy) {
        case 'value-desc':
          return b.value - a.value;
        case 'value-asc':
          return a.value - b.value;
        case 'prob-desc':
          return (b.probability ?? 50) - (a.probability ?? 50);
        case 'name-asc': {
          const nameA = a.dealName || a.project || '';
          const nameB = b.dealName || b.project || '';
          return nameA.localeCompare(nameB);
        }
        case 'close-date':
          return (a.closeDate || a.date || '').localeCompare(b.closeDate || b.date || '');
        default:
          return 0;
      }
    });
  }, [visibleDeals, searchQuery, selectedStage, selectedPriority, selectedOwner, quickFilter, sortBy]);

  // Executive KPI Calculations
  const grossPipelineValue = useMemo(() => {
    return visibleDeals.filter((d) => d.stage !== 'Won' && d.stage !== 'Lost').reduce((acc, curr) => acc + curr.value, 0);
  }, [visibleDeals]);

  const weightedForecast = useMemo(() => {
    return visibleDeals
      .filter((d) => d.stage !== 'Won' && d.stage !== 'Lost')
      .reduce((acc, curr) => acc + Math.round((curr.value * (curr.probability ?? 50)) / 100), 0);
  }, [visibleDeals]);

  const wonRevenue = useMemo(() => {
    return visibleDeals.filter((d) => d.stage === 'Won').reduce((acc, curr) => acc + curr.value, 0);
  }, [visibleDeals]);

  const winRate = useMemo(() => {
    const closed = visibleDeals.filter((d) => d.stage === 'Won' || d.stage === 'Lost').length;
    if (closed === 0) return 68; // fallback realistic win rate
    const won = visibleDeals.filter((d) => d.stage === 'Won').length;
    return Math.round((won / closed) * 100);
  }, [visibleDeals]);

  const avgDealSize = useMemo(() => {
    if (visibleDeals.length === 0) return 0;
    const total = visibleDeals.reduce((acc, curr) => acc + curr.value, 0);
    return Math.round(total / visibleDeals.length);
  }, [visibleDeals]);

  // Handlers
  const handleSaveDeal = (deal: Deal) => {
    setDeals((prev) => {
      const exists = prev.some((d) => d.id === deal.id);
      if (exists) {
        return prev.map((d) => (d.id === deal.id ? deal : d));
      }
      return [deal, ...prev];
    });
    showToast(dealToEdit ? `Deal "${deal.dealName || deal.project}" updated.` : `New deal created.`);
  };

  const handleDeleteDeal = (dealId: string) => {
    setDeals((prev) => {
      const next = prev.filter((d) => d.id !== dealId);
      try {
        localStorage.setItem('ozostack_deals_v2', JSON.stringify(next));
      } catch {}
      return next;
    });
    setSelectedDealIds((prev) => prev.filter((id) => id !== dealId));
    showToast('Deal opportunity deleted.');
  };

  const handleStageChange = (dealId: string, newStage: DealStage) => {
    setDeals((prev) =>
      prev.map((d) => {
        if (d.id !== dealId) return d;
        const newStatus = newStage === 'Won' ? 'Completed' : newStage === 'Lost' ? 'Stalled' : 'Active';
        const newProb =
          newStage === 'Won'
            ? 100
            : newStage === 'Lost'
            ? 0
            : newStage === 'Contract Sent'
            ? 90
            : newStage === 'Negotiation'
            ? 75
            : newStage === 'Proposal Sent'
            ? 60
            : 40;
        return { ...d, stage: newStage, status: newStatus, probability: newProb };
      })
    );
    showToast(`Deal moved to ${newStage}.`);
  };

  const handleOwnerChange = (dealId: string, newOwner: string) => {
    setDeals((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, owner: newOwner } : d))
    );
    showToast(`Owner reassigned to ${newOwner}.`);
  };

  const handleLogStrategyNote = (dealId: string, note: string) => {
    setDeals((prev) =>
      prev.map((d) => {
        if (d.id !== dealId) return d;
        const updatedNotes = d.notes ? `${d.notes}\n[AI Advisor]: ${note}` : `[AI Advisor]: ${note}`;
        return { ...d, notes: updatedNotes };
      })
    );
    showToast('AI strategic insights logged to deal context.');
  };

  // Selection & Bulk Operations
  const isAllSelected =
    filteredDeals.length > 0 && selectedDealIds.length === filteredDeals.length;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedDealIds([]);
    } else {
      setSelectedDealIds(filteredDeals.map((d) => d.id));
    }
  };

  const handleToggleSelectDeal = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDealIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Delete ${selectedDealIds.length} selected deal opportunities?`)) {
      setDeals((prev) => prev.filter((d) => !selectedDealIds.includes(d.id)));
      showToast(`${selectedDealIds.length} deals deleted.`);
      setSelectedDealIds([]);
    }
  };

  const handleBulkStageChange = (newStage: DealStage) => {
    setDeals((prev) =>
      prev.map((d) => (selectedDealIds.includes(d.id) ? { ...d, stage: newStage } : d))
    );
    showToast(`Updated ${selectedDealIds.length} deals to ${newStage}.`);
    setSelectedDealIds([]);
  };

  const handleOpenAdvisor = (deal: Deal) => {
    setAdvisorDeal(deal);
    setIsAdvisorOpen(true);
  };

  const handleContactDeal = (deal: Deal, type: ContactActionType) => {
    // Adapt deal contact into temporary Lead object for LeadActionModal
    const clientName = deal.company || deal.client || 'Client';
    const tempLead: Lead = {
      id: deal.id,
      name: deal.contactName || clientName,
      company: clientName,
      title: 'Deal Stakeholder',
      email: deal.contactEmail || `contact@${clientName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      phone: deal.contactPhone || '+1 (555) 234-5678',
      whatsapp: deal.contactWhatsApp || deal.contactPhone || '+1 (555) 234-5678',
      status: 'Qualified',
      priority: deal.priority === 'High' ? 'Hot' : deal.priority === 'Medium' ? 'Warm' : 'Cold',
      value: deal.value,
      source: 'Referrals',
      owner: deal.owner,
      score: deal.probability ?? 80,
      createdAt: deal.closeDate || deal.date || '2025-05-20',
      notes: deal.notes,
    };
    setContactLead(tempLead);
    setActionType(type);
    setIsContactModalOpen(true);
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    e.dataTransfer.setData('text/plain', dealId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedDealId(dealId);
  };

  const handleDragEnd = () => {
    setDraggedDealId(null);
    setDragOverStage(null);
  };

  const handleDragOverColumn = (e: React.DragEvent, stage: DealStage) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStage !== stage) {
      setDragOverStage(stage);
    }
  };

  const handleDragLeaveColumn = (e: React.DragEvent, stage: DealStage) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    if (dragOverStage === stage) {
      setDragOverStage(null);
    }
  };

  const handleDropOnColumn = (e: React.DragEvent, stage: DealStage) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData('text/plain') || draggedDealId;
    if (dealId) {
      handleStageChange(dealId, stage);
    }
    setDraggedDealId(null);
    setDragOverStage(null);
  };

  const handleExportCSV = (exportSelectedOnly = false) => {
    const listToExport = exportSelectedOnly
      ? deals.filter((d) => selectedDealIds.includes(d.id))
      : filteredDeals;

    const headers = [
      'Deal ID',
      'Client',
      'Project',
      'Value ($)',
      'Stage',
      'Probability (%)',
      'Weighted Value ($)',
      'Priority',
      'Category',
      'Owner',
      'Close Date',
      'Contact Name',
      'Contact Email',
    ];

    const rows = listToExport.map((d) => [
      d.id,
      `"${d.company || d.client || ''}"`,
      `"${d.dealName || d.project || ''}"`,
      d.value,
      d.stage,
      d.probability ?? 50,
      Math.round((d.value * (d.probability ?? 50)) / 100),
      d.priority ?? 'High',
      `"${d.serviceCategory || ''}"`,
      `"${d.owner}"`,
      d.closeDate || d.date || '',
      `"${d.contactName || ''}"`,
      d.contactEmail || '',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ozostack_deals_pipeline_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${listToExport.length} deals to CSV.`);
  };

  const ownersList = Array.from(new Set(deals.map((d) => d.owner)));

  return (
    <div className="space-y-4">
      {/* Top Banner Navigation & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl border bg-gradient-to-r from-sky-500/10 via-sky-400/5 to-transparent border-sky-200/60 dark:border-sky-500/20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveNav('Dashboard')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-sky-700 dark:text-sky-300 bg-white dark:bg-slate-800 border border-sky-200 dark:border-slate-700 shadow-xs hover:bg-sky-50 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>CEO Command Center</span>
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
              <span>Deals & Revenue Pipeline</span>
              <span className="text-xs bg-sky-500/15 text-sky-600 dark:text-sky-400 font-bold px-2 py-0.5 rounded-full">
                {deals.length} Active Deals
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Active Pipeline: <span className="font-bold text-emerald-500">{currency.symbol}{grossPipelineValue.toLocaleString()}</span> · Weighted Forecast: <span className="font-bold text-sky-500">{currency.symbol}{weightedForecast.toLocaleString()}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={() => handleExportCSV(false)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${
              isLight
                ? 'bg-white border-sky-200 text-slate-700 hover:bg-sky-50'
                : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
            }`}
            title="Download CSV Deals Pipeline"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Export CSV</span>
          </button>

          <button
            onClick={() => {
              setDealToEdit(null);
              setIsDealModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg text-white bg-sky-500 hover:bg-sky-600 shadow-sm shadow-sky-500/25 active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Deal</span>
          </button>
        </div>
      </div>

      {/* Senior Executive KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div
          onClick={() => {
            setQuickFilter('all');
            setSelectedStage('all');
            setSelectedPriority('all');
            setSelectedOwner('all');
            showToast('Showing all active deals.');
          }}
          className={`p-3 rounded-xl border cursor-pointer transition-all hover:scale-[1.01] ${cardBg} ${
            quickFilter === 'all' && selectedStage === 'all' ? 'ring-2 ring-sky-500/40' : ''
          }`}
          title="Click to reset filters and view all deals"
        >
          <div className="text-[10px] font-bold text-slate-400 uppercase">Gross Pipeline Value</div>
          <div className="text-xl font-extrabold text-emerald-500 tabular-nums mt-0.5">
            {currency.symbol}{grossPipelineValue.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Active negotiation stages</div>
        </div>

        <div
          onClick={() => {
            setSortBy('prob-desc');
            showToast('Sorted by probability forecast.');
          }}
          className={`p-3 rounded-xl border cursor-pointer transition-all hover:scale-[1.01] ${cardBg} ${
            sortBy === 'prob-desc' ? 'ring-2 ring-sky-500/40' : ''
          }`}
          title="Click to sort by probability"
        >
          <div className="text-[10px] font-bold text-slate-400 uppercase">Weighted Forecast</div>
          <div className="text-xl font-extrabold text-sky-500 tabular-nums mt-0.5">
            {currency.symbol}{weightedForecast.toLocaleString()}
          </div>
          <div className="text-[10px] text-sky-600 font-semibold mt-0.5">Probability-adjusted</div>
        </div>

        <div
          onClick={() => {
            setQuickFilter('won');
            showToast('Filtered by Closed Won Revenue.');
          }}
          className={`p-3 rounded-xl border cursor-pointer transition-all hover:scale-[1.01] ${cardBg} ${
            quickFilter === 'won' ? 'ring-2 ring-teal-500/40' : ''
          }`}
          title="Click to filter by Closed Won"
        >
          <div className="text-[10px] font-bold text-slate-400 uppercase">Closed Won Revenue</div>
          <div className="text-xl font-extrabold text-teal-500 tabular-nums mt-0.5">
            {currency.symbol}{wonRevenue.toLocaleString()}
          </div>
          <div className="text-[10px] text-emerald-500 font-semibold mt-0.5">▲ +24% vs last quarter</div>
        </div>

        <div
          onClick={() => {
            setSortBy('value-desc');
            showToast('Sorted by deal value.');
          }}
          className={`p-3 rounded-xl border cursor-pointer transition-all hover:scale-[1.01] ${cardBg} ${
            sortBy === 'value-desc' ? 'ring-2 ring-indigo-500/40' : ''
          }`}
          title="Click to sort by deal value"
        >
          <div className="text-[10px] font-bold text-slate-400 uppercase">Win Rate %</div>
          <div className="text-xl font-extrabold text-indigo-500 tabular-nums mt-0.5">
            {winRate}%
          </div>
          <div className="text-[10px] text-indigo-500 font-semibold mt-0.5">Closed deals conversion</div>
        </div>

        <div
          onClick={() => {
            setQuickFilter('high');
            showToast('Filtered by High Priority enterprise deals.');
          }}
          className={`p-3 rounded-xl border col-span-2 sm:col-span-3 lg:col-span-1 cursor-pointer transition-all hover:scale-[1.01] ${cardBg} ${
            quickFilter === 'high' ? 'ring-2 ring-amber-500/40' : ''
          }`}
          title="Click to filter by High Priority"
        >
          <div className="text-[10px] font-bold text-slate-400 uppercase">Average Deal Size</div>
          <div className="text-xl font-extrabold text-amber-500 tabular-nums mt-0.5">
            {currency.symbol}{avgDealSize.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Enterprise contract avg</div>
        </div>
      </div>

      {/* Control Toolbar */}
      <div className={`p-3.5 rounded-xl border space-y-3 ${cardBg}`}>
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* View Switcher: List vs Kanban */}
          <div className="flex items-center gap-1 p-1 bg-sky-100/60 dark:bg-slate-800 rounded-xl shrink-0 self-start">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'kanban'
                  ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Pipeline Kanban</span>
            </button>

            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span>List View</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by client, project title, contact, or service..."
              className={`w-full text-xs pl-9 pr-3 py-2 rounded-lg border outline-none ${
                isLight
                  ? 'bg-slate-50 border-sky-200 text-slate-800 focus:border-sky-500'
                  : 'bg-slate-900 border-slate-700 text-white focus:border-sky-400'
              }`}
            />
          </div>

          {/* Filters & Sorting */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Stage Filter */}
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className={`text-xs px-2.5 py-1.5 rounded-lg border outline-none font-medium ${
                isLight
                  ? 'bg-white border-sky-200 text-slate-700'
                  : 'bg-slate-800 border-slate-700 text-slate-200'
              }`}
            >
              <option value="all">All Stages</option>
              {dealKanbanStages.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
              {!dealKanbanStages.includes('Lost') && <option value="Lost">Lost</option>}
            </select>

            {/* Priority Filter */}
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className={`text-xs px-2.5 py-1.5 rounded-lg border outline-none font-medium ${
                isLight
                  ? 'bg-white border-sky-200 text-slate-700'
                  : 'bg-slate-800 border-slate-700 text-slate-200'
              }`}
            >
              <option value="all">All Priorities</option>
              <option value="High">🔥 High</option>
              <option value="Medium">⚡ Medium</option>
              <option value="Low">❄️ Low</option>
            </select>

            {/* Owner Filter */}
            <select
              value={selectedOwner}
              onChange={(e) => setSelectedOwner(e.target.value)}
              className={`text-xs px-2.5 py-1.5 rounded-lg border outline-none font-medium ${
                isLight
                  ? 'bg-white border-sky-200 text-slate-700'
                  : 'bg-slate-800 border-slate-700 text-slate-200'
              }`}
            >
              <option value="all">All Deal Owners</option>
              {ownersList.map((owner) => (
                <option key={owner} value={owner}>
                  {owner}
                </option>
              ))}
            </select>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as DealSortOption)}
                className={`text-xs px-2.5 py-1.5 rounded-lg border outline-none font-medium ${
                  isLight
                    ? 'bg-white border-sky-200 text-slate-700'
                    : 'bg-slate-800 border-slate-700 text-slate-200'
                }`}
              >
                <option value="value-desc">Value (High to Low)</option>
                <option value="value-asc">Value (Low to High)</option>
                <option value="prob-desc">Probability (High to Low)</option>
                <option value="name-asc">Deal Name (A → Z)</option>
                <option value="close-date">Target Close Date</option>
              </select>
            </div>
          </div>
        </div>

        {/* Quick Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-sky-100/20 text-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
            Focus:
          </span>
          {[
            { id: 'all', label: 'All Opportunities' },
            { id: 'high', label: '🔥 High Priority' },
            { id: 'negotiation', label: '⚡ Final Negotiation' },
            { id: 'won', label: '🏆 Closed Won' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setQuickFilter(item.id as any)}
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold transition-colors ${
                quickFilter === item.id
                  ? 'bg-sky-500 text-white shadow-xs'
                  : isLight
                  ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {item.label}
            </button>
          ))}
          <span className="text-slate-400 text-xs ml-auto">
            Showing <span className="font-bold text-slate-800 dark:text-white">{filteredDeals.length}</span> of {deals.length} deals
          </span>
        </div>
      </div>

      {/* Floating Bulk Actions Bar (when deals are selected) */}
      {selectedDealIds.length > 0 && (
        <div className="p-3 rounded-xl border border-sky-300 bg-sky-50 dark:bg-slate-800/90 dark:border-sky-500/30 text-xs shadow-md animate-fade-in flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sky-700 dark:text-sky-300 px-2 py-0.5 rounded-md bg-sky-500/10">
              {selectedDealIds.length} Deals Selected
            </span>
            <button
              onClick={() => setSelectedDealIds([])}
              className="text-slate-400 hover:text-slate-600 text-xs underline"
            >
              Deselect All
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
              <span>Set Stage:</span>
              <button
                onClick={() => handleBulkStageChange('Won')}
                className="px-2 py-1 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-semibold hover:text-emerald-500"
              >
                Won
              </button>
              <button
                onClick={() => handleBulkStageChange('Lost')}
                className="px-2 py-1 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-semibold hover:text-rose-500"
              >
                Lost
              </button>
            </div>

            <button
              onClick={() => handleExportCSV(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-500 text-white font-bold hover:bg-sky-600 shadow-xs"
            >
              <Download className="w-3 h-3" />
              <span>Export Selected</span>
            </button>

            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-500 text-white font-bold hover:bg-rose-600 shadow-xs"
            >
              <Trash2 className="w-3 h-3" />
              <span>Delete Selected</span>
            </button>
          </div>
        </div>
      )}

      {/* VIEW 1: KANBAN BOARD WITH DRAG & DROP */}
      {viewMode === 'kanban' && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-3.5 items-start min-w-max">
            {dealKanbanStages.map((stage, stageIdx) => {
              const stageDeals = filteredDeals.filter((d) => d.stage === stage);
              const stageGross = stageDeals.reduce((acc, curr) => acc + curr.value, 0);
              const stageWeighted = stageDeals.reduce(
                (acc, curr) => acc + Math.round((curr.value * (curr.probability ?? 50)) / 100),
                0
              );
              const isDragOver = dragOverStage === stage;

              return (
                <div
                  key={stage}
                  onDragOver={(e) => handleDragOverColumn(e, stage)}
                  onDragLeave={(e) => handleDragLeaveColumn(e, stage)}
                  onDrop={(e) => handleDropOnColumn(e, stage)}
                  className={`w-[290px] min-w-[290px] max-w-[290px] p-3 rounded-xl border flex flex-col min-h-[580px] transition-all duration-200 shrink-0 ${
                    isDragOver
                      ? 'border-sky-400 bg-sky-50/70 dark:bg-sky-950/40 shadow-md ring-2 ring-sky-300 dark:ring-sky-700'
                      : isLight
                      ? 'bg-slate-50/70 border-sky-100/90'
                      : 'bg-[#0f172a]/70 border-slate-800/80'
                  }`}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-sky-100/30">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-extrabold text-xs uppercase tracking-tight text-slate-800 dark:text-slate-100 truncate">
                        {stage}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-300 shrink-0">
                        {stageDeals.length}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <div className="text-xs font-extrabold text-emerald-500 tabular-nums">
                          {currency.symbol}{stageGross.toLocaleString()}
                        </div>
                        <div className="text-[9px] text-slate-400 font-medium">
                          w: {currency.symbol}{stageWeighted.toLocaleString()}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setDealToEdit(null);
                          setDefaultStage(stage);
                          setIsDealModalOpen(true);
                        }}
                        className="p-1 text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-slate-800 rounded transition-colors"
                        title={`Create deal in ${stage}`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Drop zone indicator when dragging */}
                  {isDragOver && (
                    <div className="mb-2 py-2 text-center text-[10px] font-bold text-sky-600 dark:text-sky-400 bg-sky-100/80 dark:bg-sky-900/40 border border-dashed border-sky-400 rounded-lg animate-pulse">
                      Drop deal here to move to {stage}
                    </div>
                  )}

                  {/* Cards Container */}
                  <div className="space-y-3 flex-1 overflow-y-auto pr-0.5">
                    {stageDeals.map((deal) => {
                      const isBeingDragged = draggedDealId === deal.id;
                      const isSelected = selectedDealIds.includes(deal.id);
                      const prob = deal.probability ?? 50;
                      const weightedVal = Math.round((deal.value * prob) / 100);
                      const clientName = deal.company || deal.client || 'Client';
                      const projectName = deal.dealName || deal.project || 'Project';

                      return (
                        <div
                          key={deal.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, deal.id)}
                          onDragEnd={handleDragEnd}
                          className={`p-3.5 rounded-xl border transition-all duration-200 hover:shadow-md group cursor-grab active:cursor-grabbing select-none ${
                            isBeingDragged
                              ? 'opacity-40 scale-95 border-sky-400'
                              : isSelected
                              ? 'border-sky-400 bg-sky-50/50 dark:bg-sky-950/30 ring-1 ring-sky-400'
                              : cardBg
                          }`}
                        >
                          {/* Priority badge, probability pill, and AI Advisor trigger */}
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={(e) => handleToggleSelectDeal(deal.id, e)}
                                className="text-slate-400 hover:text-sky-500 transition-colors"
                                title={isSelected ? 'Deselect deal' : 'Select deal'}
                              >
                                {isSelected ? (
                                  <CheckSquare className="w-3.5 h-3.5 text-sky-500" />
                                ) : (
                                  <Square className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
                                )}
                              </button>
                              <span
                                className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                                  deal.priority === 'High'
                                    ? 'bg-rose-500/15 text-rose-600'
                                    : deal.priority === 'Medium'
                                    ? 'bg-amber-500/15 text-amber-600'
                                    : 'bg-slate-500/15 text-slate-500'
                                }`}
                              >
                                {deal.priority ?? 'High'}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {/* AI Advisor Button */}
                              <button
                                onClick={() => handleOpenAdvisor(deal)}
                                className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500 hover:bg-sky-600 text-white shadow-2xs transition-all active:scale-95"
                                title="Open AI Deal Strategy Advisor"
                              >
                                <Sparkles className="w-3 h-3 text-amber-200" />
                                <span>AI Win</span>
                              </button>

                              <span className="text-[10px] font-extrabold text-sky-500 tabular-nums">
                                {prob}%
                              </span>
                            </div>
                          </div>

                          {/* Deal Project & Client */}
                          <div>
                            <h4
                              onClick={() => {
                                setDealToEdit(deal);
                                setIsDealModalOpen(true);
                              }}
                              className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-sky-500 transition-colors cursor-pointer leading-snug"
                            >
                              {projectName}
                            </h4>
                            <p className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 mt-0.5">
                              {clientName}
                            </p>
                            {deal.serviceCategory && (
                              <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                                {deal.serviceCategory}
                              </p>
                            )}
                          </div>

                          {/* Financial Value Ribbon */}
                          <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-sky-100/20 text-xs">
                            <div>
                              <span className="text-[9px] text-slate-400 block uppercase font-bold">Gross</span>
                              <span className="font-extrabold text-emerald-500 tabular-nums text-sm">
                                {currency.symbol}{deal.value.toLocaleString()}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-[9px] text-slate-400 block uppercase font-bold">Weighted</span>
                              <span className="font-bold text-sky-600 dark:text-sky-300 tabular-nums text-xs">
                                {currency.symbol}{weightedVal.toLocaleString()}
                              </span>
                            </div>
                          </div>

                          {/* Owner Reassignment & Target Date */}
                          <div className="flex items-center justify-between gap-1 mt-2 text-xs">
                            <select
                              value={deal.owner}
                              onChange={(e) => handleOwnerChange(deal.id, e.target.value)}
                              className={`text-[10px] font-medium px-1.5 py-0.5 rounded border outline-none cursor-pointer ${
                                isLight
                                  ? 'bg-slate-50 border-sky-100 text-slate-700 hover:border-sky-300'
                                  : 'bg-slate-800 border-slate-700 text-slate-300'
                              }`}
                              title="Reassign Deal Owner"
                            >
                              {ALL_OWNERS.map((o) => (
                                <option key={o} value={o}>
                                  {o.split(' ')[0]}
                                </option>
                              ))}
                            </select>

                            <span className="text-[10px] text-slate-400 tabular-nums">
                              📅 {deal.closeDate || deal.date}
                            </span>
                          </div>

                          {/* DIRECT CONTACT ACTION ICONS & STAGE ARROWS */}
                          <div className="flex items-center justify-between gap-1 mt-2.5 pt-2 border-t border-sky-100/20">
                            {/* Contact icons if contact info exists */}
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleContactDeal(deal, 'whatsapp')}
                                className="p-1 rounded bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 hover:text-white transition-colors"
                                title={`WhatsApp contact for ${clientName}`}
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleContactDeal(deal, 'email')}
                                className="p-1 rounded bg-sky-500/10 hover:bg-sky-500 text-sky-600 hover:text-white transition-colors"
                                title={`Email contact for ${clientName}`}
                              >
                                <Mail className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleContactDeal(deal, 'call')}
                                className="p-1 rounded bg-indigo-500/10 hover:bg-indigo-500 text-indigo-600 hover:text-white transition-colors"
                                title={`Call contact for ${clientName}`}
                              >
                                <Phone className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Stage Transition Arrows */}
                            <div className="flex items-center gap-1">
                              {stageIdx > 0 && (
                                <button
                                  onClick={() => handleStageChange(deal.id, dealKanbanStages[stageIdx - 1])}
                                  className="p-1 text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-slate-800 rounded transition-colors"
                                  title={`Move back to ${dealKanbanStages[stageIdx - 1]}`}
                                >
                                  <ArrowLeftIcon className="w-3 h-3" />
                                </button>
                              )}
                              {stageIdx < dealKanbanStages.length - 1 && (
                                <button
                                  onClick={() => handleStageChange(deal.id, dealKanbanStages[stageIdx + 1])}
                                  className="p-1 text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-slate-800 rounded transition-colors"
                                  title={`Advance to ${dealKanbanStages[stageIdx + 1]}`}
                                >
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {stageDeals.length === 0 && (
                      <div className="text-center py-10 text-[11px] text-slate-400 border border-dashed border-sky-200/50 dark:border-slate-800 rounded-xl">
                        Drop deals here to move to {stage}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: LIST VIEW */}
      {viewMode === 'list' && (
        <div className={`rounded-xl border overflow-hidden ${cardBg}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-sky-100/30 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-sky-50/30 dark:bg-slate-800/40">
                  <th className="py-3 px-3 w-8">
                    <button
                      onClick={handleToggleSelectAll}
                      className="p-0.5 text-slate-400 hover:text-sky-500 transition-colors"
                      title={isAllSelected ? 'Deselect All' : 'Select All'}
                    >
                      {isAllSelected ? (
                        <CheckSquare className="w-4 h-4 text-sky-500" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-3">Deal / Opportunity</th>
                  <th className="py-3">Client</th>
                  <th className="py-3 text-center">Stakeholder Actions</th>
                  <th className="py-3">Pipeline Stage</th>
                  <th className="py-3">Probability</th>
                  <th className="py-3">Deal Value</th>
                  <th className="py-3">Target Close</th>
                  <th className="py-3">Owner</th>
                  <th className="py-3 text-right px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-100/20">
                {filteredDeals.map((deal) => {
                  const isSelected = selectedDealIds.includes(deal.id);
                  const prob = deal.probability ?? 50;
                  const clientName = deal.company || deal.client || 'Client';
                  const projectName = deal.dealName || deal.project || 'Project';

                  return (
                    <tr
                      key={deal.id}
                      className={`hover:bg-sky-50/40 dark:hover:bg-slate-800/40 transition-colors ${
                        isSelected ? 'bg-sky-500/10' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-3">
                        <button
                          onClick={(e) => handleToggleSelectDeal(deal.id, e)}
                          className="p-0.5 text-slate-400 hover:text-sky-500 transition-colors"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-sky-500" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                          )}
                        </button>
                      </td>

                      {/* Deal title & category */}
                      <td className="py-3 px-3">
                        <div
                          className="cursor-pointer group"
                          onClick={() => {
                            setDealToEdit(deal);
                            setIsDealModalOpen(true);
                          }}
                        >
                          <div className="font-bold text-slate-800 dark:text-white group-hover:text-sky-500 transition-colors flex items-center gap-1.5">
                            <span>{projectName}</span>
                            {deal.priority === 'High' && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-600">
                                Hot
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {deal.serviceCategory || 'Enterprise Technology'}
                          </div>
                        </div>
                      </td>

                      {/* Client */}
                      <td className="py-3 font-semibold text-slate-700 dark:text-slate-200">
                        {clientName}
                      </td>

                      {/* Direct contact action icons + AI Advisor */}
                      <td className="py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* AI Advisor Button */}
                          <button
                            onClick={() => handleOpenAdvisor(deal)}
                            className="p-1.5 rounded-lg bg-gradient-to-r from-sky-500/15 to-indigo-500/15 hover:from-sky-500 hover:to-indigo-500 text-sky-600 hover:text-white transition-all active:scale-95 shadow-2xs"
                            title={`AI Strategy Advisor for ${projectName}`}
                          >
                            <Sparkles className="w-4 h-4" />
                          </button>

                          {/* WhatsApp */}
                          <button
                            onClick={() => handleContactDeal(deal, 'whatsapp')}
                            className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 hover:text-white transition-all active:scale-95"
                            title={`WhatsApp ${clientName}`}
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>

                          {/* Email */}
                          <button
                            onClick={() => handleContactDeal(deal, 'email')}
                            className="p-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500 text-sky-600 hover:text-white transition-all active:scale-95"
                            title={`Email ${clientName}`}
                          >
                            <Mail className="w-4 h-4" />
                          </button>

                          {/* Call */}
                          <button
                            onClick={() => handleContactDeal(deal, 'call')}
                            className="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500 text-indigo-600 hover:text-white transition-all active:scale-95"
                            title={`Call ${clientName}`}
                          >
                            <Phone className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                      {/* Pipeline Stage */}
                      <td className="py-3">
                        <select
                          value={deal.stage}
                          onChange={(e) => handleStageChange(deal.id, e.target.value as DealStage)}
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full border outline-none cursor-pointer ${
                            deal.stage === 'Won'
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                              : deal.stage === 'Lost'
                              ? 'bg-rose-500/10 text-rose-600 border-rose-500/30'
                              : deal.stage === 'Negotiation' || deal.stage === 'Contract Sent'
                              ? 'bg-indigo-500/10 text-indigo-600 border-indigo-500/30'
                              : 'bg-sky-500/10 text-sky-600 border-sky-500/30'
                          }`}
                        >
                          {dealKanbanStages.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                          {!dealKanbanStages.includes('Lost') && <option value="Lost">Lost</option>}
                        </select>
                      </td>

                      {/* Probability */}
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-xs text-sky-500 tabular-nums">
                            {prob}%
                          </span>
                          <div className="w-16 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                            <div
                              className="h-full bg-sky-500 rounded-full"
                              style={{ width: `${prob}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Deal Value */}
                      <td className="py-3 font-extrabold tabular-nums text-slate-800 dark:text-white">
                        <div className="text-emerald-500 font-bold">{currency.symbol}{deal.value.toLocaleString()}</div>
                        <div className="text-[10px] text-slate-400">
                          w: {currency.symbol}{Math.round((deal.value * prob) / 100).toLocaleString()}
                        </div>
                      </td>

                      {/* Target Close */}
                      <td className="py-3 text-slate-500 font-medium tabular-nums">
                        {deal.closeDate || deal.date}
                      </td>

                      {/* Owner with inline dropdown */}
                      <td className="py-3">
                        <select
                          value={deal.owner}
                          onChange={(e) => handleOwnerChange(deal.id, e.target.value)}
                          className={`text-[11px] font-medium px-2 py-1 rounded-lg border outline-none cursor-pointer transition-colors ${
                            isLight
                              ? 'bg-slate-50 border-sky-100 text-slate-700 hover:border-sky-300 focus:bg-white'
                              : 'bg-slate-800 border-slate-700 text-slate-200 hover:border-slate-600'
                          }`}
                        >
                          {ALL_OWNERS.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="py-3 text-right px-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setDealToEdit(deal);
                              setIsDealModalOpen(true);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors"
                            title="Edit Deal"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete deal opportunity "${projectName}"?`)) {
                                handleDeleteDeal(deal.id);
                              }
                            }}
                            className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-slate-800 transition-colors"
                            title="Delete Deal"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredDeals.length === 0 && (
            <div className="text-center py-12">
              <Briefcase className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-60" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
                No matching deal opportunities found
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Try adjusting your search query or reset the filters.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedStage('all');
                  setSelectedPriority('all');
                  setSelectedOwner('all');
                  setQuickFilter('all');
                }}
                className="mt-3 px-3 py-1.5 text-xs font-semibold text-sky-600 bg-sky-50 dark:bg-slate-800 rounded-lg hover:underline"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* MODALS */}
      {/* Deal Create / Edit Modal */}
      <DealModal
        isOpen={isDealModalOpen}
        onClose={() => setIsDealModalOpen(false)}
        onSave={handleSaveDeal}
        dealToEdit={dealToEdit}
        defaultStage={defaultStage}
      />

      {/* AI Strategy Advisor Modal */}
      <AiDealAdvisorModal
        isOpen={isAdvisorOpen}
        onClose={() => setIsAdvisorOpen(false)}
        deal={advisorDeal}
        onLogStrategyNote={handleLogStrategyNote}
      />

      {/* Direct Contact Modal for Deal Stakeholders */}
      <LeadActionModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        lead={contactLead}
        actionType={actionType}
        onLogActivity={(_leadId, desc) => {
          showToast(`Touchpoint logged: ${desc.slice(0, 40)}...`);
        }}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white dark:bg-sky-500 dark:text-slate-950 font-medium text-xs shadow-xl animate-fade-in border border-slate-700 dark:border-sky-400">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-slate-950" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
