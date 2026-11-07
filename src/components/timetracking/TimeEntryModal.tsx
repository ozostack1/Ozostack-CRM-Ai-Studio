import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  Calendar,
  Building2,
  FolderKanban,
  CheckSquare,
  User,
  DollarSign,
  FileText,
  Tag,
  Sparkles,
  Plus,
} from 'lucide-react';
import { TimeEntry, TimeEntryApprovalStatus } from '../../types/crm';
import { useTheme } from '../../context/ThemeContext';
import { useSystemCurrency } from '../../data/currencyService';

interface TimeEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: TimeEntry) => void;
  entryToEdit?: TimeEntry | null;
  availableProjects?: { id: string; name: string; client: string }[];
  availableTasks?: { id: string; title: string; project: string }[];
  availableMembers?: { name: string; avatar: string; rate?: number }[];
}

const DEFAULT_MEMBERS = [
  { name: 'Amit Kumar', avatar: 'AK', rate: 140 },
  { name: 'Neha Sharma', avatar: 'NS', rate: 160 },
  { name: 'Rizwan Khan', avatar: 'RK', rate: 125 },
  { name: 'Priya Singh', avatar: 'PS', rate: 115 },
  { name: 'Vikram Joshi', avatar: 'VJ', rate: 130 },
  { name: 'Sayed (CEO)', avatar: 'SC', rate: 200 },
];

export const TimeEntryModal: React.FC<TimeEntryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  entryToEdit,
  availableProjects = [],
  availableTasks = [],
  availableMembers = DEFAULT_MEMBERS,
}) => {
  const { theme } = useTheme();
  const currency = useSystemCurrency();
  const isLight = theme === 'white-sky';

  const [projectName, setProjectName] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [isCustomTask, setIsCustomTask] = useState(false);
  const [customTaskInput, setCustomTaskInput] = useState('');

  const [userName, setUserName] = useState('Sayed (CEO)');
  const [date, setDate] = useState('2025-05-20');
  const [startTime, setStartTime] = useState('09:00 AM');
  const [endTime, setEndTime] = useState('01:00 PM');
  const [durationHours, setDurationHours] = useState<number | string>(4.0);
  const [description, setDescription] = useState('');
  const [isBillable, setIsBillable] = useState(true);
  const [hourlyRate, setHourlyRate] = useState<number | string>(200);
  const [status, setStatus] = useState<TimeEntryApprovalStatus>('Approved');
  const [tagsInput, setTagsInput] = useState('');

  // Update default rate when member changes
  const handleMemberChange = (selectedMember: string) => {
    setUserName(selectedMember);
    const m = availableMembers.find((item) => item.name === selectedMember);
    if (m?.rate) {
      setHourlyRate(m.rate);
    }
  };

  useEffect(() => {
    if (entryToEdit) {
      setProjectName(entryToEdit.projectName);
      setTaskTitle(entryToEdit.taskTitle);
      setIsCustomTask(false);
      setCustomTaskInput('');
      setUserName(entryToEdit.userName);
      setDate(entryToEdit.date);
      setStartTime(entryToEdit.startTime || '09:00 AM');
      setEndTime(entryToEdit.endTime || '01:00 PM');
      setDurationHours(entryToEdit.durationHours);
      setDescription(entryToEdit.description);
      setIsBillable(entryToEdit.isBillable);
      setHourlyRate(entryToEdit.hourlyRate);
      setStatus(entryToEdit.status);
      setTagsInput(entryToEdit.tags ? entryToEdit.tags.join(', ') : '');
    } else {
      const defaultProj = availableProjects[0]?.name || 'PCI-DSS Banking API Gateway';
      setProjectName(defaultProj);
      const matching = availableTasks.filter(
        (t) => t.project.toLowerCase() === defaultProj.toLowerCase()
      );
      setTaskTitle(matching[0]?.title || availableTasks[0]?.title || 'OAuth2 Multi-Factor Authentication Flow');
      setIsCustomTask(false);
      setCustomTaskInput('');
      setUserName('Sayed (CEO)');
      setDate('2025-05-20');
      setStartTime('09:00 AM');
      setEndTime('01:00 PM');
      setDurationHours(4.0);
      setDescription('');
      setIsBillable(true);
      setHourlyRate(200);
      setStatus('Approved');
      setTagsInput('');
    }
  }, [entryToEdit, isOpen, availableProjects, availableTasks]);

  if (!isOpen) return null;

  // Filter tasks belonging to selected project
  const matchingTasks = availableTasks.filter(
    (t) => !projectName || t.project.toLowerCase() === projectName.toLowerCase()
  );

  const selectedProjObj = availableProjects.find(
    (p) => p.name.toLowerCase() === projectName.toLowerCase()
  );

  const clientName = selectedProjObj?.client || entryToEdit?.client || 'Enterprise Client';

  const memberObj = availableMembers.find((m) => m.name === userName);
  const userAvatar = memberObj?.avatar || userName.slice(0, 2).toUpperCase();

  const numHours = Number(durationHours) || 0;
  const numRate = Number(hourlyRate) || 0;
  const computedBillableAmount = isBillable ? Math.round(numHours * numRate * 100) / 100 : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTask = isCustomTask ? customTaskInput.trim() : taskTitle.trim();
    if (!projectName.trim() || !finalTask || !date) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const newEntry: TimeEntry = {
      id: entryToEdit ? entryToEdit.id : `time-${Date.now()}`,
      taskId: entryToEdit?.taskId || matchingTasks.find((t) => t.title === finalTask)?.id,
      taskTitle: finalTask,
      projectId: selectedProjObj?.id || entryToEdit?.projectId,
      projectName: projectName.trim(),
      client: clientName,
      userName: userName.trim(),
      userAvatar,
      date,
      startTime: startTime.trim() || undefined,
      endTime: endTime.trim() || undefined,
      durationHours: numHours,
      description: description.trim() || 'Engineering consultation and deliverable execution.',
      isBillable,
      hourlyRate: numRate,
      billableAmount: computedBillableAmount,
      status,
      tags: tags.length > 0 ? tags : undefined,
      createdAt: entryToEdit?.createdAt || new Date().toISOString(),
    };

    onSave(newEntry);
    onClose();
  };

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
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {entryToEdit ? 'Edit Timesheet Log' : 'Log Time Entry'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Record billable client hours, tasks worked, and consultation time
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
          {/* Project & Client */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Project <span className="text-rose-500">*</span>
              </label>
              {availableProjects.length > 0 ? (
                <select
                  value={projectName}
                  onChange={(e) => {
                    setProjectName(e.target.value);
                    const matching = availableTasks.filter(
                      (t) => t.project.toLowerCase() === e.target.value.toLowerCase()
                    );
                    if (matching.length > 0) {
                      setTaskTitle(matching[0].title);
                      setIsCustomTask(false);
                    }
                  }}
                  className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-medium cursor-pointer ${
                    isLight
                      ? 'bg-sky-50/30 border-sky-200 text-slate-800 focus:border-sky-500'
                      : 'bg-slate-800/80 border-slate-700 text-white focus:border-sky-400'
                  }`}
                >
                  {availableProjects.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  required
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
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
                disabled
                value={clientName}
                className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-medium opacity-80 cursor-not-allowed ${
                  isLight
                    ? 'bg-slate-100 border-slate-200 text-slate-600'
                    : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}
              />
            </div>
          </div>

          {/* Task Title */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Task / Deliverable <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsCustomTask(!isCustomTask);
                  if (!isCustomTask) setCustomTaskInput(taskTitle);
                }}
                className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline"
              >
                {isCustomTask ? 'Select from predefined tasks' : '+ Enter custom task'}
              </button>
            </div>

            {isCustomTask ? (
              <input
                type="text"
                required
                value={customTaskInput}
                onChange={(e) => setCustomTaskInput(e.target.value)}
                placeholder="Enter custom task or consultation topic..."
                className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-medium ${
                  isLight
                    ? 'bg-sky-50/30 border-sky-200 text-slate-800 focus:border-sky-500'
                    : 'bg-slate-800/80 border-slate-700 text-white focus:border-sky-400'
                }`}
              />
            ) : matchingTasks.length > 0 ? (
              <select
                value={taskTitle}
                onChange={(e) => {
                  if (e.target.value === '__custom__') {
                    setIsCustomTask(true);
                    setCustomTaskInput('');
                  } else {
                    setTaskTitle(e.target.value);
                  }
                }}
                className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-medium cursor-pointer ${
                  isLight
                    ? 'bg-sky-50/30 border-sky-200 text-slate-800 focus:border-sky-500'
                    : 'bg-slate-800/80 border-slate-700 text-white focus:border-sky-400'
                }`}
              >
                {matchingTasks.map((t) => (
                  <option key={t.id} value={t.title}>
                    {t.title}
                  </option>
                ))}
                <option value="General Engineering & Architecture Consultation">
                  -- General Engineering & Architecture Consultation --
                </option>
                <option value="__custom__">+ Enter Custom Task Title...</option>
              </select>
            ) : (
              <input
                type="text"
                required
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="e.g. OAuth2 Multi-Factor Authentication Flow"
                className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-medium ${
                  isLight
                    ? 'bg-sky-50/30 border-sky-200 text-slate-800 focus:border-sky-500'
                    : 'bg-slate-800/80 border-slate-700 text-white focus:border-sky-400'
                }`}
              />
            )}
          </div>

          {/* Team Member & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Team Member / Contributor <span className="text-rose-500">*</span>
              </label>
              <select
                value={userName}
                onChange={(e) => handleMemberChange(e.target.value)}
                className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-medium cursor-pointer ${
                  isLight
                    ? 'bg-sky-50/30 border-sky-200 text-slate-800 focus:border-sky-500'
                    : 'bg-slate-800/80 border-slate-700 text-white focus:border-sky-400'
                }`}
              >
                {availableMembers.map((m) => (
                  <option key={m.name} value={m.name}>
                    {m.name} {m.rate ? `(${currency.symbol}${m.rate}/hr)` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-medium ${
                  isLight
                    ? 'bg-sky-50/30 border-sky-200 text-slate-800 focus:border-sky-500'
                    : 'bg-slate-800/80 border-slate-700 text-white focus:border-sky-400'
                }`}
              />
            </div>
          </div>

          {/* Timeslot & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Start Time
              </label>
              <input
                type="text"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                placeholder="e.g. 09:00 AM"
                className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-medium ${
                  isLight
                    ? 'bg-sky-50/30 border-sky-200 text-slate-800 focus:border-sky-500'
                    : 'bg-slate-800/80 border-slate-700 text-white focus:border-sky-400'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                End Time
              </label>
              <input
                type="text"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                placeholder="e.g. 01:00 PM"
                className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-medium ${
                  isLight
                    ? 'bg-sky-50/30 border-sky-200 text-slate-800 focus:border-sky-500'
                    : 'bg-slate-800/80 border-slate-700 text-white focus:border-sky-400'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Total Hours <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.25"
                min="0.25"
                required
                value={durationHours}
                onChange={(e) => setDurationHours(e.target.value)}
                placeholder="e.g. 4.0"
                className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-bold text-sky-600 dark:text-sky-400 ${
                  isLight
                    ? 'bg-sky-50/30 border-sky-200 focus:border-sky-500'
                    : 'bg-slate-800/80 border-slate-700 focus:border-sky-400'
                }`}
              />
            </div>
          </div>

          {/* Billing & Rate Card Banner */}
          <div className="p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/30 dark:bg-indigo-950/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-[11px] uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                Client Billing & Revenue Attribution
              </span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isBillable}
                  onChange={(e) => setIsBillable(e.target.checked)}
                  className="rounded text-sky-600 focus:ring-sky-500"
                />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Billable to Client
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Hourly Rate ({currency.symbol}/hr)
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{currency.symbol}</span>
                  <input
                    type="number"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    placeholder="140"
                    disabled={!isBillable}
                    className={`w-full pl-6 pr-3 py-1.5 text-xs rounded-lg border outline-none font-bold ${
                      isBillable
                        ? isLight
                          ? 'bg-white border-slate-200 text-slate-800'
                          : 'bg-slate-900 border-slate-700 text-white'
                        : 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-800'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Approval Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TimeEntryApprovalStatus)}
                  className={`w-full px-3 py-1.5 text-xs rounded-lg border outline-none font-semibold cursor-pointer ${
                    isLight
                      ? 'bg-white border-slate-200 text-slate-800'
                      : 'bg-slate-900 border-slate-700 text-white'
                  }`}
                >
                  <option value="Approved">Approved</option>
                  <option value="Pending">Pending Review</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div>
                <span className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                  Realized Value
                </span>
                <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                  {isBillable ? `${currency.symbol}${computedBillableAmount.toLocaleString()}` : `${currency.symbol}0.00 (Non-billable)`}
                </span>
              </div>
            </div>
          </div>

          {/* Description & Work Summary */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
              Work Notes / Activity Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail the technical tasks completed, PRs merged, benchmarks run, or client deliverables executed..."
              className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-medium resize-none ${
                isLight
                  ? 'bg-sky-50/30 border-sky-200 text-slate-800 focus:border-sky-500'
                  : 'bg-slate-800/80 border-slate-700 text-white focus:border-sky-400'
              }`}
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
              Tags / Category Labels (comma-separated)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. Security, OAuth2, Backend, Staging"
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
              {entryToEdit ? 'Save Changes' : 'Log Time Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
