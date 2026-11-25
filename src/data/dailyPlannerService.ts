import { PersonalTodo } from '../types/personalNotesTodos';

export const DAILY_PLANNER_EVENT = 'ozostack-personal-notes-todos-changed';

export type PlannerPriority = 'High' | 'Medium' | 'Low';
export type PlannerCategory =
  | 'Sales'
  | 'Follow-Up'
  | 'Client Work'
  | 'Deep Work'
  | 'Admin'
  | 'Personal';

export const PLANNER_CATEGORIES: PlannerCategory[] = [
  'Sales',
  'Follow-Up',
  'Client Work',
  'Deep Work',
  'Admin',
  'Personal',
];

export const PRIORITY_WEIGHT: Record<PlannerPriority, number> = {
  High: 3,
  Medium: 2,
  Low: 1,
};

export interface DailyPlannerTask {
  id: string;
  date: string; // YYYY-MM-DD (local date)
  title: string;
  timeSlot?: string;
  priority: PlannerPriority;
  category: PlannerCategory;
  notes?: string;
  completed: boolean;
  completedAt?: string;
  createdAt: string;
}

export interface DailyReflection {
  date: string;
  note: string;
  updatedAt: string;
}

export interface RoutineItem {
  title: string;
  timeSlot?: string;
  priority: PlannerPriority;
  category: PlannerCategory;
}

export interface UserDailyPlannerStore {
  goalText: string;
  tasks: DailyPlannerTask[];
  reflections: Record<string, DailyReflection>;
  routine: RoutineItem[];
}

export interface DayRatingResult {
  date: string;
  total: number;
  completed: number;
  totalPoints: number;
  earnedPoints: number;
  weightedPct: number;
  rating: number; // 0 to 5 in 0.5 increments
  gradeLabel: string;
  tone: 'emerald' | 'sky' | 'amber' | 'rose' | 'slate';
}

export interface WeeklyStats {
  streakDays: number;
  avgRating7d: number;
  ratedDaysCount: number;
  last7Days: (DayRatingResult & { shortDay: string; dayNum: string; isToday: boolean })[];
}

export interface AiSuggestedTask {
  title: string;
  priority: PlannerPriority;
  category: PlannerCategory;
  timeSlot: string;
  reason: string;
}

export interface AiCoachAdvice {
  ok: boolean;
  diagnosis: string;
  improvements: string[];
  suggestedTasks: AiSuggestedTask[];
  provider?: string;
  error?: string;
}

const EMPTY_STORE: UserDailyPlannerStore = {
  goalText: '',
  tasks: [],
  reflections: {},
  routine: [],
};

export function getLocalDateIso(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function shiftIsoDate(isoDate: string, deltaDays: number): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(y, (m || 1) - 1, (d || 1) + deltaDays);
  const ny = dt.getFullYear();
  const nm = String(dt.getMonth() + 1).padStart(2, '0');
  const nd = String(dt.getDate()).padStart(2, '0');
  return `${ny}-${nm}-${nd}`;
}

export function formatFriendlyDate(isoDate: string): string {
  const today = getLocalDateIso(0);
  const yesterday = getLocalDateIso(-1);
  const tomorrow = getLocalDateIso(1);

  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  const formatted = dt.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  if (isoDate === today) return `Today · ${formatted}`;
  if (isoDate === yesterday) return `Yesterday · ${formatted}`;
  if (isoDate === tomorrow) return `Tomorrow · ${formatted}`;
  return formatted;
}

export function getPlannerStorageKey(userId: string): string {
  return `ozostack_daily_planner_user_v1_${userId}`;
}

export function loadUserPlannerStore(userId?: string | null): UserDailyPlannerStore {
  if (!userId) return { ...EMPTY_STORE, tasks: [], reflections: {}, routine: [] };
  try {
    const raw = localStorage.getItem(getPlannerStorageKey(userId));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          goalText: typeof parsed.goalText === 'string' ? parsed.goalText : '',
          tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
          reflections:
            parsed.reflections && typeof parsed.reflections === 'object'
              ? parsed.reflections
              : {},
          routine: Array.isArray(parsed.routine) ? parsed.routine : [],
        };
      }
    }
  } catch {
    /* ignore corrupted storage */
  }
  return { ...EMPTY_STORE, tasks: [], reflections: {}, routine: [] };
}

export function saveUserPlannerStore(userId: string, store: UserDailyPlannerStore): void {
  if (!userId) return;
  try {
    localStorage.setItem(getPlannerStorageKey(userId), JSON.stringify(store));
    window.dispatchEvent(new CustomEvent(DAILY_PLANNER_EVENT));
  } catch {
    /* quota fallback */
  }
}

export function getTodayPendingPlannerCount(userId?: string | null): number {
  if (!userId) return 0;
  const today = getLocalDateIso(0);
  const store = loadUserPlannerStore(userId);
  return store.tasks.filter((t) => t.date === today && !t.completed).length;
}

export function computeDayRating(date: string, tasks: DailyPlannerTask[]): DayRatingResult {
  const dayTasks = tasks.filter((t) => t.date === date);
  const total = dayTasks.length;
  const completed = dayTasks.filter((t) => t.completed).length;

  if (total === 0) {
    return {
      date,
      total: 0,
      completed: 0,
      totalPoints: 0,
      earnedPoints: 0,
      weightedPct: 0,
      rating: 0,
      gradeLabel: 'No Plan Yet',
      tone: 'slate',
    };
  }

  let totalPoints = 0;
  let earnedPoints = 0;
  for (const t of dayTasks) {
    const pts = PRIORITY_WEIGHT[t.priority] || 2;
    totalPoints += pts;
    if (t.completed) earnedPoints += pts;
  }

  const weightedPct = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

  let rating = 0.5;
  let gradeLabel = 'Not Started';
  let tone: DayRatingResult['tone'] = 'rose';

  if (weightedPct >= 90) {
    rating = 5.0;
    gradeLabel = 'Outstanding';
    tone = 'emerald';
  } else if (weightedPct >= 80) {
    rating = 4.5;
    gradeLabel = 'Excellent';
    tone = 'emerald';
  } else if (weightedPct >= 70) {
    rating = 4.0;
    gradeLabel = 'Great Day';
    tone = 'sky';
  } else if (weightedPct >= 60) {
    rating = 3.5;
    gradeLabel = 'Good Progress';
    tone = 'sky';
  } else if (weightedPct >= 50) {
    rating = 3.0;
    gradeLabel = 'Steady';
    tone = 'amber';
  } else if (weightedPct >= 35) {
    rating = 2.0;
    gradeLabel = 'Needs Focus';
    tone = 'amber';
  } else if (weightedPct >= 15) {
    rating = 1.5;
    gradeLabel = 'Slow Start';
    tone = 'rose';
  } else if (weightedPct > 0) {
    rating = 1.0;
    gradeLabel = 'Low Progress';
    tone = 'rose';
  }

  return {
    date,
    total,
    completed,
    totalPoints,
    earnedPoints,
    weightedPct,
    rating,
    gradeLabel,
    tone,
  };
}

export function computeWeeklyStats(allTasks: DailyPlannerTask[]): WeeklyStats {
  const today = getLocalDateIso(0);
  const last7Days: WeeklyStats['last7Days'] = [];

  for (let offset = -6; offset <= 0; offset++) {
    const iso = getLocalDateIso(offset);
    const [y, m, d] = iso.split('-').map(Number);
    const dt = new Date(y, (m || 1) - 1, d || 1);
    const shortDay = dt.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNum = String(d);
    const res = computeDayRating(iso, allTasks);
    last7Days.push({
      ...res,
      shortDay,
      dayNum,
      isToday: iso === today,
    });
  }

  const ratedDays = last7Days.filter((d) => d.total > 0);
  const avgRating7d =
    ratedDays.length > 0
      ? Number((ratedDays.reduce((s, d) => s + d.rating, 0) / ratedDays.length).toFixed(1))
      : 0;

  // Streak: consecutive days with >= 70% weighted score.
  // If today hasn't reached 70% yet, start checking from yesterday so active morning doesn't break streak.
  let streakDays = 0;
  const todayStats = computeDayRating(today, allTasks);
  let cursorOffset = todayStats.total > 0 && todayStats.weightedPct >= 70 ? 0 : -1;

  for (let i = 0; i < 60; i++) {
    const iso = getLocalDateIso(cursorOffset - i);
    const r = computeDayRating(iso, allTasks);
    if (r.total > 0 && r.weightedPct >= 70) {
      streakDays++;
    } else {
      break;
    }
  }

  return {
    streakDays,
    avgRating7d,
    ratedDaysCount: ratedDays.length,
    last7Days,
  };
}

function normalizeCategory(raw?: string): PlannerCategory {
  if (!raw) return 'Deep Work';
  const found = PLANNER_CATEGORIES.find((c) => c.toLowerCase() === raw.trim().toLowerCase());
  return found || 'Deep Work';
}

function normalizePriority(raw?: string): PlannerPriority {
  if (raw === 'High' || raw === 'Medium' || raw === 'Low') return raw;
  const low = (raw || '').toLowerCase();
  if (low.includes('high') || low.includes('urgent')) return 'High';
  if (low.includes('low')) return 'Low';
  return 'Medium';
}

function getUserGeminiKey(userId?: string): string {
  try {
    const scoped = userId ? localStorage.getItem(`ozostack_ai_keys_${userId}`) : null;
    const raw = scoped || localStorage.getItem('ozostack_ai_api_keys_v1');
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed.geminiApiKey || parsed.gemini || '';
    }
  } catch {
    /* ignore */
  }
  return '';
}

export async function askAiDailyCoach(params: {
  userId?: string;
  userName: string;
  date: string;
  goalText: string;
  dayTasks: DailyPlannerTask[];
  dayRating: DayRatingResult;
  weeklyStats: WeeklyStats;
  pendingGeneralTodos: PersonalTodo[];
  reflectionNote?: string;
}): Promise<AiCoachAdvice> {
  const {
    userId,
    userName,
    date,
    goalText,
    dayTasks,
    dayRating,
    weeklyStats,
    pendingGeneralTodos,
    reflectionNote,
  } = params;

  const systemInstruction = `You are a sharp, practical personal productivity & goal-achievement coach inside a CRM workspace.
Analyze ONLY this single staff member's private daily plan, 7-day rating trend, pending personal to-dos, and personal goal.
Respond strictly as valid JSON with this exact schema:
{
  "diagnosis": "1-2 concise sentences evaluating their current day plan and 7-day pattern",
  "improvements": ["specific actionable tip 1", "specific actionable tip 2", "specific actionable tip 3"],
  "suggestedTasks": [
    {
      "title": "concrete task title (max 70 chars)",
      "priority": "High" | "Medium" | "Low",
      "category": "Sales" | "Follow-Up" | "Client Work" | "Deep Work" | "Admin" | "Personal",
      "timeSlot": "e.g. 10:00 AM - 11:00 AM or Morning",
      "reason": "short 1-line why this moves them closer to their goal"
    }
  ]
}
Provide 2 or 3 high-impact suggestedTasks that do NOT duplicate existing tasks for today. Keep tone direct, encouraging, and practical.`;

  const taskSummary =
    dayTasks.length > 0
      ? dayTasks
          .map(
            (t) =>
              `- [${t.completed ? 'DONE' : 'TODO'}] (${t.priority}, ${t.category}${
                t.timeSlot ? `, ${t.timeSlot}` : ''
              }) ${t.title}`
          )
          .join('\n')
      : '(No tasks planned for this day yet)';

  const trendSummary = weeklyStats.last7Days
    .map((d) => `${d.shortDay} ${d.dayNum}: ${d.total > 0 ? `${d.rating}/5 (${d.completed}/${d.total})` : 'no plan'}`)
    .join(' | ');

  const generalTodoSummary =
    pendingGeneralTodos.length > 0
      ? pendingGeneralTodos
          .slice(0, 8)
          .map((t) => `- (${t.priority}) ${t.title}`)
          .join('\n')
      : '(None)';

  const prompt = `User: ${userName}
Selected Date: ${date}
Personal Goal: ${goalText.trim() || 'Not specified yet — help them build a high-leverage productive workday'}
Selected Day Score: ${dayRating.rating}/5.0 (${dayRating.weightedPct}%, ${dayRating.completed}/${dayRating.total} done)
7-Day Streak (>=70%): ${weeklyStats.streakDays} days | 7-Day Avg Rating: ${weeklyStats.avgRating7d}/5.0
7-Day History: ${trendSummary}

Today's Planned Tasks:
${taskSummary}

Pending General Personal To-Dos:
${generalTodoSummary}

Reflection Note: ${reflectionNote?.trim() || '(None)'}

Return JSON with diagnosis, 3 improvements, and 2-3 high-impact suggestedTasks.`;

  try {
    const userApiKey = getUserGeminiKey(userId);
    const resp = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        systemInstruction,
        jsonMode: true,
        ...(userApiKey ? { userApiKey } : {}),
      }),
    });

    const data = await resp.json().catch(() => ({}));
    if (!resp.ok || !data?.ok || !data?.text) {
      return {
        ok: false,
        diagnosis: '',
        improvements: [],
        suggestedTasks: [],
        error: data?.error || `AI request failed (HTTP ${resp.status})`,
      };
    }

    let rawText = String(data.text).trim();
    const fenced = rawText.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced) rawText = fenced[1].trim();
    const startIdx = rawText.indexOf('{');
    const endIdx = rawText.lastIndexOf('}');
    if (startIdx >= 0 && endIdx > startIdx) {
      rawText = rawText.slice(startIdx, endIdx + 1);
    }

    const parsed = JSON.parse(rawText);
    const diagnosis =
      typeof parsed.diagnosis === 'string' && parsed.diagnosis.trim()
        ? parsed.diagnosis.trim()
        : 'Focus on finishing your High-priority tasks early to raise your daily score.';

    const improvements: string[] = Array.isArray(parsed.improvements)
      ? parsed.improvements
          .map((s: unknown) => String(s || '').trim())
          .filter(Boolean)
          .slice(0, 4)
      : [];

    const suggestedTasks: AiSuggestedTask[] = Array.isArray(parsed.suggestedTasks)
      ? parsed.suggestedTasks
          .map((item: Record<string, unknown>) => ({
            title: String(item?.title || '').trim(),
            priority: normalizePriority(String(item?.priority || '')),
            category: normalizeCategory(String(item?.category || '')),
            timeSlot: String(item?.timeSlot || 'Morning').trim(),
            reason: String(item?.reason || '').trim(),
          }))
          .filter((t: AiSuggestedTask) => t.title.length > 0)
          .slice(0, 3)
      : [];

    return {
      ok: true,
      diagnosis,
      improvements,
      suggestedTasks,
      provider: data.provider || data.model,
    };
  } catch (err) {
    return {
      ok: false,
      diagnosis: '',
      improvements: [],
      suggestedTasks: [],
      error: err instanceof Error ? err.message : 'Unable to reach AI Coach right now.',
    };
  }
}
