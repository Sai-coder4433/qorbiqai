export type UserRole = 
  | 'SUPER_ADMIN' 
  | 'AGENCY_OWNER' 
  | 'ADMIN' 
  | 'MANAGER' 
  | 'STAFF' 
  | 'CLIENT';

export type ReviewTone = 
  | 'Professional' 
  | 'Warm' 
  | 'Friendly' 
  | 'Luxury' 
  | 'Concise' 
  | 'Local' 
  | 'Custom';

export type PostType = 
  | 'STANDARD' 
  | 'EVENT' 
  | 'OFFER' 
  | 'PRODUCT';

export type IntegrationStatus = 
  | 'connected' 
  | 'disconnected' 
  | 'reauthorization_required' 
  | 'error';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: 'Starter' | 'Growth' | 'Agency' | 'Enterprise';
  createdAt: string;
}

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  role: UserRole;
  user?: User;
}

export interface Business {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  category: string;
  website?: string;
  phone?: string;
  country: string;
  city: string;
  address?: string;
  reviewTone: ReviewTone;
  customToneInstructions?: string;
  googleReviewUrl?: string;
  autoReplyEnabled: boolean;
  reviewAutomationMode?: 'OFF' | 'AI_DRAFT' | 'AUTO_REPLY';
  autoReplyMinRating: number; // e.g. 4 for 4-5 stars auto, 1-3 to review
  experienceChips: string[];
  createdAt: string;
}

export interface BusinessLocation {
  id: string;
  businessId: string;
  googleLocationName?: string; // e.g. "locations/12345678"
  googlePlaceId?: string;
  title: string;
  storeCode?: string;
  addressLines: string[];
  locality: string;
  administrativeArea: string;
  postalCode: string;
  latitude?: number;
  longitude?: number;
  phoneNumber?: string;
  websiteUri?: string;
  regularHours?: any;
  primaryCategory?: string;
  additionalCategories?: string[];
  description?: string;
  status: 'OPEN' | 'CLOSED_TEMPORARILY' | 'CLOSED_PERMANENTLY';
  lastSyncedAt?: string;
}

export interface GoogleIntegration {
  id: string;
  organizationId: string;
  businessId: string;
  accountId?: string;
  accountName?: string;
  accessTokenEncrypted?: string;
  refreshTokenEncrypted?: string;
  tokenExpiresAt?: number;
  scope?: string;
  status: IntegrationStatus;
  lastSyncAt?: string;
  errorMessage?: string;
}

export type ReviewReplyWorkflowStatus = 
  | 'PENDING' 
  | 'GENERATING' 
  | 'READY' 
  | 'APPROVED' 
  | 'PUBLISHING' 
  | 'PUBLISHED' 
  | 'FAILED' 
  | 'NEEDS_APPROVAL'
  | 'UNREPLIED'
  | 'REPLIED'
  | 'NEEDS_ATTENTION'
  | 'PENDING_APPROVAL';

export interface GoogleReview {
  id: string;
  businessId: string;
  locationId: string;
  googleReviewId: string;
  reviewerName: string;
  reviewerPhotoUrl?: string;
  starRating: number; // 1 to 5
  comment?: string;
  createTime: string;
  updateTime?: string;
  replyComment?: string;
  replyUpdateTime?: string;
  replyStatus: ReviewReplyWorkflowStatus;
  publishedAt?: string;
  apiResponseId?: string;
  replyError?: string;
  sensitivityRisk?: 'NONE' | 'LEGAL' | 'MEDICAL' | 'REFUND_DISPUTE' | 'HARASSMENT';
  sentiment?: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  aiDraftReply?: string;
  aiDraftTone?: ReviewTone;
  aiDraftGeneratedAt?: string;
}

export interface GooglePost {
  id: string;
  businessId: string;
  locationId: string;
  googlePostId?: string;
  topicType: PostType;
  summary: string;
  callToAction?: {
    actionType: 'BOOK' | 'ORDER' | 'SHOP' | 'LEARN_MORE' | 'SIGN_UP' | 'CALL';
    url?: string;
  };
  event?: {
    title: string;
    startDate: string;
    endDate: string;
  };
  offer?: {
    couponCode?: string;
    redeemUrl?: string;
    termsConditions?: string;
  };
  mediaUrl?: string;
  status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'FAILED';
  scheduledTime?: string;
  publishedTime?: string;
  createdAt: string;
}

export interface GoogleMediaItem {
  id: string;
  businessId: string;
  locationId: string;
  googleMediaId?: string;
  mediaFormat: 'PHOTO' | 'VIDEO';
  category: 'PROFILE' | 'COVER' | 'EXTERIOR' | 'INTERIOR' | 'PRODUCT' | 'AT_WORK' | 'TEAMS' | 'ADDITIONAL';
  mediaUrl: string;
  thumbnailUrl?: string;
  createTime: string;
}

export interface PerformanceMetricPoint {
  date: string;
  value: number;
}

export interface GBPPerformanceData {
  businessId: string;
  locationId: string;
  lastSyncedAt: string;
  dateRange: string;
  metrics: {
    businessImpressionsDesktopMaps: PerformanceMetricPoint[];
    businessImpressionsMobileMaps: PerformanceMetricPoint[];
    businessImpressionsDesktopSearch: PerformanceMetricPoint[];
    businessImpressionsMobileSearch: PerformanceMetricPoint[];
    callClicks: PerformanceMetricPoint[];
    websiteClicks: PerformanceMetricPoint[];
    businessDirections: PerformanceMetricPoint[];
    businessBookings?: PerformanceMetricPoint[];
    businessConversations?: PerformanceMetricPoint[];
  };
  totals: {
    totalViews: number;
    totalSearches: number;
    totalCalls: number;
    totalWebsiteClicks: number;
    totalDirections: number;
    totalBookings: number;
    totalConversations: number;
    rating: number;
    reviewCount: number;
  };
}

export interface SearchConsoleData {
  siteUrl: string;
  lastSyncedAt: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  queries: Array<{
    query: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
  pages: Array<{
    page: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
}

export interface GA4AnalyticsData {
  propertyId: string;
  lastSyncedAt: string;
  activeUsers: number;
  sessions: number;
  engagedSessions: number;
  engagementRate: number;
  conversions: number;
  sources: Array<{
    source: string;
    medium: string;
    users: number;
    sessions: number;
  }>;
  landingPages: Array<{
    pagePath: string;
    sessions: number;
    conversions: number;
  }>;
}

export interface CompetitorItem {
  id: string;
  name: string;
  placeId: string;
  rating: number;
  userRatingCount: number;
  primaryType?: string;
  address: string;
  websiteUri?: string;
  googleMapsUri?: string;
  distanceMeters?: number;
}

export interface RankGridPoint {
  lat: number;
  lng: number;
  found: boolean;
  rank?: number;
  status: 'TOP_3' | 'TOP_10' | 'BELOW_10' | 'NOT_FOUND';
  placeId?: string;
}

export interface RankGridScan {
  id: string;
  businessId: string;
  keyword: string;
  centerLat: number;
  centerLng: number;
  gridSize: number; // e.g. 3x3 or 5x5
  radiusKm: number;
  points: RankGridPoint[];
  methodology: string;
  scannedAt: string;
}

export interface SeoIssue {
  id: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  category: 'Indexability' | 'Metadata' | 'Headings' | 'Canonicalization' | 'Structured Data' | 'Internal Linking' | 'Images' | 'Mobile';
  url: string;
  description: string;
  recommendation: string;
  status: 'Open' | 'In Progress' | 'Completed' | 'Dismissed';
}

export interface SeoCrawlResult {
  url: string;
  crawledAt: string;
  totalScore: number;
  categoryScores: Record<string, { earned: number; total: number; reason: string }>;
  issues: SeoIssue[];
  metrics: {
    https: boolean;
    robotsTxtFound: boolean;
    sitemapFound: boolean;
    title: string;
    titleLength: number;
    metaDescription: string;
    metaDescriptionLength: number;
    h1Count: number;
    h1Text: string;
    h2Count: number;
    hasCanonical: boolean;
    canonicalUrl?: string;
    hasOpenGraph: boolean;
    hasStructuredData: boolean;
    schemaTypes: string[];
    imagesCount: number;
    imagesMissingAlt: number;
    internalLinksCount: number;
    responseTimeMs: number;
  };
}

export interface PrivateFeedback {
  id: string;
  businessId: string;
  rating: number;
  message: string;
  customerName?: string;
  customerEmail?: string;
  status: 'Needs attention' | 'In progress' | 'Resolved';
  internalNotes?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  organizationId: string;
  businessId?: string;
  userId: string;
  userEmail: string;
  action: string;
  provider?: string;
  endpoint?: string;
  status: 'SUCCESS' | 'FAILURE' | 'PENDING';
  details?: Record<string, any>;
  timestamp: string;
}

export interface AppNotification {
  id: string;
  organizationId: string;
  businessId?: string;
  title: string;
  message: string;
  type: 'REVIEW' | 'INTEGRATION' | 'SEO' | 'REPORT' | 'AUTOMATION' | 'SECURITY';
  severity: 'info' | 'warning' | 'critical' | 'success';
  read: boolean;
  linkUrl?: string;
  createdAt: string;
}

export interface AIUsageRecord {
  id: string;
  organizationId: string;
  businessId?: string;
  feature: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
  timestamp: string;
}

export type SyncJobStatus = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'PARTIAL' | 'FAILED';

export interface SyncJobStep {
  step: 'locations' | 'reviews' | 'performance' | 'posts' | 'media' | 'search_console' | 'analytics' | 'seo_health';
  name: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'SKIPPED';
  durationMs?: number;
  recordsCount?: number;
  error?: string;
}

export interface SyncJob {
  id: string;
  businessId: string;
  organizationId: string;
  trigger: 'MANUAL' | 'SCHEDULED' | 'WEBHOOK' | 'RECONNECT';
  status: SyncJobStatus;
  progressPercent: number;
  steps: SyncJobStep[];
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  retryCount?: number;
  error?: string;
}

export interface IntegrationHealth {
  businessId: string;
  provider: 'google_business_profile' | 'google_search_console' | 'google_analytics_4' | 'google_places' | 'cloud_pubsub' | 'whatsapp';
  status: 'CONNECTED' | 'SYNCING' | 'STALE' | 'ERROR' | 'REAUTH_REQUIRED' | 'DISCONNECTED';
  lastSuccessAt?: string;
  lastAttemptAt?: string;
  nextSyncAt?: string;
  errorCount: number;
  lastError?: string;
  retryCount: number;
}

export interface SeoTask {
  id: string;
  businessId: string;
  title: string;
  url: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  category: 'CTR Optimization' | 'Position Opportunity' | 'Technical Fix' | 'Content Gap' | 'Local Schema';
  status: 'Open' | 'In Progress' | 'Completed' | 'Dismissed';
  evidence: {
    impressions?: number;
    clicks?: number;
    ctr?: number;
    position?: number;
    issueDetails?: string;
  };
  aiSuggestion: string;
  assignedTo?: string;
  createdAt: string;
  completedAt?: string;
}

export interface TrackedKeyword {
  id: string;
  businessId: string;
  keyword: string;
  targetLocation: string;
  targetRank: number;
  currentRank?: number;
  previousRank?: number;
  searchVolumeEstimated?: number;
  trackedSince: string;
  lastCheckedAt?: string;
  source: 'MANUAL' | 'SEARCH_CONSOLE' | 'AI_RECOMMENDED';
}

export interface WeeklyGrowthBrief {
  id: string;
  businessId: string;
  weekRange: string;
  scoreOverall: number;
  whatChanged: string[];
  whatImproved: string[];
  whatDeclined: string[];
  whatNeedsAttention: string[];
  top5Actions: Array<{
    title: string;
    priority: 'Critical' | 'High' | 'Medium';
    actionUrl: string;
    impact: string;
  }>;
  evidenceData: Record<string, any>;
  createdAt: string;
}

export interface GrowthReport {
  id: string;
  businessId: string;
  organizationId: string;
  reportType: 'WEEKLY_BRIEF' | 'MONTHLY_EXECUTIVE';
  title: string;
  period: string;
  summary: string;
  kpis: {
    totalReviews: number;
    avgRating: number;
    reviewResponseRate: number;
    totalImpressions: number;
    totalClicks: number;
    totalCalls: number;
    totalDirections: number;
    organicClicks: number;
    organicImpressions: number;
  };
  sections: Array<{
    title: string;
    content: string;
    highlights: string[];
  }>;
  createdAt: string;
}

export interface WhatsAppNotificationConfig {
  enabled: boolean;
  phoneNumber?: string;
  webhookConfigured: boolean;
  alertEvents: {
    newReview: boolean;
    negativeReview: boolean;
    googleDisconnected: boolean;
    automationFailed: boolean;
    weeklyBrief: boolean;
  };
}

// ============================================================
// LOCALOS Automation Engine Types
// ============================================================

export type AutomationCategory = 
  | 'GOOGLE' 
  | 'SEO' 
  | 'COMPETITOR' 
  | 'ANALYTICS' 
  | 'AI' 
  | 'NOTIFICATIONS' 
  | 'SYSTEM';

export type AutomationGlobalState = 
  | 'DRAFT' 
  | 'ACTIVE' 
  | 'PAUSED' 
  | 'RUNNING' 
  | 'COMPLETED' 
  | 'FAILED' 
  | 'DISABLED' 
  | 'WAITING_APPROVAL' 
  | 'RETRYING';

export type AutomationEventType =
  | 'GOOGLE_CONNECTED'
  | 'GOOGLE_DISCONNECTED'
  | 'LOCATION_CREATED'
  | 'LOCATION_UPDATED'
  | 'NEW_REVIEW'
  | 'REVIEW_UPDATED'
  | 'REVIEW_REPLY_REQUIRED'
  | 'LOW_RATING_REVIEW'
  | 'NEGATIVE_REVIEW'
  | 'PROFILE_CHANGED'
  | 'PROFILE_INCOMPLETE'
  | 'NEW_SEARCH_QUERY'
  | 'KEYWORD_CHANGED'
  | 'SEO_ISSUE_FOUND'
  | 'SEO_SCORE_CHANGED'
  | 'COMPETITOR_CHANGED'
  | 'VISIBILITY_CHANGED'
  | 'POST_SCHEDULED'
  | 'POST_READY'
  | 'PERFORMANCE_SYNCED'
  | 'SEARCH_CONSOLE_SYNCED'
  | 'GA4_SYNCED'
  | 'REPORT_READY'
  | 'INTEGRATION_ERROR'
  | 'TOKEN_EXPIRING'
  | 'TOKEN_REFRESH_FAILED'
  | 'AUTOMATION_FAILED'
  | 'SCHEDULE_TICK';

export interface ConditionRule {
  field: string;
  operator: 'equals' | 'not_equals' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'not_contains' | 'changed_by' | 'changed_by_percentage';
  value: any;
}

export interface ActionDefinition {
  type: string; // e.g. 'AUTO_REPLY_REVIEW', 'SYNC_GOOGLE_DATA', 'RUN_SEO_AUDIT', 'NOTIFY_USER'
  config: Record<string, any>;
  executionMode: 'AUTO' | 'APPROVAL' | 'MANUAL';
}

export interface AutomationRule {
  id: string;
  organizationId: string;
  businessId: string;
  locationId?: string; // Optional location-level override
  name: string;
  description: string;
  category: AutomationCategory;
  triggerType: AutomationEventType | 'SCHEDULE';
  triggerConfig: Record<string, any>;
  conditionConfig: {
    logicalOperator?: 'AND' | 'OR';
    rules: ConditionRule[];
  };
  actionConfig: ActionDefinition[];
  scheduleConfig?: {
    frequency: '15_MIN' | '30_MIN' | 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'EVENT_BASED';
    cronExpr?: string;
    timeOfDay?: string;
    dayOfWeek?: number;
    timezone?: string;
  };
  approvalMode: 'AUTO' | 'DRAFT_ONLY' | 'REQUIRE_APPROVAL';
  enabled: boolean;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  version: number;
  versionHistory?: Array<{
    version: number;
    changedAt: string;
    changedBy: string;
    changes: string;
  }>;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string;
  lastResult?: 'SUCCESS' | 'FAILED' | 'SKIPPED' | 'WAITING_APPROVAL';
  nextRunAt?: string;
  pausedBy?: string;
  pausedAt?: string;
}

export interface AutomationRun {
  id: string;
  automationId: string;
  organizationId: string;
  businessId: string;
  locationId?: string;
  triggerEvent: string;
  status: AutomationGlobalState;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  error?: string;
  retryCount: number;
  maxRetries: number;
  metadata: {
    ruleName?: string;
    category?: AutomationCategory;
    triggerPayload?: any;
    conditionEvaluation?: {
      matched: boolean;
      details: string[];
    };
    actionResults?: any[];
    isDryRun?: boolean;
    approvalId?: string;
    queue?: string;
    verifiedExternalResult?: boolean;
  };
}

export interface AutomationActionRecord {
  id: string;
  automationRunId: string;
  actionType: string;
  actionConfig: Record<string, any>;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'WAITING_APPROVAL';
  startedAt: string;
  completedAt?: string;
  result?: any;
  error?: string;
  externalId?: string;
}

export interface AutomationApproval {
  id: string;
  automationRunId: string;
  actionId?: string;
  businessId: string;
  organizationId: string;
  type: 'REVIEW_REPLY' | 'PROFILE_CHANGE' | 'GOOGLE_POST' | 'SEO_RECOMMENDATION';
  title: string;
  whatWillChange: string;
  currentValue: string;
  newValue: string;
  why: string;
  source: string;
  requestedBy: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: string;
  approvedAt?: string;
  rejectedAt?: string;
  reason?: string;
  createdAt: string;
}

export interface QueueJob<T = any> {
  id: string;
  queue: 'google-sync' | 'reviews' | 'ai' | 'seo' | 'competitors' | 'visibility' | 'reports' | 'notifications' | 'system';
  name: string;
  payload: T;
  attempts: number;
  maxAttempts: number;
  backoffMs: number;
  status: 'WAITING' | 'ACTIVE' | 'COMPLETED' | 'FAILED' | 'DEAD_LETTER';
  idempotencyKey?: string;
  createdAt: string;
  processedAt?: string;
  error?: string;
}

export interface AutomationHealthStats {
  activeCount: number;
  runningCount: number;
  needsAttentionCount: number;
  failedCount: number;
  lastAutomationAt?: string;
  nextScheduledAt?: string;
  healthScorePercent: number;
  totalRuns: number;
  successfulRuns: number;
}

// ============================================================
// Developer Platform & Webhook Types
// ============================================================

export interface ApiKey {
  id: string;
  organizationId: string;
  name: string;
  keyPrefix: string;
  keyHash: string;
  status: 'ACTIVE' | 'REVOKED';
  createdAt: string;
  lastUsedAt?: string;
}

export interface WebhookEndpoint {
  id: string;
  organizationId: string;
  url: string;
  events: string[];
  secret: string;
  status: 'ACTIVE' | 'PAUSED' | 'FAILED';
  createdAt: string;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  organizationId: string;
  event: string;
  payload: any;
  responseStatus?: number;
  durationMs?: number;
  status: 'SUCCESS' | 'FAILED';
  attempts: number;
  error?: string;
  createdAt: string;
}

export interface ApiLogRecord {
  id: string;
  organizationId?: string;
  keyPrefix?: string;
  method: string;
  path: string;
  status: number;
  durationMs: number;
  ip: string;
  createdAt: string;
}

// ============================================================
// Multi-Tenant Billing & Quotas
// ============================================================

export interface BillingPlanLimit {
  maxBusinesses: number;
  maxLocations: number;
  maxReviewsPerMonth: number;
  maxAiActionsPerMonth: number;
  maxSeoCrawlsPerMonth: number;
  maxVisibilityScansPerMonth: number;
  apiAccess: boolean;
  webhooksEnabled: boolean;
  prioritySupport: boolean;
}

export interface BillingSubscription {
  id: string;
  organizationId: string;
  plan: 'Starter' | 'Growth' | 'Agency' | 'Enterprise';
  status: 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELED';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  amountMonthlyUsd: number;
  limits: BillingPlanLimit;
}

export interface BillingInvoice {
  id: string;
  organizationId: string;
  invoiceNumber: string;
  amountUsd: number;
  status: 'PAID' | 'OPEN' | 'VOID';
  date: string;
  pdfUrl?: string;
}

// ============================================================
// Feature Flags & Super Admin Types
// ============================================================

export type FeatureCategory =
  | 'CORE'
  | 'REVIEWS'
  | 'MARKETING'
  | 'LOCAL SEO'
  | 'AUTOMATION'
  | 'ANALYTICS'
  | 'COMMUNICATION'
  | 'API'
  | 'AGENCY'
  | 'ADVANCED';

export interface FeatureDefinition {
  key: string;
  name: string;
  category: FeatureCategory;
  description: string;
  enabled: boolean;
  lastChanged: string;
  changedBy: string;
  requires?: string[]; // dependency keys that must be enabled
}

export interface NfcCard {
  id: string;
  businessId: string;
  locationId?: string;
  cardUid: string;
  title: string;
  assignedStaff?: string;
  status: 'ACTIVE' | 'UNASSIGNED' | 'DISABLED';
  directUrl: string;
  totalTaps: number;
  googleConversions: number;
  privateFeedbackConversions: number;
  lastTappedAt?: string;
  deviceStats?: {
    android: number;
    ios: number;
  };
  createdAt: string;
}

export interface ReviewOnlineSettings {
  businessId: string;
  slug: string;
  customHeading?: string;
  subheading?: string;
  googleReviewUrl: string;
  minStarForGoogle: number; // default 4 (4-5 stars -> Google, 1-3 stars -> private resolution)
  thankYouMessage: string;
  negativeFeedbackTitle: string;
  notifyOnNegative: boolean;
  notifyEmail?: string;
  notifyWhatsapp?: string;
  promptChips: string[];
  bannerColor?: string;
  showGoogleLogo: boolean;
}

// -------------------------------------------------------------
// Google Review QR SaaS Types
// -------------------------------------------------------------
export type QrCodeStatus = 'ACTIVE' | 'PAUSED';

export type QrPlacement = 
  | 'Counter'
  | 'Table Stand'
  | 'Reception'
  | 'Billing Desk'
  | 'Window / Entrance'
  | 'Packaging / Delivery'
  | 'Poster'
  | 'Business Card'
  | 'Other';

export interface QrCode {
  id: string;
  businessId: string;
  name: string;
  code: string;
  destinationUrl: string;
  status: QrCodeStatus;
  placement: QrPlacement;
  totalScans: number;
  uniqueScans: number;
  lastScannedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QrScanEvent {
  id: string;
  qrCodeId: string;
  businessId: string;
  code: string;
  scannedAt: string;
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'bot' | 'unknown';
  os?: string;
  browser?: string;
  ipHash: string;
  city?: string;
  country?: string;
  referrer?: string;
  redirectUrl: string;
}

export interface SubscriptionPlan {
  id: string;
  name: 'FREE' | 'STARTER' | 'GROWTH' | 'PRO';
  displayName: string;
  priceMonthly: number;
  currency: string;
  status: 'ACTIVE' | 'COMING_SOON';
  maxActiveQrCodes: number;
  features: string[];
}

export interface Subscription {
  id: string;
  businessId: string;
  planId: string;
  status: 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELED';
  maxActiveQrCodes: number;
  currentPeriodStart: string;
  currentPeriodEnd?: string;
  razorpaySubscriptionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UsageCounters {
  businessId: string;
  activeQrCodes: number;
  totalScansMonth: number;
  lastResetDate: string;
  updatedAt: string;
}

export interface GoogleBusinessProfile {
  id: string;
  businessId: string;
  accountId?: string;
  locationId?: string;
  placeId?: string;
  displayName: string;
  overallRating?: number;
  totalReviewCount?: number;
  isConnected: boolean;
  connectedAt?: string;
  lastSyncAt?: string;
  createdAt: string;
  updatedAt: string;
}

