import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import {
  Invoice,
  ProposalDocument,
  QuotationDocument,
  ContractDocument,
  InvoiceLineItem,
  TaxCalculationMode,
} from '../../types/crm';
import { PreviewDocType } from './DocumentPreviewModal';
import { useSystemCurrency } from '../../data/currencyService';

interface InvoiceEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  docType: PreviewDocType;
  initialData?: Invoice | ProposalDocument | QuotationDocument | ContractDocument | null;
  onSave: (docType: PreviewDocType, data: any) => void;
}

const CLIENT_OPTIONS = [
  'TechVision Inc.',
  'DataSoft Solutions',
  'FinEdge Systems',
  'CloudNest AI',
  'SwiftRetail Global',
  'Gulf Cloud Services',
  'Healthcare Plus',
  'Solaria Logistics',
  'DLF Limited',
  'Mahindra Housing',
  'Real Estate Pro',
  'GreenLeaf Dining',
];

export const InvoiceEditModal: React.FC<InvoiceEditModalProps> = ({
  isOpen,
  onClose,
  docType,
  initialData,
  onSave,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'white-sky';
  const currency = useSystemCurrency();

  // Common fields
  const [client, setClient] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientTaxId, setClientTaxId] = useState('');
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<string>('Pending');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [secondDate, setSecondDate] = useState(
    new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]
  );
  const [paymentMethod, setPaymentMethod] = useState('Wire Transfer');
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('');

  // Invoice / Quote Line Items
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([
    {
      id: 'li-new-1',
      description: 'Enterprise Engineering Services',
      quantity: 1,
      unitPrice: 15000,
      total: 15000,
    },
  ]);
  const [taxMode, setTaxMode] = useState<TaxCalculationMode>('none');
  const [taxName, setTaxName] = useState('VAT');
  const [taxRate, setTaxRate] = useState(0);

  // Proposal specific
  const [scope, setScope] = useState('');
  const [deliverables, setDeliverables] = useState<string[]>([
    'Core architecture and infrastructure blueprint',
    'Production Kubernetes microservices deployment',
    'SOC2 security review & penetration testing report',
  ]);
  const [newDeliverable, setNewDeliverable] = useState('');

  // Contract specific
  const [contractValue, setContractValue] = useState(120000);
  const [billingCadence, setBillingCadence] = useState<
    'Monthly' | 'Quarterly' | 'Milestone-Based' | 'Lump Sum'
  >('Monthly');
  const [clientSigner, setClientSigner] = useState('');
  const [companySigner, setCompanySigner] = useState('Sayed (CEO, Ozostack)');
  const [clauses, setClauses] = useState<string[]>([
    'Intellectual Property assignment upon receipt of payment.',
    '99.95% API uptime SLA with financial credit remedies.',
    'Tier-1 engineering response within 1 hour.',
  ]);
  const [newClause, setNewClause] = useState('');

  // Load initialData when modal opens
  useEffect(() => {
    if (initialData) {
      setClient(initialData.client || '');
      setClientEmail((initialData as any).clientEmail || '');
      setClientAddress((initialData as any).clientAddress || '');
      setClientTaxId((initialData as any).clientTaxId || '');
      setStatus((initialData as any).status || 'Pending');
      setNotes((initialData as any).notes || '');
      setTerms((initialData as any).terms || '');
      setTitle((initialData as any).title || '');

      // Common tax initialization
      const rawTaxMode = (initialData as any).taxMode ||
        ((initialData as any).taxRate && (initialData as any).taxRate > 0 ? 'exclusive' : 'none');
      setTaxMode(rawTaxMode);
      setTaxName((initialData as any).taxName || 'VAT');

      if (docType === 'invoice') {
        const inv = initialData as Invoice;
        setIssueDate(inv.issueDate || new Date().toISOString().split('T')[0]);
        setSecondDate(inv.dueDate || '');
        setPaymentMethod(inv.paymentMethod || 'Wire Transfer');
        if (inv.lineItems && inv.lineItems.length > 0) {
          setLineItems(inv.lineItems);
        }
        setTaxRate(inv.taxRate ?? (rawTaxMode !== 'none' ? 18 : 0));
      } else if (docType === 'proposal') {
        const prop = initialData as ProposalDocument;
        setIssueDate(prop.issueDate || '');
        setSecondDate(prop.validUntil || '');
        setScope(prop.scope || '');
        setDeliverables(prop.deliverables || []);
        setContractValue(prop.value || 0);
        setTaxRate(prop.taxRate ?? (rawTaxMode !== 'none' ? 18 : 0));
      } else if (docType === 'quotation') {
        const quo = initialData as QuotationDocument;
        setIssueDate(quo.issueDate || '');
        setSecondDate(quo.validUntil || '');
        if (quo.lineItems && quo.lineItems.length > 0) {
          setLineItems(quo.lineItems);
        }
        setTaxRate(quo.taxRate ?? (rawTaxMode !== 'none' ? 18 : 0));
      } else if (docType === 'contract') {
        const ctr = initialData as ContractDocument;
        setIssueDate(ctr.startDate || '');
        setSecondDate(ctr.endDate || '');
        setContractValue(ctr.contractValue || 0);
        setBillingCadence(ctr.billingCadence || 'Monthly');
        setClientSigner(ctr.clientSigner || '');
        setCompanySigner(ctr.companySigner || 'Sayed (CEO, Ozostack)');
        setClauses(ctr.clauses || []);
        setScope(ctr.scopeSummary || '');
      }
    } else {
      // Reset form
      setClient(CLIENT_OPTIONS[0]);
      setStatus(docType === 'contract' ? 'Active' : 'Pending');
      setIssueDate(new Date().toISOString().split('T')[0]);
      setSecondDate(new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]);
      setLineItems([
        {
          id: `li-${Date.now()}`,
          description: 'Enterprise Cloud Platform License',
          quantity: 1,
          unitPrice: 15000,
          total: 15000,
        },
      ]);
      setTaxMode('none');
      setTaxName('VAT');
      setTaxRate(0);
      setScope('Dedicated enterprise engineering engagement and software delivery.');
      setDeliverables([
        'Core architecture blueprint and technical specifications',
        'Multi-region high availability deployment',
      ]);
      setClauses([
        'Intellectual Property ownership assigned to client upon full payment.',
        '99.95% API uptime SLA with financial credit remedies.',
      ]);
      setContractValue(95000);
    }
  }, [initialData, docType, isOpen]);

  if (!isOpen) return null;

  // Handle line item updates
  const handleUpdateLineItem = (
    id: string,
    field: 'description' | 'quantity' | 'unitPrice',
    val: string | number
  ) => {
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: val };
          const qty = field === 'quantity' ? Number(val) : updated.quantity;
          const rate = field === 'unitPrice' ? Number(val) : updated.unitPrice;
          updated.total = Math.max(0, qty * rate);
          return updated;
        }
        return item;
      })
    );
  };

  const handleAddLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      {
        id: `li-${Date.now()}-${Math.random()}`,
        description: 'New Deliverable Line Item',
        quantity: 1,
        unitPrice: 2500,
        total: 2500,
      },
    ]);
  };

  const handleRemoveLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems((prev) => prev.filter((item) => item.id !== id));
    }
  };

  // Calculations for Invoice & Quotation
  const rawLineItemsSum = lineItems.reduce((acc, it) => acc + (it.total || 0), 0);
  let calculatedSubtotal = rawLineItemsSum;
  let calculatedTax = 0;
  let calculatedTotal = rawLineItemsSum;

  if (taxMode === 'none') {
    calculatedSubtotal = rawLineItemsSum;
    calculatedTax = 0;
    calculatedTotal = rawLineItemsSum;
  } else if (taxMode === 'exclusive') {
    calculatedSubtotal = rawLineItemsSum;
    calculatedTax = Math.round((rawLineItemsSum * taxRate) / 100);
    calculatedTotal = calculatedSubtotal + calculatedTax;
  } else if (taxMode === 'inclusive') {
    calculatedTotal = rawLineItemsSum;
    calculatedSubtotal = Math.round(rawLineItemsSum / (1 + (taxRate > 0 ? taxRate / 100 : 0)));
    calculatedTax = calculatedTotal - calculatedSubtotal;
  }

  // Calculations for Proposal
  let propSubtotal = contractValue;
  let propTax = 0;
  let propTotal = contractValue;
  if (taxMode === 'none') {
    propSubtotal = contractValue;
    propTax = 0;
    propTotal = contractValue;
  } else if (taxMode === 'exclusive') {
    propSubtotal = contractValue;
    propTax = Math.round((contractValue * taxRate) / 100);
    propTotal = propSubtotal + propTax;
  } else if (taxMode === 'inclusive') {
    propTotal = contractValue;
    propSubtotal = Math.round(contractValue / (1 + (taxRate > 0 ? taxRate / 100 : 0)));
    propTax = propTotal - propSubtotal;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const activeTaxRate = taxMode === 'none' ? 0 : taxRate;

    if (docType === 'invoice') {
      const updatedInvoice: Invoice = {
        id: initialData?.id || `inv-${Date.now()}`,
        invoiceNumber:
          (initialData as Invoice)?.invoiceNumber ||
          `INV-2025-${Math.floor(130 + Math.random() * 50)}`,
        client,
        clientEmail: clientEmail || `${client.toLowerCase().replace(/[^a-z0-9]/g, '')}@client.com`,
        clientAddress: clientAddress || 'Corporate Office',
        clientTaxId,
        amount: `$${calculatedTotal.toLocaleString('en-US')}`,
        amountNumeric: calculatedTotal,
        status: status as any,
        issueDate,
        dueDate: secondDate,
        lineItems,
        subtotal: calculatedSubtotal,
        taxMode,
        taxName,
        taxRate: activeTaxRate,
        taxAmount: calculatedTax,
        totalAmount: calculatedTotal,
        paymentMethod,
        notes,
        terms: terms || 'Payment due within 15 days of invoice date.',
        createdAt: (initialData as any)?.createdAt || new Date().toISOString(),
      };
      onSave('invoice', updatedInvoice);
    } else if (docType === 'proposal') {
      const updatedProp: ProposalDocument = {
        id: initialData?.id || `prop-${Date.now()}`,
        proposalNumber:
          (initialData as ProposalDocument)?.proposalNumber ||
          `PROP-2025-0${Math.floor(45 + Math.random() * 20)}`,
        title: title || `${client} AI & Cloud Enterprise Proposal`,
        client,
        clientEmail,
        clientAddress,
        scope,
        status: status as any,
        subtotal: propSubtotal,
        taxMode,
        taxName,
        taxRate: activeTaxRate,
        taxAmount: propTax,
        value: propTotal,
        valueFormatted: `$${propTotal.toLocaleString('en-US')}`,
        issueDate,
        validUntil: secondDate,
        deliverables,
        terms: terms || '50% upon kickoff, 30% upon milestone 2, 20% on go-live.',
        notes,
        createdAt: (initialData as any)?.createdAt || new Date().toISOString(),
      };
      onSave('proposal', updatedProp);
    } else if (docType === 'quotation') {
      const updatedQuo: QuotationDocument = {
        id: initialData?.id || `quo-${Date.now()}`,
        quotationNumber:
          (initialData as QuotationDocument)?.quotationNumber ||
          `QUO-2025-0${Math.floor(85 + Math.random() * 20)}`,
        title: title || `${client} Engineering Estimate`,
        client,
        clientEmail,
        clientAddress,
        status: status as any,
        lineItems,
        subtotal: calculatedSubtotal,
        taxMode,
        taxName,
        taxRate: activeTaxRate,
        taxAmount: calculatedTax,
        totalAmount: calculatedTotal,
        totalFormatted: `$${calculatedTotal.toLocaleString('en-US')}`,
        issueDate,
        validUntil: secondDate,
        notes,
        terms: terms || 'Valid for 15 days from issuance date.',
        createdAt: (initialData as any)?.createdAt || new Date().toISOString(),
      };
      onSave('quotation', updatedQuo);
    } else if (docType === 'contract') {
      const updatedCtr: ContractDocument = {
        id: initialData?.id || `ctr-${Date.now()}`,
        contractNumber:
          (initialData as ContractDocument)?.contractNumber ||
          `CTR-2025-0${Math.floor(20 + Math.random() * 20)}`,
        title: title || `Master Services Agreement (MSA) - ${client}`,
        client,
        clientSigner: clientSigner || `${client} Authorized Executive`,
        companySigner: companySigner || 'Sayed (Chief Executive Officer)',
        status: status as any,
        startDate: issueDate,
        endDate: secondDate,
        contractValue,
        contractValueFormatted: `$${contractValue.toLocaleString('en-US')} Total`,
        billingCadence,
        clauses,
        scopeSummary: scope || 'Enterprise services agreement and operational SLA.',
        notes,
        terms: terms || 'Governed by mutual MSA terms. Payment due upon monthly billing cycle.',
        createdAt: (initialData as any)?.createdAt || new Date().toISOString(),
      };
      onSave('contract', updatedCtr);
    }

    onClose();
  };

  const inputClass = isLight
    ? 'w-full px-3 py-2 text-xs rounded-xl border border-sky-100 bg-sky-50/40 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400'
    : 'w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-slate-900/60 text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500';

  const labelClass = 'block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className={`relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl border shadow-2xl ${
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
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white capitalize">
              {initialData ? `Edit ${docType}` : `Create New ${docType}`}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Configure corporate billing line items, client terms, and financial parameters
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Document Title (For Proposals, Quotes, Contracts) */}
          {docType !== 'invoice' && (
            <div>
              <label className={labelClass}>Document Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Master Services Agreement (MSA)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputClass}
              />
            </div>
          )}

          {/* Client & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Client Organization *</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  list="client-list"
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  className={inputClass}
                />
                <datalist id="client-list">
                  {CLIENT_OPTIONS.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
            </div>

            <div>
              <label className={labelClass}>Document Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={inputClass}
              >
                {docType === 'invoice' && (
                  <>
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                    <option value="Overdue">Overdue</option>
                    <option value="Draft">Draft</option>
                  </>
                )}
                {docType === 'proposal' && (
                  <>
                    <option value="Sent">Sent</option>
                    <option value="Approved">Approved</option>
                    <option value="Declined">Declined</option>
                    <option value="Draft">Draft</option>
                  </>
                )}
                {docType === 'quotation' && (
                  <>
                    <option value="Sent">Sent</option>
                    <option value="Accepted">Accepted</option>
                    <option value="Expired">Expired</option>
                    <option value="Draft">Draft</option>
                  </>
                )}
                {docType === 'contract' && (
                  <>
                    <option value="Active">Active</option>
                    <option value="Pending Signature">Pending Signature</option>
                    <option value="Completed">Completed</option>
                    <option value="Terminated">Terminated</option>
                    <option value="Draft">Draft</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>
                {docType === 'contract' ? 'Effective Start Date' : 'Issue Date'}
              </label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>
                {docType === 'invoice'
                  ? 'Due Date'
                  : docType === 'contract'
                  ? 'Contract End Date'
                  : 'Valid Until'}
              </label>
              <input
                type="date"
                value={secondDate}
                onChange={(e) => setSecondDate(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* Client Email & Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Client Email</label>
              <input
                type="email"
                placeholder="billing@client.com"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Client Registered Address</label>
              <input
                type="text"
                placeholder="City, State / Country"
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* INVOICE & QUOTATION: Line items builder */}
          {(docType === 'invoice' || docType === 'quotation') && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Line Items & Scope Breakdown
                </span>
                <button
                  type="button"
                  onClick={handleAddLineItem}
                  className="flex items-center gap-1 text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Line Item</span>
                </button>
              </div>

              <div className="space-y-2">
                {lineItems.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-xs"
                  >
                    <input
                      type="text"
                      placeholder="Item Description"
                      value={item.description}
                      onChange={(e) =>
                        handleUpdateLineItem(item.id, 'description', e.target.value)
                      }
                      className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                    />

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <div className="w-20">
                        <input
                          type="number"
                          min="1"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) =>
                            handleUpdateLineItem(item.id, 'quantity', Number(e.target.value))
                          }
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-center text-slate-800 dark:text-white"
                        />
                      </div>

                      <div className="w-28 relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400">{currency.symbol}</span>
                        <input
                          type="number"
                          min="0"
                          step="100"
                          placeholder="Rate"
                          value={item.unitPrice}
                          onChange={(e) =>
                            handleUpdateLineItem(item.id, 'unitPrice', Number(e.target.value))
                          }
                          className="w-full pl-5 pr-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                        />
                      </div>

                      <span className="w-24 text-right font-bold text-slate-900 dark:text-white">
                        {currency.symbol}{item.total.toLocaleString('en-US')}
                      </span>

                      {lineItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveLineItem(item.id)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Professional Tax Configuration System */}
              <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Tax Configuration System
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    {taxMode === 'none'
                      ? 'Tax Exempt / No Tax (0%)'
                      : taxMode === 'exclusive'
                      ? 'Tax Added to Net Subtotal (Exclusive)'
                      : 'Tax Included in Unit Prices (Inclusive)'}
                  </span>
                </div>

                {/* 3 Tax Mode Buttons */}
                <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-200/70 dark:bg-slate-800/80 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setTaxMode('none');
                    }}
                    className={`py-1.5 px-2 rounded-lg font-bold text-center transition-all ${
                      taxMode === 'none'
                        ? 'bg-white dark:bg-sky-600 text-sky-600 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Without Tax (0%)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTaxMode('exclusive');
                      if (taxRate === 0) setTaxRate(18);
                    }}
                    className={`py-1.5 px-2 rounded-lg font-bold text-center transition-all ${
                      taxMode === 'exclusive'
                        ? 'bg-white dark:bg-sky-600 text-sky-600 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Tax Added (Exclusive)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTaxMode('inclusive');
                      if (taxRate === 0) setTaxRate(18);
                    }}
                    className={`py-1.5 px-2 rounded-lg font-bold text-center transition-all ${
                      taxMode === 'inclusive'
                        ? 'bg-white dark:bg-sky-600 text-sky-600 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Tax Included (Inclusive)
                  </button>
                </div>

                {/* Tax Rate & Type Controls (only when tax is enabled) */}
                {taxMode !== 'none' && (
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-slate-500">Tax Label:</span>
                      <select
                        value={taxName}
                        onChange={(e) => setTaxName(e.target.value)}
                        className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-medium"
                      >
                        <option value="VAT">VAT</option>
                        <option value="GST">GST</option>
                        <option value="Sales Tax">Sales Tax</option>
                        <option value="State Tax">State Tax</option>
                        <option value="Tax">General Tax</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-slate-500">Rate:</span>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        step="0.5"
                        value={taxRate}
                        onChange={(e) => setTaxRate(Number(e.target.value))}
                        className="w-16 px-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-center font-bold text-slate-800 dark:text-white"
                      />
                      <span className="text-xs font-semibold text-slate-500">%</span>
                    </div>

                    <div className="flex items-center gap-1">
                      {[5, 10, 18, 20].map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setTaxRate(r)}
                          className={`px-2 py-0.5 text-[10px] rounded-md font-semibold border transition-colors ${
                            taxRate === r
                              ? 'bg-sky-500 text-white border-sky-500'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          {r}%
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Financial Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80">
                    <span className="text-[10px] text-slate-400 block font-medium">Subtotal (Net)</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100">
                      {currency.symbol}{calculatedSubtotal.toLocaleString('en-US')}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80">
                    <span className="text-[10px] text-slate-400 block font-medium">
                      {taxMode === 'none'
                        ? 'Tax (0% Exempt)'
                        : taxMode === 'exclusive'
                        ? `+ ${taxName} (${taxRate}%)`
                        : `Included ${taxName} (${taxRate}%)`}
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-100">
                      {taxMode === 'none' ? `${currency.symbol}0` : `${currency.symbol}${calculatedTax.toLocaleString('en-US')}`}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800">
                    <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 block">
                      Total Payable
                    </span>
                    <span className="font-black text-sm text-sky-700 dark:text-sky-300">
                      {currency.symbol}{calculatedTotal.toLocaleString('en-US')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PROPOSAL: Value & Deliverables */}
          {docType === 'proposal' && (
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                <div>
                  <label className={labelClass}>Base Proposal Value ({currency.symbol} {currency.code})</label>
                  <input
                    type="number"
                    min="1000"
                    step="500"
                    value={contractValue}
                    onChange={(e) => setContractValue(Number(e.target.value))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Tax Mode</label>
                  <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-200/70 dark:bg-slate-800/80 text-xs">
                    <button
                      type="button"
                      onClick={() => setTaxMode('none')}
                      className={`py-1 px-1.5 rounded-lg text-[10px] font-bold text-center transition-all ${
                        taxMode === 'none'
                          ? 'bg-white dark:bg-sky-600 text-sky-600 dark:text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      No Tax
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTaxMode('exclusive');
                        if (taxRate === 0) setTaxRate(18);
                      }}
                      className={`py-1 px-1.5 rounded-lg text-[10px] font-bold text-center transition-all ${
                        taxMode === 'exclusive'
                          ? 'bg-white dark:bg-sky-600 text-sky-600 dark:text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      +Exclusive
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTaxMode('inclusive');
                        if (taxRate === 0) setTaxRate(18);
                      }}
                      className={`py-1 px-1.5 rounded-lg text-[10px] font-bold text-center transition-all ${
                        taxMode === 'inclusive'
                          ? 'bg-white dark:bg-sky-600 text-sky-600 dark:text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Inclusive
                    </button>
                  </div>
                </div>
              </div>

              {taxMode !== 'none' && (
                <div className="flex items-center gap-3 text-xs p-2 rounded-lg bg-sky-50/50 dark:bg-slate-900 border border-sky-100 dark:border-slate-800">
                  <span className="text-slate-500 font-medium">Tax Rate:</span>
                  <input
                    type="number"
                    min="0"
                    max="40"
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                    className="w-16 px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-center font-bold"
                  />
                  <span>%</span>
                  <span className="text-slate-400 text-[11px] ml-auto">
                    {taxMode === 'exclusive'
                      ? `Final Total: ${currency.symbol}${propTotal.toLocaleString('en-US')} (+${currency.symbol}${propTax.toLocaleString('en-US')} ${taxName})`
                      : `Final Total: ${currency.symbol}${propTotal.toLocaleString('en-US')} (Includes ${currency.symbol}${propTax.toLocaleString('en-US')} ${taxName})`}
                  </span>
                </div>
              )}

              <div>
                <label className={labelClass}>Executive Scope Summary</label>
                <textarea
                  rows={2}
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                  className={inputClass}
                  placeholder="Summary of project goals and engineering deliverable..."
                />
              </div>

              <div>
                <label className={labelClass}>Scope Deliverables Checklist</label>
                <div className="space-y-1.5 mb-2">
                  {deliverables.map((d, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs"
                    >
                      <span>{d}</span>
                      <button
                        type="button"
                        onClick={() => setDeliverables(deliverables.filter((_, idx) => idx !== i))}
                        className="text-rose-500 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add deliverable..."
                    value={newDeliverable}
                    onChange={(e) => setNewDeliverable(e.target.value)}
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newDeliverable.trim()) {
                        setDeliverables([...deliverables, newDeliverable.trim()]);
                        setNewDeliverable('');
                      }
                    }}
                    className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-sky-500 text-white"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* CONTRACT: Value, Billing Cadence & Clauses */}
          {docType === 'contract' && (
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Contract Total Value ({currency.symbol})</label>
                  <input
                    type="number"
                    min="1000"
                    step="500"
                    value={contractValue}
                    onChange={(e) => setContractValue(Number(e.target.value))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Billing Cadence</label>
                  <select
                    value={billingCadence}
                    onChange={(e) => setBillingCadence(e.target.value as any)}
                    className={inputClass}
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Milestone-Based">Milestone-Based</option>
                    <option value="Lump Sum">Lump Sum</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Client Authorized Signer</label>
                  <input
                    type="text"
                    placeholder="e.g. John Doe (VP of Eng)"
                    value={clientSigner}
                    onChange={(e) => setClientSigner(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Provider Signer</label>
                  <input
                    type="text"
                    value={companySigner}
                    onChange={(e) => setCompanySigner(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Contract Scope Summary</label>
                <textarea
                  rows={2}
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Contract Clauses & Legal Articles</label>
                <div className="space-y-1.5 mb-2">
                  {clauses.map((clause, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs"
                    >
                      <span className="truncate pr-2">{clause}</span>
                      <button
                        type="button"
                        onClick={() => setClauses(clauses.filter((_, i) => i !== idx))}
                        className="text-rose-500 hover:text-rose-600 shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add clause (e.g. IP transfer terms)..."
                    value={newClause}
                    onChange={(e) => setNewClause(e.target.value)}
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newClause.trim()) {
                        setClauses([...clauses, newClause.trim()]);
                        setNewClause('');
                      }
                    }}
                    className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-sky-500 text-white"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Terms & Conditions */}
          <div>
            <label className={labelClass}>Terms & Remittance Notes</label>
            <textarea
              rows={2}
              placeholder="e.g. Net-15 terms. Wire transfer instructions specified on invoice."
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              className={inputClass}
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
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Save {docType}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
