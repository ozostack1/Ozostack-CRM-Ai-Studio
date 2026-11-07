import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Plus,
  Search,
  Download,
  CheckCircle2,
  Clock,
  Calendar,
  AlertCircle,
  TrendingUp,
  BarChart3,
  Building2,
  Receipt,
  ShieldCheck,
  ChevronRight,
  List,
  LayoutGrid,
  RefreshCw,
  Target,
  Pencil,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import {
  INITIAL_REVENUE_TRANSACTIONS,
  INITIAL_REVENUE_CLIENTS,
} from '../../data/mockData';
import {
  RevenueTransaction,
  RevenueClientSummary,
  RevenuePaymentStatus,
} from '../../types/crm';
import { RecordRevenueModal } from './RecordRevenueModal';
import { RevenueDetailsDrawer } from './RevenueDetailsDrawer';
import { useRevenueGoal, formatCurrency, formatCompact } from '../../data/revenueGoalService';
import { EditGoalModal } from '../goals/EditGoalModal';

const LOCAL_STORAGE_KEY = 'ozostack_revenue_transactions';

type TabViewMode = 'ledger' | 'analytics' | 'clients' | 'forecast';
type TimePeriod = 'This Month' | 'This Quarter' | 'YTD 2025' | 'All Time';

export const RevenueView: React.FC = () => {
  const { theme, setActiveNav } = useTheme();
  const isLight = theme === 'white-sky';

  // Persistence
  const [transactions, setTransactions] = useState<RevenueTransaction[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to parse stored revenue transactions', e);
    }
    return INITIAL_REVENUE_TRANSACTIONS;
  });

  const [activeTab, setActiveTab] = useState<TabViewMode>('ledger');
  const [layoutMode, setLayoutMode] = useState<'table' | 'cards'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStream, setSelectedStream] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('This Month');

  // Modal & Drawer State
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isEditGoalOpen, setIsEditGoalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<RevenueTransaction | null>(null);
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);

  // Dynamic Revenue Goal (ARR & MRR)
  const goalState = useRevenueGoal();

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(transactions));
    } catch (e) {
      console.error('Failed to save revenue transactions', e);
    }
  }, [transactions]);

  // Handle adding new transaction
  const handleSaveTransaction = (newTx: RevenueTransaction) => {
    setTransactions((prev) => [newTx, ...prev]);
  };

  // Handle status update
  const handleUpdateStatus = (id: string, newStatus: RevenuePaymentStatus) => {
    setTransactions((prev) =>
      prev.map((tx) => (tx.id === id ? { ...tx, status: newStatus } : tx))
    );
    if (selectedTransaction && selectedTransaction.id === id) {
      setSelectedTransaction((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  // Handle delete
  const handleDeleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((tx) => tx.id !== id));
    setIsDetailsDrawerOpen(false);
    setSelectedTransaction(null);
  };

  // Period filter evaluator
  const isDateInPeriod = (dateStr: string, period: TimePeriod): boolean => {
    if (period === 'All Time') return true;
    if (period === 'This Month') return dateStr.startsWith('2025-05');
    if (period === 'This Quarter') return dateStr >= '2025-04-01' && dateStr <= '2025-06-30';
    if (period === 'YTD 2025') return dateStr.startsWith('2025');
    return true;
  };

  // Filtered transactions for the ledger view
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Search
      const searchMatch =
        !searchTerm.trim() ||
        tx.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tx.project && tx.project.toLowerCase().includes(searchTerm.toLowerCase())) ||
        tx.transactionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tx.invoiceNumber && tx.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        tx.streamType.toLowerCase().includes(searchTerm.toLowerCase());

      // Stream Type
      const streamMatch = selectedStream === 'All' || tx.streamType === selectedStream;

      // Status
      const statusMatch = selectedStatus === 'All' || tx.status === selectedStatus;

      // Period
      const periodMatch = isDateInPeriod(tx.date, selectedPeriod);

      return searchMatch && streamMatch && statusMatch && periodMatch;
    });
  }, [transactions, searchTerm, selectedStream, selectedStatus, selectedPeriod]);

  // Executive Financial Metrics calculations (scoped to selected period)
  const metrics = useMemo(() => {
    const periodTxs = transactions.filter((tx) => isDateInPeriod(tx.date, selectedPeriod));
    const receivedTxs = periodTxs.filter((tx) => tx.status === 'Received');
    const pendingTxs = periodTxs.filter((tx) => tx.status === 'Pending' || tx.status === 'Scheduled');

    const totalReceivedAmount = receivedTxs.reduce((sum, tx) => sum + tx.amount, 0);
    const totalPendingAmount = pendingTxs.reduce((sum, tx) => sum + tx.amount, 0);
    const grossTotal = totalReceivedAmount + totalPendingAmount;

    // MRR: Sum of recurring streams
    const mrrTotal = transactions
      .filter((tx) => tx.isRecurring)
      .reduce((sum, tx) => sum + tx.amount, 0);

    // Blended Gross Margin
    const totalNetProfit = periodTxs.reduce((sum, tx) => sum + tx.netProfit, 0);
    const blendedMargin = grossTotal > 0 ? ((totalNetProfit / grossTotal) * 100).toFixed(1) : '42.6';

    // Annual Goal (computed on YTD basis from dynamic goal service)
    const annualGoal = goalState.annualGoal;
    const ytdReceived = transactions
      .filter((tx) => tx.status === 'Received' && tx.date.startsWith('2025'))
      .reduce((sum, tx) => sum + tx.amount, 0);
    const goalProgressPercent = ((ytdReceived / annualGoal) * 100).toFixed(2);
    const remainingToGoal = Math.max(0, annualGoal - ytdReceived);

    return {
      grossTotal,
      totalReceivedAmount,
      totalPendingAmount,
      mrrTotal,
      totalNetProfit,
      blendedMargin,
      goalProgressPercent,
      remainingToGoal,
    };
  }, [transactions, selectedPeriod]);

  // Client Lifetime Billings & MRR Matrix (dynamic & reactive)
  const clientMatrix = useMemo<RevenueClientSummary[]>(() => {
    const clientMap = new Map<string, { total: number; mrr: number; contracts: number; lastDate: string }>();

    transactions.forEach((tx) => {
      const existing = clientMap.get(tx.client) || { total: 0, mrr: 0, contracts: 0, lastDate: tx.date };
      existing.total += tx.amount;
      if (tx.isRecurring) {
        existing.mrr += tx.amount;
      }
      existing.contracts += 1;
      if (tx.date > existing.lastDate) {
        existing.lastDate = tx.date;
      }
      clientMap.set(tx.client, existing);
    });

    const result: RevenueClientSummary[] = [];
    const seen = new Set<string>();

    INITIAL_REVENUE_CLIENTS.forEach((initClient) => {
      seen.add(initClient.client);
      const live = clientMap.get(initClient.client);
      if (live) {
        result.push({
          client: initClient.client,
          totalRevenue: Math.max(initClient.totalRevenue, live.total),
          totalRevenueFormatted: formatCurrency(Math.max(initClient.totalRevenue, live.total)),
          mrrContribution: live.mrr > 0 ? live.mrr : initClient.mrrContribution,
          activeContracts: Math.max(initClient.activeContracts, live.contracts),
          health: initClient.health,
          lastPaymentDate: live.lastDate || initClient.lastPaymentDate,
        });
      } else {
        result.push(initClient);
      }
    });

    clientMap.forEach((data, clientName) => {
      if (!seen.has(clientName)) {
        result.push({
          client: clientName,
          totalRevenue: data.total,
          totalRevenueFormatted: formatCurrency(data.total),
          mrrContribution: data.mrr,
          activeContracts: data.contracts,
          health: 'High',
          lastPaymentDate: data.lastDate,
        });
      }
    });

    return result.sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [transactions]);

  // Stream breakdown for Analytics tab
  const streamDistribution = useMemo(() => {
    const streamMap: Record<string, { total: number; count: number; marginSum: number }> = {};
    transactions.forEach((tx) => {
      if (!streamMap[tx.streamType]) {
        streamMap[tx.streamType] = { total: 0, count: 0, marginSum: 0 };
      }
      streamMap[tx.streamType].total += tx.amount;
      streamMap[tx.streamType].count += 1;
      streamMap[tx.streamType].marginSum += tx.grossMarginPercent;
    });

    const totalRev = transactions.reduce((acc, t) => acc + t.amount, 0) || 1;

    return Object.entries(streamMap).map(([stream, data]) => ({
      stream,
      total: data.total,
      count: data.count,
      avgMargin: Math.round(data.marginSum / data.count),
      percentage: Math.round((data.total / totalRev) * 100),
    })).sort((a, b) => b.total - a.total);
  }, [transactions]);

  // Export CSV function
  const handleExportCSV = () => {
    const headers = [
      'Transaction ID',
      'Client',
      'Project',
      'Stream Type',
      'Amount',
      'Status',
      'Date',
      'Payment Method',
      'Invoice #',
      'Recurring',
      'Gross Margin %',
      'Net Profit',
      'Account Manager',
    ];

    const rows = filteredTransactions.map((tx) => [
      tx.transactionNumber,
      `"${tx.client.replace(/"/g, '""')}"`,
      `"${(tx.project || '').replace(/"/g, '""')}"`,
      `"${tx.streamType}"`,
      tx.amount,
      tx.status,
      tx.date,
      tx.paymentMethod,
      tx.invoiceNumber || '',
      tx.isRecurring ? 'Yes' : 'No',
      `${tx.grossMarginPercent}%`,
      tx.netProfit,
      `"${tx.accountManager.replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Ozostack_Revenue_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const cardBg = isLight
    ? 'bg-white border-sky-100/90 shadow-xs'
    : 'bg-[#0f172a]/90 border-slate-800/80';

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Header & Executive Command Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl border bg-gradient-to-r from-sky-500/10 via-sky-400/5 to-transparent border-sky-200/60 dark:border-sky-500/20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveNav('Dashboard')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-sky-700 dark:text-sky-300 bg-white dark:bg-slate-800 border border-sky-200 dark:border-slate-700 shadow-xs hover:bg-sky-50 dark:hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>CEO Command Center</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-slate-800 dark:text-white">
                Revenue & Financial Stream Operations
              </h2>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Audited Ledger
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Real-time monitoring of SaaS MRR, custom enterprise billing, collected cash flow & {goalState.compactAnnualGoal} ARR progress
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={handleExportCSV}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors shadow-xs ${
              isLight
                ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            onClick={() => setIsRecordModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-sky-500 hover:bg-sky-600 text-white shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Record Revenue</span>
          </button>
        </div>
      </div>

      {/* Executive KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Monthly Realized Revenue */}
        <div className={`p-4 rounded-2xl border ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Realized Revenue
            </span>
            <div className="w-7 h-7 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-500">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {formatCurrency(metrics.totalReceivedAmount)}
            </span>
            <span className="text-xs font-bold text-emerald-500 flex items-center">
              ▲ 28.6%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Settled bank inflows for current cycle
          </p>
        </div>

        {/* Card 2: SaaS MRR */}
        <div className={`p-4 rounded-2xl border ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Monthly Recurring (MRR)
            </span>
            <div className="w-7 h-7 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-500">
              <RefreshCw className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {formatCurrency(metrics.mrrTotal)}
            </span>
            <span className="text-xs font-bold text-emerald-500 flex items-center">
              ▲ 12.4%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Annualized ARR Run-rate: {formatCurrency(metrics.mrrTotal * 12)}
          </p>
        </div>

        {/* Card 3: Receivables & Pending */}
        <div className={`p-4 rounded-2xl border ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Outstanding Invoices
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {formatCurrency(metrics.totalPendingAmount)}
            </span>
            <span className="text-xs font-bold text-slate-400">
              {transactions.filter((t) => t.status === 'Pending').length} pending
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Collection velocity: 84.8% on-time
          </p>
        </div>

        {/* Card 4: Gross Margin & Profit */}
        <div className={`p-4 rounded-2xl border ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Blended Gross Margin
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {metrics.blendedMargin}%
            </span>
            <span className="text-xs font-bold text-emerald-500 flex items-center">
              ▲ 5.3%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Net Profit: {formatCurrency(metrics.totalNetProfit)}
          </p>
        </div>
      </div>

      {/* $1M Goal Progress Banner */}
      <div
        className={`p-4 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
          isLight
            ? 'bg-sky-50/50 border-sky-200/80'
            : 'bg-slate-900/60 border-slate-800'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-sky-500/15 flex items-center justify-center text-sky-500 shrink-0">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-white">
                {goalState.formattedAnnualGoal} Annual Revenue Goal Tracker
              </h3>
              <span className="text-xs font-black text-sky-600 dark:text-sky-400">
                {metrics.goalProgressPercent}% Reached
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {formatCurrency(metrics.totalReceivedAmount)} realized • {formatCurrency(metrics.remainingToGoal)} remaining to goal
            </p>
          </div>
        </div>

        <div className="w-full md:w-80 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
            <span>Pacing: On Track</span>
            <span>Target: {goalState.formattedMrrGoal}/mo</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div
              className="h-full bg-sky-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, parseFloat(metrics.goalProgressPercent))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('ledger')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'ledger'
                ? 'bg-sky-500 text-white shadow-xs'
                : isLight
                ? 'text-slate-600 hover:bg-sky-50'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            Ledger & Transactions ({filteredTransactions.length})
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'analytics'
                ? 'bg-sky-500 text-white shadow-xs'
                : isLight
                ? 'text-slate-600 hover:bg-sky-50'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            Streams & Margins
          </button>
          <button
            onClick={() => setActiveTab('clients')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'clients'
                ? 'bg-sky-500 text-white shadow-xs'
                : isLight
                ? 'text-slate-600 hover:bg-sky-50'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            Client LTV Matrix
          </button>
          <button
            onClick={() => setActiveTab('forecast')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'forecast'
                ? 'bg-sky-500 text-white shadow-xs'
                : isLight
                ? 'text-slate-600 hover:bg-sky-50'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            ARR & Goals Forecast
          </button>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-xs">
            {(['This Month', 'This Quarter', 'YTD 2025', 'All Time'] as TimePeriod[]).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  selectedPeriod === period
                    ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* TAB 1: LEDGER VIEW */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className={`p-3.5 rounded-xl border flex flex-col md:flex-row gap-3 items-center justify-between ${cardBg}`}>
            {/* Search */}
            <div className="relative w-full md:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search client, project, invoice #..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-sky-500 ${
                  isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-800'
                    : 'bg-slate-900 border-slate-700 text-slate-100'
                }`}
              />
            </div>

            {/* Dropdowns & Layout mode */}
            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto justify-between md:justify-end">
              {/* Stream filter */}
              <select
                value={selectedStream}
                onChange={(e) => setSelectedStream(e.target.value)}
                className={`text-xs py-1.5 px-2.5 rounded-lg border focus:outline-none focus:ring-1 focus:ring-sky-500 ${
                  isLight
                    ? 'bg-white border-slate-200 text-slate-700'
                    : 'bg-slate-800 border-slate-700 text-slate-200'
                }`}
              >
                <option value="All">All Streams</option>
                <option value="SaaS Subscription (MRR)">SaaS Subscription (MRR)</option>
                <option value="Custom Engineering">Custom Engineering</option>
                <option value="AI Automation & Agents">AI Automation & Agents</option>
                <option value="Cloud Infrastructure">Cloud Infrastructure</option>
                <option value="Enterprise Retainer">Enterprise Retainer</option>
                <option value="Consulting & Advisory">Consulting & Advisory</option>
              </select>

              {/* Status filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className={`text-xs py-1.5 px-2.5 rounded-lg border focus:outline-none focus:ring-1 focus:ring-sky-500 ${
                  isLight
                    ? 'bg-white border-slate-200 text-slate-700'
                    : 'bg-slate-800 border-slate-700 text-slate-200'
                }`}
              >
                <option value="All">All Statuses</option>
                <option value="Received">Received</option>
                <option value="Pending">Pending</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Overdue">Overdue</option>
              </select>

              {/* Layout Switcher */}
              <div className="flex items-center border rounded-lg overflow-hidden border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setLayoutMode('table')}
                  title="Table View"
                  className={`p-1.5 transition-colors ${
                    layoutMode === 'table'
                      ? 'bg-sky-500 text-white'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setLayoutMode('cards')}
                  title="Cards View"
                  className={`p-1.5 transition-colors ${
                    layoutMode === 'cards'
                      ? 'bg-sky-500 text-white'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* TABLE LAYOUT */}
          {layoutMode === 'table' ? (
            <div className={`rounded-xl border overflow-hidden ${cardBg}`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr
                      className={`text-[11px] font-bold uppercase tracking-wider border-b ${
                        isLight
                          ? 'bg-slate-50/80 text-slate-400 border-slate-100'
                          : 'bg-slate-900/80 text-slate-400 border-slate-800'
                      }`}
                    >
                      <th className="py-3 px-4">Transaction / Client</th>
                      <th className="py-3 px-4">Revenue Stream</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Margin %</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Payment Method</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                    {filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400">
                          No transactions found matching your criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map((tx) => (
                        <tr
                          key={tx.id}
                          onClick={() => {
                            setSelectedTransaction(tx);
                            setIsDetailsDrawerOpen(true);
                          }}
                          className={`cursor-pointer transition-colors ${
                            isLight ? 'hover:bg-sky-50/40' : 'hover:bg-slate-800/40'
                          }`}
                        >
                          {/* Transaction / Client */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div>
                                <p className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                                  <span>{tx.client}</span>
                                  {tx.isRecurring && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase bg-sky-500/15 text-sky-600 dark:text-sky-400">
                                      MRR
                                    </span>
                                  )}
                                </p>
                                <p className="text-[11px] text-slate-400 font-mono">
                                  {tx.transactionNumber} {tx.invoiceNumber && `• ${tx.invoiceNumber}`}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Revenue Stream */}
                          <td className="py-3 px-4">
                            <span className="font-medium text-slate-700 dark:text-slate-300">
                              {tx.streamType}
                            </span>
                          </td>

                          {/* Amount */}
                          <td className="py-3 px-4">
                            <span className="font-black text-slate-900 dark:text-white">
                              {formatCurrency(tx.amount)}
                            </span>
                          </td>

                          {/* Margin */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                              <span>{tx.grossMarginPercent}%</span>
                              <span className="text-[10px] text-slate-400 font-normal">
                                ({formatCurrency(tx.netProfit)})
                              </span>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4">
                            {tx.status === 'Received' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="w-3 h-3" />
                                Received
                              </span>
                            ) : tx.status === 'Pending' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                <Clock className="w-3 h-3" />
                                Pending
                              </span>
                            ) : tx.status === 'Scheduled' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400">
                                <Calendar className="w-3 h-3" />
                                Scheduled
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400">
                                <AlertCircle className="w-3 h-3" />
                                Overdue
                              </span>
                            )}
                          </td>

                          {/* Date */}
                          <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                            {tx.date}
                          </td>

                          {/* Payment Method */}
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {tx.paymentMethod}
                            </span>
                          </td>

                          {/* Action */}
                          <td className="py-3 px-4 text-right">
                            <span className="text-sky-600 dark:text-sky-400 font-semibold text-xs hover:underline inline-flex items-center gap-1">
                              <span>Inspect</span>
                              <ChevronRight className="w-3 h-3" />
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* CARDS LAYOUT */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredTransactions.map((tx) => (
                <div
                  key={tx.id}
                  onClick={() => {
                    setSelectedTransaction(tx);
                    setIsDetailsDrawerOpen(true);
                  }}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all hover:scale-[1.01] ${cardBg}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono font-semibold text-sky-600 dark:text-sky-400">
                          {tx.transactionNumber}
                        </span>
                        {tx.isRecurring && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase bg-sky-500/15 text-sky-600 dark:text-sky-400">
                            MRR
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                        {tx.client}
                      </h4>
                    </div>
                    <span className="text-base font-black text-slate-900 dark:text-white">
                      {formatCurrency(tx.amount)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 truncate">
                    {tx.project || tx.streamType}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-400">{tx.date}</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {tx.grossMarginPercent}% margin
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        tx.status === 'Received'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: STREAMS & MARGINS ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Stream Distribution Breakdown */}
            <div className={`lg:col-span-2 p-5 rounded-2xl border ${cardBg}`}>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-sky-500" />
                <span>Revenue Composition by Product & Stream</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1 mb-5">
                Relative contribution and profit margin by core revenue line
              </p>

              <div className="space-y-4">
                {streamDistribution.map((item) => (
                  <div key={item.stream} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {item.stream}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-400">
                          {item.count} deals • {item.avgMargin}% margin
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {formatCurrency(item.total)} ({item.percentage}%)
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-sky-500 rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Margin Economics Card */}
            <div className={`p-5 rounded-2xl border ${cardBg} flex flex-col justify-between`}>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Blended Unit Economics</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Analysis of cost of delivery vs gross retained margin
                </p>

                <div className="mt-5 space-y-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <span className="text-slate-500">Gross Billings:</span>
                    <span className="font-black text-slate-900 dark:text-white">
                      {formatCurrency(metrics.grossTotal)}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <span className="text-slate-500">Direct Infrastructure / COGS:</span>
                    <span className="font-bold text-rose-500">
                      -{formatCurrency(metrics.grossTotal - metrics.totalNetProfit)}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex justify-between items-center">
                    <span className="text-emerald-700 dark:text-emerald-300 font-semibold">
                      Realized Net Contribution:
                    </span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                      {formatCurrency(metrics.totalNetProfit)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                SaaS subscriptions generate the highest gross margin (78-82%), while Cloud Infrastructure retains 38% due to AWS/GCP compute pass-through.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CLIENT LTV MATRIX */}
      {activeTab === 'clients' && (
        <div className={`p-5 rounded-2xl border ${cardBg}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-sky-500" />
                <span>Client Lifetime Billings & MRR Matrix</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Cumulative revenue and account health across top enterprise clients
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  <th className="py-3 px-4">Client Organization</th>
                  <th className="py-3 px-4">Total Revenue</th>
                  <th className="py-3 px-4">MRR Contribution</th>
                  <th className="py-3 px-4">Active Contracts</th>
                  <th className="py-3 px-4">Account Health</th>
                  <th className="py-3 px-4">Last Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {clientMatrix.map((client) => (
                  <tr key={client.client} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold text-slate-800 dark:text-white">
                      {client.client}
                    </td>
                    <td className="py-3 px-4 font-black text-slate-900 dark:text-white">
                      {client.totalRevenueFormatted}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                      {client.mrrContribution > 0 ? `${formatCurrency(client.mrrContribution)}/mo` : '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                      {client.activeContracts} active
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          client.health === 'High'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : client.health === 'Medium'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {client.health} Health
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">{client.lastPaymentDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: ARR & FORECAST */}
      {activeTab === 'forecast' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-2xl border ${cardBg}`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Annual Target (ARR)
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditGoalOpen(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold text-sky-600 dark:text-sky-400 bg-sky-500/10 hover:bg-sky-500 hover:text-white transition-colors border border-sky-500/20"
                  title="Edit ARR & MRR Goal"
                >
                  <Pencil className="w-3 h-3" />
                  <span>Edit Goal</span>
                </button>
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {goalState.formattedAnnualGoal}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Pacing required: {goalState.formattedMrrGoal} / month ({goalState.formatCompact(goalState.dailyGoal)} / day)
              </p>
            </div>

            <div className={`p-4 rounded-2xl border ${cardBg}`}>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Current Run-Rate (ARR)
              </span>
              <p className="text-2xl font-black text-sky-600 dark:text-sky-400 mt-1">
                {formatCurrency(metrics.mrrTotal * 12 + metrics.totalReceivedAmount)}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Based on current MRR ({formatCurrency(metrics.mrrTotal)}/mo) + Q1/Q2 closed billing
              </p>
            </div>

            {(() => {
              const surplusDiff = metrics.totalReceivedAmount - goalState.mrrGoal;
              const pacingPct = goalState.mrrGoal > 0 ? (surplusDiff / goalState.mrrGoal) * 100 : 0;
              const isSurplus = surplusDiff >= 0;

              return (
                <div className={`p-4 rounded-2xl border ${cardBg}`}>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Pacing Status vs Target
                  </span>
                  <p className={`text-2xl font-black mt-1 ${isSurplus ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {isSurplus ? '+' : ''}{pacingPct.toFixed(1)}%
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {isSurplus
                      ? `Current month exceeds baseline target by ${formatCurrency(surplusDiff)}`
                      : `Need ${formatCurrency(Math.abs(surplusDiff))} more to achieve monthly target`}
                  </p>
                </div>
              );
            })()}
          </div>

          <div className={`p-5 rounded-2xl border ${cardBg}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                  Monthly Goal Execution Roadmap
                </h3>
                <p className="text-xs text-slate-400">
                  Tracking monthly target velocity to achieve the 2025 CEO growth mandate of {goalState.formattedAnnualGoal} ARR ({goalState.formattedMrrGoal}/month).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditGoalOpen(true)}
                className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-sky-600 dark:text-sky-400 bg-sky-500/10 hover:bg-sky-500 hover:text-white transition-colors border border-sky-500/20"
              >
                <Target className="w-3.5 h-3.5" />
                <span>Adjust Velocity Target</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
              {[
                { month: 'Jan', actualNum: 140000 },
                { month: 'Feb', actualNum: 155000 },
                { month: 'Mar', actualNum: 168000 },
                { month: 'Apr', actualNum: 182000 },
                { month: 'May (Current)', actualNum: 215000 },
                { month: 'Jun (Projected)', actualNum: 225000 },
              ].map((item) => {
                const isPassed = item.actualNum >= goalState.mrrGoal;
                const isProjected = item.month.includes('Projected');
                const isCurrent = item.month.includes('Current');
                const status = isProjected
                  ? 'Projected'
                  : isCurrent
                  ? isPassed
                    ? 'Active (Ahead)'
                    : 'Active (Behind)'
                  : isPassed
                  ? 'Passed'
                  : 'Behind';

                return (
                  <div
                    key={item.month}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800"
                  >
                    <span className="font-bold text-slate-700 dark:text-slate-300 block">
                      {item.month}
                    </span>
                    <span className="text-sm font-black text-sky-600 dark:text-sky-400 block mt-1">
                      {goalState.formatCompact(item.actualNum)}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Target: {goalState.compactMrrGoal}
                    </span>
                    <span
                      className={`inline-block mt-2 px-1.5 py-0.2 rounded text-[9px] font-bold ${
                        status.includes('Passed') || status.includes('Ahead')
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : status === 'Projected'
                          ? 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                          : 'bg-amber-500/10 text-amber-500'
                      }`}
                    >
                      {status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Record Revenue Inflow Modal */}
      <RecordRevenueModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        onSave={handleSaveTransaction}
      />

      {/* Transaction Details Drawer */}
      <RevenueDetailsDrawer
        transaction={selectedTransaction}
        isOpen={isDetailsDrawerOpen}
        onClose={() => {
          setIsDetailsDrawerOpen(false);
          setSelectedTransaction(null);
        }}
        onUpdateStatus={handleUpdateStatus}
        onDeleteTransaction={handleDeleteTransaction}
      />

      {/* Edit Revenue Goal Modal */}
      <EditGoalModal
        isOpen={isEditGoalOpen}
        onClose={() => setIsEditGoalOpen(false)}
      />
    </div>
  );
};

