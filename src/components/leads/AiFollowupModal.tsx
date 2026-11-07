import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Send,
  Copy,
  Check,
  RefreshCw,
  Mail,
  MessageSquare,
  Wand2,
  ExternalLink,
  Bot,
  Zap,
  Save,
  Bookmark,
} from 'lucide-react';
import { Lead } from '../../types/crm';
import { useTheme } from '../../context/ThemeContext';
import { useSystemCurrency } from '../../data/currencyService';
import { LeadMessageTemplate, DEFAULT_TEMPLATES } from './LeadActionModal';

interface AiFollowupModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
  onLogActivity: (leadId: string, description: string) => void;
}

type DraftTone = 'executive' | 'friendly' | 'urgent' | 'roi';
type ChannelType = 'email' | 'whatsapp';

const TEMPLATES_STORAGE_KEY = 'ozostack_lead_message_templates';

export const AiFollowupModal: React.FC<AiFollowupModalProps> = ({
  isOpen,
  onClose,
  lead,
  onLogActivity,
}) => {
  const { theme } = useTheme();
  const currency = useSystemCurrency();
  const isLight = theme === 'white-sky';

  const [tone, setTone] = useState<DraftTone>('executive');
  const [channel, setChannel] = useState<ChannelType>('email');
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Editable body & subject
  const [editedBody, setEditedBody] = useState('');
  const [editedSubject, setEditedSubject] = useState('');

  // Saving template state
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [newTemplateLabel, setNewTemplateLabel] = useState('');
  const [savedSuccessNotice, setSavedSuccessNotice] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setSavedSuccessNotice(msg);
    setTimeout(() => setSavedSuccessNotice(null), 2500);
  };

  const generateDraft = (targetLead: Lead, selectedTone: DraftTone, selectedChannel: ChannelType) => {
    const firstName = targetLead.name.split(' ')[0];

    if (selectedChannel === 'whatsapp') {
      if (selectedTone === 'executive') {
        return `Hi ${firstName}, Sayed here from OZO STACK. Regarding the ${targetLead.company} roadmap we discussed: our engineering leadership finalized the proposed architecture. Would you have 10 minutes for an executive review this Thursday or Friday?`;
      }
      if (selectedTone === 'friendly') {
        return `Hey ${firstName}! Hope you're having an awesome week. Loved our chat about ${targetLead.company}'s automation goals. I've got a quick update on the implementation timeline—ping me when you have a free moment!`;
      }
      if (selectedTone === 'urgent') {
        return `Hi ${firstName}, following up on our proposal for ${targetLead.company}. We are reserving Q2 engineering slots this week and want to ensure your implementation window is locked in. Can we touch base today?`;
      }
      return `Hi ${firstName}, quick insight for ${targetLead.company}: based on our discovery, the proposed AI automation setup is projected to save your team ~18 hrs/week. Let's schedule a 10-min sync to walk through the numbers.`;
    }

    // Email drafts
    if (selectedTone === 'executive') {
      return {
        subject: `OZO STACK Executive Briefing: Architecture & Next Steps for ${targetLead.company}`,
        body: `Dear ${firstName},

I hope this note finds you well.

Following our recent conversation regarding ${targetLead.company}'s digital transformation goals, our leadership team at OZO STACK has reviewed your requirements for the ${currency.symbol}${targetLead.value.toLocaleString()} project scope.

Key Highlights of Our Approach:
1. Turnkey AI & Workflow Integration designed specifically for ${targetLead.company}'s operational stack.
2. Enterprise SLA with dedicated lead engineer oversight.
3. Rapid 30-day MVP deployment milestone.

We have reserved time with our technical directors this week. Would Thursday at 10:00 AM or Friday at 2:00 PM work for a 20-minute executive briefing?

Best regards,

Sayed
Founder & CEO, OZO STACK
work.ozostack@gmail.com | ozostack.ai`,
      };
    }

    if (selectedTone === 'friendly') {
      return {
        subject: `Excited about our discussion! Next steps for ${targetLead.company}`,
        body: `Hi ${firstName},

Hope you're having a wonderful week!

It was fantastic connecting with you regarding ${targetLead.company}. I was really impressed by your vision for scaling your team's workflow and streamlining operations.

I put together a personalized deck that answers the technical questions your team brought up during our initial chat. You can review the breakdown at your convenience.

Let me know if you'd like to jump on a quick 10-minute call to bounce around ideas or refine the timeline!

Cheers,

Sayed
OZO STACK`,
      };
    }

    if (selectedTone === 'urgent') {
      return {
        subject: `Priority Window Closing: Implementation timeline for ${targetLead.company}`,
        body: `Hi ${firstName},

Quick follow-up on our proposal for ${targetLead.company}.

Our engineering sprints for next month are filling up rapidly, and I want to make sure we reserve your development cohort without postponing your projected go-live date.

Could we connect for 5–10 minutes today to confirm whether we should lock in your sprint window?

Best regards,

Sayed
OZO STACK`,
      };
    }

    return {
      subject: `Projected ROI & Cost-Efficiency Analysis for ${targetLead.company}`,
      body: `Hi ${firstName},

Following up on our discussions, we ran an operational impact model based on the ${targetLead.company} scope.

Key Projected Outcomes:
• Estimated 34% reduction in manual turnaround time within 60 days.
• Break-even ROI achieved by Month 3 based on your current volume.
• Scalable infrastructure supporting 5x client volume without expanding headcount.

Let's schedule a brief 15-minute call to inspect the financial model together and address any remaining questions before signoff.

Sincerely,

Sayed
OZO STACK`,
    };
  };

  // Sync draft on load or tone/channel change
  useEffect(() => {
    if (!isOpen || !lead) return;
    const result = generateDraft(lead, tone, channel);
    if (typeof result === 'string') {
      setEditedBody(result);
      setEditedSubject(`Update for ${lead.company}`);
    } else {
      setEditedBody(result.body);
      setEditedSubject(result.subject);
    }
  }, [isOpen, lead, tone, channel]);

  if (!isOpen || !lead) return null;

  const handleCopy = () => {
    const textToCopy =
      channel === 'email'
        ? `Subject: ${editedSubject}\n\n${editedBody}`
        : editedBody;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const result = generateDraft(lead, tone, channel);
      if (typeof result === 'string') {
        setEditedBody(result);
      } else {
        setEditedBody(result.body);
        setEditedSubject(result.subject);
      }
      setIsGenerating(false);
      showToast('Regenerated fresh AI draft!');
    }, 350);
  };

  const handleSaveDraftAsTemplate = () => {
    const label =
      newTemplateLabel.trim() ||
      `AI ${tone.charAt(0).toUpperCase() + tone.slice(1)} (${channel === 'whatsapp' ? 'WhatsApp' : 'Email'})`;

    let currentTemplates: LeadMessageTemplate[] = DEFAULT_TEMPLATES;
    try {
      const saved = localStorage.getItem(TEMPLATES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) currentTemplates = parsed;
      }
    } catch (e) {
      console.error(e);
    }

    const newTpl: LeadMessageTemplate = {
      id: `ai_${Date.now()}`,
      label,
      text: editedBody,
      subject: editedSubject,
      isCustom: true,
    };

    const updated = [newTpl, ...currentTemplates];
    try {
      localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }

    setIsSavingTemplate(false);
    setNewTemplateLabel('');
    showToast(`Saved "${label}" to Message Templates!`);
  };

  const handleSendViaEmail = () => {
    const mailto = `mailto:${lead.email}?subject=${encodeURIComponent(
      editedSubject
    )}&body=${encodeURIComponent(editedBody)}`;
    window.open(mailto, '_blank');
    onLogActivity(
      lead.id,
      `AI Follow-up email sent (${tone} tone): "${editedSubject}"`
    );
    onClose();
  };

  const handleSendViaWhatsApp = () => {
    const cleanNum = (lead.whatsapp || lead.phone).replace(/[^0-9]/g, '');
    const waUrl = `https://wa.me/${cleanNum}?text=${encodeURIComponent(editedBody)}`;
    window.open(waUrl, '_blank');
    onLogActivity(
      lead.id,
      `AI Follow-up WhatsApp sent (${tone} tone) to ${cleanNum}`
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs">
      <div
        className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden transition-all flex flex-col max-h-[92vh] ${
          isLight
            ? 'bg-white border-sky-100 text-slate-800'
            : 'bg-slate-900 border-slate-700 text-white'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-sky-100/30 bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-sky-400 to-indigo-600 text-white shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold flex items-center gap-2">
                <span>AI Follow-Up Assistant</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-600 dark:text-sky-300 uppercase">
                  Gemini Co-Pilot
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Personalized follow-up generation for {lead.name} · {lead.company}
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
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {/* Toast Notice */}
          {savedSuccessNotice && (
            <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
              <Check className="w-4 h-4" />
              <span>{savedSuccessNotice}</span>
            </div>
          )}

          {/* Lead Context Pill Strip */}
          <div
            className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-2 text-xs ${
              isLight ? 'bg-slate-50 border-sky-100' : 'bg-slate-800/60 border-slate-700'
            }`}
          >
            <div>
              <span className="font-bold">{lead.name}</span> ({lead.title}) at{' '}
              <span className="font-bold text-sky-500">{lead.company}</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span>
                Stage: <strong className="text-slate-700 dark:text-slate-200">{lead.status}</strong>
              </span>
              <span>·</span>
              <span>
                Value: <strong className="text-emerald-500">{currency.symbol}{lead.value.toLocaleString()}</strong>
              </span>
              <span>·</span>
              <span>
                Score: <strong className="text-sky-500">{lead.score}/100</strong>
              </span>
            </div>
          </div>

          {/* Controls: Channel & Tone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Channel Selection */}
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-500">
                Delivery Channel
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setChannel('email')}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    channel === 'email'
                      ? 'bg-sky-500 text-white border-sky-500 shadow-xs'
                      : isLight
                      ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email Pitch</span>
                </button>

                <button
                  type="button"
                  onClick={() => setChannel('whatsapp')}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    channel === 'whatsapp'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : isLight
                      ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp Message</span>
                </button>
              </div>
            </div>

            {/* Tone Selection */}
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-500">
                Strategic Tone
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'executive', label: '👔 Executive' },
                  { id: 'friendly', label: '🤝 Friendly' },
                  { id: 'urgent', label: '⚡ Urgent Close' },
                  { id: 'roi', label: '🎯 ROI & Metrics' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTone(t.id as DraftTone)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border text-center transition-all ${
                      tone === t.id
                        ? 'bg-indigo-600 text-white border-indigo-600 font-semibold'
                        : isLight
                        ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        : 'bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Generated Result Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <Wand2 className="w-3.5 h-3.5 text-sky-500" />
                <span>Generated Output (Fully Editable)</span>
              </label>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsSavingTemplate(!isSavingTemplate)}
                  className="text-xs text-indigo-500 hover:underline flex items-center gap-1 font-semibold"
                >
                  <Bookmark className="w-3 h-3" />
                  <span>{isSavingTemplate ? 'Cancel' : 'Save as Template'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleRegenerate}
                  className="text-xs text-sky-500 hover:underline flex items-center gap-1 font-medium"
                >
                  <RefreshCw className={`w-3 h-3 ${isGenerating ? 'animate-spin' : ''}`} />
                  <span>Regenerate</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="text-xs text-sky-500 hover:underline flex items-center gap-1 font-medium"
                >
                  {copied ? (
                    <Check className="w-3 h-3 text-emerald-500" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>{copied ? 'Copied!' : 'Copy Draft'}</span>
                </button>
              </div>
            </div>

            {/* Inline Save as Template Box */}
            {isSavingTemplate && (
              <div
                className={`p-3 rounded-xl border flex items-center gap-2 animate-fadeIn ${
                  isLight ? 'bg-indigo-50/70 border-indigo-200' : 'bg-slate-800 border-slate-700'
                }`}
              >
                <input
                  type="text"
                  value={newTemplateLabel}
                  onChange={(e) => setNewTemplateLabel(e.target.value)}
                  placeholder={`Template name (e.g. ${tone} ${channel})...`}
                  className={`flex-1 text-xs px-3 py-1.5 rounded-lg border outline-none ${
                    isLight
                      ? 'bg-white border-indigo-200 text-slate-800'
                      : 'bg-slate-900 border-slate-700 text-white'
                  }`}
                />
                <button
                  type="button"
                  onClick={handleSaveDraftAsTemplate}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-xs flex items-center gap-1"
                >
                  <Save className="w-3 h-3" />
                  <span>Save Template</span>
                </button>
              </div>
            )}

            {channel === 'email' && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-0.5">
                  Subject Line:
                </label>
                <input
                  type="text"
                  value={editedSubject}
                  onChange={(e) => setEditedSubject(e.target.value)}
                  className={`w-full p-2.5 rounded-lg border text-xs font-semibold outline-none transition-colors ${
                    isLight
                      ? 'bg-slate-50 border-sky-100 text-slate-800 focus:bg-white focus:border-sky-500'
                      : 'bg-slate-800/80 border-slate-700 text-slate-100 focus:bg-slate-850 focus:border-sky-400'
                  }`}
                />
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-0.5">
                Message Body:
              </label>
              <textarea
                rows={channel === 'email' ? 7 : 4}
                value={editedBody}
                onChange={(e) => setEditedBody(e.target.value)}
                className={`w-full text-xs p-3.5 rounded-xl border font-sans leading-relaxed outline-none transition-colors ${
                  isLight
                    ? 'bg-slate-50 border-sky-100 text-slate-800 focus:bg-white focus:border-sky-500'
                    : 'bg-slate-800/80 border-slate-700 text-slate-100 focus:bg-slate-850 focus:border-sky-400'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-sky-100/30">
          <button
            onClick={onClose}
            className={`px-4 py-2 text-xs font-medium rounded-lg ${
              isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                isLight
                  ? 'border-slate-300 text-slate-700 hover:bg-slate-50'
                  : 'border-slate-700 text-slate-200'
              }`}
            >
              Copy to Clipboard
            </button>

            {channel === 'email' ? (
              <button
                onClick={handleSendViaEmail}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow-sm shadow-sky-600/25 active:scale-95 transition-all"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Open in Email Client</span>
              </button>
            ) : (
              <button
                onClick={handleSendViaWhatsApp}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm shadow-emerald-600/25 active:scale-95 transition-all"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Open in WhatsApp</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
