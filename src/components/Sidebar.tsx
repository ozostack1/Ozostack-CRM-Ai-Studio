import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  GitFork,
  Contact,
  Building2,
  CalendarCheck2,
  FolderKanban,
  CheckSquare,
  Kanban,
  CalendarDays,
  Clock,
  Bug,
  DollarSign,
  Receipt,
  CreditCard,
  Wallet,
  TrendingDown,
  Megaphone,
  FileText,
  Share2,
  Mail,
  Banknote,
  Bot,
  Network,
  Cpu,
  Boxes,
  Settings,
  Webhook,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  Sparkles,
  ListTodo,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import {
  INITIAL_LEADS,
  INITIAL_DEALS,
  INITIAL_PROJECTS,
  INITIAL_TASKS,
  CALENDAR_EVENTS,
  INITIAL_FOLLOW_UPS,
  INITIAL_DOCUMENTS,
  INITIAL_DETAILED_INVOICES,
} from '../data/mockData';
import { DEFAULT_TODOS } from '../data/personalNotesTodosData';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

interface DropdownGroup {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavItem[];
}

interface NavSection {
  title: string;
  items?: NavItem[];
  dropdowns?: DropdownGroup[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'CRM & SALES',
    items: [
      { id: 'Leads', label: 'Leads', icon: Users, badge: 134 },
      { id: 'Deals', label: 'Deals', icon: Briefcase, badge: 28 },
      { id: 'Pipeline', label: 'Pipeline', icon: GitFork },
      { id: 'Contacts', label: 'Contacts', icon: Contact },
      { id: 'Companies', label: 'Companies', icon: Building2 },
      { id: 'Follow Ups', label: 'Follow Ups', icon: CalendarCheck2 },
    ],
  },
  {
    title: 'PROJECTS',
    items: [
      { id: 'Projects', label: 'Projects', icon: FolderKanban },
      { id: 'Tasks', label: 'Tasks', icon: CheckSquare, badge: 86 },
      { id: 'Events & Calendar', label: 'Events & Calendar', icon: CalendarDays, badge: 15 },
      { id: 'To Do & Notes', label: 'To Do & Notes', icon: ListTodo },
      { id: 'Time Tracking', label: 'Time Tracking', icon: Clock },
      { id: 'Documents', label: 'Documents', icon: FileText, badge: 8 },
    ],
  },
  {
    title: 'FINANCE',
    items: [
      { id: 'Revenue', label: 'Revenue', icon: DollarSign },
      { id: 'Invoices', label: 'Invoices', icon: Receipt, badge: 15 },
      { id: 'Expenses', label: 'Expenses', icon: CreditCard },
      { id: 'Payments', label: 'Payments', icon: Wallet },
      { id: 'Profit & Loss', label: 'Profit & Loss', icon: TrendingDown },
    ],
  },
  {
    title: 'APPS & MODULES',
    dropdowns: [
      {
        id: 'Marketing',
        label: 'Marketing',
        icon: Megaphone,
        items: [
          { id: 'Templates', label: 'Outreach Templates', icon: Mail },
          { id: 'Social Media', label: 'Social Media', icon: Share2 },
        ],
      },
      {
        id: 'Team & HR',
        label: 'Team & HR',
        icon: Users,
        items: [
          { id: 'Team', label: 'Team', icon: Users },
          { id: 'Payroll', label: 'Payroll', icon: Banknote },
        ],
      },
      {
        id: 'Tools',
        label: 'Tools',
        icon: Bot,
        items: [
          { id: 'AI Automation', label: 'AI Automation', icon: Bot },
          { id: 'Workflows', label: 'Workflows', icon: Network },
          { id: 'AI Agents', label: 'AI Agents', icon: Cpu },
          { id: 'Integrations', label: 'Integrations', icon: Boxes },
        ],
      },
    ],
  },
];

export const Sidebar: React.FC = () => {
  const {
    theme,
    isSidebarOpen,
    setIsSidebarOpen,
    isSidebarCollapsed,
    toggleSidebarCollapse,
    activeNav,
    setActiveNav,
  } = useTheme();

  const isLight = theme === 'white-sky';
  const { can, logout, scopeFilter, currentUser } = useAuth();

  const [storeTick, setStoreTick] = useState(0);
  useEffect(() => {
    const refresh = () => setStoreTick((t) => t + 1);
    window.addEventListener('ozostack-crm-config-changed', refresh);
    window.addEventListener('ozostack-templates-changed', refresh);
    window.addEventListener('ozostack-personal-notes-todos-changed', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('ozostack-crm-config-changed', refresh);
      window.removeEventListener('ozostack-templates-changed', refresh);
      window.removeEventListener('ozostack-personal-notes-todos-changed', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  // Compute scoped badge counts dynamically for the signed-in user
  const badgeCounts = useMemo<Record<string, number>>(() => {
    const readLS = <T,>(key: string, fallback: T[]): T[] => {
      try {
        const raw = localStorage.getItem(key);
        if (raw !== null) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch {
        /* fallback */
      }
      return fallback;
    };

    const leads = readLS('ozostack_leads_v2', INITIAL_LEADS);
    const deals = readLS('ozostack_deals_v2', INITIAL_DEALS);
    const tasks = readLS('ozostack_tasks_v2', INITIAL_TASKS);
    const docs = readLS('ozostack_documents_v2', INITIAL_DOCUMENTS);
    const defaultCal = [
      ...CALENDAR_EVENTS,
      ...INITIAL_FOLLOW_UPS.map((fu) => ({ owner: fu.owner, attendees: [fu.owner].filter(Boolean) as string[] })),
    ];
    const cal = readLS<{ owner?: string; attendees?: string[] }>('ozostack_calendar_events_v3', defaultCal);

    const myName = (currentUser?.name || '')
      .replace(/\s*\([^)]*\)/g, '')
      .trim()
      .toLowerCase();
    const personalTodos = readLS<{ ownerName?: string; completed?: boolean }>(
      'ozostack_personal_todos_v1',
      DEFAULT_TODOS
    );
    const pendingPersonalTodosCount = personalTodos.filter(
      (t) =>
        (t.ownerName || '')
          .replace(/\s*\([^)]*\)/g, '')
          .trim()
          .toLowerCase() === myName && !t.completed
    ).length;

    return {
      Leads: scopeFilter(leads, (l) => ({ owner: l.owner })).length,
      Deals: scopeFilter(deals, (d) => ({ owner: d.owner })).length,
      Tasks: scopeFilter(tasks, (t) => ({ owner: t.assignee })).length,
      'Events & Calendar': scopeFilter(cal, (e) => ({ owner: [e.owner, ...(e.attendees || [])] })).length,
      'To Do & Notes': pendingPersonalTodosCount,
      Documents: scopeFilter(docs, (doc) => {
        const proj = INITIAL_PROJECTS.find(
          (p) =>
            p.name === doc.project ||
            (doc.project && p.name.toLowerCase().includes(doc.project.toLowerCase().split(' ')[0]))
        );
        return { owner: [doc.uploadedBy, proj?.projectManager, ...(proj?.team || [])] };
      }).length,
      Invoices: INITIAL_DETAILED_INVOICES.length,
      Templates: readLS<{ id: string }>('ozostack_outreach_templates_v1', []).length || 9,
    };
  }, [scopeFilter, currentUser, activeNav, storeTick]);

  // Only show modules the signed-in user's role grants access to, with scoped badge counts
  const visibleSections = NAV_SECTIONS.map((sec) => ({
    ...sec,
    items: sec.items
      ?.filter((it) => can(it.id))
      .map((it) => ({
        ...it,
        badge: badgeCounts[it.id] !== undefined ? badgeCounts[it.id] : it.badge,
      })),
    dropdowns: sec.dropdowns
      ?.map((grp) => ({
        ...grp,
        items: grp.items
          .filter((it) => can(it.id))
          .map((it) => ({
            ...it,
            badge: badgeCounts[it.id] !== undefined ? badgeCounts[it.id] : it.badge,
          })),
      }))
      .filter((grp) => grp.items.length > 0),
  })).filter((sec) => (sec.items?.length || 0) + (sec.dropdowns?.length || 0) > 0);

  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({
    Marketing: false,
    'Team & HR': false,
    Tools: false,
    SettingsGroup: true,
  });

  const toggleDropdown = (id: string) => {
    setOpenDropdowns((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Automatically expand the dropdown if its child is currently active
  useEffect(() => {
    NAV_SECTIONS.forEach((sec) => {
      sec.dropdowns?.forEach((grp) => {
        if (grp.items.some((item) => item.id === activeNav)) {
          setOpenDropdowns((prev) => ({ ...prev, [grp.id]: true }));
        }
      });
    });
    if (activeNav === 'Settings' || activeNav === 'Webhooks') {
      setOpenDropdowns((prev) => ({ ...prev, SettingsGroup: true }));
    }
    if (activeNav === 'Webhooks' && !can('Webhooks')) {
      setActiveNav('Settings');
    }
  }, [activeNav, can, setActiveNav]);

  const handleNavClick = (id: string) => {
    setActiveNav(id);
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full select-none">
      {/* Brand Header */}
      <div
        className={`flex items-center justify-between px-4 py-4 border-b ${
          isLight ? 'border-sky-100 bg-white' : 'border-slate-800/80 bg-[#0a0f1d]'
        }`}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          {/* Logo icon */}
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 via-sky-400 to-indigo-500 shadow-md shadow-sky-500/20 shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
            <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/30" />
          </div>

          {!isSidebarCollapsed && (
            <div className="flex flex-col min-w-0">
              <span
                className={`text-base font-extrabold tracking-wider leading-none ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}
              >
                OZO STACK
              </span>
              <span className="text-[9px] font-semibold tracking-widest text-sky-500 mt-1 uppercase truncate">
                Automate. Innovate. Elevate.
              </span>
            </div>
          )}
        </div>

        {/* Mobile close button */}
        <button
          onClick={() => setIsSidebarOpen(false)}
          className={`lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 transition-colors ${
            isLight ? 'hover:bg-sky-50' : 'hover:bg-slate-800'
          }`}
          aria-label="Close navigation"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Desktop collapse toggle */}
        <button
          onClick={toggleSidebarCollapse}
          className={`hidden lg:flex p-1 rounded-md text-slate-400 hover:text-sky-500 transition-colors ${
            isLight ? 'hover:bg-sky-50' : 'hover:bg-slate-800'
          }`}
          title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isSidebarCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Navigation Scrollable Body */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
        {/* Main Dashboard Link */}
        {can('Dashboard') && (
        <div>
          <button
            onClick={() => handleNavClick('Dashboard')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-all duration-150 ${
              activeNav === 'Dashboard'
                ? 'bg-sky-500 text-white shadow-sm font-semibold'
                : isLight
                ? 'text-slate-600 hover:bg-sky-50 hover:text-sky-600'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            {!isSidebarCollapsed && <span className="truncate">Dashboard</span>}
          </button>
        </div>
        )}

        {/* Nav Sections */}
        {visibleSections.map((section) => (
          <div key={section.title} className="space-y-1">
            {!isSidebarCollapsed && (
              <div
                className={`px-3 text-[10px] font-bold tracking-wider uppercase mb-1.5 ${
                  isLight ? 'text-slate-400' : 'text-slate-400'
                }`}
              >
                {section.title}
              </div>
            )}

            {/* Standard Nav Items (CRM & SALES, PROJECTS, FINANCE) */}
            {section.items && (
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeNav === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      title={isSidebarCollapsed ? item.label : undefined}
                      className={`w-full flex items-center ${
                        isSidebarCollapsed ? 'justify-center p-2' : 'justify-between px-3 py-1.5'
                      } rounded-lg text-xs transition-colors duration-150 group ${
                        isActive
                          ? isLight
                            ? 'bg-sky-100 text-sky-800 font-semibold'
                            : 'bg-slate-800 text-sky-400 font-semibold'
                          : isLight
                          ? 'text-slate-600 hover:bg-sky-50 hover:text-sky-600 font-medium'
                          : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 font-medium'
                      }`}
                    >
                      <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-2.5'} min-w-0`}>
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isActive
                              ? isLight
                                ? 'text-sky-600'
                                : 'text-sky-400'
                              : 'text-slate-400 group-hover:text-sky-500'
                          }`}
                        />
                        {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                      </div>

                      {!isSidebarCollapsed && item.badge !== undefined && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                            isActive
                              ? isLight
                                ? 'bg-sky-600 text-white'
                                : 'bg-sky-500 text-white'
                              : isLight
                              ? 'bg-sky-100 text-sky-700'
                              : 'bg-indigo-950/80 text-sky-300 border border-indigo-800/40'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Dropdown Groups (Marketing, Team & HR, Tools) */}
            {section.dropdowns && (
              <div className="space-y-0.5">
                {section.dropdowns.map((grp) => {
                  const GroupIcon = grp.icon;
                  const isOpen = !!openDropdowns[grp.id];
                  const isGroupActive = grp.items.some((it) => it.id === activeNav);

                  return (
                    <div key={grp.id} className="space-y-0.5">
                      {/* Dropdown Trigger Item */}
                      <button
                        onClick={() => toggleDropdown(grp.id)}
                        title={isSidebarCollapsed ? `${grp.label} (${grp.items.length})` : undefined}
                        className={`w-full flex items-center ${
                          isSidebarCollapsed ? 'justify-center p-2' : 'justify-between px-3 py-1.5'
                        } rounded-lg text-xs transition-colors duration-150 group ${
                          isGroupActive
                            ? isLight
                              ? 'bg-sky-100 text-sky-800 font-semibold'
                              : 'bg-slate-800 text-sky-400 font-semibold'
                            : isLight
                            ? 'text-slate-600 hover:bg-sky-50 hover:text-sky-600 font-medium'
                            : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 font-medium'
                        }`}
                      >
                        <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-2.5'} min-w-0`}>
                          <GroupIcon
                            className={`w-4 h-4 shrink-0 transition-colors ${
                              isGroupActive
                                ? isLight
                                  ? 'text-sky-600'
                                  : 'text-sky-400'
                                : 'text-slate-400 group-hover:text-sky-500'
                            }`}
                          />
                          {!isSidebarCollapsed && <span className="truncate">{grp.label}</span>}
                        </div>

                        {!isSidebarCollapsed && (
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                                isGroupActive
                                  ? isLight
                                    ? 'bg-sky-200 text-sky-800'
                                    : 'bg-sky-950 text-sky-300'
                                  : isLight
                                  ? 'bg-sky-100 text-sky-700'
                                  : 'bg-indigo-950/80 text-sky-300 border border-indigo-800/40'
                              }`}
                            >
                              {grp.items.length}
                            </span>
                            <ChevronDown
                              className={`w-3.5 h-3.5 text-slate-400 group-hover:text-sky-500 transition-transform duration-200 ${
                                isOpen ? 'rotate-180 text-sky-500' : ''
                              }`}
                            />
                          </div>
                        )}
                      </button>

                      {/* Collapsible Sub-items */}
                      {isOpen && (
                        <div
                          className={`${
                            isSidebarCollapsed
                              ? 'space-y-0.5'
                              : 'pl-3.5 ml-3.5 border-l border-sky-100 dark:border-slate-800 space-y-0.5 my-1'
                          } animate-in fade-in duration-150`}
                        >
                          {grp.items.map((item) => {
                            const SubIcon = item.icon;
                            const isSubActive = activeNav === item.id;
                            return (
                              <button
                                key={item.id}
                                onClick={() => handleNavClick(item.id)}
                                title={isSidebarCollapsed ? item.label : undefined}
                                className={`w-full flex items-center ${
                                  isSidebarCollapsed ? 'justify-center p-1.5' : 'justify-between px-2.5 py-1.5'
                                } rounded-lg text-xs transition-colors duration-150 group ${
                                  isSubActive
                                    ? 'bg-sky-500 text-white font-semibold shadow-xs'
                                    : isLight
                                    ? 'text-slate-600 hover:bg-sky-50 hover:text-sky-600 font-medium'
                                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 font-medium'
                                }`}
                              >
                                <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-2'} min-w-0`}>
                                  <SubIcon
                                    className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                                      isSubActive
                                        ? 'text-white'
                                        : 'text-slate-400 group-hover:text-sky-500'
                                    }`}
                                  />
                                  {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                                </div>

                                {!isSidebarCollapsed && item.badge !== undefined && (
                                  <span
                                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ${
                                      isSubActive
                                        ? 'bg-white/20 text-white'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                    }`}
                                  >
                                    {item.badge}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        {/* SEPARATE DEDICATED SETTINGS DROPDOWN SECTION */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-1">
          {!isSidebarCollapsed && (
            <div
              className={`px-3 text-[10px] font-bold tracking-wider uppercase mb-1.5 ${
                isLight ? 'text-slate-400' : 'text-slate-400'
              }`}
            >
              PREFERENCES &amp; SYSTEM
            </div>
          )}

          {can('Webhooks') ? (
            <div className="space-y-0.5">
              <button
                onClick={() => toggleDropdown('SettingsGroup')}
                title={isSidebarCollapsed ? 'Settings (2)' : undefined}
                className={`w-full flex items-center ${
                  isSidebarCollapsed ? 'justify-center p-2' : 'justify-between px-3 py-1.5'
                } rounded-lg text-xs transition-colors duration-150 group ${
                  activeNav === 'Settings' || activeNav === 'Webhooks'
                    ? isLight
                      ? 'bg-sky-100 text-sky-800 font-semibold'
                      : 'bg-slate-800 text-sky-400 font-semibold'
                    : isLight
                    ? 'text-slate-600 hover:bg-sky-50 hover:text-sky-600 font-medium'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 font-medium'
                }`}
              >
                <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-2.5'} min-w-0`}>
                  <Settings
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      activeNav === 'Settings' || activeNav === 'Webhooks'
                        ? isLight
                          ? 'text-sky-600'
                          : 'text-sky-400'
                        : 'text-slate-400 group-hover:text-sky-500'
                    }`}
                  />
                  {!isSidebarCollapsed && <span className="truncate">Settings</span>}
                </div>

                {!isSidebarCollapsed && (
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                        activeNav === 'Settings' || activeNav === 'Webhooks'
                          ? isLight
                            ? 'bg-sky-200 text-sky-800'
                            : 'bg-sky-950 text-sky-300'
                          : isLight
                          ? 'bg-sky-100 text-sky-700'
                          : 'bg-indigo-950/80 text-sky-300 border border-indigo-800/40'
                      }`}
                    >
                      2
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 group-hover:text-sky-500 transition-transform duration-200 ${
                        openDropdowns.SettingsGroup ? 'rotate-180 text-sky-500' : ''
                      }`}
                    />
                  </div>
                )}
              </button>

              {openDropdowns.SettingsGroup && (
                <div
                  className={`${
                    isSidebarCollapsed
                      ? 'space-y-0.5'
                      : 'pl-3.5 ml-3.5 border-l border-sky-100 dark:border-slate-800 space-y-0.5 my-1'
                  } animate-in fade-in duration-150`}
                >
                  {[
                    { id: 'Settings', label: 'General & IAM', icon: Settings },
                    { id: 'Webhooks', label: 'Webhooks', icon: Webhook },
                  ].map((sub) => {
                    const SubIcon = sub.icon;
                    const isSubActive = activeNav === sub.id;
                    return (
                      <button
                        key={sub.id}
                        onClick={() => handleNavClick(sub.id)}
                        title={isSidebarCollapsed ? sub.label : undefined}
                        className={`w-full flex items-center ${
                          isSidebarCollapsed ? 'justify-center p-1.5' : 'justify-between px-2.5 py-1.5'
                        } rounded-lg text-xs transition-colors duration-150 group ${
                          isSubActive
                            ? 'bg-sky-500 text-white font-semibold shadow-xs'
                            : isLight
                            ? 'text-slate-600 hover:bg-sky-50 hover:text-sky-600 font-medium'
                            : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 font-medium'
                        }`}
                      >
                        <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-2'} min-w-0`}>
                          <SubIcon
                            className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                              isSubActive ? 'text-white' : 'text-slate-400 group-hover:text-sky-500'
                            }`}
                          />
                          {!isSidebarCollapsed && <span className="truncate">{sub.label}</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => handleNavClick('Settings')}
              title={isSidebarCollapsed ? 'Settings' : undefined}
              className={`w-full flex items-center ${
                isSidebarCollapsed ? 'justify-center p-2' : 'justify-between px-3 py-2'
              } rounded-lg text-xs transition-colors duration-150 group ${
                activeNav === 'Settings'
                  ? 'bg-sky-500 text-white font-semibold shadow-xs'
                  : isLight
                  ? 'text-slate-600 hover:bg-sky-50 hover:text-sky-600 font-medium'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 font-medium'
              }`}
            >
              <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-2.5'} min-w-0`}>
                <Settings
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    activeNav === 'Settings' ? 'text-white' : 'text-slate-400 group-hover:text-sky-500'
                  }`}
                />
                {!isSidebarCollapsed && <span className="truncate">Settings</span>}
              </div>
              {!isSidebarCollapsed && (
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                    activeNav === 'Settings'
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  ACCOUNT
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Footer / Log out */}
      <div
        className={`p-3 border-t ${
          isLight ? 'border-sky-100 bg-white' : 'border-slate-800/80 bg-[#0a0f1d]'
        }`}
      >
        <button
          onClick={logout}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
            isLight
              ? 'text-slate-500 hover:bg-red-50 hover:text-red-600'
              : 'text-slate-400 hover:bg-red-950/30 hover:text-red-400'
          }`}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!isSidebarCollapsed && <span>Log Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Slide-out Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:hidden ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isLight ? 'bg-white shadow-2xl' : 'bg-[#0a0f1d] shadow-2xl'}`}
      >
        {sidebarContent}
      </aside>

      {/* Desktop Sticky Sidebar */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 h-screen sticky top-0 transition-all duration-300 ease-in-out z-20 border-r ${
          isSidebarCollapsed ? 'w-18' : 'w-60'
        } ${
          isLight
            ? 'bg-white border-sky-100/90 shadow-sm'
            : 'bg-[#0a0f1d] border-slate-800/80'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
};
