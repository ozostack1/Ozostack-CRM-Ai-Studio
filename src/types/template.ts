export type TemplateChannel = 'email' | 'whatsapp';

export type TemplateCategory =
  | 'Cold Outreach'
  | 'Follow-Up'
  | 'Meeting Booking'
  | 'Re-engagement'
  | 'Custom';

export interface OutreachTemplate {
  id: string;
  name: string;
  channel: TemplateChannel;
  category: TemplateCategory;
  subject?: string; // Required for Email, omitted for WhatsApp
  body: string;
  description?: string;
  tags: string[];
  useCount: number;
  responseRatePct?: number;
  isSystem?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MergeVariable {
  key: string;
  label: string;
  description: string;
  sampleValue: string;
}

