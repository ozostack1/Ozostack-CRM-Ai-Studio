import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  DollarSign,
  User,
  Palette,
  Check,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useSystemCurrency } from '../../data/currencyService';
import { DepartmentSummary } from './teamMockData';

interface DepartmentModalProps {
  isOpen: boolean;
  department: DepartmentSummary | null;
  onClose: () => void;
  onSave: (dept: DepartmentSummary) => void;
  existingManagers: string[];
}

const COLOR_OPTIONS = [
  { label: 'Sky & Indigo', value: 'from-sky-500 to-indigo-600', preview: 'bg-gradient-to-r from-sky-500 to-indigo-600' },
  { label: 'Pink & Purple', value: 'from-pink-500 to-purple-600', preview: 'bg-gradient-to-r from-pink-500 to-purple-600' },
  { label: 'Violet & Indigo', value: 'from-violet-500 to-indigo-700', preview: 'bg-gradient-to-r from-violet-500 to-indigo-700' },
  { label: 'Cyan & Blue', value: 'from-cyan-500 to-blue-600', preview: 'bg-gradient-to-r from-cyan-500 to-blue-600' },
  { label: 'Amber & Rose', value: 'from-amber-500 to-rose-600', preview: 'bg-gradient-to-r from-amber-500 to-rose-600' },
  { label: 'Emerald & Teal', value: 'from-emerald-500 to-teal-700', preview: 'bg-gradient-to-r from-emerald-500 to-teal-700' },
  { label: 'Orange & Red', value: 'from-orange-500 to-red-600', preview: 'bg-gradient-to-r from-orange-500 to-red-600' },
  { label: 'Slate & Slate', value: 'from-slate-600 to-slate-800', preview: 'bg-gradient-to-r from-slate-600 to-slate-800' },
];

export const DepartmentModal: React.FC<DepartmentModalProps> = ({
  isOpen,
  department,
  onClose,
  onSave,
  existingManagers,
}) => {
  const { theme } = useTheme();
  const currency = useSystemCurrency();
  const isLight = theme === 'white-sky';

  const [name, setName] = useState('');
  const [head, setHead] = useState(existingManagers[0] || 'Sayed (CEO)');
  const [monthlyBudget, setMonthlyBudget] = useState(25000);
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(COLOR_OPTIONS[0].value);
  const [error, setError] = useState('');

  useEffect(() => {
    if (department) {
      setName(department.name);
      setHead(department.head);
      setMonthlyBudget(department.monthlyBudget);
      setDescription(department.description);
      setColor(department.color);
    } else {
      setName('');
      setHead(existingManagers[0] || 'Sayed (CEO)');
      setMonthlyBudget(25000);
      setDescription('');
      setColor(COLOR_OPTIONS[0].value);
    }
    setError('');
  }, [department, isOpen, existingManagers]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Department name is required.');
      return;
    }

    const headAvatar = head
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'DH';

    const newOrUpdatedDept: DepartmentSummary = {
      id: department ? department.id : `dept-${Date.now()}`,
      name: name.trim(),
      head: head.trim(),
      headAvatar,
      memberCount: department ? department.memberCount : 0,
      openPositions: department ? department.openPositions : 0,
      monthlyBudget: Number(monthlyBudget) || 20000,
      avgProductivity: department ? department.avgProductivity : 88.0,
      description: description.trim() || `Department focusing on ${name.trim()} operations.`,
      color,
    };

    onSave(newOrUpdatedDept);
    onClose();
  };

  const modalBg = isLight ? 'bg-white text-slate-800' : 'bg-[#0f172a] text-slate-100';
  const inputBg = isLight
    ? 'bg-slate-50 border-sky-200/80 focus:bg-white text-slate-900 placeholder-slate-400'
    : 'bg-slate-800/80 border-slate-700 focus:bg-slate-800 text-slate-100 placeholder-slate-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden my-8 ${modalBg} ${
          isLight ? 'border-sky-100' : 'border-slate-800'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${
            isLight ? 'border-sky-100 bg-sky-50/50' : 'border-slate-800 bg-slate-800/50'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {department ? 'Edit Department' : 'Create New Department'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure organizational unit, leadership, and operational budget
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Department Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Legal & Compliance, Customer Success"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl text-xs border transition-colors outline-hidden focus:ring-2 focus:ring-sky-500/20 ${inputBg}`}
              required
            />
            {error && <p className="text-xs text-rose-500 mt-1 font-medium">{error}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Head of Department
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <select
                  value={head}
                  onChange={(e) => setHead(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs border transition-colors outline-hidden focus:ring-2 focus:ring-sky-500/20 ${inputBg}`}
                >
                  {existingManagers.map((mgr) => (
                    <option key={mgr} value={mgr}>
                      {mgr}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Monthly Budget ({currency.symbol})
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={monthlyBudget}
                  onChange={(e) => setMonthlyBudget(Number(e.target.value))}
                  className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs border transition-colors outline-hidden focus:ring-2 focus:ring-sky-500/20 ${inputBg}`}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Color Theme
            </label>
            <div className="grid grid-cols-4 gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  type="button"
                  key={c.value}
                  onClick={() => setColor(c.value)}
                  className={`flex items-center gap-2 p-2 rounded-xl border text-[11px] font-medium transition-all ${
                    color === c.value
                      ? 'border-sky-500 ring-2 ring-sky-500/20 bg-sky-50/30 dark:bg-slate-800'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className={`w-3.5 h-3.5 rounded-full ${c.preview} shrink-0`} />
                  <span className="truncate text-[10px]">{c.label.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Mission &amp; Focus Description
            </label>
            <textarea
              rows={3}
              placeholder="Detail key responsibilities, roadmap focus, and cross-functional mandate..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl text-xs border transition-colors outline-hidden focus:ring-2 focus:ring-sky-500/20 resize-none ${inputBg}`}
            />
          </div>

          {/* Footer Actions */}
          <div
            className={`pt-4 border-t flex items-center justify-end gap-2.5 ${
              isLight ? 'border-sky-100' : 'border-slate-800'
            }`}
          >
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 shadow-md shadow-sky-500/20 transition-all"
            >
              <Check className="w-4 h-4" />
              {department ? 'Save Changes' : 'Create Department'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

