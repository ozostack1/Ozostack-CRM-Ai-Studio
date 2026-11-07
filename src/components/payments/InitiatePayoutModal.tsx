import React, { useState } from 'react';
import { X, Send, Building, ShieldCheck, AlertCircle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { BankPayout } from '../../types/crm';
import { useSystemCurrency } from '../../data/currencyService';

interface InitiatePayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInitiate: (payout: BankPayout) => void;
}

const DESTINATION_BANKS = [
  {
    name: 'Chase Commercial Operating (••••8291)',
    accountName: 'Ozostack Technologies Inc.',
    routing: '121000358',
    currency: 'USD',
  },
  {
    name: 'Silicon Valley Bank (SVB) Operating (••••1144)',
    accountName: 'Ozostack Technologies Inc.',
    routing: '121140399',
    currency: 'USD',
  },
  {
    name: 'Emirates NBD Global Treasury (••••9920)',
    accountName: 'Ozostack International FZE',
    routing: 'EBITAEAD',
    currency: 'USD',
  },
];

export const InitiatePayoutModal: React.FC<InitiatePayoutModalProps> = ({
  isOpen,
  onClose,
  onInitiate,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'white-sky';
  const currency = useSystemCurrency();

  const [bankIndex, setBankIndex] = useState(0);
  const [amount, setAmount] = useState<number | ''>(35000);
  const [speed, setSpeed] = useState<'Same-Day Fedwire' | 'Next-Day ACH' | 'Instant RTP'>('Same-Day Fedwire');
  const [memo, setMemo] = useState('Weekly treasury liquidity sweep to corporate operating account');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const selectedBank = DESTINATION_BANKS[bankIndex];
  const numAmount = Number(amount) || 0;
  const wireFee = speed === 'Same-Day Fedwire' ? 15 : speed === 'Instant RTP' ? 5 : 0;
  const netDisbursement = Math.max(0, numAmount - wireFee);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!numAmount || numAmount <= 0) {
      setErrorMsg('Please specify a valid sweep amount.');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    const newPayout: BankPayout = {
      id: `po-${Date.now()}`,
      payoutNumber: `PO-2025-0${Math.floor(35 + Math.random() * 30)}`,
      destinationBank: selectedBank.name,
      bankAccountName: selectedBank.accountName,
      routingNumber: selectedBank.routing,
      grossAmount: numAmount,
      fee: wireFee,
      netDisbursement,
      currency: selectedBank.currency,
      status: 'In Transit',
      initiationDate: today,
      estimatedArrival: speed === 'Instant RTP' ? 'Instant (within 5 mins)' : speed === 'Same-Day Fedwire' ? today : tomorrow,
      batchTransactionCount: Math.floor(4 + Math.random() * 12),
    };

    onInitiate(newPayout);
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
              <Building className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Initiate Treasury Bank Sweep
              </h3>
              <p className="text-[11px] text-slate-500">
                Disburse settled gateway collections to corporate depository accounts
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

          <div>
            <label className={labelClass}>Destination Depository Account *</label>
            <select
              value={bankIndex}
              onChange={(e) => setBankIndex(Number(e.target.value))}
              className={inputClass}
            >
              {DESTINATION_BANKS.map((b, idx) => (
                <option key={b.name} value={idx}>
                  {b.name} — {b.accountName}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Sweep Amount ({currency.symbol} {currency.code}) *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{currency.symbol}</span>
                <input
                  type="number"
                  min="100"
                  step="100"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className={`${inputClass} pl-7`}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Transfer Speed / Rail</label>
              <select
                value={speed}
                onChange={(e) => setSpeed(e.target.value as any)}
                className={inputClass}
              >
                <option value="Same-Day Fedwire">Same-Day Fedwire ({currency.symbol}15 fee)</option>
                <option value="Next-Day ACH">Next-Day ACH ({currency.symbol}0 free)</option>
                <option value="Instant RTP">Instant RTP ({currency.symbol}5 fee)</option>
              </select>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-400">Gross Sweep:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {currency.symbol}{numAmount.toLocaleString('en-US')} {currency.code}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Rail Settlement Fee:</span>
              <span className="text-slate-600 dark:text-slate-300">-{currency.symbol}{wireFee}.00 {currency.code}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-800">
              <span className="font-bold text-sky-600 dark:text-sky-400">Net Depository Credit:</span>
              <span className="font-black text-sm text-sky-700 dark:text-sky-300">
                {currency.symbol}{netDisbursement.toLocaleString('en-US')} {currency.code}
              </span>
            </div>
          </div>

          <div>
            <label className={labelClass}>Internal Memo</label>
            <input
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
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
              <Send className="w-3.5 h-3.5" />
              <span>Confirm & Sweep Funds</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

