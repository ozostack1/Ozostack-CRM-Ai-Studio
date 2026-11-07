import React, { useState, useEffect } from 'react';
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
  AlertCircle,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { FollowUp, FollowUpType, FollowUpPriority, FollowUpStatus } from '../../types/crm';
import { INITIAL_CONTACTS, INITIAL_COMPANIES, INITIAL_DEALS } from '../../data/mockData';
import { useTheme } from '../../context/ThemeContext';

interface FollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (followUp: FollowUp) => void;
  followUpToEdit: FollowUp | null;
}

const TYPE_OPTIONS: FollowUpType[] = ['Call', 'WhatsApp', 'Email', 'Meeting'];
const PRIORITY_OPTIONS: FollowUpPriority[] = ['High', 'Medium', 'Low'];
const STATUS_OPTIONS: FollowUpStatus[] = ['Scheduled', 'Overdue', 'Completed', 'Cancelled'];
const OWNER_OPTIONS = [
  'Sayed (CEO)',
  'Amit Kumar',
  'Neha Sharma',
  'Rizwan Khan',
  'Priya Singh',
  'Vikram Joshi',
];
const TIME_SLOTS = [
  '09:00 AM',
  '09:30 AM',
  '10:00 AM',
  '10:30 AM',
  '11:00 AM',
  '11:30 AM',
  '12:00 PM',
  '01:00 PM',
  '02:00 PM',
  '02:30 PM',
  '03:00 PM',
  '03:30 PM',
  '04:00 PM',
  '04:30 PM',
  '05:00 PM',
];

export const FollowUpModal: React.FC<FollowUpModalProps> = ({
  isOpen,
  onClose,
  onSave,
  followUpToEdit,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'white-sky';

  const [contact, setContact] = useState('');
  const [company, setCompany] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [dealName, setDealName] = useState('');
  const [type, setType] = useState<FollowUpType>('Call');
  const [scheduledDate, setScheduledDate] = useState('2025-05-20');
  const [scheduledTime, setScheduledTime] = useState('10:00 AM');
  const [priority, setPriority] = useState<FollowUpPriority>('High');
  const [status, setStatus] = useState<FollowUpStatus>('Scheduled');
  const [owner, setOwner] = useState(OWNER_OPTIONS[0]);
  const [notes, setNotes] = useState('');
  const [outcome, setOutcome] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (followUpToEdit) {
      setContact(followUpToEdit.contact);
      setCompany(followUpToEdit.company);
      setContactEmail(followUpToEdit.contactEmail || '');
      setContactPhone(followUpToEdit.contactPhone || '');
      setDealName(followUpToEdit.dealName || '');
      setType(followUpToEdit.type);
      setScheduledDate(followUpToEdit.scheduledDate || '2025-05-20');
      setScheduledTime(followUpToEdit.scheduledTime || '10:00 AM');
      setPriority(followUpToEdit.priority || 'High');
      setStatus(followUpToEdit.status || 'Scheduled');
      setOwner(followUpToEdit.owner);
      setNotes(followUpToEdit.notes || '');
      setOutcome(followUpToEdit.outcome || '');
    } else {
      setContact('');
      setCompany('');
      setContactEmail('');
      setContactPhone('');
      setDealName('');
      setType('Call');
      setScheduledDate('2025-05-20');
      setScheduledTime('10:00 AM');
      setPriority('High');
      setStatus('Scheduled');
      setOwner(OWNER_OPTIONS[0]);
      setNotes('');
      setOutcome('');
    }
    setErrors({});
  }, [followUpToEdit, isOpen]);

  if (!isOpen) return null;

  // Auto-fill company, email, phone when selecting an existing contact
  const handleContactSelect = (name: string) => {
    setContact(name);
    const existing = INITIAL_CONTACTS.find((c) => c.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      setCompany(existing.company);
      setContactEmail(existing.email);
      setContactPhone(existing.phone);
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!contact.trim()) errs.contact = 'Contact name is required';
    if (!company.trim()) errs.company = 'Company is required';
    if (!scheduledDate) errs.scheduledDate = 'Date is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Format human-friendly nextFollowUp string e.g. "May 20, 2025 10:00 AM"
    const parsedDate = new Date(scheduledDate + 'T00:00:00');
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    const month = monthNames[parsedDate.getMonth()] || 'May';
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
      createdAt: followUpToEdit?.createdAt || new Date().toISOString().split('T')[0],
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
      {/* Backdrop */}
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
                {followUpToEdit ? 'Edit Scheduled Follow-Up' : 'Schedule New Follow-Up'}
              </h2>
              <p className="text-xs text-slate-400">
                {followUpToEdit
                  ? `Update touchpoint for ${followUpToEdit.contact} (${followUpToEdit.company})`
                  : 'Queue a high-priority customer interaction or pipeline checkpoint'}
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

          {/* Contact & Company */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-300">
                Contact Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  list="contact-suggestions"
                  value={contact}
                  onChange={(e) => handleContactSelect(e.target.value)}
                  placeholder="e.g. John Smith"
                  className={`${inputClass} pl-9`}
                />
                <datalist id="contact-suggestions">
                  {INITIAL_CONTACTS.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.company} · {c.title}
                    </option>
                  ))}
                </datalist>
              </div>
              {errors.contact && <p className="text-[10px] text-rose-500 mt-1">{errors.contact}</p>}
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-300">
                Company / Organization *
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  list="company-suggestions"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. TechVision Inc."
                  className={`${inputClass} pl-9`}
                />
                <datalist id="company-suggestions">
                  {INITIAL_COMPANIES.map((comp) => (
                    <option key={comp.id} value={comp.name}>
                      {comp.industry}
                    </option>
                  ))}
                </datalist>
              </div>
              {errors.company && <p className="text-[10px] text-rose-500 mt-1">{errors.company}</p>}
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-300">
                Scheduled Date *
              </label>
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
                Target Time Slot *
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className={`${inputClass} pl-9`}
                >
                  {TIME_SLOTS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
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
                Current Status
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

          {/* Assigned Owner & Deal Opportunity */}
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
                  {OWNER_OPTIONS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-300">
                Related Commercial Deal (Optional)
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  list="deal-suggestions"
                  value={dealName}
                  onChange={(e) => setDealName(e.target.value)}
                  placeholder="e.g. Cloud Migration & Microservices"
                  className={`${inputClass} pl-9`}
                />
                <datalist id="deal-suggestions">
                  {INITIAL_DEALS.map((d) => (
                    <option key={d.id} value={d.dealName || d.project}>
                      ${d.value.toLocaleString()} · {d.company}
                    </option>
                  ))}
                </datalist>
              </div>
            </div>
          </div>

          {/* Contact Direct Info (Email & Phone) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-300">
                Contact Email (Optional)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="contact@company.com"
                  className={`${inputClass} pl-9`}
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-300">
                Contact Phone / WhatsApp (Optional)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className={`${inputClass} pl-9`}
                />
              </div>
            </div>
          </div>

          {/* Agenda & Objective Notes */}
          <div>
            <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-300">
              Meeting Objective & Agenda Notes
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Key questions to ask, deliverables to present, pricing or contract points..."
                className={`${inputClass} pl-9 py-2`}
              />
            </div>
          </div>

          {/* Outcome Notes (if status is Completed) */}
          {status === 'Completed' && (
            <div className="p-3 rounded-xl border border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-800 animate-fade-in">
              <label className="block font-semibold mb-1 text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Touchpoint Outcome / Resolution Notes
              </label>
              <textarea
                rows={2}
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                placeholder="What was decided? Summary of discussion and next action items..."
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

