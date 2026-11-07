import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  Plus,
  Search,
  Filter,
  Download,
  LayoutList,
  Kanban,
  MessageSquare,
  Mail,
  Phone,
  Edit2,
  Trash2,
  Eye,
  Check,
  ChevronDown,
  Flame,
  Zap,
  Snowflake,
  ArrowRight,
  ArrowLeft as ArrowLeftIcon,
  User,
  DollarSign,
  TrendingUp,
  Clock,
  Sparkles,
  CheckSquare,
  Square,
  MoreVertical,
  ArrowUpDown,
  CheckCircle2,
  X,
} from 'lucide-react';
import { Lead, LeadStatus, LeadPriority, LeadSource, LeadActivity } from '../../types/crm';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useCrmConfig } from '../../data/crmConfig';
import { useSystemCurrency } from '../../data/currencyService';
import { addNotification } from '../../data/notificationService';
import { INITIAL_LEADS } from '../../data/mockData';
import { LeadModal } from './LeadModal';
import { LeadActionModal, ContactActionType } from './LeadActionModal';
import { LeadDetailsDrawer } from './LeadDetailsDrawer';
import { AiFollowupModal } from './AiFollowupModal';

const KANBAN_STAGES: LeadStatus[] = [
  'New Lead',
  'Contacted',
  'Follow-up',
  'Qualified',
  'Proposal Sent',
  'Negotiation',
  'Won',
];

const ALL_OWNERS = ['Amit Kumar', 'Neha Sharma', 'Rizwan Khan', 'Priya Singh', 'Vikram Joshi', 'Sayed'];

type LeadSortOption =
  | 'value-desc'
  | 'value-asc'
  | 'score-desc'
  | 'name-asc'
  | 'recent';

export const LeadsView: React.FC = () => {
  const { theme, setActiveNav } = useTheme();
  const { scopeFilter, users } = useAuth();
  const { config } = useCrmConfig();
  const currency = useSystemCurrency();
  const isLight = theme === 'white-sky';
  const kanbanStages = useMemo(
    () => (config.leadStages.length > 0 ? config.leadStages.map((s) => s.name) : KANBAN_STAGES),
    [config.leadStages]
  );
  const leadSources = useMemo(
    () => (config.leadSources.length > 0 ? config.leadSources.map((s) => s.name) : []),
    [config.leadSources]
  );

  const reloadLeadsFromStorage = () => {
    try {
      const saved = localStorage.getItem('ozostack_leads_v2');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      /* fallback */
    }
    return INITIAL_LEADS;
  };

  // Leads State (persisted so assignments survive user switching)
  const [leads, setLeads] = useState<Lead[]>(reloadLeadsFromStorage);

  useEffect(() => {
    const onConfigChanged = () => setLeads(reloadLeadsFromStorage());
    window.addEventListener('ozostack-crm-config-changed', onConfigChanged);
    window.addEventListener('storage', onConfigChanged);
    return () => {
      window.removeEventListener('ozostack-crm-config-changed', onConfigChanged);
      window.removeEventListener('storage', onConfigChanged);
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('ozostack_leads_v2', JSON.stringify(leads));
    } catch {
      /* ignore */
    }
  }, [leads]);

  const visibleLeads = useMemo(
    () => scopeFilter(leads, (l) => ({ owner: l.owner })),
    [leads, scopeFilter]
  );
  const [activities, setActivities] = useState<LeadActivity[]>([
    {
      id: 'act-1',
      leadId: 'lead-1',
      type: 'whatsapp',
      description: 'Sent proposal breakdown and discussed Gemini automation scope via WhatsApp.',
      timestamp: '2025-05-20 10:30 AM',
      author: 'Amit Kumar',
    },
    {
      id: 'act-2',
      leadId: 'lead-2',
      type: 'call',
      description: 'Scheduled demo for GreenLeaf management team.',
      timestamp: '2025-05-19 02:15 PM',
      author: 'Neha Sharma',
    },
    {
      id: 'act-3',
      leadId: 'lead-3',
      type: 'email',
      description: 'Sent enterprise CRM security compliance checklist.',
      timestamp: '2025-05-18 11:00 AM',
      author: 'Rizwan Khan',
    },
  ]);

  // View Mode: 'list' | 'kanban'
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedOwner, setSelectedOwner] = useState<string>('all');
  const [quickFilter, setQuickFilter] = useState<'all' | 'hot' | 'followup' | 'won'>('all');
  const [sortBy, setSortBy] = useState<LeadSortOption>('value-desc');
  const [defaultStage, setDefaultStage] = useState<LeadStatus>('New Lead');

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Selected row IDs for bulk actions
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [leadToEdit, setLeadToEdit] = useState<Lead | null>(null);

  // Direct Contact Action Modal
  const [actionModalLead, setActionModalLead] = useState<Lead | null>(null);
  const [actionType, setActionType] = useState<ContactActionType>('whatsapp');
  const [actionStageTrigger, setActionStageTrigger] = useState<LeadStatus | undefined>(undefined);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);

  // Status Change WhatsApp Prompt Toast
  const [statusChangePrompt, setStatusChangePrompt] = useState<{ lead: Lead; stage: LeadStatus } | null>(null);

  // AI Follow-up Draft Modal
  const [aiFollowupLead, setAiFollowupLead] = useState<Lead | null>(null);
  const [isAiFollowupOpen, setIsAiFollowupOpen] = useState(false);

  // Drag and Drop State for Kanban
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<LeadStatus | null>(null);

  // Lead Details Drawer
  const [activeDrawerLead, setActiveDrawerLead] = useState<Lead | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const cardBg = isLight
    ? 'bg-white border-sky-100/90 shadow-xs'
    : 'bg-[#0f172a]/90 border-slate-800/80';

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    const list = visibleLeads.filter((lead) => {
      // Search
      const matchesSearch =
        lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.phone.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Status
      if (selectedStatus !== 'all' && lead.status !== selectedStatus) return false;

      // Source
      if (selectedSource !== 'all' && lead.source !== selectedSource) return false;

      // Priority
      if (selectedPriority !== 'all' && lead.priority !== selectedPriority) return false;

      // Owner
      if (selectedOwner !== 'all' && lead.owner !== selectedOwner) return false;

      // Quick filter
      if (quickFilter === 'hot' && lead.priority !== 'Hot') return false;
      if (quickFilter === 'won' && lead.status !== 'Won') return false;
      if (quickFilter === 'followup' && lead.status !== 'Contacted' && lead.status !== 'Proposal Sent')
        return false;

      return true;
    });

    return list.sort((a, b) => {
      switch (sortBy) {
        case 'value-desc':
          return b.value - a.value;
        case 'value-asc':
          return a.value - b.value;
        case 'score-desc':
          return b.score - a.score;
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'recent':
          return (b.createdAt || '').localeCompare(a.createdAt || '');
        default:
          return 0;
      }
    });
  }, [visibleLeads, searchQuery, selectedStatus, selectedSource, selectedPriority, selectedOwner, quickFilter, sortBy]);

  // Summary Metrics
  const totalValue = useMemo(() => {
    return visibleLeads.reduce((acc, curr) => acc + curr.value, 0);
  }, [visibleLeads]);

  const hotLeadsCount = useMemo(() => {
    return visibleLeads.filter((l) => l.priority === 'Hot').length;
  }, [visibleLeads]);

  const wonLeadsCount = useMemo(() => {
    return visibleLeads.filter((l) => l.status === 'Won').length;
  }, [visibleLeads]);

  const avgScore = useMemo(() => {
    if (visibleLeads.length === 0) return 0;
    const sum = visibleLeads.reduce((acc, curr) => acc + curr.score, 0);
    return Math.round(sum / visibleLeads.length);
  }, [visibleLeads]);

  // Handlers
  const handleSaveLead = (lead: Lead) => {
    setLeads((prev) => {
      const exists = prev.some((l) => l.id === lead.id);
      if (exists) {
        return prev.map((l) => (l.id === lead.id ? lead : l));
      }
      return [lead, ...prev];
    });

    // Add activity log
    const activityDesc = leadToEdit
      ? `Updated lead information for ${lead.name}`
      : `Created new lead: ${lead.name} (${lead.company}) - Value ${currency.symbol}${lead.value.toLocaleString()}`;

    setActivities((prev) => [
      {
        id: `act-${Date.now()}`,
        leadId: lead.id,
        type: 'status_change',
        description: activityDesc,
        timestamp: 'Just now',
        author: 'Sayed (Founder & CEO)',
      },
      ...prev,
    ]);

    if (!leadToEdit) {
      addNotification({
        title: `New Lead: "${lead.name}"`,
        subtitle: `${lead.company} · Value ${currency.symbol}${lead.value.toLocaleString()} · Owner: ${lead.owner}`,
        type: 'lead',
        read: false,
        targetNav: 'Leads',
        targetId: lead.id,
        priority: 'high',
        timeAgo: 'Just now',
      });
    }
  };

  const handleDeleteLead = (leadId: string) => {
    setLeads((prev) => {
      const next = prev.filter((l) => l.id !== leadId);
      try {
        localStorage.setItem('ozostack_leads_v2', JSON.stringify(next));
      } catch {}
      return next;
    });
    setSelectedLeadIds((prev) => prev.filter((id) => id !== leadId));
    if (activeDrawerLead?.id === leadId) {
      setIsDrawerOpen(false);
    }
  };

  const handleStatusChange = (leadId: string, newStatus: LeadStatus) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
    );

    const lead = leads.find((l) => l.id === leadId);
    if (lead) {
      setActivities((prev) => [
        {
          id: `act-${Date.now()}`,
          leadId,
          type: 'status_change',
          description: `Stage changed to "${newStatus}"`,
          timestamp: 'Just now',
          author: 'Sayed',
        },
        ...prev,
      ]);

      if (activeDrawerLead?.id === leadId) {
        setActiveDrawerLead((prev) => (prev ? { ...prev, status: newStatus } : null));
      }

      // Prompt for WhatsApp follow-up if not Lost
      if (newStatus !== 'Lost') {
        setStatusChangePrompt({
          lead: { ...lead, status: newStatus },
          stage: newStatus,
        });
      }
    }
  };

  const handleOwnerChange = (leadId: string, newOwner: string) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, owner: newOwner } : l))
    );

    const lead = leads.find((l) => l.id === leadId);
    if (lead) {
      setActivities((prev) => [
        {
          id: `act-${Date.now()}`,
          leadId,
          type: 'status_change',
          description: `Assigned owner changed to ${newOwner}`,
          timestamp: 'Just now',
          author: 'Sayed',
        },
        ...prev,
      ]);

      if (activeDrawerLead?.id === leadId) {
        setActiveDrawerLead((prev) => (prev ? { ...prev, owner: newOwner } : null));
      }
    }
  };

  const handleOpenAiFollowup = (lead: Lead) => {
    setAiFollowupLead(lead);
    setIsAiFollowupOpen(true);
  };

  // Drag and Drop handlers for Kanban
  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('text/plain', leadId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedLeadId(leadId);
  };

  const handleDragEnd = () => {
    setDraggedLeadId(null);
    setDragOverStage(null);
  };

  const handleDragOverColumn = (e: React.DragEvent, stage: LeadStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStage !== stage) {
      setDragOverStage(stage);
    }
  };

  const handleDragLeaveColumn = (e: React.DragEvent, stage: LeadStatus) => {
    // Only clear if leaving the column boundary
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    if (dragOverStage === stage) {
      setDragOverStage(null);
    }
  };

  const handleDropOnColumn = (e: React.DragEvent, stage: LeadStatus) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('text/plain') || draggedLeadId;
    if (leadId) {
      handleStatusChange(leadId, stage);
    }
    setDraggedLeadId(null);
    setDragOverStage(null);
  };

  const handleAddActivity = (leadId: string, description: string) => {
    setActivities((prev) => [
      {
        id: `act-${Date.now()}`,
        leadId,
        type: 'note',
        description,
        timestamp: 'Just now',
        author: 'Sayed',
      },
      ...prev,
    ]);
  };

  const handleOpenContact = (
    lead: Lead,
    type: ContactActionType,
    stageTrigger?: LeadStatus
  ) => {
    setActionModalLead(lead);
    setActionType(type);
    setActionStageTrigger(
      stageTrigger || (type === 'whatsapp' ? (lead.status as LeadStatus) : undefined)
    );
    setIsActionModalOpen(true);
  };

  const handleSelectAll = () => {
    if (selectedLeadIds.length === filteredLeads.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(filteredLeads.map((l) => l.id));
    }
  };

  const toggleSelectLead = (id: string) => {
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    if (confirm(`Are you sure you want to delete ${selectedLeadIds.length} leads?`)) {
      setLeads((prev) => {
        const next = prev.filter((l) => !selectedLeadIds.includes(l.id));
        try {
          localStorage.setItem('ozostack_leads_v2', JSON.stringify(next));
        } catch {}
        return next;
      });
      setSelectedLeadIds([]);
    }
  };

  const handleBulkStatusChange = (newStatus: LeadStatus) => {
    setLeads((prev) =>
      prev.map((l) => (selectedLeadIds.includes(l.id) ? { ...l, status: newStatus } : l))
    );
    setSelectedLeadIds([]);
  };

  const handleExportCSV = () => {
    const headers = [
      'Lead ID',
      'Name',
      'Company',
      'Title',
      'Email',
      'Phone',
      'WhatsApp',
      'Status',
      'Priority',
      'Value ($)',
      'Source',
      'Owner',
      'Score',
      'Created Date',
    ];

    const rows = filteredLeads.map((l) => [
      l.id,
      `"${l.name}"`,
      `"${l.company}"`,
      `"${l.title}"`,
      l.email,
      `"${l.phone}"`,
      `"${l.whatsapp}"`,
      l.status,
      l.priority,
      l.value,
      l.source,
      `"${l.owner}"`,
      l.score,
      l.createdAt,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ozostack_leads_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const ownersList = useMemo(
    () => Array.from(new Set([...users.map((u) => u.name), ...visibleLeads.map((l) => l.owner), ...ALL_OWNERS])),
    [users, visibleLeads]
  );

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
              <span>Leads Management</span>
              <span className="text-xs bg-sky-500/15 text-sky-600 dark:text-sky-400 font-bold px-2 py-0.5 rounded-full">
                {visibleLeads.length} Leads
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pipeline Value: <span className="font-bold text-emerald-500">{currency.symbol}{totalValue.toLocaleString()}</span> · Average Conversion Score: <span className="font-bold text-sky-500">{avgScore}/100</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={handleExportCSV}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${
              isLight
                ? 'bg-white border-sky-200 text-slate-700 hover:bg-sky-50'
                : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
            }`}
            title="Download CSV export"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Export CSV</span>
          </button>

          <button
            onClick={() => {
              setLeadToEdit(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg text-white bg-sky-500 hover:bg-sky-600 shadow-sm shadow-sky-500/25 active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Lead</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        <div
          onClick={() => {
            setQuickFilter('all');
            setSelectedStatus('all');
            setSelectedPriority('all');
            setSelectedOwner('all');
            showToast('Showing all active leads.');
          }}
          className={`p-3 rounded-xl border cursor-pointer transition-all hover:scale-[1.01] ${cardBg} ${
            quickFilter === 'all' && selectedStatus === 'all' ? 'ring-2 ring-sky-500/40' : ''
          }`}
          title="Click to reset filters and view all active leads"
        >
          <div className="text-[10px] font-bold text-slate-400 uppercase">Total Active Leads</div>
          <div className="text-xl font-extrabold text-slate-800 dark:text-white tabular-nums mt-0.5">
            {visibleLeads.length}
          </div>
          <div className="text-[10px] text-emerald-500 font-semibold mt-0.5">▲ +18.7% this month</div>
        </div>

        <div
          onClick={() => {
            setSortBy('value-desc');
            showToast('Sorted by highest pipeline value.');
          }}
          className={`p-3 rounded-xl border cursor-pointer transition-all hover:scale-[1.01] ${cardBg} ${
            sortBy === 'value-desc' ? 'ring-2 ring-emerald-500/40' : ''
          }`}
          title="Click to sort by pipeline value"
        >
          <div className="text-[10px] font-bold text-slate-400 uppercase">Pipeline Value</div>
          <div className="text-xl font-extrabold text-emerald-500 tabular-nums mt-0.5">
            {currency.symbol}{totalValue.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Across all active stages</div>
        </div>

        <div
          onClick={() => {
            setQuickFilter('hot');
            showToast('Filtered by Hot Leads.');
          }}
          className={`p-3 rounded-xl border cursor-pointer transition-all hover:scale-[1.01] ${cardBg} ${
            quickFilter === 'hot' ? 'ring-2 ring-rose-500/40' : ''
          }`}
          title="Click to filter by Hot Leads"
        >
          <div className="text-[10px] font-bold text-slate-400 uppercase">🔥 Hot Leads</div>
          <div className="text-xl font-extrabold text-rose-500 tabular-nums mt-0.5">
            {hotLeadsCount}
          </div>
          <div className="text-[10px] text-rose-500 font-semibold mt-0.5">High close probability</div>
        </div>

        <div
          onClick={() => {
            setQuickFilter('won');
            showToast('Filtered by Closed Won Deals.');
          }}
          className={`p-3 rounded-xl border cursor-pointer transition-all hover:scale-[1.01] ${cardBg} ${
            quickFilter === 'won' ? 'ring-2 ring-teal-500/40' : ''
          }`}
          title="Click to filter by Closed Won"
        >
          <div className="text-[10px] font-bold text-slate-400 uppercase">Deals Won</div>
          <div className="text-xl font-extrabold text-teal-500 tabular-nums mt-0.5">
            {wonLeadsCount}
          </div>
          <div className="text-[10px] text-teal-600 font-semibold mt-0.5">Closed deals</div>
        </div>

        <div
          onClick={() => {
            setSortBy('score-desc');
            showToast('Sorted by AI Lead Score.');
          }}
          className={`p-3 rounded-xl border col-span-2 sm:col-span-4 lg:col-span-1 cursor-pointer transition-all hover:scale-[1.01] ${cardBg} ${
            sortBy === 'score-desc' ? 'ring-2 ring-sky-500/40' : ''
          }`}
          title="Click to sort by AI Lead Score"
        >
          <div className="text-[10px] font-bold text-slate-400 uppercase">Average Lead Score</div>
          <div className="text-xl font-extrabold text-sky-500 tabular-nums mt-0.5">
            {avgScore}/100
          </div>
          <div className="text-[10px] text-sky-600 font-semibold mt-0.5">AI qualified rating</div>
        </div>
      </div>

      {/* Control Bar: View Mode Switcher, Search, and Filters */}
      <div className={`p-3.5 rounded-xl border space-y-3 ${cardBg}`}>
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Left: View Switcher (List View vs Kanban Board) */}
          <div className="flex items-center gap-1 p-1 bg-sky-100/60 dark:bg-slate-800 rounded-xl shrink-0 self-start">
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

            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'kanban'
                  ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Kanban Board</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, company, email, or phone..."
              className={`w-full text-xs pl-9 pr-3 py-2 rounded-lg border outline-none ${
                isLight
                  ? 'bg-slate-50 border-sky-200 text-slate-800 focus:border-sky-500'
                  : 'bg-slate-900 border-slate-700 text-white focus:border-sky-400'
              }`}
            />
          </div>

          {/* Filters & Sorting */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className={`text-xs px-2.5 py-1.5 rounded-lg border outline-none font-medium ${
                isLight
                  ? 'bg-white border-sky-200 text-slate-700'
                  : 'bg-slate-800 border-slate-700 text-slate-200'
              }`}
            >
              <option value="all">All Stages</option>
              {kanbanStages.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
              {!kanbanStages.includes('Lost') && <option value="Lost">Lost</option>}
            </select>

            {/* Source Filter */}
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className={`text-xs px-2.5 py-1.5 rounded-lg border outline-none font-medium ${
                isLight
                  ? 'bg-white border-sky-200 text-slate-700'
                  : 'bg-slate-800 border-slate-700 text-slate-200'
              }`}
            >
              <option value="all">All Sources</option>
              {leadSources.map((src) => (
                <option key={src} value={src}>
                  {src}
                </option>
              ))}
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
              <option value="Hot">🔥 Hot</option>
              <option value="Warm">⚡ Warm</option>
              <option value="Cold">❄️ Cold</option>
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
              <option value="all">All Owners</option>
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
                onChange={(e) => setSortBy(e.target.value as LeadSortOption)}
                className={`text-xs px-2.5 py-1.5 rounded-lg border outline-none font-medium ${
                  isLight
                    ? 'bg-white border-sky-200 text-slate-700'
                    : 'bg-slate-800 border-slate-700 text-slate-200'
                }`}
              >
                <option value="value-desc">Value (High to Low)</option>
                <option value="value-asc">Value (Low to High)</option>
                <option value="score-desc">AI Score (High to Low)</option>
                <option value="name-asc">Lead Name (A → Z)</option>
                <option value="recent">Recently Added</option>
              </select>
            </div>
          </div>
        </div>

        {/* Quick Filter Segmented Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-sky-100/20 text-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
            Quick Filters:
          </span>
          {[
            { id: 'all', label: 'All Leads' },
            { id: 'hot', label: '🔥 Hot Priority' },
            { id: 'followup', label: '📞 Needs Follow-Up' },
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
            Showing <span className="font-bold text-slate-800 dark:text-white">{filteredLeads.length}</span> of {leads.length}
          </span>
        </div>
      </div>

      {/* Bulk Action Bar (when rows are selected) */}
      {selectedLeadIds.length > 0 && (
        <div className="p-3 rounded-xl border bg-sky-500/10 border-sky-500/30 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sky-700 dark:text-sky-300">
              {selectedLeadIds.length} lead{selectedLeadIds.length > 1 ? 's' : ''} selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkStatusChange('Won')}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              Mark as Won
            </button>
            <button
              onClick={() => handleBulkStatusChange('Contacted')}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white"
            >
              Mark as Contacted
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-500 text-white"
            >
              Delete Selected
            </button>
            <button
              onClick={() => setSelectedLeadIds([])}
              className="px-2 py-1 rounded-lg text-xs font-medium text-slate-500 hover:underline"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* VIEW 1: LIST VIEW TABLE */}
      {viewMode === 'list' && (
        <div className={`p-4 rounded-xl border ${cardBg}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[900px]">
              <thead>
                <tr className="border-b border-sky-100/30 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="pb-2.5 w-8">
                    <button onClick={handleSelectAll} className="p-0.5 text-slate-400">
                      {selectedLeadIds.length === filteredLeads.length && filteredLeads.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-sky-500" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="pb-2.5">Lead Contact</th>
                  <th className="pb-2.5">Company</th>
                  {/* DIRECT CONTACT ICONS COLUMN */}
                  <th className="pb-2.5 text-center">Direct Contact</th>
                  <th className="pb-2.5">Stage / Status</th>
                  <th className="pb-2.5">Priority</th>
                  <th className="pb-2.5">Deal Value</th>
                  <th className="pb-2.5">Score</th>
                  <th className="pb-2.5">Owner</th>
                  <th className="pb-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-100/20">
                {filteredLeads.map((lead) => {
                  const isSelected = selectedLeadIds.includes(lead.id);
                  return (
                    <tr
                      key={lead.id}
                      className={`hover:bg-sky-500/5 transition-colors ${
                        isSelected ? (isLight ? 'bg-sky-50/60' : 'bg-slate-800/40') : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3">
                        <button
                          onClick={() => toggleSelectLead(lead.id)}
                          className="p-0.5 text-slate-400"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-sky-500" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Lead Name & Info */}
                      <td className="py-3">
                        <div
                          className="flex items-center gap-2.5 cursor-pointer group"
                          onClick={() => {
                            setActiveDrawerLead(lead);
                            setIsDrawerOpen(true);
                          }}
                        >
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-400 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                            {lead.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 dark:text-white group-hover:text-sky-500 transition-colors">
                              {lead.name}
                            </div>
                            <div className="text-[10px] text-slate-400">{lead.title}</div>
                          </div>
                        </div>
                      </td>

                      {/* Company */}
                      <td className="py-3 font-medium text-slate-600 dark:text-slate-300">
                        {lead.company}
                      </td>

                      {/* DIRECT CONTACT ICONS (WhatsApp, Mail, Call + AI Draft) */}
                      <td className="py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* AI Follow-up Draft */}
                          <button
                            onClick={() => handleOpenAiFollowup(lead)}
                            className="p-1.5 rounded-lg bg-gradient-to-r from-sky-500/15 to-indigo-500/15 hover:from-sky-500 hover:to-indigo-500 text-sky-600 hover:text-white transition-all active:scale-95 shadow-2xs"
                            title={`Generate AI Follow-up draft for ${lead.name}`}
                          >
                            <Sparkles className="w-4 h-4" />
                          </button>

                          {/* WhatsApp Button */}
                          <button
                            onClick={() => handleOpenContact(lead, 'whatsapp')}
                            className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 hover:text-white transition-all active:scale-95"
                            title={`WhatsApp ${lead.name} (${lead.whatsapp || lead.phone})`}
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>

                          {/* Email Button */}
                          <button
                            onClick={() => handleOpenContact(lead, 'email')}
                            className="p-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500 text-sky-600 hover:text-white transition-all active:scale-95"
                            title={`Email ${lead.name} (${lead.email})`}
                          >
                            <Mail className="w-4 h-4" />
                          </button>

                          {/* Call Button */}
                          <button
                            onClick={() => handleOpenContact(lead, 'call')}
                            className="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500 text-indigo-600 hover:text-white transition-all active:scale-95"
                            title={`Call ${lead.name} (${lead.phone})`}
                          >
                            <Phone className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                      {/* Stage / Status */}
                      <td className="py-3">
                        <select
                          value={lead.status}
                          onChange={(e) => handleStatusChange(lead.id, e.target.value as LeadStatus)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border outline-none cursor-pointer ${
                            lead.status === 'Won'
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                              : lead.status === 'Lost'
                              ? 'bg-rose-500/10 text-rose-600 border-rose-500/30'
                              : lead.status === 'Negotiation' || lead.status === 'Proposal Sent'
                              ? 'bg-indigo-500/10 text-indigo-600 border-indigo-500/30'
                              : lead.status === 'Follow-up'
                              ? 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                              : 'bg-sky-500/10 text-sky-600 border-sky-500/30'
                          }`}
                        >
                          {kanbanStages.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                          {!kanbanStages.includes('Lost') && <option value="Lost">Lost</option>}
                        </select>
                      </td>

                      {/* Priority */}
                      <td className="py-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md inline-flex items-center gap-1 ${
                            lead.priority === 'Hot'
                              ? 'bg-rose-500/15 text-rose-600'
                              : lead.priority === 'Warm'
                              ? 'bg-amber-500/15 text-amber-600'
                              : 'bg-slate-500/15 text-slate-500'
                          }`}
                        >
                          {lead.priority === 'Hot' && <Flame className="w-3 h-3" />}
                          {lead.priority === 'Warm' && <Zap className="w-3 h-3" />}
                          {lead.priority === 'Cold' && <Snowflake className="w-3 h-3" />}
                          <span>{lead.priority}</span>
                        </span>
                      </td>

                      {/* Value */}
                      <td className="py-3 font-extrabold tabular-nums text-slate-800 dark:text-white">
                        {currency.symbol}{lead.value.toLocaleString()}
                      </td>

                      {/* Score */}
                      <td className="py-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-bold tabular-nums text-xs ${
                              lead.score >= 85
                                ? 'text-emerald-500'
                                : lead.score >= 70
                                ? 'text-sky-500'
                                : 'text-slate-400'
                            }`}
                          >
                            {lead.score}
                          </span>
                          <span className="text-[10px] text-slate-400">/100</span>
                        </div>
                      </td>

                      {/* Owner with inline reassignment */}
                      <td className="py-3">
                        <select
                          value={lead.owner}
                          onChange={(e) => handleOwnerChange(lead.id, e.target.value)}
                          className={`text-[11px] font-medium px-2 py-1 rounded-lg border outline-none cursor-pointer transition-colors ${
                            isLight
                              ? 'bg-slate-50 border-sky-100 text-slate-700 hover:border-sky-300 focus:bg-white'
                              : 'bg-slate-800 border-slate-700 text-slate-200 hover:border-slate-600'
                          }`}
                          title="Click to reassign lead owner"
                        >
                          {ownersList.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setActiveDrawerLead(lead);
                              setIsDrawerOpen(true);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors"
                            title="View Lead Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setLeadToEdit(lead);
                              setIsModalOpen(true);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors"
                            title="Edit Lead"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete lead ${lead.name}?`)) {
                                handleDeleteLead(lead.id);
                              }
                            }}
                            className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-slate-800 transition-colors"
                            title="Delete Lead"
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

          {filteredLeads.length === 0 && (
            <div className="text-center py-12">
              <User className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-60" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
                No matching leads found
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Try adjusting your search criteria or create a new lead.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedStatus('all');
                  setSelectedPriority('all');
                  setSelectedOwner('all');
                  setQuickFilter('all');
                }}
                className="mt-3 px-3 py-1.5 text-xs font-semibold text-sky-600 bg-sky-50 dark:bg-slate-800 rounded-lg hover:underline"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: KANBAN BOARD VIEW WITH DRAG & DROP */}
      {viewMode === 'kanban' && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-3.5 items-start min-w-max">
            {kanbanStages.map((stage, stageIdx) => {
              const stageLeads = filteredLeads.filter((l) => l.status === stage);
              const stageValue = stageLeads.reduce((acc, curr) => acc + curr.value, 0);
              const isDragOver = dragOverStage === stage;

              return (
                <div
                  key={stage}
                  onDragOver={(e) => handleDragOverColumn(e, stage)}
                  onDragLeave={(e) => handleDragLeaveColumn(e, stage)}
                  onDrop={(e) => handleDropOnColumn(e, stage)}
                  className={`w-[285px] min-w-[285px] max-w-[285px] p-3 rounded-xl border flex flex-col min-h-[580px] transition-all duration-200 shrink-0 ${
                    isDragOver
                      ? 'border-sky-400 bg-sky-50/70 dark:bg-sky-950/40 shadow-md ring-2 ring-sky-300 dark:ring-sky-700'
                      : isLight
                      ? 'bg-slate-50/70 border-sky-100/90'
                      : 'bg-[#0f172a]/70 border-slate-800/80'
                  }`}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-sky-100/30">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-extrabold text-[11px] uppercase tracking-tight text-slate-700 dark:text-slate-200 truncate">
                        {stage}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-300 shrink-0">
                        {stageLeads.length}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] font-extrabold text-emerald-500 tabular-nums">
                        {currency.symbol}{stageValue.toLocaleString()}
                      </span>
                      <button
                        onClick={() => {
                          setLeadToEdit(null);
                          setDefaultStage(stage);
                          setIsModalOpen(true);
                        }}
                        className="p-1 text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-slate-800 rounded transition-colors"
                        title={`Add lead in ${stage}`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Drop zone indicator when dragging */}
                  {isDragOver && (
                    <div className="mb-2 py-2 text-center text-[10px] font-bold text-sky-600 dark:text-sky-400 bg-sky-100/80 dark:bg-sky-900/40 border border-dashed border-sky-400 rounded-lg animate-pulse">
                      Drop here to move to {stage}
                    </div>
                  )}

                  {/* Cards Container */}
                  <div className="space-y-2.5 flex-1 overflow-y-auto pr-0.5">
                    {stageLeads.map((lead) => {
                      const isBeingDragged = draggedLeadId === lead.id;
                      const initials = lead.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2);

                      return (
                        <div
                          key={lead.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, lead.id)}
                          onDragEnd={handleDragEnd}
                          className={`p-3 rounded-xl border transition-all duration-200 hover:shadow-md group cursor-grab active:cursor-grabbing select-none flex flex-col justify-between ${
                            isBeingDragged
                              ? 'opacity-40 scale-95 border-sky-400'
                              : cardBg
                          }`}
                        >
                          <div>
                            {/* Top row: Priority badge + Score */}
                            <div className="flex items-center justify-between mb-2">
                              <span
                                className={`text-[9px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                                  lead.priority === 'Hot'
                                    ? 'bg-rose-500/15 text-rose-600'
                                    : lead.priority === 'Warm'
                                    ? 'bg-amber-500/15 text-amber-600'
                                    : 'bg-slate-500/15 text-slate-500'
                                }`}
                              >
                                {lead.priority === 'Hot' && <Flame className="w-2.5 h-2.5" />}
                                {lead.priority === 'Warm' && <Zap className="w-2.5 h-2.5" />}
                                {lead.priority === 'Cold' && <Snowflake className="w-2.5 h-2.5" />}
                                <span>{lead.priority}</span>
                              </span>

                              <div className="flex items-center gap-1">
                                <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                                  {lead.source}
                                </span>
                                <span className="text-[10px] font-extrabold text-sky-500 tabular-nums">
                                  Score {lead.score}
                                </span>
                              </div>
                            </div>

                            {/* Lead Name & Company */}
                            <div
                              onClick={() => {
                                setActiveDrawerLead(lead);
                                setIsDrawerOpen(true);
                              }}
                              className="cursor-pointer group/title"
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-sky-400 to-indigo-600 text-white font-black text-[10px] flex items-center justify-center shrink-0">
                                  {initials}
                                </div>
                                <h4 className="text-xs font-black text-slate-800 dark:text-white group-hover/title:text-sky-500 transition-colors line-clamp-1">
                                  {lead.name}
                                </h4>
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight pl-8 line-clamp-1">
                                {lead.title} · <span className="font-semibold text-slate-700 dark:text-slate-300">{lead.company}</span>
                              </p>
                            </div>

                            {/* Value and Owner Reassignment */}
                            <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-sky-100/20 text-xs">
                              <span className="font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                                {currency.symbol}{lead.value.toLocaleString()}
                              </span>
                              <div className="flex items-center gap-1">
                                <User className="w-3 h-3 text-slate-400" />
                                <select
                                  value={lead.owner}
                                  onChange={(e) => handleOwnerChange(lead.id, e.target.value)}
                                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border outline-none cursor-pointer ${
                                    isLight
                                      ? 'bg-slate-50 border-sky-100 text-slate-700 hover:border-sky-300'
                                      : 'bg-slate-800 border-slate-700 text-slate-300'
                                  }`}
                                  title="Reassign Owner"
                                >
                                  {ownersList.map((o) => (
                                    <option key={o} value={o}>
                                      {o.split(' ')[0]}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>

                          {/* DIRECT CONTACT ACTION BUTTONS (AI Follow-Up, WhatsApp, Mail, Call, Stage Move) */}
                          <div className="flex items-center justify-between gap-1 mt-2.5 pt-2 border-t border-sky-100/20">
                            <div className="flex items-center gap-1">
                              {/* AI Follow-Up Button */}
                              <button
                                onClick={() => handleOpenAiFollowup(lead)}
                                className="p-1 rounded bg-sky-500/10 hover:bg-sky-500 text-sky-600 hover:text-white transition-colors"
                                title="Generate AI Follow-up draft"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                              </button>

                              {/* WhatsApp */}
                              <button
                                onClick={() => handleOpenContact(lead, 'whatsapp')}
                                className="p-1 rounded bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 hover:text-white transition-colors"
                                title="WhatsApp"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </button>

                              {/* Email */}
                              <button
                                onClick={() => handleOpenContact(lead, 'email')}
                                className="p-1 rounded bg-sky-500/10 hover:bg-sky-500 text-sky-600 hover:text-white transition-colors"
                                title="Email"
                              >
                                <Mail className="w-3.5 h-3.5" />
                              </button>

                              {/* Call */}
                              <button
                                onClick={() => handleOpenContact(lead, 'call')}
                                className="p-1 rounded bg-indigo-500/10 hover:bg-indigo-500 text-indigo-600 hover:text-white transition-colors"
                                title="Call"
                              >
                                <Phone className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Stage Transition Arrows */}
                            <div className="flex items-center gap-1">
                              {stageIdx > 0 && (
                                <button
                                  onClick={() => handleStatusChange(lead.id, kanbanStages[stageIdx - 1])}
                                  className="p-1 text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-slate-800 rounded transition-colors"
                                  title={`Move back to ${kanbanStages[stageIdx - 1]}`}
                                >
                                  <ArrowLeftIcon className="w-3 h-3" />
                                </button>
                              )}
                              {stageIdx < kanbanStages.length - 1 && (
                                <button
                                  onClick={() => handleStatusChange(lead.id, kanbanStages[stageIdx + 1])}
                                  className="p-1 text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-slate-800 rounded transition-colors"
                                  title={`Move to ${kanbanStages[stageIdx + 1]}`}
                                >
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {stageLeads.length === 0 && (
                      <div className="text-center py-8 text-[11px] text-slate-400 border border-dashed border-sky-200/50 dark:border-slate-800 rounded-xl">
                        Drop or move leads here
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 360 Lead Details Drawer (Rendered before modals so modals sit on top) */}
      <LeadDetailsDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        lead={activeDrawerLead}
        onEdit={(lead) => {
          setIsDrawerOpen(false);
          setLeadToEdit(lead);
          setIsModalOpen(true);
        }}
        onDelete={handleDeleteLead}
        onStatusChange={handleStatusChange}
        onOwnerChange={handleOwnerChange}
        onContactClick={handleOpenContact}
        onOpenAiFollowup={handleOpenAiFollowup}
        activities={activities}
        onAddActivity={handleAddActivity}
      />

      {/* MODALS (Rendered with z-[70] so they cleanly overlay drawer without overlap) */}
      {/* Create / Edit Modal */}
      <LeadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveLead}
        leadToEdit={leadToEdit}
        defaultStage={defaultStage}
      />

      {/* Direct Contact Modal (WhatsApp, Mail, Call) */}
      <LeadActionModal
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        lead={actionModalLead}
        actionType={actionType}
        initialStageTrigger={actionStageTrigger}
        onLogActivity={handleAddActivity}
      />

      {/* AI Follow-Up Draft Modal */}
      <AiFollowupModal
        isOpen={isAiFollowupOpen}
        onClose={() => setIsAiFollowupOpen(false)}
        lead={aiFollowupLead}
        onLogActivity={handleAddActivity}
      />

      {/* Stage Changed WhatsApp Follow-Up Toast Prompt */}
      {statusChangePrompt && (
        <div className="fixed bottom-6 right-6 z-[65] flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-900 text-white dark:bg-slate-850 dark:text-slate-100 shadow-2xl border border-emerald-500/40 animate-fade-in max-w-md">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold leading-tight truncate">
              {statusChangePrompt.lead.name} moved to "{statusChangePrompt.stage}"
            </div>
            <div className="text-[11px] text-slate-400 truncate mt-0.5">
              Send stage-specific WhatsApp follow-up?
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => {
                handleOpenContact(statusChangePrompt.lead, 'whatsapp', statusChangePrompt.stage);
                setStatusChangePrompt(null);
              }}
              className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm flex items-center gap-1 transition-all active:scale-95"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Send WhatsApp</span>
            </button>
            <button
              onClick={() => setStatusChangePrompt(null)}
              className="p-1 text-slate-400 hover:text-white rounded-md"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

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
