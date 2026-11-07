import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  LayoutGrid,
  LayoutList,
  User,
  Building,
  Mail,
  Phone,
  MessageSquare,
  Linkedin,
  MapPin,
  DollarSign,
  Tag,
  Edit2,
  Trash2,
  ShieldCheck,
  Award,
  Users,
  CheckCircle2,
  Briefcase,
  ExternalLink,
  ArrowUpDown,
  CheckSquare,
  Square,
  X,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { Contact, ContactRoleType, ContactStatus, ContactActivity, Lead } from '../../types/crm';
import { INITIAL_CONTACTS, INITIAL_CONTACT_ACTIVITIES } from '../../data/mockData';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useSystemCurrency } from '../../data/currencyService';
import { ContactModal } from './ContactModal';
import { ContactDetailsDrawer } from './ContactDetailsDrawer';
import { ImportContactsModal } from './ImportContactsModal';
import { LeadActionModal, ContactActionType } from '../leads/LeadActionModal';

type SortOption =
  | 'name-asc'
  | 'name-desc'
  | 'value-desc'
  | 'value-asc'
  | 'company-asc'
  | 'recent';

const STORAGE_CONTACTS_KEY = 'ozostack_contacts_v1';
const loadContactsFromStorage = (): Contact[] => {
  try {
    const saved = localStorage.getItem(STORAGE_CONTACTS_KEY);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    /* fallback */
  }
  return INITIAL_CONTACTS;
};

export const ContactsView: React.FC = () => {
  const { theme, setActiveNav } = useTheme();
  const { scopeFilter } = useAuth();
  const currency = useSystemCurrency();
  const isLight = theme === 'white-sky';

  // Contacts state
  const [contacts, setContacts] = useState<Contact[]>(loadContactsFromStorage);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CONTACTS_KEY, JSON.stringify(contacts));
    } catch {}
  }, [contacts]);

  useEffect(() => {
    const onStorage = () => setContacts(loadContactsFromStorage());
    window.addEventListener('ozostack-contacts-changed', onStorage);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('ozostack-contacts-changed', onStorage);
      window.removeEventListener('storage', onStorage);
    };
  }, []);
  const visibleContacts = useMemo(
    () => scopeFilter(contacts, (c) => ({ owner: c.dealOwner })),
    [contacts, scopeFilter]
  );

  // Activities state
  const [activities, setActivities] = useState<ContactActivity[]>(INITIAL_CONTACT_ACTIVITIES);

  // View Mode: 'grid' | 'table'
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedOwner, setSelectedOwner] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('value-desc');

  // Multi-selection state
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);

  // Modal & Drawer states
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactToEdit, setContactToEdit] = useState<Contact | null>(null);
  const [selectedDrawerContact, setSelectedDrawerContact] = useState<Contact | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Direct Communication Modal (WhatsApp, Mail, Call)
  const [directLead, setDirectLead] = useState<Lead | null>(null);
  const [actionType, setActionType] = useState<ContactActionType>('whatsapp');
  const [isDirectActionOpen, setIsDirectActionOpen] = useState(false);
  const [activeActionContact, setActiveActionContact] = useState<Contact | null>(null);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const cardBg = isLight
    ? 'bg-white border-sky-100/90 shadow-xs'
    : 'bg-[#0f172a]/90 border-slate-800/80';

  // Metrics
  const metrics = useMemo(() => {
    const total = visibleContacts.length;
    const decisionMakers = visibleContacts.filter((c) => c.roleType === 'Decision Maker').length;
    const totalValue = visibleContacts.reduce((acc, c) => acc + (c.totalDealValue || 0), 0);
    const customers = visibleContacts.filter((c) => c.status === 'Customer').length;

    return {
      total,
      decisionMakers,
      decisionMakerPct: total > 0 ? Math.round((decisionMakers / total) * 100) : 0,
      totalValue,
      customers,
    };
  }, [visibleContacts]);

  // Filtered & Sorted Contacts
  const filteredContacts = useMemo(() => {
    const list = visibleContacts.filter((c) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        c.name.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        (c.tags && c.tags.some((t) => t.toLowerCase().includes(q)));

      const matchesRole = selectedRole === 'all' || c.roleType === selectedRole;
      const matchesStatus = selectedStatus === 'all' || c.status === selectedStatus;
      const matchesOwner =
        selectedOwner === 'all' || c.dealOwner.toLowerCase().includes(selectedOwner.toLowerCase());
      const matchesTag = !selectedTag || (c.tags && c.tags.includes(selectedTag));

      return matchesSearch && matchesRole && matchesStatus && matchesOwner && matchesTag;
    });

    // Sorting
    return list.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'value-desc':
          return (b.totalDealValue || 0) - (a.totalDealValue || 0);
        case 'value-asc':
          return (a.totalDealValue || 0) - (b.totalDealValue || 0);
        case 'company-asc':
          return a.company.localeCompare(b.company);
        case 'recent':
          return (b.createdAt || '').localeCompare(a.createdAt || '');
        default:
          return 0;
      }
    });
  }, [visibleContacts, searchQuery, selectedRole, selectedStatus, selectedOwner, selectedTag, sortBy]);

  // Select all toggle
  const isAllSelected =
    filteredContacts.length > 0 && selectedContactIds.length === filteredContacts.length;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedContactIds([]);
    } else {
      setSelectedContactIds(filteredContacts.map((c) => c.id));
    }
  };

  const handleToggleSelectContact = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedContactIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Open Direct Communication Modal
  const handleOpenDirectAction = (contact: Contact, type: ContactActionType, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveActionContact(contact);
    const leadAdapter: Lead = {
      id: contact.id,
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      whatsapp: (contact.whatsapp || contact.phone).replace(/[^0-9+]/g, ''),
      company: contact.company,
      title: contact.title,
      status: contact.status === 'Customer' ? 'Won' : 'Negotiation',
      priority: contact.roleType === 'Decision Maker' ? 'Hot' : 'Warm',
      value: contact.totalDealValue || 15000,
      source: 'LinkedIn',
      owner: contact.dealOwner,
      score: 90,
      createdAt: contact.createdAt,
      notes: contact.notes,
    };

    setDirectLead(leadAdapter);
    setActionType(type);
    setIsDirectActionOpen(true);
  };

  // Open 360° Drawer
  const handleOpenDrawer = (contact: Contact) => {
    setSelectedDrawerContact(contact);
    setIsDrawerOpen(true);
  };

  // Add Activity Log
  const handleAddActivity = (
    contactId: string,
    type: ContactActivity['type'],
    description: string
  ) => {
    const newActivity: ContactActivity = {
      id: `ca-${Date.now()}`,
      contactId,
      type,
      description,
      timestamp: 'Just now',
      author: 'Sayed (CEO)',
    };

    setActivities((prev) => [newActivity, ...prev]);

    // Update contact's lastInteraction
    setContacts((prev) =>
      prev.map((c) =>
        c.id === contactId
          ? {
              ...c,
              lastInteraction: `Just now · ${type.charAt(0).toUpperCase() + type.slice(1)}`,
            }
          : c
      )
    );

    if (selectedDrawerContact && selectedDrawerContact.id === contactId) {
      setSelectedDrawerContact((prev) =>
        prev
          ? {
              ...prev,
              lastInteraction: `Just now · ${type.charAt(0).toUpperCase() + type.slice(1)}`,
            }
          : null
      );
    }

    showToast(`Touchpoint logged: ${type.toUpperCase()}`);
  };

  // Save / Update contact
  const handleSaveContact = (saved: Contact) => {
    setContacts((prev) => {
      const next = contactToEdit
        ? prev.map((c) => (c.id === saved.id ? saved : c))
        : [saved, ...prev];
      try {
        localStorage.setItem(STORAGE_CONTACTS_KEY, JSON.stringify(next));
        window.dispatchEvent(new Event('ozostack-contacts-changed'));
      } catch {}
      return next;
    });

    if (contactToEdit) {
      if (selectedDrawerContact?.id === saved.id) {
        setSelectedDrawerContact(saved);
      }
      showToast(`Contact "${saved.name}" updated successfully.`);
    } else {
      showToast(`New contact "${saved.name}" added to directory.`);
    }
  };

  // Update contact directly from Drawer
  const handleUpdateContactFromDrawer = (updated: Contact) => {
    setContacts((prev) => {
      const next = prev.map((c) => (c.id === updated.id ? updated : c));
      try {
        localStorage.setItem(STORAGE_CONTACTS_KEY, JSON.stringify(next));
        window.dispatchEvent(new Event('ozostack-contacts-changed'));
      } catch {}
      return next;
    });
    setSelectedDrawerContact(updated);
  };

  // Delete contact
  const handleDeleteContact = (id: string, name: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (window.confirm(`Are you sure you want to remove "${name}" from contacts?`)) {
      setContacts((prev) => {
        const next = prev.filter((c) => c.id !== id);
        try {
          localStorage.setItem(STORAGE_CONTACTS_KEY, JSON.stringify(next));
          window.dispatchEvent(new Event('ozostack-contacts-changed'));
        } catch {}
        return next;
      });
      setSelectedContactIds((prev) => prev.filter((item) => item !== id));
      if (selectedDrawerContact?.id === id) {
        setIsDrawerOpen(false);
      }
      showToast(`Contact "${name}" deleted.`);
    }
  };

  // Batch delete
  const handleBatchDelete = () => {
    if (
      window.confirm(
        `Are you sure you want to delete ${selectedContactIds.length} selected contacts?`
      )
    ) {
      setContacts((prev) => {
        const next = prev.filter((c) => !selectedContactIds.includes(c.id));
        try {
          localStorage.setItem(STORAGE_CONTACTS_KEY, JSON.stringify(next));
          window.dispatchEvent(new Event('ozostack-contacts-changed'));
        } catch {}
        return next;
      });
      showToast(`${selectedContactIds.length} contacts deleted.`);
      setSelectedContactIds([]);
    }
  };

  // Batch status update
  const handleBatchStatusUpdate = (status: ContactStatus) => {
    setContacts((prev) =>
      prev.map((c) => (selectedContactIds.includes(c.id) ? { ...c, status } : c))
    );
    showToast(`Updated ${selectedContactIds.length} contacts to ${status}.`);
  };

  // Import contacts handler
  const handleImportContacts = (imported: Contact[]) => {
    setContacts((prev) => [...imported, ...prev]);
    showToast(`Successfully imported ${imported.length} enterprise contacts.`);
  };

  // Export CSV
  const handleExportCSV = (exportSelectedOnly = false) => {
    const listToExport = exportSelectedOnly
      ? contacts.filter((c) => selectedContactIds.includes(c.id))
      : filteredContacts;

    const headers = [
      'Contact ID',
      'Full Name',
      'Company',
      'Job Title',
      'Role Type',
      'Status',
      'Email',
      'Phone',
      'WhatsApp',
      'Account Owner',
      'Total Deal Value ($)',
      'Location',
      'Tags',
      'Notes',
    ];

    const rows = listToExport.map((c) => [
      c.id,
      `"${c.name.replace(/"/g, '""')}"`,
      `"${c.company.replace(/"/g, '""')}"`,
      `"${c.title.replace(/"/g, '""')}"`,
      c.roleType,
      c.status,
      c.email,
      c.phone,
      c.whatsapp || '',
      `"${c.dealOwner}"`,
      c.totalDealValue || 0,
      `"${c.location || ''}"`,
      `"${(c.tags || []).join('; ')}"`,
      `"${(c.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `enterprise-contacts-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${listToExport.length} contacts to CSV.`);
  };

  // Role Badge Styling
  const getRoleBadge = (role: ContactRoleType) => {
    switch (role) {
      case 'Decision Maker':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-300 border-purple-300/40';
      case 'Champion':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-300/40';
      case 'Technical Evaluator':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-300 border-blue-300/40';
      case 'Procurement':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-300/40';
      default:
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-300/40';
    }
  };

  // Status Badge Styling
  const getStatusBadge = (status: ContactStatus) => {
    switch (status) {
      case 'Customer':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-300/40';
      case 'Prospect':
        return 'bg-sky-500/10 text-sky-600 dark:text-sky-300 border-sky-300/40';
      case 'Partner':
        return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border-indigo-300/40';
      case 'Past Client':
        return 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-300/40';
    }
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white dark:bg-sky-500 dark:text-slate-950 font-medium text-xs shadow-xl animate-fade-in border border-slate-700 dark:border-sky-400">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-slate-950" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl border bg-gradient-to-r from-sky-500/10 via-sky-400/5 to-transparent border-sky-200/60 dark:border-sky-500/20 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveNav('Dashboard')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-sky-700 dark:text-sky-300 bg-white dark:bg-slate-800 border border-sky-200 dark:border-slate-700 shadow-xs hover:bg-sky-50 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Command Center</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-800 dark:text-white">
                Enterprise Contacts & Stakeholder Directory
              </h2>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-500/30">
                360° Directory
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Direct access to key account decision makers with instant WhatsApp, Email, Phone, and 360° profile analytics.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-colors ${
              isLight
                ? 'bg-white border-sky-200 text-slate-700 hover:bg-slate-50'
                : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
            }`}
          >
            <Upload className="w-3.5 h-3.5 text-sky-500" />
            <span>Import</span>
          </button>

          <button
            onClick={() => {
              setContactToEdit(null);
              setIsContactModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-sky-500 text-white hover:bg-sky-600 shadow-sm shadow-sky-500/20 active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Contact</span>
          </button>
        </div>
      </div>

      {/* Top Interactive Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div
          onClick={() => {
            setSelectedRole('all');
            setSelectedStatus('all');
            setSelectedTag(null);
            showToast('Showing all contacts.');
          }}
          className={`p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.01] ${cardBg} ${
            selectedRole === 'all' && selectedStatus === 'all'
              ? 'ring-2 ring-sky-500/40'
              : ''
          }`}
          title="Click to reset filters and view all stakeholders"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Stakeholders</span>
            <Users className="w-3.5 h-3.5 text-sky-500" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white tabular-nums">
            {metrics.total}
          </div>
          <div className="text-[10px] text-emerald-500 font-semibold mt-0.5">
            Across global enterprises • Click to view all
          </div>
        </div>

        <div
          onClick={() => {
            setSelectedRole('Decision Maker');
            showToast('Filtered by Decision Makers.');
          }}
          className={`p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.01] ${cardBg} ${
            selectedRole === 'Decision Maker' ? 'ring-2 ring-purple-500/40' : ''
          }`}
          title="Click to filter by Decision Makers"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">C-Suite & Decision Makers</span>
            <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
          </div>
          <div className="text-xl font-black text-purple-600 dark:text-purple-400 tabular-nums">
            {metrics.decisionMakers}
          </div>
          <div className="text-[10px] text-purple-600 dark:text-purple-300 font-semibold mt-0.5">
            {metrics.decisionMakerPct}% of directory • Click to filter
          </div>
        </div>

        <div
          onClick={() => {
            setSortBy('value-desc');
            showToast('Sorted by highest deal value.');
          }}
          className={`p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.01] ${cardBg} ${
            sortBy === 'value-desc' ? 'ring-2 ring-emerald-500/40' : ''
          }`}
          title="Click to sort by pipeline value"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Pipeline Attributed</span>
            <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
            {currency.symbol}{metrics.totalValue.toLocaleString()}
          </div>
          <div className="text-[10px] text-emerald-500 font-semibold mt-0.5">
            Active deal relationships • Click to sort
          </div>
        </div>

        <div
          onClick={() => {
            setSelectedStatus('Customer');
            showToast('Filtered by Active Customers.');
          }}
          className={`p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.01] ${cardBg} ${
            selectedStatus === 'Customer' ? 'ring-2 ring-amber-500/40' : ''
          }`}
          title="Click to filter by Active Customers"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Active Customers</span>
            <Award className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-xl font-black text-amber-600 dark:text-amber-400 tabular-nums">
            {metrics.customers} Accounts
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            High retention tier • Click to filter
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className={`p-4 rounded-xl border flex flex-col md:flex-row gap-3 items-center justify-between ${cardBg}`}>
        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full md:w-auto flex-1">
          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search contacts, companies, tags..."
              className={`w-full text-xs pl-9 pr-3 py-2 rounded-lg border outline-none ${
                isLight
                  ? 'bg-sky-50/40 border-sky-200 text-slate-800 focus:border-sky-500'
                  : 'bg-slate-900 border-slate-700 text-white focus:border-sky-400'
              }`}
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            {/* Role Filter */}
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className={`text-xs px-3 py-2 rounded-lg border outline-none font-medium ${
                isLight ? 'bg-white border-sky-200 text-slate-700' : 'bg-slate-900 border-slate-700 text-slate-300'
              }`}
            >
              <option value="all">All Roles</option>
              <option value="Decision Maker">Decision Maker</option>
              <option value="Champion">Champion</option>
              <option value="Technical Evaluator">Technical Evaluator</option>
              <option value="Procurement">Procurement</option>
              <option value="Influencer">Influencer</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className={`text-xs px-3 py-2 rounded-lg border outline-none font-medium ${
                isLight ? 'bg-white border-sky-200 text-slate-700' : 'bg-slate-900 border-slate-700 text-slate-300'
              }`}
            >
              <option value="all">All Statuses</option>
              <option value="Customer">Customer</option>
              <option value="Prospect">Prospect</option>
              <option value="Partner">Partner</option>
              <option value="Past Client">Past Client</option>
            </select>

            {/* Owner Filter */}
            <select
              value={selectedOwner}
              onChange={(e) => setSelectedOwner(e.target.value)}
              className={`text-xs px-3 py-2 rounded-lg border outline-none font-medium ${
                isLight ? 'bg-white border-sky-200 text-slate-700' : 'bg-slate-900 border-slate-700 text-slate-300'
              }`}
            >
              <option value="all">All Owners</option>
              <option value="Sayed">Sayed (CEO)</option>
              <option value="Amit">Amit Kumar</option>
              <option value="Neha">Neha Sharma</option>
              <option value="Rizwan">Rizwan Khan</option>
              <option value="Priya">Priya Singh</option>
              <option value="Vikram">Vikram Joshi</option>
            </select>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className={`text-xs px-3 py-2 rounded-lg border outline-none font-medium ${
                  isLight ? 'bg-white border-sky-200 text-slate-700' : 'bg-slate-900 border-slate-700 text-slate-300'
                }`}
              >
                <option value="value-desc">Value (High to Low)</option>
                <option value="value-asc">Value (Low to High)</option>
                <option value="name-asc">Name (A → Z)</option>
                <option value="name-desc">Name (Z → A)</option>
                <option value="company-asc">Company (A → Z)</option>
                <option value="recent">Recently Added</option>
              </select>
            </div>

            {/* Active Tag Filter Indicator */}
            {selectedTag && (
              <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-300 text-xs font-bold border border-sky-300/40">
                <span>#{selectedTag}</span>
                <button
                  onClick={() => setSelectedTag(null)}
                  className="hover:text-rose-500 ml-1 text-slate-400"
                  title="Clear tag filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* View Toggle & CSV Export */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <div className="flex items-center rounded-lg border p-0.5 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Grid Cards View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Table Directory View"
            >
              <LayoutList className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => handleExportCSV(false)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold ${
              isLight
                ? 'bg-slate-50 border-sky-200 text-slate-700 hover:bg-slate-100'
                : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
            } transition-colors`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Floating Batch Actions Bar (when contacts are selected) */}
      {selectedContactIds.length > 0 && (
        <div className="flex items-center justify-between p-3.5 rounded-xl border border-sky-300 bg-sky-50 dark:bg-slate-800/90 dark:border-sky-500/30 text-xs shadow-md animate-fade-in flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sky-700 dark:text-sky-300 px-2 py-0.5 rounded-md bg-sky-500/10">
              {selectedContactIds.length} Contacts Selected
            </span>
            <button
              onClick={() => setSelectedContactIds([])}
              className="text-slate-400 hover:text-slate-600 text-xs underline"
            >
              Deselect All
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
              <span>Set Status:</span>
              <button
                onClick={() => handleBatchStatusUpdate('Customer')}
                className="px-2 py-1 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-semibold hover:text-emerald-500"
              >
                Customer
              </button>
              <button
                onClick={() => handleBatchStatusUpdate('Prospect')}
                className="px-2 py-1 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-semibold hover:text-sky-500"
              >
                Prospect
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
              onClick={handleBatchDelete}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-500 text-white font-bold hover:bg-rose-600 shadow-xs"
            >
              <Trash2 className="w-3 h-3" />
              <span>Delete Selected</span>
            </button>
          </div>
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContacts.length === 0 ? (
            <div className={`col-span-full p-8 text-center rounded-xl border ${cardBg}`}>
              <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                No contacts match your filters
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Try loosening search keywords or clearing role/status/tag filters.
              </p>
            </div>
          ) : (
            filteredContacts.map((c) => {
              const initials = c.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2);
              const isSelected = selectedContactIds.includes(c.id);

              return (
                <div
                  key={c.id}
                  onClick={() => handleOpenDrawer(c)}
                  className={`p-4 rounded-xl border transition-all hover:shadow-md cursor-pointer relative group flex flex-col justify-between ${
                    isSelected ? 'ring-2 ring-sky-500 border-sky-400' : ''
                  } ${
                    isLight
                      ? 'bg-white border-sky-100 hover:border-sky-300'
                      : 'bg-[#0f172a] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    {/* Top card row: Select, Avatar & Actions */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={(e) => handleToggleSelectContact(c.id, e)}
                          className="text-slate-300 hover:text-sky-500 transition-colors p-0.5"
                          title="Select Contact"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-sky-500" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                          )}
                        </button>

                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-xs shrink-0">
                          {initials}
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-900 dark:text-white line-clamp-1 group-hover:text-sky-600 transition-colors">
                            {c.name}
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                            {c.title}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setContactToEdit(c);
                            setIsContactModalOpen(true);
                          }}
                          className="p-1 rounded-md text-slate-400 hover:text-sky-600 dark:hover:text-sky-400"
                          title="Edit Contact"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteContact(c.id, c.name, e)}
                          className="p-1 rounded-md text-slate-400 hover:text-rose-600"
                          title="Delete Contact"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Company and Location */}
                    <div className="space-y-1 mb-3 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200 font-semibold">
                        <Building className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                        <span className="line-clamp-1">{c.company}</span>
                      </div>
                      {c.location && (
                        <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{c.location}</span>
                        </div>
                      )}
                    </div>

                    {/* Role & Status Badges */}
                    <div className="flex items-center gap-1.5 flex-wrap mb-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getRoleBadge(c.roleType)}`}>
                        {c.roleType}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(c.status)}`}>
                        {c.status}
                      </span>
                      {c.totalDealValue && c.totalDealValue > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-300/40 tabular-nums">
                          {currency.symbol}{c.totalDealValue.toLocaleString()}
                        </span>
                      )}
                    </div>

                    {/* Tags */}
                    {c.tags && c.tags.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap mb-3">
                        {c.tags.slice(0, 3).map((t) => (
                          <button
                            key={t}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTag(t);
                              showToast(`Filtered by #${t}`);
                            }}
                            className="px-1.5 py-0.5 rounded text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold hover:bg-sky-50 hover:text-sky-600 dark:hover:text-sky-300 transition-colors"
                          >
                            #{t}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Recent Notes Snippet */}
                    {c.notes && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 italic line-clamp-2 mb-3 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                        "{c.notes}"
                      </p>
                    )}
                  </div>

                  {/* Direct Contact Action Bar */}
                  <div className="pt-3 border-t border-sky-100/40 dark:border-slate-800 flex items-center justify-between gap-2">
                    <div className="text-[10px] text-slate-400">
                      Owner: <span className="font-semibold text-slate-600 dark:text-slate-300">{c.dealOwner}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => handleOpenDirectAction(c, 'whatsapp', e)}
                        title={`WhatsApp ${c.name} (${c.whatsapp || c.phone})`}
                        className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>WhatsApp</span>
                      </button>

                      <button
                        onClick={(e) => handleOpenDirectAction(c, 'email', e)}
                        title={`Email ${c.email}`}
                        className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-sky-500/10 text-sky-600 hover:bg-sky-500 hover:text-white transition-all"
                      >
                        <Mail className="w-3 h-3" />
                        <span>Email</span>
                      </button>

                      <button
                        onClick={(e) => handleOpenDirectAction(c, 'call', e)}
                        title={`Call ${c.phone}`}
                        className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500 hover:text-white transition-all"
                      >
                        <Phone className="w-3 h-3" />
                        <span>Call</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Table View */
        <div className={`rounded-xl border overflow-hidden ${cardBg}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-sky-100/30 text-slate-400 font-bold uppercase text-[10px] bg-slate-50/50 dark:bg-slate-900/50">
                  <th className="py-2.5 px-3 w-8">
                    <button
                      onClick={handleToggleSelectAll}
                      className="text-slate-400 hover:text-sky-500 transition-colors"
                      title={isAllSelected ? 'Deselect All' : 'Select All'}
                    >
                      {isAllSelected ? (
                        <CheckSquare className="w-4 h-4 text-sky-500" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  </th>
                  <th className="py-2.5 px-4">Contact</th>
                  <th className="py-2.5 px-3">Company</th>
                  <th className="py-2.5 px-3">Role & Status</th>
                  <th className="py-2.5 px-3">Direct Contact Actions</th>
                  <th className="py-2.5 px-3">Owner</th>
                  <th className="py-2.5 px-3">Pipeline Value</th>
                  <th className="py-2.5 px-3">Location</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-100/20 dark:divide-slate-800">
                {filteredContacts.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      No contacts found matching the filters.
                    </td>
                  </tr>
                ) : (
                  filteredContacts.map((c) => {
                    const isSelected = selectedContactIds.includes(c.id);

                    return (
                      <tr
                        key={c.id}
                        onClick={() => handleOpenDrawer(c)}
                        className={`hover:bg-sky-500/5 transition-colors cursor-pointer ${
                          isSelected ? 'bg-sky-500/10' : ''
                        }`}
                      >
                        <td className="py-3 px-3">
                          <button
                            onClick={(e) => handleToggleSelectContact(c.id, e)}
                            className="text-slate-300 hover:text-sky-500 transition-colors"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-sky-500" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                            )}
                          </button>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900 dark:text-slate-100 hover:text-sky-600 transition-colors">
                            {c.name}
                          </div>
                          <div className="text-[11px] text-slate-400">{c.title}</div>
                        </td>

                        <td className="py-3 px-3">
                          <div className="font-medium text-slate-800 dark:text-slate-200">
                            {c.company}
                          </div>
                          <div className="text-[10px] text-slate-400">{c.email}</div>
                        </td>

                        <td className="py-3 px-3">
                          <div className="flex flex-col gap-1 items-start">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${getRoleBadge(c.roleType)}`}>
                              {c.roleType}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${getStatusBadge(c.status)}`}>
                              {c.status}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={(e) => handleOpenDirectAction(c, 'whatsapp', e)}
                              title={`WhatsApp ${c.whatsapp || c.phone}`}
                              className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-colors"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleOpenDirectAction(c, 'email', e)}
                              title={`Email ${c.email}`}
                              className="p-1.5 rounded-lg bg-sky-500/10 text-sky-600 hover:bg-sky-500 hover:text-white transition-colors"
                            >
                              <Mail className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleOpenDirectAction(c, 'call', e)}
                              title={`Call ${c.phone}`}
                              className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500 hover:text-white transition-colors"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                        <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                          {c.dealOwner}
                        </td>

                        <td className="py-3 px-3 font-bold text-slate-900 dark:text-white tabular-nums">
                          {currency.symbol}{(c.totalDealValue || 0).toLocaleString()}
                        </td>

                        <td className="py-3 px-3 text-slate-400 text-[11px]">
                          {c.location || '—'}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setContactToEdit(c);
                                setIsContactModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-slate-800"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteContact(c.id, c.name, e)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 360° Contact Profile Drawer */}
      <ContactDetailsDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        contact={selectedDrawerContact}
        onEdit={(contact) => {
          setIsDrawerOpen(false);
          setContactToEdit(contact);
          setIsContactModalOpen(true);
        }}
        onDelete={(id, name) => handleDeleteContact(id, name)}
        onUpdateContact={handleUpdateContactFromDrawer}
        onDirectAction={(contact, type) => handleOpenDirectAction(contact, type)}
        activities={activities}
        onAddActivity={handleAddActivity}
      />

      {/* Contact Creation / Editing Modal */}
      <ContactModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        onSave={handleSaveContact}
        contactToEdit={contactToEdit}
      />

      {/* Import Contacts Modal */}
      <ImportContactsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportContacts}
      />

      {/* Direct Communication Modal */}
      <LeadActionModal
        isOpen={isDirectActionOpen}
        onClose={() => {
          setIsDirectActionOpen(false);
          setActiveActionContact(null);
        }}
        lead={directLead}
        actionType={actionType}
        onLogActivity={(leadId, desc) => {
          if (activeActionContact) {
            handleAddActivity(activeActionContact.id, actionType as ContactActivity['type'], desc);
          } else {
            showToast(`Interaction logged: ${desc.slice(0, 40)}...`);
          }
        }}
      />
    </div>
  );
};
