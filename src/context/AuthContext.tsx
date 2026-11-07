import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  AuditEntry,
  DataScope,
  DEFAULT_POLICY,
  MAX_STAFF_CAPACITY,
  MODULE_ALIASES,
  PermAction,
  Role,
  SecurityPolicy,
  SEED_ROLES,
  UserAccount,
  buildSeedUsers,
} from './authData';

const STORE_KEY = 'ozo-auth-store-v5';
const SESSION_KEY = 'ozo-auth-session-v3';

export interface ScopeTarget {
  owner?: string | (string | undefined)[];
  department?: string;
  employeeId?: string;
}

const TEAM_LABEL_DEPT: Record<string, string> = {
  'engineering team': 'Engineering',
  'finance team': 'Finance & Operations',
  'hr team': 'Human Resources',
  'marketing team': 'Marketing',
  'sales team': 'Sales & CRM',
  'product team': 'Product & Design',
};

const norm = (s?: string) => (s || '').replace(/\s*\(.*?\)\s*/g, '').trim().toLowerCase();

interface Store {
  users: UserAccount[];
  roles: Role[];
  audit: AuditEntry[];
  policy: SecurityPolicy;
}

interface Session {
  userId: string;
  impersonatorId?: string;
}

interface AuthContextType extends Store {
  currentUser: UserAccount | null;
  currentRole: Role | null;
  impersonator: UserAccount | null;
  dataScope: DataScope;
  login: (email: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
  loginAs: (userId: string) => void;
  stopImpersonation: () => void;
  can: (module: string, action?: PermAction) => boolean;
  scopeFilter: <T>(items: T[], pick: (item: T) => ScopeTarget) => T[];
  validatePassword: (pw: string) => string | null;
  saveUser: (user: UserAccount) => { ok: boolean; error?: string };
  saveUsers: (users: UserAccount[], summary: string) => void;
  deleteUser: (userId: string) => void;
  saveRole: (role: Role) => void;
  deleteRole: (roleId: string) => string | null;
  setPolicy: (policy: SecurityPolicy) => void;
  logAudit: (category: AuditEntry['category'], action: string, target: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const loadStore = (): Store => {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* corrupted store → reseed */
  }
  return { users: buildSeedUsers(), roles: SEED_ROLES, audit: [], policy: DEFAULT_POLICY };
};

const loadSession = (): Session | null => {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw || raw === 'SIGNED_OUT') return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && parsed.userId ? parsed : null;
  } catch {
    return null;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [store, setStore] = useState<Store>(loadStore);
  const [session, setSession] = useState<Session | null>(loadSession);

  useEffect(() => {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  }, [store]);

  useEffect(() => {
    if (session) sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else sessionStorage.setItem(SESSION_KEY, 'SIGNED_OUT');
  }, [session]);

  const currentUser = useMemo(
    () => store.users.find((u) => u.id === session?.userId && u.status === 'Active') || null,
    [store.users, session]
  );
  const impersonator = useMemo(
    () => (session?.impersonatorId ? store.users.find((u) => u.id === session.impersonatorId) || null : null),
    [store.users, session]
  );
  const currentRole = useMemo(
    () => (currentUser ? store.roles.find((r) => r.id === currentUser.roleId) || null : null),
    [store.roles, currentUser]
  );
  const isSuperAdmin = currentUser?.roleId === 'super-admin' || currentUser?.id === 'usr-emp-1';
  const dataScope: DataScope = isSuperAdmin ? 'All' : 'Own';

  // Lookup map: normalized staff name -> department
  const deptByName = useMemo(() => {
    const map = new Map<string, string>();
    store.users.forEach((u) => {
      map.set(norm(u.name), u.department);
      map.set(u.name.trim().toLowerCase(), u.department);
    });
    return map;
  }, [store.users]);

  const logAuditAs = useCallback((actor: string, category: AuditEntry['category'], action: string, target: string) => {
    setStore((s) => ({
      ...s,
      audit: [
        { id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, at: new Date().toISOString(), actor, category, action, target },
        ...s.audit,
      ].slice(0, 500),
    }));
  }, []);

  const actorName = impersonator ? `${impersonator.name} (as ${currentUser?.name})` : currentUser?.name || 'System';
  const logAudit = useCallback(
    (category: AuditEntry['category'], action: string, target: string) => logAuditAs(actorName, category, action, target),
    [logAuditAs, actorName]
  );

  const login = (email: string, password: string) => {
    const user = store.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user) {
      logAuditAs(email, 'Auth', 'Failed login (unknown account)', email);
      return { ok: false, error: 'Invalid email or password.' };
    }
    if (user.status === 'Suspended') return { ok: false, error: 'This account is suspended. Contact your administrator.' };
    if (user.status === 'Locked') return { ok: false, error: 'Account locked after too many failed attempts. Ask an admin to unlock it.' };

    if (user.password !== password) {
      const attempts = user.failedAttempts + 1;
      const locked = attempts >= store.policy.maxLoginAttempts;
      setStore((s) => ({
        ...s,
        users: s.users.map((u) => (u.id === user.id ? { ...u, failedAttempts: attempts, status: locked ? 'Locked' : u.status } : u)),
      }));
      logAuditAs(user.name, 'Auth', locked ? 'Account locked (max attempts)' : 'Failed login', user.email);
      return {
        ok: false,
        error: locked
          ? 'Account locked after too many failed attempts.'
          : `Invalid email or password. ${store.policy.maxLoginAttempts - attempts} attempt(s) left.`,
      };
    }

    setStore((s) => ({
      ...s,
      users: s.users.map((u) =>
        u.id === user.id ? { ...u, failedAttempts: 0, status: 'Active', lastLogin: new Date().toISOString() } : u
      ),
    }));
    setSession({ userId: user.id });
    logAuditAs(user.name, 'Auth', user.status === 'Invited' ? 'First login (invite accepted)' : 'Signed in', user.email);
    return { ok: true };
  };

  const logout = useCallback(() => {
    if (currentUser) logAuditAs(impersonator?.name || currentUser.name, 'Auth', 'Signed out', currentUser.email);
    setSession(null);
  }, [currentUser, impersonator, logAuditAs]);

  const loginAs = (userId: string) => {
    const target = store.users.find((u) => u.id === userId);
    if (!currentUser || !target || target.status !== 'Active') return;
    logAudit('Security', 'Started impersonation', target.email);
    setSession({ userId, impersonatorId: impersonator?.id || currentUser.id });
  };

  const stopImpersonation = () => {
    if (!impersonator) return;
    logAuditAs(impersonator.name, 'Security', 'Ended impersonation', currentUser?.email || '');
    setSession({ userId: impersonator.id });
  };

  const can = useCallback(
    (module: string, action: PermAction = 'view') => {
      if (!currentUser || !currentRole) return false;
      const key = MODULE_ALIASES[module] || module;
      if (key === 'To Do & Notes') return true;
      if (currentRole.permissions[key]?.includes(action)) return true;
      return ['view', 'create', 'edit'].includes(action) && currentUser.extraModules.includes(key);
    },
    [currentUser, currentRole]
  );

  const scopeFilter = useCallback(
    <T,>(items: T[], pick: (item: T) => ScopeTarget): T[] => {
      if (!currentUser || isSuperAdmin || dataScope === 'All') return items;
      const myName = norm(currentUser.name);

      return items.filter((item) => {
        const t = pick(item);
        if (t.employeeId && currentUser.employeeId && t.employeeId === currentUser.employeeId) {
          return true;
        }
        const rawOwners = Array.isArray(t.owner) ? t.owner : t.owner ? [t.owner] : [];
        const owners = rawOwners.filter((o): o is string => Boolean(o));

        return owners.some((o) => norm(o) === myName);
      });
    },
    [currentUser, isSuperAdmin, dataScope]
  );

  const validatePassword = (pw: string) => {
    if (pw.length < store.policy.minPasswordLength) return `Password must be at least ${store.policy.minPasswordLength} characters.`;
    if (store.policy.requireSpecialChar && !/[^A-Za-z0-9]/.test(pw)) return 'Password must include a special character.';
    if (!/\d/.test(pw)) return 'Password must include a number.';
    return null;
  };

  const saveUser = (user: UserAccount) => {
    const exists = store.users.some((u) => u.id === user.id);
    if (!exists && store.users.length >= MAX_STAFF_CAPACITY) {
      return { ok: false, error: `Maximum capacity of ${MAX_STAFF_CAPACITY} staff accounts reached.` };
    }
    setStore((s) => ({ ...s, users: exists ? s.users.map((u) => (u.id === user.id ? user : u)) : [user, ...s.users] }));
    logAudit('User', exists ? 'Updated user' : 'Provisioned user', user.email);
    return { ok: true };
  };

  const saveUsers = (users: UserAccount[], summary: string) => {
    const map = new Map(users.map((u) => [u.id, u]));
    setStore((s) => ({ ...s, users: s.users.map((u) => map.get(u.id) || u) }));
    logAudit('User', summary, `${users.length} user(s)`);
  };

  const deleteUser = (userId: string) => {
    const user = store.users.find((u) => u.id === userId);
    setStore((s) => ({ ...s, users: s.users.filter((u) => u.id !== userId) }));
    if (user) logAudit('User', 'Deleted user', user.email);
  };

  const saveRole = (role: Role) => {
    const exists = store.roles.some((r) => r.id === role.id);
    setStore((s) => ({ ...s, roles: exists ? s.roles.map((r) => (r.id === role.id ? role : r)) : [...s.roles, role] }));
    logAudit('Role', exists ? 'Updated role permissions' : 'Created role', role.name);
  };

  const deleteRole = (roleId: string) => {
    const role = store.roles.find((r) => r.id === roleId);
    if (!role) return 'Role not found.';
    if (role.isSystem) return 'System roles cannot be deleted.';
    const assigned = store.users.filter((u) => u.roleId === roleId).length;
    if (assigned) return `Reassign the ${assigned} user(s) holding this role first.`;
    setStore((s) => ({ ...s, roles: s.roles.filter((r) => r.id !== roleId) }));
    logAudit('Role', 'Deleted role', role.name);
    return null;
  };

  const setPolicy = (policy: SecurityPolicy) => {
    setStore((s) => ({ ...s, policy }));
    logAudit('Security', 'Updated security policy', `Timeout ${policy.sessionTimeoutMin}m, min length ${policy.minPasswordLength}`);
  };

  useEffect(() => {
    if (!currentUser) return;
    let timer = window.setTimeout(logout, store.policy.sessionTimeoutMin * 60000);
    const reset = () => {
      clearTimeout(timer);
      timer = window.setTimeout(logout, store.policy.sessionTimeoutMin * 60000);
    };
    const events = ['mousemove', 'keydown', 'click', 'scroll'];
    events.forEach((e) => window.addEventListener(e, reset));
    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [currentUser, store.policy.sessionTimeoutMin, logout]);

  return (
    <AuthContext.Provider
      value={{
        ...store,
        currentUser,
        currentRole,
        impersonator,
        dataScope,
        login,
        logout,
        loginAs,
        stopImpersonation,
        can,
        scopeFilter,
        validatePassword,
        saveUser,
        saveUsers,
        deleteUser,
        saveRole,
        deleteRole,
        setPolicy,
        logAudit,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
