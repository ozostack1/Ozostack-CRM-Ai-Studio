import React, { useState } from 'react';
import {
  DollarSign,
  Receipt,
  Target,
  BarChart2,
  TrendingUp,
  Banknote,
  Percent,
  Users,
  UserPlus,
  UserCheck,
  PhoneCall,
  Send,
  CheckCircle2,
  XCircle,
  PieChart,
  FolderKanban,
  AlertTriangle,
  Clock,
  CheckSquare,
  Activity,
  Smile,
  Zap,
  CalendarCheck2,
  LayoutGrid,
  Columns,
  Table,
  Check,
  Pencil,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import {
  TOP_ROW_KPIS,
  ANNUAL_GOAL_DATA,
  CRM_SALES_KPIS,
  OPERATIONS_KPIS,
} from '../data/mockData';
import { useRevenueGoal } from '../data/revenueGoalService';
import { useSystemCurrency } from '../data/currencyService';
import { EditGoalModal } from './goals/EditGoalModal';

export type KpiLayoutVariant =
  | 'executive-grid'
  | 'modern-bento'
  | 'compact-ticker'
  | 'radial-gauges';

const STORAGE_KEY = 'ozostack_kpi_layout_variant';

export const MetricCards: React.FC = () => {
  const { theme, setActiveNav } = useTheme();
  const isLight = theme === 'white-sky';
  const [isEditGoalOpen, setIsEditGoalOpen] = useState(false);
  const goalState = useRevenueGoal();
  const { currency, formatMoney } = useSystemCurrency();

  // Layout switcher state persisted in localStorage
  const [layoutVariant, setLayoutVariant] = useState<KpiLayoutVariant>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (
        saved &&
        ['executive-grid', 'modern-bento', 'compact-ticker', 'radial-gauges'].includes(saved)
      ) {
        return saved as KpiLayoutVariant;
      }
    } catch (e) {
      console.error(e);
    }
    return 'executive-grid';
  });

  // Filter for radial gauges layout
  const [radialTab, setRadialTab] = useState<'all' | 'sales' | 'operations'>('all');

  const handleLayoutChange = (variant: KpiLayoutVariant) => {
    setLayoutVariant(variant);
    try {
      localStorage.setItem(STORAGE_KEY, variant);
    } catch (e) {
      console.error(e);
    }
  };

  const cardBg = isLight
    ? 'bg-white border-sky-100/80 shadow-xs hover:border-sky-300'
    : 'bg-[#0f172a]/90 border-slate-800/80 hover:border-slate-700';

  const getIcon = (name?: string) => {
    switch (name) {
      case 'DollarSign':
        return DollarSign;
      case 'Receipt':
        return Receipt;
      case 'Target':
        return Target;
      case 'BarChart2':
        return BarChart2;
      case 'TrendingUp':
        return TrendingUp;
      case 'Banknote':
        return Banknote;
      case 'Percent':
        return Percent;
      case 'Users':
        return Users;
      case 'UserPlus':
        return UserPlus;
      case 'UserCheck':
        return UserCheck;
      case 'PhoneCall':
        return PhoneCall;
      case 'Send':
        return Send;
      case 'CheckCircle2':
        return CheckCircle2;
      case 'XCircle':
        return XCircle;
      case 'PieChart':
        return PieChart;
      case 'FolderKanban':
        return FolderKanban;
      case 'AlertTriangle':
        return AlertTriangle;
      case 'Clock':
        return Clock;
      case 'CheckSquare':
        return CheckSquare;
      case 'Activity':
        return Activity;
      case 'Smile':
        return Smile;
      case 'Zap':
        return Zap;
      case 'CalendarCheck2':
        return CalendarCheck2;
      default:
        return TrendingUp;
    }
  };

  const handleKpiClick = (id: string) => {
    switch (id) {
      case 'today-revenue':
      case 'monthly-revenue':
      case 'annual-goal':
      case 'mrr':
      case 'profit':
      case 'cash-flow':
      case 'gross-margin':
        setActiveNav('Profit & Loss');
        break;
      case 'active-clients':
        setActiveNav('Clients');
        break;
      case 'new-leads':
      case 'qualified-leads':
        setActiveNav('Leads');
        break;
      case 'followups-today':
        setActiveNav('Follow Ups');
        break;
      case 'proposals-sent':
      case 'deals-won':
      case 'deals-lost':
      case 'closing-rate':
        setActiveNav('Deals');
        break;
      case 'projects-running':
      case 'projects-delayed':
        setActiveNav('Projects');
        break;
      case 'tasks-due-today':
      case 'tasks-completed':
        setActiveNav('Tasks');
        break;
      default:
        break;
    }
  };

  return (
    <div className="space-y-3">
      {/* ============================================================ */}
      {/* DESIGN SWITCHER HEADER BAR                                   */}
      {/* ============================================================ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-0.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Layout Design:
          </span>
          <div className="flex items-center p-0.5 rounded-xl border border-sky-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs">
            <button
              onClick={() => handleLayoutChange('executive-grid')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                layoutVariant === 'executive-grid'
                  ? 'bg-sky-500 text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-sky-500'
              }`}
              title="Classic multi-row executive cards & funnel pills"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Executive Grid</span>
            </button>

            <button
              onClick={() => handleLayoutChange('modern-bento')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                layoutVariant === 'modern-bento'
                  ? 'bg-sky-500 text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-sky-500'
              }`}
              title="Modern asymmetric Bento Box layout with hero revenue card"
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Modern Bento</span>
            </button>

            <button
              onClick={() => handleLayoutChange('compact-ticker')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                layoutVariant === 'compact-ticker'
                  ? 'bg-sky-500 text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-sky-500'
              }`}
              title="Minimalist Bloomberg-style dense financial ticker"
            >
              <Table className="w-3.5 h-3.5" />
              <span>Compact Ticker</span>
            </button>

            <button
              onClick={() => handleLayoutChange('radial-gauges')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                layoutVariant === 'radial-gauges'
                  ? 'bg-sky-500 text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-sky-500'
              }`}
              title="Radial progress rings & metric health scorecards"
            >
              <Target className="w-3.5 h-3.5" />
              <span>Radial Gauges</span>
            </button>
          </div>
        </div>

        <span className="text-[11px] text-slate-400 font-medium hidden md:inline">
          {layoutVariant === 'executive-grid' && 'Option 1: Classic executive cards & dual funnel strips'}
          {layoutVariant === 'modern-bento' && 'Option 2: Asymmetric bento box with revenue hero tile'}
          {layoutVariant === 'compact-ticker' && 'Option 3: High-density streamlined executive terminal'}
          {layoutVariant === 'radial-gauges' && 'Option 4: Radial progress rings & filtered scorecards'}
        </span>
      </div>

      {/* ============================================================ */}
      {/* OPTION 1: EXECUTIVE GRID (Classic multi-row layout)           */}
      {/* ============================================================ */}
      {layoutVariant === 'executive-grid' && (
        <div className="space-y-3 animate-fade-in">
          {/* Top Section: 8 KPIs + 1 Annual Goal Card */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 items-stretch">
            {/* 8 Metric Cards Grid (8 cols on large screens, spanning 9 xl columns) */}
            <div className="xl:col-span-9 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {TOP_ROW_KPIS.map((kpi, idx) => {
                const Icon = getIcon(kpi.iconName);
                const iconBg = [
                  'bg-purple-500/15 text-purple-500',
                  'bg-sky-500/15 text-sky-500',
                  'bg-amber-500/15 text-amber-500',
                  'bg-indigo-500/15 text-indigo-500',
                  'bg-emerald-500/15 text-emerald-500',
                  'bg-teal-500/15 text-teal-500',
                  'bg-rose-500/15 text-rose-500',
                  'bg-sky-600/15 text-sky-600',
                ][idx % 8];

                return (
                  <div
                    key={kpi.id}
                    onClick={() => handleKpiClick(kpi.id)}
                    className={`relative flex flex-col justify-between p-3 rounded-xl border transition-all duration-200 cursor-pointer hover:border-sky-400 hover:scale-[1.01] ${cardBg}`}
                    title={`Inspect ${kpi.label}`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span
                        className={`text-[10px] font-bold tracking-wider uppercase truncate ${
                          isLight ? 'text-slate-500' : 'text-slate-400'
                        }`}
                      >
                        {kpi.label}
                      </span>
                      <div className={`p-1 rounded-md shrink-0 ${iconBg}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    <div className="flex items-baseline justify-between gap-2 mt-auto">
                      <div className="font-extrabold text-sm sm:text-base tracking-tight tabular-nums">
                        {kpi.id === 'annual-goal'
                          ? goalState.formattedAnnualGoal
                          : formatMoney(kpi.value)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-1 text-[10px]">
                      <span
                        className={`font-semibold tabular-nums ${
                          kpi.isPositive ? 'text-emerald-500' : 'text-rose-500'
                        }`}
                      >
                        {kpi.id === 'annual-goal'
                          ? `${goalState.percentage}% of ${goalState.compactAnnualGoal} Goal`
                          : formatMoney(kpi.change)}
                      </span>

                      {/* Sparkline visualization */}
                      {kpi.trend && (
                        <svg className="w-12 h-3.5 overflow-visible shrink-0" viewBox="0 0 50 15">
                          <path
                            d="M 0 12 Q 10 9, 20 10 T 35 4 T 50 2"
                            fill="none"
                            stroke={kpi.isPositive ? '#10b981' : '#f43f5e'}
                            strokeWidth="1.8"
                            strokeLinecap="round"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right: $1M ANNUAL GOAL PROGRESS Card */}
            <div
              onClick={() => setActiveNav('Profit & Loss')}
              className={`xl:col-span-3 p-3.5 rounded-xl border flex flex-col justify-between transition-all cursor-pointer hover:border-sky-400 group/card relative ${cardBg}`}
              title="Click to view Annual Revenue & Profit Breakdown"
            >
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider">
                <span className={isLight ? 'text-slate-700' : 'text-slate-200'}>
                  {goalState.compactAnnualGoal} Annual Goal Progress
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-sky-500 font-semibold">
                    REMAINING {goalState.formattedRemaining}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditGoalOpen(true);
                    }}
                    className="p-1 rounded-md text-slate-400 hover:text-sky-500 hover:bg-sky-500/10 transition-colors"
                    title="Edit Revenue Goal (ARR & MRR)"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-12 gap-3 items-center my-2">
                {/* Circular Gauge */}
                <div className="col-span-5 flex flex-col items-center justify-center relative">
                  <svg className="w-20 h-20 -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke={isLight ? '#e0f2fe' : '#1e293b'}
                      strokeWidth="10"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke="#0284c7"
                      strokeWidth="10"
                      strokeDasharray="251.2"
                      strokeDashoffset={251.2 * (1 - goalState.percentage / 100)}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-xs font-black tracking-tight tabular-nums">
                      {goalState.percentage}%
                    </span>
                    <span className="text-[8px] text-slate-400 leading-tight">
                      {goalState.formattedCurrent}
                    </span>
                    <span className="text-[7px] text-slate-400">of {goalState.compactAnnualGoal}</span>
                  </div>
                </div>

                {/* Target Breakdown */}
                <div className="col-span-7 space-y-1.5 text-[10px]">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 truncate">MONTHLY TARGET</span>
                    <span className="font-bold tabular-nums">{goalState.formattedMrrGoal}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 truncate">THIS MONTH</span>
                    <span className="font-bold tabular-nums text-sky-500">
                      {goalState.thisMonthAchieved}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 truncate">TODAY'S TARGET</span>
                    <span className="font-bold tabular-nums">{goalState.todayAchieved}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 truncate">DAYS PASSED</span>
                    <span className="font-bold tabular-nums">{goalState.daysPassed}</span>
                  </div>
                </div>
              </div>

              {/* Progress bar line */}
              <div className="w-full bg-sky-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-sky-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${goalState.percentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Row 2: 7 CRM Funnel quick stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-7 gap-2.5">
            {CRM_SALES_KPIS.map((kpi, idx) => {
              const Icon = getIcon(kpi.iconName);
              const iconColors = [
                'text-sky-500 bg-sky-500/10',
                'text-amber-500 bg-amber-500/10',
                'text-indigo-500 bg-indigo-500/10',
                'text-blue-500 bg-blue-500/10',
                'text-emerald-500 bg-emerald-500/10',
                'text-rose-500 bg-rose-500/10',
                'text-teal-500 bg-teal-500/10',
              ][idx % 7];

              return (
                <div
                  key={kpi.id}
                  onClick={() => handleKpiClick(kpi.id)}
                  className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all cursor-pointer hover:border-sky-400 hover:scale-[1.02] ${cardBg}`}
                  title={`Inspect ${kpi.label}`}
                >
                  <div className={`p-2 rounded-lg shrink-0 ${iconColors}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div
                      className={`text-[9px] font-bold tracking-wider uppercase truncate ${
                        isLight ? 'text-slate-500' : 'text-slate-400'
                      }`}
                      title={kpi.label}
                    >
                      {kpi.label}
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-bold text-sm tracking-tight tabular-nums">
                        {kpi.value}
                      </span>
                      <span
                        className={`text-[10px] font-semibold tabular-nums ${
                          kpi.isPositive ? 'text-emerald-500' : 'text-rose-500'
                        }`}
                      >
                        {kpi.change}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Row 3: 7 Operational Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-7 gap-2.5">
            {OPERATIONS_KPIS.map((kpi, idx) => {
              const Icon = getIcon(kpi.iconName);
              const iconColors = [
                'text-indigo-400 bg-indigo-500/10',
                'text-rose-500 bg-rose-500/10',
                'text-amber-500 bg-amber-500/10',
                'text-emerald-500 bg-emerald-500/10',
                'text-sky-500 bg-sky-500/10',
                'text-teal-500 bg-teal-500/10',
                'text-blue-400 bg-blue-500/10',
              ][idx % 7];

              return (
                <div
                  key={kpi.id}
                  onClick={() => handleKpiClick(kpi.id)}
                  className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all cursor-pointer hover:border-sky-400 hover:scale-[1.02] ${cardBg}`}
                  title={`Inspect ${kpi.label}`}
                >
                  <div className={`p-2 rounded-lg shrink-0 ${iconColors}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div
                      className={`text-[9px] font-bold tracking-wider uppercase truncate ${
                        isLight ? 'text-slate-500' : 'text-slate-400'
                      }`}
                    >
                      {kpi.label}
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-bold text-sm tracking-tight tabular-nums">
                        {kpi.value}
                      </span>
                      <span
                        className={`text-[10px] font-semibold tabular-nums ${
                          kpi.isPositive ? 'text-emerald-500' : 'text-rose-500'
                        }`}
                      >
                        {kpi.change}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* OPTION 2: MODERN BENTO (Asymmetric high-impact tiles)         */}
      {/* ============================================================ */}
      {layoutVariant === 'modern-bento' && (
        <div className="space-y-3 animate-fade-in">
          {/* Top Bento Row: Hero Revenue Card (5 col), Annual Goal (3 col), Financial Quad (4 col) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
            {/* Tile 1: Hero Revenue Card */}
            <div
              onClick={() => setActiveNav('Profit & Loss')}
              className={`lg:col-span-5 p-4 rounded-2xl border flex flex-col justify-between cursor-pointer hover:border-sky-400 transition-all ${cardBg}`}
              title="Click to view Monthly Revenue Breakdown in P&L"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-sky-500 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Monthly Revenue Velocity</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500">
                    ▲ 28.6% Growth
                  </span>
                </div>

                <div className="flex items-baseline gap-3 my-1">
                  <h3 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white tabular-nums">
                    {currency.symbol}215,420
                  </h3>
                  <span className="text-xs text-slate-400 font-semibold">vs {currency.symbol}167K last month</span>
                </div>

                {/* Sub-metrics pill row */}
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <div className="px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-300 font-medium text-[11px] flex items-center gap-1.5">
                    <span className="text-slate-400">Today:</span>
                    <strong className="font-bold">{currency.symbol}7,540</strong>
                    <span className="text-emerald-500 font-bold">▲ 15.8%</span>
                  </div>

                  <div className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 font-medium text-[11px] flex items-center gap-1.5">
                    <span className="text-slate-400">MRR:</span>
                    <strong className="font-bold">{currency.symbol}68,450</strong>
                    <span className="text-emerald-500 font-bold">▲ 12.4%</span>
                  </div>
                </div>
              </div>

              {/* Mini Area Chart SVG */}
              <div className="mt-4 pt-3 border-t border-sky-100/50 dark:border-slate-800">
                <svg className="w-full h-12 overflow-visible" viewBox="0 0 300 45">
                  <defs>
                    <linearGradient id="bentoRevGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 0 38 Q 40 35, 80 28 T 160 20 T 240 10 L 300 4 L 300 45 L 0 45 Z"
                    fill="url(#bentoRevGrad)"
                  />
                  <path
                    d="M 0 38 Q 40 35, 80 28 T 160 20 T 240 10 L 300 4"
                    fill="none"
                    stroke="#0284c7"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>

            {/* Tile 2: Annual Goal Radial Progress Card */}
            <div
              onClick={() => setActiveNav('Profit & Loss')}
              className={`lg:col-span-3 p-4 rounded-2xl border flex flex-col justify-between text-center cursor-pointer hover:border-sky-400 transition-all ${cardBg}`}
              title="Click to view Annual Goal Breakdown in P&L"
            >
              <div className="flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span>{goalState.compactAnnualGoal} Target</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditGoalOpen(true);
                    }}
                    className="p-1 rounded text-sky-500 hover:bg-sky-500/10 transition-colors"
                    title="Edit Goal"
                  >
                    <Pencil className="w-2.5 h-2.5" />
                  </button>
                </div>
                <span className="text-sky-500">{goalState.daysPassed} Days</span>
              </div>

              <div className="my-auto py-2 flex flex-col items-center justify-center relative">
                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke={isLight ? '#e0f2fe' : '#1e293b'}
                    strokeWidth="10"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#0284c7"
                    strokeWidth="10"
                    strokeDasharray="251.2"
                    strokeDashoffset={251.2 * (1 - goalState.percentage / 100)}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-base font-black text-slate-900 dark:text-white tabular-nums">
                    {goalState.percentage}%
                  </span>
                  <span className="text-[9px] text-slate-400">Achieved</span>
                </div>
              </div>

              <div className="pt-2 border-t border-sky-100/50 dark:border-slate-800 text-[11px] space-y-1">
                <div className="flex items-center justify-between text-slate-500">
                  <span>Remaining:</span>
                  <strong className="text-slate-800 dark:text-slate-200">
                    {goalState.formattedRemaining}
                  </strong>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>Monthly Target:</span>
                  <strong className="text-sky-500 font-bold">{goalState.formattedMrrGoal}</strong>
                </div>
              </div>
            </div>

            {/* Tile 3: Core Financial Quad (Profit, Cash, Margin, Clients) */}
            <div className="lg:col-span-4 grid grid-cols-2 gap-2.5">
              <div
                onClick={() => setActiveNav('Profit & Loss')}
                className={`p-3 rounded-2xl border flex flex-col justify-between cursor-pointer hover:border-sky-400 transition-all ${cardBg}`}
                title="View Net Profit Details"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Net Profit</span>
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                <div className="my-1.5">
                  <span className="text-lg font-black text-slate-900 dark:text-white tabular-nums">
                    {currency.symbol}47,850
                  </span>
                </div>
                <span className="text-[10px] font-bold text-emerald-500">▲ 22.1% MoM</span>
              </div>

              <div
                onClick={() => setActiveNav('Profit & Loss')}
                className={`p-3 rounded-2xl border flex flex-col justify-between cursor-pointer hover:border-sky-400 transition-all ${cardBg}`}
                title="View Cash Flow Details"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Cash Flow</span>
                  <Banknote className="w-3.5 h-3.5 text-teal-500" />
                </div>
                <div className="my-1.5">
                  <span className="text-lg font-black text-slate-900 dark:text-white tabular-nums">
                    {currency.symbol}32,650
                  </span>
                </div>
                <span className="text-[10px] font-bold text-emerald-500">▲ 18.7% MoM</span>
              </div>

              <div
                onClick={() => setActiveNav('Profit & Loss')}
                className={`p-3 rounded-2xl border flex flex-col justify-between cursor-pointer hover:border-sky-400 transition-all ${cardBg}`}
                title="View Gross Margin Details"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Gross Margin</span>
                  <Percent className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <div className="my-1.5">
                  <span className="text-lg font-black text-slate-900 dark:text-white tabular-nums">
                    42.6%
                  </span>
                </div>
                <span className="text-[10px] font-bold text-emerald-500">▲ 5.3% Healthy</span>
              </div>

              <div
                onClick={() => setActiveNav('Clients')}
                className={`p-3 rounded-2xl border flex flex-col justify-between cursor-pointer hover:border-sky-400 transition-all ${cardBg}`}
                title="View Active Clients"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Active Clients</span>
                  <Users className="w-3.5 h-3.5 text-sky-500" />
                </div>
                <div className="my-1.5">
                  <span className="text-lg font-black text-slate-900 dark:text-white tabular-nums">
                    63
                  </span>
                </div>
                <span className="text-[10px] font-bold text-sky-500">▲ 7 new accounts</span>
              </div>
            </div>
          </div>

          {/* Bottom Bento Row: Sales Funnel Strip + Operations Strip */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Sales Pipeline Velocity Block */}
            <div className={`p-3.5 rounded-2xl border ${cardBg}`}>
              <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-sky-100/40 dark:border-slate-800">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-sky-500" />
                  <span>Sales & Deal Velocity</span>
                </span>
                <button
                  onClick={() => setActiveNav('Deals')}
                  className="text-[10px] font-extrabold text-sky-500 hover:underline"
                >
                  Manage Deals →
                </button>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
                {CRM_SALES_KPIS.slice(0, 6).map((kpi) => (
                  <div
                    key={kpi.id}
                    onClick={() => handleKpiClick(kpi.id)}
                    className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50 cursor-pointer hover:border-sky-400 transition-all"
                  >
                    <span className="text-[9px] text-slate-400 block truncate">{kpi.label}</span>
                    <strong className="text-xs font-bold text-slate-900 dark:text-white block mt-0.5">
                      {kpi.value}
                    </strong>
                    <span
                      className={`text-[9px] font-semibold ${
                        kpi.isPositive ? 'text-emerald-500' : 'text-rose-500'
                      }`}
                    >
                      {kpi.change.split(' ')[0]} {kpi.change.split(' ')[1]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Operations & Delivery Health Block */}
            <div className={`p-3.5 rounded-2xl border ${cardBg}`}>
              <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-sky-100/40 dark:border-slate-800">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Operations & Sprint Execution</span>
                </span>
                <button
                  onClick={() => setActiveNav('Projects')}
                  className="text-[10px] font-extrabold text-sky-500 hover:underline"
                >
                  Manage Projects →
                </button>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
                {OPERATIONS_KPIS.slice(0, 6).map((kpi) => (
                  <div
                    key={kpi.id}
                    onClick={() => handleKpiClick(kpi.id)}
                    className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50 cursor-pointer hover:border-sky-400 transition-all"
                  >
                    <span className="text-[9px] text-slate-400 block truncate">{kpi.label}</span>
                    <strong className="text-xs font-bold text-slate-900 dark:text-white block mt-0.5">
                      {kpi.value}
                    </strong>
                    <span
                      className={`text-[9px] font-semibold ${
                        kpi.isPositive ? 'text-emerald-500' : 'text-rose-500'
                      }`}
                    >
                      {kpi.change.split(' ')[0]} {kpi.change.split(' ')[1]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* OPTION 3: COMPACT TICKER (Minimalist terminal density)        */}
      {/* ============================================================ */}
      {layoutVariant === 'compact-ticker' && (
        <div className="space-y-2.5 animate-fade-in">
          {/* Ticker Row: 8 Horizontal Financial Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {TOP_ROW_KPIS.map((kpi) => (
              <div
                key={kpi.id}
                onClick={() => handleKpiClick(kpi.id)}
                className={`p-2.5 rounded-xl border flex flex-col justify-between cursor-pointer hover:border-sky-400 transition-all ${cardBg}`}
                title={`Inspect ${kpi.label}`}
              >
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 truncate">
                  {kpi.label}
                </span>
                <div className="text-sm font-extrabold text-slate-900 dark:text-white tabular-nums my-1">
                  {kpi.id === 'annual-goal'
                    ? goalState.formattedAnnualGoal
                    : formatMoney(kpi.value)}
                </div>
                <div className="flex items-center justify-between text-[9px]">
                  <span
                    className={`font-bold ${kpi.isPositive ? 'text-emerald-500' : 'text-rose-500'}`}
                  >
                    {kpi.id === 'annual-goal'
                      ? `${goalState.percentage}% of ${goalState.compactAnnualGoal}`
                      : `${formatMoney(kpi.change.split(' ')[0])} ${kpi.change.split(' ')[1]}`}
                  </span>
                  <span className="text-slate-400">Pace</span>
                </div>
              </div>
            ))}
          </div>

          {/* Goal Progress Summary Strip */}
          <div
            onClick={() => setActiveNav('Profit & Loss')}
            className={`p-3 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-3 cursor-pointer hover:border-sky-400 transition-all ${cardBg}`}
            title="Inspect Annual Goal in Profit & Loss"
          >
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center font-bold text-xs">
                {goalState.percentage}%
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-white block">
                    {goalState.formattedAnnualGoal} Annual Revenue Goal Target ({goalState.formattedMrrGoal}/mo)
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditGoalOpen(true);
                    }}
                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/10 text-sky-500 hover:bg-sky-500 hover:text-white transition-colors"
                  >
                    Edit Goal
                  </button>
                </div>
                <span className="text-[10px] text-slate-400">
                  {goalState.formattedCurrent} achieved · {goalState.formattedRemaining} remaining ·{' '}
                  {goalState.daysPassed} days passed
                </span>
              </div>
            </div>

            <div className="w-full sm:w-72">
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div
                  className="h-full rounded-full bg-sky-500 transition-all duration-500"
                  style={{ width: `${goalState.percentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Combined CRM & Operations Pill Tickers */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {[...CRM_SALES_KPIS.slice(0, 4), ...OPERATIONS_KPIS.slice(0, 3)].map((kpi) => (
              <div
                key={kpi.id}
                onClick={() => handleKpiClick(kpi.id)}
                className={`px-3 py-1.5 rounded-lg border flex items-center justify-between cursor-pointer hover:border-sky-400 transition-all ${cardBg}`}
                title={`Inspect ${kpi.label}`}
              >
                <div className="truncate pr-1">
                  <span className="text-[9px] text-slate-400 block truncate">{kpi.label}</span>
                  <strong className="text-xs font-bold text-slate-800 dark:text-white">
                    {kpi.value}
                  </strong>
                </div>
                <span
                  className={`text-[9px] font-bold ${
                    kpi.isPositive ? 'text-emerald-500' : 'text-rose-500'
                  }`}
                >
                  {kpi.change.split(' ')[0]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* OPTION 4: RADIAL GAUGES & SCORECARDS (Visual goal rings)      */}
      {/* ============================================================ */}
      {layoutVariant === 'radial-gauges' && (
        <div className="space-y-3 animate-fade-in">
          {/* Top Row: 4 Circular Progress Ring Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Gauge 1: Annual Goal */}
            <div
              onClick={() => setActiveNav('Profit & Loss')}
              className={`p-4 rounded-2xl border flex items-center gap-4 cursor-pointer hover:border-sky-400 transition-all ${cardBg}`}
              title="Inspect Annual Goal in Profit & Loss"
            >
              <div className="relative w-16 h-16 shrink-0 -rotate-90">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke={isLight ? '#e0f2fe' : '#1e293b'}
                    strokeWidth="12"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#0284c7"
                    strokeWidth="12"
                    strokeDasharray="251.2"
                    strokeDashoffset={251.2 * (1 - goalState.percentage / 100)}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center rotate-90 font-black text-xs">
                  {goalState.percentage}%
                </div>
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase text-slate-400 block truncate">
                  Annual {goalState.compactAnnualGoal} Goal
                </span>
                <span className="text-base font-extrabold text-slate-900 dark:text-white block mt-0.5">
                  {goalState.formattedCurrent}
                </span>
                <span className="text-[10px] text-sky-500 font-semibold">{goalState.formattedRemaining} to go</span>
              </div>
            </div>

            {/* Gauge 2: Gross Profit Margin */}
            <div
              onClick={() => setActiveNav('Profit & Loss')}
              className={`p-4 rounded-2xl border flex items-center gap-4 cursor-pointer hover:border-sky-400 transition-all ${cardBg}`}
              title="Inspect Gross Profit Margin in P&L"
            >
              <div className="relative w-16 h-16 shrink-0 -rotate-90">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke={isLight ? '#e0f2fe' : '#1e293b'}
                    strokeWidth="12"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#10b981"
                    strokeWidth="12"
                    strokeDasharray="251.2"
                    strokeDashoffset={251.2 * (1 - 0.426)}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center rotate-90 font-black text-xs text-emerald-500">
                  42.6%
                </div>
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase text-slate-400 block truncate">
                  Gross Profit Margin
                </span>
                <span className="text-base font-extrabold text-slate-900 dark:text-white block mt-0.5">
                  {currency.symbol}47,850
                </span>
                <span className="text-[10px] text-emerald-500 font-semibold">▲ 5.3% vs target</span>
              </div>
            </div>

            {/* Gauge 3: Deal Win / Closing Rate */}
            <div
              onClick={() => setActiveNav('Deals')}
              className={`p-4 rounded-2xl border flex items-center gap-4 cursor-pointer hover:border-sky-400 transition-all ${cardBg}`}
              title="Inspect Deals and Conversion Rate"
            >
              <div className="relative w-16 h-16 shrink-0 -rotate-90">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke={isLight ? '#e0f2fe' : '#1e293b'}
                    strokeWidth="12"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#6366f1"
                    strokeWidth="12"
                    strokeDasharray="251.2"
                    strokeDashoffset={251.2 * (1 - 0.282)}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center rotate-90 font-black text-xs text-indigo-500">
                  28.2%
                </div>
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase text-slate-400 block truncate">
                  Deal Win Rate
                </span>
                <span className="text-base font-extrabold text-slate-900 dark:text-white block mt-0.5">
                  11 Won / 4 Lost
                </span>
                <span className="text-[10px] text-indigo-500 font-semibold">▲ 6.3% conversion</span>
              </div>
            </div>

            {/* Gauge 4: Team Productivity */}
            <div
              onClick={() => setActiveNav('Tasks')}
              className={`p-4 rounded-2xl border flex items-center gap-4 cursor-pointer hover:border-sky-400 transition-all ${cardBg}`}
              title="Inspect Tasks and Team Productivity"
            >
              <div className="relative w-16 h-16 shrink-0 -rotate-90">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke={isLight ? '#e0f2fe' : '#1e293b'}
                    strokeWidth="12"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#f59e0b"
                    strokeWidth="12"
                    strokeDasharray="251.2"
                    strokeDashoffset={251.2 * (1 - 0.87)}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center rotate-90 font-black text-xs text-amber-500">
                  87%
                </div>
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase text-slate-400 block truncate">
                  Team Productivity
                </span>
                <span className="text-base font-extrabold text-slate-900 dark:text-white block mt-0.5">
                  128 Tasks Done
                </span>
                <span className="text-[10px] text-amber-500 font-semibold">▲ 7% efficiency</span>
              </div>
            </div>
          </div>

          {/* Filter Tabs for Lower Metric Pills */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-1.5 p-0.5 rounded-lg border border-sky-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs">
              <button
                onClick={() => setRadialTab('all')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  radialTab === 'all'
                    ? 'bg-sky-500 text-white font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-sky-500'
                }`}
              >
                All Metrics (14)
              </button>
              <button
                onClick={() => setRadialTab('sales')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  radialTab === 'sales'
                    ? 'bg-sky-500 text-white font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-sky-500'
                }`}
              >
                Sales Pipeline (7)
              </button>
              <button
                onClick={() => setRadialTab('operations')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  radialTab === 'operations'
                    ? 'bg-sky-500 text-white font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-sky-500'
                }`}
              >
                Operations (7)
              </button>
            </div>
          </div>

          {/* Filtered Grid of Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
            {(radialTab === 'all'
              ? [...CRM_SALES_KPIS, ...OPERATIONS_KPIS]
              : radialTab === 'sales'
              ? CRM_SALES_KPIS
              : OPERATIONS_KPIS
            ).map((kpi) => {
              const Icon = getIcon(kpi.iconName);

              return (
                <div
                  key={kpi.id}
                  onClick={() => handleKpiClick(kpi.id)}
                  className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all cursor-pointer hover:border-sky-400 ${cardBg}`}
                  title={`Inspect ${kpi.label}`}
                >
                  <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-500 shrink-0">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] font-bold text-slate-400 block truncate">
                      {kpi.label}
                    </span>
                    <strong className="text-xs font-black text-slate-900 dark:text-white tabular-nums block">
                      {formatMoney(kpi.value)}
                    </strong>
                    <span
                      className={`text-[9px] font-semibold ${
                        kpi.isPositive ? 'text-emerald-500' : 'text-rose-500'
                      }`}
                    >
                      {formatMoney(kpi.change)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Edit Revenue Goal Modal */}
      <EditGoalModal
        isOpen={isEditGoalOpen}
        onClose={() => setIsEditGoalOpen(false)}
      />
    </div>
  );
};
