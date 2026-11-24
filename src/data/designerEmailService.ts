import { getActiveMailUser } from './emailService';

export interface DesignerEmailTemplate {
  id: string;
  name: string;
  subject: string;
  html: string;
  plainText: string;
  prompt?: string;
  accentColor: string;
  ctaText?: string;
  ctaUrl?: string;
  useCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface EmailCampaignRunRecord {
  id: string;
  templateName: string;
  subject: string;
  source: 'CRM Leads' | 'AI Agents' | 'Auto-Push Campaign';
  total: number;
  sent: number;
  failed: number;
  delaySeconds: number;
  timestamp: string;
}

export interface CampaignRecipient {
  id: string;
  name: string;
  company: string;
  email: string;
  category?: string;
  city?: string;
}

const DESIGNER_TEMPLATES_KEY = (uid: string) => `ozostack_designer_templates_user_v1_${uid}`;
const CAMPAIGN_LOGS_KEY = (uid: string) => `ozostack_email_campaigns_user_v1_${uid}`;
const AI_USER_KEY_STORAGE = (uid: string) => `ozostack_gemini_key_user_v1_${uid}`;

export function isValidLeadEmail(email?: string): boolean {
  const clean = String(email || '').trim().toLowerCase();
  if (!clean || clean.endsWith('.local') || clean.startsWith('no-email@')) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(clean);
}

export function getCompanyBrandLogo(): string {
  try {
    const raw = localStorage.getItem('ozostack_invoice_branding');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.logoUrl && /^https?:\/\//i.test(parsed.logoUrl)) {
        return parsed.logoUrl;
      }
    }
  } catch {
    /* ignore */
  }
  return '';
}

function buildStarterDesignerTemplate(): DesignerEmailTemplate {
  const now = new Date().toISOString();
  const html = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f1f5f9;padding:28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
          <tr>
            <td style="background:linear-gradient(135deg,#0f172a 0%,#0284c7 100%);padding:32px 28px;color:#ffffff;">
              <div style="font-size:11px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:#bae6fd;margin-bottom:8px;">OzoStack Digital Growth</div>
              <h1 style="margin:0;font-size:24px;line-height:1.3;font-weight:800;color:#ffffff;">Grow {company} Faster with Modern Web, CRM &amp; AI Automation</h1>
              <p style="margin:10px 0 0;font-size:14px;line-height:1.5;color:#e0f2fe;">Tailored digital solutions built to bring consistent leads and streamline operations.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#1e293b;">Hi <strong>{firstName}</strong>,</p>
              <p style="margin:0 0 18px;font-size:14px;line-height:1.65;color:#475569;">We came across <strong>{company}</strong> and noticed great potential to scale your online visibility, automate customer follow-ups, and convert more enquiries into paying clients.</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;margin:18px 0;">
                <tr>
                  <td style="padding:16px 18px;font-size:13px;line-height:1.7;color:#334155;">
                    <div style="font-weight:700;color:#0f172a;margin-bottom:6px;">What we can help {company} achieve:</div>
                    &#10003;&nbsp; High-converting modern website &amp; Google visibility<br/>
                    &#10003;&nbsp; Automated WhatsApp &amp; Email follow-up system<br/>
                    &#10003;&nbsp; Dedicated CRM &amp; reporting dashboard for your team
                  </td>
                </tr>
              </table>
              <div style="text-align:center;margin:26px 0 12px;">
                <a href="https://ozostack.in" style="display:inline-block;background:#0284c7;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 28px;border-radius:10px;">Book a Free 15-Min Consultation &rarr;</a>
              </div>
              <p style="margin:20px 0 0;font-size:13px;line-height:1.6;color:#64748b;">Warm regards,<br/><strong style="color:#0f172a;">{owner}</strong><br/>OzoStack Technologies</p>
            </td>
          </tr>
          <tr>
            <td style="background:#f8fafc;padding:16px 28px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;text-align:center;">
              Sent by OzoStack &middot; Reply with "STOP" if you prefer not to receive future emails.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return {
    id: 'des-tpl-starter-1',
    name: 'OzoStack Growth & Website Offer (Starter)',
    subject: 'Quick growth idea for {company} — OzoStack',
    html,
    plainText:
      'Hi {firstName},\n\nWe came across {company} and noticed great potential to scale your online visibility, automate customer follow-ups, and convert more enquiries into paying clients.\n\nBook a free 15-min consultation: https://ozostack.in\n\nWarm regards,\n{owner}\nOzoStack Technologies',
    accentColor: '#0284c7',
    ctaText: 'Book a Free 15-Min Consultation',
    ctaUrl: 'https://ozostack.in',
    useCount: 0,
    createdAt: now,
    updatedAt: now,
  };
}

export function loadDesignerTemplates(userId?: string): DesignerEmailTemplate[] {
  const uid = userId || getActiveMailUser().id;
  try {
    const raw = localStorage.getItem(DESIGNER_TEMPLATES_KEY(uid));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    /* ignore */
  }
  return [buildStarterDesignerTemplate()];
}

export function saveDesignerTemplates(
  templates: DesignerEmailTemplate[],
  userId?: string
): void {
  const uid = userId || getActiveMailUser().id;
  try {
    localStorage.setItem(DESIGNER_TEMPLATES_KEY(uid), JSON.stringify(templates));
    window.dispatchEvent(new CustomEvent('ozostack-designer-templates-changed'));
  } catch {
    /* ignore */
  }
}

export function loadCampaignLogs(userId?: string): EmailCampaignRunRecord[] {
  const uid = userId || getActiveMailUser().id;
  try {
    const raw = localStorage.getItem(CAMPAIGN_LOGS_KEY(uid));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    /* ignore */
  }
  return [];
}

export function appendCampaignLog(
  entry: EmailCampaignRunRecord,
  userId?: string
): EmailCampaignRunRecord[] {
  const uid = userId || getActiveMailUser().id;
  const next = [entry, ...loadCampaignLogs(uid)].slice(0, 30);
  try {
    localStorage.setItem(CAMPAIGN_LOGS_KEY(uid), JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next;
}

export function personalizeDesignerEmail(
  tpl: { subject: string; html: string; plainText?: string },
  recipient: {
    name?: string;
    company?: string;
    category?: string;
    city?: string;
    owner?: string;
  }
): { subject: string; html: string; plainText: string } {
  const fullName = String(recipient.name || 'there').trim() || 'there';
  const firstName = fullName.split(/\s+/)[0] || 'there';
  const company = String(recipient.company || fullName || 'your business').trim();
  const category = String(recipient.category || 'your industry').trim();
  const city = String(recipient.city || '').trim();
  const owner = String(recipient.owner || getActiveMailUser().name || 'OzoStack Team').trim();

  const apply = (str: string) =>
    String(str || '')
      .replace(/\{firstName\}/gi, firstName)
      .replace(/\{name\}/gi, fullName)
      .replace(/\{company\}/gi, company)
      .replace(/\{category\}/gi, category)
      .replace(/\{city\}/gi, city)
      .replace(/\{owner\}/gi, owner);

  const subject = apply(tpl.subject);
  const html = apply(tpl.html);
  const fallbackPlain = html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const plainText = tpl.plainText ? apply(tpl.plainText) : fallbackPlain;

  return { subject, html, plainText };
}

export async function generateDesignerEmailWithAi(params: {
  prompt: string;
  accentColor: string;
  ctaText: string;
  ctaUrl: string;
  tone: 'Professional' | 'Friendly' | 'Hinglish' | 'Luxury Corporate';
  logoUrl?: string;
  userId?: string;
}): Promise<{
  ok: boolean;
  template?: Omit<DesignerEmailTemplate, 'id' | 'useCount' | 'createdAt' | 'updatedAt'>;
  error?: string;
}> {
  const uid = params.userId || getActiveMailUser().id;
  let userApiKey = '';
  try {
    userApiKey = localStorage.getItem(AI_USER_KEY_STORAGE(uid)) || '';
  } catch {
    /* ignore */
  }

  const systemInstruction = `You are an elite B2B HTML Email Designer.
Create a stunning, modern, mobile-responsive promotional/outreach HTML email using ONLY email-safe HTML tables and inline CSS (no external stylesheets, no JavaScript, max-width: 600px centered card on #f1f5f9 background).
Always include merge tags {firstName}, {company}, and {owner} naturally so every recipient gets a personalized email.
Return ONLY valid JSON (no markdown code fences) with exact keys:
- "name": short template title (max 6 words)
- "subject": compelling email subject line (can include {company} or {firstName})
- "html": complete <!DOCTYPE html> email HTML string with inline styles, hero header in brand color, clean readable typography, benefit bullets or offer card, bold rounded CTA button, signature with {owner}, and a small polite opt-out footer
- "plainText": clean plain-text fallback version of the same email`;

  const userPrompt = `Design request: ${params.prompt}
Brand primary color: ${params.accentColor}
Tone: ${params.tone}
CTA Button Text: ${params.ctaText || 'Book a Free Call'}
CTA Button Link: ${params.ctaUrl || 'https://ozostack.in'}
${params.logoUrl ? `Include company logo image at top of header: ${params.logoUrl} (max-height: 40px)` : 'Use clean typographic brand header (no broken images).'}`;

  try {
    const res = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userApiKey: userApiKey || undefined,
        systemInstruction,
        prompt: userPrompt,
        jsonMode: true,
      }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok || !data.text) {
      return { ok: false, error: data?.error || 'AI could not generate designer email.' };
    }

    const cleaned = String(data.text)
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```$/i, '')
      .trim();
    const parsed = JSON.parse(cleaned);

    if (!parsed?.html || !parsed?.subject) {
      return { ok: false, error: 'AI returned incomplete email HTML. Please try again.' };
    }

    return {
      ok: true,
      template: {
        name: String(parsed.name || 'AI Designer Email').trim(),
        subject: String(parsed.subject).trim(),
        html: String(parsed.html).trim(),
        plainText: String(parsed.plainText || '').trim(),
        prompt: params.prompt,
        accentColor: params.accentColor,
        ctaText: params.ctaText,
        ctaUrl: params.ctaUrl,
      },
    };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Error generating designer email.' };
  }
}

export function sleepCancellable(ms: number, shouldStop: () => boolean): Promise<void> {
  return new Promise((resolve) => {
    const step = 250;
    let elapsed = 0;
    const timer = setInterval(() => {
      elapsed += step;
      if (shouldStop() || elapsed >= ms) {
        clearInterval(timer);
        resolve();
      }
    }, step);
  });
}
