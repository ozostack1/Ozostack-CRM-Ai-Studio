import React, { useState } from 'react';
import {
  X,
  CreditCard,
  Building,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Edit3,
  Trash2,
  Tag,
  Briefcase,
  User,
  FileText,
  Printer,
  ShieldCheck,
  Check,
  RotateCcw,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { ExpenseItem, ExpenseStatus } from '../../types/crm';
import { useSystemCurrency, formatMoney } from '../../data/currencyService';

interface ExpenseDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  expense: ExpenseItem | null;
  onEdit: (expense: ExpenseItem) => void;
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, status: ExpenseStatus) => void;
}

export const ExpenseDetailsDrawer: React.FC<ExpenseDetailsDrawerProps> = ({
  isOpen,
  onClose,
  expense,
  onEdit,
  onDelete,
  onUpdateStatus,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'white-sky';
  const currency = useSystemCurrency();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen || !expense) return null;

  // Print voucher
  const handlePrintVoucher = () => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    const voucherHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Payment Voucher - ${expense.expenseNumber}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 20px; color: #0f172a; }
    .header { border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-start; }
    .title { font-size: 20px; font-weight: 800; color: #0f172a; }
    .ref { font-family: monospace; font-size: 13px; color: #0284c7; font-weight: bold; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; font-size: 12px; }
    .card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; background: #f8fafc; }
    .card h4 { margin: 0 0 6px 0; font-size: 10px; color: #64748b; text-transform: uppercase; }
    .card p { margin: 0; font-size: 13px; font-weight: 600; }
    .amount-box { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 16px; text-align: right; margin-top: 16px; }
    .amount-val { font-size: 24px; font-weight: 900; color: #0284c7; }
    .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 36px; padding-top: 24px; border-top: 1px dashed #cbd5e1; font-size: 11px; }
    .sig-line { border-top: 1px solid #0f172a; margin-top: 32px; padding-top: 4px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="title">OZOSTACK TECHNOLOGIES INC.</div>
      <div style="font-size: 11px; color: #64748b;">OFFICIAL EXPENSE & DISBURSEMENT VOUCHER</div>
    </div>
    <div style="text-align: right;">
      <div class="ref">${expense.expenseNumber}</div>
      <div style="font-size: 11px; color: #64748b;">Date: ${expense.date}</div>
    </div>
  </div>

  <div class="grid">
    <div class="card">
      <h4>Vendor / Payee</h4>
      <p>${expense.vendor}</p>
    </div>
    <div class="card">
      <h4>Category & Department</h4>
      <p>${expense.category} • ${expense.department}</p>
    </div>
    <div class="card">
      <h4>Expense Title</h4>
      <p>${expense.title}</p>
    </div>
    <div class="card">
      <h4>Payment Rail & Status</h4>
      <p>${expense.paymentMethod} • ${expense.status}</p>
    </div>
  </div>

  ${
    expense.notes
      ? `<div class="card" style="margin-bottom: 16px;">
          <h4>Business Justification & Notes</h4>
          <p style="font-size: 12px; font-weight: normal; color: #334155;">${expense.notes}</p>
         </div>`
      : ''
  }

  <div class="amount-box">
    <div style="font-size: 11px; color: #0369a1; font-weight: bold; text-transform: uppercase;">Total Disbursed Amount</div>
    <div class="amount-val">${formatMoney(expense.amountFormatted, currency)}</div>
    <div style="font-size: 10px; color: #64748b; margin-top: 4px;">Tax Included: ${currency.symbol}${(expense.taxAmount || 0).toLocaleString()} • Tax Deductible: ${expense.taxDeductible ? 'Yes' : 'No'}</div>
  </div>

  <div class="signatures">
    <div>
      <div>Submitted By: <strong>${expense.submittedBy}</strong></div>
      <div class="sig-line">Employee / Requestor Signature</div>
    </div>
    <div>
      <div>Executive Approval: <strong>${expense.approvedBy || 'Sayed (CEO)'}</strong></div>
      <div class="sig-line">Finance / Authorized Officer Signature</div>
    </div>
  </div>
</body>
</html>`;

    doc.open();
    doc.write(voucherHtml);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1000);
    }, 250);
  };

  const getStatusBadge = () => {
    switch (expense.status) {
      case 'Paid':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Paid & Settled
          </span>
        );
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            Approved
          </span>
        );
      case 'Pending Approval':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5" />
            Pending Approval
          </span>
        );
      case 'Scheduled':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <Calendar className="w-3.5 h-3.5" />
            Scheduled
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <AlertCircle className="w-3.5 h-3.5" />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className={`w-full max-w-xl h-full flex flex-col border-l shadow-2xl overflow-hidden transition-all ${
          isLight ? 'bg-white border-sky-200' : 'bg-[#0f172a] border-slate-700'
        }`}
      >
        {/* Drawer Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b shrink-0 ${
            isLight ? 'border-sky-100 bg-white/95' : 'border-slate-800 bg-[#0f172a]/95'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800 flex items-center justify-center font-bold">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-mono font-bold text-sky-600 dark:text-sky-400 block">
                {expense.expenseNumber}
              </span>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white truncate max-w-[280px]">
                {expense.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(expense)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Edit Expense"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Drawer Body Scroll */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Top Status & Amount Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-500/10 via-sky-400/5 to-transparent border border-sky-200/60 dark:border-sky-800/40 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Total Disbursed
              </span>
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {formatMoney(expense.amountFormatted, currency)}
              </span>
              {expense.taxAmount ? (
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                  Includes {currency.symbol}{expense.taxAmount.toLocaleString('en-US')} Tax
                </span>
              ) : null}
            </div>
            <div className="text-right space-y-1.5">
              <div>{getStatusBadge()}</div>
              <span className="text-[11px] text-slate-400 font-medium block">
                Paid via {expense.paymentMethod}
              </span>
            </div>
          </div>

          {/* Quick Approval Workflow Actions */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Workflow Status Actions
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {expense.status === 'Pending Approval' && (
                <>
                  <button
                    onClick={() => onUpdateStatus(expense.id, 'Approved')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-xs transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve Expense</span>
                  </button>
                  <button
                    onClick={() => onUpdateStatus(expense.id, 'Rejected')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-rose-500 hover:bg-rose-600 text-white shadow-xs transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                </>
              )}

              {(expense.status === 'Approved' || expense.status === 'Scheduled') && (
                <button
                  onClick={() => onUpdateStatus(expense.id, 'Paid')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-xs transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mark as Paid & Settled</span>
                </button>
              )}

              {expense.status === 'Paid' && (
                <button
                  onClick={() => onUpdateStatus(expense.id, 'Pending Approval')}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Re-open for Review</span>
                </button>
              )}

              <button
                onClick={handlePrintVoucher}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800 hover:bg-sky-100 dark:hover:bg-sky-900/60 transition-colors ml-auto"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Voucher</span>
              </button>
            </div>
          </div>

          {/* Classification & Accounting Details */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
              Accounting & Organization
            </span>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                  Vendor / Payee
                </span>
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-sky-500" />
                  {expense.vendor}
                </span>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                  Category
                </span>
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-sky-500" />
                  {expense.category}
                </span>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                  Department
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {expense.department}
                </span>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                  Transaction Date
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {expense.date}
                </span>
              </div>
            </div>
          </div>

          {/* Project & Billable Status */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 space-y-2 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Client & Project Allocation
            </span>
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">
                  {expense.project || 'Internal Corporate Overhead'}
                </span>
                {expense.client && (
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                    Client: {expense.client}
                  </span>
                )}
              </div>
              <div>
                {expense.isBillableToClient ? (
                  <span className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Billable to Client
                  </span>
                ) : (
                  <span className="px-2.5 py-1 text-[10px] font-medium rounded-lg bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    Internal Non-Billable
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Receipt Voucher Attachment */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Receipt & Invoice Document
            </span>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-500" />
                <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">
                  {expense.receiptFilename || 'receipt-scanned.pdf'}
                </span>
              </div>
              <button
                onClick={handlePrintVoucher}
                className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline"
              >
                View Voucher
              </button>
            </div>
          </div>

          {/* Business Justification Notes */}
          {expense.notes && (
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Business Justification Notes
              </span>
              <p className="leading-relaxed text-slate-600 dark:text-slate-300">{expense.notes}</p>
            </div>
          )}

          {/* Audit Trail */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Submitted by:</span>
              <span className="font-semibold text-slate-600 dark:text-slate-300">
                {expense.submittedBy}
              </span>
            </div>
            {expense.approvedBy && (
              <div className="flex justify-between">
                <span>Approved by:</span>
                <span className="font-semibold text-slate-600 dark:text-slate-300">
                  {expense.approvedBy}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Logged on:</span>
              <span>{new Date(expense.createdAt).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div
          className={`p-4 border-t shrink-0 flex items-center justify-between ${
            isLight ? 'border-sky-100 bg-slate-50/80' : 'border-slate-800 bg-[#0f172a]'
          }`}
        >
          {showDeleteConfirm ? (
            <div className="flex items-center gap-2 w-full justify-between animate-in fade-in">
              <span className="text-xs text-rose-500 font-bold">Delete this record permanently?</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-2.5 py-1 text-xs rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={() => onDelete(expense.id)}
                  className="px-3 py-1 text-xs font-bold rounded-lg bg-rose-500 text-white hover:bg-rose-600"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onEdit(expense)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-1.5 text-xs font-bold rounded-xl bg-sky-500 hover:bg-sky-600 text-white shadow-xs transition-colors"
                >
                  Done
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

