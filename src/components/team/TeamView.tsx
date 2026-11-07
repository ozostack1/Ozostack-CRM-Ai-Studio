import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Download,
  LayoutGrid,
  List,
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
  XCircle,
  AlertCircle,
  TrendingUp,
  MoreVertical,
  Edit,
  Trash2,
  Check,
  ChevronDown,
  Plane,
  Eye,
  ArrowUpDown,
  Sparkles,
  Shield,
  Plus,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useSystemCurrency, formatMoney } from '../../data/currencyService';
import { PermAction } from '../../context/authData';
import {
  INITIAL_EMPLOYEES,
  DEPARTMENTS_DATA,
  ATTENDANCE_TODAY,
  INITIAL_LEAVE_REQUESTS,
  INITIAL_PERFORMANCE_REVIEWS,
  INITIAL_JOB_REQUISITIONS,
  EmployeeMember,
  DepartmentSummary,
  DepartmentType,
  EmploymentType,
  MemberStatus,
  LeaveRequest,
  AttendanceRecord,
  JobRequisition,
} from './teamMockData';
import { MemberDetailsDrawer } from './MemberDetailsDrawer';
import { AddMemberModal } from './AddMemberModal';
import { EditMemberModal } from './EditMemberModal';
import { RequestLeaveModal } from './RequestLeaveModal';
import { DepartmentModal } from './DepartmentModal';
import { AttendanceModal } from './AttendanceModal';
import { JobModal } from './JobModal';

type ActiveTab = 'directory' | 'departments' | 'attendance' | 'performance' | 'leave' | 'recruitment';
type ViewMode = 'grid' | 'table';

export const TeamView: React.FC = () => {
  const { theme, setActiveNav } = useTheme();
  const { currency } = useSystemCurrency();
  const isLight = theme === 'white-sky';
  const { can, scopeFilter, currentUser } = useAuth();
  const byMember = (r: { department: string; memberId: string; memberName?: string }) => ({
    owner: r.memberName,
    department: r.department,
    employeeId: r.memberId,
  });

  // Master data states
  const [allEmployees, setEmployees] = useState<EmployeeMember[]>(INITIAL_EMPLOYEES);
  const [departments, setDepartments] = useState<DepartmentSummary[]>(DEPARTMENTS_DATA);
  const [allAttendance, setAttendance] = useState<AttendanceRecord[]>(ATTENDANCE_TODAY);
  const [allLeaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(INITIAL_LEAVE_REQUESTS);
  const [allReviews, setReviews] = useState(INITIAL_PERFORMANCE_REVIEWS);
  const [jobs, setJobs] = useState<JobRequisition[]>(INITIAL_JOB_REQUISITIONS);

  // Scoped records reactive to the signed-in user & role scope
  const employees = useMemo(
    () => scopeFilter(allEmployees, (e) => ({ owner: e.name, department: e.department, employeeId: e.id })),
    [allEmployees, scopeFilter]
  );
  const attendance = useMemo(() => scopeFilter(allAttendance, byMember), [allAttendance, scopeFilter]);
  const leaveRequests = useMemo(() => scopeFilter(allLeaveRequests, byMember), [allLeaveRequests, scopeFilter]);
  const reviews = useMemo(() => scopeFilter(allReviews, byMember), [allReviews, scopeFilter]);

  // Navigation & View Mode
  const [activeTab, setActiveTab] = useState<ActiveTab>('directory');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'name' | 'productivity' | 'salary' | 'joinDate'>('name');
  const [leaveFilter, setLeaveFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');

  // Multi-selection
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  // Modals & Drawers
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isEditMemberModalOpen, setIsEditMemberModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [activeDrawerMember, setActiveDrawerMember] = useState<EmployeeMember | null>(null);
  const [memberToEdit, setMemberToEdit] = useState<EmployeeMember | null>(null);

  // Department Modals
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [deptToEdit, setDeptToEdit] = useState<DepartmentSummary | null>(null);

  // Attendance Modals
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [attendanceToEdit, setAttendanceToEdit] = useState<AttendanceRecord | null>(null);

  // Job Requisition Modals
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [jobToEdit, setJobToEdit] = useState<JobRequisition | null>(null);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Permission guard for admin actions
  const allow = (action: PermAction) => {
    if (can('Team', action)) return true;
    showToast(`Access denied: your role lacks "${action}" permission for Team.`);
    return false;
  };

  // Managers list for modals
  const managersList = useMemo(() => {
    return Array.from(new Set(employees.map((e) => e.name)));
  }, [employees]);

  // Departments list for selectors
  const departmentNames = useMemo(() => {
    return departments.map((d) => d.name);
  }, [departments]);

  // Executive KPI Calculations
  const kpis = useMemo(() => {
    const total = employees.length;
    const active = employees.filter((e) => e.status === 'Active' || e.status === 'Remote').length;
    const onLeave = employees.filter((e) => e.status === 'On Leave').length;
    const avgProductivity = (
      employees.reduce((acc, curr) => acc + curr.productivity, 0) / (total || 1)
    ).toFixed(1);
    const monthlyPayroll = employees.reduce((acc, curr) => acc + curr.salary / 12, 0);
    const pendingLeaves = leaveRequests.filter((l) => l.status === 'Pending').length;
    const openJobs = jobs.reduce((acc, curr) => acc + (curr.stage !== 'Closed' ? curr.openings : 0), 0);

    return {
      total,
      active,
      onLeave,
      avgProductivity,
      monthlyPayroll,
      pendingLeaves,
      openJobs,
    };
  }, [employees, leaveRequests, jobs]);

  // Filtered and Sorted Employees
  const filteredEmployees = useMemo(() => {
    return employees
      .filter((emp) => {
        const matchesSearch =
          emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emp.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emp.skills.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesDept = selectedDept === 'All' || emp.department === selectedDept;
        const matchesType = selectedType === 'All' || emp.employmentType === selectedType;
        const matchesStatus = selectedStatus === 'All' || emp.status === selectedStatus;

        return matchesSearch && matchesDept && matchesType && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'productivity') return b.productivity - a.productivity;
        if (sortBy === 'salary') return b.salary - a.salary;
        if (sortBy === 'joinDate') return new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime();
        return 0;
      });
  }, [employees, searchTerm, selectedDept, selectedType, selectedStatus, sortBy]);

  // Filtered Leave Requests
  const filteredLeaveRequests = useMemo(() => {
    if (leaveFilter === 'All') return leaveRequests;
    return leaveRequests.filter((l) => l.status === leaveFilter);
  }, [leaveRequests, leaveFilter]);

  // -------------------------------------------------------------
  // Employee Handlers
  // -------------------------------------------------------------
  const handleAddMember = (newMember: EmployeeMember) => {
    if (!allow('create')) return;
    setEmployees((prev) => [newMember, ...prev]);
    setAttendance((prev) => [
      {
        id: `att-${Date.now()}`,
        memberId: newMember.id,
        memberName: newMember.name,
        avatar: newMember.avatar,
        role: newMember.role,
        department: newMember.department,
        date: new Date().toISOString().split('T')[0],
        checkIn: '09:00 AM',
        hoursWorked: 8.0,
        status: newMember.status === 'Remote' ? 'Remote' : 'Present',
      },
      ...prev,
    ]);
    showToast(`Successfully onboarded ${newMember.name} into ${newMember.department}!`);
  };

  const handleUpdateMember = (updated: EmployeeMember) => {
    if (!allow('edit')) return;
    setEmployees((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    if (activeDrawerMember?.id === updated.id) {
      setActiveDrawerMember(updated);
    }
    showToast(`Profile updated for ${updated.name}.`);
  };

  const handleToggleStatus = (member: EmployeeMember) => {
    if (!can('Team', 'edit')) return void allow('edit');
    const nextStatus: MemberStatus = member.status === 'Active' ? 'Remote' : 'Active';
    const updated = { ...member, status: nextStatus };
    handleUpdateMember(updated);
    showToast(`${member.name} marked as ${nextStatus}.`);
  };

  const handleDeleteMember = (id: string, name: string) => {
    if (!allow('delete')) return;
    if (confirm(`Are you sure you want to deactivate and remove ${name} from the active directory?`)) {
      setEmployees((prev) => prev.filter((e) => e.id !== id));
      if (activeDrawerMember?.id === id) setActiveDrawerMember(null);
      showToast(`Removed ${name} from active roster.`);
    }
  };

  // -------------------------------------------------------------
  // Department Handlers (Admin Add, Edit, Delete)
  // -------------------------------------------------------------
  const handleSaveDepartment = (dept: DepartmentSummary) => {
    if (!allow('edit')) return;
    setDepartments((prev) => {
      const exists = prev.some((d) => d.id === dept.id);
      if (exists) {
        return prev.map((d) => (d.id === dept.id ? dept : d));
      }
      return [...prev, dept];
    });
    showToast(`Department "${dept.name}" saved successfully.`);
  };

  const handleDeleteDepartment = (deptId: string, deptName: string) => {
    if (!allow('delete')) return;
    const assignedCount = employees.filter((e) => e.department === deptName).length;
    if (assignedCount > 0) {
      if (
        !confirm(
          `Warning: Department "${deptName}" has ${assignedCount} assigned employee(s). Deleting will reassign them to "Finance & Operations". Proceed?`
        )
      ) {
        return;
      }
      setEmployees((prev) =>
        prev.map((e) => (e.department === deptName ? { ...e, department: 'Finance & Operations' } : e))
      );
    } else {
      if (!confirm(`Are you sure you want to delete department "${deptName}"?`)) return;
    }
    setDepartments((prev) => prev.filter((d) => d.id !== deptId));
    if (selectedDept === deptName) setSelectedDept('All');
    showToast(`Department "${deptName}" deleted.`);
  };

  // -------------------------------------------------------------
  // Attendance Handlers (Admin Add, Edit, Delete, Quick Status)
  // -------------------------------------------------------------
  const handleSaveAttendance = (record: AttendanceRecord) => {
    if (!allow('edit')) return;
    setAttendance((prev) => {
      const exists = prev.some((a) => a.id === record.id);
      if (exists) {
        return prev.map((a) => (a.id === record.id ? record : a));
      }
      return [record, ...prev];
    });
    showToast(`Attendance entry for ${record.memberName} saved.`);
  };

  const handleDeleteAttendance = (id: string, name: string) => {
    if (!allow('delete')) return;
    if (confirm(`Delete attendance entry for ${name}?`)) {
      setAttendance((prev) => prev.filter((a) => a.id !== id));
      showToast(`Attendance record deleted for ${name}.`);
    }
  };

  const handleQuickStatusChange = (id: string, newStatus: AttendanceRecord['status']) => {
    if (!allow('edit')) return;
    setAttendance((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
    );
    showToast(`Presence status updated to ${newStatus}.`);
  };

  // -------------------------------------------------------------
  // Hiring Requisition Handlers (Admin Add, Edit, Delete, Stage)
  // -------------------------------------------------------------
  const handleSaveJob = (job: JobRequisition) => {
    if (!allow('edit')) return;
    setJobs((prev) => {
      const exists = prev.some((j) => j.id === job.id);
      if (exists) {
        return prev.map((j) => (j.id === job.id ? job : j));
      }
      return [job, ...prev];
    });
    showToast(`Job requisition "${job.title}" saved.`);
  };

  const handleDeleteJob = (id: string, title: string) => {
    if (!allow('delete')) return;
    if (confirm(`Are you sure you want to delete hiring requisition "${title}"?`)) {
      setJobs((prev) => prev.filter((j) => j.id !== id));
      showToast(`Deleted job requisition "${title}".`);
    }
  };

  const handleUpdateJobStage = (id: string, newStage: JobRequisition['stage']) => {
    if (!allow('edit')) return;
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, stage: newStage } : j)));
    showToast(`Hiring stage moved to ${newStage}.`);
  };

  const handleAdjustApplicants = (id: string, delta: number) => {
    if (!allow('edit')) return;
    setJobs((prev) =>
      prev.map((j) =>
        j.id === id ? { ...j, applicantsCount: Math.max(0, j.applicantsCount + delta) } : j
      )
    );
  };

  // -------------------------------------------------------------
  // Leave Handlers
  // -------------------------------------------------------------
  const handleRequestLeave = (newReq: LeaveRequest) => {
    setLeaveRequests((prev) => [newReq, ...prev]);
    showToast(`Leave request submitted for ${newReq.memberName} (${newReq.days} days).`);
  };

  const handleApproveLeave = (id: string) => {
    if (!allow('approve')) return;
    const req = leaveRequests.find((l) => l.id === id);
    if (!req) return;

    setLeaveRequests((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: 'Approved', reviewedBy: currentUser?.name } : l))
    );

    // Deduct leave days from employee balance
    setEmployees((prev) =>
      prev.map((e) => {
        if (e.id === req.memberId) {
          const bal = { ...e.leaveBalance };
          if (req.leaveType === 'Annual Vacation') {
            bal.vacation = Math.max(0, bal.vacation - req.days);
          } else if (req.leaveType === 'Sick Leave') {
            bal.sick = Math.max(0, bal.sick - req.days);
          } else {
            bal.casual = Math.max(0, bal.casual - req.days);
          }
          return { ...e, leaveBalance: bal, status: 'On Leave' };
        }
        return e;
      })
    );
    showToast(`Approved ${req.days} days leave for ${req.memberName}.`);
  };

  const handleRejectLeave = (id: string) => {
    if (!allow('approve')) return;
    setLeaveRequests((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: 'Rejected', reviewedBy: currentUser?.name } : l))
    );
    showToast('Leave request rejected.');
  };

  const handleDeleteLeave = (id: string) => {
    if (!allow('delete')) return;
    if (confirm('Delete this leave request record?')) {
      setLeaveRequests((prev) => prev.filter((l) => l.id !== id));
      showToast('Leave record removed.');
    }
  };

  // -------------------------------------------------------------
  // CSV Export
  // -------------------------------------------------------------
  const handleExportCSV = () => {
    if (!allow('export')) return;
    const headers = [
      'ID',
      'Name',
      'Role',
      'Department',
      'Type',
      'Status',
      'Email',
      'Phone',
      'Location',
      'Join Date',
      'Salary',
      'Productivity',
    ];
    const rows = filteredEmployees.map((e) => [
      e.id,
      `"${e.name}"`,
      `"${e.role}"`,
      `"${e.department}"`,
      e.employmentType,
      e.status,
      e.email,
      e.phone,
      `"${e.location}"`,
      e.joinDate,
      e.salary,
      `${e.productivity}%`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ozo-team-roster-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Team roster exported successfully.');
  };

  // Selection
  const toggleSelectMember = (id: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedMemberIds.length === filteredEmployees.length) {
      setSelectedMemberIds([]);
    } else {
      setSelectedMemberIds(filteredEmployees.map((e) => e.id));
    }
  };

  const handleBulkEmail = () => {
    const selected = employees.filter((e) => selectedMemberIds.includes(e.id));
    const emails = selected.map((e) => e.email).join(',');
    window.location.href = `mailto:${emails}?subject=Team Announcement`;
  };

  const handleBulkDelete = () => {
    if (confirm(`Deactivate ${selectedMemberIds.length} selected team members?`)) {
      setEmployees((prev) => prev.filter((e) => !selectedMemberIds.includes(e.id)));
      setSelectedMemberIds([]);
      showToast('Selected members deactivated.');
    }
  };

  const cardBg = isLight
    ? 'bg-white border-sky-100/90 shadow-xs'
    : 'bg-[#0f172a]/90 border-slate-800/80';

  const filterBg = isLight
    ? 'bg-slate-50 border-sky-100 text-slate-700'
    : 'bg-slate-800/70 border-slate-700 text-slate-200';

  const statusColorMap = {
    Active: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
    Remote: 'bg-sky-500/10 text-sky-600 border-sky-500/30',
    'On Leave': 'bg-amber-500/10 text-amber-600 border-amber-500/30',
    Offline: 'bg-slate-500/10 text-slate-500 border-slate-500/30',
    Probation: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-xl border border-sky-500/30 animate-in slide-in-from-bottom-2">
          <Sparkles className="w-4 h-4 text-sky-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* TOP HEADER & EXECUTIVE ACTION CONTROLS                         */}
      {/* ============================================================== */}
      <div className={`p-4 sm:p-5 rounded-2xl border ${cardBg}`}>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 via-sky-400 to-indigo-600 text-white shadow-md shadow-sky-500/20">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-slate-900 dark:text-white leading-none">
                  Team &amp; Workforce Management
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Full admin control across employee directories, departments, live attendance shifts, and hiring requisitions.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {/* View Mode Toggle (Grid vs Table) */}
            {activeTab === 'directory' && (
              <div
                className={`flex items-center p-0.5 rounded-xl border ${
                  isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-800 border-slate-700'
                }`}
              >
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                    viewMode === 'table'
                      ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                  title="Table View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Export CSV */}
            <button
              onClick={handleExportCSV}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                isLight
                  ? 'border-sky-200 bg-white hover:bg-sky-50 text-slate-700'
                  : 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
            >
              <Download className="w-4 h-4 text-sky-500" />
              <span>Export CSV</span>
            </button>

            {/* Request Leave */}
            <button
              onClick={() => setIsLeaveModalOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                isLight
                  ? 'border-amber-200 bg-amber-50/60 hover:bg-amber-100/60 text-amber-800'
                  : 'border-amber-900/40 bg-amber-950/20 hover:bg-amber-900/30 text-amber-300'
              }`}
            >
              <Plane className="w-4 h-4 text-amber-500" />
              <span>Request Leave</span>
            </button>

            {/* Add Team Member */}
            <button
              onClick={() => setIsAddMemberModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 shadow-md shadow-sky-500/20 transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Member</span>
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* EXECUTIVE KPI CARDS STRIP                                      */}
        {/* ============================================================== */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4 pt-4 border-t border-sky-100/60 dark:border-slate-800">
          <div className="p-2.5 rounded-xl bg-sky-500/5 border border-sky-500/10">
            <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">
              Total Headcount
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-lg font-extrabold text-slate-900 dark:text-white">
                {kpis.total}
              </span>
              <span className="text-[10px] font-semibold text-emerald-500">100% Active</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
            <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">
              Active Today
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                {kpis.active}
              </span>
              <span className="text-[10px] text-slate-400">({kpis.onLeave} on leave)</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
            <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">
              Team Productivity
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-lg font-extrabold text-sky-600 dark:text-sky-400">
                {kpis.avgProductivity}%
              </span>
              <span className="text-[10px] text-emerald-500 font-semibold">▲ 4.2%</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/10">
            <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">
              Monthly Payroll
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-lg font-extrabold text-slate-900 dark:text-white">
                {currency.symbol}{(kpis.monthlyPayroll / 1000).toFixed(0)}k
              </span>
              <span className="text-[10px] text-slate-400">/mo</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-purple-500/5 border border-purple-500/10">
            <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">
              Open Requisitions
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-lg font-extrabold text-purple-600 dark:text-purple-400">
                {kpis.openJobs} Roles
              </span>
              <span className="text-[10px] text-slate-400">Hiring</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-rose-500/5 border border-rose-500/10">
            <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">
              Pending Leaves
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-lg font-extrabold text-amber-500">
                {kpis.pendingLeaves}
              </span>
              <span className="text-[10px] text-amber-500 font-medium">To Review</span>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* MASTER TABS NAVIGATION                                         */}
        {/* ============================================================== */}
        <div className="flex items-center gap-1 mt-4 pt-3 border-t border-sky-100/60 dark:border-slate-800 overflow-x-auto no-scrollbar">
          {[
            { id: 'directory', label: `Directory (${employees.length})`, icon: Users },
            { id: 'departments', label: `Departments (${departments.length})`, icon: Building2 },
            { id: 'attendance', label: `Attendance & Shifts (${attendance.length})`, icon: Clock },
            { id: 'performance', label: 'Performance & OKRs', icon: Award },
            {
              id: 'leave',
              label: `Leave & Time-Off ${
                kpis.pendingLeaves > 0 ? `(${kpis.pendingLeaves} Pending)` : ''
              }`,
              icon: Plane,
            },
            { id: 'recruitment', label: `Hiring Requisitions (${jobs.length})`, icon: UserPlus },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-sky-500 text-white shadow-xs font-bold'
                    : isLight
                    ? 'text-slate-600 hover:bg-sky-50 hover:text-sky-600'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: DIRECTORY (GRID & TABLE)                                */}
      {/* ============================================================== */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div
            className={`p-3.5 rounded-2xl border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 ${cardBg}`}
          >
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, role, email, or skills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs border outline-hidden transition-colors ${filterBg}`}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Department, Employment Type & Status Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className={`px-3 py-2 rounded-xl text-xs font-medium border outline-hidden ${filterBg}`}
              >
                <option value="All">All Departments</option>
                {departmentNames.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>

              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className={`px-3 py-2 rounded-xl text-xs font-medium border outline-hidden ${filterBg}`}
              >
                <option value="All">All Types</option>
                <option value="Full-Time">Full-Time</option>
                <option value="Part-Time">Part-Time</option>
                <option value="Contractor">Contractor</option>
                <option value="Intern">Intern</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className={`px-3 py-2 rounded-xl text-xs font-medium border outline-hidden ${filterBg}`}
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Remote">Remote</option>
                <option value="On Leave">On Leave</option>
                <option value="Offline">Offline</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className={`px-3 py-2 rounded-xl text-xs font-medium border outline-hidden ${filterBg}`}
              >
                <option value="name">Sort: Name (A-Z)</option>
                <option value="productivity">Sort: Productivity</option>
                <option value="salary">Sort: Salary</option>
                <option value="joinDate">Sort: Join Date</option>
              </select>
            </div>
          </div>

          {/* Bulk actions banner if members selected */}
          {selectedMemberIds.length > 0 && (
            <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-between text-xs animate-in fade-in">
              <span className="font-bold text-sky-800 dark:text-sky-300">
                {selectedMemberIds.length} team member{selectedMemberIds.length > 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBulkEmail}
                  className="px-3 py-1 rounded-lg bg-sky-500 text-white font-semibold hover:bg-sky-600 transition-colors"
                >
                  Send Announcement
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-1 rounded-lg bg-rose-500 text-white font-semibold hover:bg-rose-600 transition-colors"
                >
                  Deactivate Selected
                </button>
                <button
                  onClick={() => setSelectedMemberIds([])}
                  className="px-2 py-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* GRID VIEW */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredEmployees.map((emp) => (
                <div
                  key={emp.id}
                  className={`p-4 rounded-2xl border transition-all duration-200 hover:shadow-md flex flex-col justify-between group ${cardBg}`}
                >
                  <div>
                    {/* Card Top: Checkbox, Status Pill, Quick Menu */}
                    <div className="flex items-center justify-between mb-3">
                      <input
                        type="checkbox"
                        checked={selectedMemberIds.includes(emp.id)}
                        onChange={() => toggleSelectMember(emp.id)}
                        className="rounded border-slate-300 text-sky-500 focus:ring-sky-500"
                      />

                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            statusColorMap[emp.status] || statusColorMap.Active
                          }`}
                        >
                          {emp.status}
                        </span>

                        <button
                          onClick={() => {
                            setMemberToEdit(emp);
                            setIsEditMemberModalOpen(true);
                          }}
                          className="p-1 text-slate-400 hover:text-sky-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Edit member"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteMember(emp.id, emp.name)}
                          className="p-1 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Deactivate"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Member Core Info */}
                    <div
                      className="cursor-pointer"
                      onClick={() => setActiveDrawerMember(emp)}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${
                            emp.avatarBg || 'from-sky-500 to-indigo-600'
                          } text-white flex items-center justify-center font-bold text-sm shadow-md shrink-0`}
                        >
                          {emp.avatar}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-sky-500 transition-colors">
                            {emp.name}
                          </h3>
                          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                            {emp.role}
                          </p>
                          <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1 mt-0.5">
                            <Building2 className="w-2.5 h-2.5 text-sky-500" />
                            {emp.department}
                          </span>
                        </div>
                      </div>

                      {/* Productivity & Tasks */}
                      <div className="mt-4 pt-3 border-t border-sky-100/60 dark:border-slate-800 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 font-medium">Productivity</span>
                          <span className="font-bold text-sky-600 dark:text-sky-400">
                            {emp.productivity}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-sky-500 to-indigo-600 rounded-full"
                            style={{ width: `${emp.productivity}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                          <span>Tasks: {emp.tasksDone}</span>
                          <span className="flex items-center gap-0.5 text-amber-500 font-semibold">
                            <Star className="w-3 h-3 fill-amber-500" />
                            {emp.rating}
                          </span>
                        </div>
                      </div>

                      {/* Skills Chips */}
                      <div className="flex flex-wrap gap-1 mt-3">
                        {emp.skills.slice(0, 3).map((s) => (
                          <span
                            key={s}
                            className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                          >
                            {s}
                          </span>
                        ))}
                        {emp.skills.length > 3 && (
                          <span className="px-1.5 py-0.5 rounded-md text-[10px] text-slate-400">
                            +{emp.skills.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="mt-4 pt-3 border-t border-sky-100/60 dark:border-slate-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <a
                        href={`mailto:${emp.email}`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors"
                        title={emp.email}
                      >
                        <Mail className="w-3.5 h-3.5" />
                      </a>
                      <a
                        href={`tel:${emp.phone}`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors"
                        title={emp.phone}
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    <button
                      onClick={() => setActiveDrawerMember(emp)}
                      className="flex items-center gap-1 text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Profile
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TABLE VIEW */}
          {viewMode === 'table' && (
            <div className={`rounded-2xl border overflow-hidden ${cardBg}`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr
                      className={`border-b text-[10px] font-bold uppercase tracking-wider ${
                        isLight ? 'bg-sky-50/50 text-slate-500' : 'bg-slate-800/50 text-slate-400'
                      }`}
                    >
                      <th className="p-3 w-8">
                        <input
                          type="checkbox"
                          checked={
                            selectedMemberIds.length === filteredEmployees.length &&
                            filteredEmployees.length > 0
                          }
                          onChange={toggleSelectAll}
                          className="rounded border-slate-300 text-sky-500"
                        />
                      </th>
                      <th className="p-3">Employee</th>
                      <th className="p-3">Role &amp; Department</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Productivity</th>
                      <th className="p-3">Compensation</th>
                      <th className="p-3">Location</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sky-100/40 dark:divide-slate-800">
                    {filteredEmployees.map((emp) => (
                      <tr
                        key={emp.id}
                        className="hover:bg-sky-50/40 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={selectedMemberIds.includes(emp.id)}
                            onChange={() => toggleSelectMember(emp.id)}
                            className="rounded border-slate-300 text-sky-500"
                          />
                        </td>
                        <td
                          className="p-3 cursor-pointer"
                          onClick={() => setActiveDrawerMember(emp)}
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${
                                emp.avatarBg || 'from-sky-500 to-indigo-600'
                              } text-white flex items-center justify-center font-bold text-xs shrink-0`}
                            >
                              {emp.avatar}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white hover:text-sky-500">
                                {emp.name}
                              </p>
                              <span className="text-[11px] text-slate-400">{emp.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <p className="font-semibold text-slate-800 dark:text-slate-200">{emp.role}</p>
                          <span className="text-[10px] text-sky-600 dark:text-sky-400">
                            {emp.department}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {emp.employmentType}
                          </span>
                        </td>
                        <td className="p-3">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              statusColorMap[emp.status] || statusColorMap.Active
                            }`}
                          >
                            {emp.status}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                              <div
                                className="h-full bg-sky-500 rounded-full"
                                style={{ width: `${emp.productivity}%` }}
                              />
                            </div>
                            <span className="font-bold text-slate-800 dark:text-white">
                              {emp.productivity}%
                            </span>
                          </div>
                        </td>
                        <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                          {currency.symbol}{emp.salary.toLocaleString()}
                          <span className="text-[10px] text-slate-400 block font-normal">
                            ({currency.symbol}{(emp.salary / 12).toFixed(0)}/mo)
                          </span>
                        </td>
                        <td className="p-3 text-slate-500">{emp.location}</td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setActiveDrawerMember(emp)}
                              className="p-1 text-slate-400 hover:text-sky-500"
                              title="View details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setMemberToEdit(emp);
                                setIsEditMemberModalOpen(true);
                              }}
                              className="p-1 text-slate-400 hover:text-sky-500"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteMember(emp.id, emp.name)}
                              className="p-1 text-slate-400 hover:text-rose-500"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: DEPARTMENTS (ADMIN CAN ADD, EDIT, DELETE)               */}
      {/* ============================================================== */}
      {activeTab === 'departments' && (
        <div className="space-y-4">
          {/* Header Action Bar */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${cardBg}`}>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Departments &amp; Organizational Structure ({departments.length})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Admin controls to add, configure, or retire departmental cost centers and divisional mandates
              </p>
            </div>
            <button
              onClick={() => {
                setDeptToEdit(null);
                setIsDeptModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Department</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.map((dept) => {
              const deptMembers = employees.filter((e) => e.department === dept.name);
              return (
                <div
                  key={dept.id}
                  className={`p-5 rounded-2xl border flex flex-col justify-between group hover:shadow-md transition-all ${cardBg}`}
                >
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${dept.color} text-white flex items-center justify-center font-bold text-sm shadow-md shrink-0`}
                        >
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                            {dept.name}
                          </h3>
                          <span className="text-[10px] font-semibold text-slate-400">
                            Led by {dept.head}
                          </span>
                        </div>
                      </div>

                      {/* Admin Edit & Delete buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setDeptToEdit(dept);
                            setIsDeptModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-sky-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Edit Department"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteDepartment(dept.id, dept.name)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Delete Department"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400">
                        {deptMembers.length} Members
                      </span>
                      <span className="text-xs font-semibold text-slate-400">
                        • {currency.symbol}{dept.monthlyBudget.toLocaleString()}/mo budget
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">
                      {dept.description}
                    </p>

                    {/* Department stats strip */}
                    <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-sky-100/60 dark:border-slate-700/60 text-center mb-4">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Budget</span>
                        <p className="text-xs font-extrabold text-slate-800 dark:text-white">
                          {currency.symbol}{(dept.monthlyBudget / 1000).toFixed(0)}k/mo
                        </p>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Velocity</span>
                        <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                          {dept.avgProductivity}%
                        </p>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Openings</span>
                        <p className="text-xs font-extrabold text-purple-600 dark:text-purple-400">
                          {dept.openPositions}
                        </p>
                      </div>
                    </div>

                    {/* Members mini avatar stack */}
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                        Assigned Roster ({deptMembers.length})
                      </span>
                      {deptMembers.length > 0 ? (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {deptMembers.map((m) => (
                            <button
                              key={m.id}
                              onClick={() => setActiveDrawerMember(m)}
                              className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-sky-100 dark:border-slate-700 text-xs hover:border-sky-500 transition-colors"
                              title={`${m.name} (${m.role})`}
                            >
                              <span className="font-bold text-[10px] text-sky-600">{m.avatar}</span>
                              <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                                {m.name.split(' ')[0]}
                              </span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">No members assigned yet.</p>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-sky-100/60 dark:border-slate-800 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setSelectedDept(dept.name);
                        setActiveTab('directory');
                      }}
                      className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline"
                    >
                      Filter Directory &rarr;
                    </button>
                    <button
                      onClick={() => {
                        setMemberToEdit(null);
                        setIsAddMemberModalOpen(true);
                      }}
                      className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white"
                    >
                      + Add Member
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: ATTENDANCE & SHIFTS (ADMIN CAN LOG, EDIT, DELETE)       */}
      {/* ============================================================== */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          <div className={`p-4 rounded-2xl border ${cardBg}`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Real-time Shift &amp; Attendance Roster
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Daily punch clocks, hours logged, remote statuses, and admin manual adjustments
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg">
                  {attendance.filter((a) => a.status === 'Present' || a.status === 'Remote').length} /{' '}
                  {attendance.length} Active Today
                </span>
                <button
                  onClick={() => {
                    setAttendanceToEdit(null);
                    setIsAttendanceModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-sky-500 hover:bg-sky-600 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Log Attendance
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr
                    className={`border-b text-[10px] font-bold uppercase tracking-wider ${
                      isLight ? 'bg-sky-50/50 text-slate-500' : 'bg-slate-800/50 text-slate-400'
                    }`}
                  >
                    <th className="p-3">Team Member</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Punch Times</th>
                    <th className="p-3">Hours Logged</th>
                    <th className="p-3">Status (Manage)</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sky-100/40 dark:divide-slate-800">
                  {attendance.map((rec) => (
                    <tr
                      key={rec.id}
                      className="hover:bg-sky-50/40 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-sky-500 text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                            {rec.avatar}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">
                              {rec.memberName}
                            </p>
                            <span className="text-[10px] text-slate-400">{rec.role}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-300">{rec.department}</td>
                      <td className="p-3 text-slate-500">{rec.date}</td>
                      <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                        {rec.checkIn} {rec.checkOut ? `– ${rec.checkOut}` : ''}
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-slate-800 dark:text-white">
                          {rec.hoursWorked} hrs
                        </span>
                        {rec.overtimeHours && (
                          <span className="text-[10px] text-amber-500 block font-semibold">
                            +{rec.overtimeHours}h OT
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <select
                          value={rec.status}
                          onChange={(e) =>
                            handleQuickStatusChange(rec.id, e.target.value as AttendanceRecord['status'])
                          }
                          className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition-colors outline-hidden ${
                            rec.status === 'Present'
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-700 dark:text-emerald-300'
                              : rec.status === 'Remote'
                              ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-300 text-sky-700 dark:text-sky-300'
                              : rec.status === 'Late'
                              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 text-rose-700 dark:text-rose-300'
                              : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 text-amber-700 dark:text-amber-300'
                          }`}
                        >
                          <option value="Present">Present (In Office)</option>
                          <option value="Remote">Remote (WFH)</option>
                          <option value="Late">Late Arrival</option>
                          <option value="Half Day">Half Day</option>
                          <option value="On Leave">On Leave</option>
                        </select>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setAttendanceToEdit(rec);
                              setIsAttendanceModalOpen(true);
                            }}
                            className="p-1 text-slate-400 hover:text-sky-500 rounded"
                            title="Edit Record"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAttendance(rec.id, rec.memberName)}
                            className="p-1 text-slate-400 hover:text-rose-500 rounded"
                            title="Delete Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: PERFORMANCE & OKRS                                      */}
      {/* ============================================================== */}
      {activeTab === 'performance' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Top Performers Leaderboard */}
            <div className={`p-4 rounded-2xl border ${cardBg}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-500" />
                  Top Performers Leaderboard
                </h3>
                <span className="text-[10px] font-bold text-slate-400">Q3 2026</span>
              </div>

              <div className="space-y-2.5">
                {employees
                  .slice()
                  .sort((a, b) => b.productivity - a.productivity)
                  .slice(0, 5)
                  .map((emp, rank) => (
                    <div
                      key={emp.id}
                      onClick={() => setActiveDrawerMember(emp)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer hover:border-sky-500 transition-colors ${
                        isLight ? 'bg-slate-50 border-sky-100' : 'bg-slate-800 border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                            rank === 0
                              ? 'bg-amber-400 text-amber-950'
                              : rank === 1
                              ? 'bg-slate-300 text-slate-900'
                              : rank === 2
                              ? 'bg-amber-700 text-white'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                          }`}
                        >
                          {rank + 1}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-white">
                            {emp.name}
                          </p>
                          <span className="text-[10px] text-slate-400">{emp.role}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-extrabold text-sky-600 dark:text-sky-400">
                          {emp.productivity}%
                        </span>
                        <div className="flex items-center gap-0.5 text-[10px] text-amber-500 font-semibold justify-end">
                          <Star className="w-2.5 h-2.5 fill-amber-500" />
                          {emp.rating}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Quarterly Calibration Reviews */}
            <div className={`p-4 rounded-2xl border lg:col-span-2 ${cardBg}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Executive Performance Calibration Reviews
                </h3>
                <span className="text-xs text-sky-600 font-bold">Q3 Evaluated</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className={`p-3.5 rounded-xl border space-y-2.5 ${
                      isLight ? 'bg-slate-50 border-sky-100' : 'bg-slate-800/60 border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-sky-500 text-white font-bold text-xs flex items-center justify-center">
                          {rev.avatar}
                        </div>
                        <div>
                          <p className="font-bold text-xs text-slate-800 dark:text-white">
                            {rev.memberName}
                          </p>
                          <span className="text-[10px] text-slate-400">{rev.department}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-bold text-amber-500">
                        <Star className="w-3.5 h-3.5 fill-amber-500" />
                        {rev.rating} / 5.0
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 italic">
                      &ldquo;{rev.feedback}&rdquo;
                    </p>

                    <div className="pt-2 border-t border-sky-100/60 dark:border-slate-700 text-[10px] flex items-center justify-between text-slate-400">
                      <span>Reviewer: {rev.reviewer}</span>
                      <span className="font-bold text-emerald-600">OKR Score: {rev.okrScore}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 5: LEAVE & TIME-OFF                                        */}
      {/* ============================================================== */}
      {activeTab === 'leave' && (
        <div className="space-y-4">
          <div className={`p-4 rounded-2xl border ${cardBg}`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Leave &amp; Time-Off Approvals Queue
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Review and act on pending vacation, sick leaves, and personal time-off requests
                </p>
              </div>

              {/* Status Filter Tabs & Submit Button */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs">
                  {(['All', 'Pending', 'Approved', 'Rejected'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setLeaveFilter(st)}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                        leaveFilter === st
                          ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setIsLeaveModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 shadow-sm"
                >
                  <Plane className="w-3.5 h-3.5" />
                  Submit Leave
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr
                    className={`border-b text-[10px] font-bold uppercase tracking-wider ${
                      isLight ? 'bg-sky-50/50 text-slate-500' : 'bg-slate-800/50 text-slate-400'
                    }`}
                  >
                    <th className="p-3">Employee</th>
                    <th className="p-3">Leave Type</th>
                    <th className="p-3">Period</th>
                    <th className="p-3">Days</th>
                    <th className="p-3">Reason</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Approval Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sky-100/40 dark:divide-slate-800">
                  {filteredLeaveRequests.map((req) => (
                    <tr
                      key={req.id}
                      className="hover:bg-sky-50/40 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                            {req.avatar}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">
                              {req.memberName}
                            </p>
                            <span className="text-[10px] text-slate-400">{req.department}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">
                        {req.leaveType}
                      </td>
                      <td className="p-3 text-slate-500">
                        {req.startDate} &rarr; {req.endDate}
                      </td>
                      <td className="p-3 font-bold text-slate-800 dark:text-white">
                        {req.days} days
                      </td>
                      <td className="p-3 text-slate-500 max-w-xs truncate" title={req.reason}>
                        {req.reason}
                      </td>
                      <td className="p-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            req.status === 'Approved'
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                              : req.status === 'Pending'
                              ? 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                              : 'bg-rose-500/10 text-rose-600 border-rose-500/30'
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {req.status === 'Pending' ? (
                            <>
                              <button
                                onClick={() => handleApproveLeave(req.id)}
                                className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors shadow-2xs"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleRejectLeave(req.id)}
                                className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-rose-500 text-white hover:bg-rose-600 transition-colors shadow-2xs"
                              >
                                Reject
                              </button>
                            </>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-medium mr-1">
                              {req.reviewedBy || 'Manager'}
                            </span>
                          )}
                          <button
                            onClick={() => handleDeleteLeave(req.id)}
                            className="p-1 text-slate-400 hover:text-rose-500"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 6: HIRING REQUISITIONS (ADMIN CAN POST, EDIT, DELETE, STAGE)*/}
      {/* ============================================================== */}
      {activeTab === 'recruitment' && (
        <div className="space-y-4">
          <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${cardBg}`}>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Hiring Requisitions &amp; Candidate Pipeline ({jobs.length})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Admin controls to post new requisitions, edit salary bands, advance pipeline stages, and close filled roles
              </p>
            </div>
            <button
              onClick={() => {
                setJobToEdit(null);
                setIsJobModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Post New Job</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {jobs.map((job) => (
              <div
                key={job.id}
                className={`p-5 rounded-2xl border flex flex-col justify-between group hover:shadow-md transition-all ${cardBg}`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                        {job.department}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                        {job.title}
                      </h3>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {job.type} • {job.experienceLevel}
                      </span>
                    </div>

                    {/* Admin Action Menu: Edit & Delete */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setJobToEdit(job);
                          setIsJobModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-sky-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Edit Job Requisition"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteJob(job.id, job.title)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Delete Requisition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Stage Switcher */}
                  <div className="flex items-center gap-2 my-2.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Hiring Stage:</span>
                    <select
                      value={job.stage}
                      onChange={(e) =>
                        handleUpdateJobStage(job.id, e.target.value as JobRequisition['stage'])
                      }
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors outline-hidden ${
                        job.stage === 'Interviewing'
                          ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-300 text-sky-700 dark:text-sky-300'
                          : job.stage === 'Final Review'
                          ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-300 text-purple-700 dark:text-purple-300'
                          : job.stage === 'Offer Extended'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-700 dark:text-emerald-300'
                          : job.stage === 'Closed'
                          ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 text-slate-500'
                          : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 text-amber-700 dark:text-amber-300'
                      }`}
                    >
                      <option value="Sourcing">Sourcing</option>
                      <option value="Interviewing">Interviewing</option>
                      <option value="Final Review">Final Review</option>
                      <option value="Offer Extended">Offer Extended</option>
                      <option value="Closed">Closed / Filled</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-sky-100/60 dark:border-slate-700/60 text-center my-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">Compensation</span>
                      <span className="font-bold text-slate-800 dark:text-white">
                        {formatMoney(job.salaryBand, currency.symbol)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">Applicants</span>
                      <div className="flex items-center justify-center gap-1.5 mt-0.5">
                        <button
                          onClick={() => handleAdjustApplicants(job.id, -1)}
                          className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-[10px] hover:bg-slate-300"
                          title="Subtract applicant"
                        >
                          -
                        </button>
                        <span className="font-extrabold text-sky-600 dark:text-sky-400">
                          {job.applicantsCount}
                        </span>
                        <button
                          onClick={() => handleAdjustApplicants(job.id, 1)}
                          className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-[10px] hover:bg-slate-300"
                          title="Add applicant"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">Hiring Mgr</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {job.hiringManager}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-sky-100/60 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px]">Posted on {job.postedDate}</span>
                  <button
                    onClick={() => {
                      setJobToEdit(job);
                      setIsJobModalOpen(true);
                    }}
                    className="font-bold text-sky-600 dark:text-sky-400 hover:underline"
                  >
                    Manage Requisition &rarr;
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODALS & DRAWERS                                               */}
      {/* ============================================================== */}
      <MemberDetailsDrawer
        isOpen={!!activeDrawerMember}
        member={activeDrawerMember}
        onClose={() => setActiveDrawerMember(null)}
        onEdit={(m) => {
          setMemberToEdit(m);
          setIsEditMemberModalOpen(true);
        }}
        onToggleStatus={handleToggleStatus}
      />

      <AddMemberModal
        isOpen={isAddMemberModalOpen}
        onClose={() => setIsAddMemberModalOpen(false)}
        onAddMember={handleAddMember}
        existingManagers={managersList}
      />

      <EditMemberModal
        isOpen={isEditMemberModalOpen}
        member={memberToEdit}
        onClose={() => {
          setIsEditMemberModalOpen(false);
          setMemberToEdit(null);
        }}
        onSave={handleUpdateMember}
        existingManagers={managersList}
      />

      <RequestLeaveModal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        employees={employees}
        onRequestLeave={handleRequestLeave}
      />

      <DepartmentModal
        isOpen={isDeptModalOpen}
        department={deptToEdit}
        onClose={() => {
          setIsDeptModalOpen(false);
          setDeptToEdit(null);
        }}
        onSave={handleSaveDepartment}
        existingManagers={managersList}
      />

      <AttendanceModal
        isOpen={isAttendanceModalOpen}
        record={attendanceToEdit}
        onClose={() => {
          setIsAttendanceModalOpen(false);
          setAttendanceToEdit(null);
        }}
        onSave={handleSaveAttendance}
        employees={employees}
      />

      <JobModal
        isOpen={isJobModalOpen}
        job={jobToEdit}
        onClose={() => {
          setIsJobModalOpen(false);
          setJobToEdit(null);
        }}
        onSave={handleSaveJob}
        departments={departmentNames}
        existingManagers={managersList}
      />
    </div>
  );
};
