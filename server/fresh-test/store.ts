import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import {
  TestUser,
  TestBusiness,
  TestQrCode,
  TestQrScanEvent,
  TestReviewAssistanceEvent,
  TestSubscription,
  TestPlanDefinition,
  TestAdminAuditLog,
  TestSystemSettings,
  BusinessCategory
} from './types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '../../.fresh_test_data.json');

// Super Admin server allowlist
const SUPER_ADMIN_ALLOWLIST = new Set([
  'admin@testsaas.com',
  'superadmin@reviewflow.ai',
  'admin@reviewflow.com'
]);

export const STANDARD_PLANS: TestPlanDefinition[] = [
  {
    id: 'free_trial',
    name: 'Free Trial',
    priceMonthly: 0,
    currency: 'INR',
    description: '14-Day Full Testing Experience for local shops in India.',
    maxQrCodes: 1,
    maxAiMonthly: 100,
    features: ['1 Active QR Stand', 'Direct Google Review 302 Redirect', 'AI Review Drafting', 'Real-time Scan Analytics'],
    badge: 'Free Testing'
  },
  {
    id: 'starter',
    name: 'Starter Shop',
    priceMonthly: 799,
    currency: 'INR',
    description: 'Perfect for single-counter retail shops, salons & clinics.',
    maxQrCodes: 3,
    maxAiMonthly: 500,
    features: ['3 QR Code Stands (Counter, Entrance, Packaging)', 'Multi-Language Support (EN, HI, MR)', 'Custom Brand Accent Colors', 'Priority AI Drafting'],
    badge: 'Popular for Shops'
  },
  {
    id: 'growth',
    name: 'Growth Business',
    priceMonthly: 1999,
    currency: 'INR',
    description: 'For busy restaurants, jewellery showrooms & automotive garages.',
    maxQrCodes: 10,
    maxAiMonthly: 2500,
    features: ['10 QR Code Stands', 'Table / Station Placement Labels', 'Alternative Wording Variations', '30-Day Trend Charts'],
    badge: 'Most Popular'
  },
  {
    id: 'pro',
    name: 'Pro Multi-Location',
    priceMonthly: 4999,
    currency: 'INR',
    description: 'For expanding franchises and high-volume local stores.',
    maxQrCodes: 50,
    maxAiMonthly: 10000,
    features: ['50 QR Stands across branches', 'Dedicated Account Manager', 'Custom Review Prompts', 'High-res Vector SVG & Print Kits'],
    badge: 'Best for Franchises'
  },
  {
    id: 'enterprise',
    name: 'Custom Enterprise',
    priceMonthly: 9999,
    currency: 'INR',
    description: 'Tailored for retail chains and hospitality groups.',
    maxQrCodes: 999,
    maxAiMonthly: 50000,
    features: ['Unlimited QR Stands', 'SLA Guarantee', 'Dedicated Server Allocation', 'Custom API & Webhooks'],
    badge: 'Enterprise'
  }
];

interface FreshTestDatabase {
  users: TestUser[];
  businesses: TestBusiness[];
  qrCodes: TestQrCode[];
  scanEvents: TestQrScanEvent[];
  assistanceEvents: TestReviewAssistanceEvent[];
  subscriptions: TestSubscription[];
  auditLogs: TestAdminAuditLog[];
  settings: TestSystemSettings;
}

class FreshTestStore {
  private data: FreshTestDatabase;
  private persistTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): FreshTestDatabase {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (!parsed.subscriptions) parsed.subscriptions = [];
        return parsed;
      }
    } catch (e) {
      console.warn('[FreshTestStore] Could not load persisted test data, initializing fresh:', e);
    }

    const initial: FreshTestDatabase = {
      users: [
        {
          uid: 'usr_superadmin_01',
          email: 'admin@reviewflow.com',
          displayName: 'Super Admin',
          role: 'SUPER_ADMIN',
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      businesses: [],
      qrCodes: [],
      scanEvents: [],
      assistanceEvents: [],
      subscriptions: [
        {
          id: 'sub_admin',
          ownerUid: 'usr_superadmin_01',
          planId: 'enterprise',
          status: 'active',
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          aiGenerationsUsedThisMonth: 0,
          maxQrCodes: 999,
          maxAiMonthly: 50000,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      auditLogs: [
        {
          id: 'log_' + Date.now(),
          actorUid: 'usr_superadmin_01',
          actorEmail: 'admin@reviewflow.com',
          action: 'SYSTEM_INITIALIZED',
          targetType: 'system',
          targetId: 'multi_tenant_namespace',
          details: 'Initialized multi-shop SaaS platform with isolated schema and plan enforcement',
          createdAt: new Date().toISOString()
        }
      ],
      settings: {
        aiProvider: process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY' ? 'gemini' : 'none',
        aiConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
        firebaseStatus: 'connected',
        qrEngineStatus: 'active',
        maintenanceMode: false,
        version: '2.0.0-multi-shop',
        updatedAt: new Date().toISOString()
      }
    };

    this.persist(initial, true);
    return initial;
  }

  private persist(dataToSave?: FreshTestDatabase, immediate = false) {
    if (immediate) {
      try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(dataToSave || this.data, null, 2), 'utf-8');
      } catch (e) {
        console.error('[FreshTestStore] Error persisting test data:', e);
      }
      return;
    }

    if (this.persistTimeout) {
      clearTimeout(this.persistTimeout);
    }

    this.persistTimeout = setTimeout(() => {
      try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(dataToSave || this.data, null, 2), 'utf-8');
      } catch (e) {
        console.error('[FreshTestStore] Error persisting test data:', e);
      }
    }, 1200);
  }

  // --- Users & Roles ---
  getUserByUid(uid: string): TestUser | undefined {
    return this.data.users.find(u => u.uid === uid);
  }

  getUserByEmail(email: string): TestUser | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  upsertUser(user: { uid: string; email: string; displayName?: string }): TestUser {
    const existing = this.getUserByUid(user.uid);
    const isAllowedSuperAdmin = SUPER_ADMIN_ALLOWLIST.has(user.email.toLowerCase());
    const now = new Date().toISOString();

    if (existing) {
      if (isAllowedSuperAdmin && existing.role !== 'SUPER_ADMIN') {
        existing.role = 'SUPER_ADMIN';
      }
      existing.displayName = user.displayName || existing.displayName;
      existing.updatedAt = now;
      this.persist();
      return existing;
    }

    const newUser: TestUser = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email.split('@')[0],
      role: isAllowedSuperAdmin ? 'SUPER_ADMIN' : 'BUSINESS_OWNER',
      status: 'active',
      createdAt: now,
      updatedAt: now
    };

    this.data.users.push(newUser);

    // Initialize Default Subscription
    if (!this.getSubscription(user.uid)) {
      this.data.subscriptions.push({
        id: 'sub_' + crypto.randomBytes(6).toString('hex'),
        ownerUid: user.uid,
        planId: isAllowedSuperAdmin ? 'enterprise' : 'free_trial',
        status: 'active',
        currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        aiGenerationsUsedThisMonth: 0,
        maxQrCodes: isAllowedSuperAdmin ? 999 : 1,
        maxAiMonthly: isAllowedSuperAdmin ? 50000 : 100,
        createdAt: now,
        updatedAt: now
      });
    }

    this.persist();
    return newUser;
  }

  getAllUsers(): TestUser[] {
    return [...this.data.users];
  }

  updateUserStatus(uid: string, status: 'active' | 'suspended', actorUid: string): boolean {
    const u = this.getUserByUid(uid);
    if (!u) return false;
    u.status = status;
    u.updatedAt = new Date().toISOString();

    const actor = this.getUserByUid(actorUid);
    this.addAuditLog({
      actorUid,
      actorEmail: actor?.email || 'admin',
      action: 'UPDATE_USER_STATUS',
      targetType: 'user',
      targetId: uid,
      details: `User status changed to ${status}`
    });

    this.persist();
    return true;
  }

  // --- Subscriptions & Plans ---
  getSubscription(ownerUid: string): TestSubscription | undefined {
    return this.data.subscriptions?.find(s => s.ownerUid === ownerUid);
  }

  updateSubscription(ownerUid: string, planId: TestPlanDefinition['id'], actorUid: string): TestSubscription {
    const plan = STANDARD_PLANS.find(p => p.id === planId) || STANDARD_PLANS[0];
    const now = new Date().toISOString();
    let sub = this.getSubscription(ownerUid);

    if (sub) {
      sub.planId = planId;
      sub.status = 'active';
      sub.maxQrCodes = plan.maxQrCodes;
      sub.maxAiMonthly = plan.maxAiMonthly;
      sub.updatedAt = now;
    } else {
      sub = {
        id: 'sub_' + crypto.randomBytes(6).toString('hex'),
        ownerUid,
        planId,
        status: 'active',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        aiGenerationsUsedThisMonth: 0,
        maxQrCodes: plan.maxQrCodes,
        maxAiMonthly: plan.maxAiMonthly,
        createdAt: now,
        updatedAt: now
      };
      this.data.subscriptions.push(sub);
    }

    const actor = this.getUserByUid(actorUid);
    this.addAuditLog({
      actorUid,
      actorEmail: actor?.email || 'admin',
      action: 'UPDATE_SUBSCRIPTION',
      targetType: 'subscription',
      targetId: sub.id,
      details: `Plan upgraded/changed to ${plan.name} (${planId})`
    });

    this.persist();
    return sub;
  }

  // --- Multi-Business Onboarding & Settings ---
  getBusinessByOwner(ownerUid: string): TestBusiness | undefined {
    return this.data.businesses.find(b => b.ownerUid === ownerUid);
  }

  getBusinessById(id: string): TestBusiness | undefined {
    return this.data.businesses.find(b => b.id === id);
  }

  saveBusiness(ownerUid: string, input: Partial<TestBusiness>): TestBusiness {
    const existing = this.getBusinessByOwner(ownerUid);
    const now = new Date().toISOString();

    if (existing) {
      Object.assign(existing, {
        businessName: input.businessName !== undefined ? input.businessName.trim() : existing.businessName,
        category: input.category || existing.category || 'other',
        customCategory: input.customCategory || existing.customCategory,
        description: input.description !== undefined ? input.description : existing.description,
        country: input.country || existing.country || 'India',
        state: input.state || existing.state || '',
        city: input.city || existing.city || '',
        preferredLanguage: input.preferredLanguage || existing.preferredLanguage || 'English',
        logoUrl: input.logoUrl !== undefined ? input.logoUrl : existing.logoUrl,
        website: input.website !== undefined ? input.website : existing.website,
        phone: input.phone !== undefined ? input.phone : existing.phone,
        categoryDetails: input.categoryDetails || existing.categoryDetails || {},
        customFields: input.customFields || existing.customFields || [],
        googleReviewUrl: input.googleReviewUrl !== undefined ? input.googleReviewUrl.trim() : existing.googleReviewUrl,
        googlePlaceName: input.googlePlaceName || existing.googlePlaceName,
        location: input.location !== undefined ? input.location : existing.location,
        googleProfileConnected: input.googleProfileConnected !== undefined ? input.googleProfileConnected : existing.googleProfileConnected,
        customerHeading: input.customerHeading || existing.customerHeading,
        welcomeMessage: input.welcomeMessage || existing.welcomeMessage,
        brandAccentColor: input.brandAccentColor || existing.brandAccentColor || '#2563eb',
        supportedLanguages: input.supportedLanguages || existing.supportedLanguages || ['English', 'Hindi', 'Marathi'],
        tonePreference: input.tonePreference || existing.tonePreference || 'warm',
        visitQuestions: input.visitQuestions || existing.visitQuestions || [],
        onboardingCompleted: input.onboardingCompleted !== undefined ? input.onboardingCompleted : existing.onboardingCompleted,
        onboardingStep: input.onboardingStep !== undefined ? input.onboardingStep : existing.onboardingStep,
        updatedAt: now
      });
      this.persist();
      return existing;
    }

    const newBusiness: TestBusiness = {
      id: 'tbiz_' + crypto.randomBytes(6).toString('hex'),
      ownerUid,
      businessName: input.businessName?.trim() || 'My Business',
      category: input.category || 'other',
      customCategory: input.customCategory,
      description: input.description || '',
      country: input.country || 'India',
      state: input.state || '',
      city: input.city || '',
      preferredLanguage: input.preferredLanguage || 'English',
      logoUrl: input.logoUrl,
      website: input.website,
      phone: input.phone,
      categoryDetails: input.categoryDetails || {},
      customFields: input.customFields || [],
      googleReviewUrl: input.googleReviewUrl?.trim() || '',
      googlePlaceName: input.googlePlaceName,
      location: input.location,
      googleProfileConnected: Boolean(input.googleProfileConnected),
      customerHeading: input.customerHeading || 'Share Your Experience',
      welcomeMessage: input.welcomeMessage || 'We value your genuine thoughts and feedback.',
      brandAccentColor: input.brandAccentColor || '#2563eb',
      supportedLanguages: input.supportedLanguages || ['English', 'Hindi', 'Marathi'],
      tonePreference: input.tonePreference || 'warm',
      visitQuestions: input.visitQuestions || [],
      onboardingCompleted: Boolean(input.onboardingCompleted),
      onboardingStep: input.onboardingStep || 1,
      status: 'active',
      createdAt: now,
      updatedAt: now
    };

    this.data.businesses.push(newBusiness);
    this.persist();
    return newBusiness;
  }

  getAllBusinesses(): TestBusiness[] {
    return [...this.data.businesses];
  }

  updateBusinessStatus(id: string, status: 'active' | 'suspended', actorUid: string): boolean {
    const b = this.getBusinessById(id);
    if (!b) return false;
    b.status = status;
    b.updatedAt = new Date().toISOString();

    const actor = this.getUserByUid(actorUid);
    this.addAuditLog({
      actorUid,
      actorEmail: actor?.email || 'admin',
      action: 'UPDATE_BUSINESS_STATUS',
      targetType: 'business',
      targetId: id,
      details: `Business status changed to ${status}`
    });

    this.persist();
    return true;
  }

  // --- Multiple QR Codes System (Section 6) ---
  getQrCodesByBusiness(businessId: string): TestQrCode[] {
    return this.data.qrCodes.filter(q => q.businessId === businessId);
  }

  getQrCodeById(id: string): TestQrCode | undefined {
    return this.data.qrCodes.find(q => q.id === id);
  }

  getQrCodeByUniqueCode(code: string): TestQrCode | undefined {
    return this.data.qrCodes.find(q => q.uniqueCode.toLowerCase() === code.toLowerCase());
  }

  generateQrCode(businessId: string, ownerUid: string, destinationUrl: string): TestQrCode {
    const existing = this.getQrCodesByBusiness(businessId);
    if (existing.length > 0) {
      return existing[0];
    }
    const created = this.createQrCode(businessId, ownerUid, 'Billing Counter', destinationUrl);
    if (created.qrCode) {
      return created.qrCode;
    }
    // If limit reached but needed fallback
    return existing[0] || {
      id: 'tqr_fallback',
      businessId,
      ownerUid,
      label: 'Billing Counter',
      uniqueCode: 'qr_' + crypto.randomBytes(4).toString('hex'),
      destinationUrl,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  createQrCode(businessId: string, ownerUid: string, label: string, destinationUrl: string): { qrCode?: TestQrCode; error?: string } {
    const sub = this.getSubscription(ownerUid);
    const existingQrs = this.getQrCodesByBusiness(businessId);
    const activeCount = existingQrs.filter(q => q.status === 'ACTIVE').length;
    const maxAllowed = sub ? sub.maxQrCodes : 1;

    if (activeCount >= maxAllowed) {
      return { error: `Plan limit reached (${maxAllowed} active QR codes). Please upgrade your subscription to add more QR stands.` };
    }

    const uniqueCode = 'qr_' + crypto.randomBytes(4).toString('hex');
    const now = new Date().toISOString();

    const newQr: TestQrCode = {
      id: 'tqr_' + crypto.randomBytes(6).toString('hex'),
      businessId,
      ownerUid,
      label: label.trim() || 'Billing Counter',
      uniqueCode,
      destinationUrl,
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now
    };

    this.data.qrCodes.push(newQr);
    this.persist();
    return { qrCode: newQr };
  }

  updateQrCode(id: string, updates: { label?: string; status?: 'ACTIVE' | 'PAUSED' }): TestQrCode | null {
    const qr = this.getQrCodeById(id);
    if (!qr) return null;
    if (updates.label !== undefined) qr.label = updates.label.trim();
    if (updates.status !== undefined) qr.status = updates.status;
    qr.updatedAt = new Date().toISOString();
    this.persist();
    return qr;
  }

  getAllQrCodes(): TestQrCode[] {
    return [...this.data.qrCodes];
  }

  // --- Scan & Assistance Events ---
  recordScanEvent(uniqueCode: string, meta: { userAgent?: string; source?: string }): {
    success: boolean;
    qrCode?: TestQrCode;
    business?: TestBusiness;
  } {
    const qrCode = this.getQrCodeByUniqueCode(uniqueCode);
    if (!qrCode || qrCode.status !== 'ACTIVE') {
      return { success: false };
    }

    const business = this.getBusinessById(qrCode.businessId);
    if (!business || business.status !== 'active') {
      return { success: false };
    }

    const ua = (meta.userAgent || '').toLowerCase();
    const isBot = /bot|spider|crawl|health|ping|lighthouse|uptimerobot/i.test(ua);

    let deviceType: 'mobile' | 'tablet' | 'desktop' | 'unknown' = 'desktop';
    if (/tablet|ipad/i.test(ua)) {
      deviceType = 'tablet';
    } else if (/mobile|iphone|android/i.test(ua)) {
      deviceType = 'mobile';
    }

    if (!isBot) {
      const scanEvent: TestQrScanEvent = {
        id: 'tscan_' + crypto.randomBytes(6).toString('hex'),
        businessId: business.id,
        qrCodeId: qrCode.id,
        uniqueCode: qrCode.uniqueCode,
        eventType: 'QR_SCAN',
        userAgent: meta.userAgent || 'Unknown',
        deviceType,
        source: meta.source || 'Direct QR Scan',
        createdAt: new Date().toISOString()
      };

      this.data.scanEvents.push(scanEvent);
      this.persist();
    }

    return { success: true, qrCode, business };
  }

  recordAssistanceEvent(uniqueCode: string, eventType: TestReviewAssistanceEvent['eventType']) {
    const qrCode = this.getQrCodeByUniqueCode(uniqueCode);
    if (!qrCode) return;

    if (eventType === 'PAGE_VIEW') {
      const oneMinuteAgo = Date.now() - 60000;
      const recentView = this.data.assistanceEvents.find(
        e => e.uniqueCode === uniqueCode && e.eventType === 'PAGE_VIEW' && new Date(e.createdAt).getTime() > oneMinuteAgo
      );
      if (recentView) return;
    }

    const event: TestReviewAssistanceEvent = {
      id: 'trev_' + crypto.randomBytes(6).toString('hex'),
      businessId: qrCode.businessId,
      qrCodeId: qrCode.id,
      uniqueCode,
      eventType,
      createdAt: new Date().toISOString()
    };

    this.data.assistanceEvents.push(event);

    // Track monthly AI generation counter
    if (eventType === 'AI_DRAFT_GENERATED') {
      const sub = this.getSubscription(qrCode.ownerUid);
      if (sub) {
        sub.aiGenerationsUsedThisMonth = (sub.aiGenerationsUsedThisMonth || 0) + 1;
      }
    }

    this.persist();
  }

  // --- Real-Time Analytics Calculation ---
  getBusinessAnalytics(businessId: string) {
    const scans = this.data.scanEvents.filter(s => s.businessId === businessId);
    const assistance = this.data.assistanceEvents.filter(a => a.businessId === businessId);
    const qrs = this.getQrCodesByBusiness(businessId);

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    let scansToday = 0;
    let scansThisWeek = 0;
    let scansThisMonth = 0;

    const dailyMap = new Map<string, number>();

    scans.forEach(s => {
      const time = new Date(s.createdAt).getTime();
      if (time >= startOfToday) scansToday++;
      if (time >= sevenDaysAgo) scansThisWeek++;
      if (time >= thirtyDaysAgo) {
        scansThisMonth++;
        const dayStr = s.createdAt.substring(5, 10);
        dailyMap.set(dayStr, (dailyMap.get(dayStr) || 0) + 1);
      }
    });

    const chartData = Array.from(dailyMap.entries())
      .map(([date, scans]) => ({ date, scans }))
      .sort((a, b) => a.date.localeCompare(b.date));

    let pageViews = 0;
    let aiDraftsGenerated = 0;
    let reviewsCopied = 0;
    let googleReviewClicks = 0;

    assistance.forEach(a => {
      if (a.eventType === 'PAGE_VIEW') pageViews++;
      if (a.eventType === 'AI_DRAFT_GENERATED') aiDraftsGenerated++;
      if (a.eventType === 'REVIEW_COPIED') reviewsCopied++;
      if (a.eventType === 'GOOGLE_REVIEW_CLICKED') googleReviewClicks++;
    });

    const qrBreakdown = qrs.map(q => {
      const qScans = scans.filter(s => s.qrCodeId === q.id).length;
      const qClicks = assistance.filter(a => a.qrCodeId === q.id && a.eventType === 'GOOGLE_REVIEW_CLICKED').length;
      return {
        ...q,
        totalScans: qScans,
        reviewClicks: qClicks
      };
    });

    const recentActivity = [
      ...scans.map(s => ({
        id: s.id,
        type: 'SCAN' as const,
        label: `QR Scanned (${s.deviceType})`,
        source: s.source,
        timestamp: s.createdAt
      })),
      ...assistance.map(a => ({
        id: a.id,
        type: a.eventType,
        label: a.eventType.replace(/_/g, ' '),
        timestamp: a.createdAt
      }))
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20);

    return {
      totalScans: scans.length,
      scansToday,
      scansThisWeek,
      scansThisMonth,
      activeQrCodes: qrs.filter(q => q.status === 'ACTIVE').length,
      totalQrCodes: qrs.length,
      eventsBreakdown: {
        qrScans: scans.length,
        assistancePageViews: pageViews,
        aiDraftsGenerated,
        reviewsCopied,
        googleReviewClicks
      },
      chartData,
      qrBreakdown,
      recentActivity
    };
  }

  // --- Super Admin Aggregates ---
  getAdminOverview() {
    const totalUsers = this.data.users.length;
    const totalBusinesses = this.data.businesses.length;
    const activeBusinesses = this.data.businesses.filter(b => b.status === 'active').length;
    const suspendedBusinesses = this.data.businesses.filter(b => b.status === 'suspended').length;
    const pendingOnboarding = this.data.businesses.filter(b => !b.onboardingCompleted).length;

    const totalActiveQrs = this.data.qrCodes.filter(q => q.status === 'ACTIVE').length;
    const totalScans = this.data.scanEvents.length;

    let totalAiDrafts = 0;
    let totalCopies = 0;
    let totalGoogleClicks = 0;

    this.data.assistanceEvents.forEach(a => {
      if (a.eventType === 'AI_DRAFT_GENERATED') totalAiDrafts++;
      if (a.eventType === 'REVIEW_COPIED') totalCopies++;
      if (a.eventType === 'GOOGLE_REVIEW_CLICKED') totalGoogleClicks++;
    });

    const trialSubs = this.data.subscriptions.filter(s => s.planId === 'free_trial').length;
    const activePaidSubs = this.data.subscriptions.filter(s => s.planId !== 'free_trial' && s.status === 'active').length;

    return {
      totalUsers,
      totalBusinesses,
      activeBusinesses,
      suspendedBusinesses,
      pendingOnboarding,
      totalActiveQrs,
      totalScans,
      totalAiDrafts,
      totalCopies,
      totalGoogleClicks,
      trialSubs,
      activePaidSubs,
      recentActivity: this.data.auditLogs.slice(-20).reverse()
    };
  }

  addAuditLog(log: Omit<TestAdminAuditLog, 'id' | 'createdAt'>) {
    const newLog: TestAdminAuditLog = {
      id: 'log_' + Date.now(),
      ...log,
      createdAt: new Date().toISOString()
    };
    this.data.auditLogs.push(newLog);
    this.persist();
  }

  getAuditLogs(): TestAdminAuditLog[] {
    return this.data.auditLogs.slice(-50).reverse();
  }

  getSystemSettings(): TestSystemSettings {
    const hasGemini = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');
    return {
      ...this.data.settings,
      aiProvider: hasGemini ? 'gemini' : 'none',
      aiConfigured: hasGemini
    };
  }
}

export const freshTestStore = new FreshTestStore();
