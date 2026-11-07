import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ChevronDown,
  Star,
  DollarSign,
  Briefcase,
  AlertCircle,
  FileText,
  Clock,
  X,
  Check,
  Users,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../data/notificationService';
import { useSystemCurrency, formatMoney } from '../data/currencyService';
import { NotificationItem } from '../types/crm';

type ProjectFilter = 'All Projects' | 'In Progress' | 'Completed' | 'On Hold' | 'Delayed';
type TaskFilter = 'All Tasks' | 'In Progress' | 'Completed' | 'To Do' | 'Under Review';
type PeriodFilter = 'This Month' | 'Last Month' | 'This Quarter';

interface DonutSlice {
  name: string;
  count: number;
  percentage: number;
  color: string;
  dash: string;
  offset: number;
}

const PROJECTS_MAP: Record<
  ProjectFilter,
  { centerCount: number; centerSub: string; items: DonutSlice[] }
> = {
  'All Projects': {
    centerCount: 38,
    centerSub: 'Total Projects',
    items: [
      { name: 'In Progress', count: 18, percentage: 47.4, color: '#38bdf8', dash: '114 126', offset: 0 },
      { name: 'Completed', count: 14, percentage: 36.8, color: '#10b981', dash: '88 152', offset: -114 },
      { name: 'On Hold', count: 4, percentage: 10.5, color: '#f59e0b', dash: '25 215', offset: -202 },
      { name: 'Delayed', count: 2, percentage: 5.3, color: '#ef4444', dash: '13 227', offset: -227 },
    ],
  },
  'In Progress': {
    centerCount: 18,
    centerSub: 'In Progress',
    items: [
      { name: 'In Progress', count: 18, percentage: 100, color: '#38bdf8', dash: '240 0', offset: 0 },
    ],
  },
  'Completed': {
    centerCount: 14,
    centerSub: 'Completed',
    items: [
      { name: 'Completed', count: 14, percentage: 100, color: '#10b981', dash: '240 0', offset: 0 },
    ],
  },
  'On Hold': {
    centerCount: 4,
    centerSub: 'On Hold',
    items: [
      { name: 'On Hold', count: 4, percentage: 100, color: '#f59e0b', dash: '240 0', offset: 0 },
    ],
  },
  'Delayed': {
    centerCount: 2,
    centerSub: 'Delayed',
    items: [
      { name: 'Delayed', count: 2, percentage: 100, color: '#ef4444', dash: '240 0', offset: 0 },
    ],
  },
};

const TASKS_MAP: Record<
  TaskFilter,
  { centerCount: number; centerSub: string; items: DonutSlice[] }
> = {
  'All Tasks': {
    centerCount: 412,
    centerSub: 'Total Tasks',
    items: [
      { name: 'In Progress', count: 186, percentage: 45.1, color: '#38bdf8', dash: '108 132', offset: 0 },
      { name: 'Completed', count: 128, percentage: 31.1, color: '#10b981', dash: '75 165', offset: -108 },
      { name: 'To Do', count: 86, percentage: 20.9, color: '#f59e0b', dash: '50 190', offset: -183 },
      { name: 'Under Review', count: 12, percentage: 2.9, color: '#8b5cf6', dash: '7 233', offset: -233 },
    ],
  },
  'In Progress': {
    centerCount: 186,
    centerSub: 'In Progress',
    items: [
      { name: 'In Progress', count: 186, percentage: 100, color: '#38bdf8', dash: '240 0', offset: 0 },
    ],
  },
  'Completed': {
    centerCount: 128,
    centerSub: 'Completed',
    items: [
      { name: 'Completed', count: 128, percentage: 100, color: '#10b981', dash: '240 0', offset: 0 },
    ],
  },
  'To Do': {
    centerCount: 86,
    centerSub: 'To Do',
    items: [
      { name: 'To Do', count: 86, percentage: 100, color: '#f59e0b', dash: '240 0', offset: 0 },
    ],
  },
  'Under Review': {
    centerCount: 12,
    centerSub: 'Under Review',
    items: [
      { name: 'Under Review', count: 12, percentage: 100, color: '#8b5cf6', dash: '240 0', offset: 0 },
    ],
  },
};

const TEAM_MAP: Record<
  PeriodFilter,
  { id: string; name: string; avatar: string; tasksDone: number; productivity: number }[]
> = {
  'This Month': [
    { id: '1', name: 'Sarah Jenkins', avatar: 'SJ', tasksDone: 34, productivity: 96 },
    { id: '2', name: 'Alex Rivera', avatar: 'AR', tasksDone: 29, productivity: 92 },
    { id: '3', name: 'Michael Chen', avatar: 'MC', tasksDone: 26, productivity: 88 },
    { id: '4', name: 'Emily Watson', avatar: 'EW', tasksDone: 22, productivity: 84 },
    { id: '5', name: 'David Kim', avatar: 'DK', tasksDone: 17, productivity: 78 },
  ],
  'Last Month': [
    { id: '1', name: 'Sarah Jenkins', avatar: 'SJ', tasksDone: 31, productivity: 94 },
    { id: '2', name: 'Alex Rivera', avatar: 'AR', tasksDone: 28, productivity: 90 },
    { id: '3', name: 'Michael Chen', avatar: 'MC', tasksDone: 24, productivity: 85 },
    { id: '4', name: 'Emily Watson', avatar: 'EW', tasksDone: 20, productivity: 82 },
    { id: '5', name: 'David Kim', avatar: 'DK', tasksDone: 15, productivity: 75 },
  ],
  'This Quarter': [
    { id: '1', name: 'Sarah Jenkins', avatar: 'SJ', tasksDone: 98, productivity: 95 },
    { id: '2', name: 'Alex Rivera', avatar: 'AR', tasksDone: 89, productivity: 91 },
    { id: '3', name: 'Michael Chen', avatar: 'MC', tasksDone: 79, productivity: 87 },
    { id: '4', name: 'Emily Watson', avatar: 'EW', tasksDone: 68, productivity: 83 },
    { id: '5', name: 'David Kim', avatar: 'DK', tasksDone: 54, productivity: 77 },
  ],
};

const CSAT_MAP: Record<
  PeriodFilter,
  {
    score: string;
    reviewsCount: number;
    nps: string;
    breakdown: { stars: string; percentage: number }[];
  }
> = {
  'This Month': {
    score: '9.3/10',
    reviewsCount: 148,
    nps: '+78 Excellent',
    breakdown: [
      { stars: '5 Stars', percentage: 74 },
      { stars: '4 Stars', percentage: 18 },
      { stars: '3 Stars', percentage: 5 },
      { stars: '2 Stars', percentage: 2 },
      { stars: '1 Star', percentage: 1 },
    ],
  },
  'Last Month': {
    score: '9.1/10',
    reviewsCount: 132,
    nps: '+74 Great',
    breakdown: [
      { stars: '5 Stars', percentage: 70 },
      { stars: '4 Stars', percentage: 20 },
      { stars: '3 Stars', percentage: 6 },
      { stars: '2 Stars', percentage: 3 },
      { stars: '1 Star', percentage: 1 },
    ],
  },
  'This Quarter': {
    score: '9.4/10',
    reviewsCount: 410,
    nps: '+81 Exceptional',
    breakdown: [
      { stars: '5 Stars', percentage: 76 },
      { stars: '4 Stars', percentage: 17 },
      { stars: '3 Stars', percentage: 4 },
      { stars: '2 Stars', percentage: 2 },
      { stars: '1 Star', percentage: 1 },
    ],
  },
};

export const MidLevelAnalytics: React.FC = () => {
  const { theme, setActiveNav } = useTheme();
  const { currentUser } = useAuth();
  const { currency } = useSystemCurrency();
  const isLight = theme === 'white-sky';

  // Card filter states
  const [projectFilter, setProjectFilter] = useState<ProjectFilter>('All Projects');
  const [taskFilter, setTaskFilter] = useState<TaskFilter>('All Tasks');
  const [teamPeriod, setTeamPeriod] = useState<PeriodFilter>('This Month');
  const [csatPeriod, setCsatPeriod] = useState<PeriodFilter>('This Month');

  // Open dropdown identifier
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const cardBg = isLight
    ? 'bg-white border-sky-100/90 shadow-xs'
    : 'bg-[#0f172a]/90 border-slate-800/80';

  const dropdownBg = isLight
    ? 'bg-white border-sky-100 text-slate-700 shadow-xl'
    : 'bg-slate-900 border-slate-700 text-slate-200 shadow-2xl';

  const readLive = () => {
    const parse = (key: string) => {
      try {
        const raw = localStorage.getItem(key);
        if (raw !== null) {
          const p = JSON.parse(raw);
          if (Array.isArray(p)) return p;
        }
      } catch {}
      return null;
    };
    return {
      projects: parse('ozostack_projects'),
      tasks: parse('ozostack_tasks_v2'),
      team: parse('ozostack_team_members_v1'),
    };
  };

  const [live, setLive] = useState(readLive);

  useEffect(() => {
    const sync = () => setLive(readLive());
    window.addEventListener('storage', sync);
    window.addEventListener('ozostack-crm-config-changed', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('ozostack-crm-config-changed', sync);
    };
  }, []);

  const activeProjects = useMemo(() => {
    if (live.projects === null) return PROJECTS_MAP[projectFilter];
    const total = live.projects.length;
    if (total === 0) {
      return {
        centerCount: 0,
        centerSub: 'Total Projects',
        items: [],
      };
    }
    const inProg = live.projects.filter((p: any) => p.status === 'In Progress').length;
    const completed = live.projects.filter((p: any) => p.status === 'Completed').length;
    const onHold = live.projects.filter((p: any) => p.status === 'On Hold').length;
    const delayed = live.projects.filter((p: any) => p.status === 'Delayed').length;

    const baseItems = [
      { name: 'In Progress', count: inProg, percentage: Math.round((inProg / total) * 100), color: '#38bdf8', dash: '114 126', offset: 0 },
      { name: 'Completed', count: completed, percentage: Math.round((completed / total) * 100), color: '#10b981', dash: '88 152', offset: -114 },
      { name: 'On Hold', count: onHold, percentage: Math.round((onHold / total) * 100), color: '#f59e0b', dash: '25 215', offset: -202 },
      { name: 'Delayed', count: delayed, percentage: Math.round((delayed / total) * 100), color: '#ef4444', dash: '13 227', offset: -227 },
    ];

    if (projectFilter === 'All Projects') {
      return { centerCount: total, centerSub: 'Total Projects', items: baseItems };
    }
    const filtered = baseItems.find((i) => i.name === projectFilter) || {
      name: projectFilter,
      count: 0,
      percentage: 0,
      color: '#38bdf8',
      dash: '0 240',
      offset: 0,
    };
    return {
      centerCount: filtered.count,
      centerSub: projectFilter,
      items: [{ ...filtered, percentage: 100, dash: '240 0', offset: 0 }],
    };
  }, [live.projects, projectFilter]);

  const activeTasks = useMemo(() => {
    if (live.tasks === null) return TASKS_MAP[taskFilter];
    const total = live.tasks.length;
    if (total === 0) {
      return {
        centerCount: 0,
        centerSub: 'Total Tasks',
        items: [],
      };
    }
    const inProg = live.tasks.filter((t: any) => t.status === 'In Progress').length;
    const completed = live.tasks.filter((t: any) => t.status === 'Completed').length;
    const toDo = live.tasks.filter((t: any) => t.status === 'To Do').length;
    const underReview = live.tasks.filter((t: any) => t.status === 'Under Review').length;

    const baseItems = [
      { name: 'In Progress', count: inProg, percentage: Math.round((inProg / total) * 100), color: '#38bdf8', dash: '108 132', offset: 0 },
      { name: 'Completed', count: completed, percentage: Math.round((completed / total) * 100), color: '#10b981', dash: '75 165', offset: -108 },
      { name: 'To Do', count: toDo, percentage: Math.round((toDo / total) * 100), color: '#f59e0b', dash: '50 190', offset: -183 },
      { name: 'Under Review', count: underReview, percentage: Math.round((underReview / total) * 100), color: '#8b5cf6', dash: '7 233', offset: -233 },
    ];

    if (taskFilter === 'All Tasks') {
      return { centerCount: total, centerSub: 'Total Tasks', items: baseItems };
    }
    const filtered = baseItems.find((i) => i.name === taskFilter) || {
      name: taskFilter,
      count: 0,
      percentage: 0,
      color: '#38bdf8',
      dash: '0 240',
      offset: 0,
    };
    return {
      centerCount: filtered.count,
      centerSub: taskFilter,
      items: [{ ...filtered, percentage: 100, dash: '240 0', offset: 0 }],
    };
  }, [live.tasks, taskFilter]);

  const activeTeam = useMemo(() => {
    if (live.team === null) return TEAM_MAP[teamPeriod];
    if (live.team.length === 0) return [];
    return live.team.slice(0, 5).map((e: any, idx: number) => ({
      id: e.id || String(idx),
      name: e.name || 'Team Member',
      avatar: (e.name || 'TM').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase(),
      tasksDone: 20 + (idx * 4),
      productivity: Math.max(75, 96 - (idx * 4)),
    }));
  }, [live.team, teamPeriod]);

  const activeCsat = CSAT_MAP[csatPeriod];

  // Notifications state via unified service (scoped to authenticated user)
  const {
    notifications,
    markAsRead,
    markAllAsRead: markAllRead,
    dismissNotification: dismissNotificationItem,
  } = useNotifications(currentUser);

  const dismissNotification = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    dismissNotificationItem(id);
  };

  const handleNotifClick = (notif: NotificationItem) => {
    // 1. Mark as read
    markAsRead(notif.id);

    // 2. Navigate to module
    if (notif.targetNav) {
      setActiveNav(notif.targetNav);
      return;
    }

    const titleLower = notif.title.toLowerCase();
    const subLower = notif.subtitle.toLowerCase();

    if (
      notif.type === 'event' ||
      notif.type === 'followup' ||
      titleLower.includes('meeting') ||
      titleLower.includes('event') ||
      titleLower.includes('follow') ||
      titleLower.includes('call')
    ) {
      setActiveNav('Events & Calendar');
    } else if (
      notif.type === 'task' ||
      notif.type === 'deadline' ||
      titleLower.includes('task') ||
      titleLower.includes('deadline')
    ) {
      setActiveNav('Tasks');
    } else if (
      notif.type === 'payment' ||
      notif.type === 'invoice' ||
      titleLower.includes('payment') ||
      titleLower.includes('invoice') ||
      subLower.includes('invoice')
    ) {
      setActiveNav('Revenue');
    } else if (notif.type === 'lead' || titleLower.includes('lead') || subLower.includes('lead')) {
      setActiveNav('Leads');
    } else if (titleLower.includes('deal') || subLower.includes('deal')) {
      setActiveNav('Deals');
    } else {
      setActiveNav('Dashboard');
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'lead':
        return {
          icon: Briefcase,
          bg: 'bg-sky-500/15 text-sky-500',
        };
      case 'payment':
        return {
          icon: DollarSign,
          bg: 'bg-emerald-500/15 text-emerald-500',
        };
      case 'deadline':
        return {
          icon: Clock,
          bg: 'bg-amber-500/15 text-amber-500',
        };
      case 'followup':
        return {
          icon: AlertCircle,
          bg: 'bg-rose-500/15 text-rose-500',
        };
      case 'review':
        return {
          icon: Star,
          bg: 'bg-teal-500/15 text-teal-500',
        };
      case 'invoice':
        return {
          icon: FileText,
          bg: 'bg-orange-500/15 text-orange-500',
        };
      default:
        return {
          icon: AlertCircle,
          bg: 'bg-sky-500/15 text-sky-500',
        };
    }
  };

  return (
    <div ref={containerRef} className="grid grid-cols-12 gap-3 items-stretch">
      {/* 1. PROJECTS OVERVIEW (Donut Chart) */}
      <div className={`col-span-12 sm:col-span-6 lg:col-span-4 xl:col-span-2 p-3.5 rounded-xl border flex flex-col justify-between ${cardBg}`}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-bold tracking-wider uppercase text-slate-700 dark:text-slate-200">
            Projects Overview
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveNav('Projects')}
              className="text-[9px] font-semibold text-sky-500 hover:underline mr-0.5"
              title="Open Projects"
            >
              Projects →
            </button>
            <div className="relative">
              <button
                onClick={() =>
                  setOpenDropdown(openDropdown === 'projects' ? null : 'projects')
                }
                className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                  isLight
                    ? 'border-sky-200 text-slate-600 bg-sky-50/50 hover:bg-sky-100/70'
                    : 'border-slate-700 text-slate-300 bg-slate-800/60 hover:bg-slate-750'
                }`}
              >
                <span className="font-semibold">{projectFilter}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {openDropdown === 'projects' && (
                <div
                  className={`absolute right-0 mt-1 w-32 rounded-lg border py-1 z-30 ${dropdownBg}`}
                >
                  {(
                    [
                      'All Projects',
                      'In Progress',
                      'Completed',
                      'On Hold',
                      'Delayed',
                    ] as ProjectFilter[]
                  ).map((p) => (
                    <button
                      key={p}
                      onClick={() => {
                        setProjectFilter(p);
                        setOpenDropdown(null);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-[11px] transition-colors flex items-center justify-between ${
                        projectFilter === p
                          ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold'
                          : 'hover:bg-sky-500/5 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <span>{p}</span>
                      {projectFilter === p && <span className="text-sky-500 font-bold">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Donut Graphic */}
        <div
          onClick={() => setActiveNav('Projects')}
          className="flex items-center justify-center relative my-2 cursor-pointer group"
          title="Click to view all Projects"
        >
          <svg className="w-24 h-24 -rotate-90 group-hover:scale-105 transition-transform" viewBox="0 0 100 100">
            {activeProjects.items.map((item) => (
              <circle
                key={item.name}
                cx="50"
                cy="50"
                r="38"
                fill="transparent"
                stroke={item.color}
                strokeWidth="15"
                strokeDasharray={item.dash}
                strokeDashoffset={item.offset}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-base font-extrabold tabular-nums text-slate-800 dark:text-white">
              {activeProjects.centerCount}
            </span>
            <span className="text-[7px] text-slate-400 group-hover:text-sky-500 font-semibold">{activeProjects.centerSub}</span>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-1 text-[9px]">
          {activeProjects.items.length === 0 ? (
            <div className="py-4 text-center text-slate-400">
              <span className="text-[10px] font-medium block">No active projects</span>
            </div>
          ) : (
            activeProjects.items.map((item) => (
              <div
                key={item.name}
                onClick={() => setActiveNav('Projects')}
                className="flex items-center justify-between cursor-pointer hover:bg-sky-500/10 p-0.5 rounded transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-slate-500 dark:text-slate-300">{item.name}</span>
                </div>
                <span className="font-semibold tabular-nums text-slate-700 dark:text-slate-200">
                  {item.count} ({item.percentage}%)
                </span>
              </div>
            ))
          )}
        </div>

        <div className="text-center pt-1.5 border-t border-sky-100/20 mt-1">
          <button
            onClick={() => setActiveNav('Projects')}
            className="text-[9px] font-semibold text-sky-500 hover:underline"
          >
            Manage All Projects →
          </button>
        </div>
      </div>

      {/* 2. TASK OVERVIEW (Donut Chart) */}
      <div className={`col-span-12 sm:col-span-6 lg:col-span-4 xl:col-span-2 p-3.5 rounded-xl border flex flex-col justify-between ${cardBg}`}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-bold tracking-wider uppercase text-slate-700 dark:text-slate-200">
            Task Overview
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveNav('Tasks')}
              className="text-[9px] font-semibold text-sky-500 hover:underline mr-0.5"
              title="Open Tasks"
            >
              Tasks →
            </button>
            <div className="relative">
              <button
                onClick={() =>
                  setOpenDropdown(openDropdown === 'tasks' ? null : 'tasks')
                }
                className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                  isLight
                    ? 'border-sky-200 text-slate-600 bg-sky-50/50 hover:bg-sky-100/70'
                    : 'border-slate-700 text-slate-300 bg-slate-800/60 hover:bg-slate-750'
                }`}
              >
                <span className="font-semibold">{taskFilter}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {openDropdown === 'tasks' && (
                <div
                  className={`absolute right-0 mt-1 w-32 rounded-lg border py-1 z-30 ${dropdownBg}`}
                >
                  {(
                    [
                      'All Tasks',
                      'In Progress',
                      'Completed',
                      'To Do',
                      'Under Review',
                    ] as TaskFilter[]
                  ).map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        setTaskFilter(t);
                        setOpenDropdown(null);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-[11px] transition-colors flex items-center justify-between ${
                        taskFilter === t
                          ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold'
                          : 'hover:bg-sky-500/5 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <span>{t}</span>
                      {taskFilter === t && <span className="text-sky-500 font-bold">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Donut Graphic */}
        <div
          onClick={() => setActiveNav('Tasks')}
          className="flex items-center justify-center relative my-2 cursor-pointer group"
          title="Click to view all Tasks"
        >
          <svg className="w-24 h-24 -rotate-90 group-hover:scale-105 transition-transform" viewBox="0 0 100 100">
            {activeTasks.items.map((item) => (
              <circle
                key={item.name}
                cx="50"
                cy="50"
                r="38"
                fill="transparent"
                stroke={item.color}
                strokeWidth="15"
                strokeDasharray={item.dash}
                strokeDashoffset={item.offset}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-base font-extrabold tabular-nums text-slate-800 dark:text-white">
              {activeTasks.centerCount}
            </span>
            <span className="text-[7px] text-slate-400 group-hover:text-sky-500 font-semibold">{activeTasks.centerSub}</span>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-1 text-[9px]">
          {activeTasks.items.length === 0 ? (
            <div className="py-4 text-center text-slate-400">
              <span className="text-[10px] font-medium block">No active tasks</span>
            </div>
          ) : (
            activeTasks.items.map((item) => (
              <div
                key={item.name}
                onClick={() => setActiveNav('Tasks')}
                className="flex items-center justify-between cursor-pointer hover:bg-sky-500/10 p-0.5 rounded transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-slate-500 dark:text-slate-300">{item.name}</span>
                </div>
                <span className="font-semibold tabular-nums text-slate-700 dark:text-slate-200">
                  {item.count} ({item.percentage}%)
                </span>
              </div>
            ))
          )}
        </div>

        <div className="text-center pt-1.5 border-t border-sky-100/20 mt-1">
          <button
            onClick={() => setActiveNav('Tasks')}
            className="text-[9px] font-semibold text-sky-500 hover:underline"
          >
            Manage All Tasks →
          </button>
        </div>
      </div>

      {/* 3. TEAM PERFORMANCE */}
      <div className={`col-span-12 sm:col-span-12 lg:col-span-4 xl:col-span-3 p-3.5 rounded-xl border flex flex-col justify-between ${cardBg}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold tracking-wider uppercase text-slate-700 dark:text-slate-200">
            Team Performance
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveNav('Team & HR')}
              className="text-[9px] font-semibold text-sky-500 hover:underline mr-0.5"
              title="Open Team & HR"
            >
              Team →
            </button>
            <div className="relative">
              <button
                onClick={() =>
                  setOpenDropdown(openDropdown === 'team' ? null : 'team')
                }
                className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                  isLight
                    ? 'border-sky-200 text-slate-600 bg-sky-50/50 hover:bg-sky-100/70'
                    : 'border-slate-700 text-slate-300 bg-slate-800/60 hover:bg-slate-750'
                }`}
              >
                <span className="font-semibold">{teamPeriod}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {openDropdown === 'team' && (
                <div
                  className={`absolute right-0 mt-1 w-32 rounded-lg border py-1 z-30 ${dropdownBg}`}
                >
                  {(['This Month', 'Last Month', 'This Quarter'] as PeriodFilter[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => {
                        setTeamPeriod(p);
                        setOpenDropdown(null);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-[11px] transition-colors flex items-center justify-between ${
                        teamPeriod === p
                          ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold'
                          : 'hover:bg-sky-500/5 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <span>{p}</span>
                      {teamPeriod === p && <span className="text-sky-500 font-bold">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Header line */}
        <div className="grid grid-cols-12 text-[9px] font-bold text-slate-400 pb-1 border-b border-sky-100/30 uppercase">
          <div className="col-span-5">Employee</div>
          <div className="col-span-3 text-center">Tasks Done</div>
          <div className="col-span-4 text-right">Productivity</div>
        </div>

        {/* Rows */}
        <div className="space-y-2 my-2">
          {activeTeam.length === 0 ? (
            <div className="py-8 text-center text-slate-400">
              <Users className="w-4 h-4 opacity-40 text-sky-500 mx-auto mb-1.5" />
              <span className="text-[10px] font-medium block">No team members active</span>
            </div>
          ) : (
            activeTeam.map((member) => (
              <div
                key={member.id}
                onClick={() => setActiveNav('Team & HR')}
                className="grid grid-cols-12 items-center text-[10px] cursor-pointer hover:bg-sky-500/10 p-1 rounded transition-colors group"
                title={`View ${member.name} in Team & HR`}
              >
                <div className="col-span-5 flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-full bg-sky-500 text-white font-bold text-[9px] flex items-center justify-center shrink-0">
                    {member.avatar}
                  </div>
                  <span className="font-medium truncate text-slate-700 dark:text-slate-200 group-hover:text-sky-500">
                    {member.name}
                  </span>
                </div>

                <div className="col-span-3 text-center text-slate-500 tabular-nums text-[9px]">
                  {member.tasksDone}
                </div>

                <div className="col-span-4 flex items-center gap-1.5 justify-end">
                  <div className="w-12 bg-sky-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-sky-500 h-1.5 rounded-full"
                      style={{ width: `${member.productivity}%` }}
                    />
                  </div>
                  <span className="font-bold tabular-nums text-[10px] text-sky-600 dark:text-sky-400">
                    {member.productivity}%
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="text-center pt-1.5 border-t border-sky-100/20">
          <button
            onClick={() => setActiveNav('Team & HR')}
            className="text-[10px] font-semibold text-sky-500 hover:underline"
          >
            View Team & Timesheets →
          </button>
        </div>
      </div>

      {/* 4. CLIENT SATISFACTION */}
      <div className={`col-span-12 sm:col-span-6 lg:col-span-6 xl:col-span-2 p-3.5 rounded-xl border flex flex-col justify-between ${cardBg}`}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-bold tracking-wider uppercase text-slate-700 dark:text-slate-200">
            Client Satisfaction
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveNav('Clients')}
              className="text-[9px] font-semibold text-sky-500 hover:underline mr-0.5"
              title="Open Clients"
            >
              Clients →
            </button>
            <div className="relative">
            <button
              onClick={() =>
                setOpenDropdown(openDropdown === 'csat' ? null : 'csat')
              }
              className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                isLight
                  ? 'border-sky-200 text-slate-600 bg-sky-50/50 hover:bg-sky-100/70'
                  : 'border-slate-700 text-slate-300 bg-slate-800/60 hover:bg-slate-750'
              }`}
            >
              <span className="font-semibold">{csatPeriod}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {openDropdown === 'csat' && (
              <div
                className={`absolute right-0 mt-1 w-32 rounded-lg border py-1 z-30 ${dropdownBg}`}
              >
                {(['This Month', 'Last Month', 'This Quarter'] as PeriodFilter[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      setCsatPeriod(p);
                      setOpenDropdown(null);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-[11px] transition-colors flex items-center justify-between ${
                      csatPeriod === p
                        ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold'
                        : 'hover:bg-sky-500/5 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <span>{p}</span>
                    {csatPeriod === p && <span className="text-sky-500 font-bold">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

        <div className="flex items-center gap-3 my-1">
          <div>
            <div className="text-2xl font-black tracking-tight tabular-nums text-slate-800 dark:text-white">
              {activeCsat.score}
            </div>
            <div className="flex items-center gap-0.5 text-amber-400 my-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <div className="text-[8px] text-slate-400">
              (Based on {activeCsat.reviewsCount} Reviews)
            </div>
          </div>

          {/* Distribution bars */}
          <div className="flex-1 space-y-1 text-[8px]">
            {activeCsat.breakdown.map((b) => (
              <div key={b.stars} className="flex items-center gap-1.5">
                <span className="text-slate-400 w-9 truncate">{b.stars}</span>
                <div className="flex-1 bg-sky-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-400 h-1 rounded-full transition-all duration-300"
                    style={{ width: `${b.percentage}%` }}
                  />
                </div>
                <span className="tabular-nums font-medium text-slate-500 w-7 text-right">
                  {b.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-[9px] text-slate-400 text-center pt-1 border-t border-sky-100/20">
          NPS Score: <span className="text-emerald-500 font-bold">{activeCsat.nps}</span>
        </div>
      </div>

      {/* 5. NOTIFICATIONS (Activity feed) */}
      <div className={`col-span-12 sm:col-span-6 lg:col-span-6 xl:col-span-3 p-3.5 rounded-xl border flex flex-col justify-between ${cardBg}`}>
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-700 dark:text-slate-200">
              Notifications
            </span>
            {notifications.filter((n) => !n.read).length > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </div>
          {notifications.some((n) => !n.read) && (
            <button
              onClick={markAllRead}
              className="text-[10px] text-sky-500 hover:underline font-semibold"
            >
              Mark all read
            </button>
          )}
        </div>

        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {notifications.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">
              <Check className="w-5 h-5 mx-auto mb-1 text-emerald-500 opacity-60" />
              All caught up!
            </div>
          ) : (
            notifications.map((notif) => {
              const { icon: Icon, bg } = getNotifIcon(notif.type);
              return (
                <div
                  key={notif.id}
                  onClick={() => handleNotifClick(notif)}
                  className={`flex items-start gap-2.5 text-[10px] group hover:bg-sky-500/10 p-1.5 rounded-lg cursor-pointer transition-colors relative ${
                    !notif.read ? (isLight ? 'bg-sky-50/60' : 'bg-slate-800/40') : ''
                  }`}
                  title="Click to view module"
                >
                  <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${bg}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center justify-between">
                      <span
                        className={`truncate ${
                          notif.read
                            ? 'font-medium text-slate-600 dark:text-slate-400'
                            : 'font-bold text-slate-800 dark:text-slate-100'
                        }`}
                      >
                        {notif.title}
                      </span>
                      <span className="text-[8px] text-slate-400 shrink-0 ml-1 tabular-nums">
                        {notif.timeAgo}
                      </span>
                    </div>
                    <div className="text-[9px] text-slate-400 truncate">
                      {formatMoney(notif.subtitle, currency)}
                    </div>
                  </div>

                  <button
                    onClick={(e) => dismissNotification(e, notif.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 rounded transition-opacity absolute right-1 top-1"
                    title="Dismiss"
                    aria-label="Dismiss notification"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
