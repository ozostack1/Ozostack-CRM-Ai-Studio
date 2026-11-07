import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Plus,
  Search,
  Filter,
  Download,
  LayoutList,
  Kanban,
  CalendarCheck2,
  Phone,
  MessageSquare,
  Mail,
  Video,
  User,
  Building2,
  Calendar,
  Clock,
  Briefcase,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  CheckSquare,
  Square,
  ArrowUpDown,
  Edit2,
  Trash2,
  ChevronRight,
  Send,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { FollowUp, FollowUpType, FollowUpPriority, FollowUpStatus } from '../../types/crm';
import { INITIAL_FOLLOW_UPS } from '../../data/mockData';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { addNotification } from '../../data/notificationService';
import { FollowUpModal } from './FollowUpModal';
import { FollowUpLogModal } from './FollowUpLogModal';

type FollowUpSortOption =
  | 'date-asc'
  | 'date-desc'
  | 'priority-desc'
  | 'contact-asc';

type DateScopeTab = 'all' | 'today' | 'overdue' | 'upcoming' | 'completed';

export const FollowUpsView: React.FC = () => {
  const { theme, setActiveNav } = useTheme();
  const { scopeFilter } = useAuth();
  const isLight = theme === 'white-sky';

  // Follow-ups state
  const [followUps, setFollowUps] = useState<FollowUp[]>(INITIAL_FOLLOW_UPS);
  const visibleFollowUps = useMemo(
    () => scopeFilter(followUps, (f) => ({ owner: f.owner })),
    [followUps, scopeFilter]
  );

  // View Mode: 'list' | 'kanban'
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [dateScope, setDateScope] = useState<DateScopeTab>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedOwner, setSelectedOwner] = useState<string>('all');
  const [sortBy, setSortBy] = useState<FollowUpSortOption>('date-asc');

  // Multi-selection state
  const [selectedFollowUpIds, setSelectedFollowUpIds] = useState<string[]>([]);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [followUpToEdit, setFollowUpToEdit] = useState<FollowUp | null>(null);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [logTargetFollowUp, setLogTargetFollowUp] = useState<FollowUp | null>(null);

  // Drag and drop state for Kanban
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const cardBg = isLight
    ? 'bg-white border-sky-100/90 shadow-xs'
    : 'bg-[#0f172a]/90 border-slate-800/80';

  // Team owners list
  const owners = useMemo(() => {
    const set = new Set<string>();
    visibleFollowUps.forEach((f) => set.add(f.owner));
    return Array.from(set);
  }, [visibleFollowUps]);

  // Executive Metrics
  const metrics = useMemo(() => {
    const total = visibleFollowUps.length;
    const todayStr = '2025-05-20'; // Mock date reference for consistency
    const todayCount = visibleFollowUps.filter(
      (f) => f.scheduledDate === todayStr && f.status !== 'Completed' && f.status !== 'Cancelled'
    ).length;
    const overdueCount = visibleFollowUps.filter((f) => f.status === 'Overdue').length;
    const upcomingCount = visibleFollowUps.filter(
      (f) => f.status === 'Scheduled' && (f.scheduledDate || '') > todayStr
    ).length;
    const completedCount = visibleFollowUps.filter((f) => f.status === 'Completed').length;
    const completedPct = total > 0 ? Math.round((completedCount / total) * 100) : 0;

    return {
      total,
      todayCount,
      overdueCount,
      upcomingCount,
      completedCount,
      completedPct,
    };
  }, [visibleFollowUps]);

  // Filtered & Sorted Follow-ups
  const filteredFollowUps = useMemo(() => {
    const todayStr = '2025-05-20';

    const list = visibleFollowUps.filter((f) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        f.contact.toLowerCase().includes(q) ||
        f.company.toLowerCase().includes(q) ||
        f.owner.toLowerCase().includes(q) ||
        (f.dealName && f.dealName.toLowerCase().includes(q)) ||
        (f.notes && f.notes.toLowerCase().includes(q));

      const matchesType = selectedType === 'all' || f.type === selectedType;
      const matchesStatus = selectedStatus === 'all' || f.status === selectedStatus;
      const matchesPriority = selectedPriority === 'all' || f.priority === selectedPriority;
      const matchesOwner = selectedOwner === 'all' || f.owner === selectedOwner;

      let matchesDateScope = true;
      if (dateScope === 'today') {
        matchesDateScope = f.scheduledDate === todayStr;
      } else if (dateScope === 'overdue') {
        matchesDateScope = f.status === 'Overdue';
      } else if (dateScope === 'upcoming') {
        matchesDateScope = f.status === 'Scheduled' && (f.scheduledDate || '') > todayStr;
      } else if (dateScope === 'completed') {
        matchesDateScope = f.status === 'Completed';
      }

      return (
        matchesSearch &&
        matchesType &&
        matchesStatus &&
        matchesPriority &&
        matchesOwner &&
        matchesDateScope
      );
    });

    return list.sort((a, b) => {
      switch (sortBy) {
        case 'date-asc':
          return (a.scheduledDate || '').localeCompare(b.scheduledDate || '');
        case 'date-desc':
          return (b.scheduledDate || '').localeCompare(a.scheduledDate || '');
        case 'priority-desc': {
          const pOrder: Record<string, number> = { High: 3, Medium: 2, Low: 1 };
          return (pOrder[b.priority || 'Medium'] || 0) - (pOrder[a.priority || 'Medium'] || 0);
        }
        case 'contact-asc':
          return a.contact.localeCompare(b.contact);
        default:
          return 0;
      }
    });
  }, [
    visibleFollowUps,
    searchQuery,
    dateScope,
    selectedType,
    selectedStatus,
    selectedPriority,
    selectedOwner,
    sortBy,
  ]);

  // Bulk Multi-Select Handlers
  const isAllSelected =
    filteredFollowUps.length > 0 &&
    filteredFollowUps.every((f) => selectedFollowUpIds.includes(f.id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedFollowUpIds([]);
    } else {
      setSelectedFollowUpIds(filteredFollowUps.map((f) => f.id));
    }
  };

  const handleToggleSelectOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFollowUpIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBulkComplete = () => {
    setFollowUps((prev) =>
      prev.map((f) =>
        selectedFollowUpIds.includes(f.id)
          ? {
              ...f,
              status: 'Completed',
              completedAt: new Date().toLocaleString(),
              outcome: f.outcome || 'Completed in bulk batch.',
            }
          : f
      )
    );
    showToast(`Marked ${selectedFollowUpIds.length} follow-ups as completed.`);
    setSelectedFollowUpIds([]);
  };

  const handleBulkReschedule = (daysToAdd: number) => {
    setFollowUps((prev) =>
      prev.map((f) => {
        if (!selectedFollowUpIds.includes(f.id)) return f;
        const current = new Date((f.scheduledDate || '2025-05-20') + 'T00:00:00');
        current.setDate(current.getDate() + daysToAdd);
        const newDateStr = current.toISOString().split('T')[0];
        const monthNames = [
          'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
        ];
        const formatted = `${monthNames[current.getMonth()]} ${current.getDate()}, ${current.getFullYear()} ${
          f.scheduledTime || '10:00 AM'
        }`;

        return {
          ...f,
          scheduledDate: newDateStr,
          nextFollowUp: formatted,
          status: 'Scheduled',
        };
      })
    );
    showToast(`Rescheduled ${selectedFollowUpIds.length} follow-ups by +${daysToAdd} day(s).`);
    setSelectedFollowUpIds([]);
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Delete ${selectedFollowUpIds.length} selected follow-up items?`)) {
      setFollowUps((prev) => prev.filter((f) => !selectedFollowUpIds.includes(f.id)));
      showToast(`${selectedFollowUpIds.length} follow-ups deleted.`);
      setSelectedFollowUpIds([]);
    }
  };

  // CRUD Operations
  const handleSaveFollowUp = (saved: FollowUp) => {
    if (followUpToEdit) {
      setFollowUps((prev) => prev.map((f) => (f.id === saved.id ? saved : f)));
      showToast(`Follow-up with "${saved.contact}" updated.`);
    } else {
      setFollowUps((prev) => [saved, ...prev]);
      showToast(`New follow-up with "${saved.contact}" scheduled.`);
    }
    // Proactively register upcoming follow-up notification
    addNotification({
      title: `Upcoming Follow-up: "${saved.contact}"`,
      subtitle: `${saved.scheduledDate} at ${saved.scheduledTime} · ${saved.company} · ${saved.dealName || 'Pipeline'}`,
      type: 'followup',
      read: false,
      targetNav: 'Events & Calendar',
      targetId: saved.id,
      priority: 'high',
      timeAgo: 'Just now',
    });
  };

  const handleDeleteFollowUp = (id: string, contactName: string) => {
    setFollowUps((prev) => prev.filter((f) => f.id !== id));
    showToast(`Follow-up with "${contactName}" removed.`);
  };

  const handleCompleteWithOutcome = (followUpId: string, outcomeNote: string) => {
    setFollowUps((prev) =>
      prev.map((f) =>
        f.id === followUpId
          ? {
              ...f,
              status: 'Completed',
              outcome: outcomeNote,
              completedAt: 'Just now',
            }
          : f
      )
    );
    showToast('Touchpoint logged and marked completed.');
  };

  const handleQuickToggleComplete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const target = followUps.find((f) => f.id === id);
    if (!target) return;

    if (target.status === 'Completed') {
      // Revert to Scheduled
      setFollowUps((prev) =>
        prev.map((f) => (f.id === id ? { ...f, status: 'Scheduled', completedAt: undefined } : f))
      );
      showToast(`Reopened follow-up with "${target.contact}".`);
    } else {
      // Open outcome completion modal for clean logging
      setLogTargetFollowUp(target);
      setIsLogModalOpen(true);
    }
  };

  // CSV Export
  const handleExportCSV = (selectedOnly = false) => {
    const listToExport = selectedOnly
      ? followUps.filter((f) => selectedFollowUpIds.includes(f.id))
      : filteredFollowUps;

    const headers = [
      'Contact',
      'Company',
      'Channel',
      'Scheduled Date/Time',
      'Priority',
      'Status',
      'Owner',
      'Deal Opportunity',
      'Notes',
      'Outcome',
    ];

    const rows = listToExport.map((f) => [
      `"${f.contact}"`,
      `"${f.company}"`,
      `"${f.type}"`,
      `"${f.nextFollowUp}"`,
      `"${f.priority || 'Medium'}"`,
      `"${f.status || 'Scheduled'}"`,
      `"${f.owner}"`,
      `"${f.dealName || ''}"`,
      `"${(f.notes || '').replace(/"/g, '""')}"`,
      `"${(f.outcome || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Follow_Ups_Queue_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Exported ${listToExport.length} follow-up records.`);
  };

  // Helper colors and icons
  const getTypeIcon = (type: FollowUpType) => {
    switch (type) {
      case 'Call':
        return <Phone className="w-3.5 h-3.5 text-sky-500" />;
      case 'WhatsApp':
        return <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />;
      case 'Email':
        return <Mail className="w-3.5 h-3.5 text-indigo-500" />;
      case 'Meeting':
        return <Video className="w-3.5 h-3.5 text-purple-500" />;
    }
  };

  const getPriorityColor = (p?: FollowUpPriority) => {
    switch (p) {
      case 'High':
        return 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900';
      case 'Medium':
        return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900';
      case 'Low':
        return 'bg-slate-500/15 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800';
      default:
        return 'bg-slate-500/15 text-slate-500';
    }
  };

  const getStatusColor = (s?: FollowUpStatus) => {
    switch (s) {
      case 'Overdue':
        return 'bg-rose-500 text-white font-bold animate-pulse';
      case 'Scheduled':
        return 'bg-sky-500/15 text-sky-600 dark:text-sky-300 font-bold';
      case 'Completed':
        return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold';
      case 'Cancelled':
        return 'bg-slate-500/15 text-slate-500 font-bold';
      default:
        return 'bg-sky-500/15 text-sky-600';
    }
  };

  // Kanban status groups
  const KANBAN_COLUMNS: { id: FollowUpStatus; title: string; color: string }[] = [
    { id: 'Overdue', title: 'Overdue Attention', color: 'border-rose-300 dark:border-rose-900' },
    { id: 'Scheduled', title: 'Scheduled Queue', color: 'border-sky-300 dark:border-sky-900' },
    { id: 'Completed', title: 'Logged / Completed', color: 'border-emerald-300 dark:border-emerald-900' },
    { id: 'Cancelled', title: 'Archived / Cancelled', color: 'border-slate-300 dark:border-slate-800' },
  ];

  return (
    <div className="space-y-4">
      {/* 1. EXECUTIVE HEADER BANNER */}
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
            <h1 className="text-base font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
              <span>Follow-Up & Touchpoint Queue</span>
              <span className="text-xs bg-sky-500/15 text-sky-600 dark:text-sky-400 font-bold px-2 py-0.5 rounded-full">
                {followUps.length} Actions
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Today Due: <span className="font-bold text-sky-500">{metrics.todayCount}</span> · Overdue: <span className="font-bold text-rose-500">{metrics.overdueCount}</span> · Completed Rate: <span className="font-bold text-emerald-500">{metrics.completedPct}%</span>
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
            title="Download CSV Queue"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Export CSV</span>
          </button>

          <button
            onClick={() => {
              setFollowUpToEdit(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-sky-500 hover:bg-sky-600 text-white shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Follow-Up</span>
          </button>
        </div>
      </div>

      {/* 2. SENIOR EXECUTIVE KPI RIBBON */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Today Due */}
        <div
          onClick={() => setDateScope(dateScope === 'today' ? 'all' : 'today')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            dateScope === 'today'
              ? 'ring-2 ring-sky-500 border-sky-400 shadow-md'
              : 'hover:border-sky-300'
          } ${cardBg}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Today&apos;s Due
            </span>
            <div className="p-1.5 rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-extrabold text-sky-600 dark:text-sky-400 tabular-nums">
              {metrics.todayCount}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">touchpoints</span>
          </div>
        </div>

        {/* Overdue Attention */}
        <div
          onClick={() => setDateScope(dateScope === 'overdue' ? 'all' : 'overdue')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            dateScope === 'overdue'
              ? 'ring-2 ring-rose-500 border-rose-400 shadow-md'
              : 'hover:border-rose-300'
          } ${cardBg}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Overdue Alert
            </span>
            <div className="p-1.5 rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-extrabold text-rose-600 dark:text-rose-400 tabular-nums">
              {metrics.overdueCount}
            </span>
            <span className="text-[11px] text-rose-500 font-medium">requires action</span>
          </div>
        </div>

        {/* Upcoming Next 7 Days */}
        <div
          onClick={() => setDateScope(dateScope === 'upcoming' ? 'all' : 'upcoming')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            dateScope === 'upcoming'
              ? 'ring-2 ring-indigo-500 border-indigo-400 shadow-md'
              : 'hover:border-indigo-300'
          } ${cardBg}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Upcoming Queue
            </span>
            <div className="p-1.5 rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 tabular-nums">
              {metrics.upcomingCount}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">scheduled ahead</span>
          </div>
        </div>

        {/* Completed Rate */}
        <div
          onClick={() => setDateScope(dateScope === 'completed' ? 'all' : 'completed')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            dateScope === 'completed'
              ? 'ring-2 ring-emerald-500 border-emerald-400 shadow-md'
              : 'hover:border-emerald-300'
          } ${cardBg}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Completion Rate
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-extrabold text-emerald-500 tabular-nums">
              {metrics.completedPct}%
            </span>
            <span className="text-[11px] text-slate-400 font-medium">({metrics.completedCount} logged)</span>
          </div>
        </div>
      </div>

      {/* 3. CONTROL TOOLBAR */}
      <div className={`p-3.5 rounded-xl border flex flex-col lg:flex-row gap-3 items-center justify-between ${cardBg}`}>
        {/* Search */}
        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search contact, company, notes..."
            className={`w-full text-xs pl-9 pr-3 py-2 rounded-lg border outline-none font-medium ${
              isLight
                ? 'bg-sky-50/40 border-sky-200 text-slate-800 focus:border-sky-500'
                : 'bg-slate-900 border-slate-700 text-white focus:border-sky-400'
            }`}
          />
        </div>

        {/* Filters & Controls */}
        <div className="flex items-center gap-2 w-full lg:w-auto flex-wrap justify-end text-xs">
          {/* Quick Date Scope Selector */}
          <div className="flex items-center p-0.5 rounded-lg border border-sky-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
            {(['all', 'today', 'overdue', 'upcoming', 'completed'] as DateScopeTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setDateScope(tab)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md capitalize transition-colors ${
                  dateScope === tab
                    ? 'bg-sky-500 text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Channel / Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className={`text-xs px-2.5 py-1.5 rounded-lg border outline-none font-medium cursor-pointer ${
              isLight ? 'bg-white border-sky-200 text-slate-700' : 'bg-slate-800 border-slate-700 text-slate-200'
            }`}
          >
            <option value="all">All Channels</option>
            <option value="Call">Calls</option>
            <option value="WhatsApp">WhatsApp</option>
            <option value="Email">Emails</option>
            <option value="Meeting">Meetings</option>
          </select>

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className={`text-xs px-2.5 py-1.5 rounded-lg border outline-none font-medium cursor-pointer ${
              isLight ? 'bg-white border-sky-200 text-slate-700' : 'bg-slate-800 border-slate-700 text-slate-200'
            }`}
          >
            <option value="all">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {/* Owner Filter */}
          <select
            value={selectedOwner}
            onChange={(e) => setSelectedOwner(e.target.value)}
            className={`text-xs px-2.5 py-1.5 rounded-lg border outline-none font-medium cursor-pointer ${
              isLight ? 'bg-white border-sky-200 text-slate-700' : 'bg-slate-800 border-slate-700 text-slate-200'
            }`}
          >
            <option value="all">All Owners</option>
            {owners.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 pl-1">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as FollowUpSortOption)}
              className={`text-xs px-2.5 py-1.5 rounded-lg border outline-none font-medium cursor-pointer ${
                isLight ? 'bg-white border-sky-200 text-slate-700' : 'bg-slate-800 border-slate-700 text-slate-200'
              }`}
            >
              <option value="date-asc">Date (Earliest First)</option>
              <option value="date-desc">Date (Latest First)</option>
              <option value="priority-desc">Priority (High to Low)</option>
              <option value="contact-asc">Contact (A-Z)</option>
            </select>
          </div>

          {/* View Toggle */}
          <div className="flex items-center p-0.5 rounded-lg border border-sky-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-sky-500 text-white shadow-2xs'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="List View"
            >
              <LayoutList className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-sky-500 text-white shadow-2xs'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Kanban Status Board"
            >
              <Kanban className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. FLOATING BULK ACTIONS BAR */}
      {selectedFollowUpIds.length > 0 && (
        <div className="p-3 rounded-xl border border-sky-300 bg-sky-50 dark:bg-slate-800/90 dark:border-sky-500/30 text-xs shadow-md animate-fade-in flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sky-700 dark:text-sky-300 px-2 py-0.5 rounded-md bg-sky-500/10">
              {selectedFollowUpIds.length} Touchpoints Selected
            </span>
            <button
              onClick={() => setSelectedFollowUpIds([])}
              className="text-slate-400 hover:text-slate-600 text-xs underline"
            >
              Deselect All
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleBulkComplete}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500 text-white font-bold hover:bg-emerald-600 shadow-xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mark Completed</span>
            </button>

            <button
              onClick={() => handleBulkReschedule(1)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-semibold hover:border-sky-400"
            >
              <span>+1 Day</span>
            </button>

            <button
              onClick={() => handleBulkReschedule(3)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-semibold hover:border-sky-400"
            >
              <span>+3 Days</span>
            </button>

            <button
              onClick={() => handleExportCSV(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-500 text-white font-bold hover:bg-sky-600 shadow-xs"
            >
              <Download className="w-3 h-3" />
              <span>Export</span>
            </button>

            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-500 text-white font-bold hover:bg-rose-600 shadow-xs"
            >
              <Trash2 className="w-3 h-3" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      )}

      {/* 5. VIEW 1: LIST / TIMELINE VIEW */}
      {viewMode === 'list' && (
        <div className={`rounded-xl border overflow-hidden ${cardBg}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-sky-100/40 bg-sky-50/30 dark:bg-slate-800/50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-3 w-10">
                    <button
                      onClick={handleToggleSelectAll}
                      className="text-slate-400 hover:text-sky-500 transition-colors"
                    >
                      {isAllSelected ? (
                        <CheckSquare className="w-4 h-4 text-sky-500" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-3">Contact & Company</th>
                  <th className="py-3 px-3">Channel</th>
                  <th className="py-3 px-3">Scheduled Time</th>
                  <th className="py-3 px-3">Priority</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Assigned Owner</th>
                  <th className="py-3 px-3">Agenda / Outcome Notes</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-100/20 dark:divide-slate-800">
                {filteredFollowUps.map((item) => {
                  const isSelected = selectedFollowUpIds.includes(item.id);
                  const isCompleted = item.status === 'Completed';

                  return (
                    <tr
                      key={item.id}
                      onClick={() => {
                        setFollowUpToEdit(item);
                        setIsModalOpen(true);
                      }}
                      className={`hover:bg-sky-50/40 dark:hover:bg-slate-800/40 transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-sky-50/50 dark:bg-sky-950/20'
                          : isCompleted
                          ? 'opacity-75'
                          : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleToggleSelectOne(item.id, e)}
                          className="text-slate-400 hover:text-sky-500 transition-colors"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-sky-500" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                          )}
                        </button>
                      </td>

                      {/* Contact & Company */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-300 font-bold flex items-center justify-center text-xs shrink-0">
                            {item.contact.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span
                              className={`font-bold transition-colors block ${
                                isCompleted
                                  ? 'line-through text-slate-500 dark:text-slate-400'
                                  : 'text-slate-800 dark:text-white hover:text-sky-500'
                              }`}
                            >
                              {item.contact}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {item.company}
                              {item.dealName ? ` · ${item.dealName}` : ''}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Channel Badge */}
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {getTypeIcon(item.type)}
                          <span>{item.type}</span>
                        </span>
                      </td>

                      {/* Scheduled Time */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 text-xs tabular-nums font-semibold">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span
                            className={
                              item.status === 'Overdue'
                                ? 'text-rose-500 font-bold'
                                : 'text-slate-700 dark:text-slate-200'
                            }
                          >
                            {item.nextFollowUp}
                          </span>
                        </div>
                      </td>

                      {/* Priority */}
                      <td className="py-3 px-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getPriorityColor(
                            item.priority
                          )}`}
                        >
                          {item.priority || 'Medium'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full ${getStatusColor(
                            item.status
                          )}`}
                        >
                          {item.status || 'Scheduled'}
                        </span>
                      </td>

                      {/* Owner */}
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300 font-medium">
                        {item.owner}
                      </td>

                      {/* Notes / Outcome preview */}
                      <td className="py-3 px-3 max-w-xs">
                        {item.outcome ? (
                          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 line-clamp-1 italic">
                            ✓ {item.outcome}
                          </p>
                        ) : item.notes ? (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                            {item.notes}
                          </p>
                        ) : (
                          <span className="text-slate-400 text-[10px]">—</span>
                        )}
                      </td>

                      {/* Direct Actions */}
                      <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          {/* Complete button */}
                          <button
                            onClick={(e) => handleQuickToggleComplete(item.id, e)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isCompleted
                                ? 'bg-emerald-500 text-white'
                                : 'text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-slate-800'
                            }`}
                            title={isCompleted ? 'Marked Completed (Click to reopen)' : 'Mark Touchpoint as Completed'}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>

                          {/* 1-click Contact channels */}
                          {item.contactPhone && (
                            <a
                              href={`tel:${item.contactPhone}`}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-slate-800"
                              title={`Call ${item.contact}`}
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {item.contactEmail && (
                            <a
                              href={`mailto:${item.contactEmail}`}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-slate-800"
                              title={`Email ${item.contact}`}
                            >
                              <Mail className="w-3.5 h-3.5" />
                            </a>
                          )}

                          {/* Edit & Delete */}
                          <button
                            onClick={() => {
                              setFollowUpToEdit(item);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-slate-800"
                            title="Edit Follow-Up"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete follow-up with "${item.contact}"?`)) {
                                handleDeleteFollowUp(item.id, item.contact);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800"
                            title="Delete Follow-Up"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredFollowUps.length === 0 && (
            <div className="text-center py-12">
              <CalendarCheck2 className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-60" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
                No matching follow-ups found
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Try adjusting your search filters or schedule a new touchpoint.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setDateScope('all');
                  setSelectedType('all');
                  setSelectedStatus('all');
                  setSelectedPriority('all');
                  setSelectedOwner('all');
                }}
                className="mt-3 px-3 py-1.5 text-xs font-semibold text-sky-600 bg-sky-50 dark:bg-slate-800 rounded-lg hover:underline"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* 6. VIEW 2: KANBAN STATUS BOARD */}
      {viewMode === 'kanban' && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-3.5 items-start min-w-max">
            {KANBAN_COLUMNS.map((col) => {
              const colItems = filteredFollowUps.filter((f) => (f.status || 'Scheduled') === col.id);

              return (
                <div
                  key={col.id}
                  className={`w-[290px] min-w-[290px] max-w-[290px] p-3 rounded-xl border flex flex-col min-h-[560px] shrink-0 transition-all ${
                    col.color
                  } ${isLight ? 'bg-slate-50/70' : 'bg-[#0f172a]/70'}`}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-sky-100/30">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-extrabold text-xs uppercase tracking-tight text-slate-800 dark:text-slate-100 truncate">
                        {col.title}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-300 shrink-0">
                        {colItems.length}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setFollowUpToEdit(null);
                        setIsModalOpen(true);
                      }}
                      className="p-1 text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-slate-800 rounded transition-colors"
                      title={`Schedule follow-up in ${col.title}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Cards Container */}
                  <div className="space-y-3 flex-1 overflow-y-auto pr-0.5">
                    {colItems.map((item) => {
                      const isSelected = selectedFollowUpIds.includes(item.id);
                      const isCompleted = item.status === 'Completed';

                      return (
                        <div
                          key={item.id}
                          onClick={() => {
                            setFollowUpToEdit(item);
                            setIsModalOpen(true);
                          }}
                          className={`p-3.5 rounded-xl border transition-all duration-200 hover:shadow-md cursor-pointer group flex flex-col justify-between ${
                            isSelected
                              ? 'border-sky-400 bg-sky-50/50 dark:bg-sky-950/30 ring-1 ring-sky-400'
                              : cardBg
                          }`}
                        >
                          <div>
                            {/* Card Top: Checkbox, Channel, Priority */}
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={(e) => handleToggleSelectOne(item.id, e)}
                                  className="text-slate-400 hover:text-sky-500"
                                >
                                  {isSelected ? (
                                    <CheckSquare className="w-3.5 h-3.5 text-sky-500" />
                                  ) : (
                                    <Square className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
                                  )}
                                </button>
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                  {getTypeIcon(item.type)}
                                  <span>{item.type}</span>
                                </span>
                              </div>

                              <span
                                className={`text-[9px] font-bold px-2 py-0.5 rounded border ${getPriorityColor(
                                  item.priority
                                )}`}
                              >
                                {item.priority || 'Medium'}
                              </span>
                            </div>

                            {/* Contact & Company */}
                            <div>
                              <h4
                                className={`text-xs font-bold leading-snug group-hover:text-sky-500 transition-colors ${
                                  isCompleted
                                    ? 'line-through text-slate-400'
                                    : 'text-slate-800 dark:text-white'
                                }`}
                              >
                                {item.contact}
                              </h4>
                              <p className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 mt-0.5">
                                {item.company}
                              </p>
                              {item.dealName && (
                                <p className="text-[10px] text-slate-400 mt-0.5 truncate flex items-center gap-1">
                                  <Briefcase className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span>{item.dealName}</span>
                                </p>
                              )}
                            </div>

                            {/* Scheduled Time Banner */}
                            <div className="mt-2.5 pt-2 border-t border-sky-100/20 flex items-center justify-between text-[11px]">
                              <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-medium">
                                <Clock className="w-3 h-3 text-sky-500" />
                                <span
                                  className={
                                    item.status === 'Overdue' ? 'text-rose-500 font-bold' : ''
                                  }
                                >
                                  {item.nextFollowUp}
                                </span>
                              </span>
                            </div>

                            {/* Notes / Outcome */}
                            {item.outcome ? (
                              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 italic mt-2 line-clamp-2 bg-emerald-50/50 dark:bg-emerald-950/20 p-1.5 rounded">
                                ✓ {item.outcome}
                              </p>
                            ) : item.notes ? (
                              <p className="text-[10px] text-slate-400 mt-2 line-clamp-2">
                                {item.notes}
                              </p>
                            ) : null}
                          </div>

                          {/* Footer Actions */}
                          <div className="mt-3 pt-2 border-t border-sky-100/20 flex items-center justify-between text-[11px]">
                            <span className="text-[10px] text-slate-400 font-medium truncate">
                              👤 {item.owner.split(' ')[0]}
                            </span>

                            <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={(e) => handleQuickToggleComplete(item.id, e)}
                                className={`p-1 rounded transition-colors ${
                                  isCompleted
                                    ? 'bg-emerald-500 text-white'
                                    : 'text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-slate-800'
                                }`}
                                title={isCompleted ? 'Completed' : 'Mark Completed'}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setFollowUpToEdit(item);
                                  setIsModalOpen(true);
                                }}
                                className="p-1 rounded text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-slate-800"
                                title="Edit"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Delete follow-up with "${item.contact}"?`)) {
                                    handleDeleteFollowUp(item.id, item.contact);
                                  }
                                }}
                                className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {colItems.length === 0 && (
                      <div className="text-center py-10 text-slate-400 text-xs italic">
                        No touchpoints in this column
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 7. MODALS */}
      {/* Create / Edit FollowUp Modal */}
      <FollowUpModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveFollowUp}
        followUpToEdit={followUpToEdit}
      />

      {/* Outcome Completion Modal */}
      <FollowUpLogModal
        isOpen={isLogModalOpen}
        onClose={() => {
          setIsLogModalOpen(false);
          setLogTargetFollowUp(null);
        }}
        followUp={logTargetFollowUp}
        onComplete={handleCompleteWithOutcome}
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

