import React, { useState, useRef, useMemo } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  Download,
  Plus,
  Check,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Layers,
} from 'lucide-react';
import { Lead, LeadStatus, LeadPriority, LeadSource } from '../../types/crm';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useCrmConfig } from '../../data/crmConfig';
import { useSystemCurrency } from '../../data/currencyService';

interface BulkLeadUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBulkImport: (leads: Lead[]) => void;
}

const DEFAULT_STAGES: LeadStatus[] = [
  'New Lead',
  'Contacted',
  'Follow-up',
  'Qualified',
  'Proposal Sent',
  'Negotiation',
  'Won',
  'Lost',
];

const STAGE_COLORS = [
  '#38bdf8',
  '#0ea5e9',
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#f59e0b',
  '#10b981',
  '#14b8a6',
  '#ef4444',
];

const OWNERS = ['Amit Kumar', 'Neha Sharma', 'Rizwan Khan', 'Priya Singh', 'Vikram Joshi', 'Sayed'];
const PRIORITIES: LeadPriority[] = ['Hot', 'Warm', 'Cold'];
const DEFAULT_SOURCES: LeadSource[] = [
  'LinkedIn',
  'Website',
  'Cold Email',
  'Referrals',
  'Upwork',
  'Events',
  'Others',
];

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((ch === ',' || ch === '\t') && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

export const BulkLeadUploadModal: React.FC<BulkLeadUploadModalProps> = ({
  isOpen,
  onClose,
  onBulkImport,
}) => {
  const { theme } = useTheme();
  const { users } = useAuth();
  const { config, updateConfig } = useCrmConfig();
  const currency = useSystemCurrency();
  const isLight = theme === 'white-sky';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stages = useMemo(
    () => (config.leadStages.length > 0 ? config.leadStages.map((s) => s.name) : DEFAULT_STAGES),
    [config.leadStages]
  );

  const sources = useMemo(
    () => (config.leadSources.length > 0 ? config.leadSources.map((s) => s.name) : DEFAULT_SOURCES),
    [config.leadSources]
  );

  const ownersList = useMemo(
    () => Array.from(new Set([...users.map((u) => u.name), ...OWNERS])),
    [users]
  );

  const [selectedStage, setSelectedStage] = useState<string>(stages[0] || 'New Lead');
  const [applyStageToAll, setApplyStageToAll] = useState<boolean>(true);
  const [defaultPriority, setDefaultPriority] = useState<LeadPriority>('Warm');
  const [defaultSource, setDefaultSource] = useState<string>(sources[0] || 'LinkedIn');
  const [defaultOwner, setDefaultOwner] = useState<string>('Sayed');

  // Create New Stage inline state
  const [isCreatingStage, setIsCreatingStage] = useState(false);
  const [newStageName, setNewStageName] = useState('');
  const [newStageColor, setNewStageColor] = useState('#0ea5e9');
  const [stageMessage, setStageMessage] = useState<string | null>(null);

  // Uploaded file & parsed leads preview
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedLeads, setParsedLeads] = useState<Lead[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  if (!isOpen) return null;

  const handleCreateStage = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newStageName.trim();
    if (!trimmed) return;

    const exists = stages.some((s) => s.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      const existingMatch = stages.find((s) => s.toLowerCase() === trimmed.toLowerCase())!;
      setSelectedStage(existingMatch);
      setIsCreatingStage(false);
      setNewStageName('');
      return;
    }

    updateConfig((prev) => ({
      ...prev,
      leadStages: [
        ...prev.leadStages,
        {
          id: `lst-${Date.now()}`,
          name: trimmed,
          color: newStageColor,
        },
      ],
    }));

    setSelectedStage(trimmed);
    if (applyStageToAll && parsedLeads.length > 0) {
      setParsedLeads((prev) => prev.map((l) => ({ ...l, status: trimmed as LeadStatus })));
    }
    setNewStageName('');
    setIsCreatingStage(false);
    setStageMessage(`Stage "${trimmed}" created & selected`);
    setTimeout(() => setStageMessage(null), 3000);
  };

  const handleStageSelectChange = (stage: string) => {
    setSelectedStage(stage);
    if (applyStageToAll && parsedLeads.length > 0) {
      setParsedLeads((prev) => prev.map((l) => ({ ...l, status: stage as LeadStatus })));
    }
  };

  const parseFileContent = (content: string, name: string) => {
    setErrorMsg(null);
    const today = new Date().toISOString().split('T')[0];

    try {
      if (name.toLowerCase().endsWith('.json')) {
        const json = JSON.parse(content);
        if (!Array.isArray(json)) {
          setErrorMsg('JSON file must contain an array of lead objects.');
          return;
        }
        const items: Lead[] = json
          .filter((row: any) => row && (row.name || row.company || row.email))
          .map((row: any, idx: number) => {
            const phone = String(row.phone || row.mobile || '+1 (555) 000-0000').trim();
            const whatsapp = String(row.whatsapp || phone.replace(/[^0-9+]/g, '')).trim();
            const priorityVal = PRIORITIES.find(
              (p) => p.toLowerCase() === String(row.priority || '').toLowerCase()
            ) || defaultPriority;
            const rowStage = String(row.status || row.stage || '').trim();
            const statusVal = applyStageToAll || !rowStage ? selectedStage : rowStage;
            return {
              id: `lead-bulk-${Date.now()}-${idx}`,
              name: String(row.name || row.fullName || 'Lead Contact').trim(),
              company: String(row.company || row.organization || 'Organization').trim(),
              title: String(row.title || row.role || 'Decision Maker').trim(),
              email: String(row.email || 'contact@company.com').trim(),
              phone,
              whatsapp,
              status: statusVal as LeadStatus,
              priority: priorityVal,
              value: Number(String(row.value || row.amount || '10000').replace(/[^0-9.]/g, '')) || 10000,
              source: (String(row.source || defaultSource).trim() || defaultSource) as LeadSource,
              owner: String(row.owner || defaultOwner).trim() || defaultOwner,
              score: Number(row.score) || (priorityVal === 'Hot' ? 90 : priorityVal === 'Warm' ? 75 : 60),
              createdAt: today,
              lastContacted: today,
              notes: String(row.notes || '').trim(),
              tags: ['Bulk Import'],
              customFields: {},
            };
          });

        if (items.length === 0) {
          setErrorMsg('No valid lead records found in JSON file.');
          return;
        }
        setFileName(name);
        setParsedLeads(items);
        return;
      }

      // CSV / TSV parsing
      const lines = content
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      if (lines.length < 2) {
        setErrorMsg('CSV file must include a header row and at least one data row.');
        return;
      }

      const headers = parseCsvLine(lines[0]).map((h) =>
        h.toLowerCase().replace(/[^a-z0-9]/g, '')
      );

      const findIdx = (keys: string[]) => headers.findIndex((h) => keys.includes(h));

      const nameIdx = findIdx(['name', 'fullname', 'leadname', 'contact', 'contactname', 'client']);
      const companyIdx = findIdx(['company', 'organization', 'companyname', 'business', 'account']);
      const titleIdx = findIdx(['title', 'jobtitle', 'role', 'designation', 'position']);
      const emailIdx = findIdx(['email', 'emailaddress', 'workemail', 'mail']);
      const phoneIdx = findIdx(['phone', 'phonenumber', 'mobile', 'contactnumber', 'tel']);
      const whatsappIdx = findIdx(['whatsapp', 'whatsappnumber', 'wa']);
      const valueIdx = findIdx(['value', 'dealvalue', 'amount', 'budget', 'revenue', 'valueusd']);
      const priorityIdx = findIdx(['priority', 'leadpriority', 'rating']);
      const sourceIdx = findIdx(['source', 'leadsource', 'channel']);
      const ownerIdx = findIdx(['owner', 'assignedto', 'assignee', 'salesrep']);
      const statusIdx = findIdx(['status', 'stage', 'leadstage', 'pipelinestage']);
      const scoreIdx = findIdx(['score', 'leadscore', 'aiscore']);
      const notesIdx = findIdx(['notes', 'note', 'description', 'comments', 'remarks']);

      const items: Lead[] = [];

      for (let i = 1; i < lines.length; i++) {
        const cols = parseCsvLine(lines[i]);
        if (cols.every((c) => !c)) continue;

        const rawName = nameIdx >= 0 ? cols[nameIdx] : cols[0] || '';
        const rawCompany = companyIdx >= 0 ? cols[companyIdx] : cols[1] || 'Enterprise Account';
        if (!rawName && !rawCompany) continue;

        const phone = (phoneIdx >= 0 && cols[phoneIdx]) ? cols[phoneIdx] : '+1 (555) 000-0000';
        const whatsapp =
          whatsappIdx >= 0 && cols[whatsappIdx]
            ? cols[whatsappIdx]
            : phone.replace(/[^0-9+]/g, '');

        const rawPriority = priorityIdx >= 0 ? cols[priorityIdx] : '';
        const priorityVal =
          PRIORITIES.find((p) => p.toLowerCase() === rawPriority.toLowerCase()) || defaultPriority;

        const rawStage = statusIdx >= 0 ? cols[statusIdx] : '';
        const statusVal = applyStageToAll || !rawStage ? selectedStage : rawStage;

        const rawValue = valueIdx >= 0 ? cols[valueIdx] : '10000';
        const numericValue = Number(String(rawValue).replace(/[^0-9.]/g, '')) || 10000;

        const rawScore = scoreIdx >= 0 ? Number(cols[scoreIdx]) : NaN;
        const scoreVal = !isNaN(rawScore) && rawScore > 0
          ? Math.min(100, Math.max(1, rawScore))
          : priorityVal === 'Hot'
          ? 88
          : priorityVal === 'Warm'
          ? 75
          : 60;

        items.push({
          id: `lead-bulk-${Date.now()}-${i}`,
          name: rawName || `Lead #${i}`,
          company: rawCompany || 'Company',
          title: (titleIdx >= 0 && cols[titleIdx]) ? cols[titleIdx] : 'Decision Maker',
          email: (emailIdx >= 0 && cols[emailIdx]) ? cols[emailIdx] : 'contact@company.com',
          phone,
          whatsapp,
          status: statusVal as LeadStatus,
          priority: priorityVal,
          value: numericValue,
          source: ((sourceIdx >= 0 && cols[sourceIdx]) ? cols[sourceIdx] : defaultSource) as LeadSource,
          owner: (ownerIdx >= 0 && cols[ownerIdx]) ? cols[ownerIdx] : defaultOwner,
          score: scoreVal,
          createdAt: today,
          lastContacted: today,
          notes: (notesIdx >= 0 && cols[notesIdx]) ? cols[notesIdx] : `Imported via bulk upload (${name})`,
          tags: ['Bulk Import'],
          customFields: {},
        });
      }

      if (items.length === 0) {
        setErrorMsg('Could not parse any valid rows from the file. Check the CSV format.');
        return;
      }

      setFileName(name);
      setParsedLeads(items);
    } catch {
      setErrorMsg('Failed to parse file. Please upload a valid CSV or JSON file.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = String(evt.target?.result || '');
      parseFileContent(content, file.name);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = String(evt.target?.result || '');
      parseFileContent(content, file.name);
    };
    reader.readAsText(file);
  };

  const handleDownloadSample = () => {
    const sampleRows = [
      ['Name', 'Company', 'Title', 'Email', 'Phone', 'WhatsApp', 'Value', 'Priority', 'Source', 'Owner', 'Stage', 'Notes'],
      ['Arjun Mehta', 'CloudScale AI', 'CTO', 'arjun@cloudscale.io', '+91 98765 43210', '+919876543210', '45000', 'Hot', 'LinkedIn', 'Sayed', selectedStage, 'Interested in enterprise automation suite'],
      ['Sarah Jenkins', 'FinEdge Global', 'VP Operations', 's.jenkins@finedge.com', '+1 (415) 890-2311', '+14158902311', '28000', 'Warm', 'Website', 'Amit Kumar', selectedStage, 'Requested Q4 pricing breakdown'],
      ['Rohan Kapoor', 'NexGen Retail', 'Founder', 'rohan@nexgenretail.in', '+91 98111 22334', '+919811122334', '18500', 'Hot', 'Referrals', 'Priya Singh', selectedStage, 'Looking for CRM + WhatsApp integration'],
    ];
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      sampleRows.map((r) => r.map((cell) => `"${cell}"`).join(',')).join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', 'ozostack_leads_bulk_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRemovePreviewRow = (id: string) => {
    setParsedLeads((prev) => prev.filter((item) => item.id !== id));
  };

  const handleRowStageChange = (id: string, newStage: string) => {
    setParsedLeads((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStage as LeadStatus } : item))
    );
  };

  const handleConfirmImport = () => {
    if (parsedLeads.length === 0) return;

    // Ensure any custom stages used in imported leads exist in CRM config
    const existingStageNames = new Set(stages.map((s) => s.toLowerCase()));
    const newStagesToRegister: { id: string; name: string; color: string }[] = [];

    parsedLeads.forEach((l, i) => {
      const st = (l.status || selectedStage).trim();
      if (st && !existingStageNames.has(st.toLowerCase())) {
        existingStageNames.add(st.toLowerCase());
        newStagesToRegister.push({
          id: `lst-${Date.now()}-${i}`,
          name: st,
          color: STAGE_COLORS[i % STAGE_COLORS.length],
        });
      }
    });

    if (newStagesToRegister.length > 0) {
      updateConfig((prev) => ({
        ...prev,
        leadStages: [...prev.leadStages, ...newStagesToRegister],
      }));
    }

    onBulkImport(parsedLeads);
    setParsedLeads([]);
    setFileName(null);
    onClose();
  };

  const inputCls = `w-full text-xs px-3 py-2 rounded-lg border outline-none font-medium ${
    isLight
      ? 'bg-slate-50 border-sky-200 text-slate-800 focus:border-sky-500'
      : 'bg-slate-800 border-slate-700 text-white focus:border-sky-400'
  }`;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div
        className={`w-full max-w-4xl rounded-2xl border shadow-2xl overflow-hidden transition-all max-h-[92vh] flex flex-col ${
          isLight
            ? 'bg-white border-sky-100 text-slate-800'
            : 'bg-slate-900 border-slate-700 text-white'
        }`}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-sky-100/30 flex items-center justify-between bg-gradient-to-r from-sky-500/10 via-indigo-500/5 to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500 text-white shadow-md shadow-sky-500/20">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold">Bulk Upload Leads & Stage Assignment</h2>
              <p className="text-[11px] text-slate-400">
                Upload CSV or JSON lead files, assign or create a pipeline stage, and import in one click
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

        {/* Body */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1">
          {/* Step 1: Select or Create Lead Stage & Defaults */}
          <div
            className={`p-4 rounded-xl border space-y-3.5 ${
              isLight ? 'bg-sky-50/40 border-sky-100' : 'bg-slate-800/40 border-slate-800'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-500" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                  1. Select Target Lead Stage & Defaults
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsCreatingStage((prev) => !prev)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-sky-500/15 text-sky-600 dark:text-sky-400 hover:bg-sky-500 hover:text-white transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isCreatingStage ? 'Cancel New Stage' : 'Create New Stage'}</span>
              </button>
            </div>

            {stageMessage && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{stageMessage}</span>
              </div>
            )}

            {/* Inline Create Stage Box */}
            {isCreatingStage && (
              <form
                onSubmit={handleCreateStage}
                className={`p-3 rounded-xl border flex flex-col sm:flex-row items-stretch sm:items-center gap-3 ${
                  isLight ? 'bg-white border-sky-200' : 'bg-slate-900 border-slate-700'
                }`}
              >
                <div className="flex-1">
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    New Lead Stage Name
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={newStageName}
                    onChange={(e) => setNewStageName(e.target.value)}
                    placeholder="e.g. Demo Scheduled, Technical Review, Cold Outreach..."
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Stage Color
                  </label>
                  <div className="flex items-center gap-1.5 py-1">
                    {STAGE_COLORS.map((col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setNewStageColor(col)}
                        className={`w-5 h-5 rounded-full transition-transform ${
                          newStageColor === col ? 'scale-125 ring-2 ring-offset-1 ring-sky-500' : 'opacity-75 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: col }}
                      />
                    ))}
                  </div>
                </div>

                <div className="sm:self-end">
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-4 py-2 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Stage</span>
                  </button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Target Lead Stage */}
              <div>
                <label className="block text-[11px] font-semibold mb-1 text-slate-600 dark:text-slate-300">
                  Lead Stage for Upload
                </label>
                <select
                  value={selectedStage}
                  onChange={(e) => handleStageSelectChange(e.target.value)}
                  className={inputCls}
                >
                  {stages.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              {/* Default Priority */}
              <div>
                <label className="block text-[11px] font-semibold mb-1 text-slate-600 dark:text-slate-300">
                  Default Priority
                </label>
                <select
                  value={defaultPriority}
                  onChange={(e) => setDefaultPriority(e.target.value as LeadPriority)}
                  className={inputCls}
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              {/* Default Source */}
              <div>
                <label className="block text-[11px] font-semibold mb-1 text-slate-600 dark:text-slate-300">
                  Default Source
                </label>
                <select
                  value={defaultSource}
                  onChange={(e) => setDefaultSource(e.target.value)}
                  className={inputCls}
                >
                  {sources.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Default Owner */}
              <div>
                <label className="block text-[11px] font-semibold mb-1 text-slate-600 dark:text-slate-300">
                  Assign Owner
                </label>
                <select
                  value={defaultOwner}
                  onChange={(e) => setDefaultOwner(e.target.value)}
                  className={inputCls}
                >
                  {ownersList.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                id="apply-stage-all"
                type="checkbox"
                checked={applyStageToAll}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setApplyStageToAll(checked);
                  if (checked && parsedLeads.length > 0) {
                    setParsedLeads((prev) =>
                      prev.map((l) => ({ ...l, status: selectedStage as LeadStatus }))
                    );
                  }
                }}
                className="rounded border-slate-300 text-sky-500 focus:ring-sky-500"
              />
              <label
                htmlFor="apply-stage-all"
                className="text-xs text-slate-600 dark:text-slate-300 cursor-pointer select-none"
              >
                Assign selected stage (<span className="font-bold text-sky-500">{selectedStage}</span>) to all uploaded leads (uncheck to use per-row stage from CSV if provided)
              </label>
            </div>
          </div>

          {/* Step 2: File Dropzone & Sample Template */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                2. Upload Lead File (.CSV or .JSON)
              </span>
              <button
                type="button"
                onClick={handleDownloadSample}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Sample CSV Template</span>
              </button>
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-sky-500 bg-sky-500/10'
                  : isLight
                  ? 'border-sky-200 hover:border-sky-400 bg-slate-50/60 hover:bg-sky-50/40'
                  : 'border-slate-700 hover:border-sky-500 bg-slate-800/40 hover:bg-slate-800/80'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.tsv,.txt,.json"
                onChange={handleFileChange}
                className="hidden"
              />
              <FileSpreadsheet className="w-9 h-9 text-sky-500 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                {fileName ? `Loaded: ${fileName}` : 'Click to browse or drag & drop your lead file here'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Supports CSV, TSV, or JSON • Columns: Name, Company, Title, Email, Phone, WhatsApp, Value, Priority, Source, Owner, Stage
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          {/* Step 3: Preview Parsed Leads */}
          {parsedLeads.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                  3. Preview Ready to Import ({parsedLeads.length} Leads)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setParsedLeads([]);
                    setFileName(null);
                  }}
                  className="text-xs font-semibold text-rose-500 hover:underline"
                >
                  Clear File
                </button>
              </div>

              <div
                className={`rounded-xl border overflow-hidden max-h-64 overflow-y-auto ${
                  isLight ? 'border-sky-100' : 'border-slate-800'
                }`}
              >
                <table className="w-full text-left text-xs">
                  <thead
                    className={`sticky top-0 text-[10px] font-bold uppercase ${
                      isLight ? 'bg-slate-100 text-slate-500' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <tr>
                      <th className="py-2 px-3">Name</th>
                      <th className="py-2 px-3">Company</th>
                      <th className="py-2 px-3">Email / Phone</th>
                      <th className="py-2 px-3">Value</th>
                      <th className="py-2 px-3">Stage</th>
                      <th className="py-2 px-3">Owner</th>
                      <th className="py-2 px-2 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800">
                    {parsedLeads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-sky-500/5">
                        <td className="py-2 px-3 font-bold text-slate-800 dark:text-white">
                          {lead.name}
                          <div className="text-[10px] font-normal text-slate-400">{lead.title}</div>
                        </td>
                        <td className="py-2 px-3 text-slate-600 dark:text-slate-300">{lead.company}</td>
                        <td className="py-2 px-3 text-[11px] text-slate-500">
                          <div>{lead.email}</div>
                          <div className="text-[10px] text-slate-400">{lead.phone}</div>
                        </td>
                        <td className="py-2 px-3 font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                          {currency.symbol}{lead.value.toLocaleString()}
                        </td>
                        <td className="py-2 px-3">
                          <select
                            value={lead.status}
                            onChange={(e) => handleRowStageChange(lead.id, e.target.value)}
                            className={`text-[11px] font-bold px-2 py-1 rounded-lg border outline-none ${
                              isLight
                                ? 'bg-sky-50 border-sky-200 text-sky-700'
                                : 'bg-slate-800 border-slate-700 text-sky-300'
                            }`}
                          >
                            {stages.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                            {!stages.includes(lead.status) && (
                              <option value={lead.status}>{lead.status} (New)</option>
                            )}
                          </select>
                        </td>
                        <td className="py-2 px-3 text-slate-600 dark:text-slate-300">{lead.owner}</td>
                        <td className="py-2 px-2 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemovePreviewRow(lead.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-500"
                            title="Remove row"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-sky-100/30 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="text-xs text-slate-500">
            {parsedLeads.length > 0 ? (
              <span>
                Ready to import <strong className="text-sky-500">{parsedLeads.length}</strong> leads into stage{' '}
                <strong className="text-emerald-500">{selectedStage}</strong>
              </span>
            ) : (
              <span>Upload a file to preview and import leads</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                isLight
                  ? 'border-slate-200 text-slate-600 hover:bg-slate-100'
                  : 'border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={parsedLeads.length === 0}
              onClick={handleConfirmImport}
              className={`px-5 py-2 rounded-lg text-xs font-bold text-white flex items-center gap-1.5 transition-all ${
                parsedLeads.length > 0
                  ? 'bg-sky-500 hover:bg-sky-600 shadow-md shadow-sky-500/25 cursor-pointer'
                  : 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed opacity-60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Import {parsedLeads.length > 0 ? `${parsedLeads.length} Leads` : 'Leads'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
