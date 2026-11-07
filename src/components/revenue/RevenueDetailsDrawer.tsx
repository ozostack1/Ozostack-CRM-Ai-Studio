import React, { useState } from 'react';
import {
  X,
  Building2,
  Calendar,
  CreditCard,
  FileText,
  User,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Copy,
  Check,
  Trash2,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { RevenueTransaction, RevenuePaymentStatus } from '../../types/crm';
import { useSystemCurrency, formatMoney } from '../../data/currencyService';

interface RevenueDetailsDrawerProps {
  transaction: RevenueTransaction | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (id: string, newStatus: RevenuePaymentStatus) => void;
  onDeleteTransaction: (id: string) => void;
}

export const RevenueDetailsDrawer: React.FC<RevenueDetailsDrawerProps> = ({
  transaction,
  isOpen,
  onClose,
  onUpdateStatus,
  onDeleteTransaction,
}) => {
  const { theme } = useTheme();
  const { currency } = useSystemCurrency();
  const isLight = theme === 'white-sky';
  const [copiedInvoice, setCopiedInvoice] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !transaction) return null;

  const handleCopyInvoice = () => {
    if (transaction.invoiceNumber) {
      navigator.clipboard.writeText(transaction.invoiceNumber);
      setCopiedInvoice(true);
      setTimeout(() => setCopiedInvoice(false), 2000);
    }
  };

  const getStatusBadge = (status: RevenuePaymentStatus) => {
    switch (status) {
      case 'Received':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle className="w-3.5 h-3.5" />
            Received (Settled)
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5" />
            Pending Inflow
          </span>
        );
      case 'Scheduled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/20">
            <Calendar className="w-3.5 h-3.5" />
            Scheduled
          </span>
        );
      case 'Overdue':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <AlertCircle className="w-3.5 h-3.5" />
            Overdue
          </span>
        );
    }
  };

  const cogsCost = Math.round(
    transaction.amount * (1 - transaction.grossMarginPercent / 100)
  );

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div
          className={`w-screen max-w-md shadow-2xl flex flex-col border-l transition-transform transform duration-300 ease-in-out ${
            isLight ? 'bg-white border-sky-200' : 'bg-[#0f172a] border-slate-800'
          }`}
        >
          {/* Drawer Header */}
          <div
            className={`px-6 py-4 border-b flex items-center justify-between ${
              isLight
                ? 'bg-sky-50/60 border-sky-100'
                : 'bg-slate-900/60 border-slate-800'
            }`}
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold text-sky-600 dark:text-sky-400">
                  {transaction.transactionNumber}
                </span>
                {transaction.isRecurring && (
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-sky-500/15 text-sky-600 dark:text-sky-400">
                    MRR Recurring
                  </span>
                )}
              </div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                {transaction.client}
              </h2>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Amount Banner */}
            <div
              className={`p-4 rounded-2xl border flex items-center justify-between ${
                isLight
                  ? 'bg-sky-50/70 border-sky-200'
                  : 'bg-slate-900 border-sky-500/20'
              }`}
            >
              <div>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Gross Revenue Amount
                </p>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                  {formatMoney(transaction.amount, currency)}
                </p>
                <p className="text-xs text-sky-600 dark:text-sky-400 font-medium mt-1">
                  {transaction.streamType}
                </p>
              </div>
              <div>{getStatusBadge(transaction.status)}</div>
            </div>

            {/* Quick Status Action Button */}
            {transaction.status !== 'Received' && (
              <button
                onClick={() => onUpdateStatus(transaction.id, 'Received')}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-600 text-white shadow-xs flex items-center justify-center gap-2 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Mark as Received (Clear Funds)</span>
              </button>
            )}

            {/* Financial Decomposition */}
            <div
              className={`p-4 rounded-xl border space-y-3 ${
                isLight ? 'bg-sky-50/40 border-sky-100' : 'bg-slate-900/50 border-slate-800'
              }`}
            >
              <h3 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-sky-500" />
                <span>Margin & Unit Economics</span>
              </h3>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700">
                  <span className="text-[11px] text-slate-400 block">Gross Margin %</span>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {transaction.grossMarginPercent}%
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700">
                  <span className="text-[11px] text-slate-400 block">Net Profit</span>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {currency.symbol}{transaction.netProfit.toLocaleString('en-US')}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700">
                  <span className="text-[11px] text-slate-400 block">Direct COGS / Delivery</span>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    {currency.symbol}{cogsCost.toLocaleString('en-US')}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700">
                  <span className="text-[11px] text-slate-400 block">Payment Method</span>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    {transaction.paymentMethod}
                  </span>
                </div>
              </div>
            </div>

            {/* Engagement Details */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-800 dark:text-white">
                Engagement & Account Information
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    Client Organization
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {transaction.client}
                  </span>
                </div>

                {transaction.project && (
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      Project Reference
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-right max-w-[200px] truncate">
                      {transaction.project}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Recorded Date
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {transaction.date}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    Account Executive
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {transaction.accountManager}
                  </span>
                </div>

                {transaction.invoiceNumber && (
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                      Invoice Number
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {transaction.invoiceNumber}
                      </span>
                      <button
                        onClick={handleCopyInvoice}
                        title="Copy Invoice Number"
                        className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        {copiedInvoice ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Strategic Notes */}
            {transaction.notes && (
              <div
                className={`p-3.5 rounded-xl border text-xs ${
                  isLight
                    ? 'bg-slate-50 border-slate-200/80 text-slate-700'
                    : 'bg-slate-900 border-slate-800 text-slate-300'
                }`}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Executive Notes & Context
                </span>
                <p className="leading-relaxed">{transaction.notes}</p>
              </div>
            )}
          </div>

          {/* Drawer Footer Actions */}
          <div
            className={`p-4 border-t flex items-center justify-between ${
              isLight ? 'bg-white border-sky-100' : 'bg-[#0f172a] border-slate-800'
            }`}
          >
            {isDeleting ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onDeleteTransaction(transaction.id)}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white"
                >
                  Confirm Delete
                </button>
                <button
                  onClick={() => setIsDeleting(false)}
                  className="px-2 py-1.5 text-xs text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsDeleting(true)}
                className="flex items-center gap-1 text-xs text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            )}

            <button
              onClick={onClose}
              className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-colors ${
                isLight
                  ? 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  : 'border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

