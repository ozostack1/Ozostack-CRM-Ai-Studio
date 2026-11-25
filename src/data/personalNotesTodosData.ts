import { useState, useEffect, useCallback, useMemo } from 'react';
import { PersonalTodo, PersonalNote } from '../types/personalNotesTodos';

const STORAGE_KEY_TODOS = 'ozostack_personal_todos_v1';
const STORAGE_KEY_NOTES = 'ozostack_personal_notes_v1';
const EVENT_NAME = 'ozostack-personal-notes-todos-changed';

const norm = (str?: string | null): string =>
  (str || '')
    .replace(/\s*\([^)]*\)/g, '')
    .trim()
    .toLowerCase();

// Clean empty defaults — no old 2025 mock data seeded for staff workspaces
export const DEFAULT_TODOS: PersonalTodo[] = [];
export const DEFAULT_NOTES: PersonalNote[] = [];

export function loadAllTodos(): PersonalTodo[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TODOS);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    /* fallback */
  }
  return [];
}

export function saveAllTodos(todos: PersonalTodo[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_TODOS, JSON.stringify(todos));
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  } catch {
    /* quota fallback */
  }
}

export function loadAllNotes(): PersonalNote[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_NOTES);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    /* fallback */
  }
  return [];
}

export function saveAllNotes(notes: PersonalNote[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(notes));
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  } catch {
    /* quota fallback */
  }
}

function belongsToCurrentUser(
  item: { ownerId?: string; ownerName?: string },
  userId?: string,
  userName?: string
): boolean {
  if (!userId && !userName) return false;
  if (item.ownerId) {
    return Boolean(userId && item.ownerId === userId);
  }
  return Boolean(userName && norm(item.ownerName) === norm(userName));
}

/**
 * Hook providing strictly scoped personal workspace for the authenticated staff member.
 * Even Super Admins ONLY see their own personal to-dos and notes — never other staff members' items.
 */
export function usePersonalWorkspace(user?: { name?: string; id?: string } | null) {
  const [allTodos, setAllTodos] = useState<PersonalTodo[]>(() => loadAllTodos());
  const [allNotes, setAllNotes] = useState<PersonalNote[]>(() => loadAllNotes());

  const currentUserId = user?.id || '';
  const currentUserName = user?.name || '';

  const refresh = useCallback(() => {
    setAllTodos(loadAllTodos());
    setAllNotes(loadAllNotes());
  }, []);

  useEffect(() => {
    refresh();
    const handleEvent = () => refresh();
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY_TODOS || e.key === STORAGE_KEY_NOTES) {
        refresh();
      }
    };

    window.addEventListener(EVENT_NAME, handleEvent);
    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', handleEvent);

    return () => {
      window.removeEventListener(EVENT_NAME, handleEvent);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleEvent);
    };
  }, [refresh]);

  // Strict per-user isolation: every staff member (including Super Admin) ONLY sees their own items
  const userTodos = useMemo(() => {
    return allTodos.filter((t) => belongsToCurrentUser(t, currentUserId, currentUserName));
  }, [allTodos, currentUserId, currentUserName]);

  const userNotes = useMemo(() => {
    return allNotes
      .filter((n) => belongsToCurrentUser(n, currentUserId, currentUserName))
      .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
  }, [allNotes, currentUserId, currentUserName]);

  // CRUD for To-Dos
  const addTodo = useCallback(
    (item: Omit<PersonalTodo, 'id' | 'createdAt' | 'ownerName' | 'ownerId'>) => {
      const newTodo: PersonalTodo = {
        ...item,
        id: `todo-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        ownerId: currentUserId || undefined,
        ownerName: currentUserName,
        createdAt: new Date().toISOString(),
      };
      const updated = [newTodo, ...loadAllTodos()];
      saveAllTodos(updated);
      return newTodo;
    },
    [currentUserId, currentUserName]
  );

  const updateTodo = useCallback(
    (updatedTodo: PersonalTodo) => {
      const current = loadAllTodos();
      const updated = current.map((t) =>
        t.id === updatedTodo.id && belongsToCurrentUser(t, currentUserId, currentUserName)
          ? { ...updatedTodo, ownerId: currentUserId || t.ownerId, ownerName: currentUserName || t.ownerName }
          : t
      );
      saveAllTodos(updated);
    },
    [currentUserId, currentUserName]
  );

  const toggleTodo = useCallback(
    (id: string) => {
      const current = loadAllTodos();
      const updated = current.map((t) => {
        if (t.id !== id || !belongsToCurrentUser(t, currentUserId, currentUserName)) return t;
        const completed = !t.completed;
        return {
          ...t,
          completed,
          completedAt: completed ? new Date().toISOString() : undefined,
        };
      });
      saveAllTodos(updated);
    },
    [currentUserId, currentUserName]
  );

  const deleteTodo = useCallback(
    (id: string) => {
      const current = loadAllTodos();
      const updated = current.filter(
        (t) => !(t.id === id && belongsToCurrentUser(t, currentUserId, currentUserName))
      );
      saveAllTodos(updated);
    },
    [currentUserId, currentUserName]
  );

  // CRUD for Notes
  const addNote = useCallback(
    (item: Omit<PersonalNote, 'id' | 'createdAt' | 'updatedAt' | 'ownerName' | 'ownerId'>) => {
      const now = new Date().toISOString();
      const newNote: PersonalNote = {
        ...item,
        id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        ownerId: currentUserId || undefined,
        ownerName: currentUserName,
        createdAt: now,
        updatedAt: now,
      };
      const updated = [newNote, ...loadAllNotes()];
      saveAllNotes(updated);
      return newNote;
    },
    [currentUserId, currentUserName]
  );

  const updateNote = useCallback(
    (updatedNote: PersonalNote) => {
      const now = new Date().toISOString();
      const current = loadAllNotes();
      const updated = current.map((n) =>
        n.id === updatedNote.id && belongsToCurrentUser(n, currentUserId, currentUserName)
          ? {
              ...updatedNote,
              ownerId: currentUserId || n.ownerId,
              ownerName: currentUserName || n.ownerName,
              updatedAt: now,
            }
          : n
      );
      saveAllNotes(updated);
    },
    [currentUserId, currentUserName]
  );

  const togglePinNote = useCallback(
    (id: string) => {
      const current = loadAllNotes();
      const updated = current.map((n) =>
        n.id === id && belongsToCurrentUser(n, currentUserId, currentUserName)
          ? { ...n, pinned: !n.pinned }
          : n
      );
      saveAllNotes(updated);
    },
    [currentUserId, currentUserName]
  );

  const deleteNote = useCallback(
    (id: string) => {
      const current = loadAllNotes();
      const updated = current.filter(
        (n) => !(n.id === id && belongsToCurrentUser(n, currentUserId, currentUserName))
      );
      saveAllNotes(updated);
    },
    [currentUserId, currentUserName]
  );

  // KPI calculations
  const kpis = useMemo(() => {
    const totalTodos = userTodos.length;
    const completedTodos = userTodos.filter((t) => t.completed).length;
    const pendingTodos = totalTodos - completedTodos;
    const completionRate = totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0;
    const totalNotes = userNotes.length;
    const pinnedNotes = userNotes.filter((n) => n.pinned).length;

    return {
      totalTodos,
      completedTodos,
      pendingTodos,
      completionRate,
      totalNotes,
      pinnedNotes,
    };
  }, [userTodos, userNotes]);

  return {
    todos: userTodos,
    notes: userNotes,
    kpis,
    currentUserName,
    addTodo,
    updateTodo,
    toggleTodo,
    deleteTodo,
    addNote,
    updateNote,
    togglePinNote,
    deleteNote,
  };
}
