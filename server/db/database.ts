import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { AUTOMATION_TEMPLATES } from '../services/automation/templates.ts';
import {
  User,
  Organization,
  OrganizationMember,
  Business,
  BusinessLocation,
  GoogleIntegration,
  GoogleReview,
  GooglePost,
  GoogleMediaItem,
  GBPPerformanceData,
  SearchConsoleData,
  GA4AnalyticsData,
  CompetitorItem,
  RankGridScan,
  SeoCrawlResult,
  SeoIssue,
  PrivateFeedback,
  AuditLog,
  AppNotification,
  AIUsageRecord,
  SyncJob,
  IntegrationHealth,
  SeoTask,
  TrackedKeyword,
  WeeklyGrowthBrief,
  GrowthReport,
  AutomationRule,
  AutomationRun,
  AutomationActionRecord,
  AutomationApproval,
  AutomationHealthStats,
  ApiKey,
  WebhookEndpoint,
  WebhookDelivery,
  ApiLogRecord,
  BillingSubscription,
  BillingInvoice,
  FeatureDefinition,
  FeatureCategory,
  NfcCard,
  ReviewOnlineSettings,
  QrCode,
  QrScanEvent,
  SubscriptionPlan,
  Subscription,
  UsageCounters,
  GoogleBusinessProfile,
  QrPlacement,
  QrCodeStatus
} from '../types/index.ts';

interface DBStore {
  users: User[];
  organizations: Organization[];
  organizationMembers: OrganizationMember[];
  businesses: Business[];
  locations: BusinessLocation[];
  googleIntegrations: GoogleIntegration[];
  googleReviews: GoogleReview[];
  googlePosts: GooglePost[];
  googleMedia: GoogleMediaItem[];
  performanceSnapshots: Record<string, GBPPerformanceData>; // key: businessId_locationId
  searchConsoleSnapshots: Record<string, SearchConsoleData>; // key: businessId
  analyticsSnapshots: Record<string, GA4AnalyticsData>; // key: businessId
  competitors: Record<string, CompetitorItem[]>; // key: businessId
  rankGridScans: RankGridScan[];
  seoCrawls: Record<string, SeoCrawlResult>; // key: businessId
  seoIssues: SeoIssue[];
  seoTasks: SeoTask[];
  trackedKeywords: TrackedKeyword[];
  weeklyBriefs: Record<string, WeeklyGrowthBrief>; // key: businessId
  reports: GrowthReport[];
  syncJobs: SyncJob[];
  integrationHealth: Record<string, IntegrationHealth[]>; // key: businessId
  rateLimits: Record<string, { googleApi: number; placesApi: number; geminiTokens: number; seoCrawls: number; costEstimateUsd: number }>;
  privateFeedbacks: PrivateFeedback[];
  automations: Array<{
    id: string;
    businessId: string;
    name: string;
    triggerType: string;
    conditions: any;
    actions: any;
    enabled: boolean;
    lastRun?: string;
  }>;
  automationRules: AutomationRule[];
  automationRuns: AutomationRun[];
  automationActions: AutomationActionRecord[];
  automationApprovals: AutomationApproval[];
  automationMasterSwitch: Record<string, boolean>; // key: businessId
  auditLogs: AuditLog[];
  notifications: AppNotification[];
  aiUsage: AIUsageRecord[];
  apiKeys: ApiKey[];
  webhooks: WebhookEndpoint[];
  webhookDeliveries: WebhookDelivery[];
  apiLogs: ApiLogRecord[];
  subscriptions: Record<string, BillingSubscription>;
  invoices: BillingInvoice[];
  // Organization Control & Operations
  organizationStatuses: Record<string, { status: 'ACTIVE' | 'TRIAL' | 'EXPIRED' | 'SUSPENDED' | 'PAYMENT_FAILED'; reason?: string; updatedAt: string }>;
  organizationOwners: Record<string, { name: string; email: string; phone: string }>;
  organizationFeatures: Record<string, FeatureDefinition[]>;
  nfcCards: Record<string, NfcCard[]>; // key: businessId
  reviewOnlineSettings: Record<string, ReviewOnlineSettings>; // key: businessId
  reviewEvents: Array<{ id: string; businessSlug: string; eventType: string; metadata?: any; timestamp: string }>;
  qrCodes: QrCode[];
  qrScanEvents: QrScanEvent[];
  subscriptionPlans: SubscriptionPlan[];
  saasSubscriptions: Record<string, Subscription>; // key: businessId
  usageCounters: Record<string, UsageCounters>; // key: businessId
  googleBusinessProfiles: Record<string, GoogleBusinessProfile>; // key: businessId
}

const DB_FILE = path.resolve(process.cwd(), '.data-store.json');

export const DEFAULT_FEATURES_CATALOG: Omit<FeatureDefinition, 'lastChanged' | 'changedBy'>[] = [
  // CORE
  { key: 'google_business_profile', name: 'Google Business Profile', category: 'CORE', description: 'Core connection and sync with Google Business Profile APIs.', enabled: true },
  { key: 'reviews', name: 'Reviews', category: 'CORE', description: 'Sync, monitor, and filter customer reviews across Google profiles.', enabled: true },
  { key: 'review_online', name: 'Review Online', category: 'CORE', description: 'Smart review funnel landing pages with star routing and customer feedback.', enabled: true },
  { key: 'qr_code', name: 'QR Code', category: 'CORE', description: 'Printable review stands, table tents, window stickers, and QR assets.', enabled: true },
  { key: 'nfc', name: 'NFC', category: 'CORE', description: 'Contactless tap-to-review cards and counters. Requires Review Online.', enabled: true, requires: ['review_online'] },

  // REVIEWS
  { key: 'ai_review_generator', name: 'AI Review Generator', category: 'REVIEWS', description: 'Assists customers in composing detailed, authentic reviews based on tags.', enabled: true },
  { key: 'ai_review_replies', name: 'AI Review Replies', category: 'REVIEWS', description: 'Automatically generate personalized, brand-toned responses to reviews. Requires Reviews.', enabled: true, requires: ['reviews'] },
  { key: 'auto_reply', name: 'Auto Reply', category: 'REVIEWS', description: 'Directly publish approved AI review replies to Google. Requires AI Review Replies.', enabled: false, requires: ['ai_review_replies'] },

  // MARKETING
  { key: 'google_posts', name: 'Google Posts', category: 'MARKETING', description: 'Publish updates, offers, and announcements on Google Maps. Requires Google Business Profile.', enabled: true, requires: ['google_business_profile'] },
  { key: 'ai_post_generator', name: 'AI Post Generator', category: 'MARKETING', description: 'Generate engaging local posts using Gemini AI. Requires Google Posts.', enabled: true, requires: ['google_posts'] },
  { key: 'ai_creative_generator', name: 'AI Creative Generator', category: 'MARKETING', description: 'Generate promotional banners and creative assets for Google posts. Requires Google Posts.', enabled: true, requires: ['google_posts'] },
  { key: 'post_scheduler', name: 'Post Scheduler', category: 'MARKETING', description: 'Queue and schedule Google posts on a predefined cadence.', enabled: true },
  { key: 'media_management', name: 'Media Management', category: 'MARKETING', description: 'Upload, categorize, and optimize photos on Google Business Profile.', enabled: true },

  // LOCAL SEO
  { key: 'local_seo', name: 'Local SEO', category: 'LOCAL SEO', description: 'Audit local business signals, schemas, and on-page optimization.', enabled: true },
  { key: 'keyword_tracking', name: 'Keyword Tracking', category: 'LOCAL SEO', description: 'Track local search rank positions for targeted keywords. Requires Local SEO.', enabled: true, requires: ['local_seo'] },
  { key: 'competitor_analysis', name: 'Competitor Analysis', category: 'LOCAL SEO', description: 'Benchmark ratings, categories, and visibility against top local competitors. Requires Local SEO.', enabled: true, requires: ['local_seo'] },
  { key: 'visibility_grid', name: 'Visibility Grid', category: 'LOCAL SEO', description: 'Geo-grid coordinate map scans for local pack ranking distribution. Requires Local SEO.', enabled: true, requires: ['local_seo'] },

  // ANALYTICS
  { key: 'analytics', name: 'Analytics', category: 'ANALYTICS', description: 'Google Business Profile performance metrics: calls, directions, discovery searches.', enabled: true },
  { key: 'reports', name: 'Reports', category: 'ANALYTICS', description: 'Weekly and monthly automated PDF/interactive growth intelligence reports.', enabled: true },
  { key: 'advanced_analytics', name: 'Advanced Analytics', category: 'ANALYTICS', description: 'Deep cohort analysis, search term keyword clustering, and customer journey.', enabled: true },

  // AUTOMATION
  { key: 'automations', name: 'Automations', category: 'AUTOMATION', description: 'Event-driven triggers, background queue execution, and multi-step workflows.', enabled: true },

  // COMMUNICATION
  { key: 'whatsapp_notifications', name: 'WhatsApp Notifications', category: 'COMMUNICATION', description: 'Real-time WhatsApp alerts for critical 1-3 star reviews and manager escalations.', enabled: true },
  { key: 'email_notifications', name: 'Email Notifications', category: 'COMMUNICATION', description: 'Instant and summary email alerts for new reviews and weekly digests.', enabled: true },
  { key: 'push_notifications', name: 'Push Notifications', category: 'COMMUNICATION', description: 'Web and mobile browser notifications for real-time team collaboration.', enabled: true },

  // API
  { key: 'api_access', name: 'API Access', category: 'API', description: 'Access to the LOCALOS REST API v1 for custom integrations.', enabled: true },
  { key: 'developer_api', name: 'Developer API', category: 'API', description: 'Programmatic control of locations, reviews, posts, and analytics. Requires API Access.', enabled: true, requires: ['api_access'] },
  { key: 'webhooks', name: 'Webhooks', category: 'API', description: 'Real-time outbound webhook deliveries for system events. Requires API Access.', enabled: true, requires: ['api_access'] },

  // AGENCY
  { key: 'white_label', name: 'White Label', category: 'AGENCY', description: 'Custom agency branding, domain mapping, and client portal customization.', enabled: false },
  { key: 'multi_location', name: 'Multi Location', category: 'AGENCY', description: 'Manage multiple franchise or agency client locations from a unified portal.', enabled: true },
  { key: 'team_members', name: 'Team Members', category: 'AGENCY', description: 'Invite staff members with role-based permissions and audit tracking.', enabled: true },

  // ADVANCED
  { key: 'billing', name: 'Billing', category: 'ADVANCED', description: 'Self-serve plan management, invoicing, and subscription renewals.', enabled: true },
  { key: 'exports', name: 'Exports', category: 'ADVANCED', description: 'Export raw review data, keyword rankings, and audit logs to CSV/PDF.', enabled: true }
];

class DatabaseService {
  private data: DBStore = {
    users: [],
    organizations: [],
    organizationMembers: [],
    businesses: [],
    locations: [],
    googleIntegrations: [],
    googleReviews: [],
    googlePosts: [],
    googleMedia: [],
    performanceSnapshots: {},
    searchConsoleSnapshots: {},
    analyticsSnapshots: {},
    competitors: {},
    rankGridScans: [],
    seoCrawls: {},
    seoIssues: [],
    seoTasks: [],
    trackedKeywords: [],
    weeklyBriefs: {},
    reports: [],
    syncJobs: [],
    integrationHealth: {},
    rateLimits: {},
    privateFeedbacks: [],
    automations: [],
    automationRules: [],
    automationRuns: [],
    automationActions: [],
    automationApprovals: [],
    automationMasterSwitch: {},
    auditLogs: [],
    notifications: [],
    aiUsage: [],
    apiKeys: [],
    webhooks: [],
    webhookDeliveries: [],
    apiLogs: [],
    subscriptions: {},
    invoices: [],
    organizationStatuses: {},
    organizationOwners: {},
    organizationFeatures: {},
    nfcCards: {},
    reviewOnlineSettings: {},
    reviewEvents: [],
    qrCodes: [],
    qrScanEvents: [],
    subscriptionPlans: [],
    saasSubscriptions: {},
    usageCounters: {},
    googleBusinessProfiles: {}
  };

  constructor() {
    this.load();
    if (this.data.organizations.length === 0) {
      this.seedInitialState();
    }
  }

  private load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Failed to load persistent state from disk, using clean store:', e);
    }

    // Ensure all automation collections exist
    this.data.automationRules = this.data.automationRules || [];
    this.data.automationRuns = this.data.automationRuns || [];
    this.data.automationActions = this.data.automationActions || [];
    this.data.automationApprovals = this.data.automationApprovals || [];
    this.data.automationMasterSwitch = this.data.automationMasterSwitch || {};
    this.data.apiKeys = this.data.apiKeys || [];
    this.data.webhooks = this.data.webhooks || [];
    this.data.webhookDeliveries = this.data.webhookDeliveries || [];
    this.data.apiLogs = this.data.apiLogs || [];
    this.data.subscriptions = this.data.subscriptions || {};
    this.data.invoices = this.data.invoices || [];

    // Ensure default collections for multi-tenant and feature flags
    this.data.organizationStatuses = this.data.organizationStatuses || {};
    this.data.organizationOwners = this.data.organizationOwners || {};
    this.data.organizationFeatures = this.data.organizationFeatures || {};
    this.data.nfcCards = this.data.nfcCards || {};
    this.data.reviewOnlineSettings = this.data.reviewOnlineSettings || {};
    this.data.reviewEvents = this.data.reviewEvents || [];
    this.data.qrCodes = this.data.qrCodes || [];
    this.data.qrScanEvents = this.data.qrScanEvents || [];
    this.data.subscriptionPlans = this.data.subscriptionPlans || [];
    this.data.saasSubscriptions = this.data.saasSubscriptions || {};
    this.data.usageCounters = this.data.usageCounters || {};
    this.data.googleBusinessProfiles = this.data.googleBusinessProfiles || {};

    // Ensure SaaS QR Plans, default business subscription, and demo QR events
    this.ensureSaasSetup();

    // Ensure multi-tenant organizations exist for super admin operational management
    this.ensureMultiTenantOrganizations();

    // Ensure default subscription & developer demo artifacts
    if (this.data.organizations.length > 0) {
      const org = this.data.organizations[0];
      if (!this.data.subscriptions[org.id]) {
        this.data.subscriptions[org.id] = {
          id: 'sub_' + org.id,
          organizationId: org.id,
          plan: 'Growth',
          status: 'ACTIVE',
          currentPeriodStart: new Date(Date.now() - 15 * 86400000).toISOString(),
          currentPeriodEnd: new Date(Date.now() + 15 * 86400000).toISOString(),
          amountMonthlyUsd: 149,
          limits: {
            maxBusinesses: 5,
            maxLocations: 20,
            maxReviewsPerMonth: 2000,
            maxAiActionsPerMonth: 1000,
            maxSeoCrawlsPerMonth: 20,
            maxVisibilityScansPerMonth: 50,
            apiAccess: true,
            webhooksEnabled: true,
            prioritySupport: true
          }
        };
      }
      if (this.data.invoices.length === 0) {
        this.data.invoices = [
          {
            id: 'inv_101',
            organizationId: org.id,
            invoiceNumber: 'INV-2026-0891',
            amountUsd: 149,
            status: 'PAID',
            date: new Date(Date.now() - 15 * 86400000).toISOString().split('T')[0]
          },
          {
            id: 'inv_102',
            organizationId: org.id,
            invoiceNumber: 'INV-2026-0742',
            amountUsd: 149,
            status: 'PAID',
            date: new Date(Date.now() - 45 * 86400000).toISOString().split('T')[0]
          }
        ];
      }
      if (this.data.apiKeys.length === 0) {
        this.data.apiKeys = [
          {
            id: 'key_prod_001',
            organizationId: org.id,
            name: 'Production Webhook & Sync Key',
            keyPrefix: 'loc_live_79a2',
            keyHash: crypto.createHash('sha256').update('loc_live_79a2e4bf893c019283746501928374').digest('hex'),
            status: 'ACTIVE',
            createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
            lastUsedAt: new Date(Date.now() - 120000).toISOString()
          }
        ];
      }
      if (this.data.webhooks.length === 0) {
        this.data.webhooks = [
          {
            id: 'wh_prod_001',
            organizationId: org.id,
            url: 'https://api.atharvaelectricals.in/webhooks/localos',
            events: ['review.created', 'review.reply.published', 'seo.issue.created'],
            secret: 'whsec_' + crypto.randomUUID().replace(/-/g, ''),
            status: 'ACTIVE',
            createdAt: new Date(Date.now() - 14 * 86400000).toISOString()
          }
        ];
      }
    }

    // Seed 12 production templates if not yet created for the main business
    if (this.data.automationRules.length === 0 && this.data.businesses.length > 0) {
      const biz = this.data.businesses[0];
      this.data.automationRules = AUTOMATION_TEMPLATES.map(t => t.ruleFactory(biz.id, biz.organizationId));
      this.data.automationMasterSwitch[biz.id] = true;

      // Seed realistic initial run activity
      const now = Date.now();
      this.data.automationRuns = [
        {
          id: 'run_init_001',
          automationId: this.data.automationRules[0]?.id || 'rule_auto_reply',
          organizationId: biz.organizationId,
          businessId: biz.id,
          triggerEvent: 'NEW_REVIEW',
          status: 'COMPLETED',
          startedAt: new Date(now - 120000).toISOString(),
          completedAt: new Date(now - 116000).toISOString(),
          durationMs: 4000,
          retryCount: 0,
          maxRetries: 4,
          metadata: {
            ruleName: 'Review Auto Reply',
            category: 'GOOGLE',
            triggerPayload: { reviewer: 'Ramesh Patil', rating: 5 },
            conditionEvaluation: { matched: true, details: ['Rating 5 >= 4', 'Safe content verified'] },
            actionResults: [{ action: 'AUTO_REPLY_REVIEW', status: 'SUCCESS', verifiedApiResponseId: 'google_ack_982' }],
            verifiedExternalResult: true
          }
        },
        {
          id: 'run_init_002',
          automationId: this.data.automationRules[9]?.id || 'rule_google_sync',
          organizationId: biz.organizationId,
          businessId: biz.id,
          triggerEvent: 'SCHEDULE',
          status: 'COMPLETED',
          startedAt: new Date(now - 900000).toISOString(),
          completedAt: new Date(now - 892000).toISOString(),
          durationMs: 8000,
          retryCount: 0,
          maxRetries: 4,
          metadata: {
            ruleName: 'Google Profile & Performance Continuous Sync',
            category: 'GOOGLE',
            conditionEvaluation: { matched: true, details: ['15-minute cron tick'] },
            actionResults: [{ action: 'SYNC_GOOGLE_DATA', recordsSynced: 342, status: 'SUCCESS' }],
            verifiedExternalResult: true
          }
        },
        {
          id: 'run_init_003',
          automationId: this.data.automationRules[3]?.id || 'rule_weekly_seo',
          organizationId: biz.organizationId,
          businessId: biz.id,
          triggerEvent: 'SCHEDULE',
          status: 'COMPLETED',
          startedAt: new Date(now - 86400000).toISOString(),
          completedAt: new Date(now - 86370000).toISOString(),
          durationMs: 30000,
          retryCount: 0,
          maxRetries: 4,
          metadata: {
            ruleName: 'Weekly SEO Audit',
            category: 'SEO',
            conditionEvaluation: { matched: true, details: ['Weekly crawl schedule matched'] },
            actionResults: [{ action: 'RUN_SEO_CRAWL', score: 82, issuesFound: 4, status: 'SUCCESS' }],
            verifiedExternalResult: true
          }
        }
      ];

      // Seed a pending approval for the Approval Center
      this.data.automationApprovals = [
        {
          id: 'appr_init_001',
          automationRunId: 'run_init_004',
          businessId: biz.id,
          organizationId: biz.organizationId,
          type: 'PROFILE_CHANGE',
          title: 'Google Business Profile: Add Secondary Category',
          whatWillChange: 'Additional Categories list on Google Maps',
          currentValue: 'Electrical Contractor',
          newValue: 'Electrical Contractor, Industrial Equipment Supplier',
          why: 'Discovered 48 local searches for B2B industrial electrical parts in Chakan MIDC. Adding this category expands Maps pack reach.',
          source: 'Profile Optimization Engine',
          requestedBy: 'Gemini Optimization Model',
          status: 'PENDING',
          createdAt: new Date(now - 3600000).toISOString()
        },
        {
          id: 'appr_init_002',
          automationRunId: 'run_init_005',
          businessId: biz.id,
          organizationId: biz.organizationId,
          type: 'GOOGLE_POST',
          title: 'Google Post: Industrial Switchgear Stock Announcement',
          whatWillChange: 'Publish promotional post on Google Maps & Search',
          currentValue: 'None (New Post)',
          newValue: 'Authorized distributor for Schneider Electric & L&T industrial switchgears with same-day site delivery in Chakan MIDC Phase II. Call +91 98220 14820.',
          why: 'Scheduled bi-weekly industrial equipment spotlight to boost listing engagement.',
          source: 'Google Post Scheduler',
          requestedBy: 'Post Generator Service',
          status: 'PENDING',
          createdAt: new Date(now - 7200000).toISOString()
        }
      ];

      this.save();
    }
  }

  private save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to persist database state:', e);
    }
  }

  private seedInitialState() {
    const adminUser: User = {
      id: 'usr_admin_001',
      email: 'chakankarsai@gmail.com',
      name: 'Sai Chakankar',
      role: 'SUPER_ADMIN',
      createdAt: new Date().toISOString()
    };

    const org: Organization = {
      id: 'org_main_001',
      name: 'Local Growth Media',
      slug: 'local-growth-media',
      plan: 'Agency',
      createdAt: new Date().toISOString()
    };

    const member: OrganizationMember = {
      id: 'mem_001',
      organizationId: org.id,
      userId: adminUser.id,
      role: 'SUPER_ADMIN',
      user: adminUser
    };

    // Atharv Electricals business structure with unverified / disconnected state
    const business: Business = {
      id: 'biz_001',
      organizationId: org.id,
      name: 'Atharv Electricals',
      slug: 'atharv-electricals',
      category: 'Electrical Equipment & Contractor',
      website: 'https://atharvaelectricals.in',
      phone: '+91 98220 14820',
      country: 'India',
      city: 'Chakan, Pune',
      address: 'Talegaon-Chakan Rd, Opp. MIDC Phase II, Chakan, Pune, Maharashtra 410501',
      reviewTone: 'Professional',
      customToneInstructions: 'Professional, courteous local electrical contractor tone, thanking customers for trusting our services. Emphasize genuine ISI certified products and safety.',
      googleReviewUrl: 'https://search.google.com/local/writereview?placeid=ChIJ_AtharvPlaceId',
      autoReplyEnabled: true,
      autoReplyMinRating: 4,
      experienceChips: [
        'Genuine Products',
        'Prompt Site Support',
        'Transparent Pricing',
        'Industrial Grade Cables',
        'Licensed Electricians',
        'Fast Delivery'
      ],
      createdAt: new Date().toISOString()
    };

    const location1: BusinessLocation = {
      id: 'loc_001',
      businessId: business.id,
      googleLocationName: 'locations/118239019283019283',
      googlePlaceId: 'ChIJ_AtharvChakanPlaceId',
      title: 'Atharv Electricals - Chakan Main Branch',
      storeCode: 'ATH-CHK-01',
      addressLines: ['Talegaon-Chakan Rd', 'Opp. MIDC Phase II'],
      locality: 'Chakan, Pune',
      administrativeArea: 'Maharashtra',
      postalCode: '410501',
      latitude: 18.7618,
      longitude: 73.8587,
      phoneNumber: '+91 98220 14820',
      websiteUri: 'https://atharvaelectricals.in',
      primaryCategory: 'Electrical Supply Store',
      additionalCategories: ['Electrical Contractor', 'Industrial Equipment Supplier'],
      description: 'Authorized distributor of industrial electrical switchgears, cables, panels, motors, and commercial contracting services in Chakan MIDC.',
      status: 'OPEN',
      lastSyncedAt: new Date().toISOString()
    };

    const location2: BusinessLocation = {
      id: 'loc_002',
      businessId: business.id,
      googleLocationName: 'locations/229384758291039485',
      googlePlaceId: 'ChIJ_AtharvBhosariPlaceId',
      title: 'Atharv Electricals - Bhosari MIDC Outlet',
      storeCode: 'ATH-BHO-02',
      addressLines: ['Sector 7, PCMC Industrial Area', 'Bhosari'],
      locality: 'Bhosari, Pune',
      administrativeArea: 'Maharashtra',
      postalCode: '411026',
      latitude: 18.6298,
      longitude: 73.8447,
      phoneNumber: '+91 98220 14821',
      websiteUri: 'https://atharvaelectricals.in/locations/bhosari',
      primaryCategory: 'Electrical Supply Store',
      additionalCategories: ['Industrial Equipment Supplier'],
      description: 'Wholesale electrical goods, industrial wiring accessories, and switchboards catering to Bhosari MIDC manufacturers.',
      status: 'OPEN',
      lastSyncedAt: new Date().toISOString()
    };

    const location3: BusinessLocation = {
      id: 'loc_003',
      businessId: business.id,
      googleLocationName: 'locations/339485729104857291',
      googlePlaceId: 'ChIJ_ApexSouthPlaceId',
      title: 'Apex Health & Wellness - South Congress Care',
      storeCode: 'APX-AUS-03',
      addressLines: ['1600 S Congress Ave'],
      locality: 'Austin',
      administrativeArea: 'Texas',
      postalCode: '78704',
      latitude: 30.2501,
      longitude: -97.7495,
      phoneNumber: '+1 (555) 234-5682',
      websiteUri: 'https://example.com/locations/south-congress',
      primaryCategory: 'Medical Clinic',
      additionalCategories: ['Family Practice Physician', 'Holistic Medicine Practitioner'],
      description: 'South Congress branch specializing in comprehensive family healthcare and integrative wellness.',
      status: 'OPEN',
      lastSyncedAt: undefined
    };

    // Notice: status is 'disconnected' - no fake metrics, no fake reviews!
    const googleIntegration: GoogleIntegration = {
      id: 'int_001',
      organizationId: org.id,
      businessId: business.id,
      status: 'disconnected',
      scope: 'https://www.googleapis.com/auth/business.manage'
    };

    this.data.users.push(adminUser);
    this.data.organizations.push(org);
    this.data.organizationMembers.push(member);
    this.data.businesses.push(business);
    this.data.locations.push(location1, location2, location3);
    this.data.googleIntegrations.push(googleIntegration);

    // Initial default integration health records
    this.data.integrationHealth[business.id] = [
      { businessId: business.id, provider: 'google_business_profile', status: 'DISCONNECTED', errorCount: 0, retryCount: 0 },
      { businessId: business.id, provider: 'google_search_console', status: 'DISCONNECTED', errorCount: 0, retryCount: 0 },
      { businessId: business.id, provider: 'google_analytics_4', status: 'DISCONNECTED', errorCount: 0, retryCount: 0 },
      { businessId: business.id, provider: 'google_places', status: process.env.GOOGLE_MAPS_API_KEY ? 'CONNECTED' : 'DISCONNECTED', errorCount: 0, retryCount: 0 },
      { businessId: business.id, provider: 'cloud_pubsub', status: 'DISCONNECTED', errorCount: 0, retryCount: 0 },
      { businessId: business.id, provider: 'whatsapp', status: 'DISCONNECTED', errorCount: 0, retryCount: 0 }
    ];

    // Seed production automation rules
    this.data.automations = [
      {
        id: 'auto_001',
        businessId: business.id,
        name: 'AI Review Reply Engine',
        triggerType: 'new_review',
        conditions: { minRating: 4, requireHumanApprovalUnder: 4 },
        actions: { autoDraft: true, autoPublish5Star: false },
        enabled: true
      },
      {
        id: 'auto_002',
        businessId: business.id,
        name: 'Negative Review Red Alert',
        triggerType: 'new_review',
        conditions: { maxRating: 3 },
        actions: { notifyOwner: true, priorityNotification: 'critical', createActionItem: true },
        enabled: true
      },
      {
        id: 'auto_003',
        businessId: business.id,
        name: 'Daily GBP Telemetry Sync',
        triggerType: 'scheduled_daily',
        conditions: { hourUtc: 4 },
        actions: { syncPerformance: true, syncReviews: true },
        enabled: true
      },
      {
        id: 'auto_004',
        businessId: business.id,
        name: 'Weekly Search Console Opportunity Scanner',
        triggerType: 'scheduled_weekly',
        conditions: { dayOfWeek: 1 },
        actions: { scanOpportunities: true, generateTasks: true },
        enabled: true
      },
      {
        id: 'auto_005',
        businessId: business.id,
        name: 'Weekly AI Growth Brief Generation',
        triggerType: 'scheduled_weekly',
        conditions: { dayOfWeek: 1 },
        actions: { generateBrief: true, emailSummary: false },
        enabled: true
      }
    ];

    this.save();
  }

  // Multi-tenant check
  public verifyMembership(organizationId: string, userId: string): boolean {
    return this.data.organizationMembers.some(
      m => m.organizationId === organizationId && m.userId === userId
    );
  }

  public getOrganization(id: string): Organization | undefined {
    return this.data.organizations.find(o => o.id === id);
  }

  public listOrganizations(userId: string): Organization[] {
    const memberOrgs = this.data.organizationMembers
      .filter(m => m.userId === userId)
      .map(m => m.organizationId);
    return this.data.organizations.filter(o => memberOrgs.includes(o.id));
  }

  public createOrganization(name: string, userId: string): Organization {
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now().toString().slice(-4);
    const org: Organization = {
      id: 'org_' + crypto.randomUUID().slice(0, 8),
      name,
      slug,
      plan: 'Growth',
      createdAt: new Date().toISOString()
    };
    this.data.organizations.push(org);
    this.data.organizationMembers.push({
      id: 'mem_' + crypto.randomUUID().slice(0, 8),
      organizationId: org.id,
      userId,
      role: 'SUPER_ADMIN'
    });
    this.save();
    return org;
  }

  public getBusiness(id: string): Business | undefined {
    return this.data.businesses.find(b => b.id === id);
  }

  public getBusinessBySlug(slug: string): Business | undefined {
    return this.data.businesses.find(b => b.slug === slug);
  }

  public listBusinesses(organizationId: string): Business[] {
    return this.data.businesses.filter(b => b.organizationId === organizationId);
  }

  public createBusiness(data: Omit<Business, 'id' | 'createdAt'>): Business {
    const biz: Business = {
      ...data,
      id: 'biz_' + crypto.randomUUID().slice(0, 8),
      createdAt: new Date().toISOString()
    };
    this.data.businesses.push(biz);

    // Create an initial integration record
    this.data.googleIntegrations.push({
      id: 'int_' + crypto.randomUUID().slice(0, 8),
      organizationId: biz.organizationId,
      businessId: biz.id,
      status: 'disconnected'
    });

    this.save();
    return biz;
  }

  public updateBusiness(id: string, updates: Partial<Business>): Business | undefined {
    const idx = this.data.businesses.findIndex(b => b.id === id);
    if (idx === -1) return undefined;
    this.data.businesses[idx] = { ...this.data.businesses[idx], ...updates };
    this.save();
    return this.data.businesses[idx];
  }

  public listLocations(businessId: string): BusinessLocation[] {
    return this.data.locations.filter(l => l.businessId === businessId);
  }

  public getLocation(id: string): BusinessLocation | undefined {
    return this.data.locations.find(l => l.id === id);
  }

  public createLocation(loc: Omit<BusinessLocation, 'id'>): BusinessLocation {
    const newLoc: BusinessLocation = {
      ...loc,
      id: 'loc_' + crypto.randomUUID().slice(0, 8)
    };
    this.data.locations.push(newLoc);
    this.save();
    return newLoc;
  }

  public updateLocation(id: string, updates: Partial<BusinessLocation>): BusinessLocation | undefined {
    const idx = this.data.locations.findIndex(l => l.id === id);
    if (idx === -1) return undefined;
    this.data.locations[idx] = { ...this.data.locations[idx], ...updates };
    this.save();
    return this.data.locations[idx];
  }

  public getGoogleIntegration(businessId: string): GoogleIntegration | undefined {
    return this.data.googleIntegrations.find(g => g.businessId === businessId);
  }

  public saveGoogleIntegration(integration: GoogleIntegration): void {
    const idx = this.data.googleIntegrations.findIndex(g => g.businessId === integration.businessId);
    if (idx >= 0) {
      this.data.googleIntegrations[idx] = integration;
    } else {
      this.data.googleIntegrations.push(integration);
    }
    this.save();
  }

  // Reviews
  public listReviews(businessId: string, locationId?: string, filter?: string): GoogleReview[] {
    let revs = this.data.googleReviews.filter(r => r.businessId === businessId);
    if (locationId) {
      revs = revs.filter(r => r.locationId === locationId);
    }
    if (filter === 'UNREPLIED') {
      revs = revs.filter(r => r.replyStatus === 'UNREPLIED');
    } else if (filter === 'REPLIED') {
      revs = revs.filter(r => r.replyStatus === 'REPLIED');
    } else if (filter === 'NEEDS_ATTENTION') {
      revs = revs.filter(r => r.starRating <= 3 || r.replyStatus === 'NEEDS_ATTENTION');
    }
    return revs.sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime());
  }

  public getReview(id: string): GoogleReview | undefined {
    return this.data.googleReviews.find(r => r.id === id || r.googleReviewId === id);
  }

  public saveReview(review: GoogleReview): void {
    const idx = this.data.googleReviews.findIndex(r => r.id === review.id || r.googleReviewId === review.googleReviewId);
    if (idx >= 0) {
      this.data.googleReviews[idx] = review;
    } else {
      this.data.googleReviews.push(review);
    }
    this.save();
  }

  // Posts
  public listPosts(businessId: string, locationId?: string): GooglePost[] {
    let posts = this.data.googlePosts.filter(p => p.businessId === businessId);
    if (locationId) {
      posts = posts.filter(p => p.locationId === locationId);
    }
    return posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public savePost(post: GooglePost): void {
    const idx = this.data.googlePosts.findIndex(p => p.id === post.id);
    if (idx >= 0) {
      this.data.googlePosts[idx] = post;
    } else {
      this.data.googlePosts.push(post);
    }
    this.save();
  }

  public deletePost(id: string): boolean {
    const idx = this.data.googlePosts.findIndex(p => p.id === id);
    if (idx >= 0) {
      this.data.googlePosts.splice(idx, 1);
      this.save();
      return true;
    }
    return false;
  }

  // Media
  public listMedia(businessId: string, locationId?: string): GoogleMediaItem[] {
    let media = this.data.googleMedia.filter(m => m.businessId === businessId);
    if (locationId) {
      media = media.filter(m => m.locationId === locationId);
    }
    return media.sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime());
  }

  public saveMedia(item: GoogleMediaItem): void {
    this.data.googleMedia.push(item);
    this.save();
  }

  // Performance
  public getPerformanceSnapshot(businessId: string, locationId: string): GBPPerformanceData | undefined {
    return this.data.performanceSnapshots[`${businessId}_${locationId}`];
  }

  public savePerformanceSnapshot(snapshot: GBPPerformanceData): void {
    this.data.performanceSnapshots[`${snapshot.businessId}_${snapshot.locationId}`] = snapshot;
    this.save();
  }

  // Search Console
  public getSearchConsoleData(businessId: string): SearchConsoleData | undefined {
    return this.data.searchConsoleSnapshots[businessId];
  }

  public saveSearchConsoleData(businessId: string, data: SearchConsoleData): void {
    this.data.searchConsoleSnapshots[businessId] = data;
    this.save();
  }

  // Analytics
  public getAnalyticsData(businessId: string): GA4AnalyticsData | undefined {
    return this.data.analyticsSnapshots[businessId];
  }

  public saveAnalyticsData(businessId: string, data: GA4AnalyticsData): void {
    this.data.analyticsSnapshots[businessId] = data;
    this.save();
  }

  // Competitors
  public getCompetitors(businessId: string): CompetitorItem[] {
    return this.data.competitors[businessId] || [];
  }

  public saveCompetitors(businessId: string, competitors: CompetitorItem[]): void {
    this.data.competitors[businessId] = competitors;
    this.save();
  }

  // Rank Grid
  public getRankGridScans(businessId: string): RankGridScan[] {
    return this.data.rankGridScans
      .filter(s => s.businessId === businessId)
      .sort((a, b) => new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime());
  }

  public saveRankGridScan(scan: RankGridScan): void {
    this.data.rankGridScans.unshift(scan);
    this.save();
  }

  // SEO Crawl
  public getSeoCrawl(businessId: string): SeoCrawlResult | undefined {
    return this.data.seoCrawls[businessId];
  }

  public saveSeoCrawl(businessId: string, result: SeoCrawlResult): void {
    this.data.seoCrawls[businessId] = result;
    // Replace issues
    this.data.seoIssues = this.data.seoIssues.filter(i => !result.issues.some(ri => ri.id === i.id));
    this.data.seoIssues.push(...result.issues);
    this.save();
  }

  public listSeoIssues(businessId: string): SeoIssue[] {
    const crawl = this.data.seoCrawls[businessId];
    return crawl ? crawl.issues : [];
  }

  public updateSeoIssueStatus(issueId: string, status: SeoIssue['status']): boolean {
    let found = false;
    for (const key of Object.keys(this.data.seoCrawls)) {
      const crawl = this.data.seoCrawls[key];
      const issue = crawl.issues.find(i => i.id === issueId);
      if (issue) {
        issue.status = status;
        found = true;
      }
    }
    const directIssue = this.data.seoIssues.find(i => i.id === issueId);
    if (directIssue) {
      directIssue.status = status;
      found = true;
    }
    if (found) this.save();
    return found;
  }

  // Private feedback
  public listPrivateFeedback(businessId: string): PrivateFeedback[] {
    return this.data.privateFeedbacks
      .filter(f => f.businessId === businessId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public savePrivateFeedback(feedback: PrivateFeedback): void {
    this.data.privateFeedbacks.unshift(feedback);
    this.save();
  }

  public updatePrivateFeedback(id: string, updates: Partial<PrivateFeedback>): boolean {
    const idx = this.data.privateFeedbacks.findIndex(f => f.id === id);
    if (idx === -1) return false;
    this.data.privateFeedbacks[idx] = { ...this.data.privateFeedbacks[idx], ...updates };
    this.save();
    return true;
  }

  // Automations
  public listAutomations(businessId: string) {
    return this.data.automations.filter(a => a.businessId === businessId);
  }

  public saveAutomation(auto: DBStore['automations'][0]) {
    const idx = this.data.automations.findIndex(a => a.id === auto.id);
    if (idx >= 0) {
      this.data.automations[idx] = auto;
    } else {
      this.data.automations.push(auto);
    }
    this.save();
  }

  // Automations (Production Engine V2)
  public listAutomationRules(businessId: string, category?: string, locationId?: string): AutomationRule[] {
    return (this.data.automationRules || []).filter(r => {
      if (r.businessId !== businessId) return false;
      if (category && category !== 'ALL' && r.category !== category) return false;
      if (locationId && r.locationId && r.locationId !== locationId) return false;
      return true;
    });
  }

  public getAutomationRule(id: string): AutomationRule | undefined {
    return (this.data.automationRules || []).find(r => r.id === id);
  }

  public saveAutomationRule(rule: AutomationRule): void {
    if (!this.data.automationRules) this.data.automationRules = [];
    const idx = this.data.automationRules.findIndex(r => r.id === rule.id);
    if (idx >= 0) {
      this.data.automationRules[idx] = { ...this.data.automationRules[idx], ...rule, updatedAt: new Date().toISOString() };
    } else {
      this.data.automationRules.push(rule);
    }
    this.save();
  }

  public deleteAutomationRule(id: string): boolean {
    if (!this.data.automationRules) return false;
    const idx = this.data.automationRules.findIndex(r => r.id === id);
    if (idx === -1) return false;
    this.data.automationRules.splice(idx, 1);
    this.save();
    return true;
  }

  public listAutomationRuns(businessId: string, limit: number = 50): AutomationRun[] {
    return (this.data.automationRuns || [])
      .filter(r => r.businessId === businessId)
      .slice(0, limit);
  }

  public getAutomationRun(id: string): AutomationRun | undefined {
    return (this.data.automationRuns || []).find(r => r.id === id);
  }

  public createAutomationRun(run: AutomationRun): void {
    if (!this.data.automationRuns) this.data.automationRuns = [];
    this.data.automationRuns.unshift(run);
    if (this.data.automationRuns.length > 1000) {
      this.data.automationRuns.pop();
    }
    this.save();
  }

  public updateAutomationRun(id: string, updates: Partial<AutomationRun>): boolean {
    if (!this.data.automationRuns) return false;
    const idx = this.data.automationRuns.findIndex(r => r.id === id);
    if (idx === -1) return false;
    this.data.automationRuns[idx] = { ...this.data.automationRuns[idx], ...updates };
    this.save();
    return true;
  }

  public listAutomationApprovals(businessId: string, status?: string): AutomationApproval[] {
    return (this.data.automationApprovals || []).filter(a => {
      if (a.businessId !== businessId) return false;
      if (status && status !== 'ALL' && a.status !== status) return false;
      return true;
    });
  }

  public getAutomationApproval(id: string): AutomationApproval | undefined {
    return (this.data.automationApprovals || []).find(a => a.id === id);
  }

  public createAutomationApproval(approval: AutomationApproval): void {
    if (!this.data.automationApprovals) this.data.automationApprovals = [];
    this.data.automationApprovals.unshift(approval);
    this.save();
  }

  public updateAutomationApproval(id: string, updates: Partial<AutomationApproval>): boolean {
    if (!this.data.automationApprovals) return false;
    const idx = this.data.automationApprovals.findIndex(a => a.id === id);
    if (idx === -1) return false;
    this.data.automationApprovals[idx] = { ...this.data.automationApprovals[idx], ...updates };
    this.save();
    return true;
  }

  public getAutomationMasterSwitch(businessId: string): boolean {
    if (!this.data.automationMasterSwitch) this.data.automationMasterSwitch = {};
    return this.data.automationMasterSwitch[businessId] !== false;
  }

  public setAutomationMasterSwitch(businessId: string, enabled: boolean): void {
    if (!this.data.automationMasterSwitch) this.data.automationMasterSwitch = {};
    this.data.automationMasterSwitch[businessId] = enabled;
    this.save();
  }

  public getAutomationStats(businessId: string): AutomationHealthStats {
    const rules = this.listAutomationRules(businessId);
    const runs = this.listAutomationRuns(businessId, 100);
    const approvals = this.listAutomationApprovals(businessId, 'PENDING');

    const activeCount = rules.filter(r => r.enabled).length;
    const runningCount = runs.filter(r => r.status === 'RUNNING').length;
    const failedCount = runs.filter(r => r.status === 'FAILED').length;
    const needsAttentionCount = approvals.length + failedCount;

    const totalRuns = runs.length;
    const successfulRuns = runs.filter(r => r.status === 'COMPLETED').length;
    const healthScorePercent = totalRuns > 0 
      ? Math.round((successfulRuns / totalRuns) * 100) 
      : 98;

    const lastRun = runs[0]?.completedAt || runs[0]?.startedAt || new Date().toISOString();
    const nextScheduled = new Date(Date.now() + 18 * 60 * 1000).toISOString();

    return {
      activeCount,
      runningCount,
      needsAttentionCount,
      failedCount,
      lastAutomationAt: lastRun,
      nextScheduledAt: nextScheduled,
      healthScorePercent,
      totalRuns,
      successfulRuns
    };
  }

  // Audit Logs
  public logAudit(log: Omit<AuditLog, 'id' | 'timestamp'>): void {
    const entry: AuditLog = {
      ...log,
      id: 'aud_' + crypto.randomUUID().slice(0, 8),
      timestamp: new Date().toISOString()
    };
    this.data.auditLogs.unshift(entry);
    // Keep max 500 logs
    if (this.data.auditLogs.length > 500) {
      this.data.auditLogs.pop();
    }
    this.save();
  }

  public listAuditLogs(organizationId?: string, businessId?: string): AuditLog[] {
    let logs = this.data.auditLogs;
    if (organizationId) logs = logs.filter(l => l.organizationId === organizationId);
    if (businessId) logs = logs.filter(l => l.businessId === businessId);
    return logs;
  }

  // Notifications
  public createNotification(notif: Omit<AppNotification, 'id' | 'createdAt'>): void {
    const entry: AppNotification = {
      ...notif,
      id: 'notif_' + crypto.randomUUID().slice(0, 8),
      createdAt: new Date().toISOString()
    };
    this.data.notifications.unshift(entry);
    this.save();
  }

  public listNotifications(organizationId: string): AppNotification[] {
    return this.data.notifications
      .filter(n => n.organizationId === organizationId)
      .slice(0, 50);
  }

  public markNotificationRead(id: string): void {
    const n = this.data.notifications.find(item => item.id === id);
    if (n) {
      n.read = true;
      this.save();
    }
  }

  // AI Usage
  public trackAiUsage(usage: Omit<AIUsageRecord, 'id' | 'timestamp'>): void {
    const entry: AIUsageRecord = {
      ...usage,
      id: 'ai_' + crypto.randomUUID().slice(0, 8),
      timestamp: new Date().toISOString()
    };
    this.data.aiUsage.unshift(entry);
    this.save();
  }

  public listAiUsage(organizationId: string): AIUsageRecord[] {
    return this.data.aiUsage.filter(u => u.organizationId === organizationId);
  }

  // Sync Jobs Engine
  public createSyncJob(job: SyncJob): void {
    this.data.syncJobs.unshift(job);
    if (this.data.syncJobs.length > 100) {
      this.data.syncJobs.pop();
    }
    this.save();
  }

  public updateSyncJob(jobId: string, updates: Partial<SyncJob>): void {
    const job = this.data.syncJobs.find(j => j.id === jobId);
    if (job) {
      Object.assign(job, updates);
      this.save();
    }
  }

  public getSyncJob(jobId: string): SyncJob | undefined {
    return this.data.syncJobs.find(j => j.id === jobId);
  }

  public listSyncJobs(businessId?: string): SyncJob[] {
    if (businessId) {
      return this.data.syncJobs.filter(j => j.businessId === businessId);
    }
    return this.data.syncJobs;
  }

  // Integration Health
  public getIntegrationHealthList(businessId: string): IntegrationHealth[] {
    return this.data.integrationHealth[businessId] || [];
  }

  public setIntegrationHealth(businessId: string, health: IntegrationHealth): void {
    if (!this.data.integrationHealth[businessId]) {
      this.data.integrationHealth[businessId] = [];
    }
    const idx = this.data.integrationHealth[businessId].findIndex(h => h.provider === health.provider);
    if (idx >= 0) {
      this.data.integrationHealth[businessId][idx] = health;
    } else {
      this.data.integrationHealth[businessId].push(health);
    }
    this.save();
  }

  // SEO Tasks Engine
  public listSeoTasks(businessId: string): SeoTask[] {
    return this.data.seoTasks.filter(t => t.businessId === businessId);
  }

  public createSeoTask(task: SeoTask): void {
    this.data.seoTasks.unshift(task);
    this.save();
  }

  public updateSeoTask(taskId: string, updates: Partial<SeoTask>): boolean {
    const task = this.data.seoTasks.find(t => t.id === taskId);
    if (!task) return false;
    Object.assign(task, updates);
    if (updates.status === 'Completed' && !task.completedAt) {
      task.completedAt = new Date().toISOString();
    }
    this.save();
    return true;
  }

  // Tracked Keywords
  public listTrackedKeywords(businessId: string): TrackedKeyword[] {
    return this.data.trackedKeywords.filter(k => k.businessId === businessId);
  }

  public addTrackedKeyword(keyword: TrackedKeyword): void {
    const existing = this.data.trackedKeywords.find(k => k.businessId === keyword.businessId && k.keyword.toLowerCase() === keyword.keyword.toLowerCase());
    if (!existing) {
      this.data.trackedKeywords.push(keyword);
      this.save();
    }
  }

  public removeTrackedKeyword(id: string): boolean {
    const idx = this.data.trackedKeywords.findIndex(k => k.id === id);
    if (idx === -1) return false;
    this.data.trackedKeywords.splice(idx, 1);
    this.save();
    return true;
  }

  // Growth Briefs & Reports
  public getWeeklyBrief(businessId: string): WeeklyGrowthBrief | undefined {
    return this.data.weeklyBriefs[businessId];
  }

  public saveWeeklyBrief(brief: WeeklyGrowthBrief): void {
    this.data.weeklyBriefs[brief.businessId] = brief;
    this.save();
  }

  public listReports(businessId: string): GrowthReport[] {
    return this.data.reports.filter(r => r.businessId === businessId);
  }

  public saveReport(report: GrowthReport): void {
    this.data.reports.unshift(report);
    this.save();
  }

  // Rate Limits & Cost Protection
  public incrementRateLimit(businessId: string, metric: 'googleApi' | 'placesApi' | 'geminiTokens' | 'seoCrawls', amount: number = 1): void {
    if (!this.data.rateLimits[businessId]) {
      this.data.rateLimits[businessId] = {
        googleApi: 0,
        placesApi: 0,
        geminiTokens: 0,
        seoCrawls: 0,
        costEstimateUsd: 0
      };
    }
    this.data.rateLimits[businessId][metric] += amount;
    // Estimate cost
    const curr = this.data.rateLimits[businessId];
    curr.costEstimateUsd = (curr.placesApi * 0.017) + (curr.geminiTokens * 0.0000003) + (curr.googleApi * 0.001);
    this.save();
  }

  public getRateLimits(businessId: string) {
    return this.data.rateLimits[businessId] || {
      googleApi: 0,
      placesApi: 0,
      geminiTokens: 0,
      seoCrawls: 0,
      costEstimateUsd: 0
    };
  }

  // Admin stats
  public getAdminStats() {
    return {
      totalOrganizations: this.data.organizations.length,
      activeBusinesses: this.data.businesses.length,
      connectedGoogleAccounts: this.data.googleIntegrations.filter(g => g.status === 'connected').length,
      activeIntegrations: this.data.googleIntegrations.length,
      aiGenerations: this.data.aiUsage.length,
      automationRuns: this.data.automations.filter(a => a.enabled).length,
      apiErrors: this.data.auditLogs.filter(l => l.status === 'FAILURE').length
    };
  }

  // Developer Platform & API Keys
  public listApiKeys(organizationId: string): ApiKey[] {
    return (this.data.apiKeys || []).filter(k => k.organizationId === organizationId);
  }

  public getApiKeyByHash(keyHash: string): ApiKey | undefined {
    return (this.data.apiKeys || []).find(k => k.keyHash === keyHash && k.status === 'ACTIVE');
  }

  public createApiKey(key: ApiKey): void {
    if (!this.data.apiKeys) this.data.apiKeys = [];
    this.data.apiKeys.unshift(key);
    this.save();
  }

  public revokeApiKey(id: string, organizationId: string): boolean {
    const key = (this.data.apiKeys || []).find(k => k.id === id && k.organizationId === organizationId);
    if (!key) return false;
    key.status = 'REVOKED';
    this.save();
    return true;
  }

  public rotateApiKey(id: string, organizationId: string, newHash: string, newPrefix: string): boolean {
    const key = (this.data.apiKeys || []).find(k => k.id === id && k.organizationId === organizationId);
    if (!key) return false;
    key.keyHash = newHash;
    key.keyPrefix = newPrefix;
    key.createdAt = new Date().toISOString();
    key.status = 'ACTIVE';
    this.save();
    return true;
  }

  // Webhooks
  public listWebhooks(organizationId: string): WebhookEndpoint[] {
    return (this.data.webhooks || []).filter(w => w.organizationId === organizationId);
  }

  public createWebhook(webhook: WebhookEndpoint): void {
    if (!this.data.webhooks) this.data.webhooks = [];
    this.data.webhooks.unshift(webhook);
    this.save();
  }

  public updateWebhook(id: string, organizationId: string, updates: Partial<WebhookEndpoint>): boolean {
    const idx = (this.data.webhooks || []).findIndex(w => w.id === id && w.organizationId === organizationId);
    if (idx === -1) return false;
    this.data.webhooks[idx] = { ...this.data.webhooks[idx], ...updates };
    this.save();
    return true;
  }

  public deleteWebhook(id: string, organizationId: string): boolean {
    const idx = (this.data.webhooks || []).findIndex(w => w.id === id && w.organizationId === organizationId);
    if (idx === -1) return false;
    this.data.webhooks.splice(idx, 1);
    this.save();
    return true;
  }

  public listWebhookDeliveries(organizationId: string, webhookId?: string): WebhookDelivery[] {
    return (this.data.webhookDeliveries || [])
      .filter(d => d.organizationId === organizationId && (!webhookId || d.webhookId === webhookId))
      .slice(0, 50);
  }

  public createWebhookDelivery(delivery: WebhookDelivery): void {
    if (!this.data.webhookDeliveries) this.data.webhookDeliveries = [];
    this.data.webhookDeliveries.unshift(delivery);
    if (this.data.webhookDeliveries.length > 500) this.data.webhookDeliveries.pop();
    this.save();
  }

  // Developer API Logs
  public listApiLogs(organizationId?: string, limit: number = 100): ApiLogRecord[] {
    let logs = this.data.apiLogs || [];
    if (organizationId) logs = logs.filter(l => l.organizationId === organizationId);
    return logs.slice(0, limit);
  }

  public logApiRequest(log: ApiLogRecord): void {
    if (!this.data.apiLogs) this.data.apiLogs = [];
    this.data.apiLogs.unshift(log);
    if (this.data.apiLogs.length > 1000) this.data.apiLogs.pop();
    this.save();
  }

  // Billing & Subscriptions
  public getSubscription(organizationId: string): BillingSubscription {
    if (this.data.subscriptions && this.data.subscriptions[organizationId]) {
      return this.data.subscriptions[organizationId];
    }
    const defaultSub: BillingSubscription = {
      id: 'sub_' + organizationId,
      organizationId,
      plan: 'Growth',
      status: 'ACTIVE',
      currentPeriodStart: new Date(Date.now() - 10 * 86400000).toISOString(),
      currentPeriodEnd: new Date(Date.now() + 20 * 86400000).toISOString(),
      amountMonthlyUsd: 149,
      limits: {
        maxBusinesses: 5,
        maxLocations: 20,
        maxReviewsPerMonth: 2000,
        maxAiActionsPerMonth: 1000,
        maxSeoCrawlsPerMonth: 20,
        maxVisibilityScansPerMonth: 50,
        apiAccess: true,
        webhooksEnabled: true,
        prioritySupport: true
      }
    };
    if (!this.data.subscriptions) this.data.subscriptions = {};
    this.data.subscriptions[organizationId] = defaultSub;
    this.save();
    return defaultSub;
  }

  public saveSubscription(sub: BillingSubscription): void {
    if (!this.data.subscriptions) this.data.subscriptions = {};
    this.data.subscriptions[sub.organizationId] = sub;
    this.save();
  }

  public listInvoices(organizationId: string): BillingInvoice[] {
    return (this.data.invoices || []).filter(i => i.organizationId === organizationId);
  }

  // Global Search for Command Palette (Cmd + K)
  public globalSearch(query: string, businessId?: string) {
    const q = query.toLowerCase().trim();
    if (!q) return { businesses: [], locations: [], reviews: [], keywords: [], seoTasks: [], automations: [], reports: [] };

    const businesses = this.data.businesses.filter(b => b.name.toLowerCase().includes(q) || b.city.toLowerCase().includes(q));
    const locations = this.data.locations.filter(l => (!businessId || l.businessId === businessId) && (l.title.toLowerCase().includes(q) || l.locality.toLowerCase().includes(q)));
    const reviews = this.data.googleReviews.filter(r => (!businessId || r.businessId === businessId) && (r.reviewerName.toLowerCase().includes(q) || (r.comment && r.comment.toLowerCase().includes(q)))).slice(0, 5);
    const keywords = this.data.trackedKeywords.filter(k => (!businessId || k.businessId === businessId) && k.keyword.toLowerCase().includes(q)).slice(0, 5);
    const seoTasks = this.data.seoTasks.filter(t => (!businessId || t.businessId === businessId) && t.title.toLowerCase().includes(q)).slice(0, 5);
    const automations = (this.data.automationRules || []).filter(a => (!businessId || a.businessId === businessId) && a.name.toLowerCase().includes(q)).slice(0, 5);
    const reports = this.data.reports.filter(r => (!businessId || r.businessId === businessId) && r.title.toLowerCase().includes(q)).slice(0, 5);

    return {
      businesses: businesses.slice(0, 5),
      locations: locations.slice(0, 5),
      reviews,
      keywords,
      seoTasks,
      automations,
      reports
    };
  }

  // Multi-Tenant Seeding & Feature Flag Enforcement
  public ensureMultiTenantOrganizations(): void {
    const now = new Date().toISOString();

    // 1. Ensure Main Org (Atharv Electricals / Local Growth Media)
    if (this.data.organizations.some(o => o.id === 'org_main_001')) {
      if (!this.data.organizationStatuses['org_main_001']) {
        this.data.organizationStatuses['org_main_001'] = { status: 'ACTIVE', updatedAt: now };
      }
      if (!this.data.organizationOwners['org_main_001']) {
        this.data.organizationOwners['org_main_001'] = { name: 'Sai Chakankar', email: 'chakankarsai@gmail.com', phone: '+91 98220 14820' };
      }
      if (!this.data.organizationFeatures['org_main_001'] || this.data.organizationFeatures['org_main_001'].length === 0) {
        this.data.organizationFeatures['org_main_001'] = DEFAULT_FEATURES_CATALOG.map(f => ({
          ...f,
          lastChanged: new Date(Date.now() - 86400000 * 2).toISOString(),
          changedBy: 'Sai Chakankar (Super Admin)'
        }));
      }
      if (!this.data.reviewOnlineSettings['biz_001']) {
        this.data.reviewOnlineSettings['biz_001'] = {
          businessId: 'biz_001',
          slug: 'atharv-electricals',
          customHeading: 'How was your experience with Atharv Electricals?',
          subheading: 'Your feedback helps fellow local Pune contractors and businesses find reliable electrical supplies.',
          googleReviewUrl: 'https://search.google.com/local/writereview?placeid=ChIJW3P1zP_PwjsR_6Z-O9xT1k0',
          minStarForGoogle: 4,
          thankYouMessage: 'Thank you for choosing Atharv Electricals! Please take 15 seconds to share your experience on Google Maps.',
          negativeFeedbackTitle: 'We want to make this right',
          notifyOnNegative: true,
          notifyEmail: 'chakankarsai@gmail.com',
          notifyWhatsapp: '+91 98220 14820',
          promptChips: ['Prompt Delivery', 'Genuine ISI Certified', 'Industrial Switchgear', 'Helpful Staff', 'Fair Pricing', 'Licensed Team'],
          showGoogleLogo: true
        };
      }
      if (!this.data.nfcCards['biz_001'] || this.data.nfcCards['biz_001'].length === 0) {
        this.data.nfcCards['biz_001'] = [
          {
            id: 'nfc_001',
            businessId: 'biz_001',
            locationId: 'loc_001',
            cardUid: '04:A2:8F:7C:9B:10:80',
            title: 'Main Checkout Counter Stand',
            assignedStaff: 'Ramesh Pawar (Billing Desk 1)',
            status: 'ACTIVE',
            directUrl: 'https://review.localos.ai/r/atharv-electricals?nfc=counter_01',
            totalTaps: 142,
            googleConversions: 98,
            privateFeedbackConversions: 4,
            deviceStats: { android: 96, ios: 46 },
            lastTappedAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
            createdAt: new Date(Date.now() - 86400000 * 30).toISOString()
          },
          {
            id: 'nfc_002',
            businessId: 'biz_001',
            locationId: 'loc_001',
            cardUid: '04:B3:91:2E:8D:21:84',
            title: 'Contractor Order Dispatch Desk',
            assignedStaff: 'Sanjay Shinde (Dispatch Lead)',
            status: 'ACTIVE',
            directUrl: 'https://review.localos.ai/r/atharv-electricals?nfc=dispatch_02',
            totalTaps: 89,
            googleConversions: 64,
            privateFeedbackConversions: 2,
            deviceStats: { android: 68, ios: 21 },
            lastTappedAt: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
            createdAt: new Date(Date.now() - 86400000 * 20).toISOString()
          },
          {
            id: 'nfc_003',
            businessId: 'biz_001',
            locationId: 'loc_002',
            cardUid: '04:C5:34:6A:11:42:90',
            title: 'Bhosari Showroom Tabletop Puck',
            assignedStaff: 'Mahesh Joshi',
            status: 'ACTIVE',
            directUrl: 'https://review.localos.ai/r/atharv-electricals?nfc=bhosari_01',
            totalTaps: 64,
            googleConversions: 41,
            privateFeedbackConversions: 1,
            deviceStats: { android: 45, ios: 19 },
            lastTappedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
            createdAt: new Date(Date.now() - 86400000 * 14).toISOString()
          },
          {
            id: 'nfc_004',
            businessId: 'biz_001',
            locationId: 'loc_001',
            cardUid: '04:D8:19:9C:55:33:77',
            title: 'Unassigned Reserve NFC Card (Card #4)',
            assignedStaff: 'Unassigned',
            status: 'UNASSIGNED',
            directUrl: 'https://review.localos.ai/r/atharv-electricals?nfc=reserve_04',
            totalTaps: 0,
            googleConversions: 0,
            privateFeedbackConversions: 0,
            deviceStats: { android: 0, ios: 0 },
            createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
          }
        ];
      }
    }

    // 2. Seed additional multi-tenant organizations if not present
    const additionalTenants = [
      {
        org: { id: 'org_002', name: 'Apex Healthcare Group', slug: 'apex-healthcare', plan: 'Enterprise' as const, createdAt: new Date(Date.now() - 86400000 * 60).toISOString() },
        owner: { name: 'Dr. Vikram Malhotra', email: 'vikram@apexcare.in', phone: '+91 98231 55432' },
        status: { status: 'ACTIVE' as const, updatedAt: now },
        sub: {
          id: 'sub_org_002', organizationId: 'org_002', plan: 'Enterprise' as const, status: 'ACTIVE' as const,
          currentPeriodStart: new Date(Date.now() - 86400000 * 15).toISOString(),
          currentPeriodEnd: new Date('2026-11-15T00:00:00Z').toISOString(),
          amountMonthlyUsd: 499,
          limits: { maxBusinesses: 20, maxLocations: 100, maxReviewsPerMonth: 10000, maxAiActionsPerMonth: 5000, maxSeoCrawlsPerMonth: 100, maxVisibilityScansPerMonth: 200, apiAccess: true, webhooksEnabled: true, prioritySupport: true }
        },
        business: {
          id: 'biz_002', organizationId: 'org_002', name: 'Apex Diagnostics & Family Care', slug: 'apex-diagnostics', category: 'Medical Center',
          country: 'India', city: 'Pune', address: 'Baner Rd, Aundh, Pune', reviewTone: 'Warm' as const,
          autoReplyEnabled: true, autoReplyMinRating: 4, experienceChips: ['Compassionate Doctors', 'Accurate Reports', 'Short Waiting Time'],
          createdAt: new Date(Date.now() - 86400000 * 60).toISOString()
        },
        locationsCount: 4,
        usersCount: 8,
        googleConnected: true
      },
      {
        org: { id: 'org_003', name: 'Pinnacle Dining Group', slug: 'pinnacle-dining', plan: 'Growth' as const, createdAt: new Date(Date.now() - 86400000 * 14).toISOString() },
        owner: { name: 'Ananya Sharma', email: 'ananya@saffronspice.com', phone: '+91 97654 32109' },
        status: { status: 'TRIAL' as const, reason: '14-Day Free Trial (Expires 12 Oct 2026)', updatedAt: now },
        sub: {
          id: 'sub_org_003', organizationId: 'org_003', plan: 'Growth' as const, status: 'TRIALING' as const,
          currentPeriodStart: new Date(Date.now() - 86400000 * 10).toISOString(),
          currentPeriodEnd: new Date('2026-10-12T00:00:00Z').toISOString(),
          amountMonthlyUsd: 149,
          limits: { maxBusinesses: 5, maxLocations: 20, maxReviewsPerMonth: 2000, maxAiActionsPerMonth: 1000, maxSeoCrawlsPerMonth: 20, maxVisibilityScansPerMonth: 50, apiAccess: true, webhooksEnabled: true, prioritySupport: true }
        },
        business: {
          id: 'biz_003', organizationId: 'org_003', name: 'Saffron Spice Bistro', slug: 'saffron-spice-bistro', category: 'Fine Dining Restaurant',
          country: 'India', city: 'Pune', address: 'Lane 7, Koregaon Park, Pune', reviewTone: 'Luxury' as const,
          autoReplyEnabled: true, autoReplyMinRating: 5, experienceChips: ['Exquisite Flavors', 'Great Ambience', 'Attentive Service'],
          createdAt: new Date(Date.now() - 86400000 * 14).toISOString()
        },
        locationsCount: 1,
        usersCount: 3,
        googleConnected: true
      },
      {
        org: { id: 'org_004', name: 'AutoTech Express Hub', slug: 'autotech-express', plan: 'Starter' as const, createdAt: new Date(Date.now() - 86400000 * 90).toISOString() },
        owner: { name: 'Rajesh Patil', email: 'rajesh@autotechmotors.in', phone: '+91 94220 99881' },
        status: { status: 'PAYMENT_FAILED' as const, reason: 'Card declined on renewal - 2nd retry pending', updatedAt: now },
        sub: {
          id: 'sub_org_004', organizationId: 'org_004', plan: 'Starter' as const, status: 'PAST_DUE' as const,
          currentPeriodStart: new Date('2026-08-20T00:00:00Z').toISOString(),
          currentPeriodEnd: new Date('2026-09-20T00:00:00Z').toISOString(),
          amountMonthlyUsd: 49,
          limits: { maxBusinesses: 1, maxLocations: 3, maxReviewsPerMonth: 500, maxAiActionsPerMonth: 200, maxSeoCrawlsPerMonth: 5, maxVisibilityScansPerMonth: 10, apiAccess: false, webhooksEnabled: false, prioritySupport: false }
        },
        business: {
          id: 'biz_004', organizationId: 'org_004', name: 'AutoTech Multi-Brand Motors', slug: 'autotech-motors', category: 'Car Repair & Service',
          country: 'India', city: 'Pune', address: 'Old Mumbai-Pune Hwy, PCMC', reviewTone: 'Friendly' as const,
          autoReplyEnabled: false, autoReplyMinRating: 4, experienceChips: ['Genuine Spare Parts', 'Transparent Estimate', 'On-Time Delivery'],
          createdAt: new Date(Date.now() - 86400000 * 90).toISOString()
        },
        locationsCount: 1,
        usersCount: 2,
        googleConnected: true
      },
      {
        org: { id: 'org_005', name: 'Zenith Fitness & Wellness', slug: 'zenith-fitness', plan: 'Starter' as const, createdAt: new Date(Date.now() - 86400000 * 120).toISOString() },
        owner: { name: 'Rohan Kulkarni', email: 'rohan@zenithfitness.com', phone: '+91 99221 44556' },
        status: { status: 'SUSPENDED' as const, reason: 'Account suspended by Super Admin due to Terms violation investigation', updatedAt: now },
        sub: {
          id: 'sub_org_005', organizationId: 'org_005', plan: 'Starter' as const, status: 'CANCELED' as const,
          currentPeriodStart: new Date('2026-08-01T00:00:00Z').toISOString(),
          currentPeriodEnd: new Date('2026-09-01T00:00:00Z').toISOString(),
          amountMonthlyUsd: 49,
          limits: { maxBusinesses: 1, maxLocations: 3, maxReviewsPerMonth: 500, maxAiActionsPerMonth: 200, maxSeoCrawlsPerMonth: 5, maxVisibilityScansPerMonth: 10, apiAccess: false, webhooksEnabled: false, prioritySupport: false }
        },
        business: {
          id: 'biz_005', organizationId: 'org_005', name: 'Zenith Crossfit & Gym', slug: 'zenith-crossfit', category: 'Fitness Center',
          country: 'India', city: 'Pune', address: 'FC Road, Shivaji Nagar, Pune', reviewTone: 'Warm' as const,
          autoReplyEnabled: false, autoReplyMinRating: 4, experienceChips: ['Certified Trainers', 'Top Equipment', 'Clean Locker Rooms'],
          createdAt: new Date(Date.now() - 86400000 * 120).toISOString()
        },
        locationsCount: 1,
        usersCount: 2,
        googleConnected: false
      },
      {
        org: { id: 'org_006', name: 'Metro Retail Enterprises', slug: 'metro-retail', plan: 'Growth' as const, createdAt: new Date(Date.now() - 86400000 * 150).toISOString() },
        owner: { name: 'Sangeeta Gupta', email: 'contact@metrosupermart.in', phone: '+91 98223 77112' },
        status: { status: 'EXPIRED' as const, reason: 'Subscription period ended without auto-renewal', updatedAt: now },
        sub: {
          id: 'sub_org_006', organizationId: 'org_006', plan: 'Growth' as const, status: 'CANCELED' as const,
          currentPeriodStart: new Date('2026-07-15T00:00:00Z').toISOString(),
          currentPeriodEnd: new Date('2026-08-15T00:00:00Z').toISOString(),
          amountMonthlyUsd: 149,
          limits: { maxBusinesses: 5, maxLocations: 20, maxReviewsPerMonth: 2000, maxAiActionsPerMonth: 1000, maxSeoCrawlsPerMonth: 20, maxVisibilityScansPerMonth: 50, apiAccess: true, webhooksEnabled: true, prioritySupport: true }
        },
        business: {
          id: 'biz_006', organizationId: 'org_006', name: 'Metro Supermart', slug: 'metro-supermart', category: 'Supermarket',
          country: 'India', city: 'Pune', address: 'MG Road, Camp, Pune', reviewTone: 'Professional' as const,
          autoReplyEnabled: false, autoReplyMinRating: 4, experienceChips: ['Wide Variety', 'Fresh Groceries', 'Fast Checkout'],
          createdAt: new Date(Date.now() - 86400000 * 150).toISOString()
        },
        locationsCount: 2,
        usersCount: 4,
        googleConnected: false
      }
    ];

    for (const t of additionalTenants) {
      if (!this.data.organizations.some(o => o.id === t.org.id)) {
        this.data.organizations.push(t.org);
        this.data.organizationStatuses[t.org.id] = t.status;
        this.data.organizationOwners[t.org.id] = t.owner;
        this.data.subscriptions[t.org.id] = t.sub;
        this.data.businesses.push(t.business);

        // Feature flags
        this.data.organizationFeatures[t.org.id] = DEFAULT_FEATURES_CATALOG.map(f => {
          // Adjust a couple features based on plan/status
          let enabled = f.enabled;
          if (t.org.plan === 'Starter' && (f.category === 'API' || f.category === 'AGENCY' || f.key === 'advanced_analytics')) {
            enabled = false;
          }
          if (t.status.status === 'SUSPENDED') {
            enabled = false;
          }
          return {
            ...f,
            enabled,
            lastChanged: t.org.createdAt,
            changedBy: 'Super Admin System'
          };
        });

        // Seed location
        this.data.locations.push({
          id: 'loc_' + t.org.id,
          businessId: t.business.id,
          title: `${t.business.name} - Main Location`,
          addressLines: [t.business.address || 'Central Pune'],
          locality: t.business.city,
          administrativeArea: 'Maharashtra',
          postalCode: '411001',
          status: 'OPEN',
          primaryCategory: t.business.category
        });

        // Google integration
        this.data.googleIntegrations.push({
          id: 'int_' + t.org.id,
          organizationId: t.org.id,
          businessId: t.business.id,
          status: t.googleConnected ? 'connected' : 'disconnected'
        });
      }
    }
  }

  // Feature Flags API for Super Admin
  public getOrganizationFeatures(organizationId: string): FeatureDefinition[] {
    if (!this.data.organizationFeatures[organizationId] || this.data.organizationFeatures[organizationId].length === 0) {
      this.data.organizationFeatures[organizationId] = DEFAULT_FEATURES_CATALOG.map(f => ({
        ...f,
        lastChanged: new Date().toISOString(),
        changedBy: 'System Default'
      }));
      this.save();
    }
    return this.data.organizationFeatures[organizationId];
  }

  public updateOrganizationFeature(
    organizationId: string,
    featureKey: string,
    enabled: boolean,
    changedBy: string
  ): { success: boolean; features: FeatureDefinition[]; error?: string; autoDisabled?: string[] } {
    let features = this.getOrganizationFeatures(organizationId);
    const target = features.find(f => f.key === featureKey);
    if (!target) {
      return { success: false, features, error: `Feature "${featureKey}" was not found.` };
    }

    // 1. Dependency validation on enable
    if (enabled && target.requires && target.requires.length > 0) {
      for (const reqKey of target.requires) {
        const parent = features.find(f => f.key === reqKey);
        if (!parent || !parent.enabled) {
          return {
            success: false,
            features,
            error: `Cannot enable "${target.name}". It requires "${parent?.name || reqKey}" to be enabled first.`
          };
        }
      }
    }

    // 2. Cascade disable any dependent child features
    const autoDisabled: string[] = [];
    if (!enabled) {
      const disableDependents = (key: string) => {
        for (const feat of features) {
          if (feat.requires && feat.requires.includes(key) && feat.enabled) {
            feat.enabled = false;
            feat.lastChanged = new Date().toISOString();
            feat.changedBy = `${changedBy} (Dependency cascade)`;
            autoDisabled.push(feat.name);
            disableDependents(feat.key);
          }
        }
      };
      disableDependents(featureKey);
    }

    target.enabled = enabled;
    target.lastChanged = new Date().toISOString();
    target.changedBy = changedBy;

    this.data.organizationFeatures[organizationId] = features;
    this.save();

    this.logAudit({
      organizationId,
      userId: 'usr_admin_001',
      userEmail: changedBy,
      action: enabled ? 'FEATURE_ENABLED' : 'FEATURE_DISABLED',
      status: 'SUCCESS',
      details: { featureKey, featureName: target.name, autoDisabled }
    });

    return { success: true, features, autoDisabled };
  }

  public updateOrganizationStatus(
    organizationId: string,
    status: 'ACTIVE' | 'TRIAL' | 'EXPIRED' | 'SUSPENDED' | 'PAYMENT_FAILED',
    reason?: string,
    adminEmail: string = 'chakankarsai@gmail.com'
  ): boolean {
    this.data.organizationStatuses[organizationId] = {
      status,
      reason,
      updatedAt: new Date().toISOString()
    };

    // Update subscription status if appropriate
    if (this.data.subscriptions[organizationId]) {
      if (status === 'ACTIVE') this.data.subscriptions[organizationId].status = 'ACTIVE';
      else if (status === 'TRIAL') this.data.subscriptions[organizationId].status = 'TRIALING';
      else if (status === 'PAYMENT_FAILED') this.data.subscriptions[organizationId].status = 'PAST_DUE';
      else if (status === 'SUSPENDED' || status === 'EXPIRED') this.data.subscriptions[organizationId].status = 'CANCELED';
    }

    this.logAudit({
      organizationId,
      userId: 'usr_admin_001',
      userEmail: adminEmail,
      action: `ORGANIZATION_STATUS_${status}`,
      status: 'SUCCESS',
      details: { newStatus: status, reason }
    });

    this.save();
    return true;
  }

  // Super Admin Operational Directory
  public getAllOrganizationsAdmin() {
    return this.data.organizations.map(org => {
      const owner = this.data.organizationOwners[org.id] || { name: 'Owner', email: 'owner@' + org.slug + '.com', phone: '+91 98000 00000' };
      const statusObj = this.data.organizationStatuses[org.id] || { status: 'ACTIVE', updatedAt: org.createdAt };
      const sub = this.data.subscriptions[org.id] || {
        plan: org.plan,
        status: statusObj.status,
        currentPeriodEnd: '2026-10-28T00:00:00Z'
      };
      const businesses = this.data.businesses.filter(b => b.organizationId === org.id);
      const locations = this.data.locations.filter(l => businesses.some(b => b.id === l.businessId));
      const googleInt = this.data.googleIntegrations.find(g => g.organizationId === org.id);
      const features = this.getOrganizationFeatures(org.id);
      const enabledCount = features.filter(f => f.enabled).length;

      return {
        id: org.id,
        name: org.name,
        slug: org.slug,
        owner,
        plan: sub.plan,
        businessName: businesses[0]?.name || org.name,
        locationCount: locations.length || 1,
        userCount: org.id === 'org_main_001' ? 5 : org.id === 'org_002' ? 8 : 2,
        googleStatus: googleInt?.status === 'connected' ? 'Connected' : 'Disconnected',
        subscription: {
          plan: sub.plan,
          status: sub.status,
          validUntil: sub.currentPeriodEnd
        },
        featureStatus: `${enabledCount}/${features.length} Features Active`,
        accountStatus: statusObj.status,
        reason: statusObj.reason,
        createdAt: org.createdAt
      };
    });
  }

  // Super Admin Customer Detail View (14 Tabs)
  public getOrganizationAdminDetail(organizationId: string) {
    const org = this.data.organizations.find(o => o.id === organizationId);
    if (!org) return null;

    const owner = this.data.organizationOwners[org.id] || { name: 'Sai Chakankar', email: 'chakankarsai@gmail.com', phone: '+91 98220 14820' };
    const statusObj = this.data.organizationStatuses[org.id] || { status: 'ACTIVE', updatedAt: org.createdAt };
    const sub = this.getSubscription(org.id);
    const businesses = this.data.businesses.filter(b => b.organizationId === org.id);
    const primaryBiz = businesses[0] || this.data.businesses[0];
    const locations = this.data.locations.filter(l => businesses.some(b => b.id === l.businessId));
    const googleInt = this.data.googleIntegrations.find(g => g.organizationId === org.id);
    const features = this.getOrganizationFeatures(org.id);
    const reviews = this.listReviews(primaryBiz?.id || 'biz_001');
    const nfcCards = this.listNfcCards(primaryBiz?.id || 'biz_001');
    const reviewSettings = this.getReviewOnlineSettings(primaryBiz?.id || 'biz_001');
    const automations = this.listAutomationRules(primaryBiz?.id || 'biz_001');
    const invoices = this.listInvoices(org.id);
    const auditLogs = this.listAuditLogs(org.id);
    const apiKeys = this.listApiKeys(org.id);
    const webhooks = this.listWebhooks(org.id);
    const notifications = this.listNotifications(org.id);

    return {
      header: {
        id: org.id,
        businessName: primaryBiz?.name || org.name,
        organizationName: org.name,
        slug: org.slug,
        status: statusObj.status,
        statusReason: statusObj.reason,
        plan: sub.plan,
        subscriptionValidUntil: sub.currentPeriodEnd,
        googleConnected: googleInt?.status === 'connected',
        locationsCount: locations.length,
        usersCount: org.id === 'org_main_001' ? 5 : org.id === 'org_002' ? 8 : 2,
        owner
      },
      tabs: {
        overview: {
          org,
          primaryBusiness: primaryBiz,
          healthScore: 94,
          lastActiveAt: new Date().toISOString()
        },
        features,
        locations,
        google: {
          integration: googleInt,
          accountId: 'accounts/11492049182390192',
          syncedLocations: locations.length,
          lastSyncTime: new Date().toISOString(),
          scopes: ['https://www.googleapis.com/auth/business.manage']
        },
        reviews: {
          items: reviews,
          total: reviews.length,
          averageRating: 4.8,
          repliedCount: reviews.filter(r => r.replyComment).length
        },
        reviewOnline: {
          settings: reviewSettings,
          nfcCards,
          analytics: this.getReviewOnlineAnalytics(primaryBiz?.id || 'biz_001')
        },
        automations: {
          rules: automations,
          runs: this.listAutomationRuns(primaryBiz?.id || 'biz_001', 10),
          approvals: this.listAutomationApprovals(primaryBiz?.id || 'biz_001')
        },
        subscription: sub,
        payments: invoices,
        notifications,
        usage: {
          apiRequests: 1420,
          aiTokens: 38200,
          seoCrawls: 6,
          visibilityScans: 18,
          nfcTaps: nfcCards.reduce((acc, c) => acc + c.totalTaps, 0)
        },
        api: {
          apiKeys,
          webhooks
        },
        auditLogs,
        support: [
          {
            id: 'TCK-8921',
            subject: 'Google Cloud Pub/Sub webhook setup assistance',
            status: 'OPEN',
            priority: 'HIGH',
            createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
          },
          {
            id: 'TCK-8840',
            subject: 'Additional NFC tabletop pucks bulk order delivery',
            status: 'RESOLVED',
            priority: 'MEDIUM',
            createdAt: new Date(Date.now() - 86400000 * 6).toISOString()
          }
        ]
      }
    };
  }

  // Super Admin Operational Metrics
  public getAdminOperationalMetrics() {
    const allOrgs = this.getAllOrganizationsAdmin();
    const activeOrgs = allOrgs.filter(o => o.accountStatus === 'ACTIVE').length;
    const trialOrgs = allOrgs.filter(o => o.accountStatus === 'TRIAL').length;
    const expiredOrgs = allOrgs.filter(o => o.accountStatus === 'EXPIRED').length;
    const suspendedOrgs = allOrgs.filter(o => o.accountStatus === 'SUSPENDED').length;
    const paymentFailedOrgs = allOrgs.filter(o => o.accountStatus === 'PAYMENT_FAILED').length;

    const connectedGoogleLocations = allOrgs.reduce((acc, o) => {
      return o.googleStatus === 'Connected' ? acc + o.locationCount : acc;
    }, 0);

    const activeAutomations = (this.data.automationRules || []).filter(r => r.enabled).length;
    const failedAutomations = (this.data.automationRuns || []).filter(r => r.status === 'FAILED').length;

    return {
      totalOrganizations: allOrgs.length,
      activeOrganizations: activeOrgs,
      trialOrganizations: trialOrgs,
      expiredOrganizations: expiredOrgs,
      suspendedOrganizations: suspendedOrgs,
      connectedGoogleLocations,
      activeAutomations: activeAutomations || 12,
      failedAutomations: failedAutomations,
      pendingPayments: paymentFailedOrgs,
      apiHealth: 'HEALTHY',
      systemAlerts: [
        { id: 'alt_1', level: 'WARNING', title: 'Card renewal past due', org: 'AutoTech Express Hub', time: '2 hours ago' },
        { id: 'alt_2', level: 'CRITICAL', title: 'Account suspended for policy audit', org: 'Zenith Fitness & Wellness', time: '1 day ago' },
        { id: 'alt_3', level: 'INFO', title: 'Google Business Profile continuous sync completed across 8 locations', time: '12 mins ago' }
      ]
    };
  }

  // Review Online & NFC Implementation
  public getReviewOnlineSettings(businessId: string): ReviewOnlineSettings {
    if (this.data.reviewOnlineSettings[businessId]) {
      return this.data.reviewOnlineSettings[businessId];
    }
    const biz = this.getBusiness(businessId);
    const settings: ReviewOnlineSettings = {
      businessId,
      slug: biz?.slug || 'atharv-electricals',
      customHeading: `How was your experience with ${biz?.name || 'our team'}?`,
      subheading: 'Your honest feedback helps us serve our community better and maintain strict quality standards.',
      googleReviewUrl: biz?.googleReviewUrl || 'https://search.google.com/local/writereview?placeid=ChIJW3P1zP_PwjsR_6Z-O9xT1k0',
      minStarForGoogle: 4,
      thankYouMessage: 'Thank you for your business! Please take 15 seconds to leave a quick Google review.',
      negativeFeedbackTitle: 'We want to make this right',
      notifyOnNegative: true,
      notifyEmail: 'chakankarsai@gmail.com',
      notifyWhatsapp: biz?.phone || '+91 98220 14820',
      promptChips: biz?.experienceChips || ['Quick Service', 'Helpful Staff', 'Fair Pricing', 'Quality Equipment'],
      showGoogleLogo: true
    };
    this.data.reviewOnlineSettings[businessId] = settings;
    this.save();
    return settings;
  }

  public saveReviewOnlineSettings(settings: ReviewOnlineSettings): ReviewOnlineSettings {
    this.data.reviewOnlineSettings[settings.businessId] = settings;
    // Keep business slug in sync
    const biz = this.getBusiness(settings.businessId);
    if (biz && settings.slug && settings.slug !== biz.slug) {
      biz.slug = settings.slug;
    }
    this.save();
    return settings;
  }

  public listNfcCards(businessId: string): NfcCard[] {
    return this.data.nfcCards[businessId] || [];
  }

  public createNfcCard(card: Omit<NfcCard, 'id' | 'createdAt'>): NfcCard {
    if (!this.data.nfcCards[card.businessId]) {
      this.data.nfcCards[card.businessId] = [];
    }
    const newCard: NfcCard = {
      ...card,
      id: 'nfc_' + crypto.randomUUID().slice(0, 8),
      createdAt: new Date().toISOString()
    };
    this.data.nfcCards[card.businessId].push(newCard);
    this.save();
    return newCard;
  }

  public updateNfcCard(id: string, updates: Partial<NfcCard>): NfcCard | undefined {
    for (const bizId in this.data.nfcCards) {
      const idx = this.data.nfcCards[bizId].findIndex(c => c.id === id);
      if (idx >= 0) {
        this.data.nfcCards[bizId][idx] = { ...this.data.nfcCards[bizId][idx], ...updates };
        this.save();
        return this.data.nfcCards[bizId][idx];
      }
    }
    return undefined;
  }

  public deleteNfcCard(id: string): boolean {
    for (const bizId in this.data.nfcCards) {
      const before = this.data.nfcCards[bizId].length;
      this.data.nfcCards[bizId] = this.data.nfcCards[bizId].filter(c => c.id !== id);
      if (this.data.nfcCards[bizId].length < before) {
        this.save();
        return true;
      }
    }
    return false;
  }

  public logReviewEvent(event: { businessSlug: string; eventType: string; metadata?: any }): void {
    if (!this.data.reviewEvents) this.data.reviewEvents = [];
    this.data.reviewEvents.unshift({
      id: 'rev_evt_' + crypto.randomUUID().slice(0, 8),
      businessSlug: event.businessSlug,
      eventType: event.eventType,
      metadata: event.metadata,
      timestamp: new Date().toISOString()
    });
    if (this.data.reviewEvents.length > 2000) this.data.reviewEvents.pop();

    // If an NFC card tag was tapped, increment tap count
    if (event.metadata?.nfcTagId) {
      for (const bizId in this.data.nfcCards) {
        const card = this.data.nfcCards[bizId].find(c => c.id === event.metadata.nfcTagId || c.cardUid === event.metadata.nfcTagId);
        if (card) {
          card.totalTaps += 1;
          card.lastTappedAt = new Date().toISOString();
          if (event.metadata?.deviceOs === 'ios') {
            if (!card.deviceStats) card.deviceStats = { android: 0, ios: 0 };
            card.deviceStats.ios += 1;
          } else {
            if (!card.deviceStats) card.deviceStats = { android: 0, ios: 0 };
            card.deviceStats.android += 1;
          }
          if (event.eventType === 'GOOGLE_REDIRECT') {
            card.googleConversions += 1;
          } else if (event.eventType === 'PRIVATE_FEEDBACK_SUBMITTED') {
            card.privateFeedbackConversions += 1;
          }
        }
      }
    }
    this.save();
  }

  public getReviewOnlineAnalytics(businessId: string) {
    const biz = this.getBusiness(businessId);
    const slug = biz?.slug || 'atharv-electricals';
    const nfcCards = this.listNfcCards(businessId);
    const totalNfcTaps = nfcCards.reduce((acc, c) => acc + c.totalTaps, 0);
    const totalGoogleConversions = nfcCards.reduce((acc, c) => acc + c.googleConversions, 0);
    const totalPrivateFeedbacks = nfcCards.reduce((acc, c) => acc + c.privateFeedbackConversions, 0);

    const events = (this.data.reviewEvents || []).filter(e => e.businessSlug === slug);
    const qrScans = events.filter(e => e.eventType === 'QR_OPENED').length + 84;
    const totalVisits = qrScans + totalNfcTaps;
    const directGoogleClicks = totalGoogleConversions + events.filter(e => e.eventType === 'GOOGLE_REDIRECT').length + 62;
    const feedbackCaptured = totalPrivateFeedbacks + this.listPrivateFeedback(businessId).length;

    const conversionRate = totalVisits > 0 ? ((directGoogleClicks / totalVisits) * 100).toFixed(1) : '68.5';

    return {
      totalVisits,
      qrScans,
      nfcTaps: totalNfcTaps,
      directGoogleClicks,
      feedbackCaptured,
      conversionRate: `${conversionRate}%`,
      deviceOsBreakdown: {
        android: nfcCards.reduce((acc, c) => acc + (c.deviceStats?.android || 0), 0) + 120,
        ios: nfcCards.reduce((acc, c) => acc + (c.deviceStats?.ios || 0), 0) + 54
      }
    };
  }

  // -------------------------------------------------------------
  // Google Review QR SaaS Engine & Analytics
  // -------------------------------------------------------------

  private ensureSaasSetup() {
    // 1. Subscription Plans (Free Launch active, paid tiers Coming Soon)
    if (this.data.subscriptionPlans.length === 0) {
      this.data.subscriptionPlans = [
        {
          id: 'plan_free',
          name: 'FREE',
          displayName: 'Free Launch',
          priceMonthly: 0,
          currency: 'USD',
          status: 'ACTIVE',
          maxActiveQrCodes: 1,
          features: [
            'One business profile',
            '1 active Google Review QR code',
            'Direct Google review redirection',
            'Basic scan analytics & metrics',
            'High-resolution PNG download',
            'Real-time business dashboard'
          ]
        },
        {
          id: 'plan_starter',
          name: 'STARTER',
          displayName: 'Starter Tier',
          priceMonthly: 19,
          currency: 'USD',
          status: 'COMING_SOON',
          maxActiveQrCodes: 5,
          features: [
            'Up to 5 active QR codes',
            'Advanced scan analytics & trends',
            'Print-quality SVG vector export',
            'Ready-to-print PDF templates (Stands, Tents, Posters)',
            'QR placement comparison',
            'Extended 90-day analytics history'
          ]
        },
        {
          id: 'plan_growth',
          name: 'GROWTH',
          displayName: 'Growth Tier',
          priceMonthly: 49,
          currency: 'USD',
          status: 'COMING_SOON',
          maxActiveQrCodes: 20,
          features: [
            'Up to 20 active QR codes',
            'Authorized Google Business Profile OAuth integration',
            'Real-time review monitoring',
            'AI-assisted review response workflow',
            'Advanced conversion reports',
            'Multiple physical business locations'
          ]
        },
        {
          id: 'plan_pro',
          name: 'PRO',
          displayName: 'Pro Tier',
          priceMonthly: 99,
          currency: 'USD',
          status: 'COMING_SOON',
          maxActiveQrCodes: 999,
          features: [
            'Unlimited active QR codes',
            'Multi-branch franchise management',
            'Team & staff role-based access',
            'Advanced webhook & API integrations',
            'Automated monthly reputation reports',
            'Dedicated account manager'
          ]
        }
      ];
    }

    // 2. Default Business (Atharv Electricals - biz_001) Subscription
    const defaultBizId = 'biz_001';
    if (!this.data.saasSubscriptions[defaultBizId]) {
      this.data.saasSubscriptions[defaultBizId] = {
        id: 'sub_biz_001',
        businessId: defaultBizId,
        planId: 'plan_free',
        status: 'ACTIVE',
        maxActiveQrCodes: 1,
        currentPeriodStart: new Date(Date.now() - 30 * 86400000).toISOString(),
        currentPeriodEnd: undefined, // Free lifetime
        createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
        updatedAt: new Date().toISOString()
      };
    }

    // 3. Default Business Google Profile Status
    if (!this.data.googleBusinessProfiles[defaultBizId]) {
      this.data.googleBusinessProfiles[defaultBizId] = {
        id: 'gbp_biz_001',
        businessId: defaultBizId,
        placeId: 'ChIJ_AtharvPlaceId',
        displayName: 'Atharv Electricals',
        overallRating: 4.8,
        totalReviewCount: 128,
        isConnected: false, // Explicitly not connected by default to adhere to prompt Section 8
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }

    // 4. Default QR Codes for default business
    const existingQrs = this.data.qrCodes.filter(q => q.businessId === defaultBizId);
    if (existingQrs.length === 0) {
      const now = Date.now();
      const activeQr: QrCode = {
        id: 'qr_ath_01',
        businessId: defaultBizId,
        name: 'Main Billing Counter Stand',
        code: 'ath-counter',
        destinationUrl: 'https://search.google.com/local/writereview?placeid=ChIJ_AtharvPlaceId',
        status: 'ACTIVE',
        placement: 'Counter',
        totalScans: 84,
        uniqueScans: 72,
        lastScannedAt: new Date(now - 14 * 60000).toISOString(), // 14 mins ago
        createdAt: new Date(now - 28 * 86400000).toISOString(),
        updatedAt: new Date(now - 14 * 60000).toISOString()
      };

      const pausedQr: QrCode = {
        id: 'qr_ath_02',
        businessId: defaultBizId,
        name: 'Customer Waiting Lounge',
        code: 'ath-lounge',
        destinationUrl: 'https://search.google.com/local/writereview?placeid=ChIJ_AtharvPlaceId',
        status: 'PAUSED',
        placement: 'Table Stand',
        totalScans: 23,
        uniqueScans: 21,
        lastScannedAt: new Date(now - 3 * 86400000).toISOString(),
        createdAt: new Date(now - 25 * 86400000).toISOString(),
        updatedAt: new Date(now - 2 * 86400000).toISOString()
      };

      this.data.qrCodes.push(activeQr, pausedQr);

      // Seed realistic scan events over the past 30 days
      const cities = ['Pune', 'Chakan', 'Pimpri-Chinchwad', 'Talegaon', 'Bhosari', 'Mumbai'];
      const devices: Array<'mobile' | 'tablet' | 'desktop'> = ['mobile', 'mobile', 'mobile', 'mobile', 'tablet', 'desktop'];
      const browsers = ['Safari Mobile', 'Chrome Mobile', 'Samsung Internet', 'Firefox Mobile'];
      const oss = ['iOS 18.2', 'Android 15', 'Android 14', 'iOS 17.6'];

      // Generate scans today
      for (let i = 0; i < 7; i++) {
        const timeAgoMins = 14 + i * 45;
        this.data.qrScanEvents.push({
          id: `scan_today_${i}`,
          qrCodeId: activeQr.id,
          businessId: defaultBizId,
          code: activeQr.code,
          scannedAt: new Date(now - timeAgoMins * 60000).toISOString(),
          deviceType: devices[i % devices.length],
          os: oss[i % oss.length],
          browser: browsers[i % browsers.length],
          ipHash: crypto.createHash('sha256').update(`ip_today_${i}_salt`).digest('hex'),
          city: cities[i % cities.length],
          country: 'India',
          referrer: 'QR Scanner / Camera',
          redirectUrl: activeQr.destinationUrl
        });
      }

      // Generate scans across the last 28 days
      for (let day = 1; day <= 28; day++) {
        const countThisDay = Math.floor(2 + Math.sin(day * 0.4) * 2 + (day % 3));
        for (let j = 0; j < countThisDay; j++) {
          const scanTime = new Date(now - day * 86400000 + j * 3600000).toISOString();
          const isLounge = day > 10 && day < 25 && j % 3 === 0;
          const targetQr = isLounge ? pausedQr : activeQr;

          this.data.qrScanEvents.push({
            id: `scan_${day}_${j}`,
            qrCodeId: targetQr.id,
            businessId: defaultBizId,
            code: targetQr.code,
            scannedAt: scanTime,
            deviceType: devices[(day + j) % devices.length],
            os: oss[(day + j) % oss.length],
            browser: browsers[(day + j) % browsers.length],
            ipHash: crypto.createHash('sha256').update(`ip_${day}_${j}_salt`).digest('hex'),
            city: cities[(day + j) % cities.length],
            country: 'India',
            referrer: 'QR Scanner / Camera',
            redirectUrl: targetQr.destinationUrl
          });
        }
      }
    }
  }

  // --- QR Code CRUD ---

  public listQrCodes(businessId: string): QrCode[] {
    return (this.data.qrCodes || []).filter(q => q.businessId === businessId);
  }

  public getQrCode(id: string): QrCode | undefined {
    return (this.data.qrCodes || []).find(q => q.id === id);
  }

  public getQrCodeByCode(code: string): QrCode | undefined {
    return (this.data.qrCodes || []).find(q => q.code.toLowerCase() === code.toLowerCase().trim());
  }

  public createQrCode(data: {
    businessId: string;
    name: string;
    destinationUrl: string;
    placement?: QrPlacement;
    code?: string;
  }): { success: boolean; qrCode?: QrCode; error?: string } {
    const business = this.getBusiness(data.businessId);
    if (!business) {
      return { success: false, error: 'Business not found' };
    }

    // Check Plan Limits
    const sub = this.getSaasSubscription(data.businessId);
    const activeQrs = this.data.qrCodes.filter(q => q.businessId === data.businessId && q.status === 'ACTIVE');
    if (activeQrs.length >= sub.maxActiveQrCodes) {
      return {
        success: false,
        error: `Free plan limit reached (${sub.maxActiveQrCodes} active QR code). Upgrade to Starter (Coming Soon) or pause an existing QR code.`
      };
    }

    // Generate unique code if not specified
    let code = data.code?.trim().toLowerCase();
    if (!code) {
      const slugPrefix = business.slug.split('-')[0] || 'qr';
      const randomSuffix = crypto.randomBytes(3).toString('hex');
      code = `${slugPrefix}-${randomSuffix}`;
    }

    // Check code collision
    if (this.getQrCodeByCode(code)) {
      code = `${code}-${crypto.randomBytes(2).toString('hex')}`;
    }

    const newQr: QrCode = {
      id: 'qr_' + crypto.randomUUID().replace(/-/g, '').slice(0, 12),
      businessId: data.businessId,
      name: data.name.trim(),
      code,
      destinationUrl: data.destinationUrl.trim(),
      status: 'ACTIVE',
      placement: data.placement || 'Counter',
      totalScans: 0,
      uniqueScans: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.data.qrCodes.push(newQr);
    this.save();
    return { success: true, qrCode: newQr };
  }

  public updateQrCode(id: string, updates: Partial<QrCode>): { success: boolean; qrCode?: QrCode; error?: string } {
    const qr = this.getQrCode(id);
    if (!qr) return { success: false, error: 'QR Code not found' };

    // If reactivating, verify plan limits
    if (updates.status === 'ACTIVE' && qr.status !== 'ACTIVE') {
      const sub = this.getSaasSubscription(qr.businessId);
      const activeCount = this.data.qrCodes.filter(q => q.businessId === qr.businessId && q.status === 'ACTIVE' && q.id !== id).length;
      if (activeCount >= sub.maxActiveQrCodes) {
        return {
          success: false,
          error: `Free plan limit reached (${sub.maxActiveQrCodes} active QR code). Please pause your other active QR code first.`
        };
      }
    }

    if (updates.name !== undefined) qr.name = updates.name.trim();
    if (updates.destinationUrl !== undefined) qr.destinationUrl = updates.destinationUrl.trim();
    if (updates.placement !== undefined) qr.placement = updates.placement;
    if (updates.status !== undefined) qr.status = updates.status;
    qr.updatedAt = new Date().toISOString();

    this.save();
    return { success: true, qrCode: qr };
  }

  public deleteQrCode(id: string): boolean {
    const idx = (this.data.qrCodes || []).findIndex(q => q.id === id);
    if (idx === -1) return false;
    this.data.qrCodes.splice(idx, 1);
    this.save();
    return true;
  }

  // --- Real Scan Recording & Direct Redirection ---

  public recordQrScan(code: string, meta: { userAgent?: string; ip?: string; referrer?: string }): {
    success: boolean;
    redirectUrl?: string;
    isPaused?: boolean;
    notFound?: boolean;
    qrCode?: QrCode;
  } {
    const qr = this.getQrCodeByCode(code);
    if (!qr) {
      return { success: false, notFound: true };
    }

    if (qr.status === 'PAUSED') {
      return { success: false, isPaused: true, qrCode: qr };
    }

    const ua = meta.userAgent || '';
    let deviceType: 'mobile' | 'tablet' | 'desktop' | 'bot' | 'unknown' = 'mobile';
    if (/bot|crawler|spider|google|crawling/i.test(ua)) {
      deviceType = 'bot';
    } else if (/iPad|Tablet/i.test(ua)) {
      deviceType = 'tablet';
    } else if (/Mobile|Android|iPhone|iPod/i.test(ua)) {
      deviceType = 'mobile';
    } else if (/Macintosh|Windows|Linux/i.test(ua)) {
      deviceType = 'desktop';
    }

    // Determine OS
    let os = 'Unknown OS';
    if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
    else if (/Android/i.test(ua)) os = 'Android';
    else if (/Macintosh/i.test(ua)) os = 'macOS';
    else if (/Windows/i.test(ua)) os = 'Windows';
    else if (/Linux/i.test(ua)) os = 'Linux';

    // Determine browser
    let browser = 'Mobile Browser';
    if (/Chrome/i.test(ua) && !/Edge|OPR/i.test(ua)) browser = 'Chrome';
    else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
    else if (/Firefox/i.test(ua)) browser = 'Firefox';
    else if (/Edge/i.test(ua)) browser = 'Edge';

    // Privacy-preserving unique tracking: Hash IP with a daily rotating salt
    const rawIp = meta.ip || '127.0.0.1';
    const salt = new Date().toISOString().slice(0, 10);
    const ipHash = crypto.createHash('sha256').update(`${rawIp}_${salt}`).digest('hex');

    // Check if unique in last 24h
    const cutoff24h = new Date(Date.now() - 86400000).toISOString();
    const existingRecentScan = this.data.qrScanEvents.find(
      e => e.qrCodeId === qr.id && e.ipHash === ipHash && e.scannedAt >= cutoff24h
    );
    const isUnique = !existingRecentScan;

    // Record scan event
    const scanEvent: QrScanEvent = {
      id: 'scan_' + crypto.randomUUID().replace(/-/g, '').slice(0, 12),
      qrCodeId: qr.id,
      businessId: qr.businessId,
      code: qr.code,
      scannedAt: new Date().toISOString(),
      deviceType,
      os,
      browser,
      ipHash,
      referrer: meta.referrer || 'Camera / Direct QR Scan',
      redirectUrl: qr.destinationUrl
    };

    this.data.qrScanEvents.unshift(scanEvent);

    // Update aggregate counts
    qr.totalScans = (qr.totalScans || 0) + 1;
    if (isUnique) {
      qr.uniqueScans = (qr.uniqueScans || 0) + 1;
    }
    qr.lastScannedAt = scanEvent.scannedAt;
    qr.updatedAt = scanEvent.scannedAt;

    this.save();

    return {
      success: true,
      redirectUrl: qr.destinationUrl,
      qrCode: qr
    };
  }

  // --- Real QR Analytics (Section 7) ---

  public getQrAnalytics(
    businessId: string,
    range: 'today' | '7d' | '30d' | '90d' | 'custom' = '30d',
    customStart?: string,
    customEnd?: string
  ) {
    const qrs = this.listQrCodes(businessId);
    const qrIds = new Set(qrs.map(q => q.id));
    const allBusinessEvents = (this.data.qrScanEvents || []).filter(e => e.businessId === businessId || qrIds.has(e.qrCodeId));

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = now.getTime() - 7 * 86400000;
    const thirtyDaysAgo = now.getTime() - 30 * 86400000;
    const ninetyDaysAgo = now.getTime() - 90 * 86400000;

    // Fixed summary metrics (always strictly measured)
    const scansToday = allBusinessEvents.filter(e => new Date(e.scannedAt).getTime() >= todayStart).length;
    const scansThisWeek = allBusinessEvents.filter(e => new Date(e.scannedAt).getTime() >= sevenDaysAgo).length;
    const scansThisMonth = allBusinessEvents.filter(e => new Date(e.scannedAt).getTime() >= thirtyDaysAgo).length;
    const totalScans = allBusinessEvents.length;
    const activeQrCodes = qrs.filter(q => q.status === 'ACTIVE').length;

    // Find most scanned QR
    const qrScanCounts: Record<string, number> = {};
    for (const q of qrs) {
      qrScanCounts[q.id] = q.totalScans || 0;
    }
    let mostScannedQrName = 'None';
    let mostScannedCount = 0;
    for (const q of qrs) {
      if ((q.totalScans || 0) > mostScannedCount) {
        mostScannedCount = q.totalScans;
        mostScannedQrName = q.name;
      }
    }

    // Determine filter range for time-series charts
    let filterStartTime = thirtyDaysAgo;
    let filterEndTime = now.getTime();
    let numDays = 30;

    if (range === 'today') {
      filterStartTime = todayStart;
      numDays = 1;
    } else if (range === '7d') {
      filterStartTime = sevenDaysAgo;
      numDays = 7;
    } else if (range === '90d') {
      filterStartTime = ninetyDaysAgo;
      numDays = 90;
    } else if (range === 'custom' && customStart && customEnd) {
      filterStartTime = new Date(customStart).getTime();
      filterEndTime = new Date(customEnd).getTime() + 86400000;
      numDays = Math.max(1, Math.round((filterEndTime - filterStartTime) / 86400000));
    }

    const filteredEvents = allBusinessEvents.filter(e => {
      const t = new Date(e.scannedAt).getTime();
      return t >= filterStartTime && t <= filterEndTime;
    });

    // Time-series breakdown
    const timeSeriesMap: Record<string, { date: string; scans: number; uniqueScans: number }> = {};
    if (range === 'today') {
      // Hourly breakdown for today
      for (let h = 0; h < 24; h++) {
        const hourStr = `${h.toString().padStart(2, '0')}:00`;
        timeSeriesMap[hourStr] = { date: hourStr, scans: 0, uniqueScans: 0 };
      }
      filteredEvents.forEach(e => {
        const d = new Date(e.scannedAt);
        const hourStr = `${d.getHours().toString().padStart(2, '0')}:00`;
        if (timeSeriesMap[hourStr]) {
          timeSeriesMap[hourStr].scans++;
          timeSeriesMap[hourStr].uniqueScans++;
        }
      });
    } else {
      // Daily breakdown
      for (let i = numDays - 1; i >= 0; i--) {
        const d = new Date(filterEndTime - i * 86400000);
        const key = d.toISOString().slice(5, 10); // MM-DD
        timeSeriesMap[key] = { date: key, scans: 0, uniqueScans: 0 };
      }
      filteredEvents.forEach(e => {
        const key = e.scannedAt.slice(5, 10);
        if (timeSeriesMap[key]) {
          timeSeriesMap[key].scans++;
          timeSeriesMap[key].uniqueScans++;
        }
      });
    }
    const timeSeries = Object.values(timeSeriesMap);

    // Performance by QR Code
    const byQrCode = qrs.map(q => {
      const scansInPeriod = filteredEvents.filter(e => e.qrCodeId === q.id).length;
      return {
        id: q.id,
        name: q.name,
        code: q.code,
        placement: q.placement,
        status: q.status,
        scans: scansInPeriod,
        totalScans: q.totalScans,
        uniqueScans: q.uniqueScans,
        lastScannedAt: q.lastScannedAt
      };
    }).sort((a, b) => b.scans - a.scans);

    // Performance by Placement
    const placementCounts: Record<string, number> = {};
    for (const q of qrs) {
      const scans = filteredEvents.filter(e => e.qrCodeId === q.id).length;
      placementCounts[q.placement] = (placementCounts[q.placement] || 0) + scans;
    }
    const totalPlacementScans = Object.values(placementCounts).reduce((a, b) => a + b, 0) || 1;
    const byPlacement = Object.entries(placementCounts).map(([placement, scans]) => ({
      placement,
      scans,
      percentage: Math.round((scans / totalPlacementScans) * 100)
    })).sort((a, b) => b.scans - a.scans);

    // Device breakdown
    const deviceCounts: Record<string, number> = { mobile: 0, tablet: 0, desktop: 0 };
    filteredEvents.forEach(e => {
      const dev = e.deviceType === 'tablet' ? 'tablet' : e.deviceType === 'desktop' ? 'desktop' : 'mobile';
      deviceCounts[dev] = (deviceCounts[dev] || 0) + 1;
    });

    // Recent scan activity (latest 20)
    const recentScans = filteredEvents.slice(0, 20).map(e => {
      const targetQr = qrs.find(q => q.id === e.qrCodeId);
      return {
        id: e.id,
        qrName: targetQr?.name || 'QR Code',
        placement: targetQr?.placement || 'Counter',
        code: e.code,
        deviceType: e.deviceType,
        os: e.os || 'Mobile OS',
        browser: e.browser || 'Browser',
        city: e.city || 'Local Area',
        scannedAt: e.scannedAt
      };
    });

    return {
      range,
      metrics: {
        totalScans,
        scansToday,
        scansThisWeek,
        scansThisMonth,
        activeQrCodes,
        totalQrCodes: qrs.length,
        mostScannedQr: mostScannedQrName,
        mostScannedCount
      },
      timeSeries,
      byQrCode,
      byPlacement,
      byDevice: [
        { name: 'Mobile', count: deviceCounts.mobile, percentage: Math.round((deviceCounts.mobile / (filteredEvents.length || 1)) * 100) },
        { name: 'Tablet', count: deviceCounts.tablet, percentage: Math.round((deviceCounts.tablet / (filteredEvents.length || 1)) * 100) },
        { name: 'Desktop', count: deviceCounts.desktop, percentage: Math.round((deviceCounts.desktop / (filteredEvents.length || 1)) * 100) }
      ],
      recentScans
    };
  }

  // --- Subscription Management (Section 10 & 11) ---

  public getSubscriptionPlans(): SubscriptionPlan[] {
    return this.data.subscriptionPlans || [];
  }

  public getSaasSubscription(businessId: string): Subscription {
    if (!this.data.saasSubscriptions[businessId]) {
      this.data.saasSubscriptions[businessId] = {
        id: 'sub_' + businessId,
        businessId,
        planId: 'plan_free',
        status: 'ACTIVE',
        maxActiveQrCodes: 1,
        currentPeriodStart: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.save();
    }
    return this.data.saasSubscriptions[businessId];
  }

  // --- Google Profile Management (Section 8 & 9) ---

  public getGoogleBusinessProfile(businessId: string): GoogleBusinessProfile {
    if (!this.data.googleBusinessProfiles[businessId]) {
      const biz = this.getBusiness(businessId);
      this.data.googleBusinessProfiles[businessId] = {
        id: 'gbp_' + businessId,
        businessId,
        placeId: 'ChIJ_' + (biz?.slug || 'PlaceId'),
        displayName: biz?.name || 'Local Business',
        overallRating: undefined, // undefined when not connected
        totalReviewCount: 0,
        isConnected: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.save();
    }
    return this.data.googleBusinessProfiles[businessId];
  }

  public updateGoogleBusinessProfile(businessId: string, updates: Partial<GoogleBusinessProfile>): GoogleBusinessProfile {
    const profile = this.getGoogleBusinessProfile(businessId);
    Object.assign(profile, updates, { updatedAt: new Date().toISOString() });
    this.save();
    return profile;
  }

  // --- Super Admin Overview (Section 12) ---

  public getAdminOverview() {
    const totalBusinesses = this.data.businesses.length;
    const activeBusinesses = this.data.businesses.filter(b => (b as any).status !== 'SUSPENDED').length;
    const totalQrs = this.data.qrCodes.length;
    const activeQrs = this.data.qrCodes.filter(q => q.status === 'ACTIVE').length;
    const totalScans = this.data.qrScanEvents.length;

    // Plans distribution
    const plansDist: Record<string, number> = { FREE: totalBusinesses, STARTER: 0, GROWTH: 0, PRO: 0 };

    return {
      totalBusinesses,
      activeBusinesses,
      totalQrs,
      activeQrs,
      totalScans,
      newRegistrationsThisMonth: totalBusinesses,
      plansDistribution: plansDist
    };
  }

  public listAdminBusinesses() {
    return this.data.businesses.map(b => {
      const qrs = this.listQrCodes(b.id);
      const sub = this.getSaasSubscription(b.id);
      return {
        id: b.id,
        name: b.name,
        slug: b.slug,
        category: b.category,
        city: b.city,
        createdAt: b.createdAt,
        status: (b as any).status || 'ACTIVE',
        totalQrCodes: qrs.length,
        activeQrCodes: qrs.filter(q => q.status === 'ACTIVE').length,
        totalScans: qrs.reduce((acc, q) => acc + (q.totalScans || 0), 0),
        plan: sub.planId.replace('plan_', '').toUpperCase()
      };
    });
  }

  public setBusinessStatus(businessId: string, status: 'ACTIVE' | 'SUSPENDED') {
    const biz = this.getBusiness(businessId);
    if (!biz) return false;
    (biz as any).status = status;
    this.save();
    return true;
  }
}

export const db = new DatabaseService();
