import React, { useState } from 'react';
import {
  X,
  CreditCard,
  Building2,
  Calendar,
  CheckCircle2,
  DollarSign,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { PayRunCycle } from './payrollMockData';
import { useSystemCurrency } from '../../data/currencyService';

interface RunPayrollModalProps {
  isOpen: boolean;
  cycle: PayRunCycle | null;
  onClose: () => void;
  onExecutePayRun: (cycleId: string, payDate: string, fundingAccount: string) => void;
}

export const RunPayrollModal: React.FC<RunPayrollModalProps> = ({
  isOpen,
  cycle,
  onClose,
  onExecutePayRun,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'white-sky';
  const currency = useSystemCurrency();

  const [payDate, setPayDate] = useState('2026-11-15');
  const [fundingAccount, setFundingAccount] = useState('Silicon Valley Bank (SVB) Operating •••• 4892');
  const [agreed, setAgreed] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !cycle) return null;

  const handleConfirm = () => {
    if (!agreed) return;
    setIsSubmitting(true);
    setTimeout(() => {
      onExecutePayRun(cycle.id, payDate, fundingAccount);
      setIsSubmitting(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div
        className={`relative w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden my-6 transition-all ${
          isLight
            ? 'bg-white border-sky-200 text-slate-800'
            : 'bg-[#0f172a] border-slate-700 text-slate-100'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${
            isLight ? 'bg-sky-50/70 border-sky-100' : 'bg-slate-900/80 border-slate-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Authorize & Execute Pay Run
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {cycle.cycleName} ({cycle.payPeriod})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5">
          {/* Funds Summary Breakdown Card */}
          <div
            className={`p-4 rounded-xl border space-y-3 ${
              isLight ? 'bg-sky-50/40 border-sky-100' : 'bg-slate-800/40 border-slate-800'
            }`}
          >
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 dark:text-slate-400">Total Gross Compensation</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {currency.symbol}{cycle.totalGross.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 dark:text-slate-400">
                Statutory Taxes Withheld (IRS + State)
              </span>
              <span className="font-semibold text-rose-500">
                -{currency.symbol}{cycle.totalTaxes.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 dark:text-slate-400">
                Benefits & 401(k) Deductions
              </span>
              <span className="font-semibold text-rose-500">
                -{currency.symbol}{cycle.totalBenefits.toLocaleString()}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Total Net ACH Disbursement
                </span>
                <p className="text-[11px] text-slate-500">To be credited to {cycle.employeeCount} active accounts</p>
              </div>
              <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {currency.symbol}{cycle.totalNet.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Funding Account Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Primary Payroll Funding Account
            </label>
            <select
              value={fundingAccount}
              onChange={(e) => setFundingAccount(e.target.value)}
              className={`w-full text-xs font-medium px-3 py-2.5 rounded-xl border focus:outline-hidden focus:ring-2 focus:ring-sky-500 ${
                isLight
                  ? 'bg-white border-slate-200 text-slate-800'
                  : 'bg-slate-800/80 border-slate-700 text-slate-100'
              }`}
            >
              <option value="Silicon Valley Bank (SVB) Operating •••• 4892">
                Silicon Valley Bank (SVB) Operating •••• 4892 ({currency.symbol}482,900.00 Available)
              </option>
              <option value="JPMorgan Chase Commercial Reserve •••• 9104">
                JPMorgan Chase Commercial Reserve •••• 9104 ({currency.symbol}1,250,000.00 Available)
              </option>
              <option value="Mercury Treasury Account •••• 3341">
                Mercury Treasury Account •••• 3341 ({currency.symbol}890,400.00 Available)
              </option>
            </select>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Sufficient balance verified for batch direct deposit</span>
            </div>
          </div>

          {/* Scheduled Payout Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Direct Deposit Effective Date
              </label>
              <input
                type="date"
                value={payDate}
                onChange={(e) => setPayDate(e.target.value)}
                className={`w-full text-xs font-medium px-3 py-2.5 rounded-xl border focus:outline-hidden focus:ring-2 focus:ring-sky-500 ${
                  isLight
                    ? 'bg-white border-slate-200 text-slate-800'
                    : 'bg-slate-800/80 border-slate-700 text-slate-100'
                }`}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Tax Remittance Protocol
              </label>
              <div
                className={`text-xs px-3 py-2.5 rounded-xl border flex items-center justify-between ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-800/50 border-slate-700 text-slate-300'
                }`}
              >
                <span>Automated IRS EFTPS</span>
                <span className="font-semibold text-sky-500">Auto-File</span>
              </div>
            </div>
          </div>

          {/* Compliance Checkbox */}
          <label className="flex items-start gap-2.5 p-3 rounded-xl border border-sky-100 dark:border-sky-950/60 bg-sky-50/50 dark:bg-sky-950/20 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 rounded text-sky-500 focus:ring-sky-400"
            />
            <span className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              I authorize Ozostack Payroll to debit the operating account for{' '}
              <strong className="text-slate-900 dark:text-white font-bold">
                {currency.symbol}{cycle.totalNet.toLocaleString()} {currency.code}
              </strong>{' '}
              and remit all statutory tax withholdings to the IRS and California EDD.
            </span>
          </label>
        </div>

        {/* Footer Actions */}
        <div
          className={`flex items-center justify-end gap-3 px-6 py-4 border-t ${
            isLight ? 'bg-slate-50/60 border-slate-100' : 'bg-slate-900/60 border-slate-800'
          }`}
        >
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-colors ${
              isLight
                ? 'border-slate-200 text-slate-600 hover:bg-slate-100'
                : 'border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!agreed || isSubmitting}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition-colors ${
              !agreed || isSubmitting
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'
            }`}
          >
            {isSubmitting ? (
              <span>Transmitting Batch ACH...</span>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Approve & Disburse {currency.symbol}{cycle.totalNet.toLocaleString()}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

