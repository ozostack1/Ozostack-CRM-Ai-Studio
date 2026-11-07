import React, { useState, useEffect } from 'react';
import { X, RotateCcw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { PaymentTransaction } from '../../types/crm';
import { useSystemCurrency } from '../../data/currencyService';

interface IssueRefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: PaymentTransaction | null;
  onRefund: (paymentId: string, refundAmount: number, reason: string) => void;
}

export const IssueRefundModal: React.FC<IssueRefundModalProps> = ({
  isOpen,
  onClose,
  payment,
  onRefund,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'white-sky';
  const currency = useSystemCurrency();

  const [refundAmount, setRefundAmount] = useState<number>(payment?.amount || 0);
  const [reason, setReason] = useState('Scope adjustment on contract deliverable');
  const [isFullRefund, setIsFullRefund] = useState(true);

  // Synchronize refund amount whenever payment changes or modal opens
  useEffect(() => {
    if (payment) {
      setRefundAmount(payment.amount);
      setIsFullRefund(true);
    }
  }, [payment, isOpen]);

  if (!isOpen || !payment) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (refundAmount <= 0 || refundAmount > payment.amount) return;
    onRefund(payment.id, refundAmount, reason);
    onClose();
  };

  const inputClass = isLight
    ? 'w-full px-3 py-2 text-xs rounded-xl border border-sky-100 bg-sky-50/40 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400'
    : 'w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-slate-900/70 text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500';

  const remainingBalance = Math.max(0, payment.amount - refundAmount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className={`relative w-full max-w-md rounded-2xl border shadow-2xl p-6 space-y-4 ${
          isLight ? 'bg-white border-sky-200' : 'bg-[#0f172a] border-slate-700'
        }`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Issue Payment Refund
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">
                {payment.paymentNumber} • {payment.client}
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

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-start gap-2 text-amber-700 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              This will disburse funds back to the client’s original payment method via{' '}
              <strong>{payment.gateway}</strong>.
            </span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="text-slate-600 dark:text-slate-300 font-semibold">Refund Type</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsFullRefund(true);
                  setRefundAmount(payment.amount);
                }}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all ${
                  isFullRefund
                    ? 'bg-rose-500 text-white border-rose-500'
                    : 'border-slate-300 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Full ({currency.symbol}{payment.amount.toLocaleString()})
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsFullRefund(false);
                  setRefundAmount(Math.round(payment.amount / 2));
                }}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all ${
                  !isFullRefund
                    ? 'bg-rose-500 text-white border-rose-500'
                    : 'border-slate-300 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Partial
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Refund Amount ({currency.symbol} {currency.code})
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{currency.symbol}</span>
              <input
                type="number"
                min="1"
                max={payment.amount}
                step="0.01"
                disabled={isFullRefund}
                value={refundAmount}
                onChange={(e) => setRefundAmount(Math.min(payment.amount, Math.max(0, Number(e.target.value))))}
                className={`${inputClass} pl-7`}
              />
            </div>
            {!isFullRefund && (
              <div className="flex justify-between items-center mt-1.5 text-[10.5px] text-slate-500 dark:text-slate-400">
                <span>Original: {currency.symbol}{payment.amount.toLocaleString()}</span>
                <span className="font-semibold text-sky-600 dark:text-sky-400">
                  Remaining Client Balance: {currency.symbol}{remainingBalance.toLocaleString()}
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Refund Reason / Memo
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={inputClass}
            >
              <option value="Scope adjustment on contract deliverable">Scope adjustment on contract deliverable</option>
              <option value="Client requested cancellation">Client requested cancellation</option>
              <option value="Duplicate transaction settlement">Duplicate transaction settlement</option>
              <option value="Commercial service discount applied">Commercial service discount applied</option>
              <option value="Executive management courtesy credit">Executive management courtesy credit</option>
            </select>
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
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl font-bold bg-rose-500 hover:bg-rose-600 text-white shadow-xs transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Confirm Refund</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

