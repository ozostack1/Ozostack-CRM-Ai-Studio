import React from 'react';
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
  Edit2,
  Trash2,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Play,
  RotateCcw,
  Phone,
  Mail,
  MessageSquare,
  DollarSign,
  Briefcase,
  Send,
} from 'lucide-react';
import {
  CalendarEvent,
  CalendarEventType,
  CalendarEventStatus,
  CalendarEventPriority,
} from '../../types/crm';
import { useTheme } from '../../context/ThemeContext';
import { useSystemCurrency } from '../../data/currencyService';

interface EventDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  event: CalendarEvent | null;
  onEdit: (event: CalendarEvent) => void;
  onDelete: (eventId: string, eventTitle: string) => void;
  onUpdateEvent: (updated: CalendarEvent) => void;
}

export const EventDetailsDrawer: React.FC<EventDetailsDrawerProps> = ({
  isOpen,
  onClose,
  event,
  onEdit,
  onDelete,
  onUpdateEvent,
}) => {
  const { theme } = useTheme();
  const currency = useSystemCurrency();
  const isLight = theme === 'white-sky';

  if (!isOpen || !event) return null;

  const isFollowUp = event.source === 'follow_up';

  const getTypeColor = (t: string) => {
    switch (t) {
      case 'WhatsApp':
        return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800';
      case 'Call':
        return 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-300 dark:border-sky-800';
      case 'Email':
        return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-800';
      case 'Client Demo':
        return 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-300 dark:border-purple-800';
      case 'Sprint Review':
        return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-800';
      case 'Milestone Deadline':
        return 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-800';
      case 'Architecture Workshop':
        return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800';
      case 'Onboarding':
        return 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-300 dark:border-teal-800';
      default:
        return 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-300 dark:border-sky-800';
    }
  };

  const getStatusColor = (s: CalendarEventStatus) => {
    switch (s) {
      case 'In Progress':
        return 'bg-sky-500 text-white font-bold animate-pulse';
      case 'Completed':
        return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800';
      case 'Cancelled':
        return 'bg-slate-500/15 text-slate-500 border-slate-300 dark:border-slate-700';
      case 'Scheduled':
      default:
        return 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-300 dark:border-sky-800';
    }
  };

  const getPriorityBadge = (p?: CalendarEventPriority) => {
    switch (p) {
      case 'High':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-800">🔥 High</span>;
      case 'Medium':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-800">● Medium</span>;
      case 'Low':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-500/15 text-slate-500 border border-slate-300 dark:border-slate-700">▼ Low</span>;
      default:
        return null;
    }
  };

  const handleQuickStatusChange = (newStatus: CalendarEventStatus) => {
    const updated: CalendarEvent = {
      ...event,
      status: newStatus,
    };
    onUpdateEvent(updated);
  };

  const attendeesList = event.attendees || ['Sayed (CEO)', 'Amit Kumar'];
  const cleanPhone = (event.contactPhone || '').replace(/[^0-9+]/g, '');

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div
          className={`w-screen max-w-xl shadow-2xl border-l flex flex-col ${
            isLight
              ? 'bg-white border-sky-100 text-slate-800'
              : 'bg-slate-900 border-slate-700 text-slate-100'
          }`}
        >
          {/* Header */}
          <div className="p-5 border-b border-sky-100/30 flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div
                className={`w-11 h-11 rounded-xl text-white flex items-center justify-center font-extrabold text-lg shadow-md shrink-0 ${
                  isFollowUp
                    ? event.type === 'WhatsApp'
                      ? 'bg-gradient-to-tr from-emerald-500 to-teal-600'
                      : event.type === 'Email'
                      ? 'bg-gradient-to-tr from-amber-500 to-orange-600'
                      : event.type === 'Call'
                      ? 'bg-gradient-to-tr from-sky-400 to-blue-600'
                      : 'bg-gradient-to-tr from-purple-500 to-indigo-600'
                    : 'bg-gradient-to-tr from-sky-400 to-indigo-600'
                }`}
              >
                {isFollowUp ? (
                  event.type === 'WhatsApp' ? (
                    <MessageSquare className="w-5 h-5" />
                  ) : event.type === 'Call' ? (
                    <Phone className="w-5 h-5" />
                  ) : event.type === 'Email' ? (
                    <Mail className="w-5 h-5" />
                  ) : (
                    <Calendar className="w-5 h-5" />
                  )
                ) : (
                  <Calendar className="w-5 h-5" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      isFollowUp
                        ? 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700'
                        : 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-700'
                    }`}
                  >
                    {isFollowUp ? 'Sales Pipeline Follow-Up' : 'Calendar Event'}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getTypeColor(event.type)}`}>
                    {event.type}
                  </span>
                  {event.status && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusColor(event.status)}`}>
                      {event.status}
                    </span>
                  )}
                  {getPriorityBadge(event.priority)}
                </div>

                <h2 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                  {event.title}
                </h2>

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-sky-600 dark:text-sky-400">{event.company}</span>
                  {event.dealName && (
                    <>
                      <span>•</span>
                      <span className="font-medium text-slate-600 dark:text-slate-300">{event.dealName}</span>
                    </>
                  )}
                  {event.project && !event.dealName && (
                    <>
                      <span>•</span>
                      <span>{event.project}</span>
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => {
                  onClose();
                  onEdit(event);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors"
                title="Edit Event"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  if (confirm(`Delete item "${event.title}"?`)) {
                    onDelete(event.id, event.title);
                    onClose();
                  }
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Key Metrics Banner */}
          <div className="grid grid-cols-3 gap-2 px-5 py-3 border-b border-sky-100/30 bg-sky-50/30 dark:bg-slate-800/40 text-center text-xs">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Scheduled Date</span>
              <span className="text-xs font-bold text-slate-800 dark:text-white">
                {event.date}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Timeslot</span>
              <span className="text-xs font-bold text-sky-600 dark:text-sky-400">
                {event.time}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                {isFollowUp ? 'Deal Pipeline Value' : 'Stakeholders'}
              </span>
              <span className={`text-xs font-extrabold ${isFollowUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-indigo-500'}`}>
                {isFollowUp && event.dealValue ? `${currency.symbol}${event.dealValue.toLocaleString()}` : `${attendeesList.length} Confirmed`}
              </span>
            </div>
          </div>

          {/* Drawer Body Content */}
          <div className="flex-1 overflow-y-auto p-5 text-xs space-y-4">
            {/* DIRECT ACTION CHANNELS FOR FOLLOW-UP */}
            {isFollowUp && (
              <div className="p-4 rounded-xl border border-sky-200 dark:border-sky-800 bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-transparent space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-slate-800 dark:text-white flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-sky-500" />
                    Direct Contact Action Channels
                  </span>
                  <span className="text-[10px] text-slate-400">Click to connect instantly</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {/* Phone Call */}
                  {event.contactPhone ? (
                    <a
                      href={`tel:${cleanPhone}`}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-xs transition-all active:scale-95"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call {event.contactPhone.split(' ')[0] || ''}</span>
                    </a>
                  ) : (
                    <button disabled className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 text-xs cursor-not-allowed">
                      <Phone className="w-3.5 h-3.5" />
                      <span>No Phone</span>
                    </button>
                  )}

                  {/* WhatsApp */}
                  {event.contactPhone ? (
                    <a
                      href={`https://wa.me/${cleanPhone.replace('+', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  ) : (
                    <button disabled className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 text-xs cursor-not-allowed">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </button>
                  )}

                  {/* Email */}
                  {event.contactEmail ? (
                    <a
                      href={`mailto:${event.contactEmail}?subject=${encodeURIComponent(`Following up: ${event.dealName || event.title}`)}`}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Email</span>
                    </a>
                  ) : (
                    <button disabled className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 text-xs cursor-not-allowed">
                      <Mail className="w-3.5 h-3.5" />
                      <span>No Email</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Direct Join Video Meeting Banner */}
            {event.meetingUrl && (
              <div className="p-4 rounded-xl border border-sky-200 dark:border-sky-800 bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-transparent flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-sky-500 text-white">
                    <Video className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-slate-800 dark:text-white block">
                      Virtual Conference Room
                    </span>
                    <span className="text-[11px] text-slate-400 truncate max-w-xs block">
                      {event.location || 'Google Meet'}
                    </span>
                  </div>
                </div>

                <a
                  href={event.meetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-sm transition-all active:scale-95 shrink-0"
                >
                  <span>Join Session</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            {/* Quick Completion Button for Follow-Up */}
            {isFollowUp && event.status !== 'Completed' && (
              <div className="p-3.5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                    Finished touching base with {event.contact || 'contact'}?
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleQuickStatusChange('Completed')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95 shrink-0"
                >
                  Mark Completed
                </button>
              </div>
            )}

            {/* Status Switcher */}
            <div className={`p-4 rounded-xl border ${isLight ? 'bg-slate-50/70 border-sky-100' : 'bg-slate-800/40 border-slate-700'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-xs text-slate-700 dark:text-slate-200">
                  Execution Status
                </span>
                <span className="text-[10px] text-slate-400">Click to update status</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(['Scheduled', 'In Progress', 'Completed', 'Cancelled'] as CalendarEventStatus[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => handleQuickStatusChange(st)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                      event.status === st
                        ? getStatusColor(st) + ' ring-2 ring-sky-400 scale-102'
                        : isLight
                        ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Context & Organization Details */}
            <div className={`p-4 rounded-xl border ${isLight ? 'bg-slate-50/70 border-sky-100' : 'bg-slate-800/40 border-slate-700'}`}>
              <h3 className="font-bold text-xs text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-sky-500" />
                {isFollowUp ? 'Deal & Pipeline Intelligence' : 'Engagement Context & Metadata'}
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Client / Organization</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
                    {event.company}
                  </span>
                </div>
                {isFollowUp ? (
                  <>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Primary Contact Person</span>
                      <span className="font-bold text-sky-600 dark:text-sky-400 mt-0.5 block truncate">
                        {event.contact || 'Lead Representative'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Associated Deal</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block truncate">
                        {event.dealName || 'General Sales Touchpoint'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Deal Value</span>
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                        {event.dealValue ? `${currency.symbol}${event.dealValue.toLocaleString()}` : `${currency.symbol}0`}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Direct Phone</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300 mt-0.5 block">
                        {event.contactPhone || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Corporate Email</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300 mt-0.5 block truncate">
                        {event.contactEmail || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Account Executive / Owner</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
                        {event.owner || 'Sayed (CEO)'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Channel Type</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
                        {event.type}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Associated Project</span>
                      <span className="font-semibold text-sky-600 dark:text-sky-400 mt-0.5 block truncate">
                        {event.project || 'General Executive Review'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Session Format</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
                        {event.location || 'Virtual Conference'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Priority Level</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
                        {event.priority || 'Medium'} Priority
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Attendees / Participants */}
            {!isFollowUp && (
              <div className={`p-4 rounded-xl border ${isLight ? 'bg-slate-50/70 border-sky-100' : 'bg-slate-800/40 border-slate-700'}`}>
                <h3 className="font-bold text-xs text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-indigo-500" />
                  Confirmed Participants ({attendeesList.length})
                </h3>
                <div className="space-y-2">
                  {attendeesList.map((attendee) => (
                    <div
                      key={attendee}
                      className={`p-2.5 rounded-lg border flex items-center justify-between ${
                        isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-300 font-bold flex items-center justify-center text-[10px]">
                          {attendee.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-bold text-slate-800 dark:text-white">
                          {attendee}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        Confirmed
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Agenda & Strategic Notes */}
            {event.description && (
              <div className={`p-4 rounded-xl border ${isLight ? 'bg-slate-50/70 border-sky-100' : 'bg-slate-800/40 border-slate-700'}`}>
                <h3 className="font-bold text-xs text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-500" />
                  {isFollowUp ? 'Follow-Up Strategy & Notes' : 'Agenda & Strategic Objectives'}
                </h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-xs">
                  {event.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
