import { Router, Request, Response, NextFunction } from 'express';
import { freshTestStore, STANDARD_PLANS } from './store.ts';
import { GoogleGenAI } from '@google/genai';
import { sanitizeReviewText } from '../reviewflow/ai-review-engine.ts';

export const freshTestRouter = Router();

const aiRateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkAiRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = aiRateLimitMap.get(ip);
  if (!record || now > record.resetAt) {
    aiRateLimitMap.set(ip, { count: 1, resetAt: now + 60000 });
    return true;
  }
  if (record.count >= 15) {
    return false;
  }
  record.count++;
  return true;
}

export function isValidGoogleReviewUrl(urlStr: string): { valid: boolean; error?: string } {
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== 'https:') {
      return { valid: false, error: 'Review URL must use secure HTTPS protocol.' };
    }
    const host = parsed.hostname.toLowerCase();
    const isGoogle =
      host.includes('google.com') ||
      host.includes('google.co.in') ||
      host.includes('g.page') ||
      host.includes('goo.gl') ||
      host.includes('maps.app.goo.gl');

    if (!isGoogle) {
      return {
        valid: false,
        error: 'URL must be an official Google link (e.g. g.page/r/..., google.com/search?q=..., or maps.app.goo.gl/...)'
      };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: 'Please enter a valid, well-formed HTTPS URL.' };
  }
}

function getRequestUser(req: Request) {
  const uid = (req.headers['x-user-uid'] as string) || (req.headers['authorization'] as string)?.replace('Bearer ', '');
  const email = (req.headers['x-user-email'] as string) || '';

  if (!uid) {
    const users = freshTestStore.getAllUsers();
    if (users.length > 0) {
      return users[0];
    }
    return freshTestStore.upsertUser({ uid: 'usr_default_owner', email: 'owner@reviewflow.ai', displayName: 'Business Owner' });
  }

  let user = freshTestStore.getUserByUid(uid);
  if (!user) {
    user = freshTestStore.upsertUser({
      uid,
      email: email || `${uid}@example.com`,
      displayName: 'Business Owner'
    });
  }
  return user || null;
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = getRequestUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (user.status === 'suspended') {
    return res.status(403).json({ error: 'Your account has been suspended by the platform administrator.' });
  }
  (req as any).user = user;
  next();
}

function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  const user = getRequestUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({
      error: 'Access Denied: Super Admin privileges required.'
    });
  }
  (req as any).user = user;
  next();
}

// -------------------------------------------------------------
// USER / AUTH SYNC
// -------------------------------------------------------------
freshTestRouter.post('/auth/sync', (req: Request, res: Response) => {
  const { uid, email, displayName } = req.body;
  if (!uid || !email) {
    return res.status(400).json({ error: 'uid and email are required' });
  }
  const user = freshTestStore.upsertUser({ uid, email, displayName });
  const subscription = freshTestStore.getSubscription(user.uid);
  res.json({ user, subscription });
});

freshTestRouter.get('/auth/me', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const subscription = freshTestStore.getSubscription(user.uid);
  res.json({ user, subscription });
});

// -------------------------------------------------------------
// SUBSCRIPTIONS & PLANS (Section 8.D)
// -------------------------------------------------------------
freshTestRouter.get('/plans', (_req: Request, res: Response) => {
  res.json({ plans: STANDARD_PLANS });
});

freshTestRouter.get('/subscription', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  let sub = freshTestStore.getSubscription(user.uid);
  if (!sub) {
    sub = freshTestStore.updateSubscription(user.uid, 'free_trial', user.uid);
  }
  const plan = STANDARD_PLANS.find(p => p.id === sub.planId) || STANDARD_PLANS[0];
  res.json({ subscription: sub, plan });
});

freshTestRouter.post('/subscription/upgrade', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const { planId } = req.body;

  const validPlan = STANDARD_PLANS.find(p => p.id === planId);
  if (!validPlan) {
    return res.status(400).json({ error: 'Invalid plan selected' });
  }

  const updatedSub = freshTestStore.updateSubscription(user.uid, planId, user.uid);
  res.json({ subscription: updatedSub, plan: validPlan });
});

// -------------------------------------------------------------
// MULTI-BUSINESS ONBOARDING & SETTINGS (Section 4)
// -------------------------------------------------------------
freshTestRouter.get('/business', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const business = freshTestStore.getBusinessByOwner(user.uid);
  res.json({ business: business || null });
});

freshTestRouter.post('/business', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const data = req.body;

  if (data.googleReviewUrl && data.googleReviewUrl.trim()) {
    const urlCheck = isValidGoogleReviewUrl(data.googleReviewUrl.trim());
    if (!urlCheck.valid) {
      return res.status(400).json({ error: urlCheck.error });
    }
  }

  const saved = freshTestStore.saveBusiness(user.uid, data);
  res.json({ business: saved });
});

// -------------------------------------------------------------
// MULTIPLE QR CODES SYSTEM (Section 6)
// -------------------------------------------------------------
freshTestRouter.get('/qr-codes', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const business = freshTestStore.getBusinessByOwner(user.uid);
  if (!business) {
    return res.json({ qrCodes: [] });
  }
  const qrCodes = freshTestStore.getQrCodesByBusiness(business.id);
  res.json({ qrCodes });
});

freshTestRouter.post('/qr-codes', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  let business = freshTestStore.getBusinessByOwner(user.uid);
  if (!business) {
    // If business doesn't exist yet, auto-create a default profile so generation never breaks
    business = freshTestStore.saveBusiness(user.uid, {
      businessName: 'My Local Business',
      googleReviewUrl: 'https://g.page/r/sample/review'
    });
  }

  const { label = 'Billing Counter', regenerate = false } = req.body;
  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';

  // If a QR code already exists and user wants to generate again / refresh primary:
  const existingQrs = freshTestStore.getQrCodesByBusiness(business.id);
  if (existingQrs.length > 0 && (regenerate || label === 'Billing Counter' || label === existingQrs[0].label)) {
    const primary = existingQrs[0];
    primary.destinationUrl = `${protocol}://${host}/r/${primary.uniqueCode}`;
    primary.status = 'ACTIVE';
    freshTestStore.updateQrCode(primary.id, { status: 'ACTIVE' });
    return res.json({ qrCode: primary });
  }

  const placeholderUrl = `${protocol}://${host}/r/placeholder`;
  const result = freshTestStore.createQrCode(business.id, user.uid, label, placeholderUrl);

  if (result.error || !result.qrCode) {
    if (existingQrs.length > 0) {
      const primary = existingQrs[0];
      primary.destinationUrl = `${protocol}://${host}/r/${primary.uniqueCode}`;
      return res.json({ qrCode: primary });
    }
    return res.status(400).json({ error: result.error || 'Failed to generate QR code' });
  }

  result.qrCode.destinationUrl = `${protocol}://${host}/r/${result.qrCode.uniqueCode}`;
  res.json({ qrCode: result.qrCode });
});

freshTestRouter.patch('/qr-codes/:id', requireAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const { label, status } = req.body;
  const updated = freshTestStore.updateQrCode(id, { label, status });
  if (!updated) {
    return res.status(404).json({ error: 'QR Code not found' });
  }
  res.json({ qrCode: updated });
});

// -------------------------------------------------------------
// PUBLIC CUSTOMER QR LOOKUP & EVENTS (Section 4 & 5)
// -------------------------------------------------------------
freshTestRouter.get('/qr-code/lookup/:code', (req: Request, res: Response) => {
  const code = req.params.code;
  const qrCode = freshTestStore.getQrCodeByUniqueCode(code);
  if (!qrCode || qrCode.status !== 'ACTIVE') {
    return res.status(404).json({ error: 'QR Code is not active or has been paused.' });
  }

  const business = freshTestStore.getBusinessById(qrCode.businessId);
  if (!business || business.status !== 'active') {
    return res.status(404).json({ error: 'Business account is not active.' });
  }

  res.json({
    uniqueCode: qrCode.uniqueCode,
    qrLabel: qrCode.label,
    businessName: business.businessName,
    category: business.category,
    logoUrl: business.logoUrl,
    googleReviewUrl: business.googleReviewUrl,
    location: business.location,
    customerHeading: business.customerHeading,
    welcomeMessage: business.welcomeMessage,
    brandAccentColor: business.brandAccentColor,
    supportedLanguages: business.supportedLanguages,
    tonePreference: business.tonePreference,
    categoryDetails: business.categoryDetails,
    visitQuestions: business.visitQuestions
  });
});

freshTestRouter.post('/events', (req: Request, res: Response) => {
  const { uniqueCode, eventType } = req.body;
  if (!uniqueCode || !eventType) {
    return res.status(400).json({ error: 'uniqueCode and eventType are required' });
  }
  freshTestStore.recordAssistanceEvent(uniqueCode, eventType);
  res.json({ success: true });
});

// -------------------------------------------------------------
// REAL-TIME ANALYTICS (Section 7)
// -------------------------------------------------------------
freshTestRouter.get('/analytics', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const business = freshTestStore.getBusinessByOwner(user.uid);
  if (!business) {
    return res.json({
      totalScans: 0,
      scansToday: 0,
      scansThisWeek: 0,
      scansThisMonth: 0,
      activeQrCodes: 0,
      totalQrCodes: 0,
      eventsBreakdown: {
        qrScans: 0,
        assistancePageViews: 0,
        aiDraftsGenerated: 0,
        reviewsCopied: 0,
        googleReviewClicks: 0
      },
      chartData: [],
      qrBreakdown: [],
      recentActivity: []
    });
  }

  const analytics = freshTestStore.getBusinessAnalytics(business.id);
  res.json(analytics);
});

// -------------------------------------------------------------
// SECURE AI REVIEW DRAFT ENGINE (Section 5)
// -------------------------------------------------------------
freshTestRouter.post('/ai/review-draft', async (req: Request, res: Response) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  if (!checkAiRateLimit(ip)) {
    return res.status(429).json({
      error: 'Rate limit reached. Please wait a minute before requesting another review draft.'
    });
  }

  const {
    customerFeedback,
    language = 'English',
    businessName = 'this business',
    category = 'other',
    tone = 'warm',
    uniqueCode,
    iteration = 1
  } = req.body;

  if (!customerFeedback || typeof customerFeedback !== 'string' || customerFeedback.trim().length < 2) {
    return res.status(400).json({
      error: 'Please share your actual thoughts or select an experience topic before generating a draft.'
    });
  }

  const cleanFeedback = customerFeedback.trim();
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
    try {
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `You are an AI assistant that writes authentic Google Maps customer reviews based directly on real customer input. A customer visited "${businessName}" (${category}).
Customer's honest experience notes:
"""
${cleanFeedback}
"""

Target Language: ${language}
Tone Preference: ${tone}
Draft Variation Number: ${iteration}

CRITICAL RULES:
1. CUSTOMER INPUT IS THE PRIMARY SOURCE OF TRUTH:
   - What the customer wrote is your primary foundation. Expand on their actual thoughts naturally.
   - Do NOT over-polish into generic corporate marketing fluff. Keep an authentic reviewer voice.
   - Do NOT invent fake facts, imaginary staff names, fake dishes, discounts, or unverified claims.
2. DO NOT FORCE WORD LENGTH:
   - If customer input is short, expand it naturally and concisely.
   - Do NOT force a 35-word generic review by padding with fake or repetitive filler. Let short inputs stay authentic.
3. STRICT ZERO PUNCTUATION RULE (ABSOLUTE REQUIREMENT):
   - DO NOT USE ANY PUNCTUATION MARKS AT ALL.
   - NO periods (.), NO commas (,), NO exclamation marks (!), NO question marks (?), NO colons (:), NO semicolons (;), NO quotation marks (' or "), NO hyphens (-), NO dashes (— or –), NO brackets.
   - Output ONLY plain natural words separated by single spaces.
4. Output ONLY the plain review words without headers, labels, quotes, or preambles.`;

      const response = await ai.models.generateContent({
        model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
        contents: prompt
      });

      const rawDraft = response.text?.trim();
      if (rawDraft) {
        const cleanDraft = sanitizeReviewText(rawDraft);
        if (uniqueCode) {
          freshTestStore.recordAssistanceEvent(uniqueCode, 'AI_DRAFT_GENERATED');
        }
        return res.json({ draft: cleanDraft });
      }
    } catch (err: any) {
      console.warn('[FreshTest AI Engine Notice]', err.message);
      return res.status(503).json({
        code: 'AI_GENERATION_FAILED',
        error: 'Unable to generate a new review right now Please try again'
      });
    }
  }

  return res.status(503).json({
    code: 'AI_GENERATION_FAILED',
    error: 'Unable to generate a new review right now Please try again'
  });
});

// -------------------------------------------------------------
// SUPER ADMIN CONSOLE (Section 8)
// -------------------------------------------------------------
freshTestRouter.get('/admin/overview', requireSuperAdmin, (_req: Request, res: Response) => {
  const overview = freshTestStore.getAdminOverview();
  res.json(overview);
});

freshTestRouter.get('/admin/businesses', requireSuperAdmin, (_req: Request, res: Response) => {
  const businesses = freshTestStore.getAllBusinesses();
  const qrs = freshTestStore.getAllQrCodes();
  const users = freshTestStore.getAllUsers();

  const enriched = businesses.map(b => {
    const owner = users.find(u => u.uid === b.ownerUid);
    const sub = freshTestStore.getSubscription(b.ownerUid);
    const bQrs = qrs.filter(q => q.businessId === b.id);
    const analytics = freshTestStore.getBusinessAnalytics(b.id);
    return {
      ...b,
      ownerEmail: owner?.email || 'N/A',
      planId: sub?.planId || 'free_trial',
      planStatus: sub?.status || 'active',
      qrCount: bQrs.length,
      activeQrCount: bQrs.filter(q => q.status === 'ACTIVE').length,
      primaryQrCode: bQrs[0]?.uniqueCode || null,
      primaryQrDestination: bQrs[0]?.destinationUrl || null,
      qrCodes: bQrs,
      totalScans: analytics.totalScans,
      aiGenerations: analytics.eventsBreakdown.aiDraftsGenerated
    };
  });

  res.json({ businesses: enriched });
});

freshTestRouter.get('/admin/businesses/:id', requireSuperAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const business = freshTestStore.getBusinessById(id);
  if (!business) {
    return res.status(404).json({ error: 'Business not found' });
  }

  const owner = freshTestStore.getUserByUid(business.ownerUid);
  const sub = freshTestStore.getSubscription(business.ownerUid);
  const qrs = freshTestStore.getQrCodesByBusiness(business.id);
  const analytics = freshTestStore.getBusinessAnalytics(business.id);

  res.json({
    business,
    owner,
    subscription: sub,
    qrCodes: qrs,
    analytics
  });
});

freshTestRouter.post('/admin/businesses/:id/status', requireSuperAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const adminUser = (req as any).user;

  if (status !== 'active' && status !== 'suspended') {
    return res.status(400).json({ error: 'Status must be active or suspended' });
  }

  const success = freshTestStore.updateBusinessStatus(id, status, adminUser.uid);
  if (!success) {
    return res.status(404).json({ error: 'Business not found' });
  }

  res.json({ success: true, status });
});

freshTestRouter.post('/admin/businesses/:id/plan', requireSuperAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const { planId } = req.body;
  const adminUser = (req as any).user;

  const business = freshTestStore.getBusinessById(id);
  if (!business) {
    return res.status(404).json({ error: 'Business not found' });
  }

  const sub = freshTestStore.updateSubscription(business.ownerUid, planId, adminUser.uid);
  res.json({ success: true, subscription: sub });
});

freshTestRouter.get('/admin/users', requireSuperAdmin, (_req: Request, res: Response) => {
  const users = freshTestStore.getAllUsers();
  res.json({ users });
});

freshTestRouter.post('/admin/users/:id/status', requireSuperAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const adminUser = (req as any).user;

  if (status !== 'active' && status !== 'suspended') {
    return res.status(400).json({ error: 'Status must be active or suspended' });
  }

  const success = freshTestStore.updateUserStatus(id, status, adminUser.uid);
  if (!success) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({ success: true, status });
});

freshTestRouter.get('/admin/settings', requireSuperAdmin, (_req: Request, res: Response) => {
  const settings = freshTestStore.getSystemSettings();
  const auditLogs = freshTestStore.getAuditLogs();
  res.json({ settings, auditLogs, plans: STANDARD_PLANS });
});

// Catch-all: Ensure any unknown /api/test/* route returns JSON 404, never falling through to HTML SPA
freshTestRouter.all('*', (req: Request, res: Response) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});
