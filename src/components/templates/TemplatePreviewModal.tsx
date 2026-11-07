import React, { useState, useMemo } from 'react';
import {
  X,
  Mail,
  MessageSquare,
  Copy,
  Check,
  ExternalLink,
  User,
  Building,
  Send,
  Sparkles,
} from 'lucide-react';
import { OutreachTemplate } from '../../types/template';
import { renderTemplateText } from '../../data/templateData';
import { INITIAL_LEADS } from '../../data/mockData';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

interface TemplatePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: OutreachTemplate | null;
  onUsed?: (templateId: string) => void;
}

export const TemplatePreviewModal: React.FC<TemplatePreviewModalProps> = ({
  isOpen,
  onClose,
  template,
  onUsed,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'midnight';
  const { currentUser } = useAuth();

  // Load leads from localStorage with fallback
  const leadsList = useMemo(() => {
    try {
      const raw = localStorage.getItem('ozostack_leads_v2');
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      /* fallback */
    }
    return INITIAL_LEADS;
  }, []);

  const [selectedLeadId, setSelectedLeadId] = useState<string>(
    leadsList[0]?.id || 'lead-1'
  );
  const [copiedText, setCopiedText] = useState(false);
  const [copiedSubject, setCopiedSubject] = useState(false);

  const selectedLead = useMemo(() => {
    return leadsList.find((l) => l.id === selectedLeadId) || leadsList[0];
  }, [leadsList, selectedLeadId]);

  if (!isOpen || !template) return null;

  // Compute live merge variables from selected lead
  const firstName = selectedLead?.name?.trim()?.split(' ')[0] || 'Alex';
  const variablesMap: Record<string, string> = {
    '{{first_name}}': firstName,
    '{{full_name}}': selectedLead?.name || 'Alex Morgan',
    '{{company}}': selectedLead?.company || 'Acme Cloud',
    '{{job_title}}': selectedLead?.title || 'VP of Engineering',
    '{{industry}}': 'B2B Enterprise SaaS',
    '{{my_name}}': currentUser?.name || 'Sayed',
    '{{my_company}}': 'Ozostack',
    '{{meeting_link}}': 'https://ozostack.io/meet',
  };

  const renderedSubject = template.subject
    ? renderTemplateText(template.subject, variablesMap)
    : '';
  const renderedBody = renderTemplateText(template.body, variablesMap);

  const handleCopyBody = () => {
    navigator.clipboard.writeText(renderedBody);
    setCopiedText(true);
    if (onUsed) onUsed(template.id);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleCopySubject = () => {
    navigator.clipboard.writeText(renderedSubject);
    setCopiedSubject(true);
    setTimeout(() => setCopiedSubject(false), 2000);
  };

  const handleLaunchExternal = () => {
    if (onUsed) onUsed(template.id);

    if (template.channel === 'whatsapp') {
      const cleanPhone = (selectedLead?.whatsapp || selectedLead?.phone || '')
        .replace(/[^0-9]/g, '');
      const encodedMsg = encodeURIComponent(renderedBody);
      const url = cleanPhone
        ? `https://wa.me/${cleanPhone}?text=${encodedMsg}`
        : `https://wa.me/?text=${encodedMsg}`;
      window.open(url, '_blank');
    } else {
      const toEmail = selectedLead?.email || '';
      const encodedSub = encodeURIComponent(renderedSubject);
      const encodedBody = encodeURIComponent(renderedBody);
      const mailtoUrl = `mailto:${toEmail}?subject=${encodedSub}&body=${encodedBody}`;
      window.location.href = mailtoUrl;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div
        className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden transition-all max-h-[92vh] flex flex-col ${
          isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-sky-100 text-slate-800'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl ${
                template.channel === 'whatsapp'
                  ? 'bg-emerald-500/10 text-emerald-500'
                  : 'bg-sky-500/10 text-sky-500'
              }`}
            >
              {template.channel === 'whatsapp' ? (
                <MessageSquare className="w-5 h-5" />
              ) : (
                <Mail className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold">{template.name}</h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {template.category}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Personalized lead outreach preview & 1-click dispatch
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

        {/* Lead Selector Bar */}
        <div className="p-4 bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-sky-500 shrink-0" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Personalize for CRM Lead:
            </span>
          </div>

          <select
            value={selectedLeadId}
            onChange={(e) => setSelectedLeadId(e.target.value)}
            className={`text-xs px-3 py-1.5 rounded-xl border outline-none font-medium max-w-xs transition-colors ${
              isDark
                ? 'bg-slate-900 border-slate-700 text-white'
                : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            {leadsList.map((lead) => (
              <option key={lead.id} value={lead.id}>
                {lead.name} — {lead.company} ({lead.title})
              </option>
            ))}
          </select>
        </div>

        {/* Message Rendering Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Target Lead Quick Summary Tag */}
          {selectedLead && (
            <div className="flex flex-wrap items-center gap-2 text-[11px] p-2.5 rounded-xl bg-sky-50/40 dark:bg-slate-800/60 border border-sky-100 dark:border-slate-700 text-slate-600 dark:text-slate-300">
              <span className="font-semibold text-slate-900 dark:text-white">
                Target: {selectedLead.name}
              </span>
              <span>&bull;</span>
              <span>{selectedLead.title}</span>
              <span>&bull;</span>
              <span>{selectedLead.company}</span>
              {template.channel === 'whatsapp' ? (
                <>
                  <span>&bull;</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">
                    WA: {selectedLead.whatsapp || selectedLead.phone || 'No phone'}
                  </span>
                </>
              ) : (
                <>
                  <span>&bull;</span>
                  <span className="font-mono text-sky-600 dark:text-sky-400">
                    Email: {selectedLead.email}
                  </span>
                </>
              )}
            </div>
          )}

          {/* Email Subject Block */}
          {template.channel === 'email' && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                <span>Rendered Email Subject:</span>
                <button
                  onClick={handleCopySubject}
                  className="text-[11px] text-sky-600 hover:text-sky-700 flex items-center gap-1 font-medium"
                >
                  {copiedSubject ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedSubject ? 'Copied Subject' : 'Copy Subject'}</span>
                </button>
              </div>
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-xs font-bold text-slate-900 dark:text-white">
                {renderedSubject}
              </div>
            </div>
          )}

          {/* Body Block */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
              <span>Personalized Message Copy:</span>
              <button
                onClick={handleCopyBody}
                className="text-[11px] text-sky-600 hover:text-sky-700 flex items-center gap-1 font-medium"
              >
                {copiedText ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>{copiedText ? 'Copied Message' : 'Copy Message'}</span>
              </button>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed font-sans">
              {renderedBody}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/20">
          <button
            onClick={handleCopyBody}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs"
          >
            {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedText ? 'Copied to Clipboard!' : 'Copy to Clipboard'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className={`px-3.5 py-2 text-xs font-medium rounded-xl transition-colors ${
                isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Close
            </button>
            <button
              onClick={handleLaunchExternal}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl text-white shadow-xs transition-all active:scale-95 ${
                template.channel === 'whatsapp'
                  ? 'bg-emerald-600 hover:bg-emerald-500'
                  : 'bg-sky-500 hover:bg-sky-600'
              }`}
            >
              <span>
                {template.channel === 'whatsapp' ? 'Open in WhatsApp Web' : 'Open in Email Client'}
              </span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

