import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ArrowLeft,
  Plus,
  Search,
  Filter,
  Download,
  Clock,
  Play,
  Square,
  Pause,
  RotateCcw,
  Calendar,
  User,
  Users,
  Building2,
  FolderKanban,
  CheckSquare,
  DollarSign,
  Tag,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Edit2,
  Trash2,
  Check,
  X,
  Layers,
  ChevronDown,
  LayoutList,
  Grid3X3,
  BarChart3,
  Sparkles,
  TrendingUp,
  Percent,
} from 'lucide-react';
import { TimeEntry, TimeEntryApprovalStatus, TaskItem, Project } from '../../types/crm';
import { INITIAL_TIME_ENTRIES, INITIAL_PROJECTS, INITIAL_TASKS } from '../../data/mockData';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useSystemCurrency } from '../../data/currencyService';
import { TimeEntryModal } from './TimeEntryModal';

type TimeTrackingViewMode = 'logs' | 'weekly_matrix' | 'project_burn';

const DEFAULT_MEMBERS = [
  { name: 'Amit Kumar', avatar: 'AK', rate: 140 },
  { name: 'Neha Sharma', avatar: 'NS', rate: 160 },
  { name: 'Rizwan Khan', avatar: 'RK', rate: 125 },
  { name: 'Priya Singh', avatar: 'PS', rate: 115 },
  { name: 'Vikram Joshi', avatar: 'VJ', rate: 130 },
  { name: 'Sayed (CEO)', avatar: 'SC', rate: 200 },
];

export const TimeTrackingView: React.FC = () => {
  const { theme, setActiveNav } = useTheme();
  const { scopeFilter, currentUser } = useAuth();
  const currency = useSystemCurrency();
  const isLight = theme === 'white-sky';

  // Timesheet Entries State
  const [entries, setEntries] = useState<TimeEntry[]>(() => {
    try {
      const saved = localStorage.getItem('ozostack_time_entries_v1');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      /* fallback */
    }
    return INITIAL_TIME_ENTRIES;
  });

  useEffect(() => {
    try {
      localStorage.setItem('ozostack_time_entries_v1', JSON.stringify(entries));
    } catch {
      /* ignore */
    }
  }, [entries]);

  useEffect(() => {
    const syncEntries = () => {
      try {
        const saved = localStorage.getItem('ozostack_time_entries_v1');
        if (saved !== null) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) setEntries(parsed);
        }
      } catch {
        /* ignore */
      }
    };
    window.addEventListener('ozostack-crm-config-changed', syncEntries);
    return () => window.removeEventListener('ozostack-crm-config-changed', syncEntries);
  }, []);
  const visibleEntries = useMemo(
    () => scopeFilter(entries, (e) => ({ owner: e.userName })),
    [entries, scopeFilter]
  );

  // View Mode: 'logs' | 'weekly_matrix' | 'project_burn'
  const [viewMode, setViewMode] = useState<TimeTrackingViewMode>('logs');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [periodFilter, setPeriodFilter] = useState<'all' | 'today' | 'this_week'>('all');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedMember, setSelectedMember] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [billableOnly, setBillableOnly] = useState<boolean>(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [entryToEdit, setEntryToEdit] = useState<TimeEntry | null>(null);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // ----------------------------------------------------
  // LIVE RUNNING STOPWATCH TRACKER
  // ----------------------------------------------------
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerDescription, setTimerDescription] = useState('');
  const [timerProject, setTimerProject] = useState(INITIAL_PROJECTS[0]?.name || 'PCI-DSS Banking API Gateway');
  const [timerTask, setTimerTask] = useState(INITIAL_TASKS[0]?.title || 'OAuth2 Multi-Factor Authentication Flow');
  const [timerMember, setTimerMember] = useState('Sayed (CEO)');
  const [timerIsBillable, setTimerIsBillable] = useState(true);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning]);

  const formatTimerDigits = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleStartTimer = () => {
    setIsTimerRunning(true);
    showToast('Live timer started.');
  };

  const handlePauseTimer = () => {
    setIsTimerRunning(false);
    showToast('Timer paused.');
  };

  const handleStopAndLogTimer = () => {
    setIsTimerRunning(false);

    // Calculate duration in hours (minimum 0.25 hrs if logged)
    const hours = Math.max(0.25, Math.round((timerSeconds / 3600) * 100) / 100);

    const memberObj = DEFAULT_MEMBERS.find((m) => m.name === timerMember);
    const rate = memberObj?.rate || 140;
    const billableAmount = timerIsBillable ? Math.round(hours * rate * 100) / 100 : 0;

    const matchedProj = INITIAL_PROJECTS.find((p) => p.name === timerProject);
    const clientName = matchedProj?.client || 'Enterprise Client';

    const finalTaskTitle = timerTask.trim() || timerDescription.trim() || 'Technical Architecture & Execution';
    const finalDescription = timerDescription.trim() || timerTask.trim() || 'Live tracked engineering session.';

    const newLoggedEntry: TimeEntry = {
      id: `time-${Date.now()}`,
      taskTitle: finalTaskTitle,
      projectName: timerProject,
      client: clientName,
      userName: timerMember,
      userAvatar: memberObj?.avatar || 'SC',
      date: '2025-05-20',
      startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      durationHours: hours,
      description: finalDescription,
      isBillable: timerIsBillable,
      hourlyRate: rate,
      billableAmount,
      status: 'Approved',
      tags: ['LiveTimer'],
      createdAt: new Date().toISOString(),
    };

    setEntries((prev) => [newLoggedEntry, ...prev]);
    setTimerSeconds(0);
    setTimerDescription('');
    showToast(`Logged ${hours}h for "${timerProject}". Realized value: ${currency.symbol}${billableAmount.toLocaleString()}`);
  };

  // ----------------------------------------------------
  // FILTERED ENTRIES & CALCULATIONS
  // ----------------------------------------------------
  const filteredEntries = useMemo(() => {
    const todayStr = '2025-05-20';
    const weekStart = '2025-05-18';
    const weekEnd = '2025-05-24';

    return visibleEntries.filter((item) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        item.taskTitle.toLowerCase().includes(q) ||
        item.projectName.toLowerCase().includes(q) ||
        (item.client && item.client.toLowerCase().includes(q)) ||
        item.userName.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        (item.tags && item.tags.some((t) => t.toLowerCase().includes(q)));

      let matchesPeriod = true;
      if (periodFilter === 'today') matchesPeriod = item.date === todayStr;
      else if (periodFilter === 'this_week') matchesPeriod = item.date >= weekStart && item.date <= weekEnd;

      const matchesProject = selectedProject === 'all' || item.projectName === selectedProject;
      const matchesMember = selectedMember === 'all' || item.userName === selectedMember;
      const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
      const matchesBillable = !billableOnly || item.isBillable;

      return (
        matchesSearch &&
        matchesPeriod &&
        matchesProject &&
        matchesMember &&
        matchesStatus &&
        matchesBillable
      );
    });
  }, [visibleEntries, searchQuery, periodFilter, selectedProject, selectedMember, selectedStatus, billableOnly]);

  // Executive Metrics
  const metrics = useMemo(() => {
    const totalHours = filteredEntries.reduce((acc, curr) => acc + curr.durationHours, 0);
    const billableEntries = filteredEntries.filter((e) => e.isBillable);
    const billableHours = billableEntries.reduce((acc, curr) => acc + curr.durationHours, 0);
    const billableAmount = filteredEntries.reduce((acc, curr) => acc + curr.billableAmount, 0);
    const pendingCount = filteredEntries.filter((e) => e.status === 'Pending').length;
    const utilizationRate = totalHours > 0 ? Math.round((billableHours / totalHours) * 100) : 0;

    return {
      totalHours: Math.round(totalHours * 100) / 100,
      billableHours: Math.round(billableHours * 100) / 100,
      billableAmount: Math.round(billableAmount * 100) / 100,
      pendingCount,
      utilizationRate,
    };
  }, [filteredEntries]);

  // Distinct Projects & Members for Filter Dropdowns
  const projectsList = useMemo(() => {
    const set = new Set<string>();
    visibleEntries.forEach((e) => set.add(e.projectName));
    return Array.from(set);
  }, [visibleEntries]);

  const membersList = useMemo(() => {
    const set = new Set<string>();
    visibleEntries.forEach((e) => set.add(e.userName));
    return Array.from(set);
  }, [visibleEntries]);

  // Group entries by Date for Detailed Logs View
  const entriesByDate = useMemo(() => {
    const map = new Map<string, TimeEntry[]>();
    const sorted = [...filteredEntries].sort((a, b) => b.date.localeCompare(a.date));
    sorted.forEach((e) => {
      const list = map.get(e.date) || [];
      map.set(e.date, [...list, e]);
    });
    return Array.from(map.entries());
  }, [filteredEntries]);

  // ----------------------------------------------------
  // CRUD & BULK ACTIONS
  // ----------------------------------------------------
  const handleSaveEntry = (saved: TimeEntry) => {
    if (entryToEdit) {
      setEntries((prev) => prev.map((e) => (e.id === saved.id ? saved : e)));
      showToast(`Updated log for "${saved.taskTitle}".`);
    } else {
      setEntries((prev) => [saved, ...prev]);
      showToast(`Logged ${saved.durationHours}h for "${saved.projectName}".`);
    }
  };

  const handleDeleteEntry = (id: string, taskTitle: string) => {
    setEntries((prev) => {
      const next = prev.filter((e) => e.id !== id);
      try {
        localStorage.setItem('ozostack_time_entries_v1', JSON.stringify(next));
      } catch {}
      return next;
    });
    showToast(`Deleted time entry for "${taskTitle}".`);
  };

  const handleToggleApproval = (id: string, currentStatus: TimeEntryApprovalStatus) => {
    const nextStatus: TimeEntryApprovalStatus = currentStatus === 'Approved' ? 'Pending' : 'Approved';
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: nextStatus } : e))
    );
    showToast(`Marked entry as ${nextStatus}.`);
  };

  const handleToggleBillable = (id: string) => {
    setEntries((prev) =>
      prev.map((e) => {
        if (e.id === id) {
          const nextBillable = !e.isBillable;
          return {
            ...e,
            isBillable: nextBillable,
            billableAmount: nextBillable ? Math.round(e.durationHours * e.hourlyRate * 100) / 100 : 0,
          };
        }
        return e;
      })
    );
    showToast('Updated billable status.');
  };

  const handleApproveAllPending = () => {
    const count = filteredEntries.filter((e) => e.status === 'Pending').length;
    if (count === 0) return;
    setEntries((prev) =>
      prev.map((e) => (e.status === 'Pending' ? { ...e, status: 'Approved' } : e))
    );
    showToast(`Approved ${count} pending time logs.`);
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      'Date',
      'Team Member',
      'Project',
      'Client',
      'Task / Deliverable',
      'Description',
      'Timeslot',
      'Hours',
      `Hourly Rate (${currency.symbol})`,
      'Billable?',
      `Billable Amount (${currency.symbol})`,
      'Approval Status',
      'Tags',
    ];

    const rows = filteredEntries.map((e) => [
      `"${e.date}"`,
      `"${e.userName}"`,
      `"${e.projectName.replace(/"/g, '""')}"`,
      `"${(e.client || '').replace(/"/g, '""')}"`,
      `"${e.taskTitle.replace(/"/g, '""')}"`,
      `"${e.description.replace(/"/g, '""')}"`,
      `"${e.startTime || ''} - ${e.endTime || ''}"`,
      `"${e.durationHours}"`,
      `"${e.hourlyRate}"`,
      `"${e.isBillable ? 'Yes' : 'No'}"`,
      `"${e.billableAmount}"`,
      `"${e.status}"`,
      `"${(e.tags || []).join('; ')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Timesheet_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Exported ${filteredEntries.length} time records to CSV.`);
  };

  const cardBg = isLight
    ? 'bg-white border-sky-100/90 shadow-xs'
    : 'bg-[#0f172a]/90 border-slate-800/80';

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
              <span>Time Tracking & Utilization</span>
              <span className="text-xs bg-sky-500/15 text-sky-600 dark:text-sky-400 font-bold px-2 py-0.5 rounded-full">
                {metrics.totalHours} hrs logged
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Billable Utilization: <span className="font-bold text-emerald-500">{metrics.utilizationRate}%</span> · Value: <span className="font-bold text-sky-600 dark:text-sky-400">{currency.symbol}{metrics.billableAmount.toLocaleString()}</span> · Pending Approval: <span className="font-bold text-amber-500">{metrics.pendingCount} logs</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
          {/* Approve All Pending */}
          {metrics.pendingCount > 0 && (
            <button
              onClick={handleApproveAllPending}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 transition-colors shadow-xs"
              title="Bulk approve all pending review items"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Approve All ({metrics.pendingCount})</span>
            </button>
          )}

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${
              isLight
                ? 'bg-white border-sky-200 text-slate-700 hover:bg-sky-50'
                : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
            }`}
            title="Download CSV Timesheet Export"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Export Timesheet</span>
          </button>

          {/* Log Time Manually */}
          <button
            onClick={() => {
              setEntryToEdit(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-sky-500 hover:bg-sky-600 text-white shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Log Time</span>
          </button>
        </div>
      </div>

      {/* 2. REAL-TIME STOPWATCH TRACKER BAR */}
      <div className={`p-3.5 sm:p-4 rounded-xl border transition-all ${
        isTimerRunning
          ? 'border-sky-400 ring-2 ring-sky-300 dark:ring-sky-700/60 ' + cardBg
          : cardBg
      }`}>
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Left Inputs */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
            {/* Task Description / Work Notes */}
            <div className="sm:col-span-4 relative">
              <input
                type="text"
                value={timerDescription}
                onChange={(e) => setTimerDescription(e.target.value)}
                placeholder={isTimerRunning ? 'Session active: What are you executing?' : 'What are you working on right now?'}
                className={`w-full text-xs px-3 py-2 rounded-lg border outline-none font-medium ${
                  isLight
                    ? 'bg-sky-50/30 border-sky-200 text-slate-800 focus:border-sky-500'
                    : 'bg-slate-900 border-slate-700 text-white focus:border-sky-400'
                }`}
              />
            </div>

            {/* Project Select */}
            <div className="sm:col-span-3">
              <select
                value={timerProject}
                onChange={(e) => {
                  setTimerProject(e.target.value);
                  const matching = INITIAL_TASKS.filter((t) => t.project.toLowerCase() === e.target.value.toLowerCase());
                  if (matching.length > 0) setTimerTask(matching[0].title);
                }}
                className={`w-full text-xs px-2.5 py-2 rounded-lg border outline-none font-medium cursor-pointer truncate ${
                  isLight ? 'bg-white border-sky-200 text-slate-700' : 'bg-slate-800 border-slate-700 text-slate-200'
                }`}
              >
                {INITIAL_PROJECTS.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Task Deliverable Select */}
            <div className="sm:col-span-3">
              <select
                value={timerTask}
                onChange={(e) => setTimerTask(e.target.value)}
                className={`w-full text-xs px-2.5 py-2 rounded-lg border outline-none font-medium cursor-pointer truncate ${
                  isLight ? 'bg-white border-sky-200 text-slate-700' : 'bg-slate-800 border-slate-700 text-slate-200'
                }`}
              >
                {INITIAL_TASKS.filter((t) => t.project.toLowerCase() === timerProject.toLowerCase()).map((t) => (
                  <option key={t.id} value={t.title}>
                    {t.title}
                  </option>
                ))}
                <option value="Technical Architecture & Code Review">Technical Architecture & Code Review</option>
                <option value="Sprint Planning & Coordination">Sprint Planning & Coordination</option>
              </select>
            </div>

            {/* Contributor Member */}
            <div className="sm:col-span-2">
              <select
                value={timerMember}
                onChange={(e) => setTimerMember(e.target.value)}
                className={`w-full text-xs px-2.5 py-2 rounded-lg border outline-none font-medium cursor-pointer truncate ${
                  isLight ? 'bg-white border-sky-200 text-slate-700' : 'bg-slate-800 border-slate-700 text-slate-200'
                }`}
              >
                {DEFAULT_MEMBERS.map((m) => (
                  <option key={m.name} value={m.name}>
                    {m.name.split(' ')[0]} ({currency.symbol}{m.rate}/h)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Right Timer Display & Controls */}
          <div className="flex items-center justify-between lg:justify-end gap-3 pt-2 lg:pt-0 border-t lg:border-t-0 border-sky-100/50">
            {/* Billable toggle */}
            <button
              type="button"
              onClick={() => setTimerIsBillable(!timerIsBillable)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                timerIsBillable
                  ? 'bg-emerald-500/15 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
              }`}
              title="Toggle Billable Status"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{timerIsBillable ? 'Billable' : 'Non-Billable'}</span>
            </button>

            {/* Digital Display */}
            <div className={`font-mono text-xl sm:text-2xl font-extrabold tracking-wider px-3 py-1 rounded-xl tabular-nums ${
              isTimerRunning
                ? 'text-sky-600 dark:text-sky-400 bg-sky-500/10'
                : 'text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800'
            }`}>
              {formatTimerDigits(timerSeconds)}
            </div>

            {/* Action Buttons */}
            {!isTimerRunning ? (
              <button
                onClick={handleStartTimer}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs shadow-md transition-all active:scale-95"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Start</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handlePauseTimer}
                  className="p-2 rounded-xl border border-amber-300 bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25 transition-all"
                  title="Pause Timer"
                >
                  <Pause className="w-4 h-4 fill-current" />
                </button>
                <button
                  onClick={handleStopAndLogTimer}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all active:scale-95"
                  title="Stop & Log into Timesheet"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Log Time</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. EXECUTIVE KPI RIBBON */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Total Hours */}
        <div
          onClick={() => setPeriodFilter(periodFilter === 'all' ? 'this_week' : periodFilter === 'this_week' ? 'today' : 'all')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer hover:border-sky-300 ${cardBg}`}
          title="Click to cycle filter (All -> This Week -> Today)"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Logged
            </span>
            <div className="p-1.5 rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-extrabold text-sky-600 dark:text-sky-400 tabular-nums">
              {metrics.totalHours}h
            </span>
            <span className="text-[11px] text-slate-400 font-medium capitalize">{periodFilter.replace('_', ' ')}</span>
          </div>
        </div>

        {/* Billable Utilization */}
        <div
          onClick={() => setBillableOnly(!billableOnly)}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer hover:border-emerald-300 ${
            billableOnly ? 'ring-2 ring-emerald-500 border-emerald-400' : ''
          } ${cardBg}`}
          title="Click to toggle Billable Only"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Billable Utilization
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {metrics.utilizationRate}%
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              {metrics.billableHours}h billable
            </span>
          </div>
        </div>

        {/* Realized Revenue */}
        <div className={`p-3.5 rounded-xl border ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Realized Value
            </span>
            <div className="p-1.5 rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 tabular-nums">
              {currency.symbol}{metrics.billableAmount.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">billable revenue</span>
          </div>
        </div>

        {/* Pending Approvals */}
        <div
          onClick={() => setSelectedStatus(selectedStatus === 'Pending' ? 'all' : 'Pending')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            selectedStatus === 'Pending'
              ? 'ring-2 ring-amber-500 border-amber-400 shadow-md'
              : 'hover:border-amber-300'
          } ${cardBg}`}
          title="Click to filter Pending Review logs"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Pending Review
            </span>
            <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-extrabold text-amber-600 dark:text-amber-400 tabular-nums">
              {metrics.pendingCount}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">timesheet logs</span>
          </div>
        </div>

        {/* Active Timer Status */}
        <div className={`p-3.5 rounded-xl border ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Active Session
            </span>
            <div className={`p-1.5 rounded-lg ${isTimerRunning ? 'bg-sky-500 text-white animate-pulse' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}>
              <Play className="w-4 h-4 fill-current" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-xl font-extrabold tabular-nums ${isTimerRunning ? 'text-sky-500' : 'text-slate-400'}`}>
              {isTimerRunning ? 'Running' : 'Idle'}
            </span>
            <span className="text-[11px] text-slate-400 font-medium truncate max-w-[90px]">
              {isTimerRunning ? timerMember.split(' ')[0] : 'Ready'}
            </span>
          </div>
        </div>
      </div>

      {/* 4. FILTERS & VIEW MODE TOOLBAR */}
      <div className={`p-3.5 rounded-xl border flex flex-col lg:flex-row gap-3 items-center justify-between ${cardBg}`}>
        {/* Period Selector & Quick Toggles */}
        <div className="flex items-center gap-2 w-full lg:w-auto flex-wrap">
          {/* Period Filter */}
          <div className="flex items-center p-0.5 rounded-lg border border-sky-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-semibold">
            <button
              onClick={() => setPeriodFilter('all')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                periodFilter === 'all'
                  ? 'bg-sky-500 text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              All Time ({entries.length})
            </button>
            <button
              onClick={() => setPeriodFilter('this_week')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                periodFilter === 'this_week'
                  ? 'bg-sky-500 text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setPeriodFilter('today')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                periodFilter === 'today'
                  ? 'bg-sky-500 text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              Today
            </button>
          </div>

          {/* Billable Only Pill */}
          <button
            onClick={() => setBillableOnly(!billableOnly)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1 ${
              billableOnly
                ? 'bg-emerald-500 text-white border-emerald-400 shadow-2xs'
                : isLight
                ? 'bg-white border-sky-200 text-slate-600 hover:bg-sky-50'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Billable Only</span>
          </button>
        </div>

        {/* Search, Dropdowns & View Mode */}
        <div className="flex items-center gap-2 w-full lg:w-auto flex-wrap justify-end text-xs">
          {/* Search Input */}
          <div className="relative w-full sm:w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search task, project, person..."
              className={`w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border outline-none font-medium ${
                isLight
                  ? 'bg-sky-50/40 border-sky-200 text-slate-800 focus:border-sky-500'
                  : 'bg-slate-900 border-slate-700 text-white focus:border-sky-400'
              }`}
            />
          </div>

          {/* Project Dropdown */}
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className={`text-xs px-2.5 py-1.5 rounded-lg border outline-none font-medium cursor-pointer max-w-[150px] truncate ${
              isLight ? 'bg-white border-sky-200 text-slate-700' : 'bg-slate-800 border-slate-700 text-slate-200'
            }`}
          >
            <option value="all">All Projects</option>
            {projectsList.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          {/* Member Dropdown */}
          <select
            value={selectedMember}
            onChange={(e) => setSelectedMember(e.target.value)}
            className={`text-xs px-2.5 py-1.5 rounded-lg border outline-none font-medium cursor-pointer ${
              isLight ? 'bg-white border-sky-200 text-slate-700' : 'bg-slate-800 border-slate-700 text-slate-200'
            }`}
          >
            <option value="all">All Members</option>
            {membersList.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          {/* Status Dropdown */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className={`text-xs px-2.5 py-1.5 rounded-lg border outline-none font-medium cursor-pointer ${
              isLight ? 'bg-white border-sky-200 text-slate-700' : 'bg-slate-800 border-slate-700 text-slate-200'
            }`}
          >
            <option value="all">All Statuses</option>
            <option value="Approved">Approved</option>
            <option value="Pending">Pending Review</option>
            <option value="Rejected">Rejected</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center p-0.5 rounded-lg border border-sky-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
            <button
              onClick={() => setViewMode('logs')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'logs'
                  ? 'bg-sky-500 text-white shadow-2xs'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Daily Timesheet Logs"
            >
              <LayoutList className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('weekly_matrix')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'weekly_matrix'
                  ? 'bg-sky-500 text-white shadow-2xs'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Weekly Timesheet Matrix"
            >
              <Grid3X3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('project_burn')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'project_burn'
                  ? 'bg-sky-500 text-white shadow-2xs'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Project Budget & Burn Analytics"
            >
              <BarChart3 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 5. VIEW 1: DAILY DETAILED TIMESHEET LOGS */}
      {viewMode === 'logs' && (
        <div className="space-y-4">
          {entriesByDate.map(([dateStr, dateEntries]) => {
            const isToday = dateStr === '2025-05-20';
            const dayHours = dateEntries.reduce((acc, c) => acc + c.durationHours, 0);
            const dayBillableValue = dateEntries.reduce((acc, c) => acc + c.billableAmount, 0);

            return (
              <div key={dateStr} className={`rounded-xl border overflow-hidden ${cardBg}`}>
                {/* Date Header */}
                <div className={`px-4 py-2.5 border-b flex items-center justify-between ${
                  isToday
                    ? 'bg-sky-50/70 border-sky-200 dark:bg-sky-950/30 dark:border-sky-800'
                    : 'bg-slate-50/60 border-slate-200/80 dark:bg-slate-800/40 dark:border-slate-700'
                }`}>
                  <div className="flex items-center gap-2">
                    <Calendar className={`w-4 h-4 ${isToday ? 'text-sky-500' : 'text-slate-400'}`} />
                    <span className={`text-xs font-extrabold ${isToday ? 'text-sky-600 dark:text-sky-400' : 'text-slate-800 dark:text-slate-200'}`}>
                      {dateStr}
                    </span>
                    {isToday && (
                      <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-sky-500 text-white">
                        Today
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs font-bold">
                    <span className="text-slate-500 dark:text-slate-400">
                      Total: <span className="text-slate-800 dark:text-white">{Math.round(dayHours * 100) / 100}h</span>
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400">
                      {currency.symbol}{Math.round(dayBillableValue).toLocaleString()} Billable
                    </span>
                  </div>
                </div>

                {/* Entry Rows */}
                <div className="divide-y divide-sky-100/30 dark:divide-slate-800">
                  {dateEntries.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 sm:p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 hover:bg-sky-50/20 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Left: Member & Task Info */}
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div
                          className="w-9 h-9 rounded-full bg-sky-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs mt-0.5"
                          title={item.userName}
                        >
                          {item.userAvatar || item.userName.slice(0, 2).toUpperCase()}
                        </div>

                        <div className="min-w-0 flex-1">
                          {/* Project, Client & Status */}
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-xs font-bold text-sky-600 dark:text-sky-400 truncate max-w-[200px]">
                              {item.projectName}
                            </span>
                            {item.client && (
                              <span className="text-[10px] text-slate-400">
                                ({item.client})
                              </span>
                            )}
                            <span
                              onClick={() => handleToggleApproval(item.id, item.status)}
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border cursor-pointer transition-colors ${
                                item.status === 'Approved'
                                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-500/25'
                                  : item.status === 'Pending'
                                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-800 hover:bg-amber-500/25'
                                  : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-800 hover:bg-rose-500/25'
                              }`}
                              title="Click to toggle status"
                            >
                              {item.status}
                            </span>
                            <span
                              onClick={() => handleToggleBillable(item.id)}
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border cursor-pointer transition-colors ${
                                item.isBillable
                                  ? 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700 hover:bg-indigo-500/25'
                                  : 'bg-slate-100 text-slate-500 border-slate-300 dark:border-slate-700 dark:bg-slate-800 hover:bg-slate-200'
                              }`}
                              title="Click to toggle billable"
                            >
                              {item.isBillable ? `${currency.symbol} Billable` : 'Non-Billable'}
                            </span>
                          </div>

                          {/* Task title */}
                          <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-sky-500 transition-colors">
                            {item.taskTitle}
                          </h4>

                          {/* Description Notes */}
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                            {item.description}
                          </p>

                          {/* Meta & Tags */}
                          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400 flex-wrap">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3 text-slate-400" />
                              <span className="font-medium text-slate-700 dark:text-slate-300">{item.userName}</span>
                            </span>
                            {item.startTime && item.endTime && (
                              <span>
                                {item.startTime} – {item.endTime}
                              </span>
                            )}
                            {item.tags && item.tags.length > 0 && (
                              <div className="flex items-center gap-1">
                                {item.tags.map((tag) => (
                                  <span key={tag} className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Duration, Value & Action Buttons */}
                      <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-sky-100/50">
                        {/* Duration Pill */}
                        <div className="text-right">
                          <span className="text-base font-extrabold text-sky-600 dark:text-sky-400 font-mono block">
                            {item.durationHours} hrs
                          </span>
                          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 block">
                            {item.isBillable ? `${currency.symbol}${item.billableAmount.toLocaleString()}` : `${currency.symbol}0.00`}
                          </span>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEntryToEdit(item);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors"
                            title="Edit Log"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete time log for "${item.taskTitle}"?`)) {
                                handleDeleteEntry(item.id, item.taskTitle);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                            title="Delete Log"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {entriesByDate.length === 0 && (
            <div className={`p-12 text-center rounded-xl border ${cardBg}`}>
              <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-60" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
                No matching time logs found
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Try resetting your filters or start a live timer.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setPeriodFilter('all');
                  setSelectedProject('all');
                  setSelectedMember('all');
                  setSelectedStatus('all');
                  setBillableOnly(false);
                }}
                className="mt-3 px-3 py-1.5 text-xs font-semibold text-sky-600 bg-sky-50 dark:bg-slate-800 rounded-lg hover:underline"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* 6. VIEW 2: WEEKLY TIMESHEET MATRIX */}
      {viewMode === 'weekly_matrix' && (
        <div className={`rounded-xl border overflow-hidden ${cardBg}`}>
          <div className="p-4 border-b border-sky-100/50 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-white">
                Weekly Contributor Timesheet Matrix
              </h3>
              <p className="text-[11px] text-slate-400">
                May 18 – May 24, 2025 · Cross-member hour allocation & billable rollups
              </p>
            </div>
            <span className="text-xs font-extrabold text-sky-600 dark:text-sky-400">
              Week Total: {metrics.totalHours}h ({currency.symbol}{metrics.billableAmount.toLocaleString()})
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-sky-50/50 dark:bg-slate-800/60 border-b border-sky-100/50 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="p-3">Team Member</th>
                  <th className="p-3 text-center">Sun (18)</th>
                  <th className="p-3 text-center">Mon (19)</th>
                  <th className="p-3 text-center">Tue (20)</th>
                  <th className="p-3 text-center">Wed (21)</th>
                  <th className="p-3 text-center">Thu (22)</th>
                  <th className="p-3 text-center">Fri (23)</th>
                  <th className="p-3 text-center">Sat (24)</th>
                  <th className="p-3 text-right">Total Hours</th>
                  <th className="p-3 text-right">Billable Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-100/30 dark:divide-slate-800">
                {DEFAULT_MEMBERS.map((member) => {
                  const memberEntries = filteredEntries.filter((e) => e.userName === member.name);

                  const getDayHours = (dateStr: string) =>
                    memberEntries
                      .filter((e) => e.date === dateStr)
                      .reduce((acc, c) => acc + c.durationHours, 0);

                  const sunH = getDayHours('2025-05-18');
                  const monH = getDayHours('2025-05-19');
                  const tueH = getDayHours('2025-05-20');
                  const wedH = getDayHours('2025-05-21');
                  const thuH = getDayHours('2025-05-22');
                  const friH = getDayHours('2025-05-23');
                  const satH = getDayHours('2025-05-24');

                  const totalMemHours = memberEntries.reduce((acc, c) => acc + c.durationHours, 0);
                  const totalMemValue = memberEntries.reduce((acc, c) => acc + c.billableAmount, 0);

                  return (
                    <tr key={member.name} className="hover:bg-sky-50/20 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-300 font-bold flex items-center justify-center text-[10px]">
                            {member.avatar}
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 dark:text-white block">
                              {member.name}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {currency.symbol}{member.rate}/hr
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="p-3 text-center font-mono font-medium">
                        {sunH > 0 ? `${sunH}h` : <span className="text-slate-300 dark:text-slate-700">—</span>}
                      </td>
                      <td className="p-3 text-center font-mono font-medium">
                        {monH > 0 ? `${monH}h` : <span className="text-slate-300 dark:text-slate-700">—</span>}
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-sky-600 dark:text-sky-400 bg-sky-50/30 dark:bg-sky-950/20">
                        {tueH > 0 ? `${tueH}h` : <span className="text-slate-300 dark:text-slate-700">—</span>}
                      </td>
                      <td className="p-3 text-center font-mono font-medium">
                        {wedH > 0 ? `${wedH}h` : <span className="text-slate-300 dark:text-slate-700">—</span>}
                      </td>
                      <td className="p-3 text-center font-mono font-medium">
                        {thuH > 0 ? `${thuH}h` : <span className="text-slate-300 dark:text-slate-700">—</span>}
                      </td>
                      <td className="p-3 text-center font-mono font-medium">
                        {friH > 0 ? `${friH}h` : <span className="text-slate-300 dark:text-slate-700">—</span>}
                      </td>
                      <td className="p-3 text-center font-mono font-medium">
                        {satH > 0 ? `${satH}h` : <span className="text-slate-300 dark:text-slate-700">—</span>}
                      </td>

                      <td className="p-3 text-right font-mono font-extrabold text-slate-900 dark:text-white">
                        {Math.round(totalMemHours * 10) / 10}h
                      </td>
                      <td className="p-3 text-right font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                        {currency.symbol}{Math.round(totalMemValue).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-sky-50/60 dark:bg-slate-800/80 border-t-2 border-sky-200 dark:border-slate-700 font-extrabold text-xs">
                <tr>
                  <td className="p-3 text-slate-800 dark:text-white uppercase tracking-wider text-[11px]">
                    Daily Grand Total
                  </td>
                  {['2025-05-18', '2025-05-19', '2025-05-20', '2025-05-21', '2025-05-22', '2025-05-23', '2025-05-24'].map((d) => {
                    const daySum = filteredEntries
                      .filter((e) => e.date === d)
                      .reduce((acc, c) => acc + c.durationHours, 0);
                    return (
                      <td key={d} className={`p-3 text-center font-mono ${d === '2025-05-20' ? 'text-sky-600 dark:text-sky-400 bg-sky-100/40 dark:bg-sky-950/40' : 'text-slate-800 dark:text-slate-200'}`}>
                        {daySum > 0 ? `${Math.round(daySum * 10) / 10}h` : '—'}
                      </td>
                    );
                  })}
                  <td className="p-3 text-right font-mono text-slate-900 dark:text-white">
                    {metrics.totalHours}h
                  </td>
                  <td className="p-3 text-right font-mono text-emerald-600 dark:text-emerald-400">
                    {currency.symbol}{metrics.billableAmount.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* 7. VIEW 3: PROJECT BUDGET & BURN ANALYTICS */}
      {viewMode === 'project_burn' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {INITIAL_PROJECTS.map((proj) => {
            const projEntries = entries.filter((e) => e.projectName === proj.name);
            const totalHours = Math.round(projEntries.reduce((acc, c) => acc + c.durationHours, 0) * 10) / 10;
            const totalRealizedValue = projEntries.reduce((acc, c) => acc + c.billableAmount, 0);

            // Estimated allocation baseline (hours proportional to budget)
            const estimatedHoursAllocation = Math.round(proj.budget / 140);
            const rawPercent = estimatedHoursAllocation > 0
              ? Math.round((totalHours / estimatedHoursAllocation) * 100)
              : 0;
            const barWidthPercent = Math.min(100, rawPercent);
            const isOverBudget = rawPercent > 100;

            return (
              <div key={proj.id} className={`p-4 rounded-xl border flex flex-col justify-between ${cardBg}`}>
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 block">
                        {proj.client}
                      </span>
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white leading-snug">
                        {proj.name}
                      </h4>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                      isOverBudget
                        ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                        : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                    }`}>
                      {isOverBudget ? 'Over Budget' : proj.status}
                    </span>
                  </div>

                  {/* Metrics Row */}
                  <div className="grid grid-cols-3 gap-2 my-3 p-3 rounded-lg bg-sky-50/40 dark:bg-slate-800/60 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Tracked Hours</span>
                      <span className="font-extrabold text-slate-800 dark:text-white text-sm">
                        {totalHours}h
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Burn Rate</span>
                      <span className={`font-extrabold text-sm ${isOverBudget ? 'text-rose-600 dark:text-rose-400' : 'text-indigo-600 dark:text-indigo-400'}`}>
                        {rawPercent}%
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Realized Value</span>
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                        {currency.symbol}{Math.round(totalRealizedValue).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1 mb-3">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Hours Consumed ({totalHours} / {estimatedHoursAllocation}h estimated)</span>
                      <span className={`font-bold ${isOverBudget ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}`}>
                        {rawPercent}%
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isOverBudget
                            ? 'bg-rose-500'
                            : 'bg-sky-500'
                        }`}
                        style={{ width: `${barWidthPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Team Contributors on this project */}
                  <div className="pt-2 border-t border-sky-100/30 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-medium">Logged Contributors:</span>
                    <div className="flex items-center gap-1">
                      {Array.from(new Set(projEntries.map((e) => e.userName))).slice(0, 4).map((name) => (
                        <span
                          key={name}
                          className="w-5 h-5 rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-300 font-bold flex items-center justify-center text-[9px]"
                          title={name}
                        >
                          {name.slice(0, 2).toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 8. MANUAL TIME ENTRY MODAL */}
      <TimeEntryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveEntry}
        entryToEdit={entryToEdit}
        availableProjects={INITIAL_PROJECTS.map((p) => ({ id: p.id, name: p.name, client: p.client }))}
        availableTasks={INITIAL_TASKS.map((t) => ({ id: t.id, title: t.title, project: t.project }))}
        availableMembers={DEFAULT_MEMBERS}
      />

      {/* 9. TOAST FEEDBACK */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white dark:bg-sky-500 dark:text-slate-950 font-medium text-xs shadow-xl animate-fade-in border border-slate-700 dark:border-sky-400">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-slate-950" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
