import React, { useState } from 'react';
import {
  X,
  Phone,
  Mail,
  MessageSquare,
  Building,
  Calendar,
  DollarSign,
  Tag,
  Clock,
  Edit2,
  Trash2,
  CheckCircle2,
  Send,
  User,
  Plus,
  Sparkles,
} from 'lucide-react';
import { Lead, LeadStatus, LeadActivity } from '../../types/crm';
import { useTheme } from '../../context/ThemeContext';
import { useCrmConfig } from '../../data/crmConfig';
import { useSystemCurrency } from '../../data/currencyService';
import { ContactActionType } from './LeadActionModal';

interface LeadDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
  onEdit: (lead: Lead) => void;
  onDelete: (leadId: string) => void;
  onStatusChange: (leadId: string, newStatus: LeadStatus) => void;
  onOwnerChange: (leadId: string, newOwner: string) => void;
  onContactClick: (lead: Lead, action: ContactActionType, stageTrigger?: LeadStatus) => void;
  onOpenAiFollowup: (lead: Lead) => void;
  activities: LeadActivity[];
  onAddActivity: (leadId: string, description: string) => void;
}

const STAGES: LeadStatus[] = [
  'New Lead',
  'Contacted',
  'Follow-up',
  'Qualified',
  'Proposal Sent',
  'Negotiation',
  'Won',
];

const OWNERS = ['Amit Kumar', 'Neha Sharma', 'Rizwan Khan', 'Priya Singh', 'Vikram Joshi', 'Sayed'];

export const LeadDetailsDrawer: React.FC<LeadDetailsDrawerProps> = ({
  isOpen,
  onClose,
  lead,
  onEdit,
  onDelete,
  onStatusChange,
  onOwnerChange,
  onContactClick,
  onOpenAiFollowup,
  activities,
  onAddActivity,
}) => {
  const { theme } = useTheme();
  const { config } = useCrmConfig();
  const currency = useSystemCurrency();
  const isLight = theme === 'white-sky';
  const activeStages = React.useMemo(
    () => (config.leadStages.length > 0 ? config.leadStages.map((s) => s.name) : STAGES),
    [config.leadStages]
  );
  const leadCustomFields = React.useMemo(
    () => config.customFields.filter((f) => f.entity === 'Lead' || f.entity === 'Both'),
    [config.customFields]
  );

  const [newNote, setNewNote] = useState('');
  const [stageFollowupPrompt, setStageFollowupPrompt] = useState<LeadStatus | null>(null);

  if (!isOpen || !lead) return null;

  const currentStageIndex = activeStages.indexOf(lead.status as LeadStatus);

  const handleStageClick = (stage: LeadStatus) => {
    if (stage === lead.status) return;
    onStatusChange(lead.id, stage);
    setStageFollowupPrompt(stage);
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    onAddActivity(lead.id, newNote.trim());
    setNewNote('');
  };

  const leadActivities = activities.filter((a) => a.leadId === lead.id);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div
          className={`w-screen max-w-xl shadow-2xl flex flex-col border-l transition-transform ${
            isLight
              ? 'bg-white border-sky-100 text-slate-800'
              : 'bg-slate-900 border-slate-700 text-white'
          }`}
        >
          {/* Top Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-sky-100/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-400 to-indigo-600 text-white font-extrabold text-sm flex items-center justify-center shadow-md">
                {lead.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)}
              </div>
              <div>
                <h2 className="text-base font-bold leading-tight flex items-center gap-2">
                  <span>{lead.name}</span>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      lead.priority === 'Hot'
                        ? 'bg-rose-500/10 text-rose-600'
                        : lead.priority === 'Warm'
                        ? 'bg-amber-500/10 text-amber-600'
                        : 'bg-slate-500/10 text-slate-500'
                    }`}
                  >
                    {lead.priority} Lead
                  </span>
                </h2>
                <p className="text-xs text-slate-400 leading-tight mt-0.5">
                  {lead.title} at <span className="font-semibold text-sky-500">{lead.company}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onEdit(lead)}
                className={`p-2 rounded-lg border text-xs font-medium flex items-center gap-1 transition-colors ${
                  isLight
                    ? 'border-sky-200 text-slate-600 hover:bg-sky-50'
                    : 'border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
                title="Edit Lead"
              >
                <Edit2 className="w-3.5 h-3.5 text-sky-500" />
                <span className="hidden sm:inline">Edit</span>
              </button>

              <button
                onClick={() => {
                  if (confirm(`Are you sure you want to delete ${lead.name}?`)) {
                    onDelete(lead.id);
                    onClose();
                  }
                }}
                className="p-2 rounded-lg border border-red-200/50 text-red-500 hover:bg-red-500/10 transition-colors"
                title="Delete Lead"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={onClose}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Direct Contact Action Buttons Bar */}
          <div
            className={`px-6 py-3 border-b flex flex-wrap items-center justify-between gap-2.5 ${
              isLight ? 'bg-sky-50/50 border-sky-100' : 'bg-slate-800/40 border-slate-800'
            }`}
          >
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
              Direct Actions:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {/* AI Follow-up generator */}
              <button
                onClick={() => onOpenAiFollowup(lead)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-500 hover:bg-sky-600 text-white shadow-xs transition-all active:scale-95"
                title="Generate AI Follow-up draft (Email / WhatsApp)"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                <span>AI Follow-Up</span>
              </button>

              {/* WhatsApp */}
              <button
                onClick={() => onContactClick(lead, 'whatsapp')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-all active:scale-95"
                title="Send WhatsApp message"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>

              {/* Mail */}
              <button
                onClick={() => onContactClick(lead, 'email')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white shadow-xs transition-all active:scale-95"
                title="Send Email"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email</span>
              </button>

              {/* Call */}
              <button
                onClick={() => onContactClick(lead, 'call')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs transition-all active:scale-95"
                title="Direct Phone Call"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call</span>
              </button>
            </div>
          </div>

          {/* Drawer Body Scroll */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Stage Progress Stepper */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Pipeline Stage (Click to update)
                </span>
                <span className="text-xs font-bold text-sky-500">{lead.status}</span>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-1">
                {activeStages.map((stage, idx) => {
                  const isCompletedOrCurrent = currentStageIndex >= idx;
                  const isCurrent = lead.status === stage;
                  return (
                    <button
                      key={stage}
                      onClick={() => handleStageClick(stage)}
                      className={`py-1.5 px-1 rounded text-[9px] font-bold transition-all text-center truncate ${
                        isCurrent
                          ? 'bg-sky-500 text-white shadow-sm ring-2 ring-sky-300 dark:ring-sky-700'
                          : isCompletedOrCurrent
                          ? 'bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300'
                          : isLight
                          ? 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                          : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
                      }`}
                      title={stage}
                    >
                      {stage}
                    </button>
                  );
                })}
              </div>

              {/* Stage Changed WhatsApp Follow-Up Banner */}
              {stageFollowupPrompt && (
                <div className="mt-3 p-3 rounded-xl border bg-emerald-500/10 border-emerald-500/30 flex items-center justify-between gap-3 animate-fadeIn">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 rounded-xl bg-emerald-500 text-white shrink-0 shadow-xs">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div className="text-xs min-w-0">
                      <div className="font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 truncate">
                        <span>Moved to "{stageFollowupPrompt}"</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold uppercase">
                          Action
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        Send stage update via WhatsApp to {lead.name.split(' ')[0]}?
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => {
                        onContactClick(lead, 'whatsapp', stageFollowupPrompt);
                        setStageFollowupPrompt(null);
                      }}
                      className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm shadow-emerald-600/25 flex items-center gap-1.5 transition-all active:scale-95"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Send WhatsApp</span>
                    </button>
                    <button
                      onClick={() => setStageFollowupPrompt(null)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md transition-colors"
                      title="Dismiss prompt"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div
                className={`p-3 rounded-xl border text-center ${
                  isLight ? 'bg-slate-50 border-sky-100' : 'bg-slate-800/50 border-slate-700'
                }`}
              >
                <div className="text-[9px] font-bold text-slate-400 uppercase">Estimated Value</div>
                <div className="text-base font-extrabold text-emerald-500 tabular-nums mt-0.5">
                  {currency.symbol}{lead.value.toLocaleString()}
                </div>
              </div>

              <div
                className={`p-3 rounded-xl border text-center ${
                  isLight ? 'bg-slate-50 border-sky-100' : 'bg-slate-800/50 border-slate-700'
                }`}
              >
                <div className="text-[9px] font-bold text-slate-400 uppercase">Lead Score</div>
                <div className="text-base font-extrabold text-sky-500 tabular-nums mt-0.5">
                  {lead.score}/100
                </div>
              </div>

              <div
                className={`p-3 rounded-xl border text-center ${
                  isLight ? 'bg-slate-50 border-sky-100' : 'bg-slate-800/50 border-slate-700'
                }`}
              >
                <div className="text-[9px] font-bold text-slate-400 uppercase">Lead Source</div>
                <div className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-1 truncate">
                  {lead.source}
                </div>
              </div>
            </div>

            {/* Contact Details List */}
            <div
              className={`p-4 rounded-xl border space-y-2.5 text-xs ${
                isLight ? 'bg-slate-50 border-sky-100' : 'bg-slate-800/50 border-slate-700'
              }`}
            >
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Contact Information
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-sky-500" /> Email:
                </span>
                <span className="font-semibold text-slate-800 dark:text-white select-all">
                  {lead.email}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-indigo-500" /> Phone:
                </span>
                <span className="font-semibold tabular-nums select-all">{lead.phone}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-500" /> WhatsApp:
                </span>
                <span className="font-semibold tabular-nums select-all">
                  {lead.whatsapp || lead.phone}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-500" /> Assigned Owner:
                </span>
                <select
                  value={lead.owner}
                  onChange={(e) => onOwnerChange(lead.id, e.target.value)}
                  className={`text-xs font-semibold px-2 py-1 rounded border outline-none cursor-pointer transition-colors ${
                    isLight
                      ? 'bg-white border-sky-200 text-slate-800 focus:border-sky-500'
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

              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> Created Date:
                </span>
                <span className="font-medium tabular-nums">{lead.createdAt}</span>
              </div>
            </div>

            {/* Custom Fields Section */}
            {leadCustomFields.length > 0 && (
              <div
                className={`p-4 rounded-xl border space-y-2.5 text-xs ${
                  isLight ? 'bg-slate-50 border-sky-100' : 'bg-slate-800/50 border-slate-700'
                }`}
              >
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-sky-500" />
                  <span>Custom Fields</span>
                </div>
                {leadCustomFields.map((field) => {
                  const val = lead.customFields?.[field.key];
                  return (
                    <div key={field.id} className="flex items-center justify-between gap-2">
                      <span className="text-slate-400">{field.label}:</span>
                      <span className="font-semibold text-slate-800 dark:text-white truncate max-w-[240px]">
                        {val !== undefined && val !== '' ? String(val) : '—'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Notes Section */}
            {lead.notes && (
              <div
                className={`p-4 rounded-xl border ${
                  isLight ? 'bg-sky-50/40 border-sky-100' : 'bg-slate-800/40 border-slate-700'
                }`}
              >
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Scope & Requirements
                </div>
                <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-200">
                  {lead.notes}
                </p>
              </div>
            )}

            {/* Activity History & Log */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Activity Timeline ({leadActivities.length})
                </span>
              </div>

              {/* Add Note Input */}
              <form onSubmit={handleAddNote} className="flex gap-2">
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Log quick call note, next step, or client feedback..."
                  className={`flex-1 text-xs px-3 py-2 rounded-lg border outline-none ${
                    isLight
                      ? 'bg-slate-50 border-sky-200 text-slate-800 focus:border-sky-500'
                      : 'bg-slate-800 border-slate-700 text-white focus:border-sky-400'
                  }`}
                />
                <button
                  type="submit"
                  className="px-3 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg shrink-0 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Log</span>
                </button>
              </form>

              {/* Timeline items */}
              <div className="space-y-2 pt-1">
                {leadActivities.length > 0 ? (
                  leadActivities.map((act) => (
                    <div
                      key={act.id}
                      className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                        isLight ? 'bg-white border-sky-100' : 'bg-slate-800/60 border-slate-700'
                      }`}
                    >
                      <div className="p-1 rounded bg-sky-500/10 text-sky-500 mt-0.5 shrink-0">
                        <Clock className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-slate-700 dark:text-slate-200 leading-snug">
                          {act.description}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                          <span>by {act.author}</span>
                          <span className="tabular-nums">{act.timestamp}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-xs text-slate-400">
                    No activity logged yet. Use WhatsApp, Mail, Call, or log notes above.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
