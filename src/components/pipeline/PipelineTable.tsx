import React from 'react';
import {
  Building,
  Calendar,
  User,
  ArrowRight,
  CheckCircle2,
  DollarSign,
  MessageSquare,
  Mail,
  Phone,
  Eye,
  Flame,
} from 'lucide-react';
import { Deal, DealStage } from '../../types/crm';
import { useTheme } from '../../context/ThemeContext';
import { useCrmConfig } from '../../data/crmConfig';
import { useSystemCurrency } from '../../data/currencyService';
import { ContactActionType } from '../leads/LeadActionModal';

interface PipelineTableProps {
  deals: Deal[];
  onSelectDeal: (deal: Deal) => void;
  onSetStage: (dealId: string, stage: DealStage) => void;
  onAdvanceStage: (dealId: string) => void;
  onOpenContact: (deal: Deal, type: ContactActionType) => void;
}

const STAGES: { stage: DealStage; label: string }[] = [
  { stage: 'Discovery', label: 'Discovery' },
  { stage: 'Proposal Sent', label: 'Proposal Sent' },
  { stage: 'Negotiation', label: 'Negotiation' },
  { stage: 'Contract Sent', label: 'Contract Sent' },
  { stage: 'Won', label: 'Closed Won' },
];

export const PipelineTable: React.FC<PipelineTableProps> = ({
  deals,
  onSelectDeal,
  onSetStage,
  onAdvanceStage,
  onOpenContact,
}) => {
  const { theme } = useTheme();
  const { config } = useCrmConfig();
  const isLight = theme === 'white-sky';
  const { currency } = useSystemCurrency();
  const activeStages = React.useMemo(
    () =>
      config.pipelineStages.length > 0
        ? config.pipelineStages.map((s) => ({ stage: s.name as DealStage, label: s.label }))
        : STAGES,
    [config.pipelineStages]
  );

  if (deals.length === 0) {
    return (
      <div className={`py-12 text-center text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
        <p>No opportunities match the selected criteria.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-sky-100/60 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
            <th className="py-2.5 px-4 font-semibold">Opportunity & Client</th>
            <th className="py-2.5 px-3 font-semibold">Deal Value</th>
            <th className="py-2.5 px-3 font-semibold">Win Probability</th>
            <th className="py-2.5 px-3 font-semibold">Pipeline Stage</th>
            <th className="py-2.5 px-3 font-semibold">Target Close</th>
            <th className="py-2.5 px-3 font-semibold">Owner</th>
            <th className="py-2.5 px-4 text-right font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody className={`divide-y ${isLight ? 'divide-sky-100/40' : 'divide-slate-800/80'}`}>
          {deals.map((deal) => {
            const prob = deal.probability ?? 50;
            const weighted = Math.round(deal.value * (prob / 100));
            const isHighPriority = deal.priority === 'High';

            return (
              <tr
                key={deal.id}
                onClick={() => onSelectDeal(deal)}
                className={`transition-colors group cursor-pointer ${
                  isLight
                    ? 'hover:bg-sky-50/50'
                    : 'hover:bg-slate-800/40'
                }`}
              >
                {/* Opportunity & Client */}
                <td className="py-2.5 px-4">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`font-medium group-hover:text-sky-500 transition-colors ${
                        isLight ? 'text-slate-800' : 'text-slate-100'
                      }`}
                    >
                      {deal.dealName}
                    </span>
                    {isHighPriority && (
                      <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400">
                        Hot
                      </span>
                    )}
                  </div>
                  <div
                    className={`text-[11px] flex items-center gap-1 mt-0.5 ${
                      isLight ? 'text-slate-500' : 'text-slate-400'
                    }`}
                  >
                    <span>{deal.company}</span>
                  </div>
                </td>

                {/* Deal Value */}
                <td className="py-2.5 px-3">
                  <div
                    className={`font-semibold tabular-nums text-xs sm:text-sm ${
                      isLight ? 'text-slate-800' : 'text-slate-100'
                    }`}
                  >
                    {currency.symbol}{deal.value.toLocaleString()}
                  </div>
                  <div
                    className={`text-[10px] ${
                      isLight ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    Est: {currency.symbol}{weighted.toLocaleString()}
                  </div>
                </td>

                {/* Win Probability */}
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-2">
                    <div className="w-14 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          deal.stage === 'Won' ? 'bg-emerald-500' : 'bg-sky-500'
                        }`}
                        style={{ width: `${prob}%` }}
                      />
                    </div>
                    <span
                      className={`text-[10px] font-medium ${
                        isLight ? 'text-slate-600' : 'text-slate-300'
                      }`}
                    >
                      {prob}%
                    </span>
                  </div>
                </td>

                {/* Pipeline Stage Dropdown */}
                <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1.5">
                    <select
                      value={deal.stage}
                      onChange={(e) => onSetStage(deal.id, e.target.value as DealStage)}
                      className={`text-[11px] px-2 py-1 rounded-lg border font-medium outline-none cursor-pointer transition-colors shadow-2xs ${
                        deal.stage === 'Won'
                          ? isLight
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-emerald-950/70 text-emerald-300 border-emerald-800'
                          : isLight
                          ? 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100/60'
                          : 'bg-sky-950/70 text-sky-300 border-sky-800'
                      }`}
                    >
                      {activeStages.map((s) => (
                        <option key={s.stage} value={s.stage}>
                          {s.label}
                        </option>
                      ))}
                    </select>

                    {deal.stage !== 'Won' && (
                      <button
                        onClick={() => onAdvanceStage(deal.id)}
                        title="Advance to next stage"
                        className="p-1 rounded-md bg-sky-500 text-white hover:bg-sky-600 shadow-2xs active:scale-95 transition-all"
                      >
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </td>

                {/* Close Date */}
                <td
                  className={`py-2.5 px-3 font-normal text-slate-500 dark:text-slate-400 tabular-nums text-[11px]`}
                >
                  {deal.closeDate}
                </td>

                {/* Owner */}
                <td
                  className={`py-2.5 px-3 font-normal text-slate-600 dark:text-slate-300 text-[11px]`}
                >
                  {deal.owner}
                </td>

                {/* Quick Actions */}
                <td className="py-2.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onOpenContact(deal, 'whatsapp')}
                      title="WhatsApp Decision Maker"
                      className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onOpenContact(deal, 'email')}
                      title="Send Email"
                      className="p-1 text-sky-600 hover:bg-sky-50 dark:hover:bg-slate-800 rounded transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onOpenContact(deal, 'call')}
                      title="Direct Call"
                      className="p-1 text-sky-700 hover:bg-sky-50 dark:hover:bg-slate-800 rounded transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onSelectDeal(deal)}
                      className="flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold rounded-md bg-sky-500 text-white hover:bg-sky-600 transition-colors shadow-2xs ml-1"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Details</span>
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
