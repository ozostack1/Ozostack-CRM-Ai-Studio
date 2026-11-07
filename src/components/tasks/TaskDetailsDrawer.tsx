import React, { useState } from 'react';
import {
  X,
  CheckSquare,
  Square,
  Clock,
  User,
  Calendar,
  Tag,
  AlertCircle,
  FileText,
  Plus,
  Trash2,
  FolderKanban,
  Building2,
  Edit2,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  Play,
  RotateCcw,
} from 'lucide-react';
import {
  TaskItem,
  TaskStatus,
  TaskPriority,
  TaskCategory,
  TaskSubtask,
} from '../../types/crm';
import { useTheme } from '../../context/ThemeContext';

interface TaskDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  task: TaskItem | null;
  onEdit: (task: TaskItem) => void;
  onDelete: (taskId: string, taskTitle: string) => void;
  onUpdateTask: (updated: TaskItem) => void;
}

export const TaskDetailsDrawer: React.FC<TaskDetailsDrawerProps> = ({
  isOpen,
  onClose,
  task,
  onEdit,
  onDelete,
  onUpdateTask,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'white-sky';

  const [activeTab, setActiveTab] = useState<'overview' | 'subtasks' | 'time'>('overview');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  if (!isOpen || !task) return null;

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
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-800">🔥 Urgent</span>;
      case 'High':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-800">▲ High</span>;
      case 'Medium':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-300 dark:border-sky-800">● Medium</span>;
      case 'Low':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-500/15 text-slate-500 border border-slate-300 dark:border-slate-700">▼ Low</span>;
    }
  };

  // Subtasks calculation
  const subtasksList = task.subtasks || [];
  const completedSubtasks = subtasksList.filter((s) => s.completed).length;
  const subtasksPercentage =
    subtasksList.length > 0 ? Math.round((completedSubtasks / subtasksList.length) * 100) : 0;

  // Hours calculation
  const hoursPercentage =
    task.estimatedHours > 0
      ? Math.min(100, Math.round((task.loggedHours / task.estimatedHours) * 100))
      : 0;

  // Handlers
  const handleToggleSubtask = (subtaskId: string) => {
    const updatedSubtasks = subtasksList.map((s) =>
      s.id === subtaskId ? { ...s, completed: !s.completed } : s
    );
    const allDone = updatedSubtasks.length > 0 && updatedSubtasks.every((s) => s.completed);

    const updated: TaskItem = {
      ...task,
      subtasks: updatedSubtasks,
      status: allDone ? 'Completed' : task.status === 'Completed' ? 'In Progress' : task.status,
    };
    onUpdateTask(updated);
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;

    const newSt: TaskSubtask = {
      id: `st-${Date.now()}`,
      title: newSubtaskTitle.trim(),
      completed: false,
    };

    const updated: TaskItem = {
      ...task,
      subtasks: [...subtasksList, newSt],
    };
    onUpdateTask(updated);
    setNewSubtaskTitle('');
  };

  const handleDeleteSubtask = (subtaskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated: TaskItem = {
      ...task,
      subtasks: subtasksList.filter((s) => s.id !== subtaskId),
    };
    onUpdateTask(updated);
  };

  const handleAddHours = (hours: number) => {
    const newLogged = Math.max(0, task.loggedHours + hours);
    const updated: TaskItem = {
      ...task,
      loggedHours: newLogged,
    };
    onUpdateTask(updated);
  };

  const handleQuickStatusChange = (newStatus: TaskStatus) => {
    const updated: TaskItem = {
      ...task,
      status: newStatus,
      subtasks:
        newStatus === 'Completed'
          ? subtasksList.map((s) => ({ ...s, completed: true }))
          : task.subtasks,
    };
    onUpdateTask(updated);
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const isOverdue = task.status !== 'Completed' && task.dueDate < todayStr;

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
            isLight
              ? 'bg-white border-sky-100 text-slate-800'
              : 'bg-slate-900 border-slate-700 text-slate-100'
          }`}
        >
          {/* Header */}
          <div className="p-5 border-b border-sky-100/30 flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-sky-400 to-indigo-600 text-white flex items-center justify-center font-extrabold text-lg shadow-md shrink-0">
                <CheckSquare className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {task.title}
                  </h2>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusColor(task.status)}`}>
                    {task.status}
                  </span>
                  {getPriorityBadge(task.priority)}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-sky-600 dark:text-sky-400">{task.project}</span>
                  {task.client && (
                    <>
                      <span>•</span>
                      <span>{task.client}</span>
                    </>
                  )}
                  <span>•</span>
                  <span>{task.category}</span>
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => {
                  onClose();
                  onEdit(task);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors"
                title="Edit Task"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  if (confirm(`Delete task "${task.title}"?`)) {
                    onDelete(task.id, task.title);
                    onClose();
                  }
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                title="Delete Task"
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
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Assignee</span>
              <span className="text-xs font-bold text-slate-800 dark:text-white truncate block">
                {task.assignee}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Due Date</span>
              <span className={`text-xs font-bold ${isOverdue ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'}`}>
                {task.dueDate}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Subtasks</span>
              <span className="text-xs font-bold text-sky-500">
                {completedSubtasks}/{subtasksList.length}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Hours</span>
              <span className="text-xs font-bold text-emerald-500">
                {task.loggedHours}/{task.estimatedHours}h
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
              onClick={() => setActiveTab('subtasks')}
              className={`py-3 border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'subtasks'
                  ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              <span>Subtasks</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 font-bold">
                {subtasksList.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('time')}
              className={`py-3 border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'time'
                  ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              <span>Time Tracking</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold">
                {task.loggedHours}h
              </span>
            </button>
          </div>

          {/* Drawer Body Content */}
          <div className="flex-1 overflow-y-auto p-5 text-xs space-y-4">
            {/* TAB 1: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                {/* Overdue alert if applicable */}
                {isOverdue && (
                  <div className="p-3 rounded-xl border border-rose-300 bg-rose-50/70 dark:bg-rose-950/30 dark:border-rose-900 flex items-center gap-2.5 text-rose-700 dark:text-rose-400 text-xs">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span className="font-semibold">
                      This task is overdue! Target completion date was {task.dueDate}.
                    </span>
                  </div>
                )}

                {/* Lifecycle Stage Switcher */}
                <div className={`p-4 rounded-xl border ${isLight ? 'bg-slate-50/70 border-sky-100' : 'bg-slate-800/40 border-slate-700'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs text-slate-700 dark:text-slate-200">
                      Workflow Stage Transition
                    </span>
                    <span className="text-[10px] text-slate-400">Click to change</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(['To Do', 'In Progress', 'In Review', 'Completed', 'Blocked'] as TaskStatus[]).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => handleQuickStatusChange(st)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                          task.status === st
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

                {/* Subtasks Progress Card */}
                <div className={`p-4 rounded-xl border ${isLight ? 'bg-slate-50/70 border-sky-100' : 'bg-slate-800/40 border-slate-700'}`}>
                  <div className="flex items-center justify-between text-xs font-bold mb-2">
                    <span className="text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-sky-500" />
                      Subtask Checklist Completion
                    </span>
                    <span className="text-sky-600 dark:text-sky-400 text-sm">{subtasksPercentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        subtasksPercentage === 100
                          ? 'bg-emerald-500'
                          : 'bg-gradient-to-r from-sky-400 to-indigo-500'
                      }`}
                      style={{ width: `${subtasksPercentage}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
                    <span>{completedSubtasks} of {subtasksList.length} subtasks finished</span>
                    <button
                      onClick={() => setActiveTab('subtasks')}
                      className="text-sky-600 dark:text-sky-400 font-semibold hover:underline"
                    >
                      Manage Subtasks →
                    </button>
                  </div>
                </div>

                {/* Task Context Details */}
                <div className={`p-4 rounded-xl border ${isLight ? 'bg-slate-50/70 border-sky-100' : 'bg-slate-800/40 border-slate-700'}`}>
                  <h3 className="font-bold text-xs text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-sky-500" />
                    Task Metadata & Allocation
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Assigned Engineer</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
                        {task.assignee}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Linked Project</span>
                      <span className="font-semibold text-sky-600 dark:text-sky-400 mt-0.5 block truncate">
                        {task.project}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Delivery Priority</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
                        {task.priority} Priority
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Technical Category</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
                        {task.category}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Kickoff Date</span>
                      <span className="font-medium text-slate-600 dark:text-slate-300 mt-0.5 block">
                        {task.startDate || 'Not specified'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Deadline</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
                        {task.dueDate}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Description & Scope */}
                {task.description && (
                  <div className={`p-4 rounded-xl border ${isLight ? 'bg-slate-50/70 border-sky-100' : 'bg-slate-800/40 border-slate-700'}`}>
                    <h3 className="font-bold text-xs text-slate-700 dark:text-slate-200 mb-2">
                      Engineering Scope & Description
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-xs">
                      {task.description}
                    </p>
                  </div>
                )}

                {/* Tags */}
                {task.tags && task.tags.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-[11px] text-slate-400 uppercase mb-2">
                      Technology Tags
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {task.tags.map((t) => (
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
              </div>
            )}

            {/* TAB 2: SUBTASKS */}
            {activeTab === 'subtasks' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    Subtask Work Breakdown ({completedSubtasks}/{subtasksList.length})
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {subtasksPercentage}% Completed
                  </span>
                </div>

                {/* Add Subtask input */}
                <form onSubmit={handleAddSubtask} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    placeholder="Add a new deliverable subtask..."
                    className={`flex-1 px-3 py-2 text-xs rounded-xl border outline-none font-medium ${
                      isLight
                        ? 'bg-sky-50/30 border-sky-200 text-slate-800 focus:border-sky-500'
                        : 'bg-slate-800/80 border-slate-700 text-white focus:border-sky-400'
                    }`}
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold transition-colors shrink-0 shadow-xs flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </form>

                {/* Subtasks List */}
                <div className="space-y-2 pt-1">
                  {subtasksList.map((st) => (
                    <div
                      key={st.id}
                      onClick={() => handleToggleSubtask(st.id)}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                        st.completed
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
                          {st.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                        <span
                          className={`text-xs font-medium truncate ${
                            st.completed
                              ? 'line-through text-slate-400 dark:text-slate-500'
                              : 'text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          {st.title}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleDeleteSubtask(st.id, e)}
                        className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors shrink-0"
                        title="Delete Subtask"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {subtasksList.length === 0 && (
                    <div className="text-center py-8 text-slate-400">
                      <CheckSquare className="w-6 h-6 mx-auto mb-2 opacity-50" />
                      <p className="text-xs">No subtasks defined yet. Add deliverables above.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: TIME TRACKING */}
            {activeTab === 'time' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className={`p-4 rounded-xl border ${isLight ? 'bg-slate-50 border-sky-100' : 'bg-slate-800 border-slate-700'}`}>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Estimated Effort</span>
                    <span className="text-2xl font-extrabold text-sky-600 dark:text-sky-400">
                      {task.estimatedHours}h
                    </span>
                    <p className="text-[11px] text-slate-400 mt-1">Total scope budget</p>
                  </div>

                  <div className={`p-4 rounded-xl border ${isLight ? 'bg-slate-50 border-sky-100' : 'bg-slate-800 border-slate-700'}`}>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Hours Logged</span>
                    <span className="text-2xl font-extrabold text-emerald-500">
                      {task.loggedHours}h
                    </span>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {task.estimatedHours - task.loggedHours > 0
                        ? `${task.estimatedHours - task.loggedHours}h remaining`
                        : 'Estimate reached'}
                    </p>
                  </div>
                </div>

                {/* Hours Progress Bar */}
                <div className={`p-4 rounded-xl border ${isLight ? 'bg-slate-50/70 border-sky-100' : 'bg-slate-800/40 border-slate-700'}`}>
                  <div className="flex items-center justify-between text-xs font-bold mb-2">
                    <span className="text-slate-700 dark:text-slate-200">
                      Burn Rate & Effort Utilization
                    </span>
                    <span className="text-emerald-500">{hoursPercentage}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        hoursPercentage > 100
                          ? 'bg-rose-500'
                          : hoursPercentage > 85
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, hoursPercentage)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
                    <span>{task.loggedHours} hours completed</span>
                    <span>{task.estimatedHours} hours planned</span>
                  </div>
                </div>

                {/* Quick Log Hours */}
                <div className={`p-4 rounded-xl border space-y-3 ${isLight ? 'bg-slate-50 border-sky-100' : 'bg-slate-800 border-slate-700'}`}>
                  <span className="font-bold text-xs text-slate-700 dark:text-slate-200 block">
                    Quick Work Log Effort
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      type="button"
                      disabled={task.loggedHours <= 0}
                      onClick={() => handleAddHours(-1)}
                      className="px-2.5 py-2 text-xs font-bold rounded-lg bg-slate-500/10 text-slate-600 dark:text-slate-400 hover:bg-slate-500/20 disabled:opacity-40 transition-colors border border-slate-200 dark:border-slate-700"
                    >
                      -1 Hour
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddHours(1)}
                      className="px-2.5 py-2 text-xs font-bold rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-300 hover:bg-sky-500 hover:text-white transition-colors border border-sky-200 dark:border-sky-800"
                    >
                      +1 Hour
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddHours(2)}
                      className="px-2.5 py-2 text-xs font-bold rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-300 hover:bg-sky-500 hover:text-white transition-colors border border-sky-200 dark:border-sky-800"
                    >
                      +2 Hours
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddHours(4)}
                      className="px-2.5 py-2 text-xs font-bold rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-300 hover:bg-sky-500 hover:text-white transition-colors border border-sky-200 dark:border-sky-800"
                    >
                      +4 Hours
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

