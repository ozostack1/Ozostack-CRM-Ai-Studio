import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  Globe,
  MapPin,
  User,
  DollarSign,
  Activity,
  Tag,
  FileText,
  Phone,
  Mail,
  Linkedin,
  Users,
  Plus,
  Trash2,
} from 'lucide-react';
import { Company, CompanyTier, CompanyStatus, Contact, ContactRoleType } from '../../types/crm';
import { useTheme } from '../../context/ThemeContext';
import { useSystemCurrency } from '../../data/currencyService';

interface ModalContactRow {
  id: string;
  name: string;
  title: string;
  roleType: ContactRoleType;
  email: string;
  phone: string;
}

interface CompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (company: Company, initialContacts?: Partial<Contact>[]) => void;
  companyToEdit: Company | null;
}

const ROLE_OPTIONS: ContactRoleType[] = [
  'Decision Maker',
  'Champion',
  'Technical Evaluator',
  'Procurement',
  'Influencer',
];

const TIER_OPTIONS: CompanyTier[] = ['Enterprise', 'Mid-Market', 'Startup'];
const STATUS_OPTIONS: CompanyStatus[] = ['Active Client', 'Prospect', 'Partner', 'Churned'];
const SIZE_OPTIONS = ['1-10', '11-50', '51-200', '201-500', '500+'];
const OWNER_OPTIONS = [
  'Sayed (CEO)',
  'Amit Kumar',
  'Neha Sharma',
  'Rizwan Khan',
  'Priya Singh',
  'Vikram Joshi',
];
const INDUSTRY_OPTIONS = [
  'Enterprise SaaS & Cloud',
  'Fintech & Digital Banking',
  'E-Commerce & Omnichannel',
  'AI & Machine Learning',
  'Supply Chain & Freight Tech',
  'PropTech & Real Estate',
  'HealthTech & BioInformatics',
  'CleanTech & Smart Grid',
  'Enterprise Data & Analytics',
  'Hospitality & POS Tech',
  'Autonomous & EV Fleet',
  'Sovereign Cloud & Telecom',
];

export const CompanyModal: React.FC<CompanyModalProps> = ({
  isOpen,
  onClose,
  onSave,
  companyToEdit,
}) => {
  const { theme } = useTheme();
  const currency = useSystemCurrency();
  const isLight = theme === 'white-sky';

  const [name, setName] = useState('');
  const [industry, setIndustry] = useState(INDUSTRY_OPTIONS[0]);
  const [tier, setTier] = useState<CompanyTier>('Enterprise');
  const [status, setStatus] = useState<CompanyStatus>('Active Client');
  const [size, setSize] = useState(SIZE_OPTIONS[2]);
  const [website, setWebsite] = useState('');
  const [location, setLocation] = useState('');
  const [accountOwner, setAccountOwner] = useState(OWNER_OPTIONS[0]);
  const [totalDealsValue, setTotalDealsValue] = useState<number>(50000);
  const [healthScore, setHealthScore] = useState<number>(85);
  const [annualRevenue, setAnnualRevenue] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [linkedIn, setLinkedIn] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [notes, setNotes] = useState('');
  const [modalContacts, setModalContacts] = useState<ModalContactRow[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (companyToEdit) {
      setName(companyToEdit.name);
      setIndustry(companyToEdit.industry);
      setTier(companyToEdit.tier);
      setStatus(companyToEdit.status);
      setSize(companyToEdit.size);
      setWebsite(companyToEdit.website || '');
      setLocation(companyToEdit.location);
      setAccountOwner(companyToEdit.accountOwner);
      setTotalDealsValue(companyToEdit.totalDealsValue);
      setHealthScore(companyToEdit.healthScore);
      setAnnualRevenue(companyToEdit.annualRevenue || '');
      setPhone(companyToEdit.phone || '');
      setEmail(companyToEdit.email || '');
      setLinkedIn(companyToEdit.linkedIn || '');
      setTagsInput(companyToEdit.tags ? companyToEdit.tags.join(', ') : '');
      setNotes(companyToEdit.notes || '');
      setModalContacts([]);
    } else {
      setName('');
      setIndustry(INDUSTRY_OPTIONS[0]);
      setTier('Enterprise');
      setStatus('Prospect');
      setSize(SIZE_OPTIONS[2]);
      setWebsite('');
      setLocation('');
      setAccountOwner(OWNER_OPTIONS[0]);
      setTotalDealsValue(50000);
      setHealthScore(80);
      setAnnualRevenue('');
      setPhone('');
      setEmail('');
      setLinkedIn('');
      setTagsInput('Enterprise Account, Cloud');
      setNotes('');
      setModalContacts([
        { id: 'mc-1', name: '', title: '', roleType: 'Decision Maker', email: '', phone: '' },
      ]);
    }
    setErrors({});
  }, [companyToEdit, isOpen]);

  const handleAddModalContact = () => {
    setModalContacts((prev) => [
      ...prev,
      {
        id: `mc-${Date.now()}-${Math.random()}`,
        name: '',
        title: '',
        roleType: 'Decision Maker',
        email: '',
        phone: '',
      },
    ]);
  };

  const handleRemoveModalContact = (id: string) => {
    setModalContacts((prev) => prev.filter((c) => c.id !== id));
  };

  const handleUpdateModalContact = (
    id: string,
    field: keyof ModalContactRow,
    value: string
  ) => {
    setModalContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  if (!isOpen) return null;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Company name is required';
    if (!location.trim()) errs.location = 'Location is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const validContacts: Partial<Contact>[] = modalContacts
      .filter((c) => c.name.trim().length > 0)
      .map((c) => ({
        name: c.name.trim(),
        title: c.title.trim() || 'Stakeholder',
        roleType: c.roleType,
        email: c.email.trim(),
        phone: c.phone.trim(),
      }));

    const savedCompany: Company = {
      id: companyToEdit ? companyToEdit.id : `comp-${Date.now()}`,
      name: name.trim(),
      industry,
      tier,
      status,
      size,
      website: website.trim() || undefined,
      location: location.trim(),
      accountOwner,
      totalDealsValue: Number(totalDealsValue) || 0,
      activeDealsCount: companyToEdit ? companyToEdit.activeDealsCount : 1,
      contactsCount: companyToEdit
        ? companyToEdit.contactsCount + validContacts.length
        : Math.max(1, validContacts.length),
      healthScore: Math.min(100, Math.max(0, Number(healthScore) || 75)),
      annualRevenue: annualRevenue.trim() || undefined,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      linkedIn: linkedIn.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined,
      notes: notes.trim() || undefined,
      createdAt: companyToEdit ? companyToEdit.createdAt : new Date().toISOString().split('T')[0],
    };

    onSave(savedCompany, validContacts);
    onClose();
  };

  const inputClass = `w-full text-xs px-3 py-2 rounded-lg border outline-none font-medium transition-colors ${
    isLight
      ? 'bg-sky-50/30 border-sky-200 text-slate-800 focus:border-sky-500 focus:bg-white'
      : 'bg-slate-800/80 border-slate-700 text-slate-100 focus:border-sky-400 focus:bg-slate-800'
  }`;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div
        className={`relative w-full max-w-2xl rounded-2xl shadow-2xl border overflow-hidden z-10 max-h-[90vh] flex flex-col ${
          isLight ? 'bg-white border-sky-100 text-slate-800' : 'bg-slate-900 border-slate-700 text-white'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-sky-100/30">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500 text-white shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {companyToEdit ? 'Edit Company Profile' : 'Add New Company Account'}
              </h2>
              <p className="text-xs text-slate-400">
                {companyToEdit
                  ? `Update organization profile for ${companyToEdit.name}`
                  : 'Register a new institutional client, partner, or prospect'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {/* Company Name & Website */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-300">
                Company Name *
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Apex Global Systems"
                  className={`${inputClass} pl-9`}
                />
              </div>
              {errors.name && <p className="text-[10px] text-rose-500 mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-300">
                Website URL
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://company.com"
                  className={`${inputClass} pl-9`}
                />
              </div>
            </div>
          </div>

          {/* Industry & Size */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-300">
                Industry Vertical
              </label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className={inputClass}
              >
                {INDUSTRY_OPTIONS.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-300">
                Company Size (Employees)
              </label>
              <select
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className={inputClass}
              >
                {SIZE_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s} employees
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tier & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-300">
                Account Tier
              </label>
              <div className="grid grid-cols-3 gap-2">
                {TIER_OPTIONS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTier(t)}
                    className={`py-1.5 px-2 rounded-lg font-bold text-center border transition-all ${
                      tier === t
                        ? t === 'Enterprise'
                          ? 'bg-purple-500 text-white border-purple-500 shadow-xs'
                          : t === 'Mid-Market'
                          ? 'bg-sky-500 text-white border-sky-500 shadow-xs'
                          : 'bg-emerald-500 text-white border-emerald-500 shadow-xs'
                        : isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-300">
                Relationship Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as CompanyStatus)}
                className={inputClass}
              >
                {STATUS_OPTIONS.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Location & Account Owner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-300">
                HQ Location *
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. San Jose, CA, USA"
                  className={`${inputClass} pl-9`}
                />
              </div>
              {errors.location && <p className="text-[10px] text-rose-500 mt-1">{errors.location}</p>}
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-300">
                Account Owner (Lead Exec)
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={accountOwner}
                  onChange={(e) => setAccountOwner(e.target.value)}
                  className={`${inputClass} pl-9`}
                >
                  {OWNER_OPTIONS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Pipeline Value, Health Score, Annual Revenue */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-300">
                Total Pipeline / Deals ({currency.symbol})
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={totalDealsValue}
                  onChange={(e) => setTotalDealsValue(Number(e.target.value))}
                  className={`${inputClass} pl-9`}
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-300">
                Health Score (0 - 100)
              </label>
              <div className="relative">
                <Activity className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={healthScore}
                  onChange={(e) => setHealthScore(Number(e.target.value))}
                  className={`${inputClass} pl-9`}
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-300">
                Annual Revenue / ARR
              </label>
              <input
                type="text"
                value={annualRevenue}
                onChange={(e) => setAnnualRevenue(e.target.value)}
                placeholder={`e.g. ${currency.symbol}45M ARR`}
                className={inputClass}
              />
            </div>
          </div>

          {/* Contact Details (Phone, Email, LinkedIn) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-300">
                Office Phone
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (408) 555-0199"
                  className={`${inputClass} pl-9`}
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-300">
                Central Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@company.com"
                  className={`${inputClass} pl-9`}
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-300">
                LinkedIn Company URL
              </label>
              <div className="relative">
                <Linkedin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={linkedIn}
                  onChange={(e) => setLinkedIn(e.target.value)}
                  placeholder="https://linkedin.com/company/..."
                  className={`${inputClass} pl-9`}
                />
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-300">
              Tags (Comma separated)
            </label>
            <div className="relative">
              <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Enterprise, Cloud Migration, SLA"
                className={`${inputClass} pl-9`}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-300">
              Account Strategy Notes
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Key account background, executive champions, strategic initiatives..."
                className={`${inputClass} pl-9 py-2`}
              />
            </div>
          </div>

          {/* Key Stakeholder Contacts Section */}
          <div className="pt-2 border-t border-sky-100/30">
            <div className="flex items-center justify-between mb-2">
              <label className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-sky-500" />
                <span>Account Key Contacts ({modalContacts.length})</span>
              </label>
              <button
                type="button"
                onClick={handleAddModalContact}
                className="flex items-center gap-1 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Contact Row</span>
              </button>
            </div>

            {modalContacts.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {modalContacts.map((c, i) => (
                  <div
                    key={c.id}
                    className={`p-2.5 rounded-lg border flex items-center gap-2 flex-wrap sm:flex-nowrap ${
                      isLight ? 'bg-slate-50 border-sky-100' : 'bg-slate-800/60 border-slate-700'
                    }`}
                  >
                    <input
                      type="text"
                      placeholder={`Full Name ${i === 0 ? '*' : ''}`}
                      value={c.name}
                      onChange={(e) => handleUpdateModalContact(c.id, 'name', e.target.value)}
                      className="flex-1 min-w-[120px] px-2.5 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-transparent outline-none focus:border-sky-500"
                    />
                    <input
                      type="text"
                      placeholder="Title (e.g. CTO)"
                      value={c.title}
                      onChange={(e) => handleUpdateModalContact(c.id, 'title', e.target.value)}
                      className="w-28 min-w-[100px] px-2.5 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-transparent outline-none focus:border-sky-500"
                    />
                    <select
                      value={c.roleType}
                      onChange={(e) => handleUpdateModalContact(c.id, 'roleType', e.target.value as ContactRoleType)}
                      className="w-32 min-w-[110px] px-2 py-1.5 text-[11px] rounded border border-slate-200 dark:border-slate-700 bg-transparent outline-none cursor-pointer"
                    >
                      {ROLE_OPTIONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                    <input
                      type="email"
                      placeholder="Email"
                      value={c.email}
                      onChange={(e) => handleUpdateModalContact(c.id, 'email', e.target.value)}
                      className="w-32 min-w-[110px] px-2.5 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-transparent outline-none focus:border-sky-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveModalContact(c.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 rounded transition-colors shrink-0"
                      title="Delete contact row"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 italic">
                No initial contacts added. Click &quot;+ Add Contact Row&quot; above to attach key stakeholders directly.
              </p>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-sky-100/30">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                isLight
                  ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg font-bold text-white bg-sky-500 hover:bg-sky-600 shadow-sm transition-all active:scale-95"
            >
              {companyToEdit ? 'Save Changes' : 'Create Company Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

