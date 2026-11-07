export interface KpiMetric {
  id: string;
  label: string;
  value: string;
  change: string;
  isPositive: boolean;
  sublabel?: string;
  trend?: number[];
  iconName?: string;
}

export interface FunnelStage {
  label: string;
  count: number;
  percentage: string;
  value?: string;
  color: string;
}

export interface DonutSlice {
  name: string;
  value: number;
  percentage: number;
  color: string;
  count?: number;
  amount?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  avatar: string;
  tasksDone: string;
  productivity: number;
}

export type DealStage =
  | 'Discovery'
  | 'Proposal Sent'
  | 'Negotiation'
  | 'Contract Sent'
  | 'Won'
  | 'Lost'
  | (string & {});

export type DealPriority = 'High' | 'Medium' | 'Low';

export interface Deal {
  id: string;
  dealName: string;
  company: string;
  client?: string;
  project?: string;
  value: number;
  valueFormatted: string;
  formattedValue?: string;
  stage: DealStage;
  status?: 'Active' | 'Pending' | 'Completed' | 'Stalled';
  closeDate: string;
  date?: string;
  owner: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactWhatsApp?: string;
  probability?: number;
  priority?: DealPriority;
  serviceCategory?: string;
  notes?: string;
  createdAt?: string;
  customFields?: Record<string, string | number>;
}

export interface OverdueTask {
  id: string;
  taskName: string;
  project: string;
  assignee: string;
  dueDate: string;
  priority: 'High' | 'Medium' | 'Low';
}

export type FollowUpType = 'Call' | 'WhatsApp' | 'Email' | 'Meeting';
export type FollowUpStatus = 'Scheduled' | 'Overdue' | 'Completed' | 'Cancelled';
export type FollowUpPriority = 'High' | 'Medium' | 'Low';

export interface FollowUp {
  id: string;
  contact: string;
  company: string;
  nextFollowUp: string;
  type: FollowUpType;
  owner: string;
  contactEmail?: string;
  contactPhone?: string;
  dealName?: string;
  dealValue?: number;
  scheduledDate?: string;
  scheduledTime?: string;
  priority?: FollowUpPriority;
  status?: FollowUpStatus;
  notes?: string;
  outcome?: string;
  completedAt?: string;
  createdAt?: string;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export type TaxCalculationMode = 'exclusive' | 'inclusive' | 'none';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  client: string;
  clientEmail?: string;
  clientAddress?: string;
  clientTaxId?: string;
  amount: string;
  amountNumeric?: number;
  status: 'Paid' | 'Pending' | 'Overdue' | 'Draft';
  issueDate?: string;
  dueDate?: string;
  lineItems?: InvoiceLineItem[];
  subtotal?: number;
  taxMode?: TaxCalculationMode;
  taxName?: string;
  taxRate?: number;
  taxAmount?: number;
  discountAmount?: number;
  totalAmount?: number;
  paymentMethod?: string;
  notes?: string;
  terms?: string;
  createdAt?: string;
}

export interface ProposalDocument {
  id: string;
  proposalNumber: string;
  title: string;
  client: string;
  clientEmail?: string;
  clientAddress?: string;
  scope: string;
  status: 'Draft' | 'Sent' | 'Approved' | 'Declined';
  value: number;
  valueFormatted: string;
  issueDate: string;
  validUntil: string;
  deliverables: string[];
  lineItems?: InvoiceLineItem[];
  subtotal?: number;
  taxMode?: TaxCalculationMode;
  taxName?: string;
  taxRate?: number;
  taxAmount?: number;
  terms?: string;
  notes?: string;
  createdAt?: string;
}

export interface QuotationDocument {
  id: string;
  quotationNumber: string;
  title: string;
  client: string;
  clientEmail?: string;
  clientAddress?: string;
  status: 'Draft' | 'Sent' | 'Accepted' | 'Expired';
  lineItems: InvoiceLineItem[];
  subtotal: number;
  taxMode?: TaxCalculationMode;
  taxName?: string;
  taxRate: number;
  taxAmount: number;
  discountAmount?: number;
  totalAmount: number;
  totalFormatted: string;
  issueDate: string;
  validUntil: string;
  notes?: string;
  terms?: string;
  createdAt?: string;
}

export interface ContractDocument {
  id: string;
  contractNumber: string;
  title: string;
  client: string;
  clientSigner?: string;
  companySigner?: string;
  status: 'Draft' | 'Pending Signature' | 'Active' | 'Completed' | 'Terminated';
  startDate: string;
  endDate: string;
  contractValue: number;
  contractValueFormatted: string;
  billingCadence: 'Monthly' | 'Quarterly' | 'Milestone-Based' | 'Lump Sum';
  clauses: string[];
  scopeSummary: string;
  notes?: string;
  terms?: string;
  createdAt?: string;
}

export interface InvoiceBranding {
  companyName: string;
  companyAddress: string;
  companyEmail: string;
  companyPhone: string;
  companyTaxId: string;
  logoUrl: string;
  bankDetails: string;
  accentColor: string;
}

export type DocTemplateId = 'modern' | 'corporate' | 'minimal' | 'creative';
export type PaperSize = 'a4' | 'letter';

export type CalendarEventType =
  | 'Meeting'
  | 'Client Demo'
  | 'Call'
  | 'Sprint Review'
  | 'Milestone Deadline'
  | 'Architecture Workshop'
  | 'Onboarding';

export type CalendarEventStatus = 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
export type CalendarEventPriority = 'High' | 'Medium' | 'Low';

export interface CalendarEvent {
  id: string;
  time: string;
  title: string;
  company: string;
  type: CalendarEventType | string;
  date: string; // ISO date 'YYYY-MM-DD'
  startTime?: string;
  endTime?: string;
  status?: CalendarEventStatus;
  priority?: CalendarEventPriority;
  description?: string;
  attendees?: string[];
  project?: string;
  location?: string;
  meetingUrl?: string;
  color?: string;
  // Unified Follow-up integration fields
  source?: 'event' | 'follow_up';
  contact?: string;
  contactPhone?: string;
  contactEmail?: string;
  dealName?: string;
  dealValue?: number;
  owner?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  subtitle: string;
  timeAgo: string;
  type: 'lead' | 'payment' | 'deadline' | 'followup' | 'review' | 'invoice' | 'event' | 'task';
  read: boolean;
  targetNav?: string;
  targetId?: string;
  recipient?: string;
  owner?: string | string[];
  attendees?: string[];
  createdAt?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

export type LeadStatus =
  | 'New Lead'
  | 'Contacted'
  | 'Follow-up'
  | 'Qualified'
  | 'Proposal Sent'
  | 'Negotiation'
  | 'Won'
  | 'Lost'
  | (string & {});

export type LeadPriority = 'Hot' | 'Warm' | 'Cold';

export type LeadSource =
  | 'LinkedIn'
  | 'Website'
  | 'Cold Email'
  | 'Referrals'
  | 'Upwork'
  | 'Events'
  | 'Others'
  | (string & {});

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  company: string;
  title: string;
  status: LeadStatus;
  priority: LeadPriority;
  value: number;
  source: LeadSource;
  owner: string;
  score: number;
  createdAt: string;
  lastContacted?: string;
  notes?: string;
  tags?: string[];
  customFields?: Record<string, string | number>;
}

export interface LeadActivity {
  id: string;
  leadId: string;
  type: 'call' | 'email' | 'whatsapp' | 'meeting' | 'note' | 'status_change';
  description: string;
  timestamp: string;
  author: string;
}

export type ContactRoleType =
  | 'Decision Maker'
  | 'Champion'
  | 'Technical Evaluator'
  | 'Procurement'
  | 'Influencer';

export type ContactStatus = 'Customer' | 'Prospect' | 'Partner' | 'Past Client';

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  whatsapp?: string;
  company: string;
  title: string;
  avatar?: string;
  roleType: ContactRoleType;
  status: ContactStatus;
  dealOwner: string;
  associatedDealsCount?: number;
  totalDealValue?: number;
  lastInteraction?: string;
  linkedIn?: string;
  tags?: string[];
  notes?: string;
  location?: string;
  createdAt: string;
}

export interface ContactActivity {
  id: string;
  contactId: string;
  type: 'call' | 'email' | 'whatsapp' | 'meeting' | 'note' | 'status_change';
  description: string;
  timestamp: string;
  author: string;
}

export interface PipelineStageMetric {
  stage: DealStage;
  label: string;
  count: number;
  value: number;
  conversionRate: number;
  avgDaysInStage: number;
  color: string;
}

export type CompanyTier = 'Enterprise' | 'Mid-Market' | 'Startup';
export type CompanyStatus = 'Active Client' | 'Prospect' | 'Partner' | 'Churned';

export interface Company {
  id: string;
  name: string;
  industry: string;
  tier: CompanyTier;
  status: CompanyStatus;
  size: string;
  website?: string;
  location: string;
  accountOwner: string;
  totalDealsValue: number;
  activeDealsCount: number;
  contactsCount: number;
  healthScore: number;
  annualRevenue?: string;
  phone?: string;
  email?: string;
  linkedIn?: string;
  tags?: string[];
  notes?: string;
  createdAt: string;
}

export interface CompanyActivity {
  id: string;
  companyId: string;
  type: 'call' | 'email' | 'whatsapp' | 'meeting' | 'note' | 'status_change';
  description: string;
  timestamp: string;
  author: string;
}

export type ProjectStatus = 'In Progress' | 'Completed' | 'On Hold' | 'Delayed' | 'Planning';
export type ProjectPriority = 'Critical' | 'High' | 'Medium' | 'Low';
export type ProjectHealth = 'Good' | 'At Risk' | 'Critical';
export type ProjectCategory =
  | 'AI & Enterprise Automation'
  | 'Cloud Infrastructure & Migration'
  | 'Mobile & Web Application'
  | 'ERP Integration & Workflow'
  | 'Cybersecurity & Audit'
  | 'Custom SaaS Architecture';

export interface ProjectMilestone {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
}

export interface ProjectTaskItem {
  id: string;
  title: string;
  assignee: string;
  status: 'To Do' | 'In Progress' | 'In Review' | 'Completed';
  priority: 'Urgent' | 'High' | 'Medium' | 'Low' | 'Critical';
  dueDate: string;
  completed: boolean;
}

export type ProjectActivityType =
  | 'status_change'
  | 'milestone'
  | 'task'
  | 'bug'
  | 'budget'
  | 'team'
  | 'health'
  | 'note';

export interface ProjectActivity {
  id: string;
  projectId: string;
  type: ProjectActivityType;
  description: string;
  timestamp: string;
  author: string;
  oldValue?: string;
  newValue?: string;
}

export interface Project {
  id: string;
  name: string;
  client: string;
  category: ProjectCategory;
  status: ProjectStatus;
  priority: ProjectPriority;
  health: ProjectHealth;
  progress: number;
  budget: number;
  spent: number;
  startDate: string;
  deadline: string;
  projectManager: string;
  team: string[];
  totalTasks: number;
  completedTasks: number;
  openBugs: number;
  milestones?: ProjectMilestone[];
  tasks?: ProjectTaskItem[];
  description?: string;
  tags?: string[];
  createdAt?: string;
  activities?: ProjectActivity[];
}

export type TaskStatus = 'To Do' | 'In Progress' | 'In Review' | 'Completed' | 'Blocked';
export type TaskPriority = 'Urgent' | 'High' | 'Medium' | 'Low';
export type TaskCategory =
  | 'Backend'
  | 'Frontend'
  | 'DevOps'
  | 'QA & Testing'
  | 'Design & UX'
  | 'API & Integration'
  | 'Security & Compliance';

export interface TaskSubtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  project: string;
  client?: string;
  assignee: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: TaskCategory;
  dueDate: string;
  startDate?: string;
  estimatedHours: number;
  loggedHours: number;
  subtasks?: TaskSubtask[];
  tags?: string[];
  commentsCount?: number;
  createdAt: string;
}

export type TimeEntryApprovalStatus = 'Approved' | 'Pending' | 'Rejected';

export interface TimeEntry {
  id: string;
  taskId?: string;
  taskTitle: string;
  projectId?: string;
  projectName: string;
  client?: string;
  userName: string;
  userAvatar?: string;
  date: string; // 'YYYY-MM-DD'
  startTime?: string;
  endTime?: string;
  durationHours: number;
  description: string;
  isBillable: boolean;
  hourlyRate: number;
  billableAmount: number;
  status: TimeEntryApprovalStatus;
  tags?: string[];
  createdAt: string;
}

export type DocumentFileType = 'code_zip' | 'pdf' | 'docx' | 'xlsx' | 'pptx' | 'image' | 'archive';

export interface DocumentItem {
  id: string;
  name: string;
  description: string;
  folderId: string;
  folderName: string;
  fileType: DocumentFileType;
  extension: string;
  fileSizeFormatted: string;
  fileSizeBytes: number;
  uploadedBy: string;
  client?: string;
  project?: string;
  updatedAt: string;
  createdAt: string;
  isStarred?: boolean;
  tags?: string[];
  filesCount?: number;
  checksum?: string;
  downloadUrl?: string;
  previewSnippet?: string;
  manifestFiles?: string[];
}

export interface DocumentFolder {
  id: string;
  name: string;
  iconColor: string;
  filesCount: number;
  totalSizeBytes: number;
  totalSizeFormatted: string;
}

export type RevenueStreamType =
  | 'SaaS Subscription (MRR)'
  | 'Custom Engineering'
  | 'AI Automation & Agents'
  | 'Cloud Infrastructure'
  | 'Enterprise Retainer'
  | 'Consulting & Advisory';

export type RevenuePaymentStatus = 'Received' | 'Pending' | 'Scheduled' | 'Overdue';

export interface RevenueTransaction {
  id: string;
  transactionNumber: string;
  client: string;
  clientLogo?: string;
  project?: string;
  streamType: RevenueStreamType;
  amount: number;
  amountFormatted: string;
  status: RevenuePaymentStatus;
  date: string;
  paymentMethod: 'Stripe' | 'Wire Transfer' | 'ACH' | 'Credit Card' | 'PayPal';
  invoiceNumber?: string;
  isRecurring: boolean;
  recurringCadence?: 'Monthly' | 'Quarterly' | 'Annual';
  grossMarginPercent: number;
  netProfit: number;
  accountManager: string;
  notes?: string;
  createdAt: string;
}

export interface RevenueClientSummary {
  client: string;
  totalRevenue: number;
  totalRevenueFormatted: string;
  mrrContribution: number;
  activeContracts: number;
  health: 'High' | 'Medium' | 'Low';
  lastPaymentDate: string;
}

export type ExpenseCategory =
  | 'Cloud & Infrastructure'
  | 'AI & API Services'
  | 'Team & Payroll'
  | 'Software & SaaS'
  | 'Marketing & Growth'
  | 'Legal & Professional'
  | 'Office & Operations';

export type ExpenseStatus = 'Paid' | 'Pending Approval' | 'Approved' | 'Scheduled' | 'Rejected';

export type ExpensePaymentMethod =
  | 'Corporate Card'
  | 'Wire Transfer'
  | 'ACH Direct Debit'
  | 'Stripe Auto-Debit'
  | 'PayPal';

export type ExpenseDepartment =
  | 'Engineering & AI'
  | 'Product & Design'
  | 'Marketing & Sales'
  | 'Operations & Executive'
  | 'Customer Success';

export interface ExpenseItem {
  id: string;
  expenseNumber: string;
  title: string;
  vendor: string;
  category: ExpenseCategory;
  department: ExpenseDepartment;
  amount: number;
  amountFormatted: string;
  taxAmount?: number;
  taxDeductible: boolean;
  status: ExpenseStatus;
  paymentMethod: ExpensePaymentMethod;
  date: string; // ISO date 'YYYY-MM-DD'
  dueDate?: string;
  paidDate?: string;
  project?: string;
  client?: string;
  isBillableToClient: boolean;
  isRecurring: boolean;
  recurringInterval?: 'Monthly' | 'Quarterly' | 'Annual';
  receiptUrl?: string;
  receiptFilename?: string;
  approvedBy?: string;
  submittedBy: string;
  notes?: string;
  createdAt: string;
}

export interface ExpenseVendorSummary {
  vendor: string;
  category: ExpenseCategory;
  monthlyCost: number;
  activeSubscriptions: number;
  renewalCadence: 'Monthly' | 'Annual' | 'On-Demand';
  paymentMethod: ExpensePaymentMethod;
  lastPaymentDate: string;
  totalYtd: number;
}

export interface ExpenseBudgetCategory {
  category: ExpenseCategory;
  monthlyBudget: number;
  actualSpend: number;
  department: ExpenseDepartment;
  targetSavingsOpportunity?: string;
}

export type PaymentType = 'Inflow / Collection' | 'Outflow / Refund' | 'Payout / Settlement';

export type PaymentStatus =
  | 'Succeeded'
  | 'Processing'
  | 'Requires Action'
  | 'Failed'
  | 'Refunded'
  | 'Disputed';

export type PaymentMethodType =
  | 'Credit Card'
  | 'Wire / SWIFT'
  | 'ACH Direct Debit'
  | 'Stripe Connect'
  | 'PayPal'
  | 'Crypto (USDC)';

export type PaymentGatewayKey =
  | 'Stripe'
  | 'Chase Commercial'
  | 'Silicon Valley Bank'
  | 'PayPal Business'
  | 'Coinbase Prime';

export interface PaymentTransaction {
  id: string;
  paymentNumber: string;
  transactionReference: string;
  type: PaymentType;
  client: string;
  clientEmail?: string;
  invoiceNumber?: string;
  amount: number;
  amountFormatted: string;
  feeAmount: number;
  netAmount: number;
  currency: 'USD' | 'EUR' | 'GBP' | 'AED' | 'INR';
  status: PaymentStatus;
  paymentMethod: PaymentMethodType;
  gateway: PaymentGatewayKey;
  cardBrand?: 'Visa' | 'Mastercard' | 'Amex';
  cardLast4?: string;
  date: string; // ISO date 'YYYY-MM-DD'
  settledDate?: string;
  receiptUrl?: string;
  receiptNumber?: string;
  notes?: string;
  refundReason?: string;
  refundAmount?: number;
  createdAt: string;
}

export interface PaymentGateway {
  id: string;
  name: string;
  gatewayKey: PaymentGatewayKey;
  status: 'Active' | 'Connected' | 'Action Needed' | 'Disabled';
  environment: 'Live' | 'Test';
  currencySupported: string[];
  feeStructure: string;
  volume24h: number;
  totalProcessedYtd: number;
  lastWebhookPing: string;
  webhookStatus: 'Healthy' | 'Degraded' | 'Offline';
}

export interface BankPayout {
  id: string;
  payoutNumber: string;
  destinationBank: string;
  bankAccountName: string;
  routingNumber: string;
  grossAmount: number;
  fee: number;
  netDisbursement: number;
  currency: string;
  status: 'Deposited' | 'In Transit' | 'Initiated' | 'Failed';
  initiationDate: string;
  estimatedArrival: string;
  batchTransactionCount: number;
}

export interface PaymentDispute {
  id: string;
  disputeNumber: string;
  paymentNumber: string;
  client: string;
  amount: number;
  amountFormatted: string;
  reason:
    | 'Fraudulent'
    | 'Unrecognized'
    | 'Duplicate'
    | 'Service Not Delivered'
    | 'General Inquiry';
  status: 'Under Review' | 'Evidence Required' | 'Won / Closed' | 'Lost';
  evidenceDeadline: string;
  chargebackFee: number;
  dateReported: string;
}

// ----------------------------------------------------
// PROFIT & LOSS / CORPORATE FINANCIAL STATEMENTS
// ----------------------------------------------------
export type PnLPeriod =
  | 'This Month'
  | 'Q4 2026'
  | 'YTD 2026'
  | 'Full Year 2025'
  | '2026 Projected'
  | string;

export type PnLAccountingMethod = 'Accrual' | 'Cash';

export type PnLCategoryType =
  | 'Operating Revenue'
  | 'Cost of Goods Sold (COGS)'
  | 'Operating Expenses (OpEx)'
  | 'Tax & Depreciation';

export interface PnLLineItem {
  id: string;
  category: PnLCategoryType;
  accountCode: string;
  name: string;
  actualAmount: number;
  budgetAmount: number;
  priorPeriodAmount: number;
  notes?: string;
}

export interface MonthlyFinancialRecord {
  month: string;
  monthIndex: number;
  revenue: number;
  cogs: number;
  grossProfit: number;
  grossMarginPct: number;
  opex: number;
  ebitda: number;
  netProfit: number;
  netMarginPct: number;
}

export interface DepartmentProfitLoss {
  id: string;
  department: string;
  headcount: number;
  revenueGenerated: number;
  costIncurred: number;
  netContribution: number;
  marginPct: number;
  efficiencyRatio: string;
}

export interface FinancialScenario {
  id: string;
  name: string;
  revenueGrowthRate: number; // e.g. 20 (%)
  cogsOptimizationRate: number; // e.g. -5 (%)
  opexExpansionRate: number; // e.g. 10 (%)
  projectedRevenue: number;
  projectedNetIncome: number;
  projectedRunwayMonths: number;
  createdAt: string;
}

export interface PnLAdjustment {
  id: string;
  reference: string;
  category: PnLCategoryType;
  accountName: string;
  amount: number;
  type: 'Credit' | 'Debit';
  date: string;
  memo: string;
  approvedBy: string;
}



