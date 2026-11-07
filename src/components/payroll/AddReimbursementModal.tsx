import React, { useState } from 'react';
import {
  X,
  Receipt,
  DollarSign,
  User,
  Calendar,
  FileText,
  Building2,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { ReimbursementClaim, EmployeePayrollRecord } from './payrollMockData';
import { useSystemCurrency } from '../../data/currencyService';

interface AddReimbursementModalProps {
  isOpen: boolean;
  employees: EmployeePayrollRecord[];
  onClose: () => void;
  onSubmit: (claim: ReimbursementClaim) => void;
}

export const AddReimbursementModal: React.FC<AddReimbursementModalProps> = ({
  isOpen,
  employees,
  onClose,
  onSubmit,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'white-sky';
  const currency = useSystemCurrency();

  const [selectedEmpId, setSelectedEmpId] = useState(employees[0]?.employeeId || '');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ReimbursementClaim['category']>('Equipment & Tech');
  const [amount, setAmount] = useState('');
  const [receiptId, setReceiptId] = useState(`REC-2026-${Math.floor(1000 + Math.random() * 9000)}`);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide an expense claim description.');
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError(`Please enter a valid expense amount greater than ${currency.symbol}0.`);
      return;
    }

    const emp = employees.find((e) => e.employeeId === selectedEmpId) || employees[0];

    const newClaim: ReimbursementClaim = {
      id: `reimb-${Date.now()}`,
      employeeId: emp.employeeId,
      employeeName: emp.name,
      avatar: emp.avatar,
      department: emp.department,
      title: title.trim(),
      category,
      amount: parsedAmount,
      submissionDate: new Date().toISOString().split('T')[0],
      status: 'Pending',
      receiptId,
      notes: notes.trim() || 'Submitted via employee self-service reimbursement workflow.',
    };

    onSubmit(newClaim);
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
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Submit Expense & Stipend Claim
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Create a non-taxable expense reimbursement request
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
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-600 dark:text-rose-400 font-medium">
              {error}
            </div>
          )}

          {/* Employee Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Select Team Member
            </label>
            <select
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
              className={`w-full text-xs font-medium px-3 py-2.5 rounded-xl border focus:outline-hidden focus:ring-2 focus:ring-sky-500 ${
                isLight
                  ? 'bg-white border-slate-200 text-slate-800'
                  : 'bg-slate-800/80 border-slate-700 text-slate-100'
              }`}
            >
              {employees.map((emp) => (
                <option key={emp.employeeId} value={emp.employeeId}>
                  {emp.name} ({emp.role} • {emp.department})
                </option>
              ))}
            </select>
          </div>

          {/* Claim Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Claim Description / Item
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g. Ergonomic Monitor, Client Lunch, AWS Certification"
              className={`w-full text-xs font-medium px-3 py-2.5 rounded-xl border focus:outline-hidden focus:ring-2 focus:ring-sky-500 ${
                isLight
                  ? 'bg-white border-slate-200 text-slate-800'
                  : 'bg-slate-800/80 border-slate-700 text-slate-100'
              }`}
            />
          </div>

          {/* Category & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Expense Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ReimbursementClaim['category'])}
                className={`w-full text-xs font-medium px-3 py-2.5 rounded-xl border focus:outline-hidden focus:ring-2 focus:ring-sky-500 ${
                  isLight
                    ? 'bg-white border-slate-200 text-slate-800'
                    : 'bg-slate-800/80 border-slate-700 text-slate-100'
                }`}
              >
                <option value="Equipment & Tech">Equipment & Tech</option>
                <option value="Travel & Lodging">Travel & Lodging</option>
                <option value="Client Entertainment">Client Entertainment</option>
                <option value="Wellness & Education">Wellness & Education</option>
                <option value="Office Supplies">Office Supplies</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Amount Claimed ({currency.symbol})
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">{currency.symbol}</span>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="0.00"
                  className={`w-full text-xs font-medium pl-7 pr-3 py-2.5 rounded-xl border focus:outline-hidden focus:ring-2 focus:ring-sky-500 ${
                    isLight
                      ? 'bg-white border-slate-200 text-slate-800'
                      : 'bg-slate-800/80 border-slate-700 text-slate-100'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Receipt Reference */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Receipt / Invoice Voucher ID
            </label>
            <input
              type="text"
              value={receiptId}
              onChange={(e) => setReceiptId(e.target.value)}
              className={`w-full text-xs font-mono px-3 py-2.5 rounded-xl border focus:outline-hidden focus:ring-2 focus:ring-sky-500 ${
                isLight
                  ? 'bg-white border-slate-200 text-slate-800'
                  : 'bg-slate-800/80 border-slate-700 text-slate-100'
              }`}
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Business Justification Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Provide context for the claim approver..."
              className={`w-full text-xs font-medium px-3 py-2.5 rounded-xl border focus:outline-hidden focus:ring-2 focus:ring-sky-500 resize-none ${
                isLight
                  ? 'bg-white border-slate-200 text-slate-800'
                  : 'bg-slate-800/80 border-slate-700 text-slate-100'
              }`}
            />
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
              Submit Claim
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

