import React, { useState } from 'react';
import {
  X,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  Send,
  Zap,
  DollarSign,
  Target,
  FileText,
} from 'lucide-react';
import { Deal } from '../../types/crm';
import { useTheme } from '../../context/ThemeContext';
import { useSystemCurrency } from '../../data/currencyService';

interface AiDealAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  deal: Deal | null;
  onLogStrategyNote?: (dealId: string, note: string) => void;
}

export const AiDealAdvisorModal: React.FC<AiDealAdvisorModalProps> = ({
  isOpen,
  onClose,
  deal,
  onLogStrategyNote,
}) => {
  const { theme } = useTheme();
  const currency = useSystemCurrency();
  const isLight = theme === 'white-sky';

  const [activeTab, setActiveTab] = useState<'strategy' | 'objections' | 'action_plan'>('strategy');
  const [copied, setCopied] = useState(false);
  const [isLogged, setIsLogged] = useState(false);

  if (!isOpen || !deal) return null;

  const clientName = deal.company || deal.client || 'Client';
  const projectName = deal.dealName || deal.project || 'Opportunity';

  const probability = deal.probability ?? 50;
  const weightedValue = Math.round((deal.value * probability) / 100);

  // Strategic score calculation
  const healthScore = Math.min(
    100,
    Math.round(probability * 0.7 + (deal.priority === 'High' ? 25 : deal.priority === 'Medium' ? 15 : 5))
  );

  const getStrategyContent = () => {
    switch (deal.stage) {
      case 'Discovery':
        return {
          title: 'Value Discovery & Champion Alignment Strategy',
          overview: `At ${currency.symbol}${deal.value.toLocaleString()} in the Discovery phase, focus on quantifying ${clientName}'s operational cost of inaction.`,
          steps: [
            'Map the economic buyer and quantify ROI metrics (target: 3.5x - 5x first-year return).',
            'Conduct a technical scope discovery session with their lead architects to lock down architecture requirements.',
            'Confirm target sign-off dates before drafting the formal master proposal.',
          ],
          pitfalls: 'Premature pricing discussions before establishing value metrics and board approval criteria.',
        };
      case 'Proposal Sent':
        return {
          title: 'Executive Proposal Walkthrough & Decision Velocity',
          overview: `Proposal is in hands of ${clientName}. High risk of decision inertia unless an executive alignment meeting is scheduled.`,
          steps: [
            'Propose a 20-minute executive walkthrough with CEO/CTO to address enterprise questions directly.',
            'Highlight Ozostack proprietary deployment velocity (2-3x faster time-to-market).',
            'Provide references or case studies in ' + (deal.serviceCategory || 'Enterprise Technology') + '.',
          ],
          pitfalls: 'Waiting passively for email replies without a locked review date on the calendar.',
        };
      case 'Negotiation':
        return {
          title: 'Value-Preserving Closing & Concession Matrix',
          overview: `Deal value ${currency.symbol}${deal.value.toLocaleString()} is in final commercial review. Protect margin while expediting close.`,
          steps: [
            'Trade concessions: If client requests a 5-10% discount, request quarterly upfront payment or an extended 24-month commitment.',
            'Offer complimentary 90-day premium hypercare instead of cutting core engineering rates.',
            'Create timeline-based closing incentive tied to current quarter end.',
          ],
          pitfalls: 'Discounting without reciprocity or unbundling critical security/architecture scope.',
        };
      case 'Contract Sent':
        return {
          title: 'Legal & Procurement Redline Acceleration',
          overview: `Contract is in legal/procurement for ${clientName}. Target close is ${deal.closeDate || 'this month'}.`,
          steps: [
            'Set up a rapid redline resolution call between legal leads rather than multi-day email volley.',
            'Confirm internal invoice processing timeline and vendor portal onboarding.',
            'Pre-allocate engineering lead time so kickoff occurs within 48 hours of signature.',
          ],
          pitfalls: 'Allowing legal redlines to stall without CEO-to-CEO check-in.',
        };
      case 'Won':
        return {
          title: 'Client Onboarding & Expansion Roadmap',
          overview: `Deal won! ${currency.symbol}${deal.value.toLocaleString()} secured for Ozostack revenue pipeline.`,
          steps: [
            'Send executive welcome packet and schedule milestone 0 kickoff workshop.',
            'Initiate 30-60-90 day milestone delivery tracking.',
            'Identify potential cross-sell expansion opportunities for Phase 2.',
          ],
          pitfalls: 'Lag between contract execution and kickoff cadence.',
        };
      default:
        return {
          title: 'Deal Revival & Competitive Repositioning',
          overview: `Analyze primary reasons for stall and formulate an enterprise re-engagement sequence.`,
          steps: [
            'Reach out with updated product capability benchmarks.',
            'Schedule brief check-in regarding 2025 technology roadmap shifts.',
          ],
          pitfalls: 'Leaving deal inactive without definitive next steps.',
        };
    }
  };

  const strategy = getStrategyContent();

  const handleCopy = () => {
    const text = `OZONSTACK AI DEAL ADVISOR PLAN
Client: ${clientName} (${projectName})
Deal Value: ${currency.symbol}${deal.value.toLocaleString()} | Stage: ${deal.stage} | Health Score: ${healthScore}/100
Weighted Value: ${currency.symbol}${weightedValue.toLocaleString()}

STRATEGY: ${strategy.title}
${strategy.overview}

RECOMMENDED ACTION STEPS:
${strategy.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}

WATCHOUT:
${strategy.pitfalls}
`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogNote = () => {
    if (onLogStrategyNote) {
      onLogStrategyNote(
        deal.id,
        `AI Deal Strategy Plan: ${strategy.title} - ${strategy.steps.slice(0, 2).join('; ')}`
      );
      setIsLogged(true);
      setTimeout(() => setIsLogged(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div
        className={`relative w-full max-w-2xl rounded-2xl shadow-2xl border overflow-hidden z-10 max-h-[90vh] flex flex-col ${
          isLight ? 'bg-white border-sky-100 text-slate-800' : 'bg-slate-900 border-slate-700 text-white'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-sky-100/30 bg-gradient-to-r from-sky-500/10 via-indigo-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-400 to-indigo-600 text-white flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span>AI Deal Closing Advisor</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-300">
                  Strategic Co-Pilot
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Opportunity: <span className="font-bold text-slate-700 dark:text-slate-200">{projectName}</span> · {clientName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Intelligence Metrics Ribbon */}
        <div
          className={`grid grid-cols-4 gap-2 px-6 py-3 border-b text-center text-xs ${
            isLight ? 'bg-sky-50/50 border-sky-100' : 'bg-slate-800/40 border-slate-800'
          }`}
        >
          <div>
            <div className="text-[9px] font-bold text-slate-400 uppercase">Gross Value</div>
            <div className="text-sm font-extrabold text-emerald-500 tabular-nums">
              {currency.symbol}{deal.value.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-[9px] font-bold text-slate-400 uppercase">Win Probability</div>
            <div className="text-sm font-extrabold text-sky-500 tabular-nums">
              {probability}%
            </div>
          </div>
          <div>
            <div className="text-[9px] font-bold text-slate-400 uppercase">Weighted Value</div>
            <div className="text-sm font-extrabold text-indigo-500 tabular-nums">
              {currency.symbol}{weightedValue.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-[9px] font-bold text-slate-400 uppercase">Deal Health</div>
            <div
              className={`text-sm font-extrabold tabular-nums ${
                healthScore >= 75
                  ? 'text-emerald-500'
                  : healthScore >= 50
                  ? 'text-amber-500'
                  : 'text-rose-500'
              }`}
            >
              {healthScore}/100
            </div>
          </div>
        </div>

        {/* Content Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-sky-100/20 text-xs">
          <button
            onClick={() => setActiveTab('strategy')}
            className={`pb-2.5 font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'strategy'
                ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Winning Strategy</span>
          </button>

          <button
            onClick={() => setActiveTab('objections')}
            className={`pb-2.5 font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'objections'
                ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Objection Playbook</span>
          </button>

          <button
            onClick={() => setActiveTab('action_plan')}
            className={`pb-2.5 font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'action_plan'
                ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Executive Action Plan</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {activeTab === 'strategy' && (
            <div className="space-y-4">
              <div
                className={`p-4 rounded-xl border ${
                  isLight ? 'bg-sky-50/60 border-sky-200/80' : 'bg-slate-800/60 border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-500 text-white uppercase">
                    Stage Focus: {deal.stage}
                  </span>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    {strategy.title}
                  </h3>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  {strategy.overview}
                </p>
              </div>

              {/* Recommended Steps */}
              <div>
                <span className="font-bold text-[11px] text-slate-400 uppercase tracking-wider block mb-2">
                  Key Tactical Action Levers
                </span>
                <div className="space-y-2">
                  {strategy.steps.map((step, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                        isLight ? 'bg-white border-sky-100 shadow-2xs' : 'bg-slate-800/40 border-slate-700'
                      }`}
                    >
                      <div className="w-5 h-5 rounded-full bg-sky-500 text-white font-extrabold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <p className="text-slate-700 dark:text-slate-200 leading-snug">
                        {step}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Watchout Pitfall */}
              <div
                className={`p-3.5 rounded-xl border flex items-start gap-2.5 ${
                  isLight ? 'bg-amber-50/70 border-amber-200 text-amber-900' : 'bg-amber-950/30 border-amber-800 text-amber-200'
                }`}
              >
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-[11px] uppercase tracking-wider">
                    Critical Watchout
                  </span>
                  <p className="text-xs leading-relaxed mt-0.5">{strategy.pitfalls}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'objections' && (
            <div className="space-y-3">
              {[
                {
                  objection: '"The quote is slightly above our allocated fiscal budget."',
                  script:
                    '“I understand budget constraints, and we engineer solutions around ROI. If we structure this with a phased milestone rollout—starting with high-impact automation in Phase 1—we stay inside your current budget while proving measurable returns before Phase 2.”',
                },
                {
                  objection: '"We are comparing this with another enterprise vendor."',
                  script:
                    '“We welcome comparison on performance. What differentiates Ozostack is our dedicated architecture team, zero-overhead cloud acceleration, and enterprise uptime SLA. Would it help to review our side-by-side implementation timeline?”',
                },
                {
                  objection: '"Can we delay contract signing until next month?"',
                  script:
                    '“We can hold our delivery schedule open for 7 business days. Beyond that, our engineering slots for Q3 fill up and commencement would slide 6 weeks. If we sign by Friday, we lock in your dedicated architects.”',
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border space-y-1.5 ${
                    isLight ? 'bg-white border-sky-100 shadow-2xs' : 'bg-slate-800/40 border-slate-700'
                  }`}
                >
                  <div className="font-bold text-rose-500 dark:text-rose-400 flex items-center gap-1.5">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10">Objection {idx + 1}</span>
                    <span>{item.objection}</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 italic pl-2 border-l-2 border-sky-400 leading-relaxed text-xs">
                    {item.script}
                  </p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'action_plan' && (
            <div className="space-y-3">
              <div
                className={`p-4 rounded-xl border space-y-2 ${
                  isLight ? 'bg-slate-50 border-sky-100' : 'bg-slate-800/50 border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 dark:text-white uppercase tracking-wider text-[11px]">
                    48-Hour Next Steps Checklist
                  </span>
                  <span className="text-[10px] text-sky-500 font-semibold">Deal Owner: {deal.owner}</span>
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Send customized executive summary directly to {deal.contactName || 'stakeholder'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Schedule 15-min commercial review with deal champion</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Prepare MSA redlines & technical scoping architecture documentation</span>
                  </div>
                </div>
              </div>

              {deal.notes && (
                <div
                  className={`p-3.5 rounded-xl border text-xs ${
                    isLight ? 'bg-sky-50/30 border-sky-100' : 'bg-slate-800/30 border-slate-700'
                  }`}
                >
                  <span className="font-bold text-[10px] uppercase text-slate-400 block mb-1">
                    Existing Deal Notes
                  </span>
                  <p className="text-slate-600 dark:text-slate-300">{deal.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-sky-100/30 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="text-[11px] text-slate-400">
            Powered by Ozostack CRM Intelligence
          </div>

          <div className="flex items-center gap-2">
            {onLogStrategyNote && (
              <button
                onClick={handleLogNote}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  isLogged
                    ? 'bg-emerald-500 text-white border-emerald-500'
                    : isLight
                    ? 'border-sky-200 text-slate-700 hover:bg-sky-50'
                    : 'border-slate-700 text-slate-200 hover:bg-slate-800'
                }`}
              >
                {isLogged ? <Check className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                <span>{isLogged ? 'Logged to Deal Notes' : 'Save to Notes'}</span>
              </button>
            )}

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-sky-500 hover:bg-sky-600 shadow-sm active:scale-95 transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied Strategy!' : 'Copy Plan'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
