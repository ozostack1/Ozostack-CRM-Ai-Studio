import { Project } from '../types/crm';

export interface ActiveAuthScope {
  isSuperAdmin: boolean;
  myName: string;
  canView: (module: string) => boolean;
}

const normName = (s?: string | null): string =>
  (s || '')
    .replace(/\s*\([^)]*\)/g, '')
    .trim()
    .toLowerCase();

/**
 * Reads the currently signed-in user & role permissions directly from session/local storage
 * so shared dropdown helpers (projects, clients) strictly respect role & ownership isolation.
 */
export function getActiveAuthScope(): ActiveAuthScope {
  try {
    if (typeof window === 'undefined') {
      return { isSuperAdmin: false, myName: '', canView: () => false };
    }
    const rawSess = window.sessionStorage.getItem('ozo-auth-session-v3');
    const rawStore = window.localStorage.getItem('ozo-auth-store-v5');
    if (!rawSess || rawSess === 'SIGNED_OUT' || !rawStore) {
      return { isSuperAdmin: false, myName: '', canView: () => false };
    }
    const sess = JSON.parse(rawSess);
    const store = JSON.parse(rawStore);
    const user = Array.isArray(store?.users)
      ? store.users.find((u: any) => u?.id === sess?.userId && u?.status === 'Active')
      : null;
    if (!user) return { isSuperAdmin: false, myName: '', canView: () => false };

    const role = Array.isArray(store?.roles)
      ? store.roles.find((r: any) => r?.id === user.roleId)
      : null;
    const isSuperAdmin = user.roleId === 'super-admin' || user.id === 'usr-emp-1';
    const myName = normName(user.name);

    const canView = (module: string): boolean => {
      if (isSuperAdmin) {
        if (!role?.permissions) return true;
        if (Object.prototype.hasOwnProperty.call(role.permissions, module)) {
          return Array.isArray(role.permissions[module]) && role.permissions[module].includes('view');
        }
        return true;
      }
      if (Array.isArray(role?.permissions?.[module]) && role.permissions[module].includes('view')) {
        return true;
      }
      return Array.isArray(user.extraModules) && user.extraModules.includes(module);
    };

    return { isSuperAdmin, myName, canView };
  } catch {
    return { isSuperAdmin: false, myName: '', canView: () => false };
  }
}

/**
 * Returns ONLY the actual projects currently saved in the workspace ('ozostack_projects'),
 * strictly scoped to the signed-in user's assigned projects for non-Super-Admin staff.
 */
export function getActualSavedProjects(): Project[] {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem('ozostack_projects');
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const valid = parsed.filter((p) => p && typeof p.name === 'string' && p.name.trim());
          const { isSuperAdmin, myName } = getActiveAuthScope();
          if (isSuperAdmin) return valid;
          if (!myName) return [];
          return valid.filter((p) => {
            const owners = [p.projectManager, ...(Array.isArray(p.team) ? p.team : [])];
            return owners.some((o) => normName(o) === myName);
          });
        }
      }
    }
  } catch {
    /* ignore */
  }
  return [];
}

/**
 * Returns scoped saved project names plus an 'Others' option at the end.
 */
export function getLinkedProjectOptions(extraCurrentValue?: string): string[] {
  const actual = getActualSavedProjects().map((p) => p.name.trim());
  const list = [...actual];
  if (extraCurrentValue && extraCurrentValue.trim() && extraCurrentValue !== 'Others') {
    if (!list.includes(extraCurrentValue.trim())) {
      list.unshift(extraCurrentValue.trim());
    }
  }
  if (!list.includes('Others')) {
    list.push('Others');
  }
  return Array.from(new Set(list));
}
