import React, { useState } from 'react';
import { X, DollarSign, CheckCircle2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useSystemCurrency } from '../../data/currencyService';
import { RevenueTransaction, RevenueStreamType, RevenuePaymentStatus } from '../../types/crm';

interface RecordRevenueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: RevenueTransaction) => void;
}

const STREAM_OPTIONS: RevenueStreamType[] = [
  'SaaS Subscription (MRR)',
  'Custom Engineering',
  'AI Automation & Agents',
  'Cloud Infrastructure',
  'Enterprise Retainer',
  'Consulting & Advisory',
];

const PAYMENT_METHODS = ['Stripe', 'Wire Transfer', 'ACH', 'Credit Card', 'PayPal'] as const;

const CLIENT_SUGGESTIONS = [
  'FinEdge Systems',
  'CloudNest AI',
  'TechVision Inc.',
  'SwiftRetail Global',
  'Gulf Cloud Services',
  'Solaria Logistics',
  'DLF Limited',
  'BioPulse Health',
  'DataSoft Solutions',
  'Healthcare Plus',
  'Real Estate Pro',
  'GreenLeaf Dining',
];

export const RecordRevenueModal: React.FC<RecordRevenueModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'white-sky';
  const { currency } = useSystemCurrency();

  const [client, setClient] = useState('');
  const [project, setProject] = useState('');
  const [streamType, setStreamType] = useState<RevenueStreamType>('SaaS Subscription (MRR)');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<RevenuePaymentStatus>('Received');
  const [paymentMethod, setPaymentMethod] = useState<'Stripe' | 'Wire Transfer' | 'ACH' | 'Credit Card' | 'PayPal'>('Stripe');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-2025-${Math.floor(125 + Math.random() * 50)}`);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringCadence, setRecurringCadence] = useState<'Monthly' | 'Quarterly' | 'Annual'>('Monthly');
  const [grossMarginPercent, setGrossMarginPercent] = useState('55');
  const [accountManager, setAccountManager] = useState('Sayed (CEO)');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!client.trim()) {
      setError('Please specify a client name.');
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid positive dollar amount.');
      return;
    }

    const margin = parseFloat(grossMarginPercent) || 50;
    const netProfit = Math.round((numAmount * margin) / 100);

    const newTx: RevenueTransaction = {
      id: `rev-${Date.now()}`,
      transactionNumber: `REV-2025-${Math.floor(100 + Math.random() * 900)}`,
      client: client.trim(),
      project: project.trim() || `${streamType} Engagement`,
      streamType,
      amount: numAmount,
      amountFormatted: `${currency.symbol}${numAmount.toLocaleString('en-US')}`,
      status,
      date,
      paymentMethod,
      invoiceNumber: invoiceNumber.trim() || undefined,
      isRecurring,
      recurringCadence: isRecurring ? recurringCadence : undefined,
      grossMarginPercent: margin,
      netProfit,
      accountManager: accountManager.trim() || 'Sayed (CEO)',
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    onSave(newTx);
    onClose();
  };

  const inputClass = isLight
    ? 'w-full px-3 py-2 text-xs rounded-xl border border-sky-100 bg-sky-50/40 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400'
    : 'w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-slate-900/60 text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500';

  const labelClass = 'block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className={`relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-2xl border shadow-2xl transition-all ${
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
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/15 flex items-center justify-center text-sky-500">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Record Revenue Inflow</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Log a closed invoice payment, SaaS subscription or enterprise retainer
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-medium">
              {error}
            </div>
          )}

          {/* Client & Project row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Client Name *</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  list="client-suggestions"
                  placeholder="e.g. FinEdge Systems"
                  value={client}
                  onChange={(e) => {
                    setClient(e.target.value);
                    setError('');
                  }}
                  className={inputClass}
                />
                <datalist id="client-suggestions">
                  {CLIENT_SUGGESTIONS.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
            </div>

            <div>
              <label className={labelClass}>Project / Scope</label>
              <input
                type="text"
                placeholder="e.g. Fintech Banking Core API"
                value={project}
                onChange={(e) => setProject(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* Stream Type & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Revenue Stream Type *</label>
              <select
                value={streamType}
                onChange={(e) => setStreamType(e.target.value as RevenueStreamType)}
                className={inputClass}
              >
                {STREAM_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Amount ({currency.symbol} {currency.code}) *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                  {currency.symbol}
                </span>
                <input
                  type="number"
                  required
                  min="1"
                  step="0.01"
                  placeholder="25,000"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setError('');
                  }}
                  className={`${inputClass} pl-7 font-bold`}
                />
              </div>
            </div>
          </div>

          {/* Payment Status & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Payment Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as RevenuePaymentStatus)}
                className={inputClass}
              >
                <option value="Received">Received (Settled Cash)</option>
                <option value="Pending">Pending (Invoice Sent)</option>
                <option value="Scheduled">Scheduled (Future Date)</option>
                <option value="Overdue">Overdue (Past Term)</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className={inputClass}
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Invoice Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Transaction Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Invoice Reference #</label>
              <input
                type="text"
                placeholder="INV-2025-125"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* Recurring Cadence Toggle */}
          <div
            className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              isLight ? 'bg-sky-50/50 border-sky-100' : 'bg-slate-900/50 border-slate-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="recurring-toggle"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4 rounded-sm text-sky-500 accent-sky-500 cursor-pointer"
              />
              <label htmlFor="recurring-toggle" className="text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                Recurring Subscription / Retainer (Counts toward MRR)
              </label>
            </div>

            {isRecurring && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Cadence:</span>
                <select
                  value={recurringCadence}
                  onChange={(e) => setRecurringCadence(e.target.value as any)}
                  className={`text-xs py-1 px-2 rounded-lg border ${
                    isLight ? 'bg-white border-sky-200 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                >
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Annual">Annual</option>
                </select>
              </div>
            )}
          </div>

          {/* Gross Margin & Net Profit Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Gross Margin (%)</label>
              <div className="relative">
                <input
                  type="number"
                  min="5"
                  max="95"
                  value={grossMarginPercent}
                  onChange={(e) => setGrossMarginPercent(e.target.value)}
                  className={inputClass}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                  %
                </span>
              </div>
            </div>

            <div>
              <label className={labelClass}>Account Manager</label>
              <input
                type="text"
                value={accountManager}
                onChange={(e) => setAccountManager(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className={labelClass}>Executive Notes & Context</label>
            <textarea
              rows={2}
              placeholder="e.g. Milestone 2 approved by client CTO. Wire settled in Chase operating account."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Footer Actions */}
          <div
            className={`pt-4 border-t flex items-center justify-end gap-2.5 ${
              isLight ? 'border-sky-100' : 'border-slate-800'
            }`}
          >
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-colors ${
                isLight
                  ? 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  : 'border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-sky-500 hover:bg-sky-600 text-white shadow-xs transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Record Transaction</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

