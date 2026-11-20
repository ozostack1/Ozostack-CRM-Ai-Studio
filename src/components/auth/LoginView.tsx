import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  LogIn,
  ShieldCheck,
  LayoutDashboard,
  Users,
  GitFork,
  FolderKanban,
  Receipt,
  Banknote,
  Bot,
  Webhook,
  CheckCircle2,
  ArrowRight,
  Layers,
  Upload,
  Clock,
  FileText,
  Sparkles,
  ChevronRight,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const SCREENSHOT_TABS = [
  {
    id: 'command-center',
    label: 'CEO Command Center',
    badge: 'Live Telemetry',
    title: '360° Executive Revenue, Pipeline & Operations Intelligence',
    description:
      'Monitor Monthly Revenue Velocity, ₹1M Annual Targets, Net Profit, Cash Flow, Sales & Deal Velocity, Sprint Execution, and AI Business Assistant insights on a single screen.',
    image: '/assets/screen-dashboard.png',
    highlights: [
      'Real-time Revenue Velocity & MRR growth tracking',
      'Sales Pipeline conversion funnel & lead source attribution',
      'AI Business Assistant flagging at-risk deals & overdue tasks',
    ],
  },
  {
    id: 'light-workspace',
    label: 'Executive Light Suite',
    badge: 'Dual Theme',
    title: 'White-Sky & Deep-Slate Adaptive Enterprise Workspace',
    description:
      'Switch effortlessly between high-contrast dark mode and crisp White-Sky executive mode with customizable multi-dashboard layouts and KPI strips.',
    image: '/assets/aistudio/CEO_command_centre_dashboard_mockup_27477e48.png',
    highlights: [
      'Customizable multi-dashboard tabs & drag-and-drop KPI widgets',
      'Connected sub-modules for Projects, Tasks, Invoices, Expenses & P&L',
      '1-click Quick Create bar for leads, deals, tasks, events & documents',
    ],
  },
  {
    id: 'payroll-roster',
    label: 'HRM & Payroll Engine',
    badge: 'Automated ACH',
    title: 'Complete Employee Compensation Roster, Pay Runs & Tax Compliance',
    description:
      'Manage full-time and contract compensation, semi-monthly pay cycles, federal/state tax withholdings, 401(k) benefits, and employee reimbursement claims.',
    image: '/assets/screen-payroll.png',
    highlights: [
      'Automated Gross-to-Net calculation with FIT, SIT, FICA & Medicare',
      'Hold, approve, or disburse individual payroll records with 1 click',
      'Synchronized with live HRM Employee Directory & Attendance',
    ],
  },
  {
    id: 'epaystub',
    label: 'Official E-Paystubs',
    badge: 'PDF Ready',
    title: 'Instant Official E-Paystub & Earnings Statements',
    description:
      'Generate audit-ready digital pay statements with itemized regular earnings, performance bonuses, statutory tax deductions, and direct deposit tracking.',
    image: '/assets/screen-paystub.png',
    highlights: [
      '1-click printable & downloadable PDF earnings statements',
      'Itemized pre-tax deductions and net take-home summaries',
      'Role-scoped employee self-service access',
    ],
  },
];

const CORE_MODULES = [
  {
    icon: LayoutDashboard,
    category: 'CORE INTELLIGENCE',
    title: 'CEO Command Center',
    description:
      'Unified executive dashboard with Monthly Revenue Velocity, annual revenue goal ring, cash flow, gross margin, sales funnel, and live operational health.',
    bullets: ['Multi-Dashboard custom views', 'Live P&L & MRR telemetry', 'Executive connected module strip'],
  },
  {
    icon: Upload,
    category: 'CRM & LEAD ENGINE',
    title: 'Leads, Bulk Upload & Custom Stages',
    description:
      'Capture, score, and import thousands of leads via CSV, TSV, or JSON. Create custom color-coded pipeline stages on the fly during bulk upload or lead creation.',
    bullets: ['1-click Bulk CSV/JSON Lead Upload', 'Dynamic custom stage builder', 'Public embeddable lead capture forms'],
  },
  {
    icon: GitFork,
    category: 'SALES VELOCITY',
    title: 'Visual Pipeline, Deals & Contacts',
    description:
      'Interactive Kanban deal board, probability-weighted revenue forecasting, AI Deal Advisor, 360° Contact & Company records, and scheduled follow-ups.',
    bullets: ['Drag-and-drop Kanban stages', 'AI Deal & Follow-up Copilot', 'Bulk stage movement & CSV export'],
  },
  {
    icon: FolderKanban,
    category: 'DELIVERY & OPERATIONS',
    title: 'Projects, Sprint Tasks & Calendar',
    description:
      'Track client deliverables, sprint tasks, deadlines, team workload, calendar events, billable time logs, personal to-dos/notes, and encrypted client documents.',
    bullets: ['Project budget & milestone tracking', 'Time Tracking & Document Vault', 'Automated task & event notifications'],
  },
  {
    icon: Receipt,
    category: 'FINANCIAL SUITE',
    title: 'Invoices, Proposals, Quotes & P&L',
    description:
      'End-to-end commercial billing from Proposals, Quotations, and Contracts to itemized Invoices, Expense tracking, multi-gateway Payments, and Profit & Loss reports.',
    bullets: ['Invoices, Proposals, Quotes & Contracts', 'Live Expense & Payment ledger', 'Automated Profit & Loss statements'],
  },
  {
    icon: Banknote,
    category: 'PEOPLE & PAYROLL',
    title: 'Team Directory, Attendance & Payroll',
    description:
      'Complete HRM suite featuring department rosters, daily attendance, leave approvals, job requisitions, payroll cycles, reimbursements, and official E-Paystubs.',
    bullets: ['Attendance, Leaves & Recruitment', 'Automated Payroll & Reimbursements', 'Official PDF E-Paystub generator'],
  },
  {
    icon: Bot,
    category: 'AI & MARKETING',
    title: 'AI Automation, Templates & Workflows',
    description:
      'Accelerate outreach with ready-to-use Email & WhatsApp templates, social media scheduling, autonomous AI agents, and rule-based workflow automations.',
    bullets: ['Email & WhatsApp outreach templates', 'AI Agents & workflow builder', 'Inbound & outbound Webhooks'],
  },
  {
    icon: ShieldCheck,
    category: 'ENTERPRISE SECURITY',
    title: 'Granular RBAC & Data Isolation',
    description:
      'Role-based access control across 24 modules with All/Department/Own data scoping, security audit logs, password policies, and encrypted MongoDB persistence.',
    bullets: ['6 action permissions per module', 'Staff view impersonation & audit log', 'Password-protected Danger Zone reset'],
  },
];

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(SCREENSHOT_TABS[0].id);

  const loginPopoverRef = useRef<HTMLDivElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isLoginOpen) {
      setTimeout(() => emailInputRef.current?.focus(), 60);
    }
  }, [isLoginOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (loginPopoverRef.current && !loginPopoverRef.current.contains(e.target as Node)) {
        setIsLoginOpen(false);
      }
    };
    if (isLoginOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isLoginOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = login(email, password);
    if (!res.ok) {
      setError(res.error || 'Invalid User ID or password.');
    }
  };

  const currentScreen = SCREENSHOT_TABS.find((t) => t.id === activeTab) || SCREENSHOT_TABS[0];

  return (
    <div className="min-h-screen bg-[#060a14] text-slate-100 flex flex-col selection:bg-sky-500 selection:text-white">
      {/* =================================================================== */}
      {/* STICKY HEADER WITH BRAND LOGO & COMPACT SIDE LOGIN POPOVER          */}
      {/* =================================================================== */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#060a14]/85 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <a href="#top" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-black border border-sky-500/40 overflow-hidden shadow-lg shadow-sky-500/15 flex items-center justify-center shrink-0">
              <img
                src="/ozostack-logo.jpg"
                alt="OzoStack Logo"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-extrabold tracking-wider text-white leading-none">
                OZO STACK
              </span>
              <span className="text-[10px] font-semibold tracking-widest text-sky-400 uppercase mt-1">
                Business Operating System
              </span>
            </div>
          </a>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-300">
            <a href="#preview" className="hover:text-sky-400 transition-colors">
              Dashboard Preview
            </a>
            <a href="#features" className="hover:text-sky-400 transition-colors">
              Platform Modules
            </a>
            <a href="#screenshots" className="hover:text-sky-400 transition-colors">
              Live Screenshots
            </a>
            <a href="#security" className="hover:text-sky-400 transition-colors">
              Enterprise Security
            </a>
          </nav>

          {/* Compact Header Login Trigger + Popover */}
          <div className="relative" ref={loginPopoverRef}>
            <button
              type="button"
              onClick={() => {
                setIsLoginOpen((prev) => !prev);
                setError('');
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login</span>
            </button>

            {isLoginOpen && (
              <div className="absolute right-0 mt-2.5 w-80 sm:w-88 rounded-2xl bg-[#0d1424] border border-slate-700/90 shadow-2xl shadow-black/80 p-5 z-50 animate-fade-in">
                <div className="flex items-center justify-between pb-3 mb-3.5 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <img
                      src="/ozostack-logo.jpg"
                      alt="OzoStack"
                      className="w-7 h-7 rounded-lg object-cover border border-sky-500/30"
                    />
                    <div>
                      <h3 className="text-xs font-extrabold text-white tracking-wide">
                        Workspace Sign In
                      </h3>
                      <p className="text-[10px] text-slate-400">
                        Enter your User ID & password
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsLoginOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3" autoComplete="off">
                  {error && (
                    <div className="flex items-start gap-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-[11px] font-medium text-rose-300">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-400" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      User ID / Email
                    </label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        ref={emailInputRef}
                        type="text"
                        required
                        autoComplete="username"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setError('');
                        }}
                        placeholder="Enter User ID or Email"
                        className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-700 bg-slate-900/90 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type={showPw ? 'text' : 'password'}
                        required
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setError('');
                        }}
                        placeholder="Enter Password"
                        className="w-full pl-8 pr-9 py-2 rounded-xl border border-slate-700 bg-slate-900/90 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw(!showPw)}
                        className="absolute right-2.5 top-2 text-slate-400 hover:text-sky-400"
                        tabIndex={-1}
                      >
                        {showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-extrabold shadow-md shadow-sky-500/20 transition-all cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Sign In to Workspace</span>
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* =================================================================== */}
      {/* HERO SECTION                                                        */}
      {/* =================================================================== */}
      <section id="top" className="relative overflow-hidden pt-12 pb-16 sm:pt-16 sm:pb-20">
        {/* Ambient Background Glow */}
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-sky-500/15 blur-[130px] rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-4xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>AI-Powered CEO Command Center · CRM · Finance · HRM & Payroll</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.12]">
              Run Your Entire Company From One{' '}
              <span className="bg-gradient-to-r from-sky-400 via-cyan-300 to-indigo-400 bg-clip-text text-transparent">
                Intelligent Command Center
              </span>
            </h1>

            <p className="text-sm sm:text-base lg:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
              OzoStack unifies your Sales Pipeline, Bulk Lead Engine, Project & Sprint Delivery,
              Commercial Invoicing & P&amp;L, Automated Employee Payroll, and AI Business Copilot into a
              single high-velocity workspace.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  setIsLoginOpen(true);
                }}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-sm shadow-xl shadow-sky-500/25 transition-all cursor-pointer"
              >
                <span>Access Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="#features"
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 font-bold text-sm border border-slate-700/80 transition-all"
              >
                <span>Explore All 24 Modules</span>
                <ChevronRight className="w-4 h-4 text-sky-400" />
              </a>
            </div>

            {/* Key Platform Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 max-w-3xl mx-auto">
              {[
                { value: '24+', label: 'Integrated Business Modules' },
                { value: '1-Click', label: 'Bulk CSV/JSON Lead Import' },
                { value: '100%', label: 'Live MongoDB Cloud Sync' },
                { value: 'RBAC', label: 'Role & Department Isolation' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800/90 text-center"
                >
                  <div className="text-lg sm:text-xl font-extrabold text-sky-400">{stat.value}</div>
                  <div className="text-[11px] font-medium text-slate-400 mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* =================================================================== */}
          {/* INTERACTIVE LIVE DASHBOARD & MODULE SCREENSHOT SHOWCASE             */}
          {/* =================================================================== */}
          <div id="preview" className="mt-14 scroll-mt-20">
            <div className="rounded-3xl bg-[#0b1120] border border-slate-800/90 shadow-2xl overflow-hidden">
              {/* Screenshot Selector Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3.5 bg-[#0f172a] border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="ml-2 text-xs font-mono text-slate-400 hidden sm:inline">
                    https://ozostack.in — Live Workspace Preview
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {SCREENSHOT_TABS.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        activeTab === tab.id
                          ? 'bg-sky-500 text-slate-950 shadow-sm'
                          : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Screenshot Display + Context Sidebar */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-5 sm:p-7 items-center">
                <div className="lg:col-span-8 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-xl">
                  <img
                    src={currentScreen.image}
                    alt={currentScreen.title}
                    className="w-full h-auto object-cover block"
                  />
                </div>

                <div className="lg:col-span-4 space-y-4">
                  <span className="inline-block px-3 py-1 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-300 text-[11px] font-bold uppercase tracking-wider">
                    {currentScreen.badge}
                  </span>
                  <h3 className="text-xl font-extrabold text-white leading-snug">
                    {currentScreen.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {currentScreen.description}
                  </p>
                  <ul className="space-y-2.5 pt-1">
                    {currentScreen.highlights.map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-xs text-slate-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* COMPLETE 24-MODULE FEATURE ARCHITECTURE                             */}
      {/* =================================================================== */}
      <section id="features" className="py-16 sm:py-20 bg-[#080d1a] border-t border-slate-800/70 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
            <span className="text-xs font-extrabold uppercase tracking-widest text-sky-400">
              UNIFIED PLATFORM ARCHITECTURE
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
              Every Feature Your Business Needs to Scale
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Built for high-growth teams that want CRM, Project Delivery, Invoicing, HRM, Payroll, and AI
              Automation working together seamlessly without switching tools.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {CORE_MODULES.map((mod) => {
              const Icon = mod.icon;
              return (
                <div
                  key={mod.title}
                  className="rounded-2xl bg-[#0d1426] border border-slate-800/90 hover:border-sky-500/40 p-5 flex flex-col justify-between transition-all group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/25 flex items-center justify-center text-sky-400 group-hover:bg-sky-500 group-hover:text-slate-950 transition-colors">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
                        {mod.category}
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold text-white">{mod.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{mod.description}</p>
                  </div>

                  <ul className="space-y-1.5 pt-4 mt-4 border-t border-slate-800/80">
                    {mod.bullets.map((b) => (
                      <li key={b} className="flex items-center gap-2 text-[11px] font-medium text-slate-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* VISUAL SCREENSHOT GALLERY                                           */}
      {/* =================================================================== */}
      <section id="screenshots" className="py-16 sm:py-20 border-t border-slate-800/70 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-widest text-sky-400">
              INSIDE THE WORKSPACE
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
              Designed for Executive Clarity &amp; Daily Speed
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Real production screens from the OzoStack Command Center, Financial &amp; Operations strip,
              Automated Payroll Roster, and Digital E-Paystub engine.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl bg-[#0c1324] border border-slate-800 overflow-hidden shadow-xl flex flex-col">
              <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-white">
                    CEO Command Center &amp; AI Business Assistant
                  </h3>
                  <p className="text-xs text-slate-400">
                    Live revenue velocity, sales funnel, service breakdown &amp; AI risk alerts
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-400 text-[10px] font-bold">
                  Dashboard
                </span>
              </div>
              <img
                src="/assets/screen-dashboard.png"
                alt="OzoStack CEO Command Center Screenshot"
                className="w-full h-auto object-cover"
              />
            </div>

            <div className="rounded-2xl bg-[#0c1324] border border-slate-800 overflow-hidden shadow-xl flex flex-col">
              <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-white">
                    HRM Compensation Roster &amp; Automated Payroll
                  </h3>
                  <p className="text-xs text-slate-400">
                    Semi-monthly pay runs, tax compliance, deductions &amp; direct deposit status
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                  Payroll &amp; HR
                </span>
              </div>
              <img
                src="/assets/screen-payroll.png"
                alt="OzoStack Payroll Roster Screenshot"
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* ENTERPRISE SECURITY & WORKSPACE CONTROL                             */}
      {/* =================================================================== */}
      <section id="security" className="py-14 bg-[#080d1a] border-t border-slate-800/70 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-slate-900 border border-sky-500/25 p-6 sm:p-10 flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 text-xs font-extrabold text-sky-400 uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                <span>Enterprise-Grade Access &amp; Cloud Persistence</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-white">
                Strict Role-Based Permissions &amp; Real-Time Database Sync
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Every user account is scoped to only the modules and records assigned by your
                administrator. All leads, bulk uploads, custom stages, deals, payrolls, and workspace
                configurations are synchronized directly with your cloud database.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setIsLoginOpen(true);
              }}
              className="shrink-0 flex items-center gap-2 px-6 py-3.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-xs sm:text-sm shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In to OzoStack</span>
            </button>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* FOOTER                                                              */}
      {/* =================================================================== */}
      <footer className="mt-auto border-t border-slate-800/80 bg-[#050811] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/ozostack-logo.jpg"
              alt="OzoStack Logo"
              className="w-8 h-8 rounded-lg object-cover border border-sky-500/30"
            />
            <div>
              <span className="text-sm font-extrabold tracking-wider text-white">OZO STACK</span>
              <p className="text-[11px] text-slate-400">
                Automate. Innovate. Elevate. · Business Operating System
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} OzoStack Inc. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};
