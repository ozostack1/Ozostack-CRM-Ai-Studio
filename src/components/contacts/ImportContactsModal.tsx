import React, { useState } from 'react';
import { X, Upload, FileText, CheckCircle2, Sparkles, AlertCircle, Plus } from 'lucide-react';
import { Contact, ContactRoleType, ContactStatus } from '../../types/crm';
import { SAMPLE_IMPORT_CONTACTS } from '../../data/mockData';
import { useTheme } from '../../context/ThemeContext';

interface ImportContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (newContacts: Contact[]) => void;
}

export const ImportContactsModal: React.FC<ImportContactsModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'white-sky';

  const [activeTab, setActiveTab] = useState<'sample' | 'csv'>('sample');
  const [csvText, setCsvText] = useState(
    `Name,Email,Company,Phone,Title,Role,Value\nSarah Connor,sconnor@cyberdyne.io,Cyberdyne Systems,+1 (555) 019-2831,VP Infrastructure,Decision Maker,48000\nLiam Chen,lchen@quantumflux.ai,Quantum Flux,+1 (555) 781-9920,Head of AI Safety,Champion,29000`
  );
  const [selectedSampleIds, setSelectedSampleIds] = useState<number[]>([0, 1, 2]);

  if (!isOpen) return null;

  const toggleSampleSelect = (idx: number) => {
    setSelectedSampleIds((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const handleImportSamples = () => {
    const selected = SAMPLE_IMPORT_CONTACTS.filter((_, idx) => selectedSampleIds.includes(idx));
    const importedContacts: Contact[] = selected.map((s, i) => ({
      id: `con-imp-${Date.now()}-${i}`,
      name: s.name || 'New Contact',
      email: s.email || 'contact@example.com',
      phone: s.phone || '+1 (555) 000-0000',
      whatsapp: s.whatsapp || s.phone || '+15550000000',
      company: s.company || 'Enterprise Corp',
      title: s.title || 'Director',
      roleType: (s.roleType as ContactRoleType) || 'Decision Maker',
      status: (s.status as ContactStatus) || 'Prospect',
      dealOwner: s.dealOwner || 'Sayed (CEO)',
      associatedDealsCount: 1,
      totalDealValue: s.totalDealValue || 25000,
      location: s.location || 'Global',
      tags: s.tags || ['Imported'],
      notes: s.notes || 'Imported via Enterprise Importer.',
      lastInteraction: 'Just imported',
      createdAt: new Date().toISOString().slice(0, 10),
    }));

    onImport(importedContacts);
    onClose();
  };

  const handleImportCsv = () => {
    const lines = csvText.trim().split('\n');
    if (lines.length <= 1) return;

    // Skip header line
    const dataLines = lines.slice(1);
    const parsedContacts: Contact[] = [];

    dataLines.forEach((line, index) => {
      const parts = line.split(',').map((p) => p.trim().replace(/^"|"$/g, ''));
      if (parts.length >= 3 && parts[0]) {
        const [name, email, company, phone, title, role, val] = parts;
        parsedContacts.push({
          id: `con-csv-${Date.now()}-${index}`,
          name: name || 'Enterprise Lead',
          email: email || 'lead@enterprise.com',
          company: company || 'Global Account',
          phone: phone || '+1 (555) 123-4567',
          whatsapp: phone ? phone.replace(/[^0-9+]/g, '') : '+15551234567',
          title: title || 'Executive Stakeholder',
          roleType: (role as ContactRoleType) || 'Decision Maker',
          status: 'Prospect',
          dealOwner: 'Sayed (CEO)',
          associatedDealsCount: 1,
          totalDealValue: Number(val) || 20000,
          location: 'United States',
          tags: ['CSV Import', 'Enterprise'],
          notes: 'Batch imported via CSV text format.',
          lastInteraction: 'Just imported',
          createdAt: new Date().toISOString().slice(0, 10),
        });
      }
    });

    if (parsedContacts.length > 0) {
      onImport(parsedContacts);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div
        className={`w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden my-8 transition-all ${
          isLight ? 'bg-white border-sky-100 text-slate-800' : 'bg-slate-900 border-slate-700 text-white'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-sky-100/30">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Import Stakeholders & Contacts
              </h2>
              <p className="text-xs text-slate-400">
                Instantly seed enterprise profiles or parse raw CSV data into your CRM directory.
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

        {/* Tab Toggle */}
        <div className="flex items-center border-b border-sky-100/30 px-6">
          <button
            onClick={() => setActiveTab('sample')}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'sample'
                ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Preset Enterprise Packages</span>
          </button>

          <button
            onClick={() => setActiveTab('csv')}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'csv'
                ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Paste CSV Text</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'sample' ? (
            <div className="space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Select high-value enterprise accounts to seed your pipeline and contacts directory:
              </p>

              <div className="space-y-2.5">
                {SAMPLE_IMPORT_CONTACTS.map((sample, idx) => {
                  const isSelected = selectedSampleIds.includes(idx);
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleSampleSelect(idx)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-sky-500 bg-sky-500/5 dark:bg-sky-500/10'
                          : 'border-slate-200 dark:border-slate-800 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border text-xs font-bold ${
                            isSelected
                              ? 'bg-sky-500 border-sky-500 text-white'
                              : 'border-slate-300 dark:border-slate-600'
                          }`}
                        >
                          {isSelected && '✓'}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">
                            {sample.name} • <span className="font-normal text-slate-500 dark:text-slate-400">{sample.title}</span>
                          </div>
                          <div className="text-[11px] text-sky-600 dark:text-sky-400 font-semibold">
                            {sample.company} ({sample.location})
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 tabular-nums block">
                          ${(sample.totalDealValue || 0).toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold">
                          {sample.roleType}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-sky-100/30">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleImportSamples}
                  disabled={selectedSampleIds.length === 0}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-sky-500 text-white hover:bg-sky-600 disabled:opacity-50 transition-all shadow-sm flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Import {selectedSampleIds.length} Contacts</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                  CSV Data (Header: Name, Email, Company, Phone, Title, Role, Value)
                </label>
                <textarea
                  rows={6}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  className={`w-full font-mono text-[11px] p-3 rounded-xl border outline-none ${
                    isLight
                      ? 'bg-slate-50 border-sky-200 text-slate-800'
                      : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-sky-100/30">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleImportCsv}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-sky-500 text-white hover:bg-sky-600 transition-all shadow-sm flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Parse & Import CSV</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

