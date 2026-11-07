import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  Plus,
  Search,
  Filter,
  Download,
  Calendar,
  CalendarDays,
  Clock,
  User,
  Users,
  Video,
  MapPin,
  Building2,
  FolderKanban,
  FileText,
  Trash2,
  Edit2,
  CheckCircle2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  LayoutList,
  Columns,
  Sparkles,
  AlertTriangle,
  Play,
  RotateCcw,
  Phone,
  Mail,
  MessageSquare,
  DollarSign,
  Briefcase,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';
import {
  CalendarEvent,
  CalendarEventType,
  CalendarEventStatus,
  CalendarEventPriority,
} from '../../types/crm';
import { CALENDAR_EVENTS, INITIAL_FOLLOW_UPS } from '../../data/mockData';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useSystemCurrency } from '../../data/currencyService';
import { notifyUpcomingEvent } from '../../data/notificationService';
import { EventModal } from './EventModal';
import { EventDetailsDrawer } from './EventDetailsDrawer';

type CalendarViewMode = 'month' | 'week' | 'agenda';
type SourceFilter = 'all' | 'events' | 'follow_ups';

export const EventsCalendarView: React.FC = () => {
  const { theme, setActiveNav } = useTheme();
  const { scopeFilter } = useAuth();
  const currency = useSystemCurrency();
  const isLight = theme === 'white-sky';

  // Helper to map mock Follow-Ups into Unified Calendar Events
  const initialCalendarEvents = useMemo(() => {
    const mappedFollowUps: CalendarEvent[] = INITIAL_FOLLOW_UPS.map((fu) => ({
      id: fu.id,
      title: `Follow-Up: ${fu.contact}`,
      company: fu.company,
      type: fu.type,
      date: fu.scheduledDate || '2025-05-20',
      time: fu.scheduledTime || '10:00 AM',
      startTime: fu.scheduledTime || '10:00 AM',
      status: (fu.status === 'Completed' ? 'Completed' : fu.status === 'Cancelled' ? 'Cancelled' : 'Scheduled') as CalendarEventStatus,
      priority: (fu.priority as CalendarEventPriority) || 'Medium',
      description: fu.notes,
      attendees: [fu.owner].filter(Boolean) as string[],
      project: fu.dealName,
      location: fu.type === 'WhatsApp' ? 'WhatsApp Direct' : fu.type === 'Call' ? 'Phone Direct' : fu.type === 'Email' ? 'Email Thread' : 'Executive Meeting',
      meetingUrl: fu.type === 'Meeting' ? 'https://meet.google.com/new' : undefined,
      source: 'follow_up',
      contact: fu.contact,
      contactPhone: fu.contactPhone,
      contactEmail: fu.contactEmail,
      dealName: fu.dealName,
      dealValue: fu.dealValue,
      owner: fu.owner,
    }));

    const normalizedEvents: CalendarEvent[] = CALENDAR_EVENTS.map((e) => ({
      ...e,
      source: 'event',
    }));

    return [...normalizedEvents, ...mappedFollowUps];
  }, []);

  // Events State (persisted so scheduled items survive user switching)
  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    try {
      const saved = localStorage.getItem('ozostack_calendar_events_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      /* fallback */
    }
    return initialCalendarEvents;
  });

  useEffect(() => {
    try {
      localStorage.setItem('ozostack_calendar_events_v3', JSON.stringify(events));
    } catch {
      /* ignore */
    }
  }, [events]);

  useEffect(() => {
    const syncEvents = () => {
      try {
        const saved = localStorage.getItem('ozostack_calendar_events_v3');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) setEvents(parsed);
        }
      } catch {
        /* ignore */
      }
    };
    window.addEventListener('ozostack-crm-config-changed', syncEvents);
    return () => window.removeEventListener('ozostack-crm-config-changed', syncEvents);
  }, []);

  // Scoped events visible to the signed-in staff member
  const visibleEvents = useMemo(
    () => scopeFilter(events, (e) => ({ owner: [e.owner, ...(e.attendees || [])] })),
    [events, scopeFilter]
  );

  // Active Date Navigation (defaults to current date or stored selected date)
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    try {
      const saved = localStorage.getItem('ozostack_selected_date');
      if (saved && saved !== '2025-05-20') {
        const parts = saved.split('-');
        if (parts.length === 3) {
          const y = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10) - 1;
          const d = parseInt(parts[2], 10);
          if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
            return new Date(y, m, d);
          }
        }
      }
    } catch {
      /* ignore */
    }
    return new Date();
  });

  useEffect(() => {
    const handleDateChange = (e: Event) => {
      const custom = e as CustomEvent<{ date: string; formatted: string }>;
      if (custom.detail?.date) {
        const parts = custom.detail.date.split('-');
        if (parts.length === 3) {
          const y = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10) - 1;
          const d = parseInt(parts[2], 10);
          if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
            setCurrentDate(new Date(y, m, d));
          }
        }
      }
    };
    window.addEventListener('ozostack-date-changed', handleDateChange);
    return () => window.removeEventListener('ozostack-date-changed', handleDateChange);
  }, []);

  // View Mode: 'month' | 'week' | 'agenda'
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [quickFilter, setQuickFilter] = useState<'all' | 'today' | 'this_week' | 'follow_ups' | 'demos' | 'completed'>('all');

  const todayIso = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  // Modals & Drawer State
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<CalendarEvent | null>(null);
  const [initialDateForModal, setInitialDateForModal] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [selectedDrawerEvent, setSelectedDrawerEvent] = useState<CalendarEvent | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const cardBg = isLight
    ? 'bg-white border-sky-100/90 shadow-xs'
    : 'bg-[#0f172a]/90 border-slate-800/80';

  // Current year & month for calendar display
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-indexed (4 = May)

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  // Distinct Companies & Projects for Filters
  const companiesList = useMemo(() => {
    const set = new Set<string>();
    visibleEvents.forEach((e) => set.add(e.company));
    return Array.from(set);
  }, [visibleEvents]);

  const projectsList = useMemo(() => {
    const set = new Set<string>();
    visibleEvents.forEach((e) => {
      if (e.project) set.add(e.project);
    });
    return Array.from(set);
  }, [visibleEvents]);

  // Executive Metrics
  const metrics = useMemo(() => {
    const total = visibleEvents.length;
    const todayEvents = visibleEvents.filter((e) => e.date === todayIso);
    const todayCount = todayEvents.length > 0 ? todayEvents.length : visibleEvents.filter((e) => e.date === '2025-05-20').length;
    const followUps = visibleEvents.filter((e) => e.source === 'follow_up');
    const followUpsCount = followUps.length;
    const followUpsPipeline = followUps.reduce((acc, curr) => acc + (curr.dealValue || 0), 0);
    const demosAndMilestonesCount = visibleEvents.filter((e) => e.type === 'Client Demo' || e.type === 'Sprint Review' || e.type === 'Milestone Deadline').length;
    const completedCount = visibleEvents.filter((e) => e.status === 'Completed').length;

    // This week
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    const startIso = `${startOfWeek.getFullYear()}-${String(startOfWeek.getMonth() + 1).padStart(2, '0')}-${String(startOfWeek.getDate()).padStart(2, '0')}`;
    const endIso = `${endOfWeek.getFullYear()}-${String(endOfWeek.getMonth() + 1).padStart(2, '0')}-${String(endOfWeek.getDate()).padStart(2, '0')}`;
    const thisWeekEvents = visibleEvents.filter((e) => e.date >= startIso && e.date <= endIso);
    const thisWeekCount = thisWeekEvents.length > 0 ? thisWeekEvents.length : visibleEvents.filter((e) => e.date >= '2025-05-18' && e.date <= '2025-05-24').length;

    return {
      total,
      todayCount,
      thisWeekCount,
      followUpsCount,
      followUpsPipeline,
      demosAndMilestonesCount,
      completedCount,
    };
  }, [visibleEvents, todayIso]);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return visibleEvents.filter((evt) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        evt.title.toLowerCase().includes(q) ||
        evt.company.toLowerCase().includes(q) ||
        (evt.contact && evt.contact.toLowerCase().includes(q)) ||
        (evt.dealName && evt.dealName.toLowerCase().includes(q)) ||
        (evt.owner && evt.owner.toLowerCase().includes(q)) ||
        (evt.project && evt.project.toLowerCase().includes(q)) ||
        (evt.location && evt.location.toLowerCase().includes(q)) ||
        (evt.attendees && evt.attendees.some((a) => a.toLowerCase().includes(q)));

      const matchesSource =
        sourceFilter === 'all' ||
        (sourceFilter === 'events' && evt.source !== 'follow_up') ||
        (sourceFilter === 'follow_ups' && evt.source === 'follow_up');

      const matchesType = selectedType === 'all' || evt.type === selectedType;
      const matchesCompany = selectedCompany === 'all' || evt.company === selectedCompany;
      const matchesStatus = selectedStatus === 'all' || evt.status === selectedStatus;

      let matchesQuick = true;
      if (quickFilter === 'today') {
        const hasToday = visibleEvents.some((e) => e.date === todayIso);
        matchesQuick = evt.date === (hasToday ? todayIso : '2025-05-20');
      } else if (quickFilter === 'this_week') {
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        const startIso = `${startOfWeek.getFullYear()}-${String(startOfWeek.getMonth() + 1).padStart(2, '0')}-${String(startOfWeek.getDate()).padStart(2, '0')}`;
        const endIso = `${endOfWeek.getFullYear()}-${String(endOfWeek.getMonth() + 1).padStart(2, '0')}-${String(endOfWeek.getDate()).padStart(2, '0')}`;
        const hasThisWeek = visibleEvents.some((e) => e.date >= startIso && e.date <= endIso);
        matchesQuick = hasThisWeek ? (evt.date >= startIso && evt.date <= endIso) : (evt.date >= '2025-05-18' && evt.date <= '2025-05-24');
      } else if (quickFilter === 'follow_ups') matchesQuick = evt.source === 'follow_up';
      else if (quickFilter === 'demos') matchesQuick = evt.type === 'Client Demo' || evt.type === 'Sprint Review' || evt.type === 'Milestone Deadline';
      else if (quickFilter === 'completed') matchesQuick = evt.status === 'Completed';

      return matchesSearch && matchesSource && matchesType && matchesCompany && matchesStatus && matchesQuick;
    });
  }, [visibleEvents, searchQuery, sourceFilter, selectedType, selectedCompany, selectedStatus, quickFilter, todayIso]);

  // Calendar Grid Day Calculations
  const calendarGridDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

    const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday
    const daysInCurrentMonth = lastDayOfMonth.getDate();

    const days: {
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
    }[] = [];

    // 1. Previous month padding days
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const m = currentMonth === 0 ? 12 : currentMonth;
      const y = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: dateStr === todayIso,
      });
    }

    // 2. Current month days
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: dateStr === todayIso,
      });
    }

    // 3. Next month padding days to fill 35 or 42 cells
    const totalSlots = days.length <= 35 ? 35 : 42;
    const remaining = totalSlots - days.length;
    for (let n = 1; n <= remaining; n++) {
      const m = currentMonth === 11 ? 1 : currentMonth + 2;
      const y = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(n).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNumber: n,
        isCurrentMonth: false,
        isToday: dateStr === todayIso,
      });
    }

    return days;
  }, [currentYear, currentMonth, todayIso]);

  // Week Schedule Columns based on Active Date
  const weekColumns = useMemo(() => {
    const start = new Date(currentDate);
    start.setDate(currentDate.getDate() - currentDate.getDay());
    const dayLabels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const isToday = iso === todayIso;
      return {
        label: isToday ? `${dayLabels[i]} (Today)` : dayLabels[i],
        dateStr: iso,
        isToday,
      };
    });
  }, [currentDate, todayIso]);

  // Date Navigation Handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleJumpToToday = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const iso = `${y}-${m}-${d}`;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formatted = `${months[today.getMonth()]} ${d}, ${y}`;
    setCurrentDate(today);
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
  };

  // CRUD Operations
  const handleSaveEvent = (savedEvent: CalendarEvent) => {
    if (eventToEdit) {
      setEvents((prev) => prev.map((e) => (e.id === savedEvent.id ? savedEvent : e)));
      if (selectedDrawerEvent?.id === savedEvent.id) {
        setSelectedDrawerEvent(savedEvent);
      }
      showToast(`Updated "${savedEvent.title}".`);
    } else {
      setEvents((prev) => [savedEvent, ...prev]);
      showToast(`Scheduled "${savedEvent.title}".`);
    }
    // Proactively register notification for upcoming event
    notifyUpcomingEvent(savedEvent);
  };

  const handleDeleteEvent = (eventId: string, eventTitle: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
    showToast(`Deleted "${eventTitle}".`);
    if (selectedDrawerEvent?.id === eventId) {
      setIsDrawerOpen(false);
      setSelectedDrawerEvent(null);
    }
  };

  const handleUpdateEventFromDrawer = (updated: CalendarEvent) => {
    setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    setSelectedDrawerEvent(updated);
    showToast(`Status updated for "${updated.title}".`);
    if (updated.status !== 'Cancelled' && updated.status !== 'Completed') {
      notifyUpcomingEvent(updated);
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      'Source',
      'Title',
      'Category / Channel',
      'Date',
      'Timeslot',
      'Company',
      'Contact Person',
      'Deal Name',
      'Deal Value',
      'Owner',
      'Status',
      'Priority',
      'Location',
      'Meeting Link',
    ];

    const rows = filteredEvents.map((e) => [
      `"${e.source === 'follow_up' ? 'Sales Follow-Up' : 'Calendar Event'}"`,
      `"${e.title.replace(/"/g, '""')}"`,
      `"${e.type}"`,
      `"${e.date}"`,
      `"${e.time}"`,
      `"${e.company.replace(/"/g, '""')}"`,
      `"${(e.contact || '').replace(/"/g, '""')}"`,
      `"${(e.dealName || e.project || '').replace(/"/g, '""')}"`,
      `"${e.dealValue ? `${currency.symbol}${e.dealValue}` : ''}"`,
      `"${(e.owner || '').replace(/"/g, '""')}"`,
      `"${e.status || 'Scheduled'}"`,
      `"${e.priority || 'Medium'}"`,
      `"${(e.location || '').replace(/"/g, '""')}"`,
      `"${e.meetingUrl || ''}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Calendar_Schedule_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Exported ${filteredEvents.length} calendar items to CSV.`);
  };

  // iCalendar (.ics) Export
  const handleExportICS = () => {
    const formatICSDate = (dateStr: string) => {
      const cleanDate = dateStr.replace(/-/g, '');
      return `${cleanDate}T090000Z`;
    };

    const dtStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const icsEvents = filteredEvents.map((evt) => {
      const dtStart = formatICSDate(evt.date);
      const summary = evt.source === 'follow_up' ? `[Follow-Up] ${evt.title}` : evt.title;
      const desc = (evt.description || `${evt.type} - ${evt.company}`).replace(/\n/g, ' ');
      const loc = (evt.location || evt.meetingUrl || 'Virtual').replace(/\n/g, ' ');

      return [
        'BEGIN:VEVENT',
        `UID:${evt.id}@ozostack.crm`,
        `DTSTAMP:${dtStamp}`,
        `DTSTART:${dtStart}`,
        `SUMMARY:${summary}`,
        `DESCRIPTION:${desc}`,
        `LOCATION:${loc}`,
        `STATUS:${evt.status === 'Completed' ? 'CONFIRMED' : 'TENTATIVE'}`,
        'END:VEVENT',
      ].join('\r\n');
    });

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Ozostack CRM//Events & Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      ...icsEvents,
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Ozostack_Calendar_${new Date().toISOString().split('T')[0]}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`Exported ${filteredEvents.length} items to iCal (.ics).`);
  };

  const getTypeBadgeColor = (t: string) => {
    switch (t) {
      case 'WhatsApp':
        return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
      case 'Call':
        return 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-800';
      case 'Email':
        return 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800';
      case 'Client Demo':
        return 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800';
      case 'Sprint Review':
        return 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800';
      case 'Milestone Deadline':
        return 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800';
      case 'Architecture Workshop':
        return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
      case 'Onboarding':
        return 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-300 dark:border-teal-800';
      default:
        return 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-800';
    }
  };

  const getStatusColor = (s?: CalendarEventStatus) => {
    switch (s) {
      case 'In Progress':
        return 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-300 dark:border-sky-800';
      case 'Completed':
        return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800';
      case 'Cancelled':
        return 'bg-slate-500/15 text-slate-500 border-slate-300 dark:border-slate-700';
      case 'Scheduled':
      default:
        return 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-300 dark:border-sky-800';
    }
  };

  // Group events by date for Agenda View
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    const sorted = [...filteredEvents].sort((a, b) => a.date.localeCompare(b.date));
    sorted.forEach((e) => {
      const currentList = map.get(e.date) || [];
      map.set(e.date, [...currentList, e]);
    });
    return Array.from(map.entries());
  }, [filteredEvents]);

  return (
    <div className="space-y-4">
      {/* 1. EXECUTIVE HEADER BANNER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl border bg-gradient-to-r from-sky-500/10 via-sky-400/5 to-transparent border-sky-200/60 dark:border-sky-500/20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveNav('Dashboard')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-sky-700 dark:text-sky-300 bg-white dark:bg-slate-800 border border-sky-200 dark:border-slate-700 shadow-xs hover:bg-sky-50 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>CEO Command Center</span>
          </button>
          <div>
            <h1 className="text-base font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
              <span>Events & Calendar</span>
              <span className="text-xs bg-sky-500/15 text-sky-600 dark:text-sky-400 font-bold px-2 py-0.5 rounded-full">
                {visibleEvents.length} Items Total
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Active Focus: <span className="font-bold text-sky-500">{metrics.todayCount} Today</span> · Follow-Ups: <span className="font-bold text-indigo-500">{metrics.followUpsCount} ({currency.symbol}{(metrics.followUpsPipeline / 1000).toFixed(0)}k pipeline)</span> · Completed: <span className="font-bold text-emerald-500">{metrics.completedCount}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${
              isLight
                ? 'bg-white border-sky-200 text-slate-700 hover:bg-sky-50'
                : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
            }`}
            title="Download CSV Calendar Schedule"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Export CSV</span>
          </button>

          {/* Export iCal (.ics) */}
          <button
            onClick={handleExportICS}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${
              isLight
                ? 'bg-white border-sky-200 text-slate-700 hover:bg-sky-50'
                : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
            }`}
            title="Export iCalendar (.ics) for Google/Apple/Outlook"
          >
            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
            <span className="hidden md:inline">Export iCal (.ics)</span>
          </button>

          {/* Schedule Button */}
          <button
            onClick={() => {
              setEventToEdit(null);
              setInitialDateForModal(todayIso);
              setIsEventModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-sky-500 hover:bg-sky-600 text-white shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Item</span>
          </button>
        </div>
      </div>

      {/* 2. EXECUTIVE KPI RIBBON */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Today's Events */}
        <div
          onClick={() => setQuickFilter(quickFilter === 'today' ? 'all' : 'today')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            quickFilter === 'today'
              ? 'ring-2 ring-sky-500 border-sky-400 shadow-md'
              : 'hover:border-sky-300'
          } ${cardBg}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Today's Focus
            </span>
            <div className="p-1.5 rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-extrabold text-sky-600 dark:text-sky-400 tabular-nums">
              {metrics.todayCount}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">May 20 agenda</span>
          </div>
        </div>

        {/* This Week */}
        <div
          onClick={() => setQuickFilter(quickFilter === 'this_week' ? 'all' : 'this_week')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            quickFilter === 'this_week'
              ? 'ring-2 ring-indigo-500 border-indigo-400 shadow-md'
              : 'hover:border-indigo-300'
          } ${cardBg}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              This Week
            </span>
            <div className="p-1.5 rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 tabular-nums">
              {metrics.thisWeekCount}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">scheduled total</span>
          </div>
        </div>

        {/* Sales Follow-Ups & Pipeline */}
        <div
          onClick={() => setQuickFilter(quickFilter === 'follow_ups' ? 'all' : 'follow_ups')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            quickFilter === 'follow_ups'
              ? 'ring-2 ring-purple-500 border-purple-400 shadow-md'
              : 'hover:border-purple-300'
          } ${cardBg}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              Sales Follow-Ups
            </span>
            <div className="p-1.5 rounded-lg bg-purple-500/15 text-purple-600 dark:text-purple-400">
              <Phone className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-extrabold text-purple-600 dark:text-purple-400 tabular-nums">
              {metrics.followUpsCount}
            </span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
              {currency.symbol}{(metrics.followUpsPipeline / 1000).toFixed(0)}k pipeline
            </span>
          </div>
        </div>

        {/* Demos & Reviews */}
        <div
          onClick={() => setQuickFilter(quickFilter === 'demos' ? 'all' : 'demos')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            quickFilter === 'demos'
              ? 'ring-2 ring-amber-500 border-amber-400 shadow-md'
              : 'hover:border-amber-300'
          } ${cardBg}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Demos & Milestones
            </span>
            <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Video className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-extrabold text-amber-600 dark:text-amber-400 tabular-nums">
              {metrics.demosAndMilestonesCount}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">client gates</span>
          </div>
        </div>

        {/* Completed */}
        <div
          onClick={() => setQuickFilter(quickFilter === 'completed' ? 'all' : 'completed')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            quickFilter === 'completed'
              ? 'ring-2 ring-emerald-500 border-emerald-400 shadow-md'
              : 'hover:border-emerald-300'
          } ${cardBg}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Completed
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-extrabold text-emerald-500 tabular-nums">
              {metrics.completedCount}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">concluded</span>
          </div>
        </div>
      </div>

      {/* 3. CALENDAR MONTH NAVIGATION & CONTROLS TOOLBAR */}
      <div className={`p-3.5 rounded-xl border flex flex-col lg:flex-row gap-3 items-center justify-between ${cardBg}`}>
        {/* Month Navigation */}
        <div className="flex items-center gap-2 w-full lg:w-auto">
          <button
            onClick={handlePrevMonth}
            className={`p-1.5 rounded-lg border transition-colors ${
              isLight ? 'bg-white border-sky-200 hover:bg-sky-50 text-slate-700' : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200'
            }`}
            title="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={handleJumpToToday}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
              isLight ? 'bg-white border-sky-200 hover:bg-sky-50 text-sky-700' : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-sky-400'
            }`}
            title="Jump to Today"
          >
            Today
          </button>

          <button
            onClick={handleNextMonth}
            className={`p-1.5 rounded-lg border transition-colors ${
              isLight ? 'bg-white border-sky-200 hover:bg-sky-50 text-slate-700' : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200'
            }`}
            title="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <h2 className="text-sm font-extrabold text-slate-800 dark:text-white ml-2 flex items-center gap-1.5">
            <span>{monthNames[currentMonth]}</span>
            <span className="text-sky-600 dark:text-sky-400">{currentYear}</span>
          </h2>
        </div>

        {/* Source Toggle Pills, Search, Filters & View Toggle */}
        <div className="flex items-center gap-2 w-full lg:w-auto flex-wrap justify-end text-xs">
          {/* Source Filter Selector */}
          <div className="flex items-center p-0.5 rounded-lg border border-sky-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
            <button
              onClick={() => setSourceFilter('all')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${
                sourceFilter === 'all'
                  ? 'bg-sky-500 text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              All ({visibleEvents.length})
            </button>
            <button
              onClick={() => setSourceFilter('events')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${
                sourceFilter === 'events'
                  ? 'bg-sky-500 text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              📅 Events ({visibleEvents.filter((e) => e.source !== 'follow_up').length})
            </button>
            <button
              onClick={() => setSourceFilter('follow_ups')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${
                sourceFilter === 'follow_ups'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              📞 Follow-Ups ({metrics.followUpsCount})
            </button>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search contact, client..."
              className={`w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border outline-none font-medium ${
                isLight
                  ? 'bg-sky-50/40 border-sky-200 text-slate-800 focus:border-sky-500'
                  : 'bg-slate-900 border-slate-700 text-white focus:border-sky-400'
              }`}
            />
          </div>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className={`text-xs px-2.5 py-1.5 rounded-lg border outline-none font-medium cursor-pointer ${
              isLight ? 'bg-white border-sky-200 text-slate-700' : 'bg-slate-800 border-slate-700 text-slate-200'
            }`}
          >
            <option value="all">All Channels / Types</option>
            <option value="Meeting">Meeting</option>
            <option value="Call">Call</option>
            <option value="WhatsApp">WhatsApp</option>
            <option value="Email">Email</option>
            <option value="Client Demo">Client Demo</option>
            <option value="Sprint Review">Sprint Review</option>
            <option value="Milestone Deadline">Milestone Deadline</option>
            <option value="Architecture Workshop">Architecture Workshop</option>
            <option value="Onboarding">Onboarding</option>
          </select>

          {/* Organization Filter */}
          <select
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
            className={`text-xs px-2.5 py-1.5 rounded-lg border outline-none font-medium cursor-pointer ${
              isLight ? 'bg-white border-sky-200 text-slate-700' : 'bg-slate-800 border-slate-700 text-slate-200'
            }`}
          >
            <option value="all">All Organizations</option>
            {companiesList.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* View Toggle */}
          <div className="flex items-center p-0.5 rounded-lg border border-sky-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
            <button
              onClick={() => setViewMode('month')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'month'
                  ? 'bg-sky-500 text-white shadow-2xs'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Month Grid View"
            >
              <CalendarDays className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'week'
                  ? 'bg-sky-500 text-white shadow-2xs'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Week Column Schedule View"
            >
              <Columns className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'agenda'
                  ? 'bg-sky-500 text-white shadow-2xs'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Agenda List View"
            >
              <LayoutList className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. VIEW 1: MONTHLY CALENDAR GRID */}
      {viewMode === 'month' && (
        <div className={`rounded-xl border overflow-hidden ${cardBg}`}>
          {/* Days of Week Header */}
          <div className="grid grid-cols-7 border-b border-sky-100/50 dark:border-slate-800 bg-sky-50/40 dark:bg-slate-800/60 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 py-2.5">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Calendar Grid Cells */}
          <div className="grid grid-cols-7 divide-x divide-y divide-sky-100/30 dark:divide-slate-800/60">
            {calendarGridDays.map((day) => {
              const dayEvents = filteredEvents.filter((e) => e.date === day.dateStr);

              return (
                <div
                  key={day.dateStr}
                  onClick={() => {
                    setEventToEdit(null);
                    setInitialDateForModal(day.dateStr);
                    setIsEventModalOpen(true);
                  }}
                  className={`min-h-[115px] p-2 flex flex-col justify-between transition-colors cursor-pointer group ${
                    day.isCurrentMonth
                      ? isLight
                        ? 'bg-white hover:bg-sky-50/30'
                        : 'bg-slate-900/60 hover:bg-slate-800/40'
                      : isLight
                      ? 'bg-slate-50/50 text-slate-400'
                      : 'bg-slate-950/40 text-slate-600'
                  }`}
                >
                  {/* Day Header */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                        day.isToday
                          ? 'bg-sky-500 text-white shadow-xs font-extrabold'
                          : day.isCurrentMonth
                          ? 'text-slate-800 dark:text-slate-200'
                          : 'text-slate-400'
                      }`}
                    >
                      {day.dayNumber}
                    </span>

                    {dayEvents.length > 0 && (
                      <span className="text-[10px] font-bold text-slate-400">
                        {dayEvents.length} {dayEvents.length === 1 ? 'item' : 'items'}
                      </span>
                    )}
                  </div>

                  {/* Items inside this Day Cell */}
                  <div className="space-y-1 flex-1 overflow-hidden">
                    {dayEvents.slice(0, 3).map((event) => {
                      const isFU = event.source === 'follow_up';

                      return (
                        <div
                          key={event.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDrawerEvent(event);
                            setIsDrawerOpen(true);
                          }}
                          className={`px-1.5 py-1 rounded-md text-[10px] font-semibold border truncate cursor-pointer transition-all hover:scale-101 hover:shadow-xs flex items-center gap-1 ${getTypeBadgeColor(
                            event.type
                          )}`}
                          title={`${event.time} - ${event.title} (${event.company})`}
                        >
                          {isFU ? (
                            event.type === 'WhatsApp' ? (
                              <MessageSquare className="w-2.5 h-2.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                            ) : event.type === 'Call' ? (
                              <Phone className="w-2.5 h-2.5 shrink-0 text-sky-600 dark:text-sky-400" />
                            ) : event.type === 'Email' ? (
                              <Mail className="w-2.5 h-2.5 shrink-0 text-amber-600 dark:text-amber-400" />
                            ) : (
                              <Users className="w-2.5 h-2.5 shrink-0 text-purple-600 dark:text-purple-400" />
                            )
                          ) : (
                            event.meetingUrl && <Video className="w-2.5 h-2.5 shrink-0 opacity-70" />
                          )}
                          <span className="truncate flex-1">{event.title}</span>
                          {isFU && event.dealValue && (
                            <span className="text-[9px] font-extrabold text-emerald-700 dark:text-emerald-300 shrink-0">
                              {currency.symbol}{(event.dealValue / 1000).toFixed(0)}k
                            </span>
                          )}
                        </div>
                      );
                    })}

                    {dayEvents.length > 3 && (
                      <span className="text-[9px] font-bold text-sky-600 dark:text-sky-400 block text-right pr-1">
                        +{dayEvents.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. VIEW 2: WEEK COLUMN SCHEDULE VIEW */}
      {viewMode === 'week' && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-3.5 items-start min-w-max">
            {weekColumns.map((col) => {
              const colEvents = filteredEvents.filter((e) => e.date === col.dateStr);
              const isTodayCol = col.isToday;

              return (
                <div
                  key={col.dateStr}
                  className={`w-[290px] min-w-[290px] max-w-[290px] p-3 rounded-xl border flex flex-col min-h-[580px] shrink-0 ${
                    isTodayCol
                      ? 'border-sky-400 ring-2 ring-sky-300 dark:ring-sky-700 shadow-md ' + cardBg
                      : cardBg
                  }`}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-sky-100/30">
                    <div>
                      <span className={`font-extrabold text-xs uppercase tracking-tight block ${isTodayCol ? 'text-sky-600 dark:text-sky-400' : 'text-slate-800 dark:text-slate-100'}`}>
                        {col.label}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {col.dateStr}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-300">
                        {colEvents.length}
                      </span>
                      <button
                        onClick={() => {
                          setEventToEdit(null);
                          setInitialDateForModal(col.dateStr);
                          setIsEventModalOpen(true);
                        }}
                        className="p-1 text-slate-400 hover:text-sky-500 rounded transition-colors"
                        title={`Schedule item on ${col.dateStr}`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Cards Container */}
                  <div className="space-y-3 flex-1 overflow-y-auto pr-0.5">
                    {colEvents.map((evt) => {
                      const isFU = evt.source === 'follow_up';

                      return (
                        <div
                          key={evt.id}
                          onClick={() => {
                            setSelectedDrawerEvent(evt);
                            setIsDrawerOpen(true);
                          }}
                          className={`p-3 rounded-xl border transition-all duration-200 hover:shadow-md cursor-pointer group flex flex-col justify-between ${
                            isFU
                              ? isLight
                                ? 'bg-indigo-50/20 border-indigo-200/80 hover:border-indigo-400'
                                : 'bg-slate-800/80 border-indigo-900/50 hover:border-indigo-600'
                              : isLight
                              ? 'bg-slate-50/80 border-sky-100 hover:border-sky-300'
                              : 'bg-slate-800/60 border-slate-700 hover:border-slate-500'
                          }`}
                        >
                          <div>
                            {/* Top row */}
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-1">
                                {isFU && (
                                  <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                    Follow-Up
                                  </span>
                                )}
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${getTypeBadgeColor(evt.type)}`}>
                                  {evt.type}
                                </span>
                              </div>
                              <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400">
                                {evt.time.split(' - ')[0]}
                              </span>
                            </div>

                            <h4 className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-sky-500 transition-colors line-clamp-2 leading-snug">
                              {evt.title}
                            </h4>

                            <p className="text-[11px] text-sky-600 dark:text-sky-400 font-semibold truncate mt-1">
                              {evt.company}
                            </p>

                            {evt.dealName && (
                              <div className="flex items-center justify-between mt-1 text-[10px]">
                                <span className="text-slate-400 truncate max-w-[130px]">{evt.dealName}</span>
                                {evt.dealValue && (
                                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                                    {currency.symbol}{evt.dealValue.toLocaleString()}
                                  </span>
                                )}
                              </div>
                            )}

                            {evt.project && !evt.dealName && (
                              <p className="text-[10px] text-slate-400 truncate mt-0.5">
                                {evt.project}
                              </p>
                            )}
                          </div>

                          {/* Card bottom */}
                          <div className="pt-2 mt-2 border-t border-sky-100/30 flex items-center justify-between text-[10px]">
                            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium truncate max-w-[140px]">
                              {isFU ? (
                                <>
                                  <User className="w-3 h-3 text-indigo-400 shrink-0" />
                                  <span className="truncate">{evt.contact || evt.owner || 'Lead'}</span>
                                </>
                              ) : (
                                <>
                                  <User className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span className="truncate">{(evt.attendees || [])[0] || 'Team'}</span>
                                </>
                              )}
                            </span>

                            {isFU && evt.contactPhone && (
                              <div className="flex items-center gap-1">
                                <a
                                  href={`tel:${evt.contactPhone}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="p-1 rounded text-sky-600 hover:bg-sky-100 dark:hover:bg-slate-700 transition-colors"
                                  title={`Call ${evt.contactPhone}`}
                                >
                                  <Phone className="w-2.5 h-2.5" />
                                </a>
                                <a
                                  href={`https://wa.me/${evt.contactPhone.replace(/[^0-9]/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="p-1 rounded text-emerald-600 hover:bg-emerald-100 dark:hover:bg-slate-700 transition-colors"
                                  title="WhatsApp Chat"
                                >
                                  <MessageSquare className="w-2.5 h-2.5" />
                                </a>
                              </div>
                            )}

                            {evt.meetingUrl && (
                              <a
                                href={evt.meetingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-sky-600 hover:text-sky-700 flex items-center gap-1 font-bold"
                              >
                                <span>Join</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {colEvents.length === 0 && (
                      <div className="py-12 text-center text-[11px] text-slate-400 border border-dashed rounded-lg border-sky-100/60 dark:border-slate-800">
                        No items scheduled
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. VIEW 3: AGENDA LIST VIEW */}
      {viewMode === 'agenda' && (
        <div className="space-y-4">
          {eventsByDate.map(([dateStr, dateEvents]) => {
            const isToday = dateStr === todayIso;

            return (
              <div key={dateStr} className={`rounded-xl border overflow-hidden ${cardBg}`}>
                {/* Date Header */}
                <div className={`px-4 py-2.5 border-b flex items-center justify-between ${
                  isToday
                    ? 'bg-sky-50/70 border-sky-200 dark:bg-sky-950/30 dark:border-sky-800'
                    : 'bg-slate-50/60 border-slate-200/80 dark:bg-slate-800/40 dark:border-slate-700'
                }`}>
                  <div className="flex items-center gap-2">
                    <Calendar className={`w-4 h-4 ${isToday ? 'text-sky-500' : 'text-slate-400'}`} />
                    <span className={`text-xs font-extrabold ${isToday ? 'text-sky-600 dark:text-sky-400' : 'text-slate-800 dark:text-slate-200'}`}>
                      {dateStr}
                    </span>
                    {isToday && (
                      <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-sky-500 text-white">
                        Today
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-slate-400">
                    {dateEvents.length} {dateEvents.length === 1 ? 'item' : 'items'}
                  </span>
                </div>

                {/* Date Event Items */}
                <div className="divide-y divide-sky-100/30 dark:divide-slate-800">
                  {dateEvents.map((event) => {
                    const isFU = event.source === 'follow_up';

                    return (
                      <div
                        key={event.id}
                        onClick={() => {
                          setSelectedDrawerEvent(event);
                          setIsDrawerOpen(true);
                        }}
                        className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 hover:bg-sky-50/30 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                      >
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                              isFU
                                ? event.type === 'WhatsApp'
                                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                  : event.type === 'Call'
                                  ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400'
                                  : event.type === 'Email'
                                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                                  : 'bg-purple-500/15 text-purple-600 dark:text-purple-400'
                                : 'bg-sky-500/10 text-sky-600 dark:text-sky-300'
                            }`}
                          >
                            {isFU ? (
                              event.type === 'WhatsApp' ? (
                                <MessageSquare className="w-5 h-5" />
                              ) : event.type === 'Call' ? (
                                <Phone className="w-5 h-5" />
                              ) : event.type === 'Email' ? (
                                <Mail className="w-5 h-5" />
                              ) : (
                                <Calendar className="w-5 h-5" />
                              )
                            ) : (
                              <Clock className="w-5 h-5" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="text-xs font-bold text-sky-600 dark:text-sky-400 tabular-nums">
                                {event.time}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                  isFU
                                    ? 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                }`}
                              >
                                {isFU ? 'Sales Follow-Up' : 'Event'}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getTypeBadgeColor(event.type)}`}>
                                {event.type}
                              </span>
                              {isFU && event.dealValue && (
                                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                                  {currency.symbol}{event.dealValue.toLocaleString()} Deal
                                </span>
                              )}
                              {event.status && (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusColor(event.status)}`}>
                                  {event.status}
                                </span>
                              )}
                            </div>

                            <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-sky-500 transition-colors">
                              {event.title}
                            </h3>

                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-slate-700 dark:text-slate-300">{event.company}</span>
                              {isFU && event.contact && (
                                <>
                                  <span>•</span>
                                  <span className="font-medium text-sky-600 dark:text-sky-400">{event.contact}</span>
                                </>
                              )}
                              {event.dealName && (
                                <>
                                  <span>•</span>
                                  <span className="text-slate-500 dark:text-slate-400">{event.dealName}</span>
                                </>
                              )}
                              {event.project && !event.dealName && (
                                <>
                                  <span>•</span>
                                  <span className="text-sky-600 dark:text-sky-400">{event.project}</span>
                                </>
                              )}
                              {event.location && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-slate-400" />
                                    <span>{event.location}</span>
                                  </span>
                                </>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end md:self-center" onClick={(e) => e.stopPropagation()}>
                          {/* Follow-up Quick Action Buttons */}
                          {isFU && event.contactPhone && (
                            <>
                              <a
                                href={`tel:${event.contactPhone.replace(/[^0-9+]/g, '')}`}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-xs transition-colors"
                                title="Call Contact"
                              >
                                <Phone className="w-3 h-3" />
                                <span>Call</span>
                              </a>
                              <a
                                href={`https://wa.me/${event.contactPhone.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors"
                                title="WhatsApp Contact"
                              >
                                <MessageSquare className="w-3 h-3" />
                                <span>Chat</span>
                              </a>
                            </>
                          )}

                          {isFU && event.contactEmail && (
                            <a
                              href={`mailto:${event.contactEmail}`}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors"
                              title="Email Contact"
                            >
                              <Mail className="w-3.5 h-3.5" />
                            </a>
                          )}

                          {/* Meeting Video Join */}
                          {event.meetingUrl && (
                            <a
                              href={event.meetingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-xs transition-colors"
                            >
                              <Video className="w-3.5 h-3.5" />
                              <span>Join</span>
                            </a>
                          )}

                          <button
                            onClick={() => {
                              setEventToEdit(event);
                              setIsEventModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors"
                            title="Edit Item"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete "${event.title}"?`)) {
                                handleDeleteEvent(event.id, event.title);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                            title="Delete Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {eventsByDate.length === 0 && (
            <div className={`p-12 text-center rounded-xl border ${cardBg}`}>
              <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-60" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
                No matching events or follow-ups found
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Try resetting your filters or search query.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSourceFilter('all');
                  setSelectedType('all');
                  setSelectedCompany('all');
                  setSelectedStatus('all');
                  setQuickFilter('all');
                }}
                className="mt-3 px-3 py-1.5 text-xs font-semibold text-sky-600 bg-sky-50 dark:bg-slate-800 rounded-lg hover:underline"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* 7. MODALS & DRAWER */}
      {/* Event Details Drawer */}
      <EventDetailsDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedDrawerEvent(null);
        }}
        event={selectedDrawerEvent}
        onEdit={(evt) => {
          setIsDrawerOpen(false);
          setEventToEdit(evt);
          setIsEventModalOpen(true);
        }}
        onDelete={handleDeleteEvent}
        onUpdateEvent={handleUpdateEventFromDrawer}
      />

      {/* Schedule / Edit Item Modal */}
      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        onSave={handleSaveEvent}
        eventToEdit={eventToEdit}
        initialDate={initialDateForModal}
        availableCompanies={companiesList}
        availableProjects={projectsList}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white dark:bg-sky-500 dark:text-slate-950 font-medium text-xs shadow-xl animate-fade-in border border-slate-700 dark:border-sky-400">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-slate-950" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
