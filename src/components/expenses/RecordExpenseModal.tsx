import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Paperclip,
  CheckCircle2,
  DollarSign,
  Building,
  CreditCard,
  Tag,
  Briefcase,
  AlertCircle,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useSystemCurrency } from '../../data/currencyService';
import {
  ExpenseItem,
  ExpenseCategory,
  ExpenseStatus,
  ExpensePaymentMethod,
  ExpenseDepartment,
} from '../../types/crm';

interface RecordExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: ExpenseItem) => void;
  initialData?: ExpenseItem | null;
}

const CATEGORIES: ExpenseCategory[] = [
  'Cloud & Infrastructure',
  'AI & API Services',
  'Team & Payroll',
  'Software & SaaS',
  'Marketing & Growth',
  'Legal & Professional',
  'Office & Operations',
];

const DEPARTMENTS: ExpenseDepartment[] = [
  'Engineering & AI',
  'Product & Design',
  'Marketing & Sales',
  'Operations & Executive',
  'Customer Success',
];

const PAYMENT_METHODS: ExpensePaymentMethod[] = [
  'Corporate Card',
  'Wire Transfer',
  'ACH Direct Debit',
  'Stripe Auto-Debit',
  'PayPal',
];

const STATUS_OPTIONS: ExpenseStatus[] = [
  'Paid',
  'Pending Approval',
  'Approved',
  'Scheduled',
  'Rejected',
];

const COMMON_VENDORS = [
  'Amazon Web Services',
  'OpenAI Inc.',
  'Anthropic PBC',
  'Google Cloud',
  'Microsoft / Azure',
  'GitHub',
  'Figma Inc.',
  'Datadog Inc.',
  'WeWork Companies',
  'Deloitte LLP',
  'HubSpot Inc.',
  'Pinecone Systems',
  'Vercel Inc.',
  'Upwork Global',
  'Stripe Payments',
];

const PROJECT_OPTIONS = [
  { name: 'None / Internal OPEX', client: '' },
  { name: 'GPU Latency Inference Pipeline', client: 'CloudNest AI' },
  { name: 'Autonomous Route Dispatcher', client: 'FinEdge Systems' },
  { name: 'Maritime Corridor Tracking Portal', client: 'TechVision Inc.' },
  { name: 'Cloud Migration & Multi-Region', client: 'Gulf Cloud Services' },
  { name: 'Smart Facility Telemetry Gateway', client: 'DLF Limited' },
];

export const RecordExpenseModal: React.FC<RecordExpenseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'white-sky';
  const currency = useSystemCurrency();

  const [title, setTitle] = useState('');
  const [vendor, setVendor] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Cloud & Infrastructure');
  const [department, setDepartment] = useState<ExpenseDepartment>('Engineering & AI');
  const [amount, setAmount] = useState<number | ''>('');
  const [taxAmount, setTaxAmount] = useState<number | ''>(0);
  const [taxDeductible, setTaxDeductible] = useState(true);
  const [status, setStatus] = useState<ExpenseStatus>('Paid');
  const [paymentMethod, setPaymentMethod] = useState<ExpensePaymentMethod>('Corporate Card');
  const [date, setDate] = useState('2025-05-20');
  const [dueDate, setDueDate] = useState('');
  const [project, setProject] = useState('');
  const [client, setClient] = useState('');
  const [isBillableToClient, setIsBillableToClient] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState<'Monthly' | 'Quarterly' | 'Annual'>('Monthly');
  const [receiptFilename, setReceiptFilename] = useState('');
  const [submittedBy, setSubmittedBy] = useState('Sayed (CEO)');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setVendor(initialData.vendor || '');
      setCategory(initialData.category || 'Cloud & Infrastructure');
      setDepartment(initialData.department || 'Engineering & AI');
      setAmount(initialData.amount || '');
      setTaxAmount(initialData.taxAmount ?? 0);
      setTaxDeductible(initialData.taxDeductible ?? true);
      setStatus(initialData.status || 'Paid');
      setPaymentMethod(initialData.paymentMethod || 'Corporate Card');
      setDate(initialData.date || '2025-05-20');
      setDueDate(initialData.dueDate || '');
      setProject(initialData.project || '');
      setClient(initialData.client || '');
      setIsBillableToClient(initialData.isBillableToClient || false);
      setIsRecurring(initialData.isRecurring || false);
      setRecurringInterval(initialData.recurringInterval || 'Monthly');
      setReceiptFilename(initialData.receiptFilename || '');
      setSubmittedBy(initialData.submittedBy || 'Sayed (CEO)');
      setNotes(initialData.notes || '');
    } else {
      setTitle('');
      setVendor(COMMON_VENDORS[0]);
      setCategory('Cloud & Infrastructure');
      setDepartment('Engineering & AI');
      setAmount('');
      setTaxAmount(0);
      setTaxDeductible(true);
      setStatus('Paid');
      setPaymentMethod('Corporate Card');
      setDate('2025-05-20');
      setDueDate('');
      setProject('');
      setClient('');
      setIsBillableToClient(false);
      setIsRecurring(false);
      setRecurringInterval('Monthly');
      setReceiptFilename('receipt-voucher-may.pdf');
      setSubmittedBy('Sayed (CEO)');
      setNotes('');
    }
    setErrorMsg('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleProjectChange = (projName: string) => {
    setProject(projName);
    const found = PROJECT_OPTIONS.find((p) => p.name === projName);
    if (found && found.client) {
      setClient(found.client);
      setIsBillableToClient(true);
    } else {
      setClient('');
      setIsBillableToClient(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Please enter an expense title / description.');
      return;
    }
    if (!vendor.trim()) {
      setErrorMsg('Please specify a vendor name.');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setErrorMsg(`Please enter a valid expense amount greater than ${currency.symbol}0.`);
      return;
    }

    const numAmount = Number(amount);
    const numTax = Number(taxAmount) || 0;

    const expenseItem: ExpenseItem = {
      id: initialData?.id || `exp-${Date.now()}`,
      expenseNumber:
        initialData?.expenseNumber ||
        `EXP-2025-0${Math.floor(95 + Math.random() * 20)}`,
      title: title.trim(),
      vendor: vendor.trim(),
      category,
      department,
      amount: numAmount,
      amountFormatted: `$${numAmount.toLocaleString('en-US')}`,
      taxAmount: numTax,
      taxDeductible,
      status,
      paymentMethod,
      date,
      dueDate: dueDate || undefined,
      paidDate: status === 'Paid' ? date : undefined,
      project: project && project !== 'None / Internal OPEX' ? project : undefined,
      client: client || undefined,
      isBillableToClient,
      isRecurring,
      recurringInterval: isRecurring ? recurringInterval : undefined,
      receiptFilename: receiptFilename || 'receipt-scanned.pdf',
      approvedBy: status === 'Approved' || status === 'Paid' ? 'Sayed (CEO)' : undefined,
      submittedBy,
      notes: notes.trim() || undefined,
      createdAt: initialData?.createdAt || new Date().toISOString(),
    };

    onSave(expenseItem);
    onClose();
  };

  const inputClass = isLight
    ? 'w-full px-3 py-2 text-xs rounded-xl border border-sky-100 bg-sky-50/40 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400'
    : 'w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-slate-900/70 text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500';

  const labelClass = 'block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className={`relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl border shadow-2xl ${
          isLight ? 'bg-white border-sky-200' : 'bg-[#0f172a] border-slate-700'
        }`}
      >
        {/* Header */}
        <div
          className={`sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b ${
            isLight
              ? 'bg-white/95 border-sky-100 backdrop-blur-md'
              : 'bg-[#0f172a]/95 border-slate-800 backdrop-blur-md'
          }`}
        >
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {initialData ? `Edit Expense: ${initialData.expenseNumber}` : 'Record New Business Expense'}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Track cloud, software, vendor disbursements, and client-billable OPEX
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className={labelClass}>Expense Title / Description *</label>
            <input
              type="text"
              required
              placeholder="e.g. AWS Cloud GPU Cluster (p4d.24xlarge multi-node)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Vendor and Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Vendor / Payee *</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  list="vendor-datalist"
                  placeholder="Select or enter vendor..."
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  className={inputClass}
                />
                <datalist id="vendor-datalist">
                  {COMMON_VENDORS.map((v) => (
                    <option key={v} value={v} />
                  ))}
                </datalist>
              </div>
            </div>

            <div>
              <label className={labelClass}>Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className={inputClass}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount and Tax */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>Amount ({currency.symbol} {currency.code}) *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">{currency.symbol}</span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className={`${inputClass} pl-7`}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Tax Amount ({currency.symbol} {currency.code})</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">{currency.symbol}</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={taxAmount}
                  onChange={(e) => setTaxAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className={`${inputClass} pl-7`}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Payment Method *</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as ExpensePaymentMethod)}
                className={inputClass}
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Department, Status, and Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value as ExpenseDepartment)}
                className={inputClass}
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Expense Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ExpenseStatus)}
                className={inputClass}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Transaction Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* Project & Billable Client Link */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Client Project & Billable Recovery
              </span>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={isBillableToClient}
                  onChange={(e) => setIsBillableToClient(e.target.checked)}
                  className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 w-3.5 h-3.5"
                />
                <span>Billable to Client</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Linked Project (Optional)</label>
                <select
                  value={project}
                  onChange={(e) => handleProjectChange(e.target.value)}
                  className={inputClass}
                >
                  {PROJECT_OPTIONS.map((p) => (
                    <option key={p.name} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Client Account</label>
                <input
                  type="text"
                  placeholder="e.g. CloudNest AI"
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Recurring Subscription & Receipt */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 w-3.5 h-3.5"
                />
                <span>Recurring Subscription</span>
              </label>
              {isRecurring && (
                <div className="pt-1">
                  <select
                    value={recurringInterval}
                    onChange={(e) =>
                      setRecurringInterval(e.target.value as 'Monthly' | 'Quarterly' | 'Annual')
                    }
                    className={inputClass}
                  >
                    <option value="Monthly">Monthly Auto-Renewal</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Annual">Annual Renewal</option>
                  </select>
                </div>
              )}
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 space-y-1.5">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Receipt / Tax Voucher
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="receipt-filename.pdf"
                  value={receiptFilename}
                  onChange={(e) => setReceiptFilename(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
                <button
                  type="button"
                  onClick={() => setReceiptFilename(`receipt-${Date.now().toString().slice(-4)}.pdf`)}
                  className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800 shrink-0"
                >
                  Attach
                </button>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className={labelClass}>Business Purpose & Justification Notes</label>
            <textarea
              rows={2}
              placeholder="e.g. Dedicated high-performance cluster reservation for real-time inference latency benchmarks."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-xl bg-sky-500 hover:bg-sky-600 text-white shadow-sm transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{initialData ? 'Save Changes' : 'Record Expense'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

