import React, { useState, useMemo } from 'react';
import {
  X,
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
  Plus,
  Bug,
  Check,
  AlertCircle,
  ExternalLink,
  Activity,
  Send,
  ArrowRightLeft,
  MessageSquare,
  Search,
} from 'lucide-react';
import {
  Project,
  ProjectMilestone,
  ProjectTaskItem,
  ProjectStatus,
  ProjectPriority,
  ProjectHealth,
  ProjectActivity,
  ProjectActivityType,
} from '../../types/crm';
import { useTheme } from '../../context/ThemeContext';
import { useSystemCurrency } from '../../data/currencyService';

const GPU_PIPELINE_TASKS: ProjectTaskItem[] = [
  // 5 Remaining in-flight tasks
  { id: 't-rem-1', title: 'Global Edge Anycast BGP Routing & Cloudflare Tunnel', assignee: 'Rizwan Khan', priority: 'Urgent', status: 'In Progress', dueDate: '2025-06-12', completed: false },
  { id: 't-rem-2', title: 'KV Cache Paged Attention Dynamic Defragmentation', assignee: 'Sayed (CEO)', priority: 'High', status: 'In Progress', dueDate: '2025-06-08', completed: false },
  { id: 't-rem-3', title: 'NVIDIA Triton Multi-Model Concurrency Load Testing', assignee: 'Rizwan Khan', priority: 'High', status: 'To Do', dueDate: '2025-06-05', completed: false },
  { id: 't-rem-4', title: 'Sub-30ms P99 Latency SLA Telemetry & Prometheus Alerts', assignee: 'Rizwan Khan', priority: 'Medium', status: 'To Do', dueDate: '2025-06-10', completed: false },
  { id: 't-rem-5', title: 'Client API Key Rate Limiting & Stripe Webhook Emission', assignee: 'Sayed (CEO)', priority: 'High', status: 'In Review', dueDate: '2025-06-14', completed: false },
  // 25 Completed deliverables
  { id: 't-comp-1', title: 'TensorRT-LLM FP8 & INT4 Quantization Matrix Build', assignee: 'Rizwan Khan', priority: 'Urgent', status: 'Completed', dueDate: '2025-04-02', completed: true },
  { id: 't-comp-2', title: 'vLLM Streaming SSE Server on 8x NVIDIA H100 Cluster', assignee: 'Sayed (CEO)', priority: 'Urgent', status: 'Completed', dueDate: '2025-04-06', completed: true },
  { id: 't-comp-3', title: 'CUDA Graph Execution Engine for Static Sequence Lengths', assignee: 'Rizwan Khan', priority: 'High', status: 'Completed', dueDate: '2025-04-09', completed: true },
  { id: 't-comp-4', title: 'Continuous Batching Scheduler with Dynamic Queueing', assignee: 'Sayed (CEO)', priority: 'Urgent', status: 'Completed', dueDate: '2025-04-12', completed: true },
  { id: 't-comp-5', title: 'FastAPI High-Throughput Streaming Webhook Gateway', assignee: 'Rizwan Khan', priority: 'High', status: 'Completed', dueDate: '2025-04-15', completed: true },
  { id: 't-comp-6', title: 'Docker Image with NVIDIA Container Toolkit & CUDA 12.4', assignee: 'Rizwan Khan', priority: 'Medium', status: 'Completed', dueDate: '2025-04-18', completed: true },
  { id: 't-comp-7', title: 'Prometheus DCGM Exporter for GPU Memory & SM Utilization', assignee: 'Sayed (CEO)', priority: 'Medium', status: 'Completed', dueDate: '2025-04-20', completed: true },
  { id: 't-comp-8', title: 'Automated Worker Process Recycling on Out-Of-Memory (OOM)', assignee: 'Rizwan Khan', priority: 'High', status: 'Completed', dueDate: '2025-04-23', completed: true },
  { id: 't-comp-9', title: 'Mutual TLS (mTLS) Encryption Between Edge and Model Fleet', assignee: 'Sayed (CEO)', priority: 'High', status: 'Completed', dueDate: '2025-04-26', completed: true },
  { id: 't-comp-10', title: 'Token Chunking Buffer with Backpressure Flow Control', assignee: 'Rizwan Khan', priority: 'Medium', status: 'Completed', dueDate: '2025-04-28', completed: true },
  { id: 't-comp-11', title: 'Weight Sharding Across Dual-Node NVLink Interconnects', assignee: 'Sayed (CEO)', priority: 'Urgent', status: 'Completed', dueDate: '2025-05-01', completed: true },
  { id: 't-comp-12', title: 'Cold-Start Model Weight Pre-Loading from NVMe Cache', assignee: 'Rizwan Khan', priority: 'High', status: 'Completed', dueDate: '2025-05-03', completed: true },
  { id: 't-comp-13', title: 'Horovod Distributed Evaluation for Output Token Parity', assignee: 'Sayed (CEO)', priority: 'Medium', status: 'Completed', dueDate: '2025-05-05', completed: true },
  { id: 't-comp-14', title: 'Dynamic Prefix Caching for Multi-Turn System Prompts', assignee: 'Rizwan Khan', priority: 'High', status: 'Completed', dueDate: '2025-05-07', completed: true },
  { id: 't-comp-15', title: 'JSON Schema Structured Output Enforcer in C++ Engine', assignee: 'Sayed (CEO)', priority: 'High', status: 'Completed', dueDate: '2025-05-09', completed: true },
  { id: 't-comp-16', title: 'Zero-Copy Shared Memory Inter-Process Transport', assignee: 'Rizwan Khan', priority: 'Urgent', status: 'Completed', dueDate: '2025-05-11', completed: true },
  { id: 't-comp-17', title: 'Automated Failover Routing on Unhealthy GPU Node', assignee: 'Sayed (CEO)', priority: 'High', status: 'Completed', dueDate: '2025-05-13', completed: true },
  { id: 't-comp-18', title: 'TCP Keep-Alive Kernel Tuning for Long-Lived LLM Streams', assignee: 'Rizwan Khan', priority: 'Medium', status: 'Completed', dueDate: '2025-05-15', completed: true },
  { id: 't-comp-19', title: 'Token Usage Accounting & Tenant Metering Engine', assignee: 'Sayed (CEO)', priority: 'High', status: 'Completed', dueDate: '2025-05-17', completed: true },
  { id: 't-comp-20', title: 'Benchmark Load Generator Script with Synthetic Prompts', assignee: 'Rizwan Khan', priority: 'Medium', status: 'Completed', dueDate: '2025-05-18', completed: true },
  { id: 't-comp-21', title: 'Grafana Latency Dashboard for CloudNest Operations Team', assignee: 'Sayed (CEO)', priority: 'Low', status: 'Completed', dueDate: '2025-05-19', completed: true },
  { id: 't-comp-22', title: 'OpenTelemetry Trace Propagation Across Microservices', assignee: 'Rizwan Khan', priority: 'Medium', status: 'Completed', dueDate: '2025-05-20', completed: true },
  { id: 't-comp-23', title: 'Automated CI/CD Regression Tests on PR Merges', assignee: 'Sayed (CEO)', priority: 'Medium', status: 'Completed', dueDate: '2025-05-21', completed: true },
  { id: 't-comp-24', title: 'Disaster Recovery Warm Standby Replication in EU Central', assignee: 'Rizwan Khan', priority: 'High', status: 'Completed', dueDate: '2025-05-22', completed: true },
  { id: 't-comp-25', title: 'CloudNest CTO Stage 2 Architecture Sign-off & Audit', assignee: 'Sayed (CEO)', priority: 'Urgent', status: 'Completed', dueDate: '2025-05-23', completed: true },
];

const getInitialProjectTasks = (proj: Project): ProjectTaskItem[] => {
  if (proj.tasks && proj.tasks.length > 0) {
    return proj.tasks;
  }
  if (proj.id === 'proj-4' || proj.name?.includes('GPU Latency')) {
    return GPU_PIPELINE_TASKS;
  }
  const total = Math.max(proj.totalTasks || 0, 1);
  const completed = Math.min(proj.completedTasks || 0, total);
  const remaining = total - completed;
  const list: ProjectTaskItem[] = [];

  const teamList =
    Array.isArray(proj.team) && proj.team.length > 0
      ? proj.team
      : [proj.projectManager || 'Sayed (CEO)'];

  for (let i = 1; i <= remaining; i++) {
    const member = teamList[i % teamList.length];
    list.push({
      id: `task-rem-${proj.id}-${i}`,
      title: `${proj.name || 'Project'} - In-Flight Work Item #${completed + i}`,
      assignee: member,
      status: i === 1 ? 'In Progress' : 'To Do',
      priority: i === 1 ? 'Urgent' : 'High',
      dueDate: proj.deadline || '2025-06-15',
      completed: false,
    });
  }

  for (let i = 1; i <= completed; i++) {
    const member = teamList[i % teamList.length];
    list.push({
      id: `task-comp-${proj.id}-${i}`,
      title: `${proj.name || 'Project'} - Completed Architecture Deliverable #${i}`,
      assignee: member,
      status: 'Completed',
      priority: i % 2 === 0 ? 'High' : 'Medium',
      dueDate: proj.startDate || '2025-03-20',
      completed: true,
    });
  }

  return list;
};

interface ProjectDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  onEdit: (project: Project) => void;
  onDelete: (projectId: string, projectName: string) => void;
  onUpdateProject: (updated: Project) => void;
  activities?: ProjectActivity[];
  onLogActivity?: (
    projectId: string,
    type: ProjectActivityType,
    description: string,
    oldValue?: string,
    newValue?: string
  ) => void;
}

export const ProjectDetailsDrawer: React.FC<ProjectDetailsDrawerProps> = ({
  isOpen,
  onClose,
  project,
  onEdit,
  onDelete,
  onUpdateProject,
  activities = [],
  onLogActivity,
}) => {
  const { theme } = useTheme();
  const currency = useSystemCurrency();
  const isLight = theme === 'white-sky';

  const [activeTab, setActiveTab] = useState<'overview' | 'milestones' | 'tasks' | 'team' | 'activity'>('overview');
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneDate, setNewMilestoneDate] = useState('2025-06-15');
  const [isAddingMilestone, setIsAddingMilestone] = useState(false);

  // Work Items & Tasks State
  const effectiveTasks = useMemo(
    () => (project ? getInitialProjectTasks(project) : []),
    [project?.id, project?.tasks, project?.totalTasks, project?.completedTasks]
  );
  const [taskFilter, setTaskFilter] = useState<'remaining' | 'completed' | 'all'>('remaining');
  const [taskSearchQuery, setTaskSearchQuery] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState(
    project?.team?.[0] || project?.projectManager || 'Rizwan Khan'
  );
  const [newTaskPriority, setNewTaskPriority] = useState<ProjectPriority>('High');
  const [newTaskDueDate, setNewTaskDueDate] = useState(project?.deadline || '2025-06-15');

  const remainingTasks = useMemo(() => effectiveTasks.filter((t) => !t.completed), [effectiveTasks]);
  const completedTasksList = useMemo(() => effectiveTasks.filter((t) => t.completed), [effectiveTasks]);

  const displayedTasks = useMemo(() => {
    let list = effectiveTasks;
    if (taskFilter === 'remaining') {
      list = list.filter((t) => !t.completed);
    } else if (taskFilter === 'completed') {
      list = list.filter((t) => t.completed);
    }
    if (taskSearchQuery.trim()) {
      const q = taskSearchQuery.toLowerCase();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.assignee.toLowerCase().includes(q) ||
          t.priority.toLowerCase().includes(q) ||
          t.status.toLowerCase().includes(q)
      );
    }
    return list;
  }, [effectiveTasks, taskFilter, taskSearchQuery]);

  // Activity logger state
  const [newActivityText, setNewActivityText] = useState('');
  const [newActivityType, setNewActivityType] = useState<ProjectActivityType>('note');
  const [activityFilter, setActivityFilter] = useState<'all' | ProjectActivityType>('all');

  if (!isOpen || !project) return null;

  const projectActivities = activities.filter((a) => a.projectId === project.id);

  const filteredActivities = activityFilter === 'all'
    ? projectActivities
    : projectActivities.filter((a) => a.type === activityFilter);

  const handleToggleTask = (taskId: string) => {
    const target = effectiveTasks.find((t) => t.id === taskId);
    if (!target) return;
    const willBeCompleted = !target.completed;
    const updatedTasks = effectiveTasks.map((t) =>
      t.id === taskId
        ? {
            ...t,
            completed: willBeCompleted,
            status: willBeCompleted ? ('Completed' as const) : ('In Progress' as const),
          }
        : t
    );

    const newCompletedCount = updatedTasks.filter((t) => t.completed).length;
    const newTotal = updatedTasks.length;
    const newProgress = Math.min(100, Math.round((newCompletedCount / newTotal) * 100));

    const updated: Project = {
      ...project,
      tasks: updatedTasks,
      totalTasks: newTotal,
      completedTasks: newCompletedCount,
      progress: newProgress,
      status: newProgress === 100 ? 'Completed' : (project.status === 'Completed' ? 'In Progress' : project.status),
    };

    onUpdateProject(updated);
    onLogActivity?.(
      project.id,
      'task',
      `Task "${target.title}" marked as ${willBeCompleted ? 'Completed' : 'In-Flight'} (${newCompletedCount}/${newTotal} done)`,
      target.completed ? 'Completed' : 'In-Flight',
      willBeCompleted ? 'Completed' : 'In-Flight'
    );
  };

  const handleIncrementTask = () => {
    const nextTask = effectiveTasks.find((t) => !t.completed);
    if (nextTask) {
      handleToggleTask(nextTask.id);
    } else {
      if (project.completedTasks >= project.totalTasks) return;
      const newCompleted = project.completedTasks + 1;
      const newProgress = Math.min(100, Math.round((newCompleted / project.totalTasks) * 100));
      onUpdateProject({
        ...project,
        completedTasks: newCompleted,
        progress: newProgress,
        status: newProgress === 100 ? 'Completed' : project.status,
      });
      onLogActivity?.(
        project.id,
        'task',
        `Task progress completed (+1): ${newCompleted}/${project.totalTasks} tasks done (${newProgress}%)`
      );
    }
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTaskItem: ProjectTaskItem = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      assignee: newTaskAssignee || project?.team?.[0] || project?.projectManager || 'Sayed (CEO)',
      priority: newTaskPriority,
      status: 'To Do',
      dueDate: newTaskDueDate,
      completed: false,
    };

    const updatedTasks = [newTaskItem, ...effectiveTasks];
    const newTotal = updatedTasks.length;
    const newCompletedCount = updatedTasks.filter((t) => t.completed).length;
    const newProgress = Math.round((newCompletedCount / newTotal) * 100);

    const updated: Project = {
      ...project,
      tasks: updatedTasks,
      totalTasks: newTotal,
      completedTasks: newCompletedCount,
      progress: newProgress,
    };

    onUpdateProject(updated);
    onLogActivity?.(
      project.id,
      'task',
      `New work item created: "${newTaskTitle.trim()}" (Assigned: ${newTaskItem.assignee}, Priority: ${newTaskPriority})`
    );

    setNewTaskTitle('');
    setIsAddingTask(false);
  };

  const handleDeleteTask = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const target = effectiveTasks.find((t) => t.id === taskId);
    const updatedTasks = effectiveTasks.filter((t) => t.id !== taskId);
    const newTotal = updatedTasks.length;
    const newCompletedCount = updatedTasks.filter((t) => t.completed).length;
    const newProgress = newTotal > 0 ? Math.round((newCompletedCount / newTotal) * 100) : 0;

    const updated: Project = {
      ...project,
      tasks: updatedTasks,
      totalTasks: newTotal,
      completedTasks: newCompletedCount,
      progress: newProgress,
    };

    onUpdateProject(updated);
    if (target) {
      onLogActivity?.(project.id, 'task', `Task "${target.title}" removed from project`);
    }
  };

  const handleAddWorkItem = () => {
    setIsAddingTask((prev) => !prev);
  };

  const handleToggleMilestone = (milestoneId: string) => {
    const target = (project.milestones || []).find((m) => m.id === milestoneId);
    const updatedMilestones = (project.milestones || []).map((m) =>
      m.id === milestoneId ? { ...m, completed: !m.completed } : m
    );

    // Auto-calculate completed tasks & progress proportionally if milestones exist
    const completedCount = updatedMilestones.filter((m) => m.completed).length;
    const newProgress = updatedMilestones.length > 0
      ? Math.round((completedCount / updatedMilestones.length) * 100)
      : project.progress;

    const updated: Project = {
      ...project,
      milestones: updatedMilestones,
      progress: newProgress,
      status: newProgress === 100 ? 'Completed' : (project.status === 'Completed' ? 'In Progress' : project.status),
    };

    onUpdateProject(updated);
    if (target) {
      onLogActivity?.(
        project.id,
        'milestone',
        `Milestone "${target.title}" marked as ${!target.completed ? 'Completed' : 'Pending'}`
      );
    }
  };

  const handleDeleteMilestone = (milestoneId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const target = (project.milestones || []).find((m) => m.id === milestoneId);
    const updatedMilestones = (project.milestones || []).filter((m) => m.id !== milestoneId);
    const completedCount = updatedMilestones.filter((m) => m.completed).length;
    const newProgress = updatedMilestones.length > 0
      ? Math.round((completedCount / updatedMilestones.length) * 100)
      : project.progress;

    const updated: Project = {
      ...project,
      milestones: updatedMilestones,
      progress: newProgress,
    };
    onUpdateProject(updated);
    if (target) {
      onLogActivity?.(project.id, 'milestone', `Milestone "${target.title}" removed`);
    }
  };

  const handleQuickStatusChange = (newStatus: ProjectStatus) => {
    const oldStatus = project.status;
    const updated: Project = {
      ...project,
      status: newStatus,
      progress: newStatus === 'Completed' ? 100 : (project.progress === 100 ? 90 : project.progress),
    };
    onUpdateProject(updated);
    onLogActivity?.(
      project.id,
      'status_change',
      `Lifecycle stage transitioned from "${oldStatus}" to "${newStatus}"`,
      oldStatus,
      newStatus
    );
  };

  const handleLogBug = () => {
    const newBugs = project.openBugs + 1;
    const newHealth: ProjectHealth = newBugs >= 3 ? 'Critical' : newBugs > 0 ? 'At Risk' : project.health;
    const updated: Project = {
      ...project,
      openBugs: newBugs,
      health: newHealth,
    };
    onUpdateProject(updated);
    onLogActivity?.(project.id, 'bug', `Bug reported. Open bugs count: ${newBugs} (Project health: ${newHealth})`);
  };

  const handleResolveBug = () => {
    if (project.openBugs <= 0) return;
    const newBugs = project.openBugs - 1;
    const newHealth: ProjectHealth = newBugs === 0 ? 'Good' : newBugs < 3 ? 'At Risk' : 'Critical';
    const updated: Project = {
      ...project,
      openBugs: newBugs,
      health: newHealth,
    };
    onUpdateProject(updated);
    onLogActivity?.(project.id, 'bug', `Bug resolved and closed. Remaining open bugs: ${newBugs} (Health: ${newHealth})`);
  };

  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestoneTitle.trim()) return;

    const newM: ProjectMilestone = {
      id: `m-${Date.now()}`,
      title: newMilestoneTitle.trim(),
      dueDate: newMilestoneDate,
      completed: false,
    };

    const updatedMilestones = [...(project.milestones || []), newM];
    const updated: Project = {
      ...project,
      milestones: updatedMilestones,
    };

    onUpdateProject(updated);
    onLogActivity?.(
      project.id,
      'milestone',
      `New milestone created: "${newMilestoneTitle.trim()}" (Due: ${newMilestoneDate})`
    );
    setNewMilestoneTitle('');
    setIsAddingMilestone(false);
  };

  const handlePostActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActivityText.trim()) return;
    onLogActivity?.(project.id, newActivityType, newActivityText.trim());
    setNewActivityText('');
  };

  const getActivityIcon = (type: ProjectActivityType) => {
    switch (type) {
      case 'status_change':
        return {
          icon: ArrowRightLeft,
          color: 'bg-sky-500/15 text-sky-500 border-sky-500/30',
        };
      case 'milestone':
        return {
          icon: CheckCircle2,
          color: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
        };
      case 'task':
        return {
          icon: CheckSquare,
          color: 'bg-indigo-500/15 text-indigo-500 border-indigo-500/30',
        };
      case 'bug':
        return {
          icon: Bug,
          color: 'bg-rose-500/15 text-rose-500 border-rose-500/30',
        };
      case 'budget':
        return {
          icon: DollarSign,
          color: 'bg-teal-500/15 text-teal-500 border-teal-500/30',
        };
      case 'health':
        return {
          icon: AlertTriangle,
          color: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
        };
      default:
        return {
          icon: FileText,
          color: 'bg-purple-500/15 text-purple-500 border-purple-500/30',
        };
    }
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
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">● Health: Good</span>;
      case 'At Risk':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">▲ Health: At Risk</span>;
      case 'Critical':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400">✕ Health: Critical</span>;
    }
  };

  const spentPercentage = project.budget > 0 ? Math.min(100, Math.round((project.spent / project.budget) * 100)) : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div
          className={`w-screen max-w-xl shadow-2xl border-l flex flex-col ${
            isLight ? 'bg-white border-sky-100 text-slate-800' : 'bg-slate-900 border-slate-700 text-slate-100'
          }`}
        >
          {/* Header */}
          <div className="p-5 border-b border-sky-100/30 flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-sky-400 to-indigo-600 text-white flex items-center justify-center font-extrabold text-lg shadow-md shrink-0">
                <FolderKanban className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {project.name}
                  </h2>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusColor(project.status)}`}>
                    {project.status}
                  </span>
                  {getHealthBadge(project.health)}
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-sky-600 dark:text-sky-400">{project.client}</span>
                  <span>•</span>
                  <span>{project.category}</span>
                  <span>•</span>
                  <span>Due: {project.deadline}</span>
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => {
                  onClose();
                  onEdit(project);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors"
                title="Edit Project"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  if (confirm(`Delete project "${project.name}"?`)) {
                    onDelete(project.id, project.name);
                    onClose();
                  }
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                title="Delete Project"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Key Metrics Banner */}
          <div className="grid grid-cols-4 gap-2 px-5 py-3 border-b border-sky-100/30 bg-sky-50/30 dark:bg-slate-800/40 text-center text-xs">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Progress</span>
              <span className="text-xs font-bold text-sky-500">
                {project.progress}%
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Budget</span>
              <span className="text-xs font-bold text-emerald-500">
                {currency.symbol}{project.budget.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Tasks</span>
              <span className="text-xs font-bold text-indigo-500">
                {project.completedTasks}/{project.totalTasks}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Open Bugs</span>
              <span className={`text-xs font-bold ${project.openBugs > 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                {project.openBugs}
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center px-5 border-b border-sky-100/30 gap-6 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-3 border-b-2 transition-all ${
                activeTab === 'overview'
                  ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              Overview & Scope
            </button>
            <button
              onClick={() => setActiveTab('milestones')}
              className={`py-3 border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'milestones'
                  ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              <span>Milestones</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 font-bold">
                {project.milestones ? project.milestones.length : 0}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`py-3 border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'tasks'
                  ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              <span>Tasks & Bugs</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 font-bold">
                {effectiveTasks.length || project.totalTasks}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('team')}
              className={`py-3 border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'team'
                  ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              <span>Team Allocation</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 font-bold">
                {(project?.team || []).length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`py-3 border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'activity'
                  ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-sky-500" />
              <span>Activity & Log</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400 font-bold">
                {projectActivities.length}
              </span>
            </button>
          </div>

          {/* Drawer Body Content */}
          <div className="flex-1 overflow-y-auto p-5 text-xs space-y-4">
            {/* TAB 1: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                {/* Progress bar card */}
                <div className={`p-4 rounded-xl border ${isLight ? 'bg-slate-50/70 border-sky-100' : 'bg-slate-800/40 border-slate-700'}`}>
                  <div className="flex items-center justify-between text-xs font-bold mb-2">
                    <span className="text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-sky-500" />
                      Engineering Delivery Progress
                    </span>
                    <span className="text-sky-600 dark:text-sky-400 text-sm">{project.progress}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
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
                  <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
                    <span>Kickoff: {project.startDate}</span>
                    <span>Deadline: {project.deadline}</span>
                  </div>
                </div>

                {/* Financial Burn Card */}
                <div className={`p-4 rounded-xl border ${isLight ? 'bg-slate-50/70 border-sky-100' : 'bg-slate-800/40 border-slate-700'}`}>
                  <div className="flex items-center justify-between text-xs font-bold mb-2">
                    <span className="text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-emerald-500" />
                      Budget Burn & Financials
                    </span>
                    <span className="text-emerald-500">{currency.symbol}{project.spent.toLocaleString()} / {currency.symbol}{project.budget.toLocaleString()}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${spentPercentage > 90 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                      style={{ width: `${spentPercentage}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
                    <span>{spentPercentage}% of budget utilized</span>
                    <span>Remaining: {currency.symbol}{(project.budget - project.spent).toLocaleString()}</span>
                  </div>
                </div>

                {/* Stage Quick Switcher */}
                <div className={`p-4 rounded-xl border ${isLight ? 'bg-slate-50/70 border-sky-100' : 'bg-slate-800/40 border-slate-700'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs text-slate-700 dark:text-slate-200">
                      Lifecycle Stage Transition
                    </span>
                    <span className="text-[10px] text-slate-400">Quick change</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(['Planning', 'In Progress', 'On Hold', 'Delayed', 'Completed'] as ProjectStatus[]).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => handleQuickStatusChange(st)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                          project.status === st
                            ? getStatusColor(st) + ' ring-2 ring-sky-400 scale-102'
                            : isLight
                            ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Project Manager & Client details */}
                <div className={`p-4 rounded-xl border ${isLight ? 'bg-slate-50/70 border-sky-100' : 'bg-slate-800/40 border-slate-700'}`}>
                  <h3 className="font-bold text-xs text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-sky-500" />
                    Project Governance
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Lead Project Manager</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
                        {project.projectManager}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Client Organization</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
                        {project.client}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Delivery Priority</span>
                      <span className="font-semibold text-rose-500 mt-0.5 block">
                        {project.priority} Priority
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Operational Health</span>
                      <span className="font-semibold text-emerald-500 mt-0.5 block">
                        {project.health}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Scope Description */}
                {project.description && (
                  <div className={`p-4 rounded-xl border ${isLight ? 'bg-slate-50/70 border-sky-100' : 'bg-slate-800/40 border-slate-700'}`}>
                    <h3 className="font-bold text-xs text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-amber-500" />
                      Engineering Scope & Architecture
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-xs">
                      {project.description}
                    </p>
                  </div>
                )}

                {/* Tags */}
                {project.tags && project.tags.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-[11px] text-slate-400 uppercase mb-2">Technology Tags</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {project.tags.map((t) => (
                        <span
                          key={t}
                          className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-300 border border-sky-200 dark:border-sky-800"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Project Activity Preview Card */}
                <div className={`p-4 rounded-xl border ${isLight ? 'bg-slate-50/70 border-sky-100' : 'bg-slate-800/40 border-slate-700'}`}>
                  <div className="flex items-center justify-between mb-2.5">
                    <h3 className="font-bold text-xs text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-sky-500" />
                      Recent Activity & Changes ({projectActivities.length})
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab('activity')}
                      className="text-[11px] font-semibold text-sky-500 hover:text-sky-600 dark:hover:text-sky-400 flex items-center gap-1 cursor-pointer"
                    >
                      <span>View All Logs</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                  {projectActivities.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic">No activity logged yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {projectActivities.slice(0, 3).map((act) => {
                        const { icon: ActIcon, color } = getActivityIcon(act.type);
                        return (
                          <div
                            key={act.id}
                            className={`p-2.5 rounded-lg border text-xs flex items-start gap-2.5 ${
                              isLight ? 'bg-white border-slate-200/70' : 'bg-slate-800/80 border-slate-700/60'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center border shrink-0 mt-0.5 ${color}`}>
                              <ActIcon className="w-3 h-3" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-slate-700 dark:text-slate-200 leading-snug line-clamp-2">
                                {act.description}
                              </p>
                              <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                                <span className="font-semibold text-sky-600 dark:text-sky-400">{act.author}</span>
                                <span>•</span>
                                <span>{act.timestamp}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: MILESTONES */}
            {activeTab === 'milestones' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    Project Milestones & Deliverables ({project.milestones ? project.milestones.length : 0})
                  </span>
                  <button
                    onClick={() => setIsAddingMilestone((prev) => !prev)}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-sky-500 hover:bg-sky-600 text-white shadow-xs transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Milestone</span>
                  </button>
                </div>

                {/* Inline Add Milestone form */}
                {isAddingMilestone && (
                  <form
                    onSubmit={handleAddMilestone}
                    className={`p-3 rounded-xl border space-y-2 animate-fade-in ${
                      isLight ? 'bg-sky-50/50 border-sky-200' : 'bg-slate-800/80 border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-white">
                        New Milestone Item
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsAddingMilestone(false)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <input
                        type="text"
                        required
                        value={newMilestoneTitle}
                        onChange={(e) => setNewMilestoneTitle(e.target.value)}
                        placeholder="Milestone title (e.g. Load Testing)"
                        className="px-2.5 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none"
                      />
                      <input
                        type="date"
                        required
                        value={newMilestoneDate}
                        onChange={(e) => setNewMilestoneDate(e.target.value)}
                        className="px-2.5 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsAddingMilestone(false)}
                        className="px-3 py-1 text-xs text-slate-400 hover:text-slate-600"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-3.5 py-1 text-xs font-bold rounded-lg bg-sky-500 hover:bg-sky-600 text-white shadow-xs"
                      >
                        Save Milestone
                      </button>
                    </div>
                  </form>
                )}

                {/* Milestones Checklist */}
                <div className="space-y-2">
                  {project.milestones && project.milestones.length > 0 ? (
                    project.milestones.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => handleToggleMilestone(m.id)}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                          m.completed
                            ? 'bg-emerald-50/40 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800'
                            : isLight
                            ? 'bg-slate-50/70 border-sky-100 hover:bg-sky-50/50'
                            : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <button
                            type="button"
                            className="text-slate-400 hover:text-emerald-500 transition-colors shrink-0"
                          >
                            {m.completed ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400" />
                            )}
                          </button>
                          <span
                            className={`text-xs font-medium truncate ${
                              m.completed
                                ? 'line-through text-slate-400 dark:text-slate-500'
                                : 'text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {m.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] text-slate-400 tabular-nums">
                            Due: {m.dueDate}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteMilestone(m.id, e)}
                            className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                            title="Delete Milestone"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-400">
                      <Clock className="w-6 h-6 mx-auto mb-2 opacity-50" />
                      <p className="text-xs">No milestones defined yet.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: TASKS & BUGS */}
            {activeTab === 'tasks' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className={`p-4 rounded-xl border ${isLight ? 'bg-slate-50 border-sky-100' : 'bg-slate-800 border-slate-700'}`}>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Task Completion</span>
                    <span className="text-xl font-extrabold text-indigo-500">
                      {completedTasksList.length} / {effectiveTasks.length}
                    </span>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {remainingTasks.length} tasks remaining
                    </p>
                  </div>

                  <div className={`p-4 rounded-xl border ${isLight ? 'bg-slate-50 border-sky-100' : 'bg-slate-800 border-slate-700'}`}>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Open Bug Reports</span>
                    <span className={`text-xl font-extrabold ${project.openBugs > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {project.openBugs}
                    </span>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {project.openBugs > 0 ? 'Requires QA triage' : 'Zero blockers reported'}
                    </p>
                  </div>
                </div>

                {/* Interactive Sprint Execution Controls */}
                <div className={`p-4 rounded-xl border space-y-3 ${isLight ? 'bg-slate-50 border-sky-100' : 'bg-slate-800 border-slate-700'}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-700 dark:text-slate-200">
                      Sprint Delivery Progress
                    </span>
                    <span className="text-[11px] font-semibold text-sky-600 dark:text-sky-400">
                      {project.progress}% Complete
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleIncrementTask}
                      disabled={remainingTasks.length === 0}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white shadow-xs transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Complete Task (+1)</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleAddWorkItem}
                      className={`px-3 py-2 text-xs font-bold rounded-lg border transition-colors cursor-pointer flex items-center gap-1.5 ${
                        isAddingTask
                          ? 'bg-sky-500 text-white border-sky-500'
                          : isLight
                          ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                          : 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isAddingTask ? 'Close Form' : 'Add Work Item'}</span>
                    </button>
                  </div>
                </div>

                {/* Inline Add Work Item Form */}
                {isAddingTask && (
                  <form
                    onSubmit={handleCreateTask}
                    className={`p-4 rounded-xl border space-y-3 animate-fade-in ${
                      isLight ? 'bg-sky-50/60 border-sky-200' : 'bg-slate-800/80 border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                        <Plus className="w-3.5 h-3.5 text-sky-500" />
                        Create Project Work Item
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsAddingTask(false)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="space-y-2">
                      <input
                        type="text"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="Task title (e.g. KV Cache Paged Attention Dynamic Defragmentation)..."
                        className={`w-full px-3 py-2 text-xs rounded-lg border outline-none transition-all ${
                          isLight
                            ? 'bg-white border-slate-200 focus:border-sky-500 text-slate-800'
                            : 'bg-slate-900 border-slate-700 focus:border-sky-500 text-white'
                        }`}
                        autoFocus
                      />

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Assignee</label>
                          <select
                            value={newTaskAssignee}
                            onChange={(e) => setNewTaskAssignee(e.target.value)}
                            className={`w-full px-2 py-1.5 text-xs rounded-lg border outline-none ${
                              isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-700 text-white'
                            }`}
                          >
                            {(project?.team || [project?.projectManager || 'Sayed (CEO)']).map((m) => (
                              <option key={m} value={m}>
                                {m}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Priority</label>
                          <select
                            value={newTaskPriority}
                            onChange={(e) => setNewTaskPriority(e.target.value as ProjectPriority)}
                            className={`w-full px-2 py-1.5 text-xs rounded-lg border outline-none ${
                              isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-700 text-white'
                            }`}
                          >
                            <option value="Urgent">Urgent</option>
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Target Due Date</label>
                          <input
                            type="date"
                            value={newTaskDueDate}
                            onChange={(e) => setNewTaskDueDate(e.target.value)}
                            className={`w-full px-2 py-1 text-xs rounded-lg border outline-none ${
                              isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-700 text-white'
                            }`}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsAddingTask(false)}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={!newTaskTitle.trim()}
                        className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white shadow-xs transition-colors cursor-pointer"
                      >
                        Add Task
                      </button>
                    </div>
                  </form>
                )}

                {/* Detailed Work Items & Task Execution Section */}
                <div className={`p-4 rounded-xl border space-y-3 ${isLight ? 'bg-slate-50 border-sky-100' : 'bg-slate-800 border-slate-700'}`}>
                  {/* Section Title & Filter Tabs */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-100 block">
                        Detailed Work Items ({effectiveTasks.length})
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {remainingTasks.length} in-flight • {completedTasksList.length} completed deliverables
                      </span>
                    </div>

                    {/* Filter Pills */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setTaskFilter('remaining')}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-all cursor-pointer flex items-center gap-1 ${
                          taskFilter === 'remaining'
                            ? 'bg-amber-500 text-white shadow-xs'
                            : isLight
                            ? 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        <span>Remaining</span>
                        <span className="px-1 py-0.2 rounded-full bg-black/20 text-[9px]">
                          {remainingTasks.length}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTaskFilter('completed')}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-all cursor-pointer flex items-center gap-1 ${
                          taskFilter === 'completed'
                            ? 'bg-emerald-500 text-white shadow-xs'
                            : isLight
                            ? 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        <span>Completed</span>
                        <span className="px-1 py-0.2 rounded-full bg-black/20 text-[9px]">
                          {completedTasksList.length}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTaskFilter('all')}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-all cursor-pointer flex items-center gap-1 ${
                          taskFilter === 'all'
                            ? 'bg-sky-500 text-white shadow-xs'
                            : isLight
                            ? 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        <span>All</span>
                        <span className="px-1 py-0.2 rounded-full bg-black/20 text-[9px]">
                          {effectiveTasks.length}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={taskSearchQuery}
                      onChange={(e) => setTaskSearchQuery(e.target.value)}
                      placeholder="Search deliverables by name, assignee, priority..."
                      className={`w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border outline-none transition-all ${
                        isLight
                          ? 'bg-white border-slate-200 focus:border-sky-500 text-slate-800'
                          : 'bg-slate-900 border-slate-700 focus:border-sky-500 text-white'
                      }`}
                    />
                    {taskSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setTaskSearchQuery('')}
                        className="absolute right-2.5 top-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Tasks List Container */}
                  <div className="space-y-2 max-h-[380px] overflow-y-auto pr-0.5">
                    {displayedTasks.length > 0 ? (
                      displayedTasks.map((t) => (
                        <div
                          key={t.id}
                          onClick={() => handleToggleTask(t.id)}
                          className={`p-3 rounded-xl border flex items-start justify-between gap-3 cursor-pointer transition-all ${
                            t.completed
                              ? 'bg-emerald-50/40 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800/80 opacity-80'
                              : isLight
                              ? 'bg-white border-slate-200 hover:border-sky-300 shadow-2xs'
                              : 'bg-slate-900/70 border-slate-700 hover:border-slate-600'
                          }`}
                        >
                          {/* Checkbox and Title */}
                          <div className="flex items-start gap-2.5 min-w-0 flex-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleTask(t.id);
                              }}
                              className="mt-0.5 text-slate-400 hover:text-emerald-500 transition-colors shrink-0 cursor-pointer"
                            >
                              {t.completed ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-400 hover:text-sky-500" />
                              )}
                            </button>

                            <div className="min-w-0 flex-1">
                              <span
                                className={`text-xs block font-semibold leading-snug ${
                                  t.completed
                                    ? 'line-through text-slate-400 dark:text-slate-500'
                                    : 'text-slate-800 dark:text-slate-100'
                                }`}
                              >
                                {t.title}
                              </span>

                              {/* Task Metadata Row */}
                              <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[10px]">
                                {/* Status Chip */}
                                <span
                                  className={`px-1.5 py-0.5 rounded font-bold capitalize ${
                                    t.status === 'Completed'
                                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                      : t.status === 'In Progress'
                                      ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400'
                                      : t.status === 'In Review'
                                      ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400'
                                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                  }`}
                                >
                                  {t.status}
                                </span>

                                {/* Priority Chip */}
                                <span
                                  className={`px-1.5 py-0.5 rounded font-bold ${
                                    t.priority === 'Urgent'
                                      ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                                      : t.priority === 'High'
                                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                                      : 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400'
                                  }`}
                                >
                                  {t.priority}
                                </span>

                                {/* Assignee */}
                                <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                                  <User className="w-3 h-3 text-slate-400" />
                                  <span>{t.assignee}</span>
                                </span>

                                {/* Due Date */}
                                {t.dueDate && (
                                  <span className="flex items-center gap-1 text-slate-400">
                                    <Calendar className="w-3 h-3 text-slate-400" />
                                    <span>{t.dueDate}</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Delete Task Action */}
                          <button
                            type="button"
                            onClick={(e) => handleDeleteTask(t.id, e)}
                            className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
                            title="Delete Task"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-slate-400">
                        <CheckSquare className="w-6 h-6 mx-auto mb-1.5 opacity-50 text-slate-400" />
                        <p className="text-xs">No tasks match filter "{taskFilter}"</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Interactive QA & Defect Tracking */}
                <div className={`p-4 rounded-xl border space-y-3 ${isLight ? 'bg-slate-50 border-sky-100' : 'bg-slate-800 border-slate-700'}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-700 dark:text-slate-200">
                      Quality Assurance & Defect Tracker
                    </span>
                    <span className={`text-[11px] font-bold ${project.openBugs > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {project.openBugs} active defects
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleLogBug}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-rose-500 hover:bg-rose-600 text-white shadow-xs transition-colors"
                    >
                      <Bug className="w-3.5 h-3.5" />
                      <span>Report Bug (+1)</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleResolveBug}
                      disabled={project.openBugs <= 0}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white shadow-xs transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Resolve Bug (-1)</span>
                    </button>
                  </div>
                </div>

                <div className={`p-3.5 rounded-xl border ${isLight ? 'bg-slate-50 border-sky-100' : 'bg-slate-800 border-slate-700'}`}>
                  <h4 className="font-bold text-xs text-slate-700 dark:text-slate-200 mb-2">Delivery Status Breakdown</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Completed Deliverables</span>
                      <span className="font-semibold text-emerald-500">{project.completedTasks}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">In-Flight Work Items</span>
                      <span className="font-semibold text-sky-500">{project.totalTasks - project.completedTasks}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Target Release Milestone</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{project.deadline}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: TEAM */}
            {activeTab === 'team' && (
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                  Allocated Engineering Resources ({(project?.team || []).length})
                </span>

                <div className="space-y-2">
                  {(project?.team || []).map((member) => (
                    <div
                      key={member}
                      className={`p-3 rounded-xl border flex items-center justify-between ${
                        isLight ? 'bg-slate-50 border-sky-100' : 'bg-slate-800 border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-300 font-bold flex items-center justify-center text-xs">
                          {member.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-bold text-xs text-slate-800 dark:text-white block">
                            {member}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {member === project.projectManager ? 'Lead Project Manager' : 'Senior Engineer'}
                          </span>
                        </div>
                      </div>

                      {member === project.projectManager && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800">
                          Manager
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 5: ACTIVITY & AUDIT LOG */}
            {activeTab === 'activity' && (
              <div className="space-y-4">
                {/* Header & Quick Post Note Form */}
                <div className={`p-4 rounded-xl border space-y-3 ${isLight ? 'bg-slate-50/80 border-sky-100' : 'bg-slate-800/60 border-slate-700'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                      <Send className="w-3.5 h-3.5 text-sky-500" />
                      Log Project Note or Update
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Author: Sayed (CEO)
                    </span>
                  </div>

                  {/* Activity Type Chips */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {(['note', 'status_change', 'milestone', 'task', 'health', 'bug', 'budget'] as ProjectActivityType[]).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setNewActivityType(t)}
                        className={`text-[10px] font-semibold px-2 py-1 rounded-md transition-all capitalize cursor-pointer ${
                          newActivityType === t
                            ? 'bg-sky-500 text-white shadow-xs'
                            : isLight
                            ? 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        {t === 'status_change' ? 'Status' : t}
                      </button>
                    ))}
                  </div>

                  <form onSubmit={handlePostActivity} className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newActivityText}
                        onChange={(e) => setNewActivityText(e.target.value)}
                        placeholder={`Add ${newActivityType === 'status_change' ? 'status update' : newActivityType} note or change description...`}
                        className={`flex-1 px-3 py-2 text-xs rounded-lg border outline-none transition-all ${
                          isLight
                            ? 'bg-white border-slate-200 focus:border-sky-500 text-slate-800'
                            : 'bg-slate-900 border-slate-700 focus:border-sky-500 text-white'
                        }`}
                      />
                      <button
                        type="submit"
                        disabled={!newActivityText.trim()}
                        className="px-3.5 py-2 text-xs font-bold rounded-lg bg-sky-500 hover:bg-sky-600 disabled:opacity-40 text-white shadow-xs transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                      >
                        <Send className="w-3 h-3" />
                        <span>Log</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* Filter and Timeline Controls */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    Activity Audit Log ({filteredActivities.length})
                  </span>
                  <div className="flex items-center gap-1">
                    {(
                      [
                        { id: 'all', label: 'All' },
                        { id: 'status_change', label: 'Status' },
                        { id: 'milestone', label: 'Milestones' },
                        { id: 'task', label: 'Tasks' },
                        { id: 'bug', label: 'Defects' },
                        { id: 'note', label: 'Notes' },
                      ] as const
                    ).map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setActivityFilter(f.id)}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors cursor-pointer ${
                          activityFilter === f.id
                            ? 'bg-sky-500 text-white'
                            : isLight
                            ? 'text-slate-600 hover:bg-slate-200'
                            : 'text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Vertical Timeline */}
                {filteredActivities.length === 0 ? (
                  <div className={`p-8 rounded-xl border text-center ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/40 border-slate-700'}`}>
                    <Activity className="w-8 h-8 mx-auto text-slate-400 mb-2 opacity-50" />
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">No activity matching filter</p>
                  </div>
                ) : (
                  <div className="relative pl-6 space-y-3.5 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
                    {filteredActivities.map((act) => {
                      const { icon: ActIcon, color } = getActivityIcon(act.type);
                      return (
                        <div key={act.id} className="relative group">
                          {/* Timeline node icon */}
                          <div className={`absolute -left-6 top-1 w-5 h-5 rounded-full flex items-center justify-center border shrink-0 ${color}`}>
                            <ActIcon className="w-3 h-3" />
                          </div>

                          {/* Content box */}
                          <div
                            className={`p-3 rounded-xl border text-xs transition-all ${
                              isLight
                                ? 'bg-white border-slate-200/90 shadow-2xs hover:border-sky-200'
                                : 'bg-slate-800/70 border-slate-700/80 hover:border-slate-600'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1 gap-2">
                              <span className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 capitalize">
                                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400">
                                  {act.type.replace('_', ' ')}
                                </span>
                                <span className="font-medium text-slate-500 dark:text-slate-400">by</span>
                                <span className="font-bold text-sky-600 dark:text-sky-400">{act.author}</span>
                              </span>
                              <span className="text-[10px] text-slate-400 shrink-0">
                                {act.timestamp}
                              </span>
                            </div>

                            <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                              {act.description}
                            </p>

                            {/* Value comparison if status or metric changed */}
                            {(act.oldValue || act.newValue) && (
                              <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 text-[11px]">
                                {act.oldValue && (
                                  <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 line-through">
                                    {act.oldValue}
                                  </span>
                                )}
                                {act.oldValue && act.newValue && (
                                  <ArrowRightLeft className="w-3 h-3 text-sky-500 shrink-0" />
                                )}
                                {act.newValue && (
                                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold">
                                    {act.newValue}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

