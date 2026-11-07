import React, { useState } from 'react';
import {
  X,
  UserPlus,
  Mail,
  Phone,
  Briefcase,
  Building2,
  DollarSign,
  MapPin,
  Calendar,
  Sparkles,
  Check,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useSystemCurrency } from '../../data/currencyService';
import { DepartmentType, EmployeeMember, EmploymentType, MemberStatus } from './teamMockData';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMember: (member: EmployeeMember) => void;
  existingManagers: string[];
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({
  isOpen,
  onClose,
  onAddMember,
  existingManagers,
}) => {
  const { theme } = useTheme();
  const currency = useSystemCurrency();
  const isLight = theme === 'white-sky';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    department: 'Engineering' as DepartmentType,
    employmentType: 'Full-Time' as EmploymentType,
    status: 'Active' as MemberStatus,
    location: 'San Francisco, CA',
    manager: existingManagers[0] || 'Sayed (CEO)',
    salary: 110000,
    skillsInput: 'React, TypeScript, Cloud Architecture',
    bio: '',
    startDate: new Date().toISOString().split('T')[0],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = 'Full name is required';
    if (!formData.email.trim()) errs.email = 'Email address is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errs.email = 'Valid email is required';
    if (!formData.role.trim()) errs.role = 'Role / Job title is required';
    if (formData.salary <= 0) errs.salary = 'Salary must be greater than 0';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Generate avatar initials from name
    const initials = formData.name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'TM';

    const skillsArray = formData.skillsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const newMember: EmployeeMember = {
      id: `emp-${Date.now()}`,
      name: formData.name.trim(),
      avatar: initials,
      avatarBg: 'from-sky-500 to-indigo-600',
      email: formData.email.trim(),
      phone: formData.phone.trim() || '+1 (555) 000-0000',
      role: formData.role.trim(),
      department: formData.department,
      employmentType: formData.employmentType,
      status: formData.status,
      location: formData.location.trim() || 'Remote',
      joinDate: formData.startDate,
      manager: formData.manager,
      salary: Number(formData.salary) || 100000,
      tasksDone: '0/25',
      tasksDoneNum: 0,
      totalTasks: 25,
      productivity: 88,
      rating: 5.0,
      skills: skillsArray.length > 0 ? skillsArray : ['Productivity', 'Problem Solving'],
      activeProjects: ['Onboarding & Setup'],
      attendanceRate: 100,
      hoursLoggedThisMonth: 0,
      leaveBalance: { vacation: 15, sick: 10, casual: 5 },
      bio: formData.bio.trim() || `Newly onboarded ${formData.role} in ${formData.department}.`,
      emergencyContact: 'Pending verification',
    };

    onAddMember(newMember);
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
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Add New Team Member</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Create an employee profile and assign them to an organizational department
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
                placeholder="e.g. Alex Morgan"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl text-xs border transition-colors outline-hidden focus:ring-2 focus:ring-sky-500/20 ${inputBg}`}
              />
              {errors.name && <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Work Email <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  placeholder="alex.morgan@ozostack.io"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs border transition-colors outline-hidden focus:ring-2 focus:ring-sky-500/20 ${inputBg}`}
                />
              </div>
              {errors.email && <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.email}</p>}
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
                  placeholder="e.g. Senior Frontend Engineer"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs border transition-colors outline-hidden focus:ring-2 focus:ring-sky-500/20 ${inputBg}`}
                />
              </div>
              {errors.role && <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.role}</p>}
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
                Initial Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as MemberStatus })}
                className={`w-full px-3 py-2 rounded-xl text-xs border transition-colors outline-hidden focus:ring-2 focus:ring-sky-500/20 ${inputBg}`}
              >
                <option value="Active">Active</option>
                <option value="Remote">Remote</option>
                <option value="Probation">Probation</option>
                <option value="On Leave">On Leave</option>
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
                  placeholder="+1 (555) 000-0000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs border transition-colors outline-hidden focus:ring-2 focus:ring-sky-500/20 ${inputBg}`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Location / Hub
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. San Francisco, CA"
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
              Core Skills &amp; Competencies (comma separated)
            </label>
            <input
              type="text"
              placeholder="e.g. React 19, TypeScript, PostgreSQL, UI/UX, Agile"
              value={formData.skillsInput}
              onChange={(e) => setFormData({ ...formData, skillsInput: e.target.value })}
              className={`w-full px-3 py-2 rounded-xl text-xs border transition-colors outline-hidden focus:ring-2 focus:ring-sky-500/20 ${inputBg}`}
            />
          </div>

          {/* Row 6: Bio */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Professional Summary / Bio
            </label>
            <textarea
              rows={2}
              placeholder="Brief summary of experience, focus areas, and achievements..."
              value={formData.bio}
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
              Save &amp; Onboard Member
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

