import React from 'react';
import { X, Plus, Check, LayoutGrid, BarChart3, Users, DollarSign, Activity } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { AVAILABLE_WIDGETS, WidgetDefinition } from '../types/dashboard';

interface AddWidgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeDashboardName?: string;
  activeWidgetIds?: string[];
  onToggleWidget?: (widgetId: string) => void;
}

export const AddWidgetModal: React.FC<AddWidgetModalProps> = ({
  isOpen,
  onClose,
  activeDashboardName = 'CEO Command Center',
  activeWidgetIds = ['kpi-metrics', 'charts-revenue', 'mid-analytics', 'tables-section', 'bottom-kpi'],
  onToggleWidget,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'white-sky';

  if (!isOpen) return null;

  const getWidgetIcon = (category: string) => {
    switch (category) {
      case 'Executive':
        return <Activity className="w-4 h-4 text-sky-500" />;
      case 'Sales':
        return <BarChart3 className="w-4 h-4 text-emerald-500" />;
      case 'Operations':
        return <LayoutGrid className="w-4 h-4 text-amber-500" />;
      case 'Finance':
        return <DollarSign className="w-4 h-4 text-indigo-500" />;
      default:
        return <LayoutGrid className="w-4 h-4 text-sky-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        className={`w-full max-w-xl rounded-2xl border shadow-2xl p-5 transition-all ${
          isLight
            ? 'bg-white border-sky-100 text-slate-800'
            : 'bg-slate-900 border-slate-700 text-white'
        }`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-sky-100/30">
          <div>
            <h2 className="text-base font-bold">Customize Dashboard Widgets</h2>
            <p className="text-xs text-slate-400">
              Add or remove modules on <strong className="text-sky-500">{activeDashboardName}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2.5 py-4 max-h-[60vh] overflow-y-auto">
          {AVAILABLE_WIDGETS.map((widget) => {
            const isEnabled = activeWidgetIds.includes(widget.id);

            return (
              <div
                key={widget.id}
                className={`flex items-center justify-between p-3.5 rounded-xl border transition-colors ${
                  isEnabled
                    ? isLight
                      ? 'bg-sky-50/40 border-sky-200'
                      : 'bg-sky-950/20 border-sky-900/60'
                    : isLight
                    ? 'bg-slate-50 border-sky-100/60 hover:bg-sky-50/30'
                    : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0 pr-3">
                  <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 mt-0.5">
                    {getWidgetIcon(widget.category)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <h3 className="text-xs font-bold leading-tight">{widget.title}</h3>
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400">
                        {widget.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {widget.description}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onToggleWidget?.(widget.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
                    isEnabled
                      ? 'bg-sky-500 hover:bg-sky-600 text-white shadow-xs'
                      : isLight
                      ? 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                      : 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {isEnabled ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Added</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-sky-100/30">
          <span className="text-xs text-slate-400 font-medium">
            {activeWidgetIds.length} of {AVAILABLE_WIDGETS.length} widgets active
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-white bg-sky-500 hover:bg-sky-600 rounded-xl shadow-sm transition-all active:scale-95"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
