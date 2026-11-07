import React from 'react';
import {
  X,
  Download,
  Printer,
  Building2,
  Calendar,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  Briefcase,
  FileText,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { EmployeePayrollRecord } from './payrollMockData';
import { useSystemCurrency } from '../../data/currencyService';

interface PaystubModalProps {
  isOpen: boolean;
  record: EmployeePayrollRecord | null;
  onClose: () => void;
  onDownload: (employeeName: string) => void;
}

export const PaystubModal: React.FC<PaystubModalProps> = ({
  isOpen,
  record,
  onClose,
  onDownload,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'white-sky';
  const currency = useSystemCurrency();

  if (!isOpen || !record) return null;

  // Approximate YTD calculations (assuming 21 pay periods YTD in November)
  const ytdMultiplier = 21;
  const ytdGross = Math.round(record.totalGross * ytdMultiplier);
  const ytdFederal = Math.round(record.federalTax * ytdMultiplier);
  const ytdState = Math.round(record.stateTax * ytdMultiplier);
  const ytdFica = Math.round(record.ficaTax * ytdMultiplier);
  const ytdMedicare = Math.round(record.medicareTax * ytdMultiplier);
  const ytd401k = Math.round(record.retirement401k * ytdMultiplier);
  const ytdNet = Math.round(record.netPay * ytdMultiplier);

  // Employer contributions for this period
  const employerFica = record.ficaTax;
  const employerMedicare = record.medicareTax;
  const employer401kMatch = record.retirement401k;
  const employerHealth = Math.round(record.healthBenefit * 2.2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div
        className={`relative w-full max-w-3xl rounded-2xl border shadow-2xl overflow-hidden my-6 transition-all ${
          isLight
            ? 'bg-white border-sky-200 text-slate-800'
            : 'bg-[#0b1329] border-slate-700 text-slate-100'
        }`}
      >
        {/* Top Header Actions Bar */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${
            isLight ? 'bg-sky-50/70 border-sky-100' : 'bg-slate-900/80 border-slate-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Official E-Paystub & Earnings Statement
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pay Statement ID: {record.id.toUpperCase()} • Generated for {record.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onDownload(record.name)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-500 hover:bg-sky-600 text-white shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={() => window.print()}
              className={`p-2 rounded-lg border text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                isLight ? 'border-slate-200' : 'border-slate-700'
              }`}
              title="Print Paystub"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable / Viewable Paystub Body */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Company & Statement Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-dashed border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-sky-500 flex items-center justify-center text-white font-extrabold text-sm shadow-xs">
                  O
                </div>
                <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                  Ozostack Inc.
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                500 Howard Street, Suite 400<br />
                San Francisco, CA 94105 • USA<br />
                EIN: 94-3829104
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Direct Deposit Processed
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pay Date: <span className="font-semibold text-slate-700 dark:text-slate-200">{record.payDate}</span>
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pay Period: <span className="font-semibold text-slate-700 dark:text-slate-200">Nov 01, 2026 – Nov 15, 2026</span>
              </p>
            </div>
          </div>

          {/* Employee & Bank Deposit Summary Grid */}
          <div
            className={`grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl border ${
              isLight ? 'bg-sky-50/40 border-sky-100' : 'bg-slate-900/60 border-slate-800'
            }`}
          >
            <div>
              <p className="text-[11px] uppercase font-semibold text-slate-400 dark:text-slate-500">Employee</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{record.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{record.role}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase font-semibold text-slate-400 dark:text-slate-500">Department</p>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{record.department}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{record.employmentType}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase font-semibold text-slate-400 dark:text-slate-500">Employee ID / SSN</p>
              <p className="text-sm font-mono font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                {record.employeeId.toUpperCase()}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{record.ssnMasked}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase font-semibold text-slate-400 dark:text-slate-500">Disbursement</p>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{record.paymentMethod}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">Acct •••• {record.bankAccountLast4}</p>
            </div>
          </div>

          {/* Dual Column: Earnings vs Deductions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Earnings Section */}
            <div
              className={`rounded-xl border overflow-hidden ${
                isLight ? 'border-slate-200' : 'border-slate-800'
              }`}
            >
              <div
                className={`px-4 py-2.5 font-bold text-xs uppercase tracking-wider flex justify-between items-center ${
                  isLight ? 'bg-slate-100 text-slate-700' : 'bg-slate-800/90 text-slate-300'
                }`}
              >
                <span>Earnings Description</span>
                <span>Current ({currency.symbol})</span>
              </div>
              <div className="p-4 space-y-2.5 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/60">
                  <span className="text-slate-600 dark:text-slate-400">Regular Salary ({record.regularHours} hrs)</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{currency.symbol}{record.baseGross.toLocaleString()}</span>
                </div>
                {record.overtimePay > 0 && (
                  <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/60">
                    <span className="text-slate-600 dark:text-slate-400">Overtime Pay ({record.overtimeHours} hrs @ 1.5x)</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">+{currency.symbol}{record.overtimePay.toLocaleString()}</span>
                  </div>
                )}
                {record.bonus > 0 && (
                  <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/60">
                    <span className="text-slate-600 dark:text-slate-400">Performance Incentive / Bonus</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">+{currency.symbol}{record.bonus.toLocaleString()}</span>
                  </div>
                )}
                {record.reimbursement > 0 && (
                  <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/60">
                    <span className="text-slate-600 dark:text-slate-400">Non-Taxable Expense Reimbursement</span>
                    <span className="font-semibold text-sky-600 dark:text-sky-400">+{currency.symbol}{record.reimbursement.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 font-bold text-sm text-slate-900 dark:text-white">
                  <span>Total Gross Earnings</span>
                  <span>{currency.symbol}{record.totalGross.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Deductions Section */}
            <div
              className={`rounded-xl border overflow-hidden ${
                isLight ? 'border-slate-200' : 'border-slate-800'
              }`}
            >
              <div
                className={`px-4 py-2.5 font-bold text-xs uppercase tracking-wider flex justify-between items-center ${
                  isLight ? 'bg-slate-100 text-slate-700' : 'bg-slate-800/90 text-slate-300'
                }`}
              >
                <span>Statutory & Pre-Tax Deductions</span>
                <span>Current ({currency.symbol})</span>
              </div>
              <div className="p-4 space-y-2.5 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/60">
                  <span className="text-slate-600 dark:text-slate-400">Federal Withholding (FIT)</span>
                  <span className="font-semibold text-rose-500">-{currency.symbol}{record.federalTax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/60">
                  <span className="text-slate-600 dark:text-slate-400">Social Security (FICA / OASDI)</span>
                  <span className="font-semibold text-rose-500">-{currency.symbol}{record.ficaTax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/60">
                  <span className="text-slate-600 dark:text-slate-400">Medicare Withholding</span>
                  <span className="font-semibold text-rose-500">-{currency.symbol}{record.medicareTax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/60">
                  <span className="text-slate-600 dark:text-slate-400">State Income Tax (SIT)</span>
                  <span className="font-semibold text-rose-500">-{currency.symbol}{record.stateTax.toLocaleString()}</span>
                </div>
                {record.healthBenefit > 0 && (
                  <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/60">
                    <span className="text-slate-600 dark:text-slate-400">Health & Dental Insurance (Pre-Tax)</span>
                    <span className="font-semibold text-rose-500">-{currency.symbol}{record.healthBenefit.toLocaleString()}</span>
                  </div>
                )}
                {record.retirement401k > 0 && (
                  <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/60">
                    <span className="text-slate-600 dark:text-slate-400">401(k) Retirement Contribution</span>
                    <span className="font-semibold text-rose-500">-{currency.symbol}{record.retirement401k.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 font-bold text-sm text-slate-900 dark:text-white">
                  <span>Total Deductions</span>
                  <span className="text-rose-600 dark:text-rose-400">-{currency.symbol}{record.totalDeductions.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* NET PAY HIGHLIGHT CALLOUT */}
          <div
            className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
              isLight
                ? 'bg-gradient-to-r from-emerald-50 via-teal-50/50 to-white border-emerald-200'
                : 'bg-gradient-to-r from-emerald-950/40 via-teal-950/20 to-slate-900 border-emerald-800/60'
            }`}
          >
            <div>
              <p className="text-xs uppercase font-extrabold tracking-wider text-emerald-600 dark:text-emerald-400">
                Net Pay Disbursed (Take-Home Pay)
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Directly transferred via Automated Clearing House (ACH) to {record.bankAccountLast4}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
                {currency.symbol}{record.netPay.toLocaleString()}
              </span>
              <span className="text-xs font-semibold text-slate-400 ml-1.5">{currency.code}</span>
            </div>
          </div>

          {/* Employer Contributions & Benefits */}
          <div
            className={`p-4 rounded-xl border text-xs ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
            }`}
          >
            <p className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Employer Paid Benefits & Contributions (Company Funded - Non-Taxable to Employee)
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-600 dark:text-slate-400">
              <div>
                <span className="block text-[11px] text-slate-400">FICA Match (6.2%)</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{currency.symbol}{employerFica.toLocaleString()}</span>
              </div>
              <div>
                <span className="block text-[11px] text-slate-400">Medicare Match (1.45%)</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{currency.symbol}{employerMedicare.toLocaleString()}</span>
              </div>
              <div>
                <span className="block text-[11px] text-slate-400">401(k) Match (4.0%)</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{currency.symbol}{employer401kMatch.toLocaleString()}</span>
              </div>
              <div>
                <span className="block text-[11px] text-slate-400">Healthcare Premium Match</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{currency.symbol}{employerHealth.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Year-To-Date (YTD) Summary Row */}
          <div
            className={`p-4 rounded-xl border text-xs ${
              isLight ? 'bg-sky-50/50 border-sky-100' : 'bg-slate-800/40 border-slate-800'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-slate-400 block text-[11px]">YTD Gross Earnings</span>
                <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                  {currency.symbol}{ytdGross.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">YTD Federal Tax</span>
                <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                  {currency.symbol}{ytdFederal.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">YTD State Tax</span>
                <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                  {currency.symbol}{ytdState.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">YTD 401(k)</span>
                <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                  {currency.symbol}{ytd401k.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">YTD Net Disbursed</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                  {currency.symbol}{ytdNet.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Verification Footer Note */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Cryptographically verified & compliant with IRS Form W-2 / California EDD standards
            </span>
            <span>Generated on Nov 05, 2026</span>
          </div>
        </div>
      </div>
    </div>
  );
};

