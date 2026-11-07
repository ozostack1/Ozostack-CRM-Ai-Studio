import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Search,
  Download,
  CreditCard,
  Building,
  CheckCircle2,
  Clock,
  AlertCircle,
  ShieldCheck,
  Calendar,
  List,
  LayoutGrid,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowDownLeft,
  ArrowUpRight,
  RotateCcw,
  RefreshCw,
  Edit3,
  Trash2,
  ChevronRight,
  ExternalLink,
  Wallet,
  Activity,
  Check,
  Send,
  Zap,
  Printer,
  ChevronDown,
  ChevronUp,
  FileText,
  Sliders,
  Sparkles,
  Users,
  Layers,
  Scale,
  BarChart3,
  X,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useSystemCurrency } from '../../data/currencyService';
import {
  INITIAL_PNL_LINE_ITEMS,
  INITIAL_MONTHLY_FINANCIALS,
  INITIAL_DEPARTMENT_PNL,
  INITIAL_FINANCIAL_SCENARIOS,
  INITIAL_PNL_ADJUSTMENTS,
} from '../../data/mockData';
import {
  PnLPeriod,
  PnLAccountingMethod,
  PnLCategoryType,
  PnLLineItem,
  MonthlyFinancialRecord,
  DepartmentProfitLoss,
  FinancialScenario,
  PnLAdjustment,
} from '../../types/crm';
import { AddAdjustmentModal } from './AddAdjustmentModal';
import { ScenarioDrawer } from './ScenarioDrawer';

const LOCAL_STORAGE_KEY = 'ozostack_profit_loss';

type HorizontalTab = 'statement' | 'trends' | 'departments' | 'scenarios';

export const ProfitLossView: React.FC = () => {
  const { theme, setActiveNav } = useTheme();
  const isLight = theme === 'white-sky';
  const { currency } = useSystemCurrency();

  // Persistence State
  const [lineItems, setLineItems] = useState<PnLLineItem[]>(() => {
    try {
      const stored = localStorage.getItem(`${LOCAL_STORAGE_KEY}_items`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse stored P&L line items', e);
    }
    return INITIAL_PNL_LINE_ITEMS;
  });

  const [monthlyData] = useState<MonthlyFinancialRecord[]>(INITIAL_MONTHLY_FINANCIALS);
  const [departments] = useState<DepartmentProfitLoss[]>(INITIAL_DEPARTMENT_PNL);

  const [scenarios, setScenarios] = useState<FinancialScenario[]>(() => {
    try {
      const stored = localStorage.getItem(`${LOCAL_STORAGE_KEY}_scenarios`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse stored scenarios', e);
    }
    return INITIAL_FINANCIAL_SCENARIOS;
  });

  const [adjustments, setAdjustments] = useState<PnLAdjustment[]>(() => {
    try {
      const stored = localStorage.getItem(`${LOCAL_STORAGE_KEY}_adjustments`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse stored adjustments', e);
    }
    return INITIAL_PNL_ADJUSTMENTS;
  });

  // Controls & Filters
  const [activeTab, setActiveTab] = useState<HorizontalTab>('statement');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedPeriod, setSelectedPeriod] = useState<PnLPeriod>('This Month');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [specificSingleDate, setSpecificSingleDate] = useState('2026-11-04');
  const [customStartDate, setCustomStartDate] = useState('2026-01-01');
  const [customEndDate, setCustomEndDate] = useState('2026-11-04');
  const [statementViewMode, setStatementViewMode] = useState<'statement' | 'debitCredit'>('statement');
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);
  const [accountingMethod, setAccountingMethod] = useState<PnLAccountingMethod>('Accrual');
  const [searchTerm, setSearchTerm] = useState('');

  const calendarRef = useRef<HTMLDivElement>(null);

  // Close calendar popover on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setIsCalendarOpen(false);
      }
    };
    if (isCalendarOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isCalendarOpen]);

  // Modals & Drawers
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [isScenarioDrawerOpen, setIsScenarioDrawerOpen] = useState(false);

  // Section Collapse State
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    revenue: true,
    cogs: true,
    opex: true,
    tax: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Instant Feedback Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_items`, JSON.stringify(lineItems));
    } catch (e) {
      console.error('Failed to save P&L items to localStorage', e);
    }
  }, [lineItems]);

  useEffect(() => {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_scenarios`, JSON.stringify(scenarios));
    } catch (e) {
      console.error('Failed to save scenarios to localStorage', e);
    }
  }, [scenarios]);

  useEffect(() => {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_adjustments`, JSON.stringify(adjustments));
    } catch (e) {
      console.error('Failed to save adjustments to localStorage', e);
    }
  }, [adjustments]);

  // Financial Calculations & Period Multipliers
  const revenueItems = useMemo(
    () => lineItems.filter((i) => i.category === 'Operating Revenue'),
    [lineItems]
  );
  const cogsItems = useMemo(
    () => lineItems.filter((i) => i.category === 'Cost of Goods Sold (COGS)'),
    [lineItems]
  );
  const opexItems = useMemo(
    () => lineItems.filter((i) => i.category === 'Operating Expenses (OpEx)'),
    [lineItems]
  );
  const taxItems = useMemo(
    () => lineItems.filter((i) => i.category === 'Tax & Depreciation'),
    [lineItems]
  );

  // Dynamic period financial aggregates computing exact Revenue, COGS, OpEx, Taxes, Net Income
  const periodAggregates = useMemo(() => {
    // 1. Current Active Month (Nov 2026)
    if (selectedPeriod === 'This Month' || selectedPeriod.includes('Nov 2026')) {
      const nov = monthlyData[10] || monthlyData[monthlyData.length - 2];
      return {
        revenue: nov.revenue,
        cogs: nov.cogs,
        opex: nov.opex,
        netProfit: nov.netProfit,
        taxes: nov.ebitda - nov.netProfit,
      };
    }

    // 2. Specific Month by name (Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const foundMonthIdx = monthNames.findIndex((m) => {
      const regex = new RegExp(`\\b${m}\\b`, 'i');
      return (
        regex.test(selectedPeriod) &&
        !selectedPeriod.includes(' to ') &&
        !selectedPeriod.includes(' - ') &&
        !selectedPeriod.includes('Q')
      );
    });

    if (foundMonthIdx >= 0 && monthlyData[foundMonthIdx]) {
      const m = monthlyData[foundMonthIdx];
      return {
        revenue: m.revenue,
        cogs: m.cogs,
        opex: m.opex,
        netProfit: m.netProfit,
        taxes: m.ebitda - m.netProfit,
      };
    }

    // 3. Quarters: Q1, Q2, Q3, Q4
    if (selectedPeriod.includes('Q1')) {
      const q = monthlyData.slice(0, 3);
      return {
        revenue: q.reduce((acc, m) => acc + m.revenue, 0),
        cogs: q.reduce((acc, m) => acc + m.cogs, 0),
        opex: q.reduce((acc, m) => acc + m.opex, 0),
        netProfit: q.reduce((acc, m) => acc + m.netProfit, 0),
        taxes: q.reduce((acc, m) => acc + (m.ebitda - m.netProfit), 0),
      };
    }
    if (selectedPeriod.includes('Q2')) {
      const q = monthlyData.slice(3, 6);
      return {
        revenue: q.reduce((acc, m) => acc + m.revenue, 0),
        cogs: q.reduce((acc, m) => acc + m.cogs, 0),
        opex: q.reduce((acc, m) => acc + m.opex, 0),
        netProfit: q.reduce((acc, m) => acc + m.netProfit, 0),
        taxes: q.reduce((acc, m) => acc + (m.ebitda - m.netProfit), 0),
      };
    }
    if (selectedPeriod.includes('Q3')) {
      const q = monthlyData.slice(6, 9);
      return {
        revenue: q.reduce((acc, m) => acc + m.revenue, 0),
        cogs: q.reduce((acc, m) => acc + m.cogs, 0),
        opex: q.reduce((acc, m) => acc + m.opex, 0),
        netProfit: q.reduce((acc, m) => acc + m.netProfit, 0),
        taxes: q.reduce((acc, m) => acc + (m.ebitda - m.netProfit), 0),
      };
    }
    if (selectedPeriod.includes('Q4')) {
      const q = monthlyData.slice(9, 12);
      return {
        revenue: q.reduce((acc, m) => acc + m.revenue, 0),
        cogs: q.reduce((acc, m) => acc + m.cogs, 0),
        opex: q.reduce((acc, m) => acc + m.opex, 0),
        netProfit: q.reduce((acc, m) => acc + m.netProfit, 0),
        taxes: q.reduce((acc, m) => acc + (m.ebitda - m.netProfit), 0),
      };
    }

    // 4. YTD: Jan through Nov (11 completed/active months)
    if (selectedPeriod.includes('YTD')) {
      const ytd = monthlyData.slice(0, 11);
      return {
        revenue: ytd.reduce((acc, m) => acc + m.revenue, 0),
        cogs: ytd.reduce((acc, m) => acc + m.cogs, 0),
        opex: ytd.reduce((acc, m) => acc + m.opex, 0),
        netProfit: ytd.reduce((acc, m) => acc + m.netProfit, 0),
        taxes: ytd.reduce((acc, m) => acc + (m.ebitda - m.netProfit), 0),
      };
    }

    // 5. Full Year 2025:
    if (selectedPeriod.includes('Full Year 2025') || selectedPeriod.includes('2025')) {
      const ratio = 0.82;
      return {
        revenue: Math.round(monthlyData.reduce((acc, m) => acc + m.revenue, 0) * ratio),
        cogs: Math.round(monthlyData.reduce((acc, m) => acc + m.cogs, 0) * ratio),
        opex: Math.round(monthlyData.reduce((acc, m) => acc + m.opex, 0) * ratio),
        netProfit: Math.round(monthlyData.reduce((acc, m) => acc + m.netProfit, 0) * ratio),
        taxes: Math.round(monthlyData.reduce((acc, m) => acc + (m.ebitda - m.netProfit), 0) * ratio),
      };
    }

    // 6. Full Year 2026 / Projected:
    if (selectedPeriod.includes('Projected') || selectedPeriod.includes('Full Year 2026') || selectedPeriod === '2026') {
      return {
        revenue: monthlyData.reduce((acc, m) => acc + m.revenue, 0),
        cogs: monthlyData.reduce((acc, m) => acc + m.cogs, 0),
        opex: monthlyData.reduce((acc, m) => acc + m.opex, 0),
        netProfit: monthlyData.reduce((acc, m) => acc + m.netProfit, 0),
        taxes: monthlyData.reduce((acc, m) => acc + (m.ebitda - m.netProfit), 0),
      };
    }

    // 7. Custom Date Range or Exact Single Date: 'YYYY-MM-DD to YYYY-MM-DD' or 'YYYY-MM-DD'
    const dateRangeMatch = selectedPeriod.match(/(\d{4}-\d{2}-\d{2})(?:\s+(?:to|-)\s+(\d{4}-\d{2}-\d{2}))?/);
    if (dateRangeMatch) {
      const startDateStr = dateRangeMatch[1];
      const endDateStr = dateRangeMatch[2] || startDateStr;
      const d1 = new Date(startDateStr);
      const d2 = new Date(endDateStr);

      if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
        let totalRev = 0,
          totalCogs = 0,
          totalOpex = 0,
          totalNet = 0,
          totalTax = 0;
        const year = d1.getFullYear();

        for (let m = 0; m < 12; m++) {
          const mStart = new Date(year, m, 1);
          const mEnd = new Date(year, m + 1, 0);
          const daysInMonth = mEnd.getDate();

          const overlapStart = Math.max(d1.getTime(), mStart.getTime());
          const overlapEnd = Math.min(d2.getTime() + 86400000 - 1, mEnd.getTime() + 86400000 - 1);

          if (overlapStart <= overlapEnd) {
            const overlapDays = Math.max(1, Math.round((overlapEnd - overlapStart) / 86400000));
            const weight = overlapDays / daysInMonth;
            const record = monthlyData[m] || monthlyData[10];

            totalRev += record.revenue * weight;
            totalCogs += record.cogs * weight;
            totalOpex += record.opex * weight;
            totalNet += record.netProfit * weight;
            totalTax += (record.ebitda - record.netProfit) * weight;
          }
        }

        if (totalRev > 0) {
          return {
            revenue: Math.round(totalRev),
            cogs: Math.round(totalCogs),
            opex: Math.round(totalOpex),
            netProfit: Math.round(totalNet),
            taxes: Math.round(totalTax),
          };
        }
      }
    }

    // Default Fallback: Current Month (Nov 2026)
    const def = monthlyData[10] || monthlyData[0];
    return {
      revenue: def.revenue,
      cogs: def.cogs,
      opex: def.opex,
      netProfit: def.netProfit,
      taxes: def.ebitda - def.netProfit,
    };
  }, [selectedPeriod, monthlyData]);

  // Baseline category totals from unscaled lineItems
  const baseRevenue = 615000;
  const baseCogs = 132500;
  const baseOpex = 284260;
  const baseTaxes = 43883;

  const revenueFactor = periodAggregates.revenue / baseRevenue;
  const cogsFactor = periodAggregates.cogs / baseCogs;
  const opexFactor = periodAggregates.opex / baseOpex;
  const taxFactor = periodAggregates.taxes / baseTaxes;

  // Default standard period presets for the active fiscal year (2026)
  const defaultPeriods = useMemo(
    () => [
      'This Month',
      `Q4 ${selectedYear}`,
      `YTD ${selectedYear}`,
      `Full Year ${selectedYear - 1}`,
      `${selectedYear} Projected`,
    ],
    [selectedYear]
  );

  // Scaling helper ensuring mathematical consistency between individual rows and section subtotals
  const getScaledItem = (item: PnLLineItem) => {
    const methodFactor =
      accountingMethod === 'Cash'
        ? item.category === 'Operating Revenue'
          ? 0.92
          : item.category === 'Operating Expenses (OpEx)'
          ? 0.95
          : item.category === 'Tax & Depreciation'
          ? 0.65
          : 1
        : 1;

    const catFactor =
      item.category === 'Operating Revenue'
        ? revenueFactor
        : item.category === 'Cost of Goods Sold (COGS)'
        ? cogsFactor
        : item.category === 'Operating Expenses (OpEx)'
        ? opexFactor
        : taxFactor;

    const actual = Math.round(item.actualAmount * catFactor * methodFactor);
    const budget = Math.round(item.budgetAmount * catFactor * methodFactor);
    const prior = Math.round(item.priorPeriodAmount * catFactor * methodFactor);
    const variance = actual - budget;
    const variancePct = budget > 0 ? ((variance / budget) * 100).toFixed(1) : '0.0';

    return {
      actual,
      budget,
      prior,
      variance,
      variancePct,
    };
  };

  const totalRevenue = useMemo(
    () => revenueItems.reduce((acc, it) => acc + getScaledItem(it).actual, 0),
    [revenueItems, selectedPeriod, accountingMethod, revenueFactor]
  );
  const totalBudgetRevenue = useMemo(
    () => revenueItems.reduce((acc, it) => acc + getScaledItem(it).budget, 0),
    [revenueItems, selectedPeriod, accountingMethod, revenueFactor]
  );
  const totalPriorRevenue = useMemo(
    () => revenueItems.reduce((acc, it) => acc + getScaledItem(it).prior, 0),
    [revenueItems, selectedPeriod, accountingMethod, revenueFactor]
  );
  const totalCogs = useMemo(
    () => cogsItems.reduce((acc, it) => acc + getScaledItem(it).actual, 0),
    [cogsItems, selectedPeriod, accountingMethod, cogsFactor]
  );
  const totalOpex = useMemo(
    () => opexItems.reduce((acc, it) => acc + getScaledItem(it).actual, 0),
    [opexItems, selectedPeriod, accountingMethod, opexFactor]
  );
  const totalTaxes = useMemo(
    () => taxItems.reduce((acc, it) => acc + getScaledItem(it).actual, 0),
    [taxItems, selectedPeriod, accountingMethod, taxFactor]
  );

  const grossProfit = totalRevenue - totalCogs;
  const grossMarginPct = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : '0.0';

  const ebitda = grossProfit - totalOpex;
  const ebitdaMarginPct = totalRevenue > 0 ? ((ebitda / totalRevenue) * 100).toFixed(1) : '0.0';

  const netIncome = ebitda - totalTaxes;
  const netMarginPct = totalRevenue > 0 ? ((netIncome / totalRevenue) * 100).toFixed(1) : '0.0';

  // Double-Entry General Ledger Balance (Credits = Revenue, Debits = Outflows)
  const totalCredits = totalRevenue;
  const totalDebits = totalCogs + totalOpex + totalTaxes;
  const netCreditBalance = totalCredits - totalDebits;
  const isSurplus = netCreditBalance >= 0;
  const drCrCoverageRatio = totalDebits > 0 ? (totalCredits / totalDebits).toFixed(2) : '1.00';

  const revenueVariancePct =
    totalBudgetRevenue > 0
      ? (((totalRevenue - totalBudgetRevenue) / totalBudgetRevenue) * 100).toFixed(1)
      : '0.0';

  // Handle Adjustment Save
  const handleSaveAdjustment = (adj: PnLAdjustment) => {
    setAdjustments((prev) => [adj, ...prev]);

    // Apply adjustment effect to corresponding line item if matching
    setLineItems((prev) =>
      prev.map((item) => {
        if (adj.accountName.includes(item.accountCode)) {
          const delta = adj.type === 'Credit' ? adj.amount : -adj.amount;
          return {
            ...item,
            actualAmount: Math.max(0, item.actualAmount + delta),
          };
        }
        return item;
      })
    );

    showToast(`Journal adjustment ${adj.reference} successfully posted to ledger`);
  };

  // Handle Scenario Save & Delete
  const handleSaveScenario = (scen: FinancialScenario) => {
    setScenarios((prev) => [scen, ...prev]);
    showToast(`Scenario "${scen.name}" successfully created`);
  };

  const handleDeleteScenario = (id: string) => {
    setScenarios((prev) => prev.filter((s) => s.id !== id));
    showToast('Scenario removed');
  };

  const handleDeleteAdjustment = (id: string) => {
    setAdjustments((prev) => prev.filter((a) => a.id !== id));
    showToast('Journal adjustment reversed / deleted');
  };

  // Export Financial Model CSV
  const handleExportCsv = () => {
    const headers = [
      'Account Code',
      'Category',
      'Line Item Description',
      `Actual (${currency.symbol})`,
      `Budget (${currency.symbol})`,
      `Variance (${currency.symbol})`,
      'Variance (%)',
      `Prior Period (${currency.symbol})`,
      'Notes',
    ];

    const rows = lineItems.map((item) => {
      const scaled = getScaledItem(item);
      return [
        item.accountCode,
        `"${item.category}"`,
        `"${item.name.replace(/"/g, '""')}"`,
        scaled.actual.toFixed(2),
        scaled.budget.toFixed(2),
        scaled.variance.toFixed(2),
        `${scaled.variancePct}%`,
        scaled.prior.toFixed(2),
        `"${(item.notes || '').replace(/"/g, '""')}"`,
      ];
    });

    rows.push([
      'SUBTOTAL',
      'Operating Revenue',
      'Total Topline Revenue',
      totalRevenue.toFixed(2),
      totalBudgetRevenue.toFixed(2),
      (totalRevenue - totalBudgetRevenue).toFixed(2),
      `${revenueVariancePct}%`,
      '',
      '',
    ]);

    rows.push([
      'SUBTOTAL',
      'Cost of Goods Sold',
      'Total COGS',
      totalCogs.toFixed(2),
      '',
      '',
      '',
      '',
      '',
    ]);

    rows.push([
      'METRIC',
      'Gross Profit',
      `Gross Profit (${grossMarginPct}% Margin)`,
      grossProfit.toFixed(2),
      '',
      '',
      '',
      '',
      '',
    ]);

    rows.push([
      'SUBTOTAL',
      'Operating Expenses',
      'Total Operating Expenses',
      totalOpex.toFixed(2),
      '',
      '',
      '',
      '',
      '',
    ]);

    rows.push([
      'METRIC',
      'EBITDA',
      `Operating Profit / EBITDA (${ebitdaMarginPct}% Margin)`,
      ebitda.toFixed(2),
      '',
      '',
      '',
      '',
      '',
    ]);

    rows.push([
      'BOTTOM LINE',
      'Net Profit',
      `Net Profit After Tax (${netMarginPct}% Margin)`,
      netIncome.toFixed(2),
      '',
      '',
      '',
      '',
      '',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Ozostack_Profit_and_Loss_${selectedPeriod.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Formal A4 Single-Page Income Statement
  const handlePrintIncomeStatement = () => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    const statementHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Corporate Income Statement - OZOSTACK TECHNOLOGIES INC.</title>
  <style>
    @page { size: auto; margin: 8mm 10mm; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; line-height: 1.35; font-size: 11px; }
    .container { max-width: 780px; margin: 0 auto; padding: 12px 14px; page-break-inside: avoid; }
    .header { border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: flex-start; }
    .title { font-size: 20px; font-weight: 900; color: #0f172a; }
    .badge { display: inline-block; background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; border-radius: 9999px; padding: 2px 10px; font-size: 9.5px; font-weight: bold; text-transform: uppercase; margin-top: 4px; }
    .table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
    .table th { text-align: left; padding: 6px 8px; font-size: 9.5px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #cbd5e1; background: #f8fafc; }
    .table td { padding: 5px 8px; font-size: 10.5px; border-bottom: 1px solid #f1f5f9; }
    .section-row { background: #f0f9ff; font-weight: 800; color: #0369a1; }
    .subtotal-row { font-weight: bold; background: #fafafa; border-top: 1px solid #cbd5e1; border-bottom: 2px solid #94a3b8; }
    .highlight-row { background: #e0f2fe; font-weight: 900; font-size: 11.5px; color: #0369a1; }
    .bottomline-row { background: #f0fdf4; font-weight: 900; font-size: 12.5px; color: #15803d; border-top: 2px solid #16a34a; border-bottom: 3px double #16a34a; }
    .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 18px; padding-top: 10px; border-top: 1px dashed #cbd5e1; font-size: 10px; page-break-inside: avoid; }
    .sig-line { border-top: 1px solid #0f172a; margin-top: 22px; padding-top: 4px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <div class="title">OZOSTACK TECHNOLOGIES INC.</div>
        <div style="font-size: 10px; color: #64748b;">OFFICIAL CONDENSED CONSOLIDATED STATEMENT OF OPERATIONS (P&L)</div>
        <div class="badge">GAAP & IFRS COMPLIANT • ${accountingMethod.toUpperCase()} BASIS</div>
      </div>
      <div style="text-align: right;">
        <div style="font-family: monospace; font-size: 12px; font-weight: bold; color: #0284c7;">PERIOD: ${selectedPeriod.toUpperCase()}</div>
        <div style="font-size: 10px; color: #64748b; margin-top: 2px;">Tax ID: US-EIN 84-2910481</div>
        <div style="font-size: 9.5px; color: #94a3b8; margin-top: 2px;">As of: ${new Date().toISOString().split('T')[0]}</div>
      </div>
    </div>

    <table class="table">
      <thead>
        <tr>
          <th>Code</th>
          <th>Financial Account & Line Description</th>
          <th style="text-align: right;">Actual (${currency.symbol})</th>
          <th style="text-align: right;">Budget (${currency.symbol})</th>
          <th style="text-align: right;">Prior (${currency.symbol})</th>
          <th style="text-align: right;">% Rev</th>
        </tr>
      </thead>
      <tbody>
        <tr class="section-row"><td colspan="6">1. OPERATING REVENUE</td></tr>
        ${revenueItems
          .map((r) => {
            const s = getScaledItem(r);
            const pct = totalRevenue > 0 ? ((s.actual / totalRevenue) * 100).toFixed(1) : '0.0';
            return `<tr>
          <td style="font-family: monospace; color: #64748b;">${r.accountCode}</td>
          <td>${r.name}</td>
          <td style="text-align: right; font-weight: 600;">${currency.symbol}${s.actual.toLocaleString()}</td>
          <td style="text-align: right; color: #64748b;">${currency.symbol}${s.budget.toLocaleString()}</td>
          <td style="text-align: right; color: #94a3b8;">${currency.symbol}${s.prior.toLocaleString()}</td>
          <td style="text-align: right; font-family: monospace;">${pct}%</td>
        </tr>`;
          })
          .join('')}
        <tr class="subtotal-row">
          <td colspan="2">TOTAL OPERATING REVENUE</td>
          <td style="text-align: right;">${currency.symbol}${Math.round(totalRevenue).toLocaleString()}</td>
          <td style="text-align: right;">${currency.symbol}${Math.round(totalBudgetRevenue).toLocaleString()}</td>
          <td colspan="2" style="text-align: right; color: #059669; font-weight: bold;">+${revenueVariancePct}% vs budget</td>
        </tr>

        <tr class="section-row"><td colspan="6">2. COST OF GOODS SOLD (COGS)</td></tr>
        ${cogsItems
          .map((c) => {
            const s = getScaledItem(c);
            const pct = totalRevenue > 0 ? ((s.actual / totalRevenue) * 100).toFixed(1) : '0.0';
            return `<tr>
          <td style="font-family: monospace; color: #64748b;">${c.accountCode}</td>
          <td>${c.name}</td>
          <td style="text-align: right; font-weight: 600;">${currency.symbol}${s.actual.toLocaleString()}</td>
          <td style="text-align: right; color: #64748b;">${currency.symbol}${s.budget.toLocaleString()}</td>
          <td style="text-align: right; color: #94a3b8;">${currency.symbol}${s.prior.toLocaleString()}</td>
          <td style="text-align: right; font-family: monospace;">${pct}%</td>
        </tr>`;
          })
          .join('')}
        <tr class="subtotal-row">
          <td colspan="2">TOTAL COST OF GOODS SOLD</td>
          <td style="text-align: right;">${currency.symbol}${Math.round(totalCogs).toLocaleString()}</td>
          <td colspan="3" style="text-align: right; color: #64748b;">${((totalCogs / totalRevenue) * 100).toFixed(1)}% of Revenue</td>
        </tr>

        <tr class="highlight-row">
          <td colspan="2">GROSS PROFIT</td>
          <td style="text-align: right;">${currency.symbol}${Math.round(grossProfit).toLocaleString()}</td>
          <td colspan="3" style="text-align: right;">GROSS MARGIN: ${grossMarginPct}%</td>
        </tr>

        <tr class="section-row"><td colspan="6">3. OPERATING EXPENSES (OPEX)</td></tr>
        ${opexItems
          .map((o) => {
            const s = getScaledItem(o);
            const pct = totalRevenue > 0 ? ((s.actual / totalRevenue) * 100).toFixed(1) : '0.0';
            return `<tr>
          <td style="font-family: monospace; color: #64748b;">${o.accountCode}</td>
          <td>${o.name}</td>
          <td style="text-align: right; font-weight: 600;">${currency.symbol}${s.actual.toLocaleString()}</td>
          <td style="text-align: right; color: #64748b;">${currency.symbol}${s.budget.toLocaleString()}</td>
          <td style="text-align: right; color: #94a3b8;">${currency.symbol}${s.prior.toLocaleString()}</td>
          <td style="text-align: right; font-family: monospace;">${pct}%</td>
        </tr>`;
          })
          .join('')}
        <tr class="subtotal-row">
          <td colspan="2">TOTAL OPERATING EXPENSES</td>
          <td style="text-align: right;">${currency.symbol}${Math.round(totalOpex).toLocaleString()}</td>
          <td colspan="3" style="text-align: right; color: #64748b;">${((totalOpex / totalRevenue) * 100).toFixed(1)}% of Revenue</td>
        </tr>

        <tr class="highlight-row">
          <td colspan="2">OPERATING PROFIT / EBITDA</td>
          <td style="text-align: right;">${currency.symbol}${Math.round(ebitda).toLocaleString()}</td>
          <td colspan="3" style="text-align: right;">EBITDA MARGIN: ${ebitdaMarginPct}%</td>
        </tr>

        <tr class="subtotal-row">
          <td colspan="2">PROVISION FOR INCOME TAXES & AMORTIZATION</td>
          <td style="text-align: right;">${currency.symbol}${Math.round(totalTaxes).toLocaleString()}</td>
          <td colspan="3" style="text-align: right; color: #64748b;">Estimated Statutory Tax Accrual</td>
        </tr>

        <tr class="bottomline-row">
          <td colspan="2">NET INCOME (AFTER TAXES)</td>
          <td style="text-align: right;">${currency.symbol}${Math.round(netIncome).toLocaleString()}</td>
          <td colspan="3" style="text-align: right;">NET PROFIT MARGIN: ${netMarginPct}%</td>
        </tr>
      </tbody>
    </table>

    <div class="signatures">
      <div>
        <div>Prepared by: <strong>Rizwan Khan (Chief Financial Officer)</strong></div>
        <div class="sig-line">Certified Financial Controller Signoff</div>
      </div>
      <div>
        <div>Executive Approval: <strong>Sayed (CEO / Managing Director)</strong></div>
        <div class="sig-line">Board of Directors Executive Audit Signoff</div>
      </div>
    </div>
  </div>
</body>
</html>`;

    doc.open();
    doc.write(statementHtml);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1000);
    }, 250);
  };

  const cardBg = isLight
    ? 'bg-white border-sky-100/90 shadow-xs'
    : 'bg-[#0f172a]/90 border-slate-800/80';

  // DEBIT & CREDIT (Dr. vs Cr.) LEDGER BALANCE COMPONENT
  const renderDebitCreditSection = () => {
    const maxVal = Math.max(
      ...monthlyData.map((m) => Math.max(m.revenue, m.cogs + m.opex)),
      100000
    );

    return (
      <div className="space-y-4 animate-in fade-in duration-150">
        {/* Ledger Balance KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Total Credits */}
          <div className={`p-4 rounded-2xl border ${cardBg} space-y-1`}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Total Credits (Cr.)
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                +Inflows (Revenue)
              </span>
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-white">
              {currency.symbol}{totalCredits.toLocaleString('en-US')}
            </div>
            <p className="text-[10.5px] text-slate-400">
              Account codes 4000–4099 • Operating Revenue & Retainers
            </p>
          </div>

          {/* Total Debits */}
          <div className={`p-4 rounded-2xl border ${cardBg} space-y-1`}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Total Debits (Dr.)
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400">
                -Outflows (Costs)
              </span>
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-white">
              {currency.symbol}{totalDebits.toLocaleString('en-US')}
            </div>
            <p className="text-[10.5px] text-slate-400">
              COGS: {currency.symbol}{totalCogs.toLocaleString()} • OpEx: {currency.symbol}{totalOpex.toLocaleString()} • Tax: {currency.symbol}{totalTaxes.toLocaleString()}
            </p>
          </div>

          {/* Net Credit Balance */}
          <div className={`p-4 rounded-2xl border ${cardBg} space-y-1`}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Net Ledger Balance
              </span>
              <span
                className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                  isSurplus
                    ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400'
                    : 'bg-rose-500/15 text-rose-600'
                }`}
              >
                {isSurplus ? 'Operating Surplus' : 'Operating Deficit'}
              </span>
            </div>
            <div
              className={`text-xl font-black ${
                isSurplus ? 'text-sky-600 dark:text-sky-400' : 'text-rose-600'
              }`}
            >
              {isSurplus ? '+' : '-'}{currency.symbol}{Math.abs(netCreditBalance).toLocaleString('en-US')}
            </div>
            <p className="text-[10.5px] text-slate-400">
              Net Margin: {netMarginPct}% • Retained Earnings Growth
            </p>
          </div>

          {/* Dr / Cr Coverage & Audit */}
          <div className={`p-4 rounded-2xl border ${cardBg} space-y-1`}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Double-Entry Verification
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/15 text-emerald-600">
                {drCrCoverageRatio}x Coverage
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-base font-bold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span>General Ledger Balanced</span>
            </div>
            <p className="text-[10.5px] text-slate-400 font-mono">
              Debits + Net Income = Credits (100% Audit Match)
            </p>
          </div>
        </div>

        {/* 12-Month Interactive Debit vs. Credit Dual Bar Chart */}
        <div className={`p-5 rounded-2xl border ${cardBg} space-y-4`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Scale className="w-4 h-4 text-sky-500" />
                <span>{selectedYear} Fiscal Year: Debit (Dr.) vs. Credit (Cr.) Timeline</span>
              </h3>
              <p className="text-xs text-slate-400">
                Monthly comparison of Revenue Inflows (Credits) vs. Operating Outflows (Debits)
              </p>
            </div>

            {/* Chart Legend */}
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-500 inline-block" />
                <span className="font-semibold text-slate-700 dark:text-slate-300">Credits (Cr. Revenue)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-rose-500 inline-block" />
                <span className="font-semibold text-slate-700 dark:text-slate-300">Debits (Dr. Costs)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block" />
                <span className="font-semibold text-sky-600 dark:text-sky-400">Net Surplus</span>
              </div>
            </div>
          </div>

          {/* SVG Visual Dual Bar Chart */}
          <div className="relative pt-2">
            <svg
              viewBox="0 0 840 220"
              className="w-full h-56 select-none overflow-visible"
              preserveAspectRatio="none"
            >
              {/* Horizontal Gridlines */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
                const y = 175 - pct * 145;
                const val = Math.round(pct * maxVal);
                return (
                  <g key={pct}>
                    <line
                      x1="40"
                      y1={y}
                      x2="830"
                      y2={y}
                      stroke={isLight ? '#f1f5f9' : '#1e293b'}
                      strokeDasharray="4 4"
                    />
                    <text
                      x="35"
                      y={y + 3}
                      textAnchor="end"
                      fontSize="9"
                      fill={isLight ? '#94a3b8' : '#64748b'}
                      fontFamily="monospace"
                    >
                      {currency.symbol}{Math.round(val / 1000)}k
                    </text>
                  </g>
                );
              })}

              {/* 12 Months Dual Bars */}
              {monthlyData.map((m, idx) => {
                const slotWidth = (830 - 50) / 12;
                const slotX = 50 + idx * slotWidth;
                const creditH = Math.max(4, (m.revenue / maxVal) * 145);
                const debitVal = m.cogs + m.opex;
                const debitH = Math.max(4, (debitVal / maxVal) * 145);
                const netH = Math.max(2, (m.netProfit / maxVal) * 145);
                const isHovered = hoveredMonth === idx;

                const creditY = 175 - creditH;
                const debitY = 175 - debitH;
                const netY = 175 - netH;

                const isSelectedMonth =
                  selectedPeriod === m.month ||
                  (selectedPeriod === 'This Month' && idx === 10) ||
                  (selectedPeriod.startsWith(m.month.slice(0, 3)) && !selectedPeriod.includes(' to '));

                return (
                  <g
                    key={m.month}
                    className="cursor-pointer transition-opacity"
                    onMouseEnter={() => setHoveredMonth(idx)}
                    onMouseLeave={() => setHoveredMonth(null)}
                    onClick={() => {
                      setSelectedPeriod(m.month);
                      showToast(`Selected ${m.month}`);
                    }}
                  >
                    {/* Active Selected Month Column Highlight */}
                    {isSelectedMonth && (
                      <rect
                        x={slotX - 2}
                        y="15"
                        width={slotWidth + 4}
                        height="165"
                        fill="#0284c7"
                        opacity={0.12}
                        stroke="#0284c7"
                        strokeWidth="1.5"
                        rx="6"
                      />
                    )}

                    {/* Hover Highlight Column */}
                    {isHovered && !isSelectedMonth && (
                      <rect
                        x={slotX - 2}
                        y="15"
                        width={slotWidth + 4}
                        height="165"
                        fill={isLight ? '#e0f2fe' : '#0369a1'}
                        opacity={0.15}
                        rx="6"
                      />
                    )}

                    {/* Credit Bar (Emerald) */}
                    <rect
                      x={slotX + 4}
                      y={creditY}
                      width="16"
                      height={creditH}
                      fill={isHovered || isSelectedMonth ? '#059669' : '#10b981'}
                      rx="3"
                    />

                    {/* Debit Bar (Rose) */}
                    <rect
                      x={slotX + 22}
                      y={debitY}
                      width="16"
                      height={debitH}
                      fill={isHovered || isSelectedMonth ? '#e11d48' : '#f43f5e'}
                      rx="3"
                    />

                    {/* Net Surplus Marker */}
                    <circle
                      cx={slotX + 21}
                      cy={netY}
                      r={isHovered || isSelectedMonth ? 5 : 3.5}
                      fill="#0284c7"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />

                    {/* Month Label */}
                    <text
                      x={slotX + 21}
                      y="195"
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight={isSelectedMonth ? '800' : isHovered ? '700' : '500'}
                      fill={isSelectedMonth ? '#0284c7' : isHovered ? '#0284c7' : isLight ? '#64748b' : '#94a3b8'}
                    >
                      {m.month.split(' ')[0]}
                    </text>
                    {isSelectedMonth && (
                      <text
                        x={slotX + 21}
                        y="207"
                        textAnchor="middle"
                        fontSize="7"
                        fontWeight="800"
                        fill="#0284c7"
                      >
                        ACTIVE
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Hover Tooltip Box */}
            {hoveredMonth !== null && monthlyData[hoveredMonth] && (
              <div
                className={`p-3 rounded-xl border shadow-xl flex items-center justify-between text-xs animate-in fade-in duration-100 ${
                  isLight ? 'bg-white border-sky-200' : 'bg-slate-800 border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {monthlyData[hoveredMonth].month}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-emerald-600 font-bold">
                    Cr (Revenue): {currency.symbol}{monthlyData[hoveredMonth].revenue.toLocaleString()}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-rose-600 font-bold">
                    Dr (Outflows): {currency.symbol}{(monthlyData[hoveredMonth].cogs + monthlyData[hoveredMonth].opex).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-sky-600 dark:text-sky-400">
                    Net Surplus: +{currency.symbol}{monthlyData[hoveredMonth].netProfit.toLocaleString()}
                  </span>
                  <span className="font-mono text-[11px] text-slate-400">
                    Margin: {monthlyData[hoveredMonth].netMarginPct}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Double-Entry Account Breakdown: Credits vs. Debits */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Credit Accounts (Inflows) */}
          <div className={`p-4 rounded-2xl border ${cardBg} space-y-3`}>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  Credit Accounts (Income Inflow)
                </h4>
              </div>
              <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                {currency.symbol}{totalCredits.toLocaleString('en-US')}
              </span>
            </div>

            <div className="space-y-2">
              {revenueItems.map((item) => {
                const s = getScaledItem(item);
                const pct = totalCredits > 0 ? ((s.actual / totalCredits) * 100).toFixed(1) : '0';
                return (
                  <div key={item.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10.5px] font-bold text-sky-600">{item.accountCode}</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{item.name}</span>
                      </div>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        +{currency.symbol}{s.actual.toLocaleString('en-US')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="font-mono shrink-0">{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Debit Accounts (Costs & Outflows) */}
          <div className={`p-4 rounded-2xl border ${cardBg} space-y-3`}>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  Debit Accounts (Cost Outflow)
                </h4>
              </div>
              <span className="font-mono font-bold text-xs text-rose-600 dark:text-rose-400">
                {currency.symbol}{totalDebits.toLocaleString('en-US')}
              </span>
            </div>

            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {[...cogsItems, ...opexItems, ...taxItems].map((item) => {
                const s = getScaledItem(item);
                const pct = totalDebits > 0 ? ((s.actual / totalDebits) * 100).toFixed(1) : '0';
                return (
                  <div key={item.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10.5px] font-bold text-rose-500">{item.accountCode}</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                          {item.name}
                        </span>
                      </div>
                      <span className="font-bold text-rose-600 dark:text-rose-400">
                        -{currency.symbol}{s.actual.toLocaleString('en-US')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                        <div className="bg-rose-500 h-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="font-mono shrink-0">{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white border border-slate-700 shadow-2xl text-xs font-semibold animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner Navigation & Executive Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl border bg-gradient-to-r from-sky-500/10 via-sky-400/5 to-transparent border-sky-200/60 dark:border-sky-500/20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveNav('Dashboard')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-sky-700 dark:text-sky-300 bg-white dark:bg-slate-800 border border-sky-200 dark:border-slate-700 shadow-xs hover:bg-sky-50 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>CEO Command Center</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-slate-800 dark:text-white">
                Corporate Profit & Loss (P&L) Statement
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-emerald-500 text-white uppercase tracking-wider">
                GAAP Audited
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Topline revenue recognition, infrastructure COGS, OpEx breakdown, and EBITDA profitability
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Accounting Method Toggle */}
          <div
            className={`flex items-center p-0.5 rounded-xl border text-xs font-bold ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-800 border-slate-700'
            }`}
          >
            <button
              onClick={() => {
                setAccountingMethod('Accrual');
                showToast('Switched to Accrual Accounting (ASC 606)');
              }}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                accountingMethod === 'Accrual'
                  ? 'bg-sky-500 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Accrual
            </button>
            <button
              onClick={() => {
                setAccountingMethod('Cash');
                showToast('Switched to Cash Basis');
              }}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                accountingMethod === 'Cash'
                  ? 'bg-sky-500 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Cash Basis
            </button>
          </div>

          <button
            onClick={handlePrintIncomeStatement}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors ${
              isLight
                ? 'border-slate-200 text-slate-700 bg-white hover:bg-slate-50'
                : 'border-slate-700 text-slate-200 bg-slate-800 hover:bg-slate-750'
            }`}
            title="Print Official Statement"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Print Statement</span>
          </button>

          <button
            onClick={handleExportCsv}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors ${
              isLight
                ? 'border-slate-200 text-slate-700 bg-white hover:bg-slate-50'
                : 'border-slate-700 text-slate-200 bg-slate-800 hover:bg-slate-750'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsAdjustmentModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-sky-500 hover:bg-sky-600 text-white shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Adjustment</span>
          </button>
        </div>
      </div>

      {/* 4 Top Dynamic Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1: Operating Revenue */}
        <div className={`p-4 rounded-2xl border ${cardBg}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Operating Revenue
            </span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {currency.symbol}{Math.round(totalRevenue).toLocaleString('en-US')}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>▲ +{revenueVariancePct}% vs plan target</span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {currency.symbol}{Math.round(totalBudgetRevenue).toLocaleString('en-US')} budgeted ({selectedPeriod})
          </span>
        </div>

        {/* Metric 2: Cost of Goods Sold */}
        <div className={`p-4 rounded-2xl border ${cardBg}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Cost of Goods Sold (COGS)
            </span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {currency.symbol}{Math.round(totalCogs).toLocaleString('en-US')}
          </div>
          <div className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 mt-1">
            {((totalCogs / totalRevenue) * 100).toFixed(1)}% COGS to revenue ratio
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            NVIDIA H100 GPU clusters, VPC storage & API tokens
          </span>
        </div>

        {/* Metric 3: Gross Profit & Margin */}
        <div className={`p-4 rounded-2xl border ${cardBg}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Gross Profit & Margin
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {currency.symbol}{Math.round(grossProfit).toLocaleString('en-US')}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
            <span>{grossMarginPct}% Gross Margin</span>
            <span className="text-[10px] text-slate-400">(Top-decile SaaS)</span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            Industry benchmark target: 75% - 80%
          </span>
        </div>

        {/* Metric 4: Operating Income / EBITDA */}
        <div className={`p-4 rounded-2xl border ${cardBg}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Operating Profit (EBITDA)
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
            {currency.symbol}{Math.round(ebitda).toLocaleString('en-US')}
          </div>
          <div className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 mt-1">
            {ebitdaMarginPct}% EBITDA margin | Net: {currency.symbol}{Math.round(netIncome).toLocaleString('en-US')}
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            After OpEx & {currency.symbol}35.6k tax provisioning
          </span>
        </div>
      </div>

      {/* Horizontal Navigation & Period Selector Bar (Overflow-Visible to allow floating calendar popover) */}
      <div
        className={`p-1.5 rounded-2xl border flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-2.5 ${cardBg} relative z-30 overflow-visible`}
      >
        {/* Navigation Tabs (Scrollable horizontally on smaller screens without clipping dropdowns) */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
          <button
            onClick={() => setActiveTab('statement')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'statement'
                ? 'bg-sky-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Income Statement (P&L)</span>
          </button>

          <button
            onClick={() => setActiveTab('trends')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'trends'
                ? 'bg-sky-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Monthly Trends & Margins (12 Mo)</span>
          </button>

          <button
            onClick={() => setActiveTab('departments')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'departments'
                ? 'bg-sky-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Departmental P&L ({departments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('scenarios')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'scenarios'
                ? 'bg-sky-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Scenario Forecasts ({scenarios.length})</span>
          </button>
        </div>

        {/* Period Selector Pills & Fiscal Calendar Popover */}
        <div
          ref={calendarRef}
          className="relative flex items-center gap-1.5 shrink-0 flex-wrap overflow-visible"
        >
          {defaultPeriods.map((period) => (
            <button
              key={period}
              onClick={() => {
                setSelectedPeriod(period);
                showToast(`Reporting Period: ${period}`);
              }}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                selectedPeriod === period
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {period}
            </button>
          ))}

          {/* Custom period badge if active selection is outside default presets */}
          {!defaultPeriods.includes(selectedPeriod) && (
            <div className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-sky-500 text-white shadow-xs">
              <span>{selectedPeriod}</span>
              <button
                onClick={() => setSelectedPeriod('This Month')}
                className="hover:text-sky-200 transition-colors"
                title="Reset to This Month"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Calendar & Year Selector Popover Trigger */}
          <div className="relative">
            <button
              onClick={() => setIsCalendarOpen(!isCalendarOpen)}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg border transition-all ${
                isCalendarOpen
                  ? 'bg-sky-500 text-white border-sky-500 shadow-xs'
                  : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
              <span>Calendar & Years</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${isCalendarOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Calendar Popover (Fully unclipped with elevated shadow & high z-index) */}
            {isCalendarOpen && (
              <div
                className={`absolute right-0 top-full mt-2 w-84 sm:w-96 p-4 rounded-2xl shadow-2xl border z-50 ${
                  isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                }`}
                style={{ filter: 'drop-shadow(0 20px 25px rgba(0, 0, 0, 0.25))' }}
              >
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-sky-500" />
                    <span className="font-bold text-xs">Fiscal Calendar & Period Selector</span>
                  </div>
                  <button
                    onClick={() => setIsCalendarOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Fiscal Year Selector */}
                <div className="mb-3">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1.5">
                    Select Fiscal Year
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[2024, 2025, 2026, 2027].map((yr) => (
                      <button
                        key={yr}
                        onClick={() => {
                          setSelectedYear(yr);
                          setSelectedPeriod(`Full Year ${yr}`);
                          showToast(`Fiscal Year set to ${yr}`);
                        }}
                        className={`py-1.5 text-xs font-bold rounded-lg border transition-all ${
                          selectedYear === yr
                            ? 'bg-sky-500 text-white border-sky-500 shadow-xs'
                            : 'border-slate-200 dark:border-slate-700 hover:border-sky-400 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {yr}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quarters for Selected Year */}
                <div className="mb-3">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1.5">
                    {selectedYear} Quarters
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { id: `Q1 ${selectedYear}`, label: 'Q1', sub: 'Jan-Mar' },
                      { id: `Q2 ${selectedYear}`, label: 'Q2', sub: 'Apr-Jun' },
                      { id: `Q3 ${selectedYear}`, label: 'Q3', sub: 'Jul-Sep' },
                      { id: `Q4 ${selectedYear}`, label: 'Q4', sub: 'Oct-Dec' },
                    ].map((q) => (
                      <button
                        key={q.id}
                        onClick={() => {
                          setSelectedPeriod(q.id);
                          setIsCalendarOpen(false);
                          showToast(`Selected ${q.id} (${q.sub})`);
                        }}
                        className={`py-1.5 px-2 rounded-lg text-center border transition-all ${
                          selectedPeriod === q.id
                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white font-bold'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-400 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        <div className="text-xs font-bold">{q.label}</div>
                        <div className="text-[9px] opacity-70">{q.sub}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Monthly Selector Grid for Selected Year */}
                <div className="mb-3">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1.5">
                    {selectedYear} Monthly Ledger ({selectedYear === 2026 ? 'Nov Active' : 'All Months'})
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                    {[
                      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
                    ].map((mo, idx) => {
                      const periodKey = `${mo} ${selectedYear}`;
                      const isCurrentMonth = selectedYear === 2026 && idx === 10; // Nov 2026
                      const isFuture = selectedYear === 2026 && idx > 10;
                      return (
                        <button
                          key={mo}
                          onClick={() => {
                            setSelectedPeriod(periodKey);
                            setIsCalendarOpen(false);
                            showToast(`Selected ${periodKey}${isCurrentMonth ? ' (Current Active Month)' : ''}`);
                          }}
                          className={`py-1 px-1.5 rounded-lg text-xs font-semibold border transition-all ${
                            selectedPeriod === periodKey
                              ? 'bg-sky-500 text-white border-sky-500'
                              : isCurrentMonth
                              ? 'border-sky-400 text-sky-600 dark:text-sky-400 font-bold bg-sky-50/50 dark:bg-sky-950/30'
                              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {mo}
                          {isCurrentMonth && <span className="ml-1 text-[9px] text-sky-500 font-black">•</span>}
                          {isFuture && <span className="ml-1 text-[9px] opacity-50">Proj</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Pick Exact Single Date OR Custom Date Range */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
                      Pick Exact Specific Date
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="date"
                        value={specificSingleDate}
                        onChange={(e) => setSpecificSingleDate(e.target.value)}
                        className={`flex-1 text-xs p-1.5 rounded-lg border outline-none ${
                          isLight
                            ? 'bg-slate-50 border-slate-200 text-slate-800 focus:border-sky-500'
                            : 'bg-slate-800 border-slate-700 text-white focus:border-sky-400'
                        }`}
                      />
                      <button
                        onClick={() => {
                          if (!specificSingleDate) {
                            showToast('Please select a date');
                            return;
                          }
                          setSelectedPeriod(specificSingleDate);
                          setIsCalendarOpen(false);
                          showToast(`Selected Date: ${specificSingleDate}`);
                        }}
                        className="py-1.5 px-3 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-lg shadow-xs transition-colors shrink-0"
                      >
                        Select Date
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
                      Or Custom Range (From — To)
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 mb-1.5">
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className={`w-full text-xs p-1.5 rounded-lg border outline-none ${
                          isLight
                            ? 'bg-slate-50 border-slate-200 text-slate-800 focus:border-sky-500'
                            : 'bg-slate-800 border-slate-700 text-white focus:border-sky-400'
                        }`}
                      />
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className={`w-full text-xs p-1.5 rounded-lg border outline-none ${
                          isLight
                            ? 'bg-slate-50 border-slate-200 text-slate-800 focus:border-sky-500'
                            : 'bg-slate-800 border-slate-700 text-white focus:border-sky-400'
                        }`}
                      />
                    </div>
                    <button
                      onClick={() => {
                        if (!customStartDate || !customEndDate) {
                          showToast('Please select both start and end dates');
                          return;
                        }
                        if (new Date(customStartDate) > new Date(customEndDate)) {
                          showToast('Start date cannot be after end date');
                          return;
                        }
                        const rangeLabel = `${customStartDate} to ${customEndDate}`;
                        setSelectedPeriod(rangeLabel);
                        setIsCalendarOpen(false);
                        showToast(`Custom Range: ${rangeLabel}`);
                      }}
                      className="w-full py-1.5 px-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-lg shadow-xs hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
                    >
                      Apply Range
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TAB 1: EXECUTIVE INCOME STATEMENT (GAAP MULTI-STEP) */}
      {activeTab === 'statement' && (
        <div className={`rounded-2xl border overflow-hidden ${cardBg}`}>
          {/* Statement Search & Controls */}
          <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search account code or line description..."
                  className={`w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border outline-none ${
                    isLight
                      ? 'bg-sky-50/40 border-sky-200 text-slate-800 focus:border-sky-500'
                      : 'bg-slate-900 border-slate-700 text-white focus:border-sky-400'
                  }`}
                />
              </div>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-xs text-rose-500 hover:underline font-bold"
                >
                  Clear Filter
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Statement View Mode Toggle */}
              <div className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setStatementViewMode('statement')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                    statementViewMode === 'statement'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-sky-500" />
                  <span>Statement</span>
                </button>
                <button
                  onClick={() => setStatementViewMode('debitCredit')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                    statementViewMode === 'debitCredit'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Debit vs Credit Chart</span>
                </button>
              </div>

              <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                <span className="font-mono text-[11px]">Reporting Basis:</span>
                <span className="font-bold text-sky-600 dark:text-sky-400">{accountingMethod}</span>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <span className="font-mono text-[11px]">Period:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedPeriod}</span>
              </div>
            </div>
          </div>

          {statementViewMode === 'debitCredit' ? (
            <div className="p-4">
              {renderDebitCreditSection()}
            </div>
          ) : (
            <>
              {/* Double-Entry General Ledger Equilibrium Bar */}
              <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                    Balanced Ledger
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    Double-Entry Equilibrium:
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    Credits (Cr.) <span className="text-emerald-600 dark:text-emerald-400">{currency.symbol}{Math.round(totalCredits).toLocaleString()}</span>
                    {' = '}
                    Debits (Dr.) <span className="text-rose-600 dark:text-rose-400">{currency.symbol}{Math.round(totalDebits).toLocaleString()}</span>
                    {' + '}
                    Retained Earnings <span className="text-sky-600 dark:text-sky-400">{currency.symbol}{Math.round(netCreditBalance).toLocaleString()}</span>
                  </span>
                </div>
                <button
                  onClick={() => setStatementViewMode('debitCredit')}
                  className="text-xs text-sky-600 dark:text-sky-400 font-bold hover:underline flex items-center gap-1"
                >
                  <span>Interactive Dr./Cr. Chart</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[850px]">
              <thead>
                <tr
                  className={`border-b text-[10px] font-bold uppercase tracking-wider text-slate-400 ${
                    isLight ? 'bg-slate-50/75 border-slate-100' : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
                  <th className="py-3 px-4 w-28">Account</th>
                  <th className="py-3 px-4">Line Item & Description</th>
                  <th className="py-3 px-4 text-right">Actual ({currency.symbol})</th>
                  <th className="py-3 px-4 text-right">Budget ({currency.symbol})</th>
                  <th className="py-3 px-4 text-right">Prior ({currency.symbol})</th>
                  <th className="py-3 px-4 text-right">Variance</th>
                  <th className="py-3 px-4 text-right">% of Rev</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
                {/* 1. Operating Revenue Header */}
                <tr
                  onClick={() => toggleSection('revenue')}
                  className="cursor-pointer bg-sky-50/50 dark:bg-sky-950/20 font-bold text-sky-900 dark:text-sky-200 hover:bg-sky-50 dark:hover:bg-sky-950/30 transition-colors"
                >
                  <td colSpan={7} className="py-2.5 px-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {expandedSections.revenue ? (
                          <ChevronUp className="w-4 h-4 text-sky-600" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-sky-600" />
                        )}
                        <span>1. OPERATING REVENUE ({revenueItems.length} streams)</span>
                      </div>
                      <span className="font-mono text-xs font-black">
                        {currency.symbol}{Math.round(totalRevenue).toLocaleString()}
                      </span>
                    </div>
                  </td>
                </tr>

                {expandedSections.revenue &&
                  revenueItems
                    .filter(
                      (it) =>
                        !searchTerm.trim() ||
                        it.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        it.accountCode.includes(searchTerm)
                    )
                    .map((item) => {
                      const s = getScaledItem(item);
                      const revPct = totalRevenue > 0 ? ((s.actual / totalRevenue) * 100).toFixed(1) : '0.0';
                      return (
                        <tr
                          key={item.id}
                          className={`transition-colors ${isLight ? 'hover:bg-slate-50/60' : 'hover:bg-slate-800/40'}`}
                        >
                          <td className="py-2.5 px-4 font-mono text-[11px] font-bold text-sky-600 dark:text-sky-400">
                            {item.accountCode}
                          </td>
                          <td className="py-2.5 px-4">
                            <span className="font-semibold text-slate-900 dark:text-white block">
                              {item.name}
                            </span>
                            {item.notes && (
                              <span className="text-[10px] text-slate-400 block truncate max-w-sm">
                                {item.notes}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-right font-bold text-slate-900 dark:text-white">
                            {currency.symbol}{s.actual.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-4 text-right text-slate-500 font-mono">
                            {currency.symbol}{s.budget.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-4 text-right text-slate-400 font-mono">
                            {currency.symbol}{s.prior.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <span
                              className={`inline-flex items-center gap-0.5 font-semibold text-[11px] ${
                                s.variance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
                              }`}
                            >
                              {s.variance >= 0 ? `+${s.variancePct}%` : `${s.variancePct}%`}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono text-slate-500">
                            {revPct}%
                          </td>
                        </tr>
                      );
                    })}

                {/* Subtotal Revenue */}
                <tr className="bg-slate-50/80 dark:bg-slate-900 font-bold border-t-2 border-slate-200 dark:border-slate-700">
                  <td colSpan={2} className="py-2.5 px-4 text-slate-800 dark:text-slate-200">
                    TOTAL OPERATING REVENUE
                  </td>
                  <td className="py-2.5 px-4 text-right text-slate-900 dark:text-white font-black text-sm">
                    {currency.symbol}{Math.round(totalRevenue).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-slate-500">
                    {currency.symbol}{Math.round(totalBudgetRevenue).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-slate-400">
                    {currency.symbol}{Math.round(totalPriorRevenue).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-4 text-right text-emerald-600 font-bold">
                    +{revenueVariancePct}%
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold">100.0%</td>
                </tr>

                {/* 2. COGS Header */}
                <tr
                  onClick={() => toggleSection('cogs')}
                  className="cursor-pointer bg-slate-100/60 dark:bg-slate-800/60 font-bold text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <td colSpan={7} className="py-2.5 px-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {expandedSections.cogs ? (
                          <ChevronUp className="w-4 h-4 text-slate-500" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-500" />
                        )}
                        <span>2. COST OF GOODS SOLD (COGS) ({cogsItems.length} cost centers)</span>
                      </div>
                      <span className="font-mono text-xs font-black">
                        {currency.symbol}{Math.round(totalCogs).toLocaleString()}
                      </span>
                    </div>
                  </td>
                </tr>

                {expandedSections.cogs &&
                  cogsItems
                    .filter(
                      (it) =>
                        !searchTerm.trim() ||
                        it.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        it.accountCode.includes(searchTerm)
                    )
                    .map((item) => {
                      const s = getScaledItem(item);
                      const revPct = totalRevenue > 0 ? ((s.actual / totalRevenue) * 100).toFixed(1) : '0.0';
                      return (
                        <tr
                          key={item.id}
                          className={`transition-colors ${isLight ? 'hover:bg-slate-50/60' : 'hover:bg-slate-800/40'}`}
                        >
                          <td className="py-2.5 px-4 font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                            {item.accountCode}
                          </td>
                          <td className="py-2.5 px-4">
                            <span className="font-semibold text-slate-900 dark:text-white block">
                              {item.name}
                            </span>
                            {item.notes && (
                              <span className="text-[10px] text-slate-400 block truncate max-w-sm">
                                {item.notes}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-right font-bold text-slate-900 dark:text-white">
                            {currency.symbol}{s.actual.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-4 text-right text-slate-500 font-mono">
                            {currency.symbol}{s.budget.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-4 text-right text-slate-400 font-mono">
                            {currency.symbol}{s.prior.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-4 text-right font-semibold text-slate-600 dark:text-slate-300">
                            {s.actual <= s.budget ? (
                              <span className="text-emerald-600">On Budget</span>
                            ) : (
                              <span className="text-amber-600">Over Budget</span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono text-slate-500">
                            {revPct}%
                          </td>
                        </tr>
                      );
                    })}

                {/* Subtotal COGS */}
                <tr className="bg-slate-50/80 dark:bg-slate-900 font-bold border-t-2 border-slate-200 dark:border-slate-700">
                  <td colSpan={2} className="py-2.5 px-4 text-slate-800 dark:text-slate-200">
                    TOTAL COST OF GOODS SOLD
                  </td>
                  <td className="py-2.5 px-4 text-right text-slate-900 dark:text-white font-black text-sm">
                    {currency.symbol}{Math.round(totalCogs).toLocaleString()}
                  </td>
                  <td colSpan={3} className="py-2.5 px-4 text-right text-slate-400 text-[11px]">
                    Direct AI Compute & Rail Overheads
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold">
                    {((totalCogs / totalRevenue) * 100).toFixed(1)}%
                  </td>
                </tr>

                {/* GROSS PROFIT HIGHLIGHT ROW */}
                <tr className="bg-emerald-500/15 dark:bg-emerald-950/40 border-y-2 border-emerald-500/40 font-black">
                  <td colSpan={2} className="py-3 px-4 text-emerald-800 dark:text-emerald-300 text-sm">
                    GROSS PROFIT & GROSS MARGIN
                  </td>
                  <td className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400 font-black text-base">
                    {currency.symbol}{Math.round(grossProfit).toLocaleString()}
                  </td>
                  <td colSpan={3} className="py-3 px-4 text-right text-emerald-700 dark:text-emerald-300 text-xs">
                    Target Benchmark: 75-80%
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400 font-black text-sm">
                    {grossMarginPct}%
                  </td>
                </tr>

                {/* 3. OpEx Header */}
                <tr
                  onClick={() => toggleSection('opex')}
                  className="cursor-pointer bg-slate-100/60 dark:bg-slate-800/60 font-bold text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <td colSpan={7} className="py-2.5 px-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {expandedSections.opex ? (
                          <ChevronUp className="w-4 h-4 text-slate-500" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-500" />
                        )}
                        <span>3. OPERATING EXPENSES (OPEX) ({opexItems.length} functional areas)</span>
                      </div>
                      <span className="font-mono text-xs font-black">
                        {currency.symbol}{Math.round(totalOpex).toLocaleString()}
                      </span>
                    </div>
                  </td>
                </tr>

                {expandedSections.opex &&
                  opexItems
                    .filter(
                      (it) =>
                        !searchTerm.trim() ||
                        it.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        it.accountCode.includes(searchTerm)
                    )
                    .map((item) => {
                      const s = getScaledItem(item);
                      const revPct = totalRevenue > 0 ? ((s.actual / totalRevenue) * 100).toFixed(1) : '0.0';
                      return (
                        <tr
                          key={item.id}
                          className={`transition-colors ${isLight ? 'hover:bg-slate-50/60' : 'hover:bg-slate-800/40'}`}
                        >
                          <td className="py-2.5 px-4 font-mono text-[11px] font-bold text-purple-600 dark:text-purple-400">
                            {item.accountCode}
                          </td>
                          <td className="py-2.5 px-4">
                            <span className="font-semibold text-slate-900 dark:text-white block">
                              {item.name}
                            </span>
                            {item.notes && (
                              <span className="text-[10px] text-slate-400 block truncate max-w-sm">
                                {item.notes}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-right font-bold text-slate-900 dark:text-white">
                            {currency.symbol}{s.actual.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-4 text-right text-slate-500 font-mono">
                            {currency.symbol}{s.budget.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-4 text-right text-slate-400 font-mono">
                            {currency.symbol}{s.prior.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-4 text-right font-semibold text-slate-600 dark:text-slate-300">
                            {s.actual <= s.budget ? (
                              <span className="text-emerald-600">Within Budget</span>
                            ) : (
                              <span className="text-amber-600">Variance Alert</span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono text-slate-500">
                            {revPct}%
                          </td>
                        </tr>
                      );
                    })}

                {/* Subtotal OpEx */}
                <tr className="bg-slate-50/80 dark:bg-slate-900 font-bold border-t-2 border-slate-200 dark:border-slate-700">
                  <td colSpan={2} className="py-2.5 px-4 text-slate-800 dark:text-slate-200">
                    TOTAL OPERATING EXPENSES
                  </td>
                  <td className="py-2.5 px-4 text-right text-slate-900 dark:text-white font-black text-sm">
                    {currency.symbol}{Math.round(totalOpex).toLocaleString()}
                  </td>
                  <td colSpan={3} className="py-2.5 px-4 text-right text-slate-400 text-[11px]">
                    Payroll, Sales Acquisition, G&A & Compliance
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold">
                    {((totalOpex / totalRevenue) * 100).toFixed(1)}%
                  </td>
                </tr>

                {/* OPERATING PROFIT / EBITDA ROW */}
                <tr className="bg-sky-500/15 dark:bg-sky-950/40 border-y-2 border-sky-500/40 font-black">
                  <td colSpan={2} className="py-3 px-4 text-sky-900 dark:text-sky-200 text-sm">
                    OPERATING PROFIT (EBITDA)
                  </td>
                  <td className="py-3 px-4 text-right text-sky-600 dark:text-sky-400 font-black text-base">
                    {currency.symbol}{Math.round(ebitda).toLocaleString()}
                  </td>
                  <td colSpan={3} className="py-3 px-4 text-right text-sky-700 dark:text-sky-300 text-xs">
                    Operating Margin
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-sky-600 dark:text-sky-400 font-black text-sm">
                    {ebitdaMarginPct}%
                  </td>
                </tr>

                {/* Tax & Amortization Subtotal */}
                <tr className="bg-slate-50/60 dark:bg-slate-900/40 font-medium">
                  <td colSpan={2} className="py-2 px-4 text-slate-600 dark:text-slate-400">
                    Provision for Corporate Income Taxes (18%) & Asset Depreciation
                  </td>
                  <td className="py-2 px-4 text-right text-slate-800 dark:text-slate-200 font-bold">
                    -{currency.symbol}{Math.round(totalTaxes).toLocaleString()}
                  </td>
                  <td colSpan={4} className="py-2 px-4 text-right text-slate-400 text-[10.5px]">
                    Statutory Tax Provision & Hardware Depreciation
                  </td>
                </tr>

                {/* FINAL BOTTOM LINE: NET INCOME */}
                <tr className="bg-emerald-50 dark:bg-emerald-950/30 border-t-2 border-emerald-500 font-black">
                  <td colSpan={2} className="py-3.5 px-4 text-emerald-900 dark:text-emerald-200 text-sm">
                    NET INCOME AFTER TAXES (BOTTOM LINE)
                  </td>
                  <td className="py-3.5 px-4 text-right text-emerald-600 dark:text-emerald-400 font-black text-lg">
                    {currency.symbol}{Math.round(netIncome).toLocaleString()}
                  </td>
                  <td colSpan={3} className="py-3.5 px-4 text-right text-emerald-700 dark:text-emerald-300 text-xs">
                    Retained Corporate Earnings
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400 font-black text-base">
                    {netMarginPct}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          </>
          )}
        </div>
      )}

      {/* TAB 2: MONTHLY TRENDS & MARGIN PROGRESSION */}
      {activeTab === 'trends' && (
        <div className="space-y-4">
          {/* Visual Debit & Credit Chart & Ledger Verification */}
          {renderDebitCreditSection()}

          <div className={`p-4 rounded-2xl border ${cardBg}`}>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-1">
              2026 Trajectory: Monthly Revenue, OpEx & Margin Progression
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Historical month-by-month financial actuals and forward projections
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                <thead>
                  <tr
                    className={`border-b text-[10px] font-bold uppercase tracking-wider text-slate-400 ${
                      isLight ? 'bg-slate-50/75 border-slate-100' : 'bg-slate-900/60 border-slate-800'
                    }`}
                  >
                    <th className="py-2.5 px-3">Fiscal Month</th>
                    <th className="py-2.5 px-3 text-right">Revenue</th>
                    <th className="py-2.5 px-3 text-right">COGS</th>
                    <th className="py-2.5 px-3 text-right">Gross Profit</th>
                    <th className="py-2.5 px-3 text-right">Gross Margin</th>
                    <th className="py-2.5 px-3 text-right">OpEx</th>
                    <th className="py-2.5 px-3 text-right">Net Profit</th>
                    <th className="py-2.5 px-4">Margin Profile</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {monthlyData.map((m) => {
                    const isSelected =
                      selectedPeriod === m.month ||
                      (selectedPeriod === 'This Month' && m.monthIndex === 11) ||
                      (selectedPeriod.startsWith(m.month.slice(0, 3)) && !selectedPeriod.includes(' to '));

                    return (
                      <tr
                        key={m.month}
                        onClick={() => {
                          setSelectedPeriod(m.month);
                          showToast(`Selected ${m.month}`);
                        }}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-sky-50 dark:bg-sky-950/40 font-bold'
                            : isLight
                            ? 'hover:bg-sky-50/30'
                            : 'hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />}
                          <span>{m.month}</span>
                        </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-slate-900 dark:text-white">
                        {currency.symbol}{m.revenue.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-500">
                        {currency.symbol}{m.cogs.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {currency.symbol}{m.grossProfit.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">
                        {m.grossMarginPct}%
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-500">
                        {currency.symbol}{m.opex.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-sky-600 dark:text-sky-400">
                        {currency.symbol}{m.netProfit.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden flex">
                          <div
                            className="bg-emerald-500 h-full"
                            style={{ width: `${m.grossMarginPct}%` }}
                            title={`Gross: ${m.grossMarginPct}%`}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DEPARTMENTAL P&L & EFFICIENCY */}
      {activeTab === 'departments' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {departments.map((dept) => (
              <div key={dept.id} className={`p-5 rounded-2xl border space-y-3 ${cardBg}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {dept.headcount} Team Members
                  </span>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                      dept.netContribution >= 0
                        ? 'bg-emerald-500/15 text-emerald-600'
                        : 'bg-purple-500/15 text-purple-600'
                    }`}
                  >
                    {dept.marginPct > 0 ? `${dept.marginPct}% Margin` : 'Support Center'}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {dept.department}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    Efficiency: {dept.efficiencyRatio}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Revenue Attribution:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {currency.symbol}{dept.revenueGenerated.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Operating Cost:</span>
                    <span className="text-slate-600 dark:text-slate-300">
                      {currency.symbol}{dept.costIncurred.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-sky-600 dark:text-sky-400">Net Contribution:</span>
                    <span
                      className={`font-black ${
                        dept.netContribution >= 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {currency.symbol}{dept.netContribution.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: SCENARIOS & FINANCIAL PROJECTIONS */}
      {activeTab === 'scenarios' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-2xl border bg-gradient-to-r from-sky-500/10 via-sky-400/5 to-transparent border-sky-200/60 dark:border-sky-500/20">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Forward Financial Models & Strategic Scenarios
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Stress-test revenue expansion, headcount acceleration, and enterprise GPU cost savings
              </p>
            </div>
            <button
              onClick={() => setIsScenarioDrawerOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-sky-500 hover:bg-sky-600 text-white shadow-xs transition-colors"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Launch Scenario Modeler</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {scenarios.map((scen) => (
              <div key={scen.id} className={`p-5 rounded-2xl border space-y-3 ${cardBg}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-purple-600 dark:text-purple-400">
                    {scen.createdAt}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/15 text-emerald-600">
                      +{scen.revenueGrowthRate}% Growth
                    </span>
                    <button
                      onClick={() => handleDeleteScenario(scen.id)}
                      className="p-1 text-slate-400 hover:text-rose-500 rounded-md transition-colors"
                      title="Delete Scenario"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {scen.name}
                </h4>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Projected Topline:</span>
                    <span className="font-black text-slate-900 dark:text-white">
                      {currency.symbol}{scen.projectedRevenue.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Projected Net Income:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {currency.symbol}{scen.projectedNetIncome.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Estimated Runway:</span>
                    <span className="font-bold text-sky-600 dark:text-sky-400">
                      {scen.projectedRunwayMonths >= 99 ? 'Cashflow +' : `${scen.projectedRunwayMonths} Mo`}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Audit Adjustments History */}
          <div className={`p-4 rounded-2xl border ${cardBg} space-y-3`}>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Recent Journal Audit Adjustments ({adjustments.length})
                </h4>
                <p className="text-[11px] text-slate-500">
                  Reconciliation adjustments posted directly into GAAP reporting balance
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr
                    className={`border-b text-[10px] font-bold uppercase tracking-wider text-slate-400 ${
                      isLight ? 'bg-slate-50/75 border-slate-100' : 'bg-slate-900/60 border-slate-800'
                    }`}
                  >
                    <th className="py-2.5 px-3">Reference</th>
                    <th className="py-2.5 px-3">Account Code & Name</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3">Posting Date</th>
                    <th className="py-2.5 px-3">Reconciliation Memo</th>
                    <th className="py-2.5 px-3">Signoff</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {adjustments.map((adj) => (
                    <tr key={adj.id}>
                      <td className="py-2.5 px-3 font-mono font-bold text-sky-600 dark:text-sky-400">
                        {adj.reference}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">
                        {adj.accountName}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                            adj.type === 'Credit'
                              ? 'bg-emerald-500/15 text-emerald-600'
                              : 'bg-rose-500/15 text-rose-600'
                          }`}
                        >
                          {adj.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white">
                        {currency.symbol}{adj.amount.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 font-mono">{adj.date}</td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 text-[11px] max-w-xs truncate">
                        {adj.memo}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                        {adj.approvedBy}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => handleDeleteAdjustment(adj.id)}
                          className="p-1 text-slate-400 hover:text-rose-500 rounded-md transition-colors"
                          title="Reverse / Remove Adjustment"
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
        </div>
      )}

      {/* Record Adjustment Modal */}
      <AddAdjustmentModal
        isOpen={isAdjustmentModalOpen}
        onClose={() => setIsAdjustmentModalOpen(false)}
        onSave={handleSaveAdjustment}
      />

      {/* Interactive Scenario Modeler Drawer */}
      <ScenarioDrawer
        isOpen={isScenarioDrawerOpen}
        onClose={() => setIsScenarioDrawerOpen(false)}
        baseRevenue={totalRevenue}
        baseCogs={totalCogs}
        baseOpex={totalOpex}
        periodName={selectedPeriod}
        onSaveScenario={handleSaveScenario}
      />
    </div>
  );
};

