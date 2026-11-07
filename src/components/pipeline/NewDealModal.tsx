import React, { useState } from 'react';
import { X, DollarSign, Building, Calendar, User, Percent, Sparkles, Phone, Mail, FileText } from 'lucide-react';
import { Deal, DealStage, DealPriority } from '../../types/crm';
import { useTheme } from '../../context/ThemeContext';
import { useCrmConfig } from '../../data/crmConfig';
import { useSystemCurrency } from '../../data/currencyService';

interface NewDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddDeal: (deal: Deal) => void;
  defaultStage?: DealStage;
}

const STAGES: { stage: DealStage; label: string; defaultProb: number }[] = [
  { stage: 'Discovery', label: 'Discovery', defaultProb: 25 },
  { stage: 'Proposal Sent', label: 'Proposal Sent', defaultProb: 50 },
  { stage: 'Negotiation', label: 'Negotiation', defaultProb: 75 },
  { stage: 'Contract Sent', label: 'Contract Sent', defaultProb: 90 },
  { stage: 'Won', label: 'Closed Won', defaultProb: 100 },
];

const OWNERS = [
  'Sayed (CEO)',
  'Amit Kumar',
  'Neha Sharma',
  'Rizwan Khan',
  'Priya Singh',
  'Vikram Joshi',
];

export const NewDealModal: React.FC<NewDealModalProps> = ({
  isOpen,
  onClose,
  onAddDeal,
  defaultStage = 'Discovery',
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
            defaultProb: s.prob,
          }))
        : STAGES,
    [config.pipelineStages]
  );
  const dealCustomFields = React.useMemo(
    () => config.customFields.filter((f) => f.entity === 'Deal' || f.entity === 'Both'),
    [config.customFields]
  );

  const [dealName, setDealName] = useState('');
  const [company, setCompany] = useState('');
  const [value, setValue] = useState<number | string>(35000);
  const [stage, setStage] = useState<DealStage>(defaultStage);
  const [probability, setProbability] = useState<number>(25);
  const [owner, setOwner] = useState(OWNERS[0]);
  const [priority, setPriority] = useState<DealPriority>('High');
  const [closeDate, setCloseDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [customFields, setCustomFields] = useState<Record<string, string | number>>({});

  if (!isOpen) return null;

  const handleStageChange = (newStage: DealStage) => {
    setStage(newStage);
    const found = activeStages.find((s) => s.stage === newStage);
    if (found) {
      setProbability(found.defaultProb);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealName.trim() || !company.trim()) return;

    const numValue = typeof value === 'number' ? value : parseFloat(value) || 0;

    const newDeal: Deal = {
      id: `deal-${Date.now()}`,
      dealName: dealName.trim(),
      company: company.trim(),
      value: numValue,
      valueFormatted: `${currency.symbol}${numValue.toLocaleString()}`,
      stage,
      status: 'Active',
      closeDate,
      owner,
      probability: Number(probability),
      priority,
      contactName: contactName.trim() || undefined,
      contactEmail: contactEmail.trim() || undefined,
      contactPhone: contactPhone.trim() || undefined,
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString().slice(0, 10),
      customFields,
    };

    onAddDeal(newDeal);
    onClose();
  };

  const inputClass = `w-full px-3 py-2 text-xs rounded-lg border outline-none font-normal transition-all ${
    isLight
      ? 'bg-white border-sky-200 text-slate-800 placeholder:text-slate-400 focus:border-sky-500'
      : 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-400 focus:border-sky-400'
  }`;

  const labelClass = `block text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div
        className={`w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden transition-all ${
          isLight ? 'bg-white border-sky-100 text-slate-800' : 'bg-[#0f172a] border-slate-700 text-white'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${
            isLight
              ? 'bg-sky-50/60 border-sky-100'
              : 'bg-slate-900/60 border-slate-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500 text-white shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3
                className={`text-sm font-bold ${
                  isLight ? 'text-slate-800' : 'text-white'
                }`}
              >
                Create Pipeline Opportunity
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                Add an enterprise deal to your active revenue funnel
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-3.5 max-h-[80vh] overflow-y-auto">
          {/* Opportunity & Company */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className={labelClass}>
                Opportunity Name *
              </label>
              <input
                type="text"
                required
                value={dealName}
                onChange={(e) => setDealName(e.target.value)}
                placeholder="e.g. Enterprise AI Implementation"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>
                Client / Company *
              </label>
              <div className="relative">
                <Building className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Apex Global Technologies"
                  className={`${inputClass} pl-8.5`}
                />
              </div>
            </div>
          </div>

          {/* Deal Value & Win Probability */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className={labelClass}>
                Deal Value ({currency.symbol}) *
              </label>
              <div className="relative">
                <span className="text-xs font-bold text-slate-400 absolute left-3 top-1/2 -translate-y-1/2">{currency.symbol}</span>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  required
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className={`${inputClass} pl-8.5 font-semibold tabular-nums`}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>
                Win Probability ({probability}%)
              </label>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={probability}
                  onChange={(e) => setProbability(Number(e.target.value))}
                  className="w-full accent-sky-500 cursor-pointer"
                />
                <span className="text-xs font-semibold text-sky-600 dark:text-sky-400 min-w-8 text-right">
                  {probability}%
                </span>
              </div>
            </div>
          </div>

          {/* Stage & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className={labelClass}>
                Pipeline Stage *
              </label>
              <select
                value={stage}
                onChange={(e) => handleStageChange(e.target.value as DealStage)}
                className={inputClass}
              >
                {activeStages.map((s) => (
                  <option key={s.stage} value={s.stage}>
                    {s.label} ({s.defaultProb}%)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>
                Priority
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['High', 'Medium', 'Low'] as DealPriority[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`py-1.5 text-xs font-medium rounded-lg border transition-all ${
                      priority === p
                        ? 'bg-sky-500 text-white border-sky-500 font-semibold shadow-2xs'
                        : isLight
                        ? 'bg-slate-50 text-slate-600 border-slate-200 hover:border-sky-300'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Owner & Target Close Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className={labelClass}>
                Deal Owner *
              </label>
              <select
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                className={inputClass}
              >
                {OWNERS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>
                Target Close Date *
              </label>
              <input
                type="date"
                required
                value={closeDate}
                onChange={(e) => setCloseDate(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* Primary Stakeholder */}
          <div
            className={`pt-2 border-t ${
              isLight ? 'border-sky-100' : 'border-slate-800'
            }`}
          >
            <span className="font-semibold text-[11px] text-slate-500 uppercase tracking-wider block mb-2">
              Primary Stakeholder Contact (Optional)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Decision Maker Name"
                className={inputClass}
              />
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="email@company.com"
                className={inputClass}
              />
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className={inputClass}
              />
            </div>
          </div>

          {/* Custom Fields (Configured in System Settings) */}
          {dealCustomFields.length > 0 && (
            <div className={`pt-2 border-t ${isLight ? 'border-sky-100' : 'border-slate-800'}`}>
              <span className="font-semibold text-[11px] text-sky-500 uppercase tracking-wider block mb-2">
                Custom Fields
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {dealCustomFields.map((field) => {
                  const val = customFields[field.key] ?? '';
                  const setVal = (newVal: string | number) =>
                    setCustomFields((prev) => ({ ...prev, [field.key]: newVal }));
                  return (
                    <div key={field.id}>
                      <label className={labelClass}>
                        {field.label} {field.required ? '*' : ''}
                      </label>
                      {field.type === 'select' ? (
                        <select
                          required={field.required}
                          value={String(val)}
                          onChange={(e) => setVal(e.target.value)}
                          className={inputClass}
                        >
                          <option value="">Select {field.label}...</option>
                          {(field.options || []).map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : field.type === 'url' ? 'url' : 'text'}
                          required={field.required}
                          value={val}
                          onChange={(e) => setVal(field.type === 'number' ? Number(e.target.value) : e.target.value)}
                          placeholder={field.placeholder || `Enter ${field.label}`}
                          className={inputClass}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Strategic Notes */}
          <div>
            <label className={labelClass}>
              Key Deliverables & Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Client scope, budget approval status, timeline notes..."
              className={`${inputClass} resize-none font-normal`}
            />
          </div>

          {/* Modal Footer */}
          <div
            className={`flex items-center justify-end gap-2.5 pt-3 border-t ${
              isLight ? 'border-sky-100' : 'border-slate-800'
            }`}
          >
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold rounded-lg bg-sky-500 text-white hover:bg-sky-600 shadow-xs active:scale-95 transition-all"
            >
              Add to Pipeline
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
