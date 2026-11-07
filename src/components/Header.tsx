import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Crown,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Bell,
  Menu,
  Sun,
  Moon,
  Check,
  X,
  ExternalLink,
  UserPlus,
  Briefcase,
  FolderKanban,
  CheckSquare,
  CalendarDays,
  Clock,
  FileText,
  UserCheck,
  DollarSign,
  User,
  ListTodo,
  StickyNote,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../data/notificationService';
import { useSystemCurrency, formatMoney } from '../data/currencyService';
import { NotificationItem, CalendarEvent } from '../types/crm';
import { CALENDAR_EVENTS } from '../data/mockData';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const parseHeaderDate = (str: string): Date => {
  if (!str) return new Date();
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    return new Date(parseInt(isoMatch[1], 10), parseInt(isoMatch[2], 10) - 1, parseInt(isoMatch[3], 10));
  }
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) return parsed;
  return new Date();
};

const formatToDisplayDate = (d: Date): string => {
  const m = MONTH_NAMES_SHORT[d.getMonth()];
  const day = String(d.getDate()).padStart(2, '0');
  const y = d.getFullYear();
  return `${m} ${day}, ${y}`;
};

const formatToIso = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const loadHeaderEvents = (): CalendarEvent[] => {
  try {
    const raw = localStorage.getItem('ozostack_calendar_events_v3');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    /* ignore */
  }
  return CALENDAR_EVENTS;
};

interface HeaderProps {
  onAddWidget?: () => void;
  onSearchOpen: () => void;
  selectedPeriod: string;
  setSelectedPeriod: (period: string) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  onQuickCreate?: (type: 'lead' | 'deal' | 'project' | 'task' | 'event' | 'time' | 'document' | 'todo' | 'note') => void;
}

export const Header: React.FC<HeaderProps> = ({
  onSearchOpen,
  selectedPeriod,
  setSelectedPeriod,
  selectedDate,
  setSelectedDate,
  onQuickCreate,
}) => {
  const { theme, toggleTheme, toggleSidebar, setActiveNav } = useTheme();
  const { currentUser, currentRole, logout } = useAuth();
  const { currency } = useSystemCurrency();
  const isLight = theme === 'white-sky';

  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [isPeriodMenuOpen, setIsPeriodMenuOpen] = useState(false);
  const [isDateMenuOpen, setIsDateMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    clearAll: clearAllNotifications,
  } = useNotifications(currentUser);
  const [notifFilter, setNotifFilter] = useState<'all' | 'unread' | 'event' | 'task'>('all');

  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
        setIsPeriodMenuOpen(false);
        setIsDateMenuOpen(false);
        setIsQuickCreateOpen(false);
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const periods = ['Today', 'This Week', 'This Month', 'This Quarter', 'This Year'];

  // Calendar State & Handlers for Interactive Header Calendar
  const [viewDate, setViewDate] = useState<Date>(() => parseHeaderDate(selectedDate));
  const [calEvents, setCalEvents] = useState<CalendarEvent[]>(loadHeaderEvents);

  useEffect(() => {
    const sync = () => setCalEvents(loadHeaderEvents());
    window.addEventListener('ozostack-crm-config-changed', sync);
    return () => window.removeEventListener('ozostack-crm-config-changed', sync);
  }, []);

  useEffect(() => {
    if (isDateMenuOpen) {
      setViewDate(parseHeaderDate(selectedDate));
      setCalEvents(loadHeaderEvents());
    }
  }, [isDateMenuOpen, selectedDate]);

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

  const todayIso = useMemo(() => formatToIso(new Date()), []);
  const selectedDateObj = useMemo(() => parseHeaderDate(selectedDate), [selectedDate]);
  const selectedIso = useMemo(() => formatToIso(selectedDateObj), [selectedDateObj]);

  const calendarCells = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const cells: Array<{
      dayNumber: number;
      date: Date;
      iso: string;
      isCurrentMonth: boolean;
      isToday: boolean;
      hasEvents: boolean;
      eventCount: number;
    }> = [];

    // Trailing days from previous month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const date = new Date(year, month - 1, d);
      const iso = formatToIso(date);
      const count = calEvents.filter((e) => e.date === iso).length;
      cells.push({
        dayNumber: d,
        date,
        iso,
        isCurrentMonth: false,
        isToday: iso === todayIso,
        hasEvents: count > 0,
        eventCount: count,
      });
    }

    // Days in current month
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const iso = formatToIso(date);
      const count = calEvents.filter((e) => e.date === iso).length;
      cells.push({
        dayNumber: d,
        date,
        iso,
        isCurrentMonth: true,
        isToday: iso === todayIso,
        hasEvents: count > 0,
        eventCount: count,
      });
    }

    // Leading days for next month to complete rows
    const totalCells = Math.ceil(cells.length / 7) * 7;
    const remaining = totalCells - cells.length;
    for (let d = 1; d <= remaining; d++) {
      const date = new Date(year, month + 1, d);
      const iso = formatToIso(date);
      const count = calEvents.filter((e) => e.date === iso).length;
      cells.push({
        dayNumber: d,
        date,
        iso,
        isCurrentMonth: false,
        isToday: iso === todayIso,
        hasEvents: count > 0,
        eventCount: count,
      });
    }

    return cells;
  }, [viewDate, calEvents, todayIso]);

  const selectedDayEvents = useMemo(() => {
    return calEvents.filter((e) => e.date === selectedIso);
  }, [calEvents, selectedIso]);

  const handleSelectCalendarDate = (date: Date) => {
    const formatted = formatToDisplayDate(date);
    const iso = formatToIso(date);
    setSelectedDate(formatted);
    try {
      localStorage.setItem('ozostack_selected_date', iso);
      localStorage.setItem('ozostack_selected_date_label', formatted);
      window.dispatchEvent(
        new CustomEvent('ozostack-date-changed', {
          detail: { date: iso, formatted },
        })
      );
    } catch {
      /* ignore */
    }
    if (date.getMonth() !== viewDate.getMonth() || date.getFullYear() !== viewDate.getFullYear()) {
      setViewDate(new Date(date.getFullYear(), date.getMonth(), 1));
    }
  };

  const handleJumpToToday = () => {
    const today = new Date();
    setViewDate(today);
    handleSelectCalendarDate(today);
  };

  const filteredNotifications = notifications.filter((n) => {
    if (notifFilter === 'unread') return !n.read;
    if (notifFilter === 'event') return n.type === 'event' || n.type === 'followup';
    if (notifFilter === 'task') return n.type === 'task' || n.type === 'deadline';
    return true;
  });

  const handleNotificationClick = (item: NotificationItem) => {
    markAsRead(item.id);
    setIsNotifOpen(false);

    if (item.targetNav) {
      setActiveNav(item.targetNav);
      return;
    }

    const titleLower = item.title.toLowerCase();
    const subLower = item.subtitle.toLowerCase();

    if (
      item.type === 'event' ||
      item.type === 'followup' ||
      titleLower.includes('meeting') ||
      titleLower.includes('event') ||
      titleLower.includes('follow') ||
      titleLower.includes('call')
    ) {
      setActiveNav('Events & Calendar');
    } else if (
      item.type === 'task' ||
      item.type === 'deadline' ||
      titleLower.includes('task') ||
      titleLower.includes('deadline')
    ) {
      setActiveNav('Tasks');
    } else if (
      item.type === 'payment' ||
      item.type === 'invoice' ||
      titleLower.includes('payment') ||
      titleLower.includes('invoice') ||
      subLower.includes('invoice')
    ) {
      setActiveNav('Revenue');
    } else if (item.type === 'lead' || titleLower.includes('lead') || subLower.includes('lead')) {
      setActiveNav('Leads');
    } else if (titleLower.includes('deal') || subLower.includes('deal')) {
      setActiveNav('Deals');
    } else {
      setActiveNav('Dashboard');
    }
  };

  return (
    <header
      ref={headerRef}
      className={`sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3 border-b transition-colors ${
        isLight
          ? 'bg-white/90 backdrop-blur-md border-sky-100 text-slate-800'
          : 'bg-[#0a0f1d]/90 backdrop-blur-md border-slate-800/80 text-white'
      }`}
    >
      {/* Left: Mobile hamburger + Title lockup */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className={`lg:hidden p-2 rounded-lg transition-colors ${
            isLight
              ? 'text-slate-600 hover:bg-sky-50 hover:text-sky-600'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
          aria-label="Toggle navigation drawer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-500 shrink-0">
            <Crown className="w-4 h-4 fill-amber-500" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-extrabold tracking-tight leading-tight flex items-center gap-2">
              CEO COMMAND CENTER
            </h1>
            <p
              className={`text-[11px] sm:text-xs font-medium leading-none mt-0.5 ${
                isLight ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              Real-time overview of your entire business
            </p>
          </div>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Date Selector */}
        <div className="relative hidden sm:block">
          <button
            onClick={() => {
              setIsDateMenuOpen(!isDateMenuOpen);
              setIsPeriodMenuOpen(false);
              setIsNotifOpen(false);
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              isLight
                ? 'bg-slate-50 border-sky-200/80 text-slate-700 hover:bg-sky-50'
                : 'bg-slate-900/80 border-slate-700 text-slate-200 hover:bg-slate-800'
            }`}
            title="Interactive Calendar"
          >
            <Calendar className="w-3.5 h-3.5 text-sky-500" />
            <span>{selectedDate}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isDateMenuOpen && (
            <div
              className={`absolute right-0 mt-1.5 w-76 sm:w-80 rounded-2xl border shadow-2xl p-3.5 z-50 animate-fade-in ${
                isLight
                  ? 'bg-white border-sky-100 text-slate-800'
                  : 'bg-[#0f172a] border-slate-700/80 text-white'
              }`}
            >
              {/* Calendar Month Navigation Header */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-800 dark:text-white">
                    {MONTH_NAMES[currentMonth]}
                  </span>
                  <span className="text-xs font-bold text-sky-500">{currentYear}</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={handleJumpToToday}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded border transition-colors ${
                      isLight
                        ? 'border-sky-200 bg-sky-50 text-sky-600 hover:bg-sky-100'
                        : 'border-sky-500/30 bg-sky-500/10 text-sky-400 hover:bg-sky-500/20'
                    }`}
                    title="Jump to Today"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => setViewDate(new Date(currentYear, currentMonth - 1, 1))}
                    className={`p-1 rounded-md transition-colors ${
                      isLight ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-slate-800 text-slate-300'
                    }`}
                    title="Previous Month"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setViewDate(new Date(currentYear, currentMonth + 1, 1))}
                    className={`p-1 rounded-md transition-colors ${
                      isLight ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-slate-800 text-slate-300'
                    }`}
                    title="Next Month"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Day of Week Labels */}
              <div className="grid grid-cols-7 text-center mb-1">
                {WEEKDAYS.map((day) => (
                  <span
                    key={day}
                    className="text-[10px] font-bold uppercase tracking-wider text-slate-400 py-1"
                  >
                    {day}
                  </span>
                ))}
              </div>

              {/* Calendar Grid Cells */}
              <div className="grid grid-cols-7 gap-1">
                {calendarCells.map((cell) => {
                  const isSelected = cell.iso === selectedIso;
                  return (
                    <button
                      key={cell.iso}
                      onClick={() => handleSelectCalendarDate(cell.date)}
                      className={`relative h-7 sm:h-8 rounded-lg flex flex-col items-center justify-center text-xs transition-all ${
                        isSelected
                          ? 'bg-sky-500 text-white font-extrabold shadow-sm'
                          : cell.isCurrentMonth
                          ? isLight
                            ? cell.isToday
                              ? 'border border-sky-400 text-sky-600 font-bold bg-sky-50/60 hover:bg-sky-100'
                              : 'text-slate-700 hover:bg-sky-50 hover:text-sky-600'
                            : cell.isToday
                            ? 'border border-sky-400 text-sky-400 font-bold bg-sky-950/40 hover:bg-sky-900/50'
                            : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                          : isLight
                          ? 'text-slate-300 hover:text-slate-500'
                          : 'text-slate-600 hover:text-slate-400'
                      }`}
                      title={`${cell.iso}${cell.hasEvents ? ` (${cell.eventCount} events)` : ''}`}
                    >
                      <span className="leading-none text-[11px]">{cell.dayNumber}</span>
                      {cell.hasEvents && (
                        <span
                          className={`absolute bottom-0.5 w-1 h-1 rounded-full ${
                            isSelected ? 'bg-white' : 'bg-sky-500'
                          }`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Selected Date Summary & Events Preview */}
              <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    {selectedDateObj.toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400">
                    {selectedDayEvents.length} {selectedDayEvents.length === 1 ? 'Event' : 'Events'}
                  </span>
                </div>

                {selectedDayEvents.length > 0 ? (
                  <div className="space-y-1 max-h-24 overflow-y-auto pr-0.5">
                    {selectedDayEvents.map((evt) => (
                      <div
                        key={evt.id}
                        onClick={() => {
                          setActiveNav('Events & Calendar');
                          setIsDateMenuOpen(false);
                        }}
                        className={`p-1.5 rounded-lg border text-left cursor-pointer transition-colors ${
                          isLight
                            ? 'bg-slate-50 border-sky-100 hover:bg-sky-50/70 text-slate-800'
                            : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800 text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-semibold text-[11px] truncate">{evt.title}</span>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-sky-500/15 text-sky-600 dark:text-sky-400 shrink-0">
                            {evt.type}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                          {evt.time || evt.startTime} · {evt.company}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic py-0.5">
                    No events scheduled for this day
                  </p>
                )}
              </div>

              {/* Action Footer */}
              <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    setActiveNav('Events & Calendar');
                    setIsDateMenuOpen(false);
                  }}
                  className="flex items-center gap-1.5 text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline"
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span>Open Full Calendar</span>
                </button>
                <button
                  onClick={() => {
                    setIsDateMenuOpen(false);
                    onQuickCreate?.('event');
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-xs transition-all active:scale-95"
                >
                  <Plus className="w-3 h-3" />
                  <span>New Event</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Period Selector */}
        <div className="relative">
          <button
            onClick={() => {
              setIsPeriodMenuOpen(!isPeriodMenuOpen);
              setIsDateMenuOpen(false);
              setIsNotifOpen(false);
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              isLight
                ? 'bg-slate-50 border-sky-200/80 text-slate-700 hover:bg-sky-50'
                : 'bg-slate-900/80 border-slate-700 text-slate-200 hover:bg-slate-800'
            }`}
          >
            <span>{selectedPeriod}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isPeriodMenuOpen && (
            <div
              className={`absolute right-0 mt-1 w-36 rounded-xl border shadow-xl py-1 z-50 ${
                isLight
                  ? 'bg-white border-sky-100 text-slate-700'
                  : 'bg-slate-900 border-slate-700 text-slate-200'
              }`}
            >
              {periods.map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setSelectedPeriod(p);
                    setIsPeriodMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-sky-500/10 hover:text-sky-500 transition-colors ${
                    selectedPeriod === p ? 'text-sky-500 font-semibold' : ''
                  }`}
                >
                  <span>{p}</span>
                  {selectedPeriod === p && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Create Dropdown Menu */}
        <div className="relative">
          <button
            onClick={() => {
              setIsQuickCreateOpen(!isQuickCreateOpen);
              setIsPeriodMenuOpen(false);
              setIsDateMenuOpen(false);
              setIsNotifOpen(false);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-sky-500 hover:bg-sky-600 shadow-sm active:scale-95 transition-all"
            title="Instant Quick Create"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Quick Create</span>
            <ChevronDown className="w-3 h-3 opacity-80" />
          </button>

          {isQuickCreateOpen && (
            <div
              className={`absolute right-0 mt-1.5 w-56 rounded-2xl border shadow-2xl py-1.5 z-50 animate-fade-in ${
                isLight
                  ? 'bg-white border-sky-100 text-slate-700'
                  : 'bg-slate-900 border-slate-750 text-slate-200'
              }`}
            >
              <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-sky-100/30">
                Quick Actions
              </div>
              <div className="py-1 space-y-0.5">
                <button
                  onClick={() => {
                    setIsQuickCreateOpen(false);
                    onQuickCreate?.('lead');
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs flex items-center gap-2.5 hover:bg-sky-500/10 hover:text-sky-500 transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5 text-sky-500" />
                  <span className="font-medium">New Lead</span>
                </button>

                <button
                  onClick={() => {
                    setIsQuickCreateOpen(false);
                    onQuickCreate?.('deal');
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs flex items-center gap-2.5 hover:bg-sky-500/10 hover:text-sky-500 transition-colors"
                >
                  <Briefcase className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="font-medium">New Deal</span>
                </button>

                <button
                  onClick={() => {
                    setIsQuickCreateOpen(false);
                    onQuickCreate?.('project');
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs flex items-center gap-2.5 hover:bg-sky-500/10 hover:text-sky-500 transition-colors"
                >
                  <FolderKanban className="w-3.5 h-3.5 text-amber-500" />
                  <span className="font-medium">New Project</span>
                </button>

                <button
                  onClick={() => {
                    setIsQuickCreateOpen(false);
                    onQuickCreate?.('task');
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs flex items-center gap-2.5 hover:bg-sky-500/10 hover:text-sky-500 transition-colors"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-sky-400" />
                  <span className="font-medium">New Task</span>
                </button>

                <button
                  onClick={() => {
                    setIsQuickCreateOpen(false);
                    onQuickCreate?.('event');
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs flex items-center gap-2.5 hover:bg-sky-500/10 hover:text-sky-500 transition-colors"
                >
                  <CalendarDays className="w-3.5 h-3.5 text-purple-400" />
                  <span className="font-medium">Schedule Event</span>
                </button>

                <button
                  onClick={() => {
                    setIsQuickCreateOpen(false);
                    onQuickCreate?.('time');
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs flex items-center gap-2.5 hover:bg-sky-500/10 hover:text-sky-500 transition-colors"
                >
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="font-medium">Log Time</span>
                </button>

                <button
                  onClick={() => {
                    setIsQuickCreateOpen(false);
                    onQuickCreate?.('todo');
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs flex items-center gap-2.5 hover:bg-sky-500/10 hover:text-sky-500 transition-colors"
                >
                  <ListTodo className="w-3.5 h-3.5 text-sky-500" />
                  <span className="font-medium">Personal To-Do</span>
                </button>

                <button
                  onClick={() => {
                    setIsQuickCreateOpen(false);
                    onQuickCreate?.('note');
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs flex items-center gap-2.5 hover:bg-sky-500/10 hover:text-sky-500 transition-colors"
                >
                  <StickyNote className="w-3.5 h-3.5 text-purple-400" />
                  <span className="font-medium">Personal Note</span>
                </button>

                <button
                  onClick={() => {
                    setIsQuickCreateOpen(false);
                    onQuickCreate?.('document');
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs flex items-center gap-2.5 hover:bg-sky-500/10 hover:text-sky-500 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-teal-400" />
                  <span className="font-medium">Upload Vault File</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Search button */}
        <button
          onClick={onSearchOpen}
          className={`p-2 rounded-lg transition-colors ${
            isLight
              ? 'text-slate-600 hover:bg-sky-50 hover:text-sky-600'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
          aria-label="Search CRM data"
          title="Search anything (Deals, Clients, Invoices)"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Notifications Icon with interactive flyout */}
        <div className="relative">
          <button
            onClick={() => {
              setIsNotifOpen(!isNotifOpen);
              setIsPeriodMenuOpen(false);
              setIsDateMenuOpen(false);
            }}
            className={`relative p-2 rounded-lg transition-colors ${
              isLight
                ? 'text-slate-600 hover:bg-sky-50 hover:text-sky-600'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[9px] font-bold text-white bg-rose-500 rounded-full animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div
              className={`absolute right-0 mt-2 w-80 sm:w-88 rounded-2xl border shadow-2xl py-2 z-50 ${
                isLight
                  ? 'bg-white border-sky-100 text-slate-800'
                  : 'bg-slate-900 border-slate-750 text-white'
              }`}
            >
              <div className="flex items-center justify-between px-4 py-2 border-b border-sky-100/30">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs uppercase tracking-wider">
                    Notifications
                  </span>
                  {unreadCount > 0 ? (
                    <span className="text-[10px] bg-sky-500/10 text-sky-500 font-bold px-1.5 py-0.5 rounded-full">
                      {unreadCount} new
                    </span>
                  ) : (
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-500 font-bold px-1.5 py-0.5 rounded-full">
                      All caught up
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[11px] text-sky-500 hover:underline font-medium"
                    >
                      Mark all read
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={clearAllNotifications}
                      className="text-[11px] text-slate-400 hover:text-rose-500 hover:underline font-medium"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 px-3 py-1.5 border-b border-sky-100/20 bg-sky-500/5 overflow-x-auto text-[11px]">
                <button
                  type="button"
                  onClick={() => setNotifFilter('all')}
                  className={`px-2 py-0.5 rounded-lg font-bold transition-all whitespace-nowrap ${
                    notifFilter === 'all'
                      ? 'bg-sky-500 text-white shadow-2xs'
                      : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  All ({notifications.length})
                </button>
                <button
                  type="button"
                  onClick={() => setNotifFilter('unread')}
                  className={`px-2 py-0.5 rounded-lg font-bold transition-all whitespace-nowrap ${
                    notifFilter === 'unread'
                      ? 'bg-sky-500 text-white shadow-2xs'
                      : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  Unread ({unreadCount})
                </button>
                <button
                  type="button"
                  onClick={() => setNotifFilter('event')}
                  className={`px-2 py-0.5 rounded-lg font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
                    notifFilter === 'event'
                      ? 'bg-sky-500 text-white shadow-2xs'
                      : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  <Calendar className="w-3 h-3" />
                  Upcoming Events
                </button>
                <button
                  type="button"
                  onClick={() => setNotifFilter('task')}
                  className={`px-2 py-0.5 rounded-lg font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
                    notifFilter === 'task'
                      ? 'bg-sky-500 text-white shadow-2xs'
                      : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  <CheckSquare className="w-3 h-3" />
                  Assigned Tasks
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-sky-100/10">
                {filteredNotifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400 space-y-1">
                    <Check className="w-6 h-6 mx-auto text-emerald-500 opacity-60" />
                    <p className="font-semibold">No notifications</p>
                    <p className="text-[10px] text-slate-400">
                      {notifFilter === 'unread'
                        ? 'All notifications have been read'
                        : notifFilter === 'event'
                        ? 'No upcoming events currently scheduled'
                        : notifFilter === 'task'
                        ? 'No active task assignments'
                        : 'Your inbox is clear'}
                    </p>
                  </div>
                ) : (
                  filteredNotifications.map((n) => {
                    const isEvent = n.type === 'event' || n.type === 'followup';
                    const isTask = n.type === 'task' || n.type === 'deadline';
                    const isLead = n.type === 'lead';
                    const isPayment = n.type === 'payment' || n.type === 'invoice';

                    return (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={`px-3.5 py-2.5 flex items-start gap-2.5 hover:bg-sky-500/10 cursor-pointer transition-colors group relative ${
                          !n.read ? (isLight ? 'bg-sky-50/70' : 'bg-slate-800/40') : ''
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                            isEvent
                              ? 'bg-sky-500/15 text-sky-500'
                              : isTask
                              ? 'bg-indigo-500/15 text-indigo-500'
                              : isLead
                              ? 'bg-purple-500/15 text-purple-500'
                              : isPayment
                              ? 'bg-emerald-500/15 text-emerald-500'
                              : 'bg-slate-500/15 text-slate-400'
                          }`}
                        >
                          {isEvent && <Calendar className="w-3.5 h-3.5" />}
                          {isTask && <CheckSquare className="w-3.5 h-3.5" />}
                          {isLead && <User className="w-3.5 h-3.5" />}
                          {isPayment && <DollarSign className="w-3.5 h-3.5" />}
                          {!isEvent && !isTask && !isLead && !isPayment && <Bell className="w-3.5 h-3.5" />}
                        </div>

                        <div className="flex-1 min-w-0 pr-5">
                          <div className="flex items-center justify-between gap-1">
                            <p
                              className={`text-xs leading-tight truncate ${
                                n.read
                                  ? 'font-medium text-slate-500 dark:text-slate-400'
                                  : 'font-bold text-slate-800 dark:text-slate-100'
                              }`}
                            >
                              {n.title}
                            </p>
                            <span className="text-[10px] text-slate-400 shrink-0 tabular-nums">
                              {n.timeAgo}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">{formatMoney(n.subtitle, currency)}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md uppercase tracking-wider ${
                                isEvent
                                  ? 'bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300'
                                  : isTask
                                  ? 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300'
                                  : isLead
                                  ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              {n.type === 'event' ? 'Upcoming Event' : n.type === 'task' ? 'Assigned Task' : n.type}
                            </span>
                            {n.targetNav && (
                              <span className="text-[10px] text-sky-500 flex items-center gap-0.5">
                                View in {n.targetNav} &rarr;
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            dismissNotification(n.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 rounded transition-opacity absolute right-2 top-2"
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
          )}
        </div>

        {/* Theme Switcher Toggle (White & Sky Blue ⇄ Midnight Command Center) */}
        <button
          onClick={toggleTheme}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            isLight
              ? 'bg-sky-50 border-sky-200 text-sky-700 hover:bg-sky-100'
              : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
          }`}
          title={isLight ? 'Switch to Midnight Dark' : 'Switch to White & Sky Blue'}
        >
          {isLight ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden xl:inline text-[11px]">Sky & White</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden xl:inline text-[11px]">Midnight</span>
            </>
          )}
        </button>

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className={`flex items-center gap-2.5 pl-2 pr-1 py-1 rounded-xl transition-colors ${
              isLight ? 'hover:bg-sky-50' : 'hover:bg-slate-800'
            }`}
          >
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-sky-500 flex items-center justify-center text-white font-bold text-xs ring-2 ring-sky-400/30 overflow-hidden">
                <span className="drop-shadow-xs">{currentUser?.name.charAt(0)}</span>
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
            </div>

            <div className="text-left hidden md:block">
              <div className="text-xs font-bold leading-tight">{currentUser?.name}</div>
              <div
                className={`text-[10px] font-medium leading-tight ${
                  isLight ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                {currentRole?.name}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isProfileOpen && (
            <div
              className={`absolute right-0 mt-2 w-56 rounded-xl border shadow-xl py-1 z-50 ${
                isLight
                  ? 'bg-white border-sky-100 text-slate-700'
                  : 'bg-slate-900 border-slate-700 text-slate-200'
              }`}
            >
              <div className="px-3 py-2 border-b border-sky-100/20">
                <div className="font-bold text-xs">{currentUser?.name}</div>
                <div className="text-[10px] text-slate-400 truncate">{currentUser?.email}</div>
                <div className="text-[10px] text-sky-500 font-semibold">{currentUser?.department}</div>
              </div>
              <button
                onClick={() => {
                  setIsProfileOpen(false);
                  setActiveNav('Settings');
                }}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-sky-500/10 hover:text-sky-500 transition-colors"
              >
                Profile, Password &amp; Settings
              </button>
              <div className="border-t border-sky-100/20 my-1" />
              <button
                onClick={() => {
                  setIsProfileOpen(false);
                  logout();
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-rose-500 hover:bg-rose-500/10 transition-colors"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
