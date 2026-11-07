import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import {
  Project,
  ProjectCategory,
  ProjectStatus,
  ProjectPriority,
  ProjectHealth,
} from '../../types/crm';
import { INITIAL_COMPANIES } from '../../data/mockData';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useSystemCurrency } from '../../data/currencyService';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: Project) => void;
  projectToEdit: Project | null;
}

const CATEGORIES: ProjectCategory[] = [
  'AI & Enterprise Automation',
  'Cloud Infrastructure & Migration',
  'Mobile & Web Application',
  'ERP Integration & Workflow',
  'Cybersecurity & Audit',
  'Custom SaaS Architecture',
];

const STATUS_OPTIONS: ProjectStatus[] = [
  'In Progress',
  'Completed',
  'On Hold',
  'Delayed',
  'Planning',
];

const PRIORITY_OPTIONS: ProjectPriority[] = ['Critical', 'High', 'Medium', 'Low'];
const HEALTH_OPTIONS: ProjectHealth[] = ['Good', 'At Risk', 'Critical'];

const MANAGERS = [
  'Sayed (CEO)',
  'Amit Kumar',
  'Neha Sharma',
  'Rizwan Khan',
  'Priya Singh',
  'Vikram Joshi',
];

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  onSave,
  projectToEdit,
}) => {
  const { theme } = useTheme();
  const { users } = useAuth();
  const currency = useSystemCurrency();
  const isLight = theme === 'white-sky';
  const staffList = React.useMemo(
    () => Array.from(new Set([...users.map((u) => u.name), ...MANAGERS])),
    [users]
  );

  const [name, setName] = useState('');
  const [client, setClient] = useState('');
  const [category, setCategory] = useState<ProjectCategory>(CATEGORIES[0]);
  const [status, setStatus] = useState<ProjectStatus>('In Progress');
  const [priority, setPriority] = useState<ProjectPriority>('High');
  const [health, setHealth] = useState<ProjectHealth>('Good');
  const [progress, setProgress] = useState<number>(25);
  const [budget, setBudget] = useState<number>(75000);
  const [spent, setSpent] = useState<number>(18000);
  const [startDate, setStartDate] = useState('2025-05-01');
  const [deadline, setDeadline] = useState('2025-08-31');
  const [projectManager, setProjectManager] = useState(MANAGERS[0]);
  const [selectedTeam, setSelectedTeam] = useState<string[]>([MANAGERS[0], MANAGERS[1]]);
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (projectToEdit) {
      setName(projectToEdit.name);
      setClient(projectToEdit.client);
      setCategory(projectToEdit.category);
      setStatus(projectToEdit.status);
      setPriority(projectToEdit.priority);
      setHealth(projectToEdit.health);
      setProgress(projectToEdit.progress);
      setBudget(projectToEdit.budget);
      setSpent(projectToEdit.spent);
      setStartDate(projectToEdit.startDate);
      setDeadline(projectToEdit.deadline);
      setProjectManager(projectToEdit.projectManager);
      setSelectedTeam(projectToEdit.team || [projectToEdit.projectManager]);
      setDescription(projectToEdit.description || '');
      setTagsInput(projectToEdit.tags ? projectToEdit.tags.join(', ') : '');
    } else {
      setName('');
      setClient('');
      setCategory(CATEGORIES[0]);
      setStatus('In Progress');
      setPriority('High');
      setHealth('Good');
      setProgress(15);
      setBudget(85000);
      setSpent(12000);
      setStartDate('2025-05-01');
      setDeadline('2025-08-31');
      setProjectManager(MANAGERS[0]);
      setSelectedTeam([MANAGERS[0], MANAGERS[1]]);
      setDescription('');
      setTagsInput('Cloud, Architecture, Enterprise');
    }
    setErrors({});
  }, [projectToEdit, isOpen]);

  if (!isOpen) return null;

  const handleToggleTeamMember = (member: string) => {
    setSelectedTeam((prev) =>
      prev.includes(member) ? prev.filter((m) => m !== member) : [...prev, member]
    );
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Project title is required';
    if (!client.trim()) errs.client = 'Client organization is required';
    if (!deadline) errs.deadline = 'Target deadline is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const saved: Project = {
      id: projectToEdit ? projectToEdit.id : `proj-${Date.now()}`,
      name: name.trim(),
      client: client.trim(),
      category,
      status,
      priority,
      health,
      progress: status === 'Completed' ? 100 : Math.min(100, Math.max(0, Number(progress) || 0)),
      budget: Number(budget) || 0,
      spent: Number(spent) || 0,
      startDate,
      deadline,
      projectManager,
      team: selectedTeam.length > 0 ? selectedTeam : [projectManager],
      totalTasks: projectToEdit ? projectToEdit.totalTasks : 20,
      completedTasks: projectToEdit
        ? status === 'Completed'
          ? projectToEdit.totalTasks
          : projectToEdit.completedTasks
        : Math.round(20 * (progress / 100)),
      openBugs: projectToEdit ? projectToEdit.openBugs : 0,
      milestones: projectToEdit?.milestones || [
        { id: 'm1', title: 'Architecture Scope & Design Spec', dueDate: startDate, completed: true },
        { id: 'm2', title: 'Core Implementation & Integration', dueDate: deadline, completed: status === 'Completed' },
      ],
      description: description.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined,
      createdAt: projectToEdit?.createdAt || new Date().toISOString().split('T')[0],
    };

    onSave(saved);
    onClose();
  };

  const inputClass = `w-full text-xs px-3 py-2 rounded-lg border outline-none font-medium transition-colors ${
    isLight
      ? 'bg-sky-50/30 border-sky-200 text-slate-800 focus:border-sky-500 focus:bg-white'
      : 'bg-slate-800/80 border-slate-700 text-slate-100 focus:border-sky-400 focus:bg-slate-800'
  }`;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div
        className={`relative w-full max-w-2xl rounded-2xl shadow-2xl border overflow-hidden z-10 max-h-[90vh] flex flex-col ${
          isLight ? 'bg-white border-sky-100 text-slate-800' : 'bg-slate-900 border-slate-700 text-white'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-sky-100/30">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500 text-white shadow-xs">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {projectToEdit ? 'Edit Engineering Project' : 'Create New Engineering Project'}
              </h2>
              <p className="text-xs text-slate-400">
                {projectToEdit
                  ? `Update scope and timeline for ${projectToEdit.name}`
                  : 'Track deliverables, milestones, budgets, and engineering resources'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {/* Project Name & Client */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-300">
                Project Name *
              </label>
              <div className="relative">
                <FolderKanban className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Cloud Infrastructure Migration"
                  className={`${inputClass} pl-9`}
                />
              </div>
              {errors.name && <p className="text-[10px] text-rose-500 mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-300">
                Client Organization *
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  list="client-suggestions"
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  placeholder="e.g. TechVision Inc."
                  className={`${inputClass} pl-9`}
                />
                <datalist id="client-suggestions">
                  {INITIAL_COMPANIES.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.industry}
                    </option>
                  ))}
                </datalist>
              </div>
              {errors.client && <p className="text-[10px] text-rose-500 mt-1">{errors.client}</p>}
            </div>
          </div>

          {/* Category & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-300">
                Project Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProjectCategory)}
                className={inputClass}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-300">
                Current Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className={inputClass}
              >
                {STATUS_OPTIONS.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Priority & Health */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-300">
                Delivery Priority
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {PRIORITY_OPTIONS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`py-1.5 px-1.5 rounded-lg font-bold text-center border transition-all text-[11px] ${
                      priority === p
                        ? p === 'Critical'
                          ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                          : p === 'High'
                          ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                          : p === 'Medium'
                          ? 'bg-sky-500 text-white border-sky-500 shadow-xs'
                          : 'bg-slate-500 text-white border-slate-500 shadow-xs'
                        : isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-300">
                Project Health
              </label>
              <div className="grid grid-cols-3 gap-2">
                {HEALTH_OPTIONS.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setHealth(h)}
                    className={`py-1.5 px-2 rounded-lg font-bold text-center border transition-all text-xs ${
                      health === h
                        ? h === 'Good'
                          ? 'bg-emerald-500 text-white border-emerald-500 shadow-xs'
                          : h === 'At Risk'
                          ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                          : 'bg-rose-500 text-white border-rose-500 shadow-xs'
                        : isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Progress Slider */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-600 dark:text-slate-300">
                Completion Progress: <span className="font-bold text-sky-500">{progress}%</span>
              </label>
              <span className="text-[10px] text-slate-400">Drag to update</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
          </div>

          {/* Budget & Spend */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-300">
                Total Contract Budget ({currency.symbol})
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  min="0"
                  step="5000"
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className={`${inputClass} pl-9`}
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-300">
                Actual Budget Spent ({currency.symbol})
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={spent}
                  onChange={(e) => setSpent(Number(e.target.value))}
                  className={`${inputClass} pl-9`}
                />
              </div>
            </div>
          </div>

          {/* Start Date & Deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-300">
                Project Kickoff Date
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={`${inputClass} pl-9`}
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-300">
                Target Delivery Deadline *
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  required
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className={`${inputClass} pl-9`}
                />
              </div>
            </div>
          </div>

          {/* Project Manager & Team Allocation */}
          <div className="space-y-2">
            <div>
              <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-300">
                Lead Project Manager
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={projectManager}
                  onChange={(e) => setProjectManager(e.target.value)}
                  className={`${inputClass} pl-9`}
                >
                  {staffList.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1.5 text-slate-600 dark:text-slate-300">
                Allocated Project Team
              </label>
              <div className="flex flex-wrap gap-2">
                {staffList.map((member) => {
                  const isChecked = selectedTeam.includes(member);
                  return (
                    <button
                      key={member}
                      type="button"
                      onClick={() => handleToggleTeamMember(member)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                        isChecked
                          ? 'bg-sky-500 text-white border-sky-500 shadow-2xs'
                          : isLight
                          ? 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <span>{member}</span>
                      {isChecked && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-300">
              Project Scope & Engineering Objectives
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="High-level architecture objectives, infrastructure prerequisites, deliverables..."
                className={`${inputClass} pl-9 py-2`}
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-300">
              Technology Tags (Comma-separated)
            </label>
            <div className="relative">
              <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Kubernetes, React, AWS, Microservices"
                className={`${inputClass} pl-9`}
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-sky-100/30">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                isLight
                  ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg font-bold text-white bg-sky-500 hover:bg-sky-600 shadow-sm transition-all active:scale-95"
            >
              {projectToEdit ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

