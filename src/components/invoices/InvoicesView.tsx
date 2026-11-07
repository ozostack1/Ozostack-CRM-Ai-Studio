import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Plus,
  Search,
  Receipt,
  FileText,
  FileCheck2,
  FileSpreadsheet,
  Edit3,
  Trash2,
  Clock,
  Image as ImageIcon,
  List,
  LayoutGrid,
  Download,
  Check,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import {
  INITIAL_DETAILED_INVOICES,
  INITIAL_PROPOSALS,
  INITIAL_QUOTATIONS,
  INITIAL_CONTRACTS,
  DEFAULT_INVOICE_BRANDING,
} from '../../data/mockData';
import {
  Invoice,
  ProposalDocument,
  QuotationDocument,
  ContractDocument,
  InvoiceBranding,
} from '../../types/crm';
import { DocumentPreviewModal, PreviewDocType } from './DocumentPreviewModal';
import { InvoiceEditModal } from './InvoiceEditModal';
import { ChangeLogoModal } from './ChangeLogoModal';
import { useSystemCurrency, formatMoney } from '../../data/currencyService';

const STORAGE_INVOICES_KEY = 'ozostack_invoices';
const STORAGE_PROPOSALS_KEY = 'ozostack_proposals';
const STORAGE_QUOTATIONS_KEY = 'ozostack_quotations';
const STORAGE_CONTRACTS_KEY = 'ozostack_contracts';
const STORAGE_BRANDING_KEY = 'ozostack_invoice_branding';

type HorizontalTab = 'invoices' | 'proposals' | 'quotations' | 'contracts';

export const InvoicesView: React.FC = () => {
  const { theme, setActiveNav } = useTheme();
  const isLight = theme === 'white-sky';
  const currency = useSystemCurrency();

  // Active Horizontal Tab
  const [activeTab, setActiveTab] = useState<HorizontalTab>('invoices');
  const [layoutMode, setLayoutMode] = useState<'table' | 'cards'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Document Branding State
  const [branding, setBranding] = useState<InvoiceBranding>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_BRANDING_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_INVOICE_BRANDING;
  });

  // Invoices State
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_INVOICES_KEY);
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_DETAILED_INVOICES;
  });

  // Proposals State
  const [proposals, setProposals] = useState<ProposalDocument[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_PROPOSALS_KEY);
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_PROPOSALS;
  });

  // Quotations State
  const [quotations, setQuotations] = useState<QuotationDocument[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_QUOTATIONS_KEY);
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_QUOTATIONS;
  });

  // Contracts State
  const [contracts, setContracts] = useState<ContractDocument[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_CONTRACTS_KEY);
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_CONTRACTS;
  });

  // Modals state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Sync to Local Storage
  useEffect(() => {
    localStorage.setItem(STORAGE_INVOICES_KEY, JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PROPOSALS_KEY, JSON.stringify(proposals));
  }, [proposals]);

  useEffect(() => {
    localStorage.setItem(STORAGE_QUOTATIONS_KEY, JSON.stringify(quotations));
  }, [quotations]);

  useEffect(() => {
    localStorage.setItem(STORAGE_CONTRACTS_KEY, JSON.stringify(contracts));
  }, [contracts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_BRANDING_KEY, JSON.stringify(branding));
  }, [branding]);

  // Save document from Edit Modal
  const handleSaveDocument = (docType: PreviewDocType, updatedData: any) => {
    if (docType === 'invoice') {
      setInvoices((prev) => {
        const exists = prev.some((it) => it.id === updatedData.id);
        return exists ? prev.map((it) => (it.id === updatedData.id ? updatedData : it)) : [updatedData, ...prev];
      });
    } else if (docType === 'proposal') {
      setProposals((prev) => {
        const exists = prev.some((it) => it.id === updatedData.id);
        return exists ? prev.map((it) => (it.id === updatedData.id ? updatedData : it)) : [updatedData, ...prev];
      });
    } else if (docType === 'quotation') {
      setQuotations((prev) => {
        const exists = prev.some((it) => it.id === updatedData.id);
        return exists ? prev.map((it) => (it.id === updatedData.id ? updatedData : it)) : [updatedData, ...prev];
      });
    } else if (docType === 'contract') {
      setContracts((prev) => {
        const exists = prev.some((it) => it.id === updatedData.id);
        return exists ? prev.map((it) => (it.id === updatedData.id ? updatedData : it)) : [updatedData, ...prev];
      });
    }
    setSelectedDoc(updatedData);
  };

  // Delete handlers
  const handleDeleteDocument = (id: string) => {
    if (activeTab === 'invoices') {
      setInvoices((prev) => {
        const next = prev.filter((it) => it.id !== id);
        try {
          localStorage.setItem(STORAGE_INVOICES_KEY, JSON.stringify(next));
        } catch {}
        return next;
      });
    } else if (activeTab === 'proposals') {
      setProposals((prev) => {
        const next = prev.filter((it) => it.id !== id);
        try {
          localStorage.setItem(STORAGE_PROPOSALS_KEY, JSON.stringify(next));
        } catch {}
        return next;
      });
    } else if (activeTab === 'quotations') {
      setQuotations((prev) => {
        const next = prev.filter((it) => it.id !== id);
        try {
          localStorage.setItem(STORAGE_QUOTATIONS_KEY, JSON.stringify(next));
        } catch {}
        return next;
      });
    } else if (activeTab === 'contracts') {
      setContracts((prev) => {
        const next = prev.filter((it) => it.id !== id);
        try {
          localStorage.setItem(STORAGE_CONTRACTS_KEY, JSON.stringify(next));
        } catch {}
        return next;
      });
    }
    setDeletingId(null);
    window.dispatchEvent(new CustomEvent('ozostack-crm-config-changed'));
  };

  // Quick Status Updater
  const handleUpdateDocumentStatus = (id: string, newStatus: string) => {
    if (activeTab === 'invoices') {
      setInvoices((prev) =>
        prev.map((it) => (it.id === id ? { ...it, status: newStatus as any } : it))
      );
    } else if (activeTab === 'proposals') {
      setProposals((prev) =>
        prev.map((it) => (it.id === id ? { ...it, status: newStatus as any } : it))
      );
    } else if (activeTab === 'quotations') {
      setQuotations((prev) =>
        prev.map((it) => (it.id === id ? { ...it, status: newStatus as any } : it))
      );
    } else if (activeTab === 'contracts') {
      setContracts((prev) =>
        prev.map((it) => (it.id === id ? { ...it, status: newStatus as any } : it))
      );
    }

    if (selectedDoc && selectedDoc.id === id) {
      setSelectedDoc((prev: any) => ({ ...prev, status: newStatus }));
    }
  };

  // Export CSV for active tab
  const handleExportAllCsv = () => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];

    if (activeTab === 'invoices') {
      headers = ['Invoice #', 'Client', 'Amount', 'Status', 'Issue Date', 'Due Date', 'Payment Method'];
      rows = filteredInvoices.map((i) => [
        i.invoiceNumber,
        `"${i.client.replace(/"/g, '""')}"`,
        i.amount,
        i.status,
        i.issueDate || '',
        i.dueDate || '',
        i.paymentMethod || '',
      ]);
    } else if (activeTab === 'proposals') {
      headers = ['Proposal #', 'Title', 'Client', 'Value ($)', 'Status', 'Issue Date', 'Valid Until'];
      rows = filteredProposals.map((p) => [
        p.proposalNumber,
        `"${p.title.replace(/"/g, '""')}"`,
        `"${p.client.replace(/"/g, '""')}"`,
        p.value,
        p.status,
        p.issueDate,
        p.validUntil,
      ]);
    } else if (activeTab === 'quotations') {
      headers = ['Quotation #', 'Title', 'Client', 'Total Amount ($)', 'Status', 'Issue Date', 'Valid Until'];
      rows = filteredQuotations.map((q) => [
        q.quotationNumber,
        `"${q.title.replace(/"/g, '""')}"`,
        `"${q.client.replace(/"/g, '""')}"`,
        q.totalAmount,
        q.status,
        q.issueDate,
        q.validUntil,
      ]);
    } else if (activeTab === 'contracts') {
      headers = ['Contract #', 'Title', 'Client', 'Value', 'Cadence', 'Status', 'Start Date', 'End Date'];
      rows = filteredContracts.map((c) => [
        c.contractNumber,
        `"${c.title.replace(/"/g, '""')}"`,
        `"${c.client.replace(/"/g, '""')}"`,
        `"${c.contractValueFormatted}"`,
        c.billingCadence,
        c.status,
        c.startDate,
        c.endDate,
      ]);
    }

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Ozostack_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Open Preview Modal
  const handleOpenPreview = (item: any) => {
    setSelectedDoc(item);
    setIsPreviewOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item: any) => {
    setSelectedDoc(item);
    setIsEditModalOpen(true);
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setSelectedDoc(null);
    setIsEditModalOpen(true);
  };

  // Filtered lists
  const filteredInvoices = useMemo(() => {
    return invoices.filter((it) => {
      const search = searchTerm.toLowerCase();
      const matchSearch =
        !searchTerm.trim() ||
        it.client.toLowerCase().includes(search) ||
        it.invoiceNumber.toLowerCase().includes(search);
      const matchStatus = statusFilter === 'All' || it.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [invoices, searchTerm, statusFilter]);

  const filteredProposals = useMemo(() => {
    return proposals.filter((it) => {
      const search = searchTerm.toLowerCase();
      const matchSearch =
        !searchTerm.trim() ||
        it.client.toLowerCase().includes(search) ||
        it.title.toLowerCase().includes(search) ||
        it.proposalNumber.toLowerCase().includes(search);
      const matchStatus = statusFilter === 'All' || it.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [proposals, searchTerm, statusFilter]);

  const filteredQuotations = useMemo(() => {
    return quotations.filter((it) => {
      const search = searchTerm.toLowerCase();
      const matchSearch =
        !searchTerm.trim() ||
        it.client.toLowerCase().includes(search) ||
        it.title.toLowerCase().includes(search) ||
        it.quotationNumber.toLowerCase().includes(search);
      const matchStatus = statusFilter === 'All' || it.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [quotations, searchTerm, statusFilter]);

  const filteredContracts = useMemo(() => {
    return contracts.filter((it) => {
      const search = searchTerm.toLowerCase();
      const matchSearch =
        !searchTerm.trim() ||
        it.client.toLowerCase().includes(search) ||
        it.title.toLowerCase().includes(search) ||
        it.contractNumber.toLowerCase().includes(search);
      const matchStatus = statusFilter === 'All' || it.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [contracts, searchTerm, statusFilter]);

  // Executive Metric Calculations
  const metrics = useMemo(() => {
    const totalInvoiced = invoices.reduce(
      (sum, it) => sum + (it.totalAmount || it.amountNumeric || 0),
      0
    );
    const paidInvoiced = invoices
      .filter((it) => it.status === 'Paid')
      .reduce((sum, it) => sum + (it.totalAmount || it.amountNumeric || 0), 0);
    const pendingInvoiced = invoices
      .filter((it) => it.status === 'Pending' || it.status === 'Overdue')
      .reduce((sum, it) => sum + (it.totalAmount || it.amountNumeric || 0), 0);

    const openProposalValue = proposals
      .filter((it) => it.status === 'Sent' || it.status === 'Approved')
      .reduce((sum, it) => sum + (it.value || 0), 0);

    const activeContractValue = contracts
      .filter((it) => it.status === 'Active')
      .reduce((sum, it) => sum + (it.contractValue || 0), 0);

    return {
      totalInvoiced,
      paidInvoiced,
      pendingInvoiced,
      openProposalValue,
      activeContractValue,
    };
  }, [invoices, proposals, contracts]);

  const getDocTypeForTab = (tab: HorizontalTab): PreviewDocType => {
    if (tab === 'invoices') return 'invoice';
    if (tab === 'proposals') return 'proposal';
    if (tab === 'quotations') return 'quotation';
    return 'contract';
  };

  const cardBg = isLight
    ? 'bg-white border-sky-100/90 shadow-xs'
    : 'bg-[#0f172a]/90 border-slate-800/80';

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl border bg-gradient-to-r from-sky-500/10 via-sky-400/5 to-transparent border-sky-200/60 dark:border-sky-500/20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveNav('Dashboard')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-sky-700 dark:text-sky-300 bg-white dark:bg-slate-800 border border-sky-200 dark:border-slate-700 shadow-xs hover:bg-sky-50 dark:hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>CEO Command Center</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-slate-800 dark:text-white">
                Invoices, Proposals & Contracts
              </h2>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Corporate Billing Suite
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage professional invoices, client proposals, estimates & active enterprise MSAs
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Export All CSV */}
          <button
            onClick={handleExportAllCsv}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors shadow-xs ${
              isLight
                ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          {/* Change Logo / Branding Button */}
          <button
            onClick={() => setIsLogoModalOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors shadow-xs ${
              isLight
                ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 text-sky-500" />
            <span>Change Logo & Branding</span>
          </button>

          {/* Create Button (Simple Sky Blue) */}
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-sky-500 hover:bg-sky-600 text-white shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>
              Create {activeTab.slice(0, -1)}
            </span>
          </button>
        </div>
      </div>

      {/* KPI Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className={`p-4 rounded-2xl border ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Invoiced
            </span>
            <div className="w-7 h-7 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-500">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {currency.symbol}{metrics.totalInvoiced.toLocaleString('en-US')}
            </span>
            <span className="text-xs font-bold text-emerald-500">
              {currency.symbol}{metrics.paidInvoiced.toLocaleString('en-US')} Paid
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Across {invoices.length} active invoices
          </p>
        </div>

        <div className={`p-4 rounded-2xl border ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Receivables Pending
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {currency.symbol}{metrics.pendingInvoiced.toLocaleString('en-US')}
            </span>
            <span className="text-xs font-bold text-amber-500">
              {invoices.filter((i) => i.status === 'Pending').length} Pending
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Awaiting client accounts payable clearing
          </p>
        </div>

        <div className={`p-4 rounded-2xl border ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Open Proposal Pipeline
            </span>
            <div className="w-7 h-7 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-500">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {currency.symbol}{metrics.openProposalValue.toLocaleString('en-US')}
            </span>
            <span className="text-xs font-bold text-sky-600 dark:text-sky-400">
              {proposals.length} Proposals
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Active quotes: {currency.symbol}{quotations.reduce((s, q) => s + q.totalAmount, 0).toLocaleString('en-US')}
          </p>
        </div>

        <div className={`p-4 rounded-2xl border ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Active Contracts (ARR)
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {currency.symbol}{metrics.activeContractValue.toLocaleString('en-US')}
            </span>
            <span className="text-xs font-bold text-emerald-500">
              {contracts.length} MSAs
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Active multi-year enterprise agreements
          </p>
        </div>
      </div>

      {/* HORIZONTAL TABS BAR */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => {
              setActiveTab('invoices');
              setStatusFilter('All');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'invoices'
                ? 'bg-sky-500 text-white shadow-xs'
                : isLight
                ? 'text-slate-600 hover:bg-sky-50'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Invoices</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === 'invoices'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {invoices.length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('proposals');
              setStatusFilter('All');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'proposals'
                ? 'bg-sky-500 text-white shadow-xs'
                : isLight
                ? 'text-slate-600 hover:bg-sky-50'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Proposals</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === 'proposals'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {proposals.length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('quotations');
              setStatusFilter('All');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'quotations'
                ? 'bg-sky-500 text-white shadow-xs'
                : isLight
                ? 'text-slate-600 hover:bg-sky-50'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Quotations</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === 'quotations'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {quotations.length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('contracts');
              setStatusFilter('All');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'contracts'
                ? 'bg-sky-500 text-white shadow-xs'
                : isLight
                ? 'text-slate-600 hover:bg-sky-50'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Contracts (MSA)</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === 'contracts'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {contracts.length}
            </span>
          </button>
        </div>

        {/* Layout Toggle */}
        <div className="flex items-center border rounded-lg overflow-hidden border-slate-200 dark:border-slate-700 self-end sm:self-auto">
          <button
            onClick={() => setLayoutMode('table')}
            title="Table View"
            className={`p-1.5 transition-colors ${
              layoutMode === 'table'
                ? 'bg-sky-500 text-white'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setLayoutMode('cards')}
            title="Cards View"
            className={`p-1.5 transition-colors ${
              layoutMode === 'cards'
                ? 'bg-sky-500 text-white'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className={`p-3.5 rounded-xl border flex flex-col md:flex-row gap-3 items-center justify-between ${cardBg}`}>
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={`Search ${activeTab} by client, title, reference #...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-sky-500 ${
              isLight
                ? 'bg-slate-50 border-slate-200 text-slate-800'
                : 'bg-slate-900 border-slate-700 text-slate-100'
            }`}
          />
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`text-xs py-1.5 px-3 rounded-lg border focus:outline-none focus:ring-1 focus:ring-sky-500 ${
              isLight
                ? 'bg-white border-slate-200 text-slate-700'
                : 'bg-slate-800 border-slate-700 text-slate-200'
            }`}
          >
            <option value="All">All Statuses</option>
            {activeTab === 'invoices' && (
              <>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Overdue">Overdue</option>
                <option value="Draft">Draft</option>
              </>
            )}
            {activeTab === 'proposals' && (
              <>
                <option value="Sent">Sent</option>
                <option value="Approved">Approved</option>
                <option value="Declined">Declined</option>
                <option value="Draft">Draft</option>
              </>
            )}
            {activeTab === 'quotations' && (
              <>
                <option value="Sent">Sent</option>
                <option value="Accepted">Accepted</option>
                <option value="Expired">Expired</option>
                <option value="Draft">Draft</option>
              </>
            )}
            {activeTab === 'contracts' && (
              <>
                <option value="Active">Active</option>
                <option value="Pending Signature">Pending Signature</option>
                <option value="Completed">Completed</option>
                <option value="Terminated">Terminated</option>
              </>
            )}
          </select>
        </div>
      </div>

      {/* TAB CONTENT: INVOICES */}
      {activeTab === 'invoices' && (
        <div>
          {layoutMode === 'table' ? (
            <div className={`rounded-xl border overflow-hidden ${cardBg}`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr
                      className={`text-[11px] font-bold uppercase tracking-wider border-b ${
                        isLight
                          ? 'bg-slate-50/80 text-slate-400 border-slate-100'
                          : 'bg-slate-900/80 text-slate-400 border-slate-800'
                      }`}
                    >
                      <th className="py-3 px-4">Invoice #</th>
                      <th className="py-3 px-4">Client Organization</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Issue Date</th>
                      <th className="py-3 px-4">Due Date</th>
                      <th className="py-3 px-4">Payment Method</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {filteredInvoices.map((inv) => (
                      <tr
                        key={inv.id}
                        className={`hover:bg-sky-50/30 dark:hover:bg-slate-800/40 transition-colors`}
                      >
                        <td className="py-3 px-4 font-mono font-bold text-sky-600 dark:text-sky-400">
                          {inv.invoiceNumber}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-800 dark:text-white block">
                            {inv.client}
                          </span>
                          <span className="text-[11px] text-slate-400 truncate block max-w-[200px]">
                            {inv.clientEmail}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-black text-slate-900 dark:text-white">
                          {formatMoney(inv.amount, currency)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              inv.status === 'Paid'
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                : inv.status === 'Pending'
                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                                : inv.status === 'Overdue'
                                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-600'
                            }`}
                          >
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500">{inv.issueDate || '2025-05-01'}</td>
                        <td className="py-3 px-4 text-slate-500">{inv.dueDate || '2025-05-15'}</td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                          {inv.paymentMethod || 'Wire Transfer'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {inv.status !== 'Paid' && (
                              <button
                                onClick={() => handleUpdateDocumentStatus(inv.id, 'Paid')}
                                title="Quick Mark Paid"
                                className="px-2 py-1 text-[11px] font-bold rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white transition-colors"
                              >
                                Mark Paid
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenPreview(inv)}
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 hover:bg-sky-100 transition-colors"
                            >
                              Preview
                            </button>
                            <button
                              onClick={() => handleOpenEdit(inv)}
                              className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            {deletingId === inv.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleDeleteDocument(inv.id)}
                                  className="text-[10px] font-bold text-rose-600"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => setDeletingId(null)}
                                  className="text-[10px] text-slate-400"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeletingId(inv.id)}
                                className="p-1 rounded text-slate-400 hover:text-rose-500"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredInvoices.map((inv) => (
                <div key={inv.id} className={`p-4 rounded-2xl border ${cardBg} space-y-3`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-xs font-bold text-sky-600 dark:text-sky-400">
                        {inv.invoiceNumber}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                        {inv.client}
                      </h4>
                    </div>
                    <span className="text-base font-black text-slate-900 dark:text-white">
                      {formatMoney(inv.amount, currency)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400">Due: {inv.dueDate || '2025-05-15'}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        inv.status === 'Paid'
                          ? 'bg-emerald-500/15 text-emerald-600'
                          : inv.status === 'Pending'
                          ? 'bg-amber-500/15 text-amber-600'
                          : 'bg-rose-500/15 text-rose-600'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenPreview(inv)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-sky-500 hover:bg-sky-600 text-white shadow-xs"
                      >
                        View Invoice
                      </button>
                      {inv.status !== 'Paid' && (
                        <button
                          onClick={() => handleUpdateDocumentStatus(inv.id, 'Paid')}
                          className="px-2.5 py-1.5 text-xs font-bold rounded-xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-colors"
                        >
                          Mark Paid
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(inv)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteDocument(inv.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: PROPOSALS */}
      {activeTab === 'proposals' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredProposals.map((prop) => (
            <div key={prop.id} className={`p-5 rounded-2xl border ${cardBg} space-y-3.5`}>
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-sky-600 dark:text-sky-400">
                    {prop.proposalNumber}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                    {prop.title}
                  </h4>
                  <p className="text-xs text-slate-400 font-medium">{prop.client}</p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    prop.status === 'Approved'
                      ? 'bg-emerald-500/15 text-emerald-600'
                      : prop.status === 'Sent'
                      ? 'bg-amber-500/15 text-amber-600'
                      : 'bg-rose-500/15 text-rose-600'
                  }`}
                >
                  {prop.status}
                </span>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                {prop.scope}
              </p>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between text-xs">
                <span className="text-slate-400">Project Value:</span>
                <span className="text-sm font-black text-slate-900 dark:text-white">
                  {formatMoney(prop.valueFormatted, currency)}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenPreview(prop)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-sky-500 hover:bg-sky-600 text-white shadow-xs"
                  >
                    Inspect Proposal
                  </button>
                  {prop.status === 'Sent' && (
                    <button
                      onClick={() => handleUpdateDocumentStatus(prop.id, 'Approved')}
                      className="px-2.5 py-1.5 text-xs font-bold rounded-xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-colors"
                    >
                      Approve
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(prop)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteDocument(prop.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB CONTENT: QUOTATIONS */}
      {activeTab === 'quotations' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredQuotations.map((quo) => (
            <div key={quo.id} className={`p-5 rounded-2xl border ${cardBg} space-y-3.5`}>
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-sky-600 dark:text-sky-400">
                    {quo.quotationNumber}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                    {quo.title}
                  </h4>
                  <p className="text-xs text-slate-400 font-medium">{quo.client}</p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    quo.status === 'Accepted'
                      ? 'bg-emerald-500/15 text-emerald-600'
                      : quo.status === 'Sent'
                      ? 'bg-amber-500/15 text-amber-600'
                      : 'bg-rose-500/15 text-rose-600'
                  }`}
                >
                  {quo.status}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between text-xs">
                <span className="text-slate-400">Total Quote:</span>
                <span className="text-sm font-black text-slate-900 dark:text-white">
                  {formatMoney(quo.totalFormatted, currency)}
                </span>
              </div>

              <p className="text-[11px] text-slate-400">Valid until {quo.validUntil}</p>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenPreview(quo)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-sky-500 hover:bg-sky-600 text-white shadow-xs"
                  >
                    View Quote Template
                  </button>
                  {quo.status === 'Sent' && (
                    <button
                      onClick={() => handleUpdateDocumentStatus(quo.id, 'Accepted')}
                      className="px-2.5 py-1.5 text-xs font-bold rounded-xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-colors"
                    >
                      Accept
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(quo)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteDocument(quo.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB CONTENT: CONTRACTS */}
      {activeTab === 'contracts' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredContracts.map((ctr) => (
            <div key={ctr.id} className={`p-5 rounded-2xl border ${cardBg} space-y-4`}>
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-sky-600 dark:text-sky-400">
                    {ctr.contractNumber}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                    {ctr.title}
                  </h4>
                  <p className="text-xs text-slate-400 font-semibold">{ctr.client}</p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    ctr.status === 'Active'
                      ? 'bg-emerald-500/15 text-emerald-600'
                      : ctr.status === 'Pending Signature'
                      ? 'bg-amber-500/15 text-amber-600'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {ctr.status}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-sky-50/50 dark:bg-slate-900/60 border border-sky-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Contract Value
                  </span>
                  <span className="text-base font-black text-slate-900 dark:text-white">
                    {formatMoney(ctr.contractValueFormatted, currency)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Billing Cadence
                  </span>
                  <span className="text-xs font-bold text-sky-600 dark:text-sky-400">
                    {ctr.billingCadence}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                {ctr.scopeSummary}
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenPreview(ctr)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-sky-500 hover:bg-sky-600 text-white shadow-xs"
                  >
                    Preview Contract
                  </button>
                  {ctr.status === 'Pending Signature' && (
                    <button
                      onClick={() => handleUpdateDocumentStatus(ctr.id, 'Active')}
                      className="px-2.5 py-1.5 text-xs font-bold rounded-xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-colors"
                    >
                      Sign & Activate
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(ctr)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteDocument(ctr.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        docType={getDocTypeForTab(activeTab)}
        document={selectedDoc}
        branding={branding}
        onOpenChangeLogo={() => {
          setIsPreviewOpen(false);
          setIsLogoModalOpen(true);
        }}
        onEdit={() => {
          setIsPreviewOpen(false);
          setIsEditModalOpen(true);
        }}
        onUpdateStatus={(newStatus) => handleUpdateDocumentStatus(selectedDoc?.id, newStatus)}
        onUpdateBranding={(updated) => setBranding(updated)}
        onUpdateDocument={(docType, updatedDoc) => handleSaveDocument(docType, updatedDoc)}
      />

      {/* Create / Edit Document Modal */}
      <InvoiceEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        docType={getDocTypeForTab(activeTab)}
        initialData={selectedDoc}
        onSave={handleSaveDocument}
      />

      {/* Change Logo & Branding Modal */}
      <ChangeLogoModal
        isOpen={isLogoModalOpen}
        onClose={() => setIsLogoModalOpen(false)}
        branding={branding}
        onSaveBranding={(updated) => setBranding(updated)}
      />
    </div>
  );
};
