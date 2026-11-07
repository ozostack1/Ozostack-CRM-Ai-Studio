import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Mail,
  MessageSquare,
  Sparkles,
  Tag,
  Copy,
  Check,
  Eye,
  Info,
} from 'lucide-react';
import {
  OutreachTemplate,
  TemplateChannel,
  TemplateCategory,
} from '../../types/template';
import { AVAILABLE_MERGE_VARIABLES, renderTemplateText } from '../../data/templateData';
import { useTheme } from '../../context/ThemeContext';

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: OutreachTemplate) => void;
  templateToEdit?: OutreachTemplate | null;
  defaultChannel?: TemplateChannel;
}

const CATEGORIES: TemplateCategory[] = [
  'Cold Outreach',
  'Follow-Up',
  'Meeting Booking',
  'Re-engagement',
  'Custom',
];

export const TemplateModal: React.FC<TemplateModalProps> = ({
  isOpen,
  onClose,
  onSave,
  templateToEdit,
  defaultChannel = 'email',
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'midnight';

  const [formData, setFormData] = useState<Partial<OutreachTemplate>>({
    name: '',
    channel: defaultChannel,
    category: 'Cold Outreach',
    subject: '',
    body: '',
    description: '',
    tags: ['Cold Outreach'],
  });

  const [tagsInput, setTagsInput] = useState('');
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    if (templateToEdit) {
      setFormData({
        ...templateToEdit,
      });
      setTagsInput((templateToEdit.tags || []).join(', '));
    } else {
      setFormData({
        name: '',
        channel: defaultChannel,
        category: 'Cold Outreach',
        subject: defaultChannel === 'email' ? 'Quick question regarding {{company}}' : '',
        body: '',
        description: '',
        tags: ['Cold Outreach'],
      });
      setTagsInput('Cold Outreach');
    }
  }, [templateToEdit, isOpen, defaultChannel]);

  if (!isOpen) return null;

  const insertVariable = (varKey: string, field: 'subject' | 'body' = 'body') => {
    if (field === 'subject') {
      setFormData((prev) => ({
        ...prev,
        subject: `${prev.subject || ''} ${varKey}`.trim(),
      }));
    } else {
      const textarea = bodyTextareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart || 0;
        const end = textarea.selectionEnd || 0;
        const text = formData.body || '';
        const updated = text.substring(0, start) + varKey + text.substring(end);
        setFormData((prev) => ({ ...prev, body: updated }));
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start + varKey.length, start + varKey.length);
        }, 10);
      } else {
        setFormData((prev) => ({
          ...prev,
          body: `${prev.body || ''} ${varKey}`.trim(),
        }));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      alert('Please enter a Template Name.');
      return;
    }
    if (!formData.body?.trim()) {
      alert('Please enter the message body.');
      return;
    }
    if (formData.channel === 'email' && !formData.subject?.trim()) {
      alert('Email templates require an Email Subject line.');
      return;
    }

    const tagsArr = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const saved: OutreachTemplate = {
      id: templateToEdit?.id || `tpl-${Date.now()}`,
      name: formData.name.trim(),
      channel: formData.channel || 'email',
      category: formData.category || 'Cold Outreach',
      subject: formData.channel === 'email' ? formData.subject?.trim() : undefined,
      body: formData.body.trim(),
      description: formData.description?.trim() || '',
      tags: tagsArr.length > 0 ? tagsArr : ['Outreach'],
      useCount: templateToEdit?.useCount || 0,
      responseRatePct: templateToEdit?.responseRatePct || 25,
      isSystem: templateToEdit?.isSystem || false,
      createdAt: templateToEdit?.createdAt || new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    onSave(saved);
    onClose();
  };

  // Sample render variables for preview
  const sampleData: Record<string, string> = {
    '{{first_name}}': 'Alex',
    '{{full_name}}': 'Alex Morgan',
    '{{company}}': 'Acme Cloud Technologies',
    '{{job_title}}': 'VP of Engineering',
    '{{industry}}': 'B2B Enterprise SaaS',
    '{{my_name}}': 'Sayed',
    '{{my_company}}': 'Ozostack',
    '{{meeting_link}}': 'https://ozostack.io/meet',
  };

  const previewSubject = renderTemplateText(formData.subject || '', sampleData);
  const previewBody = renderTemplateText(formData.body || '', sampleData);

  const inputCls = `w-full text-xs px-3 py-2 rounded-xl border outline-none font-medium transition-colors ${
    isDark
      ? 'bg-slate-800 border-slate-700 text-white focus:border-sky-400'
      : 'bg-slate-50 border-sky-200 text-slate-800 focus:border-sky-500 focus:bg-white'
  }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div
        className={`w-full max-w-3xl rounded-2xl border shadow-2xl overflow-hidden transition-all max-h-[92vh] flex flex-col ${
          isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-sky-100 text-slate-800'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl ${
                formData.channel === 'whatsapp'
                  ? 'bg-emerald-500/10 text-emerald-500'
                  : 'bg-sky-500/10 text-sky-500'
              }`}
            >
              {formData.channel === 'whatsapp' ? (
                <MessageSquare className="w-5 h-5" />
              ) : (
                <Mail className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="text-base font-bold">
                {templateToEdit
                  ? `Edit ${formData.channel === 'whatsapp' ? 'WhatsApp' : 'Email'} Template`
                  : `Create ${formData.channel === 'whatsapp' ? 'WhatsApp' : 'Email'} Template`}
              </h2>
              <p className="text-xs text-slate-400">
                Cold lead outreach, dynamic merge tags & high-converting messaging
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

        {/* Tab switch between Editor and Live Preview */}
        <div className="flex items-center justify-between px-6 py-2.5 bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('editor')}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                activeTab === 'editor'
                  ? 'bg-sky-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Template Editor
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'preview'
                  ? 'bg-sky-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Sample Preview</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-400 font-mono">
            {formData.body?.length || 0} characters &bull; ~{Math.ceil((formData.body?.length || 0) / 160)} segment(s)
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === 'editor' ? (
            <>
              {/* Row 1: Channel Selector & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                <div className="sm:col-span-6">
                  <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                    Channel *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, channel: 'email' })}
                      className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                        formData.channel === 'email'
                          ? 'border-sky-500 bg-sky-500/10 text-sky-600 dark:text-sky-400 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Mail className="w-4 h-4" />
                      <span>Email Template</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, channel: 'whatsapp' })}
                      className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                        formData.channel === 'whatsapp'
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>WhatsApp Template</span>
                    </button>
                  </div>
                </div>

                <div className="sm:col-span-6">
                  <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                    Outreach Category
                  </label>
                  <select
                    value={formData.category || 'Cold Outreach'}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value as TemplateCategory })
                    }
                    className={inputCls}
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Template Name */}
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                  Template Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Cold Outreach: 15-Hour Operational Bottleneck Hook"
                  className={inputCls}
                />
              </div>

              {/* Row 3: Email Subject Line (Conditional for Email) */}
              {formData.channel === 'email' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Email Subject Line *
                    </label>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <span>Insert tag into subject:</span>
                      <button
                        type="button"
                        onClick={() => insertVariable('{{company}}', 'subject')}
                        className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-sky-600 font-mono hover:bg-sky-50 transition-colors"
                      >
                        company
                      </button>
                      <button
                        type="button"
                        onClick={() => insertVariable('{{first_name}}', 'subject')}
                        className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-sky-600 font-mono hover:bg-sky-50 transition-colors"
                      >
                        first_name
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.subject || ''}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="e.g. Quick question regarding {{company}}'s workflow automation"
                    className={inputCls}
                  />
                </div>
              )}

              {/* Dynamic Merge Variables Ribbon */}
              <div className="p-3 rounded-xl border border-sky-200/60 dark:border-slate-800 bg-sky-50/30 dark:bg-slate-800/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-sky-500" />
                    <span>Click to insert dynamic lead variable:</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Replaced automatically on send</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {AVAILABLE_MERGE_VARIABLES.map((v) => (
                    <button
                      key={v.key}
                      type="button"
                      onClick={() => insertVariable(v.key, 'body')}
                      title={`Insert ${v.label} (sample: "${v.sampleValue}")`}
                      className="px-2 py-1 rounded-lg text-[11px] font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sky-700 dark:text-sky-300 hover:border-sky-400 hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors shadow-2xs"
                    >
                      {v.key}
                    </button>
                  ))}
                </div>
              </div>

              {/* Row 4: Message Body */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Message Body *
                  </label>
                  {formData.channel === 'whatsapp' && (
                    <div className="text-[11px] text-slate-400">
                      WhatsApp formatting: <span className="font-mono text-emerald-500">*bold*</span>,{' '}
                      <span className="font-mono text-emerald-500">_italic_</span>
                    </div>
                  )}
                </div>
                <textarea
                  ref={bodyTextareaRef}
                  rows={formData.channel === 'whatsapp' ? 6 : 9}
                  required
                  value={formData.body || ''}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  placeholder={
                    formData.channel === 'whatsapp'
                      ? 'Hi {{first_name}}! 👋 This is {{my_name}} from *{{my_company}}*...\n\nThought this might be timely for {{company}}—would you be open to a quick call?'
                      : 'Hi {{first_name}},\n\nI noticed {{company}} has been expanding operations recently...\n\nBest,\n{{my_name}}'
                  }
                  className={`${inputCls} font-mono leading-relaxed`}
                />
              </div>

              {/* Row 5: Internal Description & Tags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                    Internal Notes / Campaign Purpose
                  </label>
                  <input
                    type="text"
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="e.g. Best for cold VP of Engineering leads in B2B SaaS"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="e.g. Cold Pitch, Executive, Pain Point"
                    className={inputCls}
                  />
                </div>
              </div>
            </>
          ) : (
            /* PREVIEW TAB */
            <div className="space-y-4">
              <div className="p-3 rounded-xl border border-amber-200/60 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0 text-amber-500" />
                <span>
                  Below is how this message will read when sent to a sample lead (
                  <strong>Alex Morgan</strong> at <strong>Acme Cloud Technologies</strong>).
                </span>
              </div>

              {formData.channel === 'email' ? (
                /* Email Client Mock */
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
                  <div className="px-4 py-3 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-medium w-16">To:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        Alex Morgan &lt;alex@acmecloud.io&gt;
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-medium w-16">Subject:</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {previewSubject || '(No subject line)'}
                      </span>
                    </div>
                  </div>
                  <div className="p-5 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 font-sans leading-relaxed whitespace-pre-wrap">
                    {previewBody || <span className="text-slate-400 italic">No message body yet.</span>}
                  </div>
                </div>
              ) : (
                /* WhatsApp Chat Mock */
                <div className="max-w-md mx-auto rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-md">
                  <div className="px-4 py-3 bg-emerald-600 text-white text-xs flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold">
                      AM
                    </div>
                    <div>
                      <div className="font-bold">Alex Morgan (Acme Cloud)</div>
                      <div className="text-[10px] text-emerald-100">online &bull; +1 (555) 349-2018</div>
                    </div>
                  </div>
                  <div className="p-4 bg-[#e5ddd5] dark:bg-slate-950 min-h-[220px] flex flex-col justify-end">
                    <div className="self-end max-w-[85%] bg-[#d9fdd3] dark:bg-emerald-950 text-slate-900 dark:text-emerald-100 p-3 rounded-2xl rounded-tr-xs shadow-xs text-xs whitespace-pre-wrap leading-relaxed">
                      {previewBody || <span className="text-slate-400 italic">Type a WhatsApp message to see preview...</span>}
                      <div className="text-[9px] text-slate-400 text-right mt-1 font-mono">10:42 AM &bull; ✓✓</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 text-xs font-medium rounded-xl transition-colors ${
                isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-sky-500 hover:bg-sky-600 rounded-xl shadow-sm shadow-sky-500/25 active:scale-95 transition-all"
            >
              {templateToEdit ? 'Save Changes' : 'Create Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

