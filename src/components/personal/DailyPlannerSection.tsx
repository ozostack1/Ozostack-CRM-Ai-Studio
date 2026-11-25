import React, { useState, useEffect, useMemo } from 'react';
import {
  Star,
  Flame,
  Target,
  Sparkles,
  Plus,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  Edit2,
  Trash2,
  ArrowRightCircle,
  Bookmark,
  RotateCcw,
  BookOpen,
  X,
  Loader2,
  Check,
  TrendingUp,
  Lock,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { PersonalTodo } from '../../types/personalNotesTodos';
import {
  AiCoachAdvice,
  AiSuggestedTask,
  DAILY_PLANNER_EVENT,
  DailyPlannerTask,
  PLANNER_CATEGORIES,
  PRIORITY_WEIGHT,
  PlannerCategory,
  PlannerPriority,
  UserDailyPlannerStore,
  askAiDailyCoach,
  computeDayRating,
  computeWeeklyStats,
  formatFriendlyDate,
  getLocalDateIso,
  loadUserPlannerStore,
  saveUserPlannerStore,
  shiftIsoDate,
} from '../../data/dailyPlannerService';

interface DailyPlannerSectionProps {
  onNotify: (msg: string) => void;
  pendingGeneralTodos: PersonalTodo[];
}

export const DailyPlannerSection: React.FC<DailyPlannerSectionProps> = ({
  onNotify,
  pendingGeneralTodos,
}) => {
  const { theme } = useTheme();
  const { currentUser } = useAuth();
  const isLight = theme === 'white-sky';
  const userId = currentUser?.id || '';

  const [store, setStore] = useState<UserDailyPlannerStore>(() => loadUserPlannerStore(userId));
  const [selectedDate, setSelectedDate] = useState<string>(() => getLocalDateIso(0));

  // Quick Add Task State
  const [newTitle, setNewTitle] = useState('');
  const [newTimeSlot, setNewTimeSlot] = useState('');
  const [newPriority, setNewPriority] = useState<PlannerPriority>('High');
  const [newCategory, setNewCategory] = useState<PlannerCategory>('Deep Work');

  // Personal Goal inline state
  const [goalDraft, setGoalDraft] = useState(store.goalText);
  const [editingGoal, setEditingGoal] = useState(false);

  // Reflection inline state
  const [reflectionDraft, setReflectionDraft] = useState('');

  // Edit Task Modal
  const [editingTask, setEditingTask] = useState<DailyPlannerTask | null>(null);

  // AI Coach state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<AiCoachAdvice | null>(null);
  const [addedAiTitles, setAddedAiTitles] = useState<Record<string, boolean>>({});

  // Reload strictly scoped store whenever authenticated user changes
  useEffect(() => {
    const loaded = loadUserPlannerStore(userId);
    setStore(loaded);
    setGoalDraft(loaded.goalText);
    setEditingGoal(false);
    setAiAdvice(null);
    setAddedAiTitles({});
  }, [userId]);

  // Listen for cross-tab or external updates
  useEffect(() => {
    if (!userId) return;
    const sync = () => {
      const loaded = loadUserPlannerStore(userId);
      setStore(loaded);
    };
    window.addEventListener(DAILY_PLANNER_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(DAILY_PLANNER_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, [userId]);

  // Sync reflection draft when selected date changes
  useEffect(() => {
    setReflectionDraft(store.reflections[selectedDate]?.note || '');
  }, [selectedDate, store.reflections]);

  const commitStore = (updater: (prev: UserDailyPlannerStore) => UserDailyPlannerStore) => {
    if (!userId) return;
    const current = loadUserPlannerStore(userId);
    const next = updater(current);
    saveUserPlannerStore(userId, next);
    setStore(next);
  };

  // Derived data for selected day & 7-day trend
  const dayTasks = useMemo(() => {
    const rank: Record<PlannerPriority, number> = { High: 0, Medium: 1, Low: 2 };
    return store.tasks
      .filter((t) => t.date === selectedDate)
      .sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return rank[a.priority] - rank[b.priority];
      });
  }, [store.tasks, selectedDate]);

  const dayRating = useMemo(
    () => computeDayRating(selectedDate, store.tasks),
    [selectedDate, store.tasks]
  );

  const weeklyStats = useMemo(() => computeWeeklyStats(store.tasks), [store.tasks]);

  const prevDateIso = useMemo(() => shiftIsoDate(selectedDate, -1), [selectedDate]);
  const prevUnfinishedTasks = useMemo(
    () => store.tasks.filter((t) => t.date === prevDateIso && !t.completed),
    [store.tasks, prevDateIso]
  );

  // CRUD handlers
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !userId) return;
    const task: DailyPlannerTask = {
      id: `dp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      date: selectedDate,
      title: newTitle.trim(),
      timeSlot: newTimeSlot.trim() || undefined,
      priority: newPriority,
      category: newCategory,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    commitStore((prev) => ({ ...prev, tasks: [task, ...prev.tasks] }));
    setNewTitle('');
    setNewTimeSlot('');
    onNotify('Task added to your daily plan.');
  };

  const handleToggleTask = (taskId: string) => {
    commitStore((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => {
        if (t.id !== taskId) return t;
        const completed = !t.completed;
        return {
          ...t,
          completed,
          completedAt: completed ? new Date().toISOString() : undefined,
        };
      }),
    }));
  };

  const handleDeleteTask = (taskId: string) => {
    commitStore((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== taskId),
    }));
    onNotify('Planner task deleted.');
  };

  const handleSaveEditedTask = (updated: DailyPlannerTask) => {
    commitStore((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === updated.id ? updated : t)),
    }));
    setEditingTask(null);
    onNotify('Planner task updated.');
  };

  const handleCarryForward = () => {
    if (prevUnfinishedTasks.length === 0) return;
    const existingTitles = new Set(dayTasks.map((t) => t.title.trim().toLowerCase()));
    const toMove = prevUnfinishedTasks.filter(
      (t) => !existingTitles.has(t.title.trim().toLowerCase())
    );
    if (toMove.length === 0) {
      onNotify('All yesterday tasks are already in today’s plan.');
      return;
    }
    const now = new Date().toISOString();
    const cloned: DailyPlannerTask[] = toMove.map((t, idx) => ({
      ...t,
      id: `dp-cf-${Date.now()}-${idx}`,
      date: selectedDate,
      completed: false,
      completedAt: undefined,
      createdAt: now,
    }));
    commitStore((prev) => ({ ...prev, tasks: [...cloned, ...prev.tasks] }));
    onNotify(`Carried forward ${cloned.length} unfinished task${cloned.length > 1 ? 's' : ''}.`);
  };

  const handleSaveRoutine = () => {
    if (dayTasks.length === 0) {
      onNotify('Add tasks first before saving a daily routine.');
      return;
    }
    const routine = dayTasks.map((t) => ({
      title: t.title,
      timeSlot: t.timeSlot,
      priority: t.priority,
      category: t.category,
    }));
    commitStore((prev) => ({ ...prev, routine }));
    onNotify(`Saved ${routine.length} tasks as your reusable Daily Routine.`);
  };

  const handleLoadRoutine = () => {
    if (store.routine.length === 0) {
      onNotify('No saved routine yet. Add tasks and click Save Routine first.');
      return;
    }
    const existingTitles = new Set(dayTasks.map((t) => t.title.trim().toLowerCase()));
    const now = new Date().toISOString();
    const newTasks: DailyPlannerTask[] = store.routine
      .filter((r) => !existingTitles.has(r.title.trim().toLowerCase()))
      .map((r, idx) => ({
        id: `dp-rt-${Date.now()}-${idx}`,
        date: selectedDate,
        title: r.title,
        timeSlot: r.timeSlot,
        priority: r.priority,
        category: r.category,
        completed: false,
        createdAt: now,
      }));
    if (newTasks.length === 0) {
      onNotify('All routine tasks are already in this day’s plan.');
      return;
    }
    commitStore((prev) => ({ ...prev, tasks: [...newTasks, ...prev.tasks] }));
    onNotify(`Loaded ${newTasks.length} routine task${newTasks.length > 1 ? 's' : ''}.`);
  };

  const handleSaveGoal = () => {
    commitStore((prev) => ({ ...prev, goalText: goalDraft.trim() }));
    setEditingGoal(false);
    onNotify('Personal goal saved.');
  };

  const handleSaveReflection = () => {
    commitStore((prev) => ({
      ...prev,
      reflections: {
        ...prev.reflections,
        [selectedDate]: {
          date: selectedDate,
          note: reflectionDraft.trim(),
          updatedAt: new Date().toISOString(),
        },
      },
    }));
    onNotify('Daily reflection saved.');
  };

  const handleAskAiCoach = async () => {
    if (!currentUser || aiLoading) return;
    setAiLoading(true);
    setAiAdvice(null);
    const res = await askAiDailyCoach({
      userId: currentUser.id,
      userName: currentUser.name,
      date: selectedDate,
      goalText: store.goalText,
      dayTasks,
      dayRating,
      weeklyStats,
      pendingGeneralTodos,
      reflectionNote: store.reflections[selectedDate]?.note,
    });
    setAiAdvice(res);
    setAddedAiTitles({});
    setAiLoading(false);
    if (!res.ok) {
      onNotify(res.error || 'AI Coach could not respond right now.');
    }
  };

  const handleAddAiTask = (suggested: AiSuggestedTask) => {
    if (!userId) return;
    const task: DailyPlannerTask = {
      id: `dp-ai-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      date: selectedDate,
      title: suggested.title,
      timeSlot: suggested.timeSlot || undefined,
      priority: suggested.priority,
      category: suggested.category,
      notes: suggested.reason ? `AI Goal Tip: ${suggested.reason}` : undefined,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    commitStore((prev) => ({ ...prev, tasks: [task, ...prev.tasks] }));
    setAddedAiTitles((prev) => ({ ...prev, [suggested.title]: true }));
    onNotify('AI-suggested task added to your plan!');
  };

  const cardBg = isLight
    ? 'bg-white border-sky-100/90 shadow-xs'
    : 'bg-[#0f172a]/95 border-slate-800';

  const toneBadgeClass = {
    emerald: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    sky: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30',
    amber: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    rose: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
    slate: 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20',
  }[dayRating.tone];

  const toneBarClass = {
    emerald: 'bg-emerald-500',
    sky: 'bg-sky-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
    slate: 'bg-slate-300 dark:bg-slate-700',
  }[dayRating.tone];

  return (
    <div className="space-y-5">
      {/* Row 1: Rating Card, Streak/Avg Card, Personal Goal Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Selected Day Star Rating */}
        <div className={`lg:col-span-5 p-4 sm:p-5 rounded-2xl border ${cardBg}`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Daily Performance Rating
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold tabular-nums">
                  {dayRating.total > 0 ? dayRating.rating.toFixed(1) : '—'}
                </span>
                <span className="text-xs font-bold text-slate-400">/ 5.0</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${toneBadgeClass}`}
                >
                  {dayRating.gradeLabel}
                </span>
              </div>
              {/* 5 Star visual */}
              <div className="flex items-center gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((starIdx) => {
                  const filled = dayRating.rating >= starIdx;
                  const half = !filled && dayRating.rating >= starIdx - 0.5;
                  return (
                    <Star
                      key={starIdx}
                      className={`w-4 h-4 ${
                        filled
                          ? 'text-amber-400 fill-amber-400'
                          : half
                          ? 'text-amber-400 fill-amber-400/50'
                          : 'text-slate-300 dark:text-slate-700'
                      }`}
                    />
                  );
                })}
                <span className="ml-2 text-xs font-bold text-slate-500 dark:text-slate-400 tabular-nums">
                  {dayRating.weightedPct}% weighted ({dayRating.completed}/{dayRating.total} done)
                </span>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="text-[10px] font-semibold text-slate-400">Priority Weights</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                High 3pt · Med 2pt · Low 1pt
              </div>
              {dayRating.totalPoints > 0 && (
                <div className="text-xs font-extrabold text-sky-600 dark:text-sky-400 mt-1 tabular-nums">
                  {dayRating.earnedPoints} / {dayRating.totalPoints} pts
                </div>
              )}
            </div>
          </div>

          <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${toneBarClass}`}
              style={{ width: `${dayRating.weightedPct}%` }}
            />
          </div>
        </div>

        {/* Streak & 7-Day Avg */}
        <div className={`lg:col-span-3 p-4 sm:p-5 rounded-2xl border flex flex-col justify-between ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Consistency
            </span>
            <TrendingUp className="w-4 h-4 text-sky-500" />
          </div>
          <div className="grid grid-cols-2 gap-3 my-2">
            <div
              className={`p-2.5 rounded-xl border ${
                isLight ? 'bg-amber-50/70 border-amber-100' : 'bg-amber-950/20 border-amber-900/40'
              }`}
            >
              <div className="flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                <Flame className="w-3.5 h-3.5" />
                <span>Streak</span>
              </div>
              <div className="text-xl font-extrabold tabular-nums mt-0.5">
                {weeklyStats.streakDays}
                <span className="text-[11px] font-semibold text-slate-400 ml-1">days</span>
              </div>
            </div>

            <div
              className={`p-2.5 rounded-xl border ${
                isLight ? 'bg-sky-50/70 border-sky-100' : 'bg-sky-950/20 border-sky-900/40'
              }`}
            >
              <div className="flex items-center gap-1 text-[11px] font-bold text-sky-600 dark:text-sky-400">
                <Star className="w-3.5 h-3.5" />
                <span>7d Avg</span>
              </div>
              <div className="text-xl font-extrabold tabular-nums mt-0.5">
                {weeklyStats.ratedDaysCount > 0 ? weeklyStats.avgRating7d.toFixed(1) : '—'}
                <span className="text-[11px] font-semibold text-slate-400 ml-0.5">/5</span>
              </div>
            </div>
          </div>
          <div className="text-[10px] text-slate-400">
            Score ≥ 70% daily to keep your streak alive
          </div>
        </div>

        {/* Personal Goal Card (feeds AI Coach) */}
        <div className={`lg:col-span-4 p-4 sm:p-5 rounded-2xl border flex flex-col justify-between ${cardBg}`}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Target className="w-4 h-4 text-indigo-500" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                My Personal Goal
              </span>
            </div>
            {!editingGoal && (
              <button
                type="button"
                onClick={() => {
                  setGoalDraft(store.goalText);
                  setEditingGoal(true);
                }}
                className="text-[11px] font-bold text-sky-500 hover:underline"
              >
                {store.goalText ? 'Edit' : '+ Set Goal'}
              </button>
            )}
          </div>

          {editingGoal ? (
            <div className="mt-2 space-y-2">
              <input
                type="text"
                value={goalDraft}
                onChange={(e) => setGoalDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveGoal()}
                placeholder="e.g., Close 5 deals this month & do 10 follow-ups daily"
                className={`w-full px-3 py-1.5 rounded-xl border text-xs outline-none ${
                  isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'
                    : 'bg-slate-900 border-slate-700 text-white focus:border-indigo-400'
                }`}
              />
              <div className="flex items-center justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => setEditingGoal(false)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-slate-400 hover:text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveGoal}
                  className="px-3 py-1 rounded-lg text-[11px] font-bold bg-indigo-500 hover:bg-indigo-600 text-white"
                >
                  Save Goal
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs font-medium text-slate-700 dark:text-slate-200 my-2 line-clamp-2">
              {store.goalText || (
                <span className="text-slate-400 italic">
                  Set your weekly/monthly target so AI Coach can tailor your daily plan.
                </span>
              )}
            </p>
          )}

          <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
            <Lock className="w-3 h-3" />
            <span>Private to you — never visible to Super Admin or team</span>
          </div>
        </div>
      </div>

      {/* Row 2: 7-Day Performance Strip + Date Navigator */}
      <div className={`p-3.5 sm:p-4 rounded-2xl border ${cardBg}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Date Controls */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setSelectedDate((d) => shiftIsoDate(d, -1))}
              className={`p-1.5 rounded-xl border transition-colors ${
                isLight
                  ? 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  : 'border-slate-700 hover:bg-slate-800 text-slate-300'
              }`}
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setSelectedDate(getLocalDateIso(0))}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-500/20 transition-colors"
            >
              Today
            </button>

            <button
              type="button"
              onClick={() => setSelectedDate((d) => shiftIsoDate(d, 1))}
              className={`p-1.5 rounded-xl border transition-colors ${
                isLight
                  ? 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  : 'border-slate-700 hover:bg-slate-800 text-slate-300'
              }`}
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5 ml-1">
              <Calendar className="w-3.5 h-3.5 text-sky-500" />
              <span className="text-xs sm:text-sm font-extrabold">
                {formatFriendlyDate(selectedDate)}
              </span>
            </div>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
              className={`ml-1 px-2 py-1 rounded-lg border text-[11px] font-semibold outline-none ${
                isLight
                  ? 'bg-slate-50 border-slate-200 text-slate-700'
                  : 'bg-slate-900 border-slate-700 text-slate-200'
              }`}
              aria-label="Pick planner date"
            />
          </div>

          {/* 7-Day Clickable Rating Pills */}
          <div className="grid grid-cols-7 gap-1.5">
            {weeklyStats.last7Days.map((d) => {
              const isSelected = d.date === selectedDate;
              const dotClass =
                d.total === 0
                  ? 'bg-slate-300 dark:bg-slate-700'
                  : d.rating >= 4
                  ? 'bg-emerald-500'
                  : d.rating >= 3
                  ? 'bg-sky-500'
                  : 'bg-amber-500';
              return (
                <button
                  key={d.date}
                  type="button"
                  onClick={() => setSelectedDate(d.date)}
                  className={`px-2 py-1.5 rounded-xl border text-center transition-all ${
                    isSelected
                      ? 'border-sky-500 bg-sky-500 text-white shadow-xs'
                      : isLight
                      ? 'border-slate-200/80 bg-slate-50/70 hover:border-sky-300 text-slate-700'
                      : 'border-slate-800 bg-slate-900/70 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div
                    className={`text-[9px] font-bold uppercase ${
                      isSelected ? 'text-sky-100' : 'text-slate-400'
                    }`}
                  >
                    {d.shortDay}
                  </div>
                  <div className="text-xs font-extrabold leading-tight">{d.dayNum}</div>
                  <div className="flex items-center justify-center gap-0.5 mt-0.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : dotClass}`}
                    />
                    <span
                      className={`text-[9px] font-bold tabular-nums ${
                        isSelected ? 'text-white' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {d.total > 0 ? d.rating.toFixed(1) : '—'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 3: Left = Daily Tasks Plan | Right = AI Goal Coach + Daily Reflection */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Daily Planner Tasks */}
        <div className={`lg:col-span-7 p-4 sm:p-5 rounded-2xl border ${cardBg} flex flex-col`}>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-sm font-extrabold">Daily Action Plan</h2>
              <p className="text-[11px] text-slate-400">
                Add, edit, delete & tick tasks to earn your daily star rating
              </p>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {prevUnfinishedTasks.length > 0 && (
                <button
                  type="button"
                  onClick={handleCarryForward}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25 hover:bg-amber-500/20 transition-colors"
                  title="Copy unfinished tasks from the previous day"
                >
                  <ArrowRightCircle className="w-3.5 h-3.5" />
                  <span>Carry Forward ({prevUnfinishedTasks.length})</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleSaveRoutine}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-colors ${
                  isLight
                    ? 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    : 'border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
                title="Save today's tasks as your reusable daily routine"
              >
                <Bookmark className="w-3 h-3" />
                <span>Save Routine</span>
              </button>

              {store.routine.length > 0 && (
                <button
                  type="button"
                  onClick={handleLoadRoutine}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/25 hover:bg-sky-500/20 transition-colors"
                  title="Load your saved daily routine tasks into this day"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Load Routine ({store.routine.length})</span>
                </button>
              )}
            </div>
          </div>

          {/* Inline Add Task Form */}
          <form onSubmit={handleAddTask} className="mb-4 space-y-2">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="What will you accomplish today?"
                className={`flex-1 px-3.5 py-2 rounded-xl border text-xs font-medium outline-none transition-all ${
                  isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-sky-500 focus:bg-white'
                    : 'bg-slate-900 border-slate-700 text-white focus:border-sky-400'
                }`}
              />
              <button
                type="submit"
                disabled={!newTitle.trim()}
                className="inline-flex items-center justify-center gap-1 px-4 py-2 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-600 disabled:opacity-40 text-white transition-all active:scale-95 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Task</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                value={newTimeSlot}
                onChange={(e) => setNewTimeSlot(e.target.value)}
                placeholder="Time (e.g. 10:30 AM)"
                className={`px-2.5 py-1.5 rounded-xl border text-[11px] outline-none ${
                  isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-700'
                    : 'bg-slate-900 border-slate-700 text-slate-200'
                }`}
              />

              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as PlannerPriority)}
                className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold outline-none cursor-pointer ${
                  isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-700'
                    : 'bg-slate-900 border-slate-700 text-slate-200'
                }`}
              >
                <option value="High">High (3 pts)</option>
                <option value="Medium">Medium (2 pts)</option>
                <option value="Low">Low (1 pt)</option>
              </select>

              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as PlannerCategory)}
                className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold outline-none cursor-pointer ${
                  isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-700'
                    : 'bg-slate-900 border-slate-700 text-slate-200'
                }`}
              >
                {PLANNER_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </form>

          {/* Tasks List */}
          <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1 flex-1">
            {dayTasks.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400">
                <Calendar className="w-7 h-7 mx-auto mb-2 text-sky-400/50" />
                <p className="font-semibold text-slate-500 dark:text-slate-300">
                  No tasks planned for {formatFriendlyDate(selectedDate)}
                </p>
                <p className="text-[11px] mt-1">
                  Add your top 3–5 priorities above, load your Routine, or ask AI Coach for ideas!
                </p>
              </div>
            ) : (
              dayTasks.map((task) => {
                const pts = PRIORITY_WEIGHT[task.priority];
                const prioClass =
                  task.priority === 'High'
                    ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-300'
                    : task.priority === 'Medium'
                    ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300'
                    : 'bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300';

                return (
                  <div
                    key={task.id}
                    className={`p-3 rounded-xl border flex items-start gap-3 transition-all ${
                      task.completed
                        ? 'opacity-65 bg-slate-50/50 dark:bg-slate-900/30 border-slate-200/60 dark:border-slate-800/60'
                        : isLight
                        ? 'bg-white border-slate-200/80 hover:border-sky-300'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleTask(task.id)}
                      className={`mt-0.5 shrink-0 transition-transform active:scale-90 ${
                        task.completed ? 'text-emerald-500' : 'text-slate-400 hover:text-sky-500'
                      }`}
                      title={task.completed ? 'Mark incomplete' : 'Mark complete'}
                    >
                      {task.completed ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Circle className="w-4 h-4" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-xs font-semibold leading-snug break-words ${
                          task.completed
                            ? 'line-through text-slate-400 dark:text-slate-500'
                            : 'text-slate-800 dark:text-slate-100'
                        }`}
                      >
                        {task.title}
                      </p>

                      {task.notes && (
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                          {task.notes}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-[10px]">
                        <span className={`px-1.5 py-0.5 rounded font-bold ${prioClass}`}>
                          {task.priority} · {pts}pt
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                          {task.category}
                        </span>
                        {task.timeSlot && (
                          <span className="inline-flex items-center gap-1 text-slate-400 font-medium">
                            <Clock className="w-2.5 h-2.5" />
                            {task.timeSlot}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setEditingTask(task)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors"
                        title="Edit task"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                        title="Delete task"
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

        {/* Right Column: AI Goal Coach + Daily Reflection */}
        <div className="lg:col-span-5 space-y-4">
          {/* AI Goal Coach Card */}
          <div className={`p-4 sm:p-5 rounded-2xl border ${cardBg}`}>
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold">AI Goal Coach</h2>
                  <p className="text-[11px] text-slate-400">
                    Personalized tips to beat your goal & boost daily rating
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAskAiCoach}
              disabled={aiLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-500 to-sky-500 hover:from-indigo-600 hover:to-sky-600 disabled:opacity-60 text-white shadow-sm transition-all active:scale-[0.99]"
            >
              {aiLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing your plan & goal...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Optimize My Day with AI</span>
                </>
              )}
            </button>

            {aiAdvice && !aiAdvice.ok && (
              <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400">
                {aiAdvice.error || 'Could not generate AI suggestions right now.'}
              </div>
            )}

            {aiAdvice && aiAdvice.ok && (
              <div className="mt-4 space-y-3.5">
                {/* Diagnosis */}
                <div
                  className={`p-3 rounded-xl border text-xs leading-relaxed ${
                    isLight
                      ? 'bg-indigo-50/70 border-indigo-100 text-slate-800'
                      : 'bg-indigo-950/30 border-indigo-900/50 text-slate-200'
                  }`}
                >
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-500 mb-1">
                    Coach Diagnosis
                  </div>
                  {aiAdvice.diagnosis}
                </div>

                {/* Actionable Improvements */}
                {aiAdvice.improvements.length > 0 && (
                  <div>
                    <div className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                      What to Improve to Hit Your Goal
                    </div>
                    <ul className="space-y-1.5">
                      {aiAdvice.improvements.map((tip, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300"
                        >
                          <span className="w-4 h-4 rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400 text-[10px] font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Suggested High-Impact Tasks */}
                {aiAdvice.suggestedTasks.length > 0 && (
                  <div>
                    <div className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                      Recommended Tasks (1-Click Add)
                    </div>
                    <div className="space-y-2">
                      {aiAdvice.suggestedTasks.map((st, i) => {
                        const isAdded = Boolean(addedAiTitles[st.title]);
                        return (
                          <div
                            key={i}
                            className={`p-2.5 rounded-xl border flex items-start justify-between gap-2 ${
                              isLight
                                ? 'bg-slate-50/80 border-slate-200'
                                : 'bg-slate-900/70 border-slate-800'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                                {st.title}
                              </div>
                              {st.reason && (
                                <div className="text-[11px] text-slate-400 mt-0.5">
                                  {st.reason}
                                </div>
                              )}
                              <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-500">
                                <span className="font-bold text-indigo-500">{st.priority}</span>
                                <span>·</span>
                                <span>{st.category}</span>
                                {st.timeSlot && (
                                  <>
                                    <span>·</span>
                                    <span>{st.timeSlot}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <button
                              type="button"
                              disabled={isAdded}
                              onClick={() => handleAddAiTask(st)}
                              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold shrink-0 inline-flex items-center gap-1 transition-all ${
                                isAdded
                                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                  : 'bg-sky-500 hover:bg-sky-600 text-white active:scale-95'
                              }`}
                            >
                              {isAdded ? (
                                <>
                                  <Check className="w-3 h-3" />
                                  <span>Added</span>
                                </>
                              ) : (
                                <>
                                  <Plus className="w-3 h-3" />
                                  <span>Add</span>
                                </>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* End-of-Day Reflection Card */}
          <div className={`p-4 sm:p-5 rounded-2xl border ${cardBg}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-emerald-500" />
                <h3 className="text-xs font-extrabold">End-of-Day Reflection</h3>
              </div>
              <span className="text-[10px] text-slate-400">{selectedDate}</span>
            </div>
            <textarea
              rows={3}
              value={reflectionDraft}
              onChange={(e) => setReflectionDraft(e.target.value)}
              placeholder="What went well today? What blocked you? What will you do better tomorrow?"
              className={`w-full px-3 py-2 rounded-xl border text-xs outline-none resize-none ${
                isLight
                  ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500'
                  : 'bg-slate-900 border-slate-700 text-white focus:border-emerald-400'
              }`}
            />
            <div className="flex justify-end mt-2">
              <button
                type="button"
                onClick={handleSaveReflection}
                className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-emerald-500 hover:bg-emerald-600 text-white transition-all active:scale-95"
              >
                Save Reflection
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Planner Task Modal */}
      {editingTask && (
        <EditPlannerTaskModal
          task={editingTask}
          isLight={isLight}
          onClose={() => setEditingTask(null)}
          onSave={handleSaveEditedTask}
        />
      )}
    </div>
  );
};

interface EditPlannerTaskModalProps {
  task: DailyPlannerTask;
  isLight: boolean;
  onClose: () => void;
  onSave: (updated: DailyPlannerTask) => void;
}

const EditPlannerTaskModal: React.FC<EditPlannerTaskModalProps> = ({
  task,
  isLight,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState(task.title);
  const [date, setDate] = useState(task.date);
  const [timeSlot, setTimeSlot] = useState(task.timeSlot || '');
  const [priority, setPriority] = useState<PlannerPriority>(task.priority);
  const [category, setCategory] = useState<PlannerCategory>(task.category);
  const [notes, setNotes] = useState(task.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      ...task,
      title: title.trim(),
      date: date || task.date,
      timeSlot: timeSlot.trim() || undefined,
      priority,
      category,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div
        className={`w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden ${
          isLight ? 'bg-white border-sky-100' : 'bg-[#0f172a] border-slate-800'
        }`}
      >
        <div className="px-5 py-4 border-b border-sky-100/60 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-extrabold">Edit Daily Planner Task</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          <div>
            <label className="block font-bold mb-1">Task Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl border outline-none ${
                isLight
                  ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-sky-500'
                  : 'bg-slate-900 border-slate-700 text-white focus:border-sky-400'
              }`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border outline-none ${
                  isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-900'
                    : 'bg-slate-900 border-slate-700 text-white'
                }`}
              />
            </div>

            <div>
              <label className="block font-bold mb-1">Time Slot</label>
              <input
                type="text"
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                placeholder="e.g. 11:00 AM"
                className={`w-full px-3 py-2 rounded-xl border outline-none ${
                  isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-900'
                    : 'bg-slate-900 border-slate-700 text-white'
                }`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as PlannerPriority)}
                className={`w-full px-3 py-2 rounded-xl border font-bold outline-none ${
                  isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-900'
                    : 'bg-slate-900 border-slate-700 text-white'
                }`}
              >
                <option value="High">High (3 pts)</option>
                <option value="Medium">Medium (2 pts)</option>
                <option value="Low">Low (1 pt)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as PlannerCategory)}
                className={`w-full px-3 py-2 rounded-xl border outline-none ${
                  isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-900'
                    : 'bg-slate-900 border-slate-700 text-white'
                }`}
              >
                {PLANNER_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold mb-1">Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional details..."
              className={`w-full px-3 py-2 rounded-xl border outline-none resize-none ${
                isLight
                  ? 'bg-slate-50 border-slate-200 text-slate-900'
                  : 'bg-slate-900 border-slate-700 text-white'
              }`}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl font-bold bg-sky-500 hover:bg-sky-600 text-white"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
