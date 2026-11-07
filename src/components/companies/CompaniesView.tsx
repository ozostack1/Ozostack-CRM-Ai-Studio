import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Plus,
  Search,
  Filter,
  Download,
  LayoutGrid,
  LayoutList,
  Building2,
  Globe,
  MapPin,
  User,
  DollarSign,
  Activity,
  Tag,
  Edit2,
  Trash2,
  ExternalLink,
  ArrowUpDown,
  CheckSquare,
  Square,
  CheckCircle2,
  Briefcase,
  Users,
  ShieldCheck,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { Company, CompanyTier, CompanyStatus, CompanyActivity, Contact } from '../../types/crm';
import { INITIAL_COMPANIES, INITIAL_COMPANY_ACTIVITIES, INITIAL_CONTACTS } from '../../data/mockData';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useSystemCurrency } from '../../data/currencyService';
import { CompanyModal } from './CompanyModal';
import { CompanyDetailsDrawer } from './CompanyDetailsDrawer';

type CompanySortOption =
  | 'value-desc'
  | 'value-asc'
  | 'health-desc'
  | 'name-asc'
  | 'deals-desc';

export const CompaniesView: React.FC = () => {
  const { theme, setActiveNav } = useTheme();
  const { scopeFilter } = useAuth();
  const currency = useSystemCurrency();
  const isLight = theme === 'white-sky';

  // Companies, activities, & contacts state
  const [companies, setCompanies] = useState<Company[]>(INITIAL_COMPANIES);
  const visibleCompanies = useMemo(
    () => scopeFilter(companies, (c) => ({ owner: c.accountOwner })),
    [companies, scopeFilter]
  );
  const [activities, setActivities] = useState<CompanyActivity[]>(INITIAL_COMPANY_ACTIVITIES);
  const [contacts, setContacts] = useState<Contact[]>(INITIAL_CONTACTS);

  // View Mode: 'grid' | 'table'
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedOwner, setSelectedOwner] = useState<string>('all');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');
  const [sortBy, setSortBy] = useState<CompanySortOption>('value-desc');
  const [quickFilter, setQuickFilter] = useState<'all' | 'enterprise' | 'high_health' | 'active_client'>('all');

  // Multi-selection state
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([]);

  // Modal & Drawer state
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [companyToEdit, setCompanyToEdit] = useState<Company | null>(null);
  const [selectedDrawerCompany, setSelectedDrawerCompany] = useState<Company | null>(null);
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

  // Distinct lists for dropdown filters
  const industries = useMemo(() => {
    const set = new Set<string>();
    visibleCompanies.forEach((c) => set.add(c.industry));
    return Array.from(set);
  }, [visibleCompanies]);

  const owners = useMemo(() => {
    const set = new Set<string>();
    visibleCompanies.forEach((c) => set.add(c.accountOwner));
    return Array.from(set);
  }, [visibleCompanies]);

  // Executive Metrics
  const metrics = useMemo(() => {
    const total = visibleCompanies.length;
    const totalPipeline = visibleCompanies.reduce((acc, c) => acc + c.totalDealsValue, 0);
    const enterpriseCount = visibleCompanies.filter((c) => c.tier === 'Enterprise').length;
    const activeClientsCount = visibleCompanies.filter((c) => c.status === 'Active Client').length;
    const avgHealth =
      total > 0
        ? Math.round(visibleCompanies.reduce((acc, c) => acc + c.healthScore, 0) / total)
        : 0;

    return {
      total,
      totalPipeline,
      enterpriseCount,
      activeClientsCount,
      avgHealth,
    };
  }, [visibleCompanies]);

  // Filtered & Sorted Companies
  const filteredCompanies = useMemo(() => {
    const list = visibleCompanies.filter((c) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        c.name.toLowerCase().includes(q) ||
        c.industry.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q) ||
        (c.tags && c.tags.some((t) => t.toLowerCase().includes(q)));

      const matchesTier = selectedTier === 'all' || c.tier === selectedTier;
      const matchesStatus = selectedStatus === 'all' || c.status === selectedStatus;
      const matchesOwner = selectedOwner === 'all' || c.accountOwner === selectedOwner;
      const matchesIndustry = selectedIndustry === 'all' || c.industry === selectedIndustry;

      let matchesQuick = true;
      if (quickFilter === 'enterprise') matchesQuick = c.tier === 'Enterprise';
      else if (quickFilter === 'high_health') matchesQuick = c.healthScore >= 85;
      else if (quickFilter === 'active_client') matchesQuick = c.status === 'Active Client';

      return (
        matchesSearch &&
        matchesTier &&
        matchesStatus &&
        matchesOwner &&
        matchesIndustry &&
        matchesQuick
      );
    });

    return list.sort((a, b) => {
      switch (sortBy) {
        case 'value-desc':
          return b.totalDealsValue - a.totalDealsValue;
        case 'value-asc':
          return a.totalDealsValue - b.totalDealsValue;
        case 'health-desc':
          return b.healthScore - a.healthScore;
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'deals-desc':
          return b.activeDealsCount - a.activeDealsCount;
        default:
          return 0;
      }
    });
  }, [
    visibleCompanies,
    searchQuery,
    selectedTier,
    selectedStatus,
    selectedOwner,
    selectedIndustry,
    sortBy,
    quickFilter,
  ]);

  // Bulk actions
  const isAllSelected =
    filteredCompanies.length > 0 &&
    filteredCompanies.every((c) => selectedCompanyIds.includes(c.id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedCompanyIds([]);
    } else {
      setSelectedCompanyIds(filteredCompanies.map((c) => c.id));
    }
  };

  const handleToggleSelectCompany = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCompanyIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Delete ${selectedCompanyIds.length} selected companies?`)) {
      setCompanies((prev) => prev.filter((c) => !selectedCompanyIds.includes(c.id)));
      showToast(`${selectedCompanyIds.length} companies deleted.`);
      setSelectedCompanyIds([]);
    }
  };

  const handleBulkStatusChange = (newStatus: CompanyStatus) => {
    setCompanies((prev) =>
      prev.map((c) =>
        selectedCompanyIds.includes(c.id) ? { ...c, status: newStatus } : c
      )
    );
    showToast(`Updated ${selectedCompanyIds.length} companies to ${newStatus}.`);
    setSelectedCompanyIds([]);
  };

  // CRUD Operations
  const handleSaveCompany = (company: Company, initialContacts?: Partial<Contact>[]) => {
    if (companyToEdit) {
      setCompanies((prev) =>
        prev.map((c) => (c.id === company.id ? company : c))
      );
      if (selectedDrawerCompany?.id === company.id) {
        setSelectedDrawerCompany(company);
      }
      showToast(`Company profile "${company.name}" updated.`);
    } else {
      setCompanies((prev) => [company, ...prev]);
      showToast(`New company "${company.name}" registered.`);
    }

    if (initialContacts && initialContacts.length > 0) {
      handleAddContactsToCompany(company.id, company.name, initialContacts);
    }
  };

  const handleAddContactsToCompany = (
    companyId: string,
    companyName: string,
    newContactsList: Partial<Contact>[]
  ) => {
    const created: Contact[] = newContactsList.map((c, i) => ({
      id: `cont-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
      name: c.name || 'Stakeholder',
      email: c.email || '',
      phone: c.phone || '',
      whatsapp: c.phone || '',
      company: companyName,
      title: c.title || 'Stakeholder',
      roleType: c.roleType || 'Decision Maker',
      status: 'Customer',
      dealOwner: 'Sayed (CEO)',
      location: selectedDrawerCompany?.location || 'HQ',
      createdAt: new Date().toISOString().split('T')[0],
    }));

    setContacts((prev) => [...created, ...prev]);

    setCompanies((prev) =>
      prev.map((comp) =>
        comp.id === companyId
          ? { ...comp, contactsCount: comp.contactsCount + created.length }
          : comp
      )
    );

    if (selectedDrawerCompany && selectedDrawerCompany.id === companyId) {
      setSelectedDrawerCompany((prev) =>
        prev ? { ...prev, contactsCount: prev.contactsCount + created.length } : null
      );
    }

    showToast(`Added ${created.length} contact(s) to ${companyName}.`);
  };

  const handleDeleteContact = (contactId: string) => {
    const target = contacts.find((c) => c.id === contactId);
    setContacts((prev) => prev.filter((c) => c.id !== contactId));

    if (selectedDrawerCompany) {
      setCompanies((prev) =>
        prev.map((comp) =>
          comp.id === selectedDrawerCompany.id
            ? { ...comp, contactsCount: Math.max(0, comp.contactsCount - 1) }
            : comp
        )
      );
      setSelectedDrawerCompany((prev) =>
        prev ? { ...prev, contactsCount: Math.max(0, prev.contactsCount - 1) } : null
      );
    }

    showToast(`Contact "${target?.name || ''}" removed.`);
  };

  const handleDeleteMultipleContacts = (contactIds: string[]) => {
    setContacts((prev) => prev.filter((c) => !contactIds.includes(c.id)));

    if (selectedDrawerCompany) {
      setCompanies((prev) =>
        prev.map((comp) =>
          comp.id === selectedDrawerCompany.id
            ? { ...comp, contactsCount: Math.max(0, comp.contactsCount - contactIds.length) }
            : comp
        )
      );
      setSelectedDrawerCompany((prev) =>
        prev ? { ...prev, contactsCount: Math.max(0, prev.contactsCount - contactIds.length) } : null
      );
    }

    showToast(`Removed ${contactIds.length} contact(s).`);
  };

  const handleDeleteCompany = (companyId: string, companyName: string) => {
    setCompanies((prev) => prev.filter((c) => c.id !== companyId));
    showToast(`Company "${companyName}" removed.`);
    if (selectedDrawerCompany?.id === companyId) {
      setIsDrawerOpen(false);
      setSelectedDrawerCompany(null);
    }
  };

  const handleUpdateCompanyFromDrawer = (updated: Company) => {
    setCompanies((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c))
    );
    setSelectedDrawerCompany(updated);
  };

  const handleAddActivity = (
    companyId: string,
    type: CompanyActivity['type'],
    description: string
  ) => {
    const newAct: CompanyActivity = {
      id: `ca-${Date.now()}`,
      companyId,
      type,
      description,
      timestamp: 'Just now',
      author: 'Sayed (CEO)',
    };
    setActivities((prev) => [newAct, ...prev]);
    showToast('Activity note logged.');
  };

  // CSV Export
  const handleExportCSV = (selectedOnly = false) => {
    const listToExport = selectedOnly
      ? companies.filter((c) => selectedCompanyIds.includes(c.id))
      : filteredCompanies;

    const headers = [
      'Company Name',
      'Industry',
      'Tier',
      'Status',
      'Size',
      'Location',
      'Account Owner',
      'Total Pipeline Value',
      'Active Deals',
      'Health Score',
      'Website',
      'Phone',
      'Email',
    ];

    const rows = listToExport.map((c) => [
      `"${c.name}"`,
      `"${c.industry}"`,
      `"${c.tier}"`,
      `"${c.status}"`,
      `"${c.size}"`,
      `"${c.location}"`,
      `"${c.accountOwner}"`,
      c.totalDealsValue,
      c.activeDealsCount,
      `${c.healthScore}%`,
      `"${c.website || ''}"`,
      `"${c.phone || ''}"`,
      `"${c.email || ''}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Companies_Directory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Exported ${listToExport.length} company records.`);
  };

  const getTierColor = (t: CompanyTier) => {
    switch (t) {
      case 'Enterprise':
        return 'bg-purple-500/15 text-purple-600 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'Mid-Market':
        return 'bg-sky-500/15 text-sky-600 dark:text-sky-300 border-sky-200 dark:border-sky-800';
      case 'Startup':
        return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
    }
  };

  const getStatusColor = (s: CompanyStatus) => {
    switch (s) {
      case 'Active Client':
        return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400';
      case 'Prospect':
        return 'bg-sky-500/15 text-sky-600 dark:text-sky-400';
      case 'Partner':
        return 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400';
      case 'Churned':
        return 'bg-rose-500/15 text-rose-600 dark:text-rose-400';
    }
  };

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
              <span>Companies & Institutional Accounts</span>
              <span className="text-xs bg-sky-500/15 text-sky-600 dark:text-sky-400 font-bold px-2 py-0.5 rounded-full">
                {companies.length} Accounts
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Total Account Pipeline: <span className="font-bold text-emerald-500">{currency.symbol}{metrics.totalPipeline.toLocaleString()}</span> · Enterprise Accounts: <span className="font-bold text-purple-500">{metrics.enterpriseCount}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={() => handleExportCSV(false)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${
              isLight
                ? 'bg-white border-sky-200 text-slate-700 hover:bg-sky-50'
                : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
            }`}
            title="Download CSV Accounts Directory"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Export CSV</span>
          </button>

          <button
            onClick={() => {
              setCompanyToEdit(null);
              setIsCompanyModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-sky-500 hover:bg-sky-600 text-white shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Company</span>
          </button>
        </div>
      </div>

      {/* 2. SENIOR EXECUTIVE KPI RIBBON */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Accounts */}
        <div
          onClick={() => setQuickFilter('all')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            quickFilter === 'all'
              ? 'ring-2 ring-sky-500 border-sky-400 shadow-md'
              : 'hover:border-sky-300'
          } ${cardBg}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Directory
            </span>
            <div className="p-1.5 rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-400">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-extrabold text-slate-800 dark:text-white tabular-nums">
              {metrics.total}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">accounts</span>
          </div>
        </div>

        {/* Active Pipeline */}
        <div
          onClick={() => setQuickFilter('all')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer hover:border-emerald-300 ${cardBg}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Combined Pipeline
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-extrabold text-emerald-500 tabular-nums">
              {currency.symbol}{metrics.totalPipeline.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">total deals</span>
          </div>
        </div>

        {/* Enterprise Accounts */}
        <div
          onClick={() => setQuickFilter(quickFilter === 'enterprise' ? 'all' : 'enterprise')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            quickFilter === 'enterprise'
              ? 'ring-2 ring-purple-500 border-purple-400 shadow-md'
              : 'hover:border-purple-300'
          } ${cardBg}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Enterprise Accounts
            </span>
            <div className="p-1.5 rounded-lg bg-purple-500/15 text-purple-600 dark:text-purple-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-extrabold text-purple-600 dark:text-purple-300 tabular-nums">
              {metrics.enterpriseCount}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              ({metrics.total > 0 ? Math.round((metrics.enterpriseCount / metrics.total) * 100) : 0}%)
            </span>
          </div>
        </div>

        {/* Avg Health Score */}
        <div
          onClick={() => setQuickFilter(quickFilter === 'high_health' ? 'all' : 'high_health')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            quickFilter === 'high_health'
              ? 'ring-2 ring-emerald-500 border-emerald-400 shadow-md'
              : 'hover:border-emerald-300'
          } ${cardBg}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Average Health
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-extrabold text-emerald-500 tabular-nums">
              {metrics.avgHealth}%
            </span>
            <span className="text-[11px] text-slate-400 font-medium">relationship index</span>
          </div>
        </div>
      </div>

      {/* 3. CONTROL TOOLBAR */}
      <div className={`p-3.5 rounded-xl border flex flex-col lg:flex-row gap-3 items-center justify-between ${cardBg}`}>
        {/* Search */}
        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search company, industry, location..."
            className={`w-full text-xs pl-9 pr-3 py-2 rounded-lg border outline-none font-medium ${
              isLight
                ? 'bg-sky-50/40 border-sky-200 text-slate-800 focus:border-sky-500'
                : 'bg-slate-900 border-slate-700 text-white focus:border-sky-400'
            }`}
          />
        </div>

        {/* Filters & Controls */}
        <div className="flex items-center gap-2 w-full lg:w-auto flex-wrap justify-end text-xs">
          {/* Industry Filter */}
          <select
            value={selectedIndustry}
            onChange={(e) => setSelectedIndustry(e.target.value)}
            className={`text-xs px-2.5 py-1.5 rounded-lg border outline-none font-medium cursor-pointer ${
              isLight ? 'bg-white border-sky-200 text-slate-700' : 'bg-slate-800 border-slate-700 text-slate-200'
            }`}
          >
            <option value="all">All Industries</option>
            {industries.map((ind) => (
              <option key={ind} value={ind}>
                {ind}
              </option>
            ))}
          </select>

          {/* Tier Filter */}
          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value)}
            className={`text-xs px-2.5 py-1.5 rounded-lg border outline-none font-medium cursor-pointer ${
              isLight ? 'bg-white border-sky-200 text-slate-700' : 'bg-slate-800 border-slate-700 text-slate-200'
            }`}
          >
            <option value="all">All Tiers</option>
            <option value="Enterprise">Enterprise</option>
            <option value="Mid-Market">Mid-Market</option>
            <option value="Startup">Startup</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className={`text-xs px-2.5 py-1.5 rounded-lg border outline-none font-medium cursor-pointer ${
              isLight ? 'bg-white border-sky-200 text-slate-700' : 'bg-slate-800 border-slate-700 text-slate-200'
            }`}
          >
            <option value="all">All Statuses</option>
            <option value="Active Client">Active Client</option>
            <option value="Prospect">Prospect</option>
            <option value="Partner">Partner</option>
            <option value="Churned">Churned</option>
          </select>

          {/* Account Owner Filter */}
          <select
            value={selectedOwner}
            onChange={(e) => setSelectedOwner(e.target.value)}
            className={`text-xs px-2.5 py-1.5 rounded-lg border outline-none font-medium cursor-pointer ${
              isLight ? 'bg-white border-sky-200 text-slate-700' : 'bg-slate-800 border-slate-700 text-slate-200'
            }`}
          >
            <option value="all">All Owners</option>
            {owners.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 pl-1">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as CompanySortOption)}
              className={`text-xs px-2.5 py-1.5 rounded-lg border outline-none font-medium cursor-pointer ${
                isLight ? 'bg-white border-sky-200 text-slate-700' : 'bg-slate-800 border-slate-700 text-slate-200'
              }`}
            >
              <option value="value-desc">Highest Pipeline</option>
              <option value="value-asc">Lowest Pipeline</option>
              <option value="health-desc">Highest Health</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="deals-desc">Active Deals Count</option>
            </select>
          </div>

          {/* View Toggle */}
          <div className="flex items-center p-0.5 rounded-lg border border-sky-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-sky-500 text-white shadow-2xs'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Grid Cards View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'table'
                  ? 'bg-sky-500 text-white shadow-2xs'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Table Directory View"
            >
              <LayoutList className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. FLOATING BULK ACTIONS BAR */}
      {selectedCompanyIds.length > 0 && (
        <div className="p-3 rounded-xl border border-sky-300 bg-sky-50 dark:bg-slate-800/90 dark:border-sky-500/30 text-xs shadow-md animate-fade-in flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sky-700 dark:text-sky-300 px-2 py-0.5 rounded-md bg-sky-500/10">
              {selectedCompanyIds.length} Accounts Selected
            </span>
            <button
              onClick={() => setSelectedCompanyIds([])}
              className="text-slate-400 hover:text-slate-600 text-xs underline"
            >
              Deselect All
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
              <span>Set Status:</span>
              <button
                onClick={() => handleBulkStatusChange('Active Client')}
                className="px-2 py-1 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-semibold hover:text-emerald-500"
              >
                Active Client
              </button>
              <button
                onClick={() => handleBulkStatusChange('Prospect')}
                className="px-2 py-1 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-semibold hover:text-sky-500"
              >
                Prospect
              </button>
              <button
                onClick={() => handleBulkStatusChange('Partner')}
                className="px-2 py-1 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-semibold hover:text-indigo-500"
              >
                Partner
              </button>
            </div>

            <button
              onClick={() => handleExportCSV(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-500 text-white font-bold hover:bg-sky-600 shadow-xs"
            >
              <Download className="w-3 h-3" />
              <span>Export Selected</span>
            </button>

            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-500 text-white font-bold hover:bg-rose-600 shadow-xs"
            >
              <Trash2 className="w-3 h-3" />
              <span>Delete Selected</span>
            </button>
          </div>
        </div>
      )}

      {/* 5. VIEW 1: GRID VIEW */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {filteredCompanies.map((company) => {
            const isSelected = selectedCompanyIds.includes(company.id);

            return (
              <div
                key={company.id}
                onClick={() => {
                  setSelectedDrawerCompany(company);
                  setIsDrawerOpen(true);
                }}
                className={`p-4 rounded-xl border transition-all duration-200 hover:shadow-md cursor-pointer group flex flex-col justify-between ${
                  isSelected
                    ? 'border-sky-400 bg-sky-50/40 dark:bg-sky-950/20 ring-1 ring-sky-400'
                    : cardBg
                }`}
              >
                <div>
                  {/* Top: Selection checkbox, Tier, and Status */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleToggleSelectCompany(company.id, e)}
                        className="text-slate-400 hover:text-sky-500 transition-colors"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-sky-500" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                        )}
                      </button>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getTierColor(company.tier)}`}>
                        {company.tier}
                      </span>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getStatusColor(company.status)}`}>
                      {company.status}
                    </span>
                  </div>

                  {/* Company Name & Industry */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-400 to-indigo-600 text-white flex items-center justify-center font-extrabold text-sm shadow-xs shrink-0">
                      {company.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-sky-500 transition-colors truncate">
                        {company.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {company.industry}
                      </p>
                    </div>
                  </div>

                  {/* Location & Website */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-3 pt-2 border-t border-sky-100/30">
                    <span className="flex items-center gap-1 truncate max-w-[65%]">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{company.location}</span>
                    </span>
                    {company.website && (
                      <a
                        href={company.website}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-sky-500 hover:underline flex items-center gap-0.5 shrink-0"
                        title={company.website}
                      >
                        <Globe className="w-3 h-3" />
                        <span>Domain</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>

                  {/* Health Score Gauge */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-[10px] font-bold mb-1">
                      <span className="text-slate-400 uppercase">Health Score</span>
                      <span
                        className={
                          company.healthScore >= 85
                            ? 'text-emerald-500'
                            : company.healthScore >= 70
                            ? 'text-amber-500'
                            : 'text-rose-500'
                        }
                      >
                        {company.healthScore}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          company.healthScore >= 85
                            ? 'bg-emerald-500'
                            : company.healthScore >= 70
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${company.healthScore}%` }}
                      />
                    </div>
                  </div>

                  {/* Pipeline & Active Deals */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-sky-50/40 dark:bg-slate-800/40 text-xs mb-3">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Pipeline</span>
                      <span className="font-extrabold text-emerald-500 tabular-nums">
                        {currency.symbol}{company.totalDealsValue.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Deals</span>
                      <span className="font-bold text-sky-600 dark:text-sky-400 tabular-nums">
                        {company.activeDealsCount} Active
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer: Owner and Edit/Delete */}
                <div className="pt-2 border-t border-sky-100/30 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium truncate">
                    <User className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{company.accountOwner}</span>
                  </span>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCompanyToEdit(company);
                        setIsCompanyModalOpen(true);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors"
                      title="Edit Profile"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete ${company.name}?`)) {
                          handleDeleteCompany(company.id, company.name);
                        }
                      }}
                      className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                      title="Delete Company"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 6. VIEW 2: TABLE VIEW */}
      {viewMode === 'table' && (
        <div className={`rounded-xl border overflow-hidden ${cardBg}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-sky-100/40 bg-sky-50/30 dark:bg-slate-800/50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-3 w-10">
                    <button
                      onClick={handleToggleSelectAll}
                      className="text-slate-400 hover:text-sky-500 transition-colors"
                    >
                      {isAllSelected ? (
                        <CheckSquare className="w-4 h-4 text-sky-500" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-3">Company Name</th>
                  <th className="py-3 px-3">Industry & Tier</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Pipeline Value</th>
                  <th className="py-3 px-3">Active Deals</th>
                  <th className="py-3 px-3">Health</th>
                  <th className="py-3 px-3">Account Owner</th>
                  <th className="py-3 px-3">Location</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-100/20 dark:divide-slate-800">
                {filteredCompanies.map((company) => {
                  const isSelected = selectedCompanyIds.includes(company.id);

                  return (
                    <tr
                      key={company.id}
                      onClick={() => {
                        setSelectedDrawerCompany(company);
                        setIsDrawerOpen(true);
                      }}
                      className={`hover:bg-sky-50/40 dark:hover:bg-slate-800/40 transition-colors cursor-pointer ${
                        isSelected ? 'bg-sky-50/50 dark:bg-sky-950/20' : ''
                      }`}
                    >
                      <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleToggleSelectCompany(company.id, e)}
                          className="text-slate-400 hover:text-sky-500 transition-colors"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-sky-500" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                          )}
                        </button>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-300 font-bold flex items-center justify-center text-xs shrink-0">
                            {company.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 dark:text-white hover:text-sky-500 transition-colors block">
                              {company.name}
                            </span>
                            {company.website && (
                              <span className="text-[10px] text-slate-400">
                                {company.website.replace('https://', '')}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="space-y-0.5">
                          <span className="text-slate-700 dark:text-slate-200 block font-medium">
                            {company.industry}
                          </span>
                          <span className={`inline-block text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${getTierColor(company.tier)}`}>
                            {company.tier}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getStatusColor(company.status)}`}>
                          {company.status}
                        </span>
                      </td>

                      <td className="py-3 px-3 font-extrabold text-emerald-500 tabular-nums">
                        {currency.symbol}{company.totalDealsValue.toLocaleString()}
                      </td>

                      <td className="py-3 px-3 font-semibold text-slate-700 dark:text-slate-200 tabular-nums">
                        {company.activeDealsCount} Deals
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`font-bold tabular-nums ${
                            company.healthScore >= 85
                              ? 'text-emerald-500'
                              : company.healthScore >= 70
                              ? 'text-amber-500'
                              : 'text-rose-500'
                          }`}
                        >
                          {company.healthScore}%
                        </span>
                      </td>

                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                        {company.accountOwner}
                      </td>

                      <td className="py-3 px-3 text-slate-400">
                        {company.location}
                      </td>

                      <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setSelectedDrawerCompany(company);
                              setIsDrawerOpen(true);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors"
                            title="Inspect Details"
                          >
                            <Building2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setCompanyToEdit(company);
                              setIsCompanyModalOpen(true);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors"
                            title="Edit Profile"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete ${company.name}?`)) {
                                handleDeleteCompany(company.id, company.name);
                              }
                            }}
                            className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                            title="Delete Company"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredCompanies.length === 0 && (
            <div className="text-center py-12">
              <Building2 className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-60" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
                No matching companies found
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Try adjusting your search criteria or clear the filters.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedTier('all');
                  setSelectedStatus('all');
                  setSelectedOwner('all');
                  setSelectedIndustry('all');
                  setQuickFilter('all');
                }}
                className="mt-3 px-3 py-1.5 text-xs font-semibold text-sky-600 bg-sky-50 dark:bg-slate-800 rounded-lg hover:underline"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* 7. MODALS & DRAWERS */}
      {/* Side Details Drawer */}
      <CompanyDetailsDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedDrawerCompany(null);
        }}
        company={selectedDrawerCompany}
        onEdit={(comp) => {
          setIsDrawerOpen(false);
          setCompanyToEdit(comp);
          setIsCompanyModalOpen(true);
        }}
        onDelete={handleDeleteCompany}
        onUpdateCompany={handleUpdateCompanyFromDrawer}
        activities={activities}
        onAddActivity={handleAddActivity}
        contacts={contacts}
        onAddContacts={handleAddContactsToCompany}
        onDeleteContact={handleDeleteContact}
        onDeleteMultipleContacts={handleDeleteMultipleContacts}
      />

      {/* Create / Edit Company Modal */}
      <CompanyModal
        isOpen={isCompanyModalOpen}
        onClose={() => setIsCompanyModalOpen(false)}
        onSave={handleSaveCompany}
        companyToEdit={companyToEdit}
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

