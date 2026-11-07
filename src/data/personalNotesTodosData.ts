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

export const DEFAULT_TODOS: PersonalTodo[] = [
  // Neha Sharma
  {
    id: 'todo-ns-1',
    ownerName: 'Neha Sharma',
    title: 'Review QA regression checklist for Sprint 14',
    completed: false,
    priority: 'High',
    dueDate: '2025-05-20',
    category: 'Work',
    notes: 'Verify checkout cart calculation and webhook idempotency.',
    createdAt: '2025-05-19T09:00:00.000Z',
  },
  {
    id: 'todo-ns-2',
    ownerName: 'Neha Sharma',
    title: 'Draft customer follow-up notes for SwiftRetail demo',
    completed: false,
    priority: 'Medium',
    dueDate: '2025-05-20',
    category: 'Meeting Prep',
    notes: 'Highlight sub-second inventory synchronization feature.',
    createdAt: '2025-05-19T11:30:00.000Z',
  },
  {
    id: 'todo-ns-3',
    ownerName: 'Neha Sharma',
    title: 'Submit weekly sprint velocity report to project manager',
    completed: true,
    priority: 'High',
    dueDate: '2025-05-19',
    category: 'Urgent',
    notes: 'Submitted via project dashboard.',
    createdAt: '2025-05-18T14:00:00.000Z',
    completedAt: '2025-05-19T17:15:00.000Z',
  },
  {
    id: 'todo-ns-4',
    ownerName: 'Neha Sharma',
    title: 'Check API rate-limiting response latency report',
    completed: false,
    priority: 'Low',
    dueDate: '2025-05-22',
    category: 'Review',
    createdAt: '2025-05-20T08:00:00.000Z',
  },

  // Sayed
  {
    id: 'todo-sy-1',
    ownerName: 'Sayed',
    title: 'Review quarterly revenue forecast with finance manager',
    completed: false,
    priority: 'High',
    dueDate: '2025-05-20',
    category: 'Review',
    notes: 'Focus on enterprise recurring revenue expansion.',
    createdAt: '2025-05-19T08:30:00.000Z',
  },
  {
    id: 'todo-sy-2',
    ownerName: 'Sayed',
    title: 'Finalize enterprise contract addendum for Apex Global',
    completed: false,
    priority: 'High',
    dueDate: '2025-05-20',
    category: 'Urgent',
    notes: 'Confirm SLA guarantees and custom support tier.',
    createdAt: '2025-05-19T10:00:00.000Z',
  },
  {
    id: 'todo-sy-3',
    ownerName: 'Sayed',
    title: 'One-on-one sync with engineering department lead',
    completed: true,
    priority: 'Medium',
    dueDate: '2025-05-19',
    category: 'Meeting Prep',
    createdAt: '2025-05-18T15:00:00.000Z',
    completedAt: '2025-05-19T16:00:00.000Z',
  },

  // Amit Kumar
  {
    id: 'todo-ak-1',
    ownerName: 'Amit Kumar',
    title: 'Verify Redis failover sentinel latency in staging cluster',
    completed: false,
    priority: 'High',
    dueDate: '2025-05-20',
    category: 'Work',
    createdAt: '2025-05-19T09:15:00.000Z',
  },
  {
    id: 'todo-ak-2',
    ownerName: 'Amit Kumar',
    title: 'Prepare cloud architecture slides for client discovery call',
    completed: false,
    priority: 'High',
    dueDate: '2025-05-20',
    category: 'Meeting Prep',
    createdAt: '2025-05-19T12:00:00.000Z',
  },
];

export const DEFAULT_NOTES: PersonalNote[] = [
  // Neha Sharma
  {
    id: 'note-ns-1',
    ownerName: 'Neha Sharma',
    title: 'Sprint 14 QA Focus & Test Matrix',
    content: `Key focus items for upcoming release:
• Verify multi-currency conversion on shopping cart totals
• Ensure Stripe webhook idempotency keys are properly stored in Redis
• Test 256-bit SSL public lead form validation on mobile browsers
• Run Playwright end-to-end regression test suite`,
    pinned: true,
    colorTag: 'sky',
    tags: ['QA', 'Testing', 'Sprint 14'],
    createdAt: '2025-05-18T10:00:00.000Z',
    updatedAt: '2025-05-20T08:30:00.000Z',
  },
  {
    id: 'note-ns-2',
    ownerName: 'Neha Sharma',
    title: 'SwiftRetail Demo Agenda & Requirements',
    content: `Client expectations from today's demo:
1. Sub-second POS inventory sync
2. Automated WhatsApp purchase receipts
3. Role-based employee access control
4. Custom export of daily ledger`,
    pinned: false,
    colorTag: 'emerald',
    tags: ['Demo', 'SwiftRetail', 'Clients'],
    createdAt: '2025-05-19T11:00:00.000Z',
    updatedAt: '2025-05-19T15:20:00.000Z',
  },
  {
    id: 'note-ns-3',
    ownerName: 'Neha Sharma',
    title: 'Ideas & Automation Improvements',
    content: `Investigate automated Playwright visual regression runs in GitHub Actions.
Check Web Audio API synthesizer for clean notification chimes.`,
    pinned: false,
    colorTag: 'amber',
    tags: ['Ideas', 'Personal'],
    createdAt: '2025-05-17T16:00:00.000Z',
    updatedAt: '2025-05-18T12:10:00.000Z',
  },

  // Sayed
  {
    id: 'note-sy-1',
    ownerName: 'Sayed',
    title: 'Executive Product Strategy 2025',
    content: `Core Growth Pillars:
1. Web-to-Lead dynamic embed generator with direct CRM sync
2. High-converting cold outreach templates for Email & WhatsApp
3. Role-based notification privacy: staff members only see their own tasks and meetings
4. Enterprise compliance and fine-grained data auditing`,
    pinned: true,
    colorTag: 'purple',
    tags: ['Strategy', 'Executive', 'Roadmap'],
    createdAt: '2025-05-16T09:00:00.000Z',
    updatedAt: '2025-05-20T09:00:00.000Z',
  },
  {
    id: 'note-sy-2',
    ownerName: 'Sayed',
    title: 'Investor & Board Meeting Talking Points',
    content: `Key Q2 metrics:
• 34% increase in inbound lead pipeline
• SaaS gross profit margin steady at 82%
• New customer retention rate reached 96.4%`,
    pinned: false,
    colorTag: 'sky',
    tags: ['Board', 'Finance'],
    createdAt: '2025-05-18T14:30:00.000Z',
    updatedAt: '2025-05-19T16:45:00.000Z',
  },

  // Amit Kumar
  {
    id: 'note-ak-1',
    ownerName: 'Amit Kumar',
    title: 'Cloud Architecture & Multi-Region VPC Peering',
    content: `Design notes:
• Cross-region active-active failover latency requirement < 35ms
• Route 53 latency routing with automatic health check failover
• Redis cache cluster replication factor: 3 read replicas`,
    pinned: true,
    colorTag: 'sky',
    tags: ['AWS', 'Architecture', 'DevOps'],
    createdAt: '2025-05-17T13:00:00.000Z',
    updatedAt: '2025-05-19T10:15:00.000Z',
  },
];

export function loadAllTodos(): PersonalTodo[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TODOS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    /* fallback */
  }
  return DEFAULT_TODOS;
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
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    /* fallback */
  }
  return DEFAULT_NOTES;
}

export function saveAllNotes(notes: PersonalNote[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(notes));
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  } catch {
    /* quota fallback */
  }
}

/**
 * Hook providing strictly scoped personal workspace for the authenticated staff member.
 */
export function usePersonalWorkspace(user?: { name?: string; id?: string } | null) {
  const [allTodos, setAllTodos] = useState<PersonalTodo[]>(() => loadAllTodos());
  const [allNotes, setAllNotes] = useState<PersonalNote[]>(() => loadAllNotes());

  const currentUserName = user?.name || 'Sayed';

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

  // Strict personal scoping: staff members ONLY see their own items
  const userTodos = useMemo(() => {
    const myName = norm(currentUserName);
    return allTodos.filter((t) => norm(t.ownerName) === myName);
  }, [allTodos, currentUserName]);

  const userNotes = useMemo(() => {
    const myName = norm(currentUserName);
    return allNotes
      .filter((n) => norm(n.ownerName) === myName)
      .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
  }, [allNotes, currentUserName]);

  // CRUD for To-Dos
  const addTodo = useCallback(
    (item: Omit<PersonalTodo, 'id' | 'createdAt' | 'ownerName'>) => {
      const newTodo: PersonalTodo = {
        ...item,
        id: `todo-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        ownerName: currentUserName,
        createdAt: new Date().toISOString(),
      };
      const updated = [newTodo, ...loadAllTodos()];
      saveAllTodos(updated);
      return newTodo;
    },
    [currentUserName]
  );

  const updateTodo = useCallback((updatedTodo: PersonalTodo) => {
    const current = loadAllTodos();
    const updated = current.map((t) => (t.id === updatedTodo.id ? updatedTodo : t));
    saveAllTodos(updated);
  }, []);

  const toggleTodo = useCallback((id: string) => {
    const current = loadAllTodos();
    const updated = current.map((t) => {
      if (t.id !== id) return t;
      const completed = !t.completed;
      return {
        ...t,
        completed,
        completedAt: completed ? new Date().toISOString() : undefined,
      };
    });
    saveAllTodos(updated);
  }, []);

  const deleteTodo = useCallback((id: string) => {
    const current = loadAllTodos();
    const updated = current.filter((t) => t.id !== id);
    saveAllTodos(updated);
  }, []);

  // CRUD for Notes
  const addNote = useCallback(
    (item: Omit<PersonalNote, 'id' | 'createdAt' | 'updatedAt' | 'ownerName'>) => {
      const now = new Date().toISOString();
      const newNote: PersonalNote = {
        ...item,
        id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        ownerName: currentUserName,
        createdAt: now,
        updatedAt: now,
      };
      const updated = [newNote, ...loadAllNotes()];
      saveAllNotes(updated);
      return newNote;
    },
    [currentUserName]
  );

  const updateNote = useCallback((updatedNote: PersonalNote) => {
    const now = new Date().toISOString();
    const current = loadAllNotes();
    const updated = current.map((n) =>
      n.id === updatedNote.id ? { ...updatedNote, updatedAt: now } : n
    );
    saveAllNotes(updated);
  }, []);

  const togglePinNote = useCallback((id: string) => {
    const current = loadAllNotes();
    const updated = current.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n));
    saveAllNotes(updated);
  }, []);

  const deleteNote = useCallback((id: string) => {
    const current = loadAllNotes();
    const updated = current.filter((n) => n.id !== id);
    saveAllNotes(updated);
  }, []);

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
