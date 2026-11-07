import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Plus,
  Search,
  Download,
  CreditCard,
  Building,
  CheckCircle2,
  Clock,
  AlertCircle,
  ShieldCheck,
  Calendar,
  Filter,
  List,
  LayoutGrid,
  TrendingDown,
  Cpu,
  Receipt,
  Edit3,
  Trash2,
  ChevronRight,
  ExternalLink,
  DollarSign,
  PieChart,
  BarChart3,
  Layers,
  Sparkles,
  Check,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import {
  INITIAL_EXPENSES,
  INITIAL_EXPENSE_VENDORS,
  INITIAL_EXPENSE_BUDGETS,
} from '../../data/mockData';
import {
  ExpenseItem,
  ExpenseCategory,
  ExpenseStatus,
  ExpenseDepartment,
  ExpenseVendorSummary,
  ExpenseBudgetCategory,
} from '../../types/crm';
import { RecordExpenseModal } from './RecordExpenseModal';
import { ExpenseDetailsDrawer } from './ExpenseDetailsDrawer';
import { useSystemCurrency, formatMoney } from '../../data/currencyService';

const LOCAL_STORAGE_KEY = 'ozostack_expenses';

type HorizontalTab = 'ledger' | 'analytics' | 'vendors' | 'budgets';
type TimePeriod = 'This Month' | 'This Quarter' | 'YTD 2025' | 'All Time';

export const ExpensesView: React.FC = () => {
  const { theme, setActiveNav } = useTheme();
  const isLight = theme === 'white-sky';
  const currency = useSystemCurrency();

  // Persistence
  const [expenses, setExpenses] = useState<ExpenseItem[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse stored expenses', e);
    }
    return INITIAL_EXPENSES;
  });

  const [activeTab, setActiveTab] = useState<HorizontalTab>('ledger');
  const [layoutMode, setLayoutMode] = useState<'table' | 'cards'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('All');
  const [selectedBillable, setSelectedBillable] = useState<string>('All');
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('This Month');

  // Modals & Drawer State
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseItem | null>(null);
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(expenses));
    } catch (e) {
      console.error('Failed to save expenses to localStorage', e);
    }
  }, [expenses]);

  // Save (Create or Edit)
  const handleSaveExpense = (newExpense: ExpenseItem) => {
    setExpenses((prev) => {
      const exists = prev.some((it) => it.id === newExpense.id);
      return exists
        ? prev.map((it) => (it.id === newExpense.id ? newExpense : it))
        : [newExpense, ...prev];
    });

    if (selectedExpense && selectedExpense.id === newExpense.id) {
      setSelectedExpense(newExpense);
    }
  };

  // Status updates
  const handleUpdateStatus = (id: string, newStatus: ExpenseStatus) => {
    setExpenses((prev) =>
      prev.map((it) =>
        it.id === id
          ? {
            ...it,
            status: newStatus,
            paidDate: newStatus === 'Paid' ? new Date().toISOString().split('T')[0] : it.paidDate,
            approvedBy:
              newStatus === 'Approved' || newStatus === 'Paid' ? 'Sayed (CEO)' : it.approvedBy,
          }
          : it
      )
    );

    if (selectedExpense && selectedExpense.id === id) {
      setSelectedExpense((prev) =>
        prev
          ? {
            ...prev,
            status: newStatus,
            paidDate: newStatus === 'Paid' ? new Date().toISOString().split('T')[0] : prev.paidDate,
          }
          : null
      );
    }
  };

  // Delete
  const handleDeleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((it) => it.id !== id));
    setIsDetailsDrawerOpen(false);
    setSelectedExpense(null);
  };

  // Bulk approve pending
  const handleApproveAllPending = () => {
    setExpenses((prev) =>
      prev.map((it) =>
        it.status === 'Pending Approval' ? { ...it, status: 'Approved', approvedBy: 'Sayed (CEO)' } : it
      )
    );
  };

  // Date period checker
  const isDateInPeriod = (dateStr: string, period: TimePeriod): boolean => {
    if (period === 'All Time') return true;
    if (period === 'This Month') return dateStr.startsWith('2025-05');
    if (period === 'This Quarter') return dateStr >= '2025-04-01' && dateStr <= '2025-06-30';
    if (period === 'YTD 2025') return dateStr.startsWith('2025');
    return true;
  };

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((it) => {
      // Period
      if (!isDateInPeriod(it.date, selectedPeriod)) return false;

      // Category
      if (selectedCategory !== 'All' && it.category !== selectedCategory) return false;

      // Status
      if (selectedStatus !== 'All' && it.status !== selectedStatus) return false;

      // Department
      if (selectedDepartment !== 'All' && it.department !== selectedDepartment) return false;

      // Billable
      if (selectedBillable === 'Billable' && !it.isBillableToClient) return false;
      if (selectedBillable === 'Non-Billable' && it.isBillableToClient) return false;

      // Search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchTitle = it.title.toLowerCase().includes(query);
        const matchVendor = it.vendor.toLowerCase().includes(query);
        const matchNum = it.expenseNumber.toLowerCase().includes(query);
        const matchCategory = it.category.toLowerCase().includes(query);
        const matchProject = it.project?.toLowerCase().includes(query);
        const matchClient = it.client?.toLowerCase().includes(query);
        return matchTitle || matchVendor || matchNum || matchCategory || matchProject || matchClient;
      }

      return true;
    });
  }, [
    expenses,
    selectedPeriod,
    selectedCategory,
    selectedStatus,
    selectedDepartment,
    selectedBillable,
    searchTerm,
  ]);

  // Overall calculations
  const totalBurn = filteredExpenses.reduce((acc, it) => acc + it.amount, 0);
  const pendingApprovals = filteredExpenses.filter((it) => it.status === 'Pending Approval');
  const pendingTotal = pendingApprovals.reduce((acc, it) => acc + it.amount, 0);

  const infraExpenses = filteredExpenses.filter(
    (it) => it.category === 'Cloud & Infrastructure' || it.category === 'AI & API Services'
  );
  const infraTotal = infraExpenses.reduce((acc, it) => acc + it.amount, 0);
  const infraPercentage = totalBurn > 0 ? ((infraTotal / totalBurn) * 100).toFixed(1) : '0';

  const billableExpenses = filteredExpenses.filter((it) => it.isBillableToClient);
  const billableTotal = billableExpenses.reduce((acc, it) => acc + it.amount, 0);

  // Category breakdown for analytics tab
  const categoryStats = useMemo(() => {
    const map: Record<string, { count: number; total: number }> = {};
    filteredExpenses.forEach((it) => {
      if (!map[it.category]) map[it.category] = { count: 0, total: 0 };
      map[it.category].count += 1;
      map[it.category].total += it.amount;
    });

    return Object.entries(map)
      .map(([cat, stats]) => ({
        category: cat as ExpenseCategory,
        count: stats.count,
        total: stats.total,
        percentage: totalBurn > 0 ? Math.round((stats.total / totalBurn) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredExpenses, totalBurn]);

  // Department stats
  const departmentStats = useMemo(() => {
    const map: Record<string, number> = {};
    filteredExpenses.forEach((it) => {
      map[it.department] = (map[it.department] || 0) + it.amount;
    });
    return Object.entries(map)
      .map(([dept, total]) => ({
        department: dept,
        total,
        percentage: totalBurn > 0 ? Math.round((total / totalBurn) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredExpenses, totalBurn]);

  // Export CSV
  const handleExportCsv = () => {
    const headers = [
      'Expense #',
      'Title',
      'Vendor',
      'Category',
      'Department',
      'Amount ($)',
      'Tax ($)',
      'Status',
      'Payment Method',
      'Date',
      'Project',
      'Client',
      'Billable',
      'Recurring',
      'Approved By',
      'Notes',
    ];

    const rows = filteredExpenses.map((it) => [
      it.expenseNumber,
      `"${it.title.replace(/"/g, '""')}"`,
      `"${it.vendor.replace(/"/g, '""')}"`,
      `"${it.category}"`,
      `"${it.department}"`,
      it.amount,
      it.taxAmount || 0,
      it.status,
      it.paymentMethod,
      it.date,
      `"${(it.project || '').replace(/"/g, '""')}"`,
      `"${(it.client || '').replace(/"/g, '""')}"`,
      it.isBillableToClient ? 'Yes' : 'No',
      it.isRecurring ? 'Yes' : 'No',
      `"${(it.approvedBy || '').replace(/"/g, '""')}"`,
      `"${(it.notes || '').replace(/"/g, '""')}"`,
    ]);

    rows.push([
      'TOTAL',
      '',
      '',
      '',
      '',
      totalBurn,
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Ozostack_Expenses_${selectedPeriod.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const cardBg = isLight
    ? 'bg-white border-sky-100/90 shadow-xs'
    : 'bg-[#0f172a]/90 border-slate-800/80';

  return (
    <div className="space-y-4">
      {/* Top Banner Navigation & CTA */}
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
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-slate-800 dark:text-white">
                Expenses & Burn Rate Management
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-sky-500 text-white uppercase tracking-wider">
                OPEX Hub
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Cloud compute telemetry, vendor disbursements, SaaS subscriptions, and budget compliance
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={handleExportCsv}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors ${isLight
                ? 'border-slate-200 text-slate-700 bg-white hover:bg-slate-50'
                : 'border-slate-700 text-slate-200 bg-slate-800 hover:bg-slate-750'
              }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => {
              setEditingExpense(null);
              setIsRecordModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-sky-500 hover:bg-sky-600 text-white shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Expense</span>
          </button>
        </div>
      </div>

      {/* 4 Dynamic Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1: Total Burn */}
        <div className={`p-4 rounded-2xl border ${cardBg}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total OPEX / Burn Rate
            </span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {currency.symbol}{totalBurn.toLocaleString('en-US')}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
            <TrendingDown className="w-3.5 h-3.5" />
            <span>-4.2% MoM burn reduction</span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {filteredExpenses.length} disbursements in {selectedPeriod}
          </span>
        </div>

        {/* Metric 2: Pending Approvals */}
        <div className={`p-4 rounded-2xl border ${cardBg}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Pending Approvals
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {currency.symbol}{pendingTotal.toLocaleString('en-US')}
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
              {pendingApprovals.length} records awaiting signoff
            </span>
            {pendingApprovals.length > 0 && (
              <button
                onClick={handleApproveAllPending}
                className="text-[10px] font-bold text-sky-600 dark:text-sky-400 hover:underline"
              >
                Approve All
              </button>
            )}
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            Requires CEO / Finance authorization
          </span>
        </div>

        {/* Metric 3: Cloud & AI Infrastructure */}
        <div className={`p-4 rounded-2xl border ${cardBg}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Cloud & AI Compute
            </span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {currency.symbol}{infraTotal.toLocaleString('en-US')}
          </div>
          <div className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 mt-1">
            {infraPercentage}% of total operating burn
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            AWS GPUs, OpenAI, Anthropic, Datadog
          </span>
        </div>

        {/* Metric 4: Billable Recoverable */}
        <div className={`p-4 rounded-2xl border ${cardBg}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Client-Billable Spend
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {currency.symbol}{billableTotal.toLocaleString('en-US')}
          </div>
          <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
            100% recoverable on invoices
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            Linked to CloudNest AI & FinEdge projects
          </span>
        </div>
      </div>

      {/* Horizontal Navigation Tabs */}
      <div className={`p-1.5 rounded-2xl border flex items-center justify-between gap-2 overflow-x-auto ${cardBg}`}>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('ledger')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'ledger'
                ? 'bg-sky-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
          >
            <List className="w-4 h-4" />
            <span>Ledger & Records ({filteredExpenses.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'analytics'
                ? 'bg-sky-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
          >
            <PieChart className="w-4 h-4" />
            <span>Category Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab('vendors')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'vendors'
                ? 'bg-sky-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
          >
            <Building className="w-4 h-4" />
            <span>Vendors & Subscriptions ({INITIAL_EXPENSE_VENDORS.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('budgets')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'budgets'
                ? 'bg-sky-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
          >
            <Layers className="w-4 h-4" />
            <span>Budgets & Cost Control</span>
          </button>
        </div>

        {/* Time Period Filter Pills */}
        <div className="flex items-center gap-1 shrink-0">
          {(['This Month', 'This Quarter', 'YTD 2025', 'All Time'] as TimePeriod[]).map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${selectedPeriod === period
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: LEDGER & ALL RECORDS */}
      {activeTab === 'ledger' && (
        <div className="space-y-3">
          {/* Filter and Search Bar */}
          <div className={`p-3.5 rounded-2xl border flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 ${cardBg}`}>
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title, vendor, category, expense #..."
                className={`w-full text-xs pl-9 pr-3 py-2 rounded-xl border outline-none ${isLight
                    ? 'bg-sky-50/40 border-sky-200 text-slate-800 focus:border-sky-500'
                    : 'bg-slate-900 border-slate-700 text-white focus:border-sky-400'
                  }`}
              />
            </div>

            {/* Dropdown Filters */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Category */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={`px-2.5 py-2 rounded-xl border outline-none font-medium ${isLight
                    ? 'bg-white border-slate-200 text-slate-700'
                    : 'bg-slate-800 border-slate-700 text-slate-200'
                  }`}
              >
                <option value="All">All Categories</option>
                <option value="Cloud & Infrastructure">Cloud & Infrastructure</option>
                <option value="AI & API Services">AI & API Services</option>
                <option value="Team & Payroll">Team & Payroll</option>
                <option value="Software & SaaS">Software & SaaS</option>
                <option value="Marketing & Growth">Marketing & Growth</option>
                <option value="Legal & Professional">Legal & Professional</option>
                <option value="Office & Operations">Office & Operations</option>
              </select>

              {/* Status */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className={`px-2.5 py-2 rounded-xl border outline-none font-medium ${isLight
                    ? 'bg-white border-slate-200 text-slate-700'
                    : 'bg-slate-800 border-slate-700 text-slate-200'
                  }`}
              >
                <option value="All">All Statuses</option>
                <option value="Paid">Paid</option>
                <option value="Pending Approval">Pending Approval</option>
                <option value="Approved">Approved</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Rejected">Rejected</option>
              </select>

              {/* Department */}
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className={`px-2.5 py-2 rounded-xl border outline-none font-medium ${isLight
                    ? 'bg-white border-slate-200 text-slate-700'
                    : 'bg-slate-800 border-slate-700 text-slate-200'
                  }`}
              >
                <option value="All">All Departments</option>
                <option value="Engineering & AI">Engineering & AI</option>
                <option value="Product & Design">Product & Design</option>
                <option value="Marketing & Sales">Marketing & Sales</option>
                <option value="Operations & Executive">Operations & Executive</option>
              </select>

              {/* Billable */}
              <select
                value={selectedBillable}
                onChange={(e) => setSelectedBillable(e.target.value)}
                className={`px-2.5 py-2 rounded-xl border outline-none font-medium ${isLight
                    ? 'bg-white border-slate-200 text-slate-700'
                    : 'bg-slate-800 border-slate-700 text-slate-200'
                  }`}
              >
                <option value="All">All Allocations</option>
                <option value="Billable">Client Billable</option>
                <option value="Non-Billable">Internal Overhead</option>
              </select>

              {/* Table / Cards Toggle */}
              <div
                className={`flex items-center p-0.5 rounded-xl border ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-800 border-slate-700'
                  }`}
              >
                <button
                  onClick={() => setLayoutMode('table')}
                  className={`p-1.5 rounded-lg transition-colors ${layoutMode === 'table'
                      ? 'bg-white dark:bg-slate-700 shadow-xs text-sky-600 dark:text-sky-400'
                      : 'text-slate-400'
                    }`}
                  title="Table View"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setLayoutMode('cards')}
                  className={`p-1.5 rounded-lg transition-colors ${layoutMode === 'cards'
                      ? 'bg-white dark:bg-slate-700 shadow-xs text-sky-600 dark:text-sky-400'
                      : 'text-slate-400'
                    }`}
                  title="Cards View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Table View */}
          {layoutMode === 'table' ? (
            <div className={`rounded-2xl border overflow-hidden ${cardBg}`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr
                      className={`border-b text-[10px] font-bold uppercase tracking-wider text-slate-400 ${isLight ? 'bg-slate-50/75 border-slate-100' : 'bg-slate-900/60 border-slate-800'
                        }`}
                    >
                      <th className="py-3 px-4">Expense Details</th>
                      <th className="py-3 px-3">Vendor / Payee</th>
                      <th className="py-3 px-3">Category</th>
                      <th className="py-3 px-3">Department</th>
                      <th className="py-3 px-3">Amount</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">Date</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {filteredExpenses.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                          No expenses matching the selected criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredExpenses.map((expense) => (
                        <tr
                          key={expense.id}
                          onClick={() => {
                            setSelectedExpense(expense);
                            setIsDetailsDrawerOpen(true);
                          }}
                          className={`cursor-pointer transition-colors ${isLight ? 'hover:bg-sky-50/30' : 'hover:bg-slate-800/40'
                            }`}
                        >
                          <td className="py-3 px-4">
                            <span className="text-[10px] font-mono text-slate-400 block">
                              {expense.expenseNumber}
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white block max-w-xs truncate">
                              {expense.title}
                            </span>
                            {expense.project && (
                              <span className="text-[10px] text-sky-600 dark:text-sky-400 font-medium">
                                Proj: {expense.project}
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-3 font-semibold text-slate-700 dark:text-slate-300">
                            {expense.vendor}
                          </td>

                          <td className="py-3 px-3">
                            <span className="inline-block px-2 py-0.5 text-[10.5px] font-semibold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {expense.category}
                            </span>
                          </td>

                          <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                            {expense.department}
                          </td>

                          <td className="py-3 px-3">
                            <span className="font-bold text-slate-900 dark:text-white block">
                              {formatMoney(expense.amountFormatted, currency)}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              {expense.paymentMethod}
                            </span>
                          </td>

                          <td className="py-3 px-3">
                            {expense.status === 'Paid' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                <CheckCircle2 className="w-3 h-3" />
                                Paid
                              </span>
                            )}
                            {expense.status === 'Approved' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                                <ShieldCheck className="w-3 h-3" />
                                Approved
                              </span>
                            )}
                            {expense.status === 'Pending Approval' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                <Clock className="w-3 h-3" />
                                Pending
                              </span>
                            )}
                            {expense.status === 'Scheduled' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                                <Calendar className="w-3 h-3" />
                                Scheduled
                              </span>
                            )}
                            {expense.status === 'Rejected' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                <AlertCircle className="w-3 h-3" />
                                Rejected
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-3 font-medium text-slate-600 dark:text-slate-400">
                            {expense.date}
                          </td>

                          <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              {expense.status === 'Pending Approval' && (
                                <button
                                  onClick={() => handleUpdateStatus(expense.id, 'Approved')}
                                  className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white shadow-xs"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Approve</span>
                                </button>
                              )}

                              {expense.status === 'Approved' && (
                                <button
                                  onClick={() => handleUpdateStatus(expense.id, 'Paid')}
                                  className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white shadow-xs"
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Mark Paid</span>
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  setEditingExpense(expense);
                                  setIsRecordModalOpen(true);
                                }}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                                title="Edit"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleDeleteExpense(expense.id)}
                                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Cards View */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredExpenses.map((expense) => (
                <div
                  key={expense.id}
                  onClick={() => {
                    setSelectedExpense(expense);
                    setIsDetailsDrawerOpen(true);
                  }}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all hover:shadow-md ${cardBg}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono text-sky-600 dark:text-sky-400 font-bold">
                      {expense.expenseNumber}
                    </span>
                    {expense.status === 'Paid' ? (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                        Paid
                      </span>
                    ) : expense.status === 'Approved' ? (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400">
                        Approved
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
                        Pending
                      </span>
                    )}
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1 mb-1">
                    {expense.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                    {expense.vendor} • {expense.category}
                  </p>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between mb-3">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Total Disbursed</span>
                      <span className="text-sm font-black text-slate-900 dark:text-white">
                        {formatMoney(expense.amountFormatted, currency)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Date</span>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {expense.date}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800/80">
                    <span className="text-[10px] text-slate-400">
                      {expense.isBillableToClient ? (
                        <span className="text-emerald-600 font-semibold">Billable Client</span>
                      ) : (
                        <span>Internal OPEX</span>
                      )}
                    </span>
                    <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400 flex items-center gap-0.5">
                      Details <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CATEGORY ANALYTICS & BURN RATE */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Category Spend Distribution */}
          <div className={`p-5 rounded-2xl border lg:col-span-2 space-y-4 ${cardBg}`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Category Spend Breakdown
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Total operating expenditure allocated across business functions
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-sky-600 dark:text-sky-400">
                100% Calculated
              </span>
            </div>

            <div className="space-y-3.5">
              {categoryStats.map((cat) => (
                <div key={cat.category} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {cat.category} ({cat.count})
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-500">{cat.percentage}%</span>
                      <span className="font-black text-slate-900 dark:text-white">
                        {currency.symbol}{cat.total.toLocaleString('en-US')}
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(5, cat.percentage))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Department Distribution & Billable Ratio */}
          <div className="space-y-4">
            <div className={`p-5 rounded-2xl border space-y-3 ${cardBg}`}>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Departmental Allocation
              </h3>
              <div className="space-y-2.5 text-xs">
                {departmentStats.map((dept) => (
                  <div
                    key={dept.department}
                    className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">
                        {dept.department}
                      </span>
                      <span className="text-[10px] text-slate-400">{dept.percentage}% of total</span>
                    </div>
                    <span className="font-black text-slate-900 dark:text-white">
                      {currency.symbol}{dept.total.toLocaleString('en-US')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Billable Ratio Card */}
            <div className={`p-5 rounded-2xl border space-y-3 ${cardBg}`}>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Billable vs Internal OPEX
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Client-Recoverable:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {currency.symbol}{billableTotal.toLocaleString('en-US')} (
                    {totalBurn > 0 ? Math.round((billableTotal / totalBurn) * 100) : 0}%)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Internal Company OPEX:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {currency.symbol}{(totalBurn - billableTotal).toLocaleString('en-US')} (
                    {totalBurn > 0 ? 100 - Math.round((billableTotal / totalBurn) * 100) : 0}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: VENDORS & SUBSCRIPTIONS */}
      {activeTab === 'vendors' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {INITIAL_EXPENSE_VENDORS.map((v) => (
              <div key={v.vendor} className={`p-4 rounded-2xl border space-y-3 ${cardBg}`}>
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
                    <Building className="w-4 h-4" />
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    Active
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">{v.vendor}</h4>
                  <span className="text-[11px] text-slate-400 font-medium">{v.category}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Monthly Burn:</span>
                    <span className="font-black text-slate-900 dark:text-white">
                      {currency.symbol}{v.monthlyCost.toLocaleString('en-US')}/mo
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Renewal Cadence:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {v.renewalCadence}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">2025 YTD Total:</span>
                    <span className="font-bold text-sky-600 dark:text-sky-400">
                      {currency.symbol}{v.totalYtd.toLocaleString('en-US')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-[11px] text-slate-400">{v.paymentMethod}</span>
                  <button
                    onClick={() => {
                      setSelectedCategory('All');
                      setSelectedStatus('All');
                      setSearchTerm(v.vendor);
                      setActiveTab('ledger');
                    }}
                    className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline"
                  >
                    View Invoices →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: BUDGETS & COST CONTROL */}
      {activeTab === 'budgets' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {INITIAL_EXPENSE_BUDGETS.map((b) => {
              const utilPercent = Math.round((b.actualSpend / b.monthlyBudget) * 100);
              const isOver = utilPercent > 90;
              const isWarning = utilPercent >= 80 && utilPercent <= 90;

              return (
                <div key={b.category} className={`p-5 rounded-2xl border space-y-4 ${cardBg}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        {b.category}
                      </h4>
                      <span className="text-[11px] text-slate-400">{b.department}</span>
                    </div>

                    <span
                      className={`px-2.5 py-1 text-xs font-bold rounded-full ${isOver
                          ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                          : isWarning
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                            : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        }`}
                    >
                      {utilPercent}% Utilized
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-500">
                        Spent: {currency.symbol}{b.actualSpend.toLocaleString('en-US')}
                      </span>
                      <span className="text-slate-800 dark:text-slate-200">
                        Budget: {currency.symbol}{b.monthlyBudget.toLocaleString('en-US')}
                      </span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${isOver ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                        style={{ width: `${Math.min(100, utilPercent)}%` }}
                      />
                    </div>
                  </div>

                  {b.targetSavingsOpportunity && (
                    <div className="p-3 rounded-xl bg-sky-50/50 dark:bg-slate-900/60 border border-sky-100 dark:border-slate-800 flex items-start gap-2 text-xs">
                      <Sparkles className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-sky-700 dark:text-sky-300 block mb-0.5">
                          Cost Optimization Insight
                        </span>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                          {b.targetSavingsOpportunity}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Record / Edit Expense Modal */}
      <RecordExpenseModal
        isOpen={isRecordModalOpen}
        onClose={() => {
          setIsRecordModalOpen(false);
          setEditingExpense(null);
        }}
        onSave={handleSaveExpense}
        initialData={editingExpense}
      />

      {/* Expense Details Drawer */}
      <ExpenseDetailsDrawer
        isOpen={isDetailsDrawerOpen}
        onClose={() => {
          setIsDetailsDrawerOpen(false);
          setSelectedExpense(null);
        }}
        expense={selectedExpense}
        onEdit={(exp) => {
          setIsDetailsDrawerOpen(false);
          setEditingExpense(exp);
          setIsRecordModalOpen(true);
        }}
        onDelete={handleDeleteExpense}
        onUpdateStatus={handleUpdateStatus}
      />
    </div>
  );
};

