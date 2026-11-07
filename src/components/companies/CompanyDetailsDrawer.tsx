import React, { useState } from 'react';
import {
  X,
  Building2,
  Globe,
  MapPin,
  User,
  DollarSign,
  Activity,
  Tag,
  Phone,
  Mail,
  Linkedin,
  Edit2,
  Trash2,
  Briefcase,
  Users,
  Send,
  ExternalLink,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Clock,
  Sparkles,
  CheckSquare,
  Square,
} from 'lucide-react';
import { Company, CompanyTier, CompanyStatus, CompanyActivity, Contact, ContactRoleType } from '../../types/crm';
import { INITIAL_DEALS } from '../../data/mockData';
import { useTheme } from '../../context/ThemeContext';
import { useSystemCurrency, formatMoney } from '../../data/currencyService';

interface DraftContactRow {
  id: string;
  name: string;
  title: string;
  roleType: ContactRoleType;
  email: string;
  phone: string;
}

const ROLE_OPTIONS: ContactRoleType[] = [
  'Decision Maker',
  'Champion',
  'Technical Evaluator',
  'Procurement',
  'Influencer',
];

interface CompanyDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  company: Company | null;
  onEdit: (company: Company) => void;
  onDelete: (companyId: string, companyName: string) => void;
  onUpdateCompany: (updated: Company) => void;
  activities: CompanyActivity[];
  onAddActivity: (companyId: string, type: CompanyActivity['type'], description: string) => void;
  contacts: Contact[];
  onAddContacts: (companyId: string, companyName: string, newContacts: Partial<Contact>[]) => void;
  onDeleteContact: (contactId: string) => void;
  onDeleteMultipleContacts: (contactIds: string[]) => void;
}

export const CompanyDetailsDrawer: React.FC<CompanyDetailsDrawerProps> = ({
  isOpen,
  onClose,
  company,
  onEdit,
  onDelete,
  onUpdateCompany,
  activities,
  onAddActivity,
  contacts,
  onAddContacts,
  onDeleteContact,
  onDeleteMultipleContacts,
}) => {
  const { theme } = useTheme();
  const currency = useSystemCurrency();
  const isLight = theme === 'white-sky';

  const [activeTab, setActiveTab] = useState<'overview' | 'contacts' | 'deals' | 'activity'>('overview');
  const [newActivityType, setNewActivityType] = useState<CompanyActivity['type']>('note');
  const [newActivityDesc, setNewActivityDesc] = useState('');

  // Contacts management state
  const [isAddingContacts, setIsAddingContacts] = useState(false);
  const [draftContacts, setDraftContacts] = useState<DraftContactRow[]>([
    { id: 'draft-1', name: '', title: '', roleType: 'Decision Maker', email: '', phone: '' },
  ]);
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);

  if (!isOpen || !company) return null;

  // Filter linked contacts & deals for this company
  const compNameLower = company.name.toLowerCase();
  const linkedContacts = contacts.filter((c) =>
    c.company.toLowerCase().includes(compNameLower) || compNameLower.includes(c.company.toLowerCase())
  );
  const linkedDeals = INITIAL_DEALS.filter((d) => {
    const dComp = (d.company || d.client || '').toLowerCase();
    return dComp.includes(compNameLower) || compNameLower.includes(dComp);
  });

  const companyActivities = activities.filter((a) => a.companyId === company.id);

  const handleAddActivitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActivityDesc.trim()) return;
    onAddActivity(company.id, newActivityType, newActivityDesc.trim());
    setNewActivityDesc('');
  };

  // Contacts Handlers
  const handleAddDraftRow = () => {
    setDraftContacts((prev) => [
      ...prev,
      {
        id: `draft-${Date.now()}-${Math.random()}`,
        name: '',
        title: '',
        roleType: 'Decision Maker',
        email: '',
        phone: '',
      },
    ]);
  };

  const handleRemoveDraftRow = (id: string) => {
    setDraftContacts((prev) => prev.filter((d) => d.id !== id));
  };

  const handleUpdateDraftRow = (
    id: string,
    field: keyof DraftContactRow,
    value: string
  ) => {
    setDraftContacts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, [field]: value } : d))
    );
  };

  const handleSaveAllDraftContacts = () => {
    const valid = draftContacts
      .filter((d) => d.name.trim().length > 0)
      .map((d) => ({
        name: d.name.trim(),
        title: d.title.trim() || 'Stakeholder',
        roleType: d.roleType,
        email: d.email.trim(),
        phone: d.phone.trim(),
      }));

    if (valid.length === 0) return;

    onAddContacts(company.id, company.name, valid);
    setDraftContacts([
      { id: 'draft-1', name: '', title: '', roleType: 'Decision Maker', email: '', phone: '' },
    ]);
    setIsAddingContacts(false);
  };

  const handleToggleSelectContact = (id: string) => {
    setSelectedContactIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const isAllContactsSelected =
    linkedContacts.length > 0 &&
    linkedContacts.every((c) => selectedContactIds.includes(c.id));

  const handleToggleSelectAllContacts = () => {
    if (isAllContactsSelected) {
      setSelectedContactIds([]);
    } else {
      setSelectedContactIds(linkedContacts.map((c) => c.id));
    }
  };

  const handleDeleteSelectedContacts = () => {
    if (
      window.confirm(
        `Are you sure you want to delete ${selectedContactIds.length} contact(s)?`
      )
    ) {
      onDeleteMultipleContacts(selectedContactIds);
      setSelectedContactIds([]);
    }
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
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div
          className={`w-screen max-w-xl shadow-2xl border-l flex flex-col ${
            isLight ? 'bg-white border-sky-100 text-slate-800' : 'bg-slate-900 border-slate-700 text-slate-100'
          }`}
        >
          {/* Header */}
          <div className="p-5 border-b border-sky-100/30 flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-sky-400 to-indigo-600 text-white flex items-center justify-center font-extrabold text-lg shadow-md shrink-0">
                {company.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {company.name}
                  </h2>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getTierColor(company.tier)}`}>
                    {company.tier}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getStatusColor(company.status)}`}>
                    {company.status}
                  </span>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5 flex-wrap">
                  <span>{company.industry}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    {company.location}
                  </span>
                  {company.website && (
                    <>
                      <span>•</span>
                      <a
                        href={company.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sky-500 hover:underline flex items-center gap-0.5 font-medium"
                      >
                        <Globe className="w-3 h-3" />
                        <span>Website</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => {
                  onClose();
                  onEdit(company);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors"
                title="Edit Company"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  if (confirm(`Delete ${company.name}?`)) {
                    onDelete(company.id, company.name);
                    onClose();
                  }
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                title="Delete Company"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Key Metrics Banner */}
          <div className="grid grid-cols-4 gap-2 px-5 py-3 border-b border-sky-100/30 bg-sky-50/30 dark:bg-slate-800/40 text-center">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Pipeline</span>
              <span className="text-xs font-bold text-emerald-500">
                {currency.symbol}{company.totalDealsValue.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Active Deals</span>
              <span className="text-xs font-bold text-sky-500">
                {linkedDeals.length > 0 ? linkedDeals.length : company.activeDealsCount}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Contacts</span>
              <span className="text-xs font-bold text-indigo-500">
                {linkedContacts.length > 0 ? linkedContacts.length : company.contactsCount}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Health Score</span>
              <span
                className={`text-xs font-bold ${
                  company.healthScore >= 85
                    ? 'text-emerald-500'
                    : company.healthScore >= 70
                    ? 'text-amber-500'
                    : 'text-rose-500'
                }`}
              >
                {company.healthScore}%
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center px-5 border-b border-sky-100/30 gap-6 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-3 border-b-2 transition-all ${
                activeTab === 'overview'
                  ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              Account Overview
            </button>
            <button
              onClick={() => setActiveTab('contacts')}
              className={`py-3 border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'contacts'
                  ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              <span>Contacts</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 font-bold">
                {linkedContacts.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('deals')}
              className={`py-3 border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'deals'
                  ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              <span>Deals</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 font-bold">
                {linkedDeals.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`py-3 border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'activity'
                  ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              <span>Timeline</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 font-bold">
                {companyActivities.length}
              </span>
            </button>
          </div>

          {/* Drawer Body Content */}
          <div className="flex-1 overflow-y-auto p-5 text-xs space-y-4">
            {/* TAB 1: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                {/* Account Details Card */}
                <div className={`p-4 rounded-xl border ${isLight ? 'bg-slate-50/70 border-sky-100' : 'bg-slate-800/40 border-slate-700'}`}>
                  <h3 className="font-bold text-xs text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-sky-500" />
                    Organization Intelligence
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Account Executive</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {company.accountOwner}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Company Scale</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
                        {company.size} employees
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Annual Revenue</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                        {company.annualRevenue ? formatMoney(company.annualRevenue, currency) : 'Confidential'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Client Since</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
                        {company.createdAt}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Direct Communications */}
                <div className={`p-4 rounded-xl border ${isLight ? 'bg-slate-50/70 border-sky-100' : 'bg-slate-800/40 border-slate-700'}`}>
                  <h3 className="font-bold text-xs text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-sky-500" />
                    Direct Organization Channels
                  </h3>
                  <div className="space-y-2 text-xs">
                    {company.phone && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[11px] flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          Central Office
                        </span>
                        <a href={`tel:${company.phone}`} className="font-semibold text-sky-600 hover:underline">
                          {company.phone}
                        </a>
                      </div>
                    )}
                    {company.email && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[11px] flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-slate-400" />
                          Corporate Email
                        </span>
                        <a href={`mailto:${company.email}`} className="font-semibold text-sky-600 hover:underline">
                          {company.email}
                        </a>
                      </div>
                    )}
                    {company.linkedIn && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[11px] flex items-center gap-1.5">
                          <Linkedin className="w-3 h-3 text-sky-600" />
                          LinkedIn Company
                        </span>
                        <a
                          href={company.linkedIn}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-sky-600 hover:underline flex items-center gap-1"
                        >
                          <span>View Profile</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Account Strategy Notes */}
                {company.notes && (
                  <div className={`p-4 rounded-xl border ${isLight ? 'bg-slate-50/70 border-sky-100' : 'bg-slate-800/40 border-slate-700'}`}>
                    <h3 className="font-bold text-xs text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Executive Strategy Notes
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-xs whitespace-pre-wrap">
                      {company.notes}
                    </p>
                  </div>
                )}

                {/* Account Tags */}
                {company.tags && company.tags.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-[11px] text-slate-400 uppercase mb-2">Account Tags</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {company.tags.map((t) => (
                        <span
                          key={t}
                          className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-300 border border-sky-200 dark:border-sky-800"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: CONTACTS */}
            {activeTab === 'contacts' && (
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      Key Stakeholders & Contacts ({linkedContacts.length})
                    </span>
                    {selectedContactIds.length > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400">
                        {selectedContactIds.length} Selected
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {selectedContactIds.length > 0 && (
                      <button
                        onClick={handleDeleteSelectedContacts}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-500 hover:bg-rose-600 text-white shadow-xs transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete Selected ({selectedContactIds.length})</span>
                      </button>
                    )}

                    <button
                      onClick={() => setIsAddingContacts((prev) => !prev)}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-sky-500 hover:bg-sky-600 text-white shadow-xs transition-colors"
                    >
                      {isAddingContacts ? (
                        <>
                          <X className="w-3 h-3" />
                          <span>Cancel</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3 h-3" />
                          <span>+ Add Contacts</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Inline Multiple Contacts Add Form */}
                {isAddingContacts && (
                  <div className={`p-3.5 rounded-xl border space-y-3 animate-fade-in ${isLight ? 'bg-sky-50/50 border-sky-200' : 'bg-slate-800/80 border-slate-700'}`}>
                    <div className="flex items-center justify-between border-b border-sky-100/40 pb-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-sky-500" />
                        Add Multiple Contacts to {company.name}
                      </span>
                      <button
                        onClick={() => setIsAddingContacts(false)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                      {draftContacts.map((draft, idx) => (
                        <div
                          key={draft.id}
                          className={`p-2.5 rounded-lg border space-y-2 relative ${
                            isLight ? 'bg-white border-sky-100 shadow-2xs' : 'bg-slate-900 border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400">
                              Contact #{idx + 1}
                            </span>
                            {draftContacts.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveDraftRow(draft.id)}
                                className="p-1 text-slate-400 hover:text-rose-500"
                                title="Remove this contact row"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <div>
                              <input
                                type="text"
                                required
                                value={draft.name}
                                onChange={(e) => handleUpdateDraftRow(draft.id, 'name', e.target.value)}
                                placeholder="Full Name *"
                                className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-transparent outline-none focus:border-sky-500"
                              />
                            </div>
                            <div>
                              <input
                                type="text"
                                value={draft.title}
                                onChange={(e) => handleUpdateDraftRow(draft.id, 'title', e.target.value)}
                                placeholder="Job Title (e.g. CTO, VP Ops)"
                                className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-transparent outline-none focus:border-sky-500"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                            <div>
                              <select
                                value={draft.roleType}
                                onChange={(e) => handleUpdateDraftRow(draft.id, 'roleType', e.target.value as ContactRoleType)}
                                className="w-full px-2 py-1.5 text-[11px] rounded border border-slate-200 dark:border-slate-700 bg-transparent outline-none cursor-pointer"
                              >
                                {ROLE_OPTIONS.map((r) => (
                                  <option key={r} value={r}>
                                    {r}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <input
                                type="email"
                                value={draft.email}
                                onChange={(e) => handleUpdateDraftRow(draft.id, 'email', e.target.value)}
                                placeholder="Email address"
                                className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-transparent outline-none focus:border-sky-500"
                              />
                            </div>
                            <div>
                              <input
                                type="text"
                                value={draft.phone}
                                onChange={(e) => handleUpdateDraftRow(draft.id, 'phone', e.target.value)}
                                placeholder="Phone / Mobile"
                                className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-transparent outline-none focus:border-sky-500"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleAddDraftRow}
                        className="flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded text-sky-600 hover:text-sky-700 dark:text-sky-400 hover:underline"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Add Another Contact Row</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsAddingContacts(false)}
                          className="px-3 py-1 text-xs rounded font-medium text-slate-500 hover:text-slate-700"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveAllDraftContacts}
                          className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-sky-500 hover:bg-sky-600 text-white shadow-xs transition-colors"
                        >
                          Save All Contacts
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Multi-select bar if contacts exist */}
                {linkedContacts.length > 0 && (
                  <div className="flex items-center justify-between py-1 text-[11px] text-slate-400 border-b border-sky-100/20">
                    <button
                      onClick={handleToggleSelectAllContacts}
                      className="flex items-center gap-1.5 hover:text-sky-500 transition-colors"
                    >
                      {isAllContactsSelected ? (
                        <CheckSquare className="w-3.5 h-3.5 text-sky-500" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      <span>{isAllContactsSelected ? 'Deselect All' : 'Select All Contacts'}</span>
                    </button>

                    {selectedContactIds.length > 0 && (
                      <span className="font-semibold text-rose-500">
                        {selectedContactIds.length} contact(s) selected
                      </span>
                    )}
                  </div>
                )}

                {/* Contact Cards List */}
                {linkedContacts.length > 0 ? (
                  linkedContacts.map((contact) => {
                    const isSelected = selectedContactIds.includes(contact.id);
                    return (
                      <div
                        key={contact.id}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                          isSelected
                            ? 'border-rose-300 bg-rose-50/40 dark:bg-rose-950/20 ring-1 ring-rose-400'
                            : isLight
                            ? 'bg-slate-50/70 border-sky-100'
                            : 'bg-slate-800/50 border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <button
                            onClick={() => handleToggleSelectContact(contact.id)}
                            className="text-slate-400 hover:text-sky-500 transition-colors"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-rose-500" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                            )}
                          </button>

                          <div className="w-8 h-8 rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-300 font-bold flex items-center justify-center text-xs shrink-0">
                            {contact.name.slice(0, 2).toUpperCase()}
                          </div>

                          <div className="min-w-0">
                            <h4 className="font-bold text-xs text-slate-800 dark:text-white truncate">
                              {contact.name}
                            </h4>
                            <p className="text-[11px] text-slate-400 truncate">
                              {contact.title} · <span className="font-medium text-sky-500">{contact.roleType}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {contact.email && (
                            <a
                              href={`mailto:${contact.email}`}
                              className="p-1 rounded text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-slate-700"
                              title={`Email ${contact.name}`}
                            >
                              <Mail className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {contact.phone && (
                            <a
                              href={`tel:${contact.phone}`}
                              className="p-1 rounded text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-slate-700"
                              title={`Call ${contact.name}`}
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            onClick={() => {
                              if (confirm(`Delete contact "${contact.name}"?`)) {
                                onDeleteContact(contact.id);
                              }
                            }}
                            className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-700 transition-colors"
                            title={`Delete ${contact.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <Users className="w-6 h-6 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">No registered contacts associated with this company yet.</p>
                    <button
                      onClick={() => setIsAddingContacts(true)}
                      className="mt-3 px-3 py-1.5 text-xs font-semibold text-sky-600 bg-sky-50 dark:bg-slate-800 rounded-lg hover:underline inline-flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Contacts Now</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: DEALS */}
            {activeTab === 'deals' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    Commercial Pipeline & Opportunities ({linkedDeals.length})
                  </span>
                </div>

                {linkedDeals.length > 0 ? (
                  linkedDeals.map((deal) => (
                    <div
                      key={deal.id}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                        isLight ? 'bg-slate-50/70 border-sky-100' : 'bg-slate-800/50 border-slate-700'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-xs text-slate-800 dark:text-white truncate">
                            {deal.dealName || deal.project}
                          </h4>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-sky-500/15 text-sky-600 dark:text-sky-400">
                            {deal.stage}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Owner: <span className="font-medium text-slate-600 dark:text-slate-300">{deal.owner}</span> · Close: {deal.closeDate || deal.date}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xs font-bold text-emerald-500">
                          {currency.symbol}{deal.value.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {deal.probability ?? 50}% prob
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <Briefcase className="w-6 h-6 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">No open deals currently logged for this account.</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: ACTIVITY TIMELINE */}
            {activeTab === 'activity' && (
              <div className="space-y-4">
                {/* Add Activity Form */}
                <form
                  onSubmit={handleAddActivitySubmit}
                  className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-sky-100' : 'bg-slate-800 border-slate-700'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Log New Touchpoint / Note
                    </span>
                    <select
                      value={newActivityType}
                      onChange={(e) => setNewActivityType(e.target.value as CompanyActivity['type'])}
                      className="text-[10px] px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 font-semibold"
                    >
                      <option value="note">Note</option>
                      <option value="meeting">Meeting</option>
                      <option value="call">Call</option>
                      <option value="email">Email</option>
                    </select>
                  </div>
                  <textarea
                    rows={2}
                    value={newActivityDesc}
                    onChange={(e) => setNewActivityDesc(e.target.value)}
                    placeholder="Describe discussion outcome, executive feedback, or next steps..."
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 outline-none"
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      type="submit"
                      disabled={!newActivityDesc.trim()}
                      className="flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-lg bg-sky-500 hover:bg-sky-600 text-white disabled:opacity-40"
                    >
                      <Send className="w-3 h-3" />
                      <span>Log Note</span>
                    </button>
                  </div>
                </form>

                {/* Timeline Items */}
                <div className="space-y-3">
                  {companyActivities.length > 0 ? (
                    companyActivities.map((act) => (
                      <div
                        key={act.id}
                        className={`p-3 rounded-xl border relative pl-4 ${
                          isLight ? 'bg-white border-sky-100' : 'bg-slate-800/40 border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                          <span className="font-bold uppercase text-sky-600 dark:text-sky-400">
                            {act.type} · by {act.author}
                          </span>
                          <span>{act.timestamp}</span>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                          {act.description}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-slate-400">
                      <Clock className="w-6 h-6 mx-auto mb-2 opacity-50" />
                      <p className="text-xs">No activity logged yet for this account.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

