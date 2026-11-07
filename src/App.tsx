import React, { useState, useEffect } from 'react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ALL_MODULES } from './context/authData';
import { LoginView } from './components/auth/LoginView';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { SearchModal } from './components/SearchModal';
import { SubViews } from './components/SubViews';
import { PublicLeadFormView } from './components/leads/PublicLeadFormView';
import { CheckCircle2 } from 'lucide-react';

// Modals for Quick Create from Header
import { LeadModal } from './components/leads/LeadModal';
import { DealModal } from './components/deals/DealModal';
import { ProjectModal } from './components/projects/ProjectModal';
import { TaskModal } from './components/tasks/TaskModal';
import { EventModal } from './components/calendar/EventModal';
import { TimeEntryModal } from './components/timetracking/TimeEntryModal';
import { DocumentUploadModal } from './components/documents/DocumentUploadModal';
import { TodoModal, NoteModal } from './components/personal/PersonalNotesTodosView';
import { PersonalTodo, PersonalNote } from './types/personalNotesTodos';
import { loadAllTodos, saveAllTodos, loadAllNotes, saveAllNotes } from './data/personalNotesTodosData';

import {
  Lead,
  Deal,
  Project,
  TaskItem,
  CalendarEvent,
  TimeEntry,
  DocumentItem,
} from './types/crm';
import {
  INITIAL_LEADS,
  INITIAL_DEALS,
  INITIAL_DOCUMENT_FOLDERS,
  INITIAL_DOCUMENTS,
  INITIAL_PROJECTS,
  INITIAL_TASKS,
  INITIAL_TIME_ENTRIES,
  CALENDAR_EVENTS,
} from './data/mockData';
import { addNotification, notifyTaskAssigned, notifyUpcomingEvent } from './data/notificationService';

// Clean up decommissioned storage from client browsers
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem('ozostack_content_items_v1');
    window.localStorage.removeItem('ozostack_notifications_v2');
    window.localStorage.removeItem('ozostack_notifications_v1');
    const savedDate = window.localStorage.getItem('ozostack_selected_date');
    if (savedDate === '2025-05-20') {
      window.localStorage.removeItem('ozostack_selected_date');
      window.localStorage.removeItem('ozostack_selected_date_label');
    }
  }
} catch {
  /* ignore */
}

const getTodayFormattedDate = (): string => {
  const d = new Date();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}, ${d.getFullYear()}`;
};

function DashboardContent() {
  const { theme, activeNav, setActiveNav } = useTheme();
  const isLight = theme === 'white-sky';

  const [selectedPeriod, setSelectedPeriod] = useState('This Month');
  const [selectedDate, setSelectedDate] = useState(() => {
    try {
      const saved = localStorage.getItem('ozostack_selected_date_label');
      if (saved && saved !== 'May 20, 2025') return saved;
    } catch {
      /* ignore */
    }
    return getTodayFormattedDate();
  });

  useEffect(() => {
    const handleDate = (e: Event) => {
      const custom = e as CustomEvent<{ date: string; formatted: string }>;
      if (custom.detail?.formatted) {
        setSelectedDate(custom.detail.formatted);
      }
    };
    window.addEventListener('ozostack-date-changed', handleDate);
    return () => window.removeEventListener('ozostack-date-changed', handleDate);
  }, []);
  const [isAddWidgetOpen, setIsAddWidgetOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Quick Create Modals State
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isDealModalOpen, setIsDealModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [isTodoModalOpen, setIsTodoModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);

  // Global Toast Feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const { can, currentUser, impersonator, stopImpersonation } = useAuth();

  // Land every user on the first module they are permitted to open
  useEffect(() => {
    if (activeNav !== 'Settings' && activeNav !== 'Webhooks' && !can(activeNav)) {
      setActiveNav(ALL_MODULES.find((m) => can(m)) || 'Settings');
    }
  }, [activeNav, can, setActiveNav]);

  const QUICK_CREATE_MODULE = {
    lead: 'Leads',
    deal: 'Deals',
    project: 'Projects',
    task: 'Tasks',
    event: 'Events & Calendar',
    time: 'Time Tracking',
    document: 'Documents',
    todo: 'To Do & Notes',
    note: 'To Do & Notes',
  } as const;

  const handleQuickCreate = (
    type: 'lead' | 'deal' | 'project' | 'task' | 'event' | 'time' | 'document' | 'todo' | 'note'
  ) => {
    if (!can(QUICK_CREATE_MODULE[type], 'create')) {
      showToast(`Access denied: you don't have create rights for ${QUICK_CREATE_MODULE[type]}.`);
      return;
    }
    switch (type) {
      case 'lead':
        setIsLeadModalOpen(true);
        break;
      case 'deal':
        setIsDealModalOpen(true);
        break;
      case 'project':
        setIsProjectModalOpen(true);
        break;
      case 'task':
        setIsTaskModalOpen(true);
        break;
      case 'event':
        setIsEventModalOpen(true);
        break;
      case 'time':
        setIsTimeModalOpen(true);
        break;
      case 'document':
        setIsDocModalOpen(true);
        break;
      case 'todo':
        setIsTodoModalOpen(true);
        break;
      case 'note':
        setIsNoteModalOpen(true);
        break;
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col lg:flex-row transition-colors duration-200 ${
        isLight ? 'bg-sky-50/40 text-slate-900' : 'bg-[#0a0e1a] text-slate-100'
      }`}
    >
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Viewport Content */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        {/* Header with Quick Create & Add Widget */}
        <Header
          onAddWidget={() => setIsAddWidgetOpen(true)}
          onSearchOpen={() => setIsSearchOpen(true)}
          selectedPeriod={selectedPeriod}
          setSelectedPeriod={setSelectedPeriod}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          onQuickCreate={handleQuickCreate}
        />

        {/* Impersonation banner */}
        {impersonator && (
          <div className="flex items-center justify-between gap-3 px-4 py-2 bg-amber-500 text-white text-xs font-semibold">
            <span>
              {impersonator.name} is viewing the workspace as {currentUser?.name} — exactly what this staff member can see.
            </span>
            <button onClick={stopImpersonation} className="px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 font-bold">
              Return to my account
            </button>
          </div>
        )}

        {/* Dynamic Content View */}
        <main className="flex-1 p-3 sm:p-4 lg:p-5 space-y-3.5 max-w-[1920px] w-full mx-auto">
          {activeNav === 'Dashboard' ? (
            <DashboardView
              isAddWidgetOpenExternal={isAddWidgetOpen}
              onCloseAddWidgetExternal={() => setIsAddWidgetOpen(false)}
            />
          ) : (
            <SubViews viewName={activeNav} />
          )}
        </main>
      </div>

      {/* Global Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* ============================================================== */}
      {/* QUICK CREATE MODALS (Available from anywhere via top header)   */}
      {/* ============================================================== */}
      <LeadModal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        onSave={(newLead) => {
          try {
            const raw = localStorage.getItem('ozostack_leads_v2');
            const list = raw ? JSON.parse(raw) : INITIAL_LEADS;
            localStorage.setItem('ozostack_leads_v2', JSON.stringify([newLead, ...list]));
            window.dispatchEvent(new Event('ozostack-crm-config-changed'));
          } catch {
            /* ignore */
          }
          addNotification({
            title: `New Lead Assigned: "${newLead.name}"`,
            subtitle: `${newLead.company} · Assigned to ${newLead.owner}`,
            type: 'lead',
            read: false,
            targetNav: 'Leads',
            targetId: newLead.id,
            owner: newLead.owner,
            recipient: newLead.owner,
          });
          showToast(`Successfully created lead "${newLead.name}".`);
          setIsLeadModalOpen(false);
          setActiveNav('Leads');
        }}
      />

      <DealModal
        isOpen={isDealModalOpen}
        onClose={() => setIsDealModalOpen(false)}
        onSave={(newDeal) => {
          try {
            const raw = localStorage.getItem('ozostack_deals_v2');
            const list = raw ? JSON.parse(raw) : INITIAL_DEALS;
            localStorage.setItem('ozostack_deals_v2', JSON.stringify([newDeal, ...list]));
            window.dispatchEvent(new Event('ozostack-crm-config-changed'));
          } catch {
            /* ignore */
          }
          showToast(`Successfully created deal "${newDeal.dealName}".`);
          setIsDealModalOpen(false);
          setActiveNav('Deals');
        }}
      />

      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        projectToEdit={null}
        onSave={(newProject) => {
          try {
            const raw = localStorage.getItem('ozostack_projects');
            const list = raw ? JSON.parse(raw) : INITIAL_PROJECTS;
            localStorage.setItem('ozostack_projects', JSON.stringify([newProject, ...list]));
            window.dispatchEvent(new Event('ozostack-crm-config-changed'));
          } catch {
            /* ignore */
          }
          showToast(`Successfully initiated project "${newProject.name}".`);
          setIsProjectModalOpen(false);
          setActiveNav('Projects');
        }}
      />

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        availableProjects={INITIAL_PROJECTS.map((p) => p.name)}
        onSave={(newTask) => {
          try {
            const raw = localStorage.getItem('ozostack_tasks_v2');
            const list = raw ? JSON.parse(raw) : INITIAL_TASKS;
            localStorage.setItem('ozostack_tasks_v2', JSON.stringify([newTask, ...list]));
            window.dispatchEvent(new Event('ozostack-crm-config-changed'));
          } catch {
            /* ignore */
          }
          if (newTask.assignee) {
            notifyTaskAssigned(newTask);
          }
          showToast(`Created task "${newTask.title}" & assigned to ${newTask.assignee}.`);
          setIsTaskModalOpen(false);
          setActiveNav('Tasks');
        }}
      />

      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        initialDate="2025-05-20"
        onSave={(newEvent) => {
          try {
            const raw = localStorage.getItem('ozostack_calendar_events_v3');
            const list = raw ? JSON.parse(raw) : CALENDAR_EVENTS;
            localStorage.setItem('ozostack_calendar_events_v3', JSON.stringify([newEvent, ...list]));
            window.dispatchEvent(new Event('ozostack-crm-config-changed'));
          } catch {
            /* ignore */
          }
          notifyUpcomingEvent(newEvent);
          showToast(`Scheduled event "${newEvent.title}".`);
          setIsEventModalOpen(false);
          setActiveNav('Events & Calendar');
        }}
      />

      <TimeEntryModal
        isOpen={isTimeModalOpen}
        onClose={() => setIsTimeModalOpen(false)}
        availableProjects={INITIAL_PROJECTS.map((p) => ({
          id: p.id,
          name: p.name,
          client: p.client,
        }))}
        onSave={(newEntry) => {
          try {
            const raw = localStorage.getItem('ozostack_time_entries_v1');
            const list = raw ? JSON.parse(raw) : INITIAL_TIME_ENTRIES;
            localStorage.setItem('ozostack_time_entries_v1', JSON.stringify([newEntry, ...list]));
            window.dispatchEvent(new Event('ozostack-crm-config-changed'));
          } catch {
            /* ignore */
          }
          showToast(`Logged ${newEntry.durationHours}h on ${newEntry.projectName}.`);
          setIsTimeModalOpen(false);
          setActiveNav('Time Tracking');
        }}
      />

      <DocumentUploadModal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        availableFolders={INITIAL_DOCUMENT_FOLDERS}
        availableClients={['FinEdge Systems', 'TechVision Inc.', 'SwiftRetail Global', 'DLF Limited', 'Mahindra Housing']}
        availableProjects={INITIAL_PROJECTS.map((p) => p.name)}
        onUpload={(newDoc) => {
          try {
            const raw = localStorage.getItem('ozostack_documents_v2');
            const list = raw ? JSON.parse(raw) : INITIAL_DOCUMENTS;
            localStorage.setItem('ozostack_documents_v2', JSON.stringify([newDoc, ...list]));
            window.dispatchEvent(new Event('ozostack-crm-config-changed'));
          } catch {
            /* ignore */
          }
          showToast(`Deposited "${newDoc.name}" into vault.`);
          setIsDocModalOpen(false);
          setActiveNav('Documents');
        }}
      />

      {isTodoModalOpen && (
        <TodoModal
          todo={null}
          onClose={() => setIsTodoModalOpen(false)}
          onSave={(item) => {
            const newTodo: PersonalTodo = {
              ...item,
              id: `todo-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              ownerName: currentUser?.name || 'Sayed',
              createdAt: new Date().toISOString(),
            };
            const updated = [newTodo, ...loadAllTodos()];
            saveAllTodos(updated);
            showToast(`Created personal to-do "${newTodo.title}".`);
            setIsTodoModalOpen(false);
            setActiveNav('To Do & Notes');
          }}
        />
      )}

      {isNoteModalOpen && (
        <NoteModal
          note={null}
          onClose={() => setIsNoteModalOpen(false)}
          onSave={(item) => {
            const now = new Date().toISOString();
            const newNote: PersonalNote = {
              ...item,
              id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              ownerName: currentUser?.name || 'Sayed',
              createdAt: now,
              updatedAt: now,
            };
            const updated = [newNote, ...loadAllNotes()];
            saveAllNotes(updated);
            showToast(`Saved personal note "${newNote.title}".`);
            setIsNoteModalOpen(false);
            setActiveNav('To Do & Notes');
          }}
        />
      )}

      {/* Global Quick Action Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white dark:bg-sky-500 dark:text-slate-950 font-medium text-xs shadow-xl animate-fade-in border border-slate-700 dark:border-sky-400">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-slate-950" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

function AuthGate() {
  const { currentUser } = useAuth();
  const [publicFormId, setPublicFormId] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('lead_form');
  });

  useEffect(() => {
    const onPopState = () => {
      const params = new URLSearchParams(window.location.search);
      setPublicFormId(params.get('lead_form'));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  if (publicFormId) {
    return (
      <PublicLeadFormView
        formId={publicFormId}
        onExitToCrm={() => {
          const url = new URL(window.location.href);
          url.searchParams.delete('lead_form');
          url.searchParams.delete('cfg');
          window.history.pushState({}, '', url.toString());
          setPublicFormId(null);
        }}
      />
    );
  }

  return currentUser ? <DashboardContent key={currentUser.id} /> : <LoginView />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </ThemeProvider>
  );
}
