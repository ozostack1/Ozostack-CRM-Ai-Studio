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
  /** User must have view permission for at least ONE listed module; omit if always allowed */
  requiredModules?: string[];
}

export interface SkyLayoutItem {
  id: SkyWidgetId;
  span: SkyWidgetSpan;
}

export const SKY_WIDGET_CATALOG: SkyWidgetMeta[] = [
  {
    id: 'hero-kpis',
    title: 'Hero KPI Cards',
    description: 'Role-scoped top metrics (only shows KPIs for modules your role can access)',
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
    requiredModules: ['Revenue', 'Profit & Loss'],
  },
  {
    id: 'sales-pipeline',
    title: 'Sales Pipeline Funnel',
    description: 'Colourful tapered conversion funnel from New Lead to Won with rupee values',
    category: 'Sales & CRM',
    defaultSpan: 4,
    defaultEnabled: true,
    requiredModules: ['Leads', 'Deals', 'Pipeline'],
  },
  {
    id: 'lead-sources',
    title: 'Lead Sources Donut',
    description: 'Multi-color interactive donut breakdown of lead acquisition channels',
    category: 'Sales & CRM',
    defaultSpan: 3,
    defaultEnabled: true,
    requiredModules: ['Leads'],
  },
  {
    id: 'leads-kanban',
    title: 'Leads Kanban Board',
    description: 'Live leads board grouped by all stages with Call, WhatsApp & Email actions',
    category: 'Sales & CRM',
    defaultSpan: 8,
    defaultEnabled: true,
    requiredModules: ['Leads'],
  },
  {
    id: 'ai-assistant',
    title: 'AI Business Assistant',
    description: 'Live AI helper analyzing only the modules & records your role is permitted to view',
    category: 'AI & Personal',
    defaultSpan: 4,
    defaultEnabled: true,
  },
  {
    id: 'tasks-kanban',
    title: 'Tasks Kanban Board',
    description: 'Interactive tasks board with 1-click completion checkboxes & attachment badges',
    category: 'Operations',
    defaultSpan: 7,
    defaultEnabled: true,
    requiredModules: ['Tasks'],
  },
  {
    id: 'financial-overview',
    title: 'Financial Overview & Profit Curve',
    description: 'Live Total Income, Expenses, Net Profit & 6-month profit curve',
    category: 'Finance',
    defaultSpan: 5,
    defaultEnabled: true,
    requiredModules: ['Revenue', 'Expenses', 'Profit & Loss'],
  },
  {
    id: 'upcoming-schedule',
    title: 'Upcoming Meetings & Follow-Ups',
    description: 'Unified schedule of your upcoming Calendar meetings & CRM follow-ups',
    category: 'Sales & CRM',
    defaultSpan: 6,
    defaultEnabled: true,
    requiredModules: ['Events & Calendar', 'Follow Ups'],
  },
  {
    id: 'recent-activities',
    title: 'Recent Activities',
    description: 'Live feed of recent updates across only your permitted CRM modules',
    category: 'Overview',
    defaultSpan: 6,
    defaultEnabled: true,
  },
  {
    id: 'key-performance',
    title: 'Key Performance Switcher',
    description: 'Tabbed KPI strip filtered to your allowed modules',
    category: 'Overview',
    defaultSpan: 6,
    defaultEnabled: false,
  },
  {
    id: 'connected-modules',
    title: 'Quick Module Shortcuts',
    description: '1-click jump cards to your permitted workspace modules',
    category: 'Overview',
    defaultSpan: 12,
    defaultEnabled: false,
  },
  {
    id: 'projects-progress',
    title: 'Active Projects Tracker',
    description: 'Live project completion progress bars, client names & deadlines',
    category: 'Operations',
    defaultSpan: 6,
    defaultEnabled: false,
    requiredModules: ['Projects'],
  },
  {
    id: 'invoices-snapshot',
    title: 'Invoices & Collections Snapshot',
    description: 'Paid, Pending & Overdue invoice summary plus latest invoices list',
    category: 'Finance',
    defaultSpan: 6,
    defaultEnabled: false,
    requiredModules: ['Invoices'],
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
    description: 'Live leads & task completion rate across team members',
    category: 'Operations',
    defaultSpan: 6,
    defaultEnabled: false,
    requiredModules: ['Team'],
  },
];

export const DEFAULT_SKY_LAYOUT: SkyLayoutItem[] = SKY_WIDGET_CATALOG.filter(
  (w) => w.defaultEnabled
).map((w) => ({ id: w.id, span: w.defaultSpan }));

const VALID_IDS = new Set<string>(SKY_WIDGET_CATALOG.map((w) => w.id));
const VALID_SPANS = new Set<number>([3, 4, 5, 6, 7, 8, 12]);

export function isWidgetPermitted(
  widgetId: SkyWidgetId,
  can: (module: string) => boolean
): boolean {
  const meta = SKY_WIDGET_CATALOG.find((w) => w.id === widgetId);
  if (!meta) return false;
  if (!meta.requiredModules || meta.requiredModules.length === 0) return true;
  return meta.requiredModules.some((mod) => can(mod));
}

export function getDefaultLayoutForRole(
  roleId: string | undefined,
  can: (module: string) => boolean
): SkyLayoutItem[] {
  let preset: SkyLayoutItem[];

  if (roleId === 'super-admin') {
    preset = [...DEFAULT_SKY_LAYOUT];
  } else if (roleId === 'finance-manager') {
    preset = [
      { id: 'hero-kpis', span: 12 },
      { id: 'revenue-overview', span: 7 },
      { id: 'financial-overview', span: 5 },
      { id: 'invoices-snapshot', span: 6 },
      { id: 'tasks-kanban', span: 6 },
      { id: 'projects-progress', span: 6 },
      { id: 'daily-planner-card', span: 6 },
    ];
  } else if (roleId === 'sales-exec') {
    preset = [
      { id: 'hero-kpis', span: 12 },
      { id: 'sales-pipeline', span: 6 },
      { id: 'lead-sources', span: 6 },
      { id: 'leads-kanban', span: 8 },
      { id: 'ai-assistant', span: 4 },
      { id: 'upcoming-schedule', span: 6 },
      { id: 'daily-planner-card', span: 6 },
      { id: 'tasks-kanban', span: 12 },
    ];
  } else if (roleId === 'hr-manager') {
    preset = [
      { id: 'hero-kpis', span: 12 },
      { id: 'team-workload', span: 6 },
      { id: 'daily-planner-card', span: 6 },
      { id: 'tasks-kanban', span: 7 },
      { id: 'upcoming-schedule', span: 5 },
      { id: 'projects-progress', span: 6 },
      { id: 'recent-activities', span: 6 },
    ];
  } else {
    // Employee / Developer / Project Staff / Custom Role ("My Workspace")
    preset = [
      { id: 'hero-kpis', span: 12 },
      { id: 'tasks-kanban', span: 7 },
      { id: 'daily-planner-card', span: 5 },
      { id: 'projects-progress', span: 6 },
      { id: 'upcoming-schedule', span: 6 },
      { id: 'leads-kanban', span: 8 },
      { id: 'sales-pipeline', span: 4 },
      { id: 'financial-overview', span: 6 },
      { id: 'recent-activities', span: 6 },
    ];
  }

  return preset.filter((item) => isWidgetPermitted(item.id, can));
}

export function getSkyLayoutKey(userId?: string | null): string {
  return `ozostack_sky_dashboard_layout_v1_${userId || 'global'}`;
}

export function loadSkyLayout(
  userId: string | null | undefined,
  roleId: string | undefined,
  can: (module: string) => boolean
): SkyLayoutItem[] {
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
            VALID_SPANS.has(Number(item.span)) &&
            isWidgetPermitted(item.id, can)
        );
        return cleaned;
      }
    }
  } catch {
    /* fallback to role default */
  }
  return getDefaultLayoutForRole(roleId, can);
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
