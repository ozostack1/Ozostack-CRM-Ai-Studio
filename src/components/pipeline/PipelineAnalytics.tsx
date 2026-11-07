import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  BarChart3,
  Sliders,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  PieChart,
} from 'lucide-react';
import { Deal, DealStage } from '../../types/crm';
import { useTheme } from '../../context/ThemeContext';
import { useCrmConfig } from '../../data/crmConfig';
import { useSystemCurrency } from '../../data/currencyService';

interface PipelineAnalyticsProps {
  deals: Deal[];
}

const STAGES: { stage: DealStage; label: string; defaultProb: number; avgDays: number }[] = [
  { stage: 'Discovery', label: 'Discovery', defaultProb: 25, avgDays: 6 },
  { stage: 'Proposal Sent', label: 'Proposal Sent', defaultProb: 50, avgDays: 9 },
  { stage: 'Negotiation', label: 'Negotiation', defaultProb: 75, avgDays: 14 },
  { stage: 'Contract Sent', label: 'Contract Sent', defaultProb: 90, avgDays: 5 },
  { stage: 'Won', label: 'Closed Won', defaultProb: 100, avgDays: 0 },
];

export const PipelineAnalytics: React.FC<PipelineAnalyticsProps> = ({ deals }) => {
  const { theme } = useTheme();
  const { config } = useCrmConfig();
  const { currency } = useSystemCurrency();
  const isLight = theme === 'white-sky';
  const activeStages = useMemo(
    () =>
      config.pipelineStages.length > 0
        ? config.pipelineStages.map((s, idx) => ({
            stage: s.name as DealStage,
            label: s.label,
            defaultProb: s.prob,
            avgDays: STAGES[idx]?.avgDays ?? 7,
          }))
        : STAGES,
    [config.pipelineStages]
  );

  // What-If Simulator sliders
  const [winRateLift, setWinRateLift] = useState<number>(10);
  const [dealExpansion, setDealExpansion] = useState<number>(15);

  const stageData = useMemo(() => {
    return activeStages.map((s) => {
      const stageDeals = deals.filter((d) => d.stage === s.stage);
      const total = stageDeals.reduce((acc, d) => acc + d.value, 0);

      const benchmarkConversions: Record<DealStage, number> = {
        Discovery: 78,
        'Proposal Sent': 65,
        Negotiation: 82,
        'Contract Sent': 95,
        Won: 100,
        Lost: 0,
      };

      return {
        stage: s.stage,
        label: s.label,
        count: stageDeals.length,
        value: total,
        conversionRate: benchmarkConversions[s.stage] ?? 70,
        avgDays: s.avgDays,
      };
    });
  }, [deals, activeStages]);

  const totalValue = deals.reduce((acc, d) => acc + d.value, 0);
  const weightedBase = deals.reduce((acc, d) => acc + d.value * ((d.probability ?? 50) / 100), 0);

  const simulatedRevenue = useMemo(() => {
    const factor = (1 + winRateLift / 100) * (1 + dealExpansion / 100);
    return Math.round(weightedBase * factor);
  }, [weightedBase, winRateLift, dealExpansion]);

  const cardBg = isLight
    ? 'bg-white border-sky-100/90 shadow-2xs'
    : 'bg-[#0f172a]/90 border-slate-800';

  return (
    <div className="space-y-4">
      {/* Funnel Conversion & Velocity Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Stage Conversion Bars */}
        <div className={`p-4 rounded-xl border lg:col-span-2 ${cardBg}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-sky-500 text-white">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h3
                  className={`text-xs font-semibold ${
                    isLight ? 'text-slate-800' : 'text-white'
                  }`}
                >
                  Stage Conversion & Funnel Velocity
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                  Step-by-step conversion benchmarks and deal aging across pipeline
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3.5">
            {stageData.map((st, idx) => {
              const shareOfTotal = totalValue > 0 ? Math.round((st.value / totalValue) * 100) : 0;

              return (
                <div key={st.stage} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-sky-500/10 text-sky-700 dark:text-sky-300 font-semibold text-[10px] flex items-center justify-center border border-sky-200">
                        {idx + 1}
                      </span>
                      <span
                        className={`font-medium ${
                          isLight ? 'text-slate-700' : 'text-slate-200'
                        }`}
                      >
                        {st.label}
                      </span>
                      <span className="text-[11px] text-slate-400 font-normal">
                        ({st.count} {st.count === 1 ? 'deal' : 'deals'})
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`font-semibold tabular-nums ${
                          isLight ? 'text-slate-800' : 'text-white'
                        }`}
                      >
                        {currency.symbol}{st.value.toLocaleString()}
                      </span>
                      <span className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 min-w-10 text-right">
                        {st.conversionRate}%
                      </span>
                    </div>
                  </div>

                  {/* Visual Bar */}
                  <div
                    className={`w-full h-2 rounded-full overflow-hidden flex ${
                      isLight ? 'bg-slate-100' : 'bg-slate-800'
                    }`}
                  >
                    <div
                      className={`h-full rounded-full transition-all ${
                        st.stage === 'Won'
                          ? 'bg-emerald-500'
                          : 'bg-gradient-to-r from-sky-400 to-sky-600'
                      }`}
                      style={{ width: `${Math.max(st.conversionRate, 5)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] px-0.5 text-slate-400 font-normal">
                    <span>
                      Avg Velocity:{' '}
                      <strong className={isLight ? 'text-slate-600' : 'text-slate-300'}>
                        {st.avgDays} days
                      </strong>
                    </span>
                    <span>{shareOfTotal}% of active pipeline value</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Revenue Forecasting Simulator */}
        <div className={`p-4 rounded-xl border flex flex-col justify-between ${cardBg}`}>
          <div>
            <div
              className={`flex items-center gap-2 pb-3 border-b ${
                isLight ? 'border-sky-100' : 'border-slate-800'
              }`}
            >
              <div className="p-1.5 rounded-lg bg-sky-500 text-white">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h3
                  className={`text-xs font-semibold ${
                    isLight ? 'text-slate-800' : 'text-white'
                  }`}
                >
                  Revenue Forecast Simulator
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                  Model revenue outcomes from win rate and deal expansion
                </p>
              </div>
            </div>

            {/* Simulated Projected Value Display */}
            <div
              className={`mt-4 p-3.5 rounded-xl border text-center ${
                isLight
                  ? 'bg-sky-50/50 border-sky-100'
                  : 'bg-gradient-to-br from-sky-500/10 via-sky-400/5 to-transparent border-slate-700'
              }`}
            >
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Projected Quarterly Revenue
              </span>
              <div className="text-2xl font-bold text-sky-600 dark:text-sky-400 tabular-nums mt-1">
                {currency.symbol}{simulatedRevenue.toLocaleString()}
              </div>
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 mt-2">
                <TrendingUp className="w-3 h-3" />
                <span>+{currency.symbol}{(simulatedRevenue - Math.round(weightedBase)).toLocaleString()} Upside</span>
              </div>
            </div>

            {/* Sliders */}
            <div className="mt-4 space-y-3.5">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className={isLight ? 'text-slate-700' : 'text-slate-300'}>
                    Win Rate Lift
                  </span>
                  <span className="text-sky-600 dark:text-sky-400">+{winRateLift}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="35"
                  value={winRateLift}
                  onChange={(e) => setWinRateLift(Number(e.target.value))}
                  className="w-full accent-sky-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className={isLight ? 'text-slate-700' : 'text-slate-300'}>
                    Contract Expansion
                  </span>
                  <span className="text-sky-600 dark:text-sky-400">+{dealExpansion}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  value={dealExpansion}
                  onChange={(e) => setDealExpansion(Number(e.target.value))}
                  className="w-full accent-sky-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div
            className={`pt-3 border-t text-[11px] ${
              isLight
                ? 'border-sky-100 text-slate-500'
                : 'border-slate-800 text-slate-400'
            }`}
          >
            Baseline: <strong className={isLight ? 'text-slate-700' : 'text-slate-200'}>{currency.symbol}{Math.round(weightedBase).toLocaleString()}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
