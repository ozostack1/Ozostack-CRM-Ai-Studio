import { useState, useEffect, useCallback } from 'react';
import { Lead, LeadPriority, LeadSource, LeadStatus } from '../types/crm';
import { INITIAL_LEADS } from './mockData';
import { addNotification } from './notificationService';

export interface LeadSourceConfig {
  id: string;
  name: string;
  color: string;
}

export interface LeadStageConfig {
  id: string;
  name: string;
  color: string;
}

export interface PipelineStageConfig {
  id: string;
  name: string;
  stage: string;
  label: string;
  prob: number;
  color: string;
  avgDays: number;
}

export type CustomFieldEntity = 'Lead' | 'Deal' | 'Both';
export type CustomFieldType = 'text' | 'number' | 'select' | 'date' | 'url';

export interface CustomFieldConfig {
  id: string;
  key: string;
  label: string;
  entity: CustomFieldEntity;
  type: CustomFieldType;
  options: string[];
  required: boolean;
  placeholder: string;
}

export type StandardLeadFieldKey =
  | 'name'
  | 'company'
  | 'email'
  | 'phone'
  | 'whatsapp'
  | 'title'
  | 'value'
  | 'notes';

export interface LeadCaptureFormField {
  key: StandardLeadFieldKey;
  label: string;
  placeholder: string;
  enabled: boolean;
  required: boolean;
}

export interface LeadCaptureFormConfig {
  id: string;
  name: string;
  headline: string;
  subtitle: string;
  submitButtonText: string;
  successMessage: string;
  accentColor: string;
  formTheme: 'light' | 'dark';
  defaultSource: string;
  defaultStage: string;
  defaultPriority: LeadPriority;
  assignedOwner: string;
  fields: LeadCaptureFormField[];
  enabledCustomFieldIds: string[];
  submissionsCount: number;
  lastSubmittedAt?: string;
  createdAt: string;
}

export interface CrmSystemConfig {
  leadSources: LeadSourceConfig[];
  leadStages: LeadStageConfig[];
  pipelineStages: PipelineStageConfig[];
  customFields: CustomFieldConfig[];
  leadForms: LeadCaptureFormConfig[];
}

export const DEFAULT_FORM_FIELDS: LeadCaptureFormField[] = [
  { key: 'name', label: 'Full Name', placeholder: 'e.g. Alex Morgan', enabled: true, required: true },
  { key: 'company', label: 'Company / Organization', placeholder: 'e.g. Nexus Innovations', enabled: true, required: true },
  { key: 'email', label: 'Work Email', placeholder: 'alex@company.com', enabled: true, required: true },
  { key: 'phone', label: 'Phone Number', placeholder: '+1 (555) 234-5678', enabled: true, required: true },
  { key: 'whatsapp', label: 'WhatsApp Number', placeholder: '+15552345678', enabled: true, required: false },
  { key: 'title', label: 'Job Title / Role', placeholder: 'e.g. VP of Operations', enabled: true, required: false },
  { key: 'value', label: 'Estimated Project Budget ($ USD)', placeholder: '25000', enabled: true, required: false },
  { key: 'notes', label: 'Project Scope & Requirements', placeholder: 'Tell us about your project goals, timeline, and requirements...', enabled: true, required: false },
];

export const DEFAULT_LEAD_FORMS: LeadCaptureFormConfig[] = [
  {
    id: 'form-website-main',
    name: 'Website Contact & Consultation Form',
    headline: 'Request a Free Strategy & Product Demo',
    subtitle: 'Fill out the form below and our enterprise solutions team will get back to you within 2 hours.',
    submitButtonText: 'Submit Inquiry',
    successMessage: 'Thank you! Your inquiry has been received by our team. We will reach out shortly.',
    accentColor: '#0ea5e9',
    formTheme: 'light',
    defaultSource: 'Website',
    defaultStage: 'New Lead',
    defaultPriority: 'Hot',
    assignedOwner: 'Sayed',
    fields: DEFAULT_FORM_FIELDS,
    enabledCustomFieldIds: ['cf-1', 'cf-2'],
    submissionsCount: 14,
    lastSubmittedAt: '2025-05-20 11:20 AM',
    createdAt: '2025-05-01',
  },
  {
    id: 'form-enterprise-quote',
    name: 'Enterprise Custom Quote Form',
    headline: 'Get a Custom Enterprise Quote',
    subtitle: 'Share your technical requirements and estimated budget for a tailored proposal.',
    submitButtonText: 'Request Custom Proposal',
    successMessage: 'Your custom quote request has been registered! Your dedicated account executive will contact you.',
    accentColor: '#6366f1',
    formTheme: 'dark',
    defaultSource: 'Website',
    defaultStage: 'Qualified',
    defaultPriority: 'Hot',
    assignedOwner: 'Amit Kumar',
    fields: DEFAULT_FORM_FIELDS.map((f) =>
      f.key === 'value' || f.key === 'notes' ? { ...f, required: true } : f
    ),
    enabledCustomFieldIds: ['cf-1'],
    submissionsCount: 6,
    lastSubmittedAt: '2025-05-19 04:45 PM',
    createdAt: '2025-05-05',
  },
];

export const DEFAULT_CRM_CONFIG: CrmSystemConfig = {
  leadSources: [
    { id: 'src-1', name: 'LinkedIn', color: '#0ea5e9' },
    { id: 'src-2', name: 'Website', color: '#10b981' },
    { id: 'src-3', name: 'Cold Email', color: '#6366f1' },
    { id: 'src-4', name: 'Referrals', color: '#f59e0b' },
    { id: 'src-5', name: 'Upwork', color: '#14b8a6' },
    { id: 'src-6', name: 'Events', color: '#ec4899' },
    { id: 'src-7', name: 'Others', color: '#64748b' },
  ],
  leadStages: [
    { id: 'lst-1', name: 'New Lead', color: '#38bdf8' },
    { id: 'lst-2', name: 'Contacted', color: '#0ea5e9' },
    { id: 'lst-3', name: 'Follow-up', color: '#f59e0b' },
    { id: 'lst-4', name: 'Qualified', color: '#6366f1' },
    { id: 'lst-5', name: 'Proposal Sent', color: '#8b5cf6' },
    { id: 'lst-6', name: 'Negotiation', color: '#ec4899' },
    { id: 'lst-7', name: 'Won', color: '#10b981' },
    { id: 'lst-8', name: 'Lost', color: '#ef4444' },
  ],
  pipelineStages: [
    { id: 'pst-1', name: 'Discovery', stage: 'Discovery', label: 'Discovery', prob: 25, color: '#38bdf8', avgDays: 6 },
    { id: 'pst-2', name: 'Proposal Sent', stage: 'Proposal Sent', label: 'Proposal Sent', prob: 50, color: '#0ea5e9', avgDays: 9 },
    { id: 'pst-3', name: 'Negotiation', stage: 'Negotiation', label: 'Negotiation', prob: 75, color: '#0284c7', avgDays: 14 },
    { id: 'pst-4', name: 'Contract Sent', stage: 'Contract Sent', label: 'Contract Sent', prob: 90, color: '#0369a1', avgDays: 5 },
    { id: 'pst-5', name: 'Won', stage: 'Won', label: 'Closed Won', prob: 100, color: '#10b981', avgDays: 0 },
  ],
  customFields: [
    {
      id: 'cf-1',
      key: 'industryVertical',
      label: 'Industry Vertical',
      entity: 'Both',
      type: 'select',
      options: ['FinTech & Banking', 'SaaS & Cloud', 'Healthcare', 'E-Commerce & Retail', 'Logistics', 'Real Estate'],
      required: false,
      placeholder: 'Select industry',
    },
    {
      id: 'cf-2',
      key: 'decisionTimeframe',
      label: 'Buying Timeframe',
      entity: 'Lead',
      type: 'select',
      options: ['Immediate (< 30 Days)', 'This Quarter', 'Next Quarter', 'Exploratory'],
      required: false,
      placeholder: 'Select timeframe',
    },
    {
      id: 'cf-3',
      key: 'contractTermMonths',
      label: 'Contract Term (Months)',
      entity: 'Deal',
      type: 'number',
      options: [],
      required: false,
      placeholder: 'e.g. 12',
    },
  ],
  leadForms: DEFAULT_LEAD_FORMS,
};

const STORAGE_KEY = 'ozostack_crm_config_v1';
const EVENT_NAME = 'ozostack-crm-config-changed';

export const loadCrmConfig = (): CrmSystemConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.leadSources) && Array.isArray(parsed.leadStages) && Array.isArray(parsed.pipelineStages)) {
        return {
          leadSources: parsed.leadSources,
          leadStages: parsed.leadStages,
          pipelineStages: parsed.pipelineStages.map((p: any) => ({
            ...p,
            name: p.name || p.stage,
            stage: p.stage || p.name,
          })),
          customFields: Array.isArray(parsed.customFields) ? parsed.customFields : DEFAULT_CRM_CONFIG.customFields,
          leadForms: Array.isArray(parsed.leadForms) && parsed.leadForms.length > 0 ? parsed.leadForms : DEFAULT_LEAD_FORMS,
        };
      }
    }
  } catch {
    /* fallback */
  }
  return DEFAULT_CRM_CONFIG;
};

export const saveCrmConfig = (next: CrmSystemConfig) => {
  try {
    const normalized: CrmSystemConfig = {
      ...next,
      pipelineStages: next.pipelineStages.map((p) => ({
        ...p,
        name: p.stage || p.name,
        stage: p.stage || p.name,
      })),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: normalized }));
  } catch {
    /* ignore */
  }
};

export const submitPublicLeadForm = (
  form: LeadCaptureFormConfig,
  values: Partial<Record<StandardLeadFieldKey, string>>,
  customFieldValues: Record<string, string | number>
): Lead => {
  let existingLeads: Lead[] = INITIAL_LEADS;
  try {
    const saved = localStorage.getItem('ozostack_leads_v2');
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        existingLeads = parsed;
      }
    }
  } catch {
    /* fallback */
  }

  const today = new Date().toISOString().split('T')[0];
  const phoneVal = (values.phone || '').trim() || '+1 (555) 000-0000';
  const whatsappVal =
    (values.whatsapp || '').trim() || phoneVal.replace(/[^0-9+]/g, '');

  const newLead: Lead = {
    id: `lead-${Date.now()}`,
    name: (values.name || 'Website Visitor').trim(),
    company: (values.company || 'Inbound Inquiry').trim(),
    title: (values.title || 'Decision Maker').trim(),
    email: (values.email || 'contact@company.com').trim(),
    phone: phoneVal,
    whatsapp: whatsappVal,
    status: (form.defaultStage || 'New Lead') as LeadStatus,
    priority: (form.defaultPriority || 'Hot') as LeadPriority,
    value: Number(values.value) || 15000,
    source: (form.defaultSource || 'Website') as LeadSource,
    owner: form.assignedOwner || 'Sayed',
    score: form.defaultPriority === 'Hot' ? 92 : form.defaultPriority === 'Warm' ? 78 : 65,
    createdAt: today,
    lastContacted: today,
    notes: (values.notes || `Submitted via "${form.name}" web form.`).trim(),
    tags: ['Web Form', form.name],
    customFields: customFieldValues,
  };

  const updatedLeads = [newLead, ...existingLeads];
  try {
    localStorage.setItem('ozostack_leads_v2', JSON.stringify(updatedLeads));
  } catch {
    /* ignore */
  }

  // Increment submission counter on the form
  const cfg = loadCrmConfig();
  const nowStamp = new Date().toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
  const nextForms = cfg.leadForms.map((f) =>
    f.id === form.id
      ? { ...f, submissionsCount: (f.submissionsCount || 0) + 1, lastSubmittedAt: nowStamp }
      : f
  );
  saveCrmConfig({ ...cfg, leadForms: nextForms });
  window.dispatchEvent(new Event('storage'));

  // Trigger notification for inbound lead
  addNotification({
    title: `New Lead: "${newLead.name}"`,
    subtitle: `${newLead.company} · Submitted via "${form.name}" · Source: ${newLead.source}`,
    type: 'lead',
    read: false,
    targetNav: 'Leads',
    targetId: newLead.id,
    priority: 'high',
    timeAgo: 'Just now',
  });

  return newLead;
};

export const migrateStoredLeads = (field: 'source' | 'status', oldVal: string, newVal: string) => {
  if (!oldVal || !newVal || oldVal === newVal) return;
  try {
    const raw = localStorage.getItem('ozostack_leads_v2');
    if (!raw) return;
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return;
    const updated = list.map((item) => (item[field] === oldVal ? { ...item, [field]: newVal } : item));
    localStorage.setItem('ozostack_leads_v2', JSON.stringify(updated));
  } catch {
    /* ignore */
  }
};

export const migrateStoredDeals = (oldStage: string, newStage: string) => {
  if (!oldStage || !newStage || oldStage === newStage) return;
  try {
    const raw = localStorage.getItem('ozostack_deals_v2');
    if (!raw) return;
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return;
    const updated = list.map((item) => (item.stage === oldStage ? { ...item, stage: newStage } : item));
    localStorage.setItem('ozostack_deals_v2', JSON.stringify(updated));
  } catch {
    /* ignore */
  }
};

export const useCrmConfig = () => {
  const [config, setConfigState] = useState<CrmSystemConfig>(loadCrmConfig);

  useEffect(() => {
    const handler = () => setConfigState(loadCrmConfig());
    window.addEventListener(EVENT_NAME, handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener(EVENT_NAME, handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  const updateConfig = useCallback((updater: CrmSystemConfig | ((prev: CrmSystemConfig) => CrmSystemConfig)) => {
    const current = loadCrmConfig();
    const next = typeof updater === 'function' ? updater(current) : updater;
    setConfigState(next);
    saveCrmConfig(next);
  }, []);

  return { config, updateConfig };
};
