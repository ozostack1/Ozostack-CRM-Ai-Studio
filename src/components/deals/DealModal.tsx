import React, { useState, useEffect } from 'react';
import { X, DollarSign, Building, Briefcase, Calendar, User, Percent, AlertCircle } from 'lucide-react';
import { Deal, DealStage } from '../../types/crm';
import { useTheme } from '../../context/ThemeContext';
import { useCrmConfig } from '../../data/crmConfig';
import { useSystemCurrency } from '../../data/currencyService';

interface DealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (deal: Deal) => void;
  dealToEdit?: Deal | null;
  defaultStage?: DealStage;
}

const STAGES: DealStage[] = [
  'Discovery',
  'Proposal Sent',
  'Negotiation',
  'Contract Sent',
  'Won',
  'Lost',
];

const OWNERS = ['Sayed (CEO)', 'Amit Kumar', 'Neha Sharma', 'Rizwan Khan', 'Priya Singh', 'Vikram Joshi'];

const SERVICE_CATEGORIES = [
  'AI & Enterprise Automation',
  'Cloud Infrastructure & Migration',
  'Mobile & Web Application',
  'ERP Integration & Workflow',
  'Cybersecurity & Audit',
  'Custom SaaS Architecture',
];

export const DealModal: React.FC<DealModalProps> = ({
  isOpen,
  onClose,
  onSave,
  dealToEdit,
  defaultStage = 'Discovery',
}) => {
  const { theme } = useTheme();
  const { config } = useCrmConfig();
  const currency = useSystemCurrency();
  const isLight = theme === 'white-sky';
  const activeStages = React.useMemo(() => {
    const names = config.pipelineStages.length > 0 ? config.pipelineStages.map((s) => s.name as DealStage) : STAGES;
    return names.includes('Lost') ? names : [...names, 'Lost' as DealStage];
  }, [config.pipelineStages]);
  const dealCustomFields = React.useMemo(
    () => config.customFields.filter((f) => f.entity === 'Deal' || f.entity === 'Both'),
    [config.customFields]
  );

  const [client, setClient] = useState('');
  const [project, setProject] = useState('');
  const [value, setValue] = useState<number | string>(50000);
  const [stage, setStage] = useState<DealStage>(defaultStage);
  const [probability, setProbability] = useState<number>(60);
  const [owner, setOwner] = useState(OWNERS[0]);
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('High');
  const [serviceCategory, setServiceCategory] = useState(SERVICE_CATEGORIES[0]);
  const [closeDate, setCloseDate] = useState('2025-06-30');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [customFields, setCustomFields] = useState<Record<string, string | number>>({});

  useEffect(() => {
    if (dealToEdit) {
      setClient(dealToEdit.company || dealToEdit.client || '');
      setProject(dealToEdit.dealName || dealToEdit.project || '');
      setValue(dealToEdit.value);
      setStage(dealToEdit.stage);
      setProbability(dealToEdit.probability ?? 50);
      setOwner(dealToEdit.owner);
      setPriority(dealToEdit.priority ?? 'High');
      setServiceCategory(dealToEdit.serviceCategory ?? SERVICE_CATEGORIES[0]);
      setCloseDate(dealToEdit.closeDate ?? '2025-06-30');
      setContactName(dealToEdit.contactName ?? '');
      setContactEmail(dealToEdit.contactEmail ?? '');
      setContactPhone(dealToEdit.contactPhone ?? '');
      setNotes(dealToEdit.notes ?? '');
      setCustomFields(dealToEdit.customFields ?? {});
    } else {
      setClient('');
      setProject('');
      setValue(65000);
      setStage(defaultStage);
      setProbability(50);
      setOwner(OWNERS[0]);
      setPriority('High');
      setServiceCategory(SERVICE_CATEGORIES[0]);
      setCloseDate('2025-06-30');
      setContactName('');
      setContactEmail('');
      setContactPhone('');
      setNotes('');
      setCustomFields({});
    }
  }, [dealToEdit, isOpen, defaultStage]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!client.trim() || !project.trim()) return;

    const numValue = Number(value) || 0;
    const dealStatus = stage === 'Won' ? 'Completed' : stage === 'Lost' ? 'Stalled' : 'Active';

    const newDeal: Deal = {
      id: dealToEdit ? dealToEdit.id : `deal-${Date.now()}`,
      dealName: project.trim(),
      company: client.trim(),
      client: client.trim(),
      project: project.trim(),
      value: numValue,
      valueFormatted: `$${numValue.toLocaleString()}`,
      formattedValue: `$${numValue.toLocaleString()}`,
      stage,
      status: dealStatus,
      closeDate,
      date: closeDate,
      owner,
      probability,
      priority,
      serviceCategory,
      contactName: contactName.trim() || undefined,
      contactEmail: contactEmail.trim() || undefined,
      contactPhone: contactPhone.trim() || undefined,
      contactWhatsApp: contactPhone.trim() || undefined,
      notes: notes.trim() || undefined,
      customFields,
    };

    onSave(newDeal);
    onClose();
  };

  const weightedVal = Math.round(((Number(value) || 0) * probability) / 100);

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
        <div className="flex items-center justify-between px-6 py-4 border-b border-sky-100/30">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-sky-400 to-indigo-600 text-white shadow-xs">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {dealToEdit ? 'Edit Deal Opportunity' : 'Create New Deal'}
              </h2>
              <p className="text-xs text-slate-400">
                {dealToEdit ? `Updating opportunity for ${dealToEdit.client}` : 'Add a new revenue opportunity into the CEO pipeline'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {/* Client & Project Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-300">
                Client / Company Name *
              </label>
              <input
                type="text"
                required
                value={client}
                onChange={(e) => setClient(e.target.value)}
                placeholder="e.g. Apex Global Logistics"
                className={`w-full px-3 py-2 rounded-lg border outline-none font-medium ${
                  isLight
                    ? 'bg-slate-50 border-sky-200 text-slate-900 focus:border-sky-500'
                    : 'bg-slate-800 border-slate-700 text-white focus:border-sky-400'
                }`}
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-300">
                Deal / Project Title *
              </label>
              <input
                type="text"
                required
                value={project}
                onChange={(e) => setProject(e.target.value)}
                placeholder="e.g. AI Workflow & Fleet ERP"
                className={`w-full px-3 py-2 rounded-lg border outline-none font-medium ${
                  isLight
                    ? 'bg-slate-50 border-sky-200 text-slate-900 focus:border-sky-500'
                    : 'bg-slate-800 border-slate-700 text-white focus:border-sky-400'
                }`}
              />
            </div>
          </div>

          {/* Deal Value & Probability Calculation */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-300">
                Deal Value ({currency.symbol}) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{currency.symbol}</span>
                <input
                  type="number"
                  required
                  min="0"
                  step="1000"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className={`w-full pl-7 pr-3 py-2 rounded-lg border outline-none font-bold text-emerald-500 ${
                    isLight
                      ? 'bg-slate-50 border-sky-200 focus:border-sky-500'
                      : 'bg-slate-800 border-slate-700 focus:border-sky-400'
                  }`}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-semibold text-slate-600 dark:text-slate-300">
                  Win Probability (%)
                </label>
                <span className="font-extrabold text-sky-500">{probability}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={probability}
                onChange={(e) => setProbability(Number(e.target.value))}
                className="w-full accent-sky-500 cursor-pointer mt-2"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-400 uppercase text-[10px]">
                Weighted Pipeline Value
              </label>
              <div
                className={`px-3 py-2 rounded-lg border font-extrabold text-sm tabular-nums ${
                  isLight ? 'bg-sky-50/70 border-sky-200 text-sky-700' : 'bg-slate-800 border-slate-700 text-sky-300'
                }`}
              >
                {currency.symbol}{weightedVal.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Stage, Owner, and Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-300">
                Pipeline Stage *
              </label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as DealStage)}
                className={`w-full px-3 py-2 rounded-lg border outline-none font-semibold ${
                  isLight
                    ? 'bg-slate-50 border-sky-200 text-slate-900 focus:border-sky-500'
                    : 'bg-slate-800 border-slate-700 text-white focus:border-sky-400'
                }`}
              >
                {activeStages.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-300">
                Deal Owner
              </label>
              <select
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border outline-none font-medium ${
                  isLight
                    ? 'bg-slate-50 border-sky-200 text-slate-900 focus:border-sky-500'
                    : 'bg-slate-800 border-slate-700 text-white focus:border-sky-400'
                }`}
              >
                {OWNERS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-300">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className={`w-full px-3 py-2 rounded-lg border outline-none font-medium ${
                  isLight
                    ? 'bg-slate-50 border-sky-200 text-slate-900 focus:border-sky-500'
                    : 'bg-slate-800 border-slate-700 text-white focus:border-sky-400'
                }`}
              >
                <option value="High">🔥 High Priority</option>
                <option value="Medium">⚡ Medium Priority</option>
                <option value="Low">❄️ Low Priority</option>
              </select>
            </div>
          </div>

          {/* Service Category & Target Close Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-300">
                Service Category
              </label>
              <select
                value={serviceCategory}
                onChange={(e) => setServiceCategory(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border outline-none font-medium ${
                  isLight
                    ? 'bg-slate-50 border-sky-200 text-slate-900 focus:border-sky-500'
                    : 'bg-slate-800 border-slate-700 text-white focus:border-sky-400'
                }`}
              >
                {SERVICE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-300">
                Target Close Date
              </label>
              <input
                type="date"
                value={closeDate}
                onChange={(e) => setCloseDate(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border outline-none font-medium ${
                  isLight
                    ? 'bg-slate-50 border-sky-200 text-slate-900 focus:border-sky-500'
                    : 'bg-slate-800 border-slate-700 text-white focus:border-sky-400'
                }`}
              />
            </div>
          </div>

          {/* Primary Contact Details */}
          <div className="pt-2 border-t border-sky-100/20">
            <span className="font-bold text-[11px] text-slate-400 uppercase tracking-wider block mb-2">
              Primary Stakeholder / Contact
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Decision Maker Name"
                  className={`w-full px-3 py-2 rounded-lg border outline-none ${
                    isLight
                      ? 'bg-slate-50 border-sky-200 text-slate-900 focus:border-sky-500'
                      : 'bg-slate-800 border-slate-700 text-white focus:border-sky-400'
                  }`}
                />
              </div>
              <div>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="stakeholder@company.com"
                  className={`w-full px-3 py-2 rounded-lg border outline-none ${
                    isLight
                      ? 'bg-slate-50 border-sky-200 text-slate-900 focus:border-sky-500'
                      : 'bg-slate-800 border-slate-700 text-white focus:border-sky-400'
                  }`}
                />
              </div>
              <div>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className={`w-full px-3 py-2 rounded-lg border outline-none ${
                    isLight
                      ? 'bg-slate-50 border-sky-200 text-slate-900 focus:border-sky-500'
                      : 'bg-slate-800 border-slate-700 text-white focus:border-sky-400'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Custom Fields (Configured in System Settings) */}
          {dealCustomFields.length > 0 && (
            <div className="pt-2 border-t border-sky-100/20">
              <span className="font-bold text-[11px] text-sky-500 uppercase tracking-wider block mb-2">
                Custom Fields
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {dealCustomFields.map((field) => {
                  const val = customFields[field.key] ?? '';
                  const setVal = (newVal: string | number) =>
                    setCustomFields((prev) => ({ ...prev, [field.key]: newVal }));
                  return (
                    <div key={field.id}>
                      <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-300">
                        {field.label} {field.required ? '*' : ''}
                      </label>
                      {field.type === 'select' ? (
                        <select
                          required={field.required}
                          value={String(val)}
                          onChange={(e) => setVal(e.target.value)}
                          className={`w-full px-3 py-2 rounded-lg border outline-none font-medium ${
                            isLight
                              ? 'bg-slate-50 border-sky-200 text-slate-900 focus:border-sky-500'
                              : 'bg-slate-800 border-slate-700 text-white focus:border-sky-400'
                          }`}
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
                          className={`w-full px-3 py-2 rounded-lg border outline-none ${
                            isLight
                              ? 'bg-slate-50 border-sky-200 text-slate-900 focus:border-sky-500'
                              : 'bg-slate-800 border-slate-700 text-white focus:border-sky-400'
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Strategic Scope & Notes */}
          <div>
            <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-300">
              Strategic Notes & Deal Scope
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Key deliverables, client pain points, negotiation milestones, and budget authority..."
              className={`w-full px-3 py-2 rounded-lg border outline-none resize-none ${
                isLight
                  ? 'bg-slate-50 border-sky-200 text-slate-900 focus:border-sky-500'
                  : 'bg-slate-800 border-slate-700 text-white focus:border-sky-400'
              }`}
            />
          </div>

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-sky-100/20">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                isLight
                  ? 'border-sky-200 text-slate-600 hover:bg-sky-50'
                  : 'border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg text-xs font-semibold text-white bg-sky-500 hover:bg-sky-600 shadow-sm shadow-sky-500/25 active:scale-95 transition-all"
            >
              {dealToEdit ? 'Save Changes' : 'Create Deal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
