import React, { useState } from 'react';
import {
  ArrowLeft,
  Plus,
  Search,
  Filter,
  Download,
  MoreVertical,
  CheckCircle,
  Clock,
  User,
  Building,
  DollarSign,
  Phone,
  Mail,
  Lock,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useSystemCurrency, formatMoney } from '../data/currencyService';
import { RECENT_DEALS, OVERDUE_TASKS, INVOICES, TEAM_PERFORMANCE } from '../data/mockData';
import { LeadsView } from './leads/LeadsView';
import { DealsView } from './deals/DealsView';
import { PipelineView } from './pipeline/PipelineView';
import { ContactsView } from './contacts/ContactsView';
import { CompaniesView } from './companies/CompaniesView';
import { FollowUpsView } from './followups/FollowUpsView';
import { ProjectsView } from './projects/ProjectsView';
import { TasksView } from './tasks/TasksView';
import { EventsCalendarView } from './calendar/EventsCalendarView';
import { TimeTrackingView } from './timetracking/TimeTrackingView';
import { DocumentsView } from './documents/DocumentsView';
import { RevenueView } from './revenue/RevenueView';
import { InvoicesView } from './invoices/InvoicesView';
import { ExpensesView } from './expenses/ExpensesView';
import { PaymentsView } from './payments/PaymentsView';
import { ProfitLossView } from './profitloss/ProfitLossView';
import { SettingsView } from './settings/SettingsView';
import { WebhooksView } from './webhooks/WebhooksView';
import { TeamView } from './team/TeamView';
import { PayrollView } from './payroll/PayrollView';
import { TemplatesView } from './templates/TemplatesView';
import { PersonalNotesTodosView } from './personal/PersonalNotesTodosView';

interface SubViewsProps {
  viewName: string;
}

export const SubViews: React.FC<SubViewsProps> = ({ viewName }) => {
  const { theme, setActiveNav } = useTheme();
  const { currency } = useSystemCurrency();
  const isLight = theme === 'white-sky';
  const [searchTerm, setSearchTerm] = useState('');
  const [fallbackToast, setFallbackToast] = useState<string | null>(null);
  const { can } = useAuth();

  const notifyFallback = (msg: string) => {
    setFallbackToast(msg);
    setTimeout(() => setFallbackToast(null), 2600);
  };

  if (viewName !== 'Settings' && !can(viewName)) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-24 gap-3">
        <div className="p-4 rounded-2xl bg-rose-500/10 text-rose-500">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Access Restricted</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
          Your role does not include access to “{viewName}”. Contact your administrator to request permission.
        </p>
      </div>
    );
  }

  if (viewName === 'Leads') {
    return <LeadsView />;
  }

  if (viewName === 'Deals') {
    return <DealsView />;
  }

  if (viewName === 'Pipeline') {
    return <PipelineView />;
  }

  if (viewName === 'Contacts') {
    return <ContactsView />;
  }

  if (viewName === 'Companies' || viewName === 'Clients') {
    return <CompaniesView />;
  }

  if (viewName === 'Follow Ups') {
    return <FollowUpsView />;
  }

  if (viewName === 'Projects') {
    return <ProjectsView />;
  }

  if (viewName === 'Tasks') {
    return <TasksView />;
  }

  if (viewName === 'Events & Calendar' || viewName === 'Calendar & Events' || viewName === 'Kanban Board') {
    return <EventsCalendarView />;
  }

  if (
    viewName === 'To Do & Notes' ||
    viewName === 'To-Do & Notes' ||
    viewName === 'Personal To Do & Notes' ||
    viewName === 'Todos & Notes' ||
    viewName === 'Notes' ||
    viewName === 'Todos'
  ) {
    return <PersonalNotesTodosView />;
  }

  if (viewName === 'Time Tracking' || viewName === 'Attendance') {
    return <TimeTrackingView />;
  }

  if (viewName === 'Documents' || viewName === 'Bug Tracking') {
    return <DocumentsView />;
  }

  if (viewName === 'Revenue' || viewName === 'Finance') {
    return <RevenueView />;
  }

  if (viewName === 'Invoices') {
    return <InvoicesView />;
  }

  if (viewName === 'Expenses') {
    return <ExpensesView />;
  }

  if (viewName === 'Payments') {
    return <PaymentsView />;
  }

  if (viewName === 'Profit & Loss' || viewName === 'Profit and Loss' || viewName === 'P&L') {
    return <ProfitLossView />;
  }

  if (viewName === 'Settings' || viewName === 'Settings & Preferences') {
    return <SettingsView />;
  }

  if (viewName === 'Webhooks') {
    return <WebhooksView />;
  }

  if (
    viewName === 'Team' ||
    viewName === 'Team & HR' ||
    viewName === 'Employees' ||
    viewName === 'Performance' ||
    viewName === 'Recruitment'
  ) {
    return <TeamView />;
  }

  if (viewName === 'Payroll' || viewName === 'Payroll Management') {
    return <PayrollView />;
  }

  if (
    viewName === 'Templates' ||
    viewName === 'Outreach Templates' ||
    viewName === 'Email & WhatsApp Templates' ||
    viewName === 'Email Templates'
  ) {
    return <TemplatesView />;
  }

  const cardBg = isLight
    ? 'bg-white border-sky-100/90 shadow-xs'
    : 'bg-[#0f172a]/90 border-slate-800/80';

  return (
    <div className="space-y-4">
      {/* Back button banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl border bg-gradient-to-r from-sky-500/10 via-sky-400/5 to-transparent border-sky-200/60 dark:border-sky-500/20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveNav('Dashboard')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-sky-700 dark:text-sky-300 bg-white dark:bg-slate-800 border border-sky-200 dark:border-slate-700 shadow-xs hover:bg-sky-50 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>CEO Command Center</span>
          </button>
          <div>
            <h2 className="text-base font-extrabold text-slate-800 dark:text-white">
              {viewName} Management
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage and inspect active records for {viewName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => notifyFallback(`Initialized new ${viewName} workflow entry.`)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-sky-500 text-white hover:bg-sky-600 shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create {viewName.slice(0, -1) || viewName}</span>
          </button>
        </div>
      </div>

      {/* Filter and search bar */}
      <div className={`p-4 rounded-xl border flex flex-col sm:flex-row gap-3 items-center justify-between ${cardBg}`}>
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={`Search ${viewName.toLowerCase()}...`}
            className={`w-full text-xs pl-9 pr-3 py-2 rounded-lg border outline-none ${
              isLight
                ? 'bg-sky-50/40 border-sky-200 text-slate-800 focus:border-sky-500'
                : 'bg-slate-900 border-slate-700 text-white focus:border-sky-400'
            }`}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={() => notifyFallback(`Applied active filters for ${viewName}.`)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium ${
              isLight
                ? 'bg-slate-50 border-sky-200 text-slate-600'
                : 'bg-slate-800 border-slate-700 text-slate-300'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filter</span>
          </button>
          <button
            onClick={() => notifyFallback(`Exported ${viewName} summary CSV.`)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium ${
              isLight
                ? 'bg-slate-50 border-sky-200 text-slate-600'
                : 'bg-slate-800 border-slate-700 text-slate-300'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {fallbackToast && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{fallbackToast}</span>
        </div>
      )}

      {/* Data tables based on viewName */}
      {viewName === 'Deals' || viewName === 'Pipeline' ? (
        <div className={`p-4 rounded-xl border ${cardBg}`}>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-sky-100/30 text-slate-400 font-bold uppercase text-[10px]">
                <th className="pb-2">Deal Name</th>
                <th className="pb-2">Company</th>
                <th className="pb-2">Value</th>
                <th className="pb-2">Stage</th>
                <th className="pb-2">Close Date</th>
                <th className="pb-2">Owner</th>
                <th className="pb-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-100/20">
              {RECENT_DEALS.map((d) => (
                <tr key={d.id} className="hover:bg-sky-500/5 transition-colors">
                  <td className="py-3 font-semibold text-slate-800 dark:text-slate-100">
                    {d.dealName}
                  </td>
                  <td className="py-3 text-slate-500">{d.company}</td>
                  <td className="py-3 font-bold tabular-nums text-sky-600 dark:text-sky-400">
                    {formatMoney(d.value, currency)}
                  </td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/10 text-sky-600 dark:text-sky-300">
                      {d.stage}
                    </span>
                  </td>
                  <td className="py-3 text-slate-400 tabular-nums">{d.closeDate}</td>
                  <td className="py-3 text-slate-600 dark:text-slate-300">{d.owner}</td>
                  <td className="py-3 text-right">
                    <button className="p-1 text-slate-400 hover:text-slate-600">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : viewName === 'Tasks' || viewName === 'Bug Tracking' ? (
        <div className={`p-4 rounded-xl border ${cardBg}`}>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-sky-100/30 text-slate-400 font-bold uppercase text-[10px]">
                <th className="pb-2">Task</th>
                <th className="pb-2">Project</th>
                <th className="pb-2">Assignee</th>
                <th className="pb-2">Due Date</th>
                <th className="pb-2">Priority</th>
                <th className="pb-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-100/20">
              {OVERDUE_TASKS.map((t) => (
                <tr key={t.id} className="hover:bg-sky-500/5 transition-colors">
                  <td className="py-3 font-semibold text-slate-800 dark:text-slate-100">
                    {t.taskName}
                  </td>
                  <td className="py-3 text-slate-500">{t.project}</td>
                  <td className="py-3 text-slate-600 dark:text-slate-300">{t.assignee}</td>
                  <td className="py-3 text-rose-500 font-bold tabular-nums">{t.dueDate}</td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        t.priority === 'High'
                          ? 'bg-rose-500/10 text-rose-600'
                          : 'bg-amber-500/10 text-amber-600'
                      }`}
                    >
                      {t.priority}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <span className="text-[10px] font-semibold text-sky-500">In Progress</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : viewName === 'Invoices' || viewName === 'Revenue' || viewName === 'Expenses' ? (
        <div className={`p-4 rounded-xl border ${cardBg}`}>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-sky-100/30 text-slate-400 font-bold uppercase text-[10px]">
                <th className="pb-2">Invoice #</th>
                <th className="pb-2">Client / Account</th>
                <th className="pb-2">Amount</th>
                <th className="pb-2">Status</th>
                <th className="pb-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-100/20">
              {INVOICES.map((inv) => (
                <tr key={inv.id} className="hover:bg-sky-500/5 transition-colors">
                  <td className="py-3 font-semibold text-slate-800 dark:text-slate-100">
                    {inv.invoiceNumber}
                  </td>
                  <td className="py-3 text-slate-500">{inv.client}</td>
                  <td className="py-3 font-bold tabular-nums text-slate-800 dark:text-white">
                    {formatMoney(inv.amount, currency)}
                  </td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        inv.status === 'Paid'
                          ? 'bg-emerald-500/10 text-emerald-600'
                          : 'bg-amber-500/10 text-amber-600'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <button className="text-[11px] text-sky-500 font-semibold hover:underline">
                      Download PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={`p-8 rounded-xl border text-center ${cardBg}`}>
          <Building className="w-10 h-10 text-sky-400 mx-auto mb-2 opacity-80" />
          <h3 className="text-sm font-bold">{viewName} Module Configured</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            Data pipeline and automated synchronization active for {viewName}. Real-time metrics
            are aggregated on the CEO Command Center dashboard.
          </p>
          <button
            onClick={() => setActiveNav('Dashboard')}
            className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow-sm"
          >
            Return to CEO Command Center
          </button>
        </div>
      )}
    </div>
  );
};
