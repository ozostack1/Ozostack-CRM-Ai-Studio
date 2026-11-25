export type SkyWidgetId =
  | 'hero-kpis'
  | 'revenue-overview'
  | 'sales-pipeline'
  | 'lead-sources'
  | 'leads-kanban'
  | 'ai-assistant'
  | 'tasks-kanban'
  | 'financial-overview'
  | 'upcoming-schedule'
  | 'recent-activities'
  | 'key-performance'
  | 'connected-modules'
  | 'projects-progress'
  | 'invoices-snapshot'
  | 'daily-planner-card'
  | 'team-workload';

export type SkyWidgetSpan = 3 | 4 | 5 | 6 | 7 | 8 | 12;
export type SkyWidgetCategory = 'Overview' | 'Sales & CRM' | 'Operations' | 'Finance' | 'AI & Personal';

export interface SkyWidgetMeta {
  id: SkyWidgetId;
  title: string;
  description: string;
  category: SkyWidgetCategory;
  defaultSpan: SkyWidgetSpan;
  defaultEnabled: boolean;
}

export interface SkyLayoutItem {
  id: SkyWidgetId;
  span: SkyWidgetSpan;
}

export const SKY_WIDGET_CATALOG: SkyWidgetMeta[] = [
  {
    id: 'hero-kpis',
    title: '5 Hero KPI Cards',
    description: 'Leads, Sales Revenue, Active Projects, Pending Tasks & Conversion Rate with sparklines',
    category: 'Overview',
    defaultSpan: 12,
    defaultEnabled: true,
  },
  {
    id: 'revenue-overview',
    title: 'Revenue Overview Chart',
    description: 'Interactive 6-month Revenue vs Expenses dual area chart with hover tooltip',
    category: 'Finance',
    defaultSpan: 5,
    defaultEnabled: true,
  },
  {
    id: 'sales-pipeline',
    title: 'Sales Pipeline Funnel',
    description: 'Colourful tapered conversion funnel from New Lead to Won with rupee values',
    category: 'Sales & CRM',
    defaultSpan: 4,
    defaultEnabled: true,
  },
  {
    id: 'lead-sources',
    title: 'Lead Sources Donut',
    description: 'Multi-color interactive donut breakdown of lead acquisition channels',
    category: 'Sales & CRM',
    defaultSpan: 3,
    defaultEnabled: true,
  },
  {
    id: 'leads-kanban',
    title: 'Leads Kanban Board',
    description: '5-column live leads board with 1-click Call, WhatsApp & Email actions',
    category: 'Sales & CRM',
    defaultSpan: 8,
    defaultEnabled: true,
  },
  {
    id: 'ai-assistant',
    title: 'AI Business Assistant',
    description: 'Live Gemini AI chat analyzing your real leads, deals, tasks & revenue',
    category: 'AI & Personal',
    defaultSpan: 4,
    defaultEnabled: true,
  },
  {
    id: 'tasks-kanban',
    title: 'Tasks Kanban Board',
    description: '4-column live tasks board with 1-click completion checkboxes',
    category: 'Operations',
    defaultSpan: 7,
    defaultEnabled: true,
  },
  {
    id: 'financial-overview',
    title: 'Financial Overview & Profit Curve',
    description: 'Live Total Income, Expenses, Net Profit & 6-month profit curve',
    category: 'Finance',
    defaultSpan: 5,
    defaultEnabled: true,
  },
  {
    id: 'upcoming-schedule',
    title: 'Upcoming Meetings & Follow-Ups',
    description: 'Unified schedule of upcoming Calendar meetings & CRM follow-ups',
    category: 'Sales & CRM',
    defaultSpan: 6,
    defaultEnabled: true,
  },
  {
    id: 'recent-activities',
    title: 'Recent CRM Activities',
    description: 'Live feed of recent leads, invoices, payments & completed tasks',
    category: 'Overview',
    defaultSpan: 6,
    defaultEnabled: true,
  },
  {
    id: 'key-performance',
    title: 'Key Performance Switcher',
    description: 'Tabbed KPI strip (Sales / Finance / Projects / Tasks) with mini trend waves',
    category: 'Overview',
    defaultSpan: 6,
    defaultEnabled: false,
  },
  {
    id: 'connected-modules',
    title: 'Quick Module Shortcuts',
    description: '1-click jump cards to Projects, Tasks, Invoices, Expenses, Payments & P&L',
    category: 'Overview',
    defaultSpan: 12,
    defaultEnabled: false,
  },
  {
    id: 'projects-progress',
    title: 'Active Projects Tracker',
    description: 'Live project completion progress bars, client names & health status',
    category: 'Operations',
    defaultSpan: 6,
    defaultEnabled: false,
  },
  {
    id: 'invoices-snapshot',
    title: 'Invoices & Collections Snapshot',
    description: 'Paid, Pending & Overdue invoice summary plus latest invoices list',
    category: 'Finance',
    defaultSpan: 6,
    defaultEnabled: false,
  },
  {
    id: 'daily-planner-card',
    title: 'My Private Daily Plan & Rating',
    description: 'Your personal daily star rating, streak & today pending planner tasks (100% private)',
    category: 'AI & Personal',
    defaultSpan: 6,
    defaultEnabled: false,
  },
  {
    id: 'team-workload',
    title: 'Team Workload & Performance',
    description: 'Live leads & task completion rate per team member',
    category: 'Operations',
    defaultSpan: 6,
    defaultEnabled: false,
  },
];

export const DEFAULT_SKY_LAYOUT: SkyLayoutItem[] = SKY_WIDGET_CATALOG.filter(
  (w) => w.defaultEnabled
).map((w) => ({ id: w.id, span: w.defaultSpan }));

const VALID_IDS = new Set<string>(SKY_WIDGET_CATALOG.map((w) => w.id));
const VALID_SPANS = new Set<number>([3, 4, 5, 6, 7, 8, 12]);

export function getSkyLayoutKey(userId?: string | null): string {
  return `ozostack_sky_dashboard_layout_v1_${userId || 'global'}`;
}

export function loadSkyLayout(userId?: string | null): SkyLayoutItem[] {
  try {
    const raw = localStorage.getItem(getSkyLayoutKey(userId));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter(
          (item): item is SkyLayoutItem =>
            item &&
            typeof item === 'object' &&
            VALID_IDS.has(item.id) &&
            VALID_SPANS.has(Number(item.span))
        );
        return cleaned;
      }
    }
  } catch {
    /* fallback to default */
  }
  return [...DEFAULT_SKY_LAYOUT];
}

export function saveSkyLayout(userId: string | null | undefined, layout: SkyLayoutItem[]): void {
  try {
    localStorage.setItem(getSkyLayoutKey(userId), JSON.stringify(layout));
  } catch {
    /* quota fallback */
  }
}

export const SPAN_OPTIONS: { span: SkyWidgetSpan; label: string }[] = [
  { span: 4, label: '1/3' },
  { span: 6, label: '1/2' },
  { span: 8, label: '2/3' },
  { span: 12, label: 'Full' },
];

export function spanToColClass(span: SkyWidgetSpan): string {
  switch (span) {
    case 3:
      return 'lg:col-span-3';
    case 4:
      return 'lg:col-span-4';
    case 5:
      return 'lg:col-span-5';
    case 6:
      return 'lg:col-span-6';
    case 7:
      return 'lg:col-span-7';
    case 8:
      return 'lg:col-span-8';
    case 12:
    default:
      return 'lg:col-span-12';
  }
}
