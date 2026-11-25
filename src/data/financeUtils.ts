import {
  DepartmentProfitLoss,
  ExpenseItem,
  Invoice,
  MonthlyFinancialRecord,
  PaymentTransaction,
  PnLAdjustment,
  PnLLineItem,
  RevenueTransaction,
} from '../types/crm';
import { getActiveAuthScope } from './projectDirectory';

export type FinanceTimePeriod = 'This Month' | 'This Quarter' | 'YTD' | 'All Time';

export function getTodayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getCurrentYear(): number {
  return new Date().getFullYear();
}

export function isDateInFinancePeriod(dateStr: string, period: FinanceTimePeriod | string): boolean {
  if (!dateStr || period === 'All Time') return true;
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed
  const ym = `${year}-${String(month + 1).padStart(2, '0')}`;

  if (period === 'This Month') {
    return dateStr.startsWith(ym);
  }
  if (period === 'This Quarter') {
    const qStartMonth = Math.floor(month / 3) * 3;
    const start = `${year}-${String(qStartMonth + 1).padStart(2, '0')}-01`;
    const endMonth = qStartMonth + 3;
    const endDate = new Date(year, endMonth, 0).getDate();
    const end = `${year}-${String(endMonth).padStart(2, '0')}-${String(endDate).padStart(2, '0')}`;
    return dateStr >= start && dateStr <= end;
  }
  if (period === 'YTD' || period.startsWith('YTD')) {
    return dateStr.startsWith(String(year));
  }
  return true;
}

export interface RealCrmClientOption {
  name: string;
  email: string;
  phone: string;
  project?: string;
}

function readJsonArray<T = any>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getRealCrmClients(): RealCrmClientOption[] {
  const map = new Map<string, RealCrmClientOption>();
  const { isSuperAdmin, myName, canView } = getActiveAuthScope();
  const norm = (s?: string) =>
    (s || '')
      .replace(/\s*\([^)]*\)/g, '')
      .trim()
      .toLowerCase();

  const add = (name?: string, email?: string, phone?: string, project?: string) => {
    const cleanName = String(name || '').trim();
    if (!cleanName) return;
    const k = cleanName.toLowerCase();
    const existing = map.get(k);
    const cleanEmail = email && !email.endsWith('.local') ? email.trim() : '';
    if (!existing) {
      map.set(k, {
        name: cleanName,
        email: cleanEmail,
        phone: String(phone || '').trim(),
        project: project?.trim() || undefined,
      });
    } else {
      if (!existing.email && cleanEmail) existing.email = cleanEmail;
      if (!existing.phone && phone) existing.phone = String(phone).trim();
      if (!existing.project && project) existing.project = project.trim();
    }
  };

  if (isSuperAdmin || canView('Companies')) {
    readJsonArray('ozostack_companies_v1')
      .filter((c: any) => isSuperAdmin || (myName && norm(c.accountOwner) === myName))
      .forEach((c: any) => add(c.name, c.email, c.phone));
  }

  if (isSuperAdmin || canView('Leads')) {
    readJsonArray('ozostack_leads_v2')
      .filter((l: any) => isSuperAdmin || (myName && norm(l.owner) === myName))
      .forEach((l: any) => add(l.company || l.name, l.email, l.phone, l.title));
  }

  if (isSuperAdmin || canView('Contacts')) {
    readJsonArray('ozostack_contacts_v1')
      .filter((c: any) => isSuperAdmin || (myName && norm(c.dealOwner) === myName))
      .forEach((c: any) => add(c.company || c.name, c.email, c.phone));
  }

  if (isSuperAdmin || canView('Projects')) {
    readJsonArray('ozostack_projects')
      .filter((p: any) => {
        if (isSuperAdmin) return true;
        if (!myName) return false;
        const owners = [p.projectManager, ...(Array.isArray(p.team) ? p.team : [])];
        return owners.some((o: string) => norm(o) === myName);
      })
      .forEach((p: any) => add(p.client, '', '', p.name));
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Automatically logs a Paid Invoice into both Payments (`ozostack_payments`)
 * and Revenue (`ozostack_revenue_transactions`) so Finance stays 100% connected.
 */
export function syncPaidInvoiceToFinance(invoice: Invoice, currencySymbol: string, currencyCode = 'INR'): void {
  if (!invoice || invoice.status !== 'Paid') return;
  const amount = Number(invoice.totalAmount || invoice.amountNumeric || 0);
  if (amount <= 0) return;

  const today = getTodayIso();
  const invNum = invoice.invoiceNumber || invoice.id;
  const year = getCurrentYear();

  // 1. Sync into ozostack_payments
  try {
    const payments = readJsonArray<PaymentTransaction>('ozostack_payments');
    const alreadyInPayments = payments.some(
      (p) => p.invoiceNumber && p.invoiceNumber === invNum && p.type === 'Inflow / Collection'
    );
    if (!alreadyInPayments) {
      const newPay: PaymentTransaction = {
        id: `pay-inv-${invoice.id}`,
        paymentNumber: `PAY-${year}-${Math.floor(100 + Math.random() * 899)}`,
        transactionReference: `inv_${invNum.replace(/[^a-zA-Z0-9]/g, '')}`,
        type: 'Inflow / Collection',
        client: invoice.client || 'Client',
        clientEmail: invoice.clientEmail,
        invoiceNumber: invNum,
        amount,
        amountFormatted: `${currencySymbol}${amount.toLocaleString('en-US')}`,
        feeAmount: 0,
        netAmount: amount,
        currency: (currencyCode as any) || 'INR',
        status: 'Succeeded',
        paymentMethod: (invoice.paymentMethod as any) || 'Wire / SWIFT',
        gateway: 'Chase Commercial',
        date: today,
        settledDate: today,
        receiptNumber: `REC-${year}-${Math.floor(100 + Math.random() * 899)}`,
        notes: `Auto-recorded from Paid Invoice ${invNum}`,
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem('ozostack_payments', JSON.stringify([newPay, ...payments]));
    }
  } catch {
    /* ignore */
  }

  // 2. Sync into ozostack_revenue_transactions
  try {
    const revs = readJsonArray<RevenueTransaction>('ozostack_revenue_transactions');
    const alreadyInRev = revs.some((r) => r.invoiceNumber && r.invoiceNumber === invNum);
    if (!alreadyInRev) {
      const newRev: RevenueTransaction = {
        id: `rev-inv-${invoice.id}`,
        transactionNumber: `REV-${year}-${Math.floor(100 + Math.random() * 899)}`,
        client: invoice.client || 'Client',
        project: invoice.lineItems?.[0]?.description || `Invoice ${invNum}`,
        streamType: 'Custom Engineering',
        amount,
        amountFormatted: `${currencySymbol}${amount.toLocaleString('en-US')}`,
        status: 'Received',
        date: today,
        paymentMethod: (invoice.paymentMethod as any) || 'Wire Transfer',
        invoiceNumber: invNum,
        isRecurring: false,
        grossMarginPercent: 100,
        netProfit: amount,
        accountManager: 'Admin',
        notes: `Auto-recorded from Paid Invoice ${invNum}`,
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem('ozostack_revenue_transactions', JSON.stringify([newRev, ...revs]));
    }
  } catch {
    /* ignore */
  }

  window.dispatchEvent(new Event('storage'));
  window.dispatchEvent(new CustomEvent('ozostack-crm-config-changed'));
}

/**
 * Automatically mirrors a Succeeded Inflow Payment into Revenue (`ozostack_revenue_transactions`)
 * unless an entry for that invoice/payment already exists.
 */
export function syncPaymentToRevenue(payment: PaymentTransaction, currencySymbol: string): void {
  if (!payment || payment.status !== 'Succeeded' || payment.type !== 'Inflow / Collection') return;
  const amount = Number(payment.amount || 0);
  if (amount <= 0) return;

  try {
    const revs = readJsonArray<RevenueTransaction>('ozostack_revenue_transactions');
    const refKey = payment.invoiceNumber || payment.paymentNumber;
    const exists = revs.some(
      (r) =>
        (payment.invoiceNumber && r.invoiceNumber === payment.invoiceNumber) ||
        r.id === `rev-pay-${payment.id}`
    );
    if (!exists) {
      const year = getCurrentYear();
      const newRev: RevenueTransaction = {
        id: `rev-pay-${payment.id}`,
        transactionNumber: `REV-${year}-${Math.floor(100 + Math.random() * 899)}`,
        client: payment.client || 'Client',
        project: refKey ? `Payment ${refKey}` : 'Client Collection',
        streamType: 'Custom Engineering',
        amount,
        amountFormatted: `${currencySymbol}${amount.toLocaleString('en-US')}`,
        status: 'Received',
        date: payment.date || getTodayIso(),
        paymentMethod: 'Wire Transfer',
        invoiceNumber: payment.invoiceNumber || payment.paymentNumber,
        isRecurring: false,
        grossMarginPercent: 100,
        netProfit: payment.netAmount || amount,
        accountManager: 'Admin',
        notes: payment.notes || `Auto-synced from Payment ${payment.paymentNumber}`,
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem('ozostack_revenue_transactions', JSON.stringify([newRev, ...revs]));
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('ozostack-crm-config-changed'));
    }
  } catch {
    /* ignore */
  }
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const COGS_CATEGORIES = new Set(['Cloud & Infrastructure', 'AI & API Services']);

export function buildLivePnLData(
  selectedYear: number,
  adjustments: PnLAdjustment[]
): {
  lineItems: PnLLineItem[];
  monthlyData: MonthlyFinancialRecord[];
  departments: DepartmentProfitLoss[];
} {
  const revTxs = readJsonArray<RevenueTransaction>('ozostack_revenue_transactions');
  const invoices = readJsonArray<Invoice>('ozostack_invoices');
  const payments = readJsonArray<PaymentTransaction>('ozostack_payments');
  const expenses = readJsonArray<ExpenseItem>('ozostack_expenses');
  const payroll = readJsonArray<any>('ozostack_payroll_records_v1');

  // Deduplicated revenue entries (Revenue ledger + Paid invoices not in revenue + Succeeded inflow payments not in revenue)
  const seenInvoices = new Set<string>();
  const unifiedRev: { amount: number; date: string; stream: string; tax: number }[] = [];

  for (const r of revTxs) {
    if (String(r.status) === 'Refunded' || String(r.status) === 'Cancelled') continue;
    if (r.invoiceNumber) seenInvoices.add(r.invoiceNumber);
    unifiedRev.push({
      amount: Number(r.amount) || 0,
      date: r.date || getTodayIso(),
      stream: r.streamType || 'Operating Revenue',
      tax: 0,
    });
  }
  for (const inv of invoices) {
    if (inv.status !== 'Paid') continue;
    if (inv.invoiceNumber && seenInvoices.has(inv.invoiceNumber)) continue;
    if (inv.invoiceNumber) seenInvoices.add(inv.invoiceNumber);
    unifiedRev.push({
      amount: Number(inv.totalAmount || inv.amountNumeric) || 0,
      date: inv.issueDate || getTodayIso(),
      stream: 'Invoiced Client Services',
      tax: Number(inv.taxAmount) || 0,
    });
  }
  for (const p of payments) {
    if (p.status !== 'Succeeded' || p.type !== 'Inflow / Collection') continue;
    if (p.invoiceNumber && seenInvoices.has(p.invoiceNumber)) continue;
    unifiedRev.push({
      amount: Number(p.amount) || 0,
      date: p.date || getTodayIso(),
      stream: 'Direct Payment Collections',
      tax: 0,
    });
  }

  // Monthly buckets for selectedYear
  const months: MonthlyFinancialRecord[] = MONTH_LABELS.map((m, idx) => ({
    month: m,
    monthIndex: idx,
    revenue: 0,
    cogs: 0,
    grossProfit: 0,
    grossMarginPct: 0,
    opex: 0,
    ebitda: 0,
    netProfit: 0,
    netMarginPct: 0,
  }));

  const revByStream = new Map<string, number>();
  const cogsByCat = new Map<string, number>();
  const opexByCat = new Map<string, number>();
  const deptMap = new Map<string, { revenue: number; expenses: number }>();
  let totalTaxAmount = 0;

  const getYearMonth = (dateStr?: string) => {
    const clean = String(dateStr || '');
    const m = clean.match(/^(\d{4})-(\d{2})/);
    if (!m) return { y: selectedYear, monthIdx: new Date().getMonth() };
    return { y: Number(m[1]), monthIdx: Math.max(0, Math.min(11, Number(m[2]) - 1)) };
  };

  for (const r of unifiedRev) {
    const { y, monthIdx } = getYearMonth(r.date);
    if (y === selectedYear) {
      months[monthIdx].revenue += r.amount;
      revByStream.set(r.stream, (revByStream.get(r.stream) || 0) + r.amount);
      totalTaxAmount += r.tax;
      const d = deptMap.get(r.stream) || { revenue: 0, expenses: 0 };
      d.revenue += r.amount;
      deptMap.set(r.stream, d);
    }
  }

  for (const exp of expenses) {
    if (exp.status === 'Rejected') continue;
    const amt = Number(exp.amount) || 0;
    const tax = Number(exp.taxAmount) || 0;
    const { y, monthIdx } = getYearMonth(exp.date);
    if (y === selectedYear) {
      if (COGS_CATEGORIES.has(exp.category)) {
        months[monthIdx].cogs += amt;
        cogsByCat.set(exp.category, (cogsByCat.get(exp.category) || 0) + amt);
      } else {
        months[monthIdx].opex += amt;
        opexByCat.set(exp.category || 'General OPEX', (opexByCat.get(exp.category || 'General OPEX') || 0) + amt);
      }
      totalTaxAmount += tax;
      const dKey = exp.department || 'Operations';
      const d = deptMap.get(dKey) || { revenue: 0, expenses: 0 };
      d.expenses += amt;
      deptMap.set(dKey, d);
    }
  }

  for (const pr of payroll) {
    if (pr.status !== 'Paid' && pr.status !== 'Processed') continue;
    const amt = Number(pr.netSalary || pr.netPay || pr.grossSalary || 0);
    if (amt <= 0) continue;
    const { y, monthIdx } = getYearMonth(pr.payDate || pr.date || getTodayIso());
    if (y === selectedYear) {
      months[monthIdx].opex += amt;
      opexByCat.set('Team & Payroll', (opexByCat.get('Team & Payroll') || 0) + amt);
      const dKey = pr.department || 'Team & Payroll';
      const d = deptMap.get(dKey) || { revenue: 0, expenses: 0 };
      d.expenses += amt;
      deptMap.set(dKey, d);
    }
  }

  // Apply manual P&L adjustments
  for (const adj of adjustments || []) {
    const amt = Number(adj.amount) || 0;
    if (amt <= 0) continue;
    const signed = adj.type === 'Credit' ? amt : -amt;
    const { y, monthIdx } = getYearMonth(adj.date);
    if (y !== selectedYear) continue;

    if (adj.category === 'Operating Revenue') {
      months[monthIdx].revenue += signed;
      revByStream.set(adj.accountName || 'Manual Revenue Adjustment', (revByStream.get(adj.accountName || 'Manual Revenue Adjustment') || 0) + signed);
    } else if (adj.category === 'Cost of Goods Sold (COGS)') {
      months[monthIdx].cogs += amt;
      cogsByCat.set(adj.accountName || 'COGS Adjustment', (cogsByCat.get(adj.accountName || 'COGS Adjustment') || 0) + amt);
    } else if (adj.category === 'Operating Expenses (OpEx)') {
      months[monthIdx].opex += amt;
      opexByCat.set(adj.accountName || 'OpEx Adjustment', (opexByCat.get(adj.accountName || 'OpEx Adjustment') || 0) + amt);
    } else {
      totalTaxAmount += amt;
    }
  }

  // Finalize monthly formulas
  for (const m of months) {
    m.grossProfit = m.revenue - m.cogs;
    m.grossMarginPct = m.revenue > 0 ? Number(((m.grossProfit / m.revenue) * 100).toFixed(1)) : 0;
    m.ebitda = m.grossProfit - m.opex;
    m.netProfit = m.ebitda;
    m.netMarginPct = m.revenue > 0 ? Number(((m.netProfit / m.revenue) * 100).toFixed(1)) : 0;
  }

  // Build real P&L line items
  const lineItems: PnLLineItem[] = [];
  let codeIdx = 1;
  revByStream.forEach((amt, name) => {
    lineItems.push({
      id: `live-rev-${codeIdx}`,
      category: 'Operating Revenue',
      accountCode: `40${String(codeIdx * 10).padStart(2, '0')}`,
      name,
      actualAmount: Math.round(amt),
      budgetAmount: Math.round(amt),
      priorPeriodAmount: 0,
      notes: 'Synced live from CRM Revenue & Paid Invoices',
    });
    codeIdx++;
  });

  codeIdx = 1;
  cogsByCat.forEach((amt, name) => {
    lineItems.push({
      id: `live-cogs-${codeIdx}`,
      category: 'Cost of Goods Sold (COGS)',
      accountCode: `50${String(codeIdx * 10).padStart(2, '0')}`,
      name,
      actualAmount: Math.round(amt),
      budgetAmount: Math.round(amt),
      priorPeriodAmount: 0,
      notes: 'Synced live from CRM Expenses',
    });
    codeIdx++;
  });

  codeIdx = 1;
  opexByCat.forEach((amt, name) => {
    lineItems.push({
      id: `live-opex-${codeIdx}`,
      category: 'Operating Expenses (OpEx)',
      accountCode: `60${String(codeIdx * 10).padStart(2, '0')}`,
      name,
      actualAmount: Math.round(amt),
      budgetAmount: Math.round(amt),
      priorPeriodAmount: 0,
      notes: 'Synced live from CRM Expenses & Payroll',
    });
    codeIdx++;
  });

  if (totalTaxAmount > 0) {
    lineItems.push({
      id: 'live-tax-1',
      category: 'Tax & Depreciation',
      accountCode: '7010',
      name: 'Recorded Taxes (GST / VAT / Expense Tax)',
      actualAmount: Math.round(totalTaxAmount),
      budgetAmount: Math.round(totalTaxAmount),
      priorPeriodAmount: 0,
      notes: 'Synced live from Invoice & Expense taxes',
    });
  }

  const departments: DepartmentProfitLoss[] = Array.from(deptMap.entries()).map(([dept, vals], idx) => {
    const netContribution = vals.revenue - vals.expenses;
    const marginPct = vals.revenue > 0 ? Number(((netContribution / vals.revenue) * 100).toFixed(1)) : 0;
    const effRatio = vals.expenses > 0 ? `${(vals.revenue / vals.expenses).toFixed(1)}x` : vals.revenue > 0 ? '∞' : '0.0x';
    return {
      id: `dept-live-${idx + 1}`,
      department: dept,
      headcount: 1,
      revenueGenerated: Math.round(vals.revenue),
      costIncurred: Math.round(vals.expenses),
      netContribution: Math.round(netContribution),
      marginPct,
      efficiencyRatio: effRatio,
    };
  });

  return { lineItems, monthlyData: months, departments };
}
