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
  List,
  LayoutGrid,
  TrendingUp,
  DollarSign,
  ArrowDownLeft,
  ArrowUpRight,
  RotateCcw,
  RefreshCw,
  Edit3,
  Trash2,
  ChevronRight,
  ExternalLink,
  Wallet,
  Activity,
  Check,
  Send,
  Zap,
  Settings,
  X,
  ShieldAlert,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import {
  INITIAL_PAYMENTS,
  INITIAL_PAYMENT_GATEWAYS,
  INITIAL_BANK_PAYOUTS,
  INITIAL_PAYMENT_DISPUTES,
} from '../../data/mockData';
import {
  PaymentTransaction,
  PaymentGateway,
  BankPayout,
  PaymentDispute,
  PaymentType,
  PaymentStatus,
  PaymentMethodType,
  PaymentGatewayKey,
} from '../../types/crm';
import { RecordPaymentModal } from './RecordPaymentModal';
import { PaymentDetailsDrawer } from './PaymentDetailsDrawer';
import { IssueRefundModal } from './IssueRefundModal';
import { InitiatePayoutModal } from './InitiatePayoutModal';
import { ConfigureGatewayModal } from './ConfigureGatewayModal';
import { DisputeEvidenceModal } from './DisputeEvidenceModal';
import { useSystemCurrency, formatMoney } from '../../data/currencyService';

const LOCAL_STORAGE_PAYMENTS = 'ozostack_payments';
const LOCAL_STORAGE_GATEWAYS = 'ozostack_payment_gateways';
const LOCAL_STORAGE_PAYOUTS = 'ozostack_bank_payouts';
const LOCAL_STORAGE_DISPUTES = 'ozostack_payment_disputes';

type HorizontalTab = 'ledger' | 'gateways' | 'payouts' | 'disputes';
type TimePeriod = 'This Month' | 'This Quarter' | 'YTD 2025' | 'All Time';

export const PaymentsView: React.FC = () => {
  const { theme, setActiveNav } = useTheme();
  const isLight = theme === 'white-sky';
  const currency = useSystemCurrency();

  // Persistence for Payments
  const [payments, setPayments] = useState<PaymentTransaction[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_PAYMENTS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse stored payments', e);
    }
    return INITIAL_PAYMENTS;
  });

  // Persistence for Gateways
  const [gateways, setGateways] = useState<PaymentGateway[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_GATEWAYS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse stored gateways', e);
    }
    return INITIAL_PAYMENT_GATEWAYS;
  });

  // Persistence for Payouts
  const [payouts, setPayouts] = useState<BankPayout[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_PAYOUTS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse stored payouts', e);
    }
    return INITIAL_BANK_PAYOUTS;
  });

  // Persistence for Disputes
  const [disputes, setDisputes] = useState<PaymentDispute[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_DISPUTES);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse stored disputes', e);
    }
    return INITIAL_PAYMENT_DISPUTES;
  });

  const [activeTab, setActiveTab] = useState<HorizontalTab>('ledger');
  const [layoutMode, setLayoutMode] = useState<'table' | 'cards'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedGateway, setSelectedGateway] = useState<string>('All');
  const [selectedMethod, setSelectedMethod] = useState<string>('All');
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('This Month');

  // Modals & Drawer State
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentTransaction | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentTransaction | null>(null);
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [refundTargetPayment, setRefundTargetPayment] = useState<PaymentTransaction | null>(null);

  // New Modals State
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [isConfigGatewayModalOpen, setIsConfigGatewayModalOpen] = useState(false);
  const [selectedGatewayForConfig, setSelectedGatewayForConfig] = useState<PaymentGateway | null>(null);
  const [isDisputeEvidenceModalOpen, setIsDisputeEvidenceModalOpen] = useState(false);
  const [selectedDisputeForEvidence, setSelectedDisputeForEvidence] = useState<PaymentDispute | null>(null);

  // Instant Feedback Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_PAYMENTS, JSON.stringify(payments));
    } catch (e) {
      console.error('Failed to save payments to localStorage', e);
    }
  }, [payments]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_GATEWAYS, JSON.stringify(gateways));
    } catch (e) {
      console.error('Failed to save gateways to localStorage', e);
    }
  }, [gateways]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_PAYOUTS, JSON.stringify(payouts));
    } catch (e) {
      console.error('Failed to save payouts to localStorage', e);
    }
  }, [payouts]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_DISPUTES, JSON.stringify(disputes));
    } catch (e) {
      console.error('Failed to save disputes to localStorage', e);
    }
  }, [disputes]);

  // Save (Create or Edit)
  const handleSavePayment = (payment: PaymentTransaction) => {
    setPayments((prev) => {
      const exists = prev.some((it) => it.id === payment.id);
      return exists
        ? prev.map((it) => (it.id === payment.id ? payment : it))
        : [payment, ...prev];
    });

    if (selectedPayment && selectedPayment.id === payment.id) {
      setSelectedPayment(payment);
    }
    showToast(`Payment ${payment.paymentNumber} saved successfully`);
  };

  // Status update
  const handleUpdateStatus = (id: string, newStatus: PaymentStatus) => {
    setPayments((prev) =>
      prev.map((it) =>
        it.id === id
          ? {
              ...it,
              status: newStatus,
              settledDate: newStatus === 'Succeeded' ? new Date().toISOString().split('T')[0] : it.settledDate,
            }
          : it
      )
    );

    if (selectedPayment && selectedPayment.id === id) {
      setSelectedPayment((prev) =>
        prev
          ? {
              ...prev,
              status: newStatus,
              settledDate: newStatus === 'Succeeded' ? new Date().toISOString().split('T')[0] : prev.settledDate,
            }
          : null
      );
    }
    showToast(`Payment marked as ${newStatus}`);
  };

  // Delete
  const handleDeletePayment = (id: string) => {
    setPayments((prev) => prev.filter((it) => it.id !== id));
    setIsDetailsDrawerOpen(false);
    setSelectedPayment(null);
    showToast('Payment record removed');
  };

  // Refund handler
  const handleProcessRefund = (paymentId: string, refundAmount: number, reason: string) => {
    setPayments((prev) =>
      prev.map((it) => {
        if (it.id === paymentId) {
          return {
            ...it,
            status: 'Refunded',
            refundReason: reason,
            refundAmount,
            netAmount: it.netAmount - refundAmount,
          };
        }
        return it;
      })
    );

    if (selectedPayment && selectedPayment.id === paymentId) {
      setSelectedPayment((prev) =>
        prev
          ? {
              ...prev,
              status: 'Refunded',
              refundReason: reason,
              refundAmount,
            }
          : null
      );
    }
    showToast(`Refund of ${currency.symbol}${refundAmount.toLocaleString()} processed successfully`);
  };

  // Date period checker with support for current calendar and demo data
  const isDateInPeriod = (dateStr: string, period: TimePeriod): boolean => {
    if (period === 'All Time') return true;
    const currentMonth = new Date().toISOString().slice(0, 7);
    const currentYear = new Date().getFullYear().toString();
    if (period === 'This Month') return dateStr.startsWith('2025-05') || dateStr.startsWith(currentMonth);
    if (period === 'This Quarter') return (dateStr >= '2025-04-01' && dateStr <= '2025-06-30') || dateStr.startsWith(currentMonth);
    if (period === 'YTD 2025') return dateStr.startsWith('2025') || dateStr.startsWith(currentYear);
    return true;
  };

  // Check if any filters are active
  const hasActiveFilters =
    selectedType !== 'All' ||
    selectedStatus !== 'All' ||
    selectedGateway !== 'All' ||
    selectedMethod !== 'All' ||
    searchTerm.trim().length > 0;

  const handleResetFilters = () => {
    setSelectedType('All');
    setSelectedStatus('All');
    setSelectedGateway('All');
    setSelectedMethod('All');
    setSearchTerm('');
  };

  // Filtered payments
  const filteredPayments = useMemo(() => {
    return payments.filter((it) => {
      // Period
      if (!isDateInPeriod(it.date, selectedPeriod)) return false;

      // Type
      if (selectedType !== 'All' && it.type !== selectedType) return false;

      // Status
      if (selectedStatus !== 'All' && it.status !== selectedStatus) return false;

      // Gateway
      if (selectedGateway !== 'All' && it.gateway !== selectedGateway) return false;

      // Method
      if (selectedMethod !== 'All' && it.paymentMethod !== selectedMethod) return false;

      // Search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const mClient = it.client.toLowerCase().includes(q);
        const mRef = it.transactionReference.toLowerCase().includes(q);
        const mNum = it.paymentNumber.toLowerCase().includes(q);
        const mInv = it.invoiceNumber?.toLowerCase().includes(q);
        const mNotes = it.notes?.toLowerCase().includes(q);
        return mClient || mRef || mNum || mInv || mNotes;
      }

      return true;
    });
  }, [
    payments,
    selectedPeriod,
    selectedType,
    selectedStatus,
    selectedGateway,
    selectedMethod,
    searchTerm,
  ]);

  // Overall KPI metrics
  const totalVolume = filteredPayments.reduce((acc, it) => acc + it.amount, 0);

  const succeededInflows = filteredPayments.filter(
    (it) => it.type === 'Inflow / Collection' && it.status === 'Succeeded'
  );
  const succeededTotal = succeededInflows.reduce((acc, it) => acc + it.amount, 0);

  const pendingSettlements = filteredPayments.filter(
    (it) => it.status === 'Processing' || it.status === 'Requires Action'
  );
  const pendingTotal = pendingSettlements.reduce((acc, it) => acc + it.amount, 0);

  const totalFees = filteredPayments.reduce((acc, it) => acc + it.feeAmount, 0);
  const effectiveFeeRate = totalVolume > 0 ? ((totalFees / totalVolume) * 100).toFixed(2) : '0.00';

  // Trigger simulated webhook ping
  const handlePingWebhook = (gwId: string) => {
    setGateways((prev) =>
      prev.map((g) =>
        g.id === gwId ? { ...g, lastWebhookPing: 'Just now (200 OK)', webhookStatus: 'Healthy' } : g
      )
    );
    showToast('Webhook endpoint verified (Status: 200 OK)');
  };

  // Toggle live/test mode
  const handleToggleEnvironment = (gwId: string) => {
    setGateways((prev) =>
      prev.map((g) =>
        g.id === gwId ? { ...g, environment: g.environment === 'Live' ? 'Test' : 'Live' } : g
      )
    );
    showToast('Gateway environment updated');
  };

  // Save updated gateway config
  const handleSaveGatewayConfig = (updated: PaymentGateway) => {
    setGateways((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
    showToast(`${updated.name} configuration updated successfully`);
  };

  // Custom Payout trigger
  const handleSavePayout = (newPayout: BankPayout) => {
    setPayouts((prev) => [newPayout, ...prev]);
    showToast(`Treasury sweep of ${currency.symbol}${newPayout.grossAmount.toLocaleString()} initiated`);
  };

  // Submit dispute evidence
  const handleSubmitDisputeEvidence = (disputeId: string, notes: string) => {
    setDisputes((prev) =>
      prev.map((d) => (d.id === disputeId ? { ...d, status: 'Won / Closed' } : d))
    );
    showToast('Counter-evidence delivered to payment network. Case closed in merchant favor!');
  };

  // Export CSV
  const handleExportCsv = () => {
    const headers = [
      'Payment #',
      'Transaction Ref',
      'Type',
      'Client',
      'Invoice #',
      'Amount ($)',
      'Gateway Fee ($)',
      'Net Settled ($)',
      'Currency',
      'Status',
      'Gateway',
      'Method',
      'Date',
      'Settled Date',
      'Receipt #',
      'Notes',
    ];

    const rows = filteredPayments.map((it) => [
      it.paymentNumber,
      `"${it.transactionReference}"`,
      `"${it.type}"`,
      `"${it.client.replace(/"/g, '""')}"`,
      it.invoiceNumber || '',
      it.amount.toFixed(2),
      it.feeAmount.toFixed(2),
      it.netAmount.toFixed(2),
      it.currency,
      it.status,
      it.gateway,
      it.paymentMethod,
      it.date,
      it.settledDate || '',
      it.receiptNumber || '',
      `"${(it.notes || '').replace(/"/g, '""')}"`,
    ]);

    rows.push([
      'TOTAL',
      '',
      '',
      '',
      '',
      totalVolume.toFixed(2),
      totalFees.toFixed(2),
      (totalVolume - totalFees).toFixed(2),
      'USD',
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
    link.setAttribute('download', `Ozostack_Payments_${selectedPeriod.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const cardBg = isLight
    ? 'bg-white border-sky-100/90 shadow-xs'
    : 'bg-[#0f172a]/90 border-slate-800/80';

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white border border-slate-700 shadow-2xl text-xs font-semibold animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

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
                Payments & Treasury Clearing Hub
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-sky-500 text-white uppercase tracking-wider">
                Clearing House
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Gateway settlement orchestration, Fedwire receipts, bank sweeps, and dispute defense
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={handleExportCsv}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors ${
              isLight
                ? 'border-slate-200 text-slate-700 bg-white hover:bg-slate-50'
                : 'border-slate-700 text-slate-200 bg-slate-800 hover:bg-slate-750'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => {
              setEditingPayment(null);
              setIsRecordModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-sky-500 hover:bg-sky-600 text-white shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* 4 Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1: Gross Processed Volume */}
        <div className={`p-4 rounded-2xl border ${cardBg}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Gross Volume (GPV)
            </span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {currency.symbol}{totalVolume.toLocaleString('en-US')}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>▲ 18.4% vs last month</span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {filteredPayments.length} clearing batches in {selectedPeriod}
          </span>
        </div>

        {/* Metric 2: Succeeded Inflows */}
        <div className={`p-4 rounded-2xl border ${cardBg}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Settled Collections
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {currency.symbol}{succeededTotal.toLocaleString('en-US')}
          </div>
          <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
            98.2% settlement success rate
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            100% credited to corporate treasury
          </span>
        </div>

        {/* Metric 3: Pending Settlements */}
        <div className={`p-4 rounded-2xl border ${cardBg}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              In Transit & Clearing
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {currency.symbol}{pendingTotal.toLocaleString('en-US')}
          </div>
          <div className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 mt-1">
            {pendingSettlements.length} wires & ACH clearing
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            Expected in account within 24-48h
          </span>
        </div>

        {/* Metric 4: Net Processing Fees */}
        <div className={`p-4 rounded-2xl border ${cardBg}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Gateway Fees
            </span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {currency.symbol}{totalFees.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 mt-1">
            {effectiveFeeRate}% effective blended rate
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            Across Fedwire, SVB ACH & Stripe
          </span>
        </div>
      </div>

      {/* Horizontal Navigation Tabs */}
      <div className={`p-1.5 rounded-2xl border flex items-center justify-between gap-2 overflow-x-auto ${cardBg}`}>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('ledger')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'ledger'
                ? 'bg-sky-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <List className="w-4 h-4" />
            <span>Ledger & Transactions ({filteredPayments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('gateways')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'gateways'
                ? 'bg-sky-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Gateways & Rails ({gateways.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('payouts')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'payouts'
                ? 'bg-sky-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Bank Payouts & Sweeps ({payouts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('disputes')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'disputes'
                ? 'bg-sky-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Refunds & Disputes ({disputes.length})</span>
          </button>
        </div>

        {/* Period Filter Pills */}
        <div className="flex items-center gap-1 shrink-0">
          {(['This Month', 'This Quarter', 'YTD 2025', 'All Time'] as TimePeriod[]).map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                selectedPeriod === period
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
          {/* Search & Filter Toolbar */}
          <div className={`p-3.5 rounded-2xl border flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 ${cardBg}`}>
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by client, payment #, ref, invoice #..."
                className={`w-full text-xs pl-9 pr-3 py-2 rounded-xl border outline-none ${
                  isLight
                    ? 'bg-sky-50/40 border-sky-200 text-slate-800 focus:border-sky-500'
                    : 'bg-slate-900 border-slate-700 text-white focus:border-sky-400'
                }`}
              />
            </div>

            {/* Dropdown Filters */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Type */}
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className={`px-2.5 py-2 rounded-xl border outline-none font-medium ${
                  isLight
                    ? 'bg-white border-slate-200 text-slate-700'
                    : 'bg-slate-800 border-slate-700 text-slate-200'
                }`}
              >
                <option value="All">All Types</option>
                <option value="Inflow / Collection">Inflows (Collections)</option>
                <option value="Outflow / Refund">Outflows (Refunds)</option>
                <option value="Payout / Settlement">Bank Sweeps & Payouts</option>
              </select>

              {/* Status */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className={`px-2.5 py-2 rounded-xl border outline-none font-medium ${
                  isLight
                    ? 'bg-white border-slate-200 text-slate-700'
                    : 'bg-slate-800 border-slate-700 text-slate-200'
                }`}
              >
                <option value="All">All Statuses</option>
                <option value="Succeeded">Succeeded</option>
                <option value="Processing">Processing</option>
                <option value="Requires Action">Requires Action</option>
                <option value="Refunded">Refunded</option>
                <option value="Disputed">Disputed</option>
              </select>

              {/* Gateway */}
              <select
                value={selectedGateway}
                onChange={(e) => setSelectedGateway(e.target.value)}
                className={`px-2.5 py-2 rounded-xl border outline-none font-medium ${
                  isLight
                    ? 'bg-white border-slate-200 text-slate-700'
                    : 'bg-slate-800 border-slate-700 text-slate-200'
                }`}
              >
                <option value="All">All Gateways</option>
                <option value="Stripe">Stripe Connect</option>
                <option value="Chase Commercial">Chase Fedwire</option>
                <option value="Silicon Valley Bank">SVB ACH</option>
                <option value="PayPal Business">PayPal</option>
                <option value="Coinbase Prime">Coinbase Prime</option>
              </select>

              {/* Method */}
              <select
                value={selectedMethod}
                onChange={(e) => setSelectedMethod(e.target.value)}
                className={`px-2.5 py-2 rounded-xl border outline-none font-medium ${
                  isLight
                    ? 'bg-white border-slate-200 text-slate-700'
                    : 'bg-slate-800 border-slate-700 text-slate-200'
                }`}
              >
                <option value="All">All Instruments</option>
                <option value="Wire / SWIFT">Wire / SWIFT</option>
                <option value="Credit Card">Credit Card</option>
                <option value="ACH Direct Debit">ACH Direct Debit</option>
                <option value="Stripe Connect">Stripe Connect</option>
                <option value="PayPal">PayPal</option>
                <option value="Crypto (USDC)">Crypto (USDC)</option>
              </select>

              {/* Reset Filters button */}
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="flex items-center gap-1 px-2.5 py-2 text-xs font-bold text-rose-500 hover:text-rose-600 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 rounded-xl transition-colors"
                  title="Clear all filters"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}

              {/* Table / Cards toggle */}
              <div
                className={`flex items-center p-0.5 rounded-xl border ${
                  isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-800 border-slate-700'
                }`}
              >
                <button
                  onClick={() => setLayoutMode('table')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    layoutMode === 'table'
                      ? 'bg-white dark:bg-slate-700 shadow-xs text-sky-600 dark:text-sky-400'
                      : 'text-slate-400'
                  }`}
                  title="Table View"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setLayoutMode('cards')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    layoutMode === 'cards'
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
                      className={`border-b text-[10px] font-bold uppercase tracking-wider text-slate-400 ${
                        isLight ? 'bg-slate-50/75 border-slate-100' : 'bg-slate-900/60 border-slate-800'
                      }`}
                    >
                      <th className="py-3 px-4">Payment & Reference</th>
                      <th className="py-3 px-3">Client / Payer</th>
                      <th className="py-3 px-3">Gateway & Method</th>
                      <th className="py-3 px-3">Gross Amount</th>
                      <th className="py-3 px-3">Fee / Net</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">Date</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {filteredPayments.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                          No payment transactions match the selected filters.
                        </td>
                      </tr>
                    ) : (
                      filteredPayments.map((p) => (
                        <tr
                          key={p.id}
                          onClick={() => {
                            setSelectedPayment(p);
                            setIsDetailsDrawerOpen(true);
                          }}
                          className={`cursor-pointer transition-colors ${
                            isLight ? 'hover:bg-sky-50/30' : 'hover:bg-slate-800/40'
                          }`}
                        >
                          <td className="py-3 px-4">
                            <span className="text-[10px] font-mono text-sky-600 dark:text-sky-400 font-bold block">
                              {p.paymentNumber}
                            </span>
                            <span className="text-[11px] font-mono text-slate-500 block truncate max-w-[140px]">
                              {p.transactionReference}
                            </span>
                            {p.invoiceNumber && (
                              <span className="text-[10px] text-slate-400 block">
                                Inv: #{p.invoiceNumber}
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-3">
                            <span className="font-bold text-slate-900 dark:text-white block">
                              {p.client}
                            </span>
                            {p.clientEmail && (
                              <span className="text-[10.5px] text-slate-400 block truncate max-w-[150px]">
                                {p.clientEmail}
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-3">
                            <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                              {p.gateway}
                            </span>
                            <span className="text-[10.5px] text-slate-400 block">
                              {p.paymentMethod}
                              {p.cardLast4 ? ` (••••${p.cardLast4})` : ''}
                            </span>
                          </td>

                          <td className="py-3 px-3">
                            <span
                              className={`font-black text-sm block ${
                                p.type === 'Outflow / Refund'
                                  ? 'text-rose-500'
                                  : 'text-slate-900 dark:text-white'
                              }`}
                            >
                              {p.type === 'Outflow / Refund' ? `-${formatMoney(p.amountFormatted, currency)}` : formatMoney(p.amountFormatted, currency)}
                            </span>
                            <span className="text-[10px] text-slate-400">{currency.code}</span>
                          </td>

                          <td className="py-3 px-3">
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400 block">
                              {currency.symbol}{p.netAmount.toLocaleString('en-US')}
                            </span>
                            <span className="text-[10px] text-slate-400">Fee: -{currency.symbol}{p.feeAmount}</span>
                          </td>

                          <td className="py-3 px-3">
                            {p.status === 'Succeeded' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                <CheckCircle2 className="w-3 h-3" />
                                Succeeded
                              </span>
                            )}
                            {p.status === 'Processing' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                                <Clock className="w-3 h-3" />
                                Processing
                              </span>
                            )}
                            {p.status === 'Requires Action' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                <AlertCircle className="w-3 h-3" />
                                3DS Action
                              </span>
                            )}
                            {p.status === 'Refunded' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                                <RotateCcw className="w-3 h-3" />
                                Refunded
                              </span>
                            )}
                            {p.status === 'Disputed' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                <AlertCircle className="w-3 h-3" />
                                Disputed
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-3 font-medium text-slate-600 dark:text-slate-400">
                            {p.date}
                          </td>

                          <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              {p.status !== 'Succeeded' && p.status !== 'Refunded' && (
                                <button
                                  onClick={() => handleUpdateStatus(p.id, 'Succeeded')}
                                  className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white shadow-xs"
                                  title="Mark Succeeded"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Settle</span>
                                </button>
                              )}

                              {p.status === 'Succeeded' && p.type === 'Inflow / Collection' && (
                                <button
                                  onClick={() => {
                                    setRefundTargetPayment(p);
                                    setIsRefundModalOpen(true);
                                  }}
                                  className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                                  title="Refund"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  setEditingPayment(p);
                                  setIsRecordModalOpen(true);
                                }}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                                title="Edit"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleDeletePayment(p.id)}
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
              {filteredPayments.map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    setSelectedPayment(p);
                    setIsDetailsDrawerOpen(true);
                  }}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all hover:shadow-md ${cardBg}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono text-sky-600 dark:text-sky-400 font-bold">
                      {p.paymentNumber}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        p.status === 'Succeeded'
                          ? 'bg-emerald-500/15 text-emerald-600'
                          : p.status === 'Processing'
                          ? 'bg-sky-500/15 text-sky-600'
                          : 'bg-amber-500/15 text-amber-600'
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate mb-0.5">
                    {p.client}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3 font-mono">
                    {p.gateway} • {p.paymentMethod}
                  </p>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between mb-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Gross Disbursed</span>
                      <span className="text-sm font-black text-slate-900 dark:text-white">
                        {formatMoney(p.amountFormatted, currency)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Net Credited</span>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        {currency.symbol}{p.netAmount.toLocaleString('en-US')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[10.5px] text-slate-400">{p.date}</span>
                    <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400 flex items-center gap-0.5">
                      Receipt Voucher <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: GATEWAYS & PAYMENT RAILS */}
      {activeTab === 'gateways' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {gateways.map((gw) => (
              <div key={gw.id} className={`p-5 rounded-2xl border space-y-4 ${cardBg}`}>
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleEnvironment(gw.id)}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase border transition-colors ${
                        gw.environment === 'Live'
                          ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-600 border-amber-500/30'
                      }`}
                    >
                      {gw.environment} Mode
                    </button>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-sky-500/15 text-sky-600">
                      {gw.status}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {gw.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                    Fee: {formatMoney(gw.feeStructure, currency)}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">24-Hour Volume:</span>
                    <span className="font-black text-slate-900 dark:text-white">
                      {currency.symbol}{gw.volume24h.toLocaleString('en-US')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">2025 YTD Processed:</span>
                    <span className="font-bold text-sky-600 dark:text-sky-400">
                      {currency.symbol}{gw.totalProcessedYtd.toLocaleString('en-US')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400">Webhook Status:</span>
                    <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      {gw.webhookStatus} ({gw.lastWebhookPing})
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => {
                      setSelectedGatewayForConfig(gw);
                      setIsConfigGatewayModalOpen(true);
                    }}
                    className="flex items-center gap-1 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Configure Rail</span>
                  </button>

                  <button
                    onClick={() => handlePingWebhook(gw.id)}
                    className="flex items-center gap-1 text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Ping Endpoint</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: BANK PAYOUTS & TREASURY SWEEPS */}
      {activeTab === 'payouts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-2xl border bg-gradient-to-r from-sky-500/10 via-sky-400/5 to-transparent border-sky-200/60 dark:border-sky-500/20">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Treasury Payout Sweeps & Bank Batches
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Scheduled automated disbursements into corporate commercial depository accounts
              </p>
            </div>
            <button
              onClick={() => setIsPayoutModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-sky-500 hover:bg-sky-600 text-white shadow-xs transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Initiate Bank Sweep</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {payouts.map((po) => (
              <div key={po.id} className={`p-5 rounded-2xl border space-y-3 ${cardBg}`}>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-sky-600 dark:text-sky-400">
                    {po.payoutNumber}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
                      po.status === 'Deposited'
                        ? 'bg-emerald-500/15 text-emerald-600'
                        : 'bg-amber-500/15 text-amber-600'
                    }`}
                  >
                    {po.status}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {po.destinationBank}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    Routing: {po.routingNumber} • {po.bankAccountName}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Gross Sweep:</span>
                    <span className="font-black text-slate-900 dark:text-white">
                      {currency.symbol}{po.grossAmount.toLocaleString('en-US')} {currency.code}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Batch Transactions:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {po.batchTransactionCount} settled orders
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Estimated Arrival:</span>
                    <span className="font-bold text-sky-600 dark:text-sky-400">
                      {po.estimatedArrival}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: REFUNDS & DISPUTES */}
      {activeTab === 'disputes' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {disputes.map((dp) => (
              <div key={dp.id} className={`p-5 rounded-2xl border space-y-3 ${cardBg}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-rose-500">
                    {dp.disputeNumber}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
                      dp.status === 'Won / Closed'
                        ? 'bg-emerald-500/15 text-emerald-600'
                        : 'bg-rose-500/15 text-rose-600'
                    }`}
                  >
                    {dp.status}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {dp.client}
                  </h4>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Ref: {dp.paymentNumber} • Reason: {dp.reason}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Dispute Amount:</span>
                    <span className="font-black text-rose-500">{formatMoney(dp.amountFormatted, currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Evidence Deadline:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {dp.evidenceDeadline}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Network Dispute Fee:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {currency.symbol}{dp.chargebackFee}
                    </span>
                  </div>
                </div>

                {dp.status !== 'Won / Closed' && (
                  <button
                    onClick={() => {
                      setSelectedDisputeForEvidence(dp);
                      setIsDisputeEvidenceModalOpen(true);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-xl bg-sky-500 hover:bg-sky-600 text-white shadow-xs transition-colors text-center"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Submit Counter-Evidence</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Record / Edit Payment Modal */}
      <RecordPaymentModal
        isOpen={isRecordModalOpen}
        onClose={() => {
          setIsRecordModalOpen(false);
          setEditingPayment(null);
        }}
        onSave={handleSavePayment}
        initialData={editingPayment}
      />

      {/* Payment Details Drawer */}
      <PaymentDetailsDrawer
        isOpen={isDetailsDrawerOpen}
        onClose={() => {
          setIsDetailsDrawerOpen(false);
          setSelectedPayment(null);
        }}
        payment={selectedPayment}
        onEdit={(p) => {
          setIsDetailsDrawerOpen(false);
          setEditingPayment(p);
          setIsRecordModalOpen(true);
        }}
        onDelete={handleDeletePayment}
        onUpdateStatus={handleUpdateStatus}
        onOpenRefund={(p) => {
          setRefundTargetPayment(p);
          setIsRefundModalOpen(true);
        }}
      />

      {/* Issue Refund Modal */}
      <IssueRefundModal
        isOpen={isRefundModalOpen}
        onClose={() => {
          setIsRefundModalOpen(false);
          setRefundTargetPayment(null);
        }}
        payment={refundTargetPayment}
        onRefund={handleProcessRefund}
      />

      {/* Initiate Treasury Payout Modal */}
      <InitiatePayoutModal
        isOpen={isPayoutModalOpen}
        onClose={() => setIsPayoutModalOpen(false)}
        onInitiate={handleSavePayout}
      />

      {/* Configure Gateway Modal */}
      <ConfigureGatewayModal
        isOpen={isConfigGatewayModalOpen}
        onClose={() => {
          setIsConfigGatewayModalOpen(false);
          setSelectedGatewayForConfig(null);
        }}
        gateway={selectedGatewayForConfig}
        onSave={handleSaveGatewayConfig}
      />

      {/* Dispute Evidence Modal */}
      <DisputeEvidenceModal
        isOpen={isDisputeEvidenceModalOpen}
        onClose={() => {
          setIsDisputeEvidenceModalOpen(false);
          setSelectedDisputeForEvidence(null);
        }}
        dispute={selectedDisputeForEvidence}
        onSubmitEvidence={handleSubmitDisputeEvidence}
      />
    </div>
  );
};

