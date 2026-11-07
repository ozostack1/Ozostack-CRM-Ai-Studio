import React, { useState, useEffect } from 'react';
import {
  X,
  Edit,
  Mail,
  Phone,
  Briefcase,
  Building2,
  DollarSign,
  MapPin,
  Check,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useSystemCurrency } from '../../data/currencyService';
import { DepartmentType, EmployeeMember, EmploymentType, MemberStatus } from './teamMockData';

interface EditMemberModalProps {
  isOpen: boolean;
  member: EmployeeMember | null;
  onClose: () => void;
  onSave: (updated: EmployeeMember) => void;
  existingManagers: string[];
}

export const EditMemberModal: React.FC<EditMemberModalProps> = ({
  isOpen,
  member,
  onClose,
  onSave,
  existingManagers,
}) => {
  const { theme } = useTheme();
  const currency = useSystemCurrency();
  const isLight = theme === 'white-sky';

  const [formData, setFormData] = useState<EmployeeMember | null>(null);
  const [skillsText, setSkillsText] = useState('');

  useEffect(() => {
    if (member) {
      setFormData({ ...member });
      setSkillsText(member.skills.join(', '));
    }
  }, [member]);

  if (!isOpen || !formData) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.role.trim()) {
      alert('Please fill out all required fields.');
      return;
    }

    const updatedSkills = skillsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    onSave({
      ...formData,
      skills: updatedSkills,
    });
    onClose();
  };

  const modalBg = isLight ? 'bg-white text-slate-800' : 'bg-[#0f172a] text-slate-100';
  const inputBg = isLight
    ? 'bg-slate-50 border-sky-200/80 focus:bg-white text-slate-900 placeholder-slate-400'
    : 'bg-slate-800/80 border-slate-700 focus:bg-slate-800 text-slate-100 placeholder-slate-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden my-8 ${modalBg} ${
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
              <Edit className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Edit Employee Profile</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Update credentials, role, department, and compensation for {formData.name}
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Row 1: Name and Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl text-xs border transition-colors outline-hidden focus:ring-2 focus:ring-sky-500/20 ${inputBg}`}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Work Email <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs border transition-colors outline-hidden focus:ring-2 focus:ring-sky-500/20 ${inputBg}`}
                  required
                />
              </div>
            </div>
          </div>

          {/* Row 2: Role and Department */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Role / Job Title <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs border transition-colors outline-hidden focus:ring-2 focus:ring-sky-500/20 ${inputBg}`}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Department <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value as DepartmentType })}
                  className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs border transition-colors outline-hidden focus:ring-2 focus:ring-sky-500/20 appearance-none ${inputBg}`}
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Product & Design">Product & Design</option>
                  <option value="Sales & CRM">Sales & CRM</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Finance & Operations">Finance & Operations</option>
                  <option value="Human Resources">Human Resources</option>
                </select>
              </div>
            </div>
          </div>

          {/* Row 3: Employment Type, Status, Salary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Employment Type
              </label>
              <select
                value={formData.employmentType}
                onChange={(e) => setFormData({ ...formData, employmentType: e.target.value as EmploymentType })}
                className={`w-full px-3 py-2 rounded-xl text-xs border transition-colors outline-hidden focus:ring-2 focus:ring-sky-500/20 ${inputBg}`}
              >
                <option value="Full-Time">Full-Time</option>
                <option value="Part-Time">Part-Time</option>
                <option value="Contractor">Contractor</option>
                <option value="Intern">Intern</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Current Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as MemberStatus })}
                className={`w-full px-3 py-2 rounded-xl text-xs border transition-colors outline-hidden focus:ring-2 focus:ring-sky-500/20 ${inputBg}`}
              >
                <option value="Active">Active</option>
                <option value="Remote">Remote</option>
                <option value="On Leave">On Leave</option>
                <option value="Probation">Probation</option>
                <option value="Offline">Offline</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Annual Salary ({currency.symbol})
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  min="0"
                  step="5000"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: Number(e.target.value) })}
                  className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs border transition-colors outline-hidden focus:ring-2 focus:ring-sky-500/20 ${inputBg}`}
                />
              </div>
            </div>
          </div>

          {/* Row 4: Phone, Location, Manager */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs border transition-colors outline-hidden focus:ring-2 focus:ring-sky-500/20 ${inputBg}`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs border transition-colors outline-hidden focus:ring-2 focus:ring-sky-500/20 ${inputBg}`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Direct Manager
              </label>
              <select
                value={formData.manager}
                onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl text-xs border transition-colors outline-hidden focus:ring-2 focus:ring-sky-500/20 ${inputBg}`}
              >
                {existingManagers.map((mgr) => (
                  <option key={mgr} value={mgr}>
                    {mgr}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 5: Skills */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Skills &amp; Competencies
            </label>
            <input
              type="text"
              value={skillsText}
              onChange={(e) => setSkillsText(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl text-xs border transition-colors outline-hidden focus:ring-2 focus:ring-sky-500/20 ${inputBg}`}
            />
          </div>

          {/* Row 6: Bio */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Bio / Notes
            </label>
            <textarea
              rows={2}
              value={formData.bio || ''}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className={`w-full px-3 py-2 rounded-xl text-xs border transition-colors outline-hidden focus:ring-2 focus:ring-sky-500/20 resize-none ${inputBg}`}
            />
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
                isLight
                  ? 'text-slate-600 hover:bg-slate-100'
                  : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 shadow-md shadow-sky-500/20 transition-all"
            >
              <Check className="w-4 h-4" />
              Update Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

