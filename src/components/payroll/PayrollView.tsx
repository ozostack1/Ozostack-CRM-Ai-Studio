import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Banknote,
  DollarSign,
  CreditCard,
  Building2,
  Calendar,
  Clock,
  Search,
  Filter,
  Download,
  FileSpreadsheet,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  FileText,
  ShieldCheck,
  Eye,
  Sliders,
  Receipt,
  PauseCircle,
  PlayCircle,
  ChevronDown,
  ArrowRight,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { PermAction } from '../../context/authData';
import {
  INITIAL_PAYROLL_RECORDS,
  INITIAL_PAY_RUNS,
  INITIAL_REIMBURSEMENT_CLAIMS,
  STATUTORY_TAX_ITEMS,
  EmployeePayrollRecord,
  PayRunCycle,
  ReimbursementClaim,
  PayrollItemStatus,
} from './payrollMockData';
import { PaystubModal } from './PaystubModal';
import { RunPayrollModal } from './RunPayrollModal';
import { AdjustPayModal } from './AdjustPayModal';
import { AddReimbursementModal } from './AddReimbursementModal';
import { useSystemCurrency } from '../../data/currencyService';

type ActivePayrollTab = 'cycles' | 'roster' | 'taxes' | 'reimbursements';

const STORAGE_PAYROLL_RECORDS = 'ozostack_payroll_records_v1';
const STORAGE_PAY_RUNS = 'ozostack_pay_runs_v1';
const STORAGE_REIMBURSEMENTS = 'ozostack_reimbursements_v1';
const STORAGE_TEAM_MEMBERS = 'ozostack_team_members_v1';

const loadPayrollRecords = (): EmployeePayrollRecord[] => {
  try {
    const saved = localStorage.getItem(STORAGE_PAYROLL_RECORDS);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
    // If team members is explicitly empty, payroll roster should also be empty
    const teamRaw = localStorage.getItem(STORAGE_TEAM_MEMBERS);
    if (teamRaw !== null) {
      const parsedTeam = JSON.parse(teamRaw);
      if (Array.isArray(parsedTeam) && parsedTeam.length === 0) return [];
    }
  } catch {}
  return INITIAL_PAYROLL_RECORDS;
};

const loadPayRuns = (): PayRunCycle[] => {
  try {
    const saved = localStorage.getItem(STORAGE_PAY_RUNS);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return INITIAL_PAY_RUNS;
};

const loadClaims = (): ReimbursementClaim[] => {
  try {
    const saved = localStorage.getItem(STORAGE_REIMBURSEMENTS);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return INITIAL_REIMBURSEMENT_CLAIMS;
};

export const PayrollView: React.FC = () => {
  const { theme, setActiveNav } = useTheme();
  const isLight = theme === 'white-sky';
  const currency = useSystemCurrency();
  const { can, scopeFilter } = useAuth();
  const byEmployee = (r: { department: string; employeeId: string; name?: string }) => ({
    owner: r.name,
    department: r.department,
    employeeId: r.employeeId,
  });

  // Master States (reactive scoping for the signed-in user)
  const [activeTab, setActiveTab] = useState<ActivePayrollTab>('roster');
  const [allPayrollRecords, setPayrollRecords] = useState<EmployeePayrollRecord[]>(loadPayrollRecords);
  const [payRuns, setPayRuns] = useState<PayRunCycle[]>(loadPayRuns);
  const [allClaims, setClaims] = useState<ReimbursementClaim[]>(loadClaims);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const savePayrollRecords = useCallback((records: EmployeePayrollRecord[]) => {
    setPayrollRecords(records);
    try {
      localStorage.setItem(STORAGE_PAYROLL_RECORDS, JSON.stringify(records));
      window.dispatchEvent(new CustomEvent('ozostack-crm-config-changed'));
    } catch {}
  }, []);

  const savePayRuns = useCallback((runs: PayRunCycle[]) => {
    setPayRuns(runs);
    try {
      localStorage.setItem(STORAGE_PAY_RUNS, JSON.stringify(runs));
      window.dispatchEvent(new CustomEvent('ozostack-crm-config-changed'));
    } catch {}
  }, []);

  const saveClaims = useCallback((claimsList: ReimbursementClaim[]) => {
    setClaims(claimsList);
    try {
      localStorage.setItem(STORAGE_REIMBURSEMENTS, JSON.stringify(claimsList));
      window.dispatchEvent(new CustomEvent('ozostack-crm-config-changed'));
    } catch {}
  }, []);

  useEffect(() => {
    const sync = () => {
      setPayrollRecords(loadPayrollRecords());
      setPayRuns(loadPayRuns());
      setClaims(loadClaims());
    };
    window.addEventListener('storage', sync);
    window.addEventListener('ozostack-crm-config-changed', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('ozostack-crm-config-changed', sync);
    };
  }, []);

  const payrollRecords = useMemo(() => scopeFilter(allPayrollRecords, byEmployee), [allPayrollRecords, scopeFilter]);
  const claims = useMemo(() => scopeFilter(allClaims, byEmployee), [allClaims, scopeFilter]);

  // Roster Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  // Modals state
  const [selectedPaystubRecord, setSelectedPaystubRecord] = useState<EmployeePayrollRecord | null>(null);
  const [isPaystubModalOpen, setIsPaystubModalOpen] = useState(false);

  const [activeCycleForRun, setActiveCycleForRun] = useState<PayRunCycle | null>(null);
  const [isRunPayrollOpen, setIsRunPayrollOpen] = useState(false);

  const [recordToAdjust, setRecordToAdjust] = useState<EmployeePayrollRecord | null>(null);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);

  const [isAddClaimOpen, setIsAddClaimOpen] = useState(false);
  const [claimStatusFilter, setClaimStatusFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3800);
  };

  const allow = (action: PermAction) => {
    if (can('Payroll', action)) return true;
    showToast(`Access denied: your role lacks "${action}" permission for Payroll.`);
    return false;
  };

  // Distinct departments from records
  const departments = useMemo(() => {
    const set = new Set(payrollRecords.map((r) => r.department));
    return ['All', ...Array.from(set)];
  }, [payrollRecords]);

  // Aggregate Metrics
  const totalMonthlyGross = useMemo(() => {
    return payrollRecords.reduce((sum, r) => sum + r.totalGross, 0);
  }, [payrollRecords]);

  const totalMonthlyNet = useMemo(() => {
    return payrollRecords.reduce((sum, r) => sum + r.netPay, 0);
  }, [payrollRecords]);

  const totalMonthlyTaxes = useMemo(() => {
    return payrollRecords.reduce((sum, r) => sum + (r.federalTax + r.stateTax + r.ficaTax + r.medicareTax), 0);
  }, [payrollRecords]);

  const totalMonthlyBenefits = useMemo(() => {
    return payrollRecords.reduce((sum, r) => sum + (r.healthBenefit + r.retirement401k), 0);
  }, [payrollRecords]);

  // Filtered Roster
  const filteredRoster = useMemo(() => {
    return payrollRecords.filter((record) => {
      const matchesSearch =
        record.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.bankAccountLast4.includes(searchTerm);

      const matchesDept = selectedDept === 'All' || record.department === selectedDept;
      const matchesStatus = selectedStatus === 'All' || record.status === selectedStatus;

      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [payrollRecords, searchTerm, selectedDept, selectedStatus]);

  // Filtered Claims
  const filteredClaims = useMemo(() => {
    if (claimStatusFilter === 'All') return claims;
    return claims.filter((c) => c.status === claimStatusFilter);
  }, [claims, claimStatusFilter]);

  // Handlers
  const handleOpenPaystub = (record: EmployeePayrollRecord) => {
    setSelectedPaystubRecord(record);
    setIsPaystubModalOpen(true);
  };

  const handleOpenAdjust = (record: EmployeePayrollRecord) => {
    if (!allow('edit')) return;
    setRecordToAdjust(record);
    setIsAdjustModalOpen(true);
  };

  const handleSaveAdjust = (updated: EmployeePayrollRecord) => {
    if (!allow('edit')) return;
    const next = allPayrollRecords.map((r) => (r.id === updated.id ? updated : r));
    savePayrollRecords(next);
    showToast(`Updated payroll terms for ${updated.name}. Net pay recalculated: ${currency.symbol}${updated.netPay.toLocaleString()}`);
  };

  const handleToggleHold = (record: EmployeePayrollRecord) => {
    if (!allow('edit')) return;
    const nextStatus: PayrollItemStatus = record.status === 'On Hold' ? 'Pending' : 'On Hold';
    const updated: EmployeePayrollRecord = { ...record, status: nextStatus };
    const next = allPayrollRecords.map((r) => (r.id === updated.id ? updated : r));
    savePayrollRecords(next);
    showToast(
      nextStatus === 'On Hold'
        ? `Payment on hold for ${record.name}. Direct deposit locked.`
        : `Released hold on ${record.name}. Scheduled for disbursement.`
    );
  };

  const handleStartPayRun = (cycle: PayRunCycle) => {
    if (!allow('approve')) return;
    setActiveCycleForRun(cycle);
    setIsRunPayrollOpen(true);
  };

  const handleExecutePayRun = (cycleId: string, payDate: string, fundingAccount: string) => {
    if (!allow('approve')) return;
    const nextPayRuns = payRuns.map((c) =>
      c.id === cycleId
        ? {
            ...c,
            status: 'Paid' as const,
            payDate,
            fundingAccount,
          }
        : c
    );
    savePayRuns(nextPayRuns);
    // Mark all active pending records as Paid
    const nextRecords = allPayrollRecords.map((r) => (r.status === 'Pending' ? { ...r, status: 'Paid' as const, payDate } : r));
    savePayrollRecords(nextRecords);
    showToast(`Pay Run executed successfully! ${currency.symbol}${totalMonthlyNet.toLocaleString()} ACH batch transmitted.`);
  };

  const handleApproveClaim = (claim: ReimbursementClaim) => {
    if (!allow('approve')) return;
    const nextClaims = allClaims.map((c) => (c.id === claim.id ? { ...c, status: 'Approved' as const } : c));
    saveClaims(nextClaims);
    // Automatically credit to employee reimbursement in active payroll
    const nextRecords = allPayrollRecords.map((r) => {
      if (r.employeeId === claim.employeeId) {
        const newReimbursement = r.reimbursement + claim.amount;
        const newTotalGross = r.baseGross + r.bonus + newReimbursement + r.overtimePay;
        const newNet = newTotalGross - r.totalDeductions;
        return {
          ...r,
          reimbursement: newReimbursement,
          totalGross: newTotalGross,
          netPay: newNet,
        };
      }
      return r;
    });
    savePayrollRecords(nextRecords);
    showToast(`Approved claim "${claim.title}". Added ${currency.symbol}${claim.amount.toLocaleString()} to ${claim.employeeName}'s next paycheck.`);
  };

  const handleRejectClaim = (claimId: string, title: string) => {
    if (!allow('approve')) return;
    const nextClaims = allClaims.map((c) => (c.id === claimId ? { ...c, status: 'Rejected' as const } : c));
    saveClaims(nextClaims);
    showToast(`Rejected reimbursement claim "${title}".`);
  };

  const handleAddClaim = (newClaim: ReimbursementClaim) => {
    const next = [newClaim, ...allClaims];
    saveClaims(next);
    showToast(`Submitted expense claim for ${newClaim.employeeName} (${currency.symbol}${newClaim.amount.toFixed(2)}).`);
  };

  const handleDeleteRecord = (recordId: string, name: string) => {
    if (!allow('delete')) return;
    if (!window.confirm(`Are you sure you want to remove ${name} from the payroll roster?`)) return;
    const next = allPayrollRecords.filter((r) => r.id !== recordId);
    savePayrollRecords(next);
    showToast(`Deleted payroll record for ${name}.`);
  };

  const handleClearAllPayroll = () => {
    if (!allow('delete')) return;
    if (!window.confirm('Are you sure you want to delete all employee payroll records? This will clear the entire roster.')) return;
    savePayrollRecords([]);
    showToast('All employee payroll records deleted.');
  };

  const handleDeletePayRun = (cycleId: string, cycleName: string) => {
    if (!allow('delete')) return;
    if (!window.confirm(`Are you sure you want to delete pay cycle "${cycleName}"?`)) return;
    const next = payRuns.filter((c) => c.id !== cycleId);
    savePayRuns(next);
    showToast(`Deleted pay cycle "${cycleName}".`);
  };

  const handleDeleteClaim = (claimId: string, title: string) => {
    if (!allow('delete')) return;
    if (!window.confirm(`Are you sure you want to delete reimbursement claim "${title}"?`)) return;
    const next = allClaims.filter((c) => c.id !== claimId);
    saveClaims(next);
    showToast(`Deleted reimbursement claim "${title}".`);
  };

  const handleExportJournalCSV = () => {
    if (!allow('export')) return;
    const headers = 'Employee,Role,Department,Frequency,Base Gross,Bonus,Overtime,Deductions,Net Pay,Status,Payment Method\n';
    const rows = payrollRecords
      .map(
        (r) =>
          `"${r.name}","${r.role}","${r.department}","${r.payFrequency}",${r.baseGross},${r.bonus},${r.overtimePay},${r.totalDeductions},${r.netPay},"${r.status}","${r.paymentMethod}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Ozostack_Payroll_Journal_Nov2026.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported complete payroll journal as CSV.');
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-900 text-white shadow-2xl border border-sky-400/30 text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Sparkles className="w-4 h-4 text-sky-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
          isLight
            ? 'bg-white border-sky-100 shadow-xs'
            : 'bg-[#0f172a] border-slate-800 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-500">
            <Banknote className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Payroll & Compensation Management
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                FY 2026
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Automated wage disbursements, tax withholding compliance, employee paystubs & reimbursement workflows
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={handleExportJournalCSV}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
              isLight
                ? 'border-slate-200 text-slate-700 bg-white hover:bg-slate-50'
                : 'border-slate-700 text-slate-200 bg-slate-800/80 hover:bg-slate-800'
            }`}
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export Journal</span>
          </button>

          <button
            onClick={() => setIsAddClaimOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
              isLight
                ? 'border-sky-200 text-sky-700 bg-sky-50/60 hover:bg-sky-100/60'
                : 'border-sky-800/60 text-sky-300 bg-sky-950/30 hover:bg-sky-900/40'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Expense Claim</span>
          </button>

          <button
            onClick={() => payRuns.length > 0 && handleStartPayRun(payRuns[0])}
            disabled={payRuns.length === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all ${
              payRuns.length > 0
                ? 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 shadow-md shadow-sky-500/20 cursor-pointer'
                : 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed opacity-60'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Run Payroll Now</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Total Monthly Payroll */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            isLight ? 'bg-white border-sky-100/90 shadow-xs' : 'bg-[#0f172a] border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-medium text-slate-500 dark:text-slate-400">Total Monthly Gross</span>
            <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-500">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {currency.symbol}{totalMonthlyGross.toLocaleString()}
          </div>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-500 mt-1">
            <TrendingUp className="w-3 h-3" />
            <span>{payrollRecords.length > 0 ? '+3.8%' : '0.0%'}</span>
            <span className="font-normal text-slate-400 dark:text-slate-500">
              {payrollRecords.length > 0 ? 'vs Q3 avg' : 'No active records'}
            </span>
          </div>
        </div>

        {/* Net Take-Home */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            isLight ? 'bg-white border-sky-100/90 shadow-xs' : 'bg-[#0f172a] border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-medium text-slate-500 dark:text-slate-400">Net Take-Home (ACH)</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
            {currency.symbol}{totalMonthlyNet.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            {payrollRecords.length} direct deposits ready
          </p>
        </div>

        {/* Taxes Withheld */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            isLight ? 'bg-white border-sky-100/90 shadow-xs' : 'bg-[#0f172a] border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-medium text-slate-500 dark:text-slate-400">Statutory Tax Withholding</span>
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {currency.symbol}{totalMonthlyTaxes.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            {payrollRecords.length > 0 ? 'IRS EFTPS & State auto-filed' : 'No tax withholdings'}
          </p>
        </div>

        {/* Benefits & 401(k) */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            isLight ? 'bg-white border-sky-100/90 shadow-xs' : 'bg-[#0f172a] border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-medium text-slate-500 dark:text-slate-400">Benefits & 401(k)</span>
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {currency.symbol}{totalMonthlyBenefits.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            {payrollRecords.length > 0 ? 'Safe harbor match active' : 'No benefits active'}
          </p>
        </div>

        {/* Next Cycle Target */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            isLight
              ? 'bg-gradient-to-br from-sky-50 to-white border-sky-200 shadow-xs'
              : 'bg-gradient-to-br from-sky-950/20 to-slate-900 border-sky-800/50'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-medium text-sky-600 dark:text-sky-400">Upcoming Pay Date</span>
            <Calendar className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5">
            Nov 15, 2026
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            <Clock className="w-3 h-3 text-sky-500" />
            <span>10 Days remaining in cycle</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div
        className={`flex items-center gap-2 p-1.5 rounded-xl border overflow-x-auto ${
          isLight ? 'bg-slate-100/80 border-slate-200' : 'bg-slate-900/80 border-slate-800'
        }`}
      >
        <button
          onClick={() => setActiveTab('roster')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'roster'
              ? 'bg-sky-500 text-white shadow-xs'
              : isLight
              ? 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Employee Compensation Roster ({payrollRecords.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('cycles')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'cycles'
              ? 'bg-sky-500 text-white shadow-xs'
              : isLight
              ? 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Pay Runs & Cycles ({payRuns.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('taxes')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'taxes'
              ? 'bg-sky-500 text-white shadow-xs'
              : isLight
              ? 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Tax Compliance & Deductions (7)</span>
        </button>

        <button
          onClick={() => setActiveTab('reimbursements')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'reimbursements'
              ? 'bg-sky-500 text-white shadow-xs'
              : isLight
              ? 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Reimbursements & Claims ({claims.filter((c) => c.status === 'Pending').length} Pending)</span>
        </button>
      </div>

      {/* TAB 1: EMPLOYEE COMPENSATION ROSTER */}
      {activeTab === 'roster' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div
            className={`p-3.5 rounded-2xl border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 ${
              isLight ? 'bg-white border-sky-100 shadow-xs' : 'bg-[#0f172a] border-slate-800'
            }`}
          >
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by employee name, role, account..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full text-xs font-medium pl-9 pr-3 py-2 rounded-xl border focus:outline-hidden focus:ring-2 focus:ring-sky-500 ${
                  isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-800'
                    : 'bg-slate-800/80 border-slate-700 text-slate-100'
                }`}
              />
            </div>

            {/* Department & Status Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400">Dept:</span>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className={`text-xs font-medium px-2.5 py-2 rounded-xl border focus:outline-hidden ${
                    isLight
                      ? 'bg-white border-slate-200 text-slate-700'
                      : 'bg-slate-800 border-slate-700 text-slate-200'
                  }`}
                >
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400">Status:</span>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className={`text-xs font-medium px-2.5 py-2 rounded-xl border focus:outline-hidden ${
                    isLight
                      ? 'bg-white border-slate-200 text-slate-700'
                      : 'bg-slate-800 border-slate-700 text-slate-200'
                  }`}
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                  <option value="On Hold">On Hold</option>
                </select>
              </div>

              {payrollRecords.length > 0 && allow('delete') && (
                <button
                  onClick={handleClearAllPayroll}
                  title="Delete all payroll records from roster"
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                    isLight
                      ? 'border-rose-200 text-rose-600 bg-rose-50/60 hover:bg-rose-100/60'
                      : 'border-rose-800/60 text-rose-400 bg-rose-950/30 hover:bg-rose-900/40'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete All</span>
                </button>
              )}
            </div>
          </div>

          {/* Roster Table */}
          <div
            className={`rounded-2xl border overflow-hidden ${
              isLight ? 'bg-white border-sky-100 shadow-xs' : 'bg-[#0f172a] border-slate-800'
            }`}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr
                    className={`border-b ${
                      isLight ? 'bg-slate-50/70 border-slate-100 text-slate-500' : 'bg-slate-900/60 border-slate-800 text-slate-400'
                    }`}
                  >
                    <th className="py-3 px-4 font-bold uppercase tracking-wider text-[11px]">Employee</th>
                    <th className="py-3 px-3 font-bold uppercase tracking-wider text-[11px]">Pay Frequency</th>
                    <th className="py-3 px-3 font-bold uppercase tracking-wider text-[11px]">Base Salary</th>
                    <th className="py-3 px-3 font-bold uppercase tracking-wider text-[11px]">Incentives / OT</th>
                    <th className="py-3 px-3 font-bold uppercase tracking-wider text-[11px]">Total Deductions</th>
                    <th className="py-3 px-3 font-bold uppercase tracking-wider text-[11px]">Net Pay</th>
                    <th className="py-3 px-3 font-bold uppercase tracking-wider text-[11px]">Disbursement</th>
                    <th className="py-3 px-3 font-bold uppercase tracking-wider text-[11px]">Status</th>
                    <th className="py-3 px-4 font-bold uppercase tracking-wider text-[11px] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredRoster.map((record) => {
                    return (
                      <tr
                        key={record.id}
                        className={`transition-colors ${
                          isLight ? 'hover:bg-sky-50/30' : 'hover:bg-slate-800/40'
                        }`}
                      >
                        {/* Employee Avatar + Info */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={record.avatar}
                              alt={record.name}
                              className="w-9 h-9 rounded-full object-cover border border-sky-200 dark:border-slate-700"
                            />
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white leading-tight">
                                {record.name}
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                {record.role} • <span className="font-semibold text-sky-600 dark:text-sky-400">{record.department}</span>
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Frequency */}
                        <td className="py-3 px-3">
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {record.payFrequency}
                          </span>
                          <span className="block text-[11px] text-slate-400">{record.employmentType}</span>
                        </td>

                        {/* Base Salary */}
                        <td className="py-3 px-3 font-medium text-slate-800 dark:text-slate-200">
                          <div>{currency.symbol}{record.baseGross.toLocaleString()}</div>
                          <span className="text-[11px] text-slate-400">{currency.symbol}{(record.annualSalary / 1000).toFixed(0)}k/yr</span>
                        </td>

                        {/* Incentives */}
                        <td className="py-3 px-3">
                          {record.bonus > 0 || record.overtimePay > 0 || record.reimbursement > 0 ? (
                            <div className="space-y-0.5">
                              {record.bonus > 0 && (
                                <span className="inline-block text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                  +{currency.symbol}{record.bonus} Bonus
                                </span>
                              )}
                              {record.overtimePay > 0 && (
                                <span className="inline-block text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                                  +{currency.symbol}{record.overtimePay} OT
                                </span>
                              )}
                              {record.reimbursement > 0 && (
                                <span className="inline-block text-[11px] font-semibold text-sky-600 dark:text-sky-400">
                                  +{currency.symbol}{record.reimbursement} Exp
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs">—</span>
                          )}
                        </td>

                        {/* Deductions */}
                        <td className="py-3 px-3 font-medium text-rose-500">
                          -{currency.symbol}{record.totalDeductions.toLocaleString()}
                          <span className="block text-[11px] text-slate-400">
                            FIT, SIT, FICA, 401k
                          </span>
                        </td>

                        {/* Net Pay */}
                        <td className="py-3 px-3">
                          <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                            {currency.symbol}{record.netPay.toLocaleString()}
                          </span>
                        </td>

                        {/* Disbursement */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                            <CreditCard className="w-3.5 h-3.5 text-sky-500" />
                            <span className="font-mono text-[11px]">•••• {record.bankAccountLast4}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 block">{record.paymentMethod}</span>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3">
                          <span
                            onClick={() => handleToggleHold(record)}
                            title="Click to toggle hold status"
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold cursor-pointer border transition-transform hover:scale-105 ${
                              record.status === 'Paid'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                : record.status === 'On Hold'
                                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                                : 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20'
                            }`}
                          >
                            {record.status === 'Paid' && <CheckCircle2 className="w-3 h-3" />}
                            {record.status === 'On Hold' && <AlertCircle className="w-3 h-3" />}
                            {record.status === 'Pending' && <Clock className="w-3 h-3" />}
                            <span>{record.status}</span>
                          </span>
                        </td>

                        {/* Row Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenPaystub(record)}
                              title="View Official E-Paystub"
                              className={`p-1.5 rounded-lg border transition-colors ${
                                isLight
                                  ? 'border-sky-200 text-sky-600 hover:bg-sky-50'
                                  : 'border-sky-800 text-sky-400 hover:bg-sky-950/40'
                              }`}
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleOpenAdjust(record)}
                              title="Adjust Bonus, OT & Deductions"
                              className={`p-1.5 rounded-lg border transition-colors ${
                                isLight
                                  ? 'border-slate-200 text-slate-600 hover:bg-slate-100'
                                  : 'border-slate-700 text-slate-400 hover:bg-slate-800'
                              }`}
                            >
                              <Sliders className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleToggleHold(record)}
                              title={record.status === 'On Hold' ? 'Release Hold' : 'Hold Payment'}
                              className={`p-1.5 rounded-lg border transition-colors ${
                                record.status === 'On Hold'
                                  ? 'border-emerald-300 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                                  : 'border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                              }`}
                            >
                              {record.status === 'On Hold' ? (
                                <PlayCircle className="w-3.5 h-3.5" />
                              ) : (
                                <PauseCircle className="w-3.5 h-3.5" />
                              )}
                            </button>

                            {allow('delete') && (
                              <button
                                onClick={() => handleDeleteRecord(record.id, record.name)}
                                title={`Delete payroll record for ${record.name}`}
                                className={`p-1.5 rounded-lg border transition-colors ${
                                  isLight
                                    ? 'border-rose-200 text-rose-600 hover:bg-rose-50'
                                    : 'border-rose-800 text-rose-400 hover:bg-rose-950/40'
                                }`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredRoster.length === 0 && (
              <div className="py-12 text-center text-slate-400">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {allPayrollRecords.length === 0
                    ? 'No employee payroll records found.'
                    : 'No payroll records match your search criteria.'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {allPayrollRecords.length === 0
                    ? 'All employee payroll records have been removed or wiped.'
                    : 'Try resetting the department or status filter.'}
                </p>
                {allPayrollRecords.length === 0 && (
                  <button
                    onClick={() => savePayrollRecords(INITIAL_PAYROLL_RECORDS)}
                    className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-500 text-white hover:bg-sky-600 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Restore Default Roster</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PAY RUNS & CYCLES */}
      {activeTab === 'cycles' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3.5">
            {payRuns.map((cycle) => {
              const isScheduled = cycle.status === 'Scheduled';
              return (
                <div
                  key={cycle.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    isLight
                      ? 'bg-white border-sky-100 shadow-xs hover:border-sky-300'
                      : 'bg-[#0f172a] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          {cycle.cycleName}
                        </h3>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            cycle.status === 'Paid'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                              : cycle.status === 'Scheduled'
                              ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20'
                              : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                          }`}
                        >
                          {cycle.status === 'Paid' && <CheckCircle2 className="w-3 h-3" />}
                          {cycle.status === 'Scheduled' && <Clock className="w-3 h-3" />}
                          <span>{cycle.status}</span>
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Pay Period: {cycle.payPeriod}</span>
                        <span>•</span>
                        <span>Pay Date: {cycle.payDate}</span>
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Funding Source: {cycle.fundingAccount}
                      </p>
                    </div>

                    {/* Financial Figures Grid */}
                    <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                      <div>
                        <span className="text-[11px] text-slate-400 block">Total Gross</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                          {currency.symbol}{cycle.totalGross.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 block">Taxes Withheld</span>
                        <span className="font-semibold text-rose-500 text-sm">
                          -{currency.symbol}{cycle.totalTaxes.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 block">Net ACH Disbursed</span>
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-base">
                          {currency.symbol}{cycle.totalNet.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 block">Payees</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                          {cycle.employeeCount} active
                        </span>
                      </div>

                      {/* Action */}
                      <div className="flex items-center gap-2">
                        {isScheduled ? (
                          <button
                            onClick={() => handleStartPayRun(cycle)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-sky-500 hover:bg-sky-600 shadow-xs transition-colors"
                          >
                            <span>Process Pay Run</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              showToast(`Loaded historical settlement statement for ${cycle.cycleName}`);
                              setActiveTab('roster');
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                              isLight
                                ? 'border-slate-200 text-slate-700 hover:bg-slate-50'
                                : 'border-slate-700 text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400" />
                            <span>View Summary</span>
                          </button>
                        )}

                        {allow('delete') && (
                          <button
                            onClick={() => handleDeletePayRun(cycle.id, cycle.cycleName)}
                            title="Delete pay cycle"
                            className={`p-2 rounded-xl border transition-colors ${
                              isLight
                                ? 'border-rose-200 text-rose-600 hover:bg-rose-50'
                                : 'border-rose-800 text-rose-400 hover:bg-rose-950/40'
                            }`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {payRuns.length === 0 && (
              <div className="py-12 text-center text-slate-400">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No pay runs or cycles scheduled.</p>
                <p className="text-xs text-slate-500 mt-1">All cycles have been cleared or wiped.</p>
                <button
                  onClick={() => savePayRuns(INITIAL_PAY_RUNS)}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-500 text-white hover:bg-sky-600 shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Restore Default Pay Runs</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: TAX COMPLIANCE & DEDUCTIONS */}
      {activeTab === 'taxes' && (
        <div className="space-y-5">
          <div
            className={`p-5 rounded-2xl border ${
              isLight ? 'bg-white border-sky-100 shadow-xs' : 'bg-[#0f172a] border-slate-800'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Statutory Employer Taxes & Employee Withholding Schedule
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Real-time tax compliance ledger tracking federal (IRS) and state employment contributions
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="w-3.5 h-3.5" /> 100% Tax Compliant
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {STATUTORY_TAX_ITEMS.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border space-y-3 ${
                    isLight ? 'bg-slate-50/60 border-slate-200' : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                        {item.taxName}
                      </h4>
                      <p className="text-[11px] text-slate-400">{item.agency}</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400">
                      {item.type}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {item.rateDescription}
                  </p>

                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Total Remitted YTD</span>
                      <span className="font-extrabold text-slate-900 dark:text-white">
                        {currency.symbol}{item.totalRemittedYTD.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Next Filing Due</span>
                      <span className="font-semibold text-sky-600 dark:text-sky-400">
                        {item.nextFilingDueDate}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: REIMBURSEMENTS & CLAIMS */}
      {activeTab === 'reimbursements' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div
            className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${
              isLight ? 'bg-white border-sky-100 shadow-xs' : 'bg-[#0f172a] border-slate-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Filter Status:</span>
              {(['All', 'Pending', 'Approved', 'Rejected'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setClaimStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    claimStatusFilter === st
                      ? 'bg-sky-500 text-white'
                      : isLight
                      ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsAddClaimOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-sky-500 hover:bg-sky-600 shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Submit New Claim</span>
            </button>
          </div>

          {/* Claims Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredClaims.map((claim) => (
              <div
                key={claim.id}
                className={`p-5 rounded-2xl border space-y-3.5 transition-all ${
                  isLight ? 'bg-white border-sky-100 shadow-xs' : 'bg-[#0f172a] border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={claim.avatar}
                      alt={claim.employeeName}
                      className="w-10 h-10 rounded-full object-cover border border-sky-200 dark:border-slate-700"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {claim.employeeName}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {claim.department} • Ref: {claim.receiptId}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                        claim.status === 'Approved'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          : claim.status === 'Rejected'
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                      }`}
                    >
                      {claim.status}
                    </span>
                    {allow('delete') && (
                      <button
                        onClick={() => handleDeleteClaim(claim.id, claim.title)}
                        title="Delete reimbursement claim"
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    {claim.title}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {claim.notes}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-400 block">{claim.category}</span>
                    <span className="text-base font-extrabold text-sky-600 dark:text-sky-400">
                      {currency.symbol}{claim.amount.toFixed(2)}
                    </span>
                  </div>

                  {claim.status === 'Pending' ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRejectClaim(claim.id, claim.title)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border text-rose-600 dark:text-rose-400 transition-colors ${
                          isLight
                            ? 'border-rose-200 hover:bg-rose-50'
                            : 'border-rose-900/40 hover:bg-rose-950/40'
                        }`}
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleApproveClaim(claim)}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 shadow-xs transition-colors"
                      >
                        Approve & Credit
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 italic">
                      Processed on {claim.submissionDate}
                    </span>
                  )}
                </div>
              </div>
            ))}

            {filteredClaims.length === 0 && (
              <div className="py-12 text-center text-slate-400 col-span-1 md:col-span-2">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No reimbursement claims found.</p>
                <p className="text-xs text-slate-500 mt-1">
                  {allClaims.length === 0
                    ? 'All reimbursement claims have been cleared or wiped.'
                    : 'No claims match your status filter.'}
                </p>
                {allClaims.length === 0 && (
                  <button
                    onClick={() => saveClaims(INITIAL_REIMBURSEMENT_CLAIMS)}
                    className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-500 text-white hover:bg-sky-600 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Restore Default Claims</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Paystub Modal */}
      <PaystubModal
        isOpen={isPaystubModalOpen}
        record={selectedPaystubRecord}
        onClose={() => {
          setIsPaystubModalOpen(false);
          setSelectedPaystubRecord(null);
        }}
        onDownload={(name) => {
          showToast(`Generated official signed PDF paystub for ${name}.`);
        }}
      />

      {/* Run Payroll Execution Modal */}
      <RunPayrollModal
        isOpen={isRunPayrollOpen}
        cycle={activeCycleForRun}
        onClose={() => {
          setIsRunPayrollOpen(false);
          setActiveCycleForRun(null);
        }}
        onExecutePayRun={handleExecutePayRun}
      />

      {/* Adjust Compensation Modal */}
      <AdjustPayModal
        isOpen={isAdjustModalOpen}
        record={recordToAdjust}
        onClose={() => {
          setIsAdjustModalOpen(false);
          setRecordToAdjust(null);
        }}
        onSave={handleSaveAdjust}
      />

      {/* Add Reimbursement Modal */}
      <AddReimbursementModal
        isOpen={isAddClaimOpen}
        employees={payrollRecords}
        onClose={() => setIsAddClaimOpen(false)}
        onSubmit={handleAddClaim}
      />
    </div>
  );
};

