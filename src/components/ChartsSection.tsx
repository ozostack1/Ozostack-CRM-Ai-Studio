import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronDown,
  Sparkles,
  Send,
  CheckCircle,
  AlertTriangle,
  Clock,
  XCircle,
  TrendingUp,
  Bot,
  Zap,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useRevenueGoal } from '../data/revenueGoalService';
import { useSystemCurrency } from '../data/currencyService';

type RevenuePeriod = 'This Month' | 'Last Month' | 'This Quarter' | 'This Year';
type SubPeriod = 'This Month' | 'Last Month' | 'This Quarter';

interface RevenueData {
  total: string;
  totalGrowth: string;
  oneTime: string;
  oneTimeGrowth: string;
  recurring: string;
  recurringGrowth: string;
  xLabels: string[];
  areaD: string;
  dashedD: string;
  solidD: string;
  points: { cx: number; cy: number }[];
}

const REVENUE_DATA_MAP: Record<RevenuePeriod, RevenueData> = {
  'This Month': {
    total: '$215,420',
    totalGrowth: '▲ 28.6%',
    oneTime: '$78,240',
    oneTimeGrowth: '▲ 17.2%',
    recurring: '$137,180',
    recurringGrowth: '▲ 36.3%',
    xLabels: ['1 May', '5 May', '10 May', '15 May', '20 May', '25 May', '31 May'],
    areaD: 'M 40 115 L 75 105 L 120 85 L 160 55 L 205 32 L 250 22 L 290 15 L 290 115 Z',
    dashedD: 'M 40 118 L 75 110 L 120 95 L 160 72 L 205 52 L 250 42 L 290 35',
    solidD: 'M 40 115 L 75 105 L 120 85 L 160 55 L 205 32 L 250 22 L 290 15',
    points: [
      { cx: 40, cy: 115 },
      { cx: 75, cy: 105 },
      { cx: 120, cy: 85 },
      { cx: 160, cy: 55 },
      { cx: 205, cy: 32 },
      { cx: 250, cy: 22 },
      { cx: 290, cy: 15 },
    ],
  },
  'Last Month': {
    total: '$186,200',
    totalGrowth: '▲ 14.2%',
    oneTime: '$68,300',
    oneTimeGrowth: '▲ 11.5%',
    recurring: '$117,900',
    recurringGrowth: '▲ 19.8%',
    xLabels: ['1 Apr', '5 Apr', '10 Apr', '15 Apr', '20 Apr', '25 Apr', '30 Apr'],
    areaD: 'M 40 118 L 75 110 L 120 95 L 160 72 L 205 52 L 250 42 L 290 35 L 290 115 Z',
    dashedD: 'M 40 120 L 75 115 L 120 102 L 160 85 L 205 68 L 250 56 L 290 48',
    solidD: 'M 40 118 L 75 110 L 120 95 L 160 72 L 205 52 L 250 42 L 290 35',
    points: [
      { cx: 40, cy: 118 },
      { cx: 75, cy: 110 },
      { cx: 120, cy: 95 },
      { cx: 160, cy: 72 },
      { cx: 205, cy: 52 },
      { cx: 250, cy: 42 },
      { cx: 290, cy: 35 },
    ],
  },
  'This Quarter': {
    total: '$612,850',
    totalGrowth: '▲ 31.4%',
    oneTime: '$223,000',
    oneTimeGrowth: '▲ 22.1%',
    recurring: '$389,850',
    recurringGrowth: '▲ 38.6%',
    xLabels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Q2'],
    areaD: 'M 40 110 L 75 96 L 120 74 L 160 48 L 205 28 L 250 18 L 290 10 L 290 115 Z',
    dashedD: 'M 40 116 L 75 106 L 120 88 L 160 66 L 205 48 L 250 36 L 290 26',
    solidD: 'M 40 110 L 75 96 L 120 74 L 160 48 L 205 28 L 250 18 L 290 10',
    points: [
      { cx: 40, cy: 110 },
      { cx: 75, cy: 96 },
      { cx: 120, cy: 74 },
      { cx: 160, cy: 48 },
      { cx: 205, cy: 28 },
      { cx: 250, cy: 18 },
      { cx: 290, cy: 10 },
    ],
  },
  'This Year': {
    total: '$1,248,600',
    totalGrowth: '▲ 44.8%',
    oneTime: '$462,000',
    oneTimeGrowth: '▲ 34.0%',
    recurring: '$786,600',
    recurringGrowth: '▲ 52.4%',
    xLabels: ['Q1', 'Q2', 'Q3', 'Q4', 'H1', 'H2', '2025'],
    areaD: 'M 40 116 L 75 92 L 120 68 L 160 42 L 205 24 L 250 14 L 290 8 L 290 115 Z',
    dashedD: 'M 40 120 L 75 104 L 120 82 L 160 58 L 205 40 L 250 30 L 290 20',
    solidD: 'M 40 116 L 75 92 L 120 68 L 160 42 L 205 24 L 250 14 L 290 8',
    points: [
      { cx: 40, cy: 116 },
      { cx: 75, cy: 92 },
      { cx: 120, cy: 68 },
      { cx: 160, cy: 42 },
      { cx: 205, cy: 24 },
      { cx: 250, cy: 14 },
      { cx: 290, cy: 8 },
    ],
  },
};

const PIPELINE_DATA_MAP: Record<
  SubPeriod,
  { stages: { label: string; count: number; percentage: string; color: string }[]; conversion: string }
> = {
  'This Month': {
    stages: [
      { label: 'Lead In', count: 245, percentage: '100%', color: '#3b82f6' },
      { label: 'Contact Made', count: 182, percentage: '74%', color: '#0ea5e9' },
      { label: 'Needs Defined', count: 98, percentage: '40%', color: '#06b6d4' },
      { label: 'Proposal Sent', count: 46, percentage: '19%', color: '#14b8a6' },
      { label: 'Negotiation', count: 24, percentage: '10%', color: '#10b981' },
      { label: 'Won', count: 11, percentage: '4.5%', color: '#22c55e' },
    ],
    conversion: '4.5% ($215,420)',
  },
  'Last Month': {
    stages: [
      { label: 'Lead In', count: 210, percentage: '100%', color: '#3b82f6' },
      { label: 'Contact Made', count: 154, percentage: '73%', color: '#0ea5e9' },
      { label: 'Needs Defined', count: 82, percentage: '39%', color: '#06b6d4' },
      { label: 'Proposal Sent', count: 38, percentage: '18%', color: '#14b8a6' },
      { label: 'Negotiation', count: 19, percentage: '9%', color: '#10b981' },
      { label: 'Won', count: 9, percentage: '4.3%', color: '#22c55e' },
    ],
    conversion: '4.3% ($186,200)',
  },
  'This Quarter': {
    stages: [
      { label: 'Lead In', count: 695, percentage: '100%', color: '#3b82f6' },
      { label: 'Contact Made', count: 512, percentage: '74%', color: '#0ea5e9' },
      { label: 'Needs Defined', count: 278, percentage: '40%', color: '#06b6d4' },
      { label: 'Proposal Sent', count: 132, percentage: '19%', color: '#14b8a6' },
      { label: 'Negotiation', count: 68, percentage: '10%', color: '#10b981' },
      { label: 'Won', count: 32, percentage: '4.6%', color: '#22c55e' },
    ],
    conversion: '4.6% ($612,850)',
  },
};

const SERVICE_DATA_MAP: Record<
  SubPeriod,
  {
    total: string;
    items: {
      name: string;
      percentage: number;
      amount: string;
      color: string;
      dash: string;
      offset: number;
    }[];
  }
> = {
  'This Month': {
    total: '$215,420',
    items: [
      {
        name: 'SaaS Subscription',
        percentage: 48,
        amount: '$103,400',
        color: '#38bdf8',
        dash: '115 124',
        offset: 0,
      },
      {
        name: 'Custom Development',
        percentage: 30,
        amount: '$64,620',
        color: '#0284c7',
        dash: '72 167',
        offset: -115,
      },
      {
        name: 'Consulting & Strategy',
        percentage: 14,
        amount: '$30,160',
        color: '#6366f1',
        dash: '33 206',
        offset: -187,
      },
      {
        name: 'API Access & Add-ons',
        percentage: 8,
        amount: '$17,240',
        color: '#a855f7',
        dash: '19 220',
        offset: -220,
      },
    ],
  },
  'Last Month': {
    total: '$186,200',
    items: [
      {
        name: 'SaaS Subscription',
        percentage: 50,
        amount: '$93,100',
        color: '#38bdf8',
        dash: '120 119',
        offset: 0,
      },
      {
        name: 'Custom Development',
        percentage: 28,
        amount: '$52,140',
        color: '#0284c7',
        dash: '67 172',
        offset: -120,
      },
      {
        name: 'Consulting & Strategy',
        percentage: 13,
        amount: '$24,200',
        color: '#6366f1',
        dash: '31 208',
        offset: -187,
      },
      {
        name: 'API Access & Add-ons',
        percentage: 9,
        amount: '$16,760',
        color: '#a855f7',
        dash: '21 218',
        offset: -218,
      },
    ],
  },
  'This Quarter': {
    total: '$612,850',
    items: [
      {
        name: 'SaaS Subscription',
        percentage: 49,
        amount: '$300,300',
        color: '#38bdf8',
        dash: '117 122',
        offset: 0,
      },
      {
        name: 'Custom Development',
        percentage: 29,
        amount: '$177,720',
        color: '#0284c7',
        dash: '69 170',
        offset: -117,
      },
      {
        name: 'Consulting & Strategy',
        percentage: 14,
        amount: '$85,800',
        color: '#6366f1',
        dash: '33 206',
        offset: -186,
      },
      {
        name: 'API Access & Add-ons',
        percentage: 8,
        amount: '$49,030',
        color: '#a855f7',
        dash: '19 220',
        offset: -219,
      },
    ],
  },
};

const LEADS_DATA_MAP: Record<
  SubPeriod,
  {
    total: number;
    items: {
      name: string;
      count: number;
      percentage: number;
      color: string;
      dash: string;
      offset: number;
    }[];
  }
> = {
  'This Month': {
    total: 245,
    items: [
      {
        name: 'Google Ads',
        count: 86,
        percentage: 35,
        color: '#0284c7',
        dash: '84 155',
        offset: 0,
      },
      {
        name: 'Referral',
        count: 59,
        percentage: 24,
        color: '#38bdf8',
        dash: '58 181',
        offset: -84,
      },
      {
        name: 'Direct Traffic',
        count: 39,
        percentage: 16,
        color: '#f97316',
        dash: '39 200',
        offset: -142,
      },
      {
        name: 'Organic Search',
        count: 34,
        percentage: 14,
        color: '#10b981',
        dash: '34 205',
        offset: -181,
      },
      {
        name: 'Social Media',
        count: 27,
        percentage: 11,
        color: '#a855f7',
        dash: '24 215',
        offset: -215,
      },
    ],
  },
  'Last Month': {
    total: 210,
    items: [
      {
        name: 'Google Ads',
        count: 69,
        percentage: 33,
        color: '#0284c7',
        dash: '79 160',
        offset: 0,
      },
      {
        name: 'Referral',
        count: 55,
        percentage: 26,
        color: '#38bdf8',
        dash: '62 177',
        offset: -79,
      },
      {
        name: 'Direct Traffic',
        count: 36,
        percentage: 17,
        color: '#f97316',
        dash: '41 198',
        offset: -141,
      },
      {
        name: 'Organic Search',
        count: 27,
        percentage: 13,
        color: '#10b981',
        dash: '31 208',
        offset: -182,
      },
      {
        name: 'Social Media',
        count: 23,
        percentage: 11,
        color: '#a855f7',
        dash: '26 213',
        offset: -213,
      },
    ],
  },
  'This Quarter': {
    total: 695,
    items: [
      {
        name: 'Google Ads',
        count: 250,
        percentage: 36,
        color: '#0284c7',
        dash: '86 153',
        offset: 0,
      },
      {
        name: 'Referral',
        count: 174,
        percentage: 25,
        color: '#38bdf8',
        dash: '60 179',
        offset: -86,
      },
      {
        name: 'Direct Traffic',
        count: 104,
        percentage: 15,
        color: '#f97316',
        dash: '36 203',
        offset: -146,
      },
      {
        name: 'Organic Search',
        count: 90,
        percentage: 13,
        color: '#10b981',
        dash: '31 208',
        offset: -182,
      },
      {
        name: 'Social Media',
        count: 77,
        percentage: 11,
        color: '#a855f7',
        dash: '26 213',
        offset: -213,
      },
    ],
  },
};

export const ChartsSection: React.FC = () => {
  const { theme, setActiveNav } = useTheme();
  const isLight = theme === 'white-sky';
  const goalState = useRevenueGoal();
  const { currency, formatMoney } = useSystemCurrency();

  // Dropdown filter states
  const [revenuePeriod, setRevenuePeriod] = useState<RevenuePeriod>('This Month');
  const [pipelinePeriod, setPipelinePeriod] = useState<SubPeriod>('This Month');
  const [servicePeriod, setServicePeriod] = useState<SubPeriod>('This Month');
  const [leadsSourcePeriod, setLeadsSourcePeriod] = useState<SubPeriod>('This Month');

  // Open dropdown identifier
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // AI Assistant state
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiMessages, setAiMessages] = useState<
    { role: 'user' | 'assistant'; text: string }[]
  >([]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const cardBg = isLight
    ? 'bg-white border-sky-100/90 shadow-xs'
    : 'bg-[#0f172a]/90 border-slate-800/80';

  const dropdownBg = isLight
    ? 'bg-white border-sky-100 text-slate-700 shadow-xl'
    : 'bg-slate-900 border-slate-700 text-slate-200 shadow-2xl';

  const activeRevenue = REVENUE_DATA_MAP[revenuePeriod];
  const activePipeline = PIPELINE_DATA_MAP[pipelinePeriod];
  const activeService = SERVICE_DATA_MAP[servicePeriod];
  const activeLeads = LEADS_DATA_MAP[leadsSourcePeriod];

  const handleAskAi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuestion.trim()) return;

    const query = aiQuestion.trim();
    setAiQuestion('');
    setAiMessages((prev) => [...prev, { role: 'user', text: query }]);
    setIsAiLoading(true);

    setTimeout(() => {
      let reply =
        `Based on your ${revenuePeriod} metrics, closing the 3 at-risk enterprise deals (TechVision Inc., Real Estate Pro) will push revenue significantly higher!`;
      if (query.toLowerCase().includes('lead')) {
        reply =
          `Google Ads is your top lead driver in ${leadsSourcePeriod} (${activeLeads.items[0].percentage}%, ${activeLeads.items[0].count} leads). Referral is #2 at ${activeLeads.items[1].percentage}%.`;
      } else if (query.toLowerCase().includes('deal') || query.toLowerCase().includes('risk')) {
        reply =
          `The 3 deals at risk total ${currency.symbol}45,000. Recommend scheduling an executive touchpoint with TechVision Inc. today at 2 PM.`;
      } else if (query.toLowerCase().includes('task')) {
        reply =
          '12 overdue tasks identified. Rizwan Khan and Vikram Joshi have high-priority items on API Integration and Payment Gateway.';
      }

      setAiMessages((prev) => [...prev, { role: 'assistant', text: reply }]);
      setIsAiLoading(false);
    }, 600);
  };

  return (
    <div ref={containerRef} className="grid grid-cols-12 gap-3 items-stretch">
      {/* 1. REVENUE OVERVIEW (Spans 3 cols on xl, 6 on lg) */}
      <div className={`col-span-12 lg:col-span-6 xl:col-span-3 p-3.5 rounded-xl border flex flex-col justify-between ${cardBg}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold tracking-wider uppercase text-slate-700 dark:text-slate-200">
            Revenue Overview
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveNav('Profit & Loss')}
              className="text-[9px] font-semibold text-sky-500 hover:underline mr-1"
              title="Open full Profit & Loss statement"
            >
              P&L Report →
            </button>
            <div className="relative">
              <button
                onClick={() =>
                  setOpenDropdown(openDropdown === 'revenue' ? null : 'revenue')
                }
                className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border transition-colors ${
                  isLight
                    ? 'border-sky-200 text-slate-600 bg-sky-50/50 hover:bg-sky-100/70'
                    : 'border-slate-700 text-slate-300 bg-slate-800/60 hover:bg-slate-750'
                }`}
              >
                <span className="font-semibold">{revenuePeriod}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {openDropdown === 'revenue' && (
                <div
                  className={`absolute right-0 mt-1 w-32 rounded-lg border py-1 z-30 ${dropdownBg}`}
                >
                  {(['This Month', 'Last Month', 'This Quarter', 'This Year'] as RevenuePeriod[]).map(
                    (p) => (
                      <button
                        key={p}
                        onClick={() => {
                          setRevenuePeriod(p);
                          setOpenDropdown(null);
                        }}
                        className={`w-full text-left px-3 py-1.5 text-[11px] transition-colors flex items-center justify-between ${
                          revenuePeriod === p
                            ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold'
                            : 'hover:bg-sky-500/5 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        <span>{p}</span>
                        {revenuePeriod === p && <span className="text-sky-500 font-bold">✓</span>}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Revenue SVG Chart */}
        <div className="relative h-44 w-full my-auto">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 300 130">
            {/* Grid Lines & Y-axis labels */}
            {[100, 80, 60, 40, 20, 0].map((val, idx) => {
              const y = 15 + idx * 20;
              return (
                <g key={val}>
                  <line
                    x1="35"
                    y1={y}
                    x2="295"
                    y2={y}
                    stroke={isLight ? '#f0f9ff' : '#1e293b'}
                    strokeDasharray="2 2"
                    strokeWidth="1"
                  />
                  <text
                    x="28"
                    y={y + 3}
                    textAnchor="end"
                    fontSize="7"
                    fill="#94a3b8"
                    className="tabular-nums"
                  >
                    {currency.symbol}{val}K
                  </text>
                </g>
              );
            })}

            {/* Gradient definition */}
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Area under line */}
            <path d={activeRevenue.areaD} fill="url(#revenueGrad)" />

            {/* Dashed Benchmark Line */}
            <path
              d={activeRevenue.dashedD}
              fill="none"
              stroke="#64748b"
              strokeWidth="1.8"
              strokeDasharray="3 3"
            />

            {/* Solid Line with smooth stroke */}
            <path
              d={activeRevenue.solidD}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* Active Data Points */}
            {activeRevenue.points.map((pt, i) => (
              <circle
                key={i}
                cx={pt.cx}
                cy={pt.cy}
                r="3"
                fill="#ffffff"
                stroke="#0284c7"
                strokeWidth="2"
              />
            ))}

            {/* X-axis labels */}
            {activeRevenue.xLabels.map((label, idx) => {
              const x = 40 + idx * 41.6;
              return (
                <text
                  key={label}
                  x={x}
                  y="126"
                  textAnchor="middle"
                  fontSize="7"
                  fill="#94a3b8"
                >
                  {label}
                </text>
              );
            })}
          </svg>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 text-[9px] text-slate-400 my-1">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-sky-400 rounded-full" />
            <span className="font-semibold text-slate-600 dark:text-slate-300">
              {revenuePeriod}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t border-dashed border-slate-500" />
            <span>Previous Benchmark</span>
          </div>
        </div>

        {/* Bottom Sub-stats inside card */}
        <div
          onClick={() => setActiveNav('Profit & Loss')}
          className="grid grid-cols-3 gap-1 pt-2 border-t border-sky-100/30 text-center cursor-pointer hover:bg-sky-500/5 rounded transition-colors"
          title="Click to view detailed Profit & Loss report"
        >
          <div>
            <div className="text-[8px] text-slate-400 font-bold uppercase truncate">
              Total Revenue
            </div>
            <div className="text-[11px] font-extrabold tabular-nums text-slate-800 dark:text-white">
              {formatMoney(activeRevenue.total)}
            </div>
            <div className="text-[8px] text-emerald-500 font-semibold">
              {activeRevenue.totalGrowth}
            </div>
          </div>
          <div>
            <div className="text-[8px] text-slate-400 font-bold uppercase truncate">
              One-Time
            </div>
            <div className="text-[11px] font-extrabold tabular-nums text-slate-800 dark:text-white">
              {formatMoney(activeRevenue.oneTime)}
            </div>
            <div className="text-[8px] text-emerald-500 font-semibold">
              {activeRevenue.oneTimeGrowth}
            </div>
          </div>
          <div>
            <div className="text-[8px] text-slate-400 font-bold uppercase truncate">
              Recurring
            </div>
            <div className="text-[11px] font-extrabold tabular-nums text-slate-800 dark:text-white">
              {formatMoney(activeRevenue.recurring)}
            </div>
            <div className="text-[8px] text-emerald-500 font-semibold">
              {activeRevenue.recurringGrowth}
            </div>
          </div>
        </div>
      </div>

      {/* 2. SALES PIPELINE (Spans 2 on xl, 6 on lg) */}
      <div className={`col-span-12 lg:col-span-6 xl:col-span-2 p-3.5 rounded-xl border flex flex-col justify-between ${cardBg}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold tracking-wider uppercase text-slate-700 dark:text-slate-200">
            Sales Pipeline
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveNav('Deals')}
              className="text-[9px] font-semibold text-sky-500 hover:underline mr-1"
              title="Open Deals module"
            >
              Deals →
            </button>
            <div className="relative">
              <button
                onClick={() =>
                  setOpenDropdown(openDropdown === 'pipeline' ? null : 'pipeline')
                }
                className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border transition-colors ${
                  isLight
                  ? 'border-sky-200 text-slate-600 bg-sky-50/50 hover:bg-sky-100/70'
                  : 'border-slate-700 text-slate-300 bg-slate-800/60 hover:bg-slate-750'
              }`}
            >
              <span className="font-semibold">{pipelinePeriod}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {openDropdown === 'pipeline' && (
              <div
                className={`absolute right-0 mt-1 w-32 rounded-lg border py-1 z-30 ${dropdownBg}`}
              >
                {(['This Month', 'Last Month', 'This Quarter'] as SubPeriod[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      setPipelinePeriod(p);
                      setOpenDropdown(null);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-[11px] transition-colors flex items-center justify-between ${
                      pipelinePeriod === p
                        ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold'
                        : 'hover:bg-sky-500/5 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <span>{p}</span>
                    {pipelinePeriod === p && <span className="text-sky-500 font-bold">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

        {/* Funnel Visual Stack */}
        <div className="space-y-1.5 my-auto">
          {activePipeline.stages.map((stage, idx) => {
            const widthPct = 100 - idx * 7;
            return (
              <div key={stage.label} className="flex flex-col items-center">
                <div
                  className="relative flex items-center justify-between px-2 py-1 rounded text-white text-[9px] font-medium shadow-xs transition-transform hover:scale-[1.02]"
                  style={{
                    width: `${widthPct}%`,
                    backgroundColor: stage.color,
                  }}
                >
                  <span className="truncate">{stage.label}</span>
                  <div className="flex items-center gap-1 shrink-0 font-bold tabular-nums">
                    <span>{stage.count}</span>
                    <span className="text-[8px] opacity-80">({stage.percentage})</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div
          onClick={() => setActiveNav('Deals')}
          className="text-[9px] text-center text-slate-400 pt-2 border-t border-sky-100/20 cursor-pointer hover:text-sky-500 transition-colors"
        >
          Conversion to Won: <span className="text-emerald-500 font-bold">{formatMoney(activePipeline.conversion)}</span> · <span className="text-sky-500 font-semibold underline">Manage Deals</span>
        </div>
      </div>

      {/* 3. REVENUE BY SERVICE (Donut Chart) */}
      <div className={`col-span-12 sm:col-span-6 lg:col-span-4 xl:col-span-2 p-3.5 rounded-xl border flex flex-col justify-between ${cardBg}`}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-bold tracking-wider uppercase text-slate-700 dark:text-slate-200">
            Revenue by Service
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveNav('Projects')}
              className="text-[9px] font-semibold text-sky-500 hover:underline mr-0.5"
              title="Open Projects & Sprints"
            >
              Projects →
            </button>
            <div className="relative">
              <button
                onClick={() =>
                  setOpenDropdown(openDropdown === 'service' ? null : 'service')
                }
                className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                  isLight
                    ? 'border-sky-200 text-slate-600 bg-sky-50/50 hover:bg-sky-100/70'
                    : 'border-slate-700 text-slate-300 bg-slate-800/60 hover:bg-slate-750'
                }`}
              >
                <span className="font-semibold">{servicePeriod}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {openDropdown === 'service' && (
                <div
                  className={`absolute right-0 mt-1 w-32 rounded-lg border py-1 z-30 ${dropdownBg}`}
                >
                  {(['This Month', 'Last Month', 'This Quarter'] as SubPeriod[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => {
                        setServicePeriod(p);
                        setOpenDropdown(null);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-[11px] transition-colors flex items-center justify-between ${
                        servicePeriod === p
                          ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold'
                          : 'hover:bg-sky-500/5 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <span>{p}</span>
                      {servicePeriod === p && <span className="text-sky-500 font-bold">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Donut graphic */}
        <div
          onClick={() => setActiveNav('Projects')}
          className="flex items-center justify-center relative my-1 cursor-pointer group"
          title="Click to view Project Deliverables"
        >
          <svg className="w-24 h-24 -rotate-90 group-hover:scale-105 transition-transform" viewBox="0 0 100 100">
            {activeService.items.map((srv) => (
              <circle
                key={srv.name}
                cx="50"
                cy="50"
                r="38"
                fill="transparent"
                stroke={srv.color}
                strokeWidth="16"
                strokeDasharray={srv.dash}
                strokeDashoffset={srv.offset}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-[11px] font-extrabold tabular-nums text-slate-800 dark:text-white">
              {formatMoney(activeService.total)}
            </span>
            <span className="text-[7px] text-slate-400 group-hover:text-sky-500 font-semibold">Total</span>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-1 text-[9px]">
          {activeService.items.map((srv) => (
            <div
              key={srv.name}
              onClick={() => setActiveNav('Projects')}
              className="flex items-center justify-between cursor-pointer hover:bg-sky-500/10 p-0.5 rounded transition-colors"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: srv.color }}
                />
                <span className="truncate text-slate-500 dark:text-slate-300">
                  {srv.name}
                </span>
              </div>
              <span className="font-semibold tabular-nums shrink-0 text-slate-700 dark:text-slate-200">
                {formatMoney(srv.amount)} ({srv.percentage}%)
              </span>
            </div>
          ))}
        </div>

        <div className="text-center pt-1.5 border-t border-sky-100/20 mt-1">
          <button
            onClick={() => setActiveNav('Projects')}
            className="text-[9px] font-semibold text-sky-500 hover:underline"
          >
            Manage Projects & Sprints →
          </button>
        </div>
      </div>

      {/* 4. LEADS SOURCE (Donut Chart) */}
      <div className={`col-span-12 sm:col-span-6 lg:col-span-4 xl:col-span-2 p-3.5 rounded-xl border flex flex-col justify-between ${cardBg}`}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-bold tracking-wider uppercase text-slate-700 dark:text-slate-200">
            Leads Source
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveNav('Leads')}
              className="text-[9px] font-semibold text-sky-500 hover:underline mr-0.5"
              title="Open Leads module"
            >
              Leads →
            </button>
            <div className="relative">
              <button
                onClick={() =>
                  setOpenDropdown(openDropdown === 'leads' ? null : 'leads')
                }
                className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                  isLight
                    ? 'border-sky-200 text-slate-600 bg-sky-50/50 hover:bg-sky-100/70'
                    : 'border-slate-700 text-slate-300 bg-slate-800/60 hover:bg-slate-750'
                }`}
              >
                <span className="font-semibold">{leadsSourcePeriod}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

            {openDropdown === 'leads' && (
              <div
                className={`absolute right-0 mt-1 w-32 rounded-lg border py-1 z-30 ${dropdownBg}`}
              >
                {(['This Month', 'Last Month', 'This Quarter'] as SubPeriod[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      setLeadsSourcePeriod(p);
                      setOpenDropdown(null);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-[11px] transition-colors flex items-center justify-between ${
                      leadsSourcePeriod === p
                        ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold'
                        : 'hover:bg-sky-500/5 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <span>{p}</span>
                    {leadsSourcePeriod === p && <span className="text-sky-500 font-bold">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

        {/* Donut graphic */}
        <div
          onClick={() => setActiveNav('Leads')}
          className="flex items-center justify-center relative my-1 cursor-pointer group"
          title="Click to view Leads Database"
        >
          <svg className="w-24 h-24 -rotate-90 group-hover:scale-105 transition-transform" viewBox="0 0 100 100">
            {activeLeads.items.map((src) => (
              <circle
                key={src.name}
                cx="50"
                cy="50"
                r="38"
                fill="transparent"
                stroke={src.color}
                strokeWidth="16"
                strokeDasharray={src.dash}
                strokeDashoffset={src.offset}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-[11px] font-extrabold tabular-nums text-slate-800 dark:text-white">
              {activeLeads.total}
            </span>
            <span className="text-[7px] text-slate-400 group-hover:text-sky-500 font-semibold">Total Leads</span>
          </div>
        </div>

        {/* Breakdown List */}
        <div className="space-y-1 text-[9px] mt-1">
          {activeLeads.items.map((src) => (
            <div
              key={src.name}
              onClick={() => setActiveNav('Leads')}
              className="flex items-center justify-between cursor-pointer hover:bg-sky-500/10 p-0.5 rounded transition-colors"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: src.color }}
                />
                <span className="truncate text-slate-500 dark:text-slate-300">
                  {src.name}
                </span>
              </div>
              <span className="font-semibold tabular-nums shrink-0 text-slate-700 dark:text-slate-200">
                {src.percentage}% ({src.count})
              </span>
            </div>
          ))}
        </div>

        <div className="text-center pt-1.5 border-t border-sky-100/20 mt-1">
          <button
            onClick={() => setActiveNav('Leads')}
            className="text-[9px] font-semibold text-sky-500 hover:underline"
          >
            Manage All Leads →
          </button>
        </div>
      </div>

      {/* 5. AI BUSINESS ASSISTANT (Spans 3 on xl, 4 on lg) */}
      <div className={`col-span-12 sm:col-span-12 lg:col-span-4 xl:col-span-3 p-3.5 rounded-xl border flex flex-col justify-between ${cardBg}`}>
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-500" />
              <span className="text-[11px] font-bold tracking-wider uppercase text-slate-700 dark:text-slate-200">
                AI Business Assistant
              </span>
            </div>
            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 uppercase">
              Beta
            </span>
          </div>

          <p className="text-[10px] text-slate-500 dark:text-slate-300 font-medium mb-2">
            Hi Sayed, here's your AI summary:
          </p>

          <div className="space-y-2 text-[10px]">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
              <p className="leading-tight text-slate-600 dark:text-slate-300">
                You are on track to hit your {goalState.compactAnnualGoal} goal. Keep your monthly revenue above {goalState.formattedMrrGoal}.
              </p>
            </div>

            <div className="flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
              <p className="leading-tight text-slate-600 dark:text-slate-300">
                <span className="font-semibold text-amber-600 dark:text-amber-400">3 deals</span> are at risk this week worth {currency.symbol}45,000.
              </p>
            </div>

            <div className="flex items-start gap-2">
              <Clock className="w-3.5 h-3.5 text-sky-500 shrink-0 mt-0.5" />
              <p className="leading-tight text-slate-600 dark:text-slate-300">
                <span className="font-semibold">7 clients</span> haven't been contacted in 7+ days.
              </p>
            </div>

            <div className="flex items-start gap-2">
              <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
              <p className="leading-tight text-slate-600 dark:text-slate-300">
                <span className="font-semibold text-rose-500">12 tasks</span> are overdue. Need your attention.
              </p>
            </div>

            <div className="flex items-start gap-2">
              <Zap className="w-3.5 h-3.5 text-teal-500 shrink-0 mt-0.5" />
              <p className="leading-tight text-slate-600 dark:text-slate-300">
                AI Automation generated <span className="font-bold text-teal-600 dark:text-teal-400">{currency.symbol}18,450</span> this month.
              </p>
            </div>

            {/* Conversation replies if asked */}
            {aiMessages.map((msg, i) => (
              <div
                key={i}
                className={`p-2 rounded-lg text-[10px] leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-sky-500/10 text-sky-700 dark:text-sky-300 font-semibold text-right'
                    : 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-medium'
                }`}
              >
                {msg.text}
              </div>
            ))}

            {isAiLoading && (
              <div className="text-[10px] text-sky-500 animate-pulse flex items-center gap-1.5 font-medium">
                <Bot className="w-3.5 h-3.5 animate-spin" />
                Analyzing CRM telemetry...
              </div>
            )}
          </div>
        </div>

        {/* Input prompt query */}
        <form onSubmit={handleAskAi} className="mt-3 relative">
          <input
            type="text"
            value={aiQuestion}
            onChange={(e) => setAiQuestion(e.target.value)}
            placeholder="Ask AI Assistant..."
            className={`w-full text-xs pl-3 pr-8 py-2 rounded-lg border outline-none transition-colors ${
              isLight
                ? 'bg-sky-50/60 border-sky-200 text-slate-800 placeholder:text-slate-400 focus:border-sky-500'
                : 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-sky-400'
            }`}
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-sky-500 hover:text-sky-600 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
