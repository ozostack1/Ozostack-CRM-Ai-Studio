import React, { useState, useMemo } from 'react';
import {
  Plus,
  Copy,
  Check,
  Trash2,
  ExternalLink,
  Code2,
  Link2,
  Eye,
  Sparkles,
  Sliders,
  CheckSquare,
  Square,
  ArrowRight,
  Palette,
  Tag,
  Layers,
  UserCheck,
} from 'lucide-react';
import {
  useCrmConfig,
  LeadCaptureFormConfig,
  DEFAULT_FORM_FIELDS,
  StandardLeadFieldKey,
} from '../../data/crmConfig';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { PublicLeadFormCard } from '../leads/PublicLeadFormView';
import { Lead, LeadPriority } from '../../types/crm';

interface LeadFormBuilderSectionProps {
  onNotify: (msg: string) => void;
}

export const LeadFormBuilderSection: React.FC<LeadFormBuilderSectionProps> = ({
  onNotify,
}) => {
  const { theme, setActiveNav } = useTheme();
  const isLight = theme === 'white-sky';
  const { users, logAudit } = useAuth();
  const { config, updateConfig } = useCrmConfig();

  const [selectedFormId, setSelectedFormId] = useState<string>(
    config.leadForms[0]?.id || 'form-website-main'
  );
  const [copiedType, setCopiedType] = useState<'link' | 'embed' | null>(null);
  const [lastCapturedLead, setLastCapturedLead] = useState<Lead | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'design' | 'fields' | 'embed'>('design');

  const selectedForm = useMemo(
    () =>
      config.leadForms.find((f) => f.id === selectedFormId) ||
      config.leadForms[0],
    [config.leadForms, selectedFormId]
  );

  const leadCustomFields = useMemo(
    () =>
      config.customFields.filter(
        (cf) => cf.entity === 'Lead' || cf.entity === 'Both'
      ),
    [config.customFields]
  );

  const ownersList = useMemo(
    () =>
      Array.from(
        new Set([
          ...users.map((u) => u.name),
          'Sayed',
          'Amit Kumar',
          'Neha Sharma',
          'Rizwan Khan',
        ])
      ),
    [users]
  );

  // Build shareable public URL & iframe snippet
  const publicFormUrl = useMemo(() => {
    if (!selectedForm) return '';
    const base = `${window.location.origin}${window.location.pathname}`;
    return `${base}?lead_form=${encodeURIComponent(selectedForm.id)}`;
  }, [selectedForm]);

  const iframeEmbedCode = useMemo(() => {
    if (!selectedForm) return '';
    return `<iframe\n  src="${publicFormUrl}"\n  width="100%"\n  height="720"\n   style="border:none;border-radius:16px;max-width:600px;"\n  title="${selectedForm.name}"\n></iframe>`;
  }, [publicFormUrl, selectedForm]);

  const cardCls = isLight
    ? 'bg-white border-sky-100/90 shadow-xs'
    : 'bg-[#0f172a]/95 border-slate-800';
  const inputCls = `w-full px-3 py-2 rounded-xl border text-xs font-medium outline-none ${
    isLight
      ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-sky-500'
      : 'bg-slate-900 border-slate-700 text-white focus:border-sky-400'
  }`;

  const updateSelectedForm = (
    patch:
      | Partial<LeadCaptureFormConfig>
      | ((prev: LeadCaptureFormConfig) => LeadCaptureFormConfig)
  ) => {
    if (!selectedForm) return;
    updateConfig((prev) => ({
      ...prev,
      leadForms: prev.leadForms.map((f) => {
        if (f.id !== selectedForm.id) return f;
        return typeof patch === 'function' ? patch(f) : { ...f, ...patch };
      }),
    }));
  };

  const handleCreateNewForm = () => {
    const id = `form-${Date.now().toString().slice(-6)}`;
    const newForm: LeadCaptureFormConfig = {
      id,
      name: `Website Lead Form #${config.leadForms.length + 1}`,
      headline: 'Get in Touch With Our Team',
      subtitle: 'Complete the form below and we will contact you shortly.',
      submitButtonText: 'Send Request',
      successMessage:
        'Thank you! Your details have been submitted directly to our team.',
      accentColor: '#0ea5e9',
      formTheme: 'light',
      defaultSource: config.leadSources[0]?.name || 'Website',
      defaultStage: config.leadStages[0]?.name || 'New Lead',
      defaultPriority: 'Hot',
      assignedOwner: ownersList[0] || 'Sayed',
      fields: DEFAULT_FORM_FIELDS.map((f) => ({ ...f })),
      enabledCustomFieldIds: [],
      submissionsCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    updateConfig((prev) => ({
      ...prev,
      leadForms: [...prev.leadForms, newForm],
    }));
    setSelectedFormId(id);
    logAudit('Workspace', 'Created Web-to-Lead form', newForm.name);
    onNotify(`Created new lead form "${newForm.name}".`);
  };

  const handleDeleteForm = (form: LeadCaptureFormConfig) => {
    if (config.leadForms.length <= 1) {
      return onNotify('Keep at least one active Web-to-Lead form.');
    }
    const remaining = config.leadForms.filter((f) => f.id !== form.id);
    updateConfig((prev) => ({
      ...prev,
      leadForms: remaining,
    }));
    if (selectedFormId === form.id && remaining[0]) {
      setSelectedFormId(remaining[0].id);
    }
    logAudit('Workspace', 'Deleted Web-to-Lead form', form.name);
    onNotify(`Deleted form "${form.name}".`);
  };

  const handleCopyText = (text: string, type: 'link' | 'embed') => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
    onNotify(
      type === 'link'
        ? 'Public lead form link copied! Paste it on your website or open in browser.'
        : 'Website HTML embed code copied to clipboard!'
    );
  };

  const toggleStandardField = (
    key: StandardLeadFieldKey,
    prop: 'enabled' | 'required'
  ) => {
    if (!selectedForm) return;
    if (key === 'name' && prop === 'enabled') {
      return onNotify('Lead Name is required to identify incoming leads.');
    }
    updateSelectedForm((prev) => ({
      ...prev,
      fields: prev.fields.map((f) => {
        if (f.key !== key) return f;
        if (prop === 'enabled') {
          const nextEnabled = !f.enabled;
          return {
            ...f,
            enabled: nextEnabled,
            required: nextEnabled ? f.required : false,
          };
        }
        return { ...f, required: !f.required, enabled: true };
      }),
    }));
  };

  const updateStandardFieldText = (
    key: StandardLeadFieldKey,
    prop: 'label' | 'placeholder',
    val: string
  ) => {
    updateSelectedForm((prev) => ({
      ...prev,
      fields: prev.fields.map((f) =>
        f.key === key ? { ...f, [prop]: val } : f
      ),
    }));
  };

  const toggleCustomFieldOnForm = (cfId: string) => {
    updateSelectedForm((prev) => {
      const exists = prev.enabledCustomFieldIds.includes(cfId);
      return {
        ...prev,
        enabledCustomFieldIds: exists
          ? prev.enabledCustomFieldIds.filter((id) => id !== cfId)
          : [...prev.enabledCustomFieldIds, cfId],
      };
    });
  };

  if (!selectedForm) return null;

  return (
    <div className="space-y-4">
      {/* Top Header & Quick Share Bar */}
      <div
        className={`p-4 rounded-2xl border flex flex-col lg:flex-row lg:items-center justify-between gap-3 ${cardCls}`}
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-500">
            <Link2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Web-to-Lead Form Designer &amp; Website Embed Generator
            </h3>
            <p className="text-xs text-slate-400">
              Design custom lead capture forms, copy the public link or website embed code, and receive every submission directly in your Leads section.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleCopyText(publicFormUrl, 'link')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold shadow-sm shadow-sky-500/20"
          >
            {copiedType === 'link' ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span>{copiedType === 'link' ? 'Link Copied!' : 'Copy Form Link'}</span>
          </button>

          <a
            href={publicFormUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-sky-200 dark:border-slate-700 text-xs font-bold text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors"
            title="Open standalone public form in a new browser tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open Public Form</span>
          </a>

          <button
            type="button"
            onClick={handleCreateNewForm}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Form</span>
          </button>
        </div>
      </div>

      {/* Captured Lead Live Notification Banner */}
      {lastCapturedLead && (
        <div className="p-3.5 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 flex flex-wrap items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2.5 text-xs">
            <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white font-extrabold text-[10px] uppercase">
              Live Lead Captured
            </span>
            <span className="font-bold text-slate-800 dark:text-white">
              {lastCapturedLead.name} ({lastCapturedLead.company})
            </span>
            <span className="text-slate-500 dark:text-slate-300">
              was added directly to Leads under stage{' '}
              <strong>{lastCapturedLead.status}</strong> &amp; source{' '}
              <strong>{lastCapturedLead.source}</strong>!
            </span>
          </div>
          <button
            type="button"
            onClick={() => setActiveNav('Leads')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs"
          >
            <span>View in Leads Section</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Forms Selector Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {config.leadForms.map((form) => {
          const isSelected = form.id === selectedForm.id;
          return (
            <div
              key={form.id}
              onClick={() => setSelectedFormId(form.id)}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-2 ${
                isSelected
                  ? 'border-sky-500 bg-sky-500/5 ring-2 ring-sky-500/30'
                  : cardCls
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: form.accentColor }}
                  />
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                    {form.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                  <span>Source: {form.defaultSource}</span>
                  <span>·</span>
                  <span>Stage: {form.defaultStage}</span>
                  <span>·</span>
                  <span className="font-bold text-emerald-500">
                    {form.submissionsCount || 0} leads
                  </span>
                </div>
              </div>

              {config.leadForms.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteForm(form);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800 shrink-0"
                  title="Delete Form"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Main 2-Column Workspace: Left = Form Builder & Share Link, Right = Live Interactive Form Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* LEFT COLUMN: Controls (7 cols) */}
        <div className={`lg:col-span-7 p-5 rounded-2xl border space-y-4 ${cardCls}`}>
          {/* Sub-navigation tabs */}
          <div className="flex items-center gap-1.5 border-b border-slate-200/70 dark:border-slate-800 pb-3">
            {[
              { id: 'design', label: '1. Form Design & Lead Routing', icon: Palette },
              { id: 'fields', label: '2. Form Fields & Custom Fields', icon: Sliders },
              { id: 'embed', label: '3. Copy Link & Website Embed', icon: Code2 },
            ].map((t) => {
              const Icon = t.icon;
              const active = activeSubTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveSubTab(t.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    active
                      ? 'bg-sky-500 text-white shadow-xs'
                      : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* SUB-TAB 1: DESIGN & ROUTING */}
          {activeSubTab === 'design' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Internal Form Name
                  </label>
                  <input
                    type="text"
                    value={selectedForm.name}
                    onChange={(e) => updateSelectedForm({ name: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Submit Button Text
                  </label>
                  <input
                    type="text"
                    value={selectedForm.submitButtonText}
                    onChange={(e) =>
                      updateSelectedForm({ submitButtonText: e.target.value })
                    }
                    className={inputCls}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Public Form Headline
                  </label>
                  <input
                    type="text"
                    value={selectedForm.headline}
                    onChange={(e) =>
                      updateSelectedForm({ headline: e.target.value })
                    }
                    className={inputCls}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Subtitle / Instructions
                  </label>
                  <input
                    type="text"
                    value={selectedForm.subtitle}
                    onChange={(e) =>
                      updateSelectedForm({ subtitle: e.target.value })
                    }
                    className={inputCls}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Thank-You Confirmation Message
                  </label>
                  <input
                    type="text"
                    value={selectedForm.successMessage}
                    onChange={(e) =>
                      updateSelectedForm({ successMessage: e.target.value })
                    }
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Theme & Brand Color */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Brand Accent Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={selectedForm.accentColor}
                      onChange={(e) =>
                        updateSelectedForm({ accentColor: e.target.value })
                      }
                      className="w-9 h-9 rounded-lg cursor-pointer bg-transparent border border-slate-200 dark:border-slate-700 p-0.5"
                    />
                    {['#0ea5e9', '#6366f1', '#10b981', '#f59e0b', '#ec4899', '#0f172a'].map(
                      (c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => updateSelectedForm({ accentColor: c })}
                          className={`w-6 h-6 rounded-full border-2 transition-transform ${
                            selectedForm.accentColor === c
                              ? 'scale-110 border-slate-900 dark:border-white'
                              : 'border-transparent'
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      )
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Public Form Appearance
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['light', 'dark'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => updateSelectedForm({ formTheme: mode })}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold capitalize transition-all ${
                          selectedForm.formTheme === mode
                            ? 'border-sky-500 bg-sky-500/10 text-sky-600 dark:text-sky-400'
                            : 'border-slate-200 dark:border-slate-700 text-slate-500'
                        }`}
                      >
                        {mode} Theme
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Lead CRM Routing Settings */}
              <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-sky-500" />
                  <span className="text-xs font-extrabold text-slate-800 dark:text-white">
                    Automatic CRM Lead Routing (When Visitor Submits Form)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                      Assign Lead Source
                    </label>
                    <select
                      value={selectedForm.defaultSource}
                      onChange={(e) =>
                        updateSelectedForm({ defaultSource: e.target.value })
                      }
                      className={inputCls}
                    >
                      {config.leadSources.map((src) => (
                        <option key={src.id} value={src.name}>
                          {src.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                      Assign Initial Lead Stage
                    </label>
                    <select
                      value={selectedForm.defaultStage}
                      onChange={(e) =>
                        updateSelectedForm({ defaultStage: e.target.value })
                      }
                      className={inputCls}
                    >
                      {config.leadStages.map((stg) => (
                        <option key={stg.id} value={stg.name}>
                          {stg.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                      Default Lead Priority
                    </label>
                    <select
                      value={selectedForm.defaultPriority}
                      onChange={(e) =>
                        updateSelectedForm({
                          defaultPriority: e.target.value as LeadPriority,
                        })
                      }
                      className={inputCls}
                    >
                      <option value="Hot">🔥 Hot Lead</option>
                      <option value="Warm">⚡ Warm Lead</option>
                      <option value="Cold">❄️ Cold Lead</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                      Auto-Assign to Staff Owner
                    </label>
                    <select
                      value={selectedForm.assignedOwner}
                      onChange={(e) =>
                        updateSelectedForm({ assignedOwner: e.target.value })
                      }
                      className={inputCls}
                    >
                      {ownersList.map((owner) => (
                        <option key={owner} value={owner}>
                          {owner}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUB-TAB 2: FIELDS & CUSTOM FIELDS */}
          {activeSubTab === 'fields' && (
            <div className="space-y-4">
              <div>
                <div className="text-xs font-extrabold text-slate-800 dark:text-white mb-2">
                  Standard CRM Lead Fields
                </div>
                <div className="space-y-2">
                  {selectedForm.fields.map((field) => (
                    <div
                      key={field.key}
                      className="p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                    >
                      <div className="sm:col-span-3 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleStandardField(field.key, 'enabled')}
                          className="text-sky-500 flex items-center gap-1.5 text-xs font-bold"
                        >
                          {field.enabled ? (
                            <CheckSquare className="w-4 h-4 text-sky-500" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                          <span className="capitalize">{field.key}</span>
                        </button>
                      </div>

                      <div className="sm:col-span-4">
                        <input
                          type="text"
                          disabled={!field.enabled}
                          value={field.label}
                          onChange={(e) =>
                            updateStandardFieldText(
                              field.key,
                              'label',
                              e.target.value
                            )
                          }
                          placeholder="Field Label"
                          className={`${inputCls} py-1 disabled:opacity-40`}
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <input
                          type="text"
                          disabled={!field.enabled}
                          value={field.placeholder}
                          onChange={(e) =>
                            updateStandardFieldText(
                              field.key,
                              'placeholder',
                              e.target.value
                            )
                          }
                          placeholder="Placeholder"
                          className={`${inputCls} py-1 disabled:opacity-40`}
                        />
                      </div>

                      <div className="sm:col-span-2 flex justify-end">
                        <button
                          type="button"
                          disabled={!field.enabled}
                          onClick={() =>
                            toggleStandardField(field.key, 'required')
                          }
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                            field.required && field.enabled
                              ? 'bg-rose-500/10 border-rose-500/30 text-rose-600'
                              : 'border-slate-200 dark:border-slate-700 text-slate-400'
                          }`}
                        >
                          {field.required ? 'Required *' : 'Optional'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Admin Custom Fields */}
              <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-extrabold text-slate-800 dark:text-white">
                    Include Admin Custom Fields ({leadCustomFields.length})
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Created in CRM, Lead &amp; Pipeline Setup
                  </span>
                </div>
                {leadCustomFields.length === 0 ? (
                  <p className="text-xs text-slate-400">
                    No custom fields configured for Leads yet.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {leadCustomFields.map((cf) => {
                      const included =
                        selectedForm.enabledCustomFieldIds.includes(cf.id);
                      return (
                        <button
                          key={cf.id}
                          type="button"
                          onClick={() => toggleCustomFieldOnForm(cf.id)}
                          className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                            included
                              ? 'border-sky-500 bg-sky-500/10 text-sky-600 dark:text-sky-300'
                              : 'border-slate-200 dark:border-slate-800 text-slate-500'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {included ? (
                              <CheckSquare className="w-4 h-4 text-sky-500 shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400 shrink-0" />
                            )}
                            <span className="text-xs font-bold truncate">
                              {cf.label}
                            </span>
                          </div>
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                            {cf.type}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SUB-TAB 3: SHAREABLE LINK & WEBSITE EMBED */}
          {activeSubTab === 'embed' && (
            <div className="space-y-4">
              {/* Direct Link Box */}
              <div className="p-4 rounded-xl border border-sky-200/80 dark:border-slate-800 bg-sky-50/40 dark:bg-slate-900/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-800 dark:text-white flex items-center gap-1.5">
                    <Link2 className="w-4 h-4 text-sky-500" />
                    Direct Public Form Link (Share or Paste on Website Button)
                  </span>
                  <span className="text-[10px] font-bold text-emerald-500">
                    No Login Required for Visitors
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={publicFormUrl}
                    className={`${inputCls} font-mono text-[11px]`}
                  />
                  <button
                    type="button"
                    onClick={() => handleCopyText(publicFormUrl, 'link')}
                    className="px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold shrink-0 flex items-center gap-1.5"
                  >
                    {copiedType === 'link' ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedType === 'link' ? 'Copied' : 'Copy Link'}</span>
                  </button>
                  <a
                    href={publicFormUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 rounded-xl border border-sky-200 dark:border-slate-700 text-xs font-bold text-sky-600 dark:text-sky-400 hover:bg-white dark:hover:bg-slate-800 shrink-0 flex items-center gap-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open</span>
                  </a>
                </div>
              </div>

              {/* Website HTML Iframe Embed Snippet */}
              <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-800 dark:text-white flex items-center gap-1.5">
                    <Code2 className="w-4 h-4 text-indigo-500" />
                    Website Embed Snippet (Paste into WordPress, Webflow, or HTML)
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyText(iframeEmbedCode, 'embed')}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5"
                  >
                    {copiedType === 'embed' ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {copiedType === 'embed' ? 'Embed Copied!' : 'Copy Embed Code'}
                    </span>
                  </button>
                </div>
                <pre className="p-3 rounded-xl bg-slate-950 text-sky-300 font-mono text-[11px] overflow-x-auto leading-relaxed">
                  {iframeEmbedCode}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Interactive Live Form Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-sky-500" />
              <span className="text-xs font-extrabold text-slate-800 dark:text-white uppercase tracking-wider">
                Live Interactive Form Preview (Test Submit Below)
              </span>
            </div>
            <span className="text-[11px] text-emerald-500 font-bold">
              ● Live Connected to Leads
            </span>
          </div>

          <PublicLeadFormCard
            form={selectedForm}
            isEmbeddedPreview
            onSubmitted={(lead) => {
              setLastCapturedLead(lead);
              logAudit(
                'Workspace',
                `Lead captured via "${selectedForm.name}"`,
                `${lead.name} (${lead.company})`
              );
              onNotify(
                `Lead "${lead.name}" received and routed to Leads (${lead.status})!`
              );
            }}
          />
        </div>
      </div>
    </div>
  );
};

