import React, { useState, useEffect } from 'react';
import { X, Sparkles, DollarSign, Building, Mail, Phone, MessageSquare, User, Tag } from 'lucide-react';
import { Lead, LeadStatus, LeadPriority, LeadSource } from '../../types/crm';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useCrmConfig } from '../../data/crmConfig';
import { useSystemCurrency } from '../../data/currencyService';

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (lead: Lead) => void;
  leadToEdit?: Lead | null;
  defaultStage?: LeadStatus;
}

const OWNERS = ['Amit Kumar', 'Neha Sharma', 'Rizwan Khan', 'Priya Singh', 'Vikram Joshi', 'Sayed'];
const STATUSES: LeadStatus[] = [
  'New Lead',
  'Contacted',
  'Follow-up',
  'Qualified',
  'Proposal Sent',
  'Negotiation',
  'Won',
  'Lost',
];
const PRIORITIES: LeadPriority[] = ['Hot', 'Warm', 'Cold'];
const SOURCES: LeadSource[] = ['LinkedIn', 'Website', 'Cold Email', 'Referrals', 'Upwork', 'Events', 'Others'];

export const LeadModal: React.FC<LeadModalProps> = ({
  isOpen,
  onClose,
  onSave,
  leadToEdit,
  defaultStage = 'New Lead',
}) => {
  const { theme } = useTheme();
  const { users, currentUser } = useAuth();
  const { config } = useCrmConfig();
  const currency = useSystemCurrency();
  const isLight = theme === 'white-sky';
  const ownersList = React.useMemo(
    () => Array.from(new Set([...users.map((u) => u.name), ...OWNERS])),
    [users]
  );
  const dynamicStatuses = React.useMemo(
    () => (config.leadStages.length > 0 ? config.leadStages.map((s) => s.name) : STATUSES),
    [config.leadStages]
  );
  const dynamicSources = React.useMemo(
    () => (config.leadSources.length > 0 ? config.leadSources.map((s) => s.name) : SOURCES),
    [config.leadSources]
  );
  const leadCustomFields = React.useMemo(
    () => config.customFields.filter((f) => f.entity === 'Lead' || f.entity === 'Both'),
    [config.customFields]
  );

  const [formData, setFormData] = useState<Partial<Lead>>({
    name: '',
    email: '',
    phone: '',
    whatsapp: '',
    company: '',
    title: '',
    status: defaultStage,
    priority: 'Warm',
    value: 10000,
    source: 'LinkedIn',
    owner: 'Sayed',
    score: 80,
    notes: '',
  });

  useEffect(() => {
    if (leadToEdit) {
      setFormData(leadToEdit);
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        whatsapp: '',
        company: '',
        title: '',
        status: defaultStage,
        priority: 'Warm',
        value: 15000,
        source: 'LinkedIn',
        owner: 'Sayed',
        score: 75,
        notes: '',
      });
    }
  }, [leadToEdit, isOpen, defaultStage]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim() || !formData.company?.trim()) {
      alert('Please provide at least a Lead Name and Company.');
      return;
    }

    const cleanWhatsapp = formData.whatsapp?.trim() || formData.phone?.replace(/[^0-9+]/g, '') || '';

    const newLead: Lead = {
      id: leadToEdit ? leadToEdit.id : `lead-${Date.now()}`,
      name: formData.name.trim(),
      email: formData.email?.trim() || 'contact@company.com',
      phone: formData.phone?.trim() || '+1 (555) 000-0000',
      whatsapp: cleanWhatsapp,
      company: formData.company.trim(),
      title: formData.title?.trim() || 'Decision Maker',
      status: formData.status as LeadStatus,
      priority: formData.priority as LeadPriority,
      value: Number(formData.value) || 0,
      source: formData.source as LeadSource,
      owner: formData.owner || 'Sayed',
      score: Number(formData.score) || 70,
      createdAt: leadToEdit?.createdAt || new Date().toISOString().split('T')[0],
      lastContacted: leadToEdit?.lastContacted || new Date().toISOString().split('T')[0],
      notes: formData.notes?.trim() || '',
      tags: leadToEdit?.tags || ['Active'],
      customFields: formData.customFields || {},
    };

    onSave(newLead);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div
        className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden transition-all max-h-[92vh] flex flex-col ${
          isLight
            ? 'bg-white border-sky-100 text-slate-800'
            : 'bg-slate-900 border-slate-700 text-white'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-sky-100/30">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">
                {leadToEdit ? 'Edit Lead Details' : 'Create New Lead'}
              </h2>
              <p className="text-xs text-slate-400">
                {leadToEdit ? `Updating record for ${leadToEdit.name}` : 'Add a new prospect to your sales pipeline'}
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

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Lead Name */}
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                Lead Name *
              </label>
              <input
                type="text"
                required
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Alex Morgan"
                className={`w-full text-xs px-3 py-2 rounded-lg border outline-none ${
                  isLight
                    ? 'bg-slate-50 border-sky-200 text-slate-800 focus:border-sky-500'
                    : 'bg-slate-800 border-slate-700 text-white focus:border-sky-400'
                }`}
              />
            </div>

            {/* Company */}
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                Company Name *
              </label>
              <input
                type="text"
                required
                value={formData.company || ''}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="e.g. Nexus Innovations"
                className={`w-full text-xs px-3 py-2 rounded-lg border outline-none ${
                  isLight
                    ? 'bg-slate-50 border-sky-200 text-slate-800 focus:border-sky-500'
                    : 'bg-slate-800 border-slate-700 text-white focus:border-sky-400'
                }`}
              />
            </div>

            {/* Job Title */}
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                Job Title
              </label>
              <input
                type="text"
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. VP of Operations"
                className={`w-full text-xs px-3 py-2 rounded-lg border outline-none ${
                  isLight
                    ? 'bg-slate-50 border-sky-200 text-slate-800 focus:border-sky-500'
                    : 'bg-slate-800 border-slate-700 text-white focus:border-sky-400'
                }`}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="alex@nexusinnovations.com"
                className={`w-full text-xs px-3 py-2 rounded-lg border outline-none ${
                  isLight
                    ? 'bg-slate-50 border-sky-200 text-slate-800 focus:border-sky-500'
                    : 'bg-slate-800 border-slate-700 text-white focus:border-sky-400'
                }`}
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                Phone Number (for Direct Call)
              </label>
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 234-5678"
                className={`w-full text-xs px-3 py-2 rounded-lg border outline-none ${
                  isLight
                    ? 'bg-slate-50 border-sky-200 text-slate-800 focus:border-sky-500'
                    : 'bg-slate-800 border-slate-700 text-white focus:border-sky-400'
                }`}
              />
            </div>

            {/* WhatsApp Number */}
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                WhatsApp Number (with country code)
              </label>
              <input
                type="text"
                value={formData.whatsapp || ''}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                placeholder="+15552345678"
                className={`w-full text-xs px-3 py-2 rounded-lg border outline-none ${
                  isLight
                    ? 'bg-slate-50 border-sky-200 text-slate-800 focus:border-sky-500'
                    : 'bg-slate-800 border-slate-700 text-white focus:border-sky-400'
                }`}
              />
            </div>

            {/* Deal Value */}
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                Estimated Deal Value ({currency.symbol} {currency.code})
              </label>
              <input
                type="number"
                min="0"
                step="500"
                value={formData.value || 0}
                onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                className={`w-full text-xs px-3 py-2 rounded-lg border outline-none font-bold tabular-nums ${
                  isLight
                    ? 'bg-slate-50 border-sky-200 text-slate-800 focus:border-sky-500'
                    : 'bg-slate-800 border-slate-700 text-white focus:border-sky-400'
                }`}
              />
            </div>

            {/* Lead Status / Stage */}
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                Pipeline Stage / Status
              </label>
              <select
                value={formData.status || 'New Lead'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as LeadStatus })}
                className={`w-full text-xs px-3 py-2 rounded-lg border outline-none font-medium ${
                  isLight
                    ? 'bg-slate-50 border-sky-200 text-slate-800 focus:border-sky-500'
                    : 'bg-slate-800 border-slate-700 text-white focus:border-sky-400'
                }`}
              >
                {dynamicStatuses.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                Lead Priority
              </label>
              <select
                value={formData.priority || 'Warm'}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as LeadPriority })}
                className={`w-full text-xs px-3 py-2 rounded-lg border outline-none font-medium ${
                  isLight
                    ? 'bg-slate-50 border-sky-200 text-slate-800 focus:border-sky-500'
                    : 'bg-slate-800 border-slate-700 text-white focus:border-sky-400'
                }`}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p === 'Hot' ? '🔥 Hot Lead' : p === 'Warm' ? '⚡ Warm Lead' : '❄️ Cold Lead'}
                  </option>
                ))}
              </select>
            </div>

            {/* Source */}
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                Lead Source
              </label>
              <select
                value={formData.source || 'LinkedIn'}
                onChange={(e) => setFormData({ ...formData, source: e.target.value as LeadSource })}
                className={`w-full text-xs px-3 py-2 rounded-lg border outline-none font-medium ${
                  isLight
                    ? 'bg-slate-50 border-sky-200 text-slate-800 focus:border-sky-500'
                    : 'bg-slate-800 border-slate-700 text-white focus:border-sky-400'
                }`}
              >
                {dynamicSources.map((src) => (
                  <option key={src} value={src}>
                    {src}
                  </option>
                ))}
              </select>
            </div>

            {/* Owner */}
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                Assigned Lead Owner
              </label>
              <select
                value={formData.owner || currentUser?.name || 'Sayed'}
                onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                className={`w-full text-xs px-3 py-2 rounded-lg border outline-none font-medium ${
                  isLight
                    ? 'bg-slate-50 border-sky-200 text-slate-800 focus:border-sky-500'
                    : 'bg-slate-800 border-slate-700 text-white focus:border-sky-400'
                }`}
              >
                {ownersList.map((own) => (
                  <option key={own} value={own}>
                    {own}
                  </option>
                ))}
              </select>
            </div>

            {/* Score */}
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                Lead Score (0-100)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.score || 75}
                onChange={(e) => setFormData({ ...formData, score: Number(e.target.value) })}
                className={`w-full text-xs px-3 py-2 rounded-lg border outline-none tabular-nums ${
                  isLight
                    ? 'bg-slate-50 border-sky-200 text-slate-800 focus:border-sky-500'
                    : 'bg-slate-800 border-slate-700 text-white focus:border-sky-400'
                }`}
              />
            </div>
          </div>

          {/* Custom Fields (Configured in System Settings) */}
          {leadCustomFields.length > 0 && (
            <div className="pt-2 border-t border-sky-100/30">
              <div className="text-[11px] font-bold uppercase tracking-wider text-sky-500 mb-2.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" />
                <span>Custom Fields</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {leadCustomFields.map((field) => {
                  const val = formData.customFields?.[field.key] ?? '';
                  const setVal = (newVal: string | number) =>
                    setFormData({
                      ...formData,
                      customFields: { ...(formData.customFields || {}), [field.key]: newVal },
                    });
                  return (
                    <div key={field.id}>
                      <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                        {field.label} {field.required ? '*' : ''}
                      </label>
                      {field.type === 'select' ? (
                        <select
                          required={field.required}
                          value={String(val)}
                          onChange={(e) => setVal(e.target.value)}
                          className={`w-full text-xs px-3 py-2 rounded-lg border outline-none font-medium ${
                            isLight
                              ? 'bg-slate-50 border-sky-200 text-slate-800 focus:border-sky-500'
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
                          className={`w-full text-xs px-3 py-2 rounded-lg border outline-none ${
                            isLight
                              ? 'bg-slate-50 border-sky-200 text-slate-800 focus:border-sky-500'
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

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
              Requirements, Project Scope & Next Action
            </label>
            <textarea
              rows={3}
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add key notes on client requirements, timeline, budget, or key pain points..."
              className={`w-full text-xs p-3 rounded-lg border outline-none ${
                isLight
                  ? 'bg-slate-50 border-sky-200 text-slate-800 focus:border-sky-500'
                  : 'bg-slate-800 border-slate-700 text-white focus:border-sky-400'
              }`}
            />
          </div>

          {/* Modal Footer Actions */}
          <div className="flex justify-end gap-2.5 pt-4 border-t border-sky-100/30">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors ${
                isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-sky-500 hover:bg-sky-600 rounded-lg shadow-sm shadow-sky-500/25 active:scale-95 transition-all"
            >
              {leadToEdit ? 'Save Changes' : 'Create Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
