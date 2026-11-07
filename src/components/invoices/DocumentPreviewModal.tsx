import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Printer,
  Download,
  Image as ImageIcon,
  Edit3,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileSpreadsheet,
  Check,
  ChevronDown,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useSystemCurrency } from '../../data/currencyService';
import {
  Invoice,
  ProposalDocument,
  QuotationDocument,
  ContractDocument,
  InvoiceBranding,
  DocTemplateId,
  PaperSize,
  TaxCalculationMode,
} from '../../types/crm';

export type PreviewDocType = 'invoice' | 'proposal' | 'quotation' | 'contract';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  docType: PreviewDocType;
  document: Invoice | ProposalDocument | QuotationDocument | ContractDocument | null;
  branding: InvoiceBranding;
  onOpenChangeLogo: () => void;
  onEdit: () => void;
  onUpdateStatus?: (newStatus: string) => void;
  onUpdateBranding?: (updated: InvoiceBranding) => void;
  onUpdateDocument?: (docType: PreviewDocType, updatedDoc: any) => void;
}

const TEMPLATES: { id: DocTemplateId; name: string; description: string }[] = [
  { id: 'modern', name: 'Modern Sky', description: 'Clean sky-blue accents, modern sans-serif, rounded badges' },
  { id: 'corporate', name: 'Corporate Classic', description: 'Deep header band, formal serif headings, double borders' },
  { id: 'minimal', name: 'Minimalist Clean', description: 'High contrast black & white, stark borders, refined typography' },
  { id: 'creative', name: 'Tech Dark-Accent', description: 'Dark slate headers, shaded line items, modern tech tags' },
];

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  isOpen,
  onClose,
  docType: passedDocType,
  document: doc,
  branding,
  onOpenChangeLogo,
  onEdit,
  onUpdateStatus,
  onUpdateBranding,
  onUpdateDocument,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'white-sky';
  const currency = useSystemCurrency();
  const printRef = useRef<HTMLDivElement>(null);

  // Auto-detect exact document type from data attributes
  const actualDocType: PreviewDocType =
    (doc as any)?.proposalNumber
      ? 'proposal'
      : (doc as any)?.quotationNumber
      ? 'quotation'
      : (doc as any)?.contractNumber
      ? 'contract'
      : (doc as any)?.invoiceNumber
      ? 'invoice'
      : passedDocType;

  // Template and Paper size states
  const [selectedTemplate, setSelectedTemplate] = useState<DocTemplateId>('modern');
  const [paperSize, setPaperSize] = useState<PaperSize>('a4');
  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);

  // Interactive Tax Configuration States
  const [activeTaxMode, setActiveTaxMode] = useState<TaxCalculationMode>('none');
  const [activeTaxRate, setActiveTaxRate] = useState<number>(0);
  const [activeTaxName, setActiveTaxName] = useState<string>('VAT');

  // Editable Bank Remittance & Payment Terms States (3rd Screenshot Requirement)
  const [isFooterEditOpen, setIsFooterEditOpen] = useState(false);
  const [editedBankDetails, setEditedBankDetails] = useState(branding.bankDetails);
  const [editedTerms, setEditedTerms] = useState(
    (doc as any)?.terms || 'Payment due within 15 days of invoice date. Wire details specified below.'
  );

  // Sync editedBankDetails and editedTerms whenever branding or doc changes
  useEffect(() => {
    if (branding?.bankDetails) {
      setEditedBankDetails(branding.bankDetails);
    }
  }, [branding?.bankDetails]);

  useEffect(() => {
    if (doc) {
      const currentTerms =
        (doc as any).terms ||
        'Payment due within 15 days of invoice date. Wire details specified below.';
      setEditedTerms(currentTerms);
    }
  }, [doc]);

  // Handler to persist edited Bank Remittance & Terms across app and localStorage
  const handleSaveFooter = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // 1. Update branding with new bank details
    const updatedBranding: InvoiceBranding = {
      ...branding,
      bankDetails: editedBankDetails,
    };
    try {
      localStorage.setItem('ozostack_invoice_branding', JSON.stringify(updatedBranding));
    } catch (err) {
      console.error(err);
    }
    onUpdateBranding?.(updatedBranding);

    // 2. Update document with new terms
    if (doc) {
      const updatedDoc = {
        ...doc,
        terms: editedTerms,
      };
      onUpdateDocument?.(actualDocType, updatedDoc);

      try {
        const storageKey =
          actualDocType === 'invoice'
            ? 'ozostack_invoices'
            : actualDocType === 'proposal'
            ? 'ozostack_proposals'
            : actualDocType === 'quotation'
            ? 'ozostack_quotations'
            : 'ozostack_contracts';
        const storedStr = localStorage.getItem(storageKey);
        if (storedStr) {
          const list = JSON.parse(storedStr);
          const updatedList = list.map((item: any) =>
            item.id === doc.id ? { ...item, terms: editedTerms } : item
          );
          localStorage.setItem(storageKey, JSON.stringify(updatedList));
        }
      } catch (err) {
        console.error(err);
      }
    }

    setIsFooterEditOpen(false);
  };

  // Sync tax configuration when doc opens or changes
  useEffect(() => {
    if (doc) {
      const mode: TaxCalculationMode =
        (doc as any).taxMode ||
        ((doc as any).taxRate && (doc as any).taxRate > 0 ? 'exclusive' : 'none');
      setActiveTaxMode(mode);
      const rate =
        (doc as any).taxRate !== undefined && (doc as any).taxRate > 0
          ? (doc as any).taxRate
          : mode === 'none'
          ? 0
          : 18;
      setActiveTaxRate(rate);
      setActiveTaxName((doc as any).taxName || 'VAT');
    }
  }, [doc]);

  if (!isOpen || !doc) return null;

  const invoiceDoc = actualDocType === 'invoice' ? (doc as Invoice) : null;
  const proposalDoc = actualDocType === 'proposal' ? (doc as ProposalDocument) : null;
  const quoteDoc = actualDocType === 'quotation' ? (doc as QuotationDocument) : null;
  const contractDoc = actualDocType === 'contract' ? (doc as ContractDocument) : null;

  const docNumber =
    invoiceDoc?.invoiceNumber ||
    proposalDoc?.proposalNumber ||
    quoteDoc?.quotationNumber ||
    contractDoc?.contractNumber ||
    'DOC-2025';

  const docTitle =
    actualDocType === 'invoice'
      ? 'TAX INVOICE'
      : actualDocType === 'proposal'
      ? 'PROJECT PROPOSAL'
      : actualDocType === 'quotation'
      ? 'PRICE ESTIMATE / QUOTATION'
      : 'MASTER SERVICES CONTRACT (MSA)';

  const lineItems = invoiceDoc?.lineItems || quoteDoc?.lineItems || [];
  const rawSum = lineItems.reduce((acc, it) => acc + (it.total || 0), 0);

  // Base raw amount resolution across all document types
  const baseRawValue =
    lineItems.length > 0
      ? rawSum
      : ((doc as any).subtotal ??
         proposalDoc?.value ??
         contractDoc?.contractValue ??
         (doc as any).amountNumeric ??
         (doc as any).totalAmount ??
         rawSum);

  // Real-time tax math resolution
  const effectiveTaxRate = activeTaxRate > 0 ? activeTaxRate : 18;
  let subtotal = baseRawValue;
  let taxAmount = 0;
  let totalAmount = baseRawValue;

  if (activeTaxMode === 'none') {
    subtotal = baseRawValue;
    taxAmount = 0;
    totalAmount = baseRawValue;
  } else if (activeTaxMode === 'exclusive') {
    subtotal = baseRawValue;
    taxAmount = Math.round((baseRawValue * effectiveTaxRate) / 100);
    totalAmount = subtotal + taxAmount;
  } else if (activeTaxMode === 'inclusive') {
    totalAmount = baseRawValue;
    subtotal = Math.round(baseRawValue / (1 + effectiveTaxRate / 100));
    taxAmount = totalAmount - subtotal;
  }

  // Generates clean standalone HTML for iframe print and HTML download (Zero margins = No page # or browser header/footers)
  const buildStandaloneHtml = (content: string) => {
    const isA4 = paperSize === 'a4';
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title></title>
  <style>
    @page {
      size: ${isA4 ? 'A4 portrait' : 'letter portrait'};
      margin: 0mm !important;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
      color: #0f172a !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: ${isA4 ? '12.5px' : '12px'};
      line-height: 1.45;
      height: 100%;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .print-doc-container {
      width: 100%;
      max-width: ${isA4 ? '794px' : '816px'};
      min-height: ${isA4 ? '1060px' : '980px'};
      margin: 0 auto;
      padding: ${isA4 ? '10mm 12mm' : '0.4in 0.5in'} !important;
      display: flex !important;
      flex-direction: column !important;
      justify-content: space-between !important;
      box-sizing: border-box !important;
      background: #ffffff !important;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    tr, th, td {
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .flex { display: flex !important; }
    .flex-col { flex-direction: column !important; }
    .flex-row, .sm\\:flex-row { flex-direction: row !important; }
    .items-center, .sm\\:items-center { align-items: center !important; }
    .items-start { align-items: flex-start !important; }
    .items-end { align-items: flex-end !important; }
    .justify-between { justify-content: space-between !important; }
    .justify-end { justify-content: flex-end !important; }
    .grid { display: grid !important; }
    .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)) !important; }
    .grid-cols-2, .sm\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
    .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
    .gap-1 { gap: 4px !important; }
    .gap-1\\.5 { gap: 6px !important; }
    .gap-2 { gap: 8px !important; }
    .gap-2\\.5 { gap: 10px !important; }
    .gap-3 { gap: 12px !important; }
    .gap-4 { gap: 16px !important; }
    .gap-6 { gap: 24px !important; }
    .gap-8 { gap: 32px !important; }
    .shrink-0 { flex-shrink: 0 !important; }
    .grow, .flex-1 { flex: 1 1 0% !important; min-width: 0 !important; }
    .min-w-0 { min-width: 0 !important; }
    .w-auto { width: auto !important; }
    .w-full { width: 100% !important; }
    .h-full { height: 100% !important; }
    .w-8 { width: 32px !important; }
    .h-8 { height: 32px !important; }
    .w-9 { width: 36px !important; }
    .h-9 { height: 36px !important; }
    .w-10 { width: 40px !important; }
    .h-10 { height: 40px !important; }
    .h-12 { height: 48px !important; }
    .w-16 { width: 64px !important; }
    .w-24 { width: 96px !important; }
    .w-28 { width: 112px !important; }
    .w-32 { width: 128px !important; }
    .w-64, .sm\\:w-64 { width: 256px !important; }
    .w-72 { width: 288px !important; }
    .min-h-\\[1060px\\] { min-height: 1060px !important; }
    .min-h-\\[980px\\] { min-height: 980px !important; }
    .max-w-\\[140px\\] { max-width: 140px !important; }
    .object-contain { object-fit: contain !important; }
    .p-2 { padding: 8px !important; }
    .p-2\\.5 { padding: 10px !important; }
    .p-3 { padding: 12px !important; }
    .p-3\\.5 { padding: 14px !important; }
    .p-4 { padding: 16px !important; }
    .p-5 { padding: 20px !important; }
    .p-6, .sm\\:p-6 { padding: 24px !important; }
    .p-8, .sm\\:p-8 { padding: 32px !important; }
    .py-1 { padding-top: 4px; padding-bottom: 4px; }
    .py-1\\.5 { padding-top: 6px; padding-bottom: 6px; }
    .py-2 { padding-top: 8px; padding-bottom: 8px; }
    .py-2\\.5 { padding-top: 10px; padding-bottom: 10px; }
    .py-3 { padding-top: 12px; padding-bottom: 12px; }
    .px-2 { padding-left: 8px; padding-right: 8px; }
    .px-2\\.5 { padding-left: 10px; padding-right: 10px; }
    .px-3 { padding-left: 12px; padding-right: 12px; }
    .px-3\\.5 { padding-left: 14px; padding-right: 14px; }
    .pt-1 { padding-top: 4px; }
    .pt-2 { padding-top: 8px; }
    .pt-2\\.5 { padding-top: 10px; }
    .pt-3 { padding-top: 12px; }
    .pt-4 { padding-top: 16px; }
    .pt-5 { padding-top: 20px; }
    .pt-6 { padding-top: 24px; }
    .pb-1 { padding-bottom: 4px; }
    .pb-1\\.5 { padding-bottom: 6px; }
    .pb-2 { padding-bottom: 8px; }
    .pb-3 { padding-bottom: 12px; }
    .pb-4 { padding-bottom: 16px; }
    .my-2 { margin-top: 8px !important; margin-bottom: 8px !important; }
    .my-3 { margin-top: 12px !important; margin-bottom: 12px !important; }
    .my-4 { margin-top: 16px !important; margin-bottom: 16px !important; }
    .mb-0\\.5 { margin-bottom: 2px !important; }
    .mb-1 { margin-bottom: 4px !important; }
    .mb-1\\.5 { margin-bottom: 6px !important; }
    .mb-2 { margin-bottom: 8px !important; }
    .mb-3 { margin-bottom: 12px !important; }
    .mb-4 { margin-bottom: 16px !important; }
    .border { border: 1px solid #e2e8f0; }
    .border-b { border-bottom: 1px solid #e2e8f0; }
    .border-t { border-top: 1px solid #e2e8f0; }
    .border-2 { border-width: 2px; }
    .border-b-2 { border-bottom-width: 2px !important; }
    .border-t-2 { border-top-width: 2px !important; }
    .border-dashed { border-style: dashed; }
    .rounded { border-radius: 4px; }
    .rounded-md { border-radius: 6px; }
    .rounded-lg { border-radius: 8px; }
    .rounded-xl { border-radius: 12px; }
    .rounded-full { border-radius: 9999px; }
    .text-left, .sm\\:text-left { text-align: left !important; }
    .text-right, .sm\\:text-right { text-align: right !important; }
    .text-center { text-align: center !important; }
    .font-medium { font-weight: 500; }
    .font-semibold { font-weight: 600; }
    .font-bold { font-weight: 700; }
    .font-extrabold { font-weight: 800; }
    .font-black { font-weight: 900; }
    .italic { font-style: italic; }
    .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
    .font-serif { font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif; }
    .uppercase { text-transform: uppercase; }
    .tracking-wider { letter-spacing: 0.05em; }
    .tracking-widest { letter-spacing: 0.1em; }
    .text-xs { font-size: 11.5px !important; }
    .text-sm { font-size: 13.5px !important; }
    .text-base { font-size: 15.5px !important; }
    .text-lg { font-size: 18px !important; }
    .text-xl { font-size: 20px !important; }
    .text-2xl { font-size: 24px !important; }
    .text-white { color: #ffffff !important; }
    .text-sky-600 { color: #0284c7; }
    .text-sky-500 { color: #0ea5e9; }
    .text-sky-400 { color: #38bdf8; }
    .text-sky-300 { color: #7dd3fc; }
    .text-sky-200 { color: #bae6fd; }
    .text-emerald-600 { color: #059669; }
    .text-slate-300 { color: #cbd5e1; }
    .text-slate-400 { color: #94a3b8; }
    .text-slate-500 { color: #64748b; }
    .text-slate-600 { color: #475569; }
    .text-slate-700 { color: #334155; }
    .text-slate-800 { color: #1e293b; }
    .text-slate-900 { color: #0f172a; }
    .bg-white { background-color: #ffffff; }
    .bg-slate-900 { background-color: #0f172a !important; color: #ffffff !important; }
    .bg-slate-800 { background-color: #1e293b !important; color: #ffffff !important; }
    .bg-slate-50 { background-color: #f8fafc; }
    .bg-slate-100 { background-color: #f1f5f9; }
    .bg-sky-500 { background-color: #0ea5e9; color: #ffffff; }
    .bg-sky-50 { background-color: #f0f9ff; }
    .border-slate-200 { border-color: #e2e8f0; }
    .border-slate-300 { border-color: #cbd5e1; }
    .border-slate-400 { border-color: #94a3b8; }
    .border-sky-100 { border-color: #e0f2fe; }
    .border-sky-200 { border-color: #bae6fd; }
    .border-black { border-color: #000000; }
    .divide-y > * + * { border-top: 1px solid #e2e8f0; }
    .space-y-1 > * + * { margin-top: 4px; }
    .space-y-1\\.5 > * + * { margin-top: 6px; }
    .space-y-2 > * + * { margin-top: 8px; }
    .space-y-2\\.5 > * + * { margin-top: 10px; }
    .space-y-3 > * + * { margin-top: 12px; }
    .space-y-3\\.5 > * + * { margin-top: 14px; }
    .space-y-4 > * + * { margin-top: 16px !important; }
    .space-y-5 > * + * { margin-top: 20px !important; }
    .inline-block { display: inline-block !important; }
    .inline-flex { display: inline-flex !important; }
    .block { display: block !important; }
    .truncate { overflow: hidden !important; text-overflow: ellipsis !important; white-space: nowrap !important; }
    .border-collapse { border-collapse: collapse !important; }
    .mt-auto { margin-top: auto !important; }
    .leading-snug { line-height: 1.35 !important; }
    .leading-tight { line-height: 1.25 !important; }
    .leading-relaxed { line-height: 1.5 !important; }
    .print\\:hidden { display: none !important; }
    /* Strict Image & Logo Rules: Prevent logo blow-up */
    img, .doc-brand-logo, [alt*="logo" i], [alt*="Logo" i] {
      max-height: 40px !important;
      height: 38px !important;
      max-width: 140px !important;
      width: auto !important;
      object-fit: contain !important;
      display: inline-block !important;
      flex-shrink: 0 !important;
      border-radius: 6px;
    }
  </style>
</head>
<body>
  <div class="print-doc-container">
    ${content}
  </div>
</body>
</html>`;
  };

  // High-reliability isolated iframe printing: zero top space, 1 single page guaranteed without page # or browser header
  const handlePrint = () => {
    if (!printRef.current) {
      window.print();
      return;
    }

    const prevTitle = document.title;
    document.title = ''; // Suppresses browser title print header

    const fullHtml = buildStandaloneHtml(printRef.current.innerHTML);
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.top = '-9999px';
    iframe.style.left = '-9999px';
    iframe.style.width = '794px';
    iframe.style.height = '1123px';
    iframe.style.border = '0';
    iframe.style.opacity = '0.01'; // Fully composited in Chromium DOM tree, not hidden
    iframe.style.pointerEvents = 'none';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document;
    if (!iframeDoc) {
      window.print();
      document.title = prevTitle;
      return;
    }

    iframeDoc.open();
    iframeDoc.write(fullHtml);
    iframeDoc.close();

    const triggerPrint = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.error('Iframe print error fallback:', err);
        window.print();
      } finally {
        document.title = prevTitle;
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1500);
      }
    };

    // Allow fonts and logo images to decode cleanly
    setTimeout(triggerPrint, 300);
  };

  // Download Standalone Self-Contained HTML file
  const handleDownloadHtml = () => {
    if (!printRef.current) return;
    const fullHtml = buildStandaloneHtml(printRef.current.innerHTML);
    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${docNumber}_${doc.client.replace(/\s+/g, '_')}_${paperSize.toUpperCase()}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setIsDownloadMenuOpen(false);
  };

  // Export CSV
  const handleExportCsv = () => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];

    if (lineItems.length > 0) {
      headers = ['Item Description', 'Quantity', 'Unit Rate ($)', 'Line Total ($)'];
      rows = lineItems.map((it) => [
        `"${it.description.replace(/"/g, '""')}"`,
        it.quantity,
        it.unitPrice,
        it.total,
      ]);
      rows.push(['Subtotal', '', '', subtotal]);
      if (activeTaxMode === 'none') {
        rows.push(['Tax (0% Exempt)', '', '', 0]);
      } else if (activeTaxMode === 'exclusive') {
        rows.push([`${activeTaxName} (${effectiveTaxRate}% Exclusive)`, '', '', taxAmount]);
      } else {
        rows.push([`${activeTaxName} (${effectiveTaxRate}% Inclusive)`, '', '', taxAmount]);
      }
      rows.push(['Total Payable', '', '', totalAmount]);
    } else {
      headers = [
        'Document #',
        'Client',
        'Title / Scope',
        'Subtotal ($)',
        'Tax Mode',
        'Tax Amount ($)',
        'Total Payable ($)',
        'Status',
      ];
      rows = [
        [
          docNumber,
          `"${doc.client.replace(/"/g, '""')}"`,
          `"${((doc as any).title || (doc as any).scopeSummary || (doc as any).scope || docTitle).replace(
            /"/g,
            '""'
          )}"`,
          subtotal,
          activeTaxMode,
          taxAmount,
          totalAmount,
          (doc as any).status || 'Active',
        ],
      ];
    }

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${docNumber}_${doc.client.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsDownloadMenuOpen(false);
  };

  // Status Badge
  const getStatusBadge = () => {
    const status = (doc as any).status;
    if (['Paid', 'Approved', 'Accepted', 'Active'].includes(status)) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {status}
        </span>
      );
    }
    if (['Pending', 'Sent', 'Pending Signature'].includes(status)) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          <Clock className="w-3.5 h-3.5" />
          {status}
        </span>
      );
    }
    if (['Overdue', 'Expired', 'Declined', 'Terminated'].includes(status)) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20">
          <AlertCircle className="w-3.5 h-3.5" />
          {status}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-full bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/20">
        Draft
      </span>
    );
  };

  // Quick next status transition
  const getQuickStatusAction = () => {
    const status = (doc as any).status;
    if (actualDocType === 'invoice' && status !== 'Paid') {
      return { label: 'Mark as Paid', target: 'Paid' };
    }
    if (actualDocType === 'proposal' && status === 'Sent') {
      return { label: 'Mark as Approved', target: 'Approved' };
    }
    if (actualDocType === 'quotation' && status === 'Sent') {
      return { label: 'Mark as Accepted', target: 'Accepted' };
    }
    if (actualDocType === 'contract' && status === 'Pending Signature') {
      return { label: 'Mark as Active / Signed', target: 'Active' };
    }
    return null;
  };

  const quickAction = getQuickStatusAction();

  // Template container styles
  const getCanvasStyles = () => {
    const isA4 = paperSize === 'a4';
    const baseWidth = isA4 ? 'max-w-[794px]' : 'max-w-[816px]';
    const minHeight = isA4 ? 'min-h-[1060px]' : 'min-h-[980px]';

    switch (selectedTemplate) {
      case 'corporate':
        return `${baseWidth} ${minHeight} w-full mx-auto bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-md font-serif text-slate-900 dark:text-slate-100 rounded-none flex flex-col justify-between`;
      case 'minimal':
        return `${baseWidth} ${minHeight} w-full mx-auto bg-white dark:bg-slate-900 border border-black dark:border-white shadow-xs font-mono text-slate-900 dark:text-slate-100 flex flex-col justify-between`;
      case 'creative':
        return `${baseWidth} ${minHeight} w-full mx-auto bg-slate-50 dark:bg-slate-950 border border-sky-200 dark:border-sky-900 shadow-lg font-sans text-slate-900 dark:text-slate-100 flex flex-col justify-between`;
      case 'modern':
      default:
        return `${baseWidth} ${minHeight} w-full mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm font-sans text-slate-900 dark:text-slate-100 flex flex-col justify-between`;
    }
  };

  // Reusable Financial Breakdown Component
  const FinancialSummary = ({ isCorporate = false, isMinimal = false }) => (
    <div className={`space-y-2 ${isMinimal ? 'font-mono text-xs' : 'text-xs sm:text-[13px]'}`}>
      <div className="flex justify-between text-slate-500 dark:text-slate-400">
        <span>{activeTaxMode === 'exclusive' ? 'Subtotal (Net):' : 'Subtotal:'}</span>
        <span className="font-semibold text-slate-800 dark:text-slate-200">
          {currency.symbol}{subtotal.toLocaleString('en-US')}
        </span>
      </div>

      {activeTaxMode === 'none' && (
        <div className="flex justify-between text-slate-400 text-[11px]">
          <span>Tax (0% / Exempt):</span>
          <span>{currency.symbol}0</span>
        </div>
      )}

      {activeTaxMode === 'exclusive' && (
        <div className="flex justify-between text-slate-500 dark:text-slate-400">
          <span>
            {activeTaxName} ({effectiveTaxRate}%):
          </span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            +{currency.symbol}{taxAmount.toLocaleString('en-US')}
          </span>
        </div>
      )}

      {activeTaxMode === 'inclusive' && (
        <div className="flex justify-between text-slate-400 text-[11px]">
          <span>
            Includes {activeTaxName} ({effectiveTaxRate}%):
          </span>
          <span className="font-medium text-slate-600 dark:text-slate-300">
            {currency.symbol}{taxAmount.toLocaleString('en-US')}
          </span>
        </div>
      )}

      <div
        className={`flex justify-between pt-2.5 border-t font-black text-sm sm:text-base ${
          isCorporate
            ? 'border-slate-400 text-slate-900 dark:text-white'
            : isMinimal
            ? 'border-black dark:border-white text-black dark:text-white'
            : 'border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white'
        }`}
      >
        <span>{isCorporate ? 'TOTAL PAYABLE:' : 'Grand Total:'}</span>
        <span className={isMinimal || isCorporate ? '' : 'text-sky-600 dark:text-sky-400'}>
          {currency.symbol}{totalAmount.toLocaleString('en-US')}
        </span>
      </div>
    </div>
  );

  // Line Items Table Component
  const LineItemsTable = ({ template }: { template: DocTemplateId }) => (
    <div className="space-y-3">
      <table
        className={`w-full text-left text-xs sm:text-[13px] ${
          template === 'corporate' ? 'border border-slate-300 dark:border-slate-700' : 'border-collapse'
        }`}
      >
        <thead>
          <tr
            className={`${
              template === 'corporate'
                ? 'bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase'
                : template === 'minimal'
                ? 'border-b-2 border-black dark:border-white text-[11px] font-bold uppercase font-mono'
                : template === 'creative'
                ? 'bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-500 uppercase'
                : 'border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold uppercase tracking-wider text-slate-400'
            }`}
          >
            <th className="py-2.5 px-3.5">Item Description</th>
            <th className="py-2.5 px-2 text-center w-16">Qty</th>
            <th className="py-2.5 px-3.5 text-right w-28">Rate</th>
            <th className="py-2.5 px-3.5 text-right w-32">Amount</th>
          </tr>
        </thead>
        <tbody
          className={
            template === 'corporate'
              ? 'divide-y divide-slate-200 dark:divide-slate-700'
              : 'divide-y divide-slate-100 dark:divide-slate-800'
          }
        >
          {lineItems.map((item, idx) => (
            <tr
              key={item.id || idx}
              className={`${
                template === 'creative' && idx % 2 === 1
                  ? 'bg-sky-50/20 dark:bg-slate-900/40'
                  : ''
              } ${template === 'minimal' ? 'font-mono' : ''}`}
            >
              <td className="py-2.5 px-3.5 font-semibold text-slate-800 dark:text-slate-200">{item.description}</td>
              <td className="py-2.5 px-2 text-center text-slate-600 dark:text-slate-400">{item.quantity}</td>
              <td className="py-2.5 px-3.5 text-right text-slate-600 dark:text-slate-400">
                {currency.symbol}{item.unitPrice.toLocaleString('en-US')}
              </td>
              <td className="py-2.5 px-3.5 text-right font-bold text-slate-900 dark:text-white">
                {currency.symbol}{item.total.toLocaleString('en-US')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end pt-2">
        <div
          className={`w-full sm:w-72 p-3.5 rounded-xl border ${
            template === 'corporate'
              ? 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/80'
              : template === 'minimal'
              ? 'border-black dark:border-white font-mono'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40'
          }`}
        >
          <FinancialSummary isCorporate={template === 'corporate'} isMinimal={template === 'minimal'} />
        </div>
      </div>
    </div>
  );

  // Proposal Content Component
  const ProposalContent = ({ template }: { template: DocTemplateId }) => (
    <div className="space-y-4 text-xs sm:text-[13px]">
      <div
        className={`p-4 sm:p-5 rounded-xl border ${
          template === 'corporate'
            ? 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80'
            : template === 'minimal'
            ? 'border-black dark:border-white font-mono'
            : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60'
        }`}
      >
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
          Executive Scope Summary
        </span>
        <p className="leading-relaxed text-slate-700 dark:text-slate-300 text-xs sm:text-[13px]">
          {proposalDoc?.scope || 'Dedicated enterprise software delivery and engineering services.'}
        </p>
      </div>

      <div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
          Scope Deliverables Checklist
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {proposalDoc?.deliverables.map((d, i) => (
            <div
              key={i}
              className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-xs sm:text-[13px] ${
                template === 'minimal'
                  ? 'border-black dark:border-white font-mono'
                  : 'border-sky-100 dark:border-slate-800 bg-sky-50/40 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-sky-500 shrink-0" />
              <span className="truncate font-medium">{d}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <div
          className={`w-full sm:w-72 p-3.5 rounded-xl border space-y-2 ${
            template === 'corporate'
              ? 'border-slate-400 bg-slate-50 dark:bg-slate-800'
              : template === 'minimal'
              ? 'border-black dark:border-white font-mono'
              : 'border-sky-200 dark:border-slate-700 bg-sky-50/50 dark:bg-slate-800/80'
          }`}
        >
          <div className="flex justify-between text-slate-500">
            <span>{activeTaxMode === 'exclusive' ? 'Base Value (Net):' : 'Proposed Investment:'}</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {currency.symbol}{subtotal.toLocaleString('en-US')}
            </span>
          </div>

          {activeTaxMode === 'none' && (
            <div className="flex justify-between text-slate-400 text-[11px]">
              <span>Tax (0% / Exempt):</span>
              <span>{currency.symbol}0</span>
            </div>
          )}

          {activeTaxMode === 'exclusive' && (
            <div className="flex justify-between text-slate-500">
              <span>
                {activeTaxName} ({effectiveTaxRate}%):
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                +{currency.symbol}{taxAmount.toLocaleString('en-US')}
              </span>
            </div>
          )}

          {activeTaxMode === 'inclusive' && (
            <div className="flex justify-between text-slate-400 text-[11px]">
              <span>
                Includes {activeTaxName} ({effectiveTaxRate}%):
              </span>
              <span>{currency.symbol}{taxAmount.toLocaleString('en-US')}</span>
            </div>
          )}

          <div className="flex justify-between pt-2 border-t border-slate-300 dark:border-slate-600 font-black text-sm sm:text-base text-slate-900 dark:text-white">
            <span>{template === 'corporate' ? 'TOTAL PAYABLE:' : 'Total Payable:'}</span>
            <span className={template === 'minimal' || template === 'corporate' ? '' : 'text-sky-600 dark:text-sky-400'}>
              {currency.symbol}{totalAmount.toLocaleString('en-US')}
            </span>
          </div>
        </div>
      </div>

      {/* Official Proposal Acceptance Signoff */}
      <div className="pt-5 border-t border-slate-200 dark:border-slate-800">
        <div className="grid grid-cols-2 gap-8 text-xs">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              SUBMITTED BY ({branding.companyName})
            </span>
            <div className="h-10 border-b border-dashed border-slate-300 dark:border-slate-600 flex items-end pb-1">
              <span className="font-serif italic text-sm text-sky-600">
                {branding.companyName} Representative
              </span>
            </div>
            <p className="text-[10.5px] text-slate-400">Date: {(doc as any).issueDate || (doc as any).startDate || '2025-05-15'}</p>
          </div>
          <div className="space-y-1.5 text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              CLIENT ACCEPTANCE & APPROVAL
            </span>
            <div className="h-10 border-b border-dashed border-slate-300 dark:border-slate-600 flex items-end justify-end pb-1">
              <span className="font-serif italic text-sm text-slate-700 dark:text-slate-300">
                {doc.client}
              </span>
            </div>
            <p className="text-[10.5px] text-slate-400">Authorized Signature & Seal</p>
          </div>
        </div>
      </div>
    </div>
  );

  // Contract Content Component
  const ContractContent = ({ template }: { template: DocTemplateId }) => (
    <div className="space-y-4 text-xs sm:text-[13px]">
      <div
        className={`p-4 sm:p-5 rounded-xl border ${
          template === 'corporate'
            ? 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80'
            : template === 'minimal'
            ? 'border-black dark:border-white font-mono'
            : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60'
        }`}
      >
        <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
          SCOPE SUMMARY & ENGAGEMENT OBJECTIVES:
        </span>
        <p className="leading-relaxed text-slate-700 dark:text-slate-300 text-xs sm:text-[13px]">
          {contractDoc?.scopeSummary || 'Comprehensive enterprise cloud modernization, container orchestration, microservices refactoring, and developer platform licensing.'}
        </p>
      </div>

      <div className="space-y-2.5">
        <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
          KEY LEGAL ARTICLES & TERMS:
        </span>
        {contractDoc?.clauses.map((c, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-lg border flex items-start gap-3 ${
              template === 'minimal'
                ? 'border-black dark:border-white font-mono'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60'
            }`}
          >
            <span className="font-bold text-sky-600 dark:text-sky-400 shrink-0 text-xs sm:text-sm">{idx + 1}.</span>
            <span className="text-slate-700 dark:text-slate-300 leading-relaxed text-xs sm:text-[13px]">{c}</span>
          </div>
        ))}
      </div>

      <div
        className={`grid grid-cols-2 gap-4 p-3.5 sm:p-4 rounded-xl border my-3 ${
          template === 'minimal'
            ? 'border-black dark:border-white font-mono'
            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60'
        }`}
      >
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Billing Cadence</span>
          <span className="font-bold text-sm text-slate-800 dark:text-slate-200">{contractDoc?.billingCadence || 'Monthly'}</span>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Total Contract Value</span>
          <span className="font-black text-base sm:text-lg text-sky-600 dark:text-sky-400">
            {currency.symbol}{totalAmount.toLocaleString('en-US')}
          </span>
        </div>
      </div>

      <div className="pt-5 border-t border-slate-200 dark:border-slate-700">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-3 text-center sm:text-left">
          EXECUTED & AGREED IN WITNESS WHEREOF
        </span>
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              SIGNED FOR PROVIDER ({branding.companyName})
            </span>
            <div className="h-10 border-b border-dashed border-slate-400 dark:border-slate-600 flex items-end pb-1">
              <span className="font-serif italic text-sm text-sky-600 font-semibold">
                {contractDoc?.companySigner || 'Sayed (Chief Executive Officer)'}
              </span>
            </div>
            <div className="flex justify-between text-[10.5px] text-slate-400 pt-0.5">
              <span>Authorized Signatory</span>
              <span>Date: {(doc as any).issueDate || (doc as any).startDate || '2025-01-01'}</span>
            </div>
          </div>

          <div className="space-y-1.5 text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              SIGNED FOR CLIENT ({doc.client})
            </span>
            <div className="h-10 border-b border-dashed border-slate-400 dark:border-slate-600 flex items-end justify-end pb-1">
              <span className="font-serif italic text-sm text-slate-800 dark:text-slate-200 font-semibold">
                {contractDoc?.clientSigner || 'John Smith (VP of Engineering)'}
              </span>
            </div>
            <div className="flex justify-between text-[10.5px] text-slate-400 pt-0.5">
              <span>Date: {(doc as any).issueDate || (doc as any).startDate || '2025-01-01'}</span>
              <span>Authorized Signatory</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="print-modal-wrapper fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      {/* Print Page Sizing Stylesheet for Ctrl+P */}
      <style>{`
        @media print {
          @page {
            size: ${paperSize === 'a4' ? 'A4 portrait' : 'letter portrait'};
            margin: 0mm !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
            background: #ffffff !important;
            color: #0f172a !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * {
            visibility: hidden !important;
          }
          .print-modal-wrapper,
          .print-modal-dialog,
          .print-modal-scroll {
            position: static !important;
            display: block !important;
            padding: 0 !important;
            margin: 0 !important;
            background: #ffffff !important;
            border: none !important;
            box-shadow: none !important;
            max-height: none !important;
            max-width: 100% !important;
            transform: none !important;
            filter: none !important;
            backdrop-filter: none !important;
            animation: none !important;
            overflow: visible !important;
            width: 100% !important;
            height: auto !important;
          }
          #printable-invoice-canvas,
          #printable-invoice-canvas * {
            visibility: visible !important;
          }
          #printable-invoice-canvas {
            position: static !important;
            top: 0 !important;
            left: 0 !important;
            margin: 0 auto !important;
            padding: ${paperSize === 'a4' ? '10mm 12mm' : '0.4in 0.5in'} !important;
            border: none !important;
            box-shadow: none !important;
            background: #ffffff !important;
            color: #0f172a !important;
            width: 100% !important;
            max-width: ${paperSize === 'a4' ? '794px' : '816px'} !important;
            min-height: ${paperSize === 'a4' ? '1060px' : '980px'} !important;
            height: 100% !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            box-sizing: border-box !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      <div
        className={`print-modal-dialog relative w-full max-w-5xl max-h-[95vh] flex flex-col rounded-2xl border shadow-2xl transition-all my-auto ${
          isLight ? 'bg-white border-sky-200' : 'bg-[#0f172a] border-slate-700'
        }`}
      >
        {/* Sticky Action Toolbar */}
        <div
          className={`print:hidden sticky top-0 z-20 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-2.5 px-4 py-2.5 border-b rounded-t-2xl ${
            isLight
              ? 'bg-white/95 border-sky-100 backdrop-blur-md'
              : 'bg-[#0f172a]/95 border-slate-800 backdrop-blur-md'
          }`}
        >
          {/* Left: Template Selector Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 xl:pb-0 scrollbar-none">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
              Template:
            </span>
            {TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.id}
                onClick={() => setSelectedTemplate(tmpl.id)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all shrink-0 ${
                  selectedTemplate === tmpl.id
                    ? 'bg-sky-500 text-white shadow-xs'
                    : isLight
                    ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {tmpl.name}
              </button>
            ))}
          </div>

          {/* Center: Tax System Switcher & Paper Size */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 xl:pb-0">
            {/* Interactive Tax Mode Selector */}
            <div className="flex items-center gap-0.5 p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs shrink-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase px-1.5 hidden md:inline">
                Tax System:
              </span>
              <button
                type="button"
                onClick={() => setActiveTaxMode('none')}
                title="Client pays without tax (Tax-exempt 0%)"
                className={`px-2 py-0.5 text-[11px] font-bold rounded-lg transition-all ${
                  activeTaxMode === 'none'
                    ? 'bg-white dark:bg-sky-600 text-sky-600 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Without Tax (0%)
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTaxMode('exclusive');
                  if (activeTaxRate === 0) setActiveTaxRate(18);
                }}
                title="Tax added to net subtotal (+Exclusive)"
                className={`px-2 py-0.5 text-[11px] font-bold rounded-lg transition-all ${
                  activeTaxMode === 'exclusive'
                    ? 'bg-white dark:bg-sky-600 text-sky-600 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                + Exclusive
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTaxMode('inclusive');
                  if (activeTaxRate === 0) setActiveTaxRate(18);
                }}
                title="Tax included inside total price (Inclusive)"
                className={`px-2 py-0.5 text-[11px] font-bold rounded-lg transition-all ${
                  activeTaxMode === 'inclusive'
                    ? 'bg-white dark:bg-sky-600 text-sky-600 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Inclusive
              </button>
            </div>

            {/* Paper Size Selector */}
            <div className="flex items-center gap-1 shrink-0">
              {(['a4', 'letter'] as PaperSize[]).map((sz) => (
                <button
                  key={sz}
                  onClick={() => setPaperSize(sz)}
                  className={`px-2 py-0.5 text-[11px] font-bold rounded-md uppercase transition-colors ${
                    paperSize === sz
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 self-end xl:self-auto shrink-0">
            {/* Quick Status Action (Mark as Paid/Approved) */}
            {quickAction && onUpdateStatus && (
              <button
                onClick={() => onUpdateStatus(quickAction.target)}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-xs transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{quickAction.label}</span>
              </button>
            )}

            {/* Change Logo */}
            <button
              onClick={onOpenChangeLogo}
              title="Change Corporate Branding & Logo"
              className={`flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-xl border transition-colors ${
                isLight
                  ? 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  : 'border-slate-700 text-slate-200 hover:bg-slate-800'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5 text-sky-500" />
              <span className="hidden sm:inline">Logo</span>
            </button>

            {/* Edit Remittance & Terms Button (3rd Screenshot Requirement) */}
            <button
              onClick={() => setIsFooterEditOpen(true)}
              title="Edit Bank Remittance Details & Document Payment Terms"
              className={`flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-xl border transition-colors ${
                isLight
                  ? 'border-sky-200 text-sky-700 bg-sky-50/70 hover:bg-sky-100'
                  : 'border-sky-800 text-sky-300 bg-sky-950/40 hover:bg-sky-900/40'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5 text-sky-500" />
              <span className="hidden sm:inline">Remittance & Terms</span>
            </button>

            {/* Edit Button */}
            <button
              onClick={onEdit}
              className={`flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-xl border transition-colors ${
                isLight
                  ? 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  : 'border-slate-700 text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>

            {/* Download Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsDownloadMenuOpen(!isDownloadMenuOpen)}
                className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-xl bg-sky-500 hover:bg-sky-600 text-white shadow-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download / PDF</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {isDownloadMenuOpen && (
                <div
                  className={`absolute right-0 mt-1.5 w-64 rounded-xl border shadow-xl z-30 py-1.5 text-xs ${
                    isLight ? 'bg-white border-slate-200' : 'bg-slate-800 border-slate-700'
                  }`}
                >
                  <button
                    onClick={() => {
                      setIsDownloadMenuOpen(false);
                      handlePrint();
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-sky-50 dark:hover:bg-slate-700 flex items-center gap-2"
                  >
                    <Printer className="w-4 h-4 text-sky-500" />
                    <div>
                      <span className="font-bold block text-slate-800 dark:text-slate-100">
                        Print / Save as PDF
                      </span>
                      <span className="text-[10px] text-slate-400">Clean 1-page (No page # or URL headers)</span>
                    </div>
                  </button>

                  <button
                    onClick={handleDownloadHtml}
                    className="w-full text-left px-3.5 py-2 hover:bg-sky-50 dark:hover:bg-slate-700 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4 text-sky-500" />
                    <div>
                      <span className="font-bold block text-slate-800 dark:text-slate-100">Download Clean HTML Doc</span>
                      <span className="text-[10px] text-slate-400">Standalone single-page document</span>
                    </div>
                  </button>

                  <button
                    onClick={handleExportCsv}
                    className="w-full text-left px-3.5 py-2 hover:bg-sky-50 dark:hover:bg-slate-700 flex items-center gap-2 border-t border-slate-100 dark:border-slate-700"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                    <div>
                      <span className="font-bold block text-slate-800 dark:text-slate-100">Export Data CSV</span>
                      <span className="text-[10px] text-slate-400">Spreadsheet table export</span>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-0.5"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Canvas Viewport */}
        <div className="print-modal-scroll flex-1 overflow-y-auto p-3 sm:p-5 bg-slate-100/60 dark:bg-slate-950/60">
          <div id="printable-invoice-canvas" ref={printRef} className={getCanvasStyles()}>
            {/* TEMPLATE VARIANT 1: MODERN SKY (DEFAULT) */}
            {selectedTemplate === 'modern' && (
              <div className="p-6 sm:p-8 flex flex-col justify-between flex-1 h-full w-full">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex flex-row items-start justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2.5">
                        {branding.logoUrl ? (
                          <img
                            src={branding.logoUrl}
                            alt={branding.companyName || 'Logo'}
                            className="doc-brand-logo h-9 w-auto max-w-[140px] object-contain rounded-md shrink-0"
                            style={{
                              height: '36px',
                              maxHeight: '36px',
                              maxWidth: '140px',
                              width: 'auto',
                              objectFit: 'contain',
                              flexShrink: 0,
                            }}
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-xl bg-sky-500 flex items-center justify-center text-white font-black text-sm shrink-0">
                            O
                          </div>
                        )}
                        <div className="min-w-0">
                          <h1 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight truncate">
                            {branding.companyName}
                          </h1>
                          <p className="text-[10.5px] text-slate-400 font-mono">
                            Tax ID: {branding.companyTaxId}
                          </p>
                        </div>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5 leading-tight">
                        <p>{branding.companyAddress}</p>
                        <p>{branding.companyEmail} • {branding.companyPhone}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 space-y-0.5">
                      <div className="inline-block mb-0.5">{getStatusBadge()}</div>
                      <h2 className="text-base sm:text-lg font-black tracking-wide text-slate-900 dark:text-white">
                        {docTitle}
                      </h2>
                      <p className="font-mono text-xs font-bold text-sky-600 dark:text-sky-400">
                        #{docNumber}
                      </p>
                    </div>
                  </div>

                  {/* Bill To & Metadata */}
                  <div className="grid grid-cols-2 gap-3 py-0.5 text-xs">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                        {actualDocType === 'contract' ? 'Client Signer & Company' : 'Billed To / Client'}
                      </span>
                      <p className="text-sm font-black text-slate-900 dark:text-white">{doc.client}</p>
                      {(doc as any).clientAddress && (
                        <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-[11px]">{(doc as any).clientAddress}</p>
                      )}
                      {(doc as any).clientEmail && (
                        <p className="text-slate-500 dark:text-slate-400 text-[11px]">{(doc as any).clientEmail}</p>
                      )}
                      {(doc as any).clientTaxId && (
                        <p className="text-slate-400 font-mono text-[10px] mt-0.5">Tax ID: {(doc as any).clientTaxId}</p>
                      )}
                    </div>

                    <div className="space-y-1 text-right">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Issue Date:
                        </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {(doc as any).issueDate || (doc as any).startDate || '2025-05-15'}
                        </span>
                      </div>
                      {((doc as any).dueDate || (doc as any).validUntil || (doc as any).endDate) && (
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            {actualDocType === 'invoice' ? 'Due Date:' : actualDocType === 'contract' ? 'End Date:' : 'Valid Until:'}
                          </span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {(doc as any).dueDate || (doc as any).validUntil || (doc as any).endDate}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Table for Invoices & Quotes */}
                  {(actualDocType === 'invoice' || actualDocType === 'quotation') && <LineItemsTable template="modern" />}

                  {/* Proposal Scope & Checklist */}
                  {actualDocType === 'proposal' && <ProposalContent template="modern" />}

                  {/* Contract Articles & Sign-offs */}
                  {actualDocType === 'contract' && <ContractContent template="modern" />}
                </div>

                {/* Footer notes & Bank details (3rd Screenshot Requirement: Editable) */}
                <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs group">
                  <div className="relative">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Bank Remittance</span>
                      <button
                        type="button"
                        onClick={() => setIsFooterEditOpen(true)}
                        className="print:hidden text-[10px] text-sky-500 hover:text-sky-600 font-semibold inline-flex items-center gap-0.5 cursor-pointer bg-sky-50 dark:bg-sky-950/60 px-1.5 py-0.5 rounded border border-sky-100 dark:border-sky-900 transition-colors"
                        title="Click to edit remittance & terms"
                      >
                        <Edit3 className="w-2.5 h-2.5" /> Edit
                      </button>
                    </div>
                    <p
                      onClick={() => setIsFooterEditOpen(true)}
                      className="font-mono text-xs text-slate-700 dark:text-slate-300 font-semibold cursor-pointer hover:bg-sky-50/50 dark:hover:bg-slate-800/50 p-1 -m-1 rounded transition-colors"
                      title="Click to edit"
                    >
                      {editedBankDetails}
                    </p>
                  </div>
                  <div className="relative">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Terms & Conditions</span>
                      <button
                        type="button"
                        onClick={() => setIsFooterEditOpen(true)}
                        className="print:hidden text-[10px] text-sky-500 hover:text-sky-600 font-semibold inline-flex items-center gap-0.5 cursor-pointer bg-sky-50 dark:bg-sky-950/60 px-1.5 py-0.5 rounded border border-sky-100 dark:border-sky-900 transition-colors"
                        title="Click to edit terms"
                      >
                        <Edit3 className="w-2.5 h-2.5" /> Edit
                      </button>
                    </div>
                    <p
                      onClick={() => setIsFooterEditOpen(true)}
                      className="text-xs text-slate-600 dark:text-slate-400 cursor-pointer hover:bg-sky-50/50 dark:hover:bg-slate-800/50 p-1 -m-1 rounded transition-colors"
                      title="Click to edit"
                    >
                      {editedTerms}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TEMPLATE VARIANT 2: CORPORATE CLASSIC */}
            {selectedTemplate === 'corporate' && (
              <div className="flex flex-col justify-between flex-1 h-full w-full">
                <div>
                  {/* Classic Navy Header Band */}
                  <div className="bg-slate-900 text-white p-5 sm:p-6 flex items-center justify-between" style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>
                    <div className="flex items-center gap-3 min-w-0">
                      {branding.logoUrl ? (
                        <img
                          src={branding.logoUrl}
                          alt="Logo"
                          className="doc-brand-logo h-9 w-auto bg-white p-1 rounded object-contain shrink-0"
                          style={{
                            height: '36px',
                            maxHeight: '36px',
                            maxWidth: '140px',
                            width: 'auto',
                            objectFit: 'contain',
                            flexShrink: 0,
                          }}
                        />
                      ) : (
                        <div className="w-8 h-8 rounded bg-white text-slate-900 flex items-center justify-center font-serif font-black text-sm shrink-0">
                          O
                        </div>
                      )}
                      <div className="min-w-0">
                        <h1 className="text-base font-bold tracking-wide uppercase font-serif text-white truncate">{branding.companyName}</h1>
                        <p className="text-[10.5px] text-slate-300 font-sans">{branding.companyAddress}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-lg font-black uppercase tracking-widest block font-serif text-white">{docTitle}</span>
                      <span className="text-xs font-mono text-sky-300">REF: {docNumber}</span>
                    </div>
                  </div>

                  <div className="p-6 sm:p-8 space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-xs border-b border-slate-300 dark:border-slate-700 pb-3">
                      <div>
                        <span className="font-bold uppercase text-slate-500 block mb-0.5">
                          {actualDocType === 'contract' ? 'CONTRACT PARTY / CLIENT:' : 'BILLED TO:'}
                        </span>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{doc.client}</p>
                        {(doc as any).clientAddress && (
                          <p className="text-slate-600 dark:text-slate-400 text-[11px]">{(doc as any).clientAddress}</p>
                        )}
                        {(doc as any).clientEmail && (
                          <p className="text-slate-600 dark:text-slate-400 text-[11px]">{(doc as any).clientEmail}</p>
                        )}
                      </div>
                      <div className="text-right space-y-1">
                        <p><span className="font-bold">Date Issued:</span> {(doc as any).issueDate || (doc as any).startDate || '2025-05-15'}</p>
                        <p><span className="font-bold">{actualDocType === 'invoice' ? 'Payment Due:' : actualDocType === 'contract' ? 'End Date:' : 'Valid Until:'}</span> {(doc as any).dueDate || (doc as any).validUntil || (doc as any).endDate || '2025-05-30'}</p>
                        <p><span className="font-bold">Tax Registration:</span> {branding.companyTaxId}</p>
                      </div>
                    </div>

                    {(actualDocType === 'invoice' || actualDocType === 'quotation') && <LineItemsTable template="corporate" />}
                    {actualDocType === 'proposal' && <ProposalContent template="corporate" />}
                    {actualDocType === 'contract' && <ContractContent template="corporate" />}
                  </div>
                </div>

                <div className="p-6 sm:p-8 pt-0 mt-auto">
                  <div className="border-t border-slate-300 dark:border-slate-700 pt-3 text-xs grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="font-bold text-[10px] uppercase text-slate-500 block">OFFICIAL REMITTANCE:</span>
                        <button
                          type="button"
                          onClick={() => setIsFooterEditOpen(true)}
                          className="print:hidden text-[10px] text-sky-600 font-semibold inline-flex items-center gap-0.5 cursor-pointer bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700"
                        >
                          <Edit3 className="w-2.5 h-2.5" /> Edit
                        </button>
                      </div>
                      <p
                        onClick={() => setIsFooterEditOpen(true)}
                        className="font-mono text-xs text-slate-700 dark:text-slate-300 font-semibold cursor-pointer hover:bg-slate-100 p-1 -m-1 rounded"
                        title="Click to edit"
                      >
                        {editedBankDetails}
                      </p>
                      <p
                        onClick={() => setIsFooterEditOpen(true)}
                        className="text-[11px] text-slate-500 mt-1.5 cursor-pointer hover:bg-slate-100 p-1 -m-1 rounded"
                        title="Click to edit terms"
                      >
                        <span className="font-bold">Terms:</span> {editedTerms}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold block mb-1.5">AUTHORIZED EXECUTIVE STAMP:</span>
                      <div className="inline-block border-2 border-slate-400 border-dashed py-1.5 px-3.5 rounded font-serif italic text-xs text-slate-800 dark:text-slate-200 font-semibold">
                        Ozostack Enterprise Signoff • Verified
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TEMPLATE VARIANT 3: MINIMALIST MONOCHROME */}
            {selectedTemplate === 'minimal' && (
              <div className="p-6 sm:p-8 flex flex-col justify-between flex-1 h-full w-full font-mono text-xs">
                <div className="space-y-4">
                  <div className="flex justify-between items-start border-b-2 border-black dark:border-white pb-3">
                    <div>
                      <h1 className="text-base font-black uppercase tracking-tight">{branding.companyName}</h1>
                      <p className="text-[10.5px] text-slate-500">{branding.companyAddress}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-sm">{docTitle}</p>
                      <p className="text-slate-500">#{docNumber}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 py-1 border-b border-black dark:border-white pb-2.5">
                    <div>
                      <p className="font-bold uppercase text-[10px] text-slate-400">CLIENT:</p>
                      <p className="font-bold text-sm">{doc.client}</p>
                      {(doc as any).clientAddress && (
                        <p className="text-slate-500 text-[11px]">{(doc as any).clientAddress}</p>
                      )}
                    </div>
                    <div className="text-right space-y-0.5">
                      <p><span className="font-bold">ISSUED:</span> {(doc as any).issueDate || (doc as any).startDate || '2025-05-15'}</p>
                      <p><span className="font-bold">DUE/VALID:</span> {(doc as any).dueDate || (doc as any).validUntil || (doc as any).endDate || '2025-05-30'}</p>
                    </div>
                  </div>

                  {(actualDocType === 'invoice' || actualDocType === 'quotation') && <LineItemsTable template="minimal" />}
                  {actualDocType === 'proposal' && <ProposalContent template="minimal" />}
                  {actualDocType === 'contract' && <ContractContent template="minimal" />}
                </div>

                <div className="mt-auto pt-4 border-t border-black dark:border-white text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center justify-between mb-1">
                    <p
                      onClick={() => setIsFooterEditOpen(true)}
                      className="font-bold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 p-0.5 rounded"
                      title="Click to edit remittance"
                    >
                      REMITTANCE: <span className="font-normal font-mono">{editedBankDetails}</span>
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsFooterEditOpen(true)}
                      className="print:hidden text-[10px] text-sky-600 font-semibold inline-flex items-center gap-0.5 cursor-pointer"
                    >
                      <Edit3 className="w-2.5 h-2.5" /> Edit
                    </button>
                  </div>
                  <p
                    onClick={() => setIsFooterEditOpen(true)}
                    className="text-[11px] text-slate-500 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 p-0.5 rounded"
                    title="Click to edit terms"
                  >
                    <span className="font-bold">TERMS:</span> {editedTerms}
                  </p>
                </div>
              </div>
            )}

            {/* TEMPLATE VARIANT 4: TECH DARK-ACCENT / CREATIVE */}
            {selectedTemplate === 'creative' && (
              <div className="p-6 sm:p-8 flex flex-col justify-between flex-1 h-full w-full font-sans text-xs">
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-900 text-white flex justify-between items-center" style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>
                    <div className="flex items-center gap-3 min-w-0">
                      {branding.logoUrl ? (
                        <img
                          src={branding.logoUrl}
                          alt="Logo"
                          className="doc-brand-logo h-8 w-auto rounded object-contain bg-white/10 p-0.5 shrink-0"
                          style={{
                            height: '32px',
                            maxHeight: '32px',
                            maxWidth: '140px',
                            width: 'auto',
                            objectFit: 'contain',
                            flexShrink: 0,
                          }}
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center font-bold text-white shrink-0">
                          O
                        </div>
                      )}
                      <div className="min-w-0">
                        <h2 className="text-sm font-extrabold text-white truncate">{branding.companyName}</h2>
                        <p className="text-[10px] text-sky-300 font-mono">CLOUD BILLING ENGINE</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-sky-500 text-white uppercase inline-block mb-0.5">
                        {docTitle}
                      </span>
                      <p className="font-mono text-xs font-bold text-sky-200">#{docNumber}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">CUSTOMER</span>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{doc.client}</p>
                      {(doc as any).clientEmail && (
                        <p className="text-slate-500 text-[11px]">{(doc as any).clientEmail}</p>
                      )}
                    </div>
                    <div className="text-right space-y-0.5">
                      <p><span className="text-slate-400">Date:</span> {(doc as any).issueDate || (doc as any).startDate || '2025-05-15'}</p>
                      <p><span className="text-slate-400">Expiry/Due:</span> {(doc as any).dueDate || (doc as any).validUntil || (doc as any).endDate || '2025-05-30'}</p>
                    </div>
                  </div>

                  {(actualDocType === 'invoice' || actualDocType === 'quotation') && <LineItemsTable template="creative" />}
                  {actualDocType === 'proposal' && <ProposalContent template="creative" />}
                  {actualDocType === 'contract' && <ContractContent template="creative" />}
                </div>

                <div className="mt-auto pt-4">
                  <div className="p-3.5 rounded-xl bg-sky-50/50 dark:bg-slate-900 border border-sky-100 dark:border-slate-800 flex justify-between items-center text-xs">
                    <div>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Bank Wire</span>
                        <button
                          type="button"
                          onClick={() => setIsFooterEditOpen(true)}
                          className="print:hidden text-[10px] text-sky-500 font-semibold inline-flex items-center gap-0.5 cursor-pointer"
                        >
                          <Edit3 className="w-2.5 h-2.5" /> Edit
                        </button>
                      </div>
                      <p
                        onClick={() => setIsFooterEditOpen(true)}
                        className="font-mono text-xs text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                        title="Click to edit"
                      >
                        {editedBankDetails}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Payment Terms</span>
                      <p
                        onClick={() => setIsFooterEditOpen(true)}
                        className="text-xs text-slate-600 dark:text-slate-400 cursor-pointer"
                        title="Click to edit"
                      >
                        {editedTerms}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal to Edit Bank Remittance & Terms (3rd Screenshot Requirement) */}
        {isFooterEditOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
            <div
              className={`w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 ${
                isLight ? 'bg-white border-sky-200' : 'bg-[#0f172a] border-slate-700'
              }`}
            >
              <div
                className={`flex items-center justify-between px-5 py-3.5 border-b ${
                  isLight ? 'bg-sky-50/60 border-sky-100' : 'bg-slate-900 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/15 flex items-center justify-center text-sky-500">
                    <Edit3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Edit Bank Remittance & Payment Terms
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Customise wire remittance instructions and document payment terms
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFooterEditOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveFooter} className="p-5 space-y-4 text-xs">
                {/* Bank Remittance */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Bank Remittance / Wire Transfer Details:
                  </label>
                  <textarea
                    rows={2}
                    value={editedBankDetails}
                    onChange={(e) => setEditedBankDetails(e.target.value)}
                    placeholder="e.g. Chase Commercial Bank | Routing: 121000358 | Account: 849201948291 | SWIFT: CHASUS33"
                    className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono ${
                      isLight
                        ? 'border-sky-200 bg-white text-slate-900'
                        : 'border-slate-700 bg-slate-900 text-slate-100'
                    }`}
                  />
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-400 font-semibold">Presets:</span>
                    <button
                      type="button"
                      onClick={() =>
                        setEditedBankDetails(
                          'Chase Commercial Bank | Routing: 121000358 | Account: 849201948291 | SWIFT: CHASUS33'
                        )
                      }
                      className="px-2 py-0.5 rounded text-[10px] bg-sky-50 dark:bg-slate-800 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-slate-700 hover:bg-sky-100 transition-colors"
                    >
                      Chase Commercial
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setEditedBankDetails(
                          'HSBC Business Global | Routing: 021001088 | Account: 749021849120 | SWIFT: HSBCUS33'
                        )
                      }
                      className="px-2 py-0.5 rounded text-[10px] bg-sky-50 dark:bg-slate-800 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-slate-700 hover:bg-sky-100 transition-colors"
                    >
                      HSBC Global
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setEditedBankDetails(
                          'HDFC Enterprise Banking | IFSC: HDFC0001234 | Account: 50200084920194 | SWIFT: HDFCINBB'
                        )
                      }
                      className="px-2 py-0.5 rounded text-[10px] bg-sky-50 dark:bg-slate-800 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-slate-700 hover:bg-sky-100 transition-colors"
                    >
                      HDFC Bank
                    </button>
                  </div>
                </div>

                {/* Terms & Conditions */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Document Payment Terms & Conditions:
                  </label>
                  <textarea
                    rows={2}
                    value={editedTerms}
                    onChange={(e) => setEditedTerms(e.target.value)}
                    placeholder="e.g. Payment due within 15 days of invoice date. Wire details specified below."
                    className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                      isLight
                        ? 'border-sky-200 bg-white text-slate-900'
                        : 'border-slate-700 bg-slate-900 text-slate-100'
                    }`}
                  />
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-400 font-semibold">Presets:</span>
                    <button
                      type="button"
                      onClick={() =>
                        setEditedTerms(
                          'Payment due within 15 days of invoice date. Wire details specified below.'
                        )
                      }
                      className="px-2 py-0.5 rounded text-[10px] bg-sky-50 dark:bg-slate-800 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-slate-700 hover:bg-sky-100 transition-colors"
                    >
                      Net-15 Wire
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setEditedTerms(
                          'Payment due within 30 days of invoice date. Subject to 1.5% monthly late fee.'
                        )
                      }
                      className="px-2 py-0.5 rounded text-[10px] bg-sky-50 dark:bg-slate-800 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-slate-700 hover:bg-sky-100 transition-colors"
                    >
                      Net-30 Standard
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setEditedTerms(
                          '50% deposit upon agreement execution, 50% upon final delivery and sign-off.'
                        )
                      }
                      className="px-2 py-0.5 rounded text-[10px] bg-sky-50 dark:bg-slate-800 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-slate-700 hover:bg-sky-100 transition-colors"
                    >
                      50/50 Milestones
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setEditedTerms(
                          'Governed strictly by Master Services Agreement. Monthly recurring billing cadence.'
                        )
                      }
                      className="px-2 py-0.5 rounded text-[10px] bg-sky-50 dark:bg-slate-800 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-slate-700 hover:bg-sky-100 transition-colors"
                    >
                      MSA Retainer
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsFooterEditOpen(false)}
                    className={`px-3.5 py-1.5 rounded-xl border text-xs font-semibold ${
                      isLight
                        ? 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        : 'border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-semibold text-xs shadow-xs transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save & Apply to Document</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
