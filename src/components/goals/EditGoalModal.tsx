import React, { useState, useEffect } from 'react';
import { Target, X, Check, DollarSign, TrendingUp, Sparkles, AlertCircle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useRevenueGoal, formatCurrency, formatCompact } from '../../data/revenueGoalService';
import { useSystemCurrency } from '../../data/currencyService';

interface EditGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (newGoal: number) => void;
}

export const EditGoalModal: React.FC<EditGoalModalProps> = ({ isOpen, onClose, onSaved }) => {
  const { theme } = useTheme();
  const isLight = theme === 'white-sky';
  const { annualGoal, updateGoal, current } = useRevenueGoal();
  const { currency } = useSystemCurrency();

  const PRESET_GOALS = [
    { label: `${currency.symbol}500k`, value: 500000, mrr: `${currency.symbol}41.7k/mo` },
    { label: `${currency.symbol}1M`, value: 1000000, mrr: `${currency.symbol}83.3k/mo` },
    { label: `${currency.symbol}2M`, value: 2000000, mrr: `${currency.symbol}166.7k/mo` },
    { label: `${currency.symbol}5M`, value: 5000000, mrr: `${currency.symbol}416.7k/mo` },
    { label: `${currency.symbol}10M`, value: 10000000, mrr: `${currency.symbol}833.3k/mo` },
    { label: `${currency.symbol}25M`, value: 25000000, mrr: `${currency.symbol}2.08M/mo` },
    { label: `${currency.symbol}50M`, value: 50000000, mrr: `${currency.symbol}4.17M/mo` },
    { label: `${currency.symbol}100M`, value: 100000000, mrr: `${currency.symbol}8.33M/mo` },
  ];

  const [inputArr, setInputArr] = useState<string>(String(annualGoal));
  const [inputMrr, setInputMrr] = useState<string>(String(Math.round(annualGoal / 12)));
  const [activePreset, setActivePreset] = useState<number | null>(annualGoal);

  useEffect(() => {
    if (isOpen) {
      setInputArr(String(annualGoal));
      setInputMrr(String(Math.round(annualGoal / 12)));
      setActivePreset(annualGoal);
    }
  }, [isOpen, annualGoal]);

  if (!isOpen) return null;

  const handleArrChange = (valStr: string) => {
    const cleanNum = Number(valStr.replace(/[^0-9]/g, '')) || 0;
    setInputArr(cleanNum ? String(cleanNum) : '');
    setInputMrr(cleanNum ? String(Math.round(cleanNum / 12)) : '');
    setActivePreset(null);
  };

  const handleMrrChange = (valStr: string) => {
    const cleanNum = Number(valStr.replace(/[^0-9]/g, '')) || 0;
    setInputMrr(cleanNum ? String(cleanNum) : '');
    setInputArr(cleanNum ? String(cleanNum * 12) : '');
    setActivePreset(null);
  };

  const handleSelectPreset = (val: number) => {
    setInputArr(String(val));
    setInputMrr(String(Math.round(val / 12)));
    setActivePreset(val);
  };

  const numArr = Number(inputArr) || 0;
  const numMrr = Number(inputMrr) || 0;
  const isValid = numArr >= 1000;

  const currentAchieved = current || 215420;
  const previewPercentage = isValid
    ? Math.min(100, Math.round((currentAchieved / numArr) * 10000) / 100)
    : 0;
  const previewRemaining = isValid ? Math.max(0, numArr - currentAchieved) : 0;
  const previewDaily = isValid ? Math.round(numArr / 365) : 0;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    updateGoal(numArr);
    onSaved?.(numArr);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
      <div
        className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden transition-all ${
          isLight
            ? 'bg-white border-sky-100 text-slate-800'
            : 'bg-slate-900 border-slate-800 text-white'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-sky-100/30 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold tracking-tight">Set Revenue Target & Goal</h3>
              <p className="text-xs text-slate-400">
                Adjust Annual Run-Rate (ARR) and Monthly Recurring (MRR) targets
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

        <form onSubmit={handleSave} className="p-6 space-y-5">
          {/* Quick Presets */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2 flex items-center justify-between">
              <span>Quick Presets</span>
              <span className="text-[10px] text-sky-500 font-medium lowercase">1-click select</span>
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
              {PRESET_GOALS.map((p) => {
                const selected = activePreset === p.value || numArr === p.value;
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => handleSelectPreset(p.value)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold transition-all text-center flex flex-col items-center justify-center border ${
                      selected
                        ? 'bg-sky-500 text-white border-sky-500 shadow-sm shadow-sky-500/25 scale-102'
                        : isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-sky-50 hover:border-sky-300'
                        : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-sky-500/50'
                    }`}
                  >
                    <span>{p.label}</span>
                    <span
                      className={`text-[9px] font-normal truncate mt-0.5 ${
                        selected ? 'text-sky-100' : 'text-slate-400'
                      }`}
                    >
                      {p.mrr.replace('/mo', '')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target Inputs: ARR & MRR */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Annual ARR Goal */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Annual ARR Target ({currency.code})
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                  {currency.symbol}
                </span>
                <input
                  type="text"
                  value={inputArr ? Number(inputArr).toLocaleString('en-US') : ''}
                  onChange={(e) => handleArrChange(e.target.value)}
                  placeholder="e.g. 1,000,000"
                  className={`w-full pl-8 pr-3 py-2.5 rounded-xl border text-sm font-black tabular-nums transition-all outline-none ${
                    isLight
                      ? 'bg-slate-50 border-slate-200 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'
                      : 'bg-slate-800/80 border-slate-700 focus:bg-slate-900 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20'
                  }`}
                />
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">
                Full year revenue mandate ({formatCompact(numArr)})
              </span>
            </div>

            {/* Monthly MRR Goal */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Monthly MRR Target ({currency.code})
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                  {currency.symbol}
                </span>
                <input
                  type="text"
                  value={inputMrr ? Number(inputMrr).toLocaleString('en-US') : ''}
                  onChange={(e) => handleMrrChange(e.target.value)}
                  placeholder="e.g. 83,333"
                  className={`w-full pl-8 pr-3 py-2.5 rounded-xl border text-sm font-black tabular-nums transition-all outline-none ${
                    isLight
                      ? 'bg-slate-50 border-slate-200 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'
                      : 'bg-slate-800/80 border-slate-700 focus:bg-slate-900 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20'
                  }`}
                />
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">
                Pacing velocity per month ({formatCompact(numMrr)}/mo)
              </span>
            </div>
          </div>

          {/* Live Impact Preview Box */}
          <div
            className={`p-4 rounded-xl border ${
              isLight ? 'bg-sky-50/60 border-sky-100' : 'bg-slate-800/50 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-3">
              <span className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Live Projected Goal Impact</span>
              </span>
              <span className="text-xs font-black tabular-nums text-sky-500">
                {previewPercentage}% Achieved
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div
                className={`p-2.5 rounded-lg border ${
                  isLight ? 'bg-white border-sky-100' : 'bg-slate-900/80 border-slate-700/60'
                }`}
              >
                <span className="text-[10px] text-slate-400 block uppercase font-medium">
                  Monthly Target
                </span>
                <span className="text-xs font-extrabold text-slate-800 dark:text-white tabular-nums block mt-0.5">
                  {formatCurrency(numMrr)}
                </span>
              </div>

              <div
                className={`p-2.5 rounded-lg border ${
                  isLight ? 'bg-white border-sky-100' : 'bg-slate-900/80 border-slate-700/60'
                }`}
              >
                <span className="text-[10px] text-slate-400 block uppercase font-medium">
                  Remaining Gap
                </span>
                <span className="text-xs font-extrabold text-sky-600 dark:text-sky-400 tabular-nums block mt-0.5">
                  {formatCurrency(previewRemaining)}
                </span>
              </div>

              <div
                className={`p-2.5 rounded-lg border ${
                  isLight ? 'bg-white border-sky-100' : 'bg-slate-900/80 border-slate-700/60'
                }`}
              >
                <span className="text-[10px] text-slate-400 block uppercase font-medium">
                  Daily Pacing
                </span>
                <span className="text-xs font-extrabold text-slate-800 dark:text-white tabular-nums block mt-0.5">
                  {formatCurrency(previewDaily)} / day
                </span>
              </div>
            </div>

            <div className="mt-3 w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-sky-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${previewPercentage}%` }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-sky-100/30 dark:border-slate-800">
            <button
              type="button"
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
              type="submit"
              disabled={!isValid}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-sky-500 hover:bg-sky-600 shadow-md shadow-sky-500/25 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply & Save Goal</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

