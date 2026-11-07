import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  Building,
  DollarSign,
  Receipt,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useSystemCurrency } from '../../data/currencyService';
import {
  PaymentTransaction,
  PaymentType,
  PaymentStatus,
  PaymentMethodType,
  PaymentGatewayKey,
} from '../../types/crm';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payment: PaymentTransaction) => void;
  initialData?: PaymentTransaction | null;
}

const CLIENT_OPTIONS = [
  { name: 'FinEdge Systems', email: 'procurement@finedgesystems.com', invoice: 'INV-2025-134' },
  { name: 'TechVision Inc.', email: 'billing@techvision.com', invoice: 'INV-2025-132' },
  { name: 'CloudNest AI', email: 'finance@cloudnest.ai', invoice: 'INV-2025-131' },
  { name: 'SwiftRetail Global', email: 'accounts@swiftretail.com', invoice: 'INV-2025-130' },
  { name: 'Gulf Cloud Services', email: 'treasury@gulfcloud.ae', invoice: 'INV-2025-129' },
  { name: 'DLF Limited', email: 'facilities@dlf.in', invoice: 'INV-2025-128' },
  { name: 'Healthcare Plus', email: 'billing@healthcareplus.org', invoice: 'INV-2025-127' },
  { name: 'GreenLeaf Dining', email: 'contact@greenleafdining.com', invoice: 'INV-2025-126' },
  { name: 'Mahindra Housing', email: 'procurement@mahindrahousing.in', invoice: 'INV-2025-125' },
];

const GATEWAYS: PaymentGatewayKey[] = [
  'Stripe',
  'Chase Commercial',
  'Silicon Valley Bank',
  'PayPal Business',
  'Coinbase Prime',
];

const PAYMENT_METHODS: PaymentMethodType[] = [
  'Credit Card',
  'Wire / SWIFT',
  'ACH Direct Debit',
  'Stripe Connect',
  'PayPal',
  'Crypto (USDC)',
];

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'white-sky';
  const sysCurrency = useSystemCurrency();

  const [client, setClient] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [paymentType, setPaymentType] = useState<PaymentType>('Inflow / Collection');
  const [amount, setAmount] = useState<number | ''>('');
  const [currency, setCurrency] = useState<'USD' | 'EUR' | 'GBP' | 'AED' | 'INR'>((sysCurrency.code as any) || 'USD');
  const [gateway, setGateway] = useState<PaymentGatewayKey>('Chase Commercial');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('Wire / SWIFT');
  const [status, setStatus] = useState<PaymentStatus>('Succeeded');
  const [date, setDate] = useState('2025-05-20');
  const [cardBrand, setCardBrand] = useState<'Visa' | 'Mastercard' | 'Amex'>('Visa');
  const [cardLast4, setCardLast4] = useState('4242');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Auto calculate fee estimate based on gateway
  const numAmount = Number(amount) || 0;
  const estimatedFee =
    gateway === 'Stripe'
      ? Math.round((numAmount * 0.029 + 0.3) * 100) / 100
      : gateway === 'Chase Commercial'
      ? 15.0
      : gateway === 'Silicon Valley Bank'
      ? Math.min(5.0, Math.round(numAmount * 0.008 * 100) / 100)
      : gateway === 'PayPal Business'
      ? Math.round((numAmount * 0.0349 + 0.49) * 100) / 100
      : Math.round(numAmount * 0.005 * 100) / 100;

  const netAmount = Math.max(0, numAmount - estimatedFee);

  useEffect(() => {
    if (initialData) {
      setClient(initialData.client || '');
      setClientEmail(initialData.clientEmail || '');
      setInvoiceNumber(initialData.invoiceNumber || '');
      setPaymentType(initialData.type || 'Inflow / Collection');
      setAmount(initialData.amount || '');
      setCurrency(initialData.currency || 'USD');
      setGateway(initialData.gateway || 'Chase Commercial');
      setPaymentMethod(initialData.paymentMethod || 'Wire / SWIFT');
      setStatus(initialData.status || 'Succeeded');
      setDate(initialData.date || '2025-05-20');
      setCardBrand(initialData.cardBrand || 'Visa');
      setCardLast4(initialData.cardLast4 || '4242');
      setNotes(initialData.notes || '');
    } else {
      setClient(CLIENT_OPTIONS[0].name);
      setClientEmail(CLIENT_OPTIONS[0].email);
      setInvoiceNumber(CLIENT_OPTIONS[0].invoice);
      setPaymentType('Inflow / Collection');
      setAmount('');
      setCurrency((sysCurrency.code as any) || 'USD');
      setGateway('Chase Commercial');
      setPaymentMethod('Wire / SWIFT');
      setStatus('Succeeded');
      setDate('2025-05-20');
      setCardBrand('Visa');
      setCardLast4('4242');
      setNotes('');
    }
    setErrorMsg('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleClientSelect = (clientName: string) => {
    setClient(clientName);
    const found = CLIENT_OPTIONS.find((c) => c.name === clientName);
    if (found) {
      setClientEmail(found.email);
      setInvoiceNumber(found.invoice);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!client.trim()) {
      setErrorMsg('Please specify client / account name.');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setErrorMsg(`Please enter a valid amount greater than ${sysCurrency.symbol}0.`);
      return;
    }

    const valAmount = Number(amount);
    const isCard = paymentMethod === 'Credit Card' || paymentMethod === 'Stripe Connect';

    const transaction: PaymentTransaction = {
      id: initialData?.id || `pay-${Date.now()}`,
      paymentNumber:
        initialData?.paymentNumber ||
        `PAY-2025-${Math.floor(145 + Math.random() * 50)}`,
      transactionReference:
        initialData?.transactionReference ||
        (gateway === 'Stripe'
          ? `ch_${Math.random().toString(36).substring(2, 12)}`
          : `wire_${Math.random().toString(36).substring(2, 10)}`),
      type: paymentType,
      client: client.trim(),
      clientEmail: clientEmail.trim() || undefined,
      invoiceNumber: invoiceNumber.trim() || undefined,
      amount: valAmount,
      amountFormatted: `$${valAmount.toLocaleString('en-US')}`,
      feeAmount: estimatedFee,
      netAmount: paymentType === 'Outflow / Refund' ? -valAmount : netAmount,
      currency,
      status,
      paymentMethod,
      gateway,
      cardBrand: isCard ? cardBrand : undefined,
      cardLast4: isCard ? cardLast4 : undefined,
      date,
      settledDate: status === 'Succeeded' ? date : undefined,
      receiptNumber: `REC-2025-${Math.floor(885 + Math.random() * 50)}`,
      notes: notes.trim() || undefined,
      createdAt: initialData?.createdAt || new Date().toISOString(),
    };

    onSave(transaction);
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
              {initialData ? `Edit Payment: ${initialData.paymentNumber}` : 'Record / Collect Payment'}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Manual bank wire settlement, Stripe card processing, and invoice reconciliations
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

          {/* Payment Type Selection Pills */}
          <div>
            <label className={labelClass}>Payment Direction / Transaction Type *</label>
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-xs font-bold">
              {(
                ['Inflow / Collection', 'Outflow / Refund', 'Payout / Settlement'] as PaymentType[]
              ).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setPaymentType(t)}
                  className={`py-1.5 px-2 rounded-lg text-center transition-all ${
                    paymentType === t
                      ? 'bg-white dark:bg-sky-600 text-sky-600 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Client & Linked Invoice */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Client Account / Payer *</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  list="client-options"
                  placeholder="Select or enter client name..."
                  value={client}
                  onChange={(e) => handleClientSelect(e.target.value)}
                  className={inputClass}
                />
                <datalist id="client-options">
                  {CLIENT_OPTIONS.map((c) => (
                    <option key={c.name} value={c.name} />
                  ))}
                </datalist>
              </div>
            </div>

            <div>
              <label className={labelClass}>Client Email</label>
              <input
                type="email"
                placeholder="billing@client.com"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* Invoice Reference & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>Linked Invoice #</label>
              <input
                type="text"
                placeholder="e.g. INV-2025-134"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Gross Amount *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">{sysCurrency.symbol}</span>
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
              <label className={labelClass}>Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as any)}
                className={inputClass}
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="AED">AED (د.إ)</option>
                <option value="INR">INR (₹)</option>
              </select>
            </div>
          </div>

          {/* Gateway & Payment Rail */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Settlement Gateway / Clearing House *</label>
              <select
                value={gateway}
                onChange={(e) => setGateway(e.target.value as PaymentGatewayKey)}
                className={inputClass}
              >
                {GATEWAYS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Payment Instrument / Method *</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethodType)}
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

          {/* Card fields if card */}
          {(paymentMethod === 'Credit Card' || paymentMethod === 'Stripe Connect') && (
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className={labelClass}>Card Network</label>
                <select
                  value={cardBrand}
                  onChange={(e) => setCardBrand(e.target.value as any)}
                  className={inputClass}
                >
                  <option value="Visa">Visa</option>
                  <option value="Mastercard">Mastercard</option>
                  <option value="Amex">American Express</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Last 4 Digits</label>
                <input
                  type="text"
                  maxLength={4}
                  placeholder="4242"
                  value={cardLast4}
                  onChange={(e) => setCardLast4(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className={inputClass}
                />
              </div>
            </div>
          )}

          {/* Status & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Transaction Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PaymentStatus)}
                className={inputClass}
              >
                <option value="Succeeded">Succeeded (Settled)</option>
                <option value="Processing">Processing (In Transit)</option>
                <option value="Requires Action">Requires Action / 3DS</option>
                <option value="Failed">Failed</option>
                <option value="Refunded">Refunded</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Transaction Date *</label>
                <button
                  type="button"
                  onClick={() => setDate(new Date().toISOString().split('T')[0])}
                  className="text-[10px] font-bold text-sky-600 dark:text-sky-400 hover:underline"
                >
                  Set Today
                </button>
              </div>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* Fee & Net Calculation Card */}
          <div className="p-3.5 rounded-xl border border-sky-200 dark:border-slate-800 bg-sky-50/50 dark:bg-slate-900/60 grid grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Gross Transaction</span>
              <span className="font-bold text-slate-800 dark:text-slate-100">
                {sysCurrency.symbol}{numAmount.toLocaleString('en-US')}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Est. Gateway Fee</span>
              <span className="font-bold text-slate-800 dark:text-slate-100">
                -{sysCurrency.symbol}{estimatedFee.toLocaleString('en-US')}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 block">
                Net Settled Amount
              </span>
              <span className="font-black text-sm text-sky-700 dark:text-sky-300">
                {sysCurrency.symbol}{netAmount.toLocaleString('en-US')}
              </span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className={labelClass}>Payment Memo & Reconciliation Notes</label>
            <textarea
              rows={2}
              placeholder="e.g. Wire transfer confirmation received via Chase Commercial banking webhook."
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
              <span>{initialData ? 'Save Changes' : 'Record Payment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

