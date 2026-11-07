import React, { useState, useMemo } from 'react';
import {
  ListTodo,
  StickyNote,
  Plus,
  Search,
  CheckCircle2,
  Circle,
  Pin,
  Trash2,
  Edit2,
  Copy,
  Check,
  Calendar,
  Tag,
  Clock,
  Sparkles,
  Lock,
  Columns,
  Eye,
  X,
  AlertCircle,
  CheckSquare,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import {
  usePersonalWorkspace,
} from '../../data/personalNotesTodosData';
import {
  PersonalTodo,
  PersonalNote,
  TodoPriority,
  TodoCategory,
  NoteColor,
} from '../../types/personalNotesTodos';

const NOTE_COLOR_STYLES: Record<
  NoteColor,
  {
    bgLight: string;
    bgDark: string;
    borderLight: string;
    borderDark: string;
    badgeBg: string;
    badgeText: string;
    dotColor: string;
  }
> = {
  sky: {
    bgLight: 'bg-sky-50/80',
    bgDark: 'bg-sky-950/20',
    borderLight: 'border-sky-200',
    borderDark: 'border-sky-800/50',
    badgeBg: 'bg-sky-100 dark:bg-sky-900/60',
    badgeText: 'text-sky-700 dark:text-sky-300',
    dotColor: 'bg-sky-500',
  },
  emerald: {
    bgLight: 'bg-emerald-50/80',
    bgDark: 'bg-emerald-950/20',
    borderLight: 'border-emerald-200',
    borderDark: 'border-emerald-800/50',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-900/60',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    dotColor: 'bg-emerald-500',
  },
  amber: {
    bgLight: 'bg-amber-50/80',
    bgDark: 'bg-amber-950/20',
    borderLight: 'border-amber-200',
    borderDark: 'border-amber-800/50',
    badgeBg: 'bg-amber-100 dark:bg-amber-900/60',
    badgeText: 'text-amber-800 dark:text-amber-300',
    dotColor: 'bg-amber-500',
  },
  purple: {
    bgLight: 'bg-purple-50/80',
    bgDark: 'bg-purple-950/20',
    borderLight: 'border-purple-200',
    borderDark: 'border-purple-800/50',
    badgeBg: 'bg-purple-100 dark:bg-purple-900/60',
    badgeText: 'text-purple-700 dark:text-purple-300',
    dotColor: 'bg-purple-500',
  },
  rose: {
    bgLight: 'bg-rose-50/80',
    bgDark: 'bg-rose-950/20',
    borderLight: 'border-rose-200',
    borderDark: 'border-rose-800/50',
    badgeBg: 'bg-rose-100 dark:bg-rose-900/60',
    badgeText: 'text-rose-700 dark:text-rose-300',
    dotColor: 'bg-rose-500',
  },
  slate: {
    bgLight: 'bg-slate-50/90',
    bgDark: 'bg-slate-900/60',
    borderLight: 'border-slate-200',
    borderDark: 'border-slate-800',
    badgeBg: 'bg-slate-200 dark:bg-slate-800',
    badgeText: 'text-slate-700 dark:text-slate-300',
    dotColor: 'bg-slate-400',
  },
};

const CATEGORIES: TodoCategory[] = [
  'Work',
  'Meeting Prep',
  'Follow Up',
  'Review',
  'Personal',
  'Urgent',
];

export const PersonalNotesTodosView: React.FC = () => {
  const { theme } = useTheme();
  const { currentUser } = useAuth();
  const isLight = theme === 'white-sky';

  const {
    todos,
    notes,
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
  } = usePersonalWorkspace(currentUser);

  // View state
  const [activeTab, setActiveTab] = useState<'all' | 'todos' | 'notes'>('all');
  const [todoFilter, setTodoFilter] = useState<'all' | 'active' | 'completed' | 'high'>('all');
  const [todoSearch, setTodoSearch] = useState('');
  const [noteSearch, setNoteSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Inline Quick Add To-Do State
  const [quickTitle, setQuickTitle] = useState('');
  const [quickPriority, setQuickPriority] = useState<TodoPriority>('Medium');
  const [quickCategory, setQuickCategory] = useState<string>('Work');

  // Modal States
  const [todoToEdit, setTodoToEdit] = useState<PersonalTodo | null>(null);
  const [isTodoModalOpen, setIsTodoModalOpen] = useState(false);

  const [noteToEdit, setNoteToEdit] = useState<PersonalNote | null>(null);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);

  const [viewNote, setViewNote] = useState<PersonalNote | null>(null);

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Inline Add Handler
  const handleInlineAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    addTodo({
      title: quickTitle.trim(),
      priority: quickPriority,
      category: quickCategory,
      completed: false,
      dueDate: new Date().toISOString().split('T')[0],
    });
    setQuickTitle('');
    showToast('Personal to-do added.');
  };

  // Filtered To-Dos
  const filteredTodos = useMemo(() => {
    return todos.filter((t) => {
      if (todoFilter === 'active' && t.completed) return false;
      if (todoFilter === 'completed' && !t.completed) return false;
      if (todoFilter === 'high' && t.priority !== 'High') return false;

      if (todoSearch) {
        const q = todoSearch.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesCategory = t.category?.toLowerCase().includes(q);
        const matchesNotes = t.notes?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesCategory && !matchesNotes) return false;
      }
      return true;
    });
  }, [todos, todoFilter, todoSearch]);

  // Filtered Notes
  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      if (selectedTag && !n.tags.includes(selectedTag)) return false;

      if (noteSearch) {
        const q = noteSearch.toLowerCase();
        const matchesTitle = n.title.toLowerCase().includes(q);
        const matchesContent = n.content.toLowerCase().includes(q);
        const matchesTag = n.tags.some((tg) => tg.toLowerCase().includes(q));
        if (!matchesTitle && !matchesContent && !matchesTag) return false;
      }
      return true;
    });
  }, [notes, selectedTag, noteSearch]);

  // All unique tags across user's notes
  const allTags = useMemo(() => {
    const set = new Set<string>();
    notes.forEach((n) => n.tags.forEach((tg) => set.add(tg)));
    return Array.from(set);
  }, [notes]);

  const cardBg = isLight
    ? 'bg-white border-sky-100/90 shadow-xs'
    : 'bg-[#0f172a]/95 border-slate-800';

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-900 text-white dark:bg-sky-500 dark:text-slate-950 text-xs font-bold shadow-2xl animate-fade-in border border-slate-700 dark:border-sky-400">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-slate-950 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header & Private Privacy Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              To Do & Notes
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40">
              <Lock className="w-3 h-3" />
              Private Workspace · {currentUserName}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Your personal scratchpad, checklists, and daily to-dos. Only visible to you.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setTodoToEdit(null);
              setIsTodoModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-600 text-white shadow-sm shadow-sky-500/20 transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New To-Do</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setNoteToEdit(null);
              setIsNoteModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-500 hover:bg-indigo-600 text-white shadow-sm shadow-indigo-500/20 transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Note</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className={`p-4 rounded-2xl border ${cardBg}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Pending To-Dos</span>
            <div className="w-7 h-7 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold tabular-nums">{kpis.pendingTodos}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            Out of {kpis.totalTodos} total tasks
          </div>
        </div>

        <div className={`p-4 rounded-2xl border ${cardBg}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Completion Rate</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold tabular-nums text-emerald-500">
            {kpis.completionRate}%
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${kpis.completionRate}%` }}
            />
          </div>
        </div>

        <div className={`p-4 rounded-2xl border ${cardBg}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Personal Notes</span>
            <div className="w-7 h-7 rounded-xl bg-sky-500/15 text-sky-500 flex items-center justify-center">
              <StickyNote className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold tabular-nums">{kpis.totalNotes}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            Active private memos
          </div>
        </div>

        <div className={`p-4 rounded-2xl border ${cardBg}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Pinned Important</span>
            <div className="w-7 h-7 rounded-xl bg-purple-500/15 text-purple-500 flex items-center justify-center">
              <Pin className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold tabular-nums">{kpis.pinnedNotes}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            Pinned to workspace top
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl border border-sky-100 dark:border-slate-800 bg-sky-50/50 dark:bg-slate-900/40 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'all'
              ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-xs'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Columns className="w-3.5 h-3.5" />
          <span>All-in-One Split View</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('todos')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'todos'
              ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-xs'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ListTodo className="w-3.5 h-3.5" />
          <span>To-Do Checklist ({todos.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('notes')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'notes'
              ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-xs'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <StickyNote className="w-3.5 h-3.5" />
          <span>Personal Notes ({notes.length})</span>
        </button>
      </div>

      {/* Content Area */}
      <div
        className={
          activeTab === 'all'
            ? 'grid grid-cols-1 lg:grid-cols-12 gap-6'
            : 'space-y-6'
        }
      >
        {/* TO-DO SECTION */}
        {(activeTab === 'all' || activeTab === 'todos') && (
          <div className={activeTab === 'all' ? 'lg:col-span-6 space-y-4' : 'space-y-4'}>
            <div className={`p-4 sm:p-5 rounded-2xl border ${cardBg}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center">
                    <ListTodo className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold">Personal To-Do List</h2>
                    <p className="text-[11px] text-slate-400">
                      Private tasks only you can track and complete
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                  {kpis.pendingTodos} left
                </span>
              </div>

              {/* Fast Inline Quick Add */}
              <form onSubmit={handleInlineAddTodo} className="mb-4">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={quickTitle}
                    onChange={(e) => setQuickTitle(e.target.value)}
                    placeholder="Add a new personal task..."
                    className={`flex-1 px-3.5 py-2 rounded-xl border text-xs font-medium outline-none transition-all ${
                      isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-sky-500 focus:bg-white'
                        : 'bg-slate-900 border-slate-700 text-white focus:border-sky-400'
                    }`}
                  />
                  <div className="flex items-center gap-1.5 shrink-0">
                    <select
                      value={quickPriority}
                      onChange={(e) => setQuickPriority(e.target.value as TodoPriority)}
                      className={`px-2.5 py-2 rounded-xl border text-xs font-bold outline-none cursor-pointer ${
                        isLight
                          ? 'bg-slate-50 border-slate-200 text-slate-700'
                          : 'bg-slate-900 border-slate-700 text-slate-300'
                      }`}
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>

                    <button
                      type="submit"
                      disabled={!quickTitle.trim()}
                      className="px-3 py-2 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-600 disabled:opacity-40 text-white transition-all shrink-0 active:scale-95"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </form>

              {/* Filters & Search */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2 border-t border-sky-100/40 dark:border-slate-800">
                <div className="flex items-center gap-1 overflow-x-auto text-[11px]">
                  {(['all', 'active', 'completed', 'high'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setTodoFilter(mode)}
                      className={`px-2.5 py-1 rounded-lg font-bold capitalize transition-colors ${
                        todoFilter === mode
                          ? 'bg-sky-500 text-white shadow-2xs'
                          : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={todoSearch}
                    onChange={(e) => setTodoSearch(e.target.value)}
                    placeholder="Search tasks..."
                    className={`pl-7 pr-3 py-1 rounded-lg border text-[11px] outline-none ${
                      isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-800'
                        : 'bg-slate-900 border-slate-700 text-white'
                    }`}
                  />
                </div>
              </div>

              {/* To-Do Items List */}
              <div className="mt-3 space-y-2 max-h-[460px] overflow-y-auto pr-1">
                {filteredTodos.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    <CheckSquare className="w-6 h-6 mx-auto mb-1 text-sky-400/50" />
                    No to-do items found
                  </div>
                ) : (
                  filteredTodos.map((todo) => {
                    const isHigh = todo.priority === 'High';
                    const isMed = todo.priority === 'Medium';

                    return (
                      <div
                        key={todo.id}
                        className={`p-3 rounded-xl border flex items-start gap-3 transition-all group ${
                          todo.completed
                            ? 'opacity-60 bg-slate-50/50 dark:bg-slate-900/30 border-slate-200/60 dark:border-slate-800/60'
                            : isLight
                            ? 'bg-white border-slate-200/80 hover:border-sky-300'
                            : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {/* Toggle Checkbox */}
                        <button
                          type="button"
                          onClick={() => {
                            toggleTodo(todo.id);
                            showToast(todo.completed ? 'Marked active' : 'Completed!');
                          }}
                          className={`mt-0.5 shrink-0 transition-transform active:scale-90 ${
                            todo.completed ? 'text-emerald-500' : 'text-slate-400 hover:text-sky-500'
                          }`}
                        >
                          {todo.completed ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </button>

                        {/* Title & Metadata */}
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-xs font-semibold leading-snug break-words ${
                              todo.completed
                                ? 'line-through text-slate-400 dark:text-slate-500'
                                : 'text-slate-800 dark:text-slate-100'
                            }`}
                          >
                            {todo.title}
                          </p>
                          {todo.notes && (
                            <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                              {todo.notes}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-[10px]">
                            {/* Priority pill */}
                            <span
                              className={`px-1.5 py-0.2 rounded font-bold uppercase tracking-wider ${
                                isHigh
                                  ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-300'
                                  : isMed
                                  ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300'
                                  : 'bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300'
                              }`}
                            >
                              {todo.priority}
                            </span>

                            {/* Category pill */}
                            {todo.category && (
                              <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium">
                                {todo.category}
                              </span>
                            )}

                            {/* Due date */}
                            {todo.dueDate && (
                              <span className="flex items-center gap-1 text-slate-400">
                                <Calendar className="w-2.5 h-2.5" />
                                {todo.dueDate}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 shrink-0 transition-opacity">
                          <button
                            type="button"
                            onClick={() => {
                              setTodoToEdit(todo);
                              setIsTodoModalOpen(true);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              deleteTodo(todo.id);
                              showToast('To-Do deleted.');
                            }}
                            className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* NOTES SECTION */}
        {(activeTab === 'all' || activeTab === 'notes') && (
          <div className={activeTab === 'all' ? 'lg:col-span-6 space-y-4' : 'space-y-4'}>
            <div className={`p-4 sm:p-5 rounded-2xl border ${cardBg}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                    <StickyNote className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold">Personal Notes & Memos</h2>
                    <p className="text-[11px] text-slate-400">
                      Private scratchpad and ideas only accessible to you
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setNoteToEdit(null);
                    setIsNoteModalOpen(true);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 transition-colors hover:bg-indigo-100"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Note</span>
                </button>
              </div>

              {/* Search & Tag Filter */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 mb-3">
                <div className="relative flex-1">
                  <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={noteSearch}
                    onChange={(e) => setNoteSearch(e.target.value)}
                    placeholder="Search notes content or tags..."
                    className={`w-full pl-7 pr-3 py-1.5 rounded-xl border text-xs outline-none ${
                      isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-800'
                        : 'bg-slate-900 border-slate-700 text-white'
                    }`}
                  />
                </div>

                {allTags.length > 0 && (
                  <div className="flex items-center gap-1 overflow-x-auto text-[11px] shrink-0">
                    <button
                      type="button"
                      onClick={() => setSelectedTag(null)}
                      className={`px-2 py-0.5 rounded-lg font-bold transition-colors ${
                        selectedTag === null
                          ? 'bg-indigo-500 text-white'
                          : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                      }`}
                    >
                      All Tags
                    </button>
                    {allTags.map((tg) => (
                      <button
                        key={tg}
                        type="button"
                        onClick={() => setSelectedTag(tg === selectedTag ? null : tg)}
                        className={`px-2 py-0.5 rounded-lg font-bold transition-colors ${
                          selectedTag === tg
                            ? 'bg-indigo-500 text-white'
                            : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                        }`}
                      >
                        #{tg}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes Grid */}
              <div
                className={
                  activeTab === 'notes'
                    ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 max-h-[640px] overflow-y-auto pr-1'
                    : 'grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[460px] overflow-y-auto pr-1'
                }
              >
                {filteredNotes.length === 0 ? (
                  <div className="col-span-full py-8 text-center text-xs text-slate-400">
                    <StickyNote className="w-6 h-6 mx-auto mb-1 text-indigo-400/50" />
                    No personal notes found
                  </div>
                ) : (
                  filteredNotes.map((note) => {
                    const style = NOTE_COLOR_STYLES[note.colorTag] || NOTE_COLOR_STYLES.slate;

                    return (
                      <div
                        key={note.id}
                        className={`p-3.5 rounded-2xl border transition-all relative flex flex-col justify-between group ${
                          isLight
                            ? `${style.bgLight} ${style.borderLight} shadow-2xs`
                            : `${style.bgDark} ${style.borderDark}`
                        }`}
                      >
                        <div>
                          {/* Note Header & Pin Toggle */}
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <h3 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1 flex-1">
                              {note.title}
                            </h3>
                            <button
                              type="button"
                              onClick={() => {
                                togglePinNote(note.id);
                                showToast(note.pinned ? 'Unpinned' : 'Pinned to top');
                              }}
                              className={`p-1 rounded-lg transition-transform active:scale-90 ${
                                note.pinned
                                  ? 'text-amber-500 fill-amber-500'
                                  : 'text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100'
                              }`}
                              title={note.pinned ? 'Unpin' : 'Pin to top'}
                            >
                              <Pin className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Body snippet */}
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 whitespace-pre-line line-clamp-4 leading-relaxed font-normal">
                            {note.content}
                          </p>
                        </div>

                        {/* Footer & Actions */}
                        <div className="mt-3 pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                          {/* Tags */}
                          <div className="flex items-center gap-1 overflow-x-auto">
                            {note.tags.slice(0, 2).map((tg) => (
                              <span
                                key={tg}
                                className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${style.badgeBg} ${style.badgeText}`}
                              >
                                #{tg}
                              </span>
                            ))}
                            {note.tags.length > 2 && (
                              <span className="text-[9px] text-slate-400">
                                +{note.tags.length - 2}
                              </span>
                            )}
                          </div>

                          {/* Action Toolbar */}
                          <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => setViewNote(note)}
                              className="p-1 rounded text-slate-400 hover:text-sky-500 transition-colors"
                              title="View Note"
                            >
                              <Eye className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(`${note.title}\n\n${note.content}`);
                                showToast('Note copied to clipboard!');
                              }}
                              className="p-1 rounded text-slate-400 hover:text-emerald-500 transition-colors"
                              title="Copy"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setNoteToEdit(note);
                                setIsNoteModalOpen(true);
                              }}
                              className="p-1 rounded text-slate-400 hover:text-sky-500 transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                deleteNote(note.id);
                                showToast('Note deleted.');
                              }}
                              className="p-1 rounded text-slate-400 hover:text-rose-500 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* TO-DO CREATE/EDIT MODAL */}
      {isTodoModalOpen && (
        <TodoModal
          todo={todoToEdit}
          onClose={() => setIsTodoModalOpen(false)}
          onSave={(item) => {
            if (todoToEdit) {
              updateTodo({ ...todoToEdit, ...item });
              showToast('To-Do updated.');
            } else {
              addTodo(item);
              showToast('To-Do created.');
            }
            setIsTodoModalOpen(false);
          }}
        />
      )}

      {/* NOTE CREATE/EDIT MODAL */}
      {isNoteModalOpen && (
        <NoteModal
          note={noteToEdit}
          onClose={() => setIsNoteModalOpen(false)}
          onSave={(item) => {
            if (noteToEdit) {
              updateNote({ ...noteToEdit, ...item });
              showToast('Note updated.');
            } else {
              addNote(item);
              showToast('Note saved.');
            }
            setIsNoteModalOpen(false);
          }}
        />
      )}

      {/* NOTE VIEW MODAL */}
      {viewNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div
            className={`max-w-lg w-full rounded-2xl border p-6 shadow-2xl relative ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800 text-white'
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <h3 className="text-base font-extrabold">{viewNote.title}</h3>
              <button
                type="button"
                onClick={() => setViewNote(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Updated {new Date(viewNote.updatedAt).toLocaleDateString()}
              </span>
              <div className="flex items-center gap-1">
                {viewNote.tags.map((tg) => (
                  <span
                    key={tg}
                    className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300"
                  >
                    #{tg}
                  </span>
                ))}
              </div>
            </div>

            <div
              className={`p-4 rounded-xl border max-h-72 overflow-y-auto text-xs whitespace-pre-line leading-relaxed ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-800/60 border-slate-700 text-slate-200'
              }`}
            >
              {viewNote.content}
            </div>

            <div className="flex items-center justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(`${viewNote.title}\n\n${viewNote.content}`);
                  showToast('Note copied!');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-50 dark:bg-slate-800 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-slate-700 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Content</span>
              </button>
              <button
                type="button"
                onClick={() => setViewNote(null)}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ========================================================================
   SUB-MODAL: TO-DO CREATE & EDIT
   ======================================================================== */
export interface TodoModalProps {
  todo: PersonalTodo | null;
  onClose: () => void;
  onSave: (item: Omit<PersonalTodo, 'id' | 'createdAt' | 'ownerName'>) => void;
}

export const TodoModal: React.FC<TodoModalProps> = ({ todo, onClose, onSave }) => {
  const { theme } = useTheme();
  const isLight = theme === 'white-sky';

  const [title, setTitle] = useState(todo?.title || '');
  const [priority, setPriority] = useState<TodoPriority>(todo?.priority || 'Medium');
  const [category, setCategory] = useState<string>(todo?.category || 'Work');
  const [dueDate, setDueDate] = useState(
    todo?.dueDate || new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState(todo?.notes || '');
  const [completed, setCompleted] = useState(todo?.completed || false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      priority,
      category,
      dueDate,
      notes: notes.trim() || undefined,
      completed,
    });
  };

  const inputCls = `w-full px-3 py-2 rounded-xl border text-xs font-medium outline-none transition-all ${
    isLight
      ? 'bg-slate-50 border-slate-200 text-slate-800 focus:border-sky-500 focus:bg-white'
      : 'bg-slate-800 border-slate-700 text-white focus:border-sky-400'
  }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div
        className={`max-w-md w-full rounded-2xl border p-6 shadow-2xl relative ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800 text-white'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center">
              <ListTodo className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-extrabold">
              {todo ? 'Edit Personal To-Do' : 'New Personal To-Do'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold mb-1 text-slate-500 dark:text-slate-400">
              Task Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Review Sprint 14 QA test matrix"
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold mb-1 text-slate-500 dark:text-slate-400">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TodoPriority)}
                className={inputCls}
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1 text-slate-500 dark:text-slate-400">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={inputCls}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1 text-slate-500 dark:text-slate-400">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1 text-slate-500 dark:text-slate-400">
              Private Notes / Checklist
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes or details for yourself..."
              className={inputCls}
            />
          </div>

          {todo && (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="todo-completed-check"
                checked={completed}
                onChange={(e) => setCompleted(e.target.checked)}
                className="w-4 h-4 rounded text-sky-500 cursor-pointer"
              />
              <label
                htmlFor="todo-completed-check"
                className="text-xs font-bold cursor-pointer text-slate-700 dark:text-slate-300"
              >
                Mark as Completed
              </label>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-600 text-white shadow-sm transition-all active:scale-95"
            >
              {todo ? 'Save Changes' : 'Create To-Do'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ========================================================================
   SUB-MODAL: NOTE CREATE & EDIT
   ======================================================================== */
export interface NoteModalProps {
  note: PersonalNote | null;
  onClose: () => void;
  onSave: (item: Omit<PersonalNote, 'id' | 'createdAt' | 'updatedAt' | 'ownerName'>) => void;
}

export const NoteModal: React.FC<NoteModalProps> = ({ note, onClose, onSave }) => {
  const { theme } = useTheme();
  const isLight = theme === 'white-sky';

  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [colorTag, setColorTag] = useState<NoteColor>(note?.colorTag || 'sky');
  const [pinned, setPinned] = useState(note?.pinned || false);
  const [tagsInput, setTagsInput] = useState(note?.tags?.join(', ') || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    onSave({
      title: title.trim(),
      content: content.trim(),
      colorTag,
      pinned,
      tags,
    });
  };

  const inputCls = `w-full px-3 py-2 rounded-xl border text-xs font-medium outline-none transition-all ${
    isLight
      ? 'bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500 focus:bg-white'
      : 'bg-slate-800 border-slate-700 text-white focus:border-indigo-400'
  }`;

  const colors: NoteColor[] = ['sky', 'emerald', 'amber', 'purple', 'rose', 'slate'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div
        className={`max-w-md w-full rounded-2xl border p-6 shadow-2xl relative ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800 text-white'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <StickyNote className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-extrabold">
              {note ? 'Edit Personal Note' : 'New Personal Note'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold mb-1 text-slate-500 dark:text-slate-400">
              Note Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Client Demo Feedback & Architecture Notes"
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1 text-slate-500 dark:text-slate-400">
              Note Content <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={5}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your personal thoughts, code snippets, memos, or scratchpad ideas here..."
              className={inputCls}
            />
          </div>

          {/* Color tag selector */}
          <div>
            <label className="block text-xs font-bold mb-1 text-slate-500 dark:text-slate-400">
              Color Style
            </label>
            <div className="flex items-center gap-2">
              {colors.map((c) => {
                const isSelected = colorTag === c;
                const dot = NOTE_COLOR_STYLES[c].dotColor;

                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColorTag(c)}
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${dot} ${
                      isSelected ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1 text-slate-500 dark:text-slate-400">
              Tags (comma separated)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g., QA, Demo, Sprint 14"
              className={inputCls}
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="note-pinned-check"
              checked={pinned}
              onChange={(e) => setPinned(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-500 cursor-pointer"
            />
            <label
              htmlFor="note-pinned-check"
              className="text-xs font-bold cursor-pointer text-slate-700 dark:text-slate-300 flex items-center gap-1"
            >
              <Pin className="w-3 h-3 text-amber-500" />
              Pin note to top of workspace
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-500 hover:bg-indigo-600 text-white shadow-sm transition-all active:scale-95"
            >
              {note ? 'Save Changes' : 'Save Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

