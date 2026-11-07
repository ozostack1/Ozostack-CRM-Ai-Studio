import { useState, useEffect, useCallback } from 'react';
import { OutreachTemplate, MergeVariable } from '../types/template';

export const AVAILABLE_MERGE_VARIABLES: MergeVariable[] = [
  { key: '{{first_name}}', label: 'First Name', description: "Lead's given name", sampleValue: 'Alex' },
  { key: '{{full_name}}', label: 'Full Name', description: "Lead's complete name", sampleValue: 'Alex Morgan' },
  { key: '{{company}}', label: 'Company', description: "Lead's organization", sampleValue: 'Acme Cloud' },
  { key: '{{job_title}}', label: 'Job Title', description: "Lead's job role", sampleValue: 'VP of Engineering' },
  { key: '{{industry}}', label: 'Industry', description: 'Business sector', sampleValue: 'Enterprise Tech' },
  { key: '{{my_name}}', label: 'Sender Name', description: 'Your full name', sampleValue: 'Sayed' },
  { key: '{{my_company}}', label: 'Sender Company', description: 'Your business name', sampleValue: 'Ozostack' },
  { key: '{{meeting_link}}', label: 'Meeting Link', description: 'Calendar booking link', sampleValue: 'https://ozostack.io/meet' },
];

export const INITIAL_TEMPLATES: OutreachTemplate[] = [
  // --- COLD EMAIL TEMPLATES ---
  {
    id: 'tpl-email-cold-1',
    name: 'Cold Outreach: 15-Hour Operational Bottleneck Hook',
    channel: 'email',
    category: 'Cold Outreach',
    subject: 'Quick question regarding {{company}}\'s workflow automation',
    description: 'High-converting cold email addressing manual data reconciliation and engineering bottlenecks.',
    body: `Hi {{first_name}},

I noticed {{company}} has been expanding operations recently. Most {{job_title}}s we speak with in {{industry}} are losing 15-20 hours every week manually reconciling data across disconnected systems.

At {{my_company}}, we built an automated enterprise workflow engine that reduced pipeline bottlenecks by 40% for teams like Apex Financial.

Do you have 10 minutes this Thursday afternoon to see if this could move the needle for {{company}}?

Best,
{{my_name}}
{{meeting_link}}`,
    tags: ['Cold Pitch', 'Pain Point', 'B2B'],
    useCount: 142,
    responseRatePct: 24.8,
    isSystem: true,
    createdAt: '2025-05-01',
    updatedAt: '2025-05-15',
  },
  {
    id: 'tpl-email-cold-2',
    name: 'Cold Outreach: Peer Referral & Social Proof',
    channel: 'email',
    category: 'Cold Outreach',
    subject: '{{first_name}} / idea for {{company}}',
    description: 'Casual executive-to-executive peer outreach referencing similar industry success.',
    body: `Hi {{first_name}},

I was reviewing {{company}}'s recent product initiatives and wanted to reach out directly.

We recently helped another fast-growing enterprise in {{industry}} automate their entire inbound lead routing and webhook dispatching with zero downtime.

Would you be open to a quick 5-minute chat next week, or should I connect with someone else on your engineering or operations team?

Thanks,
{{my_name}}
{{my_company}}`,
    tags: ['Executive', 'Short', 'Referral'],
    useCount: 98,
    responseRatePct: 29.4,
    isSystem: true,
    createdAt: '2025-05-02',
    updatedAt: '2025-05-16',
  },
  {
    id: 'tpl-email-cold-3',
    name: 'Cold Outreach: 2-Minute Interactive Demo',
    channel: 'email',
    category: 'Cold Outreach',
    subject: '{{company}} + {{my_company}}',
    description: 'Super concise 3-sentence email with direct calendar link.',
    body: `Hi {{first_name}},

Are you currently exploring ways to modernize backend workflow automation and webhook security at {{company}} this quarter?

If so, here is a 2-minute interactive overview of what we built: {{meeting_link}}

Happy to answer any technical questions whenever convenient.

Best,
{{my_name}}`,
    tags: ['Ultra Short', 'Demo', 'Low Friction'],
    useCount: 84,
    responseRatePct: 21.2,
    isSystem: true,
    createdAt: '2025-05-05',
    updatedAt: '2025-05-18',
  },
  {
    id: 'tpl-email-follow-1',
    name: 'Follow-Up: Quick Bump with Added Value',
    channel: 'email',
    category: 'Follow-Up',
    subject: 'Re: Quick question regarding {{company}}\'s workflow automation',
    description: 'Day 3 gentle follow-up providing extra context without sounding aggressive.',
    body: `Hi {{first_name}},

Following up quickly in case my earlier note got buried in your inbox.

We just released a benchmark study on how mid-market SaaS teams prevent webhook drops and audit privilege access. Thought it might be useful for {{company}}: https://ozostack.io/security-benchmark

Would 10 minutes next Tuesday work to connect?

Best regards,
{{my_name}}`,
    tags: ['Follow Up', 'Resource', 'Gentle'],
    useCount: 115,
    responseRatePct: 31.5,
    isSystem: true,
    createdAt: '2025-05-06',
    updatedAt: '2025-05-19',
  },
  {
    id: 'tpl-email-reengage-1',
    name: 'Re-engagement: Permission to Close File',
    channel: 'email',
    category: 'Re-engagement',
    subject: 'Permission to close your file at {{company}}?',
    description: 'The classic high-response breakup email that re-ignites cold leads.',
    body: `Hi {{first_name}},

I haven't heard back, so I assume workflow automation isn't a top priority for {{company}} right now.

I'll stop following up so I don't clutter your inbox. If things change in Q3 or Q4, feel free to reach back out anytime.

Wishing you and {{company}} continued success!

Best,
{{my_name}}`,
    tags: ['Breakup', 'Re-engagement', 'High Response'],
    useCount: 67,
    responseRatePct: 38.2,
    isSystem: true,
    createdAt: '2025-05-08',
    updatedAt: '2025-05-19',
  },

  // --- COLD WHATSAPP TEMPLATES ---
  {
    id: 'tpl-wa-cold-1',
    name: 'WhatsApp Cold: Direct Friendly Intro & Value Hook',
    channel: 'whatsapp',
    category: 'Cold Outreach',
    description: 'Professional yet conversational WhatsApp intro with bold emphasis and quick value hook.',
    body: `Hi {{first_name}}! 👋 This is {{my_name}} from *{{my_company}}*.

I came across {{company}} and noticed your focus on scaling operations. We recently helped similar enterprise teams eliminate 80% of manual data entry through automated workflows.

Thought this might be timely for you—would you be open to a quick 5-min intro call this week?

Here's my calendar: {{meeting_link}}`,
    tags: ['Cold WhatsApp', 'Friendly', 'Direct'],
    useCount: 184,
    responseRatePct: 34.6,
    isSystem: true,
    createdAt: '2025-05-02',
    updatedAt: '2025-05-17',
  },
  {
    id: 'tpl-wa-cold-2',
    name: 'WhatsApp Cold: Quick Casual Tech Stack Check',
    channel: 'whatsapp',
    category: 'Cold Outreach',
    description: 'Casual, low-pressure question asking how they manage integrations.',
    body: `Hi {{first_name}}, hope you're having a productive week!

Quick question regarding *{{company}}*—are you currently managing your webhook integrations and CRM pipelines in-house, or looking at automated orchestration platforms?

Happy to share a 2-min video on how we reduced latency to <15ms for enterprise clients if helpful! 🚀`,
    tags: ['Low Pressure', 'Question Hook', 'Technical'],
    useCount: 122,
    responseRatePct: 28.1,
    isSystem: true,
    createdAt: '2025-05-04',
    updatedAt: '2025-05-18',
  },
  {
    id: 'tpl-wa-follow-1',
    name: 'WhatsApp Follow-Up: Checking In on Cold Lead',
    channel: 'whatsapp',
    category: 'Follow-Up',
    description: 'Polite 2-day bump for leads who read but have not replied.',
    body: `Hi {{first_name}}, following up on my previous message. 

I know things get busy at {{company}}! If automating your workflow and CRM integrations is on your radar this quarter, feel free to grab a time here: {{meeting_link}}

Have a great rest of your week!`,
    tags: ['Follow Up', 'WhatsApp', 'Short'],
    useCount: 95,
    responseRatePct: 32.0,
    isSystem: true,
    createdAt: '2025-05-07',
    updatedAt: '2025-05-18',
  },
  {
    id: 'tpl-wa-booking-1',
    name: 'WhatsApp Meeting: Calendar Confirmation & Agenda',
    channel: 'whatsapp',
    category: 'Meeting Booking',
    description: 'Direct call confirmation with agenda and link for leads who showed interest.',
    body: `Hi {{first_name}}, looking forward to our demo call tomorrow for *{{company}}*! 📅

Here is our 15-min agenda:
1. Review {{company}}'s current integration pain points
2. Live demo of our automated workflow dispatcher
3. Q&A and next steps

Meeting link: {{meeting_link}}
Let me know if we need to adjust the timing!`,
    tags: ['Meeting Prep', 'Confirmation', 'High Attendance'],
    useCount: 160,
    responseRatePct: 88.5,
    isSystem: true,
    createdAt: '2025-05-09',
    updatedAt: '2025-05-20',
  },
];

const STORAGE_KEY = 'ozostack_outreach_templates_v1';

export const sanitizeTemplate = (raw: any): OutreachTemplate => {
  return {
    id: String(raw.id || `tpl-${Date.now()}`),
    name: String(raw.name || 'Untitled Template'),
    channel: raw.channel === 'whatsapp' ? 'whatsapp' : 'email',
    category: raw.category || 'Cold Outreach',
    subject: raw.channel === 'email' ? String(raw.subject || 'Follow-up regarding {{company}}') : undefined,
    body: String(raw.body || ''),
    description: String(raw.description || ''),
    tags: Array.isArray(raw.tags) && raw.tags.length > 0 ? raw.tags : ['Outreach'],
    useCount: Math.max(0, Number(raw.useCount) || 0),
    responseRatePct: Math.max(0, Number(raw.responseRatePct) || 25),
    isSystem: Boolean(raw.isSystem),
    createdAt: raw.createdAt || new Date().toISOString().split('T')[0],
    updatedAt: raw.updatedAt || new Date().toISOString().split('T')[0],
  };
};

export const loadTemplates = (): OutreachTemplate[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_TEMPLATES));
      return INITIAL_TEMPLATES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map(sanitizeTemplate);
    }
    return INITIAL_TEMPLATES;
  } catch (err) {
    console.error('Failed to load templates from localStorage:', err);
    return INITIAL_TEMPLATES;
  }
};

export const saveTemplates = (templates: OutreachTemplate[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
    window.dispatchEvent(new CustomEvent('ozostack-templates-changed', { detail: templates }));
  } catch (err) {
    console.error('Failed to save templates to localStorage:', err);
  }
};

export const renderTemplateText = (
  text: string,
  variables: Record<string, string>
): string => {
  let rendered = text;
  Object.entries(variables).forEach(([key, val]) => {
    rendered = rendered.split(key).join(val || '');
  });
  return rendered;
};

export const useOutreachTemplates = () => {
  const [templates, setTemplates] = useState<OutreachTemplate[]>(loadTemplates);

  useEffect(() => {
    const handleStorageChange = () => {
      setTemplates(loadTemplates());
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('ozostack-templates-changed', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('ozostack-templates-changed', handleStorageChange);
    };
  }, []);

  const saveTemplate = useCallback((template: OutreachTemplate) => {
    setTemplates((prev) => {
      const idx = prev.findIndex((t) => t.id === template.id);
      let updated: OutreachTemplate[];
      if (idx >= 0) {
        updated = [...prev];
        updated[idx] = { ...template, updatedAt: new Date().toISOString().split('T')[0] };
      } else {
        updated = [
          {
            ...template,
            createdAt: new Date().toISOString().split('T')[0],
            updatedAt: new Date().toISOString().split('T')[0],
          },
          ...prev,
        ];
      }
      saveTemplates(updated);
      return updated;
    });
  }, []);

  const deleteTemplate = useCallback((id: string) => {
    setTemplates((prev) => {
      const updated = prev.filter((t) => t.id !== id);
      saveTemplates(updated);
      return updated;
    });
  }, []);

  const duplicateTemplate = useCallback((template: OutreachTemplate) => {
    const copy: OutreachTemplate = {
      ...template,
      id: `tpl-${Date.now()}`,
      name: `${template.name} (Copy)`,
      useCount: 0,
      isSystem: false,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };
    saveTemplate(copy);
    return copy;
  }, [saveTemplate]);

  const incrementUseCount = useCallback((id: string) => {
    setTemplates((prev) => {
      const updated = prev.map((t) =>
        t.id === id ? { ...t, useCount: (t.useCount || 0) + 1 } : t
      );
      saveTemplates(updated);
      return updated;
    });
  }, []);

  return {
    templates,
    saveTemplate,
    deleteTemplate,
    duplicateTemplate,
    incrementUseCount,
  };
};

