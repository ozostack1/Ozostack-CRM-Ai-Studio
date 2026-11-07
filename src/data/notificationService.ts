import { useState, useEffect, useCallback, useMemo } from 'react';
import { NotificationItem, CalendarEvent, TaskItem, FollowUp } from '../types/crm';
import { CALENDAR_EVENTS, INITIAL_FOLLOW_UPS, INITIAL_TASKS } from './mockData';

const STORAGE_KEY = 'ozostack_notifications_v4';
const EVENT_NAME = 'ozostack-notifications-changed';

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-task-2',
    title: 'Task Assigned: UI Testing & Accessibility Audit',
    subtitle: 'Assigned to Neha Sharma · Due May 22, 2025 · SaaS Dashboard',
    timeAgo: '35 min ago',
    type: 'task',
    read: false,
    targetNav: 'Tasks',
    targetId: 'task-2',
    recipient: 'Neha Sharma',
    owner: 'Neha Sharma',
    createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    priority: 'medium',
  },
  {
    id: 'notif-evt-2',
    title: 'Upcoming Event: Sprint 14 Review & Retrospective',
    subtitle: 'Starts at 11:30 AM · FinEdge Systems',
    timeAgo: 'In 1 hr',
    type: 'event',
    read: false,
    targetNav: 'Events & Calendar',
    targetId: 'c2',
    owner: 'Amit Kumar',
    attendees: ['Sayed', 'Neha Sharma', 'Amit Kumar', 'Rizwan Khan'],
    recipient: 'Neha Sharma',
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    priority: 'medium',
  },
  {
    id: 'notif-evt-1',
    title: 'Upcoming Meeting: Discovery Call - Cloud Architecture',
    subtitle: 'Starts at 10:00 AM · Google Meet · TechVision Inc.',
    timeAgo: 'In 15 mins',
    type: 'event',
    read: false,
    targetNav: 'Events & Calendar',
    targetId: 'c1',
    owner: 'Amit Kumar',
    attendees: ['Amit Kumar', 'John Smith'],
    recipient: 'Amit Kumar',
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    priority: 'high',
  },
  {
    id: 'notif-task-1',
    title: 'Task Assigned: OAuth2 Multi-Factor Authentication Flow',
    subtitle: 'Assigned to Amit Kumar · Due May 20, 2025 · PCI-DSS Gateway',
    timeAgo: '10 min ago',
    type: 'task',
    read: false,
    targetNav: 'Tasks',
    targetId: 'task-1',
    recipient: 'Amit Kumar',
    owner: 'Amit Kumar',
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    priority: 'urgent',
  },
  {
    id: 'notif-lead-1',
    title: 'New lead from LinkedIn',
    subtitle: 'TechVision Inc. · High intent cloud migration inquiry',
    timeAgo: '20 min ago',
    type: 'lead',
    read: false,
    targetNav: 'Leads',
    owner: 'Sayed',
    recipient: 'Sayed',
    createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    priority: 'high',
  },
  {
    id: 'notif-pay-1',
    title: 'Payment received',
    subtitle: '$4,250 from ABC Corp (INV-2025-098)',
    timeAgo: '45 min ago',
    type: 'payment',
    read: true,
    targetNav: 'Revenue',
    owner: 'Sayed',
    recipient: 'Sayed',
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    priority: 'low',
  },
  {
    id: 'notif-fu-1',
    title: 'Upcoming Follow-up: John Smith',
    subtitle: 'Scheduled call at 10:00 AM · TechVision Inc.',
    timeAgo: '1 hr ago',
    type: 'followup',
    read: true,
    targetNav: 'Events & Calendar',
    targetId: 'fu-1',
    owner: 'Amit Kumar',
    recipient: 'Amit Kumar',
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    priority: 'medium',
  },
  {
    id: 'notif-rev-1',
    title: 'New client review',
    subtitle: '9/10 rating received from FinEdge Systems',
    timeAgo: '3 hr ago',
    type: 'review',
    read: true,
    targetNav: 'Dashboard',
    owner: 'Sayed',
    recipient: 'Sayed',
    createdAt: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
    priority: 'low',
  },
];

const normStr = (val?: string | null): string =>
  (val || '')
    .replace(/\s*\([^)]*\)/g, '')
    .trim()
    .toLowerCase();

/**
 * Validates whether a notification belongs to the specified staff user.
 * Ensures strict scoping: employees/staff can ONLY see their own notifications.
 */
export function isNotificationForUser(
  notif: NotificationItem,
  user?: { name?: string; email?: string } | null
): boolean {
  if (!user || !user.name) return true;
  const userName = normStr(user.name);

  // 1. Explicit Recipient check
  if (notif.recipient) {
    return normStr(notif.recipient) === userName;
  }

  // 2. Owner check (single or array of owners)
  if (notif.owner) {
    if (Array.isArray(notif.owner)) {
      return notif.owner.some((o) => o && normStr(o) === userName);
    }
    return normStr(notif.owner) === userName;
  }

  // 3. Attendees check (for events & meetings)
  if (notif.attendees && Array.isArray(notif.attendees) && notif.attendees.length > 0) {
    return notif.attendees.some((a) => a && normStr(a) === userName);
  }

  // 4. Subtitle matching (e.g., "Assigned to Neha Sharma")
  const subLower = normStr(notif.subtitle);
  const titleLower = normStr(notif.title);
  if (subLower.includes(`assigned to ${userName}`) || titleLower.includes(`assigned to ${userName}`)) {
    return true;
  }

  // 5. Fallback lookup: if targetId references a calendar event or follow-up, check its live owner
  if (notif.targetId) {
    const calMatch = CALENDAR_EVENTS.find((e) => e.id === notif.targetId);
    if (calMatch) {
      if (normStr(calMatch.owner) === userName) return true;
      if (calMatch.attendees && calMatch.attendees.some((a) => normStr(a) === userName)) return true;
      return false;
    }

    const fuMatch = INITIAL_FOLLOW_UPS.find((f) => f.id === notif.targetId);
    if (fuMatch) {
      return normStr(fuMatch.owner) === userName;
    }

    const taskMatch = INITIAL_TASKS.find((t) => t.id === notif.targetId);
    if (taskMatch) {
      return normStr(taskMatch.assignee) === userName;
    }
  }

  // If the notification explicitly belongs to another staff member / owner, strictly hide it!
  return false;
}

export function loadNotifications(): NotificationItem[] {
  try {
    // Clean up older un-scoped storage caches
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('ozostack_notifications_v3');
      localStorage.removeItem('ozostack_notifications_v2');
      localStorage.removeItem('ozostack_notifications_v1');
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch {
    /* fallback to initial */
  }
  return INITIAL_NOTIFICATIONS;
}

export function playNotificationSound() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    /* audio policy */
  }
}

export function saveNotifications(items: NotificationItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: items }));
  } catch {
    /* storage quota fallback */
  }
}

export function addNotification(
  notif: Omit<NotificationItem, 'id' | 'timeAgo'> & { id?: string; timeAgo?: string }
): NotificationItem {
  const current = loadNotifications();
  const newItem: NotificationItem = {
    id: notif.id || `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    title: notif.title,
    subtitle: notif.subtitle,
    timeAgo: notif.timeAgo || 'Just now',
    type: notif.type,
    read: notif.read ?? false,
    targetNav: notif.targetNav,
    targetId: notif.targetId,
    recipient: notif.recipient,
    owner: notif.owner,
    attendees: notif.attendees,
    createdAt: notif.createdAt || new Date().toISOString(),
    priority: notif.priority || 'medium',
  };

  // Prevent duplicate exact title + targetId within active items
  const exists = current.some(
    (n) =>
      n.title === newItem.title &&
      ((newItem.targetId && n.targetId === newItem.targetId) ||
        (!newItem.targetId && n.subtitle === newItem.subtitle))
  );

  if (exists) {
    return newItem;
  }

  const updated = [newItem, ...current];
  saveNotifications(updated);
  playNotificationSound();

  // Broadcast desktop browser notification if user gave permission
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(newItem.title, {
        body: newItem.subtitle,
        icon: '/favicon.ico',
      });
    } catch {
      /* ignore browser notification errors */
    }
  }

  return newItem;
}

export function markNotificationAsRead(id: string): void {
  const current = loadNotifications();
  const updated = current.map((n) => (n.id === id ? { ...n, read: true } : n));
  saveNotifications(updated);
}

export function markAllNotificationsAsReadForUser(userName?: string): void {
  const current = loadNotifications();
  if (!userName) {
    saveNotifications(current.map((n) => ({ ...n, read: true })));
    return;
  }
  const updated = current.map((n) => {
    if (isNotificationForUser(n, { name: userName })) {
      return { ...n, read: true };
    }
    return n;
  });
  saveNotifications(updated);
}

export function dismissNotificationItem(id: string): void {
  const current = loadNotifications();
  const updated = current.filter((n) => n.id !== id);
  saveNotifications(updated);
}

export function clearAllNotificationsForUser(userName?: string): void {
  const current = loadNotifications();
  if (!userName) {
    saveNotifications([]);
    return;
  }
  const updated = current.filter((n) => !isNotificationForUser(n, { name: userName }));
  saveNotifications(updated);
}

/**
 * Triggered whenever a task is created, assigned, or updated with an employee assignee.
 */
export function notifyTaskAssigned(task: {
  id?: string;
  title: string;
  assignee: string;
  project?: string;
  dueDate?: string;
  priority?: string;
}): NotificationItem {
  return addNotification({
    title: `Task Assigned: "${task.title}"`,
    subtitle: `Assigned to ${task.assignee || 'Employee'} · ${task.project || 'Project'} · Due ${task.dueDate || 'Soon'}`,
    type: 'task',
    read: false,
    targetNav: 'Tasks',
    targetId: task.id,
    recipient: task.assignee,
    owner: task.assignee,
    priority: (task.priority?.toLowerCase() === 'urgent' ? 'urgent' : 'high') as NotificationItem['priority'],
    timeAgo: 'Just now',
  });
}

/**
 * Triggered whenever an event or meeting is scheduled.
 */
export function notifyUpcomingEvent(event: {
  id?: string;
  title: string;
  date?: string;
  time?: string;
  startTime?: string;
  company?: string;
  location?: string;
  attendees?: string[];
  owner?: string;
}): NotificationItem {
  const timeStr = event.startTime || event.time || 'Upcoming';
  const locationStr = event.location || event.company || 'Calendar';
  const attendeesStr =
    event.attendees && event.attendees.length > 0
      ? `With ${event.attendees.join(', ')}`
      : event.owner
      ? `Host: ${event.owner}`
      : '';

  return addNotification({
    title: `Upcoming Event: "${event.title}"`,
    subtitle: `Starts at ${timeStr} (${event.date || 'Today'}) · ${locationStr} ${attendeesStr ? '· ' + attendeesStr : ''}`.trim(),
    type: 'event',
    read: false,
    targetNav: 'Events & Calendar',
    targetId: event.id,
    owner: event.owner,
    attendees: event.attendees || (event.owner ? [event.owner] : []),
    recipient: event.owner,
    priority: 'high',
    timeAgo: 'Just now',
  });
}

/**
 * Proactively checks all calendar events and scheduled follow-ups for upcoming items
 * on today's schedule and adds notification reminders with strict ownership attribution.
 */
export function syncUpcomingEventsFromCalendar(): void {
  try {
    let calendarEvents: CalendarEvent[] = CALENDAR_EVENTS;
    try {
      const raw = localStorage.getItem('ozostack_calendar_events_v3');
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) calendarEvents = parsed;
      }
    } catch {
      /* ignore */
    }

    const todayStr = '2025-05-20';
    const realDateStr = new Date().toISOString().split('T')[0];

    const currentNotifications = loadNotifications();

    calendarEvents.forEach((evt) => {
      if (evt.date === todayStr || evt.date === realDateStr) {
        const alreadyNotified = currentNotifications.some(
          (n) => n.targetId === evt.id || n.title.includes(evt.title)
        );

        if (!alreadyNotified && evt.status !== 'Completed' && evt.status !== 'Cancelled') {
          addNotification({
            id: `notif-auto-evt-${evt.id}`,
            title: `Upcoming Meeting: "${evt.title}"`,
            subtitle: `Starts at ${evt.startTime || evt.time || '10:00 AM'} · ${evt.location || evt.company || 'Google Meet'}`,
            type: 'event',
            read: false,
            targetNav: 'Events & Calendar',
            targetId: evt.id,
            owner: evt.owner,
            attendees: evt.attendees || (evt.owner ? [evt.owner] : []),
            recipient: evt.owner,
            priority: 'high',
            timeAgo: 'Today',
          });
        }
      }
    });

    let followUps: FollowUp[] = INITIAL_FOLLOW_UPS;
    try {
      const raw = localStorage.getItem('ozostack_followups_v2');
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) followUps = parsed;
      }
      // If leads are wiped, also suppress follow-up notifications
      const rawLeads = localStorage.getItem('ozostack_leads_v2');
      if (rawLeads !== null) {
        const parsedLeads = JSON.parse(rawLeads);
        if (Array.isArray(parsedLeads) && parsedLeads.length === 0) {
          followUps = [];
        }
      }
    } catch {
      /* ignore */
    }

    followUps.forEach((fu) => {
      if (fu.scheduledDate === todayStr || fu.scheduledDate === realDateStr) {
        const alreadyNotified = currentNotifications.some(
          (n) => n.targetId === fu.id || n.title.includes(fu.contact)
        );
        if (!alreadyNotified && fu.status !== 'Completed') {
          addNotification({
            id: `notif-auto-fu-${fu.id}`,
            title: `Upcoming Follow-up: "${fu.contact}"`,
            subtitle: `${fu.scheduledTime} · ${fu.company} · ${fu.dealName || 'Pipeline'}`,
            type: 'followup',
            read: false,
            targetNav: 'Events & Calendar',
            targetId: fu.id,
            owner: fu.owner,
            recipient: fu.owner,
            priority: 'medium',
            timeAgo: 'Today',
          });
        }
      }
    });
  } catch {
    /* ignore background sync errors */
  }
}

/**
 * Reactive React hook to consume notifications strictly scoped to the authenticated user.
 */
export function useNotifications(user?: { name?: string; email?: string } | null) {
  const [allNotifications, setAllNotifications] = useState<NotificationItem[]>(() => loadNotifications());

  const refresh = useCallback(() => {
    setAllNotifications(loadNotifications());
  }, []);

  useEffect(() => {
    syncUpcomingEventsFromCalendar();
    refresh();

    const handleCustomChange = () => refresh();
    const handleStorageChange = (e: StorageEvent) => {
      if (
        e.key === STORAGE_KEY ||
        e.key === 'ozostack_calendar_events_v3' ||
        e.key === 'ozostack_tasks_v2' ||
        e.key === 'ozostack_followups_v2'
      ) {
        refresh();
      }
    };

    window.addEventListener(EVENT_NAME, handleCustomChange);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('ozostack-crm-config-changed', handleCustomChange);
    window.addEventListener('focus', handleCustomChange);

    return () => {
      window.removeEventListener(EVENT_NAME, handleCustomChange);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('ozostack-crm-config-changed', handleCustomChange);
      window.removeEventListener('focus', handleCustomChange);
    };
  }, [refresh]);

  // Scoped strictly to the authenticated user
  const notifications = useMemo(() => {
    if (!user || !user.name) return allNotifications;
    return allNotifications.filter((n) => isNotificationForUser(n, user));
  }, [allNotifications, user]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  const markAllAsRead = useCallback(() => {
    markAllNotificationsAsReadForUser(user?.name);
  }, [user]);

  const clearAll = useCallback(() => {
    clearAllNotificationsForUser(user?.name);
  }, [user]);

  return {
    notifications,
    allNotifications,
    unreadCount,
    markAsRead: markNotificationAsRead,
    markAllAsRead,
    dismissNotification: dismissNotificationItem,
    clearAll,
    addNotification,
    notifyTaskAssigned,
    notifyUpcomingEvent,
  };
}
