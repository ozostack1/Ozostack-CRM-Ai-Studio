import React, { useState } from 'react';
import { X, LayoutDashboard, Sparkles, Check, Palette } from 'lucide-react';
import { DashboardConfig } from '../../types/dashboard';
import { useTheme } from '../../context/ThemeContext';

interface CreateDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (dashboard: DashboardConfig) => void;
}

const COLOR_OPTIONS = [
  { name: 'Sky Blue', hex: '#38bdf8' },
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Indigo', hex: '#6366f1' },
  { name: 'Amber Gold', hex: '#f59e0b' },
  { name: 'Rose', hex: '#f43f5e' },
  { name: 'Cyan', hex: '#06b6d4' },
];

const PRESETS = [
  {
    id: 'full',
    name: 'Executive Full Suite',
    desc: 'All 5 core modules (KPIs, Charts, Sprints, Tables & Financials)',
    widgetIds: ['kpi-metrics', 'charts-revenue', 'mid-analytics', 'tables-section', 'bottom-kpi'],
  },
  {
    id: 'sales',
    name: 'Sales & Revenue',
    desc: 'Pipeline funnel, revenue charts, deals table & cash runway',
    widgetIds: ['kpi-metrics', 'charts-revenue', 'tables-section', 'bottom-kpi'],
  },
  {
    id: 'ops',
    name: 'Operations & Sprints',
    desc: 'Project burndowns, overdue tasks & team productivity',
    widgetIds: ['mid-analytics', 'tables-section', 'bottom-kpi'],
  },
  {
    id: 'blank',
    name: 'Custom Blank Canvas',
    desc: 'Start clean and selectively add widgets as needed',
    widgetIds: [],
  },
];

export const CreateDashboardModal: React.FC<CreateDashboardModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'white-sky';

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0].hex);
  const [selectedPreset, setSelectedPreset] = useState('full');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const preset = PRESETS.find((p) => p.id === selectedPreset) || PRESETS[0];

    const newDashboard: DashboardConfig = {
      id: `dash-${Date.now()}`,
      name: name.trim(),
      description: description.trim() || 'Custom executive dashboard board.',
      isDefault: false,
      color: selectedColor,
      widgetIds: [...preset.widgetIds],
      createdAt: new Date().toISOString(),
    };

    onCreate(newDashboard);
    setName('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div
        className={`relative w-full max-w-lg rounded-2xl shadow-2xl border flex flex-col overflow-hidden my-auto animate-fade-in ${
          isLight
            ? 'bg-white border-sky-100 text-slate-800'
            : 'bg-slate-900 border-slate-700 text-slate-100'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-sky-100/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center font-extrabold shadow-sm">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Create New Dashboard
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Design a custom executive board with selected widgets & layout
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
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 text-xs">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
              Dashboard Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Q3 Investor Board or Engineering Sprint Hub"
              className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-medium ${
                isLight
                  ? 'bg-sky-50/30 border-sky-200 text-slate-800 focus:border-sky-500'
                  : 'bg-slate-800/80 border-slate-700 text-white focus:border-sky-400'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
              Description / Focus
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Real-time metrics for leadership and investors"
              className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-medium ${
                isLight
                  ? 'bg-sky-50/30 border-sky-200 text-slate-800 focus:border-sky-500'
                  : 'bg-slate-800/80 border-slate-700 text-white focus:border-sky-400'
              }`}
            />
          </div>

          {/* Template Preset Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-2">
              Starting Layout Preset
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESETS.map((preset) => {
                const isSelected = selectedPreset === preset.id;
                return (
                  <div
                    key={preset.id}
                    onClick={() => setSelectedPreset(preset.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-sky-500 bg-sky-500/10 text-sky-600 dark:text-sky-300 font-bold'
                        : isLight
                        ? 'border-slate-200 bg-slate-50/60 hover:bg-slate-100'
                        : 'border-slate-700 bg-slate-800/50 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold">{preset.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-sky-500" />}
                    </div>
                    <p className="text-[10px] text-slate-400 font-normal leading-tight">
                      {preset.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Color Accent Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-sky-500" />
              <span>Theme Accent Color</span>
            </label>
            <div className="flex items-center gap-2.5 flex-wrap">
              {COLOR_OPTIONS.map((col) => (
                <button
                  key={col.hex}
                  type="button"
                  onClick={() => setSelectedColor(col.hex)}
                  className={`w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center ${
                    selectedColor === col.hex
                      ? 'scale-115 ring-2 ring-sky-400 border-white'
                      : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: col.hex }}
                  title={col.name}
                />
              ))}
            </div>
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
              Create Dashboard
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

