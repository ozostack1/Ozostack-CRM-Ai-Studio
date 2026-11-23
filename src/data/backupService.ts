import {
  flushDatabaseNow,
  collectAllLocalSyncedSnapshot,
  applyRestoredSnapshotToLocalStorage,
} from './dbSync';

export type BackupPeriodType = 'all' | '7d' | '30d' | '90d' | 'custom';

export interface BackupSummaryCounts {
  leads: number;
  deals: number;
  projects: number;
  tasks: number;
  followups: number;
  contacts: number;
  companies: number;
  invoices: number;
  team: number;
  departments: number;
  documents: number;
  events: number;
}

export interface BackupMetadata {
  id: string;
  name: string;
  periodType: BackupPeriodType;
  periodLabel: string;
  fromDate: string | null;
  toDate: string | null;
  retentionDays: number;
  retentionLabel: string;
  expiresAt: string | null;
  createdAt: string;
  createdBy: string;
  keyCount: number;
  sizeBytes: number;
  summary: BackupSummaryCounts;
}

// Keys holding dated CRM entity arrays that support optional Date Range filtering
const DATED_ARRAY_KEYS = new Set([
  'ozostack_leads_v2',
  'ozostack_deals_v2',
  'ozostack_tasks_v2',
  'ozostack_calendar_events_v3',
  'ozostack_projects',
  'ozostack_project_activities',
  'ozostack_followups_v2',
  'ozostack_invoices_v1',
  'ozostack_proposals_v1',
  'ozostack_quotations_v1',
  'ozostack_contracts_v1',
  'ozostack_expenses_v1',
  'ozostack_expenses',
  'ozostack_payments_v1',
  'ozostack_payments',
  'ozostack_documents_v2',
  'ozostack_time_entries_v1',
  'ozostack_attendance_v1',
  'ozostack_leave_requests_v1',
  'ozostack_revenue_transactions_v1',
  'ozostack_payroll_records_v1',
  'ozostack_pay_runs_v1',
  'ozostack_reimbursements_v1',
  'ozostack_notifications_v4',
]);

function extractRecordDateMs(item: any): number | null {
  if (!item || typeof item !== 'object') return null;
  const raw =
    item.createdAt ||
    item.date ||
    item.timestamp ||
    item.scheduledDate ||
    item.dueDate ||
    item.issueDate ||
    item.sentAt ||
    item.startDate ||
    item.updatedAt ||
    null;
  if (!raw) return null;
  const ms = new Date(String(raw)).getTime();
  return Number.isNaN(ms) ? null : ms;
}

function filterSnapshotByDateRange(
  snapshot: Record<string, string>,
  fromDate: string | null,
  toDate: string | null
): Record<string, string> {
  if (!fromDate && !toDate) return snapshot;

  const fromMs = fromDate ? new Date(`${fromDate}T00:00:00.000Z`).getTime() : -Infinity;
  const toMs = toDate ? new Date(`${toDate}T23:59:59.999Z`).getTime() : Infinity;

  const result: Record<string, string> = {};
  for (const [key, rawVal] of Object.entries(snapshot)) {
    const isDatedList =
      DATED_ARRAY_KEYS.has(key) ||
      key.startsWith('ozostack_mailbox_') ||
      key.startsWith('ozostack_sentlog_') ||
      key.startsWith('ozostack_workflow_logs_');

    if (!isDatedList) {
      result[key] = rawVal;
      continue;
    }

    try {
      const parsed = JSON.parse(rawVal);
      if (!Array.isArray(parsed)) {
        result[key] = rawVal;
        continue;
      }
      const filtered = parsed.filter((item) => {
        const ms = extractRecordDateMs(item);
        // Keep undated records so structural items never break
        if (ms === null) return true;
        return ms >= fromMs && ms <= toMs;
      });
      result[key] = JSON.stringify(filtered);
    } catch {
      result[key] = rawVal;
    }
  }
  return result;
}

export function resolvePeriodRange(
  periodType: BackupPeriodType,
  customFrom?: string,
  customTo?: string
): { fromDate: string | null; toDate: string | null; periodLabel: string } {
  const todayIso = new Date().toISOString().split('T')[0];
  if (periodType === 'all') {
    return {
      fromDate: null,
      toDate: null,
      periodLabel: 'All Time (Complete Exact Snapshot)',
    };
  }
  if (periodType === '7d' || periodType === '30d' || periodType === '90d') {
    const days = periodType === '7d' ? 7 : periodType === '30d' ? 30 : 90;
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];
    return {
      fromDate: from,
      toDate: todayIso,
      periodLabel: `Last ${days} Days (${from} to ${todayIso})`,
    };
  }
  const f = customFrom || todayIso;
  const t = customTo || todayIso;
  return {
    fromDate: f,
    toDate: t,
    periodLabel: `Custom Range (${f} to ${t})`,
  };
}

export async function listCloudBackups(): Promise<{
  ok: boolean;
  backups: BackupMetadata[];
  error?: string;
}> {
  try {
    const res = await fetch('/api/backups', { cache: 'no-store' });
    const data = await res.json().catch(() => null);
    if (res.ok && data?.ok && Array.isArray(data.backups)) {
      return { ok: true, backups: data.backups };
    }
    return { ok: false, backups: [], error: data?.error || 'Could not load backups.' };
  } catch (err: any) {
    return { ok: false, backups: [], error: err?.message || 'Network error.' };
  }
}

export async function createCloudBackup(params: {
  name: string;
  periodType: BackupPeriodType;
  customFrom?: string;
  customTo?: string;
  retentionDays: number;
  retentionLabel: string;
  createdBy: string;
}): Promise<{ ok: boolean; backup?: BackupMetadata; error?: string }> {
  try {
    // 1. Flush any pending local changes to MongoDB first
    await flushDatabaseNow();

    // 2. Collect full local snapshot and apply optional date period filter
    const rawSnapshot = collectAllLocalSyncedSnapshot();
    const { fromDate, toDate, periodLabel } = resolvePeriodRange(
      params.periodType,
      params.customFrom,
      params.customTo
    );
    const snapshot =
      params.periodType === 'all'
        ? rawSnapshot
        : filterSnapshotByDateRange(rawSnapshot, fromDate, toDate);

    // 3. Persist securely in dedicated MongoDB collection 'ozostack_crm_backups'
    const res = await fetch('/api/backups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: params.name,
        periodType: params.periodType,
        periodLabel,
        fromDate,
        toDate,
        retentionDays: params.retentionDays,
        retentionLabel: params.retentionLabel,
        createdBy: params.createdBy,
        data: snapshot,
      }),
    });

    const data = await res.json().catch(() => null);
    if (res.ok && data?.ok && data.backup) {
      return { ok: true, backup: data.backup };
    }
    return { ok: false, error: data?.error || 'Failed to save cloud backup.' };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Network error creating backup.' };
  }
}

export async function downloadCloudBackupJson(backupId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/backups/${encodeURIComponent(backupId)}`, {
      cache: 'no-store',
    });
    const payload = await res.json().catch(() => null);
    if (!res.ok || !payload?.ok || !payload.backup) return false;

    const blob = new Blob([JSON.stringify(payload.backup, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeName = String(payload.backup.name || backupId)
      .replace(/[^a-zA-Z0-9_-]+/g, '_')
      .slice(0, 50);
    a.download = `ozostack_backup_${safeName}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
}

export async function deleteCloudBackup(backupId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/backups/${encodeURIComponent(backupId)}`, {
      method: 'DELETE',
    });
    const data = await res.json().catch(() => null);
    return Boolean(res.ok && data?.ok);
  } catch {
    return false;
  }
}

export async function restoreFromCloudBackup(
  backupId: string
): Promise<{ ok: boolean; backupName?: string; restoredKeysCount?: number; error?: string }> {
  try {
    const res = await fetch('/api/backups/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ backupId }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok || !data.data) {
      return { ok: false, error: data?.error || 'Restore failed.' };
    }

    // Apply restored snapshot directly to localStorage without triggering dbSync write-back
    applyRestoredSnapshotToLocalStorage(data.data);
    return {
      ok: true,
      backupName: data.backupName,
      restoredKeysCount: data.restoredKeysCount,
    };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Network error during restore.' };
  }
}

export async function restoreFromUploadedBackupFile(
  file: File
): Promise<{ ok: boolean; backupName?: string; restoredKeysCount?: number; error?: string }> {
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const uploadedData =
      parsed && typeof parsed.data === 'object' ? parsed.data : parsed;
    if (!uploadedData || typeof uploadedData !== 'object') {
      return { ok: false, error: 'Invalid backup JSON format.' };
    }

    const res = await fetch('/api/backups/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: parsed?.name || file.name,
        uploadedData,
      }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok || !data.data) {
      return { ok: false, error: data?.error || 'Restore from file failed.' };
    }

    applyRestoredSnapshotToLocalStorage(data.data);
    return {
      ok: true,
      backupName: data.backupName,
      restoredKeysCount: data.restoredKeysCount,
    };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Could not parse backup file.' };
  }
}

export async function wipeWorkspaceDataClean(): Promise<{ ok: boolean; error?: string }> {
  const EMPTY_ARRAY_KEYS = [
    'ozostack_leads_v2',
    'ozostack_deals_v2',
    'ozostack_tasks_v2',
    'ozostack_calendar_events_v3',
    'ozostack_projects',
    'ozostack_project_activities',
    'ozostack_contacts_v1',
    'ozostack_companies_v1',
    'ozostack_followups_v2',
    'ozostack_invoices_v1',
    'ozostack_proposals_v1',
    'ozostack_quotations_v1',
    'ozostack_contracts_v1',
    'ozostack_expenses_v1',
    'ozostack_expenses',
    'ozostack_payments_v1',
    'ozostack_payments',
    'ozostack_documents_v2',
    'ozostack_time_entries_v1',
    'ozostack_team_members_v1',
    'ozostack_departments_v1',
    'ozostack_attendance_v1',
    'ozostack_leave_requests_v1',
    'ozostack_jobs_v1',
    'ozostack_revenue_transactions_v1',
    'ozostack_payroll_records_v1',
    'ozostack_pay_runs_v1',
    'ozostack_reimbursements_v1',
    'ozostack_notifications_v4',
    'ozostack_personal_todos_v1',
    'ozostack_personal_notes_v1',
  ];

  const updates: Record<string, string> = {};
  for (const k of EMPTY_ARRAY_KEYS) {
    updates[k] = '[]';
  }

  const deletes: string[] = [];
  if (typeof window !== 'undefined' && window.localStorage) {
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (
        k &&
        (k.startsWith('ozostack_mailbox_') ||
          k.startsWith('ozostack_sentlog_') ||
          k.startsWith('ozostack_smtp_') ||
          k.startsWith('ozostack_wa_') ||
          k.startsWith('ozostack_workflows_') ||
          k.startsWith('ozostack_webhook_sources_') ||
          k.startsWith('ozostack_workflow_logs_') ||
          k.startsWith('ozostack_gemini_key_'))
      ) {
        deletes.push(k);
      }
    }
  }

  try {
    // 0. Flush any pending local edits so no queued sync overwrites the wipe
    await flushDatabaseNow();

    // 1. Apply atomically to MongoDB first
    const res = await fetch('/api/crm-state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates, deletes }),
    });
    const resData = await res.json().catch(() => null);
    if (!res.ok || (resData && resData.ok === false)) {
      return { ok: false, error: resData?.error || 'Could not wipe cloud database.' };
    }

    // 2. Apply atomically to browser localStorage (preserve Admin auth & workspace setup keys)
    const PRESERVE_KEYS = [
      'ozo-auth-store-v5',
      'ozostack_crm_config_v1',
      'ozostack_lead_forms_v1',
      'ozostack_currency_v1',
    ];
    const cleanState: Record<string, string> = { ...updates };
    for (const pk of PRESERVE_KEYS) {
      const existing = window.localStorage.getItem(pk);
      if (typeof existing === 'string') {
        cleanState[pk] = existing;
      }
    }
    applyRestoredSnapshotToLocalStorage(cleanState);
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Failed to wipe workspace data.' };
  }
}
