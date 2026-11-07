import React, { useState, useEffect } from 'react';
import {
  X,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { EmployeePayrollRecord, PayrollItemStatus } from './payrollMockData';
import { useSystemCurrency } from '../../data/currencyService';

interface AdjustPayModalProps {
  isOpen: boolean;
  record: EmployeePayrollRecord | null;
  onClose: () => void;
  onSave: (updatedRecord: EmployeePayrollRecord) => void;
}

export const AdjustPayModal: React.FC<AdjustPayModalProps> = ({
  isOpen,
  record,
  onClose,
  onSave,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'white-sky';
  const currency = useSystemCurrency();

  const [bonus, setBonus] = useState(0);
  const [reimbursement, setReimbursement] = useState(0);
  const [overtimeHours, setOvertimeHours] = useState(0);
  const [status, setStatus] = useState<PayrollItemStatus>('Pending');

  useEffect(() => {
    if (record) {
      setBonus(record.bonus);
      setReimbursement(record.reimbursement);
      setOvertimeHours(record.overtimeHours);
      setStatus(record.status);
    }
  }, [record]);

  if (!isOpen || !record) return null;

  const hourlyRate = Math.round(record.baseGross / (record.payFrequency === 'Monthly' ? 160 : 80));
  const calculatedOvertimePay = overtimeHours * Math.round(hourlyRate * 1.5);
  const updatedTotalGross = record.baseGross + bonus + reimbursement + calculatedOvertimePay;
  
  // Re-estimate deductions if W-2
  const isContractor = record.employmentType === 'Contractor';
  const federalTax = isContractor ? 0 : Math.round(updatedTotalGross * 0.128);
  const stateTax = isContractor ? 0 : Math.round(updatedTotalGross * 0.054);
  const ficaTax = isContractor ? 0 : Math.round(updatedTotalGross * 0.062);
  const medicareTax = isContractor ? 0 : Math.round(updatedTotalGross * 0.0145);
  const healthBenefit = record.healthBenefit;
  const retirement401k = isContractor ? 0 : Math.round(updatedTotalGross * 0.04);
  const totalDeductions = federalTax + stateTax + ficaTax + medicareTax + healthBenefit + retirement401k;
  const calculatedNetPay = updatedTotalGross - totalDeductions;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: EmployeePayrollRecord = {
      ...record,
      bonus,
      reimbursement,
      overtimeHours,
      overtimePay: calculatedOvertimePay,
      totalGross: updatedTotalGross,
      federalTax,
      stateTax,
      ficaTax,
      medicareTax,
      retirement401k,
      totalDeductions,
      netPay: calculatedNetPay,
      status,
    };
    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div
        className={`relative w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden my-6 transition-all ${
          isLight
            ? 'bg-white border-sky-200 text-slate-800'
            : 'bg-[#0f172a] border-slate-700 text-slate-100'
        }`}
      >
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${
            isLight ? 'bg-sky-50/70 border-sky-100' : 'bg-slate-900/80 border-slate-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Adjust Compensation & Incentives
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {record.name} • {record.role} ({record.department})
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Base Salary Info */}
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
              isLight ? 'bg-sky-50/50 border-sky-100' : 'bg-slate-800/40 border-slate-800'
            }`}
          >
            <div>
              <span className="text-slate-400 block text-[11px]">Regular Base Salary</span>
              <span className="font-bold text-slate-900 dark:text-white text-sm">
                {currency.symbol}{record.baseGross.toLocaleString()}
              </span>
              <span className="text-slate-400 ml-1">/ {record.payFrequency.toLowerCase()}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block text-[11px]">Calculated Hourly Equivalent</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                ~{currency.symbol}{hourlyRate}/hr
              </span>
            </div>
          </div>

          {/* Overtime Hours */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Overtime Hours (1.5x Base Rate)</span>
              {overtimeHours > 0 && (
                <span className="text-emerald-500 font-semibold">+{currency.symbol}{calculatedOvertimePay.toLocaleString()}</span>
              )}
            </label>
            <input
              type="number"
              min="0"
              max="60"
              value={overtimeHours}
              onChange={(e) => setOvertimeHours(Math.max(0, parseInt(e.target.value) || 0))}
              className={`w-full text-xs font-medium px-3 py-2.5 rounded-xl border focus:outline-hidden focus:ring-2 focus:ring-sky-500 ${
                isLight
                  ? 'bg-white border-slate-200 text-slate-800'
                  : 'bg-slate-800/80 border-slate-700 text-slate-100'
              }`}
            />
          </div>

          {/* Performance Bonus */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Performance Bonus / Commission ({currency.symbol})
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">{currency.symbol}</span>
              <input
                type="number"
                min="0"
                step="50"
                value={bonus}
                onChange={(e) => setBonus(Math.max(0, parseFloat(e.target.value) || 0))}
                className={`w-full text-xs font-medium pl-7 pr-3 py-2.5 rounded-xl border focus:outline-hidden focus:ring-2 focus:ring-sky-500 ${
                  isLight
                    ? 'bg-white border-slate-200 text-slate-800'
                    : 'bg-slate-800/80 border-slate-700 text-slate-100'
                }`}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Reimbursement */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Tax-Free Expense Reimbursement ({currency.symbol})
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">{currency.symbol}</span>
              <input
                type="number"
                min="0"
                step="10"
                value={reimbursement}
                onChange={(e) => setReimbursement(Math.max(0, parseFloat(e.target.value) || 0))}
                className={`w-full text-xs font-medium pl-7 pr-3 py-2.5 rounded-xl border focus:outline-hidden focus:ring-2 focus:ring-sky-500 ${
                  isLight
                    ? 'bg-white border-slate-200 text-slate-800'
                    : 'bg-slate-800/80 border-slate-700 text-slate-100'
                }`}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Status Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Disbursement Authorization Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as PayrollItemStatus)}
              className={`w-full text-xs font-medium px-3 py-2.5 rounded-xl border focus:outline-hidden focus:ring-2 focus:ring-sky-500 ${
                isLight
                  ? 'bg-white border-slate-200 text-slate-800'
                  : 'bg-slate-800/80 border-slate-700 text-slate-100'
              }`}
            >
              <option value="Pending">Pending (Scheduled for next batch pay run)</option>
              <option value="Paid">Paid (Already disbursed / Wire confirmed)</option>
              <option value="On Hold">On Hold (Hold payment for verification)</option>
            </select>
          </div>

          {/* Live Preview of Net Pay */}
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between ${
              isLight
                ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                : 'bg-emerald-950/20 border-emerald-900/60 text-emerald-200'
            }`}
          >
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Estimated Net Payout
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Gross: {currency.symbol}{updatedTotalGross.toLocaleString()} • Deductions: -{currency.symbol}{totalDeductions.toLocaleString()}
              </p>
            </div>
            <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {currency.symbol}{calculatedNetPay.toLocaleString()}
            </span>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
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
              className="px-5 py-2 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-600 text-white shadow-xs transition-colors"
            >
              Save Adjustments
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

