import React from 'react';
import {
  Building,
  Calendar,
  User,
  ArrowRight,
  CheckCircle2,
  DollarSign,
  Plus,
  MessageSquare,
  Mail,
  Phone,
  Flame,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Deal, DealStage } from '../../types/crm';
import { useTheme } from '../../context/ThemeContext';
import { useCrmConfig } from '../../data/crmConfig';
import { useSystemCurrency } from '../../data/currencyService';
import { ContactActionType } from '../leads/LeadActionModal';

interface PipelineKanbanProps {
  deals: Deal[];
  onSelectDeal: (deal: Deal) => void;
  onAdvanceStage: (dealId: string) => void;
  onOpenContact: (deal: Deal, type: ContactActionType) => void;
  onQuickAdd: (stage: DealStage) => void;
}

const STAGES: {
  stage: DealStage;
  label: string;
  prob: number;
  badgeClass: string;
  headerBorder: string;
}[] = [
  {
    stage: 'Discovery',
    label: 'Discovery',
    prob: 25,
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800',
    headerBorder: 'border-t-sky-400',
  },
  {
    stage: 'Proposal Sent',
    label: 'Proposal Sent',
    prob: 50,
    badgeClass: 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-900/50 dark:text-sky-200 dark:border-sky-700',
    headerBorder: 'border-t-sky-500',
  },
  {
    stage: 'Negotiation',
    label: 'Negotiation',
    prob: 75,
    badgeClass: 'bg-sky-200/70 text-sky-900 border-sky-300 dark:bg-sky-800/50 dark:text-sky-100 dark:border-sky-600',
    headerBorder: 'border-t-sky-600',
  },
  {
    stage: 'Contract Sent',
    label: 'Contract Sent',
    prob: 90,
    badgeClass: 'bg-sky-500/15 text-sky-900 border-sky-300 dark:bg-sky-700/50 dark:text-sky-100 dark:border-sky-500',
    headerBorder: 'border-t-sky-700',
  },
  {
    stage: 'Won',
    label: 'Closed Won',
    prob: 100,
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
    headerBorder: 'border-t-emerald-500',
  },
];

export const PipelineKanban: React.FC<PipelineKanbanProps> = ({
  deals,
  onSelectDeal,
  onAdvanceStage,
  onOpenContact,
  onQuickAdd,
}) => {
  const { theme } = useTheme();
  const { config } = useCrmConfig();
  const isLight = theme === 'white-sky';
  const { currency } = useSystemCurrency();
  const activeStages = React.useMemo(
    () =>
      config.pipelineStages.length > 0
        ? config.pipelineStages.map((s) => ({
            stage: s.name as DealStage,
            label: s.label,
            prob: s.prob,
            badgeClass:
              s.name === 'Won'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800',
            headerBorder: s.name === 'Won' ? 'border-t-emerald-500' : 'border-t-sky-500',
          }))
        : STAGES,
    [config.pipelineStages]
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 items-start">
      {activeStages.map((col) => {
        const stageDeals = deals.filter((d) => d.stage === col.stage);
        const stageTotal = stageDeals.reduce((acc, d) => acc + d.value, 0);

        return (
          <div
            key={col.stage}
            className={`rounded-xl border flex flex-col transition-all border-t-3 ${col.headerBorder} ${
              isLight
                ? 'bg-slate-50/70 border-sky-100/90 shadow-2xs'
                : 'bg-[#0f172a]/90 border-slate-800'
            }`}
          >
            {/* Column Header */}
            <div
              className={`p-3 border-b flex items-center justify-between ${
                isLight ? 'bg-sky-50/30 border-sky-100/60' : 'bg-slate-900/60 border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                    {col.label}
                  </span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-semibold border ${col.badgeClass}`}
                  >
                    {stageDeals.length}
                  </span>
                </div>
                <div className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 mt-0.5 tabular-nums">
                  {currency.symbol}{stageTotal.toLocaleString()}
                </div>
              </div>

              <button
                onClick={() => onQuickAdd(col.stage)}
                title={`Add opportunity to ${col.label}`}
                className="p-1 rounded-md text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Deals List */}
            <div className="p-2.5 space-y-2 min-h-[360px] max-h-[720px] overflow-y-auto">
              {stageDeals.length === 0 ? (
                <div
                  className={`h-36 flex flex-col items-center justify-center text-center p-3 border border-dashed rounded-lg text-xs font-normal ${
                    isLight
                      ? 'border-sky-200/80 bg-white/50 text-slate-400'
                      : 'border-slate-800 bg-slate-900/30 text-slate-500'
                  }`}
                >
                  <span className="text-[11px]">No deals in this stage</span>
                  <button
                    onClick={() => onQuickAdd(col.stage)}
                    className="mt-1.5 text-[10px] font-semibold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Create Deal</span>
                  </button>
                </div>
              ) : (
                stageDeals.map((deal) => {
                  const prob = deal.probability ?? col.prob;
                  const weighted = Math.round(deal.value * (prob / 100));
                  const isHighPriority = deal.priority === 'High';

                  return (
                    <div
                      key={deal.id}
                      onClick={() => onSelectDeal(deal)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all hover:scale-[1.01] group ${
                        isLight
                          ? 'bg-white border-sky-100 hover:border-sky-300 hover:shadow-xs'
                          : 'bg-[#151f32] border-slate-700/70 hover:border-sky-500/40 hover:shadow-xs'
                      }`}
                    >
                      {/* Top Meta: Company & Priority */}
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate">
                          {deal.company}
                        </span>
                        {isHighPriority && (
                          <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400">
                            Hot
                          </span>
                        )}
                      </div>

                      {/* Deal Name */}
                      <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-100 group-hover:text-sky-500 transition-colors line-clamp-2 leading-snug">
                        {deal.dealName}
                      </h4>

                      {/* Value and Weighted Forecast */}
                      <div className="mt-2 flex items-baseline justify-between">
                        <span className="text-sm font-semibold text-slate-800 dark:text-white tabular-nums">
                          {currency.symbol}{deal.value.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          Est: {currency.symbol}{weighted.toLocaleString()}
                        </span>
                      </div>

                      {/* Probability Progress Bar */}
                      <div className="mt-1.5 w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            deal.stage === 'Won' ? 'bg-emerald-500' : 'bg-sky-500'
                          }`}
                          style={{ width: `${prob}%` }}
                        />
                      </div>

                      {/* Card Footer: Owner, Close Date, and 1-Click Advance */}
                      <div
                        className={`mt-2 pt-2 border-t flex items-center justify-between text-[10px] ${
                          isLight
                            ? 'border-sky-50 text-slate-500'
                            : 'border-slate-800 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-normal">
                          <span className="truncate max-w-20 text-slate-600 dark:text-slate-300 font-medium">
                            {deal.owner.split(' ')[0]}
                          </span>
                          <span>·</span>
                          <span className="text-slate-400">
                            {deal.closeDate.slice(0, 6)}
                          </span>
                        </div>

                        {/* Quick Action Button */}
                        <div
                          className="flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => onOpenContact(deal, 'whatsapp')}
                            title="Direct WhatsApp"
                            className="p-1 rounded text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800"
                          >
                            <MessageSquare className="w-3 h-3" />
                          </button>

                          {deal.stage !== 'Won' && (
                            <button
                              onClick={() => onAdvanceStage(deal.id)}
                              title="Advance to next stage"
                              className="p-1 rounded bg-sky-500 text-white hover:bg-sky-600 shadow-2xs active:scale-95 transition-all"
                            >
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                          {deal.stage === 'Won' && (
                            <span className="text-emerald-500" title="Closed Won">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
