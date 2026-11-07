import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  Plus,
  Search,
  Filter,
  Download,
  LayoutGrid,
  LayoutList,
  Kanban,
  CheckSquare,
  Square,
  Clock,
  User,
  Calendar,
  Tag,
  AlertCircle,
  FileText,
  Trash2,
  Edit2,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  FolderKanban,
  ArrowUpDown,
  Sparkles,
  Layers,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import {
  TaskItem,
  TaskStatus,
  TaskPriority,
  TaskCategory,
} from '../../types/crm';
import { INITIAL_TASKS } from '../../data/mockData';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { notifyTaskAssigned } from '../../data/notificationService';
import { TaskModal } from './TaskModal';
import { TaskDetailsDrawer } from './TaskDetailsDrawer';

type TaskSortOption =
  | 'dueDate-asc'
  | 'dueDate-desc'
  | 'priority-desc'
  | 'title-asc'
  | 'hours-desc';

type TaskViewMode = 'kanban' | 'table' | 'grid';

const KANBAN_COLUMNS: TaskStatus[] = ['To Do', 'In Progress', 'In Review', 'Blocked', 'Completed'];

export const TasksView: React.FC = () => {
  const { theme, setActiveNav } = useTheme();
  const { scopeFilter, users } = useAuth();
  const isLight = theme === 'white-sky';

  // Tasks state (persisted so assignments survive user switching)
  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    try {
      const saved = localStorage.getItem('ozostack_tasks_v2');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      /* fallback */
    }
    return INITIAL_TASKS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('ozostack_tasks_v2', JSON.stringify(tasks));
    } catch {
      /* ignore */
    }
  }, [tasks]);

  useEffect(() => {
    const syncTasks = () => {
      try {
        const saved = localStorage.getItem('ozostack_tasks_v2');
        if (saved !== null) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) setTasks(parsed);
        }
      } catch {
        /* ignore */
      }
    };
    window.addEventListener('ozostack-crm-config-changed', syncTasks);
    return () => window.removeEventListener('ozostack-crm-config-changed', syncTasks);
  }, []);

  // Scoped tasks visible to the signed-in staff member
  const visibleTasks = useMemo(
    () => scopeFilter(tasks, (t) => ({ owner: t.assignee })),
    [tasks, scopeFilter]
  );

  // View Mode: 'kanban' | 'table' | 'grid'
  const [viewMode, setViewMode] = useState<TaskViewMode>('kanban');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('all');
  const [sortBy, setSortBy] = useState<TaskSortOption>('dueDate-asc');
  const [quickFilter, setQuickFilter] = useState<'all' | 'in_progress' | 'review' | 'blocked' | 'overdue' | 'completed'>('all');

  // Drag and Drop state for Kanban
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | null>(null);

  // Multi-selection state
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  // Modals & Drawer state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<TaskItem | null>(null);
  const [defaultStatusForModal, setDefaultStatusForModal] = useState<TaskStatus>('To Do');
  const [selectedDrawerTask, setSelectedDrawerTask] = useState<TaskItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const cardBg = isLight
    ? 'bg-white border-sky-100/90 shadow-xs'
    : 'bg-[#0f172a]/90 border-slate-800/80';

  // Unique Projects & Assignees for dropdown filters
  const projectList = useMemo(() => {
    const set = new Set<string>();
    visibleTasks.forEach((t) => set.add(t.project));
    return Array.from(set);
  }, [visibleTasks]);

  const assigneeList = useMemo(() => {
    const set = new Set<string>();
    users.forEach((u) => set.add(u.name));
    visibleTasks.forEach((t) => set.add(t.assignee));
    return Array.from(set);
  }, [users, visibleTasks]);

  // Executive Metrics
  const metrics = useMemo(() => {
    const total = visibleTasks.length;
    const inProgress = visibleTasks.filter((t) => t.status === 'In Progress').length;
    const inReview = visibleTasks.filter((t) => t.status === 'In Review').length;
    const completed = visibleTasks.filter((t) => t.status === 'Completed').length;
    const blocked = visibleTasks.filter((t) => t.status === 'Blocked').length;
    const todayStr = new Date().toISOString().split('T')[0];
    const overdue = visibleTasks.filter(
      (t) => t.status !== 'Completed' && t.dueDate < todayStr
    ).length;
    const totalEstimated = visibleTasks.reduce((acc, t) => acc + t.estimatedHours, 0);
    const totalLogged = visibleTasks.reduce((acc, t) => acc + t.loggedHours, 0);
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      inProgress,
      inReview,
      completed,
      blocked,
      overdue,
      totalEstimated,
      totalLogged,
      completionRate,
    };
  }, [visibleTasks]);

  // Priority weight mapping for sorting
  const priorityWeight: Record<TaskPriority, number> = {
    Urgent: 4,
    High: 3,
    Medium: 2,
    Low: 1,
  };

  // Filtered & Sorted Tasks
  const filteredTasks = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const list = visibleTasks.filter((task) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        task.title.toLowerCase().includes(q) ||
        task.project.toLowerCase().includes(q) ||
        (task.client && task.client.toLowerCase().includes(q)) ||
        task.assignee.toLowerCase().includes(q) ||
        task.category.toLowerCase().includes(q) ||
        (task.tags && task.tags.some((tag) => tag.toLowerCase().includes(q)));

      const matchesStatus = selectedStatus === 'all' || task.status === selectedStatus;
      const matchesPriority = selectedPriority === 'all' || task.priority === selectedPriority;
      const matchesCategory = selectedCategory === 'all' || task.category === selectedCategory;
      const matchesProject = selectedProject === 'all' || task.project === selectedProject;
      const matchesAssignee = selectedAssignee === 'all' || task.assignee === selectedAssignee;

      let matchesQuick = true;
      if (quickFilter === 'in_progress') matchesQuick = task.status === 'In Progress';
      else if (quickFilter === 'review') matchesQuick = task.status === 'In Review';
      else if (quickFilter === 'blocked') matchesQuick = task.status === 'Blocked';
      else if (quickFilter === 'overdue') matchesQuick = task.status !== 'Completed' && task.dueDate < todayStr;
      else if (quickFilter === 'completed') matchesQuick = task.status === 'Completed';

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority &&
        matchesCategory &&
        matchesProject &&
        matchesAssignee &&
        matchesQuick
      );
    });

    return list.sort((a, b) => {
      switch (sortBy) {
        case 'dueDate-asc':
          return a.dueDate.localeCompare(b.dueDate);
        case 'dueDate-desc':
          return b.dueDate.localeCompare(a.dueDate);
        case 'priority-desc':
          return priorityWeight[b.priority] - priorityWeight[a.priority];
        case 'title-asc':
          return a.title.localeCompare(b.title);
        case 'hours-desc':
          return b.estimatedHours - a.estimatedHours;
        default:
          return 0;
      }
    });
  }, [
    visibleTasks,
    searchQuery,
    selectedStatus,
    selectedPriority,
    selectedCategory,
    selectedProject,
    selectedAssignee,
    sortBy,
    quickFilter,
  ]);

  // Multi-selection handlers
  const isAllSelected =
    filteredTasks.length > 0 && filteredTasks.every((t) => selectedTaskIds.includes(t.id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(filteredTasks.map((t) => t.id));
    }
  };

  const handleToggleSelectTask = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTaskIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBulkComplete = () => {
    setTasks((prev) =>
      prev.map((t) =>
        selectedTaskIds.includes(t.id)
          ? {
              ...t,
              status: 'Completed',
              subtasks: (t.subtasks || []).map((s) => ({ ...s, completed: true })),
            }
          : t
      )
    );
    showToast(`Marked ${selectedTaskIds.length} tasks as Completed.`);
    setSelectedTaskIds([]);
  };

  const handleBulkStatusChange = (newStatus: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) => (selectedTaskIds.includes(t.id) ? { ...t, status: newStatus } : t))
    );
    showToast(`Updated ${selectedTaskIds.length} tasks to ${newStatus}.`);
    setSelectedTaskIds([]);
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Delete ${selectedTaskIds.length} selected tasks?`)) {
      setTasks((prev) => {
        const next = prev.filter((t) => !selectedTaskIds.includes(t.id));
        try {
          localStorage.setItem('ozostack_tasks_v2', JSON.stringify(next));
        } catch {}
        return next;
      });
      showToast(`${selectedTaskIds.length} tasks deleted.`);
      setSelectedTaskIds([]);
      window.dispatchEvent(new CustomEvent('ozostack-crm-config-changed'));
    }
  };

  // CRUD Operations
  const handleSaveTask = (task: TaskItem) => {
    if (taskToEdit) {
      setTasks((prev) => {
        const next = prev.map((t) => (t.id === task.id ? task : t));
        try {
          localStorage.setItem('ozostack_tasks_v2', JSON.stringify(next));
        } catch {}
        return next;
      });
      if (selectedDrawerTask?.id === task.id) {
        setSelectedDrawerTask(task);
      }
      showToast(`Task "${task.title}" updated.`);
    } else {
      setTasks((prev) => {
        const next = [task, ...prev];
        try {
          localStorage.setItem('ozostack_tasks_v2', JSON.stringify(next));
        } catch {}
        return next;
      });
      showToast(`New task "${task.title}" created & assigned to ${task.assignee}.`);
    }
    window.dispatchEvent(new CustomEvent('ozostack-crm-config-changed'));
    // Dispatch real-time employee assignment notification
    if (task.assignee) {
      notifyTaskAssigned(task);
    }
  };

  const handleDeleteTask = (taskId: string, taskTitle: string) => {
    setTasks((prev) => {
      const next = prev.filter((t) => t.id !== taskId);
      try {
        localStorage.setItem('ozostack_tasks_v2', JSON.stringify(next));
      } catch {}
      return next;
    });
    showToast(`Task "${taskTitle}" deleted.`);
    window.dispatchEvent(new CustomEvent('ozostack-crm-config-changed'));
    if (selectedDrawerTask?.id === taskId) {
      setIsDrawerOpen(false);
      setSelectedDrawerTask(null);
    }
  };

  const handleUpdateTaskFromDrawer = (updated: TaskItem) => {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setSelectedDrawerTask(updated);
    if (updated.assignee) {
      notifyTaskAssigned(updated);
    }
  };

  const handleQuickStatusChange = (
    taskId: string,
    newStatus: TaskStatus,
    e?: React.MouseEvent | React.ChangeEvent<HTMLSelectElement>
  ) => {
    if (e) e.stopPropagation();
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          status: newStatus,
          subtasks:
            newStatus === 'Completed'
              ? (t.subtasks || []).map((s) => ({ ...s, completed: true }))
              : t.subtasks,
        };
      })
    );
    showToast(`Updated status to ${newStatus}`);
  };

  // Drag and Drop handlers for Kanban Board
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedTaskId(id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverStatus(null);
  };

  const handleDragOverColumn = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStatus !== status) {
      setDragOverStatus(status);
    }
  };

  const handleDragLeaveColumn = (e: React.DragEvent, status: TaskStatus) => {
    if (dragOverStatus === status) {
      setDragOverStatus(null);
    }
  };

  const handleDropOnColumn = (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    setDragOverStatus(null);
    const id = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (!id) return;

    const targetTask = tasks.find((t) => t.id === id);
    if (!targetTask || targetTask.status === targetStatus) return;

    const updated: TaskItem = {
      ...targetTask,
      status: targetStatus,
      subtasks:
        targetStatus === 'Completed'
          ? (targetTask.subtasks || []).map((s) => ({ ...s, completed: true }))
          : targetTask.subtasks,
    };

    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    showToast(`Moved "${targetTask.title}" to ${targetStatus}`);
    setDraggedTaskId(null);
  };

  // CSV Export
  const handleExportCSV = (selectedOnly = false) => {
    const listToExport = selectedOnly
      ? tasks.filter((t) => selectedTaskIds.includes(t.id))
      : filteredTasks;

    const headers = [
      'Task Title',
      'Project',
      'Client',
      'Assignee',
      'Status',
      'Priority',
      'Category',
      'Due Date',
      'Est. Hours',
      'Logged Hours',
      'Subtasks Total',
      'Subtasks Done',
    ];

    const rows = listToExport.map((t) => [
      `"${t.title.replace(/"/g, '""')}"`,
      `"${t.project.replace(/"/g, '""')}"`,
      `"${(t.client || '').replace(/"/g, '""')}"`,
      `"${t.assignee.replace(/"/g, '""')}"`,
      `"${t.status}"`,
      `"${t.priority}"`,
      `"${t.category}"`,
      `"${t.dueDate}"`,
      t.estimatedHours,
      t.loggedHours,
      t.subtasks ? t.subtasks.length : 0,
      t.subtasks ? t.subtasks.filter((s) => s.completed).length : 0,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Tasks_WorkItems_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Exported ${listToExport.length} task records to CSV.`);
  };

  const getStatusColor = (s: TaskStatus) => {
    switch (s) {
      case 'In Progress':
        return 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-300 dark:border-sky-800';
      case 'In Review':
        return 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-300 dark:border-purple-800';
      case 'Completed':
        return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800';
      case 'Blocked':
        return 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-800';
      case 'To Do':
        return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-800';
    }
  };

  const getPriorityBadge = (p: TaskPriority) => {
    switch (p) {
      case 'Urgent':
        return (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-800">
            🔥 Urgent
          </span>
        );
      case 'High':
        return (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
            ▲ High
          </span>
        );
      case 'Medium':
        return (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-300 dark:border-sky-800">
            ● Medium
          </span>
        );
      case 'Low':
        return (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-500/15 text-slate-500 border border-slate-300 dark:border-slate-700">
            ▼ Low
          </span>
        );
    }
  };

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
              <span>Engineering Tasks & Work Breakdown</span>
              <span className="text-xs bg-sky-500/15 text-sky-600 dark:text-sky-400 font-bold px-2 py-0.5 rounded-full">
                {tasks.length} Total Items
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Active Sprint: <span className="font-bold text-sky-500">{metrics.inProgress} In Flight</span> · Completed: <span className="font-bold text-emerald-500">{metrics.completed} Done</span> ({metrics.completionRate}%) · Effort Logged: <span className="font-bold text-indigo-500">{metrics.totalLogged}h / {metrics.totalEstimated}h</span>
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
            title="Download CSV Tasks Report"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Export CSV</span>
          </button>

          <button
            onClick={() => {
              setTaskToEdit(null);
              setDefaultStatusForModal('To Do');
              setIsTaskModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-sky-500 hover:bg-sky-600 text-white shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* 2. EXECUTIVE KPI RIBBON */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Total Tasks */}
        <div
          onClick={() => setQuickFilter('all')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            quickFilter === 'all'
              ? 'ring-2 ring-sky-500 border-sky-400 shadow-md'
              : 'hover:border-sky-300'
          } ${cardBg}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Work Items
            </span>
            <div className="p-1.5 rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-extrabold text-sky-600 dark:text-sky-400 tabular-nums">
              {metrics.total}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">all projects</span>
          </div>
        </div>

        {/* In Progress */}
        <div
          onClick={() => setQuickFilter(quickFilter === 'in_progress' ? 'all' : 'in_progress')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            quickFilter === 'in_progress'
              ? 'ring-2 ring-sky-500 border-sky-400 shadow-md'
              : 'hover:border-sky-300'
          } ${cardBg}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              In Flight
            </span>
            <div className="p-1.5 rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-extrabold text-sky-500 tabular-nums">
              {metrics.inProgress}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">in development</span>
          </div>
        </div>

        {/* In Review */}
        <div
          onClick={() => setQuickFilter(quickFilter === 'review' ? 'all' : 'review')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            quickFilter === 'review'
              ? 'ring-2 ring-purple-500 border-purple-400 shadow-md'
              : 'hover:border-purple-300'
          } ${cardBg}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Pending QA / Review
            </span>
            <div className="p-1.5 rounded-lg bg-purple-500/15 text-purple-600 dark:text-purple-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-extrabold text-purple-600 dark:text-purple-400 tabular-nums">
              {metrics.inReview}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">ready for signoff</span>
          </div>
        </div>

        {/* Blocked / Overdue */}
        <div
          onClick={() => setQuickFilter(quickFilter === 'blocked' ? 'all' : 'blocked')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            quickFilter === 'blocked' || quickFilter === 'overdue'
              ? 'ring-2 ring-rose-500 border-rose-400 shadow-md'
              : 'hover:border-rose-300'
          } ${cardBg}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Blocked / Attention
            </span>
            <div className="p-1.5 rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-extrabold text-rose-600 dark:text-rose-400 tabular-nums">
              {metrics.blocked + metrics.overdue}
            </span>
            <span className="text-[11px] text-rose-500 font-medium">
              {metrics.blocked} blocked · {metrics.overdue} overdue
            </span>
          </div>
        </div>

        {/* Completed */}
        <div
          onClick={() => setQuickFilter(quickFilter === 'completed' ? 'all' : 'completed')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            quickFilter === 'completed'
              ? 'ring-2 ring-emerald-500 border-emerald-400 shadow-md'
              : 'hover:border-emerald-300'
          } ${cardBg}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Completed
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-extrabold text-emerald-500 tabular-nums">
              {metrics.completed}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">({metrics.completionRate}%)</span>
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
            placeholder="Search task, project, engineer, tag..."
            className={`w-full text-xs pl-9 pr-3 py-2 rounded-lg border outline-none font-medium ${
              isLight
                ? 'bg-sky-50/40 border-sky-200 text-slate-800 focus:border-sky-500'
                : 'bg-slate-900 border-slate-700 text-white focus:border-sky-400'
            }`}
          />
        </div>

        {/* Filters & Controls */}
        <div className="flex items-center gap-2 w-full lg:w-auto flex-wrap justify-end text-xs">
          {/* Project Filter */}
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className={`text-xs px-2.5 py-1.5 rounded-lg border outline-none font-medium cursor-pointer ${
              isLight ? 'bg-white border-sky-200 text-slate-700' : 'bg-slate-800 border-slate-700 text-slate-200'
            }`}
          >
            <option value="all">All Projects</option>
            {projectList.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          {/* Assignee Filter */}
          <select
            value={selectedAssignee}
            onChange={(e) => setSelectedAssignee(e.target.value)}
            className={`text-xs px-2.5 py-1.5 rounded-lg border outline-none font-medium cursor-pointer ${
              isLight ? 'bg-white border-sky-200 text-slate-700' : 'bg-slate-800 border-slate-700 text-slate-200'
            }`}
          >
            <option value="all">All Engineers</option>
            {assigneeList.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className={`text-xs px-2.5 py-1.5 rounded-lg border outline-none font-medium cursor-pointer ${
              isLight ? 'bg-white border-sky-200 text-slate-700' : 'bg-slate-800 border-slate-700 text-slate-200'
            }`}
          >
            <option value="all">All Statuses</option>
            <option value="To Do">To Do</option>
            <option value="In Progress">In Progress</option>
            <option value="In Review">In Review</option>
            <option value="Completed">Completed</option>
            <option value="Blocked">Blocked</option>
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
            <option value="Urgent">Urgent</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 pl-1">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as TaskSortOption)}
              className={`text-xs px-2.5 py-1.5 rounded-lg border outline-none font-medium cursor-pointer ${
                isLight ? 'bg-white border-sky-200 text-slate-700' : 'bg-slate-800 border-slate-700 text-slate-200'
              }`}
            >
              <option value="dueDate-asc">Due Date (Earliest)</option>
              <option value="dueDate-desc">Due Date (Latest)</option>
              <option value="priority-desc">Priority (Highest)</option>
              <option value="title-asc">Title (A-Z)</option>
              <option value="hours-desc">Estimated Hours</option>
            </select>
          </div>

          {/* View Toggle */}
          <div className="flex items-center p-0.5 rounded-lg border border-sky-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-sky-500 text-white shadow-2xs'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Kanban Board View"
            >
              <Kanban className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'table'
                  ? 'bg-sky-500 text-white shadow-2xs'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Table Directory View"
            >
              <LayoutList className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-sky-500 text-white shadow-2xs'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Grid Cards View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. FLOATING BULK ACTIONS BAR */}
      {selectedTaskIds.length > 0 && (
        <div className="p-3 rounded-xl border border-sky-300 bg-sky-50 dark:bg-slate-800/90 dark:border-sky-500/30 text-xs shadow-md animate-fade-in flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sky-700 dark:text-sky-300 px-2 py-0.5 rounded-md bg-sky-500/10">
              {selectedTaskIds.length} Tasks Selected
            </span>
            <button
              onClick={() => setSelectedTaskIds([])}
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
              onClick={() => handleBulkStatusChange('In Progress')}
              className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-semibold hover:text-sky-500"
            >
              Set In Progress
            </button>

            <button
              onClick={() => handleBulkStatusChange('In Review')}
              className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-semibold hover:text-purple-500"
            >
              Set In Review
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

      {/* 5. VIEW 1: KANBAN BOARD VIEW */}
      {viewMode === 'kanban' && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-3.5 items-start min-w-max">
            {KANBAN_COLUMNS.map((status) => {
              const statusTasks = filteredTasks.filter((t) => t.status === status);
              const columnHours = statusTasks.reduce((acc, t) => acc + t.estimatedHours, 0);
              const isDragOver = dragOverStatus === status;

              return (
                <div
                  key={status}
                  onDragOver={(e) => handleDragOverColumn(e, status)}
                  onDragLeave={(e) => handleDragLeaveColumn(e, status)}
                  onDrop={(e) => handleDropOnColumn(e, status)}
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
                      <span
                        className={`font-extrabold text-xs uppercase tracking-tight truncate ${
                          status === 'Blocked'
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-slate-800 dark:text-slate-100'
                        }`}
                      >
                        {status}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full shrink-0 ${
                          status === 'Blocked'
                            ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                            : 'bg-sky-500/15 text-sky-600 dark:text-sky-300'
                        }`}
                      >
                        {statusTasks.length}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <div className="text-xs font-extrabold text-slate-700 dark:text-slate-300 tabular-nums">
                          {columnHours}h
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setTaskToEdit(null);
                          setDefaultStatusForModal(status);
                          setIsTaskModalOpen(true);
                        }}
                        className="p-1 text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-slate-800 rounded transition-colors"
                        title={`Create task in ${status}`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Drop zone indicator when dragging */}
                  {isDragOver && (
                    <div className="mb-2 py-2 text-center text-[10px] font-bold text-sky-600 dark:text-sky-400 bg-sky-100/80 dark:bg-sky-900/40 border border-dashed border-sky-400 rounded-lg animate-pulse">
                      Drop item here to move to {status}
                    </div>
                  )}

                  {/* Cards Container */}
                  <div className="space-y-3 flex-1 overflow-y-auto pr-0.5">
                    {statusTasks.map((task) => {
                      const isBeingDragged = draggedTaskId === task.id;
                      const isSelected = selectedTaskIds.includes(task.id);
                      const subtasks = task.subtasks || [];
                      const completedCount = subtasks.filter((s) => s.completed).length;
                      const isOverdue =
                        task.status !== 'Completed' &&
                        new Date(task.dueDate) < new Date(new Date().toDateString());

                      return (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task.id)}
                          onDragEnd={handleDragEnd}
                          onClick={() => {
                            setSelectedDrawerTask(task);
                            setIsDrawerOpen(true);
                          }}
                          className={`p-3.5 rounded-xl border transition-all duration-200 hover:shadow-md group cursor-grab active:cursor-grabbing select-none flex flex-col justify-between ${
                            isBeingDragged
                              ? 'opacity-40 scale-95 border-sky-400'
                              : isSelected
                              ? 'border-sky-400 bg-sky-50/50 dark:bg-sky-950/30 ring-1 ring-sky-400'
                              : cardBg
                          }`}
                        >
                          <div>
                            {/* Card Top: Checkbox, Priority & Category */}
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={(e) => handleToggleSelectTask(task.id, e)}
                                  className="text-slate-400 hover:text-sky-500 transition-colors"
                                >
                                  {isSelected ? (
                                    <CheckSquare className="w-4 h-4 text-sky-500" />
                                  ) : (
                                    <Square className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                                  )}
                                </button>
                                {getPriorityBadge(task.priority)}
                              </div>
                              <span className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 truncate max-w-[100px]">
                                {task.category}
                              </span>
                            </div>

                            {/* Task Title & Project */}
                            <div className="mb-2">
                              <h4 className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-sky-500 transition-colors line-clamp-2 leading-snug">
                                {task.title}
                              </h4>
                              <p className="text-[11px] text-sky-600 dark:text-sky-400 font-semibold truncate mt-1">
                                {task.project}
                              </p>
                            </div>

                            {/* Subtask completion metric */}
                            {subtasks.length > 0 && (
                              <div className="mb-2 flex items-center justify-between text-[10px] text-slate-400">
                                <span className="flex items-center gap-1">
                                  <CheckSquare className="w-3 h-3 text-sky-500" />
                                  <span>{completedCount}/{subtasks.length} subtasks</span>
                                </span>
                                <span className="font-semibold text-slate-600 dark:text-slate-300">
                                  {Math.round((completedCount / subtasks.length) * 100)}%
                                </span>
                              </div>
                            )}

                            {/* Effort & Due Date row */}
                            <div className="flex items-center justify-between text-[10px] p-2 rounded-lg bg-sky-50/40 dark:bg-slate-800/40 mb-2">
                              <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                                <Clock className="w-3 h-3" />
                                <span className="font-semibold">{task.loggedHours}/{task.estimatedHours}h</span>
                              </div>
                              <div className={`font-semibold tabular-nums ${isOverdue ? 'text-rose-500 font-bold' : 'text-slate-600 dark:text-slate-300'}`}>
                                Due: {task.dueDate}
                              </div>
                            </div>
                          </div>

                          {/* Card Footer: Assignee & Quick Actions */}
                          <div className="pt-2 border-t border-sky-100/30 flex items-center justify-between text-[10px]">
                            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium truncate max-w-[130px]">
                              <div className="w-5 h-5 rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-300 font-bold flex items-center justify-center text-[9px] shrink-0">
                                {task.assignee.slice(0, 2).toUpperCase()}
                              </div>
                              <span className="truncate">{task.assignee}</span>
                            </span>

                            <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => {
                                  setSelectedDrawerTask(task);
                                  setIsDrawerOpen(true);
                                }}
                                className="p-1 rounded text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors"
                                title="Inspect Details"
                              >
                                <FileText className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setTaskToEdit(task);
                                  setIsTaskModalOpen(true);
                                }}
                                className="p-1 rounded text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors"
                                title="Edit Task"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Delete task "${task.title}"?`)) {
                                    handleDeleteTask(task.id, task.title);
                                  }
                                }}
                                className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                                title="Delete Task"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {statusTasks.length === 0 && (
                      <div className="py-8 text-center text-[11px] text-slate-400 border border-dashed rounded-lg border-sky-100/60 dark:border-slate-800">
                        No tasks in {status}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. VIEW 2: TABLE VIEW */}
      {viewMode === 'table' && (
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
                  <th className="py-3 px-3">Task & Project</th>
                  <th className="py-3 px-3">Assignee</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Priority</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Subtasks</th>
                  <th className="py-3 px-3">Hours</th>
                  <th className="py-3 px-3">Due Date</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-100/20 dark:divide-slate-800">
                {filteredTasks.map((task) => {
                  const isSelected = selectedTaskIds.includes(task.id);
                  const subtasks = task.subtasks || [];
                  const completedSubtasks = subtasks.filter((s) => s.completed).length;
                  const isOverdue =
                    task.status !== 'Completed' &&
                    new Date(task.dueDate) < new Date(new Date().toDateString());

                  return (
                    <tr
                      key={task.id}
                      onClick={() => {
                        setSelectedDrawerTask(task);
                        setIsDrawerOpen(true);
                      }}
                      className={`hover:bg-sky-50/40 dark:hover:bg-slate-800/40 transition-colors cursor-pointer ${
                        isSelected ? 'bg-sky-50/50 dark:bg-sky-950/20' : ''
                      }`}
                    >
                      <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleToggleSelectTask(task.id, e)}
                          className="text-slate-400 hover:text-sky-500 transition-colors"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-sky-500" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                          )}
                        </button>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-300 font-bold flex items-center justify-center text-xs shrink-0">
                            <CheckSquare className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-slate-800 dark:text-white hover:text-sky-500 transition-colors block truncate max-w-xs">
                              {task.title}
                            </span>
                            <span className="text-[11px] text-sky-600 dark:text-sky-400 font-medium truncate block">
                              {task.project}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap">
                        {task.assignee}
                      </td>

                      <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={task.status}
                          onChange={(e) => handleQuickStatusChange(task.id, e.target.value as TaskStatus, e)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border outline-none cursor-pointer ${getStatusColor(task.status)}`}
                          title="Click to update status"
                        >
                          <option value="To Do">To Do</option>
                          <option value="In Progress">In Progress</option>
                          <option value="In Review">In Review</option>
                          <option value="Completed">Completed</option>
                          <option value="Blocked">Blocked</option>
                        </select>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        {getPriorityBadge(task.priority)}
                      </td>

                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {task.category}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        {subtasks.length > 0 ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {completedSubtasks}/{subtasks.length}
                            </span>
                            <div className="w-14 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-sky-500 rounded-full"
                                style={{
                                  width: `${Math.round((completedSubtasks / subtasks.length) * 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap text-slate-600 dark:text-slate-300 tabular-nums">
                        {task.loggedHours}/{task.estimatedHours}h
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap tabular-nums">
                        <span className={isOverdue ? 'text-rose-500 font-bold' : 'text-slate-600 dark:text-slate-300'}>
                          {task.dueDate}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setSelectedDrawerTask(task);
                              setIsDrawerOpen(true);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors"
                            title="Inspect Details"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setTaskToEdit(task);
                              setIsTaskModalOpen(true);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors"
                            title="Edit Task"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete task "${task.title}"?`)) {
                                handleDeleteTask(task.id, task.title);
                              }
                            }}
                            className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                            title="Delete Task"
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

          {filteredTasks.length === 0 && (
            <div className="text-center py-12">
              <CheckSquare className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-60" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
                No matching tasks found
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Try adjusting your search criteria or create a new engineering task.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedStatus('all');
                  setSelectedPriority('all');
                  setSelectedCategory('all');
                  setSelectedProject('all');
                  setSelectedAssignee('all');
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

      {/* 7. VIEW 3: GRID VIEW */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredTasks.map((task) => {
            const isSelected = selectedTaskIds.includes(task.id);
            const subtasks = task.subtasks || [];
            const completedCount = subtasks.filter((s) => s.completed).length;
            const isOverdue =
              task.status !== 'Completed' &&
              new Date(task.dueDate) < new Date(new Date().toDateString());

            return (
              <div
                key={task.id}
                onClick={() => {
                  setSelectedDrawerTask(task);
                  setIsDrawerOpen(true);
                }}
                className={`p-4 rounded-xl border transition-all duration-200 hover:shadow-md cursor-pointer group flex flex-col justify-between ${
                  isSelected
                    ? 'border-sky-400 bg-sky-50/40 dark:bg-sky-950/20 ring-1 ring-sky-400'
                    : cardBg
                }`}
              >
                <div>
                  {/* Top row */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleToggleSelectTask(task.id, e)}
                        className="text-slate-400 hover:text-sky-500 transition-colors"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-sky-500" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                        )}
                      </button>
                      <select
                        value={task.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => handleQuickStatusChange(task.id, e.target.value as TaskStatus, e)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border outline-none cursor-pointer ${getStatusColor(task.status)}`}
                        title="Click to change status"
                      >
                        <option value="To Do">To Do</option>
                        <option value="In Progress">In Progress</option>
                        <option value="In Review">In Review</option>
                        <option value="Completed">Completed</option>
                        <option value="Blocked">Blocked</option>
                      </select>
                    </div>

                    {getPriorityBadge(task.priority)}
                  </div>

                  {/* Title & Project */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-400 to-indigo-600 text-white flex items-center justify-center font-extrabold text-sm shadow-xs shrink-0">
                      <CheckSquare className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-sky-500 transition-colors line-clamp-2 leading-snug">
                        {task.title}
                      </h3>
                      <p className="text-[11px] text-sky-600 dark:text-sky-400 font-semibold truncate mt-0.5">
                        {task.project}
                      </p>
                    </div>
                  </div>

                  {/* Subtasks Progress */}
                  {subtasks.length > 0 && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-[10px] font-bold mb-1">
                        <span className="text-slate-400">Subtask Progress</span>
                        <span className="text-sky-600 dark:text-sky-400">
                          {completedCount}/{subtasks.length}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-sky-400 to-indigo-500 rounded-full"
                          style={{
                            width: `${Math.round((completedCount / subtasks.length) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Metric Box */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-sky-50/40 dark:bg-slate-800/40 text-xs mb-3">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Effort Logged</span>
                      <span className="font-extrabold text-emerald-500 tabular-nums">
                        {task.loggedHours}/{task.estimatedHours}h
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Target Due</span>
                      <span className={`font-semibold tabular-nums ${isOverdue ? 'text-rose-500 font-bold' : 'text-slate-700 dark:text-slate-300'}`}>
                        {task.dueDate}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer: Assignee & Actions */}
                <div className="pt-2 border-t border-sky-100/30 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium truncate">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{task.assignee}</span>
                  </span>

                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => {
                        setTaskToEdit(task);
                        setIsTaskModalOpen(true);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors"
                      title="Edit Task"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete task "${task.title}"?`)) {
                          handleDeleteTask(task.id, task.title);
                        }
                      }}
                      className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                      title="Delete Task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 8. MODALS & DRAWER */}
      {/* Side Details Drawer */}
      <TaskDetailsDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedDrawerTask(null);
        }}
        task={selectedDrawerTask}
        onEdit={(t) => {
          setIsDrawerOpen(false);
          setTaskToEdit(t);
          setIsTaskModalOpen(true);
        }}
        onDelete={handleDeleteTask}
        onUpdateTask={handleUpdateTaskFromDrawer}
      />

      {/* Create / Edit Task Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleSaveTask}
        taskToEdit={taskToEdit}
        availableProjects={projectList}
        availableAssignees={assigneeList}
        defaultStatus={defaultStatusForModal}
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

