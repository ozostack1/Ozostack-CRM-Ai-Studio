import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Send,
  ShieldCheck,
  ArrowLeft,
  Building2,
  User,
  Mail,
  Phone,
  MessageSquare,
  DollarSign,
  Briefcase,
  FileText,
} from 'lucide-react';
import {
  useCrmConfig,
  LeadCaptureFormConfig,
  StandardLeadFieldKey,
  submitPublicLeadForm,
  DEFAULT_LEAD_FORMS,
} from '../../data/crmConfig';
import { Lead } from '../../types/crm';

interface PublicLeadFormCardProps {
  form: LeadCaptureFormConfig;
  onSubmitted?: (lead: Lead) => void;
  isEmbeddedPreview?: boolean;
}

export const PublicLeadFormCard: React.FC<PublicLeadFormCardProps> = ({
  form,
  onSubmitted,
  isEmbeddedPreview = false,
}) => {
  const { config } = useCrmConfig();
  const isDark = form.formTheme === 'dark';

  const [values, setValues] = useState<Partial<Record<StandardLeadFieldKey, string>>>({});
  const [customValues, setCustomValues] = useState<Record<string, string | number>>({});
  const [submittedLead, setSubmittedLead] = useState<Lead | null>(null);

  const enabledFields = useMemo(
    () => form.fields.filter((f) => f.enabled),
    [form.fields]
  );

  const enabledCustomFields = useMemo(
    () =>
      config.customFields.filter(
        (cf) =>
          (cf.entity === 'Lead' || cf.entity === 'Both') &&
          form.enabledCustomFieldIds.includes(cf.id)
      ),
    [config.customFields, form.enabledCustomFieldIds]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const created = submitPublicLeadForm(form, values, customValues);
    setSubmittedLead(created);
    if (onSubmitted) onSubmitted(created);
  };

  const resetForm = () => {
    setValues({});
    setCustomValues({});
    setSubmittedLead(null);
  };

  const fieldIcon = (key: StandardLeadFieldKey) => {
    switch (key) {
      case 'name':
        return <User className="w-3.5 h-3.5 text-slate-400" />;
      case 'company':
        return <Building2 className="w-3.5 h-3.5 text-slate-400" />;
      case 'email':
        return <Mail className="w-3.5 h-3.5 text-slate-400" />;
      case 'phone':
        return <Phone className="w-3.5 h-3.5 text-slate-400" />;
      case 'whatsapp':
        return <MessageSquare className="w-3.5 h-3.5 text-slate-400" />;
      case 'title':
        return <Briefcase className="w-3.5 h-3.5 text-slate-400" />;
      case 'value':
        return <DollarSign className="w-3.5 h-3.5 text-slate-400" />;
      case 'notes':
        return <FileText className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div
      className={`w-full rounded-2xl border shadow-xl overflow-hidden transition-all ${
        isDark
          ? 'bg-slate-900 border-slate-800 text-white'
          : 'bg-white border-slate-200/90 text-slate-800'
      }`}
    >
      {/* Top Accent Bar */}
      <div
        className="h-2 w-full"
        style={{ backgroundColor: form.accentColor || '#0ea5e9' }}
      />

      <div className="p-6 sm:p-7">
        {/* Brand Header */}
        <div className="flex items-center gap-2.5 mb-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0"
            style={{ backgroundColor: form.accentColor || '#0ea5e9' }}
          >
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span
              className={`text-xs font-extrabold tracking-wider uppercase ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              OZO STACK
            </span>
            <span className="block text-[10px] text-slate-400 leading-none">
              Verified Enterprise Inquiry Portal
            </span>
          </div>
        </div>

        <h2
          className={`text-lg sm:text-xl font-extrabold tracking-tight ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}
        >
          {form.headline || form.name}
        </h2>
        {form.subtitle && (
          <p
            className={`text-xs mt-1 leading-relaxed ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            {form.subtitle}
          </p>
        )}

        {submittedLead ? (
          <div
            className={`mt-6 p-6 rounded-2xl border text-center space-y-3 ${
              isDark
                ? 'bg-emerald-950/30 border-emerald-800/60'
                : 'bg-emerald-50/70 border-emerald-200'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md shadow-emerald-500/20">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3
              className={`text-base font-extrabold ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              Submission Received!
            </h3>
            <p
              className={`text-xs max-w-md mx-auto leading-relaxed ${
                isDark ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
              {form.successMessage}
            </p>
            {isEmbeddedPreview && (
              <div
                className={`inline-flex flex-wrap items-center justify-center gap-2 text-[11px] px-3 py-1.5 rounded-xl border ${
                  isDark
                    ? 'bg-slate-900/80 border-slate-700 text-slate-300'
                    : 'bg-white border-emerald-200 text-slate-600'
                }`}
              >
                <span>
                  Lead: <strong>{submittedLead.name}</strong> ({submittedLead.company})
                </span>
                <span>·</span>
                <span>
                  Stage: <strong>{submittedLead.status}</strong>
                </span>
                <span>·</span>
                <span>
                  Source: <strong>{submittedLead.source}</strong>
                </span>
              </div>
            )}
            <div className="pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm transition-all active:scale-95"
                style={{ backgroundColor: form.accentColor || '#0ea5e9' }}
              >
                Submit Another Response
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {enabledFields.map((field) => {
                const isFullWidth = field.key === 'notes';
                const val = values[field.key] ?? '';
                const inputCls = `w-full pl-9 pr-3 py-2.5 rounded-xl border text-xs font-medium outline-none transition-all ${
                  isDark
                    ? 'bg-slate-800/90 border-slate-700 text-white placeholder:text-slate-500 focus:border-sky-400'
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white'
                }`;

                return (
                  <div
                    key={field.key}
                    className={isFullWidth ? 'sm:col-span-2' : ''}
                  >
                    <label
                      className={`block text-xs font-bold mb-1 ${
                        isDark ? 'text-slate-300' : 'text-slate-700'
                      }`}
                    >
                      {field.label}{' '}
                      {field.required && <span className="text-rose-500">*</span>}
                    </label>
                    {field.key === 'notes' ? (
                      <textarea
                        rows={3}
                        required={field.required}
                        value={val}
                        onChange={(e) =>
                          setValues({ ...values, [field.key]: e.target.value })
                        }
                        placeholder={field.placeholder}
                        className={`w-full p-3 rounded-xl border text-xs font-medium outline-none transition-all ${
                          isDark
                            ? 'bg-slate-800/90 border-slate-700 text-white placeholder:text-slate-500 focus:border-sky-400'
                            : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white'
                        }`}
                      />
                    ) : (
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                          {fieldIcon(field.key)}
                        </div>
                        <input
                          type={
                            field.key === 'email'
                              ? 'email'
                              : field.key === 'value'
                              ? 'number'
                              : field.key === 'phone'
                              ? 'tel'
                              : 'text'
                          }
                          required={field.required}
                          min={field.key === 'value' ? 0 : undefined}
                          value={val}
                          onChange={(e) =>
                            setValues({ ...values, [field.key]: e.target.value })
                          }
                          placeholder={field.placeholder}
                          className={inputCls}
                        />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Custom Fields configured by Admin */}
              {enabledCustomFields.map((cf) => {
                const val = customValues[cf.key] ?? '';
                const setVal = (v: string | number) =>
                  setCustomValues((prev) => ({ ...prev, [cf.key]: v }));
                const baseCls = `w-full px-3 py-2.5 rounded-xl border text-xs font-medium outline-none transition-all ${
                  isDark
                    ? 'bg-slate-800/90 border-slate-700 text-white placeholder:text-slate-500 focus:border-sky-400'
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white'
                }`;

                return (
                  <div key={cf.id}>
                    <label
                      className={`block text-xs font-bold mb-1 ${
                        isDark ? 'text-slate-300' : 'text-slate-700'
                      }`}
                    >
                      {cf.label}{' '}
                      {cf.required && <span className="text-rose-500">*</span>}
                    </label>
                    {cf.type === 'select' ? (
                      <select
                        required={cf.required}
                        value={String(val)}
                        onChange={(e) => setVal(e.target.value)}
                        className={baseCls}
                      >
                        <option value="">{cf.placeholder || `Select ${cf.label}`}</option>
                        {cf.options.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={
                          cf.type === 'number'
                            ? 'number'
                            : cf.type === 'date'
                            ? 'date'
                            : cf.type === 'url'
                            ? 'url'
                            : 'text'
                        }
                        required={cf.required}
                        value={val}
                        onChange={(e) =>
                          setVal(
                            cf.type === 'number'
                              ? Number(e.target.value)
                              : e.target.value
                          )
                        }
                        placeholder={cf.placeholder || `Enter ${cf.label}`}
                        className={baseCls}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 px-5 rounded-xl text-xs font-extrabold text-white shadow-lg flex items-center justify-center gap-2 transition-all hover:opacity-95 active:scale-[0.99]"
                style={{ backgroundColor: form.accentColor || '#0ea5e9' }}
              >
                <Send className="w-3.5 h-3.5" />
                <span>{form.submitButtonText || 'Submit Inquiry'}</span>
              </button>
            </div>

            <div className="flex items-center justify-between pt-2 text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                256-bit SSL Encrypted · Direct CRM Routing
              </span>
              {isEmbeddedPreview && (
                <span>
                  Routes to: <strong>{form.defaultSource}</strong> →{' '}
                  <strong>{form.defaultStage}</strong>
                </span>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

interface PublicLeadFormViewProps {
  formId: string;
  onExitToCrm?: () => void;
}

export const PublicLeadFormView: React.FC<PublicLeadFormViewProps> = ({
  formId,
  onExitToCrm,
}) => {
  const { config } = useCrmConfig();

  // Support optional encoded config fallback in URL if opened in a fresh session
  const resolvedForm = useMemo(() => {
    const found = config.leadForms.find((f) => f.id === formId);
    if (found) return found;
    try {
      const params = new URLSearchParams(window.location.search);
      const encoded = params.get('cfg');
      if (encoded) {
        const parsed = JSON.parse(decodeURIComponent(escape(atob(encoded))));
        if (parsed && parsed.id) return parsed as LeadCaptureFormConfig;
      }
    } catch {
      /* ignore */
    }
    return config.leadForms[0] || DEFAULT_LEAD_FORMS[0];
  }, [config.leadForms, formId]);

  const isDarkPage = resolvedForm.formTheme === 'dark';

  return (
    <div
      className={`min-h-screen flex flex-col justify-between p-4 sm:p-8 transition-colors ${
        isDarkPage
          ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white'
          : 'bg-gradient-to-br from-sky-50 via-white to-indigo-50/40 text-slate-800'
      }`}
    >
      {/* Top Bar for quick return if testing inside CRM */}
      {onExitToCrm && (
        <div className="max-w-xl w-full mx-auto flex items-center justify-end mb-4">
          <button
            type="button"
            onClick={onExitToCrm}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
              isDarkPage
                ? 'bg-slate-900 border-slate-700 text-sky-400 hover:bg-slate-800'
                : 'bg-white border-sky-200 text-sky-700 hover:bg-sky-50 shadow-2xs'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Ozostack CRM</span>
          </button>
        </div>
      )}

      {/* Main Form Card */}
      <div className="max-w-xl w-full mx-auto my-auto">
        <PublicLeadFormCard form={resolvedForm} />
      </div>

      {/* Footer */}
      <div className="max-w-xl w-full mx-auto text-center mt-6 text-[11px] text-slate-400">
        Powered by <strong>Ozostack Enterprise CRM</strong>
      </div>
    </div>
  );
};

