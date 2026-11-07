import React, { useState } from 'react';
import {
  X,
  CreditCard,
  Building,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Receipt,
  Printer,
  Trash2,
  Edit3,
  RotateCcw,
  Check,
  ExternalLink,
  ShieldCheck,
  DollarSign,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { PaymentTransaction, PaymentStatus } from '../../types/crm';
import { useSystemCurrency, formatMoney } from '../../data/currencyService';

interface PaymentDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  payment: PaymentTransaction | null;
  onEdit: (payment: PaymentTransaction) => void;
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, status: PaymentStatus) => void;
  onOpenRefund: (payment: PaymentTransaction) => void;
}

export const PaymentDetailsDrawer: React.FC<PaymentDetailsDrawerProps> = ({
  isOpen,
  onClose,
  payment,
  onEdit,
  onDelete,
  onUpdateStatus,
  onOpenRefund,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'white-sky';
  const currency = useSystemCurrency();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen || !payment) return null;

  // Print Official Payment Receipt
  const handlePrintReceipt = () => {
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

    const receiptHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Payment Receipt - ${payment.paymentNumber}</title>
  <style>
    @page { size: auto; margin: 8mm 10mm; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; height: auto; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; line-height: 1.35; }
    .receipt-container { max-width: 760px; margin: 0 auto; padding: 12px 16px; page-break-inside: avoid; }
    .header { border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-start; }
    .brand-mark { width: 36px; height: 36px; border-radius: 8px; background: linear-gradient(135deg, #0ea5e9, #6366f1); display: inline-block; vertical-align: middle; margin-right: 10px; }
    .title { font-size: 20px; font-weight: 900; color: #0f172a; }
    .ref { font-family: monospace; font-size: 13px; color: #0284c7; font-weight: bold; }
    .status-badge { display: inline-block; background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; border-radius: 9999px; padding: 3px 10px; font-size: 10px; font-weight: bold; text-transform: uppercase; margin-top: 4px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px; font-size: 11px; }
    .card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; background: #f8fafc; }
    .card h4 { margin: 0 0 4px 0; font-size: 9.5px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
    .card p { margin: 0; font-size: 12px; font-weight: 600; }
    .box { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 14px 18px; text-align: right; margin-top: 14px; page-break-inside: avoid; }
    .total-val { font-size: 24px; font-weight: 900; color: #0284c7; }
    .breakdown { font-size: 10.5px; color: #64748b; margin-top: 4px; }
    .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 24px; padding-top: 12px; border-top: 1px dashed #cbd5e1; font-size: 10.5px; page-break-inside: avoid; }
    .sig-line { border-top: 1px solid #0f172a; margin-top: 24px; padding-top: 4px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="receipt-container">
    <div class="header">
      <div style="display: flex; align-items: center;">
        <span class="brand-mark"></span>
        <div>
          <div class="title">OZOSTACK TECHNOLOGIES INC.</div>
          <div style="font-size: 10px; color: #64748b;">Tax ID: US-EIN 84-2910481 • 100 Enterprise Way, SF, CA 94107</div>
          <div class="status-badge">${payment.status}</div>
        </div>
      </div>
      <div style="text-align: right;">
        <div class="ref">${payment.receiptNumber || payment.paymentNumber}</div>
        <div style="font-size: 10.5px; color: #64748b; margin-top: 2px;">Date: ${payment.date}</div>
        <div style="font-size: 9.5px; color: #94a3b8; font-family: monospace; margin-top: 3px;">TX: ${payment.transactionReference}</div>
      </div>
    </div>

    <div class="grid">
      <div class="card">
        <h4>Billed Client / Payee</h4>
        <p>${payment.client}</p>
        ${payment.clientEmail ? `<div style="font-size: 10.5px; color: #64748b; margin-top: 2px;">${payment.clientEmail}</div>` : ''}
      </div>
      <div class="card">
        <h4>Clearing Gateway & Rail</h4>
        <p>${payment.gateway} (${payment.paymentMethod})</p>
        ${payment.cardLast4 ? `<div style="font-size: 10.5px; color: #64748b; margin-top: 2px;">Card: ${payment.cardBrand || 'Card'} •••• ${payment.cardLast4}</div>` : ''}
      </div>
      <div class="card">
        <h4>Transaction Nature</h4>
        <p>${payment.type}</p>
        ${payment.invoiceNumber ? `<div style="font-size: 10.5px; color: #0284c7; margin-top: 2px;">Invoice Ref: #${payment.invoiceNumber}</div>` : ''}
      </div>
      <div class="card">
        <h4>Settlement Status</h4>
        <p>${payment.status === 'Succeeded' ? `Settled on ${payment.settledDate || payment.date}` : payment.status}</p>
      </div>
    </div>

    ${
      payment.notes
        ? `<div class="card" style="margin-bottom: 14px;">
            <h4>Transaction Memo</h4>
            <p style="font-size: 11px; font-weight: normal; color: #334155;">${payment.notes}</p>
           </div>`
        : ''
    }

    <div class="box">
      <div style="font-size: 10.5px; color: #0369a1; font-weight: bold; text-transform: uppercase;">Gross Amount Settled</div>
      <div class="total-val">${formatMoney(payment.amountFormatted, currency)} ${currency.code}</div>
      <div class="breakdown">Gateway Fee: -${currency.symbol}${payment.feeAmount.toFixed(2)} | Net Credited: ${currency.symbol}${payment.netAmount.toLocaleString('en-US')} ${currency.code}</div>
    </div>

    <div class="signatures">
      <div>
        <div>Authorized Officer: <strong>Sayed (CEO / Treasury)</strong></div>
        <div class="sig-line">Ozostack Commercial Signoff • Verified</div>
      </div>
      <div>
        <div>Client Verification: <strong>${payment.client}</strong></div>
        <div class="sig-line">Electronic Clearing Authorization</div>
      </div>
    </div>
  </div>
</body>
</html>`;

    doc.open();
    doc.write(receiptHtml);
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
    switch (payment.status) {
      case 'Succeeded':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Succeeded / Settled
          </span>
        );
      case 'Processing':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/20">
            <Clock className="w-3.5 h-3.5" />
            Processing In Transit
          </span>
        );
      case 'Requires Action':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <AlertCircle className="w-3.5 h-3.5" />
            Requires Action (3DS)
          </span>
        );
      case 'Refunded':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <RotateCcw className="w-3.5 h-3.5" />
            Refunded
          </span>
        );
      case 'Disputed':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <AlertCircle className="w-3.5 h-3.5" />
            Disputed / Chargeback
          </span>
        );
      case 'Failed':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <AlertCircle className="w-3.5 h-3.5" />
            Failed
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className={`w-full max-w-xl h-full flex flex-col border-l shadow-2xl overflow-hidden transition-all ${
          isLight ? 'bg-white border-sky-200' : 'bg-[#0f172a] border-slate-700'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b shrink-0 ${
            isLight ? 'border-sky-100 bg-white/95' : 'border-slate-800 bg-[#0f172a]/95'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800 flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-mono font-bold text-sky-600 dark:text-sky-400 block">
                {payment.paymentNumber}
              </span>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white truncate max-w-[280px]">
                {payment.client}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(payment)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Edit Payment"
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
          {/* Top Amount & Direction Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-500/10 via-sky-400/5 to-transparent border border-sky-200/60 dark:border-sky-800/40 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                {payment.type === 'Inflow / Collection' ? (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                    Inflow Collection
                  </span>
                ) : payment.type === 'Outflow / Refund' ? (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-rose-500 uppercase tracking-wider">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    Refund Disbursed
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-sky-600 uppercase tracking-wider">
                    <Building className="w-3.5 h-3.5" />
                    Bank Payout
                  </span>
                )}
              </div>
              <span className="text-2xl font-black text-slate-900 dark:text-white block">
                {formatMoney(payment.amountFormatted, currency)} {currency.code}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">
                Net Settled: {currency.symbol}{payment.netAmount.toLocaleString('en-US')} (Fee: -{currency.symbol}{payment.feeAmount})
              </span>
            </div>

            <div className="text-right space-y-1.5">
              <div>{getStatusBadge()}</div>
              <span className="text-[11px] text-slate-400 font-mono block">
                TX: {payment.transactionReference}
              </span>
            </div>
          </div>

          {/* Quick Actions Row */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {payment.status !== 'Succeeded' && payment.status !== 'Refunded' && (
                <button
                  onClick={() => onUpdateStatus(payment.id, 'Succeeded')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-xs transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Mark Succeeded</span>
                </button>
              )}

              {payment.status === 'Succeeded' && payment.type === 'Inflow / Collection' && (
                <button
                  onClick={() => onOpenRefund(payment)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Issue Refund</span>
                </button>
              )}
            </div>

            <button
              onClick={handlePrintReceipt}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800 hover:bg-sky-100 dark:hover:bg-sky-900/60 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Receipt</span>
            </button>
          </div>

          {/* Gateway & Clearing Info */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
              Payment Rail & Gateway Details
            </span>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                  Settlement Gateway
                </span>
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-sky-500" />
                  {payment.gateway}
                </span>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                  Instrument / Method
                </span>
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-sky-500" />
                  {payment.paymentMethod}
                  {payment.cardLast4 ? ` (••••${payment.cardLast4})` : ''}
                </span>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                  Transaction Date
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {payment.date}
                </span>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                  Settled / Cleared
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {payment.settledDate || 'Pending Settlement'}
                </span>
              </div>
            </div>
          </div>

          {/* Linked Invoice & Client Account */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 space-y-2 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Payer Account & Commercial Reference
            </span>
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block text-sm">
                  {payment.client}
                </span>
                {payment.clientEmail && (
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                    {payment.clientEmail}
                  </span>
                )}
              </div>
              <div>
                {payment.invoiceNumber ? (
                  <span className="px-3 py-1 text-[11px] font-bold rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800">
                    Invoice #{payment.invoiceNumber}
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 text-[10px] font-medium rounded-lg bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    Direct Wire / Auto Sweep
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Memo & Notes */}
          {payment.notes && (
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Transaction Memo
              </span>
              <p className="leading-relaxed text-slate-600 dark:text-slate-300">{payment.notes}</p>
            </div>
          )}

          {/* Refund reason if refunded */}
          {payment.refundReason && (
            <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/20 text-xs space-y-1">
              <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider block">
                Refund Justification
              </span>
              <p className="leading-relaxed text-rose-700 dark:text-rose-300">
                {payment.refundReason}
              </p>
            </div>
          )}

          {/* Audit Trail */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Receipt Identifier:</span>
              <span className="font-mono text-slate-600 dark:text-slate-300 font-bold">
                {payment.receiptNumber || 'REC-2025-GEN'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Created Timestamp:</span>
              <span>{new Date(payment.createdAt).toLocaleString()}</span>
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
                  onClick={() => onDelete(payment.id)}
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
                  onClick={() => onEdit(payment)}
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

