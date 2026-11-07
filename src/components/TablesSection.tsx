import React, { useState, useEffect } from 'react';
import {
  Phone,
  Mail,
  MessageSquare,
  Users,
  Clock,
  Calendar,
  AlertCircle,
  CheckSquare,
  Receipt,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useSystemCurrency } from '../data/currencyService';
import {
  RECENT_DEALS,
  OVERDUE_TASKS,
  UPCOMING_FOLLOW_UPS,
  INVOICES,
  CALENDAR_EVENTS,
} from '../data/mockData';
import { Deal, TaskItem, FollowUp, Invoice, CalendarEvent } from '../types/crm';

export const TablesSection: React.FC = () => {
  const { theme, setActiveNav } = useTheme();
  const isLight = theme === 'white-sky';
  const { currency, formatMoney } = useSystemCurrency();

  // Load from localStorage or fallback to defaults
  const loadDeals = (): Deal[] => {
    try {
      const saved = localStorage.getItem('ozostack_deals_v2');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return RECENT_DEALS;
  };

  const loadTasks = (): TaskItem[] => {
    try {
      const saved = localStorage.getItem('ozostack_tasks_v2');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return OVERDUE_TASKS as unknown as TaskItem[];
  };

  const loadFollowUps = (): FollowUp[] => {
    try {
      const saved = localStorage.getItem('ozostack_followups_v2');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return UPCOMING_FOLLOW_UPS;
  };

  const loadInvoices = (): Invoice[] => {
    try {
      const saved = localStorage.getItem('ozostack_invoices_v1');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return INVOICES;
  };

  const loadEvents = (): CalendarEvent[] => {
    try {
      const saved = localStorage.getItem('ozostack_calendar_events_v3');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return CALENDAR_EVENTS;
  };

  const [deals, setDeals] = useState<Deal[]>(loadDeals);
  const [tasks, setTasks] = useState<TaskItem[]>(loadTasks);
  const [followUps, setFollowUps] = useState<FollowUp[]>(loadFollowUps);
  const [invoices, setInvoices] = useState<Invoice[]>(loadInvoices);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(loadEvents);

  useEffect(() => {
    const syncAll = () => {
      setDeals(loadDeals());
      setTasks(loadTasks());
      setFollowUps(loadFollowUps());
      setInvoices(loadInvoices());
      setCalendarEvents(loadEvents());
    };
    window.addEventListener('storage', syncAll);
    window.addEventListener('ozostack-crm-config-changed', syncAll);
    return () => {
      window.removeEventListener('storage', syncAll);
      window.removeEventListener('ozostack-crm-config-changed', syncAll);
    };
  }, []);

  const cardBg = isLight
    ? 'bg-white border-sky-100/90 shadow-xs'
    : 'bg-[#0f172a]/90 border-slate-800/80';

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Call':
        return <Phone className="w-3 h-3 text-sky-500" />;
      case 'WhatsApp':
        return <MessageSquare className="w-3 h-3 text-emerald-500" />;
      case 'Email':
        return <Mail className="w-3 h-3 text-amber-500" />;
      default:
        return <Users className="w-3 h-3 text-indigo-500" />;
    }
  };

  // Calculations for Invoices
  const totalInvoiced = invoices.reduce((sum, inv) => {
    const val = typeof inv.amount === 'number' ? inv.amount : parseFloat(String(inv.amount || 0).replace(/[^0-9.]/g, '')) || 0;
    return sum + val;
  }, 0);
  const paidInvoices = invoices.filter((inv) => inv.status === 'Paid');
  const paidAmount = paidInvoices.reduce((sum, inv) => {
    const val = typeof inv.amount === 'number' ? inv.amount : parseFloat(String(inv.amount || 0).replace(/[^0-9.]/g, '')) || 0;
    return sum + val;
  }, 0);
  const pendingAmount = Math.max(0, totalInvoiced - paidAmount);
  const paidPercent = totalInvoiced > 0 ? ((paidAmount / totalInvoiced) * 100).toFixed(1) : '0.0';
  const pendingPercent = totalInvoiced > 0 ? ((pendingAmount / totalInvoiced) * 100).toFixed(1) : '0.0';

  // Active / overdue tasks
  const overdueTasksList = tasks
    .filter((t) => t.status !== 'Completed')
    .slice(0, 5);

  const recentDealsList = deals.slice(0, 5);
  const upcomingFollowUpsList = followUps.slice(0, 4);
  const recentInvoicesList = invoices.slice(0, 3);
  const calendarEventsList = calendarEvents.slice(0, 4);

  return (
    <div className="grid grid-cols-12 gap-3 items-stretch">
      {/* 1. RECENT DEALS (Spans 6 on lg, 3 on 2xl) */}
      <div className={`col-span-12 lg:col-span-6 2xl:col-span-3 p-3.5 rounded-xl border flex flex-col justify-between ${cardBg}`}>
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold tracking-wider uppercase">
              Recent Deals
            </span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-500">
              {deals.length} total
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[10px] min-w-[380px]">
              <thead>
                <tr className="border-b border-sky-100/30 text-slate-400 font-bold uppercase text-[9px]">
                  <th className="pb-1.5 font-bold">Deal Name</th>
                  <th className="pb-1.5 font-bold">Company</th>
                  <th className="pb-1.5 font-bold">Value</th>
                  <th className="pb-1.5 font-bold">Stage</th>
                  <th className="pb-1.5 font-bold">Close Date</th>
                  <th className="pb-1.5 font-bold">Owner</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-100/20">
                {recentDealsList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <AlertCircle className="w-4 h-4 opacity-40 text-sky-500" />
                        <span className="text-[11px] font-medium">No deals found</span>
                        <button
                          onClick={() => setActiveNav('Deals')}
                          className="text-[10px] text-sky-500 hover:underline font-semibold"
                        >
                          Create a deal +
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  recentDealsList.map((deal) => {
                    const name = deal.dealName || (deal as any).name || 'Untitled Deal';
                    const comp = deal.company || '—';
                    const valStr = deal.valueFormatted || `${currency.symbol}${Number(deal.value || 0).toLocaleString()}`;
                    return (
                      <tr
                        key={deal.id}
                        onClick={() => setActiveNav('Deals')}
                        className="hover:bg-sky-500/10 cursor-pointer transition-colors group"
                        title={`View Deal: ${name}`}
                      >
                        <td className="py-2 font-medium text-slate-700 dark:text-slate-200 group-hover:text-sky-500 truncate max-w-[90px]">
                          {name}
                        </td>
                        <td className="py-2 text-slate-500 truncate max-w-[80px]">
                          {comp}
                        </td>
                        <td className="py-2 font-bold tabular-nums text-slate-800 dark:text-white shrink-0">
                          {formatMoney(valStr)}
                        </td>
                        <td className="py-2">
                          <span className="text-[9px] text-sky-600 dark:text-sky-400 font-semibold truncate block">
                            {deal.stage || 'Lead'}
                          </span>
                        </td>
                        <td className="py-2 text-slate-400 tabular-nums whitespace-nowrap text-[9px]">
                          {deal.closeDate || '—'}
                        </td>
                        <td className="py-2 text-slate-500 truncate max-w-[70px]">
                          {deal.owner || 'Sayed'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="text-center pt-2 border-t border-sky-100/20 mt-2">
          <button
            onClick={() => setActiveNav('Deals')}
            className="text-[10px] font-semibold text-sky-500 hover:underline"
          >
            View All Deals ({deals.length}) →
          </button>
        </div>
      </div>

      {/* 2. OVERDUE TASKS (Spans 6 on lg, 3 on 2xl) */}
      <div className={`col-span-12 lg:col-span-6 2xl:col-span-3 p-3.5 rounded-xl border flex flex-col justify-between ${cardBg}`}>
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold tracking-wider uppercase">
              Pending &amp; Overdue Tasks
            </span>
            <button
              onClick={() => setActiveNav('Tasks')}
              className="text-[9px] text-sky-500 hover:underline font-semibold"
            >
              Manage Tasks
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[10px] min-w-[340px]">
              <thead>
                <tr className="border-b border-sky-100/30 text-slate-400 font-bold uppercase text-[9px]">
                  <th className="pb-1.5">Task Name</th>
                  <th className="pb-1.5">Project</th>
                  <th className="pb-1.5">Assignee</th>
                  <th className="pb-1.5">Due Date</th>
                  <th className="pb-1.5 text-right">Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-100/20">
                {overdueTasksList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <CheckSquare className="w-4 h-4 opacity-40 text-emerald-500" />
                        <span className="text-[11px] font-medium">All tasks completed / clean</span>
                        <button
                          onClick={() => setActiveNav('Tasks')}
                          className="text-[10px] text-sky-500 hover:underline font-semibold"
                        >
                          Create task +
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  overdueTasksList.map((task) => {
                    const taskName = task.title || (task as any).taskName || 'Untitled Task';
                    return (
                      <tr
                        key={task.id}
                        onClick={() => setActiveNav('Tasks')}
                        className="hover:bg-rose-500/5 cursor-pointer transition-colors group"
                        title={`Open Task: ${taskName}`}
                      >
                        <td className="py-2 font-medium text-slate-700 dark:text-slate-200 group-hover:text-rose-500 truncate max-w-[90px]">
                          {taskName}
                        </td>
                        <td className="py-2 text-slate-500 truncate max-w-[80px]">
                          {task.project || 'General'}
                        </td>
                        <td className="py-2 text-slate-500 truncate">
                          {task.assignee || 'Unassigned'}
                        </td>
                        <td className="py-2 text-rose-500 tabular-nums font-semibold whitespace-nowrap text-[9px]">
                          {task.dueDate || '—'}
                        </td>
                        <td className="py-2 text-right">
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0 ${
                              task.priority === 'High' || task.priority === 'Urgent'
                                ? 'text-rose-600 bg-rose-500/10'
                                : 'text-amber-600 bg-amber-500/10'
                            }`}
                          >
                            {task.priority || 'Medium'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="text-center pt-2 border-t border-sky-100/20 mt-2">
          <button
            onClick={() => setActiveNav('Tasks')}
            className="text-[10px] font-semibold text-sky-500 hover:underline"
          >
            View All Tasks ({tasks.length}) →
          </button>
        </div>
      </div>

      {/* 3. UPCOMING FOLLOW UPS (Spans 4 on lg, 2 on 2xl) */}
      <div className={`col-span-12 sm:col-span-6 lg:col-span-4 2xl:col-span-2 p-3.5 rounded-xl border flex flex-col justify-between ${cardBg}`}>
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold tracking-wider uppercase truncate">
              Upcoming Follow Ups
            </span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-500">
              {followUps.length}
            </span>
          </div>

          <div className="space-y-2">
            {upcomingFollowUpsList.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <Clock className="w-4 h-4 opacity-40 text-amber-500 mx-auto mb-1.5" />
                <span className="text-[11px] font-medium block">No upcoming follow ups</span>
                <button
                  onClick={() => setActiveNav('Follow Ups')}
                  className="text-[10px] text-sky-500 hover:underline font-semibold mt-1"
                >
                  Schedule follow-up +
                </button>
              </div>
            ) : (
              upcomingFollowUpsList.map((f) => (
                <div
                  key={f.id}
                  onClick={() => setActiveNav('Follow Ups')}
                  className="flex items-center justify-between p-1.5 rounded-lg hover:bg-sky-500/10 cursor-pointer transition-colors text-[10px] group"
                  title={`Follow up with ${f.contact}`}
                >
                  <div className="min-w-0 flex-1 mr-2">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-semibold text-slate-700 dark:text-slate-200 group-hover:text-sky-500 truncate">
                        {f.contact}
                      </span>
                      <span className="text-slate-400 text-[9px] truncate">· {f.company}</span>
                    </div>
                    <div className="text-[9px] text-slate-400 mt-0.5 tabular-nums flex items-center gap-1 truncate">
                      <Clock className="w-2.5 h-2.5 text-sky-500 shrink-0" />
                      <span className="truncate">{f.nextFollowUp || 'Upcoming'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="p-1 rounded bg-sky-500/10 shrink-0" title={f.type}>
                      {getTypeIcon(f.type)}
                    </span>
                    <span className="text-[9px] text-slate-400 shrink-0">{f.owner ? f.owner.split(' ')[0] : 'Admin'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="text-center pt-2 border-t border-sky-100/20 mt-2">
          <button
            onClick={() => setActiveNav('Follow Ups')}
            className="text-[10px] font-semibold text-sky-500 hover:underline"
          >
            View All Follow Ups →
          </button>
        </div>
      </div>

      {/* 4. INVOICE OVERVIEW (Spans 4 on lg, 2 on 2xl) */}
      <div className={`col-span-12 sm:col-span-6 lg:col-span-4 2xl:col-span-2 p-3 rounded-xl border flex flex-col justify-between ${cardBg}`}>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold tracking-wider uppercase truncate">
              Invoice Overview
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveNav('Expenses')}
                className="text-[8px] font-semibold text-rose-500 hover:underline bg-rose-500/10 px-1 py-0.5 rounded"
                title="Jump to Expenses"
              >
                Expenses
              </button>
              <button
                onClick={() => setActiveNav('Payments')}
                className="text-[8px] font-semibold text-emerald-500 hover:underline bg-emerald-500/10 px-1 py-0.5 rounded"
                title="Jump to Payments"
              >
                Payments
              </button>
            </div>
          </div>

          <div
            onClick={() => setActiveNav('Profit & Loss')}
            className="space-y-1 mb-2 text-[9px] cursor-pointer hover:bg-sky-500/5 p-1 rounded transition-colors"
            title="Inspect Financial Overview in Profit & Loss"
          >
            <div className="flex justify-between items-baseline gap-2">
              <span className="text-slate-400 font-bold uppercase truncate">Total Invoiced</span>
              <span className="font-bold tabular-nums text-xs text-slate-800 dark:text-white shrink-0">
                {currency.symbol}{Math.round(totalInvoiced).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center gap-2">
              <span className="text-emerald-500 font-medium truncate">Paid ({paidPercent}%)</span>
              <span className="font-bold tabular-nums text-emerald-500 shrink-0">
                {currency.symbol}{Math.round(paidAmount).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center gap-2">
              <span className="text-rose-500 font-medium truncate">Pending ({pendingPercent}%)</span>
              <span className="font-bold tabular-nums text-rose-500 shrink-0">
                {currency.symbol}{Math.round(pendingAmount).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="space-y-1 text-[9px] border-t border-sky-100/20 pt-1.5">
            {recentInvoicesList.length === 0 ? (
              <div className="py-4 text-center text-slate-400">
                <Receipt className="w-3.5 h-3.5 opacity-40 text-sky-500 mx-auto mb-1" />
                <span className="text-[10px] font-medium block">No invoices issued</span>
              </div>
            ) : (
              recentInvoicesList.map((inv) => (
                <div
                  key={inv.id}
                  onClick={() => setActiveNav('Invoices')}
                  className="flex items-center justify-between gap-1 p-0.5 rounded hover:bg-sky-500/10 cursor-pointer transition-colors group"
                  title={`Open invoice ${inv.invoiceNumber}`}
                >
                  <span className="text-slate-400 group-hover:text-sky-500 truncate font-mono text-[8.5px]">
                    {inv.invoiceNumber}
                  </span>
                  <span className="font-bold tabular-nums shrink-0">
                    {formatMoney(inv.amount)}
                  </span>
                  <span
                    className={`text-[8px] font-bold px-1 py-0.2 rounded shrink-0 ${
                      inv.status === 'Paid'
                        ? 'text-emerald-500 bg-emerald-500/10'
                        : 'text-amber-500 bg-amber-500/10'
                    }`}
                  >
                    {inv.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="text-center pt-1.5 border-t border-sky-100/20 mt-2">
          <button
            onClick={() => setActiveNav('Invoices')}
            className="text-[10px] font-semibold text-sky-500 hover:underline"
          >
            View All Invoices ({invoices.length}) →
          </button>
        </div>
      </div>

      {/* 5. TODAY'S CALENDAR (Spans 4 on lg, 2 on 2xl) */}
      <div className={`col-span-12 sm:col-span-12 lg:col-span-4 2xl:col-span-2 p-3 rounded-xl border flex flex-col justify-between ${cardBg}`}>
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold tracking-wider uppercase truncate">
              Today's Calendar
            </span>
            <button
              onClick={() => setActiveNav('Events & Calendar')}
              className="text-[9px] text-sky-500 hover:underline font-semibold"
            >
              Open Calendar
            </button>
          </div>

          <div className="relative pl-3 space-y-2 text-[9px]">
            {/* Timeline vertical bar */}
            <div className="absolute left-1 top-1 bottom-1 w-0.5 bg-sky-200 dark:bg-slate-800" />

            {calendarEventsList.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <Calendar className="w-4 h-4 opacity-40 text-sky-500 mx-auto mb-1.5" />
                <span className="text-[10px] font-medium block">No calendar events</span>
                <button
                  onClick={() => setActiveNav('Events & Calendar')}
                  className="text-[10px] text-sky-500 hover:underline font-semibold mt-1"
                >
                  Schedule event +
                </button>
              </div>
            ) : (
              calendarEventsList.map((event) => (
                <div
                  key={event.id}
                  onClick={() => setActiveNav('Events & Calendar')}
                  className="relative cursor-pointer group p-1 -ml-1 rounded hover:bg-sky-500/10 transition-colors"
                  title={`Event: ${event.title}`}
                >
                  {/* Timeline node */}
                  <div className="absolute -left-2 top-2 w-1.5 h-1.5 rounded-full bg-sky-500 ring-2 ring-white dark:ring-slate-900 group-hover:scale-125 transition-transform" />
                  <div className="font-bold text-sky-600 dark:text-sky-400 tabular-nums">
                    {event.time}
                  </div>
                  <div className="font-semibold text-slate-700 dark:text-slate-200 leading-tight truncate group-hover:text-sky-500">
                    {event.title}
                  </div>
                  <div className="text-[8px] text-slate-400 truncate">
                    {event.company}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="text-center pt-1.5 border-t border-sky-100/20 mt-2">
          <button
            onClick={() => setActiveNav('Events & Calendar')}
            className="text-[10px] font-semibold text-sky-500 hover:underline"
          >
            View All Calendar ({calendarEvents.length}) →
          </button>
        </div>
      </div>
    </div>
  );
};
