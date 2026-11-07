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
  FolderKanban,
  Building2,
  Calendar,
  Clock,
  DollarSign,
  User,
  Users,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Tag,
  CheckCircle2,
  TrendingUp,
  Edit2,
  Trash2,
  CheckSquare,
  Square,
  ArrowUpDown,
  Bug,
  Sparkles,
} from 'lucide-react';
import {
  Project,
  ProjectCategory,
  ProjectStatus,
  ProjectPriority,
  ProjectHealth,
  ProjectActivity,
  ProjectActivityType,
} from '../../types/crm';
import { INITIAL_PROJECTS, INITIAL_PROJECT_ACTIVITIES } from '../../data/mockData';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useSystemCurrency } from '../../data/currencyService';
import { ProjectModal } from './ProjectModal';
import { ProjectDetailsDrawer } from './ProjectDetailsDrawer';

type ProjectSortOption =
  | 'deadline-asc'
  | 'deadline-desc'
  | 'progress-desc'
  | 'budget-desc'
  | 'name-asc';

type ProjectViewMode = 'grid' | 'kanban' | 'table';

const PROJECT_KANBAN_STATUSES: ProjectStatus[] = [
  'Planning',
  'In Progress',
  'On Hold',
  'Delayed',
  'Completed',
];

export const ProjectsView: React.FC = () => {
  const { theme, setActiveNav } = useTheme();
  const { scopeFilter, currentUser } = useAuth();
  const currency = useSystemCurrency();
  const isLight = theme === 'white-sky';

  // Projects state
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const saved = localStorage.getItem('ozostack_projects');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((p) => {
            if (!p || typeof p !== 'object') return p;
            const initP = INITIAL_PROJECTS.find((ip) => ip.id === p.id);
            const mergedTeam = Array.from(
              new Set([
                ...(Array.isArray(p.team) ? p.team : []),
                ...(initP?.team || []),
                p.projectManager || 'Sayed (CEO)',
              ])
            );
            const tasks = Array.isArray(p.tasks) && p.tasks.length > 0
              ? p.tasks
              : (initP?.tasks || []);
            return {
              ...p,
              team: mergedTeam,
              tasks,
            };
          });
        }
      }
      return INITIAL_PROJECTS;
    } catch {
      return INITIAL_PROJECTS;
    }
  });

  useEffect(() => {
    const syncProjects = () => {
      try {
        const saved = localStorage.getItem('ozostack_projects');
        if (saved !== null) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) setProjects(parsed);
        }
      } catch {
        /* ignore */
      }
    };
    window.addEventListener('ozostack-crm-config-changed', syncProjects);
    return () => window.removeEventListener('ozostack-crm-config-changed', syncProjects);
  }, []);

  // Scoped projects visible to the currently logged-in staff member
  const visibleProjects = useMemo(
    () => scopeFilter(projects, (p) => ({ owner: [p.projectManager, ...(p.team || [])] })),
    [projects, scopeFilter]
  );

  // Project Activity Log state (persisted in localStorage)
  const [projectActivities, setProjectActivities] = useState<ProjectActivity[]>(() => {
    try {
      const saved = localStorage.getItem('ozostack_project_activities');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
      return INITIAL_PROJECT_ACTIVITIES;
    } catch {
      return INITIAL_PROJECT_ACTIVITIES;
    }
  });

  const logProjectActivity = (
    projectId: string,
    type: ProjectActivityType,
    description: string,
    oldValue?: string,
    newValue?: string
  ) => {
    const newActivity: ProjectActivity = {
      id: `pa-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      projectId,
      type,
      description,
      timestamp: new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
      author: 'Sayed (CEO)',
      oldValue,
      newValue,
    };

    setProjectActivities((prev) => {
      const updated = [newActivity, ...prev];
      try {
        localStorage.setItem('ozostack_project_activities', JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to save project activity', err);
      }
      return updated;
    });
  };

  // View Mode: 'grid' | 'kanban' | 'table'
  const [viewMode, setViewMode] = useState<ProjectViewMode>('grid');

  // Drag and Drop State for Kanban Board
  const [draggedProjectId, setDraggedProjectId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<ProjectStatus | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedHealth, setSelectedHealth] = useState<string>('all');
  const [selectedManager, setSelectedManager] = useState<string>('all');
  const [sortBy, setSortBy] = useState<ProjectSortOption>('deadline-asc');
  const [quickFilter, setQuickFilter] = useState<'all' | 'running' | 'completed' | 'at_risk'>('all');

  // Multi-selection state
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);

  // Modals & Drawer state
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [selectedDrawerProject, setSelectedDrawerProject] = useState<Project | null>(null);
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

  // Distinct managers & categories
  const managers = useMemo(() => {
    const set = new Set<string>();
    visibleProjects.forEach((p) => set.add(p.projectManager));
    return Array.from(set);
  }, [visibleProjects]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    visibleProjects.forEach((p) => set.add(p.category));
    return Array.from(set);
  }, [visibleProjects]);

  // Executive Metrics
  const metrics = useMemo(() => {
    const total = visibleProjects.length;
    const runningCount = visibleProjects.filter((p) => p.status === 'In Progress').length;
    const completedCount = visibleProjects.filter((p) => p.status === 'Completed').length;
    const atRiskCount = visibleProjects.filter((p) => p.health === 'At Risk' || p.health === 'Critical' || p.status === 'Delayed').length;
    const totalBudget = visibleProjects.reduce((acc, p) => acc + p.budget, 0);
    const totalSpent = visibleProjects.reduce((acc, p) => acc + p.spent, 0);
    const avgProgress = total > 0 ? Math.round(visibleProjects.reduce((acc, p) => acc + p.progress, 0) / total) : 0;

    return {
      total,
      runningCount,
      completedCount,
      atRiskCount,
      totalBudget,
      totalSpent,
      avgProgress,
    };
  }, [visibleProjects]);

  // Filtered & Sorted Projects
  const filteredProjects = useMemo(() => {
    const list = visibleProjects.filter((p) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        p.name.toLowerCase().includes(q) ||
        p.client.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.projectManager.toLowerCase().includes(q) ||
        (p.tags && p.tags.some((t) => t.toLowerCase().includes(q)));

      const matchesStatus = selectedStatus === 'all' || p.status === selectedStatus;
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      const matchesPriority = selectedPriority === 'all' || p.priority === selectedPriority;
      const matchesHealth = selectedHealth === 'all' || p.health === selectedHealth;
      const matchesManager = selectedManager === 'all' || p.projectManager === selectedManager;

      let matchesQuick = true;
      if (quickFilter === 'running') matchesQuick = p.status === 'In Progress';
      else if (quickFilter === 'completed') matchesQuick = p.status === 'Completed';
      else if (quickFilter === 'at_risk') matchesQuick = p.health === 'At Risk' || p.health === 'Critical' || p.status === 'Delayed';

      return (
        matchesSearch &&
        matchesStatus &&
        matchesCategory &&
        matchesPriority &&
        matchesHealth &&
        matchesManager &&
        matchesQuick
      );
    });

    return list.sort((a, b) => {
      switch (sortBy) {
        case 'deadline-asc':
          return a.deadline.localeCompare(b.deadline);
        case 'deadline-desc':
          return b.deadline.localeCompare(a.deadline);
        case 'progress-desc':
          return b.progress - a.progress;
        case 'budget-desc':
          return b.budget - a.budget;
        case 'name-asc':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
  }, [
    visibleProjects,
    searchQuery,
    selectedStatus,
    selectedCategory,
    selectedPriority,
    selectedHealth,
    selectedManager,
    sortBy,
    quickFilter,
  ]);

  // Multi-selection handlers
  const isAllSelected =
    filteredProjects.length > 0 &&
    filteredProjects.every((p) => selectedProjectIds.includes(p.id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedProjectIds([]);
    } else {
      setSelectedProjectIds(filteredProjects.map((p) => p.id));
    }
  };

  const handleToggleSelectProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedProjectIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBulkComplete = () => {
    setProjects((prev) => {
      const next = prev.map((p) =>
        selectedProjectIds.includes(p.id)
          ? {
              ...p,
              status: 'Completed' as ProjectStatus,
              progress: 100,
              completedTasks: p.totalTasks,
              milestones: (p.milestones || []).map((m) => ({ ...m, completed: true })),
            }
          : p
      );
      try {
        localStorage.setItem('ozostack_projects', JSON.stringify(next));
      } catch (err) {
        console.error('Failed to save projects', err);
      }
      return next;
    });

    selectedProjectIds.forEach((pid) => {
      logProjectActivity(
        pid,
        'status_change',
        'Batch action: Marked project as Completed (100% deliverables reached)',
        'In Progress',
        'Completed'
      );
    });

    showToast(`Marked ${selectedProjectIds.length} projects as completed.`);
    setSelectedProjectIds([]);
  };

  const handleBulkStatusChange = (newStatus: ProjectStatus) => {
    setProjects((prev) => {
      const next = prev.map((p) => (selectedProjectIds.includes(p.id) ? { ...p, status: newStatus } : p));
      try {
        localStorage.setItem('ozostack_projects', JSON.stringify(next));
      } catch (err) {
        console.error('Failed to save projects', err);
      }
      return next;
    });

    selectedProjectIds.forEach((pid) => {
      logProjectActivity(
        pid,
        'status_change',
        `Batch action: Lifecycle stage transitioned to ${newStatus}`,
        undefined,
        newStatus
      );
    });

    showToast(`Updated ${selectedProjectIds.length} projects to ${newStatus}.`);
    setSelectedProjectIds([]);
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Delete ${selectedProjectIds.length} selected projects?`)) {
      setProjects((prev) => {
        const next = prev.filter((p) => !selectedProjectIds.includes(p.id));
        try {
          localStorage.setItem('ozostack_projects', JSON.stringify(next));
        } catch (err) {
          console.error('Failed to save projects', err);
        }
        return next;
      });
      showToast(`${selectedProjectIds.length} projects deleted.`);
      setSelectedProjectIds([]);
    }
  };

  // CRUD Operations
  const handleSaveProject = (project: Project) => {
    if (projectToEdit) {
      const oldProj = projects.find((p) => p.id === project.id);
      setProjects((prev) => {
        const next = prev.map((p) => (p.id === project.id ? project : p));
        try {
          localStorage.setItem('ozostack_projects', JSON.stringify(next));
        } catch (err) {
          console.error('Failed to save projects', err);
        }
        return next;
      });
      if (selectedDrawerProject?.id === project.id) {
        setSelectedDrawerProject(project);
      }
      showToast(`Project "${project.name}" updated.`);

      // Log activity for edits
      if (oldProj) {
        if (oldProj.status !== project.status) {
          logProjectActivity(
            project.id,
            'status_change',
            `Project status updated via editor from ${oldProj.status} to ${project.status}`,
            oldProj.status,
            project.status
          );
        } else if (oldProj.health !== project.health) {
          logProjectActivity(
            project.id,
            'health',
            `Project health updated from ${oldProj.health} to ${project.health}`,
            oldProj.health,
            project.health
          );
        } else if (oldProj.budget !== project.budget) {
          logProjectActivity(
            project.id,
            'budget',
            `Budget allocation adjusted to ${currency.symbol}${project.budget.toLocaleString()}`,
            `${currency.symbol}${oldProj.budget.toLocaleString()}`,
            `${currency.symbol}${project.budget.toLocaleString()}`
          );
        } else {
          logProjectActivity(
            project.id,
            'note',
            `Project details & metadata updated by Sayed (CEO)`
          );
        }
      }
    } else {
      setProjects((prev) => {
        const next = [project, ...prev];
        try {
          localStorage.setItem('ozostack_projects', JSON.stringify(next));
        } catch (err) {
          console.error('Failed to save projects', err);
        }
        return next;
      });
      showToast(`New project "${project.name}" launched.`);
      logProjectActivity(
        project.id,
        'status_change',
        `New project "${project.name}" initialized in ${project.status} stage with ${currency.symbol}${project.budget.toLocaleString()} budget ceiling`,
        undefined,
        project.status
      );
    }
  };

  const handleDeleteProject = (projectId: string, projectName: string) => {
    setProjects((prev) => {
      const next = prev.filter((p) => p.id !== projectId);
      try {
        localStorage.setItem('ozostack_projects', JSON.stringify(next));
      } catch (err) {
        console.error('Failed to save projects', err);
      }
      return next;
    });
    showToast(`Project "${projectName}" deleted.`);
    if (selectedDrawerProject?.id === projectId) {
      setIsDrawerOpen(false);
      setSelectedDrawerProject(null);
    }
  };

  const handleUpdateProjectFromDrawer = (updated: Project) => {
    setProjects((prev) => {
      const next = prev.map((p) => (p.id === updated.id ? updated : p));
      try {
        localStorage.setItem('ozostack_projects', JSON.stringify(next));
      } catch (err) {
        console.error('Failed to save projects', err);
      }
      return next;
    });
    setSelectedDrawerProject(updated);
  };

  const handleProjectStatusChange = (
    projectId: string,
    newStatus: ProjectStatus,
    e?: React.MouseEvent | React.ChangeEvent<HTMLSelectElement>
  ) => {
    if (e) e.stopPropagation();
    const targetProject = projects.find((p) => p.id === projectId);
    const prevStatus = targetProject?.status;

    setProjects((prev) => {
      const next = prev.map((p) => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          status: newStatus,
          progress:
            newStatus === 'Completed'
              ? 100
              : p.progress === 100
              ? 90
              : p.progress,
          completedTasks: newStatus === 'Completed' ? p.totalTasks : p.completedTasks,
        };
      });
      try {
        localStorage.setItem('ozostack_projects', JSON.stringify(next));
      } catch (err) {
        console.error('Failed to save projects', err);
      }
      return next;
    });

    if (targetProject && prevStatus !== newStatus) {
      logProjectActivity(
        projectId,
        'status_change',
        `Lifecycle stage transitioned to ${newStatus}`,
        prevStatus,
        newStatus
      );
    }
    showToast(`Updated status to ${newStatus}`);
  };

  // Drag and Drop handlers for Kanban Board
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedProjectId(id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedProjectId(null);
    setDragOverStatus(null);
  };

  const handleDragOverColumn = (e: React.DragEvent, status: ProjectStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStatus !== status) {
      setDragOverStatus(status);
    }
  };

  const handleDragLeaveColumn = (e: React.DragEvent, status: ProjectStatus) => {
    if (dragOverStatus === status) {
      setDragOverStatus(null);
    }
  };

  const handleDropOnColumn = (e: React.DragEvent, targetStatus: ProjectStatus) => {
    e.preventDefault();
    setDragOverStatus(null);
    const id = e.dataTransfer.getData('text/plain') || draggedProjectId;
    if (!id) return;

    const targetProject = projects.find((p) => p.id === id);
    if (!targetProject || targetProject.status === targetStatus) return;

    const prevStatus = targetProject.status;
    const updated: Project = {
      ...targetProject,
      status: targetStatus,
      progress:
        targetStatus === 'Completed'
          ? 100
          : targetProject.progress === 100
          ? 90
          : targetProject.progress,
      completedTasks:
        targetStatus === 'Completed' ? targetProject.totalTasks : targetProject.completedTasks,
    };

    setProjects((prev) => {
      const next = prev.map((p) => (p.id === id ? updated : p));
      try {
        localStorage.setItem('ozostack_projects', JSON.stringify(next));
      } catch (err) {
        console.error('Failed to save projects', err);
      }
      return next;
    });

    logProjectActivity(
      id,
      'status_change',
      `Kanban board card moved from ${prevStatus} to ${targetStatus}`,
      prevStatus,
      targetStatus
    );

    showToast(`Moved "${targetProject.name}" to ${targetStatus}`);
    setDraggedProjectId(null);
  };

  // CSV Export
  const handleExportCSV = (selectedOnly = false) => {
    const listToExport = selectedOnly
      ? projects.filter((p) => selectedProjectIds.includes(p.id))
      : filteredProjects;

    const headers = [
      'Project Name',
      'Client',
      'Category',
      'Status',
      'Priority',
      'Health',
      'Progress %',
      'Budget',
      'Spent',
      'Manager',
      'Kickoff Date',
      'Deadline',
      'Total Tasks',
      'Completed Tasks',
      'Open Bugs',
    ];

    const rows = listToExport.map((p) => [
      `"${p.name}"`,
      `"${p.client}"`,
      `"${p.category}"`,
      `"${p.status}"`,
      `"${p.priority}"`,
      `"${p.health}"`,
      `${p.progress}%`,
      p.budget,
      p.spent,
      `"${p.projectManager}"`,
      `"${p.startDate}"`,
      `"${p.deadline}"`,
      p.totalTasks,
      p.completedTasks,
      p.openBugs,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Projects_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Exported ${listToExport.length} project records.`);
  };

  const getStatusColor = (s: ProjectStatus) => {
    switch (s) {
      case 'In Progress':
        return 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-300 dark:border-sky-800';
      case 'Completed':
        return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800';
      case 'Delayed':
        return 'bg-rose-500 text-white font-bold animate-pulse';
      case 'On Hold':
        return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-800';
      case 'Planning':
        return 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-300 dark:border-purple-800';
    }
  };

  const getHealthBadge = (h: ProjectHealth) => {
    switch (h) {
      case 'Good':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">● Good</span>;
      case 'At Risk':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">▲ At Risk</span>;
      case 'Critical':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400">✕ Critical</span>;
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
              <span>Engineering Projects & Delivery</span>
              <span className="text-xs bg-sky-500/15 text-sky-600 dark:text-sky-400 font-bold px-2 py-0.5 rounded-full">
                {projects.length} Total Projects
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Active Delivery: <span className="font-bold text-sky-500">{metrics.runningCount} Running</span> · Contracted Budget: <span className="font-bold text-emerald-500">{currency.symbol}{metrics.totalBudget.toLocaleString()}</span> · Average Progress: <span className="font-bold text-indigo-500">{metrics.avgProgress}%</span>
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
            title="Download CSV Projects Report"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Export CSV</span>
          </button>

          <button
            onClick={() => {
              setProjectToEdit(null);
              setIsProjectModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-sky-500 hover:bg-sky-600 text-white shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* 2. SENIOR EXECUTIVE KPI RIBBON */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Active Projects */}
        <div
          onClick={() => setQuickFilter(quickFilter === 'running' ? 'all' : 'running')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            quickFilter === 'running'
              ? 'ring-2 ring-sky-500 border-sky-400 shadow-md'
              : 'hover:border-sky-300'
          } ${cardBg}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Active Delivery
            </span>
            <div className="p-1.5 rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-400">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-extrabold text-sky-600 dark:text-sky-400 tabular-nums">
              {metrics.runningCount}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">in-flight projects</span>
          </div>
        </div>

        {/* Completed Projects */}
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
              Delivered
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-extrabold text-emerald-500 tabular-nums">
              {metrics.completedCount}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">completed handover</span>
          </div>
        </div>

        {/* At Risk / Delayed */}
        <div
          onClick={() => setQuickFilter(quickFilter === 'at_risk' ? 'all' : 'at_risk')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            quickFilter === 'at_risk'
              ? 'ring-2 ring-rose-500 border-rose-400 shadow-md'
              : 'hover:border-rose-300'
          } ${cardBg}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              At Risk / Attention
            </span>
            <div className="p-1.5 rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-extrabold text-rose-600 dark:text-rose-400 tabular-nums">
              {metrics.atRiskCount}
            </span>
            <span className="text-[11px] text-rose-500 font-medium">requires intervention</span>
          </div>
        </div>

        {/* Total Project Budget */}
        <div
          onClick={() => setQuickFilter('all')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer hover:border-indigo-300 ${cardBg}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Budget
            </span>
            <div className="p-1.5 rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 tabular-nums">
              {currency.symbol}{metrics.totalBudget.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">({currency.symbol}{metrics.totalSpent.toLocaleString()} spent)</span>
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
            placeholder="Search project, client, manager..."
            className={`w-full text-xs pl-9 pr-3 py-2 rounded-lg border outline-none font-medium ${
              isLight
                ? 'bg-sky-50/40 border-sky-200 text-slate-800 focus:border-sky-500'
                : 'bg-slate-900 border-slate-700 text-white focus:border-sky-400'
            }`}
          />
        </div>

        {/* Filters & Controls */}
        <div className="flex items-center gap-2 w-full lg:w-auto flex-wrap justify-end text-xs">
          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className={`text-xs px-2.5 py-1.5 rounded-lg border outline-none font-medium cursor-pointer ${
              isLight ? 'bg-white border-sky-200 text-slate-700' : 'bg-slate-800 border-slate-700 text-slate-200'
            }`}
          >
            <option value="all">All Statuses</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="On Hold">On Hold</option>
            <option value="Delayed">Delayed</option>
            <option value="Planning">Planning</option>
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className={`text-xs px-2.5 py-1.5 rounded-lg border outline-none font-medium cursor-pointer ${
              isLight ? 'bg-white border-sky-200 text-slate-700' : 'bg-slate-800 border-slate-700 text-slate-200'
            }`}
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
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
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {/* Health Filter */}
          <select
            value={selectedHealth}
            onChange={(e) => setSelectedHealth(e.target.value)}
            className={`text-xs px-2.5 py-1.5 rounded-lg border outline-none font-medium cursor-pointer ${
              isLight ? 'bg-white border-sky-200 text-slate-700' : 'bg-slate-800 border-slate-700 text-slate-200'
            }`}
          >
            <option value="all">All Health</option>
            <option value="Good">Good</option>
            <option value="At Risk">At Risk</option>
            <option value="Critical">Critical</option>
          </select>

          {/* Manager Filter */}
          <select
            value={selectedManager}
            onChange={(e) => setSelectedManager(e.target.value)}
            className={`text-xs px-2.5 py-1.5 rounded-lg border outline-none font-medium cursor-pointer ${
              isLight ? 'bg-white border-sky-200 text-slate-700' : 'bg-slate-800 border-slate-700 text-slate-200'
            }`}
          >
            <option value="all">All Managers</option>
            {managers.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 pl-1">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as ProjectSortOption)}
              className={`text-xs px-2.5 py-1.5 rounded-lg border outline-none font-medium cursor-pointer ${
                isLight ? 'bg-white border-sky-200 text-slate-700' : 'bg-slate-800 border-slate-700 text-slate-200'
              }`}
            >
              <option value="deadline-asc">Deadline (Earliest)</option>
              <option value="deadline-desc">Deadline (Latest)</option>
              <option value="progress-desc">Progress (Highest)</option>
              <option value="budget-desc">Budget (Highest)</option>
              <option value="name-asc">Name (A-Z)</option>
            </select>
          </div>

          {/* View Toggle */}
          <div className="flex items-center p-0.5 rounded-lg border border-sky-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
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
          </div>
        </div>
      </div>

      {/* 4. FLOATING BULK ACTIONS BAR */}
      {selectedProjectIds.length > 0 && (
        <div className="p-3 rounded-xl border border-sky-300 bg-sky-50 dark:bg-slate-800/90 dark:border-sky-500/30 text-xs shadow-md animate-fade-in flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sky-700 dark:text-sky-300 px-2 py-0.5 rounded-md bg-sky-500/10">
              {selectedProjectIds.length} Projects Selected
            </span>
            <button
              onClick={() => setSelectedProjectIds([])}
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
              onClick={() => handleBulkStatusChange('On Hold')}
              className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-semibold hover:text-amber-500"
            >
              Set On Hold
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

      {/* 5. VIEW 1: GRID VIEW */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredProjects.map((project) => {
            const isSelected = selectedProjectIds.includes(project.id);
            const spentPct = project.budget > 0 ? Math.min(100, Math.round((project.spent / project.budget) * 100)) : 0;

            return (
              <div
                key={project.id}
                onClick={() => {
                  setSelectedDrawerProject(project);
                  setIsDrawerOpen(true);
                }}
                className={`p-4 rounded-xl border transition-all duration-200 hover:shadow-md cursor-pointer group flex flex-col justify-between ${
                  isSelected
                    ? 'border-sky-400 bg-sky-50/40 dark:bg-sky-950/20 ring-1 ring-sky-400'
                    : cardBg
                }`}
              >
                <div>
                  {/* Card Top: Checkbox, Status & Health */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleToggleSelectProject(project.id, e)}
                        className="text-slate-400 hover:text-sky-500 transition-colors"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-sky-500" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                        )}
                      </button>
                      <select
                        value={project.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => handleProjectStatusChange(project.id, e.target.value as ProjectStatus, e)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border outline-none cursor-pointer ${getStatusColor(project.status)}`}
                        title="Click to change status"
                      >
                        <option value="Planning">Planning</option>
                        <option value="In Progress">In Progress</option>
                        <option value="On Hold">On Hold</option>
                        <option value="Delayed">Delayed</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {getHealthBadge(project.health)}
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          project.priority === 'Critical'
                            ? 'bg-rose-500/15 text-rose-600'
                            : project.priority === 'High'
                            ? 'bg-amber-500/15 text-amber-600'
                            : 'bg-slate-500/15 text-slate-500'
                        }`}
                      >
                        {project.priority}
                      </span>
                    </div>
                  </div>

                  {/* Project Name & Client */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-400 to-indigo-600 text-white flex items-center justify-center font-extrabold text-sm shadow-xs shrink-0">
                      <FolderKanban className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-sky-500 transition-colors truncate">
                        {project.name}
                      </h3>
                      <p className="text-[11px] text-sky-600 dark:text-sky-400 font-semibold truncate mt-0.5">
                        {project.client} · <span className="text-slate-400 font-normal">{project.category}</span>
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                      <span className="text-slate-400">Progress</span>
                      <span className="text-sky-600 dark:text-sky-400">{project.progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          project.progress === 100
                            ? 'bg-emerald-500'
                            : project.status === 'Delayed'
                            ? 'bg-rose-500'
                            : 'bg-gradient-to-r from-sky-400 to-indigo-500'
                        }`}
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                      <span>{project.completedTasks}/{project.totalTasks} tasks</span>
                      {project.openBugs > 0 ? (
                        <span className="text-rose-500 font-semibold">{project.openBugs} open bugs</span>
                      ) : (
                        <span>0 bugs</span>
                      )}
                    </div>
                  </div>

                  {/* Financials & Deadline */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-sky-50/40 dark:bg-slate-800/40 text-xs mb-3">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Contract Budget</span>
                      <span className="font-extrabold text-emerald-500 tabular-nums">
                        {currency.symbol}{project.budget.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Target Deadline</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                        {project.deadline}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Manager & Actions */}
                <div className="pt-2 border-t border-sky-100/30 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium truncate">
                    <User className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{project.projectManager}</span>
                  </span>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setProjectToEdit(project);
                        setIsProjectModalOpen(true);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors"
                      title="Edit Project"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete project "${project.name}"?`)) {
                          handleDeleteProject(project.id, project.name);
                        }
                      }}
                      className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                      title="Delete Project"
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

      {/* 6. VIEW 2: KANBAN BOARD VIEW */}
      {viewMode === 'kanban' && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-3.5 items-start min-w-max">
            {PROJECT_KANBAN_STATUSES.map((status) => {
              const statusProjects = filteredProjects.filter((p) => p.status === status);
              const statusBudget = statusProjects.reduce((acc, p) => acc + p.budget, 0);
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
                      <span className="font-extrabold text-xs uppercase tracking-tight text-slate-800 dark:text-slate-100 truncate">
                        {status}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-300 shrink-0">
                        {statusProjects.length}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <div className="text-xs font-extrabold text-emerald-500 tabular-nums">
                          {currency.symbol}{statusBudget.toLocaleString()}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setProjectToEdit(null);
                          setIsProjectModalOpen(true);
                        }}
                        className="p-1 text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-slate-800 rounded transition-colors"
                        title={`Create project in ${status}`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Drop zone indicator when dragging */}
                  {isDragOver && (
                    <div className="mb-2 py-2 text-center text-[10px] font-bold text-sky-600 dark:text-sky-400 bg-sky-100/80 dark:bg-sky-900/40 border border-dashed border-sky-400 rounded-lg animate-pulse">
                      Drop project here to move to {status}
                    </div>
                  )}

                  {/* Cards Container */}
                  <div className="space-y-3 flex-1 overflow-y-auto pr-0.5">
                    {statusProjects.map((project) => {
                      const isBeingDragged = draggedProjectId === project.id;
                      const isSelected = selectedProjectIds.includes(project.id);

                      return (
                        <div
                          key={project.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, project.id)}
                          onDragEnd={handleDragEnd}
                          onClick={() => {
                            setSelectedDrawerProject(project);
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
                            {/* Card Top: Select checkbox & Priority / Health badges */}
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={(e) => handleToggleSelectProject(project.id, e)}
                                  className="text-slate-400 hover:text-sky-500 transition-colors"
                                >
                                  {isSelected ? (
                                    <CheckSquare className="w-4 h-4 text-sky-500" />
                                  ) : (
                                    <Square className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                                  )}
                                </button>
                                {getHealthBadge(project.health)}
                              </div>
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                  project.priority === 'Critical'
                                    ? 'bg-rose-500/15 text-rose-600'
                                    : project.priority === 'High'
                                    ? 'bg-amber-500/15 text-amber-600'
                                    : 'bg-slate-500/15 text-slate-500'
                                }`}
                              >
                                {project.priority}
                              </span>
                            </div>

                            {/* Project Name & Client */}
                            <div className="mb-2.5">
                              <h4 className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-sky-500 transition-colors line-clamp-1">
                                {project.name}
                              </h4>
                              <p className="text-[11px] text-sky-600 dark:text-sky-400 font-semibold truncate mt-0.5">
                                {project.client} · <span className="text-slate-400 font-normal">{project.category}</span>
                              </p>
                            </div>

                            {/* Progress Bar */}
                            <div className="mb-2.5">
                              <div className="flex items-center justify-between text-[10px] font-bold mb-1">
                                <span className="text-slate-400">Progress</span>
                                <span className="text-sky-600 dark:text-sky-400">{project.progress}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    project.progress === 100
                                      ? 'bg-emerald-500'
                                      : project.status === 'Delayed'
                                      ? 'bg-rose-500'
                                      : 'bg-gradient-to-r from-sky-400 to-indigo-500'
                                  }`}
                                  style={{ width: `${project.progress}%` }}
                                />
                              </div>
                              <div className="flex items-center justify-between mt-1 text-[9px] text-slate-400">
                                <span>{project.completedTasks}/{project.totalTasks} tasks</span>
                                {project.openBugs > 0 ? (
                                  <span className="text-rose-500 font-semibold">{project.openBugs} bugs</span>
                                ) : (
                                  <span>0 bugs</span>
                                )}
                              </div>
                            </div>

                            {/* Budget & Target Deadline */}
                            <div className="flex items-center justify-between text-[11px] p-2 rounded-lg bg-sky-50/40 dark:bg-slate-800/40 mb-2">
                              <div>
                                <span className="text-[9px] text-slate-400 uppercase font-bold block">Budget</span>
                                <span className="font-extrabold text-emerald-500 tabular-nums">
                                  {currency.symbol}{project.budget.toLocaleString()}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-[9px] text-slate-400 uppercase font-bold block">Deadline</span>
                                <span className="font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                                  {project.deadline}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Card Footer: PM & Actions */}
                          <div className="pt-2 border-t border-sky-100/30 flex items-center justify-between text-[10px]">
                            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium truncate max-w-[130px]">
                              <User className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{project.projectManager}</span>
                            </span>

                            <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => {
                                  setSelectedDrawerProject(project);
                                  setIsDrawerOpen(true);
                                }}
                                className="p-1 rounded text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors"
                                title="Inspect Details"
                              >
                                <FolderKanban className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setProjectToEdit(project);
                                  setIsProjectModalOpen(true);
                                }}
                                className="p-1 rounded text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors"
                                title="Edit Project"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Delete project "${project.name}"?`)) {
                                    handleDeleteProject(project.id, project.name);
                                  }
                                }}
                                className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                                title="Delete Project"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {statusProjects.length === 0 && (
                      <div className="py-8 text-center text-[11px] text-slate-400 border border-dashed rounded-lg border-sky-100/60 dark:border-slate-800">
                        No projects in {status}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 7. VIEW 3: TABLE VIEW */}
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
                  <th className="py-3 px-3">Project & Client</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Health</th>
                  <th className="py-3 px-3">Progress</th>
                  <th className="py-3 px-3">Budget / Spent</th>
                  <th className="py-3 px-3">Manager</th>
                  <th className="py-3 px-3">Deadline</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-100/20 dark:divide-slate-800">
                {filteredProjects.map((project) => {
                  const isSelected = selectedProjectIds.includes(project.id);

                  return (
                    <tr
                      key={project.id}
                      onClick={() => {
                        setSelectedDrawerProject(project);
                        setIsDrawerOpen(true);
                      }}
                      className={`hover:bg-sky-50/40 dark:hover:bg-slate-800/40 transition-colors cursor-pointer ${
                        isSelected ? 'bg-sky-50/50 dark:bg-sky-950/20' : ''
                      }`}
                    >
                      <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleToggleSelectProject(project.id, e)}
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
                            <FolderKanban className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 dark:text-white hover:text-sky-500 transition-colors block">
                              {project.name}
                            </span>
                            <span className="text-[11px] text-sky-600 dark:text-sky-400 font-medium">
                              {project.client}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                        {project.category}
                      </td>

                      <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={project.status}
                          onChange={(e) => handleProjectStatusChange(project.id, e.target.value as ProjectStatus, e)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border outline-none cursor-pointer ${getStatusColor(project.status)}`}
                          title="Click to update status"
                        >
                          <option value="Planning">Planning</option>
                          <option value="In Progress">In Progress</option>
                          <option value="On Hold">On Hold</option>
                          <option value="Delayed">Delayed</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </td>

                      <td className="py-3 px-3">
                        {getHealthBadge(project.health)}
                      </td>

                      <td className="py-3 px-3 w-36">
                        <div className="flex items-center justify-between text-[10px] font-bold mb-1">
                          <span className="text-sky-600 dark:text-sky-400">{project.progress}%</span>
                          <span className="text-slate-400">{project.completedTasks}/{project.totalTasks}</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              project.progress === 100
                                ? 'bg-emerald-500'
                                : 'bg-gradient-to-r from-sky-400 to-indigo-500'
                            }`}
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-bold text-emerald-500 block">
                          {currency.symbol}{project.budget.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {currency.symbol}{project.spent.toLocaleString()} spent
                        </span>
                      </td>

                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300 font-medium">
                        {project.projectManager}
                      </td>

                      <td className="py-3 px-3 tabular-nums font-semibold text-slate-600 dark:text-slate-300">
                        {project.deadline}
                      </td>

                      <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setSelectedDrawerProject(project);
                              setIsDrawerOpen(true);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors"
                            title="Inspect Details"
                          >
                            <FolderKanban className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setProjectToEdit(project);
                              setIsProjectModalOpen(true);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors"
                            title="Edit Project"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete project "${project.name}"?`)) {
                                handleDeleteProject(project.id, project.name);
                              }
                            }}
                            className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                            title="Delete Project"
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

          {filteredProjects.length === 0 && (
            <div className="text-center py-12">
              <FolderKanban className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-60" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
                No matching projects found
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Try adjusting your search criteria or create a new engineering project.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedStatus('all');
                  setSelectedCategory('all');
                  setSelectedPriority('all');
                  setSelectedHealth('all');
                  setSelectedManager('all');
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

      {/* 7. MODALS & DRAWER */}
      {/* Side Details Drawer */}
      {isDrawerOpen && selectedDrawerProject && (
        <ProjectDetailsDrawer
          isOpen={isDrawerOpen}
          onClose={() => {
            setIsDrawerOpen(false);
            setSelectedDrawerProject(null);
          }}
          project={selectedDrawerProject}
          onEdit={(proj) => {
            setIsDrawerOpen(false);
            setProjectToEdit(proj);
            setIsProjectModalOpen(true);
          }}
          onDelete={handleDeleteProject}
          onUpdateProject={handleUpdateProjectFromDrawer}
          activities={projectActivities}
          onLogActivity={logProjectActivity}
        />
      )}

      {/* Create / Edit Project Modal */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onSave={handleSaveProject}
        projectToEdit={projectToEdit}
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

