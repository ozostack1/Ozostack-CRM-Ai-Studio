import React, { useState } from 'react';
import {
  X,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Building2,
  Calendar,
  Clock,
  DollarSign,
  Award,
  Star,
  CheckCircle2,
  Shield,
  Edit,
  UserCheck,
  FolderKanban,
  FileText,
  Send,
  HeartPulse,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useSystemCurrency } from '../../data/currencyService';
import { EmployeeMember } from './teamMockData';

interface MemberDetailsDrawerProps {
  isOpen: boolean;
  member: EmployeeMember | null;
  onClose: () => void;
  onEdit: (m: EmployeeMember) => void;
  onToggleStatus: (m: EmployeeMember) => void;
}

export const MemberDetailsDrawer: React.FC<MemberDetailsDrawerProps> = ({
  isOpen,
  member,
  onClose,
  onEdit,
  onToggleStatus,
}) => {
  const { theme } = useTheme();
  const { currency } = useSystemCurrency();
  const isLight = theme === 'white-sky';
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'attendance' | 'performance'>('overview');

  if (!isOpen || !member) return null;

  const cardBg = isLight ? 'bg-white text-slate-800' : 'bg-[#0f172a] text-slate-100';
  const sectionBg = isLight ? 'bg-slate-50 border-sky-100' : 'bg-slate-800/50 border-slate-700/60';

  const statusColorMap = {
    Active: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
    Remote: 'bg-sky-500/10 text-sky-600 border-sky-500/30',
    'On Leave': 'bg-amber-500/10 text-amber-600 border-amber-500/30',
    Offline: 'bg-slate-500/10 text-slate-500 border-slate-500/30',
    Probation: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
        <div
          className={`w-screen max-w-xl shadow-2xl flex flex-col border-l transition-all ${cardBg} ${
            isLight ? 'border-sky-100' : 'border-slate-800'
          }`}
        >
          {/* Drawer Top Header */}
          <div
            className={`p-6 border-b flex flex-col gap-4 relative ${
              isLight ? 'border-sky-100 bg-sky-50/40' : 'border-slate-800 bg-slate-850'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                {/* Avatar with status indicator ring */}
                <div className="relative">
                  <div
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${
                      member.avatarBg || 'from-sky-500 to-indigo-600'
                    } text-white flex items-center justify-center font-extrabold text-lg shadow-md ring-4 ${
                      isLight ? 'ring-white' : 'ring-slate-800'
                    }`}
                  >
                    {member.avatar}
                  </div>
                  <span
                    className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 ${
                      isLight ? 'border-white' : 'border-slate-900'
                    } ${
                      member.status === 'Active'
                        ? 'bg-emerald-500'
                        : member.status === 'Remote'
                        ? 'bg-sky-500'
                        : member.status === 'On Leave'
                        ? 'bg-amber-500'
                        : 'bg-slate-400'
                    }`}
                    title={`Status: ${member.status}`}
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                      {member.name}
                    </h2>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        statusColorMap[member.status] || statusColorMap.Active
                      }`}
                    >
                      {member.status}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                    {member.role}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-sky-500" />
                      {member.department}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {member.location}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onEdit(member)}
                  className="p-2 rounded-xl text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors"
                  title="Edit Profile"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Contact & Info Bar */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <a
                href={`mailto:${member.email}`}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-medium transition-colors ${
                  isLight
                    ? 'bg-white border-sky-100 text-slate-600 hover:text-sky-600 hover:bg-sky-50'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white'
                }`}
              >
                <Mail className="w-3.5 h-3.5 text-sky-500" />
                {member.email}
              </a>
              <a
                href={`tel:${member.phone}`}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-medium transition-colors ${
                  isLight
                    ? 'bg-white border-sky-100 text-slate-600 hover:text-sky-600 hover:bg-sky-50'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white'
                }`}
              >
                <Phone className="w-3.5 h-3.5 text-emerald-500" />
                {member.phone}
              </a>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold ${
                  isLight ? 'bg-white border-slate-200 text-slate-600' : 'bg-slate-800/60 border-slate-700 text-slate-400'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
                {member.employmentType}
              </span>
            </div>

            {/* Tabs Navigation */}
            <div className="flex border-b border-sky-200/40 dark:border-slate-800 -mb-6 mt-1 overflow-x-auto no-scrollbar">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'projects', label: `Projects (${member.activeProjects.length})` },
                { id: 'attendance', label: 'Attendance' },
                { id: 'performance', label: 'Performance' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-sky-500 text-sky-600 dark:text-sky-400 font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Drawer Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {activeTab === 'overview' && (
              <div className="space-y-4">
                {/* Bio Summary */}
                {member.bio && (
                  <div className={`p-4 rounded-xl border ${sectionBg}`}>
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Professional Background
                    </h4>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      {member.bio}
                    </p>
                  </div>
                )}

                {/* Key Metrics Strip */}
                <div className="grid grid-cols-3 gap-3">
                  <div className={`p-3 rounded-xl border text-center ${sectionBg}`}>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Productivity
                    </span>
                    <p className="text-base font-extrabold text-sky-600 dark:text-sky-400 mt-0.5">
                      {member.productivity}%
                    </p>
                    <span className="text-[10px] text-emerald-500 font-semibold">▲ High Velocity</span>
                  </div>

                  <div className={`p-3 rounded-xl border text-center ${sectionBg}`}>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Tasks Delivered
                    </span>
                    <p className="text-base font-extrabold text-slate-800 dark:text-white mt-0.5">
                      {member.tasksDone}
                    </p>
                    <span className="text-[10px] text-slate-400">Completion</span>
                  </div>

                  <div className={`p-3 rounded-xl border text-center ${sectionBg}`}>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Review Score
                    </span>
                    <p className="text-base font-extrabold text-amber-500 flex items-center justify-center gap-1 mt-0.5">
                      <Star className="w-3.5 h-3.5 fill-amber-500" />
                      {member.rating}
                    </p>
                    <span className="text-[10px] text-slate-400">Quarterly OKR</span>
                  </div>
                </div>

                {/* Employment & Reporting Structure */}
                <div className={`p-4 rounded-xl border space-y-3 ${sectionBg}`}>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Organizational Details
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 text-[11px] block">Reports To</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {member.manager}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Start / Join Date</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {member.joinDate}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Annual Base Compensation</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {currency.symbol}{member.salary.toLocaleString()} / yr
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        ({currency.symbol}{(member.salary / 12).toFixed(0)}/mo)
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Emergency Contact</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {member.emergencyContact || 'None on file'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Skills Tags */}
                <div className={`p-4 rounded-xl border ${sectionBg}`}>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Skills &amp; Endorsements
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {member.skills.map((skill) => (
                      <span
                        key={skill}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                          isLight
                            ? 'bg-white border-sky-200 text-sky-800 shadow-2xs'
                            : 'bg-slate-800 border-slate-700 text-sky-300'
                        }`}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'projects' && (
              <div className="space-y-4">
                <div className={`p-4 rounded-xl border ${sectionBg}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Assigned Initiatives ({member.activeProjects.length})
                    </h4>
                    <span className="text-xs text-sky-500 font-bold">100% On-Track</span>
                  </div>

                  <div className="space-y-2.5">
                    {member.activeProjects.map((p, idx) => (
                      <div
                        key={p}
                        className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${
                          isLight ? 'bg-white border-sky-100' : 'bg-slate-800 border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-lg bg-sky-500/10 text-sky-500">
                            <FolderKanban className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-white">{p}</p>
                            <span className="text-[10px] text-slate-400">Key Contributor</span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
                          Active
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`p-4 rounded-xl border ${sectionBg}`}>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Task Execution Velocity
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span>Tasks Delivered / Assigned</span>
                      <span className="text-sky-600 dark:text-sky-400">{member.tasksDone}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-sky-500 to-indigo-600 rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round((member.tasksDoneNum / (member.totalTasks || 1)) * 100)
                          )}%`,
                        }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 pt-1">
                      Average cycle time: 1.8 days per ticket with zero reported QA blocking regressions.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'attendance' && (
              <div className="space-y-4">
                {/* Attendance rate card */}
                <div className={`p-4 rounded-xl border flex items-center justify-between ${sectionBg}`}>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Attendance Reliability Rate
                    </span>
                    <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {member.attendanceRate}%
                    </p>
                    <span className="text-[11px] text-slate-400">
                      {member.hoursLoggedThisMonth} hours logged this month
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600">
                    <Clock className="w-8 h-8" />
                  </div>
                </div>

                {/* Leave balances */}
                <div className={`p-4 rounded-xl border space-y-3 ${sectionBg}`}>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Remaining Time-Off Balances
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div
                      className={`p-3 rounded-xl border text-center ${
                        isLight ? 'bg-white border-sky-100' : 'bg-slate-800 border-slate-700'
                      }`}
                    >
                      <span className="text-[10px] font-semibold text-slate-400 block">Annual Vacation</span>
                      <span className="text-lg font-bold text-sky-600 dark:text-sky-400">
                        {member.leaveBalance.vacation}
                      </span>
                      <span className="text-[10px] text-slate-400 block">Days Left</span>
                    </div>

                    <div
                      className={`p-3 rounded-xl border text-center ${
                        isLight ? 'bg-white border-sky-100' : 'bg-slate-800 border-slate-700'
                      }`}
                    >
                      <span className="text-[10px] font-semibold text-slate-400 block">Sick Leave</span>
                      <span className="text-lg font-bold text-slate-800 dark:text-white">
                        {member.leaveBalance.sick}
                      </span>
                      <span className="text-[10px] text-slate-400 block">Days Left</span>
                    </div>

                    <div
                      className={`p-3 rounded-xl border text-center ${
                        isLight ? 'bg-white border-sky-100' : 'bg-slate-800 border-slate-700'
                      }`}
                    >
                      <span className="text-[10px] font-semibold text-slate-400 block">Casual Off</span>
                      <span className="text-lg font-bold text-slate-800 dark:text-white">
                        {member.leaveBalance.casual}
                      </span>
                      <span className="text-[10px] text-slate-400 block">Days Left</span>
                    </div>
                  </div>
                </div>

                {/* Shift status details */}
                <div className={`p-4 rounded-xl border text-xs space-y-2 ${sectionBg}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Current Presence</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{member.status}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Work Schedule</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Mon – Fri, 9:00 AM – 5:30 PM (Local)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Overtime Logged</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">2.5 hrs this week</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'performance' && (
              <div className="space-y-4">
                <div className={`p-4 rounded-xl border ${sectionBg}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Overall Performance Rating
                    </h4>
                    <span className="flex items-center gap-1 text-sm font-extrabold text-amber-500">
                      <Star className="w-4 h-4 fill-amber-500" />
                      {member.rating} / 5.0
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Rated &ldquo;Exceeds High Expectations&rdquo; in recent executive management calibration.
                  </p>
                </div>

                <div className={`p-4 rounded-xl border space-y-3 ${sectionBg}`}>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Quarterly OKRs &amp; Goals
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-sky-100 dark:border-slate-700 flex items-center justify-between">
                      <span className="font-medium">Deliver feature roadmap with zero P1 blockers</span>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                        96% Done
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-sky-100 dark:border-slate-700 flex items-center justify-between">
                      <span className="font-medium">Mentor 2 junior contributors &amp; cross-train</span>
                      <span className="text-[10px] font-bold text-sky-600 bg-sky-50 dark:bg-sky-950/40 px-2 py-0.5 rounded">
                        100% Done
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-sky-100 dark:border-slate-700 flex items-center justify-between">
                      <span className="font-medium">Improve test coverage above 90%</span>
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded">
                        88% Done
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Drawer Footer Actions */}
          <div
            className={`p-4 border-t flex items-center justify-between gap-3 ${
              isLight ? 'border-sky-100 bg-white' : 'border-slate-800 bg-[#0f172a]'
            }`}
          >
            <button
              onClick={() => onToggleStatus(member)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                member.status === 'Active'
                  ? 'border-amber-300 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20'
                  : 'border-emerald-300 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20'
              }`}
            >
              {member.status === 'Active' ? 'Mark as Remote' : 'Set as Active'}
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onEdit(member)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 shadow-md shadow-sky-500/20 transition-all"
              >
                <Edit className="w-3.5 h-3.5" />
                Edit Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

