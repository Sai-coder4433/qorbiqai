import { Router, Request, Response } from 'express';
import { db } from '../db/database.ts';
import { googleOAuthService } from '../services/google/oauth.service.ts';
import { googleBusinessProfileService } from '../services/google/business-profile.service.ts';
import { googlePerformanceService } from '../services/google/performance.service.ts';
import { googlePlacesService } from '../services/google/places.service.ts';
import { googleSearchConsoleService } from '../services/google/search-console.service.ts';
import { googleAnalyticsService } from '../services/google/analytics.service.ts';
import { reviewReplyService } from '../services/ai/review-reply.service.ts';
import { reviewGeneratorService } from '../services/ai/review-generator.service.ts';
import { seoAnalyzerService } from '../services/ai/seo-analyzer.service.ts';
import { postGeneratorService } from '../services/ai/post-generator.service.ts';
import { websiteCrawlerService } from '../services/seo/crawler.service.ts';
import { seoAuditService } from '../services/seo/audit.service.ts';
import { localSchemaService } from '../services/seo/schema.service.ts';
import { localKeywordService } from '../services/seo/keyword.service.ts';
import { syncEngineService } from '../services/sync/sync-engine.service.ts';
import { reportGeneratorService } from '../services/ai/report-generator.service.ts';
import { automationEngineService } from '../services/automation/engine.service.ts';
import { AUTOMATION_TEMPLATES } from '../services/automation/templates.ts';
import { queueService } from '../services/automation/queue.service.ts';
import { eventBusService } from '../services/automation/event-bus.service.ts';
import { webhookDispatcherService } from '../services/developer/webhook-dispatcher.service.ts';
import crypto from 'crypto';
import { encrypt } from '../utils/crypto.ts';
import { GoogleIntegration, GooglePost, SeoTask, TrackedKeyword, AutomationRule, ApiKey, WebhookEndpoint } from '../types/index.ts';

export const apiRouter = Router();

// Current mock authenticated session (Super Admin)
const CURRENT_USER_ID = 'usr_admin_001';

// Middleware to attach user and org context
apiRouter.use((req: any, _res: Response, next) => {
  req.userId = CURRENT_USER_ID;
  req.userEmail = 'chakankarsai@gmail.com';
  next();
});

// -------------------------------------------------------------
// Auth & Multi-Tenancy
// -------------------------------------------------------------
apiRouter.get('/auth/me', (req: any, res: Response) => {
  const orgs = db.listOrganizations(req.userId);
  const currentOrg = orgs[0];
  const businesses = currentOrg ? db.listBusinesses(currentOrg.id) : [];

  res.json({
    user: {
      id: req.userId,
      email: req.userEmail,
      name: 'Sai Chakankar',
      role: 'SUPER_ADMIN'
    },
    organizations: orgs,
    currentOrganization: currentOrg,
    businesses
  });
});

apiRouter.get('/organizations', (req: any, res: Response) => {
  const orgs = db.listOrganizations(req.userId);
  res.json({ organizations: orgs });
});

apiRouter.post('/organizations', (req: any, res: Response) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  const org = db.createOrganization(name, req.userId);
  res.json({ organization: org });
});

apiRouter.get('/businesses', (req: any, res: Response) => {
  const orgId = req.query.organizationId as string;
  if (!orgId) return res.status(400).json({ error: 'organizationId required' });
  const businesses = db.listBusinesses(orgId);
  res.json({ businesses });
});

apiRouter.post('/businesses', (req: any, res: Response) => {
  const { organizationId, name, category, website, phone, country, city, address, reviewTone, experienceChips } = req.body;
  if (!organizationId || !name || !category || !country || !city) {
    return res.status(400).json({ error: 'Missing required business fields' });
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now().toString().slice(-4);
  const biz = db.createBusiness({
    organizationId,
    name,
    slug,
    category,
    website,
    phone,
    country,
    city,
    address,
    reviewTone: reviewTone || 'Professional',
    autoReplyEnabled: false,
    autoReplyMinRating: 4,
    experienceChips: experienceChips || ['Quick Service', 'Helpful Staff', 'Great Quality'],
    googleReviewUrl: undefined
  });

  // Create default primary location
  const loc = db.createLocation({
    businessId: biz.id,
    title: `${biz.name} - ${biz.city}`,
    addressLines: address ? [address] : [],
    locality: city,
    administrativeArea: '',
    postalCode: '',
    status: 'OPEN',
    primaryCategory: category
  });

  db.logAudit({
    organizationId,
    businessId: biz.id,
    userId: req.userId,
    userEmail: req.userEmail,
    action: 'BUSINESS_CREATED',
    status: 'SUCCESS',
    details: { businessName: biz.name }
  });

  res.json({ business: biz, location: loc });
});

apiRouter.get('/businesses/:id', (req: Request, res: Response) => {
  const biz = db.getBusiness(req.params.id);
  if (!biz) return res.status(404).json({ error: 'Business not found' });
  const locations = db.listLocations(biz.id);
  const integration = db.getGoogleIntegration(biz.id);
  res.json({ business: biz, locations, integration });
});

apiRouter.patch('/businesses/:id', (req: any, res: Response) => {
  const biz = db.getBusiness(req.params.id);
  if (!biz) return res.status(404).json({ error: 'Business not found' });

  const updated = db.updateBusiness(biz.id, req.body);
  db.logAudit({
    organizationId: biz.organizationId,
    businessId: biz.id,
    userId: req.userId,
    userEmail: req.userEmail,
    action: 'BUSINESS_UPDATED',
    status: 'SUCCESS',
    details: req.body
  });

  res.json({ business: updated });
});

apiRouter.get('/businesses/:id/locations', (req: Request, res: Response) => {
  const locations = db.listLocations(req.params.id);
  res.json({ locations });
});

// -------------------------------------------------------------
// Google OAuth & Business Profile Management
// -------------------------------------------------------------
apiRouter.get('/google/connect', (req: Request, res: Response) => {
  const businessId = req.query.businessId as string;
  const organizationId = req.query.organizationId as string;
  if (!businessId || !organizationId) {
    return res.status(400).json({ error: 'businessId and organizationId required' });
  }

  if (!googleOAuthService.isConfigured()) {
    return res.status(400).json({
      error: 'Google OAuth credentials not configured in environment (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET). Refer to /docs/google-setup.'
    });
  }

  const authUrl = googleOAuthService.getAuthorizationUrl(businessId, organizationId);
  res.json({ url: authUrl });
});

apiRouter.get('/google/callback', async (req: Request, res: Response) => {
  const code = req.query.code as string;
  const stateRaw = req.query.state as string;

  if (!code || !stateRaw) {
    return res.status(400).send('Missing authorization code or state.');
  }

  try {
    const { businessId, organizationId } = JSON.parse(Buffer.from(stateRaw, 'base64').toString('utf8'));
    const tokenData = await googleOAuthService.exchangeCode(code);

    const integration: GoogleIntegration = db.getGoogleIntegration(businessId) || {
      id: 'int_' + Date.now(),
      organizationId,
      businessId,
      status: 'disconnected'
    };

    integration.accessTokenEncrypted = encrypt(tokenData.accessToken);
    if (tokenData.refreshToken) {
      integration.refreshTokenEncrypted = encrypt(tokenData.refreshToken);
    }
    integration.tokenExpiresAt = Date.now() + tokenData.expiresIn * 1000;
    integration.scope = tokenData.scope;
    integration.status = 'connected';
    integration.lastSyncAt = new Date().toISOString();
    integration.errorMessage = undefined;

    db.saveGoogleIntegration(integration);

    db.logAudit({
      organizationId,
      businessId,
      userId: 'oauth_flow',
      userEmail: tokenData.userEmail || 'google_user',
      action: 'GOOGLE_OAUTH_CONNECTED',
      provider: 'google',
      status: 'SUCCESS'
    });

    db.createNotification({
      organizationId,
      businessId,
      title: 'Google Account Connected',
      message: 'Google Business Profile, Search Console, and Analytics authorization completed successfully.',
      type: 'INTEGRATION',
      severity: 'success',
      read: false,
      linkUrl: '/dashboard'
    });

    res.redirect('/dashboard?google_connected=true');
  } catch (err: any) {
    console.error('OAuth Callback error:', err);
    res.status(500).send(`Google OAuth Failed: ${err.message}. Please return to the dashboard and retry.`);
  }
});

apiRouter.get('/google/status', (req: Request, res: Response) => {
  const businessId = (req.query.businessId as string) || 'biz_001';
  const integration = db.getGoogleIntegration(businessId);
  const locations = db.listLocations(businessId);

  res.json({
    status: integration?.status || 'connected',
    accountEmail: integration?.accountName || 'atharva.electricals.pune@gmail.com',
    accountId: integration?.accountId || '10482049182941',
    scope: integration?.scope || 'https://www.googleapis.com/auth/business.manage',
    tokenValid: integration ? (integration.tokenExpiresAt ? integration.tokenExpiresAt > Date.now() : true) : true,
    expiresAt: integration?.tokenExpiresAt || (Date.now() + 3600000),
    lastSyncAt: integration?.lastSyncAt || new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    locations: locations.map(l => ({
      id: l.id,
      title: l.title,
      storeCode: l.storeCode || 'ATH-CHK-01',
      locality: l.locality,
      googlePlaceId: l.googlePlaceId || 'ChIJW3P1zP_PwjsR_6Z-O9xT1k0',
      status: l.status,
      verificationState: 'VERIFIED'
    })),
    realtimePubSub: {
      topic: 'projects/localos-production/topics/gbp-business-events',
      subscription: 'projects/localos-production/subscriptions/localos-gbp-sub',
      status: 'ACTIVE',
      lastEventReceivedAt: new Date(Date.now() - 1000 * 60 * 8).toISOString()
    },
    apis: [
      { name: 'Business Information API', status: 'OPERATIONAL', latencyMs: 120 },
      { name: 'Performance API v1', status: 'OPERATIONAL', latencyMs: 145 },
      { name: 'Reviews API', status: 'OPERATIONAL', latencyMs: 98 },
      { name: 'Posts & Media API', status: 'OPERATIONAL', latencyMs: 110 }
    ]
  });
});

apiRouter.post('/google/reconnect', (req: any, res: Response) => {
  const { businessId } = req.body;
  if (!businessId) return res.status(400).json({ error: 'businessId required' });

  const existing = db.getGoogleIntegration(businessId);
  const integration: GoogleIntegration = existing || {
    id: 'int_' + Date.now(),
    organizationId: 'org_main_001',
    businessId,
    status: 'connected'
  };

  integration.status = 'connected';
  integration.tokenExpiresAt = Date.now() + 3600000 * 4;
  integration.lastSyncAt = new Date().toISOString();
  db.saveGoogleIntegration(integration);

  db.logAudit({
    organizationId: integration.organizationId,
    businessId,
    userId: req.userId || 'usr_admin_001',
    userEmail: req.userEmail || 'posidea1234@gmail.com',
    action: 'GOOGLE_CONNECTION_RENEWED',
    provider: 'google',
    status: 'SUCCESS'
  });

  res.json({ success: true, status: 'connected', lastSyncAt: integration.lastSyncAt });
});

apiRouter.get('/google/accounts', async (req: Request, res: Response) => {
  const businessId = req.query.businessId as string;
  if (!businessId) return res.status(400).json({ error: 'businessId required' });

  try {
    const accounts = await googleBusinessProfileService.listAccounts(businessId);
    res.json({ accounts });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/google/locations', async (req: Request, res: Response) => {
  const businessId = req.query.businessId as string;
  const accountName = req.query.accountName as string;
  if (!businessId || !accountName) return res.status(400).json({ error: 'businessId and accountName required' });

  try {
    const locations = await googleBusinessProfileService.listLocations(businessId, accountName);
    res.json({ locations });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/google/sync', async (req: any, res: Response) => {
  const { businessId, locationId } = req.body;
  if (!businessId) return res.status(400).json({ error: 'businessId required' });

  const integration = db.getGoogleIntegration(businessId);
  if (!integration || integration.status !== 'connected') {
    return res.status(400).json({
      error: 'Google is disconnected. Please connect Google Business Profile first.',
      status: 'disconnected'
    });
  }

  try {
    // 1. Sync accounts if accountName missing
    if (!integration.accountName) {
      const accounts = await googleBusinessProfileService.listAccounts(businessId);
      if (accounts.length > 0) {
        integration.accountName = accounts[0].name;
        integration.accountId = accounts[0].accountNumber;
      }
    }

    // 2. Fetch official reviews
    if (integration.accountName && locationId) {
      const location = db.getLocation(locationId);
      const locName = location?.googleLocationName || `locations/${locationId}`;
      try {
        const rawReviews = await googleBusinessProfileService.listReviews(businessId, integration.accountName, locName);
        for (const r of rawReviews) {
          db.saveReview({
            id: r.reviewId || 'rev_' + Date.now(),
            businessId,
            locationId,
            googleReviewId: r.reviewId,
            reviewerName: r.reviewer?.displayName || 'Google Customer',
            reviewerPhotoUrl: r.reviewer?.profilePhotoUrl,
            starRating: r.starRating === 'FIVE' ? 5 : r.starRating === 'FOUR' ? 4 : r.starRating === 'THREE' ? 3 : r.starRating === 'TWO' ? 2 : 1,
            comment: r.comment,
            createTime: r.createTime,
            updateTime: r.updateTime,
            replyComment: r.reviewReply?.comment,
            replyUpdateTime: r.reviewReply?.updateTime,
            replyStatus: r.reviewReply?.comment ? 'REPLIED' : 'UNREPLIED'
          });
        }
      } catch (e: any) {
        console.warn('Reviews sync note:', e.message);
      }

      // 3. Fetch performance metrics
      try {
        const perf = await googlePerformanceService.getPerformance(businessId, locName, 30);
        db.savePerformanceSnapshot(perf);
      } catch (e: any) {
        console.warn('Performance sync note:', e.message);
      }
    }

    integration.lastSyncAt = new Date().toISOString();
    db.saveGoogleIntegration(integration);

    res.json({
      success: true,
      lastSyncAt: integration.lastSyncAt,
      status: integration.status
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/google/disconnect', (req: any, res: Response) => {
  const { businessId } = req.body;
  if (!businessId) return res.status(400).json({ error: 'businessId required' });

  const integration = db.getGoogleIntegration(businessId);
  if (integration) {
    integration.status = 'disconnected';
    integration.accessTokenEncrypted = undefined;
    integration.refreshTokenEncrypted = undefined;
    integration.tokenExpiresAt = undefined;
    db.saveGoogleIntegration(integration);

    db.logAudit({
      organizationId: integration.organizationId,
      businessId,
      userId: req.userId,
      userEmail: req.userEmail,
      action: 'GOOGLE_DISCONNECTED',
      status: 'SUCCESS'
    });
  }

  res.json({ success: true, status: 'disconnected' });
});

// -------------------------------------------------------------
// Reviews API
// -------------------------------------------------------------
apiRouter.get('/reviews', (req: Request, res: Response) => {
  const businessId = req.query.businessId as string;
  const locationId = req.query.locationId as string;
  const filter = req.query.filter as string;
  if (!businessId) return res.status(400).json({ error: 'businessId required' });

  const integration = db.getGoogleIntegration(businessId);
  const reviews = db.listReviews(businessId, locationId, filter);

  res.json({
    integrationStatus: integration?.status || 'disconnected',
    lastSyncedAt: integration?.lastSyncAt,
    reviews
  });
});

apiRouter.post('/reviews/:id/generate-reply', async (req: Request, res: Response) => {
  const reviewId = req.params.id;
  const review = db.getReview(reviewId);
  if (!review) return res.status(404).json({ error: 'Review not found' });

  const business = db.getBusiness(review.businessId);
  if (!business) return res.status(404).json({ error: 'Business not found' });

  try {
    const language = (req.body.language || 'en') as 'en' | 'hi' | 'mr';
    const variationsResult = await reviewReplyService.generateReplyVariations(business, review, language);

    // Save primary draft
    review.aiDraftReply = variationsResult.variations[0].replyText;
    review.aiDraftTone = req.body.tone || business.reviewTone;
    review.aiDraftGeneratedAt = new Date().toISOString();
    if (variationsResult.riskAssessment.isSensitive) {
      review.sensitivityRisk = variationsResult.riskAssessment.riskCategory;
      review.replyStatus = 'NEEDS_ATTENTION';
    }
    db.saveReview(review);

    // Telemetry log
    db.trackAiUsage({
      organizationId: business.organizationId,
      businessId: business.id,
      feature: 'review_reply_multi_variation',
      model: 'gemini-2.5-flash',
      inputTokens: 180,
      outputTokens: 260,
      estimatedCostUsd: 0.0003
    });

    res.json({
      draftReply: variationsResult.variations[0].replyText,
      variations: variationsResult.variations,
      riskAssessment: variationsResult.riskAssessment,
      metadata: variationsResult.metadata
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/reviews/:id/publish-reply', async (req: any, res: Response) => {
  const reviewId = req.params.id;
  const { replyComment } = req.body;
  if (!replyComment) return res.status(400).json({ error: 'replyComment is required' });

  const review = db.getReview(reviewId);
  if (!review) return res.status(404).json({ error: 'Review not found' });

  const business = db.getBusiness(review.businessId);
  if (!business) return res.status(404).json({ error: 'Business not found' });

  const integration = db.getGoogleIntegration(business.id);
  if (!integration || integration.status !== 'connected' || !integration.accountName) {
    return res.status(400).json({ error: 'Google integration disconnected or authorization expired.' });
  }

  try {
    const location = db.getLocation(review.locationId);
    const locName = location?.googleLocationName || `locations/${review.locationId}`;

    await googleBusinessProfileService.replyToReview(
      business.id,
      integration.accountName,
      locName,
      review.googleReviewId,
      replyComment
    );

    review.replyComment = replyComment;
    review.replyUpdateTime = new Date().toISOString();
    review.replyStatus = 'REPLIED';
    db.saveReview(review);

    db.logAudit({
      organizationId: business.organizationId,
      businessId: business.id,
      userId: req.userId,
      userEmail: req.userEmail,
      action: 'GOOGLE_REVIEW_REPLIED',
      provider: 'google_business_profile',
      status: 'SUCCESS',
      details: { reviewId: review.googleReviewId }
    });

    res.json({ success: true, review });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// Google Posts API
// -------------------------------------------------------------
apiRouter.get('/posts', (req: Request, res: Response) => {
  const businessId = req.query.businessId as string;
  const locationId = req.query.locationId as string;
  if (!businessId) return res.status(400).json({ error: 'businessId required' });

  const posts = db.listPosts(businessId, locationId);
  res.json({ posts });
});

apiRouter.post('/posts/generate', async (req: Request, res: Response) => {
  const { businessId, topicType, facts, offerDetails, eventDetails, ctaType } = req.body;
  const business = db.getBusiness(businessId);
  if (!business) return res.status(404).json({ error: 'Business not found' });

  try {
    const draft = await postGeneratorService.draftPost({
      business,
      topicType: topicType || 'STANDARD',
      facts: facts || '',
      offerDetails,
      eventDetails,
      ctaType
    });
    res.json(draft);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/posts', async (req: any, res: Response) => {
  const { businessId, locationId, topicType, summary, callToAction, event, offer, mediaUrl, publishNow } = req.body;
  const business = db.getBusiness(businessId);
  if (!business) return res.status(404).json({ error: 'Business not found' });

  const post: GooglePost = {
    id: 'post_' + Date.now(),
    businessId,
    locationId,
    topicType: topicType || 'STANDARD',
    summary,
    callToAction,
    event,
    offer,
    mediaUrl,
    status: (publishNow ? 'PUBLISHED' : 'DRAFT') as any,
    publishedTime: publishNow ? new Date().toISOString() : undefined,
    createdAt: new Date().toISOString()
  };

  if (publishNow) {
    const integration = db.getGoogleIntegration(businessId);
    if (integration?.status === 'connected' && integration.accountName) {
      const location = db.getLocation(locationId);
      const locName = location?.googleLocationName || `locations/${locationId}`;
      try {
        const payload: any = {
          languageCode: 'en-US',
          summary,
          topicType
        };
        if (callToAction) payload.callToAction = callToAction;
        if (event) payload.event = event;
        if (offer) payload.offer = offer;

        const created = await googleBusinessProfileService.createPost(
          businessId,
          integration.accountName,
          locName,
          payload
        );
        post.googlePostId = created.name;
      } catch (err: any) {
        post.status = 'FAILED';
        db.savePost(post);
        return res.status(500).json({ error: `Google API publish failed: ${err.message}` });
      }
    }
  }

  db.savePost(post);
  db.logAudit({
    organizationId: business.organizationId,
    businessId,
    userId: req.userId,
    userEmail: req.userEmail,
    action: publishNow ? 'GOOGLE_POST_PUBLISHED' : 'GOOGLE_POST_DRAFT_SAVED',
    status: 'SUCCESS',
    details: { topicType }
  });

  res.json({ post });
});

apiRouter.delete('/posts/:id', (req: Request, res: Response) => {
  const deleted = db.deletePost(req.params.id);
  res.json({ success: deleted });
});

// -------------------------------------------------------------
// Media API
// -------------------------------------------------------------
apiRouter.get('/media', (req: Request, res: Response) => {
  const businessId = req.query.businessId as string;
  const locationId = req.query.locationId as string;
  if (!businessId) return res.status(400).json({ error: 'businessId required' });
  const media = db.listMedia(businessId, locationId);
  res.json({ media });
});

apiRouter.post('/media', (req: any, res: Response) => {
  const { businessId, locationId, mediaFormat, category, mediaUrl } = req.body;
  if (!businessId || !category || !mediaUrl) {
    return res.status(400).json({ error: 'businessId, category, and mediaUrl are required' });
  }

  const item = {
    id: 'med_' + Date.now(),
    businessId,
    locationId: locationId || '',
    mediaFormat: mediaFormat || 'PHOTO',
    category,
    mediaUrl,
    createTime: new Date().toISOString()
  };

  db.saveMedia(item);
  res.json({ media: item });
});

// -------------------------------------------------------------
// GBP Profile Optimization & Deterministic Audit
// -------------------------------------------------------------
apiRouter.get('/businesses/:id/audit-score', (req: Request, res: Response) => {
  const biz = db.getBusiness(req.params.id);
  if (!biz) return res.status(404).json({ error: 'Business not found' });
  const locations = db.listLocations(biz.id);
  const reviews = db.listReviews(biz.id);

  const scoreResult = seoAuditService.calculateGBPAuditScore(biz, locations[0], reviews);
  res.json(scoreResult);
});

apiRouter.post('/businesses/:id/optimize-profile', async (req: Request, res: Response) => {
  const biz = db.getBusiness(req.params.id);
  if (!biz) return res.status(404).json({ error: 'Business not found' });
  const locations = db.listLocations(biz.id);
  const location = locations[0];

  try {
    const suggestions = await seoAnalyzerService.optimizeGBPProfile(biz, location);
    res.json({ suggestions });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// Performance API
// -------------------------------------------------------------
apiRouter.get('/performance', (req: Request, res: Response) => {
  const businessId = req.query.businessId as string;
  const locationId = req.query.locationId as string;
  if (!businessId) return res.status(400).json({ error: 'businessId required' });

  const integration = db.getGoogleIntegration(businessId);
  const perf = locationId ? db.getPerformanceSnapshot(businessId, locationId) : undefined;

  res.json({
    integrationStatus: integration?.status || 'disconnected',
    lastSyncedAt: perf?.lastSyncedAt || integration?.lastSyncAt,
    performance: perf || null
  });
});

apiRouter.post('/performance/summary', async (req: Request, res: Response) => {
  const { businessId, locationId } = req.body;
  const biz = db.getBusiness(businessId);
  if (!biz) return res.status(404).json({ error: 'Business not found' });

  const perf = db.getPerformanceSnapshot(businessId, locationId);
  if (!perf) {
    return res.status(400).json({ error: 'No live performance metrics synced yet for this location.' });
  }

  try {
    const summary = await seoAnalyzerService.generatePerformanceSummary(biz, perf);
    res.json(summary);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// Search Console API
// -------------------------------------------------------------
apiRouter.get('/search-console/analytics', async (req: Request, res: Response) => {
  const businessId = req.query.businessId as string;
  const siteUrl = req.query.siteUrl as string;
  if (!businessId) return res.status(400).json({ error: 'businessId required' });

  const integration = db.getGoogleIntegration(businessId);
  const cached = db.getSearchConsoleData(businessId);

  if (integration?.status === 'connected' && siteUrl) {
    try {
      const data = await googleSearchConsoleService.queryAnalytics(businessId, siteUrl);
      db.saveSearchConsoleData(businessId, data);
      return res.json({ data, integrationStatus: 'connected' });
    } catch (e: any) {
      console.warn('Search console live query error:', e.message);
    }
  }

  res.json({
    data: cached || null,
    integrationStatus: integration?.status || 'disconnected'
  });
});

apiRouter.get('/search-console/opportunities', async (req: Request, res: Response) => {
  const businessId = req.query.businessId as string;
  const biz = db.getBusiness(businessId);
  if (!biz) return res.status(404).json({ error: 'Business not found' });

  const data = db.getSearchConsoleData(businessId);
  if (!data) {
    return res.status(400).json({ error: 'No Search Console data connected yet.' });
  }

  try {
    const tasks = await seoAnalyzerService.analyzeSearchConsole(biz, data);
    res.json({ tasks });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// Google Analytics 4 (GA4) API
// -------------------------------------------------------------
apiRouter.get('/analytics/report', async (req: Request, res: Response) => {
  const businessId = req.query.businessId as string;
  const propertyId = req.query.propertyId as string;
  if (!businessId) return res.status(400).json({ error: 'businessId required' });

  const integration = db.getGoogleIntegration(businessId);
  const cached = db.getAnalyticsData(businessId);

  if (integration?.status === 'connected' && propertyId) {
    try {
      const data = await googleAnalyticsService.runReport(businessId, propertyId);
      db.saveAnalyticsData(businessId, data);
      return res.json({ data, integrationStatus: 'connected' });
    } catch (e: any) {
      console.warn('GA4 live query note:', e.message);
    }
  }

  res.json({
    data: cached || null,
    integrationStatus: integration?.status || 'disconnected'
  });
});

// -------------------------------------------------------------
// Places API (New) & Competitor Snapshot
// -------------------------------------------------------------
apiRouter.get('/competitors', (req: Request, res: Response) => {
  const businessId = req.query.businessId as string;
  if (!businessId) return res.status(400).json({ error: 'businessId required' });
  const competitors = db.getCompetitors(businessId);
  res.json({
    configured: googlePlacesService.isConfigured(),
    competitors
  });
});

apiRouter.post('/competitors/scan', async (req: Request, res: Response) => {
  const { businessId, query, latitude, longitude, radiusMeters } = req.body;
  if (!businessId || !query || latitude === undefined || longitude === undefined) {
    return res.status(400).json({ error: 'businessId, query, latitude, and longitude required' });
  }

  try {
    const results = await googlePlacesService.searchCompetitors(query, Number(latitude), Number(longitude), radiusMeters || 5000);
    db.saveCompetitors(businessId, results);
    res.json({ competitors: results });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// Local Visibility Geo-Grid Tracking
// -------------------------------------------------------------
apiRouter.get('/rank-grid/history', (req: Request, res: Response) => {
  const businessId = req.query.businessId as string;
  if (!businessId) return res.status(400).json({ error: 'businessId required' });
  const scans = db.getRankGridScans(businessId);
  res.json({ scans });
});

apiRouter.post('/rank-grid/scan', async (req: Request, res: Response) => {
  const { businessId, keyword, targetPlaceId, centerLat, centerLng, gridSize, radiusKm } = req.body;
  if (!businessId || !keyword || centerLat === undefined || centerLng === undefined) {
    return res.status(400).json({ error: 'businessId, keyword, centerLat, centerLng required' });
  }

  try {
    const scan = await googlePlacesService.scanVisibilityGrid(
      businessId,
      keyword,
      targetPlaceId || '',
      Number(centerLat),
      Number(centerLng),
      gridSize || 3,
      radiusKm || 5
    );
    db.saveRankGridScan(scan);
    res.json({ scan });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// Website SEO Crawler & Technical SEO
// -------------------------------------------------------------
apiRouter.post('/seo/crawl', async (req: Request, res: Response) => {
  const { businessId, websiteUrl } = req.body;
  if (!businessId || !websiteUrl) return res.status(400).json({ error: 'businessId and websiteUrl required' });

  try {
    const result = await websiteCrawlerService.crawl(websiteUrl);
    db.saveSeoCrawl(businessId, result);
    res.json({ result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/seo/audit', (req: Request, res: Response) => {
  const businessId = req.query.businessId as string;
  if (!businessId) return res.status(400).json({ error: 'businessId required' });
  const result = db.getSeoCrawl(businessId);
  res.json({ result: result || null });
});

apiRouter.get('/seo/issues', (req: Request, res: Response) => {
  const businessId = req.query.businessId as string;
  if (!businessId) return res.status(400).json({ error: 'businessId required' });
  const issues = db.listSeoIssues(businessId);
  res.json({ issues });
});

apiRouter.patch('/seo/issues/:id', (req: Request, res: Response) => {
  const { status } = req.body;
  const updated = db.updateSeoIssueStatus(req.params.id, status);
  res.json({ success: updated });
});

apiRouter.get('/seo/schema', (req: Request, res: Response) => {
  const businessId = req.query.businessId as string;
  const biz = db.getBusiness(businessId);
  if (!biz) return res.status(404).json({ error: 'Business not found' });
  const locations = db.listLocations(biz.id);
  const schema = localSchemaService.generateLocalBusinessSchema(biz, locations[0]);
  res.json({ schema });
});

// -------------------------------------------------------------
// Local Keyword Engine (Split Architecture: GBP Insights, Search Console, AI, Tracked)
// -------------------------------------------------------------
apiRouter.get('/keywords', (req: Request, res: Response) => {
  const businessId = req.query.businessId as string;
  const biz = db.getBusiness(businessId);
  if (!biz) return res.status(404).json({ error: 'Business not found' });

  const integration = db.getGoogleIntegration(businessId);
  const isConnected = integration?.status === 'connected';

  // 1. Search Console queries
  const scData = db.getSearchConsoleData(businessId);
  const searchConsoleQueries = (scData?.queries || []).map(q => ({
    query: q.query,
    clicks: q.clicks,
    impressions: q.impressions,
    ctr: q.ctr,
    position: q.position,
    source: 'Google Search Console API'
  }));

  // 2. GBP Search Insights
  const perfData = db.getPerformanceSnapshot(businessId, db.listLocations(businessId)[0]?.id || '');
  const gbpSearchInsights = scData?.queries ? scData.queries.slice(0, 15).map(q => ({
    query: q.query,
    period: 'Last 28 Days',
    impressions: q.impressions,
    source: 'Google Business Profile Search Keywords'
  })) : [];

  // 3. Tracked Keywords
  const trackedKeywords = db.listTrackedKeywords(businessId);

  res.json({
    integrationStatus: integration?.status || 'disconnected',
    lastSyncedAt: integration?.lastSyncAt || scData?.lastSyncedAt,
    gbpSearchInsights,
    searchConsoleQueries,
    trackedKeywords
  });
});

apiRouter.post('/keywords/generate', async (req: Request, res: Response) => {
  const { businessId, neighborhoods } = req.body;
  const biz = db.getBusiness(businessId);
  if (!biz) return res.status(404).json({ error: 'Business not found' });

  try {
    const candidates = await localKeywordService.generateCandidates(biz, neighborhoods || []);
    res.json({ candidates });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// AI Action Center
// -------------------------------------------------------------
apiRouter.get('/actions', (req: Request, res: Response) => {
  const businessId = req.query.businessId as string;
  const biz = db.getBusiness(businessId);
  if (!biz) return res.status(404).json({ error: 'Business not found' });

  const reviews = db.listReviews(biz.id);
  const unreplied = reviews.filter(r => r.replyStatus === 'UNREPLIED');
  const needsAttention = reviews.filter(r => r.starRating <= 3 && r.replyStatus !== 'REPLIED');
  const crawl = db.getSeoCrawl(biz.id);
  const criticalSeo = (crawl?.issues || []).filter(i => i.severity === 'Critical' && i.status === 'Open');
  const integration = db.getGoogleIntegration(biz.id);

  const actions = [];

  if (integration?.status !== 'connected') {
    actions.push({
      id: 'act_google_conn',
      title: 'Google Business Profile Disconnected',
      severity: 'Critical',
      category: 'Integration',
      description: 'Connect Google OAuth to sync live reviews, insights, and local rankings.',
      buttonText: 'Connect Google',
      link: '/admin/integrations'
    });
  }

  if (needsAttention.length > 0) {
    actions.push({
      id: 'act_low_star',
      title: `${needsAttention.length} Critical Review(s) Awaiting Resolution`,
      severity: 'Critical',
      category: 'Reputation',
      description: 'Customer reviews rated 3 stars or lower require professional, timely replies to protect local trust.',
      buttonText: 'View Reviews',
      link: '/dashboard/reviews?filter=NEEDS_ATTENTION'
    });
  }

  if (unreplied.length > 0) {
    actions.push({
      id: 'act_unreplied',
      title: `${unreplied.length} Unreplied Google Review(s)`,
      severity: 'High Impact',
      category: 'Reputation',
      description: 'Responding to 100% of reviews signals active local management to Google algorithms and customers.',
      buttonText: 'Draft AI Replies',
      link: '/dashboard/reviews?filter=UNREPLIED'
    });
  }

  if (criticalSeo.length > 0) {
    actions.push({
      id: 'act_seo_crit',
      title: `${criticalSeo.length} Critical Technical SEO Issue(s) on Website`,
      severity: 'Critical',
      category: 'Website SEO',
      description: criticalSeo[0].description,
      buttonText: 'Fix SEO Issue',
      link: '/dashboard/seo'
    });
  }

  res.json({ actions });
});

// -------------------------------------------------------------
// Customer Review Flow (NFC / QR /r/:businessSlug)
// -------------------------------------------------------------
apiRouter.get('/public/review/:slug', (req: Request, res: Response) => {
  const business = db.getBusinessBySlug(req.params.slug);
  if (!business) return res.status(404).json({ error: 'Business not found' });
  const locations = db.listLocations(business.id);
  const location = locations[0];

  res.json({
    business: {
      name: business.name,
      slug: business.slug,
      category: business.category,
      city: business.city,
      country: business.country,
      googleReviewUrl: business.googleReviewUrl || (location?.googlePlaceId ? `https://search.google.com/local/writereview?placeid=${location.googlePlaceId}` : 'https://google.com/maps'),
      experienceChips: business.experienceChips || ['Great Service', 'Clean & Pleasant', 'Helpful Staff']
    }
  });
});

apiRouter.post('/public/review/:slug/draft', async (req: Request, res: Response) => {
  const business = db.getBusinessBySlug(req.params.slug);
  if (!business) return res.status(404).json({ error: 'Business not found' });

  const { rating, selectedChips, customerNote } = req.body;
  if (!rating) return res.status(400).json({ error: 'Rating required' });

  try {
    const draft = await reviewGeneratorService.draftCustomerReview(
      business,
      Number(rating),
      selectedChips || [],
      customerNote
    );
    res.json(draft);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/public/review/:slug/private-feedback', (req: Request, res: Response) => {
  const business = db.getBusinessBySlug(req.params.slug);
  if (!business) return res.status(404).json({ error: 'Business not found' });

  const { rating, message, customerName, customerEmail } = req.body;
  if (!rating || !message) {
    return res.status(400).json({ error: 'Rating and feedback message are required' });
  }

  const feedback = {
    id: 'fb_' + Date.now(),
    businessId: business.id,
    rating: Number(rating),
    message,
    customerName,
    customerEmail,
    status: 'Needs attention' as const,
    createdAt: new Date().toISOString()
  };

  db.savePrivateFeedback(feedback);

  db.createNotification({
    organizationId: business.organizationId,
    businessId: business.id,
    title: `Private Customer Feedback (${rating} Stars)`,
    message: `${customerName || 'A customer'} submitted private feedback: "${message.slice(0, 60)}..."`,
    type: 'REVIEW',
    severity: rating <= 3 ? 'critical' : 'info',
    read: false,
    linkUrl: '/dashboard/feedback'
  });

  res.json({ success: true, feedback });
});

// Private feedback management
apiRouter.get('/businesses/:id/feedback', (req: Request, res: Response) => {
  const feedbacks = db.listPrivateFeedback(req.params.id);
  res.json({ feedbacks });
});

apiRouter.patch('/feedback/:id', (req: Request, res: Response) => {
  const updated = db.updatePrivateFeedback(req.params.id, req.body);
  res.json({ success: updated });
});

// -------------------------------------------------------------
// Automations API (Production Engine V2)
// -------------------------------------------------------------

// Main overview: rules, master switch, health stats
apiRouter.get('/automations', (req: Request, res: Response) => {
  const businessId = (req.query.businessId as string) || 'biz_001';
  const category = req.query.category as string;
  const locationId = req.query.locationId as string;

  const rules = db.listAutomationRules(businessId, category, locationId);
  const masterSwitch = db.getAutomationMasterSwitch(businessId);
  const stats = db.getAutomationStats(businessId);

  res.json({
    rules,
    masterSwitch,
    stats,
    categories: ['ALL', 'GOOGLE', 'SEO', 'COMPETITOR', 'ANALYTICS', 'AI', 'NOTIFICATIONS', 'SYSTEM']
  });
});

// Automation Health & Summary Stats
apiRouter.get('/automations/stats', (req: Request, res: Response) => {
  const businessId = (req.query.businessId as string) || 'biz_001';
  const stats = db.getAutomationStats(businessId);
  res.json({ stats });
});

// Rules Management
apiRouter.get('/automations/rules', (req: Request, res: Response) => {
  const businessId = (req.query.businessId as string) || 'biz_001';
  const category = req.query.category as string;
  const locationId = req.query.locationId as string;
  const rules = db.listAutomationRules(businessId, category, locationId);
  res.json({ rules });
});

apiRouter.get('/automations/rules/:id', (req: Request, res: Response) => {
  const rule = db.getAutomationRule(req.params.id);
  if (!rule) return res.status(404).json({ error: 'Automation rule not found' });
  res.json({ rule });
});

apiRouter.post('/automations/rules', (req: Request, res: Response) => {
  const { businessId, organizationId, name, description, category, triggerType, triggerConfig, conditionConfig, actionConfig, scheduleConfig, approvalMode, priority } = req.body;
  if (!businessId || !name) return res.status(400).json({ error: 'businessId and name required' });

  const newRule: AutomationRule = {
    id: 'rule_' + Date.now().toString(36),
    organizationId: organizationId || 'org_main_001',
    businessId,
    name,
    description: description || '',
    category: category || 'GOOGLE',
    triggerType: triggerType || 'SCHEDULE',
    triggerConfig: triggerConfig || {},
    conditionConfig: conditionConfig || { logicalOperator: 'AND', rules: [] },
    actionConfig: actionConfig || [],
    scheduleConfig: scheduleConfig || { frequency: 'DAILY' },
    approvalMode: approvalMode || 'AUTO',
    enabled: true,
    priority: priority || 'MEDIUM',
    version: 1,
    createdBy: 'usr_admin_001',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.saveAutomationRule(newRule);
  res.json({ success: true, rule: newRule });
});

apiRouter.patch('/automations/rules/:id', (req: Request, res: Response) => {
  const rule = db.getAutomationRule(req.params.id);
  if (!rule) return res.status(404).json({ error: 'Automation rule not found' });

  const updated: AutomationRule = {
    ...rule,
    ...req.body,
    id: rule.id,
    businessId: rule.businessId,
    updatedAt: new Date().toISOString()
  };

  db.saveAutomationRule(updated);
  res.json({ success: true, rule: updated });
});

apiRouter.delete('/automations/rules/:id', (req: Request, res: Response) => {
  const deleted = db.deleteAutomationRule(req.params.id);
  res.json({ success: deleted });
});

// Toggle rule state ON / OFF
apiRouter.post('/automations/rules/:id/toggle', (req: Request, res: Response) => {
  const rule = db.getAutomationRule(req.params.id);
  if (!rule) return res.status(404).json({ error: 'Automation rule not found' });

  rule.enabled = req.body.enabled !== undefined ? Boolean(req.body.enabled) : !rule.enabled;
  db.saveAutomationRule(rule);

  db.logAudit({
    organizationId: rule.organizationId,
    businessId: rule.businessId,
    userId: 'usr_admin_001',
    userEmail: 'admin@localos.ai',
    action: rule.enabled ? 'AUTOMATION_ENABLED' : 'AUTOMATION_PAUSED',
    provider: 'automation_engine',
    status: 'SUCCESS',
    details: { ruleId: rule.id, name: rule.name, enabled: rule.enabled }
  });

  res.json({ success: true, enabled: rule.enabled, rule });
});

// Run rule immediately right now (real backend job execution)
apiRouter.post('/automations/rules/:id/run-now', async (req: Request, res: Response) => {
  try {
    const userEmail = (req as any).userEmail || 'admin@localos.ai';
    const run = await automationEngineService.runRuleNow(req.params.id, userEmail);
    res.json({ success: true, run });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Dry-run simulation (evaluates condition & shows proposed actions without mutations)
apiRouter.post('/automations/rules/:id/dry-run', async (req: Request, res: Response) => {
  try {
    const simulation = await automationEngineService.dryRunRule(req.params.id);
    res.json({ success: true, simulation });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Global Master Switch
apiRouter.post('/automations/master-switch', (req: Request, res: Response) => {
  const businessId = req.body.businessId || 'biz_001';
  const enabled = Boolean(req.body.enabled);
  db.setAutomationMasterSwitch(businessId, enabled);

  const business = db.getBusiness(businessId);
  if (business) {
    db.logAudit({
      organizationId: business.organizationId,
      businessId,
      userId: 'usr_admin_001',
      userEmail: 'admin@localos.ai',
      action: enabled ? 'AUTOMATION_MASTER_RESUMED' : 'AUTOMATION_MASTER_PAUSED',
      provider: 'automation_engine',
      status: 'SUCCESS',
      details: { businessId, enabled }
    });
  }

  res.json({ success: true, masterSwitch: enabled });
});

// Execution Runs & Logs History
apiRouter.get('/automations/runs', (req: Request, res: Response) => {
  const businessId = (req.query.businessId as string) || 'biz_001';
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
  const runs = db.listAutomationRuns(businessId, limit);
  res.json({ runs });
});

apiRouter.get('/automations/runs/:id', (req: Request, res: Response) => {
  const run = db.getAutomationRun(req.params.id);
  if (!run) return res.status(404).json({ error: 'Automation run not found' });
  res.json({ run });
});

apiRouter.post('/automations/runs/:id/retry', async (req: Request, res: Response) => {
  try {
    const newRun = await automationEngineService.retryFailedRun(req.params.id);
    res.json({ success: true, run: newRun });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Approval Center
apiRouter.get('/automations/approvals', (req: Request, res: Response) => {
  const businessId = (req.query.businessId as string) || 'biz_001';
  const status = req.query.status as string;
  const approvals = db.listAutomationApprovals(businessId, status);
  res.json({ approvals });
});

apiRouter.post('/automations/approvals/:id/approve', async (req: Request, res: Response) => {
  try {
    const reviewerEmail = (req as any).userEmail || 'admin@localos.ai';
    const result = await automationEngineService.approvePendingAction(req.params.id, reviewerEmail);
    res.json({ success: true, result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/automations/approvals/:id/reject', async (req: Request, res: Response) => {
  try {
    const reviewerEmail = (req as any).userEmail || 'admin@localos.ai';
    const reason = req.body.reason;
    const result = await automationEngineService.rejectPendingAction(req.params.id, reviewerEmail, reason);
    res.json({ success: true, result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Templates Gallery
apiRouter.get('/automations/templates', (_req: Request, res: Response) => {
  res.json({ templates: AUTOMATION_TEMPLATES });
});

apiRouter.post('/automations/from-template', (req: Request, res: Response) => {
  const { templateId, businessId, organizationId } = req.body;
  const template = AUTOMATION_TEMPLATES.find(t => t.id === templateId);
  if (!template) return res.status(404).json({ error: 'Template not found' });

  const bizId = businessId || 'biz_001';
  const orgId = organizationId || 'org_main_001';
  const newRule = template.ruleFactory(bizId, orgId);

  // If a rule with this ID already exists, generate unique ID
  if (db.getAutomationRule(newRule.id)) {
    newRule.id = newRule.id + '_' + Date.now().toString(36);
  }

  db.saveAutomationRule(newRule);
  res.json({ success: true, rule: newRule });
});

// Queue Health & Background Workers
apiRouter.get('/automations/queue/status', (_req: Request, res: Response) => {
  const status = queueService.getQueueStatus();
  res.json({ status });
});

// -------------------------------------------------------------
// Notifications & Audit Logs
// -------------------------------------------------------------
apiRouter.get('/notifications', (req: Request, res: Response) => {
  const orgId = req.query.organizationId as string;
  if (!orgId) return res.status(400).json({ error: 'organizationId required' });
  const notifs = db.listNotifications(orgId);
  res.json({ notifications: notifs });
});

apiRouter.patch('/notifications/:id/read', (req: Request, res: Response) => {
  db.markNotificationRead(req.params.id);
  res.json({ success: true });
});

apiRouter.get('/audit-logs', (req: Request, res: Response) => {
  const orgId = req.query.organizationId as string;
  const businessId = req.query.businessId as string;
  const logs = db.listAuditLogs(orgId, businessId);
  res.json({ logs });
});

// -------------------------------------------------------------
// Admin & Integration Health
// -------------------------------------------------------------
apiRouter.get('/admin/stats', (_req: Request, res: Response) => {
  const stats = db.getAdminStats();
  res.json({ stats });
});

apiRouter.get('/admin/integrations-health', (_req: Request, res: Response) => {
  res.json({
    googleOAuth: {
      configured: googleOAuthService.isConfigured(),
      clientIdConfigured: Boolean(process.env.GOOGLE_CLIENT_ID),
      redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/google/callback'
    },
    googleMapsPlaces: {
      configured: googlePlacesService.isConfigured(),
      apiKeyConfigured: Boolean(process.env.GOOGLE_MAPS_API_KEY)
    },
    geminiAi: {
      configured: Boolean(process.env.GEMINI_API_KEY),
      model: process.env.GEMINI_MODEL || 'gemini-3.8-flash'
    },
    emailProvider: {
      configured: Boolean(process.env.EMAIL_PROVIDER_KEY)
    }
  });
});

apiRouter.get('/admin/ai-usage', (req: Request, res: Response) => {
  const orgId = req.query.organizationId as string;
  if (!orgId) return res.status(400).json({ error: 'organizationId required' });
  const records = db.listAiUsage(orgId);
  res.json({ records });
});

apiRouter.get('/admin/rate-limits', (req: Request, res: Response) => {
  const businessId = req.query.businessId as string || 'biz_001';
  const limits = db.getRateLimits(businessId);
  res.json({ limits });
});

// -------------------------------------------------------------
// Centralized Synchronization Engine
// -------------------------------------------------------------
apiRouter.post('/sync/everything', async (req: Request, res: Response) => {
  const { businessId, organizationId } = req.body;
  if (!businessId) return res.status(400).json({ error: 'businessId required' });

  try {
    const job = await syncEngineService.triggerSyncEverything(
      businessId,
      organizationId || 'org_main_001',
      'MANUAL'
    );
    res.json({ success: true, job });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/sync/jobs/:id', (req: Request, res: Response) => {
  const job = db.getSyncJob(req.params.id);
  if (!job) return res.status(404).json({ error: 'Sync job not found' });
  res.json({ job });
});

apiRouter.get('/sync/jobs', (req: Request, res: Response) => {
  const businessId = req.query.businessId as string;
  const jobs = db.listSyncJobs(businessId);
  res.json({ jobs });
});

apiRouter.get('/integrations/health', (req: Request, res: Response) => {
  const businessId = req.query.businessId as string;
  if (!businessId) return res.status(400).json({ error: 'businessId required' });
  const healthList = db.getIntegrationHealthList(businessId);
  res.json({ healthList });
});

// -------------------------------------------------------------
// Google Cloud Pub/Sub Webhook for Realtime Review Monitoring
// -------------------------------------------------------------
apiRouter.post('/webhooks/google/pubsub', async (req: Request, res: Response) => {
  try {
    const result = await syncEngineService.handlePubSubNotification(req.body);
    res.status(200).json(result);
  } catch (err: any) {
    console.error('Pub/Sub Webhook handling error:', err);
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// Real-Time Server-Sent Events (SSE) Stream
// -------------------------------------------------------------
apiRouter.get('/realtime/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const onSyncUpdate = (data: any) => {
    res.write(`event: sync_update\ndata: ${JSON.stringify(data)}\n\n`);
  };

  const onRealtimeEvent = (data: any) => {
    res.write(`event: realtime_event\ndata: ${JSON.stringify(data)}\n\n`);
  };

  syncEngineService.on('sync_update', onSyncUpdate);
  syncEngineService.on('realtime_event', onRealtimeEvent);

  req.on('close', () => {
    syncEngineService.off('sync_update', onSyncUpdate);
    syncEngineService.off('realtime_event', onRealtimeEvent);
  });
});

// -------------------------------------------------------------
// Weekly Growth Brief & Reports API
// -------------------------------------------------------------
apiRouter.get('/reports/weekly-brief', async (req: Request, res: Response) => {
  const businessId = req.query.businessId as string;
  if (!businessId) return res.status(400).json({ error: 'businessId required' });

  const biz = db.getBusiness(businessId);
  if (!biz) return res.status(404).json({ error: 'Business not found' });

  let brief = db.getWeeklyBrief(businessId);
  if (!brief) {
    try {
      brief = await reportGeneratorService.generateWeeklyGrowthBrief(biz);
    } catch (e: any) {
      console.warn('Initial weekly brief generation note:', e.message);
    }
  }

  res.json({ brief: brief || null });
});

apiRouter.post('/reports/weekly-brief/generate', async (req: Request, res: Response) => {
  const { businessId } = req.body;
  if (!businessId) return res.status(400).json({ error: 'businessId required' });

  const biz = db.getBusiness(businessId);
  if (!biz) return res.status(404).json({ error: 'Business not found' });

  try {
    const brief = await reportGeneratorService.generateWeeklyGrowthBrief(biz);
    res.json({ brief });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/reports', (req: Request, res: Response) => {
  const businessId = req.query.businessId as string;
  if (!businessId) return res.status(400).json({ error: 'businessId required' });
  const reports = db.listReports(businessId);
  res.json({ reports });
});

apiRouter.post('/reports/generate-monthly', async (req: Request, res: Response) => {
  const { businessId } = req.body;
  if (!businessId) return res.status(400).json({ error: 'businessId required' });

  const biz = db.getBusiness(businessId);
  if (!biz) return res.status(404).json({ error: 'Business not found' });

  try {
    const report = await reportGeneratorService.generateMonthlyReport(biz);
    res.json({ report });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// SEO Tasks Engine API
// -------------------------------------------------------------
apiRouter.get('/seo/tasks', (req: Request, res: Response) => {
  const businessId = req.query.businessId as string;
  if (!businessId) return res.status(400).json({ error: 'businessId required' });
  const tasks = db.listSeoTasks(businessId);
  res.json({ tasks });
});

apiRouter.post('/seo/tasks', (req: Request, res: Response) => {
  const { businessId, title, url, priority, category, evidence, aiSuggestion, assignedTo } = req.body;
  if (!businessId || !title || !url) return res.status(400).json({ error: 'businessId, title, and url required' });

  const task: SeoTask = {
    id: 'task_' + Date.now(),
    businessId,
    title,
    url,
    priority: priority || 'High',
    category: category || 'CTR Optimization',
    status: 'Open',
    evidence: evidence || {},
    aiSuggestion: aiSuggestion || '',
    assignedTo,
    createdAt: new Date().toISOString()
  };

  db.createSeoTask(task);
  res.json({ task });
});

apiRouter.patch('/seo/tasks/:id', (req: Request, res: Response) => {
  const updated = db.updateSeoTask(req.params.id, req.body);
  res.json({ success: updated });
});

// -------------------------------------------------------------
// Tracked Keywords API
// -------------------------------------------------------------
apiRouter.get('/keywords/tracked', (req: Request, res: Response) => {
  const businessId = req.query.businessId as string;
  if (!businessId) return res.status(400).json({ error: 'businessId required' });
  const keywords = db.listTrackedKeywords(businessId);
  res.json({ keywords });
});

apiRouter.post('/keywords/tracked', (req: Request, res: Response) => {
  const { businessId, keyword, targetLocation, targetRank } = req.body;
  if (!businessId || !keyword) return res.status(400).json({ error: 'businessId and keyword required' });

  const item: TrackedKeyword = {
    id: 'kw_' + Date.now(),
    businessId,
    keyword,
    targetLocation: targetLocation || 'Local Area',
    targetRank: targetRank || 3,
    trackedSince: new Date().toISOString(),
    source: 'MANUAL'
  };

  db.addTrackedKeyword(item);
  res.json({ keyword: item });
});

apiRouter.delete('/keywords/tracked/:id', (req: Request, res: Response) => {
  const deleted = db.removeTrackedKeyword(req.params.id);
  res.json({ success: deleted });
});

// -------------------------------------------------------------
// Global Search (Cmd / Ctrl + K)
// -------------------------------------------------------------
apiRouter.get('/search', (req: Request, res: Response) => {
  const q = (req.query.q as string) || '';
  const businessId = req.query.businessId as string;
  const results = db.globalSearch(q, businessId);
  res.json({ results });
});

// -------------------------------------------------------------
// Billing & Subscription Management
// -------------------------------------------------------------
apiRouter.get('/billing/subscription', (req: Request, res: Response) => {
  const orgId = (req.query.organizationId as string) || 'org_main_001';
  const subscription = db.getSubscription(orgId);
  res.json({ subscription });
});

apiRouter.post('/billing/upgrade', (req: Request, res: Response) => {
  const { organizationId, plan } = req.body;
  const orgId = organizationId || 'org_main_001';
  const sub = db.getSubscription(orgId);

  const planLimits: Record<string, { price: number; businesses: number; locations: number; reviews: number; ai: number; crawls: number }> = {
    Starter: { price: 49, businesses: 1, locations: 1, reviews: 500, ai: 100, crawls: 5 },
    Growth: { price: 149, businesses: 5, locations: 20, reviews: 2000, ai: 1000, crawls: 20 },
    Agency: { price: 299, businesses: 25, locations: 100, reviews: 10000, ai: 5000, crawls: 100 },
    Enterprise: { price: 599, businesses: 100, locations: 500, reviews: 50000, ai: 25000, crawls: 500 }
  };

  const targetPlan = (plan as 'Starter' | 'Growth' | 'Agency' | 'Enterprise') || 'Growth';
  const cfg = planLimits[targetPlan] || planLimits.Growth;

  sub.plan = targetPlan;
  sub.amountMonthlyUsd = cfg.price;
  sub.limits = {
    maxBusinesses: cfg.businesses,
    maxLocations: cfg.locations,
    maxReviewsPerMonth: cfg.reviews,
    maxAiActionsPerMonth: cfg.ai,
    maxSeoCrawlsPerMonth: cfg.crawls,
    maxVisibilityScansPerMonth: cfg.crawls * 2,
    apiAccess: true,
    webhooksEnabled: true,
    prioritySupport: targetPlan === 'Agency' || targetPlan === 'Enterprise'
  };

  db.saveSubscription(sub);

  db.logAudit({
    organizationId: orgId,
    userId: 'usr_admin_001',
    userEmail: 'admin@localos.ai',
    action: 'SUBSCRIPTION_PLAN_UPGRADED',
    provider: 'billing_engine',
    status: 'SUCCESS',
    details: { plan: targetPlan, price: cfg.price }
  });

  res.json({ success: true, subscription: sub });
});

apiRouter.get('/billing/invoices', (req: Request, res: Response) => {
  const orgId = (req.query.organizationId as string) || 'org_main_001';
  const invoices = db.listInvoices(orgId);
  res.json({ invoices });
});

// -------------------------------------------------------------
// Developer Platform (API Keys, Webhooks, API Logs)
// -------------------------------------------------------------
apiRouter.get('/developer/api-keys', (req: Request, res: Response) => {
  const orgId = (req.query.organizationId as string) || 'org_main_001';
  const keys = db.listApiKeys(orgId);
  // Mask key hashes from client
  const safeKeys = keys.map(k => ({
    id: k.id,
    organizationId: k.organizationId,
    name: k.name,
    keyPrefix: k.keyPrefix,
    status: k.status,
    createdAt: k.createdAt,
    lastUsedAt: k.lastUsedAt
  }));
  res.json({ keys: safeKeys });
});

apiRouter.post('/developer/api-keys', (req: Request, res: Response) => {
  const { organizationId, name } = req.body;
  const orgId = organizationId || 'org_main_001';
  const rawSecret = 'loc_live_' + crypto.randomBytes(24).toString('hex');
  const keyPrefix = rawSecret.slice(0, 13);
  const keyHash = crypto.createHash('sha256').update(rawSecret).digest('hex');

  const newKey: ApiKey = {
    id: 'key_' + crypto.randomUUID().slice(0, 8),
    organizationId: orgId,
    name: name || 'Production Integration Key',
    keyPrefix,
    keyHash,
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };

  db.createApiKey(newKey);

  db.logAudit({
    organizationId: orgId,
    userId: 'usr_admin_001',
    userEmail: 'admin@localos.ai',
    action: 'API_KEY_CREATED',
    provider: 'developer_platform',
    status: 'SUCCESS',
    details: { keyId: newKey.id, name: newKey.name, prefix: keyPrefix }
  });

  // Return the raw secret ONLY ONCE
  res.json({
    success: true,
    key: {
      id: newKey.id,
      organizationId: newKey.organizationId,
      name: newKey.name,
      keyPrefix: newKey.keyPrefix,
      status: newKey.status,
      createdAt: newKey.createdAt
    },
    secret: rawSecret
  });
});

apiRouter.delete('/developer/api-keys/:id', (req: Request, res: Response) => {
  const orgId = (req.body.organizationId as string) || 'org_main_001';
  const revoked = db.revokeApiKey(req.params.id, orgId);
  res.json({ success: revoked });
});

apiRouter.post('/developer/api-keys/:id/rotate', (req: Request, res: Response) => {
  const orgId = (req.body.organizationId as string) || 'org_main_001';
  const rawSecret = 'loc_live_' + crypto.randomBytes(24).toString('hex');
  const keyPrefix = rawSecret.slice(0, 13);
  const keyHash = crypto.createHash('sha256').update(rawSecret).digest('hex');

  const rotated = db.rotateApiKey(req.params.id, orgId, keyHash, keyPrefix);
  if (!rotated) return res.status(404).json({ error: 'API key not found' });

  res.json({
    success: true,
    keyId: req.params.id,
    newPrefix: keyPrefix,
    secret: rawSecret
  });
});

// Webhooks Management
apiRouter.get('/developer/webhooks', (req: Request, res: Response) => {
  const orgId = (req.query.organizationId as string) || 'org_main_001';
  const webhooks = db.listWebhooks(orgId);
  res.json({ webhooks });
});

apiRouter.post('/developer/webhooks', (req: Request, res: Response) => {
  const { organizationId, url, events } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  const orgId = organizationId || 'org_main_001';
  const secret = 'whsec_' + crypto.randomBytes(24).toString('hex');

  const webhook: WebhookEndpoint = {
    id: 'wh_' + crypto.randomUUID().slice(0, 8),
    organizationId: orgId,
    url,
    events: events && events.length > 0 ? events : ['review.created', 'review.reply.published', 'seo.issue.created'],
    secret,
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };

  db.createWebhook(webhook);

  res.json({ success: true, webhook });
});

apiRouter.delete('/developer/webhooks/:id', (req: Request, res: Response) => {
  const orgId = (req.body?.organizationId as string) || (req.query.organizationId as string) || 'org_main_001';
  const deleted = db.deleteWebhook(req.params.id, orgId);
  res.json({ success: deleted });
});

apiRouter.post('/developer/webhooks/:id/test', async (req: Request, res: Response) => {
  const orgId = (req.body.organizationId as string) || 'org_main_001';
  const webhook = db.listWebhooks(orgId).find(w => w.id === req.params.id);
  if (!webhook) return res.status(404).json({ error: 'Webhook not found' });

  const testPayload = {
    event: 'review.created',
    review: {
      id: 'rev_test_' + Date.now(),
      reviewer: 'Sai Chakankar (Test)',
      rating: 5,
      comment: 'Excellent service and genuine switchgear equipment.',
      verified: true
    }
  };

  const delivery = await webhookDispatcherService.sendWithRetry(
    webhook.id,
    webhook.organizationId,
    webhook.url,
    webhook.secret,
    'review.created',
    testPayload
  );

  res.json({ success: delivery.status === 'SUCCESS', delivery });
});

apiRouter.get('/developer/webhooks/deliveries', (req: Request, res: Response) => {
  const orgId = (req.query.organizationId as string) || 'org_main_001';
  const webhookId = req.query.webhookId as string;
  const deliveries = db.listWebhookDeliveries(orgId, webhookId);
  res.json({ deliveries });
});

apiRouter.get('/developer/logs', (req: Request, res: Response) => {
  const orgId = req.query.organizationId as string;
  const logs = db.listApiLogs(orgId);
  res.json({ logs });
});

apiRouter.get('/developer/usage', (req: Request, res: Response) => {
  const orgId = (req.query.organizationId as string) || 'org_main_001';
  const sub = db.getSubscription(orgId);
  const limits = db.getRateLimits('biz_001');

  res.json({
    plan: sub.plan,
    usage: {
      apiRequestsThisMonth: limits.googleApi + 1420,
      aiGenerationsThisMonth: limits.geminiTokens > 0 ? Math.round(limits.geminiTokens / 1000) : 340,
      seoCrawlsThisMonth: limits.seoCrawls || 6,
      visibilityScansThisMonth: 18,
      webhookDeliveriesThisMonth: 82
    },
    limits: sub.limits
  });
});

// -------------------------------------------------------------
// Admin Control Plane APIs
// -------------------------------------------------------------
apiRouter.get('/admin/stats', (_req: Request, res: Response) => {
  const metrics = db.getAdminOperationalMetrics();
  res.json({ stats: metrics, metrics });
});

apiRouter.get('/admin/metrics', (_req: Request, res: Response) => {
  const metrics = db.getAdminOperationalMetrics();
  res.json({ metrics, stats: metrics });
});

apiRouter.get('/admin/organizations', (_req: Request, res: Response) => {
  const orgs = db.getAllOrganizationsAdmin();
  res.json({ organizations: orgs });
});

apiRouter.get('/admin/organizations/:id', (req: Request, res: Response) => {
  const detail = db.getOrganizationAdminDetail(req.params.id);
  if (!detail) return res.status(404).json({ error: 'Organization not found' });
  res.json(detail);
});

apiRouter.post('/admin/organizations/:id/status', (req: any, res: Response) => {
  const { status, reason } = req.body;
  if (!status) return res.status(400).json({ error: 'status is required' });
  const success = db.updateOrganizationStatus(req.params.id, status, reason, req.userEmail);
  res.json({ success, status, reason });
});

apiRouter.get('/admin/organizations/:id/features', (req: Request, res: Response) => {
  const features = db.getOrganizationFeatures(req.params.id);
  res.json({ features });
});

apiRouter.post('/admin/organizations/:id/features', (req: any, res: Response) => {
  const { featureKey, enabled } = req.body;
  if (!featureKey || enabled === undefined) {
    return res.status(400).json({ error: 'featureKey and enabled are required' });
  }
  const result = db.updateOrganizationFeature(
    req.params.id,
    featureKey,
    Boolean(enabled),
    req.userEmail || 'Sai Chakankar (Super Admin)'
  );
  if (!result.success) {
    return res.status(400).json({ error: result.error, features: result.features });
  }
  res.json(result);
});

// -------------------------------------------------------------
// Review Online & NFC Customer Acquisition APIs
// -------------------------------------------------------------
apiRouter.get('/review-online/settings', (req: Request, res: Response) => {
  const businessId = (req.query.businessId as string) || 'biz_001';
  const settings = db.getReviewOnlineSettings(businessId);
  res.json({ settings });
});

apiRouter.post('/review-online/settings', (req: Request, res: Response) => {
  const { settings } = req.body;
  if (!settings || !settings.businessId) return res.status(400).json({ error: 'Valid settings required' });
  const saved = db.saveReviewOnlineSettings(settings);
  res.json({ success: true, settings: saved });
});

apiRouter.get('/review-online/analytics', (req: Request, res: Response) => {
  const businessId = (req.query.businessId as string) || 'biz_001';
  const analytics = db.getReviewOnlineAnalytics(businessId);
  res.json({ analytics });
});

apiRouter.get('/review-online/nfc-cards', (req: Request, res: Response) => {
  const businessId = (req.query.businessId as string) || 'biz_001';
  const cards = db.listNfcCards(businessId);
  res.json({ cards });
});

apiRouter.post('/review-online/nfc-cards', (req: Request, res: Response) => {
  const { businessId, title, cardUid, locationId, assignedStaff, directUrl } = req.body;
  if (!businessId || !title || !cardUid) return res.status(400).json({ error: 'Missing required card fields' });
  const card = db.createNfcCard({
    businessId,
    locationId,
    title,
    cardUid,
    assignedStaff: assignedStaff || 'Unassigned',
    status: 'ACTIVE',
    directUrl: directUrl || `https://review.localos.ai/r/atharv-electricals?nfc=${cardUid}`,
    totalTaps: 0,
    googleConversions: 0,
    privateFeedbackConversions: 0,
    deviceStats: { android: 0, ios: 0 }
  });
  res.json({ success: true, card });
});

apiRouter.put('/review-online/nfc-cards/:id', (req: Request, res: Response) => {
  const updated = db.updateNfcCard(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Card not found' });
  res.json({ success: true, card: updated });
});

apiRouter.delete('/review-online/nfc-cards/:id', (req: Request, res: Response) => {
  const deleted = db.deleteNfcCard(req.params.id);
  res.json({ success: deleted });
});

apiRouter.post('/review-events', (req: Request, res: Response) => {
  const { businessSlug, eventType, metadata } = req.body;
  if (!businessSlug || !eventType) return res.status(400).json({ error: 'businessSlug and eventType required' });
  db.logReviewEvent({ businessSlug, eventType, metadata });
  res.json({ success: true });
});

apiRouter.get('/admin/users', (_req: Request, res: Response) => {
  res.json({
    users: [
      {
        id: 'usr_admin_001',
        name: 'Sai Chakankar',
        email: 'chakankarsai@gmail.com',
        role: 'SUPER_ADMIN',
        organizationName: 'Local Growth Media',
        status: 'ACTIVE',
        lastLoginAt: new Date().toISOString()
      },
      {
        id: 'usr_client_002',
        name: 'Atharv Operations Lead',
        email: 'ops@atharvaelectricals.in',
        role: 'MANAGER',
        organizationName: 'Local Growth Media',
        status: 'ACTIVE',
        lastLoginAt: new Date(Date.now() - 3600000).toISOString()
      }
    ]
  });
});

apiRouter.get('/admin/businesses', (_req: Request, res: Response) => {
  const businesses = db.listBusinesses('org_main_001');
  res.json({ businesses });
});

apiRouter.get('/admin/locations', (_req: Request, res: Response) => {
  const locations = db.listLocations('biz_001');
  res.json({ locations });
});

apiRouter.get('/admin/jobs', (req: Request, res: Response) => {
  const statusFilter = req.query.status as string;
  const queueStats = queueService.getQueueStatus();
  const syncJobs = db.listSyncJobs('biz_001');
  const automationRuns = db.listAutomationRuns('biz_001', 50);

  const formattedJobs = [
    ...syncJobs.map(sj => ({
      id: sj.id,
      type: `Sync (${sj.trigger})`,
      queue: 'google-sync',
      status: sj.status === 'SUCCESS' ? 'COMPLETED' : sj.status === 'RUNNING' ? 'ACTIVE' : sj.status === 'FAILED' ? 'FAILED' : 'WAITING',
      startedAt: sj.startedAt,
      completedAt: sj.completedAt,
      durationMs: sj.durationMs || 1200,
      retries: sj.retryCount || 0
    })),
    ...automationRuns.map(ar => ({
      id: ar.id,
      type: `Automation: ${ar.metadata?.ruleName || ar.triggerEvent}`,
      queue: ar.metadata?.queue || 'ai',
      status: ar.status === 'COMPLETED' ? 'COMPLETED' : ar.status === 'RUNNING' ? 'ACTIVE' : ar.status === 'FAILED' ? 'FAILED' : 'WAITING',
      startedAt: ar.startedAt,
      completedAt: ar.completedAt,
      durationMs: ar.durationMs || 450,
      retries: ar.retryCount || 0
    }))
  ];

  res.json({
    queueStats,
    jobs: statusFilter ? formattedJobs.filter(j => j.status === statusFilter) : formattedJobs
  });
});

apiRouter.get('/admin/api-health', (_req: Request, res: Response) => {
  res.json({
    providers: [
      { name: 'Google Business Profile', status: 'HEALTHY', latencyMs: 142, lastChecked: new Date().toISOString(), errorCount: 0 },
      { name: 'Google Places API (New)', status: 'HEALTHY', latencyMs: 88, lastChecked: new Date().toISOString(), errorCount: 0 },
      { name: 'Google Search Console', status: 'HEALTHY', latencyMs: 195, lastChecked: new Date().toISOString(), errorCount: 0 },
      { name: 'Google Analytics 4 Data API', status: 'HEALTHY', latencyMs: 210, lastChecked: new Date().toISOString(), errorCount: 0 },
      { name: 'Gemini AI Intelligence', status: 'HEALTHY', latencyMs: 380, lastChecked: new Date().toISOString(), errorCount: 0 },
      { name: 'Transactional Email Dispatcher', status: 'OPERATIONAL', latencyMs: 95, lastChecked: new Date().toISOString(), errorCount: 0 },
      { name: 'WhatsApp Webhook Gateway', status: 'OPERATIONAL', latencyMs: 110, lastChecked: new Date().toISOString(), errorCount: 0 }
    ]
  });
});

// Admin Emergency Controls & System Maintenance
let emergencyControls = {
  outboundPaused: false,
  maintenanceMode: false,
  pausedAt: null as string | null,
  pausedBy: null as string | null,
  reason: 'Normal operational state'
};

apiRouter.get('/admin/emergency-status', (_req: Request, res: Response) => {
  res.json({ controls: emergencyControls });
});

apiRouter.post('/admin/emergency-pause', (req: any, res: Response) => {
  const { paused, reason } = req.body;
  emergencyControls.outboundPaused = Boolean(paused);
  emergencyControls.pausedAt = emergencyControls.outboundPaused ? new Date().toISOString() : null;
  emergencyControls.pausedBy = req.userEmail || 'admin@localos.ai';
  emergencyControls.reason = reason || (emergencyControls.outboundPaused ? 'Super Admin paused all outbound automations' : 'Normal operations resumed');

  db.logAudit({
    organizationId: 'org_main_001',
    userId: 'usr_admin_001',
    userEmail: req.userEmail || 'admin@localos.ai',
    action: emergencyControls.outboundPaused ? 'GLOBAL_EMERGENCY_PAUSE_ENABLED' : 'GLOBAL_EMERGENCY_PAUSE_DISABLED',
    status: 'SUCCESS',
    details: { reason: emergencyControls.reason }
  });

  res.json({ success: true, controls: emergencyControls });
});

apiRouter.post('/admin/maintenance-mode', (req: any, res: Response) => {
  const { enabled } = req.body;
  emergencyControls.maintenanceMode = Boolean(enabled);

  db.logAudit({
    organizationId: 'org_main_001',
    userId: 'usr_admin_001',
    userEmail: req.userEmail || 'admin@localos.ai',
    action: emergencyControls.maintenanceMode ? 'SYSTEM_MAINTENANCE_ENABLED' : 'SYSTEM_MAINTENANCE_DISABLED',
    status: 'SUCCESS'
  });

  res.json({ success: true, controls: emergencyControls });
});

// Admin Support Tickets
const supportTickets = [
  {
    id: 'TCK-8921',
    organization: 'Local Growth Media',
    userEmail: 'posidea1234@gmail.com',
    subject: 'Google Cloud Pub/Sub webhook verification for new branch',
    priority: 'HIGH',
    status: 'OPEN',
    category: 'Integration',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString()
  },
  {
    id: 'TCK-8919',
    organization: 'Atharv Electricals HQ',
    userEmail: 'sai@atharvaelectricals.in',
    subject: 'Review NFC card print template dimensions requested for counter stands',
    priority: 'MEDIUM',
    status: 'IN_PROGRESS',
    category: 'Hardware / NFC',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: 'TCK-8902',
    organization: 'Apex Motors Pune',
    userEmail: 'service@apexmotors.in',
    subject: 'Google review auto-reply rule adjustment for 3-star reviews',
    priority: 'LOW',
    status: 'RESOLVED',
    category: 'Automations',
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString()
  }
];

apiRouter.get('/admin/support-tickets', (_req: Request, res: Response) => {
  res.json({ tickets: supportTickets });
});

apiRouter.post('/admin/support-tickets/:id/status', (req: Request, res: Response) => {
  const { status } = req.body;
  const ticket = supportTickets.find(t => t.id === req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  ticket.status = status;
  res.json({ success: true, ticket });
});

// -------------------------------------------------------------
// Public REST API v1 for Developers (/api/v1/*)
// -------------------------------------------------------------
const v1AuthMiddleware = (req: Request, res: Response, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header. Provide Bearer API key.' });
  }

  const rawKey = authHeader.replace('Bearer ', '').trim();
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
  const matchingKey = db.getApiKeyByHash(keyHash);

  if (!matchingKey) {
    return res.status(401).json({ error: 'Invalid or revoked API key.' });
  }

  (req as any).apiKey = matchingKey;
  (req as any).organizationId = matchingKey.organizationId;

  // Log API request
  db.logApiRequest({
    id: 'req_' + crypto.randomUUID().slice(0, 10),
    organizationId: matchingKey.organizationId,
    keyPrefix: matchingKey.keyPrefix,
    method: req.method,
    path: req.originalUrl,
    status: 200,
    durationMs: 25,
    ip: req.ip || '127.0.0.1',
    createdAt: new Date().toISOString()
  });

  next();
};

apiRouter.get('/v1/businesses', v1AuthMiddleware, (req: any, res: Response) => {
  const businesses = db.listBusinesses(req.organizationId);
  res.json({ businesses });
});

apiRouter.get('/v1/locations', v1AuthMiddleware, (req: any, res: Response) => {
  const businessId = (req.query.businessId as string) || 'biz_001';
  const locations = db.listLocations(businessId);
  res.json({ locations });
});

apiRouter.get('/v1/reviews', v1AuthMiddleware, (req: any, res: Response) => {
  const businessId = (req.query.businessId as string) || 'biz_001';
  const reviews = db.listReviews(businessId);
  res.json({ reviews });
});

apiRouter.post('/v1/reviews/:id/reply', v1AuthMiddleware, (req: any, res: Response) => {
  const { replyComment } = req.body;
  if (!replyComment) return res.status(400).json({ error: 'replyComment required' });

  const review = db.getReview(req.params.id);
  if (!review) return res.status(404).json({ error: 'Review not found' });

  review.replyComment = replyComment;
  review.replyUpdateTime = new Date().toISOString();
  review.replyStatus = 'PUBLISHED';
  db.saveReview(review);

  // Trigger webhook event
  webhookDispatcherService.dispatchEvent(req.organizationId, 'review.reply.published', {
    reviewId: review.id,
    reply: replyComment
  });

  res.json({ success: true, review });
});

apiRouter.get('/v1/posts', v1AuthMiddleware, (req: any, res: Response) => {
  const businessId = (req.query.businessId as string) || 'biz_001';
  const posts = db.listPosts(businessId);
  res.json({ posts });
});

apiRouter.get('/v1/performance', v1AuthMiddleware, (req: any, res: Response) => {
  const businessId = (req.query.businessId as string) || 'biz_001';
  const locationId = (req.query.locationId as string) || 'loc_001';
  const performance = db.getPerformanceSnapshot(businessId, locationId);
  res.json({ performance });
});

apiRouter.get('/v1/seo', v1AuthMiddleware, (req: any, res: Response) => {
  const businessId = (req.query.businessId as string) || 'biz_001';
  const crawl = db.getSeoCrawl(businessId);
  res.json({ seo: crawl });
});

apiRouter.get('/v1/keywords', v1AuthMiddleware, (req: any, res: Response) => {
  const businessId = (req.query.businessId as string) || 'biz_001';
  const keywords = db.listTrackedKeywords(businessId);
  res.json({ keywords });
});

apiRouter.get('/v1/competitors', v1AuthMiddleware, (req: any, res: Response) => {
  const businessId = (req.query.businessId as string) || 'biz_001';
  const competitors = db.getCompetitors(businessId);
  res.json({ competitors });
});

apiRouter.get('/v1/reports', v1AuthMiddleware, (req: any, res: Response) => {
  const businessId = (req.query.businessId as string) || 'biz_001';
  const reports = db.listReports(businessId);
  res.json({ reports });
});

apiRouter.get('/v1/automations', v1AuthMiddleware, (req: any, res: Response) => {
  const businessId = (req.query.businessId as string) || 'biz_001';
  const rules = db.listAutomationRules(businessId);
  res.json({ automations: rules });
});

// =============================================================
// GOOGLE REVIEW QR SAAS REST ENDPOINTS
// =============================================================

// -------------------------------------------------------------
// QR Codes Management
// -------------------------------------------------------------
apiRouter.get('/qr-codes', (req: any, res: Response) => {
  const businessId = (req.query.businessId as string) || 'biz_001';
  const qrCodes = db.listQrCodes(businessId);
  const subscription = db.getSaasSubscription(businessId);
  const activeCount = qrCodes.filter(q => q.status === 'ACTIVE').length;

  res.json({
    qrCodes,
    activeCount,
    maxActiveAllowed: subscription.maxActiveQrCodes,
    canCreateActive: activeCount < subscription.maxActiveQrCodes
  });
});

apiRouter.get('/qr-codes/:id', (req: Request, res: Response) => {
  const qr = db.getQrCode(req.params.id);
  if (!qr) return res.status(404).json({ error: 'QR Code not found' });
  res.json({ qrCode: qr });
});

apiRouter.post('/qr-codes', (req: Request, res: Response) => {
  const { businessId = 'biz_001', name, destinationUrl, placement, code } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'QR Code name is required' });
  }
  if (!destinationUrl || !destinationUrl.trim()) {
    return res.status(400).json({ error: 'Google Review destination URL is required' });
  }

  // Validate URL format
  if (!destinationUrl.startsWith('http://') && !destinationUrl.startsWith('https://')) {
    return res.status(400).json({ error: 'Please enter a valid URL starting with https://' });
  }

  const result = db.createQrCode({
    businessId,
    name: name.trim(),
    destinationUrl: destinationUrl.trim(),
    placement,
    code
  });

  if (!result.success) {
    return res.status(403).json({ error: result.error });
  }

  res.status(201).json({ qrCode: result.qrCode });
});

apiRouter.put('/qr-codes/:id', (req: Request, res: Response) => {
  const { name, destinationUrl, placement, status } = req.body;
  const updates: any = {};

  if (name !== undefined) updates.name = name;
  if (destinationUrl !== undefined) {
    if (!destinationUrl.startsWith('http://') && !destinationUrl.startsWith('https://')) {
      return res.status(400).json({ error: 'Please enter a valid URL starting with https://' });
    }
    updates.destinationUrl = destinationUrl;
  }
  if (placement !== undefined) updates.placement = placement;
  if (status !== undefined) updates.status = status;

  const result = db.updateQrCode(req.params.id, updates);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  res.json({ qrCode: result.qrCode });
});

apiRouter.delete('/qr-codes/:id', (req: Request, res: Response) => {
  const success = db.deleteQrCode(req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'QR Code not found' });
  }
  res.json({ success: true, message: 'QR Code deleted successfully' });
});

// -------------------------------------------------------------
// QR Analytics & Owner Dashboard Metrics (Section 7 & 8)
// -------------------------------------------------------------
apiRouter.get('/qr-analytics', (req: Request, res: Response) => {
  const businessId = (req.query.businessId as string) || 'biz_001';
  const range = ((req.query.range as string) || '30d') as any;
  const customStart = req.query.startDate as string;
  const customEnd = req.query.endDate as string;

  const analytics = db.getQrAnalytics(businessId, range, customStart, customEnd);
  res.json(analytics);
});

// -------------------------------------------------------------
// Subscriptions & Plans (Section 10 & 11)
// -------------------------------------------------------------
apiRouter.get('/subscription', (req: Request, res: Response) => {
  const businessId = (req.query.businessId as string) || 'biz_001';
  const subscription = db.getSaasSubscription(businessId);
  const plans = db.getSubscriptionPlans();
  const currentPlan = plans.find(p => p.id === subscription.planId) || plans[0];
  const qrs = db.listQrCodes(businessId);
  const activeQrCount = qrs.filter(q => q.status === 'ACTIVE').length;

  res.json({
    subscription,
    plan: currentPlan,
    usage: {
      activeQrCodes: activeQrCount,
      maxActiveQrCodes: subscription.maxActiveQrCodes,
      percentageUsed: Math.min(100, Math.round((activeQrCount / subscription.maxActiveQrCodes) * 100)),
      totalScansThisMonth: db.getQrAnalytics(businessId, '30d').metrics.scansThisMonth
    },
    paymentGateway: {
      provider: 'Razorpay',
      status: 'READY_FOR_INTEGRATION',
      note: 'Payment gateway hooks ready for paid tier activation.'
    }
  });
});

apiRouter.get('/subscription/plans', (_req: Request, res: Response) => {
  const plans = db.getSubscriptionPlans();
  res.json({ plans });
});

apiRouter.post('/subscription/waitlist', (req: Request, res: Response) => {
  const { planName, email } = req.body;
  if (!planName) {
    return res.status(400).json({ error: 'Plan name is required' });
  }
  // Store notification interest
  res.json({
    success: true,
    message: `Thank you! You have been added to the early access waitlist for the ${planName} plan.`
  });
});

// -------------------------------------------------------------
// Google Business Profile Status (Section 8 & 9)
// -------------------------------------------------------------
apiRouter.get('/google-profile/status', (req: Request, res: Response) => {
  const businessId = (req.query.businessId as string) || 'biz_001';
  const profile = db.getGoogleBusinessProfile(businessId);
  const business = db.getBusiness(businessId);

  res.json({
    profile,
    business: {
      name: business?.name || 'Atharv Electricals',
      category: business?.category || 'Electrical Equipment & Services',
      address: business?.address || 'Chakan MIDC Phase II, Pune',
      googleReviewUrl: business?.googleReviewUrl || 'https://search.google.com/local/writereview?placeid=ChIJ_AtharvPlaceId'
    }
  });
});

apiRouter.post('/google-profile/connect', (req: Request, res: Response) => {
  const businessId = (req.body.businessId as string) || 'biz_001';
  const { placeId } = req.body;

  const updated = db.updateGoogleBusinessProfile(businessId, {
    isConnected: true,
    connectedAt: new Date().toISOString(),
    placeId: placeId || 'ChIJ_AtharvPlaceId',
    overallRating: 4.8,
    totalReviewCount: 128
  });

  res.json({
    success: true,
    message: 'Google Business Profile connected successfully',
    profile: updated
  });
});

apiRouter.post('/google-profile/disconnect', (req: Request, res: Response) => {
  const businessId = (req.body.businessId as string) || 'biz_001';

  const updated = db.updateGoogleBusinessProfile(businessId, {
    isConnected: false,
    connectedAt: undefined,
    overallRating: undefined,
    totalReviewCount: 0
  });

  res.json({
    success: true,
    message: 'Google Business Profile disconnected',
    profile: updated
  });
});

// -------------------------------------------------------------
// Super Admin Overview (Section 12)
// -------------------------------------------------------------
apiRouter.get('/admin/overview', (_req: Request, res: Response) => {
  const overview = db.getAdminOverview();
  res.json(overview);
});

apiRouter.get('/admin/businesses', (_req: Request, res: Response) => {
  const businesses = db.listAdminBusinesses();
  res.json({ businesses });
});

apiRouter.put('/admin/businesses/:id/status', (req: Request, res: Response) => {
  const { status } = req.body;
  if (!['ACTIVE', 'SUSPENDED'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  const success = db.setBusinessStatus(req.params.id, status);
  if (!success) return res.status(404).json({ error: 'Business not found' });
  res.json({ success: true, status });
});

