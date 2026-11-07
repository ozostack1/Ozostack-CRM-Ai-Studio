export interface WidgetDefinition {
  id: string;
  title: string;
  category: 'Executive' | 'Sales' | 'Operations' | 'Finance';
  description: string;
  defaultOrder: number;
}

export interface DashboardConfig {
  id: string;
  name: string;
  description: string;
  isDefault?: boolean;
  color?: string;
  widgetIds: string[];
  createdAt: string;
}

export const AVAILABLE_WIDGETS: WidgetDefinition[] = [
  {
    id: 'kpi-metrics',
    title: 'Executive KPI Cards & Ratios',
    category: 'Executive',
    description: 'High-level real-time revenue, active deals count, new leads, win rate & CRM funnel',
    defaultOrder: 1,
  },
  {
    id: 'charts-revenue',
    title: 'Revenue Trajectory & Sales Funnel',
    category: 'Sales',
    description: 'Monthly revenue growth curve, stage-by-stage pipeline funnel & AI Command Assistant',
    defaultOrder: 2,
  },
  {
    id: 'mid-analytics',
    title: 'Engineering Sprints & Team Performance',
    category: 'Operations',
    description: 'Project deliverable status, team member leaderboard, CSAT score & activity feed',
    defaultOrder: 3,
  },
  {
    id: 'tables-section',
    title: 'Deals, Overdue Tasks & Follow-Ups',
    category: 'Sales',
    description: 'Active enterprise deals table, urgent tasks, upcoming client meetings & invoices',
    defaultOrder: 4,
  },
  {
    id: 'bottom-kpi',
    title: 'Financial Health & Cash Runway Strip',
    category: 'Finance',
    description: 'Annual recurring revenue (ARR), monthly burn rate, cash runway & net profit margins',
    defaultOrder: 5,
  },
];

export const INITIAL_DASHBOARDS: DashboardConfig[] = [
  {
    id: 'ceo-command',
    name: 'CEO Command Center',
    description: 'Comprehensive 360-degree overview of enterprise operations, revenue, and delivery',
    isDefault: true,
    color: '#38bdf8',
    widgetIds: ['kpi-metrics', 'charts-revenue', 'mid-analytics', 'tables-section', 'bottom-kpi'],
    createdAt: '2025-05-01T00:00:00.000Z',
  },
  {
    id: 'sales-growth',
    name: 'Sales & Revenue',
    description: 'Focused view on deals velocity, pipeline conversions, and cash flow',
    isDefault: false,
    color: '#10b981',
    widgetIds: ['kpi-metrics', 'charts-revenue', 'tables-section', 'bottom-kpi'],
    createdAt: '2025-05-01T00:00:00.000Z',
  },
  {
    id: 'engineering-ops',
    name: 'Operations & Delivery',
    description: 'Engineering sprint tracking, overdue deliverables, and team productivity',
    isDefault: false,
    color: '#f59e0b',
    widgetIds: ['mid-analytics', 'tables-section', 'bottom-kpi'],
    createdAt: '2025-05-01T00:00:00.000Z',
  },
];

