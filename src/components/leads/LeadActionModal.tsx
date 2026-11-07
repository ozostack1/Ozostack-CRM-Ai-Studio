import React, { useState, useEffect } from 'react';
import {
  X,
  Send,
  Phone,
  Mail,
  MessageSquare,
  ExternalLink,
  Check,
  Copy,
  Clock,
  Plus,
  Bookmark,
  Trash2,
  Edit3,
  Sparkles,
  Save,
} from 'lucide-react';
import { Lead, LeadStatus } from '../../types/crm';
import { useTheme } from '../../context/ThemeContext';
import { useSystemCurrency } from '../../data/currencyService';

export type ContactActionType = 'whatsapp' | 'email' | 'call';

export interface LeadMessageTemplate {
  id: string;
  label: string;
  subject?: string;
  text: string;
  isCustom?: boolean;
  stageTrigger?: string;
}

const TEMPLATES_STORAGE_KEY = 'ozostack_lead_message_templates';

export const DEFAULT_TEMPLATES: LeadMessageTemplate[] = [
  {
    id: 'stage_proposal',
    label: 'Proposal Sent',
    stageTrigger: 'Proposal Sent',
    subject: 'OZO STACK - Proposal and Scope Overview for {company}',
    text: 'Hi {firstName}, following up regarding our discussion at OZO STACK. We prepared the scope and proposal for {company}. Do you have 10 minutes today or tomorrow for a quick review?',
  },
  {
    id: 'stage_contacted',
    label: 'Contacted Follow-up',
    stageTrigger: 'Contacted',
    subject: 'Great connecting today - OZO STACK & {company}',
    text: 'Hi {firstName}, thanks for connecting with OZO STACK today! It was great speaking with you about {company}. As discussed, I am preparing your implementation roadmap. Let me know if you have any questions!',
  },
  {
    id: 'stage_followup',
    label: 'General Follow-up',
    stageTrigger: 'Follow-up',
    subject: 'Checking in regarding {company} & OZO STACK',
    text: 'Hi {firstName}, checking in regarding {company}. Did you get a chance to review our notes? Happy to answer any questions before our next step!',
  },
  {
    id: 'stage_qualified',
    label: 'Qualified Next Steps',
    stageTrigger: 'Qualified',
    subject: 'Next steps for {company} integration - OZO STACK',
    text: 'Hi {firstName}, great news! Based on our technical assessment, {company} is an ideal fit for our solution. Let\'s schedule a 15-minute sync to finalize specifications.',
  },
  {
    id: 'stage_negotiation',
    label: 'Negotiation Terms',
    stageTrigger: 'Negotiation',
    subject: 'Agreement & Terms review for {company}',
    text: 'Hi {firstName}, following up regarding the terms and scope for {company}. Let\'s address any questions so we can finalize the agreement and lock in your onboarding slot.',
  },
  {
    id: 'stage_won',
    label: 'Welcome / Deal Won',
    stageTrigger: 'Won',
    subject: 'Welcome to OZO STACK, {company}!',
    text: 'Hi {firstName}, welcome to OZO STACK! 🚀 Thrilled to partner with {company}. Our engineering team is preparing your kickoff onboarding schedule. We\'ll share the setup roadmap shortly!',
  },
  {
    id: 'intro_discovery',
    label: 'Intro & Discovery',
    subject: 'Introduction: OZO STACK & {company}',
    text: 'Hi {firstName}, thanks for connecting with OZO STACK. I would love to learn more about {company}\'s current automation and CRM goals. When would be a great time for a brief call this week?',
  },
  {
    id: 'quick_checkin',
    label: 'Quick Check-in',
    subject: 'Quick check-in from Sayed at OZO STACK',
    text: 'Hi {firstName}, hope you are having a productive week! Just checking in to see if you had any questions regarding the roadmap we discussed. Best regards!',
  },
];

interface LeadActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
  actionType: ContactActionType;
  onLogActivity?: (leadId: string, description: string) => void;
  initialStageTrigger?: LeadStatus | string;
  initialMessage?: string;
}

export const LeadActionModal: React.FC<LeadActionModalProps> = ({
  isOpen,
  onClose,
  lead,
  actionType,
  onLogActivity,
  initialStageTrigger,
  initialMessage,
}) => {
  const { theme } = useTheme();
  const currency = useSystemCurrency();
  const isLight = theme === 'white-sky';

  const [copied, setCopied] = useState(false);
  const [callOutcome, setCallOutcome] = useState('Connected - Productive Discussion');
  const [customMessage, setCustomMessage] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('stage_proposal');
  const [emailSubject, setEmailSubject] = useState('');

  // Custom Templates Storage
  const [templates, setTemplates] = useState<LeadMessageTemplate[]>(() => {
    try {
      const saved = localStorage.getItem(TEMPLATES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load message templates', e);
    }
    return DEFAULT_TEMPLATES;
  });

  // State for creating / saving new template
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [newTemplateLabel, setNewTemplateLabel] = useState('');
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastNotice(msg);
    setTimeout(() => setToastNotice(null), 2500);
  };

  const replacePlaceholders = (raw: string, targetLead: Lead) => {
    const fName = targetLead.name.split(' ')[0];
    return raw
      .replace(/\{firstName\}/g, fName)
      .replace(/\{name\}/g, targetLead.name)
      .replace(/\{company\}/g, targetLead.company)
      .replace(/\{title\}/g, targetLead.title || 'Decision Maker')
      .replace(/\{value\}/g, `${currency.symbol}${targetLead.value.toLocaleString()}`)
      .replace(/\{status\}/g, targetLead.status)
      .replace(/\{stage\}/g, targetLead.status)
      .replace(/\{owner\}/g, targetLead.owner || 'Sayed');
  };

  // Synchronize on modal open or stage trigger change
  useEffect(() => {
    if (!isOpen || !lead) return;

    if (initialMessage) {
      setCustomMessage(initialMessage);
      return;
    }

    // Check if initialStageTrigger matches a template
    if (initialStageTrigger) {
      const match = templates.find(
        (t) => t.stageTrigger?.toLowerCase() === initialStageTrigger.toLowerCase()
      );
      if (match) {
        setSelectedTemplateId(match.id);
        setCustomMessage(replacePlaceholders(match.text, lead));
        setEmailSubject(replacePlaceholders(match.subject || `Update for ${lead.company}`, lead));
        return;
      }
    }

    // Default to first template or current selected
    const active = templates.find((t) => t.id === selectedTemplateId) || templates[0];
    if (active) {
      setSelectedTemplateId(active.id);
      setCustomMessage(replacePlaceholders(active.text, lead));
      setEmailSubject(replacePlaceholders(active.subject || `Update for ${lead.company}`, lead));
    }
  }, [isOpen, lead, initialStageTrigger, initialMessage]);

  if (!isOpen || !lead) return null;

  const currentTemplate = templates.find((t) => t.id === selectedTemplateId) || templates[0];
  const cleanWhatsappNumber = (lead.whatsapp || lead.phone).replace(/[^0-9]/g, '');

  const handleSelectTemplate = (tpl: LeadMessageTemplate) => {
    setSelectedTemplateId(tpl.id);
    const populated = replacePlaceholders(tpl.text, lead);
    setCustomMessage(populated);
    if (tpl.subject) {
      setEmailSubject(replacePlaceholders(tpl.subject, lead));
    }
  };

  const handleInsertTag = (tag: string) => {
    setCustomMessage((prev) => prev + ` ${tag}`);
  };

  const handleSaveAsNewTemplate = () => {
    if (!newTemplateLabel.trim()) return;
    const newTpl: LeadMessageTemplate = {
      id: `custom_${Date.now()}`,
      label: newTemplateLabel.trim(),
      text: customMessage,
      subject: emailSubject || `Update for {company}`,
      isCustom: true,
    };

    const updated = [newTpl, ...templates];
    setTemplates(updated);
    try {
      localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    setSelectedTemplateId(newTpl.id);
    setIsSavingTemplate(false);
    setNewTemplateLabel('');
    showToast(`Template "${newTpl.label}" saved successfully!`);
  };

  const handleUpdateCurrentTemplate = () => {
    if (!currentTemplate) return;
    const updated = templates.map((t) =>
      t.id === currentTemplate.id
        ? {
            ...t,
            text: customMessage,
            subject: emailSubject,
            isCustom: true,
          }
        : t
    );
    setTemplates(updated);
    try {
      localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    showToast(`Template "${currentTemplate.label}" updated!`);
  };

  const handleDeleteTemplate = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = templates.filter((t) => t.id !== id);
    setTemplates(updated);
    try {
      localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    if (selectedTemplateId === id && updated.length > 0) {
      setSelectedTemplateId(updated[0].id);
      setCustomMessage(replacePlaceholders(updated[0].text, lead));
    }
    showToast('Template deleted.');
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExecuteAction = () => {
    if (actionType === 'whatsapp') {
      const waUrl = `https://wa.me/${cleanWhatsappNumber}?text=${encodeURIComponent(customMessage)}`;
      window.open(waUrl, '_blank');
      onLogActivity?.(lead.id, `Sent WhatsApp message: "${customMessage.slice(0, 70)}..."`);
    } else if (actionType === 'email') {
      const mailtoUrl = `mailto:${lead.email}?subject=${encodeURIComponent(
        emailSubject || `OZO STACK - ${lead.company}`
      )}&body=${encodeURIComponent(customMessage)}`;
      window.open(mailtoUrl, '_blank');
      onLogActivity?.(lead.id, `Sent Email: "${emailSubject}"`);
    } else if (actionType === 'call') {
      const telUrl = `tel:${lead.phone.replace(/[^0-9+]/g, '')}`;
      window.location.href = telUrl;
      onLogActivity?.(
        lead.id,
        `Placed Call to ${lead.name} (${lead.phone}) - Outcome: ${callOutcome}`
      );
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs">
      <div
        className={`w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden transition-all flex flex-col max-h-[92vh] ${
          isLight
            ? 'bg-white border-sky-100 text-slate-800'
            : 'bg-slate-900 border-slate-700 text-white'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-sky-100/30">
          <div className="flex items-center gap-2.5">
            {actionType === 'whatsapp' && (
              <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-500 shadow-xs">
                <MessageSquare className="w-5 h-5" />
              </div>
            )}
            {actionType === 'email' && (
              <div className="p-2.5 rounded-xl bg-sky-500/15 text-sky-500 shadow-xs">
                <Mail className="w-5 h-5" />
              </div>
            )}
            {actionType === 'call' && (
              <div className="p-2.5 rounded-xl bg-indigo-500/15 text-indigo-500 shadow-xs">
                <Phone className="w-5 h-5" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold leading-tight">
                  {actionType === 'whatsapp' && 'Send WhatsApp Follow-up'}
                  {actionType === 'email' && 'Send Direct Email'}
                  {actionType === 'call' && 'Direct Phone Call'}
                </h2>
                {initialStageTrigger && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Stage: {initialStageTrigger}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Contacting {lead.name} · {lead.company}
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Target recipient details */}
          <div
            className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
              isLight ? 'bg-slate-50 border-sky-100' : 'bg-slate-800/60 border-slate-700'
            }`}
          >
            <div>
              <div className="font-bold">{lead.name}</div>
              <div className="text-[11px] text-slate-400">
                {lead.title} · <span className="font-semibold text-sky-500">{lead.company}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="font-semibold text-sky-500 tabular-nums">
                {actionType === 'whatsapp'
                  ? lead.whatsapp || lead.phone
                  : actionType === 'email'
                  ? lead.email
                  : lead.phone}
              </span>
            </div>
          </div>

          {/* Quick Toast feedback inside modal */}
          {toastNotice && (
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
              <Check className="w-3.5 h-3.5" />
              <span>{toastNotice}</span>
            </div>
          )}

          {/* Templates Section (WhatsApp & Email) */}
          {(actionType === 'whatsapp' || actionType === 'email') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <Bookmark className="w-3.5 h-3.5 text-sky-500" />
                  <span>Choose or Edit Message Template</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsSavingTemplate(!isSavingTemplate)}
                  className="text-xs text-sky-500 hover:underline font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>{isSavingTemplate ? 'Cancel' : '+ New Template'}</span>
                </button>
              </div>

              {/* Template Pills Selection */}
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                {templates.map((tpl) => (
                  <div
                    key={tpl.id}
                    onClick={() => handleSelectTemplate(tpl)}
                    className={`group px-2.5 py-1 text-xs rounded-lg border font-medium cursor-pointer transition-colors flex items-center gap-1.5 ${
                      selectedTemplateId === tpl.id
                        ? 'bg-sky-500 text-white border-sky-500 shadow-xs'
                        : isLight
                        ? 'bg-white border-slate-200 text-slate-700 hover:bg-sky-50 hover:border-sky-200'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                    }`}
                  >
                    <span>{tpl.label}</span>
                    {tpl.isCustom && (
                      <button
                        type="button"
                        onClick={(e) => handleDeleteTemplate(e, tpl.id)}
                        className="opacity-0 group-hover:opacity-100 hover:text-rose-300 p-0.5 rounded transition-opacity"
                        title="Delete custom template"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Save New Template Form Drawer */}
              {isSavingTemplate && (
                <div
                  className={`p-3 rounded-xl border space-y-2 animate-fadeIn ${
                    isLight ? 'bg-sky-50/60 border-sky-200' : 'bg-slate-800/80 border-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold text-sky-600 dark:text-sky-400">
                    Save current message as custom template:
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newTemplateLabel}
                      onChange={(e) => setNewTemplateLabel(e.target.value)}
                      placeholder="e.g. Enterprise WhatsApp Pitch, 3-Day Followup..."
                      className={`flex-1 text-xs px-3 py-1.5 rounded-lg border outline-none ${
                        isLight
                          ? 'bg-white border-sky-200 text-slate-800 focus:border-sky-500'
                          : 'bg-slate-900 border-slate-700 text-white focus:border-sky-400'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={handleSaveAsNewTemplate}
                      disabled={!newTemplateLabel.trim()}
                      className="px-3 py-1.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 disabled:opacity-50 rounded-lg shadow-xs flex items-center gap-1 shrink-0"
                    >
                      <Save className="w-3 h-3" />
                      <span>Save</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Email Subject Line (If Email) */}
              {actionType === 'email' && (
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-500">
                    Subject Line
                  </label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className={`w-full text-xs px-3 py-2 rounded-lg border outline-none ${
                      isLight
                        ? 'bg-slate-50 border-sky-200 text-slate-800 focus:border-sky-500'
                        : 'bg-slate-800 border-slate-700 text-white focus:border-sky-400'
                    }`}
                  />
                </div>
              )}

              {/* Editable Message Textarea */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                    <span>Message Text (Fully Editable)</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleUpdateCurrentTemplate}
                      className="text-[11px] text-indigo-500 hover:underline flex items-center gap-1 font-semibold"
                      title="Save updates to this template"
                    >
                      <Save className="w-3 h-3" />
                      <span>Update Template</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy(customMessage)}
                      className="text-[11px] text-sky-500 hover:underline flex items-center gap-1 font-medium"
                    >
                      {copied ? (
                        <Check className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <textarea
                  rows={actionType === 'email' ? 7 : 5}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className={`w-full text-xs p-3 rounded-xl border outline-none leading-relaxed transition-colors ${
                    isLight
                      ? 'bg-slate-50 border-sky-200 text-slate-800 focus:border-sky-500 focus:bg-white'
                      : 'bg-slate-800 border-slate-700 text-white focus:border-sky-400 focus:bg-slate-800/90'
                  }`}
                  placeholder="Type or customize your message here..."
                />

                {/* Quick Insert Variable Badges */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">
                    Insert:
                  </span>
                  {[
                    { label: '{firstName}', value: '{firstName}' },
                    { label: '{company}', value: '{company}' },
                    { label: '{value}', value: '{value}' },
                    { label: '{stage}', value: '{stage}' },
                  ].map((badge) => (
                    <button
                      key={badge.label}
                      type="button"
                      onClick={() => handleInsertTag(badge.value)}
                      className={`text-[10px] px-2 py-0.5 rounded border font-mono transition-colors ${
                        isLight
                          ? 'border-sky-200 bg-sky-50/70 text-sky-700 hover:bg-sky-100'
                          : 'border-slate-700 bg-slate-800 text-sky-400 hover:bg-slate-750'
                      }`}
                    >
                      +{badge.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* If Call Action */}
          {actionType === 'call' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-500">
                  Call Outcome / Result (Logged to Lead Activity)
                </label>
                <select
                  value={callOutcome}
                  onChange={(e) => setCallOutcome(e.target.value)}
                  className={`w-full text-xs px-3 py-2 rounded-lg border outline-none font-medium ${
                    isLight
                      ? 'bg-slate-50 border-sky-200 text-slate-800'
                      : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                >
                  <option value="Connected - Productive Discussion">
                    Connected - Productive Discussion
                  </option>
                  <option value="Scheduled Follow-up Meeting">Scheduled Follow-up Meeting</option>
                  <option value="Left Voicemail">Left Voicemail</option>
                  <option value="No Answer / Retry Later">No Answer / Retry Later</option>
                  <option value="Gatekeeper / Need Direct Extension">
                    Gatekeeper / Need Direct Extension
                  </option>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-xs text-sky-700 dark:text-sky-300">
                <span className="font-bold">Pro-tip:</span> Clicking "Place Call & Log" opens your telephony client for <strong>{lead.phone}</strong> and automatically writes an activity log.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-sky-100/30">
          <button
            onClick={onClose}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors ${
              isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleExecuteAction}
            className={`px-5 py-2 text-xs font-semibold text-white rounded-lg shadow-sm flex items-center gap-1.5 active:scale-95 transition-all ${
              actionType === 'whatsapp'
                ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/25'
                : actionType === 'email'
                ? 'bg-sky-600 hover:bg-sky-500 shadow-sky-600/25'
                : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/25'
            }`}
          >
            {actionType === 'whatsapp' && (
              <>
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in WhatsApp</span>
              </>
            )}
            {actionType === 'email' && (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Send Email</span>
              </>
            )}
            {actionType === 'call' && (
              <>
                <Phone className="w-3.5 h-3.5" />
                <span>Place Call & Log</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
