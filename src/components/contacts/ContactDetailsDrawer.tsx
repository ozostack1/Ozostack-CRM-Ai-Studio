import React, { useState } from 'react';
import {
  X,
  Phone,
  Mail,
  MessageSquare,
  Building,
  Calendar,
  DollarSign,
  Tag,
  Clock,
  Edit2,
  Trash2,
  CheckCircle2,
  Send,
  User,
  Plus,
  Sparkles,
  ExternalLink,
  MapPin,
  Linkedin,
  Copy,
  Briefcase,
  ShieldCheck,
  Check,
  TrendingUp,
} from 'lucide-react';
import { Contact, ContactRoleType, ContactStatus, ContactActivity, Deal } from '../../types/crm';
import { RECENT_DEALS } from '../../data/mockData';
import { useTheme } from '../../context/ThemeContext';
import { useSystemCurrency, formatMoney } from '../../data/currencyService';
import { ContactActionType } from '../leads/LeadActionModal';

interface ContactDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  contact: Contact | null;
  onEdit: (contact: Contact) => void;
  onDelete: (contactId: string, contactName: string) => void;
  onUpdateContact: (updated: Contact) => void;
  onDirectAction: (contact: Contact, type: ContactActionType) => void;
  activities: ContactActivity[];
  onAddActivity: (contactId: string, type: ContactActivity['type'], description: string) => void;
}

const ROLE_OPTIONS: ContactRoleType[] = [
  'Decision Maker',
  'Champion',
  'Technical Evaluator',
  'Procurement',
  'Influencer',
];

const STATUS_OPTIONS: ContactStatus[] = [
  'Customer',
  'Prospect',
  'Partner',
  'Past Client',
];

const OWNER_OPTIONS = [
  'Sayed (CEO)',
  'Amit Kumar',
  'Neha Sharma',
  'Rizwan Khan',
  'Priya Singh',
  'Vikram Joshi',
];

export const ContactDetailsDrawer: React.FC<ContactDetailsDrawerProps> = ({
  isOpen,
  onClose,
  contact,
  onEdit,
  onDelete,
  onUpdateContact,
  onDirectAction,
  activities,
  onAddActivity,
}) => {
  const { theme } = useTheme();
  const currency = useSystemCurrency();
  const isLight = theme === 'white-sky';

  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'ai'>('overview');
  const [newActivityType, setNewActivityType] = useState<ContactActivity['type']>('call');
  const [newActivityNote, setNewActivityNote] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Quick edit note state
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editedNotes, setEditedNotes] = useState('');

  // Quick add tag state
  const [newTagInput, setNewTagInput] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);

  if (!isOpen || !contact) return null;

  const initials = contact.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2);

  // Filter activities for this contact
  const contactActivities = activities.filter((a) => a.contactId === contact.id);

  // Find associated deals (matching company or client)
  const associatedDeals: Deal[] = RECENT_DEALS.filter(
    (d) =>
      d.company.toLowerCase().includes(contact.company.toLowerCase()) ||
      contact.company.toLowerCase().includes(d.company.toLowerCase())
  );

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleRoleChange = (newRole: ContactRoleType) => {
    const updated: Contact = { ...contact, roleType: newRole };
    onUpdateContact(updated);
    onAddActivity(contact.id, 'status_change', `Role updated to ${newRole}`);
  };

  const handleStatusChange = (newStatus: ContactStatus) => {
    const updated: Contact = { ...contact, status: newStatus };
    onUpdateContact(updated);
    onAddActivity(contact.id, 'status_change', `Relationship status updated to ${newStatus}`);
  };

  const handleOwnerChange = (newOwner: string) => {
    const updated: Contact = { ...contact, dealOwner: newOwner };
    onUpdateContact(updated);
    onAddActivity(contact.id, 'note', `Account owner reassigned to ${newOwner}`);
  };

  const handleSaveNotes = () => {
    const updated: Contact = { ...contact, notes: editedNotes };
    onUpdateContact(updated);
    setIsEditingNotes(false);
    onAddActivity(contact.id, 'note', 'Updated executive notes & account context');
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagInput.trim()) return;
    const currentTags = contact.tags || [];
    if (!currentTags.includes(newTagInput.trim())) {
      const updated: Contact = { ...contact, tags: [...currentTags, newTagInput.trim()] };
      onUpdateContact(updated);
    }
    setNewTagInput('');
    setIsAddingTag(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = contact.tags || [];
    const updated: Contact = { ...contact, tags: currentTags.filter((t) => t !== tagToRemove) };
    onUpdateContact(updated);
  };

  const handleLogActivitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActivityNote.trim()) return;
    onAddActivity(contact.id, newActivityType, newActivityNote.trim());
    setNewActivityNote('');
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

  const cardBg = isLight
    ? 'bg-slate-50/70 border-sky-100/90'
    : 'bg-slate-800/50 border-slate-700/60';

  // AI Strategy based on Buying Role
  const getAiStrategy = (role: ContactRoleType) => {
    switch (role) {
      case 'Decision Maker':
        return {
          archetype: 'Executive Buyer & ROI Evaluator',
          focus: 'Enterprise business impact, EBITDA improvement, high-level SLA metrics, time-to-value.',
          recommendation:
            'Do not overwhelm with technical specifications. Lead with executive summary, case studies of similar ROI, and guaranteed implementation turnaround.',
          suggestedPitch: `Hi ${contact.name}, following our review of ${contact.company}'s strategic goals, our enterprise team put together an executive 1-page business case projecting a 3.4x ROI within 90 days. Would you have 10 minutes on Thursday for a high-level briefing?`,
        };
      case 'Champion':
        return {
          archetype: 'Internal Advocate & Project Driver',
          focus: 'Equipping with presentation decks, team productivity boosts, pilot milestones.',
          recommendation:
            'Treat this contact as an internal partner. Provide them with comparison battlecards, slide decks, and data points they can present to C-level stakeholders.',
          suggestedPitch: `Hi ${contact.name}, I put together the customized slide deck highlighting ${contact.company}'s workflow gains to assist your internal leadership presentation. Let me know if you want any custom data points included!`,
        };
      case 'Technical Evaluator':
        return {
          archetype: 'Architect & Security Gatekeeper',
          focus: 'SOC2/HIPAA compliance, API latency benchmarks, rate limits, data encryption.',
          recommendation:
            'Provide technical architecture documentation, sandbox credentials, and direct engineering escalation paths.',
          suggestedPitch: `Hi ${contact.name}, our solutions engineering team prepared the technical API architecture diagram and SOC2 compliance package for ${contact.company}'s security review. Happy to jump on a technical call to answer any queries.`,
        };
      case 'Procurement':
        return {
          archetype: 'Commercial Negotiator & Contract Reviewer',
          focus: 'Master Services Agreement (MSA), payment schedules, volume tiers, vendor compliance.',
          recommendation:
            'Focus on structured contractual flexibility, transparent volume licensing, and clear payment terms.',
          suggestedPitch: `Hi ${contact.name}, we have prepared the redlined agreement with ${contact.company}'s standard procurement clauses incorporated. Can we schedule a brief 10-minute commercial alignment call?`,
        };
      default:
        return {
          archetype: 'Key Stakeholder & Influencer',
          focus: 'Feature usability, day-to-day team workflow, ease of onboarding.',
          recommendation:
            'Emphasize how this solution eliminates routine friction and simplifies daily responsibilities.',
          suggestedPitch: `Hi ${contact.name}, we'd love to give your team a hands-on preview of the automated workspace to ensure it matches your exact day-to-day operational requirements.`,
        };
    }
  };

  const aiStrategy = getAiStrategy(contact.roleType);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div
          className={`w-screen max-w-2xl shadow-2xl flex flex-col border-l transition-transform ${
            isLight
              ? 'bg-white border-sky-100 text-slate-800'
              : 'bg-slate-900 border-slate-700 text-white'
          }`}
        >
          {/* Header */}
          <div className="p-5 border-b border-sky-100/30 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-md shrink-0">
                {initials}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    {contact.name}
                  </h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getRoleBadge(contact.roleType)}`}>
                    {contact.roleType}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(contact.status)}`}>
                    {contact.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold">{contact.title}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-sky-600 dark:text-sky-400 font-bold">
                    <Building className="w-3 h-3" />
                    {contact.company}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onEdit(contact)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors"
                title="Edit Contact"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(contact.id, contact.name)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                title="Delete Contact"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Action Ribbon */}
          <div className="px-5 py-3 border-b border-sky-100/30 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-2 overflow-x-auto">
            <div className="flex items-center gap-2">
              <button
                onClick={() => onDirectAction(contact, 'whatsapp')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm transition-all active:scale-95"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>

              <button
                onClick={() => onDirectAction(contact, 'email')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-500 text-white hover:bg-sky-600 shadow-sm transition-all active:scale-95"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email</span>
              </button>

              <button
                onClick={() => onDirectAction(contact, 'call')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-500 text-white hover:bg-indigo-600 shadow-sm transition-all active:scale-95"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call</span>
              </button>

              {contact.linkedIn && (
                <a
                  href={contact.linkedIn}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#0077b5] text-white hover:bg-[#006097] shadow-sm transition-all active:scale-95"
                >
                  <Linkedin className="w-3.5 h-3.5" />
                  <span>LinkedIn</span>
                  <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
                </a>
              )}
            </div>

            <div className="text-[11px] text-slate-400 whitespace-nowrap pl-2">
              Active Touchpoints: <span className="font-bold text-slate-700 dark:text-slate-200">{contactActivities.length}</span>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 px-5 py-3 border-b border-sky-100/30 bg-sky-50/20 dark:bg-slate-900/40 text-xs">
            <div className="p-2.5 rounded-xl border border-sky-100 dark:border-slate-800 bg-white dark:bg-slate-800/80">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Deal Value</span>
              <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                {currency.symbol}{(contact.totalDealValue || 0).toLocaleString()}
              </span>
            </div>

            <div className="p-2.5 rounded-xl border border-sky-100 dark:border-slate-800 bg-white dark:bg-slate-800/80">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Deals Count</span>
              <span className="text-sm font-black text-slate-800 dark:text-white tabular-nums">
                {contact.associatedDealsCount || 1} Deals
              </span>
            </div>

            <div className="p-2.5 rounded-xl border border-sky-100 dark:border-slate-800 bg-white dark:bg-slate-800/80">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Owner</span>
              <select
                value={contact.dealOwner}
                onChange={(e) => handleOwnerChange(e.target.value)}
                className="w-full text-xs font-semibold text-sky-600 dark:text-sky-400 bg-transparent border-0 outline-none cursor-pointer truncate"
              >
                {OWNER_OPTIONS.map((o) => (
                  <option key={o} value={o} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">
                    {o}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-2.5 rounded-xl border border-sky-100 dark:border-slate-800 bg-white dark:bg-slate-800/80">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Location</span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate block">
                {contact.location || 'Global'}
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 px-5 border-b border-sky-100/30">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'overview'
                  ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                  : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>360° Overview & Deals</span>
            </button>

            <button
              onClick={() => setActiveTab('activity')}
              className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'activity'
                  ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                  : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Touchpoints & History</span>
              {contactActivities.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-sky-500/10 text-sky-600 dark:text-sky-300 font-black">
                  {contactActivities.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('ai')}
              className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'ai'
                  ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                  : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>AI Engagement Strategy</span>
            </button>
          </div>

          {/* Tab Content Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {activeTab === 'overview' && (
              <>
                {/* Contact Information & Channels */}
                <div className={`p-4 rounded-xl border ${cardBg} space-y-3`}>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                    <span className="flex items-center gap-1.5">
                      <User className="w-4 h-4 text-sky-500" />
                      Direct Communication Channels
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">Click to copy or call</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-2 min-w-0">
                        <Mail className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                        <span className="truncate">{contact.email}</span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(contact.email, 'email')}
                        className="p-1 text-slate-400 hover:text-sky-500 transition-colors"
                        title="Copy Email"
                      >
                        {copiedField === 'email' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-2 min-w-0">
                        <Phone className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span className="truncate">{contact.phone}</span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(contact.phone, 'phone')}
                        className="p-1 text-slate-400 hover:text-indigo-500 transition-colors"
                        title="Copy Phone"
                      >
                        {copiedField === 'phone' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-2 min-w-0">
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="truncate">{contact.whatsapp || contact.phone}</span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(contact.whatsapp || contact.phone, 'whatsapp')}
                        className="p-1 text-slate-400 hover:text-emerald-500 transition-colors"
                        title="Copy WhatsApp"
                      >
                        {copiedField === 'whatsapp' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-2 min-w-0">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span className="truncate">{contact.location || 'Location not specified'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Status & Role Management */}
                <div className={`p-4 rounded-xl border ${cardBg} space-y-3`}>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-purple-500" />
                    Relationship Classification & Buying Role
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                        Buying Role
                      </label>
                      <select
                        value={contact.roleType}
                        onChange={(e) => handleRoleChange(e.target.value as ContactRoleType)}
                        className={`w-full text-xs px-3 py-2 rounded-lg border outline-none font-semibold ${
                          isLight
                            ? 'bg-white border-sky-200 text-slate-800'
                            : 'bg-slate-800 border-slate-700 text-white'
                        }`}
                      >
                        {ROLE_OPTIONS.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                        Account Relationship Status
                      </label>
                      <select
                        value={contact.status}
                        onChange={(e) => handleStatusChange(e.target.value as ContactStatus)}
                        className={`w-full text-xs px-3 py-2 rounded-lg border outline-none font-semibold ${
                          isLight
                            ? 'bg-white border-sky-200 text-slate-800'
                            : 'bg-slate-800 border-slate-700 text-white'
                        }`}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Tags Management */}
                <div className={`p-4 rounded-xl border ${cardBg} space-y-2.5`}>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                    <span className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-sky-500" />
                      Account Tags & Segments
                    </span>
                    {!isAddingTag && (
                      <button
                        onClick={() => setIsAddingTag(true)}
                        className="text-[11px] text-sky-500 hover:text-sky-600 font-semibold flex items-center gap-0.5"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Tag</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {contact.tags && contact.tags.length > 0 ? (
                      contact.tags.map((t) => (
                        <span
                          key={t}
                          className="group inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-300/40 font-semibold"
                        >
                          #{t}
                          <button
                            onClick={() => handleRemoveTag(t)}
                            className="text-slate-400 hover:text-rose-500 transition-colors ml-0.5"
                            title="Remove tag"
                          >
                            ×
                          </button>
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">No tags assigned yet.</span>
                    )}
                  </div>

                  {isAddingTag && (
                    <form onSubmit={handleAddTag} className="flex items-center gap-2 mt-2">
                      <input
                        type="text"
                        value={newTagInput}
                        onChange={(e) => setNewTagInput(e.target.value)}
                        placeholder="Tag name (e.g. VIP Partner)..."
                        className={`text-xs px-2.5 py-1.5 rounded-lg border outline-none flex-1 ${
                          isLight
                            ? 'bg-white border-sky-200 text-slate-800'
                            : 'bg-slate-800 border-slate-700 text-white'
                        }`}
                        autoFocus
                      />
                      <button
                        type="submit"
                        className="px-3 py-1.5 text-xs font-bold rounded-lg bg-sky-500 text-white hover:bg-sky-600"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddingTag(false)}
                        className="px-2 py-1.5 text-xs text-slate-400 hover:text-slate-600"
                      >
                        Cancel
                      </button>
                    </form>
                  )}
                </div>

                {/* Executive Notes */}
                <div className={`p-4 rounded-xl border ${cardBg} space-y-2.5`}>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                    <span>Executive Account Notes & Intelligence</span>
                    {!isEditingNotes ? (
                      <button
                        onClick={() => {
                          setEditedNotes(contact.notes || '');
                          setIsEditingNotes(true);
                        }}
                        className="text-[11px] text-sky-500 hover:text-sky-600 font-semibold flex items-center gap-1"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit Note</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleSaveNotes}
                          className="text-[11px] text-emerald-600 hover:text-emerald-700 font-bold"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setIsEditingNotes(false)}
                          className="text-[11px] text-slate-400 hover:text-slate-600"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>

                  {isEditingNotes ? (
                    <textarea
                      rows={4}
                      value={editedNotes}
                      onChange={(e) => setEditedNotes(e.target.value)}
                      placeholder="Enter strategic background, budget limits, or decision-maker preferences..."
                      className={`w-full text-xs p-3 rounded-lg border outline-none font-medium ${
                        isLight
                          ? 'bg-white border-sky-200 text-slate-800'
                          : 'bg-slate-800 border-slate-700 text-white'
                      }`}
                    />
                  ) : (
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                      {contact.notes || 'No notes added yet for this contact.'}
                    </p>
                  )}
                </div>

                {/* Associated Deals */}
                <div className={`p-4 rounded-xl border ${cardBg} space-y-3`}>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                    <span className="flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4 text-emerald-500" />
                      Associated Pipeline Opportunities ({associatedDeals.length})
                    </span>
                    <span className="text-[10px] text-slate-400">Company: {contact.company}</span>
                  </div>

                  {associatedDeals.length === 0 ? (
                    <div className="p-3 text-center rounded-lg bg-white dark:bg-slate-800 text-xs text-slate-400">
                      No linked deals recorded for {contact.company}.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {associatedDeals.map((deal) => (
                        <div
                          key={deal.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 hover:border-sky-300 transition-all text-xs"
                        >
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">
                              {deal.dealName}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                              <span>Close: {deal.closeDate}</span>
                              <span>•</span>
                              <span>Owner: {deal.owner}</span>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                              {formatMoney(deal.valueFormatted, currency)}
                            </div>
                            <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-sky-500/10 text-sky-600 dark:text-sky-300 border border-sky-300/40">
                              {deal.stage}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === 'activity' && (
              <div className="space-y-4">
                {/* Log New Touchpoint Form */}
                <div className={`p-4 rounded-xl border ${cardBg} space-y-3`}>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-sky-500" />
                    Log Direct Touchpoint
                  </h4>

                  <form onSubmit={handleLogActivitySubmit} className="space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {(['call', 'email', 'whatsapp', 'meeting', 'note'] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setNewActivityType(t)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                            newActivityType === t
                              ? 'bg-sky-500 text-white shadow-xs'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>

                    <div className="relative">
                      <textarea
                        rows={3}
                        value={newActivityNote}
                        onChange={(e) => setNewActivityNote(e.target.value)}
                        placeholder={`Details of ${newActivityType} with ${contact.name}...`}
                        className={`w-full text-xs p-3 rounded-lg border outline-none font-medium ${
                          isLight
                            ? 'bg-white border-sky-200 text-slate-800'
                            : 'bg-slate-800 border-slate-700 text-white'
                        }`}
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={!newActivityNote.trim()}
                        className="px-4 py-1.5 rounded-lg text-xs font-bold bg-sky-500 text-white hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs transition-all flex items-center gap-1.5"
                      >
                        <Send className="w-3 h-3" />
                        <span>Log Touchpoint</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* Timeline History */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Interaction History ({contactActivities.length})
                  </h4>

                  {contactActivities.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                      No interactions recorded yet. Log your first call, email, or meeting above!
                    </div>
                  ) : (
                    <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-sky-200 dark:before:bg-slate-800">
                      {contactActivities.map((act) => {
                        const getIcon = () => {
                          switch (act.type) {
                            case 'call':
                              return <Phone className="w-3 h-3 text-indigo-500" />;
                            case 'email':
                              return <Mail className="w-3 h-3 text-sky-500" />;
                            case 'whatsapp':
                              return <MessageSquare className="w-3 h-3 text-emerald-500" />;
                            case 'meeting':
                              return <Calendar className="w-3 h-3 text-amber-500" />;
                            default:
                              return <Clock className="w-3 h-3 text-purple-500" />;
                          }
                        };

                        return (
                          <div key={act.id} className="relative group">
                            {/* Dot Icon */}
                            <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-white dark:bg-slate-900 border-2 border-sky-400 flex items-center justify-center shadow-xs">
                              {getIcon()}
                            </div>

                            <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-xs shadow-xs space-y-1">
                              <div className="flex items-center justify-between gap-2 text-slate-400 text-[10px]">
                                <span className="font-bold text-slate-700 dark:text-slate-300 capitalize">
                                  {act.type} • {act.author}
                                </span>
                                <span>{act.timestamp}</span>
                              </div>
                              <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                                {act.description}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'ai' && (
              <div className="space-y-4">
                {/* AI Persona Card */}
                <div className="p-4 rounded-xl border border-sky-300/40 bg-gradient-to-br from-sky-500/10 via-indigo-500/5 to-transparent space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-sky-500" />
                      <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                        AI Stakeholder Strategy Matrix
                      </h4>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-300/40">
                      {aiStrategy.archetype}
                    </span>
                  </div>

                  <div className="text-xs space-y-2">
                    <div>
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                        Core Buying Motivations:
                      </span>
                      <p className="text-slate-800 dark:text-slate-200 font-medium">
                        {aiStrategy.focus}
                      </p>
                    </div>

                    <div>
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                        Engagement Playbook:
                      </span>
                      <p className="text-slate-800 dark:text-slate-200 font-medium">
                        {aiStrategy.recommendation}
                      </p>
                    </div>
                  </div>
                </div>

                {/* AI Prompt / Outreach Draft */}
                <div className={`p-4 rounded-xl border ${cardBg} space-y-3`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Tailored Follow-Up Message
                    </span>
                    <button
                      onClick={() => copyToClipboard(aiStrategy.suggestedPitch, 'pitch')}
                      className="text-[11px] text-sky-500 hover:text-sky-600 font-bold flex items-center gap-1"
                    >
                      {copiedField === 'pitch' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Message</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-mono">
                    "{aiStrategy.suggestedPitch}"
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => {
                        onDirectAction(contact, 'whatsapp');
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-emerald-500 text-white hover:bg-emerald-600 transition-all"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Send via WhatsApp</span>
                    </button>

                    <button
                      onClick={() => {
                        onDirectAction(contact, 'email');
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-sky-500 text-white hover:bg-sky-600 transition-all"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Send via Email</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

