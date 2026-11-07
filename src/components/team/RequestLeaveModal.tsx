import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  User,
  FileText,
  Check,
  Plane,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { EmployeeMember, LeaveRequest } from './teamMockData';

interface RequestLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: EmployeeMember[];
  onRequestLeave: (req: LeaveRequest) => void;
  preselectedEmployeeId?: string;
}

export const RequestLeaveModal: React.FC<RequestLeaveModalProps> = ({
  isOpen,
  onClose,
  employees,
  onRequestLeave,
  preselectedEmployeeId,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'white-sky';

  const defaultEmp = employees.find((e) => e.id === preselectedEmployeeId) || employees[0];

  const [selectedMemberId, setSelectedMemberId] = useState(defaultEmp ? defaultEmp.id : '');
  const [leaveType, setLeaveType] = useState<LeaveRequest['leaveType']>('Annual Vacation');
  const [startDate, setStartDate] = useState('2026-11-15');
  const [endDate, setEndDate] = useState('2026-11-17');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const currentMember = employees.find((e) => e.id === selectedMemberId) || employees[0];

  const calculateDays = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    const diffTime = e.getTime() - s.getTime();
    if (diffTime < 0) return 0;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const daysCount = calculateDays(startDate, endDate);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMember) return;
    if (daysCount <= 0) {
      setError('End date must be on or after start date.');
      return;
    }
    if (!reason.trim()) {
      setError('Please provide a short reason for the leave request.');
      return;
    }

    const newRequest: LeaveRequest = {
      id: `leave-${Date.now()}`,
      memberId: currentMember.id,
      memberName: currentMember.name,
      avatar: currentMember.avatar,
      role: currentMember.role,
      department: currentMember.department,
      leaveType,
      startDate,
      endDate,
      days: daysCount,
      reason: reason.trim(),
      status: 'Pending',
      appliedOn: '2026-11-05',
    };

    onRequestLeave(newRequest);
    onClose();
  };

  const modalBg = isLight ? 'bg-white text-slate-800' : 'bg-[#0f172a] text-slate-100';
  const inputBg = isLight
    ? 'bg-slate-50 border-sky-200/80 focus:bg-white text-slate-900 placeholder-slate-400'
    : 'bg-slate-800/80 border-slate-700 focus:bg-slate-800 text-slate-100 placeholder-slate-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden my-8 ${modalBg} ${
          isLight ? 'border-sky-100' : 'border-slate-800'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${
            isLight ? 'border-sky-100 bg-sky-50/50' : 'border-slate-800 bg-slate-800/50'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-600 text-white shadow-md shadow-amber-500/20">
              <Plane className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Submit Leave Request</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Log vacation, personal time, or medical time-off for workforce planning
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Member select */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Team Member
            </label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs border transition-colors outline-hidden focus:ring-2 focus:ring-sky-500/20 ${inputBg}`}
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} — {emp.role} ({emp.department})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Current balance card */}
          {currentMember && (
            <div
              className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                isLight ? 'bg-sky-50/50 border-sky-100' : 'bg-slate-800/40 border-slate-700/60'
              }`}
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Available Vacation
                </span>
                <p className="font-extrabold text-sky-600 dark:text-sky-400 text-sm">
                  {currentMember.leaveBalance.vacation} days
                </p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Sick Days</span>
                <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">
                  {currentMember.leaveBalance.sick} days
                </p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Casual</span>
                <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">
                  {currentMember.leaveBalance.casual} days
                </p>
              </div>
            </div>
          )}

          {/* Leave Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Leave Category
            </label>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value as LeaveRequest['leaveType'])}
              className={`w-full px-3 py-2 rounded-xl text-xs border transition-colors outline-hidden focus:ring-2 focus:ring-sky-500/20 ${inputBg}`}
            >
              <option value="Annual Vacation">Annual Vacation (Paid)</option>
              <option value="Sick Leave">Sick / Medical Leave</option>
              <option value="Casual Leave">Casual / Personal Time Off</option>
              <option value="Parental Leave">Parental Leave</option>
              <option value="Unpaid">Unpaid Leave of Absence</option>
            </select>
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl text-xs border transition-colors outline-hidden focus:ring-2 focus:ring-sky-500/20 ${inputBg}`}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl text-xs border transition-colors outline-hidden focus:ring-2 focus:ring-sky-500/20 ${inputBg}`}
              />
            </div>
          </div>

          {/* Days summary */}
          <div className="flex items-center justify-between text-xs px-2 py-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg">
            <span className="text-slate-500">Duration Requested:</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {daysCount > 0 ? `${daysCount} Day${daysCount > 1 ? 's' : ''}` : 'Invalid range'}
            </span>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Reason / Notes <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Vacation with family, doctor appointment, personal development..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl text-xs border transition-colors outline-hidden focus:ring-2 focus:ring-sky-500/20 resize-none ${inputBg}`}
              required
            />
          </div>

          {error && <p className="text-xs text-rose-500 font-semibold">{error}</p>}

          {/* Footer Actions */}
          <div
            className={`pt-4 border-t flex items-center justify-end gap-2.5 ${
              isLight ? 'border-sky-100' : 'border-slate-800'
            }`}
          >
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 shadow-md shadow-amber-500/20 transition-all"
            >
              <Check className="w-4 h-4" />
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

