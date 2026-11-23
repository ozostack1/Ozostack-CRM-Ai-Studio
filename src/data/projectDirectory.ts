import { Project } from '../types/crm';

/**
 * Returns ONLY the actual projects currently saved in the workspace ('ozostack_projects').
 * Never falls back to hardcoded mock projects so dropdowns stay clean and accurate.
 */
export function getActualSavedProjects(): Project[] {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem('ozostack_projects');
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.filter((p) => p && typeof p.name === 'string' && p.name.trim());
        }
      }
    }
  } catch {
    /* ignore */
  }
  return [];
}

/**
 * Returns actual saved project names plus an 'Others' option at the end.
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
