export type UserRole = 'CLIENT' | 'BUSINESS_OWNER' | 'SALES_TEAM' | 'SUPER_ADMIN';

export interface ReviewFlowUser {
  uid: string;
  email: string;
  displayName: string;
  phone?: string;
  role: UserRole;
  status: 'active' | 'suspended';
  emailVerified?: boolean;
  termsAccepted?: boolean;
  onboardingStatus?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  onboardingCompletedAt?: string | null;
  onboardingVersion?: number;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  passwordHash?: string;
  resetToken?: string;
  resetCode?: string;
  resetTokenExpires?: string;
}

export type CrmLeadStatus =
  | 'NEW'
  | 'CONTACTED'
  | 'FOLLOW_UP'
  | 'DEMO_SCHEDULED'
  | 'NEGOTIATION'
  | 'CONVERTED'
  | 'NOT_INTERESTED'
  | 'LOST';

export interface CrmLead {
  id: string;
  name: string;
  businessName: string;
  phone: string;
  email: string;
  category: string;
  city: string;
  googleBusinessUrl?: string;
  message?: string;
  status: CrmLeadStatus;
  assignedSalesId?: string;
  assignedSalesName?: string;
  lastContactAt?: string;
  nextFollowUpAt?: string;
  clientId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CrmNote {
  id: string;
  leadId?: string;
  clientId?: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: string;
}

export type CrmCallOutcome =
  | 'Interested'
  | 'Not Interested'
  | 'Call Later'
  | 'Demo Required'
  | 'Converted'
  | 'Renewal Confirmed';

export interface CrmCall {
  id: string;
  leadId?: string;
  clientId?: string;
  salesPersonId: string;
  salesPersonName: string;
  phone: string;
  outcome: CrmCallOutcome;
  notes: string;
  callDate: string;
  nextFollowUpAt?: string;
  createdAt: string;
}

export type CrmFollowUpType =
  | 'Call'
  | 'WhatsApp Follow-up'
  | 'Email Follow-up'
  | 'Meeting'
  | 'Renewal Follow-up'
  | 'Payment Follow-up';

export type CrmFollowUpStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'OVERDUE';

export interface CrmFollowUp {
  id: string;
  leadId?: string;
  clientId?: string;
  clientName?: string;
  businessName?: string;
  phone?: string;
  type: CrmFollowUpType;
  dueDate: string;
  time?: string;
  notes: string;
  status: CrmFollowUpStatus;
  assignedUserId: string;
  assignedUserName: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalesUser {
  uid: string;
  name: string;
  email: string;
  phone: string;
  role: 'SALES_TEAM';
  status: 'active' | 'inactive';
  assignedLeadsCount: number;
  createdAt: string;
}

export type EmployeeRole =
  | 'SUPER_ADMIN'
  | 'OWNER'
  | 'ADMIN'
  | 'MANAGER'
  | 'EMPLOYEE'
  | 'CRM_AGENT'
  | 'SUPPORT'
  | 'SALES_TEAM'
  | 'STAFF'
  | 'SUB_ADMIN';

export type EmployeePermission =
  | 'dashboard.view'
  | 'business.view'
  | 'business.edit'
  | 'business.create'
  | 'subscription.view'
  | 'subscription.manage'
  | 'billing.view'
  | 'billing.manage'
  | 'payments.view'
  | 'payments.manage'
  | 'qr.view'
  | 'qr.create'
  | 'qr.edit'
  | 'qr.download'
  | 'qr.delete'
  | 'ai.view'
  | 'ai.manage'
  | 'analytics.view'
  | 'reports.export'
  | 'crm.view'
  | 'crm.create'
  | 'crm.edit'
  | 'crm.delete'
  | 'employees.view'
  | 'employees.create'
  | 'employees.edit'
  | 'employees.delete'
  | 'settings.view'
  | 'settings.edit'
  | 'audit.view'
  // Legacy compatibility aliases
  | 'leads:manage'
  | 'clients:manage'
  | 'businesses:view'
  | 'subscriptions:manage'
  | 'analytics:view'
  | 'settings:manage'
  | 'audit_logs:view';

export interface EmployeeUser {
  uid: string;
  name: string;
  email: string;
  phone: string;
  designation?: string;
  role: EmployeeRole;
  department: string;
  status: 'active' | 'suspended';
  permissions: EmployeePermission[];
  businessScope?: 'ALL' | string[]; // 'ALL' or array of specific business IDs
  assignedLeadsCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export type BusinessCategory = string;

export interface ReviewFlowVerifiedFact {
  id: string;
  businessId: string;
  type: 'service' | 'product' | 'highlight' | 'trade_policy';
  title: string;
  description: string;
  source: 'owner' | 'ai';
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewFlowAiAnalysisResult {
  businessType: string;
  summary: string;
  categoryMismatch?: boolean;
  mismatchWarning?: string;
  suggestedCategory?: string;
  likelyServices: Array<{ id: string; title: string; description: string; reason?: string }>;
  likelyProducts: Array<{ id: string; title: string; description: string; reason?: string }>;
  possibleHighlights: Array<{ id: string; title: string; description: string; reason?: string }>;
  customerExperienceTopics: Array<{ id: string; topic: string; description: string }>;
  followUpQuestions: string[];
  confidence: 'high' | 'medium' | 'low';
}

export interface ReviewFlowBusiness {
  id: string; // businessId
  ownerUid: string;
  ownerId?: string; // Firebase UID alias
  subscriptionId?: string; // The specific subscription linked to this business
  businessName: string;
  category: string;
  mainCategory?: string;
  subcategory?: string;
  customCategory?: string;
  description?: string;
  country: string;
  state: string;
  city: string;
  primaryLanguage?: string;
  preferredLanguage?: string;
  logoUrl?: string;
  website?: string;
  phone?: string;
  email?: string;
  location?: string;
  
  // Category-specific details
  categoryDetails: Record<string, any>;
  customFields?: Array<{ key: string; value: string }>;
  verifiedFacts?: ReviewFlowVerifiedFact[];
  
  // Google Review Setup
  googleReviewUrl: string;
  googleReviewVerified: boolean;
  googleReviewStatus?: 'unverified' | 'owner_confirmed' | 'rejected' | 'pending_verification' | 'failed';
  googleReviewVerifiedAt?: string;
  googlePlaceName?: string;
  googleProfileConnected: boolean;

  // Customer Experience Configuration
  customerHeading?: string;
  welcomeMessage?: string;
  brandAccentColor?: string;
  supportedLanguages?: string[];
  tonePreference?: 'natural' | 'simple' | 'warm' | 'professional' | 'conversational';
  visitQuestions?: string[];
  experienceCards?: Array<{ id: string; icon?: string; title: string; placeholder?: string; enabled?: boolean; }>;

  // Onboarding & Status
  onboardingStatus?:
    | 'NOT_STARTED'
    | 'IN_PROGRESS'
    | 'AI_PROCESSING'
    | 'TOPICS_REVIEW'
    | 'REVIEW_URL_PENDING'
    | 'QR_NFC_SETUP'
    | 'COMPLETED';
  onboardingCompleted: boolean;
  onboardingCompletedAt?: string;
  onboardingVersion?: string;
  businessProfileCompleted?: boolean;
  googleReviewConfigured?: boolean;
  aiTopicsGenerated?: boolean;
  aiConfigurationId?: string;
  nfcCardId?: string;
  qrCodeId?: string;
  nfcCardAssigned?: boolean;
  launchReady?: boolean;
  onboardingStep: number;
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'PAUSED' | 'EXPIRED' | 'active' | 'suspended';
  createdAt: string;
  updatedAt: string;
}

export interface ReviewFlowNfcCard {
  id: string;
  businessId: string;
  businessName?: string;
  ownerUid: string;
  uniqueCode: string;
  dynamicUrl: string;
  status: 'ACTIVE' | 'INACTIVE';
  totalTaps: number;
  lastTapAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewFlowQrCode {
  id: string;
  businessId: string;
  ownerUid: string;
  label: string; // e.g. "Counter Stand", "Table 1", "Entrance", "Packaging"
  uniqueCode: string;
  destinationUrl: string;
  status: 'ACTIVE' | 'PAUSED';
  scanCount: number;
  createdAt: string;
  updatedAt: string;
}

export type ScanEventType = 'QR_SCAN';

export interface ReviewFlowScanEvent {
  id: string;
  businessId: string;
  qrCodeId: string;
  uniqueCode: string;
  eventType: ScanEventType;
  userAgent: string;
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'unknown';
  source?: string;
  ipAddress?: string;
  createdAt: string;
}

export type ReviewAssistanceEventType =
  | 'PAGE_VIEW'
  | 'QR_SCAN'
  | 'CARD_SELECTED'
  | 'AI_DRAFT_GENERATED'
  | 'REVIEW_REGENERATED'
  | 'REVIEW_COPIED'
  | 'GOOGLE_REVIEW_CLICKED';

export interface ReviewFlowAssistanceEvent {
  id: string;
  businessId: string;
  qrCodeId: string;
  uniqueCode: string;
  eventType: ReviewAssistanceEventType;
  metadata?: Record<string, any>;
  createdAt: string;
}

export type CreditTransactionType =
  | 'PLAN_ALLOCATION'
  | 'PURCHASE'
  | 'REVIEW_GENERATION'
  | 'REVIEW_REGENERATION'
  | 'REFUND'
  | 'ADMIN_ADJUSTMENT';

export interface ReviewFlowCreditTransaction {
  id: string;
  clientId: string;
  businessId?: string;
  businessName?: string;
  type: CreditTransactionType;
  credits: number; // positive for additions, negative for deductions
  amount?: number;
  currency?: string;
  paymentId?: string;
  status: 'COMPLETED' | 'REFUNDED' | 'FAILED' | 'PENDING';
  balanceAfter: number;
  description?: string;
  createdAt: string;
}

export interface ReviewFlowCreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  currency: string;
  active: boolean;
}

export interface ReviewFlowSubscription {
  id: string; // subscriptionId
  ownerUid: string;
  userId?: string; // Firebase UID alias
  businessId?: string; // The one business linked to this subscription
  planId: 'reviewflow_unlimited' | string;
  planName: string; // 'ReviewFlow Unlimited'
  planVersion: number; // e.g. 1, 2
  price: number; // Locked pricing for this subscription (e.g. 999 or 9999)
  billingInterval: 'monthly' | 'yearly';
  provider?: 'RAZORPAY' | 'CASHFREE' | string;
  providerSubscriptionId?: string;
  status: 'PENDING' | 'ACTIVE' | 'PAST_DUE' | 'PAUSED' | 'HALTED' | 'CANCELLED' | 'EXPIRED' | 'active' | 'trialing' | 'expired' | 'suspended';
  amount?: number;
  priceMonthly: number;
  currency: string;
  currentPeriodStart?: string;
  currentPeriodEnd: string;
  autoRenew?: boolean;
  renewalCount?: number;
  haltReason?: string;
  aiGenerationsUsedThisMonth: number;
  maxAiMonthly: number; // Unlimited logically
  maxQrCodes: number;
  maxBusinesses: number;
  businessLimit?: number;
  nfcCardLimit?: number;
  creditsAllocated?: number;
  creditsUsed?: number;
  creditsRemaining?: number;
  paymentMethod?: string;
  paymentStatus?: 'paid' | 'test_paid' | 'pending';
  lastPaymentDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewFlowPlanDefinition {
  id: 'reviewflow_unlimited' | string;
  name: string; // 'ReviewFlow Unlimited'
  tagline: string;
  monthlyPrice: number; // e.g. 999
  yearlyPrice: number; // e.g. 9999
  currency: string; // 'INR'
  description: string;
  features: string[];
  trialDays: number;
  discount: number;
  paymentGateway: 'razorpay' | 'cashfree' | string;
  planStatus: 'ACTIVE' | 'ARCHIVED';
  currentVersion: number;
  launchReady: boolean;
  // Legacy compatibility fields
  priceMonthly?: number;
  maxBusinesses?: number;
  maxQrCodes?: number;
  maxAiMonthly?: number;
  updatedAt?: string;
}

export interface PlanVersionRecord {
  id: string;
  planId: string;
  version: number;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  features: string[];
  effectiveFrom: string;
  createdBy: string;
}

export interface DynamicQrCodeRecord {
  qrId: string;
  businessId: string;
  shopSlug: string;
  routePath: string; // e.g. /r/{businessId}/{shopSlug}/qr
  destinationUrl: string; // e.g. https://reviewflow.ai/review/c/{businessId} or custom URL
  status: 'ACTIVE' | 'PAUSED' | 'DISABLED' | 'ARCHIVED';
  description: string;
  scanCount: number;
  lastScannedAt?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface DynamicQrScanRecord {
  scanId: string;
  qrId: string;
  businessId: string;
  shopSlug: string;
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'unknown';
  browser: string;
  os: string;
  referrer: string;
  ipAddress?: string;
  approximateLocation?: string;
  scannedAt: string;
}

export interface AiUsageRecord {
  id: string;
  businessId: string;
  subscriptionId?: string;
  sessionId?: string;
  generationType: 'generate' | 'regenerate';
  inputTokens: number;
  outputTokens: number;
  aiModel: string;
  aiProvider: string;
  estimatedCost: number; // in INR
  latencyMs: number;
  status: 'SUCCESS' | 'FAILED';
  timestamp: string;
}

export interface ReviewFlowAdminAuditLog {
  id: string;
  actorUid?: string;
  actorEmail?: string;
  action:
    | 'CLIENT_SUSPENDED'
    | 'CLIENT_REACTIVATED'
    | 'PLAN_CHANGED'
    | 'LIMIT_MODIFIED'
    | 'SYSTEM_SETTING_CHANGED'
    | 'AI_SETTINGS_CHANGE'
    | 'ADMIN_LOGIN'
    | 'ADMIN_LOGIN_FAILED'
    | 'BUSINESS_VERIFIED'
    | 'EMPLOYEE_CREATED'
    | 'EMPLOYEE_UPDATED'
    | 'EMPLOYEE_DELETED'
    | 'FIREBASE_IMPORT'
    | 'FIREBASE_SYNC'
    | string;
  targetType: 'business' | 'user' | 'subscription' | 'system' | 'employee' | string;
  targetId: string;
  details: string;
  result: 'SUCCESS' | 'DENIED' | 'FAILED' | 'WARNING' | string;
  ipAddress?: string;
  createdAt: string;
}

export interface ReviewFlowPayment {
  id: string; // paymentId
  userId: string;
  businessId: string | null; // null initially for new business purchase
  subscriptionId: string;
  gateway?: 'RAZORPAY' | 'CASHFREE' | string;
  razorpayCustomerId?: string;
  razorpaySubscriptionId?: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  razorpaySignature?: string;
  cashfreeOrderId?: string;
  cashfreePaymentId?: string;
  cashfreeSubscriptionId?: string;
  cashfreePaymentSessionId?: string;
  cashfreeAuthLink?: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'AUTHORIZED' | 'PAID' | 'FAILED' | 'REFUNDED' | 'CANCELLED' | 'HALTED';
  paymentType: 'NEW_BUSINESS_SUBSCRIPTION' | 'CREDIT_PURCHASE' | 'SUBSCRIPTION_RENEWAL';
  planId: string;
  planVersion?: number;
  billingInterval?: 'monthly' | 'yearly';
  idempotencyKey: string;
  refundId?: string;
  refundReason?: string;
  refundAmount?: number;
  refundedAt?: string;
  createdAt: string;
  verifiedAt?: string;
}

export interface ReviewFlowCreditAccount {
  id: string; // creditAccountId
  userId: string;
  businessId: string;
  subscriptionId: string;
  monthlyAllocation: number;
  used: number;
  remaining: number;
  resetDate: string;
  updatedAt: string;
}

export interface ReviewFlowExperienceTopic {
  id: string; // topicId
  businessId: string;
  topicId: string;
  title: string;
  description: string;
  sortOrder: number;
  status: 'ACTIVE' | 'DISABLED';
  createdAt: string;
  updatedAt: string;
}

export interface ReviewFlowReviewSession {
  id: string; // sessionId
  businessId: string;
  businessCode?: string;
  selectedTopics: string[];
  customerText: string;
  language: string;
  createdAt: string;
  lastGenerationAt: string;
  qrCodeId?: string;
  nfcCardId?: string;
}

export interface ReviewFlowReviewGeneration {
  id: string; // primary record id
  generationId: string;
  requestId: string;
  sessionId: string;
  businessId: string;
  generationNumber: number;
  language: string;
  selectedTopics: string[];
  customerText: string;
  generatedText: string;
  model: string;
  wordCount?: number;
  createdAt: string;
  status: 'SUCCESS' | 'FAILED' | 'REJECTED';
  latencyMs: number;
  similarityCheck?: {
    passed: boolean;
    checkedAgainstCount: number;
    maxOverlap: number;
    reason?: string;
  };
  retryCount: number;
}

export interface ReviewFlowAiObservabilityMetrics {
  provider: string;
  model: string;
  status: 'Connected' | 'Unavailable';
  totalGenerations: number;
  successfulGenerations: number;
  failedGenerations: number;
  regenerations: number;
  averageResponseTimeMs: number;
  creditsConsumed: number;
  lastSuccessfulRequestAt?: string;
  lastFailedRequestAt?: string;
  lastErrorMessage?: string;
}

export interface AuditLogRecord {
  id: string;
  actorId?: string;
  actorRole?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  before?: any;
  after?: any;
  reason?: string;
  timestamp: string;
  ipAddress?: string;
  // Backward compatibility fields
  userId?: string;
  businessId?: string;
  metadata?: Record<string, any>;
}

export interface ReviewFlowSystemSettings {
  platformName: string;
  productionDomain: string;
  currency: string;
  aiProvider: 'gemini' | 'openai' | string;
  aiModel: string;
  paymentProvider: 'razorpay' | 'cashfree' | string;
  supportEmail: string;
  qrBaseUrl: string;
  defaultLanguage: string;
  maintenanceMode: boolean;
  featureFlags: {
    DYNAMIC_QR: boolean;
    AI_REVIEW_GENERATION: boolean;
    CRM: boolean;
    ANALYTICS: boolean;
    EMPLOYEE_RBAC: boolean;
    BILLING: boolean;
    NFC: boolean;
    GOOGLE_INTEGRATION: boolean;
    EXPORT: boolean;
    CUSTOM_BRANDING: boolean;
    [key: string]: boolean;
  };
  aiConfigured: boolean;
  geminiApiKey?: string;
  defaultAiMonthlyLimit?: number;
  defaultQrLimit?: number;
  firebaseStatus: 'connected' | 'demo_mode';
  qrEngineStatus: 'active' | 'standby';
  version: string;
  updatedAt: string;
  [key: string]: any;
}
