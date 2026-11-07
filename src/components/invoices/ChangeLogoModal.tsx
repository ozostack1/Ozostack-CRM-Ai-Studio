import React, { useState } from 'react';
import { X, Upload, Image as ImageIcon, Check, Building2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { InvoiceBranding } from '../../types/crm';

interface ChangeLogoModalProps {
  isOpen: boolean;
  onClose: () => void;
  branding: InvoiceBranding;
  onSaveBranding: (updated: InvoiceBranding) => void;
}

const LOGO_PRESETS = [
  {
    name: 'Ozostack Cyan Horizon',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=160&auto=format&fit=crop&q=80',
  },
  {
    name: 'Modern Tech Matrix',
    url: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=160&auto=format&fit=crop&q=80',
  },
  {
    name: 'Cyber Core Blue',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=160&auto=format&fit=crop&q=80',
  },
  {
    name: 'Enterprise Apex Slate',
    url: 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=160&auto=format&fit=crop&q=80',
  },
];

export const ChangeLogoModal: React.FC<ChangeLogoModalProps> = ({
  isOpen,
  onClose,
  branding,
  onSaveBranding,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'white-sky';

  const [companyName, setCompanyName] = useState(branding.companyName);
  const [companyAddress, setCompanyAddress] = useState(branding.companyAddress);
  const [companyEmail, setCompanyEmail] = useState(branding.companyEmail);
  const [companyPhone, setCompanyPhone] = useState(branding.companyPhone);
  const [companyTaxId, setCompanyTaxId] = useState(branding.companyTaxId);
  const [logoUrl, setLogoUrl] = useState(branding.logoUrl);
  const [bankDetails, setBankDetails] = useState(branding.bankDetails);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setLogoUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveBranding({
      companyName,
      companyAddress,
      companyEmail,
      companyPhone,
      companyTaxId,
      logoUrl,
      bankDetails,
      accentColor: branding.accentColor || '#0284c7',
    });
    onClose();
  };

  const inputClass = isLight
    ? 'w-full px-3 py-2 text-xs rounded-xl border border-sky-100 bg-sky-50/40 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400'
    : 'w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-slate-900/60 text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500';

  const labelClass = 'block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className={`relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-2xl border shadow-2xl ${
          isLight ? 'bg-white border-sky-200' : 'bg-[#0f172a] border-slate-700'
        }`}
      >
        {/* Header */}
        <div
          className={`sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b ${
            isLight
              ? 'bg-white/95 border-sky-100 backdrop-blur-md'
              : 'bg-[#0f172a]/95 border-slate-800 backdrop-blur-md'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/15 flex items-center justify-center text-sky-500">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Invoice & Document Branding
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Change your corporate logo, company identity, tax details and wire bank information
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          {/* Logo Preview & Upload Section */}
          <div
            className={`p-4 rounded-xl border flex flex-col sm:flex-row items-center gap-4 ${
              isLight ? 'bg-sky-50/50 border-sky-100' : 'bg-slate-900/50 border-slate-800'
            }`}
          >
            <div className="w-20 h-20 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center p-2 shrink-0 shadow-xs">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Company Logo"
                  className="w-full h-full object-contain"
                />
              ) : (
                <Building2 className="w-8 h-8 text-sky-500" />
              )}
            </div>

            <div className="flex-1 space-y-2 text-center sm:text-left">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Corporate Document Logo
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Upload a PNG, SVG, or JPG image to appear in the header of all invoices, proposals, and contracts.
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                <label className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-sky-500 hover:bg-sky-600 text-white cursor-pointer shadow-xs transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Logo Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Preset Logos */}
          <div>
            <label className={labelClass}>Or Choose a Corporate Preset:</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {LOGO_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => setLogoUrl(preset.url)}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    logoUrl === preset.url
                      ? 'border-sky-500 ring-2 ring-sky-500/20 bg-sky-50 dark:bg-sky-950/30'
                      : 'border-slate-200 dark:border-slate-700 hover:border-sky-300'
                  }`}
                >
                  <img
                    src={preset.url}
                    alt={preset.name}
                    className="w-12 h-12 object-cover rounded-lg mx-auto mb-1"
                  />
                  <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400 truncate block">
                    {preset.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Logo URL Input */}
          <div>
            <label className={labelClass}>Logo Direct Image URL</label>
            <input
              type="url"
              placeholder="https://example.com/logo.png"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Company Name & Tax ID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Company Legal Name *</label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Tax ID / VAT Registration #</label>
              <input
                type="text"
                placeholder="US-EIN 84-2910481"
                value={companyTaxId}
                onChange={(e) => setCompanyTaxId(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Billing Email</label>
              <input
                type="email"
                value={companyEmail}
                onChange={(e) => setCompanyEmail(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Billing Phone</label>
              <input
                type="text"
                value={companyPhone}
                onChange={(e) => setCompanyPhone(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* Company Address */}
          <div>
            <label className={labelClass}>Registered Address</label>
            <input
              type="text"
              value={companyAddress}
              onChange={(e) => setCompanyAddress(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Bank & Payment Details */}
          <div>
            <label className={labelClass}>Wire Transfer / Bank Remittance Details</label>
            <textarea
              rows={2}
              value={bankDetails}
              onChange={(e) => setBankDetails(e.target.value)}
              className={inputClass}
              placeholder="Bank Name, Routing Number, Account Number, SWIFT/BIC"
            />
          </div>

          {/* Footer Actions */}
          <div
            className={`pt-4 border-t flex items-center justify-end gap-2.5 ${
              isLight ? 'border-sky-100' : 'border-slate-800'
            }`}
          >
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-colors ${
                isLight
                  ? 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  : 'border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-sky-500 hover:bg-sky-600 text-white shadow-xs transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Document Branding</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
