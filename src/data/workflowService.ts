import { useState, useEffect, useCallback } from 'react';
import { getActiveMailUser, sendDirectEmail } from './emailService';
import { sendDirectWhatsApp, normalizePhoneDigits } from './whatsappService';
import { addNotification } from './notificationService';

export type WorkflowTriggerType =
  | 'lead_created'
  | 'lead_stage_changed'
  | 'deal_won'
  | 'invoice_created';

export interface CrmWorkflowRule {
  id: string;
  ownerUserId: string;
  name: string;
  description: string;
  trigger: WorkflowTriggerType;
  stageCondition?: string; // e.g., 'Proposal Sent', 'Won', 'Any'
  enabled: boolean;
  actions: {
    sendEmail: boolean;
    sendWhatsApp: boolean;
    createNotification: boolean;
    createFollowup: boolean;
  };
  emailSubject: string;
  emailBody: string;
  whatsappBody: string;
  runCount: number;
  lastRunAt?: string;
  createdAt: string;
}

export type ExternalSourceKey = 'justdial' | 'indiamart' | 'facebook' | 'website';

export interface ExternalWebhookSource {
  id: ExternalSourceKey;
  label: string;
  description: string;
  enabled: boolean;
  token: string;
  autoCreateLead: boolean;
  autoEmail: boolean;
  autoWhatsApp: boolean;
  autoNotification: boolean;
  emailSubject: string;
  emailBody: string;
  whatsappBody: string;
  leadsCaptured: number;
  lastTriggeredAt?: string;
}

export interface WorkflowExecutionLog {
  id: string;
  workflowName: string;
  source: string;
  recipientName: string;
  recipientEmail?: string;
  recipientPhone?: string;
  emailStatus: 'Sent' | 'Skipped' | 'Failed';
  whatsappStatus: 'Sent' | 'Skipped' | 'Not Linked' | 'Failed';
  detail: string;
  timestamp: string;
}

export function getWorkflowsKey(userId?: string): string {
  const id = userId || getActiveMailUser().id;
  return `ozostack_workflows_user_v1_${id}`;
}

export function getWebhookSourcesKey(userId?: string): string {
  const id = userId || getActiveMailUser().id;
  return `ozostack_webhook_sources_user_v1_${id}`;
}

export function getWorkflowLogsKey(userId?: string): string {
  const id = userId || getActiveMailUser().id;
  return `ozostack_workflow_logs_user_v1_${id}`;
}

function generateWebhookToken(userId: string): string {
  const seed = userId.replace(/[^a-zA-Z0-9]/g, '').slice(-6) || 'ozo';
  const rand = Math.random().toString(36).slice(2, 10);
  return `ozo_${seed}_${rand}`;
}

export function buildDefaultWorkflows(userId: string): CrmWorkflowRule[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'wf-new-lead-welcome',
      ownerUserId: userId,
      name: 'New Lead Instant Welcome (Basic)',
      description:
        'Automatically sends a welcome Email (and WhatsApp when linked) as soon as a new Lead is added to the CRM.',
      trigger: 'lead_created',
      enabled: true,
      actions: {
        sendEmail: true,
        sendWhatsApp: false,
        createNotification: true,
        createFollowup: true,
      },
      emailSubject: 'Welcome to OzoStack — Thank you for connecting, {firstName}!',
      emailBody:
        'Hi {firstName},\n\nThank you for reaching out to OzoStack regarding {company}. Our team has received your inquiry and will connect with you shortly to discuss your requirements.\n\nBest regards,\n{owner}\nOzoStack',
      whatsappBody:
        'Hi {firstName}, thank you for connecting with OzoStack regarding {company}! Our team has received your inquiry and will reach out shortly.',
      runCount: 0,
      createdAt: now,
    },
    {
      id: 'wf-proposal-followup',
      ownerUserId: userId,
      name: 'Proposal Sent Auto Follow-up',
      description:
        'Automatically sends a structured follow-up Email / WhatsApp whenever a lead moves to the "Proposal Sent" stage.',
      trigger: 'lead_stage_changed',
      stageCondition: 'Proposal Sent',
      enabled: false,
      actions: {
        sendEmail: true,
        sendWhatsApp: false,
        createNotification: true,
        createFollowup: true,
      },
      emailSubject: 'Proposal & Next Steps for {company} — OzoStack',
      emailBody:
        'Hi {firstName},\n\nWe have shared the detailed proposal for {company} (Estimated Scope: {value}). Please let us know if you have any questions or would like to schedule a quick walkthrough call.\n\nWarm regards,\n{owner}\nOzoStack',
      whatsappBody:
        'Hi {firstName}, we just moved {company} to Proposal Sent! Let me know if you have 10 minutes today to review the scope together.',
      runCount: 0,
      createdAt: now,
    },
    {
      id: 'wf-deal-won-onboarding',
      ownerUserId: userId,
      name: 'Deal Won Onboarding Welcome',
      description:
        'Automatically welcomes the client via Email / WhatsApp when a Lead or Deal is marked as "Won".',
      trigger: 'lead_stage_changed',
      stageCondition: 'Won',
      enabled: false,
      actions: {
        sendEmail: true,
        sendWhatsApp: false,
        createNotification: true,
        createFollowup: false,
      },
      emailSubject: 'Welcome Aboard to OzoStack, {company}!',
      emailBody:
        'Hi {firstName},\n\nWelcome to OzoStack! We are excited to partner with {company}. Our onboarding team will share your kickoff schedule shortly.\n\nBest regards,\n{owner}\nOzoStack',
      whatsappBody:
        'Hi {firstName}, welcome to OzoStack! Thrilled to partner with {company}. Our team is preparing your onboarding kickoff now.',
      runCount: 0,
      createdAt: now,
    },
  ];
}

export function buildDefaultWebhookSources(userId: string): ExternalWebhookSource[] {
  const token = generateWebhookToken(userId);
  return [
    {
      id: 'justdial',
      label: 'JustDial Lead Capture',
      description:
        'Receive JustDial inquiries automatically into CRM Leads (supports GET & POST webhooks) and trigger instant Email / WhatsApp.',
      enabled: false,
      token,
      autoCreateLead: true,
      autoEmail: true,
      autoWhatsApp: false,
      autoNotification: true,
      emailSubject: 'Thank you for your JustDial inquiry — OzoStack',
      emailBody:
        'Hi {firstName},\n\nThank you for contacting us via JustDial regarding {company}. Our specialist will call you shortly with the best details and pricing.\n\nRegards,\n{owner}\nOzoStack',
      whatsappBody:
        'Hi {firstName}, thanks for your inquiry on JustDial! Our team at OzoStack has received your request for {company} and will connect shortly.',
      leadsCaptured: 0,
    },
    {
      id: 'indiamart',
      label: 'IndiaMART CRM Push API',
      description:
        'Auto-capture IndiaMART buyer inquiries directly into your CRM Leads and send instant quotation/intro Email & WhatsApp.',
      enabled: false,
      token,
      autoCreateLead: true,
      autoEmail: true,
      autoWhatsApp: false,
      autoNotification: true,
      emailSubject: 'Regarding your IndiaMART requirement — OzoStack',
      emailBody:
        'Hi {firstName},\n\nThank you for your inquiry on IndiaMART for {company}. Please reply with your exact requirements or preferred time for a quick call.\n\nBest regards,\n{owner}\nOzoStack',
      whatsappBody:
        'Hi {firstName}, thanks for connecting on IndiaMART regarding {company}! Let us know a good time to share details and pricing.',
      leadsCaptured: 0,
    },
    {
      id: 'facebook',
      label: 'Facebook / Instagram Lead Ads',
      description:
        'Connect Meta Lead Ads (via Zapier / Make / Meta Webhook) so every ad lead enters CRM with instant auto-response.',
      enabled: false,
      token,
      autoCreateLead: true,
      autoEmail: true,
      autoWhatsApp: false,
      autoNotification: true,
      emailSubject: 'Thanks for connecting with OzoStack, {firstName}!',
      emailBody:
        'Hi {firstName},\n\nThanks for filling out our form! Our team has received your inquiry for {company} and will get in touch with you shortly.\n\nWarm regards,\n{owner}\nOzoStack',
      whatsappBody:
        'Hi {firstName}, thanks for reaching out to OzoStack! We received your details and will connect with you shortly.',
      leadsCaptured: 0,
    },
    {
      id: 'website',
      label: 'Website Contact / Landing Form',
      description:
        'Send leads from any website contact form (WordPress, Webflow, HTML, Google Forms) directly to your CRM.',
      enabled: false,
      token,
      autoCreateLead: true,
      autoEmail: true,
      autoWhatsApp: false,
      autoNotification: true,
      emailSubject: 'We received your message — OzoStack',
      emailBody:
        'Hi {firstName},\n\nThank you for contacting OzoStack via our website. Our team has received your request and will reply shortly.\n\nBest regards,\n{owner}\nOzoStack',
      whatsappBody:
        'Hi {firstName}, thanks for submitting your inquiry on our website! Our team at OzoStack will connect with you shortly.',
      leadsCaptured: 0,
    },
  ];
}

export function getWorkflows(forUserId?: string): CrmWorkflowRule[] {
  const userId = forUserId || getActiveMailUser().id;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(getWorkflowsKey(userId));
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    }
  } catch {
    /* ignore */
  }
  const defaults = buildDefaultWorkflows(userId);
  saveWorkflows(defaults, userId);
  return defaults;
}

export function saveWorkflows(rules: CrmWorkflowRule[], forUserId?: string): void {
  const userId = forUserId || getActiveMailUser().id;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(getWorkflowsKey(userId), JSON.stringify(rules));
      window.dispatchEvent(new CustomEvent('ozostack-workflows-changed'));
      window.dispatchEvent(new CustomEvent('ozostack-crm-config-changed'));
    }
  } catch {
    /* ignore */
  }
}

export function getWebhookSources(forUserId?: string): ExternalWebhookSource[] {
  const userId = forUserId || getActiveMailUser().id;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(getWebhookSourcesKey(userId));
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    }
  } catch {
    /* ignore */
  }
  const defaults = buildDefaultWebhookSources(userId);
  saveWebhookSources(defaults, userId);
  return defaults;
}

export function saveWebhookSources(sources: ExternalWebhookSource[], forUserId?: string): void {
  const userId = forUserId || getActiveMailUser().id;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(getWebhookSourcesKey(userId), JSON.stringify(sources));
      window.dispatchEvent(new CustomEvent('ozostack-workflows-changed'));
      window.dispatchEvent(new CustomEvent('ozostack-crm-config-changed'));
    }
  } catch {
    /* ignore */
  }
}

export function getWorkflowLogs(forUserId?: string): WorkflowExecutionLog[] {
  const userId = forUserId || getActiveMailUser().id;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(getWorkflowLogsKey(userId));
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    }
  } catch {
    /* ignore */
  }
  return [];
}

export function appendWorkflowLog(
  entry: Omit<WorkflowExecutionLog, 'id' | 'timestamp'>,
  forUserId?: string
): WorkflowExecutionLog {
  const userId = forUserId || getActiveMailUser().id;
  const full: WorkflowExecutionLog = {
    ...entry,
    id: `wflog-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
  };
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const existing = getWorkflowLogs(userId);
      const next = [full, ...existing].slice(0, 100);
      window.localStorage.setItem(getWorkflowLogsKey(userId), JSON.stringify(next));
      window.dispatchEvent(new CustomEvent('ozostack-workflows-changed'));
      window.dispatchEvent(new CustomEvent('ozostack-crm-config-changed'));
    }
  } catch {
    /* ignore */
  }
  return full;
}

export function clearWorkflowLogs(forUserId?: string): void {
  const userId = forUserId || getActiveMailUser().id;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(getWorkflowLogsKey(userId), JSON.stringify([]));
      window.dispatchEvent(new CustomEvent('ozostack-workflows-changed'));
      window.dispatchEvent(new CustomEvent('ozostack-crm-config-changed'));
    }
  } catch {
    /* ignore */
  }
}

function interpolateTemplate(
  raw: string,
  payload: {
    name?: string;
    company?: string;
    stage?: string;
    value?: string | number;
    source?: string;
    owner?: string;
  }
): string {
  const fullName = (payload.name || 'there').trim();
  const firstName = fullName.split(' ')[0] || 'there';
  return String(raw || '')
    .replace(/\{firstName\}/g, firstName)
    .replace(/\{name\}/g, fullName)
    .replace(/\{company\}/g, payload.company || 'your requirement')
    .replace(/\{stage\}/g, payload.stage || 'New Lead')
    .replace(/\{value\}/g, String(payload.value ?? ''))
    .replace(/\{source\}/g, payload.source || 'CRM')
    .replace(/\{owner\}/g, payload.owner || getActiveMailUser().name || 'OzoStack');
}

export async function runSingleWorkflowRule(
  rule: CrmWorkflowRule,
  payload: {
    name: string;
    email?: string;
    phone?: string;
    company?: string;
    stage?: string;
    value?: string | number;
    source?: string;
    owner?: string;
  }
): Promise<WorkflowExecutionLog> {
  const activeUser = getActiveMailUser();
  let emailStatus: WorkflowExecutionLog['emailStatus'] = 'Skipped';
  let whatsappStatus: WorkflowExecutionLog['whatsappStatus'] = 'Skipped';
  const details: string[] = [];

  const subject = interpolateTemplate(rule.emailSubject, payload);
  const emailBody = interpolateTemplate(rule.emailBody, payload);
  const waBody = interpolateTemplate(rule.whatsappBody, payload);

  // 1. Auto Email via user's configured SMTP
  if (rule.actions.sendEmail) {
    if (payload.email && payload.email.includes('@')) {
      const emailRes = await sendDirectEmail({
        to: payload.email,
        subject,
        body: emailBody,
        recipientName: payload.name,
      });
      if (emailRes.ok && emailRes.realExternalDelivery) {
        emailStatus = 'Sent';
        details.push(`Email delivered to ${payload.email}`);
      } else {
        emailStatus = 'Failed';
        details.push(`Email: ${emailRes.error || emailRes.message || 'SMTP not configured'}`);
      }
    } else {
      details.push('Email skipped (no recipient email)');
    }
  }

  // 2. Auto WhatsApp (Module Ready — sends silently via linked QR / Meta Cloud API if active)
  if (rule.actions.sendWhatsApp) {
    const digits = normalizePhoneDigits(payload.phone || '');
    if (digits.length >= 10) {
      const waRes = await sendDirectWhatsApp({
        toPhone: digits,
        contactName: payload.name,
        company: payload.company,
        text: waBody,
        allowWebFallback: false,
      });
      if (waRes.ok && waRes.realDelivered) {
        whatsappStatus = 'Sent';
        details.push(`WhatsApp delivered to ${payload.phone}`);
      } else {
        whatsappStatus = 'Not Linked';
        details.push('WhatsApp skipped (link QR or Meta API to auto-send)');
      }
    } else {
      details.push('WhatsApp skipped (no valid phone)');
    }
  }

  // 3. Auto Create Next-Day Follow-up
  if (rule.actions.createFollowup) {
    try {
      const rawF = localStorage.getItem('ozostack_followups_v2');
      const existing = rawF ? JSON.parse(rawF) : [];
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const newFollowup = {
        id: `fu-wf-${Date.now()}`,
        title: `Workflow Follow-up: ${payload.name} (${payload.company || 'Lead'})`,
        contactName: payload.name,
        company: payload.company || 'CRM Lead',
        type: 'Call',
        dueDate: tomorrow,
        dueTime: '11:00 AM',
        priority: 'High',
        status: 'Scheduled',
        owner: payload.owner || activeUser.name,
        notes: `Auto-created by workflow "${rule.name}".`,
      };
      if (Array.isArray(existing)) {
        localStorage.setItem('ozostack_followups_v2', JSON.stringify([newFollowup, ...existing]));
        details.push('Follow-up scheduled for tomorrow');
      }
    } catch {
      /* ignore */
    }
  }

  // 4. Notification Bell Alert
  if (rule.actions.createNotification) {
    addNotification({
      title: `Workflow Ran: ${rule.name}`,
      subtitle: `${payload.name} (${payload.company || 'CRM'}) · Email: ${emailStatus} · WA: ${whatsappStatus}`,
      type: 'lead',
      read: false,
      targetNav: 'Workflows',
      owner: activeUser.name,
      recipient: activeUser.name,
      priority: 'medium',
    });
  }

  // Increment runCount on the workflow rule
  const allRules = getWorkflows(activeUser.id).map((r) =>
    r.id === rule.id
      ? { ...r, runCount: (r.runCount || 0) + 1, lastRunAt: new Date().toISOString() }
      : r
  );
  saveWorkflows(allRules, activeUser.id);

  return appendWorkflowLog(
    {
      workflowName: rule.name,
      source: payload.source || 'CRM Trigger',
      recipientName: payload.name,
      recipientEmail: payload.email,
      recipientPhone: payload.phone,
      emailStatus,
      whatsappStatus,
      detail: details.join(' · ') || 'Executed',
    },
    activeUser.id
  );
}

export async function triggerCrmWorkflow(
  trigger: WorkflowTriggerType,
  payload: {
    name: string;
    email?: string;
    phone?: string;
    company?: string;
    stage?: string;
    value?: string | number;
    source?: string;
    owner?: string;
  }
): Promise<void> {
  const activeUser = getActiveMailUser();
  const rules = getWorkflows(activeUser.id).filter((r) => {
    if (!r.enabled || r.trigger !== trigger) return false;
    if (
      trigger === 'lead_stage_changed' &&
      r.stageCondition &&
      r.stageCondition !== 'Any' &&
      r.stageCondition.toLowerCase() !== String(payload.stage || '').toLowerCase()
    ) {
      return false;
    }
    return true;
  });

  for (const rule of rules) {
    await runSingleWorkflowRule(rule, payload);
  }
}

export function useWorkflowsCenter(forUserId?: string) {
  const [workflows, setWorkflows] = useState<CrmWorkflowRule[]>(() => getWorkflows(forUserId));
  const [webhookSources, setWebhookSources] = useState<ExternalWebhookSource[]>(() =>
    getWebhookSources(forUserId)
  );
  const [logs, setLogs] = useState<WorkflowExecutionLog[]>(() => getWorkflowLogs(forUserId));

  const refresh = useCallback(() => {
    setWorkflows(getWorkflows(forUserId));
    setWebhookSources(getWebhookSources(forUserId));
    setLogs(getWorkflowLogs(forUserId));
  }, [forUserId]);

  useEffect(() => {
    refresh();
    window.addEventListener('ozostack-workflows-changed', refresh);
    window.addEventListener('ozostack-crm-config-changed', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('ozostack-workflows-changed', refresh);
      window.removeEventListener('ozostack-crm-config-changed', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [refresh, forUserId]);

  return { workflows, webhookSources, logs, refresh };
}
