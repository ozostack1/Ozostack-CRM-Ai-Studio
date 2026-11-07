import React, { useState } from 'react';
import { X, CheckCircle2, FileText, AlertCircle, DollarSign } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { PnLAdjustment, PnLCategoryType } from '../../types/crm';
import { useSystemCurrency } from '../../data/currencyService';

interface AddAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (adj: PnLAdjustment) => void;
}

const CATEGORIES: PnLCategoryType[] = [
  'Operating Revenue',
  'Cost of Goods Sold (COGS)',
  'Operating Expenses (OpEx)',
  'Tax & Depreciation',
];

const ACCOUNT_PRESETS: Record<PnLCategoryType, string[]> = {
  'Operating Revenue': [
    '4010 - Enterprise Platform Subscriptions',
    '4020 - AI Automation & Workflow Suite',
    '4030 - Custom AI Model Fine-Tuning',
    '4040 - High-Throughput API Ingestion',
    '4050 - Dedicated Enterprise SLA & Architecture Retainers',
  ],
  'Cost of Goods Sold (COGS)': [
    '5010 - GPU Cloud Cluster (AWS/GCP)',
    '5020 - Cloud Database & Storage (Snowflake)',
    '5030 - Third-Party AI Foundation Model Tokens',
    '5040 - Payment Gateway Take-Rates',
  ],
  'Operating Expenses (OpEx)': [
    '6010 - Engineering & Product R&D Payroll',
    '6020 - Enterprise Sales & Growth Marketing',
    '6030 - Executive Leadership & Administrative G&A',
    '6040 - SOC2 Compliance & Legal Counseling',
    '6050 - SaaS Software Tooling & Dev Licenses',
  ],
  'Tax & Depreciation': [
    '7010 - Corporate Income Tax Provision',
    '7020 - Capitalized Hardware & IP Amortization',
  ],
};

export const AddAdjustmentModal: React.FC<AddAdjustmentModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const { theme } = useTheme();
  const { currency } = useSystemCurrency();
  const isLight = theme === 'white-sky';

  const [category, setCategory] = useState<PnLCategoryType>('Operating Revenue');
  const [accountName, setAccountName] = useState(ACCOUNT_PRESETS['Operating Revenue'][0]);
  const [amount, setAmount] = useState<number | ''>('');
  const [type, setType] = useState<'Credit' | 'Debit'>('Credit');
  const [date, setDate] = useState('2026-11-04');
  const [memo, setMemo] = useState('');
  const [approvedBy, setApprovedBy] = useState('Sayed (CEO / Treasury)');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleCategoryChange = (cat: PnLCategoryType) => {
    setCategory(cat);
    setAccountName(ACCOUNT_PRESETS[cat][0]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const valAmount = Number(amount);
    if (!valAmount || valAmount <= 0) {
      setErrorMsg(`Please specify a valid adjustment amount greater than ${currency.symbol}0.`);
      return;
    }
    if (!memo.trim()) {
      setErrorMsg('Please enter an audit reconciliation memo.');
      return;
    }

    const adjustment: PnLAdjustment = {
      id: `adj-${Date.now()}`,
      reference: `JRNL-2026-0${Math.floor(45 + Math.random() * 40)}`,
      category,
      accountName,
      amount: valAmount,
      type,
      date,
      memo: memo.trim(),
      approvedBy,
    };

    onSave(adjustment);
    onClose();
  };

  const inputClass = isLight
    ? 'w-full px-3 py-2 text-xs rounded-xl border border-sky-100 bg-sky-50/40 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400'
    : 'w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-slate-900/70 text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500';

  const labelClass = 'block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className={`relative w-full max-w-lg rounded-2xl border shadow-2xl p-6 space-y-4 ${
          isLight ? 'bg-white border-sky-200' : 'bg-[#0f172a] border-slate-700'
        }`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Record Journal Audit Adjustment
              </h3>
              <p className="text-[11px] text-slate-500">
                Accrual deferrals, tax amortization schedules, and GAAP ledger reconciliations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {errorMsg && (
            <div className="flex items-center gap-2 p-2.5 text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Statement Category *</label>
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value as PnLCategoryType)}
                className={inputClass}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Accounting Entry Type *</label>
              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold">
                <button
                  type="button"
                  onClick={() => setType('Credit')}
                  className={`py-1 rounded-lg text-center transition-all ${
                    type === 'Credit'
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Credit (+)
                </button>
                <button
                  type="button"
                  onClick={() => setType('Debit')}
                  className={`py-1 rounded-lg text-center transition-all ${
                    type === 'Debit'
                      ? 'bg-rose-500 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Debit (-)
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className={labelClass}>Ledger Account Code & Description *</label>
            <select
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              className={inputClass}
            >
              {ACCOUNT_PRESETS[category].map((acc) => (
                <option key={acc} value={acc}>
                  {acc}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Adjustment Amount ({currency.symbol} {currency.code}) *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{currency.symbol}</span>
                <input
                  type="number"
                  min="1"
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
              <label className={labelClass}>Effective Posting Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Audit Reconciliation Memo *</label>
            <textarea
              rows={2}
              required
              placeholder="e.g. Upfront contract revenue deferral recognition in accordance with ASC 606 standards."
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Approving Executive Signoff</label>
            <input
              type="text"
              value={approvedBy}
              onChange={(e) => setApprovedBy(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl font-bold bg-sky-500 hover:bg-sky-600 text-white shadow-xs transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Post Adjustment Entry</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

