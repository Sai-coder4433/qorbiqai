import { EventEmitter } from 'events';
import { db } from '../../db/database.ts';
import { googleOAuthService } from '../google/oauth.service.ts';
import { googleBusinessProfileService } from '../google/business-profile.service.ts';
import { googlePerformanceService } from '../google/performance.service.ts';
import { googleSearchConsoleService } from '../google/search-console.service.ts';
import { googleAnalyticsService } from '../google/analytics.service.ts';
import { websiteCrawlerService } from '../seo/crawler.service.ts';
import { automationEngineService } from '../automation/engine.service.ts';
import { SyncJob, SyncJobStep, IntegrationHealth, GoogleReview } from '../../types/index.ts';

export class SyncEngineService extends EventEmitter {
  private activeJobs: Map<string, SyncJob> = new Map();
  private schedulerInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.startBackgroundScheduler();
  }

  // -------------------------------------------------------------
  // Centralized "Sync Everything Now" (Non-Blocking Job Runner)
  // -------------------------------------------------------------
  public async triggerSyncEverything(businessId: string, organizationId: string, trigger: 'MANUAL' | 'SCHEDULED' | 'RECONNECT' = 'MANUAL'): Promise<SyncJob> {
    const jobId = 'job_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

    const initialSteps: SyncJobStep[] = [
      { step: 'locations', name: 'Google Locations Discovery', status: 'PENDING' },
      { step: 'reviews', name: 'Customer Reviews & Replies', status: 'PENDING' },
      { step: 'performance', name: 'Search & Maps Telemetry', status: 'PENDING' },
      { step: 'posts', name: 'Google Posts Reconciliation', status: 'PENDING' },
      { step: 'media', name: 'Photos & Visual Media', status: 'PENDING' },
      { step: 'search_console', name: 'Search Console Insights', status: 'PENDING' },
      { step: 'analytics', name: 'Google Analytics 4', status: 'PENDING' },
      { step: 'seo_health', name: 'Technical Website SEO Audit', status: 'PENDING' }
    ];

    const job: SyncJob = {
      id: jobId,
      businessId,
      organizationId,
      trigger,
      status: 'RUNNING',
      progressPercent: 5,
      steps: initialSteps,
      startedAt: new Date().toISOString()
    };

    this.activeJobs.set(jobId, job);
    db.createSyncJob(job);
    this.emit('sync_update', { businessId, job });

    // Execute asynchronously in background - NEVER block the user's browser
    setImmediate(() => {
      this.executeJob(job).catch(err => {
        console.error(`Sync Job ${jobId} failed with unhandled error:`, err);
      });
    });

    return job;
  }

  private async executeJob(job: SyncJob): Promise<void> {
    const businessId = job.businessId;
    const business = db.getBusiness(businessId);
    if (!business) {
      job.status = 'FAILED';
      job.error = 'Business not found';
      job.completedAt = new Date().toISOString();
      db.updateSyncJob(job.id, job);
      this.emit('sync_update', { businessId, job });
      return;
    }

    const integration = db.getGoogleIntegration(businessId);
    const isGoogleConnected = integration?.status === 'connected';

    let stepsCompleted = 0;
    const totalSteps = job.steps.length;

    // Helper to update step status and progress
    const updateStep = (stepName: SyncJobStep['step'], status: SyncJobStep['status'], recordsCount?: number, error?: string) => {
      const step = job.steps.find(s => s.step === stepName);
      if (step) {
        step.status = status;
        if (recordsCount !== undefined) step.recordsCount = recordsCount;
        if (error) step.error = error;
      }
      if (status === 'SUCCESS' || status === 'SKIPPED' || status === 'FAILED') {
        stepsCompleted++;
      }
      job.progressPercent = Math.min(100, Math.round((stepsCompleted / totalSteps) * 100));
      db.updateSyncJob(job.id, { steps: job.steps, progressPercent: job.progressPercent });
      this.emit('sync_update', { businessId, job });
    };

    // STEP 1: Locations
    try {
      updateStep('locations', 'RUNNING');
      if (isGoogleConnected) {
        const locations = await this.syncLocations(businessId);
        updateStep('locations', 'SUCCESS', locations.length);
      } else {
        updateStep('locations', 'SKIPPED', undefined, 'Google not connected');
      }
    } catch (err: any) {
      updateStep('locations', 'FAILED', 0, err.message);
    }

    // STEP 2: Reviews
    try {
      updateStep('reviews', 'RUNNING');
      if (isGoogleConnected) {
        const count = await this.syncReviews(businessId);
        updateStep('reviews', 'SUCCESS', count);
      } else {
        updateStep('reviews', 'SKIPPED', undefined, 'Google not connected');
      }
    } catch (err: any) {
      updateStep('reviews', 'FAILED', 0, err.message);
    }

    // STEP 3: Performance Telemetry
    try {
      updateStep('performance', 'RUNNING');
      if (isGoogleConnected) {
        const synced = await this.syncPerformance(businessId);
        updateStep('performance', synced ? 'SUCCESS' : 'SKIPPED', synced ? 1 : 0);
      } else {
        updateStep('performance', 'SKIPPED', undefined, 'Google not connected');
      }
    } catch (err: any) {
      updateStep('performance', 'FAILED', 0, err.message);
    }

    // STEP 4: Google Posts
    try {
      updateStep('posts', 'RUNNING');
      if (isGoogleConnected) {
        const count = await this.syncPosts(businessId);
        updateStep('posts', 'SUCCESS', count);
      } else {
        updateStep('posts', 'SKIPPED', undefined, 'Google not connected');
      }
    } catch (err: any) {
      updateStep('posts', 'FAILED', 0, err.message);
    }

    // STEP 5: Media
    try {
      updateStep('media', 'RUNNING');
      if (isGoogleConnected) {
        const count = await this.syncMedia(businessId);
        updateStep('media', 'SUCCESS', count);
      } else {
        updateStep('media', 'SKIPPED', undefined, 'Google not connected');
      }
    } catch (err: any) {
      updateStep('media', 'FAILED', 0, err.message);
    }

    // STEP 6: Search Console
    try {
      updateStep('search_console', 'RUNNING');
      if (isGoogleConnected && business.website) {
        const count = await this.syncSearchConsole(businessId, business.website);
        updateStep('search_console', 'SUCCESS', count);
      } else {
        updateStep('search_console', 'SKIPPED', undefined, 'Website or Google SC not linked');
      }
    } catch (err: any) {
      updateStep('search_console', 'FAILED', 0, err.message);
    }

    // STEP 7: Analytics (GA4)
    try {
      updateStep('analytics', 'RUNNING');
      if (isGoogleConnected) {
        const count = await this.syncAnalytics(businessId);
        updateStep('analytics', 'SUCCESS', count);
      } else {
        updateStep('analytics', 'SKIPPED', undefined, 'GA4 property not configured');
      }
    } catch (err: any) {
      updateStep('analytics', 'FAILED', 0, err.message);
    }

    // STEP 8: Website SEO Audit
    try {
      updateStep('seo_health', 'RUNNING');
      if (business.website) {
        await this.syncSeoHealth(businessId, business.website);
        updateStep('seo_health', 'SUCCESS', 1);
      } else {
        updateStep('seo_health', 'SKIPPED', undefined, 'No business website specified');
      }
    } catch (err: any) {
      updateStep('seo_health', 'FAILED', 0, err.message);
    }

    // Finalize Job Status
    const hasFailures = job.steps.some(s => s.status === 'FAILED');
    const allSuccessful = job.steps.every(s => s.status === 'SUCCESS' || s.status === 'SKIPPED');

    job.status = allSuccessful ? 'SUCCESS' : hasFailures ? 'PARTIAL' : 'SUCCESS';
    job.progressPercent = 100;
    job.completedAt = new Date().toISOString();

    db.updateSyncJob(job.id, job);
    this.activeJobs.delete(job.id);
    this.emit('sync_update', { businessId, job });

    db.logAudit({
      organizationId: job.organizationId,
      businessId,
      userId: 'sync_engine',
      userEmail: 'system@localos.ai',
      action: 'GLOBAL_SYNC_COMPLETED',
      provider: 'sync_engine',
      status: hasFailures ? 'FAILURE' : 'SUCCESS',
      details: {
        jobId: job.id,
        trigger: job.trigger,
        steps: job.steps.map(s => ({ step: s.step, status: s.status }))
      }
    });
  }

  // -------------------------------------------------------------
  // Step-Specific Sync Handlers
  // -------------------------------------------------------------

  public async syncLocations(businessId: string): Promise<any[]> {
    const integration = db.getGoogleIntegration(businessId);
    if (!integration || integration.status !== 'connected') return [];

    try {
      // Ensure accountName exists
      if (!integration.accountName) {
        const accounts = await googleBusinessProfileService.listAccounts(businessId);
        if (accounts.length > 0) {
          integration.accountName = accounts[0].name;
          integration.accountId = accounts[0].accountNumber;
          db.saveGoogleIntegration(integration);
        }
      }

      if (!integration.accountName) return [];

      const rawLocations = await googleBusinessProfileService.listLocations(businessId, integration.accountName);
      
      for (const loc of rawLocations) {
        const existing = db.listLocations(businessId).find(l => l.googleLocationName === loc.name);
        const locPayload = {
          businessId,
          googleLocationName: loc.name,
          googlePlaceId: loc.metadata?.placeId,
          title: loc.title,
          storeCode: loc.storeCode,
          addressLines: loc.storefrontAddress?.addressLines || [],
          locality: loc.storefrontAddress?.locality || '',
          administrativeArea: loc.storefrontAddress?.administrativeArea || '',
          postalCode: loc.storefrontAddress?.postalCode || '',
          latitude: loc.latlng?.latitude,
          longitude: loc.latlng?.longitude,
          phoneNumber: loc.phoneNumbers?.primaryPhone,
          websiteUri: loc.websiteUri,
          primaryCategory: loc.categories?.primaryCategory?.displayName,
          additionalCategories: (loc.categories?.additionalCategories || []).map((c: any) => c.displayName),
          description: loc.profile?.description,
          status: (loc.metadata?.status === 'OPEN' ? 'OPEN' : 'OPEN') as any,
          lastSyncedAt: new Date().toISOString()
        };

        if (existing) {
          db.updateLocation(existing.id, locPayload);
        } else {
          db.createLocation(locPayload);
        }
      }

      this.updateProviderHealth(businessId, 'google_business_profile', 'CONNECTED');
      return rawLocations;
    } catch (e: any) {
      this.updateProviderHealth(businessId, 'google_business_profile', 'ERROR', e.message);
      throw e;
    }
  }

  public async syncReviews(businessId: string, specificLocationId?: string): Promise<number> {
    const integration = db.getGoogleIntegration(businessId);
    if (!integration || integration.status !== 'connected' || !integration.accountName) return 0;

    const locations = specificLocationId 
      ? [db.getLocation(specificLocationId)].filter(Boolean)
      : db.listLocations(businessId);

    let totalSynced = 0;

    for (const loc of locations) {
      if (!loc) continue;
      const locName = loc.googleLocationName || `locations/${loc.id}`;
      try {
        const rawReviews = await googleBusinessProfileService.listReviews(businessId, integration.accountName, locName);
        for (const r of rawReviews) {
          const starRating = r.starRating === 'FIVE' ? 5 : r.starRating === 'FOUR' ? 4 : r.starRating === 'THREE' ? 3 : r.starRating === 'TWO' ? 2 : 1;
          const review: GoogleReview = {
            id: r.reviewId || 'rev_' + Date.now(),
            businessId,
            locationId: loc.id,
            googleReviewId: r.reviewId,
            reviewerName: r.reviewer?.displayName || 'Google Customer',
            reviewerPhotoUrl: r.reviewer?.profilePhotoUrl,
            starRating,
            comment: r.comment,
            createTime: r.createTime,
            updateTime: r.updateTime,
            replyComment: r.reviewReply?.comment,
            replyUpdateTime: r.reviewReply?.updateTime,
            replyStatus: r.reviewReply?.comment ? 'REPLIED' : 'UNREPLIED',
            sentiment: starRating >= 4 ? 'POSITIVE' : starRating === 3 ? 'NEUTRAL' : 'NEGATIVE'
          };
          db.saveReview(review);
          totalSynced++;
        }
      } catch (err: any) {
        console.warn(`Reviews sync error for location ${loc.title}:`, err.message);
      }
    }

    db.incrementRateLimit(businessId, 'googleApi', totalSynced);
    return totalSynced;
  }

  public async syncPerformance(businessId: string, specificLocationId?: string): Promise<boolean> {
    const integration = db.getGoogleIntegration(businessId);
    if (!integration || integration.status !== 'connected') return false;

    const locations = specificLocationId
      ? [db.getLocation(specificLocationId)].filter(Boolean)
      : db.listLocations(businessId);

    for (const loc of locations) {
      if (!loc) continue;
      const locName = loc.googleLocationName || `locations/${loc.id}`;
      try {
        const perf = await googlePerformanceService.getPerformance(businessId, locName, 30);
        db.savePerformanceSnapshot(perf);
        db.incrementRateLimit(businessId, 'googleApi', 1);
      } catch (err: any) {
        console.warn(`Performance sync error for location ${loc.title}:`, err.message);
      }
    }
    return true;
  }

  public async syncPosts(businessId: string, specificLocationId?: string): Promise<number> {
    const integration = db.getGoogleIntegration(businessId);
    if (!integration || integration.status !== 'connected' || !integration.accountName) return 0;

    const locations = specificLocationId
      ? [db.getLocation(specificLocationId)].filter(Boolean)
      : db.listLocations(businessId);

    let count = 0;
    for (const loc of locations) {
      if (!loc) continue;
      const locName = loc.googleLocationName || `locations/${loc.id}`;
      try {
        const rawPosts = await googleBusinessProfileService.listPosts(businessId, integration.accountName, locName);
        count += rawPosts.length;
      } catch (err: any) {
        console.warn(`Posts sync error for location ${loc.title}:`, err.message);
      }
    }
    return count;
  }

  public async syncMedia(businessId: string, specificLocationId?: string): Promise<number> {
    const integration = db.getGoogleIntegration(businessId);
    if (!integration || integration.status !== 'connected' || !integration.accountName) return 0;

    const locations = specificLocationId
      ? [db.getLocation(specificLocationId)].filter(Boolean)
      : db.listLocations(businessId);

    let count = 0;
    for (const loc of locations) {
      if (!loc) continue;
      const locName = loc.googleLocationName || `locations/${loc.id}`;
      try {
        const rawMedia = await googleBusinessProfileService.listMedia(businessId, integration.accountName, locName);
        count += rawMedia.length;
      } catch (err: any) {
        console.warn(`Media sync error for location ${loc.title}:`, err.message);
      }
    }
    return count;
  }

  public async syncSearchConsole(businessId: string, siteUrl: string): Promise<number> {
    const integration = db.getGoogleIntegration(businessId);
    if (!integration || integration.status !== 'connected') return 0;

    try {
      const data = await googleSearchConsoleService.queryAnalytics(businessId, siteUrl);
      db.saveSearchConsoleData(businessId, data);
      this.updateProviderHealth(businessId, 'google_search_console', 'CONNECTED');
      db.incrementRateLimit(businessId, 'googleApi', 2);
      return data.queries.length;
    } catch (e: any) {
      this.updateProviderHealth(businessId, 'google_search_console', 'ERROR', e.message);
      throw e;
    }
  }

  public async syncAnalytics(businessId: string): Promise<number> {
    const integration = db.getGoogleIntegration(businessId);
    if (!integration || integration.status !== 'connected') return 0;

    const propertyId = process.env.GA4_PROPERTY_ID;
    if (!propertyId) return 0;

    try {
      const data = await googleAnalyticsService.runReport(businessId, propertyId);
      db.saveAnalyticsData(businessId, data);
      this.updateProviderHealth(businessId, 'google_analytics_4', 'CONNECTED');
      db.incrementRateLimit(businessId, 'googleApi', 1);
      return data.sources.length;
    } catch (e: any) {
      this.updateProviderHealth(businessId, 'google_analytics_4', 'ERROR', e.message);
      throw e;
    }
  }

  public async syncSeoHealth(businessId: string, websiteUrl: string): Promise<void> {
    try {
      const result = await websiteCrawlerService.crawl(websiteUrl);
      db.saveSeoCrawl(businessId, result);
      db.incrementRateLimit(businessId, 'seoCrawls', 1);
    } catch (e: any) {
      console.warn(`SEO health audit failed for ${websiteUrl}:`, e.message);
    }
  }

  // -------------------------------------------------------------
  // Google Cloud Pub/Sub Webhook Handler for Real-Time Reviews
  // -------------------------------------------------------------
  public async handlePubSubNotification(payload: any): Promise<{ handled: boolean; action?: string; reviewId?: string }> {
    let eventData: any = payload;

    // Check if Pub/Sub wrapped (base64 encoded message.data)
    if (payload?.message?.data) {
      try {
        const decoded = Buffer.from(payload.message.data, 'base64').toString('utf-8');
        eventData = JSON.parse(decoded);
      } catch (e) {
        console.warn('Failed to parse decoded Pub/Sub message data:', e);
      }
    }

    const { accountName, locationName, eventType, reviewId } = eventData;

    // Log the event
    db.logAudit({
      organizationId: 'org_main_001',
      userId: 'pubsub_listener',
      userEmail: 'pubsub@google.com',
      action: 'PUBSUB_NOTIFICATION_RECEIVED',
      provider: 'cloud_pubsub',
      status: 'SUCCESS',
      details: { eventType, reviewId, locationName }
    });

    if (eventType === 'NEW_REVIEW' || eventType === 'UPDATED_REVIEW' || reviewId) {
      // Find matching business by account / location
      const allBiz = db.listBusinesses('org_main_001');
      for (const biz of allBiz) {
        const integration = db.getGoogleIntegration(biz.id);
        if (integration?.status === 'connected') {
          // Trigger immediate review sync
          await this.syncReviews(biz.id);

          // Get the newly synced review
          const matchingReview = db.listReviews(biz.id).find(r => r.googleReviewId === reviewId);
          if (matchingReview) {
            // Send to Automation Engine for sentiment & auto-reply checks
            await automationEngineService.handleEvent('NEW_REVIEW', {
              businessId: biz.id,
              review: matchingReview
            });

            this.emit('realtime_event', {
              type: 'NEW_REVIEW',
              businessId: biz.id,
              review: matchingReview
            });

            return { handled: true, action: 'REVIEW_SYNCED_AND_AUTOMATED', reviewId };
          }
        }
      }
    }

    return { handled: true, action: 'NOTIFICATION_ACKNOWLEDGED' };
  }

  // -------------------------------------------------------------
  // Integration Health Tracking
  // -------------------------------------------------------------
  private updateProviderHealth(businessId: string, provider: IntegrationHealth['provider'], status: IntegrationHealth['status'], error?: string) {
    const healthList = db.getIntegrationHealthList(businessId);
    let health = healthList.find(h => h.provider === provider);

    if (!health) {
      health = {
        businessId,
        provider,
        status,
        errorCount: 0,
        retryCount: 0
      };
    }

    health.status = status;
    health.lastAttemptAt = new Date().toISOString();

    if (status === 'CONNECTED') {
      health.lastSuccessAt = new Date().toISOString();
      health.errorCount = 0;
      health.lastError = undefined;
    } else if (status === 'ERROR') {
      health.errorCount += 1;
      health.lastError = error;
    }

    db.setIntegrationHealth(businessId, health);
  }

  // -------------------------------------------------------------
  // Background Scheduler (Runs automated tasks periodic reconciliation)
  // -------------------------------------------------------------
  private startBackgroundScheduler(): void {
    if (this.schedulerInterval) return;

    // Check schedules every 10 minutes
    this.schedulerInterval = setInterval(() => {
      this.runScheduledReconciliations().catch(err => {
        console.warn('Background scheduler tick error:', err);
      });
    }, 10 * 60 * 1000);
  }

  private async runScheduledReconciliations(): Promise<void> {
    const allBusinesses = db.listBusinesses('org_main_001');
    for (const biz of allBusinesses) {
      const integration = db.getGoogleIntegration(biz.id);
      if (integration?.status === 'connected') {
        // Run light reconciliation sync
        try {
          await this.syncReviews(biz.id);
          await this.syncPerformance(biz.id);
        } catch (e: any) {
          console.warn(`Scheduled sync reconciliation for ${biz.name} warning:`, e.message);
        }
      }
    }
  }
}

export const syncEngineService = new SyncEngineService();
