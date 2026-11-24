import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  CalendarCheck2,
  Phone,
  MessageSquare,
  Mail,
  Video,
  User,
  Building2,
  Calendar,
  Clock,
  Briefcase,
  FileText,
  CheckCircle2,
  Users,
} from 'lucide-react';
import {
  FollowUp,
  FollowUpType,
  FollowUpPriority,
  FollowUpStatus,
  Lead,
  Deal,
} from '../../types/crm';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

interface FollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (followUp: FollowUp) => void;
  followUpToEdit: FollowUp | null;
  prefillLead?: Lead | null;
}

const TYPE_OPTIONS: FollowUpType[] = ['Call', 'WhatsApp', 'Email', 'Meeting'];
const PRIORITY_OPTIONS: FollowUpPriority[] = ['High', 'Medium', 'Low'];
const STATUS_OPTIONS: FollowUpStatus[] = ['Scheduled', 'Overdue', 'Completed', 'Cancelled'];

const QUICK_TIMES = [
  { label: '10:00 AM', value24: '10:00' },
  { label: '11:30 AM', value24: '11:30' },
  { label: '02:00 PM', value24: '14:00' },
  { label: '04:00 PM', value24: '16:00' },
  { label: '06:00 PM', value24: '18:00' },
];

function getLocalTodayIso(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function to12HourDisplay(time24: string): string {
  const clean = String(time24 || '').trim();
  if (!clean) return '11:00 AM';
  if (/am|pm/i.test(clean)) return clean;
  const [hStr, mStr] = clean.split(':');
  let h = Number(hStr);
  const m = String(mStr || '00').padStart(2, '0');
  if (Number.isNaN(h)) return '11:00 AM';
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
}

function to24HourInput(time12Or24: string): string {
  const clean = String(time12Or24 || '').trim();
  if (!clean) return '11:00';
  if (/^\d{2}:\d{2}$/.test(clean)) return clean;
  const match = clean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return '11:00';
  let h = Number(match[1]);
  const m = match[2];
  const mer = match[3].toUpperCase();
  if (mer === 'PM' && h < 12) h += 12;
  if (mer === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${m}`;
}

function loadActualLeads(): Lead[] {
  try {
    const raw = localStorage.getItem('ozostack_leads_v2');
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadActualDeals(): Deal[] {
  try {
    const raw = localStorage.getItem('ozostack_deals_v2');
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export const FollowUpModal: React.FC<FollowUpModalProps> = ({
  isOpen,
  onClose,
  onSave,
  followUpToEdit,
  prefillLead,
}) => {
  const { theme } = useTheme();
  const { currentUser, users, scopeFilter } = useAuth();
  const isLight = theme === 'white-sky';

  const actualLeads = useMemo(() => {
    if (!isOpen) return [];
    const all = loadActualLeads();
    return scopeFilter(all, (l) => ({ owner: l.owner }));
  }, [isOpen, scopeFilter]);

  const actualDeals = useMemo(() => {
    if (!isOpen) return [];
    const all = loadActualDeals();
    return scopeFilter(all, (d) => ({ owner: d.owner }));
  }, [isOpen, scopeFilter]);

  const ownerOptions = useMemo(() => {
    const names = new Set<string>();
    if (currentUser?.name) names.add(currentUser.name);
    users.forEach((u) => {
      if (u.name && u.status === 'Active') names.add(u.name);
    });
    if (followUpToEdit?.owner) names.add(followUpToEdit.owner);
    if (prefillLead?.owner) names.add(prefillLead.owner);
    return Array.from(names);
  }, [currentUser, users, followUpToEdit, prefillLead]);

  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [contact, setContact] = useState('');
  const [company, setCompany] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [dealName, setDealName] = useState('');
  const [type, setType] = useState<FollowUpType>('Call');
  const [scheduledDate, setScheduledDate] = useState(getLocalTodayIso(0));
  const [scheduledTime24, setScheduledTime24] = useState('11:00');
  const [priority, setPriority] = useState<FollowUpPriority>('High');
  const [status, setStatus] = useState<FollowUpStatus>('Scheduled');
  const [owner, setOwner] = useState(currentUser?.name || ownerOptions[0] || 'Sayed');
  const [notes, setNotes] = useState('');
  const [outcome, setOutcome] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) return;
    if (followUpToEdit) {
      setSelectedLeadId('');
      setContact(followUpToEdit.contact);
      setCompany(followUpToEdit.company);
      setContactEmail(followUpToEdit.contactEmail || '');
      setContactPhone(followUpToEdit.contactPhone || '');
      setDealName(followUpToEdit.dealName || '');
      setType(followUpToEdit.type);
      setScheduledDate(followUpToEdit.scheduledDate || getLocalTodayIso(0));
      setScheduledTime24(to24HourInput(followUpToEdit.scheduledTime || '11:00 AM'));
      setPriority(followUpToEdit.priority || 'High');
      setStatus(followUpToEdit.status || 'Scheduled');
      setOwner(followUpToEdit.owner || currentUser?.name || ownerOptions[0] || 'Sayed');
      setNotes(followUpToEdit.notes || '');
      setOutcome(followUpToEdit.outcome || '');
    } else if (prefillLead) {
      setSelectedLeadId(prefillLead.id);
      setContact(prefillLead.name || '');
      setCompany(prefillLead.company || prefillLead.name || '');
      setContactEmail(
        prefillLead.email && !prefillLead.email.endsWith('.local') ? prefillLead.email : ''
      );
      setContactPhone(prefillLead.phone || prefillLead.whatsapp || '');
      setDealName(prefillLead.title || '');
      setType('Call');
      setScheduledDate(getLocalTodayIso(0));
      setScheduledTime24('11:00');
      setPriority(prefillLead.priority === 'Hot' ? 'High' : prefillLead.priority === 'Cold' ? 'Low' : 'Medium');
      setStatus('Scheduled');
      setOwner(prefillLead.owner || currentUser?.name || ownerOptions[0] || 'Sayed');
      setNotes(`Follow-up with ${prefillLead.name} (${prefillLead.company || prefillLead.title || 'Lead'})`);
      setOutcome('');
    } else {
      setSelectedLeadId('');
      setContact('');
      setCompany('');
      setContactEmail('');
      setContactPhone('');
      setDealName('');
      setType('Call');
      setScheduledDate(getLocalTodayIso(0));
      setScheduledTime24('11:00');
      setPriority('High');
      setStatus('Scheduled');
      setOwner(currentUser?.name || ownerOptions[0] || 'Sayed');
      setNotes('');
      setOutcome('');
    }
    setErrors({});
  }, [followUpToEdit, prefillLead, isOpen, currentUser?.name]);

  if (!isOpen) return null;

  const handlePickLead = (leadId: string) => {
    setSelectedLeadId(leadId);
    const chosen = actualLeads.find((l) => l.id === leadId);
    if (!chosen) return;
    setContact(chosen.name || '');
    setCompany(chosen.company || chosen.name || '');
    setContactEmail(chosen.email && !chosen.email.endsWith('.local') ? chosen.email : '');
    setContactPhone(chosen.phone || chosen.whatsapp || '');
    setDealName(chosen.title || '');
    if (chosen.owner) setOwner(chosen.owner);
    setPriority(chosen.priority === 'Hot' ? 'High' : chosen.priority === 'Cold' ? 'Low' : 'Medium');
    setNotes((prev) =>
      prev.trim() ? prev : `Follow-up with ${chosen.name} (${chosen.company || 'CRM Lead'})`
    );
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!contact.trim()) errs.contact = 'Contact / Lead name is required';
    if (!company.trim()) errs.company = 'Company is required';
    if (!scheduledDate) errs.scheduledDate = 'Date is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const scheduledTime = to12HourDisplay(scheduledTime24);
    const parsedDate = new Date(`${scheduledDate}T00:00:00`);
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    const month = monthNames[parsedDate.getMonth()] || 'Jan';
    const day = parsedDate.getDate();
    const year = parsedDate.getFullYear();
    const formattedNextFollowUp = `${month} ${day}, ${year} ${scheduledTime}`;

    const saved: FollowUp = {
      id: followUpToEdit ? followUpToEdit.id : `fu-${Date.now()}`,
      contact: contact.trim(),
      company: company.trim(),
      nextFollowUp: formattedNextFollowUp,
      type,
      owner,
      contactEmail: contactEmail.trim() || undefined,
      contactPhone: contactPhone.trim() || undefined,
      dealName: dealName.trim() || undefined,
      scheduledDate,
      scheduledTime,
      priority,
      status,
      notes: notes.trim() || undefined,
      outcome: outcome.trim() || undefined,
      completedAt:
        status === 'Completed'
          ? followUpToEdit?.completedAt || `${month} ${day}, ${year} ${scheduledTime}`
          : undefined,
      createdAt: followUpToEdit?.createdAt || getLocalTodayIso(0),
    };

    onSave(saved);
    onClose();
  };

  const inputClass = `w-full text-xs px-3 py-2 rounded-lg border outline-none font-medium transition-colors ${
    isLight
      ? 'bg-sky-50/30 border-sky-200 text-slate-800 focus:border-sky-500 focus:bg-white'
      : 'bg-slate-800/80 border-slate-700 text-slate-100 focus:border-sky-400 focus:bg-slate-800'
  }`;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div
        className={`relative w-full max-w-xl rounded-2xl shadow-2xl border overflow-hidden z-10 max-h-[90vh] flex flex-col ${
          isLight ? 'bg-white border-sky-100 text-slate-800' : 'bg-slate-900 border-slate-700 text-white'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-sky-100/30">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500 text-white shadow-xs">
              <CalendarCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {followUpToEdit
                  ? 'Edit Scheduled Follow-Up'
                  : prefillLead
                  ? `Schedule Follow-Up — ${prefillLead.name}`
                  : 'Schedule New Follow-Up'}
              </h2>
              <p className="text-xs text-slate-400">
                {followUpToEdit
                  ? `Update touchpoint for ${followUpToEdit.contact}`
                  : 'Pick a CRM Lead, choose date & exact time, and schedule in one click'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {/* Quick Pick from Actual CRM Leads */}
          {!followUpToEdit && actualLeads.length > 0 && (
            <div className="p-3 rounded-xl bg-sky-500/5 border border-sky-500/20 space-y-1.5">
              <label className="font-bold text-sky-700 dark:text-sky-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                <span>Quick Pick from Your CRM Leads ({actualLeads.length} live leads)</span>
              </label>
              <select
                value={selectedLeadId}
                onChange={(e) => handlePickLead(e.target.value)}
                className={inputClass}
              >
                <option value="">-- Select a Lead to auto-fill Name, Phone &amp; Email --</option>
                {actualLeads.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.name}
                    {lead.company && lead.company !== lead.name ? ` (${lead.company})` : ''}
                    {lead.phone ? ` · ${lead.phone}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Channel / Type Selector */}
          <div>
            <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-300">
              Interaction Channel *
            </label>
            <div className="grid grid-cols-4 gap-2">
              {TYPE_OPTIONS.map((t) => {
                const isSelected = type === t;
                const Icon =
                  t === 'Call'
                    ? Phone
                    : t === 'WhatsApp'
                    ? MessageSquare
                    : t === 'Email'
                    ? Mail
                    : Video;

                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl font-bold border transition-all text-xs ${
                      isSelected
                        ? t === 'Call'
                          ? 'bg-sky-500 text-white border-sky-500 shadow-xs'
                          : t === 'WhatsApp'
                          ? 'bg-emerald-500 text-white border-emerald-500 shadow-xs'
                          : t === 'Email'
                          ? 'bg-indigo-500 text-white border-indigo-500 shadow-xs'
                          : 'bg-purple-500 text-white border-purple-500 shadow-xs'
                        : isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{t}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date & Exact Time with Quick Presets */}
          <div className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-600 dark:text-slate-300">
                    Scheduled Date *
                  </label>
                  <div className="flex items-center gap-1">
                    {[
                      { label: 'Today', offset: 0 },
                      { label: 'Tomorrow', offset: 1 },
                      { label: '+3d', offset: 3 },
                      { label: '+7d', offset: 7 },
                    ].map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => setScheduledDate(getLocalTodayIso(p.offset))}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors ${
                          scheduledDate === getLocalTodayIso(p.offset)
                            ? 'bg-sky-500 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-sky-500'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    required
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className={`${inputClass} pl-9`}
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-300">
                  Exact Time * ({to12HourDisplay(scheduledTime24)})
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="time"
                    required
                    value={scheduledTime24}
                    onChange={(e) => setScheduledTime24(e.target.value)}
                    className={`${inputClass} pl-9`}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400">Quick Time:</span>
              {QUICK_TIMES.map((qt) => (
                <button
                  key={qt.value24}
                  type="button"
                  onClick={() => setScheduledTime24(qt.value24)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-colors ${
                    scheduledTime24 === qt.value24
                      ? 'bg-sky-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-sky-500/15'
                  }`}
                >
                  {qt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Contact & Company */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-300">
                Contact / Lead Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="Enter lead or contact name"
                  className={`${inputClass} pl-9`}
                />
              </div>
              {errors.contact && <p className="text-[10px] text-rose-500 mt-1">{errors.contact}</p>}
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-300">
                Company / Business *
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Enter company or business name"
                  className={`${inputClass} pl-9`}
                />
              </div>
              {errors.company && <p className="text-[10px] text-rose-500 mt-1">{errors.company}</p>}
            </div>
          </div>

          {/* Contact Direct Info (Phone & Email) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-300">
                Phone / WhatsApp
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className={`${inputClass} pl-9`}
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-300">
                Email (Optional)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="contact@business.com"
                  className={`${inputClass} pl-9`}
                />
              </div>
            </div>
          </div>

          {/* Priority & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-300">
                Priority Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {PRIORITY_OPTIONS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`py-1.5 px-2 rounded-lg font-bold text-center border transition-all text-xs ${
                      priority === p
                        ? p === 'High'
                          ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                          : p === 'Medium'
                          ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                          : 'bg-slate-500 text-white border-slate-500 shadow-xs'
                        : isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-300">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as FollowUpStatus)}
                className={inputClass}
              >
                {STATUS_OPTIONS.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Assigned Owner & Related Deal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-300">
                Assigned Team Member
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  className={`${inputClass} pl-9`}
                >
                  {ownerOptions.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-300">
                Related Deal / Subject (Optional)
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  list="actual-deal-suggestions"
                  value={dealName}
                  onChange={(e) => setDealName(e.target.value)}
                  placeholder="e.g. Website Quote Follow-up"
                  className={`${inputClass} pl-9`}
                />
                {actualDeals.length > 0 && (
                  <datalist id="actual-deal-suggestions">
                    {actualDeals.map((d) => (
                      <option key={d.id} value={d.dealName || d.project || ''}>
                        {d.company}
                      </option>
                    ))}
                  </datalist>
                )}
              </div>
            </div>
          </div>

          {/* Agenda & Objective Notes */}
          <div>
            <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-300">
              Follow-Up Notes / Agenda
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What to discuss, pricing to share, or next step..."
                className={`${inputClass} pl-9 py-2`}
              />
            </div>
          </div>

          {/* Outcome Notes (if Completed) */}
          {status === 'Completed' && (
            <div className="p-3 rounded-xl border border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-800 animate-fade-in">
              <label className="block font-semibold mb-1 text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Outcome / Resolution Notes
              </label>
              <textarea
                rows={2}
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                placeholder="Summary of discussion and next action items..."
                className="w-full text-xs p-2 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-900 outline-none"
              />
            </div>
          )}

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-sky-100/30">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                isLight
                  ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg font-bold text-white bg-sky-500 hover:bg-sky-600 shadow-sm transition-all active:scale-95"
            >
              {followUpToEdit ? 'Save Changes' : 'Schedule Follow-Up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
