import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  User,
  Users,
  Video,
  MapPin,
  Building2,
  FolderKanban,
  FileText,
  AlertCircle,
  Sparkles,
  Phone,
  Mail,
  MessageSquare,
  DollarSign,
  Briefcase,
} from 'lucide-react';
import {
  CalendarEvent,
  CalendarEventType,
  CalendarEventStatus,
  CalendarEventPriority,
} from '../../types/crm';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useSystemCurrency } from '../../data/currencyService';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: CalendarEvent) => void;
  eventToEdit?: CalendarEvent | null;
  initialDate?: string;
  availableCompanies?: string[];
  availableProjects?: string[];
}

const EVENT_TYPES: CalendarEventType[] = [
  'Meeting',
  'Client Demo',
  'Call',
  'Sprint Review',
  'Milestone Deadline',
  'Architecture Workshop',
  'Onboarding',
];

const FOLLOW_UP_TYPES = ['Call', 'WhatsApp', 'Email', 'Meeting'];

const STATUSES: CalendarEventStatus[] = [
  'Scheduled',
  'In Progress',
  'Completed',
  'Cancelled',
];

const PRIORITIES: CalendarEventPriority[] = ['High', 'Medium', 'Low'];

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  onSave,
  eventToEdit,
  initialDate,
  availableCompanies = [],
  availableProjects = [],
}) => {
  const { theme } = useTheme();
  const { currentUser, users } = useAuth();
  const currency = useSystemCurrency();
  const isLight = theme === 'white-sky';

  const [source, setSource] = useState<'event' | 'follow_up'>('event');
  const [title, setTitle] = useState('');
  const [type, setType] = useState<string>('Meeting');
  const [date, setDate] = useState('2025-05-20');
  const [startTime, setStartTime] = useState('10:00 AM');
  const [endTime, setEndTime] = useState('11:00 AM');
  const [company, setCompany] = useState('');
  const [project, setProject] = useState('');
  const [status, setStatus] = useState<CalendarEventStatus>('Scheduled');
  const [priority, setPriority] = useState<CalendarEventPriority>('Medium');
  const [location, setLocation] = useState('Google Meet');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [attendeesInput, setAttendeesInput] = useState('');
  const [description, setDescription] = useState('');

  // Follow-up specific fields
  const [contact, setContact] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [dealName, setDealName] = useState('');
  const [dealValue, setDealValue] = useState<number | string>('');
  const [owner, setOwner] = useState('Sayed (CEO)');

  useEffect(() => {
    if (eventToEdit) {
      setSource(eventToEdit.source || 'event');
      setTitle(eventToEdit.title);
      setType(eventToEdit.type || 'Meeting');
      setDate(eventToEdit.date);
      setStartTime(eventToEdit.startTime || '10:00 AM');
      setEndTime(eventToEdit.endTime || '11:00 AM');
      setCompany(eventToEdit.company);
      setProject(eventToEdit.project || '');
      setStatus(eventToEdit.status || 'Scheduled');
      setPriority(eventToEdit.priority || 'Medium');
      setLocation(eventToEdit.location || 'Google Meet');
      setMeetingUrl(eventToEdit.meetingUrl || '');
      setAttendeesInput(eventToEdit.attendees ? eventToEdit.attendees.join(', ') : '');
      setDescription(eventToEdit.description || '');

      setContact(eventToEdit.contact || '');
      setContactPhone(eventToEdit.contactPhone || '');
      setContactEmail(eventToEdit.contactEmail || '');
      setDealName(eventToEdit.dealName || '');
      setDealValue(eventToEdit.dealValue !== undefined ? eventToEdit.dealValue : '');
      setOwner(eventToEdit.owner || eventToEdit.attendees?.[0] || currentUser?.name || 'Sayed (CEO)');
    } else {
      setSource('event');
      setTitle('');
      setType('Meeting');
      setDate(initialDate || '2025-05-20');
      setStartTime('10:00 AM');
      setEndTime('11:00 AM');
      setCompany(availableCompanies[0] || 'FinEdge Systems');
      setProject(availableProjects[0] || 'PCI-DSS Banking API Gateway');
      setStatus('Scheduled');
      setPriority('Medium');
      setLocation('Google Meet');
      setMeetingUrl('https://meet.google.com/new');
      setAttendeesInput(currentUser?.name || 'Sayed (CEO)');
      setDescription('');

      setContact('');
      setContactPhone('+1 (555) 019-2834');
      setContactEmail('');
      setDealName('');
      setDealValue('');
      setOwner(currentUser?.name || 'Sayed (CEO)');
    }
  }, [eventToEdit, isOpen, initialDate, availableCompanies, availableProjects]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;

    const attendees = attendeesInput
      .split(',')
      .map((a) => a.trim())
      .filter((a) => a.length > 0);

    const formattedTime = source === 'follow_up' ? startTime : `${startTime} - ${endTime}`;

    const newEvent: CalendarEvent = {
      ...(eventToEdit || {}),
      id: eventToEdit ? eventToEdit.id : (source === 'follow_up' ? `fu-${Date.now()}` : `evt-${Date.now()}`),
      title: title.trim(),
      type,
      date,
      time: formattedTime,
      startTime,
      endTime: source === 'follow_up' ? undefined : endTime,
      company: company.trim() || 'Internal Engineering',
      project: project.trim() || undefined,
      status,
      priority,
      location: location.trim() || undefined,
      meetingUrl: meetingUrl.trim() || undefined,
      attendees: attendees.length > 0 ? attendees : undefined,
      description: description.trim() || undefined,
      source,
      contact: source === 'follow_up' ? contact.trim() || undefined : eventToEdit?.contact,
      contactPhone: source === 'follow_up' ? contactPhone.trim() || undefined : eventToEdit?.contactPhone,
      contactEmail: source === 'follow_up' ? contactEmail.trim() || undefined : eventToEdit?.contactEmail,
      dealName: source === 'follow_up' ? dealName.trim() || undefined : eventToEdit?.dealName,
      dealValue: source === 'follow_up' && dealValue ? Number(dealValue) : eventToEdit?.dealValue,
      owner: owner.trim() || currentUser?.name || eventToEdit?.owner,
    };

    onSave(newEvent);
    onClose();
  };

  const allCompanies = Array.from(new Set([...availableCompanies, company])).filter(Boolean);
  const allProjects = Array.from(new Set([...availableProjects, project])).filter(Boolean);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        className={`relative w-full max-w-2xl rounded-2xl shadow-2xl border flex flex-col max-h-[92vh] overflow-hidden my-auto animate-fade-in ${
          isLight
            ? 'bg-white border-sky-100 text-slate-800'
            : 'bg-slate-900 border-slate-700 text-slate-100'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-sky-100/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center font-extrabold shadow-sm">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {eventToEdit ? 'Edit Calendar Item' : 'Schedule New Item'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {eventToEdit
                  ? `Update schedule and details for ${eventToEdit.title}`
                  : 'Coordinate meetings, client reviews, demos, and sales follow-ups'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Source Selector (Event vs Sales Follow-Up) */}
        <div className="px-5 pt-4 pb-1 border-b border-sky-100/30 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2 p-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 max-w-md">
            <button
              type="button"
              onClick={() => {
                setSource('event');
                if (FOLLOW_UP_TYPES.includes(type) && !EVENT_TYPES.includes(type as CalendarEventType)) {
                  setType('Meeting');
                }
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                source === 'event'
                  ? 'bg-sky-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>📅 Engineering Event</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSource('follow_up');
                if (!FOLLOW_UP_TYPES.includes(type)) {
                  setType('Call');
                }
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                source === 'follow_up'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>📞 Sales Follow-Up</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
              {source === 'follow_up' ? 'Follow-Up Action Title' : 'Event Title'} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={source === 'follow_up' ? 'e.g. Follow-Up: John Smith (TechVision Inc.)' : 'e.g. Client Staging Demo & UAT Signoff'}
              className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-medium ${
                isLight
                  ? 'bg-sky-50/30 border-sky-200 text-slate-800 focus:border-sky-500'
                  : 'bg-slate-800/80 border-slate-700 text-white focus:border-sky-400'
              }`}
            />
          </div>

          {/* Type & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                {source === 'follow_up' ? 'Follow-Up Channel' : 'Event Category / Type'} <span className="text-rose-500">*</span>
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-medium cursor-pointer ${
                  isLight
                    ? 'bg-sky-50/30 border-sky-200 text-slate-800 focus:border-sky-500'
                    : 'bg-slate-800/80 border-slate-700 text-white focus:border-sky-400'
                }`}
              >
                {source === 'follow_up' ? (
                  FOLLOW_UP_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t === 'Call' ? '📞 Phone Call' : t === 'WhatsApp' ? '💬 WhatsApp' : t === 'Email' ? '✉️ Email' : '🤝 Meeting'}
                    </option>
                  ))
                ) : (
                  EVENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as CalendarEventPriority)}
                className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-medium cursor-pointer ${
                  isLight
                    ? 'bg-sky-50/30 border-sky-200 text-slate-800 focus:border-sky-500'
                    : 'bg-slate-800/80 border-slate-700 text-white focus:border-sky-400'
                }`}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Time Slot */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-medium ${
                  isLight
                    ? 'bg-sky-50/30 border-sky-200 text-slate-800 focus:border-sky-500'
                    : 'bg-slate-800/80 border-slate-700 text-white focus:border-sky-400'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                {source === 'follow_up' ? 'Follow-Up Time' : 'Start Time'}
              </label>
              <input
                type="text"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                placeholder="e.g. 10:00 AM"
                className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-medium ${
                  isLight
                    ? 'bg-sky-50/30 border-sky-200 text-slate-800 focus:border-sky-500'
                    : 'bg-slate-800/80 border-slate-700 text-white focus:border-sky-400'
                }`}
              />
            </div>

            {source === 'event' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  End Time
                </label>
                <input
                  type="text"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  placeholder="e.g. 11:00 AM"
                  className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-medium ${
                    isLight
                      ? 'bg-sky-50/30 border-sky-200 text-slate-800 focus:border-sky-500'
                      : 'bg-slate-800/80 border-slate-700 text-white focus:border-sky-400'
                  }`}
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Owner / Assigned Staff
              </label>
              <select
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-medium cursor-pointer ${
                  isLight
                    ? 'bg-sky-50/30 border-sky-200 text-slate-800 focus:border-sky-500'
                    : 'bg-slate-800/80 border-slate-700 text-white focus:border-sky-400'
                }`}
              >
                {users.map((u) => (
                  <option key={u.id} value={u.name}>
                    {u.name} ({u.department})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Follow-up specific: Contact Person, Phone, Email */}
          {source === 'follow_up' && (
            <div className="p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/30 dark:bg-indigo-950/20 space-y-3">
              <span className="font-extrabold text-[11px] uppercase tracking-wider text-indigo-700 dark:text-indigo-300 block">
                Lead / Contact Person Details
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="e.g. John Smith"
                    className={`w-full px-3 py-1.5 text-xs rounded-lg border outline-none font-medium ${
                      isLight
                        ? 'bg-white border-slate-200 text-slate-800'
                        : 'bg-slate-900 border-slate-700 text-white'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="e.g. +1 (408) 555-0192"
                    className={`w-full px-3 py-1.5 text-xs rounded-lg border outline-none font-medium ${
                      isLight
                        ? 'bg-white border-slate-200 text-slate-800'
                        : 'bg-slate-900 border-slate-700 text-white'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Corporate Email
                  </label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="e.g. john@techvision.io"
                    className={`w-full px-3 py-1.5 text-xs rounded-lg border outline-none font-medium ${
                      isLight
                        ? 'bg-white border-slate-200 text-slate-800'
                        : 'bg-slate-900 border-slate-700 text-white'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Associated Deal Name
                  </label>
                  <input
                    type="text"
                    value={dealName}
                    onChange={(e) => setDealName(e.target.value)}
                    placeholder="e.g. Cloud Migration & Microservices"
                    className={`w-full px-3 py-1.5 text-xs rounded-lg border outline-none font-medium ${
                      isLight
                        ? 'bg-white border-slate-200 text-slate-800'
                        : 'bg-slate-900 border-slate-700 text-white'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Deal Value ({currency.symbol})
                  </label>
                  <input
                    type="number"
                    value={dealValue}
                    onChange={(e) => setDealValue(e.target.value)}
                    placeholder="e.g. 75000"
                    className={`w-full px-3 py-1.5 text-xs rounded-lg border outline-none font-medium ${
                      isLight
                        ? 'bg-white border-slate-200 text-slate-800'
                        : 'bg-slate-900 border-slate-700 text-white'
                    }`}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Company & Project */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Company / Organization
              </label>
              {allCompanies.length > 0 ? (
                <select
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-medium cursor-pointer ${
                    isLight
                      ? 'bg-sky-50/30 border-sky-200 text-slate-800 focus:border-sky-500'
                      : 'bg-slate-800/80 border-slate-700 text-white focus:border-sky-400'
                  }`}
                >
                  {allCompanies.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. TechVision Inc."
                  className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-medium ${
                    isLight
                      ? 'bg-sky-50/30 border-sky-200 text-slate-800 focus:border-sky-500'
                      : 'bg-slate-800/80 border-slate-700 text-white focus:border-sky-400'
                  }`}
                />
              )}
            </div>

            {source === 'event' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Linked Project
                </label>
                {allProjects.length > 0 ? (
                  <select
                    value={project}
                    onChange={(e) => setProject(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-medium cursor-pointer ${
                      isLight
                        ? 'bg-sky-50/30 border-sky-200 text-slate-800 focus:border-sky-500'
                        : 'bg-slate-800/80 border-slate-700 text-white focus:border-sky-400'
                    }`}
                  >
                    <option value="">-- No Linked Project --</option>
                    {allProjects.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={project}
                    onChange={(e) => setProject(e.target.value)}
                    placeholder="e.g. PCI-DSS Banking API Gateway"
                    className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-medium ${
                      isLight
                        ? 'bg-sky-50/30 border-sky-200 text-slate-800 focus:border-sky-500'
                        : 'bg-slate-800/80 border-slate-700 text-white focus:border-sky-400'
                    }`}
                  />
                )}
              </div>
            )}
          </div>

          {/* Location & Meeting URL (if meeting) */}
          {(source === 'event' || type === 'Meeting') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Location / Venue
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Google Meet, Zoom Room 3, Client HQ"
                  className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-medium ${
                    isLight
                      ? 'bg-sky-50/30 border-sky-200 text-slate-800 focus:border-sky-500'
                      : 'bg-slate-800/80 border-slate-700 text-white focus:border-sky-400'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Virtual Video Link
                </label>
                <input
                  type="text"
                  value={meetingUrl}
                  onChange={(e) => setMeetingUrl(e.target.value)}
                  placeholder="e.g. https://meet.google.com/abc-defg-hij"
                  className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-medium ${
                    isLight
                      ? 'bg-sky-50/30 border-sky-200 text-slate-800 focus:border-sky-500'
                      : 'bg-slate-800/80 border-slate-700 text-white focus:border-sky-400'
                  }`}
                />
              </div>
            </div>
          )}

          {/* Attendees (for Events) */}
          {source === 'event' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Attendees & Key Stakeholders (comma-separated)
              </label>
              <input
                type="text"
                value={attendeesInput}
                onChange={(e) => setAttendeesInput(e.target.value)}
                placeholder="e.g. Sayed (CEO), Amit Kumar, John Smith"
                className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-medium ${
                  isLight
                    ? 'bg-sky-50/30 border-sky-200 text-slate-800 focus:border-sky-500'
                    : 'bg-slate-800/80 border-slate-700 text-white focus:border-sky-400'
                }`}
              />
            </div>
          )}

          {/* Status */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
              Execution Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as CalendarEventStatus)}
              className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-medium cursor-pointer ${
                isLight
                  ? 'bg-sky-50/30 border-sky-200 text-slate-800 focus:border-sky-500'
                  : 'bg-slate-800/80 border-slate-700 text-white focus:border-sky-400'
              }`}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Description & Agenda */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
              {source === 'follow_up' ? 'Follow-Up Objectives & Notes' : 'Agenda & Session Notes'}
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={source === 'follow_up' ? 'Enter key discussion topics, proposal checkpoints, or follow-up notes...' : 'Key discussion topics, demo objectives, presentation assets, or milestone criteria...'}
              className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-medium resize-none ${
                isLight
                  ? 'bg-sky-50/30 border-sky-200 text-slate-800 focus:border-sky-500'
                  : 'bg-slate-800/80 border-slate-700 text-white focus:border-sky-400'
              }`}
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-sky-100/30 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-colors ${
                isLight
                  ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold rounded-xl bg-sky-500 hover:bg-sky-600 text-white shadow-sm transition-all active:scale-95"
            >
              {eventToEdit ? 'Save Changes' : source === 'follow_up' ? 'Schedule Follow-Up' : 'Schedule Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
