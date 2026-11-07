import React, { useState, useEffect } from 'react';
import { X, User, Building, Mail, Phone, MessageSquare, Linkedin, DollarSign, MapPin, Tag, FileText, Check } from 'lucide-react';
import { Contact, ContactRoleType, ContactStatus } from '../../types/crm';
import { useTheme } from '../../context/ThemeContext';
import { useSystemCurrency } from '../../data/currencyService';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (contact: Contact) => void;
  contactToEdit: Contact | null;
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

export const ContactModal: React.FC<ContactModalProps> = ({
  isOpen,
  onClose,
  onSave,
  contactToEdit,
}) => {
  const { theme } = useTheme();
  const currency = useSystemCurrency();
  const isLight = theme === 'white-sky';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [company, setCompany] = useState('');
  const [title, setTitle] = useState('');
  const [roleType, setRoleType] = useState<ContactRoleType>('Decision Maker');
  const [status, setStatus] = useState<ContactStatus>('Prospect');
  const [dealOwner, setDealOwner] = useState('Sayed (CEO)');
  const [totalDealValue, setTotalDealValue] = useState<number>(15000);
  const [linkedIn, setLinkedIn] = useState('');
  const [location, setLocation] = useState('');
  const [tagsInput, setTagsInput] = useState('Enterprise, Decision Maker');
  const [notes, setNotes] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (contactToEdit) {
      setName(contactToEdit.name);
      setEmail(contactToEdit.email);
      setPhone(contactToEdit.phone);
      setWhatsapp(contactToEdit.whatsapp || contactToEdit.phone);
      setCompany(contactToEdit.company);
      setTitle(contactToEdit.title);
      setRoleType(contactToEdit.roleType);
      setStatus(contactToEdit.status);
      setDealOwner(contactToEdit.dealOwner);
      setTotalDealValue(contactToEdit.totalDealValue || 0);
      setLinkedIn(contactToEdit.linkedIn || '');
      setLocation(contactToEdit.location || '');
      setTagsInput(contactToEdit.tags ? contactToEdit.tags.join(', ') : '');
      setNotes(contactToEdit.notes || '');
    } else {
      setName('');
      setEmail('');
      setPhone('');
      setWhatsapp('');
      setCompany('');
      setTitle('');
      setRoleType('Decision Maker');
      setStatus('Prospect');
      setDealOwner('Sayed (CEO)');
      setTotalDealValue(15000);
      setLinkedIn('');
      setLocation('');
      setTagsInput('Enterprise, High Priority');
      setNotes('');
    }
    setErrors({});
  }, [contactToEdit, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Contact name is required';
    if (!email.trim() || !email.includes('@')) errs.email = 'Valid email is required';
    if (!company.trim()) errs.company = 'Company name is required';
    if (!phone.trim()) errs.phone = 'Phone number is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const savedContact: Contact = {
      id: contactToEdit?.id || `con-${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      whatsapp: whatsapp.trim() || phone.trim(),
      company: company.trim(),
      title: title.trim() || 'Executive',
      roleType,
      status,
      dealOwner,
      totalDealValue: Number(totalDealValue) || 0,
      associatedDealsCount: contactToEdit?.associatedDealsCount || 1,
      linkedIn: linkedIn.trim() || undefined,
      location: location.trim() || 'Global',
      tags: parsedTags,
      notes: notes.trim() || undefined,
      lastInteraction: contactToEdit?.lastInteraction || 'Just created',
      createdAt: contactToEdit?.createdAt || new Date().toISOString().slice(0, 10),
    };

    onSave(savedContact);
    onClose();
  };

  const inputClass = `w-full text-xs px-3 py-2 rounded-lg border outline-none font-medium transition-colors ${
    isLight
      ? 'bg-slate-50 border-sky-200 text-slate-800 focus:bg-white focus:border-sky-500'
      : 'bg-slate-800 border-slate-700 text-white focus:border-sky-400'
  }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div
        className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden my-8 transition-all ${
          isLight ? 'bg-white border-sky-100 text-slate-800' : 'bg-slate-900 border-slate-700 text-white'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-sky-100/30">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {contactToEdit ? 'Edit Contact Profile' : 'Add New Enterprise Stakeholder'}
              </h2>
              <p className="text-xs text-slate-400">
                Maintain 360° decision-maker records, communication channels, and deal attributions.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                Full Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Smith"
                className={inputClass}
              />
              {errors.name && <p className="text-[10px] text-rose-500 mt-0.5">{errors.name}</p>}
            </div>

            {/* Job Title */}
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                Job Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. VP of Technology / CTO"
                className={inputClass}
              />
            </div>

            {/* Company */}
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                Company / Organization *
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. TechVision Inc."
                className={inputClass}
              />
              {errors.company && <p className="text-[10px] text-rose-500 mt-0.5">{errors.company}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                Email Address *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. jsmith@techvision.com"
                className={inputClass}
              />
              {errors.email && <p className="text-[10px] text-rose-500 mt-0.5">{errors.email}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                Phone Number *
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +1 (555) 234-5678"
                className={inputClass}
              />
              {errors.phone && <p className="text-[10px] text-rose-500 mt-0.5">{errors.phone}</p>}
            </div>

            {/* WhatsApp */}
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                WhatsApp Number
              </label>
              <input
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="e.g. +15552345678"
                className={inputClass}
              />
            </div>

            {/* Role Type */}
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                Stakeholder Buying Role
              </label>
              <select
                value={roleType}
                onChange={(e) => setRoleType(e.target.value as ContactRoleType)}
                className={inputClass}
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Relationship Status */}
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                Account Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ContactStatus)}
                className={inputClass}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Deal Owner */}
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                Account Owner
              </label>
              <select
                value={dealOwner}
                onChange={(e) => setDealOwner(e.target.value)}
                className={inputClass}
              >
                {OWNER_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>

            {/* Associated Deal Value */}
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                Associated Pipeline Value ({currency.symbol})
              </label>
              <input
                type="number"
                value={totalDealValue}
                onChange={(e) => setTotalDealValue(Number(e.target.value))}
                placeholder="15000"
                className={inputClass}
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                Location / City
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. San Francisco, CA"
                className={inputClass}
              />
            </div>

            {/* LinkedIn */}
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                LinkedIn Profile URL
              </label>
              <input
                type="url"
                value={linkedIn}
                onChange={(e) => setLinkedIn(e.target.value)}
                placeholder="e.g. https://linkedin.com/in/username"
                className={inputClass}
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
              Tags (comma separated)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. Enterprise, High Value, Cloud, Urgent"
              className={inputClass}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
              Executive Notes & Account Context
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter key business background, technical preferences, or meeting summaries..."
              className={inputClass}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2.5 pt-4 border-t border-sky-100/30">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors ${
                isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow-sm shadow-sky-600/30 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{contactToEdit ? 'Update Contact' : 'Save Contact'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
