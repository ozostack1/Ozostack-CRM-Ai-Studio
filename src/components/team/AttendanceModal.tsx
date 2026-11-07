import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  User,
  Calendar,
  Check,
  AlertCircle,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { AttendanceRecord, EmployeeMember } from './teamMockData';

interface AttendanceModalProps {
  isOpen: boolean;
  record: AttendanceRecord | null;
  onClose: () => void;
  onSave: (record: AttendanceRecord) => void;
  employees: EmployeeMember[];
}

export const AttendanceModal: React.FC<AttendanceModalProps> = ({
  isOpen,
  record,
  onClose,
  onSave,
  employees,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'white-sky';

  const defaultEmp = employees[0];

  const [selectedEmpId, setSelectedEmpId] = useState(defaultEmp ? defaultEmp.id : '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [checkIn, setCheckIn] = useState('08:30 AM');
  const [checkOut, setCheckOut] = useState('05:00 PM');
  const [hoursWorked, setHoursWorked] = useState(8.0);
  const [overtimeHours, setOvertimeHours] = useState(0.0);
  const [status, setStatus] = useState<AttendanceRecord['status']>('Present');

  useEffect(() => {
    if (record) {
      setSelectedEmpId(record.memberId);
      setDate(record.date);
      setCheckIn(record.checkIn || '08:30 AM');
      setCheckOut(record.checkOut || '05:00 PM');
      setHoursWorked(record.hoursWorked);
      setOvertimeHours(record.overtimeHours || 0.0);
      setStatus(record.status);
    } else {
      setSelectedEmpId(employees[0]?.id || '');
      setDate(new Date().toISOString().split('T')[0]);
      setCheckIn('08:30 AM');
      setCheckOut('05:00 PM');
      setHoursWorked(8.0);
      setOvertimeHours(0.0);
      setStatus('Present');
    }
  }, [record, isOpen, employees]);

  if (!isOpen) return null;

  const currentEmp = employees.find((e) => e.id === selectedEmpId) || employees[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEmp) return;

    const newOrUpdatedRecord: AttendanceRecord = {
      id: record ? record.id : `att-${Date.now()}`,
      memberId: currentEmp.id,
      memberName: currentEmp.name,
      avatar: currentEmp.avatar,
      role: currentEmp.role,
      department: currentEmp.department,
      date,
      checkIn: checkIn.trim(),
      checkOut: checkOut.trim() || undefined,
      hoursWorked: Number(hoursWorked) || 8.0,
      overtimeHours: Number(overtimeHours) > 0 ? Number(overtimeHours) : undefined,
      status,
    };

    onSave(newOrUpdatedRecord);
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
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {record ? 'Edit Attendance Record' : 'Manual Attendance / Shift Punch'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Record or adjust employee clock-in, hours worked, and shift status
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
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Team Member
            </label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <select
                value={selectedEmpId}
                onChange={(e) => setSelectedEmpId(e.target.value)}
                disabled={!!record}
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Shift Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs border transition-colors outline-hidden focus:ring-2 focus:ring-sky-500/20 ${inputBg}`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Presence Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as AttendanceRecord['status'])}
                className={`w-full px-3 py-2 rounded-xl text-xs border transition-colors outline-hidden focus:ring-2 focus:ring-sky-500/20 ${inputBg}`}
              >
                <option value="Present">Present (In Office)</option>
                <option value="Remote">Remote (WFH)</option>
                <option value="Late">Late Arrival</option>
                <option value="Half Day">Half Day</option>
                <option value="On Leave">On Leave</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Check-In Time
              </label>
              <input
                type="text"
                placeholder="08:45 AM"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl text-xs border transition-colors outline-hidden focus:ring-2 focus:ring-sky-500/20 ${inputBg}`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Check-Out Time
              </label>
              <input
                type="text"
                placeholder="05:15 PM"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl text-xs border transition-colors outline-hidden focus:ring-2 focus:ring-sky-500/20 ${inputBg}`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Hours Worked
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="24"
                value={hoursWorked}
                onChange={(e) => setHoursWorked(Number(e.target.value))}
                className={`w-full px-3 py-2 rounded-xl text-xs border transition-colors outline-hidden focus:ring-2 focus:ring-sky-500/20 ${inputBg}`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Overtime Hours
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="12"
                value={overtimeHours}
                onChange={(e) => setOvertimeHours(Number(e.target.value))}
                className={`w-full px-3 py-2 rounded-xl text-xs border transition-colors outline-hidden focus:ring-2 focus:ring-sky-500/20 ${inputBg}`}
              />
            </div>
          </div>

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
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 shadow-md shadow-sky-500/20 transition-all"
            >
              <Check className="w-4 h-4" />
              {record ? 'Save Changes' : 'Log Attendance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

