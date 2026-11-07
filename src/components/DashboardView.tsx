import React, { useState, useEffect } from 'react';
import {
  Crown,
  Plus,
  GripVertical,
  X,
  Trash2,
  RotateCcw,
  LayoutDashboard,
  CheckCircle2,
  Sparkles,
  Info,
  FolderKanban,
  CheckSquare,
  Receipt,
  CreditCard,
  Banknote,
  TrendingUp,
  ChevronRight,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useSystemCurrency } from '../data/currencyService';
import { DashboardConfig, INITIAL_DASHBOARDS, AVAILABLE_WIDGETS } from '../types/dashboard';
import { MetricCards } from './MetricCards';
import { ChartsSection } from './ChartsSection';
import { MidLevelAnalytics } from './MidLevelAnalytics';
import { TablesSection } from './TablesSection';
import { BottomKpiStrip } from './BottomKpiStrip';
import { CreateDashboardModal } from './dashboard/CreateDashboardModal';
import { AddWidgetModal } from './AddWidgetModal';

interface DashboardViewProps {
  onOpenAddWidget?: () => void;
  isAddWidgetOpenExternal?: boolean;
  onCloseAddWidgetExternal?: () => void;
}

const STORAGE_KEY = 'ozostack_custom_dashboards';
const ACTIVE_DASHBOARD_KEY = 'ozostack_active_dashboard_id';

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenAddWidget,
  isAddWidgetOpenExternal = false,
  onCloseAddWidgetExternal,
}) => {
  const { theme, setActiveNav } = useTheme();
  const isLight = theme === 'white-sky';
  const { currency } = useSystemCurrency();

  // Multi-Dashboard State with localStorage persistence
  const [dashboards, setDashboards] = useState<DashboardConfig[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load dashboards from storage', e);
    }
    return INITIAL_DASHBOARDS;
  });

  const [activeDashboardId, setActiveDashboardId] = useState<string>(() => {
    try {
      const savedId = localStorage.getItem(ACTIVE_DASHBOARD_KEY);
      if (savedId) return savedId;
    } catch (e) {
      console.error(e);
    }
    return 'ceo-command';
  });

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddWidgetModalOpen, setIsAddWidgetModalOpen] = useState(false);

  // Drag and drop state
  const [draggedWidgetId, setDraggedWidgetId] = useState<string | null>(null);
  const [dragOverWidgetId, setDragOverWidgetId] = useState<string | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dashboards));
    } catch (e) {
      console.error('Failed to persist dashboards', e);
    }
  }, [dashboards]);

  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_DASHBOARD_KEY, activeDashboardId);
    } catch (e) {
      console.error('Failed to persist active dashboard ID', e);
    }
  }, [activeDashboardId]);

  // Current active dashboard
  const activeDashboard =
    dashboards.find((d) => d.id === activeDashboardId) || dashboards[0] || INITIAL_DASHBOARDS[0];

  // Dashboard creation
  const handleCreateDashboard = (newDash: DashboardConfig) => {
    setDashboards((prev) => [...prev, newDash]);
    setActiveDashboardId(newDash.id);
    showToast(`Created new dashboard "${newDash.name}".`);
  };

  // Dashboard deletion
  const handleDeleteDashboard = (dashboardId: string, dashboardName: string) => {
    if (confirm(`Are you sure you want to delete the dashboard "${dashboardName}"?`)) {
      setDashboards((prev) => prev.filter((d) => d.id !== dashboardId));
      setActiveDashboardId('ceo-command');
      showToast(`Removed "${dashboardName}".`);
    }
  };

  // Toggle widget on active dashboard
  const handleToggleWidget = (widgetId: string) => {
    setDashboards((prev) =>
      prev.map((d) => {
        if (d.id !== activeDashboard.id) return d;
        const exists = d.widgetIds.includes(widgetId);
        const nextIds = exists
          ? d.widgetIds.filter((id) => id !== widgetId)
          : [...d.widgetIds, widgetId];
        return { ...d, widgetIds: nextIds };
      })
    );
  };

  // Remove single widget from current active board
  const handleRemoveWidget = (widgetId: string) => {
    const widgetInfo = AVAILABLE_WIDGETS.find((w) => w.id === widgetId);
    setDashboards((prev) =>
      prev.map((d) => {
        if (d.id !== activeDashboard.id) return d;
        return {
          ...d,
          widgetIds: d.widgetIds.filter((id) => id !== widgetId),
        };
      })
    );
    showToast(`Removed "${widgetInfo?.title || 'Widget'}" from this board.`);
  };

  // Reset layout to initial default
  const handleResetLayout = () => {
    const matchedInitial = INITIAL_DASHBOARDS.find((d) => d.id === activeDashboard.id);
    const defaultIds = matchedInitial
      ? matchedInitial.widgetIds
      : ['kpi-metrics', 'charts-revenue', 'mid-analytics', 'tables-section', 'bottom-kpi'];

    setDashboards((prev) =>
      prev.map((d) => (d.id === activeDashboard.id ? { ...d, widgetIds: [...defaultIds] } : d))
    );
    showToast('Reset dashboard layout to default.');
  };

  // HTML5 Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, widgetId: string) => {
    e.dataTransfer.setData('text/plain', widgetId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedWidgetId(widgetId);
  };

  const handleDragOver = (e: React.DragEvent, widgetId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverWidgetId !== widgetId) {
      setDragOverWidgetId(widgetId);
    }
  };

  const handleDrop = (e: React.DragEvent, targetWidgetId: string) => {
    e.preventDefault();
    const sourceWidgetId = e.dataTransfer.getData('text/plain') || draggedWidgetId;
    if (!sourceWidgetId || sourceWidgetId === targetWidgetId) {
      setDraggedWidgetId(null);
      setDragOverWidgetId(null);
      return;
    }

    const currentIds = [...activeDashboard.widgetIds];
    const sourceIndex = currentIds.indexOf(sourceWidgetId);
    const targetIndex = currentIds.indexOf(targetWidgetId);

    if (sourceIndex !== -1 && targetIndex !== -1) {
      // Reorder
      currentIds.splice(sourceIndex, 1);
      currentIds.splice(targetIndex, 0, sourceWidgetId);

      setDashboards((prev) =>
        prev.map((d) => (d.id === activeDashboard.id ? { ...d, widgetIds: currentIds } : d))
      );
      showToast('Dashboard widget layout updated.');
    }

    setDraggedWidgetId(null);
    setDragOverWidgetId(null);
  };

  const handleDragEnd = () => {
    setDraggedWidgetId(null);
    setDragOverWidgetId(null);
  };

  // Render content corresponding to each widget ID
  const renderWidgetContent = (widgetId: string) => {
    switch (widgetId) {
      case 'kpi-metrics':
        return <MetricCards />;
      case 'charts-revenue':
        return <ChartsSection />;
      case 'mid-analytics':
        return <MidLevelAnalytics />;
      case 'tables-section':
        return <TablesSection />;
      case 'bottom-kpi':
        return <BottomKpiStrip />;
      default:
        return null;
    }
  };

  const isAddModalOpen = isAddWidgetModalOpen || isAddWidgetOpenExternal;
  const handleCloseAddModal = () => {
    setIsAddWidgetModalOpen(false);
    if (onCloseAddWidgetExternal) onCloseAddWidgetExternal();
  };

  return (
    <div className="space-y-3.5">
      {/* 1. TOP MULTI-DASHBOARD MANAGEMENT BAR */}
      <div
        className={`flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-2xl border transition-colors ${
          isLight
            ? 'bg-white border-sky-100 shadow-xs'
            : 'bg-[#0f172a]/90 border-slate-800/80 shadow-md'
        }`}
      >
        {/* Left: Dashboard Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {dashboards.map((dash) => {
            const isActive = dash.id === activeDashboard.id;

            return (
              <button
                key={dash.id}
                onClick={() => setActiveDashboardId(dash.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 shrink-0 ${
                  isActive
                    ? 'bg-sky-500 text-white shadow-sm font-bold'
                    : isLight
                    ? 'text-slate-600 hover:bg-sky-50 hover:text-sky-600 border border-transparent'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white border border-transparent'
                }`}
              >
                {dash.isDefault && <Crown className="w-3.5 h-3.5 fill-current" />}
                {!dash.isDefault && (
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: dash.color || '#38bdf8' }}
                  />
                )}
                <span>{dash.name}</span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  {dash.widgetIds.length}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right: Actions (Add Widget, New Dashboard, Delete, Drag Hint) */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          {/* Drag & drop helper pill */}
          <div
            className={`hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border ${
              isLight
                ? 'border-sky-100 text-slate-400 bg-sky-50/40'
                : 'border-slate-800 text-slate-400 bg-slate-900/40'
            }`}
            title="Grab the handle on any widget to rearrange the layout"
          >
            <GripVertical className="w-3.5 h-3.5 text-sky-500" />
            <span>Drag cards to reorder</span>
          </div>

          {/* Reset Layout Button */}
          <button
            onClick={handleResetLayout}
            className={`p-1.5 rounded-xl text-slate-400 hover:text-sky-500 transition-colors border ${
              isLight ? 'border-sky-100 bg-slate-50' : 'border-slate-800 bg-slate-800/40'
            }`}
            title="Reset layout to default order"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Delete custom dashboard button if not default */}
          {!activeDashboard.isDefault && (
            <button
              onClick={() => handleDeleteDashboard(activeDashboard.id, activeDashboard.name)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 border border-slate-700/50 hover:bg-rose-500/10 transition-colors"
              title="Delete this custom dashboard"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Add Widget Button */}
          <button
            onClick={() => {
              if (onOpenAddWidget) onOpenAddWidget();
              else setIsAddWidgetModalOpen(true);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-colors ${
              isLight
                ? 'bg-white border-sky-200 text-slate-700 hover:bg-sky-50'
                : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
            }`}
          >
            <Plus className="w-3.5 h-3.5 text-sky-500" />
            <span>Add Widget</span>
          </button>

          {/* New Dashboard Button */}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-sky-500 hover:bg-sky-600 text-white shadow-sm transition-all active:scale-95"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>New Dashboard</span>
          </button>
        </div>
      </div>

      {/* 2. EXECUTIVE CONNECTED MODULES (Projects, Tasks, Finance Hub) */}
      <div
        className={`p-3 rounded-2xl border transition-all ${
          isLight
            ? 'bg-gradient-to-r from-sky-500/5 via-indigo-500/5 to-emerald-500/5 border-sky-100 shadow-xs'
            : 'bg-gradient-to-r from-sky-950/20 via-slate-900 to-emerald-950/20 border-slate-800 shadow-md'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-black tracking-wider uppercase text-slate-700 dark:text-slate-200">
              Executive Connected Modules
            </span>
            <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
              · Direct access to live Projects & Financial subsystems
            </span>
          </div>
          <span className="text-[10px] text-sky-500 font-semibold hidden md:inline">
            Click any module to inspect live data →
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {/* Projects */}
          <button
            onClick={() => setActiveNav('Projects')}
            className={`p-2.5 rounded-xl border text-left transition-all hover:scale-[1.02] flex items-center justify-between group ${
              isLight
                ? 'bg-white border-sky-100 hover:border-sky-300 hover:shadow-xs'
                : 'bg-slate-900/80 border-slate-800 hover:border-sky-500/50 hover:bg-slate-850'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-500 shrink-0 group-hover:bg-sky-500 group-hover:text-white transition-colors">
                <FolderKanban className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-bold text-slate-800 dark:text-white block truncate">
                  Projects
                </span>
                <span className="text-[9px] text-slate-400 block truncate">
                  38 Active · 2 Delayed
                </span>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-500 transition-colors shrink-0" />
          </button>

          {/* Tasks */}
          <button
            onClick={() => setActiveNav('Tasks')}
            className={`p-2.5 rounded-xl border text-left transition-all hover:scale-[1.02] flex items-center justify-between group ${
              isLight
                ? 'bg-white border-sky-100 hover:border-sky-300 hover:shadow-xs'
                : 'bg-slate-900/80 border-slate-800 hover:border-sky-500/50 hover:bg-slate-850'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500 shrink-0 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                <CheckSquare className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-bold text-slate-800 dark:text-white block truncate">
                  Tasks
                </span>
                <span className="text-[9px] text-slate-400 block truncate">
                  86 Due · 128 Done
                </span>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 transition-colors shrink-0" />
          </button>

          {/* Invoices */}
          <button
            onClick={() => setActiveNav('Invoices')}
            className={`p-2.5 rounded-xl border text-left transition-all hover:scale-[1.02] flex items-center justify-between group ${
              isLight
                ? 'bg-white border-sky-100 hover:border-sky-300 hover:shadow-xs'
                : 'bg-slate-900/80 border-slate-800 hover:border-sky-500/50 hover:bg-slate-850'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                <Receipt className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-bold text-slate-800 dark:text-white block truncate">
                  Invoices
                </span>
                <span className="text-[9px] text-emerald-500 font-semibold block truncate">
                  {currency.symbol}128.4K · 68% Paid
                </span>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500 transition-colors shrink-0" />
          </button>

          {/* Expenses */}
          <button
            onClick={() => setActiveNav('Expenses')}
            className={`p-2.5 rounded-xl border text-left transition-all hover:scale-[1.02] flex items-center justify-between group ${
              isLight
                ? 'bg-white border-sky-100 hover:border-sky-300 hover:shadow-xs'
                : 'bg-slate-900/80 border-slate-800 hover:border-sky-500/50 hover:bg-slate-850'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 shrink-0 group-hover:bg-rose-500 group-hover:text-white transition-colors">
                <CreditCard className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-bold text-slate-800 dark:text-white block truncate">
                  Expenses
                </span>
                <span className="text-[9px] text-slate-400 block truncate">
                  {currency.symbol}38,420 Tracked
                </span>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-500 transition-colors shrink-0" />
          </button>

          {/* Payments */}
          <button
            onClick={() => setActiveNav('Payments')}
            className={`p-2.5 rounded-xl border text-left transition-all hover:scale-[1.02] flex items-center justify-between group ${
              isLight
                ? 'bg-white border-sky-100 hover:border-sky-300 hover:shadow-xs'
                : 'bg-slate-900/80 border-slate-800 hover:border-sky-500/50 hover:bg-slate-850'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-500 shrink-0 group-hover:bg-teal-500 group-hover:text-white transition-colors">
                <Banknote className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-bold text-slate-800 dark:text-white block truncate">
                  Payments
                </span>
                <span className="text-[9px] text-teal-500 font-semibold block truncate">
                  Stripe · Wire · PayPal
                </span>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-500 transition-colors shrink-0" />
          </button>

          {/* Profit & Loss */}
          <button
            onClick={() => setActiveNav('Profit & Loss')}
            className={`p-2.5 rounded-xl border text-left transition-all hover:scale-[1.02] flex items-center justify-between group ${
              isLight
                ? 'bg-white border-sky-100 hover:border-sky-300 hover:shadow-xs'
                : 'bg-slate-900/80 border-slate-800 hover:border-sky-500/50 hover:bg-slate-850'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 shrink-0 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-bold text-slate-800 dark:text-white block truncate">
                  Profit & Loss
                </span>
                <span className="text-[9px] text-amber-500 font-semibold block truncate">
                  {currency.symbol}47,850 Net · 42.6%
                </span>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-500 transition-colors shrink-0" />
          </button>
        </div>
      </div>

      {/* 3. REORDERABLE WIDGET LIST */}
      <div className="space-y-3.5">
        {activeDashboard.widgetIds.map((widgetId) => {
          const widgetInfo = AVAILABLE_WIDGETS.find((w) => w.id === widgetId);
          if (!widgetInfo) return null;

          const isBeingDragged = draggedWidgetId === widgetId;
          const isDragTarget = dragOverWidgetId === widgetId;

          return (
            <div
              key={widgetId}
              onDragOver={(e) => handleDragOver(e, widgetId)}
              onDrop={(e) => handleDrop(e, widgetId)}
              className={`transition-all duration-200 relative group/widget ${
                isBeingDragged
                  ? 'opacity-35 scale-[0.99] border-2 border-dashed border-sky-400 rounded-2xl p-1'
                  : ''
              } ${
                isDragTarget && !isBeingDragged
                  ? 'ring-2 ring-sky-400 ring-offset-2 dark:ring-offset-slate-900 rounded-2xl'
                  : ''
              }`}
            >
              {/* Widget Drag & Control Bar */}
              <div className="flex items-center justify-between px-2 py-1 mb-1 text-slate-400">
                <div
                  draggable
                  onDragStart={(e) => handleDragStart(e, widgetId)}
                  onDragEnd={handleDragEnd}
                  className="flex items-center gap-1.5 cursor-grab active:cursor-grabbing hover:text-sky-500 transition-colors select-none py-0.5 px-1.5 rounded-lg hover:bg-sky-500/10"
                  title="Click and drag to reorder this module"
                >
                  <GripVertical className="w-3.5 h-3.5 text-slate-400 group-hover/widget:text-sky-500" />
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 group-hover/widget:text-sky-500">
                    {widgetInfo.title}
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400">
                    {widgetInfo.category}
                  </span>
                </div>

                {/* Remove button */}
                <button
                  onClick={() => handleRemoveWidget(widgetId)}
                  className="opacity-0 group-hover/widget:opacity-100 p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                  title={`Remove ${widgetInfo.title} from this dashboard`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Render Component Content */}
              <div>{renderWidgetContent(widgetId)}</div>
            </div>
          );
        })}
      </div>

      {/* 3. EMPTY STATE (When 0 widgets on board) */}
      {activeDashboard.widgetIds.length === 0 && (
        <div
          className={`p-12 text-center rounded-2xl border space-y-3 ${
            isLight ? 'bg-white border-sky-100' : 'bg-[#0f172a] border-slate-800'
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-500 flex items-center justify-center mx-auto font-bold">
            <LayoutDashboard className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">
              No widgets on {activeDashboard.name}
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              Customize this dashboard by adding executive KPIs, sales charts, team leaderboards, or
              tables.
            </p>
          </div>
          <button
            onClick={() => setIsAddWidgetModalOpen(true)}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-sky-500 hover:bg-sky-600 text-white shadow-sm transition-all active:scale-95"
          >
            + Add Widgets to this Board
          </button>
        </div>
      )}

      {/* 4. CREATE DASHBOARD MODAL */}
      <CreateDashboardModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateDashboard}
      />

      {/* 5. ADD WIDGET MODAL */}
      <AddWidgetModal
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
        activeDashboardName={activeDashboard.name}
        activeWidgetIds={activeDashboard.widgetIds}
        onToggleWidget={handleToggleWidget}
      />

      {/* 6. TOAST FEEDBACK */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white dark:bg-sky-500 dark:text-slate-950 font-medium text-xs shadow-xl animate-fade-in border border-slate-700 dark:border-sky-400">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-slate-950" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

