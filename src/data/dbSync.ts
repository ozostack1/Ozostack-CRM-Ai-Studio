// Automatic bidirectional synchronization between browser localStorage and live MongoDB (/api/crm-state)

const EXCLUDED_KEYS = new Set([
  'ozostack_selected_date',
  'ozostack_selected_date_label',
  'ozostack_content_items_v1',
  'ozostack_notifications_v1',
  'ozostack_notifications_v2',
  'ozostack_notifications_v3',
  'ozostack_smtp_config_v1',
  'ozostack_mailbox_messages_v1',
  'ozostack_sent_emails_v1',
]);

function isSyncedKey(key: string): boolean {
  if (!key || EXCLUDED_KEYS.has(key)) return false;
  return key.startsWith('ozostack_') || key.startsWith('ozo-auth-store-');
}

let isHydrating = false;
let pendingUpdates: Record<string, string> = {};
let pendingDeletes = new Set<string>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;

const nativeSetItem = Storage.prototype.setItem;
const nativeRemoveItem = Storage.prototype.removeItem;
const nativeClear = Storage.prototype.clear;

async function flushToDatabase(useKeepalive = false): Promise<void> {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  const updates = pendingUpdates;
  const deletes = Array.from(pendingDeletes);
  if (Object.keys(updates).length === 0 && deletes.length === 0) return;

  pendingUpdates = {};
  pendingDeletes = new Set<string>();

  try {
    await fetch('/api/crm-state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates, deletes }),
      keepalive: useKeepalive,
    });
  } catch {
    // Offline or local Vite dev without server.mjs; localStorage still holds state
  }
}

function scheduleFlush(): void {
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => {
    flushToDatabase(false);
  }, 120);
}

function installLocalStorageHooks(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;

  Storage.prototype.setItem = function (key: string, value: string) {
    const strVal = String(value);
    nativeSetItem.call(this, key, strVal);
    if (this === window.localStorage && !isHydrating && isSyncedKey(key)) {
      pendingDeletes.delete(key);
      pendingUpdates[key] = strVal;
      scheduleFlush();
    }
  };

  Storage.prototype.removeItem = function (key: string) {
    nativeRemoveItem.call(this, key);
    if (this === window.localStorage && !isHydrating && isSyncedKey(key)) {
      delete pendingUpdates[key];
      pendingDeletes.add(key);
      scheduleFlush();
    }
  };

  Storage.prototype.clear = function () {
    if (this === window.localStorage && !isHydrating) {
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && isSyncedKey(k)) {
          delete pendingUpdates[k];
          pendingDeletes.add(k);
        }
      }
      scheduleFlush();
    }
    nativeClear.call(this);
  };
}

function collectLocalSyncedItems(): Record<string, string> {
  const items: Record<string, string> = {};
  if (typeof window === 'undefined' || !window.localStorage) return items;
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (key && isSyncedKey(key)) {
      const val = window.localStorage.getItem(key);
      if (typeof val === 'string') {
        items[key] = val;
      }
    }
  }
  return items;
}

async function pullFromDatabase(notifyViews = false): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  try {
    const res = await fetch('/api/crm-state', {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return false;
    const data = await res.json();
    if (!data || !data.dbConnected || typeof data.items !== 'object') {
      return false;
    }

    const remoteItems: Record<string, string> = data.items;
    const remoteKeys = Object.keys(remoteItems);

    if (remoteKeys.length > 0) {
      isHydrating = true;
      let changed = false;
      try {
        // Apply all database keys into localStorage
        for (const [k, v] of Object.entries(remoteItems)) {
          if (isSyncedKey(k) && window.localStorage.getItem(k) !== v) {
            nativeSetItem.call(window.localStorage, k, v);
            changed = true;
          }
        }
      } finally {
        isHydrating = false;
      }

      if (notifyViews && changed) {
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('ozostack-crm-config-changed'));
      }
      return true;
    } else {
      // Database collection is empty on first boot: seed it with any local state
      const localItems = collectLocalSyncedItems();
      if (Object.keys(localItems).length > 0) {
        Object.assign(pendingUpdates, localItems);
        scheduleFlush();
      }
      return true;
    }
  } catch {
    clearTimeout(timeout);
    return false;
  }
}

export async function flushDatabaseNow(): Promise<void> {
  await flushToDatabase(false);
}

export function collectAllLocalSyncedSnapshot(): Record<string, string> {
  return collectLocalSyncedItems();
}

/**
 * Atomically replaces browser localStorage CRM keys with a restored backup snapshot
 * WITHOUT triggering any dbSync write-backs or beforeunload flushes.
 */
export function applyRestoredSnapshotToLocalStorage(
  restoredData: Record<string, string>
): void {
  if (typeof window === 'undefined' || !window.localStorage) return;

  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  pendingUpdates = {};
  pendingDeletes = new Set<string>();
  isHydrating = true;

  try {
    // Clear existing synced CRM keys except auth store (unless backup includes it)
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && isSyncedKey(k) && k !== 'ozo-auth-store-v5') {
        keysToRemove.push(k);
      }
    }
    for (const k of keysToRemove) {
      nativeRemoveItem.call(window.localStorage, k);
    }

    // Write every restored key directly into localStorage
    for (const [k, v] of Object.entries(restoredData)) {
      if (isSyncedKey(k) && typeof v === 'string') {
        nativeSetItem.call(window.localStorage, k, v);
      }
    }
  } finally {
    // Keep isHydrating true until reload finishes so mounted effects cannot overwrite restored data
    setTimeout(() => {
      isHydrating = false;
    }, 3000);
  }
}

export async function initDatabaseSync(): Promise<void> {
  if (typeof window === 'undefined') return;

  installLocalStorageHooks();
  const connected = await pullFromDatabase(false);

  // After initial render, ensure any default keys initialized during mount are persisted to MongoDB
  if (connected) {
    setTimeout(() => {
      const localItems = collectLocalSyncedItems();
      if (Object.keys(localItems).length > 0) {
        Object.assign(pendingUpdates, localItems);
        scheduleFlush();
      }
    }, 1000);
  }

  window.addEventListener('beforeunload', () => {
    flushToDatabase(true);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushToDatabase(true);
    } else if (document.visibilityState === 'visible') {
      pullFromDatabase(true);
    }
  });
}
