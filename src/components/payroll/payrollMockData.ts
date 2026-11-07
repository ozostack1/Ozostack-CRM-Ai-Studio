import { INITIAL_EMPLOYEES, EmployeeMember } from '../team/teamMockData';

export type PayCycleStatus = 'Paid' | 'Processing' | 'Scheduled' | 'Draft';
export type PayrollItemStatus = 'Paid' | 'Pending' | 'On Hold';
export type PaymentMethod = 'Direct Deposit (ACH)' | 'Wire Transfer' | 'Paper Check';

export interface PayRunCycle {
  id: string;
  cycleName: string;
  payPeriod: string;
  payDate: string;
  status: PayCycleStatus;
  employeeCount: number;
  totalGross: number;
  totalNet: number;
  totalTaxes: number;
  totalBenefits: number;
  fundingAccount: string;
}

export interface EmployeePayrollRecord {
  id: string;
  employeeId: string;
  name: string;
  avatar: string;
  role: string;
  department: string;
  employmentType: string;
  annualSalary: number;
  payFrequency: 'Semi-Monthly' | 'Monthly';
  regularHours: number;
  overtimeHours: number;
  baseGross: number;
  overtimePay: number;
  bonus: number;
  reimbursement: number;
  totalGross: number;
  federalTax: number;
  stateTax: number;
  ficaTax: number;
  medicareTax: number;
  healthBenefit: number;
  retirement401k: number;
  totalDeductions: number;
  netPay: number;
  paymentMethod: PaymentMethod;
  bankAccountLast4: string;
  status: PayrollItemStatus;
  payDate: string;
  ssnMasked: string;
}

export interface ReimbursementClaim {
  id: string;
  employeeId: string;
  employeeName: string;
  avatar: string;
  department: string;
  title: string;
  category: 'Travel & Lodging' | 'Equipment & Tech' | 'Client Entertainment' | 'Wellness & Education' | 'Office Supplies';
  amount: number;
  submissionDate: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  receiptId: string;
  notes: string;
}

export interface StatutoryTaxItem {
  id: string;
  taxName: string;
  agency: string;
  type: 'Employee Withholding' | 'Employer Contribution' | 'Shared';
  rateDescription: string;
  employeeRate: number;
  employerRate: number;
  totalRemittedYTD: number;
  nextFilingDueDate: string;
  status: 'Compliant' | 'Pending Review' | 'Upcoming';
}

// Generate rich initial payroll records derived from INITIAL_EMPLOYEES
export const INITIAL_PAYROLL_RECORDS: EmployeePayrollRecord[] = INITIAL_EMPLOYEES.map((emp, idx) => {
  const isContractor = emp.employmentType === 'Contractor';
  const payFrequency = isContractor ? 'Monthly' : 'Semi-Monthly';
  const periods = payFrequency === 'Monthly' ? 12 : 24;
  
  const baseGross = Math.round(emp.salary / periods);
  const bonus = idx === 0 ? 1500 : idx === 3 ? 800 : idx === 7 ? 650 : 0;
  const reimbursement = idx === 1 ? 340 : idx === 4 ? 220 : 0;
  const overtimeHours = idx === 2 ? 6 : idx === 6 ? 4 : 0;
  const hourlyRate = Math.round(baseGross / (payFrequency === 'Monthly' ? 160 : 80));
  const overtimePay = overtimeHours * Math.round(hourlyRate * 1.5);

  const totalGross = baseGross + bonus + reimbursement + overtimePay;

  // Contractors handle their own withholdings; W-2 employees have standard statutory withholdings
  const federalTax = isContractor ? 0 : Math.round(totalGross * 0.128);
  const stateTax = isContractor ? 0 : Math.round(totalGross * 0.054);
  const ficaTax = isContractor ? 0 : Math.round(totalGross * 0.062);
  const medicareTax = isContractor ? 0 : Math.round(totalGross * 0.0145);
  const healthBenefit = isContractor ? 0 : 185;
  const retirement401k = isContractor ? 0 : Math.round(totalGross * 0.04);

  const totalDeductions = federalTax + stateTax + ficaTax + medicareTax + healthBenefit + retirement401k;
  const netPay = totalGross - totalDeductions;

  const paymentMethod: PaymentMethod = isContractor 
    ? 'Wire Transfer' 
    : idx % 5 === 0 
      ? 'Direct Deposit (ACH)' 
      : 'Direct Deposit (ACH)';

  const last4List = ['4821', '9034', '1182', '5529', '7731', '3024', '6618', '8940', '2215', '4091', '7320', '5812', '9934', '1628', '6043'];
  const ssnList = ['***-**-4912', '***-**-8219', '***-**-3341', '***-**-9018', '***-**-2481', '***-**-7712', '***-**-5109', '***-**-1928', '***-**-8834', '***-**-6029', '***-**-4192', '***-**-7553', '***-**-3820', '***-**-9201', '***-**-1490'];

  return {
    id: `pr-${emp.id}`,
    employeeId: emp.id,
    name: emp.name,
    avatar: emp.avatar,
    role: emp.role,
    department: emp.department,
    employmentType: emp.employmentType,
    annualSalary: emp.salary,
    payFrequency,
    regularHours: payFrequency === 'Monthly' ? 160 : 80,
    overtimeHours,
    baseGross,
    overtimePay,
    bonus,
    reimbursement,
    totalGross,
    federalTax,
    stateTax,
    ficaTax,
    medicareTax,
    healthBenefit,
    retirement401k,
    totalDeductions,
    netPay,
    paymentMethod,
    bankAccountLast4: last4List[idx % last4List.length],
    status: idx === 12 ? 'On Hold' : 'Pending',
    payDate: '2026-11-15',
    ssnMasked: ssnList[idx % ssnList.length],
  };
});

export const INITIAL_PAY_RUNS: PayRunCycle[] = [
  {
    id: 'cycle-2026-11-1',
    cycleName: 'November 2026 - Cycle 1',
    payPeriod: 'Nov 01, 2026 – Nov 15, 2026',
    payDate: '2026-11-15',
    status: 'Scheduled',
    employeeCount: INITIAL_PAYROLL_RECORDS.length,
    totalGross: INITIAL_PAYROLL_RECORDS.reduce((sum, r) => sum + r.totalGross, 0),
    totalNet: INITIAL_PAYROLL_RECORDS.reduce((sum, r) => sum + r.netPay, 0),
    totalTaxes: INITIAL_PAYROLL_RECORDS.reduce((sum, r) => sum + (r.federalTax + r.stateTax + r.ficaTax + r.medicareTax), 0),
    totalBenefits: INITIAL_PAYROLL_RECORDS.reduce((sum, r) => sum + (r.healthBenefit + r.retirement401k), 0),
    fundingAccount: 'Silicon Valley Bank (SVB) Operating •••• 4892',
  },
  {
    id: 'cycle-2026-10-2',
    cycleName: 'October 2026 - Cycle 2',
    payPeriod: 'Oct 16, 2026 – Oct 31, 2026',
    payDate: '2026-10-31',
    status: 'Paid',
    employeeCount: 15,
    totalGross: 89450,
    totalNet: 68910,
    totalTaxes: 14240,
    totalBenefits: 6300,
    fundingAccount: 'Silicon Valley Bank (SVB) Operating •••• 4892',
  },
  {
    id: 'cycle-2026-10-1',
    cycleName: 'October 2026 - Cycle 1',
    payPeriod: 'Oct 01, 2026 – Oct 15, 2026',
    payDate: '2026-10-15',
    status: 'Paid',
    employeeCount: 15,
    totalGross: 88900,
    totalNet: 68520,
    totalTaxes: 14120,
    totalBenefits: 6260,
    fundingAccount: 'Silicon Valley Bank (SVB) Operating •••• 4892',
  },
  {
    id: 'cycle-2026-09-2',
    cycleName: 'September 2026 - Cycle 2',
    payPeriod: 'Sep 16, 2026 – Sep 30, 2026',
    payDate: '2026-09-30',
    status: 'Paid',
    employeeCount: 14,
    totalGross: 84200,
    totalNet: 64900,
    totalTaxes: 13450,
    totalBenefits: 5850,
    fundingAccount: 'Silicon Valley Bank (SVB) Operating •••• 4892',
  },
  {
    id: 'cycle-2026-09-1',
    cycleName: 'September 2026 - Cycle 1',
    payPeriod: 'Sep 01, 2026 – Sep 15, 2026',
    payDate: '2026-09-15',
    status: 'Paid',
    employeeCount: 14,
    totalGross: 84200,
    totalNet: 64900,
    totalTaxes: 13450,
    totalBenefits: 5850,
    fundingAccount: 'Silicon Valley Bank (SVB) Operating •••• 4892',
  },
];

export const INITIAL_REIMBURSEMENT_CLAIMS: ReimbursementClaim[] = [
  {
    id: 'reimb-01',
    employeeId: 'emp-10',
    employeeName: 'Marcus Vance',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    department: 'Finance & Operations',
    title: 'AWS Certified Solutions Architect Exam & Prep Material',
    category: 'Wellness & Education',
    amount: 340.0,
    submissionDate: '2026-11-02',
    status: 'Pending',
    receiptId: 'REC-2026-9912',
    notes: 'Approved under engineering continuous learning stipend.',
  },
  {
    id: 'reimb-02',
    employeeId: 'emp-11',
    employeeName: 'Elena Rostova',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    department: 'Engineering',
    title: 'Ergonomic Standing Desk Converter & Monitor Arm',
    category: 'Equipment & Tech',
    amount: 220.0,
    submissionDate: '2026-11-03',
    status: 'Pending',
    receiptId: 'REC-2026-8841',
    notes: 'WFH remote workstation allocation claim.',
  },
  {
    id: 'reimb-03',
    employeeId: 'emp-5',
    employeeName: 'Priya Singh',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    department: 'Sales & CRM',
    title: 'Client Dinner & Q4 Contract Closing Meeting (Apex Global)',
    category: 'Client Entertainment',
    amount: 485.5,
    submissionDate: '2026-11-04',
    status: 'Pending',
    receiptId: 'REC-2026-7732',
    notes: 'Dinner with VP of Procurement at Apex Global for $140k ARR deal.',
  },
  {
    id: 'reimb-04',
    employeeId: 'emp-8',
    employeeName: 'David Chen',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
    department: 'Product & Design',
    title: 'Flight & Hotel: TechCrunch Disrupt Enterprise Demo Booth',
    category: 'Travel & Lodging',
    amount: 1120.0,
    submissionDate: '2026-10-28',
    status: 'Approved',
    receiptId: 'REC-2026-6649',
    notes: 'Pre-approved travel for customer discovery conference.',
  },
];

export const STATUTORY_TAX_ITEMS: StatutoryTaxItem[] = [
  {
    id: 'tax-fed-oasdi',
    taxName: 'Federal Social Security (FICA / OASDI)',
    agency: 'Internal Revenue Service (IRS)',
    type: 'Shared',
    rateDescription: '6.2% Employee + 6.2% Employer match (Up to wage limit)',
    employeeRate: 6.2,
    employerRate: 6.2,
    totalRemittedYTD: 118450,
    nextFilingDueDate: '2026-11-30',
    status: 'Compliant',
  },
  {
    id: 'tax-fed-medicare',
    taxName: 'Federal Medicare (Hospital Insurance)',
    agency: 'Internal Revenue Service (IRS)',
    type: 'Shared',
    rateDescription: '1.45% Employee + 1.45% Employer (No wage ceiling)',
    employeeRate: 1.45,
    employerRate: 1.45,
    totalRemittedYTD: 27720,
    nextFilingDueDate: '2026-11-30',
    status: 'Compliant',
  },
  {
    id: 'tax-fed-withholding',
    taxName: 'Federal Income Tax Withholding (FIT)',
    agency: 'Internal Revenue Service (IRS)',
    type: 'Employee Withholding',
    rateDescription: 'Variable progressive bracket based on Form W-4',
    employeeRate: 12.8,
    employerRate: 0.0,
    totalRemittedYTD: 236800,
    nextFilingDueDate: '2026-11-30',
    status: 'Compliant',
  },
  {
    id: 'tax-state-withholding',
    taxName: 'State Income Tax Withholding (SIT)',
    agency: 'State Franchise Tax Board / Employment Development',
    type: 'Employee Withholding',
    rateDescription: 'State specific withholding based on DE-4 / IT-2104',
    employeeRate: 5.4,
    employerRate: 0.0,
    totalRemittedYTD: 98400,
    nextFilingDueDate: '2026-11-30',
    status: 'Compliant',
  },
  {
    id: 'tax-state-sui',
    taxName: 'State Unemployment Insurance (SUI / SUTA)',
    agency: 'State Employment Development Dept (EDD)',
    type: 'Employer Contribution',
    rateDescription: '1.8% Employer-paid statutory experience rating',
    employeeRate: 0.0,
    employerRate: 1.8,
    totalRemittedYTD: 14250,
    nextFilingDueDate: '2026-12-15',
    status: 'Compliant',
  },
  {
    id: 'tax-fed-futa',
    taxName: 'Federal Unemployment Tax Act (FUTA)',
    agency: 'Internal Revenue Service (IRS)',
    type: 'Employer Contribution',
    rateDescription: '0.6% Effective rate after state tax credit on first $7,000',
    employeeRate: 0.0,
    employerRate: 0.6,
    totalRemittedYTD: 4890,
    nextFilingDueDate: '2026-12-31',
    status: 'Compliant',
  },
  {
    id: 'tax-401k-match',
    taxName: '401(k) Safe Harbor Employer Match',
    agency: 'Department of Labor (ERISA Compliance)',
    type: 'Employer Contribution',
    rateDescription: '100% match on first 3%, 50% match on next 2% (4% total)',
    employeeRate: 4.0,
    employerRate: 4.0,
    totalRemittedYTD: 74200,
    nextFilingDueDate: '2026-11-15',
    status: 'Compliant',
  },
];

