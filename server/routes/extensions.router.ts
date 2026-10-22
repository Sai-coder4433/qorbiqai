import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db/database.ts';

export const extensionsRouter = Router();

const CURRENT_USER_ID = 'usr_admin_001';

// ============================================================
// AUTH — Firebase UID registration / user profile sync
// ============================================================

extensionsRouter.post('/auth/register', (req: Request, res: Response) => {
  const { uid, email, displayName, organizationName } = req.body;

  if (!uid || !email) {
    return res.status(400).json({ error: 'uid and email are required' });
  }

  const existing = db.listOrganizations(uid);
  if (existing.length > 0) {
    return res.json({ success: true, message: 'User already registered' });
  }

  const org = db.createOrganization(
    organizationName || `${displayName || email.split('@')[0]}'s Agency`,
    uid
  );

  db.logAudit({
    organizationId: org.id,
    userId: uid,
    userEmail: email,
    action: 'USER_REGISTERED',
    status: 'SUCCESS',
    details: { displayName, email }
  });

  res.json({ success: true, organization: org });
});

// ============================================================
// WEBSITES — Multi-tenant website builder
// ============================================================

const websiteStore = new Map<string, any>();

extensionsRouter.get('/websites/business/:businessId', (req: Request, res: Response) => {
  const website = websiteStore.get(req.params.businessId);
  res.json({ website: website || null });
});

extensionsRouter.post('/websites/business/:businessId', (req: Request, res: Response) => {
  const { businessId } = req.params;
  const data = req.body;
  const website = { ...data, businessId, updatedAt: new Date().toISOString(), status: data.status || 'DRAFT' };
  websiteStore.set(businessId, website);

  db.logAudit({
    organizationId: data.organizationId || 'org_main_001',
    userId: CURRENT_USER_ID,
    userEmail: 'chakankarsai@gmail.com',
    action: 'WEBSITE_DRAFT_SAVED',
    status: 'SUCCESS',
    details: { businessId, slug: data.slug }
  });

  res.json({ success: true, website });
});

extensionsRouter.post('/websites/business/:businessId/publish', (req: Request, res: Response) => {
  const { businessId } = req.params;
  const data = req.body;
  const existing = websiteStore.get(businessId) || {};
  const nextVersion = (existing.publishedVersion || 0) + 1;

  const website = {
    ...existing,
    ...data,
    businessId,
    status: 'PUBLISHED',
    publishedVersion: nextVersion,
    publishedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (website.slug) websiteStore.set(`slug:${website.slug}`, website);
  websiteStore.set(businessId, website);

  db.logAudit({
    organizationId: data.organizationId || 'org_main_001',
    userId: CURRENT_USER_ID,
    userEmail: 'chakankarsai@gmail.com',
    action: 'WEBSITE_PUBLISHED',
    status: 'SUCCESS',
    details: { businessId, slug: website.slug, version: nextVersion }
  });

  res.json({ success: true, website });
});

extensionsRouter.get('/websites/public/:slug', (req: Request, res: Response) => {
  const website = websiteStore.get(`slug:${req.params.slug}`);
  if (!website || website.status !== 'PUBLISHED') {
    return res.status(404).json({ error: 'Website not found or not yet published' });
  }
  res.json({ website });
});

// ============================================================
// BILLING — Razorpay order creation & HMAC verification
// ============================================================

extensionsRouter.get('/billing/status', (_req: Request, res: Response) => {
  const planLimits: Record<string, any> = {
    starter: { aiCreditsLimit: 100, maxBusinesses: 1, maxLocations: 1 },
    growth: { aiCreditsLimit: 500, maxBusinesses: 3, maxLocations: 5 },
    agency: { aiCreditsLimit: 2500, maxBusinesses: 999, maxLocations: 25 },
    enterprise: { aiCreditsLimit: 10000, maxBusinesses: 999, maxLocations: 999 }
  };
  const currentPlan = 'growth';
  const limits = planLimits[currentPlan];

  res.json({
    subscription: {
      planId: currentPlan,
      status: 'trial',
      currentPeriodEnd: new Date(Date.now() + 14 * 86400000).toISOString(),
      razorpaySubscriptionId: null,
      ...limits
    },
    invoices: []
  });
});

extensionsRouter.post('/billing/razorpay/order', (req: Request, res: Response) => {
  const rzpKeyId = process.env.RAZORPAY_KEY_ID;
  const rzpKeySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!rzpKeyId || !rzpKeySecret) {
    return res.status(503).json({
      error: 'Razorpay is NOT_CONFIGURED. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env',
      configurationRequired: true
    });
  }

  // Production: POST to https://api.razorpay.com/v1/orders with Basic Auth
  res.status(503).json({
    error: 'Razorpay credentials found but live order creation requires end-to-end testing.',
    configurationRequired: false,
    status: 'PENDING_TEST'
  });
});

extensionsRouter.post('/billing/razorpay/verify', (req: Request, res: Response) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, planId } = req.body;

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return res.status(400).json({ error: 'Missing payment verification parameters' });
  }

  const rzpKeySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!rzpKeySecret) {
    return res.status(503).json({ error: 'RAZORPAY_KEY_SECRET not configured. Payment verification impossible.' });
  }

  const expectedSig = crypto
    .createHmac('sha256', rzpKeySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  if (expectedSig !== razorpaySignature) {
    db.logAudit({
      organizationId: 'org_main_001',
      userId: CURRENT_USER_ID,
      userEmail: 'webhook@system',
      action: 'PAYMENT_SIGNATURE_MISMATCH',
      status: 'FAILURE',
      details: { razorpayOrderId, razorpayPaymentId, planId }
    });
    return res.status(400).json({ error: 'Payment signature verification failed. Payment REJECTED.' });
  }

  db.logAudit({
    organizationId: 'org_main_001',
    userId: CURRENT_USER_ID,
    userEmail: 'chakankarsai@gmail.com',
    action: 'PAYMENT_VERIFIED',
    status: 'SUCCESS',
    details: { razorpayOrderId, razorpayPaymentId, planId }
  });

  res.json({ success: true, planId, verifiedAt: new Date().toISOString() });
});

extensionsRouter.post('/billing/razorpay/webhook', (req: Request, res: Response) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return res.status(503).json({ error: 'RAZORPAY_WEBHOOK_SECRET not configured' });
  }

  const receivedSig = req.headers['x-razorpay-signature'] as string;
  if (!receivedSig) {
    return res.status(400).json({ error: 'Missing x-razorpay-signature header' });
  }

  const expectedSig = crypto
    .createHmac('sha256', webhookSecret)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (receivedSig !== expectedSig) {
    return res.status(400).json({ error: 'Webhook signature mismatch' });
  }

  const { event } = req.body;
  db.logAudit({
    organizationId: 'org_main_001',
    userId: 'system',
    userEmail: 'webhook@razorpay.com',
    action: `RAZORPAY_${String(event).toUpperCase().replace(/\./g, '_')}`,
    status: 'SUCCESS',
    details: { event }
  });

  res.json({ status: 'ok' });
});

// ============================================================
// SUPPORT TICKETS
// ============================================================

const supportTicketStoreArr: any[] = [];

extensionsRouter.get('/support/tickets', (req: any, res: Response) => {
  const orgId = req.organizationId || 'org_main_001';
  res.json({ tickets: supportTicketStoreArr.filter(t => t.organizationId === orgId) });
});

extensionsRouter.post('/support/tickets', (req: any, res: Response) => {
  const { subject, category, description, priority } = req.body;
  if (!subject || !description) {
    return res.status(400).json({ error: 'subject and description are required' });
  }

  const ticket = {
    id: `TCK-${Math.floor(200 + Math.random() * 800)}`,
    organizationId: req.organizationId || 'org_main_001',
    userId: req.userId || CURRENT_USER_ID,
    subject,
    category: category || 'GENERAL',
    description,
    priority: priority || 'MEDIUM',
    status: 'OPEN',
    createdAt: new Date().toLocaleString(),
    updatedAt: new Date().toLocaleString()
  };

  supportTicketStoreArr.push(ticket);

  db.logAudit({
    organizationId: ticket.organizationId,
    userId: ticket.userId,
    userEmail: req.userEmail || 'user@localos.ai',
    action: 'SUPPORT_TICKET_CREATED',
    status: 'SUCCESS',
    details: { ticketId: ticket.id, subject, category }
  });

  res.json({ success: true, ticket });
});

extensionsRouter.patch('/support/tickets/:id', (req: Request, res: Response) => {
  const ticket = supportTicketStoreArr.find(t => t.id === req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  Object.assign(ticket, req.body, { updatedAt: new Date().toLocaleString() });
  res.json({ success: true, ticket });
});

// ============================================================
// NOTIFICATIONS
// ============================================================

const notifStore: any[] = [];

extensionsRouter.get('/notifications', (req: any, res: Response) => {
  const orgId = req.organizationId || 'org_main_001';
  res.json({ notifications: notifStore.filter(n => n.organizationId === orgId) });
});

extensionsRouter.patch('/notifications/:id/read', (req: any, res: Response) => {
  const notif = notifStore.find(n => n.id === req.params.id);
  if (!notif) return res.status(404).json({ error: 'Not found' });
  notif.read = true;
  res.json({ success: true });
});

extensionsRouter.post('/notifications/mark-all-read', (req: any, res: Response) => {
  const orgId = req.organizationId || 'org_main_001';
  notifStore.forEach(n => { if (n.organizationId === orgId) n.read = true; });
  res.json({ success: true });
});

// ============================================================
// INTEGRATIONS HEALTH — Real config state check
// ============================================================

extensionsRouter.get('/admin/integrations-health', (_req: Request, res: Response) => {
  res.json({
    googleOAuth: {
      configured: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      status: (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) ? 'CONFIGURED' : 'NOT_CONFIGURED',
      redirectUri: process.env.GOOGLE_REDIRECT_URI || 'NOT_SET',
      gbpApiStatus: 'PENDING_APPROVAL'
    },
    gemini: {
      configured: Boolean(process.env.GEMINI_API_KEY),
      status: process.env.GEMINI_API_KEY ? 'CONFIGURED' : 'NOT_CONFIGURED',
      model: process.env.GEMINI_MODEL || 'gemini-3.8-flash'
    },
    razorpay: {
      configured: Boolean(process.env.RAZORPAY_KEY_ID),
      status: process.env.RAZORPAY_KEY_ID ? 'CONFIGURED' : 'NOT_CONFIGURED',
      webhookConfigured: Boolean(process.env.RAZORPAY_WEBHOOK_SECRET)
    },
    email: {
      configured: Boolean(process.env.EMAIL_PROVIDER_KEY),
      status: process.env.EMAIL_PROVIDER_KEY ? 'CONFIGURED' : 'NOT_CONFIGURED'
    },
    whatsapp: {
      configured: Boolean(process.env.WHATSAPP_PROVIDER_KEY),
      status: process.env.WHATSAPP_PROVIDER_KEY ? 'CONFIGURED' : 'NOT_CONFIGURED'
    },
    firebase: {
      configured: true,
      projectId: 'localos-ai-prod-saas',
      status: 'CONFIGURED'
    },
    cloudflare: {
      configured: Boolean(process.env.CLOUDFLARE_ZONE_ID),
      status: process.env.CLOUDFLARE_ZONE_ID ? 'CONFIGURED' : 'NOT_CONFIGURED'
    }
  });
});
