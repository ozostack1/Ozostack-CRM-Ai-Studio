import React, { useState } from 'react';
import {
  X,
  Sparkles,
  TrendingUp,
  Percent,
  Sliders,
  CheckCircle2,
  Calendar,
  ShieldAlert,
  ArrowRight,
  DollarSign,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { FinancialScenario } from '../../types/crm';
import { useSystemCurrency } from '../../data/currencyService';

interface ScenarioDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  baseRevenue: number;
  baseCogs: number;
  baseOpex: number;
  periodName?: string;
  onSaveScenario: (scen: FinancialScenario) => void;
}

export const ScenarioDrawer: React.FC<ScenarioDrawerProps> = ({
  isOpen,
  onClose,
  baseRevenue,
  baseCogs,
  baseOpex,
  periodName = 'This Month',
  onSaveScenario,
}) => {
  const { theme } = useTheme();
  const { currency } = useSystemCurrency();
  const isLight = theme === 'white-sky';

  const [name, setName] = useState('H2 2026 Accelerated Scale');
  const [growthRate, setGrowthRate] = useState(25); // +25%
  const [cogsOptRate, setCogsOptRate] = useState(-8); // -8% (reduction)
  const [opexRate, setOpexRate] = useState(12); // +12%

  if (!isOpen) return null;

  // Real-time calculations based on active sliders
  const projectedRevenue = Math.round(baseRevenue * (1 + growthRate / 100));
  const projectedCogs = Math.round(baseCogs * (1 + cogsOptRate / 100));
  const projectedGrossProfit = projectedRevenue - projectedCogs;
  const projectedGrossMargin = ((projectedGrossProfit / projectedRevenue) * 100).toFixed(1);

  const projectedOpex = Math.round(baseOpex * (1 + opexRate / 100));
  const projectedEbitda = projectedGrossProfit - projectedOpex;
  const projectedTaxes = Math.round(Math.max(0, projectedEbitda * 0.18));
  const projectedNetIncome = projectedEbitda - projectedTaxes;
  const projectedNetMargin = ((projectedNetIncome / projectedRevenue) * 100).toFixed(1);

  // Runway estimation (assumes $3.2M current cash reserves)
  const currentCash = 3200000;
  const monthlyBurn = projectedOpex + projectedCogs - projectedRevenue;
  const projectedRunway =
    monthlyBurn <= 0 ? 99 : Math.min(99, Math.round(currentCash / monthlyBurn));

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const scenario: FinancialScenario = {
      id: `scen-${Date.now()}`,
      name: name.trim() || 'Custom Financial Scenario',
      revenueGrowthRate: growthRate,
      cogsOptimizationRate: cogsOptRate,
      opexExpansionRate: opexRate,
      projectedRevenue,
      projectedNetIncome,
      projectedRunwayMonths: projectedRunway,
      createdAt: new Date().toISOString().split('T')[0],
    };

    onSaveScenario(scenario);
    onClose();
  };

  const inputClass = isLight
    ? 'w-full px-3 py-2 text-xs rounded-xl border border-sky-100 bg-sky-50/40 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400'
    : 'w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-slate-900/70 text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500';

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className={`w-full max-w-lg h-full flex flex-col border-l shadow-2xl overflow-hidden transition-all ${
          isLight ? 'bg-white border-sky-200' : 'bg-[#0f172a] border-slate-700'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b shrink-0 ${
            isLight ? 'border-sky-100 bg-white/95' : 'border-slate-800 bg-[#0f172a]/95'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Interactive Financial Modeling & Projections
              </h3>
              <p className="text-[11px] text-slate-500">
                Stress-test revenue expansion, GPU compute efficiencies, and runway
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-[11px]">
            <span className="text-slate-500">Baseline Reference ({periodName}):</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {currency.symbol}{baseRevenue.toLocaleString()} Revenue • {currency.symbol}{baseCogs.toLocaleString()} COGS
            </span>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Scenario Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Q3 Tier-1 Enterprise Upsell Surge"
              className={inputClass}
            />
          </div>

          {/* Slider 1: Revenue Growth */}
          <div className="p-4 rounded-xl border border-sky-100 dark:border-slate-800 bg-sky-50/40 dark:bg-slate-900/40 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-800 dark:text-slate-200">
                Topline SaaS Revenue Growth Rate
              </span>
              <span className="px-2 py-0.5 rounded-md font-mono text-xs font-black bg-sky-500 text-white">
                +{growthRate}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={growthRate}
              onChange={(e) => setGrowthRate(Number(e.target.value))}
              className="w-full accent-sky-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Conservative (0%)</span>
              <span>Hyper-scale (+100%)</span>
            </div>
          </div>

          {/* Slider 2: COGS Optimization */}
          <div className="p-4 rounded-xl border border-emerald-100 dark:border-slate-800 bg-emerald-50/40 dark:bg-slate-900/40 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-800 dark:text-slate-200">
                GPU Compute & Infrastructure Efficiency
              </span>
              <span className="px-2 py-0.5 rounded-md font-mono text-xs font-black bg-emerald-500 text-white">
                {cogsOptRate}%
              </span>
            </div>
            <input
              type="range"
              min="-25"
              max="15"
              step="1"
              value={cogsOptRate}
              onChange={(e) => setCogsOptRate(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>-25% (H100 Reserved Instances)</span>
              <span>+15% (Spot Inflation)</span>
            </div>
          </div>

          {/* Slider 3: OpEx Expansion */}
          <div className="p-4 rounded-xl border border-purple-100 dark:border-slate-800 bg-purple-50/40 dark:bg-slate-900/40 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-800 dark:text-slate-200">
                Headcount & OpEx Expansion Rate
              </span>
              <span className="px-2 py-0.5 rounded-md font-mono text-xs font-black bg-purple-500 text-white">
                {opexRate >= 0 ? `+${opexRate}%` : `${opexRate}%`}
              </span>
            </div>
            <input
              type="range"
              min="-15"
              max="50"
              step="5"
              value={opexRate}
              onChange={(e) => setOpexRate(Number(e.target.value))}
              className="w-full accent-purple-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>-15% (Cost Discipline)</span>
              <span>+50% (Aggressive Hiring)</span>
            </div>
          </div>

          {/* Real-time Dynamic Results Card */}
          <div className="p-4 rounded-2xl border border-sky-300 dark:border-sky-800/60 bg-gradient-to-br from-sky-500/10 via-sky-400/5 to-transparent space-y-3">
            <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider block">
              Simulated Forecasted Metrics
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-0.5">Projected Revenue</span>
                <span className="text-base font-black text-slate-900 dark:text-white">
                  {currency.symbol}{projectedRevenue.toLocaleString()}
                </span>
                <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">
                  ▲ +{currency.symbol}{(projectedRevenue - baseRevenue).toLocaleString()} vs baseline
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-0.5">Projected Gross Margin</span>
                <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                  {projectedGrossMargin}%
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  COGS: {currency.symbol}{projectedCogs.toLocaleString()}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-0.5">Projected Net Income</span>
                <span className="text-base font-black text-sky-600 dark:text-sky-400">
                  {currency.symbol}{projectedNetIncome.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Net Margin: {projectedNetMargin}%
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-0.5">Estimated Runway</span>
                <span className="text-base font-black text-indigo-600 dark:text-indigo-400">
                  {projectedRunway >= 99 ? 'Cashflow +' : `${projectedRunway} Months`}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Self-Sustaining Model
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl bg-sky-500 hover:bg-sky-600 text-white shadow-xs transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save Financial Scenario</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

