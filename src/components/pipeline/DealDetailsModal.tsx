import React from 'react';
import {
  X,
  Building,
  Calendar,
  User,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  MessageSquare,
  Mail,
  Phone,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { Deal, DealStage } from '../../types/crm';
import { useTheme } from '../../context/ThemeContext';
import { useCrmConfig } from '../../data/crmConfig';
import { useSystemCurrency } from '../../data/currencyService';
import { ContactActionType } from '../leads/LeadActionModal';

interface DealDetailsModalProps {
  deal: Deal | null;
  isOpen: boolean;
  onClose: () => void;
  onSetStage: (dealId: string, stage: DealStage) => void;
  onAdvanceStage: (dealId: string) => void;
  onOpenContact: (deal: Deal, type: ContactActionType) => void;
}

const STAGES: { stage: DealStage; label: string; prob: number; color: string }[] = [
  { stage: 'Discovery', label: 'Discovery', prob: 25, color: '#38bdf8' },
  { stage: 'Proposal Sent', label: 'Proposal Sent', prob: 50, color: '#0ea5e9' },
  { stage: 'Negotiation', label: 'Negotiation', prob: 75, color: '#0284c7' },
  { stage: 'Contract Sent', label: 'Contract Sent', prob: 90, color: '#0369a1' },
  { stage: 'Won', label: 'Closed Won', prob: 100, color: '#10b981' },
];

export const DealDetailsModal: React.FC<DealDetailsModalProps> = ({
  deal,
  isOpen,
  onClose,
  onSetStage,
  onAdvanceStage,
  onOpenContact,
}) => {
  const { theme } = useTheme();
  const { config } = useCrmConfig();
  const { currency } = useSystemCurrency();
  const isLight = theme === 'white-sky';
  const activeStages = React.useMemo(
    () =>
      config.pipelineStages.length > 0
        ? config.pipelineStages.map((s) => ({
          stage: s.name as DealStage,
          label: s.label,
          prob: s.prob,
          color: s.color,
        }))
        : STAGES,
    [config.pipelineStages]
  );
  const dealCustomFields = React.useMemo(
    () => config.customFields.filter((f) => f.entity === 'Deal' || f.entity === 'Both'),
    [config.customFields]
  );

  if (!isOpen || !deal) return null;

  const currentProb = deal.probability ?? 50;
  const weightedValue = Math.round(deal.value * (currentProb / 100));
  const currentStageIndex = activeStages.findIndex((s) => s.stage === deal.stage);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div
        className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden transition-all ${isLight
          ? 'bg-white border-sky-100 text-slate-800'
          : 'bg-[#0f172a] border-slate-700 text-white'
          }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${isLight
            ? 'bg-sky-50/60 border-sky-100'
            : 'bg-slate-900/60 border-slate-800'
            }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-500 text-white shadow-xs">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3
                  className={`text-base font-bold ${isLight ? 'text-slate-800' : 'text-white'
                    }`}
                >
                  {deal.dealName}
                </h3>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider border ${deal.stage === 'Won'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : deal.stage === 'Lost'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-sky-50 text-sky-700 border-sky-200'
                    }`}
                >
                  {deal.stage}
                </span>
              </div>
              <p
                className={`text-xs mt-0.5 flex items-center gap-1.5 ${isLight ? 'text-slate-500' : 'text-slate-400'
                  }`}
              >
                <span className="font-medium text-slate-700 dark:text-slate-200">
                  {deal.company}
                </span>
                <span>·</span>
                <span>Target Close: {deal.closeDate}</span>
                <span>·</span>
                <span>Owner: {deal.owner}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4.5 max-h-[80vh] overflow-y-auto">
          {/* Interactive Pipeline Stage Stepper */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Pipeline Stage Progression (Click to Change)
              </label>
              <span className="text-[11px] font-semibold text-sky-600 dark:text-sky-400">
                {deal.stage === 'Won' ? '100% Won' : `${currentProb}% Probability`}
              </span>
            </div>

            <div className="grid grid-cols-5 gap-1.5">
              {activeStages.map((st, idx) => {
                const isCurrent = deal.stage === st.stage;
                const isPassed = currentStageIndex > idx;

                return (
                  <button
                    key={st.stage}
                    onClick={() => onSetStage(deal.id, st.stage)}
                    className={`p-2 rounded-xl border text-center transition-all ${isCurrent
                      ? 'bg-sky-500 text-white border-sky-500 shadow-xs font-semibold ring-1 ring-sky-400'
                      : isPassed
                        ? 'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800 font-medium'
                        : 'bg-slate-50/70 text-slate-500 border-slate-200/80 hover:border-sky-300 dark:bg-slate-800/40 dark:border-slate-800 font-medium'
                      }`}
                  >
                    <div
                      className={`flex items-center justify-center gap-1 text-[9px] uppercase tracking-wider ${isCurrent
                        ? 'text-white/90 font-semibold'
                        : 'text-slate-400 dark:text-slate-500'
                        }`}
                    >
                      {isPassed ? (
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                      ) : (
                        `Step ${idx + 1}`
                      )}
                    </div>
                    <div className="text-[11px] truncate mt-0.5">
                      {st.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Key Financial KPIs */}
          <div className="grid grid-cols-3 gap-2.5">
            <div
              className={`p-3 rounded-xl border ${isLight ? 'bg-sky-50/50 border-sky-100' : 'bg-slate-800/50 border-slate-700'
                }`}
            >
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
                Gross Deal Value
              </div>
              <div
                className={`text-lg font-bold tabular-nums ${isLight ? 'text-slate-800' : 'text-white'
                  }`}
              >
                {currency.symbol}{deal.value.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 font-normal">
                Fixed contract scope
              </div>
            </div>

            <div
              className={`p-3 rounded-xl border ${isLight ? 'bg-sky-50/50 border-sky-100' : 'bg-slate-800/50 border-slate-700'
                }`}
            >
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
                Win Probability
              </div>
              <div className="text-lg font-bold text-sky-600 dark:text-sky-400 tabular-nums">
                {currentProb}%
              </div>
              <div className="text-[10px] text-sky-500 font-medium mt-0.5">
                Stage benchmark
              </div>
            </div>

            <div
              className={`p-3 rounded-xl border ${isLight ? 'bg-sky-50/50 border-sky-100' : 'bg-slate-800/50 border-slate-700'
                }`}
            >
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
                Weighted Revenue
              </div>
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {currency.symbol}{weightedValue.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 font-normal">
                Forecast expectation
              </div>
            </div>
          </div>

          {/* Stakeholder & Direct Outreach */}
          <div
            className={`p-3.5 rounded-xl border ${isLight ? 'bg-white border-sky-100 shadow-2xs' : 'bg-slate-800/40 border-slate-700'
              }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
                  Primary Decision Maker
                </div>
                <div
                  className={`text-xs font-semibold flex items-center gap-1.5 ${isLight ? 'text-slate-800' : 'text-white'
                    }`}
                >
                  <User className="w-3.5 h-3.5 text-sky-500" />
                  <span>{deal.contactName || 'Executive Sponsor'}</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-normal">
                  {deal.contactEmail ||
                    `contact@${deal.company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`}{' '}
                  · {deal.contactPhone || '+1 (555) 012-3456'}
                </div>
              </div>

              {/* Quick Communication Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onOpenContact(deal, 'whatsapp')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>
                <button
                  onClick={() => onOpenContact(deal, 'email')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-sky-500/10 text-sky-600 hover:bg-sky-500 hover:text-white transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email</span>
                </button>
                <button
                  onClick={() => onOpenContact(deal, 'call')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-sky-500/10 text-sky-700 hover:bg-sky-600 hover:text-white transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call</span>
                </button>
              </div>
            </div>
          </div>

          {/* Custom Fields */}
          {dealCustomFields.length > 0 && (
            <div
              className={`p-3.5 rounded-xl border ${isLight ? 'bg-slate-50/70 border-sky-100' : 'bg-slate-800/40 border-slate-700'
                }`}
            >
              <div className="text-[10px] font-semibold text-sky-500 uppercase tracking-wider mb-2">
                Custom Fields
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {dealCustomFields.map((field) => {
                  const val = deal.customFields?.[field.key];
                  return (
                    <div key={field.id} className="flex items-center justify-between gap-2">
                      <span className="text-slate-400">{field.label}:</span>
                      <span className="font-semibold text-slate-800 dark:text-white truncate">
                        {val !== undefined && val !== '' ? String(val) : '—'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Strategic Notes */}
          <div>
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Executive Notes & Next Steps
            </label>
            <div
              className={`p-3 rounded-xl border text-xs leading-relaxed font-normal ${isLight
                ? 'bg-slate-50/70 border-slate-200 text-slate-700'
                : 'bg-slate-800/50 border-slate-700 text-slate-300'
                }`}
            >
              {deal.notes ||
                'Key stakeholders engaged. Reviewing milestone schedule and budget authorization.'}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className={`flex items-center justify-between px-6 py-3.5 border-t ${isLight
            ? 'bg-slate-50/70 border-sky-100'
            : 'bg-slate-900 border-slate-800'
            }`}
        >
          <div className="flex items-center gap-2">
            {deal.stage !== 'Lost' && (
              <button
                onClick={() => onSetStage(deal.id, 'Lost')}
                className="px-3 py-1.5 text-xs font-medium rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
              >
                Mark as Lost
              </button>
            )}
            {deal.stage !== 'Won' && (
              <button
                onClick={() => onSetStage(deal.id, 'Won')}
                className="px-3 py-1.5 text-xs font-medium rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors flex items-center gap-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mark as Won</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
            >
              Close
            </button>
            {deal.stage !== 'Won' && deal.stage !== 'Lost' && (
              <button
                onClick={() => onAdvanceStage(deal.id)}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg bg-sky-500 text-white hover:bg-sky-600 shadow-xs active:scale-95 transition-all"
              >
                <span>Advance Stage</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
