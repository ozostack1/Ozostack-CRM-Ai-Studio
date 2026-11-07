import React, { useState, useEffect } from 'react';
import {
  X,
  CheckSquare,
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
  Layers,
} from 'lucide-react';
import {
  TaskItem,
  TaskStatus,
  TaskPriority,
  TaskCategory,
  TaskSubtask,
} from '../../types/crm';
import { useTheme } from '../../context/ThemeContext';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: TaskItem) => void;
  taskToEdit?: TaskItem | null;
  availableProjects?: string[];
  availableAssignees?: string[];
  defaultStatus?: TaskStatus;
}

const CATEGORIES: TaskCategory[] = [
  'Backend',
  'Frontend',
  'DevOps',
  'QA & Testing',
  'Design & UX',
  'API & Integration',
  'Security & Compliance',
];

const PRIORITIES: TaskPriority[] = ['Urgent', 'High', 'Medium', 'Low'];
const STATUSES: TaskStatus[] = ['To Do', 'In Progress', 'In Review', 'Completed', 'Blocked'];

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  taskToEdit,
  availableProjects = [],
  availableAssignees = [],
  defaultStatus = 'To Do',
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'white-sky';

  const [title, setTitle] = useState('');
  const [project, setProject] = useState('');
  const [client, setClient] = useState('');
  const [assignee, setAssignee] = useState('');
  const [status, setStatus] = useState<TaskStatus>(defaultStatus);
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [category, setCategory] = useState<TaskCategory>('Backend');
  const [dueDate, setDueDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [estimatedHours, setEstimatedHours] = useState(16);
  const [loggedHours, setLoggedHours] = useState(0);
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [subtasks, setSubtasks] = useState<TaskSubtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setProject(taskToEdit.project);
      setClient(taskToEdit.client || '');
      setAssignee(taskToEdit.assignee);
      setStatus(taskToEdit.status);
      setPriority(taskToEdit.priority);
      setCategory(taskToEdit.category);
      setDueDate(taskToEdit.dueDate);
      setStartDate(taskToEdit.startDate || '');
      setEstimatedHours(taskToEdit.estimatedHours);
      setLoggedHours(taskToEdit.loggedHours);
      setDescription(taskToEdit.description || '');
      setTagsInput(taskToEdit.tags ? taskToEdit.tags.join(', ') : '');
      setSubtasks(taskToEdit.subtasks || []);
    } else {
      setTitle('');
      setProject(availableProjects[0] || 'PCI-DSS Banking API Gateway');
      setClient('FinEdge Systems');
      setAssignee(availableAssignees[0] || 'Amit Kumar');
      setStatus(defaultStatus);
      setPriority('Medium');
      setCategory('Backend');
      const today = new Date().toISOString().split('T')[0];
      setStartDate(today);
      const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
      setDueDate(nextWeek);
      setEstimatedHours(16);
      setLoggedHours(0);
      setDescription('');
      setTagsInput('API, Security');
      setSubtasks([
        { id: 'st-1', title: 'Technical architecture spec review', completed: true },
        { id: 'st-2', title: 'Implementation & unit tests', completed: false },
      ]);
    }
    setNewSubtaskTitle('');
  }, [taskToEdit, isOpen, defaultStatus, availableProjects, availableAssignees]);

  if (!isOpen) return null;

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    const newSt: TaskSubtask = {
      id: `st-${Date.now()}`,
      title: newSubtaskTitle.trim(),
      completed: false,
    };
    setSubtasks([...subtasks, newSt]);
    setNewSubtaskTitle('');
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks(subtasks.filter((s) => s.id !== id));
  };

  const handleToggleSubtask = (id: string) => {
    setSubtasks(
      subtasks.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !project.trim() || !assignee.trim() || !dueDate) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const taskData: TaskItem = {
      id: taskToEdit ? taskToEdit.id : `task-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      project: project.trim(),
      client: client.trim() || undefined,
      assignee: assignee.trim(),
      status,
      priority,
      category,
      dueDate,
      startDate: startDate || undefined,
      estimatedHours: Number(estimatedHours) || 0,
      loggedHours: Number(loggedHours) || 0,
      subtasks,
      tags: tags.length > 0 ? tags : undefined,
      commentsCount: taskToEdit?.commentsCount ?? 0,
      createdAt: taskToEdit?.createdAt || new Date().toISOString().split('T')[0],
    };

    onSave(taskData);
    onClose();
  };

  const allProjects = Array.from(new Set([...availableProjects, project])).filter(Boolean);
  const allAssignees = Array.from(new Set([...availableAssignees, assignee])).filter(Boolean);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        className={`relative w-full max-w-2xl rounded-2xl shadow-2xl border flex flex-col max-h-[92vh] overflow-hidden my-auto animate-fade-in ${
          isLight
            ? 'bg-white border-sky-100 text-slate-800'
            : 'bg-slate-900 border-slate-700 text-slate-100'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-sky-100/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center font-extrabold shadow-sm">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {taskToEdit ? 'Edit Engineering Task' : 'Create New Work Item'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {taskToEdit
                  ? `Update work item details and deliverables for ${taskToEdit.title}`
                  : 'Assign, schedule, and configure project work breakdown item'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
          {/* Task Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
              Task / Work Item Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Implement OAuth2 Refresh Token Rotation"
              className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-medium ${
                isLight
                  ? 'bg-sky-50/30 border-sky-200 text-slate-800 focus:border-sky-500'
                  : 'bg-slate-800/80 border-slate-700 text-white focus:border-sky-400'
              }`}
            />
          </div>

          {/* Project & Client */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Linked Project <span className="text-rose-500">*</span>
              </label>
              {allProjects.length > 0 ? (
                <select
                  required
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-medium cursor-pointer ${
                    isLight
                      ? 'bg-sky-50/30 border-sky-200 text-slate-800 focus:border-sky-500'
                      : 'bg-slate-800/80 border-slate-700 text-white focus:border-sky-400'
                  }`}
                >
                  {allProjects.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  required
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                  placeholder="e.g. PCI-DSS Banking API Gateway"
                  className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-medium ${
                    isLight
                      ? 'bg-sky-50/30 border-sky-200 text-slate-800 focus:border-sky-500'
                      : 'bg-slate-800/80 border-slate-700 text-white focus:border-sky-400'
                  }`}
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Client Organization
              </label>
              <input
                type="text"
                value={client}
                onChange={(e) => setClient(e.target.value)}
                placeholder="e.g. FinEdge Systems"
                className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-medium ${
                  isLight
                    ? 'bg-sky-50/30 border-sky-200 text-slate-800 focus:border-sky-500'
                    : 'bg-slate-800/80 border-slate-700 text-white focus:border-sky-400'
                }`}
              />
            </div>
          </div>

          {/* Assignee & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Assignee Engineer <span className="text-rose-500">*</span>
              </label>
              {allAssignees.length > 0 ? (
                <select
                  required
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-medium cursor-pointer ${
                    isLight
                      ? 'bg-sky-50/30 border-sky-200 text-slate-800 focus:border-sky-500'
                      : 'bg-slate-800/80 border-slate-700 text-white focus:border-sky-400'
                  }`}
                >
                  {allAssignees.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  required
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                  placeholder="e.g. Amit Kumar"
                  className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-medium ${
                    isLight
                      ? 'bg-sky-50/30 border-sky-200 text-slate-800 focus:border-sky-500'
                      : 'bg-slate-800/80 border-slate-700 text-white focus:border-sky-400'
                  }`}
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Domain / Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TaskCategory)}
                className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-medium cursor-pointer ${
                  isLight
                    ? 'bg-sky-50/30 border-sky-200 text-slate-800 focus:border-sky-500'
                    : 'bg-slate-800/80 border-slate-700 text-white focus:border-sky-400'
                }`}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status, Priority, and Hours */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className={`w-full px-2.5 py-2 text-xs rounded-xl border outline-none font-medium cursor-pointer ${
                  isLight
                    ? 'bg-sky-50/30 border-sky-200 text-slate-800 focus:border-sky-500'
                    : 'bg-slate-800/80 border-slate-700 text-white focus:border-sky-400'
                }`}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className={`w-full px-2.5 py-2 text-xs rounded-xl border outline-none font-medium cursor-pointer ${
                  isLight
                    ? 'bg-sky-50/30 border-sky-200 text-slate-800 focus:border-sky-500'
                    : 'bg-slate-800/80 border-slate-700 text-white focus:border-sky-400'
                }`}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Est. Hours
              </label>
              <input
                type="number"
                min="1"
                max="500"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(Number(e.target.value))}
                className={`w-full px-2.5 py-2 text-xs rounded-xl border outline-none font-medium ${
                  isLight
                    ? 'bg-sky-50/30 border-sky-200 text-slate-800 focus:border-sky-500'
                    : 'bg-slate-800/80 border-slate-700 text-white focus:border-sky-400'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Logged Hours
              </label>
              <input
                type="number"
                min="0"
                max="500"
                value={loggedHours}
                onChange={(e) => setLoggedHours(Number(e.target.value))}
                className={`w-full px-2.5 py-2 text-xs rounded-xl border outline-none font-medium ${
                  isLight
                    ? 'bg-sky-50/30 border-sky-200 text-slate-800 focus:border-sky-500'
                    : 'bg-slate-800/80 border-slate-700 text-white focus:border-sky-400'
                }`}
              />
            </div>
          </div>

          {/* Start Date & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-medium ${
                  isLight
                    ? 'bg-sky-50/30 border-sky-200 text-slate-800 focus:border-sky-500'
                    : 'bg-slate-800/80 border-slate-700 text-white focus:border-sky-400'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Due Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-medium ${
                  isLight
                    ? 'bg-sky-50/30 border-sky-200 text-slate-800 focus:border-sky-500'
                    : 'bg-slate-800/80 border-slate-700 text-white focus:border-sky-400'
                }`}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
              Description & Acceptance Criteria
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline engineering scope, acceptance criteria, test assertions, or dependencies..."
              className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-medium resize-none ${
                isLight
                  ? 'bg-sky-50/30 border-sky-200 text-slate-800 focus:border-sky-500'
                  : 'bg-slate-800/80 border-slate-700 text-white focus:border-sky-400'
              }`}
            />
          </div>

          {/* Interactive Subtasks Checklist */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Subtask Checklist ({subtasks.filter((s) => s.completed).length}/{subtasks.length})
              </label>
              <span className="text-[10px] text-slate-400">Click check to toggle completion</span>
            </div>

            <div className="space-y-1.5 mb-2 max-h-36 overflow-y-auto">
              {subtasks.map((st) => (
                <div
                  key={st.id}
                  className={`flex items-center justify-between gap-2 p-2 rounded-lg border text-xs ${
                    st.completed
                      ? 'bg-emerald-50/30 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800/60'
                      : isLight
                      ? 'bg-slate-50 border-slate-200'
                      : 'bg-slate-800 border-slate-700'
                  }`}
                >
                  <div
                    onClick={() => handleToggleSubtask(st.id)}
                    className="flex items-center gap-2 cursor-pointer flex-1 min-w-0"
                  >
                    <input
                      type="checkbox"
                      checked={st.completed}
                      onChange={() => {}}
                      className="rounded accent-sky-500 pointer-events-none"
                    />
                    <span
                      className={`truncate ${
                        st.completed
                          ? 'line-through text-slate-400'
                          : 'text-slate-700 dark:text-slate-200 font-medium'
                      }`}
                    >
                      {st.title}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveSubtask(st.id)}
                    className="text-slate-400 hover:text-rose-500 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Quick add subtask form */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask(e);
                  }
                }}
                placeholder="Add subtask item (press Enter)..."
                className={`flex-1 px-3 py-1.5 text-xs rounded-lg border outline-none font-medium ${
                  isLight
                    ? 'bg-sky-50/30 border-sky-200 text-slate-800 focus:border-sky-500'
                    : 'bg-slate-800/80 border-slate-700 text-white focus:border-sky-400'
                }`}
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
              Technology Tags (comma-separated)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. OAuth2, Security, Fintech, Auth"
              className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-medium ${
                isLight
                  ? 'bg-sky-50/30 border-sky-200 text-slate-800 focus:border-sky-500'
                  : 'bg-slate-800/80 border-slate-700 text-white focus:border-sky-400'
              }`}
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-sky-100/30 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-colors ${
                isLight
                  ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold rounded-xl bg-sky-500 hover:bg-sky-600 text-white shadow-sm transition-all active:scale-95"
            >
              {taskToEdit ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

