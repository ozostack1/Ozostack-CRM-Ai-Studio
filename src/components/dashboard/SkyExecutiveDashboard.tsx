import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  DollarSign,
  Rocket,
  ClipboardList,
  TrendingUp,
  ChevronDown,
  Plus,
  Star,
  Check,
  Sparkles,
  Send,
  Phone,
  Mail,
  MessageCircle,
  Calendar,
  ArrowRight,
  CheckCircle2,
  Circle,
  Loader2,
  LayoutDashboard,
  Clock,
  Receipt,
  Briefcase,
  FolderKanban,
  Activity,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useSystemCurrency } from '../../data/currencyService';
import {
  INITIAL_LEADS,
  INITIAL_DEALS,
  INITIAL_PROJECTS,
  INITIAL_TASKS,
  INITIAL_FOLLOW_UPS,
  CALENDAR_EVENTS,
} from '../../data/mockData';
import {
  Lead,
  Deal,
  Project,
  TaskItem,
  FollowUp,
  CalendarEvent,
  Invoice,
  ExpenseItem,
  RevenueTransaction,
} from '../../types/crm';

export type DashboardDesignId = 'sky-executive' | 'classic';
type PeriodFilter = 'This Month' | 'Last 6 Months' | 'All Time';

interface SkyExecutiveDashboardProps {
  design: DashboardDesignId;
  defaultDesign: DashboardDesignId;
  onChangeDesign: (design: DashboardDesignId) => void;
  onSaveDefaultDesign: (design: DashboardDesignId) => void;
  onQuickCreate?: (
    type: 'lead' | 'deal' | 'project' | 'task' | 'event' | 'time' | 'document' | 'todo' | 'note'
  ) => void;
  onNotify: (msg: string) => void;
}

function readLSArray<T>(key: string, fallback: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    /* ignore */
  }
  return fallback;
}

function parseMoney(val: unknown): number {
  if (typeof val === 'number' && Number.isFinite(val)) return val;
  if (typeof val === 'string') {
    const n = parseFloat(val.replace(/[^0-9.-]/g, ''));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function getLocalTodayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function getInitials(name?: string): string {
  const parts = (name || 'U').trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return (parts[0] || 'U').slice(0, 2).toUpperCase();
}

function isDateInPeriod(dateStr: string | undefined, period: PeriodFilter): boolean {
  if (!dateStr || period === 'All Time') return true;
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return true;
  const now = new Date();
  if (period === 'This Month') {
    return parsed.getFullYear() === now.getFullYear() && parsed.getMonth() === now.getMonth();
  }
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  return parsed >= sixMonthsAgo;
}

const SOURCE_COLORS = ['#2563eb', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#06b6d4', '#ec4899'];

const FUNNEL_STAGES = [
  {
    key: 'New Lead',
    label: 'New Lead',
    match: ['new', 'new lead'],
    gradient: 'from-blue-600 to-blue-400',
    widthPct: 100,
  },
  {
    key: 'Contacted',
    label: 'Contacted',
    match: ['contacted', 'follow-up', 'follow up'],
    gradient: 'from-sky-500 to-cyan-400',
    widthPct: 86,
  },
  {
    key: 'Qualified',
    label: 'Qualified',
    match: ['qualified', 'discovery'],
    gradient: 'from-emerald-500 to-teal-400',
    widthPct: 74,
  },
  {
    key: 'Proposal Sent',
    label: 'Proposal Sent',
    match: ['proposal', 'proposal sent', 'negotiation', 'contract'],
    gradient: 'from-orange-500 to-amber-400',
    widthPct: 62,
  },
  {
    key: 'Won',
    label: 'Won',
    match: ['won', 'closed won'],
    gradient: 'from-green-500 to-emerald-400',
    widthPct: 50,
  },
];

export const SkyExecutiveDashboard: React.FC<SkyExecutiveDashboardProps> = ({
  design,
  defaultDesign,
  onChangeDesign,
  onSaveDefaultDesign,
  onQuickCreate,
  onNotify,
}) => {
  const { theme, setActiveNav } = useTheme();
  const { currentUser, scopeFilter } = useAuth();
  const { currency, formatMoney } = useSystemCurrency();
  const isLight = theme === 'white-sky';

  const [period, setPeriod] = useState<PeriodFilter>('All Time');
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [designMenuOpen, setDesignMenuOpen] = useState(false);
  const [hoveredMonthIdx, setHoveredMonthIdx] = useState<number | null>(null);
  const [hoveredSource, setHoveredSource] = useState<string | null>(null);

  // AI Business Assistant state
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);

  // Live reactive storage read
  const readAllData = () => ({
    leads: readLSArray<Lead>('ozostack_leads_v2', INITIAL_LEADS),
    deals: readLSArray<Deal>('ozostack_deals_v2', INITIAL_DEALS),
    projects: readLSArray<Project>('ozostack_projects', INITIAL_PROJECTS),
    tasks: readLSArray<TaskItem>('ozostack_tasks_v2', INITIAL_TASKS),
    followUps: readLSArray<FollowUp>('ozostack_followups_v2', INITIAL_FOLLOW_UPS),
    calendarEvents: readLSArray<CalendarEvent>('ozostack_calendar_events_v3', CALENDAR_EVENTS),
    invoices: readLSArray<Invoice>('ozostack_invoices', []),
    revenueTxns: readLSArray<RevenueTransaction>('ozostack_revenue_transactions', []),
    expenses: readLSArray<ExpenseItem>('ozostack_expenses', []),
  });

  const [rawData, setRawData] = useState(readAllData);

  useEffect(() => {
    const sync = () => setRawData(readAllData());
    window.addEventListener('storage', sync);
    window.addEventListener('ozostack-crm-config-changed', sync);
    window.addEventListener('ozostack-finance-changed', sync);
    window.addEventListener('focus', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('ozostack-crm-config-changed', sync);
      window.removeEventListener('ozostack-finance-changed', sync);
      window.removeEventListener('focus', sync);
    };
  }, []);

  // Apply role-based scoping
  const scopedLeads = useMemo(
    () => scopeFilter(rawData.leads, (l) => ({ owner: l.owner })),
    [rawData.leads, scopeFilter]
  );
  const scopedDeals = useMemo(
    () => scopeFilter(rawData.deals, (d) => ({ owner: d.owner })),
    [rawData.deals, scopeFilter]
  );
  const scopedProjects = useMemo(
    () =>
      scopeFilter(rawData.projects, (p) => ({
        owner: [p.projectManager, ...(p.team || [])],
      })),
    [rawData.projects, scopeFilter]
  );
  const scopedTasks = useMemo(
    () => scopeFilter(rawData.tasks, (t) => ({ owner: t.assignee })),
    [rawData.tasks, scopeFilter]
  );
  const scopedFollowUps = useMemo(
    () => scopeFilter(rawData.followUps, (f) => ({ owner: f.owner })),
    [rawData.followUps, scopeFilter]
  );
  const scopedCalendar = useMemo(
    () =>
      scopeFilter(rawData.calendarEvents, (e) => ({
        owner: [e.owner, ...(e.attendees || [])],
      })),
    [rawData.calendarEvents, scopeFilter]
  );

  // Period-filtered datasets
  const periodLeads = useMemo(
    () => scopedLeads.filter((l) => isDateInPeriod(l.createdAt, period)),
    [scopedLeads, period]
  );

  // Real Finance Metrics (deduplicated revenue: revenue_transactions + any Paid invoice not yet logged)
  const financeMetrics = useMemo(() => {
    const isValidRev = (r: RevenueTransaction) => {
      const st = String(r.status || '').toLowerCase();
      return st !== 'refunded' && st !== 'failed' && st !== 'cancelled';
    };
    const revTxns = rawData.revenueTxns.filter(
      (r) => isValidRev(r) && isDateInPeriod(r.date, period)
    );
    const loggedInvNums = new Set(revTxns.map((r) => r.invoiceNumber).filter(Boolean));
    const paidInvoicesExtra = rawData.invoices.filter(
      (inv) =>
        inv.status === 'Paid' &&
        !loggedInvNums.has(inv.invoiceNumber) &&
        isDateInPeriod(inv.issueDate || inv.createdAt, period)
    );

    const totalRevenue =
      revTxns.reduce((s, r) => s + parseMoney(r.amount), 0) +
      paidInvoicesExtra.reduce(
        (s, inv) => s + parseMoney(inv.totalAmount ?? inv.amountNumeric ?? inv.amount),
        0
      );

    const periodExpenses = rawData.expenses.filter((e) => isDateInPeriod(e.date, period));
    const totalExpenses = periodExpenses.reduce((s, e) => s + parseMoney(e.amount), 0);
    const netProfit = totalRevenue - totalExpenses;
    const marginPct = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;

    // Last 6 months series for Revenue & Expenses Area Chart
    const now = new Date();
    const months: { key: string; label: string; revenue: number; expenses: number; profit: number }[] =
      [];
    for (let i = 5; i >= 0; i--) {
      const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const ym = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
      const label = dt.toLocaleDateString('en-US', { month: 'short' });
      months.push({ key: ym, label, revenue: 0, expenses: 0, profit: 0 });
    }

    const monthMap = new Map(months.map((m) => [m.key, m]));
    const allRev = rawData.revenueTxns.filter(isValidRev);
    const allLoggedInvs = new Set(allRev.map((r) => r.invoiceNumber).filter(Boolean));
    allRev.forEach((r) => {
      const ym = (r.date || '').slice(0, 7);
      const bucket = monthMap.get(ym);
      if (bucket) bucket.revenue += parseMoney(r.amount);
    });
    rawData.invoices.forEach((inv) => {
      if (inv.status !== 'Paid' || allLoggedInvs.has(inv.invoiceNumber)) return;
      const ym = (inv.issueDate || inv.createdAt || '').slice(0, 7);
      const bucket = monthMap.get(ym);
      if (bucket) bucket.revenue += parseMoney(inv.totalAmount ?? inv.amountNumeric ?? inv.amount);
    });
    rawData.expenses.forEach((e) => {
      const ym = (e.date || '').slice(0, 7);
      const bucket = monthMap.get(ym);
      if (bucket) bucket.expenses += parseMoney(e.amount);
    });
    months.forEach((m) => {
      m.profit = m.revenue - m.expenses;
    });

    return { totalRevenue, totalExpenses, netProfit, marginPct, months };
  }, [rawData.revenueTxns, rawData.invoices, rawData.expenses, period]);

  // Top 5 KPIs
  const kpiStats = useMemo(() => {
    const totalLeads = periodLeads.length;
    const hotLeads = periodLeads.filter((l) => l.priority === 'Hot').length;
    const activeProjects = scopedProjects.filter((p) =>
      ['in progress', 'planning', 'delayed'].includes((p.status || '').toLowerCase())
    ).length;
    const pendingTasks = scopedTasks.filter((t) => t.status !== 'Completed').length;
    const completedTasks = scopedTasks.filter((t) => t.status === 'Completed').length;

    const wonLeads = periodLeads.filter((l) => (l.status || '').toLowerCase().includes('won')).length;
    const wonDeals = scopedDeals.filter((d) => (d.stage || '').toLowerCase().includes('won')).length;
    const totalOpportunities = totalLeads + scopedDeals.length;
    const conversionRate =
      totalOpportunities > 0
        ? Number((((wonLeads + wonDeals) / totalOpportunities) * 100).toFixed(1))
        : 0;

    return {
      totalLeads,
      hotLeads,
      activeProjects,
      totalProjects: scopedProjects.length,
      pendingTasks,
      completedTasks,
      conversionRate,
      wonCount: wonLeads + wonDeals,
    };
  }, [periodLeads, scopedProjects, scopedTasks, scopedDeals]);

  // Sales Pipeline Funnel data
  const funnelData = useMemo(() => {
    return FUNNEL_STAGES.map((stage) => {
      const matchedLeads = periodLeads.filter((l) =>
        stage.match.includes((l.status || '').trim().toLowerCase())
      );
      const matchedDeals = scopedDeals.filter((d) =>
        stage.match.includes((d.stage || '').trim().toLowerCase())
      );
      const count = matchedLeads.length + matchedDeals.length;
      const value =
        matchedLeads.reduce((s, l) => s + parseMoney(l.value), 0) +
        matchedDeals.reduce((s, d) => s + parseMoney(d.value), 0);
      return { ...stage, count, value };
    });
  }, [periodLeads, scopedDeals]);

  // Lead Sources Donut data
  const sourceSlices = useMemo(() => {
    const counts = new Map<string, number>();
    periodLeads.forEach((l) => {
      const src = (l.source || 'Others').trim() || 'Others';
      counts.set(src, (counts.get(src) || 0) + 1);
    });
    const total = periodLeads.length || 1;
    const sorted = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    let cumulative = 0;
    return sorted.map(([name, count], idx) => {
      const pct = Number(((count / total) * 100).toFixed(1));
      const startPct = cumulative;
      cumulative += pct;
      return {
        name,
        count,
        pct,
        startPct,
        color: SOURCE_COLORS[idx % SOURCE_COLORS.length],
      };
    });
  }, [periodLeads]);

  // Leads Kanban Columns (5 colorful columns matching Reference 1)
  const leadsKanbanColumns = useMemo(() => {
    const defs = [
      {
        title: 'New Lead',
        match: ['new', 'new lead'],
        headerBg: isLight ? 'bg-blue-50 text-blue-700' : 'bg-blue-950/50 text-blue-300',
        colBg: isLight ? 'bg-blue-50/40 border-blue-100' : 'bg-blue-950/15 border-blue-900/40',
        avatarBg: 'bg-blue-500',
      },
      {
        title: 'Contacted',
        match: ['contacted', 'follow-up', 'follow up'],
        headerBg: isLight ? 'bg-sky-50 text-sky-700' : 'bg-sky-950/50 text-sky-300',
        colBg: isLight ? 'bg-sky-50/40 border-sky-100' : 'bg-sky-950/15 border-sky-900/40',
        avatarBg: 'bg-sky-500',
      },
      {
        title: 'Qualified',
        match: ['qualified'],
        headerBg: isLight ? 'bg-emerald-50 text-emerald-700' : 'bg-emerald-950/50 text-emerald-300',
        colBg: isLight ? 'bg-emerald-50/40 border-emerald-100' : 'bg-emerald-950/15 border-emerald-900/40',
        avatarBg: 'bg-emerald-500',
      },
      {
        title: 'Proposal',
        match: ['proposal', 'proposal sent', 'negotiation'],
        headerBg: isLight ? 'bg-amber-50 text-amber-700' : 'bg-amber-950/50 text-amber-300',
        colBg: isLight ? 'bg-amber-50/40 border-amber-100' : 'bg-amber-950/15 border-amber-900/40',
        avatarBg: 'bg-amber-500',
      },
      {
        title: 'Won',
        match: ['won', 'closed won'],
        headerBg: isLight ? 'bg-teal-50 text-teal-700' : 'bg-teal-950/50 text-teal-300',
        colBg: isLight ? 'bg-teal-50/40 border-teal-100' : 'bg-teal-950/15 border-teal-900/40',
        avatarBg: 'bg-teal-500',
      },
    ];
    return defs.map((col) => {
      const items = scopedLeads.filter((l) =>
        col.match.includes((l.status || '').trim().toLowerCase())
      );
      return { ...col, items };
    });
  }, [scopedLeads, isLight]);

  // Tasks Kanban Columns (4 colorful columns matching Reference 1 & 2)
  const tasksKanbanColumns = useMemo(() => {
    const defs = [
      {
        key: 'To Do',
        title: 'To Do',
        dot: 'bg-slate-400',
        colBg: isLight ? 'bg-slate-50/80 border-slate-200/80' : 'bg-slate-900/50 border-slate-800',
        badge: isLight ? 'text-slate-700' : 'text-slate-300',
      },
      {
        key: 'In Progress',
        title: 'In Progress',
        dot: 'bg-blue-500',
        colBg: isLight ? 'bg-blue-50/50 border-blue-100' : 'bg-blue-950/20 border-blue-900/40',
        badge: isLight ? 'text-blue-700' : 'text-blue-300',
      },
      {
        key: 'In Review',
        title: 'Review',
        dot: 'bg-amber-500',
        colBg: isLight ? 'bg-amber-50/50 border-amber-100' : 'bg-amber-950/20 border-amber-900/40',
        badge: isLight ? 'text-amber-700' : 'text-amber-300',
      },
      {
        key: 'Completed',
        title: 'Done',
        dot: 'bg-emerald-500',
        colBg: isLight ? 'bg-emerald-50/50 border-emerald-100' : 'bg-emerald-950/20 border-emerald-900/40',
        badge: isLight ? 'text-emerald-700' : 'text-emerald-300',
      },
    ];
    return defs.map((col) => ({
      ...col,
      items: scopedTasks.filter((t) => t.status === col.key),
    }));
  }, [scopedTasks, isLight]);

  // Toggle task completion right from the Kanban preview
  const handleToggleTaskDone = (taskId: string) => {
    try {
      const all = readLSArray<TaskItem>('ozostack_tasks_v2', INITIAL_TASKS);
      const updated = all.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: (t.status === 'Completed' ? 'To Do' : 'Completed') as TaskItem['status'],
            }
          : t
      );
      localStorage.setItem('ozostack_tasks_v2', JSON.stringify(updated));
      window.dispatchEvent(new Event('ozostack-crm-config-changed'));
      setRawData((prev) => ({ ...prev, tasks: updated }));
      onNotify('Task status updated.');
    } catch {
      /* ignore */
    }
  };

  // Upcoming Meetings & Follow-Ups
  const upcomingSchedule = useMemo(() => {
    const today = getLocalTodayIso();
    type ScheduleRow = {
      id: string;
      time: string;
      title: string;
      subtitle: string;
      date: string;
      isToday: boolean;
      targetNav: 'Events & Calendar' | 'Follow Ups';
    };

    const items: ScheduleRow[] = [];
    scopedCalendar.forEach((ev) => {
      if (ev.status === 'Completed' || ev.status === 'Cancelled') return;
      if (ev.date && ev.date >= today) {
        items.push({
          id: `cal-${ev.id}`,
          time: ev.startTime || ev.time || '10:00 AM',
          title: ev.title,
          subtitle: `${ev.company || ev.type || 'Meeting'}`,
          date: ev.date,
          isToday: ev.date === today,
          targetNav: 'Events & Calendar',
        });
      }
    });

    scopedFollowUps.forEach((fu) => {
      if (fu.status === 'Completed' || fu.status === 'Cancelled') return;
      const dt = fu.scheduledDate || today;
      items.push({
        id: `fu-${fu.id}`,
        time: fu.scheduledTime || fu.nextFollowUp || 'Scheduled',
        title: `${fu.type} with ${fu.contact}`,
        subtitle: fu.company || fu.dealName || 'Follow-Up',
        date: dt,
        isToday: dt === today,
        targetNav: 'Follow Ups',
      });
    });

    return items.sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);
  }, [scopedCalendar, scopedFollowUps]);

  // Live Recent Activities Feed
  const recentActivities = useMemo(() => {
    const feed: {
      id: string;
      text: string;
      meta: string;
      tone: 'blue' | 'emerald' | 'amber' | 'purple';
      nav: string;
    }[] = [];

    scopedLeads.slice(0, 3).forEach((l) => {
      feed.push({
        id: `act-lead-${l.id}`,
        text: `Lead "${l.name}" (${l.company || 'Direct'}) — ${l.status}`,
        meta: l.source || 'CRM Lead',
        tone: 'blue',
        nav: 'Leads',
      });
    });

    rawData.invoices.slice(0, 2).forEach((inv) => {
      feed.push({
        id: `act-inv-${inv.id}`,
        text: `Invoice ${inv.invoiceNumber} for ${inv.client} — ${inv.status}`,
        meta: formatMoney(parseMoney(inv.totalAmount ?? inv.amountNumeric ?? inv.amount)),
        tone: 'emerald',
        nav: 'Invoices',
      });
    });

    scopedTasks
      .filter((t) => t.status === 'Completed')
      .slice(0, 2)
      .forEach((t) => {
        feed.push({
          id: `act-task-${t.id}`,
          text: `Task completed: ${t.title}`,
          meta: t.assignee || 'Team',
          tone: 'purple',
          nav: 'Tasks',
        });
      });

    return feed.slice(0, 5);
  }, [scopedLeads, rawData.invoices, scopedTasks, formatMoney]);

  // Live AI Business Assistant handler
  const handleAskBusinessAi = async (promptText?: string) => {
    const q = (promptText ?? aiQuestion).trim();
    if (!q || aiLoading) return;
    setAiQuestion(q);
    setAiLoading(true);
    setAiAnswer(null);

    try {
      const topLeadsList = scopedLeads
        .slice(0, 8)
        .map((l) => `${l.name} (${l.company}, ${l.status}, ${l.priority}, val:${l.value})`)
        .join('; ');

      const contextSummary = `Live Ozostack CRM Snapshot for ${currentUser?.name || 'User'} (${period}):
- Total Leads: ${kpiStats.totalLeads} (Hot: ${kpiStats.hotLeads})
- Active Deals: ${scopedDeals.length} | Conversion Rate: ${kpiStats.conversionRate}%
- Revenue: ${formatMoney(financeMetrics.totalRevenue)} | Expenses: ${formatMoney(financeMetrics.totalExpenses)} | Net Profit: ${formatMoney(financeMetrics.netProfit)}
- Active Projects: ${kpiStats.activeProjects}/${kpiStats.totalProjects} | Pending Tasks: ${kpiStats.pendingTasks}
- Upcoming Follow-Ups/Meetings: ${upcomingSchedule.length}
- Sample Leads: ${topLeadsList || 'None yet'}`;

      const resp = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `${contextSummary}\n\nUser Question: ${q}\nGive a crisp, practical 3-5 bullet answer based strictly on these real CRM numbers.`,
          systemInstruction:
            'You are the Ozostack CRM AI Business Assistant. Be concise, executive, and actionable (under 110 words). Use clean short bullets.',
        }),
      });

      const data = await resp.json().catch(() => ({}));
      if (resp.ok && data?.ok && data?.text) {
        setAiAnswer(String(data.text).trim());
      } else {
        setAiAnswer(data?.error || 'AI Assistant is temporarily unavailable. Try again shortly.');
      }
    } catch {
      setAiAnswer('Network error reaching AI Assistant. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  // Chart math for Revenue vs Expenses 6-month smooth SVG chart
  const revChartGeometry = useMemo(() => {
    const W = 460;
    const H = 165;
    const padL = 16;
    const padR = 16;
    const padT = 18;
    const padB = 26;
    const innerW = W - padL - padR;
    const innerH = H - padT - padB;

    const months = financeMetrics.months;
    const maxVal = Math.max(
      100,
      ...months.map((m) => Math.max(m.revenue, m.expenses))
    );

    const pts = months.map((m, i) => {
      const x = padL + (months.length > 1 ? (i / (months.length - 1)) * innerW : innerW / 2);
      const yRev = padT + innerH - (m.revenue / maxVal) * innerH;
      const yExp = padT + innerH - (m.expenses / maxVal) * innerH;
      return { ...m, x, yRev, yExp };
    });

    const revLine = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.yRev.toFixed(1)}`).join(' ');
    const revArea =
      pts.length > 0
        ? `${revLine} L ${pts[pts.length - 1].x.toFixed(1)} ${(padT + innerH).toFixed(1)} L ${pts[0].x.toFixed(1)} ${(padT + innerH).toFixed(1)} Z`
        : '';
    const expLine = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.yExp.toFixed(1)}`).join(' ');

    return { W, H, padT, innerH, pts, revLine, revArea, expLine };
  }, [financeMetrics.months]);

  // Profit smooth SVG curve for Financial Overview card
  const profitCurve = useMemo(() => {
    const W = 320;
    const H = 74;
    const months = financeMetrics.months;
    const vals = months.map((m) => Math.max(0, m.profit));
    const maxVal = Math.max(100, ...vals);
    const pts = vals.map((v, i) => {
      const x = 8 + (vals.length > 1 ? (i / (vals.length - 1)) * (W - 16) : W / 2);
      const y = 10 + (H - 22) - (v / maxVal) * (H - 22);
      return { x, y, label: months[i].label };
    });
    const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    const area =
      pts.length > 0
        ? `${line} L ${pts[pts.length - 1].x.toFixed(1)} ${H - 12} L ${pts[0].x.toFixed(1)} ${H - 12} Z`
        : '';
    return { W, H, pts, line, area };
  }, [financeMetrics.months]);

  const cardClass = isLight
    ? 'bg-white border-sky-100/90 shadow-xs'
    : 'bg-[#0f172a]/95 border-slate-800 shadow-md';

  const isCurrentDefault = design === defaultDesign;
  const firstName = (currentUser?.name || 'Admin').split(' ')[0];

  const activeHoverMonth =
    hoveredMonthIdx !== null ? revChartGeometry.pts[hoveredMonthIdx] : revChartGeometry.pts[revChartGeometry.pts.length - 1];

  return (
    <div className="space-y-4">
      {(designMenuOpen || quickCreateOpen) && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => {
            setDesignMenuOpen(false);
            setQuickCreateOpen(false);
          }}
        />
      )}
      {/* 1. SCENIC SKY HERO BANNER + DESIGN SWITCHER + QUICK CREATE */}
      <div
        className={`relative rounded-2xl border overflow-visible ${
          isLight
            ? 'border-sky-200/80 bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-50/70'
            : 'border-slate-800 bg-gradient-to-br from-[#0c1d3d] via-[#0f172a] to-[#13203d]'
        }`}
      >
        {/* Subtle Decorative Scenic Mountain Silhouette (like Reference 1) */}
        <svg
          viewBox="0 0 1200 180"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full rounded-2xl pointer-events-none opacity-45"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="skyMtn1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={isLight ? '#60a5fa' : '#0284c7'} stopOpacity="0.45" />
              <stop offset="100%" stopColor={isLight ? '#dbeafe' : '#0f172a'} stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="skyMtn2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={isLight ? '#38bdf8' : '#38bdf8'} stopOpacity="0.3" />
              <stop offset="100%" stopColor={isLight ? '#eff6ff' : '#0f172a'} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M0 180 L0 125 L160 72 L295 110 L465 44 L650 105 L825 58 L985 112 L1120 74 L1200 102 L1200 180 Z"
            fill="url(#skyMtn1)"
          />
          <path
            d="M0 180 L0 140 L220 96 L380 132 L570 76 L760 128 L930 88 L1200 132 L1200 180 Z"
            fill="url(#skyMtn2)"
          />
        </svg>

        <div className="relative z-40 px-4 sm:px-6 pt-5 pb-14 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left Greeting */}
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-extrabold text-base flex items-center justify-center shadow-md ring-2 ring-white/70 dark:ring-slate-700 shrink-0">
              {getInitials(currentUser?.name)}
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {getGreeting()}, {firstName}! 👋
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                Here’s what’s happening with your business today — 100% live CRM telemetry.
              </p>
            </div>
          </div>

          {/* Right Controls: Design Dropdown + Save Default + Period + Quick Create */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Dashboard Design Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setDesignMenuOpen((v) => !v);
                  setQuickCreateOpen(false);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all shadow-2xs ${
                  isLight
                    ? 'bg-white/95 border-sky-200 text-slate-800 hover:border-sky-400'
                    : 'bg-slate-900/90 border-slate-700 text-slate-100 hover:border-sky-500'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-sky-500" />
                <span>Design: Sky Executive</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {designMenuOpen && (
                <div
                  className={`absolute right-0 mt-1.5 w-60 rounded-2xl border shadow-xl z-40 p-1.5 ${
                    isLight ? 'bg-white border-sky-100' : 'bg-[#0f172a] border-slate-700'
                  }`}
                >
                  <div className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Switch Dashboard Design
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onChangeDesign('sky-executive');
                      setDesignMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition-colors ${
                      design === 'sky-executive'
                        ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="text-left">
                      <div>Sky Executive</div>
                      <div className="text-[10px] font-normal text-slate-400">
                        Colourful charts, funnel & kanban
                      </div>
                    </div>
                    {design === 'sky-executive' && <Check className="w-4 h-4 shrink-0" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onChangeDesign('classic');
                      setDesignMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition-colors mt-0.5 ${
                      design === 'classic'
                        ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="text-left">
                      <div>Classic Command</div>
                      <div className="text-[10px] font-normal text-slate-400">
                        Multi-board drag & drop widgets
                      </div>
                    </div>
                    {design === 'classic' && <Check className="w-4 h-4 shrink-0" />}
                  </button>
                </div>
              )}
            </div>

            {/* Save as Default Button */}
            <button
              type="button"
              onClick={() => onSaveDefaultDesign(design)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                isCurrentDefault
                  ? 'bg-emerald-500/15 border-emerald-400/50 text-emerald-700 dark:text-emerald-300'
                  : isLight
                  ? 'bg-white/95 border-sky-200 text-slate-700 hover:border-amber-400 hover:text-amber-600'
                  : 'bg-slate-900/90 border-slate-700 text-slate-200 hover:border-amber-500'
              }`}
              title="Save this dashboard design as your default whenever you log in"
            >
              <Star className={`w-3.5 h-3.5 ${isCurrentDefault ? 'fill-current' : ''}`} />
              <span>{isCurrentDefault ? 'Default Saved' : 'Set Default'}</span>
            </button>

            {/* Period Filter */}
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as PeriodFilter)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border outline-none cursor-pointer shadow-2xs ${
                isLight
                  ? 'bg-white/95 border-sky-200 text-slate-700'
                  : 'bg-slate-900/90 border-slate-700 text-slate-100'
              }`}
              aria-label="Dashboard period filter"
            >
              <option value="All Time">All Time</option>
              <option value="Last 6 Months">Last 6 Months</option>
              <option value="This Month">This Month</option>
            </select>

            {/* + Quick Create Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setQuickCreateOpen((v) => !v);
                  setDesignMenuOpen(false);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-600/25 transition-all active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Quick Create</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-80" />
              </button>

              {quickCreateOpen && (
                <div
                  className={`absolute right-0 mt-1.5 w-48 rounded-2xl border shadow-xl z-40 p-1.5 text-xs ${
                    isLight ? 'bg-white border-sky-100' : 'bg-[#0f172a] border-slate-700'
                  }`}
                >
                  {[
                    { label: 'New Lead', action: () => onQuickCreate ? onQuickCreate('lead') : setActiveNav('Leads'), icon: Users },
                    { label: 'New Deal', action: () => onQuickCreate ? onQuickCreate('deal') : setActiveNav('Deals'), icon: Briefcase },
                    { label: 'New Project', action: () => onQuickCreate ? onQuickCreate('project') : setActiveNav('Projects'), icon: FolderKanban },
                    { label: 'New Task', action: () => onQuickCreate ? onQuickCreate('task') : setActiveNav('Tasks'), icon: ClipboardList },
                    { label: 'Schedule Meeting', action: () => onQuickCreate ? onQuickCreate('event') : setActiveNav('Events & Calendar'), icon: Calendar },
                    { label: 'New Invoice', action: () => setActiveNav('Invoices'), icon: Receipt },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => {
                          setQuickCreateOpen(false);
                          item.action();
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl font-semibold hover:bg-sky-50 dark:hover:bg-slate-800 text-left transition-colors"
                      >
                        <Icon className="w-3.5 h-3.5 text-sky-500" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. ROW 1: 5 FLOATING COLOURFUL HERO KPI CARDS WITH SPARKLINES */}
      <div className="-mt-11 relative z-20 px-1 sm:px-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          {
            label: 'Total Leads',
            value: kpiStats.totalLeads.toLocaleString(),
            sub: `${kpiStats.hotLeads} hot leads`,
            icon: Users,
            iconBg: 'bg-blue-500',
            accent: '#2563eb',
            spark: 'M0 24 Q15 20 28 22 T55 12 T82 14 T110 4',
            nav: 'Leads',
          },
          {
            label: 'Sales Revenue',
            value: formatMoney(financeMetrics.totalRevenue),
            sub: `${financeMetrics.marginPct}% net margin`,
            icon: DollarSign,
            iconBg: 'bg-emerald-500',
            accent: '#10b981',
            spark: 'M0 26 Q18 22 34 17 T66 13 T90 8 T110 3',
            nav: 'Revenue',
          },
          {
            label: 'Active Projects',
            value: String(kpiStats.activeProjects),
            sub: `of ${kpiStats.totalProjects} total`,
            icon: Rocket,
            iconBg: 'bg-violet-500',
            accent: '#8b5cf6',
            spark: 'M0 25 Q22 23 40 16 T72 18 T94 9 T110 5',
            nav: 'Projects',
          },
          {
            label: 'Pending Tasks',
            value: String(kpiStats.pendingTasks),
            sub: `${kpiStats.completedTasks} completed`,
            icon: ClipboardList,
            iconBg: 'bg-amber-500',
            accent: '#f59e0b',
            spark: 'M0 24 Q18 19 36 21 T68 12 T92 14 T110 6',
            nav: 'Tasks',
          },
          {
            label: 'Conversion Rate',
            value: `${kpiStats.conversionRate}%`,
            sub: `${kpiStats.wonCount} won deals/leads`,
            icon: TrendingUp,
            iconBg: 'bg-teal-500',
            accent: '#14b8a6',
            spark: 'M0 25 Q20 21 38 18 T70 11 T95 9 T110 4',
            nav: 'Pipeline',
          },
        ].map((card) => {
          const Icon = card.icon;
          const gradId = `sp-${card.label.replace(/\s+/g, '')}`;
          return (
            <button
              key={card.label}
              type="button"
              onClick={() => setActiveNav(card.nav)}
              className={`relative overflow-hidden text-left p-4 rounded-2xl border transition-all hover:-translate-y-0.5 hover:shadow-md group ${cardClass}`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-full ${card.iconBg} text-white flex items-center justify-center shadow-sm shrink-0`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                    {card.label}
                  </div>
                  <div className="text-xl font-extrabold tracking-tight tabular-nums mt-0.5 truncate text-slate-900 dark:text-white">
                    {card.value}
                  </div>
                  <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-1 truncate">
                    ↑ {card.sub}
                  </div>
                </div>
              </div>

              {/* Subtle bottom-right mini sparkline */}
              <svg
                viewBox="0 0 110 30"
                className="absolute right-2 bottom-1.5 w-24 h-7 opacity-75 pointer-events-none"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={card.accent} stopOpacity="0.28" />
                    <stop offset="100%" stopColor={card.accent} stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d={`${card.spark} L110 30 L0 30 Z`} fill={`url(#${gradId})`} />
                <path
                  d={card.spark}
                  fill="none"
                  stroke={card.accent}
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          );
        })}
      </div>

      {/* 3. ROW 2: REVENUE OVERVIEW (5) + SALES PIPELINE FUNNEL (4) + LEAD SOURCES DONUT (3) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Revenue Overview Card */}
        <div className={`lg:col-span-5 p-4 sm:p-5 rounded-2xl border ${cardClass}`}>
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <h2 className="text-sm font-extrabold">Revenue Overview</h2>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-extrabold tabular-nums">
                  {formatMoney(financeMetrics.totalRevenue)}
                </span>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  {financeMetrics.netProfit >= 0 ? '▲' : '▼'}{' '}
                  {formatMoney(Math.abs(financeMetrics.netProfit))} net
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-[11px] font-semibold">
              <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                Revenue
              </span>
              <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-violet-400" />
                Expenses
              </span>
            </div>
          </div>

          {/* Interactive SVG Area Chart */}
          <div className="relative mt-2">
            {activeHoverMonth && (
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-600 text-white shadow-xs mb-1">
                <span>{activeHoverMonth.label}:</span>
                <span>Rev {formatMoney(activeHoverMonth.revenue)}</span>
                <span className="opacity-70">·</span>
                <span>Exp {formatMoney(activeHoverMonth.expenses)}</span>
              </div>
            )}

            <svg
              viewBox={`0 0 ${revChartGeometry.W} ${revChartGeometry.H}`}
              className="w-full h-44 overflow-visible"
            >
              <defs>
                <linearGradient id="skyRevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.32" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
                </linearGradient>
              </defs>

              {/* Horizontal Gridlines */}
              {[0, 0.33, 0.66, 1].map((frac, idx) => {
                const y = revChartGeometry.padT + frac * revChartGeometry.innerH;
                return (
                  <line
                    key={idx}
                    x1="12"
                    x2={revChartGeometry.W - 12}
                    y1={y}
                    y2={y}
                    stroke={isLight ? '#e2e8f0' : '#1e293b'}
                    strokeDasharray="3 3"
                  />
                );
              })}

              {/* Revenue area & line */}
              {revChartGeometry.revArea && (
                <path d={revChartGeometry.revArea} fill="url(#skyRevGrad)" />
              )}
              {revChartGeometry.revLine && (
                <path
                  d={revChartGeometry.revLine}
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Expenses line */}
              {revChartGeometry.expLine && (
                <path
                  d={revChartGeometry.expLine}
                  fill="none"
                  stroke="#a78bfa"
                  strokeWidth="2"
                  strokeDasharray="4 3"
                  strokeLinecap="round"
                />
              )}

              {/* Interactive points & X labels */}
              {revChartGeometry.pts.map((p, idx) => {
                const isActive =
                  hoveredMonthIdx === idx ||
                  (hoveredMonthIdx === null && idx === revChartGeometry.pts.length - 1);
                return (
                  <g
                    key={p.key}
                    onMouseEnter={() => setHoveredMonthIdx(idx)}
                    onMouseLeave={() => setHoveredMonthIdx(null)}
                    className="cursor-pointer"
                  >
                    <circle
                      cx={p.x}
                      cy={p.yRev}
                      r={isActive ? 5.5 : 3.5}
                      fill="#2563eb"
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                    <circle
                      cx={p.x}
                      cy={p.yExp}
                      r={isActive ? 4 : 2.5}
                      fill="#a78bfa"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                    <text
                      x={p.x}
                      y={revChartGeometry.H - 6}
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight={isActive ? '700' : '500'}
                      fill={isLight ? '#64748b' : '#94a3b8'}
                    >
                      {p.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Sales Pipeline Funnel Card */}
        <div className={`lg:col-span-4 p-4 sm:p-5 rounded-2xl border flex flex-col ${cardClass}`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-extrabold">Sales Pipeline</h2>
              <p className="text-[11px] text-slate-400">Live leads & deals conversion stages</p>
            </div>
            <button
              type="button"
              onClick={() => setActiveNav('Pipeline')}
              className="text-[11px] font-bold text-sky-500 hover:underline inline-flex items-center gap-0.5"
            >
              <span>View Details</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2.5 flex-1 flex flex-col justify-center">
            {funnelData.map((stage) => (
              <button
                key={stage.key}
                type="button"
                onClick={() => setActiveNav('Pipeline')}
                className="w-full flex items-center gap-3 group text-left"
              >
                <div className="flex-1 flex justify-start">
                  <div
                    className={`h-9 rounded-xl bg-gradient-to-r ${stage.gradient} text-white px-3 flex items-center justify-between shadow-2xs transition-transform group-hover:scale-[1.01]`}
                    style={{ width: `${stage.widthPct}%`, minWidth: '120px' }}
                  >
                    <span className="text-xs font-bold truncate">{stage.label}</span>
                  </div>
                </div>
                <div className="w-24 text-right shrink-0">
                  <div className="text-xs font-extrabold tabular-nums text-slate-800 dark:text-white">
                    {stage.count.toLocaleString()}
                  </div>
                  <div className="text-[10px] font-semibold text-slate-400 truncate">
                    {formatMoney(stage.value)}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Lead Sources Donut Chart Card */}
        <div className={`lg:col-span-3 p-4 sm:p-5 rounded-2xl border flex flex-col ${cardClass}`}>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-extrabold">Lead Sources</h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400">
              {period}
            </span>
          </div>

          {sourceSlices.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-6 text-xs text-slate-400">
              <Users className="w-6 h-6 mb-1.5 opacity-40" />
              <span>No leads recorded yet</span>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              {/* SVG Multi-Color Donut */}
              <div className="relative w-36 h-36">
                <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                  {sourceSlices.map((slice) => {
                    const radius = 44;
                    const circ = 2 * Math.PI * radius;
                    const dash = (slice.pct / 100) * circ;
                    const offset = -(slice.startPct / 100) * circ;
                    const isHov = hoveredSource === slice.name;
                    return (
                      <circle
                        key={slice.name}
                        cx="60"
                        cy="60"
                        r={radius}
                        fill="none"
                        stroke={slice.color}
                        strokeWidth={isHov ? 18 : 15}
                        strokeDasharray={`${Math.max(0, dash - 1.5)} ${circ}`}
                        strokeDashoffset={offset}
                        onMouseEnter={() => setHoveredSource(slice.name)}
                        onMouseLeave={() => setHoveredSource(null)}
                        className="transition-all duration-200 cursor-pointer"
                      />
                    );
                  })}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-2">
                  <div className="text-lg font-extrabold tabular-nums leading-tight">
                    {hoveredSource
                      ? sourceSlices.find((s) => s.name === hoveredSource)?.count || 0
                      : periodLeads.length}
                  </div>
                  <div className="text-[10px] font-semibold text-slate-400 truncate max-w-[82px]">
                    {hoveredSource || 'Total Leads'}
                  </div>
                </div>
              </div>

              {/* Source Legend */}
              <div className="w-full space-y-1">
                {sourceSlices.map((s) => (
                  <div
                    key={s.name}
                    onMouseEnter={() => setHoveredSource(s.name)}
                    onMouseLeave={() => setHoveredSource(null)}
                    className="flex items-center justify-between text-[11px] px-1.5 py-0.5 rounded-lg hover:bg-slate-100/70 dark:hover:bg-slate-800/60 cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: s.color }}
                      />
                      <span className="truncate font-medium text-slate-700 dark:text-slate-200">
                        {s.name}
                      </span>
                    </div>
                    <span className="font-extrabold tabular-nums text-slate-600 dark:text-slate-300 shrink-0 ml-2">
                      {s.pct}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. ROW 3: LEADS KANBAN PREVIEW (8) + AI BUSINESS ASSISTANT (4) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* Leads Kanban */}
        <div className={`xl:col-span-8 p-4 sm:p-5 rounded-2xl border ${cardClass}`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-extrabold">Leads Kanban</h2>
              <p className="text-[11px] text-slate-400">
                Live leads grouped by stage with instant Call, WhatsApp & Email actions
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveNav('Leads')}
              className="text-xs font-bold text-sky-500 hover:underline inline-flex items-center gap-1"
            >
              <span>View All ({scopedLeads.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {leadsKanbanColumns.map((col) => (
              <div key={col.title} className={`rounded-xl border p-2 flex flex-col ${col.colBg}`}>
                <div
                  className={`px-2 py-1 rounded-lg text-[11px] font-extrabold flex items-center justify-between mb-2 ${col.headerBg}`}
                >
                  <span className="truncate">{col.title}</span>
                  <span className="opacity-80">({col.items.length})</span>
                </div>

                <div className="space-y-2 flex-1">
                  {col.items.length === 0 ? (
                    <div className="py-5 text-center text-[10px] text-slate-400">No leads</div>
                  ) : (
                    col.items.slice(0, 3).map((lead) => (
                      <div
                        key={lead.id}
                        className={`p-2.5 rounded-xl border transition-all hover:shadow-xs ${
                          isLight
                            ? 'bg-white border-slate-200/80'
                            : 'bg-slate-900/90 border-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-6 h-6 rounded-full ${col.avatarBg} text-white text-[10px] font-bold flex items-center justify-center shrink-0`}
                          >
                            {getInitials(lead.name)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-[11px] font-bold truncate text-slate-800 dark:text-white">
                              {lead.name}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                              {lead.company || 'Direct'}
                            </div>
                          </div>
                        </div>

                        <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                          <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-200 tabular-nums">
                            {lead.value ? formatMoney(lead.value) : `${currency.symbol}0`}
                          </span>
                          <div className="flex items-center gap-1">
                            {lead.phone && (
                              <a
                                href={`tel:${lead.phone}`}
                                className="p-1 rounded hover:bg-emerald-500/15 text-emerald-500"
                                title={`Call ${lead.phone}`}
                              >
                                <Phone className="w-3 h-3" />
                              </a>
                            )}
                            {(lead.whatsapp || lead.phone) && (
                              <a
                                href={`https://wa.me/${(lead.whatsapp || lead.phone).replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 rounded hover:bg-green-500/15 text-green-500"
                                title="WhatsApp"
                              >
                                <MessageCircle className="w-3 h-3" />
                              </a>
                            )}
                            {lead.email && (
                              <a
                                href={`mailto:${lead.email}`}
                                className="p-1 rounded hover:bg-sky-500/15 text-sky-500"
                                title={`Email ${lead.email}`}
                              >
                                <Mail className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Business Assistant Card (from Reference 1!) */}
        <div className={`xl:col-span-4 p-4 sm:p-5 rounded-2xl border flex flex-col justify-between ${cardClass}`}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <h2 className="text-sm font-extrabold">AI Business Assistant</h2>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400">
                Live AI
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-3">
              Ask anything about your live leads, revenue, pipeline or tasks...
            </p>

            {/* Quick Prompt Pills */}
            <div className="space-y-1.5 mb-3">
              {[
                'Which leads are most likely to convert?',
                'Summarize my revenue, expenses & profit',
                'Suggest top 3 actions to close more deals today',
              ].map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  disabled={aiLoading}
                  onClick={() => handleAskBusinessAi(prompt)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-[11px] font-semibold border transition-colors flex items-center gap-2 ${
                    isLight
                      ? 'bg-sky-50/70 border-sky-100 text-slate-700 hover:bg-sky-100/70'
                      : 'bg-slate-900 border-slate-800 text-slate-200 hover:border-sky-500/50'
                  }`}
                >
                  <Sparkles className="w-3 h-3 text-blue-500 shrink-0" />
                  <span className="truncate">{prompt}</span>
                </button>
              ))}
            </div>

            {/* AI Response Box */}
            {aiLoading && (
              <div className="p-3 rounded-xl bg-sky-500/10 text-xs text-sky-600 dark:text-sky-400 flex items-center gap-2 mb-3">
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                <span>Analyzing your live CRM data...</span>
              </div>
            )}
            {aiAnswer && !aiLoading && (
              <div
                className={`p-3 rounded-xl border text-[11px] leading-relaxed whitespace-pre-line max-h-40 overflow-y-auto mb-3 ${
                  isLight
                    ? 'bg-indigo-50/60 border-indigo-100 text-slate-800'
                    : 'bg-indigo-950/30 border-indigo-900/50 text-slate-200'
                }`}
              >
                {aiAnswer}
              </div>
            )}
          </div>

          {/* Chat Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAskBusinessAi();
            }}
            className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800"
          >
            <input
              type="text"
              value={aiQuestion}
              onChange={(e) => setAiQuestion(e.target.value)}
              placeholder="Type your business question..."
              className={`flex-1 px-3 py-2 rounded-xl border text-xs outline-none ${
                isLight
                  ? 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500'
                  : 'bg-slate-900 border-slate-700 text-white focus:border-sky-400'
              }`}
            />
            <button
              type="submit"
              disabled={aiLoading || !aiQuestion.trim()}
              className="p-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white transition-all active:scale-95"
              title="Ask AI"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* 5. ROW 4: TASKS KANBAN (7) + FINANCIAL OVERVIEW (5) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* Tasks Kanban */}
        <div className={`xl:col-span-7 p-4 sm:p-5 rounded-2xl border ${cardClass}`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-extrabold">Tasks Kanban</h2>
              <p className="text-[11px] text-slate-400">
                Click any checkbox to mark tasks done live
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveNav('Tasks')}
              className="text-xs font-bold text-sky-500 hover:underline inline-flex items-center gap-1"
            >
              <span>View All ({scopedTasks.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {tasksKanbanColumns.map((col) => (
              <div key={col.key} className={`rounded-xl border p-2.5 ${col.colBg}`}>
                <div className={`text-xs font-extrabold flex items-center justify-between mb-2 ${col.badge}`}>
                  <span>{col.title}</span>
                  <span className="text-[10px] opacity-75">({col.items.length})</span>
                </div>

                <div className="space-y-1.5">
                  {col.items.length === 0 ? (
                    <div className="py-4 text-center text-[10px] text-slate-400">Empty</div>
                  ) : (
                    col.items.slice(0, 4).map((task) => {
                      const done = task.status === 'Completed';
                      return (
                        <button
                          key={task.id}
                          type="button"
                          onClick={() => handleToggleTaskDone(task.id)}
                          className={`w-full text-left p-2 rounded-xl border flex items-start gap-2 transition-all hover:shadow-2xs ${
                            isLight
                              ? 'bg-white border-slate-200/80'
                              : 'bg-slate-900/90 border-slate-800'
                          }`}
                        >
                          {done ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          ) : (
                            <Circle className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          )}
                          <div className="min-w-0 flex-1">
                            <div
                              className={`text-[11px] font-semibold line-clamp-2 ${
                                done
                                  ? 'line-through text-slate-400'
                                  : 'text-slate-800 dark:text-slate-100'
                              }`}
                            >
                              {task.title}
                            </div>
                            <div className="text-[9px] text-slate-400 mt-0.5 truncate">
                              {task.assignee || 'Unassigned'}
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Overview Card (from Reference 2!) */}
        <div className={`xl:col-span-5 p-4 sm:p-5 rounded-2xl border flex flex-col justify-between ${cardClass}`}>
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-extrabold">Financial Overview</h2>
                <p className="text-[11px] text-slate-400">
                  Synced directly with Invoices, Revenue & Expenses
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveNav('Profit & Loss')}
                className="text-xs font-bold text-sky-500 hover:underline inline-flex items-center gap-0.5"
              >
                <span>P&L Report</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2.5 mb-3">
              <div
                className={`p-3 rounded-xl border ${
                  isLight ? 'bg-emerald-50/60 border-emerald-100' : 'bg-emerald-950/20 border-emerald-900/40'
                }`}
              >
                <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                  Total Income
                </div>
                <div className="text-sm sm:text-base font-extrabold tabular-nums text-emerald-600 dark:text-emerald-400 mt-0.5 truncate">
                  {formatMoney(financeMetrics.totalRevenue)}
                </div>
              </div>

              <div
                className={`p-3 rounded-xl border ${
                  isLight ? 'bg-rose-50/60 border-rose-100' : 'bg-rose-950/20 border-rose-900/40'
                }`}
              >
                <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                  Total Expenses
                </div>
                <div className="text-sm sm:text-base font-extrabold tabular-nums text-rose-600 dark:text-rose-400 mt-0.5 truncate">
                  {formatMoney(financeMetrics.totalExpenses)}
                </div>
              </div>

              <div
                className={`p-3 rounded-xl border ${
                  isLight ? 'bg-sky-50/70 border-sky-100' : 'bg-sky-950/20 border-sky-900/40'
                }`}
              >
                <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                  Net Profit
                </div>
                <div className="text-sm sm:text-base font-extrabold tabular-nums text-sky-600 dark:text-sky-400 mt-0.5 truncate">
                  {formatMoney(financeMetrics.netProfit)}
                </div>
              </div>
            </div>
          </div>

          {/* Smooth Profit Curve */}
          <div>
            <svg viewBox={`0 0 ${profitCurve.W} ${profitCurve.H}`} className="w-full h-24">
              <defs>
                <linearGradient id="finProfitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              {profitCurve.area && <path d={profitCurve.area} fill="url(#finProfitGrad)" />}
              {profitCurve.line && (
                <path
                  d={profitCurve.line}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              {profitCurve.pts.map((p, idx) => (
                <text
                  key={idx}
                  x={p.x}
                  y={profitCurve.H - 1}
                  textAnchor="middle"
                  fontSize="10"
                  fill={isLight ? '#64748b' : '#94a3b8'}
                >
                  {p.label}
                </text>
              ))}
            </svg>
          </div>
        </div>
      </div>

      {/* 6. ROW 5: UPCOMING MEETINGS & FOLLOW-UPS (6) + RECENT ACTIVITIES (6) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Upcoming Meetings & Follow-Ups */}
        <div className={`lg:col-span-6 p-4 sm:p-5 rounded-2xl border ${cardClass}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-500" />
              <h2 className="text-sm font-extrabold">Upcoming Meetings & Follow-Ups</h2>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setActiveNav('Follow Ups')}
                className="text-sky-500 hover:underline"
              >
                Follow Ups
              </button>
              <button
                type="button"
                onClick={() => setActiveNav('Events & Calendar')}
                className="text-sky-500 hover:underline inline-flex items-center gap-0.5"
              >
                <span>View Calendar</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {upcomingSchedule.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              <Clock className="w-6 h-6 mx-auto mb-1.5 opacity-40" />
              No upcoming meetings or follow-ups scheduled.
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingSchedule.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveNav(item.targetNav)}
                  className={`w-full p-2.5 rounded-xl border flex items-center justify-between gap-3 text-left transition-colors ${
                    isLight
                      ? 'bg-slate-50/70 border-slate-200/70 hover:border-sky-300'
                      : 'bg-slate-900/70 border-slate-800 hover:border-sky-500/40'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0 tabular-nums">
                      {item.time}
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate text-slate-800 dark:text-white">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">{item.subtitle}</div>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                      item.isToday
                        ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                        : 'bg-sky-500/15 text-sky-600 dark:text-sky-400'
                    }`}
                  >
                    {item.isToday ? 'Today' : item.date}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activities */}
        <div className={`lg:col-span-6 p-4 sm:p-5 rounded-2xl border ${cardClass}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              <h2 className="text-sm font-extrabold">Recent CRM Activities</h2>
            </div>
            <button
              type="button"
              onClick={() => setActiveNav('Leads')}
              className="text-[11px] font-bold text-sky-500 hover:underline inline-flex items-center gap-0.5"
            >
              <span>Explore CRM</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {recentActivities.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No recent activities recorded yet.
            </div>
          ) : (
            <div className="space-y-2">
              {recentActivities.map((act) => {
                const dotClass = {
                  blue: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
                  emerald: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
                  amber: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
                  purple: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
                }[act.tone];

                return (
                  <button
                    key={act.id}
                    type="button"
                    onClick={() => setActiveNav(act.nav)}
                    className={`w-full p-2.5 rounded-xl border flex items-center justify-between gap-3 text-left transition-colors ${
                      isLight
                        ? 'bg-slate-50/70 border-slate-200/70 hover:border-sky-300'
                        : 'bg-slate-900/70 border-slate-800 hover:border-sky-500/40'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${dotClass}`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </span>
                      <span className="text-xs font-semibold truncate text-slate-800 dark:text-slate-100">
                        {act.text}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-400 shrink-0">
                      {act.meta}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
