import { INITIAL_EMPLOYEES } from '../components/team/teamMockData';

export type PermAction = 'view' | 'create' | 'edit' | 'delete' | 'export' | 'approve';
export type DataScope = 'All' | 'Department' | 'Own';
export type UserStatus = 'Active' | 'Invited' | 'Suspended' | 'Locked';

export const MAX_STAFF_CAPACITY = 500;
export const ACTIONS: PermAction[] = ['view', 'create', 'edit', 'delete', 'export', 'approve'];

export const MODULE_GROUPS: { group: string; modules: string[] }[] = [
  { group: 'Core', modules: ['Dashboard'] },
  { group: 'CRM & Sales', modules: ['Leads', 'Deals', 'Pipeline', 'Contacts', 'Companies', 'Follow Ups'] },
  { group: 'Projects', modules: ['Projects', 'Tasks', 'Events & Calendar', 'To Do & Notes', 'Time Tracking', 'Documents'] },
  { group: 'Finance', modules: ['Revenue', 'Invoices', 'Expenses', 'Payments', 'Profit & Loss'] },
  { group: 'Marketing', modules: ['Templates', 'Social Media'] },
  { group: 'Team & HR', modules: ['Team', 'Payroll'] },
  { group: 'Tools', modules: ['AI Automation', 'Workflows', 'AI Agents', 'Integrations'] },
  { group: 'Administration', modules: ['Settings', 'Webhooks'] },
];

export const ALL_MODULES = MODULE_GROUPS.flatMap((g) => g.modules);

export const MODULE_ALIASES: Record<string, string> = {
  Clients: 'Companies',
  Finance: 'Revenue',
  'Calendar & Events': 'Events & Calendar',
  'Kanban Board': 'Events & Calendar',
  Attendance: 'Team',
  Employees: 'Team',
  Performance: 'Team',
  Recruitment: 'Team',
  'Team & HR': 'Team',
  'Bug Tracking': 'Documents',
  'Profit and Loss': 'Profit & Loss',
  'P&L': 'Profit & Loss',
  'Payroll Management': 'Payroll',
  'Settings & Preferences': 'Settings',
  'Outreach Templates': 'Templates',
  'Email & WhatsApp Templates': 'Templates',
  'Email Templates': 'Templates',
  'WhatsApp Templates': 'Templates',
  'To-Do & Notes': 'To Do & Notes',
  'Personal To Do & Notes': 'To Do & Notes',
  'Todos & Notes': 'To Do & Notes',
  'Notes': 'To Do & Notes',
  'Todos': 'To Do & Notes',
};

export interface Role {
  id: string;
  name: string;
  description: string;
  color: string;
  dataScope: DataScope;
  permissions: Record<string, PermAction[]>;
  isSystem: boolean;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  password: string;
  roleId: string;
  department: string;
  jobTitle: string;
  employeeId?: string;
  status: UserStatus;
  mfaEnabled: boolean;
  failedAttempts: number;
  lastLogin?: string;
  createdAt: string;
  scopeOverride?: DataScope;
  extraModules: string[];
}

export interface AuditEntry {
  id: string;
  at: string;
  actor: string;
  category: 'Auth' | 'User' | 'Role' | 'Security' | 'Workspace';
  action: string;
  target: string;
}

export interface SecurityPolicy {
  minPasswordLength: number;
  requireSpecialChar: boolean;
  maxLoginAttempts: number;
  sessionTimeoutMin: number;
}

export const DEFAULT_PASSWORD = 'Ozo@2026';

const grant = (modules: string[], actions: PermAction[]) =>
  Object.fromEntries(modules.map((m) => [m, [...actions]])) as Record<string, PermAction[]>;

const group = (name: string) => MODULE_GROUPS.find((g) => g.group === name)!.modules;

export const SEED_ROLES: Role[] = [
  {
    id: 'super-admin',
    name: 'Super Administrator',
    description: 'Unrestricted access to every module, all company data and system administration.',
    color: '#ef4444',
    dataScope: 'All',
    permissions: grant(ALL_MODULES, ACTIONS),
    isSystem: true,
  },
  {
    id: 'finance-manager',
    name: 'Finance Manager',
    description: 'Owns revenue, invoicing, expenses, P&L and payroll disbursement. Views own assigned records.',
    color: '#10b981',
    dataScope: 'Own',
    permissions: {
      ...grant(['Dashboard', 'Projects', 'Tasks', 'Events & Calendar', 'Documents', 'To Do & Notes', 'Team'], ['view', 'create', 'edit', 'delete', 'export']),
      ...grant(group('Finance'), ACTIONS),
      Payroll: [...ACTIONS],
    },
    isSystem: true,
  },
  {
    id: 'hr-manager',
    name: 'HR Manager',
    description: 'Manages people operations: directory, attendance, leave, hiring and payroll review.',
    color: '#8b5cf6',
    dataScope: 'Own',
    permissions: {
      ...grant(['Dashboard', 'Projects', 'Tasks'], ['view']),
      Team: [...ACTIONS],
      Payroll: ['view', 'edit', 'export', 'approve'],
      ...grant(['Events & Calendar', 'Documents', 'Time Tracking', 'To Do & Notes'], ['view', 'create', 'edit', 'delete']),
    },
    isSystem: true,
  },
  {
    id: 'dept-manager',
    name: 'Department Manager',
    description: 'Leads a department. Views and manages assigned tasks, projects, leads, events, documents and team data.',
    color: '#0ea5e9',
    dataScope: 'Own',
    permissions: {
      ...grant(group('CRM & Sales'), ['view', 'create', 'edit', 'export']),
      ...grant(group('Projects'), ['view', 'create', 'edit', 'delete', 'export', 'approve']),
      ...grant(group('Marketing'), ['view', 'create', 'edit', 'export']),
      Team: ['view', 'edit', 'approve', 'export'],
      Payroll: ['view'],
    },
    isSystem: false,
  },
  {
    id: 'sales-exec',
    name: 'Sales Executive',
    description: 'Sees only own assigned leads, deals, follow-ups, tasks, projects, events, documents, team profile and paystubs.',
    color: '#f59e0b',
    dataScope: 'Own',
    permissions: {
      ...grant(group('CRM & Sales'), ['view', 'create', 'edit']),
      ...grant(group('Projects'), ['view', 'create', 'edit']),
      Templates: ['view', 'create', 'edit'],
      Team: ['view'],
      Payroll: ['view'],
    },
    isSystem: false,
  },
  {
    id: 'employee',
    name: 'Employee (Staff)',
    description: 'Sees only own assigned tasks, projects, events, documents, leads, time logs, personal to-dos & notes, team profile and paystubs.',
    color: '#64748b',
    dataScope: 'Own',
    permissions: {
      ...grant(['Projects', 'Tasks', 'Events & Calendar', 'To Do & Notes', 'Time Tracking', 'Documents', 'Leads'], ['view', 'create', 'edit', 'delete']),
      Team: ['view'],
      Payroll: ['view'],
    },
    isSystem: true,
  },
  {
    id: 'auditor',
    name: 'Compliance Auditor',
    description: 'Read-only access to own assigned records with export rights for audit and compliance.',
    color: '#14b8a6',
    dataScope: 'Own',
    permissions: grant(ALL_MODULES.filter((m) => m !== 'Settings' && m !== 'Webhooks'), ['view', 'export']),
    isSystem: false,
  },
];

const CORE_ROLE_MAP: Record<string, string> = {
  'emp-1': 'super-admin',
  'emp-2': 'dept-manager',
  'emp-5': 'dept-manager',
  'emp-8': 'dept-manager',
  'emp-9': 'hr-manager',
  'emp-10': 'finance-manager',
  'emp-13': 'sales-exec',
  'emp-15': 'auditor',
};

const pastDate = (daysAgo: number) => new Date(Date.now() - daysAgo * 86400000).toISOString();

// Seeds only the actual company staff (15 employees); system supports up to MAX_STAFF_CAPACITY (500) seats
export const buildSeedUsers = (): UserAccount[] =>
  INITIAL_EMPLOYEES.map((e, i) => ({
    id: `usr-${e.id}`,
    name: e.name,
    email: e.email,
    password: DEFAULT_PASSWORD,
    roleId: CORE_ROLE_MAP[e.id] || 'employee',
    department: e.department,
    jobTitle: e.role,
    employeeId: e.id,
    status: 'Active',
    mfaEnabled: i % 3 !== 2,
    failedAttempts: 0,
    lastLogin: pastDate(i % 6),
    createdAt: e.joinDate,
    extraModules: [],
  }));

export const DEFAULT_POLICY: SecurityPolicy = {
  minPasswordLength: 8,
  requireSpecialChar: true,
  maxLoginAttempts: 5,
  sessionTimeoutMin: 30,
};
