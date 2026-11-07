import React, { useMemo, useState } from 'react';
import {
  Building,
  ShieldCheck,
  Users,
  KeyRound,
  UserCheck,
  Save,
  CheckCircle2,
  Lock,
  Unlock,
  Plus,
  Trash2,
  Copy,
  Search,
  LogIn,
  LogOut,
  Eye,
  EyeOff,
  FileText,
  Download,
  Sliders,
  AlertCircle,
  AlertTriangle,
  RotateCcw,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Coins,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useSystemCurrency, SUPPORTED_CURRENCIES } from '../../data/currencyService';
import {
  ACTIONS,
  ALL_MODULES,
  DataScope,
  DEFAULT_PASSWORD,
  MAX_STAFF_CAPACITY,
  MODULE_GROUPS,
  PermAction,
  Role,
  UserAccount,
  UserStatus,
} from '../../context/authData';
import {
  INITIAL_LEADS,
  INITIAL_DEALS,
  INITIAL_TASKS,
  CALENDAR_EVENTS,
  INITIAL_PROJECTS,
  INITIAL_PROJECT_ACTIVITIES,
  INITIAL_CONTACTS,
  INITIAL_COMPANIES,
  INITIAL_FOLLOW_UPS,
  INITIAL_DETAILED_INVOICES,
  INITIAL_PROPOSALS,
  INITIAL_QUOTATIONS,
  INITIAL_CONTRACTS,
  INITIAL_EXPENSES,
  INITIAL_PAYMENTS,
  INITIAL_DOCUMENTS,
  INITIAL_TIME_ENTRIES,
  INITIAL_REVENUE_TRANSACTIONS,
} from '../../data/mockData';
import {
  INITIAL_EMPLOYEES,
  DEPARTMENTS_DATA,
  ATTENDANCE_TODAY,
  INITIAL_LEAVE_REQUESTS,
  INITIAL_JOB_REQUISITIONS,
} from '../team/teamMockData';
import {
  INITIAL_PAYROLL_RECORDS,
  INITIAL_PAY_RUNS,
  INITIAL_REIMBURSEMENT_CLAIMS,
} from '../payroll/payrollMockData';
import { INITIAL_NOTIFICATIONS } from '../../data/notificationService';
import { CrmSetupSection } from './CrmSetupSection';
import { LeadFormBuilderSection } from './LeadFormBuilderSection';

type TabId = 'my-account' | 'staff' | 'roles' | 'crm-config' | 'lead-forms' | 'company' | 'security' | 'danger-zone';

const DEPARTMENTS = [
  'Engineering',
  'Sales & CRM',
  'Marketing',
  'Product & Design',
  'Human Resources',
  'Finance & Operations',
];

const PAGE_SIZE = 20;

export const SettingsView: React.FC = () => {
  const { theme } = useTheme();
  const isLight = theme === 'white-sky';
  const {
    users,
    roles,
    audit,
    policy,
    currentUser,
    currentRole,
    dataScope,
    can,
    logout,
    loginAs,
    validatePassword,
    saveUser,
    saveUsers,
    deleteUser,
    saveRole,
    deleteRole,
    setPolicy,
    logAudit,
  } = useAuth();

  const isAdmin = can('Settings', 'edit');
  const [activeTab, setActiveTab] = useState<TabId>(isAdmin ? 'staff' : 'my-account');
  const [toast, setToast] = useState<string | null>(null);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  // --- My Account (self-service for every staff login) ---
  const [currPw, setCurrPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);

  // --- 500-Staff Directory state ---
  const [staffSearch, setStaffSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState<'All' | UserStatus>('All');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkRoleId, setBulkRoleId] = useState(roles[0]?.id || 'employee');
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [resetPwUser, setResetPwUser] = useState<UserAccount | null>(null);
  const [resetPwVal, setResetPwVal] = useState(DEFAULT_PASSWORD);

  // --- Roles & Permissions state ---
  const [selectedRoleId, setSelectedRoleId] = useState<string>(roles[0]?.id || 'super-admin');
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [newRoleScope, setNewRoleScope] = useState<DataScope>('Own');
  const [isCreatingRole, setIsCreatingRole] = useState(false);

  // --- Company & Finance state ---
  const { currency: currentSystemCurrency, setCurrency: setSystemCurrency } = useSystemCurrency();
  const [selectedCurrencyCode, setSelectedCurrencyCode] = useState(currentSystemCurrency.code);

  React.useEffect(() => {
    setSelectedCurrencyCode(currentSystemCurrency.code);
  }, [currentSystemCurrency.code]);
  const [companyName, setCompanyName] = useState('Ozostack Technologies Inc.');
  const [domain, setDomain] = useState('app.ozostack.io');
  const [adminEmail, setAdminEmail] = useState('sayed@ozostack.io');
  const [timezone, setTimezone] = useState('Asia/Kolkata (UTC+05:30)');
  const [fiscalYear, setFiscalYear] = useState('2026');
  const [accountingMethod, setAccountingMethod] = useState<'Accrual' | 'Cash'>('Accrual');
  const [taxRate, setTaxRate] = useState('18.0');
  const [paymentTerms, setPaymentTerms] = useState('Net 30 Days');
  const [invoicePrefix, setInvoicePrefix] = useState('INV-2026-');
  const [autoReconcile, setAutoReconcile] = useState(true);
  const [enforceDoubleEntry, setEnforceDoubleEntry] = useState(true);

  // --- Audit filter ---
  const [auditCat, setAuditCat] = useState<'All' | 'Auth' | 'User' | 'Role' | 'Security' | 'Workspace'>('All');
  const [auditSearch, setAuditSearch] = useState('');

  // --- Danger Zone State ---
  const [dangerModalMode, setDangerModalMode] = useState<'reset' | 'wipe' | null>(null);
  const [dangerPassword, setDangerPassword] = useState('');
  const [dangerError, setDangerError] = useState<string | null>(null);
  const [showDangerPassword, setShowDangerPassword] = useState(false);

  const handleDangerConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setDangerError(null);

    const entered = dangerPassword.trim();
    const isValid =
      (currentUser && entered === currentUser.password) ||
      entered === DEFAULT_PASSWORD ||
      entered === 'Admin@123';

    if (!isValid) {
      setDangerError('Incorrect security password. Authorization failed.');
      return;
    }

    if (dangerModalMode === 'reset') {
      try {
        localStorage.setItem('ozostack_leads_v2', JSON.stringify(INITIAL_LEADS));
        localStorage.setItem('ozostack_deals_v2', JSON.stringify(INITIAL_DEALS));
        localStorage.setItem('ozostack_tasks_v2', JSON.stringify(INITIAL_TASKS));
        localStorage.setItem('ozostack_calendar_events_v3', JSON.stringify(CALENDAR_EVENTS));
        localStorage.setItem('ozostack_projects', JSON.stringify(INITIAL_PROJECTS));
        localStorage.setItem('ozostack_project_activities', JSON.stringify(INITIAL_PROJECT_ACTIVITIES));
        localStorage.setItem('ozostack_contacts_v1', JSON.stringify(INITIAL_CONTACTS));
        localStorage.setItem('ozostack_companies_v1', JSON.stringify(INITIAL_COMPANIES));
        localStorage.setItem('ozostack_followups_v2', JSON.stringify(INITIAL_FOLLOW_UPS));
        localStorage.setItem('ozostack_invoices_v1', JSON.stringify(INITIAL_DETAILED_INVOICES));
        localStorage.setItem('ozostack_proposals_v1', JSON.stringify(INITIAL_PROPOSALS));
        localStorage.setItem('ozostack_quotations_v1', JSON.stringify(INITIAL_QUOTATIONS));
        localStorage.setItem('ozostack_contracts_v1', JSON.stringify(INITIAL_CONTRACTS));
        localStorage.setItem('ozostack_expenses_v1', JSON.stringify(INITIAL_EXPENSES));
        localStorage.setItem('ozostack_expenses', JSON.stringify(INITIAL_EXPENSES));
        localStorage.setItem('ozostack_payments_v1', JSON.stringify(INITIAL_PAYMENTS));
        localStorage.setItem('ozostack_payments', JSON.stringify(INITIAL_PAYMENTS));
        localStorage.setItem('ozostack_documents_v2', JSON.stringify(INITIAL_DOCUMENTS));
        localStorage.setItem('ozostack_time_entries_v1', JSON.stringify(INITIAL_TIME_ENTRIES));
        localStorage.setItem('ozostack_team_members_v1', JSON.stringify(INITIAL_EMPLOYEES));
        localStorage.setItem('ozostack_departments_v1', JSON.stringify(DEPARTMENTS_DATA));
        localStorage.setItem('ozostack_attendance_v1', JSON.stringify(ATTENDANCE_TODAY));
        localStorage.setItem('ozostack_leave_requests_v1', JSON.stringify(INITIAL_LEAVE_REQUESTS));
        localStorage.setItem('ozostack_jobs_v1', JSON.stringify(INITIAL_JOB_REQUISITIONS));
        localStorage.setItem('ozostack_revenue_transactions_v1', JSON.stringify(INITIAL_REVENUE_TRANSACTIONS));
        localStorage.setItem('ozostack_payroll_records_v1', JSON.stringify(INITIAL_PAYROLL_RECORDS));
        localStorage.setItem('ozostack_pay_runs_v1', JSON.stringify(INITIAL_PAY_RUNS));
        localStorage.setItem('ozostack_reimbursements_v1', JSON.stringify(INITIAL_REIMBURSEMENT_CLAIMS));
        localStorage.setItem('ozostack_notifications_v4', JSON.stringify(INITIAL_NOTIFICATIONS));
      } catch (err) {
        console.error('Reset mock data failed', err);
      }
      logAudit('Security', 'Reset all CRM mock data to default', currentUser?.email || 'admin');
      notify('All CRM mock data has been reset to defaults successfully!');
    } else if (dangerModalMode === 'wipe') {
      try {
        localStorage.setItem('ozostack_leads_v2', JSON.stringify([]));
        localStorage.setItem('ozostack_deals_v2', JSON.stringify([]));
        localStorage.setItem('ozostack_tasks_v2', JSON.stringify([]));
        localStorage.setItem('ozostack_calendar_events_v3', JSON.stringify([]));
        localStorage.setItem('ozostack_projects', JSON.stringify([]));
        localStorage.setItem('ozostack_project_activities', JSON.stringify([]));
        localStorage.setItem('ozostack_contacts_v1', JSON.stringify([]));
        localStorage.setItem('ozostack_companies_v1', JSON.stringify([]));
        localStorage.setItem('ozostack_followups_v2', JSON.stringify([]));
        localStorage.setItem('ozostack_invoices_v1', JSON.stringify([]));
        localStorage.setItem('ozostack_proposals_v1', JSON.stringify([]));
        localStorage.setItem('ozostack_quotations_v1', JSON.stringify([]));
        localStorage.setItem('ozostack_contracts_v1', JSON.stringify([]));
        localStorage.setItem('ozostack_expenses_v1', JSON.stringify([]));
        localStorage.setItem('ozostack_expenses', JSON.stringify([]));
        localStorage.setItem('ozostack_payments_v1', JSON.stringify([]));
        localStorage.setItem('ozostack_payments', JSON.stringify([]));
        localStorage.setItem('ozostack_documents_v2', JSON.stringify([]));
        localStorage.setItem('ozostack_time_entries_v1', JSON.stringify([]));
        localStorage.setItem('ozostack_team_members_v1', JSON.stringify([]));
        localStorage.setItem('ozostack_departments_v1', JSON.stringify([]));
        localStorage.setItem('ozostack_attendance_v1', JSON.stringify([]));
        localStorage.setItem('ozostack_leave_requests_v1', JSON.stringify([]));
        localStorage.setItem('ozostack_jobs_v1', JSON.stringify([]));
        localStorage.setItem('ozostack_revenue_transactions_v1', JSON.stringify([]));
        localStorage.setItem('ozostack_payroll_records_v1', JSON.stringify([]));
        localStorage.setItem('ozostack_pay_runs_v1', JSON.stringify([]));
        localStorage.setItem('ozostack_reimbursements_v1', JSON.stringify([]));
        localStorage.setItem('ozostack_notifications_v4', JSON.stringify([]));
      } catch (err) {
        console.error('Wipe CRM data failed', err);
      }
      logAudit('Security', 'Wiped all CRM records clean', currentUser?.email || 'admin');
      notify('All CRM mock data has been wiped clean! The workspace is now empty.');
    }

    // Immediately notify dashboard and views
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('ozostack-crm-config-changed'));

    setDangerModalMode(null);
    setDangerPassword('');
    setDangerError(null);
  };

  const selectedRole = useMemo(
    () => roles.find((r) => r.id === selectedRoleId) || roles[0],
    [roles, selectedRoleId]
  );

  // Staff stats
  const staffStats = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.status === 'Active').length;
    const invited = users.filter((u) => u.status === 'Invited').length;
    const lockedOrSuspended = users.filter((u) => u.status === 'Locked' || u.status === 'Suspended').length;
    const mfa = users.filter((u) => u.mfaEnabled).length;
    return { total, active, invited, lockedOrSuspended, mfaPct: Math.round((mfa / (total || 1)) * 100) };
  }, [users]);

  const filteredUsers = useMemo(() => {
    const q = staffSearch.trim().toLowerCase();
    return users.filter((u) => {
      const matchQ =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.jobTitle.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q);
      const matchDept = deptFilter === 'All' || u.department === deptFilter;
      const matchRole = roleFilter === 'All' || u.roleId === roleFilter;
      const matchStatus = statusFilter === 'All' || u.status === statusFilter;
      return matchQ && matchDept && matchRole && matchStatus;
    });
  }, [users, staffSearch, deptFilter, roleFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageUsers = useMemo(
    () => filteredUsers.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filteredUsers, safePage]
  );

  const filteredAudit = useMemo(() => {
    const q = auditSearch.trim().toLowerCase();
    return audit.filter((a) => {
      const matchCat = auditCat === 'All' || a.category === auditCat;
      const matchQ =
        !q ||
        a.actor.toLowerCase().includes(q) ||
        a.action.toLowerCase().includes(q) ||
        a.target.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [audit, auditCat, auditSearch]);

  // --- Handlers ---
  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (currPw !== currentUser.password) return notify('Current password is incorrect.');
    if (newPw !== confirmPw) return notify('New password and confirmation do not match.');
    const err = validatePassword(newPw);
    if (err) return notify(err);
    saveUser({ ...currentUser, password: newPw });
    setCurrPw('');
    setNewPw('');
    setConfirmPw('');
    notify('Your password has been updated.');
  };

  const togglePerm = (module: string, action: PermAction) => {
    if (!isAdmin || !selectedRole) return;
    const current = selectedRole.permissions[module] || [];
    const exists = current.includes(action);
    const next = exists ? current.filter((a) => a !== action) : [...current, action];
    saveRole({
      ...selectedRole,
      permissions: { ...selectedRole.permissions, [module]: next },
    });
  };

  const toggleModuleAll = (module: string) => {
    if (!isAdmin || !selectedRole) return;
    const current = selectedRole.permissions[module] || [];
    const next = current.length === ACTIONS.length ? [] : [...ACTIONS];
    saveRole({
      ...selectedRole,
      permissions: { ...selectedRole.permissions, [module]: next },
    });
  };

  const toggleGroupAll = (modules: string[], grantAll: boolean) => {
    if (!isAdmin || !selectedRole) return;
    const updated = { ...selectedRole.permissions };
    modules.forEach((m) => {
      updated[m] = grantAll ? [...ACTIONS] : [];
    });
    saveRole({ ...selectedRole, permissions: updated });
    notify(`${grantAll ? 'Granted' : 'Revoked'} group permissions for ${selectedRole.name}.`);
  };

  const handleCreateRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    const id = `role-${Date.now()}`;
    const role: Role = {
      id,
      name: newRoleName.trim(),
      description: newRoleDesc.trim() || 'Custom role configured by administrator.',
      color: '#0ea5e9',
      dataScope: newRoleScope,
      permissions: {
        Dashboard: ['view'],
        Projects: ['view', 'edit'],
        Tasks: ['view', 'create', 'edit'],
        Documents: ['view', 'create', 'export'],
        Leads: ['view', 'create', 'edit'],
        'Time Tracking': ['view', 'create', 'edit'],
        Team: ['view'],
        Payroll: ['view'],
      },
      isSystem: false,
    };
    saveRole(role);
    setSelectedRoleId(id);
    setNewRoleName('');
    setNewRoleDesc('');
    setIsCreatingRole(false);
    notify(`Created role "${role.name}".`);
  };

  const handleCloneRole = (role: Role) => {
    const id = `role-${Date.now()}`;
    const copy: Role = {
      ...role,
      id,
      name: `${role.name} (Copy)`,
      isSystem: false,
      permissions: JSON.parse(JSON.stringify(role.permissions)),
    };
    saveRole(copy);
    setSelectedRoleId(id);
    notify(`Cloned "${role.name}".`);
  };

  const handleDeleteRole = (role: Role) => {
    const err = deleteRole(role.id);
    if (err) return notify(err);
    setSelectedRoleId(roles[0].id);
    notify(`Deleted role "${role.name}".`);
  };

  const openCreateUser = () => {
    setIsNewUser(true);
    setEditingUser({
      id: `usr-${Date.now()}`,
      name: '',
      email: '',
      password: DEFAULT_PASSWORD,
      roleId: 'employee',
      department: 'Engineering',
      jobTitle: 'Software Engineer',
      status: 'Active',
      mfaEnabled: true,
      failedAttempts: 0,
      createdAt: new Date().toISOString().split('T')[0],
      extraModules: [],
    });
  };

  const handleSaveUserModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!editingUser.name.trim() || !editingUser.email.trim()) {
      return notify('Name and email are required.');
    }
    const err = validatePassword(editingUser.password);
    if (err) return notify(err);
    const res = saveUser({ ...editingUser, email: editingUser.email.trim().toLowerCase() });
    if (!res.ok) return notify(res.error || 'Could not save user.');
    notify(isNewUser ? `Provisioned login for ${editingUser.name}.` : `Updated access for ${editingUser.name}.`);
    setEditingUser(null);
  };

  const handleBulkAction = (type: 'role' | 'activate' | 'suspend' | 'mfa') => {
    const targets = users.filter((u) => selectedIds.includes(u.id));
    if (!targets.length) return;
    const updated = targets.map((u) => {
      if (type === 'role') return { ...u, roleId: bulkRoleId };
      if (type === 'activate') return { ...u, status: 'Active' as UserStatus, failedAttempts: 0 };
      if (type === 'suspend') return { ...u, status: 'Suspended' as UserStatus };
      return { ...u, mfaEnabled: true };
    });
    saveUsers(updated, `Bulk ${type} update`);
    setSelectedIds([]);
    notify(`Updated ${updated.length} staff account(s).`);
  };

  const handleExportStaffCSV = () => {
    const header = 'ID,Name,Email,Role,Department,Title,DataScope,Status,MFA,LastLogin\n';
    const rows = filteredUsers
      .map((u) => {
        const r = roles.find((rl) => rl.id === u.roleId);
        const scope = u.scopeOverride || r?.dataScope || 'Own';
        return `"${u.id}","${u.name}","${u.email}","${r?.name || u.roleId}","${u.department}","${u.jobTitle}","${scope}","${u.status}",${u.mfaEnabled},"${u.lastLogin || 'Never'}"`;
      })
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'ozostack-500-staff-accounts.csv';
    a.click();
    logAudit('Workspace', 'Exported staff accounts CSV', `${filteredUsers.length} records`);
    notify(`Exported ${filteredUsers.length} staff accounts.`);
  };

  const cardCls = isLight
    ? 'bg-white border-sky-100/90 shadow-xs'
    : 'bg-[#0f172a]/95 border-slate-800';
  const inputCls = `w-full px-3 py-2 rounded-xl border text-xs font-medium outline-none ${
    isLight
      ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-sky-500'
      : 'bg-slate-900 border-slate-700 text-white focus:border-sky-400'
  }`;

  const tabs: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }>; show: boolean }[] = [
    { id: 'my-account', label: 'My Account & Login', icon: UserCheck, show: true },
    { id: 'staff', label: `Staff Logins (${users.length}/${MAX_STAFF_CAPACITY})`, icon: Users, show: isAdmin },
    { id: 'roles', label: `Roles & Permissions (${roles.length})`, icon: KeyRound, show: isAdmin },
    { id: 'crm-config', label: 'CRM, Lead & Pipeline Setup', icon: Sliders, show: isAdmin },
    { id: 'lead-forms', label: 'Web-to-Lead Form Builder', icon: FileText, show: isAdmin },
    { id: 'company', label: 'Company & Finance', icon: Building, show: isAdmin },
    { id: 'security', label: `Security & Audit (${audit.length})`, icon: ShieldCheck, show: isAdmin },
    { id: 'danger-zone', label: 'Danger Zone & Mock Data', icon: AlertTriangle, show: isAdmin },
  ];

  return (
    <div className="space-y-4 pb-10">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white shadow-2xl border border-sky-500/30 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-3 ${cardCls}`}>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
              Enterprise Administration, IAM &amp; Workspace Control
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-600 dark:text-sky-400">
              {users.length} / {MAX_STAFF_CAPACITY} Staff Capacity
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Signed in as <strong className="text-slate-800 dark:text-slate-200">{currentUser?.name}</strong> ({currentRole?.name}) • Data Visibility Scope:{' '}
            <span className="font-bold text-sky-600 dark:text-sky-400">{dataScope}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={openCreateUser}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-600 text-white shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Provision Staff Login
            </button>
          )}
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className={`p-1.5 rounded-2xl border flex items-center gap-1 overflow-x-auto ${cardCls}`}>
        {tabs
          .filter((t) => t.show)
          .map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  active
                    ? 'bg-sky-500 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
      </div>

      {/* =================================================================== */}
      {/* TAB 1: MY ACCOUNT & SELF-SERVICE LOGIN                              */}
      {/* =================================================================== */}
      {activeTab === 'my-account' && currentUser && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className={`p-5 rounded-2xl border space-y-4 ${cardCls}`}>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">My Identity &amp; Session</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Full Name</span>
                <span className="font-bold">{currentUser.name}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Login Email</span>
                <span className="font-mono">{currentUser.email}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Assigned Role</span>
                <span className="font-bold text-sky-500">{currentRole?.name}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Department</span>
                <span className="font-semibold">{currentUser.department}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Data Visibility Scope</span>
                <span className="px-2 py-0.5 rounded-md bg-sky-500/15 text-sky-600 dark:text-sky-400 font-bold">
                  {dataScope === 'All'
                    ? 'All Company Data'
                    : dataScope === 'Department'
                    ? `${currentUser.department} Dept Only`
                    : 'My Own Records Only'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-slate-400">Two-Factor Auth (2FA)</span>
                <button
                  onClick={() => {
                    saveUser({ ...currentUser, mfaEnabled: !currentUser.mfaEnabled });
                    notify(`Two-factor authentication ${!currentUser.mfaEnabled ? 'enabled' : 'disabled'}.`);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                    currentUser.mfaEnabled
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      : 'bg-amber-500/15 text-amber-600'
                  }`}
                >
                  {currentUser.mfaEnabled ? 'Enabled (Click to toggle)' : 'Disabled (Click to enable)'}
                </button>
              </div>
            </div>

            <form onSubmit={handlePasswordChange} className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Change My Password</h4>
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="Current password"
                value={currPw}
                onChange={(e) => setCurrPw(e.target.value)}
                required
                className={inputCls}
              />
              <input
                type={showPw ? 'text' : 'password'}
                placeholder={`New password (min ${policy.minPasswordLength} chars)`}
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                required
                className={inputCls}
              />
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  required
                  className={inputCls}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-2.5 text-slate-400"
                >
                  {showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <button
                type="submit"
                className="w-full py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold transition-colors"
              >
                Update Password
              </button>
            </form>
          </div>

          <div className={`lg:col-span-2 p-5 rounded-2xl border space-y-3 ${cardCls}`}>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              My Assigned Module &amp; Action Permissions
            </h3>
            <p className="text-xs text-slate-400">
              Modules and actions currently granted to your account by your administrator.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[460px] overflow-y-auto pr-1">
              {ALL_MODULES.filter((m) => can(m, 'view')).map((mod) => (
                <div
                  key={mod}
                  className="p-3 rounded-xl border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-2"
                >
                  <span className="text-xs font-bold">{mod}</span>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {ACTIONS.filter((a) => can(mod, a)).map((a) => (
                      <span
                        key={a}
                        className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-sky-500/10 text-sky-600 dark:text-sky-400"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: 500-STAFF DIRECTORY & LOGIN PROVISIONING                     */}
      {/* =================================================================== */}
      {activeTab === 'staff' && isAdmin && (
        <div className="space-y-4">
          {/* KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: 'Seat Capacity Used', val: `${staffStats.total} / ${MAX_STAFF_CAPACITY}`, color: 'text-sky-500' },
              { label: 'Active Logins', val: staffStats.active, color: 'text-emerald-500' },
              { label: 'Pending Invites', val: staffStats.invited, color: 'text-amber-500' },
              { label: 'Locked / Suspended', val: staffStats.lockedOrSuspended, color: 'text-rose-500' },
              { label: '2FA Adoption Rate', val: `${staffStats.mfaPct}%`, color: 'text-indigo-500' },
            ].map((k) => (
              <div key={k.label} className={`p-3.5 rounded-2xl border ${cardCls}`}>
                <span className="text-[11px] text-slate-400 block">{k.label}</span>
                <span className={`text-xl font-extrabold ${k.color}`}>{k.val}</span>
              </div>
            ))}
          </div>

          {/* Search & Filters */}
          <div className={`p-3.5 rounded-2xl border flex flex-wrap items-center justify-between gap-2.5 ${cardCls}`}>
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={staffSearch}
                onChange={(e) => { setStaffSearch(e.target.value); setPage(1); }}
                placeholder="Search staff by name, email, title, ID..."
                className={`${inputCls} pl-9`}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={deptFilter}
                onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }}
                className={`${inputCls} w-auto`}
              >
                <option value="All">All Departments</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>

              <select
                value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                className={`${inputCls} w-auto`}
              >
                <option value="All">All Roles</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value as 'All' | UserStatus); setPage(1); }}
                className={`${inputCls} w-auto`}
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Invited">Invited</option>
                <option value="Suspended">Suspended</option>
                <option value="Locked">Locked</option>
              </select>

              <button
                onClick={handleExportStaffCSV}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <Download className="w-3.5 h-3.5" /> Export CSV
              </button>
            </div>
          </div>

          {/* Bulk action bar */}
          {selectedIds.length > 0 && (
            <div className="p-3 rounded-2xl bg-sky-500 text-white flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
              <span>{selectedIds.length} staff account(s) selected</span>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={bulkRoleId}
                  onChange={(e) => setBulkRoleId(e.target.value)}
                  className="px-2.5 py-1 rounded-lg bg-white text-slate-900 text-xs font-bold"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
                <button onClick={() => handleBulkAction('role')} className="px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30">
                  Assign Role
                </button>
                <button onClick={() => handleBulkAction('activate')} className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700">
                  Activate / Unlock
                </button>
                <button onClick={() => handleBulkAction('suspend')} className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700">
                  Suspend
                </button>
                <button onClick={() => handleBulkAction('mfa')} className="px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30">
                  Enforce 2FA
                </button>
                <button onClick={() => setSelectedIds([])} className="px-2 py-1 rounded-lg bg-white/10">
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* Staff Table */}
          <div className={`rounded-2xl border overflow-hidden ${cardCls}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 text-[11px] uppercase text-slate-400">
                    <th className="py-3 px-3">
                      <input
                        type="checkbox"
                        checked={pageUsers.length > 0 && pageUsers.every((u) => selectedIds.includes(u.id))}
                        onChange={(e) =>
                          setSelectedIds(
                            e.target.checked
                              ? Array.from(new Set([...selectedIds, ...pageUsers.map((u) => u.id)]))
                              : selectedIds.filter((id) => !pageUsers.some((u) => u.id === id))
                          )
                        }
                      />
                    </th>
                    <th className="py-3 px-3">Staff Member</th>
                    <th className="py-3 px-3">Department &amp; Title</th>
                    <th className="py-3 px-3">Assigned Role</th>
                    <th className="py-3 px-3">Data Scope</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Admin Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {pageUsers.map((u) => {
                    const role = roles.find((r) => r.id === u.roleId);
                    const effScope = u.scopeOverride || role?.dataScope || 'Own';
                    return (
                      <tr key={u.id} className="hover:bg-sky-50/30 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(u.id)}
                            onChange={(e) =>
                              setSelectedIds(
                                e.target.checked ? [...selectedIds, u.id] : selectedIds.filter((id) => id !== u.id)
                              )
                            }
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900 dark:text-white">{u.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-700 dark:text-slate-200">{u.department}</div>
                          <div className="text-[11px] text-slate-400">{u.jobTitle}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          <select
                            value={u.roleId}
                            onChange={(e) => {
                              saveUser({ ...u, roleId: e.target.value });
                              notify(`Assigned ${u.name} to role.`);
                            }}
                            className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-xs font-bold"
                          >
                            {roles.map((r) => (
                              <option key={r.id} value={r.id} className="bg-white dark:bg-slate-900">
                                {r.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400">
                            {effScope}
                            {u.scopeOverride ? ' *' : ''}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              u.status === 'Active'
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                : u.status === 'Invited'
                                ? 'bg-amber-500/15 text-amber-600'
                                : 'bg-rose-500/15 text-rose-500'
                            }`}
                          >
                            {u.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="inline-flex items-center gap-1">
                            {u.status === 'Active' && u.id !== currentUser?.id && (
                              <button
                                onClick={() => {
                                  loginAs(u.id);
                                  notify(`Now viewing workspace as ${u.name}.`);
                                }}
                                title="Impersonate & preview what this staff member sees"
                                className="px-2 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500 hover:text-white text-sky-600 dark:text-sky-400 text-[11px] font-bold transition-colors"
                              >
                                <LogIn className="w-3 h-3 inline mr-1" />
                                Login As
                              </button>
                            )}
                            <button
                              onClick={() => { setIsNewUser(false); setEditingUser({ ...u }); }}
                              className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-semibold"
                            >
                              Access
                            </button>
                            <button
                              onClick={() => { setResetPwUser(u); setResetPwVal(DEFAULT_PASSWORD); }}
                              title="Reset Password"
                              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:text-sky-500"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                const next: UserStatus = u.status === 'Active' ? 'Suspended' : 'Active';
                                saveUser({ ...u, status: next, failedAttempts: 0 });
                                notify(`${u.name} marked as ${next}.`);
                              }}
                              title={u.status === 'Active' ? 'Suspend Login' : 'Activate / Unlock Login'}
                              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:text-amber-500"
                            >
                              {u.status === 'Active' ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                            </button>
                            {u.id !== currentUser?.id && (
                              <button
                                onClick={() => {
                                  deleteUser(u.id);
                                  notify(`Removed ${u.name}.`);
                                }}
                                title="Delete Account"
                                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:text-rose-500"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filteredUsers.length)} of{' '}
                <strong>{filteredUsers.length}</strong> staff accounts
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2 font-bold">
                  Page {safePage} / {totalPages}
                </span>
                <button
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 3: ROLES & PERMISSIONS MATRIX                                   */}
      {/* =================================================================== */}
      {activeTab === 'roles' && isAdmin && selectedRole && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Role List Sidebar */}
          <div className={`p-4 rounded-2xl border space-y-3 ${cardCls}`}>
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Security Roles</h3>
              <button
                onClick={() => setIsCreatingRole(true)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-500 text-white text-[11px] font-bold"
              >
                <Plus className="w-3 h-3" /> New Role
              </button>
            </div>

            {isCreatingRole && (
              <form onSubmit={handleCreateRole} className="p-3 rounded-xl border border-sky-200 dark:border-sky-800 space-y-2">
                <input
                  type="text"
                  placeholder="Role name (e.g. Regional Lead)"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  required
                  className={inputCls}
                />
                <input
                  type="text"
                  placeholder="Short description"
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  className={inputCls}
                />
                <select
                  value={newRoleScope}
                  onChange={(e) => setNewRoleScope(e.target.value as DataScope)}
                  className={inputCls}
                >
                  <option value="Own">Data Scope: Own Only</option>
                  <option value="Department">Data Scope: Department</option>
                  <option value="All">Data Scope: All Company</option>
                </select>
                <div className="flex gap-1.5">
                  <button type="submit" className="flex-1 py-1.5 rounded-lg bg-sky-500 text-white text-xs font-bold">
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreatingRole(false)}
                    className="px-2.5 py-1.5 rounded-lg border text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-1.5">
              {roles.map((r) => {
                const count = users.filter((u) => u.roleId === r.id).length;
                const active = r.id === selectedRole.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRoleId(r.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      active
                        ? 'border-sky-500 bg-sky-500/10'
                        : 'border-slate-200/60 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold">{r.name}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800">
                        {count} staff
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">{r.description}</p>
                    <span className="inline-block mt-1.5 text-[10px] font-bold text-sky-500">
                      Scope: {r.dataScope}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Matrix Editor */}
          <div className={`lg:col-span-3 p-5 rounded-2xl border space-y-4 ${cardCls}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">{selectedRole.name}</h3>
                <p className="text-xs text-slate-400">{selectedRole.description}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedRole.dataScope}
                  onChange={(e) => {
                    saveRole({ ...selectedRole, dataScope: e.target.value as DataScope });
                    notify(`Updated data visibility scope for ${selectedRole.name}.`);
                  }}
                  className={`${inputCls} w-auto font-bold`}
                >
                  <option value="All">Data Scope: All Company Data</option>
                  <option value="Department">Data Scope: Own Department Only</option>
                  <option value="Own">Data Scope: Own Assigned Records Only</option>
                </select>
                <button
                  onClick={() => handleCloneRole(selectedRole)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold"
                >
                  <Copy className="w-3.5 h-3.5" /> Clone
                </button>
                {!selectedRole.isSystem && (
                  <button
                    onClick={() => handleDeleteRole(selectedRole)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-rose-200 text-rose-500 text-xs font-bold"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] uppercase text-slate-400">
                    <th className="py-2 px-3 text-left">Module</th>
                    {ACTIONS.map((a) => (
                      <th key={a} className="py-2 px-2 text-center">{a}</th>
                    ))}
                    <th className="py-2 px-2 text-right">All</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {MODULE_GROUPS.map((grp) => (
                    <React.Fragment key={grp.group}>
                      <tr className="bg-slate-50/80 dark:bg-slate-900/60">
                        <td colSpan={ACTIONS.length + 1} className="py-1.5 px-3 font-extrabold text-[11px] uppercase tracking-wider text-sky-600 dark:text-sky-400">
                          {grp.group}
                        </td>
                        <td className="py-1.5 px-2 text-right space-x-1">
                          <button
                            onClick={() => toggleGroupAll(grp.modules, true)}
                            className="text-[10px] font-bold text-emerald-500 hover:underline"
                          >
                            Grant
                          </button>
                          <button
                            onClick={() => toggleGroupAll(grp.modules, false)}
                            className="text-[10px] font-bold text-rose-500 hover:underline"
                          >
                            Clear
                          </button>
                        </td>
                      </tr>
                      {grp.modules.map((mod) => {
                        const granted = selectedRole.permissions[mod] || [];
                        return (
                          <tr key={mod} className="hover:bg-sky-50/30 dark:hover:bg-slate-800/30">
                            <td className="py-2 px-3 font-semibold">{mod}</td>
                            {ACTIONS.map((act) => {
                              const on = granted.includes(act);
                              return (
                                <td key={act} className="py-2 px-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() => togglePerm(mod, act)}
                                    className={`w-6 h-6 rounded-lg inline-flex items-center justify-center transition-colors ${
                                      on
                                        ? 'bg-sky-500 text-white'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                                    }`}
                                  >
                                    {on && <Check className="w-3.5 h-3.5" />}
                                  </button>
                                </td>
                              );
                            })}
                            <td className="py-2 px-2 text-right">
                              <button
                                type="button"
                                onClick={() => toggleModuleAll(mod)}
                                className="text-[11px] font-bold text-sky-500 hover:underline"
                              >
                                {granted.length === ACTIONS.length ? 'None' : 'All'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 4: COMPANY & FINANCE CONTROLS                                   */}
      {/* =================================================================== */}
      {activeTab === 'company' && isAdmin && (
        <div className={`p-6 rounded-2xl border space-y-6 ${cardCls}`}>
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Corporate Identity &amp; Financial Ledger Controls
              </h3>
              <p className="text-xs text-slate-400">
                Global parameters governing invoicing, tax provisions, and general ledger automation
              </p>
            </div>
            <button
              onClick={() => {
                setSystemCurrency(selectedCurrencyCode);
                logAudit('Workspace', 'Saved company & finance configuration', `${companyName} (Currency: ${selectedCurrencyCode})`);
                notify(`Company & financial configuration saved. Currency set to ${selectedCurrencyCode}.`);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold"
            >
              <Save className="w-3.5 h-3.5" /> Save Configuration
            </button>
          </div>

          {/* System Currency Selector & Formatting Preview */}
          <div
            className={`p-4 rounded-xl border space-y-3 ${
              isLight ? 'bg-sky-50/70 border-sky-100' : 'bg-sky-950/20 border-sky-900/40'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-500 flex items-center justify-center font-black text-lg shrink-0">
                  {SUPPORTED_CURRENCIES.find((c) => c.code === selectedCurrencyCode)?.symbol || '$'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      Workspace Monetary Currency
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-500/20 text-sky-600 dark:text-sky-400">
                      {selectedCurrencyCode}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Governs default currency symbol across ARR/MRR revenue goals, financial cards, client ledgers, and billing quotes.
                  </p>
                </div>
              </div>

              {/* Dynamic Live Formatting Preview */}
              <div
                className={`px-3 py-1.5 rounded-xl border text-left sm:text-right shrink-0 ${
                  isLight ? 'bg-white border-sky-100 shadow-2xs' : 'bg-slate-900 border-slate-800'
                }`}
              >
                <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">
                  Live Revenue Format Preview
                </span>
                <span className="text-xs font-extrabold text-sky-500 tabular-nums">
                  {SUPPORTED_CURRENCIES.find((c) => c.code === selectedCurrencyCode)?.symbol}1,000,000 ARR ({SUPPORTED_CURRENCIES.find((c) => c.code === selectedCurrencyCode)?.symbol}83,333/mo)
                </span>
              </div>
            </div>

            {/* Quick Currency Selector Chips */}
            <div className="pt-2 border-t border-sky-500/10 flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                Select Currency:
              </span>
              {SUPPORTED_CURRENCIES.map((curr) => {
                const isSelected = curr.code === selectedCurrencyCode;
                return (
                  <button
                    key={curr.code}
                    type="button"
                    onClick={() => {
                      setSelectedCurrencyCode(curr.code);
                      setSystemCurrency(curr.code);
                      logAudit('Workspace', 'Updated default workspace currency', `${curr.code} (${curr.symbol})`);
                      notify(`Workspace currency switched to ${curr.name}`);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      isSelected
                        ? 'bg-sky-500 text-white shadow-xs scale-105'
                        : isLight
                        ? 'bg-white border border-slate-200 text-slate-700 hover:border-sky-300'
                        : 'bg-slate-800/90 border border-slate-700 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <span className="opacity-70 font-mono">{curr.symbol}</span>
                    <span>{curr.code}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-bold block mb-1 flex items-center justify-between">
                <span>Default System Currency</span>
                <span className="text-[10px] font-bold text-sky-500">
                  {currentSystemCurrency.symbol} ({currentSystemCurrency.code})
                </span>
              </label>
              <select
                value={selectedCurrencyCode}
                onChange={(e) => {
                  const code = e.target.value;
                  setSelectedCurrencyCode(code);
                  setSystemCurrency(code);
                  logAudit('Workspace', 'Updated default workspace currency', code);
                  notify(`Default currency set to ${code}`);
                }}
                className={inputCls}
              >
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} ({c.symbol}) - {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-bold block mb-1">Company Legal Name</label>
              <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="font-bold block mb-1">Workspace Domain</label>
              <input value={domain} onChange={(e) => setDomain(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="font-bold block mb-1">Primary Admin Email</label>
              <input value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="font-bold block mb-1">Default Timezone</label>
              <input value={timezone} onChange={(e) => setTimezone(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="font-bold block mb-1">Active Fiscal Year</label>
              <select value={fiscalYear} onChange={(e) => setFiscalYear(e.target.value)} className={inputCls}>
                <option value="2025">FY 2025</option>
                <option value="2026">FY 2026 (Current)</option>
                <option value="2027">FY 2027</option>
              </select>
            </div>
            <div>
              <label className="font-bold block mb-1">Accounting Basis</label>
              <select
                value={accountingMethod}
                onChange={(e) => setAccountingMethod(e.target.value as 'Accrual' | 'Cash')}
                className={inputCls}
              >
                <option value="Accrual">Accrual Basis (GAAP)</option>
                <option value="Cash">Cash Basis</option>
              </select>
            </div>
            <div>
              <label className="font-bold block mb-1">Corporate Tax Provision (%)</label>
              <input type="number" step="0.1" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="font-bold block mb-1">Default Payment Terms</label>
              <select value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} className={inputCls}>
                <option value="Due on Receipt">Due on Receipt</option>
                <option value="Net 15 Days">Net 15 Days</option>
                <option value="Net 30 Days">Net 30 Days</option>
                <option value="Net 60 Days">Net 60 Days</option>
              </select>
            </div>
            <div>
              <label className="font-bold block mb-1">Invoice Number Prefix</label>
              <input value={invoicePrefix} onChange={(e) => setInvoicePrefix(e.target.value)} className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-800 cursor-pointer">
              <div>
                <span className="font-bold text-xs block">Automatic Bank Feed Reconciliation</span>
                <span className="text-[11px] text-slate-400">Auto-match incoming ACH/wires against open invoices</span>
              </div>
              <input type="checkbox" checked={autoReconcile} onChange={(e) => setAutoReconcile(e.target.checked)} />
            </label>
            <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-800 cursor-pointer">
              <div>
                <span className="font-bold text-xs block">Enforce Double-Entry Ledger Equilibrium</span>
                <span className="text-[11px] text-slate-400">Require Debits = Credits on all manual journal entries</span>
              </div>
              <input type="checkbox" checked={enforceDoubleEntry} onChange={(e) => setEnforceDoubleEntry(e.target.checked)} />
            </label>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 5: SECURITY POLICIES & IMMUTABLE AUDIT LOG                      */}
      {/* =================================================================== */}
      {activeTab === 'security' && isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className={`p-5 rounded-2xl border space-y-4 ${cardCls}`}>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Authentication &amp; Lockout Policy
            </h3>
            <p className="text-xs text-slate-400">
              Enforced immediately across all 500 staff logins.
            </p>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Minimum Password Length</label>
                <input
                  type="number"
                  min={6}
                  max={24}
                  value={policy.minPasswordLength}
                  onChange={(e) => setPolicy({ ...policy, minPasswordLength: Number(e.target.value) || 8 })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="font-bold block mb-1">Max Failed Login Attempts (Auto-Lock)</label>
                <input
                  type="number"
                  min={3}
                  max={15}
                  value={policy.maxLoginAttempts}
                  onChange={(e) => setPolicy({ ...policy, maxLoginAttempts: Number(e.target.value) || 5 })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="font-bold block mb-1">Idle Session Timeout (Minutes)</label>
                <input
                  type="number"
                  min={5}
                  max={240}
                  value={policy.sessionTimeoutMin}
                  onChange={(e) => setPolicy({ ...policy, sessionTimeoutMin: Number(e.target.value) || 30 })}
                  className={inputCls}
                />
              </div>
              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer">
                <span className="font-bold">Require Special Character in Password</span>
                <input
                  type="checkbox"
                  checked={policy.requireSpecialChar}
                  onChange={(e) => setPolicy({ ...policy, requireSpecialChar: e.target.checked })}
                />
              </label>
            </div>
          </div>

          <div className={`lg:col-span-2 p-5 rounded-2xl border space-y-3 ${cardCls}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Immutable Security &amp; Access Audit Log
              </h3>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Search actor, action, target..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  className={`${inputCls} w-48`}
                />
                <select
                  value={auditCat}
                  onChange={(e) => setAuditCat(e.target.value as typeof auditCat)}
                  className={`${inputCls} w-auto`}
                >
                  <option value="All">All Events</option>
                  <option value="Auth">Auth</option>
                  <option value="User">User</option>
                  <option value="Role">Role</option>
                  <option value="Security">Security</option>
                  <option value="Workspace">Workspace</option>
                </select>
              </div>
            </div>

            <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredAudit.length === 0 ? (
                <p className="py-10 text-center text-slate-400">No audit events recorded yet.</p>
              ) : (
                filteredAudit.slice(0, 100).map((a) => (
                  <div key={a.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-500/10 text-sky-500 mr-2">
                        {a.category}
                      </span>
                      <strong className="text-slate-900 dark:text-white">{a.actor}</strong> — {a.action}{' '}
                      <span className="font-mono text-slate-400">({a.target})</span>
                    </div>
                    <span className="text-[11px] text-slate-400 shrink-0">
                      {new Date(a.at).toLocaleTimeString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB: CRM, LEAD SOURCES, STAGES, PIPELINE & CUSTOM FIELDS            */}
      {/* =================================================================== */}
      {activeTab === 'crm-config' && isAdmin && (
        <CrmSetupSection onNotify={notify} onOpenFormBuilder={() => setActiveTab('lead-forms')} />
      )}

      {/* =================================================================== */}
      {/* TAB: WEB-TO-LEAD FORM BUILDER & WEBSITE LINK / EMBED                */}
      {/* =================================================================== */}
      {activeTab === 'lead-forms' && isAdmin && <LeadFormBuilderSection onNotify={notify} />}

      {/* =================================================================== */}
      {/* TAB: DANGER ZONE & CRM MOCK DATA RESET / WIPE                       */}
      {/* =================================================================== */}
      {activeTab === 'danger-zone' && isAdmin && (
        <div className="space-y-4 animate-fade-in">
          <div className={`p-5 rounded-2xl border ${cardCls} border-rose-500/30 bg-rose-500/5`}>
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Danger Zone &amp; CRM Mock Data Control</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400">
                    Administrator Protected
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Perform high-impact database actions in one click. Every action requires password confirmation before execution to keep your CRM safe and intentional.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1: Reset All Mock Data to Default */}
            <div className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 ${cardCls} border-amber-500/20 hover:border-amber-500/40 transition-colors`}>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                    One-Click Restore
                  </span>
                  <RotateCcw className="w-4 h-4 text-amber-500" />
                </div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Reset All Mock Data to Default
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Re-populates all CRM entities (Leads, Deals, Tasks, Calendar Events, Projects, Employees, Invoices, Contacts, Follow-ups, and Payments) with clean initial demo mock data. Any records you created or deleted will be reset to default.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setDangerModalMode('reset');
                    setDangerPassword('');
                    setDangerError(null);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset All Mock Data to Default</span>
                </button>
              </div>
            </div>

            {/* Card 2: Wipe All CRM Data Clean */}
            <div className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 ${cardCls} border-rose-500/20 hover:border-rose-500/40 transition-colors`}>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                    Blank Database
                  </span>
                  <Trash2 className="w-4 h-4 text-rose-500" />
                </div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Wipe All CRM Data (Empty Database)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Permanently clears all mock records across the entire CRM, resetting leads, deals, tasks, events, projects, and employees to 0. Leaves all dashboards, tables, and views 100% clean so you can start with a fresh slate.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setDangerModalMode('wipe');
                    setDangerPassword('');
                    setDangerError(null);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white shadow-xs transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Wipe All CRM Data Clean</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: PROVISION / EDIT STAFF ACCESS & OVERRIDES                    */}
      {/* =================================================================== */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <form
            onSubmit={handleSaveUserModal}
            className={`w-full max-w-xl rounded-2xl border p-6 space-y-4 max-h-[90vh] overflow-y-auto ${cardCls}`}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold">
                {isNewUser ? 'Provision New Staff Login' : `Configure Access: ${editingUser.name}`}
              </h3>
              <button type="button" onClick={() => setEditingUser(null)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Full Name</label>
                <input
                  required
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="font-bold block mb-1">Work Email (Login ID)</label>
                <input
                  type="email"
                  required
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="font-bold block mb-1">Initial / Login Password</label>
                <input
                  required
                  value={editingUser.password}
                  onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="font-bold block mb-1">Job Title</label>
                <input
                  value={editingUser.jobTitle}
                  onChange={(e) => setEditingUser({ ...editingUser, jobTitle: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="font-bold block mb-1">Department</label>
                <select
                  value={editingUser.department}
                  onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })}
                  className={inputCls}
                >
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-bold block mb-1">Assigned Security Role</label>
                <select
                  value={editingUser.roleId}
                  onChange={(e) => setEditingUser({ ...editingUser, roleId: e.target.value })}
                  className={inputCls}
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-bold block mb-1">Per-User Data Scope Override</label>
                <select
                  value={editingUser.scopeOverride || ''}
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      scopeOverride: (e.target.value || undefined) as DataScope | undefined,
                    })
                  }
                  className={inputCls}
                >
                  <option value="">Inherit from Role</option>
                  <option value="Own">Own Records Only</option>
                  <option value="Department">Department Records Only</option>
                  <option value="All">All Company Records</option>
                </select>
              </div>
              <div>
                <label className="font-bold block mb-1">Account Status</label>
                <select
                  value={editingUser.status}
                  onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value as UserStatus })}
                  className={inputCls}
                >
                  <option value="Active">Active</option>
                  <option value="Invited">Invited</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Locked">Locked</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold block mb-1.5">
                Extra Module Grants (Per-Staff Override Beyond Role)
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 rounded-xl border border-slate-200 dark:border-slate-800">
                {ALL_MODULES.map((m) => {
                  const has = editingUser.extraModules.includes(m);
                  return (
                    <button
                      type="button"
                      key={m}
                      onClick={() =>
                        setEditingUser({
                          ...editingUser,
                          extraModules: has
                            ? editingUser.extraModules.filter((x) => x !== m)
                            : [...editingUser.extraModules, m],
                        })
                      }
                      className={`px-2 py-1 rounded-lg text-[11px] font-bold ${
                        has
                          ? 'bg-sky-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 rounded-xl border text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold"
              >
                Save Staff Access
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: ADMIN PASSWORD RESET                                         */}
      {/* =================================================================== */}
      {resetPwUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className={`w-full max-w-sm rounded-2xl border p-5 space-y-4 ${cardCls}`}>
            <h3 className="text-sm font-extrabold">Reset Password: {resetPwUser.name}</h3>
            <input
              value={resetPwVal}
              onChange={(e) => setResetPwVal(e.target.value)}
              className={inputCls}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setResetPwUser(null)}
                className="px-3 py-1.5 rounded-xl border text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const err = validatePassword(resetPwVal);
                  if (err) return notify(err);
                  saveUser({ ...resetPwUser, password: resetPwVal, failedAttempts: 0, status: 'Active' });
                  notify(`Password reset for ${resetPwUser.name}.`);
                  setResetPwUser(null);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-sky-500 text-white text-xs font-bold"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: DANGER ZONE PASSWORD AUTHORIZATION                           */}
      {/* =================================================================== */}
      {dangerModalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <form
            onSubmit={handleDangerConfirm}
            className={`w-full max-w-md rounded-2xl border p-5 sm:p-6 space-y-4 shadow-2xl ${cardCls}`}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${dangerModalMode === 'reset' ? 'bg-amber-500/15 text-amber-500' : 'bg-rose-500/15 text-rose-500'}`}>
                  {dangerModalMode === 'reset' ? <RotateCcw className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                </div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {dangerModalMode === 'reset' ? 'Authorize Mock Data Reset' : 'Authorize CRM Data Wipe'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDangerModalMode(null);
                  setDangerPassword('');
                  setDangerError(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 space-y-2">
              <p>
                {dangerModalMode === 'reset'
                  ? 'You are about to restore all initial mock data across Leads, Deals, Tasks, Calendar Events, Projects, Employees, Payroll, Notifications, Invoices, Contacts, and Payments. All current modifications will be replaced with default data.'
                  : 'You are about to permanently wipe all records across Leads, Deals, Tasks, Calendar Events, Projects, Employees, Payroll, Notifications, Invoices, Contacts, and Payments. All tables will be completely empty.'}
              </p>
              <p className="font-semibold text-slate-700 dark:text-slate-200">
                Please enter your login password or administrator password to confirm:
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="relative">
                <input
                  type={showDangerPassword ? 'text' : 'password'}
                  required
                  autoFocus
                  placeholder="Enter your password (e.g. Admin@123)"
                  value={dangerPassword}
                  onChange={(e) => {
                    setDangerPassword(e.target.value);
                    setDangerError(null);
                  }}
                  className={`${inputCls} pr-9`}
                />
                <button
                  type="button"
                  onClick={() => setShowDangerPassword((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  tabIndex={-1}
                >
                  {showDangerPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              {dangerError && (
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-500">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{dangerError}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setDangerModalMode(null);
                  setDangerPassword('');
                  setDangerError(null);
                }}
                className="px-4 py-2 rounded-xl border text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-4 py-2 rounded-xl text-white text-xs font-bold transition-all ${
                  dangerModalMode === 'reset'
                    ? 'bg-amber-500 hover:bg-amber-600'
                    : 'bg-rose-500 hover:bg-rose-600'
                }`}
              >
                {dangerModalMode === 'reset' ? 'Confirm & Reset to Default' : 'Confirm & Wipe Clean'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
