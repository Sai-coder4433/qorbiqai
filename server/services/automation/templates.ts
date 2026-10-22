import { AutomationRule } from '../../types/index.ts';

export interface AutomationTemplateDefinition {
  id: string;
  name: string;
  description: string;
  category: AutomationRule['category'];
  triggerType: AutomationRule['triggerType'];
  triggerDescription: string;
  frequency: string;
  approvalMode: AutomationRule['approvalMode'];
  conditionSummary: string;
  actionsSummary: string;
  priority: AutomationRule['priority'];
  defaultEnabled: boolean;
  ruleFactory: (businessId: string, organizationId: string, locationId?: string) => AutomationRule;
}

export const AUTOMATION_TEMPLATES: AutomationTemplateDefinition[] = [
  {
    id: 'tpl_review_auto_reply',
    name: 'Automatically reply to positive reviews',
    description: 'Uses Gemini AI to craft professional, zero-hallucination replies to 4★ and 5★ reviews and publishes them immediately to Google Maps.',
    category: 'GOOGLE',
    triggerType: 'NEW_REVIEW',
    triggerDescription: 'New Google Review received',
    frequency: 'Event based (Instant)',
    approvalMode: 'AUTO',
    conditionSummary: 'Rating >= 4 and not flagged for legal/safety/medical risk',
    actionsSummary: 'Generate AI Reply, validate tone & facts, publish via Google API, log audit',
    priority: 'HIGH',
    defaultEnabled: true,
    ruleFactory: (businessId, organizationId, locationId) => ({
      id: `rule_auto_reply_${businessId}`,
      organizationId,
      businessId,
      locationId,
      name: 'Review Auto Reply',
      description: 'Automatically generate and publish verified AI replies to 4★ and 5★ reviews.',
      category: 'GOOGLE',
      triggerType: 'NEW_REVIEW',
      triggerConfig: {},
      conditionConfig: {
        logicalOperator: 'AND',
        rules: [
          { field: 'starRating', operator: 'gte', value: 4 },
          { field: 'replyStatus', operator: 'not_equals', value: 'PUBLISHED' }
        ]
      },
      actionConfig: [
        {
          type: 'AUTO_REPLY_REVIEW',
          config: { publishIfSafe: true, minRating: 4 },
          executionMode: 'AUTO'
        }
      ],
      scheduleConfig: { frequency: 'EVENT_BASED' },
      approvalMode: 'AUTO',
      enabled: true,
      priority: 'HIGH',
      version: 1,
      createdBy: 'system_template',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
  },
  {
    id: 'tpl_negative_review_alert',
    name: 'Alert me about negative reviews',
    description: 'Immediately detects reviews with rating <= 3 stars or negative sentiment, prepares an emergency AI draft, and alerts management without auto-publishing.',
    category: 'NOTIFICATIONS',
    triggerType: 'NEGATIVE_REVIEW',
    triggerDescription: 'New review <= 3★ or negative sentiment',
    frequency: 'Event based (Instant)',
    approvalMode: 'REQUIRE_APPROVAL',
    conditionSummary: 'Rating <= 3 or negative sentiment',
    actionsSummary: 'Create High Priority AI Action, send notification, draft response for human sign-off',
    priority: 'CRITICAL',
    defaultEnabled: true,
    ruleFactory: (businessId, organizationId, locationId) => ({
      id: `rule_neg_alert_${businessId}`,
      organizationId,
      businessId,
      locationId,
      name: 'Negative Review Protection & Alert',
      description: 'Dispatch immediate notification and require manager approval for reviews <= 3★.',
      category: 'NOTIFICATIONS',
      triggerType: 'NEGATIVE_REVIEW',
      triggerConfig: {},
      conditionConfig: {
        logicalOperator: 'OR',
        rules: [
          { field: 'starRating', operator: 'lte', value: 3 },
          { field: 'sentiment', operator: 'equals', value: 'NEGATIVE' }
        ]
      },
      actionConfig: [
        {
          type: 'DISPATCH_ALERT',
          config: { severity: 'critical', channel: 'ALL' },
          executionMode: 'AUTO'
        },
        {
          type: 'CREATE_APPROVAL_REQUEST',
          config: { approvalType: 'REVIEW_REPLY' },
          executionMode: 'APPROVAL'
        }
      ],
      scheduleConfig: { frequency: 'EVENT_BASED' },
      approvalMode: 'REQUIRE_APPROVAL',
      enabled: true,
      priority: 'CRITICAL',
      version: 1,
      createdBy: 'system_template',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
  },
  {
    id: 'tpl_weekly_growth_report',
    name: 'Send weekly growth report',
    description: 'Aggregates Google Maps impressions, customer calls, clicks, reviews and SEO metrics every Monday and generates an executive growth brief.',
    category: 'ANALYTICS',
    triggerType: 'SCHEDULE',
    triggerDescription: 'Every Monday at 09:00 AM (Business Timezone)',
    frequency: 'Weekly',
    approvalMode: 'AUTO',
    conditionSummary: 'Scheduled execution weekly',
    actionsSummary: 'Synthesize GBP, GA4 & GSC data, generate AI executive summary, notify team',
    priority: 'MEDIUM',
    defaultEnabled: true,
    ruleFactory: (businessId, organizationId, locationId) => ({
      id: `rule_weekly_growth_${businessId}`,
      organizationId,
      businessId,
      locationId,
      name: 'Weekly Growth Brief',
      description: 'Generates Monday executive summary of local business visibility and conversions.',
      category: 'ANALYTICS',
      triggerType: 'SCHEDULE',
      triggerConfig: {},
      conditionConfig: { rules: [] },
      actionConfig: [
        {
          type: 'GENERATE_WEEKLY_REPORT',
          config: { sendEmail: true },
          executionMode: 'AUTO'
        }
      ],
      scheduleConfig: { frequency: 'WEEKLY', dayOfWeek: 1, timeOfDay: '09:00', timezone: 'Asia/Kolkata' },
      approvalMode: 'AUTO',
      enabled: true,
      priority: 'MEDIUM',
      version: 1,
      createdBy: 'system_template',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
  },
  {
    id: 'tpl_weekly_seo_audit',
    name: 'Run weekly SEO audit',
    description: 'Crawls website pages, validates LocalBusiness Schema.org markup, checks meta tags, and creates actionable SEO tasks for detected flaws.',
    category: 'SEO',
    triggerType: 'SCHEDULE',
    triggerDescription: 'Every Monday at 02:00 AM',
    frequency: 'Weekly',
    approvalMode: 'AUTO',
    conditionSummary: 'Scheduled weekly crawl',
    actionsSummary: 'Crawl allowed routes, audit metadata & Schema, log open issues, notify if score drops',
    priority: 'HIGH',
    defaultEnabled: true,
    ruleFactory: (businessId, organizationId, locationId) => ({
      id: `rule_weekly_seo_${businessId}`,
      organizationId,
      businessId,
      locationId,
      name: 'Weekly SEO Audit',
      description: 'Continuous weekly health audit of local schema, mobile responsiveness, and metadata.',
      category: 'SEO',
      triggerType: 'SCHEDULE',
      triggerConfig: {},
      conditionConfig: { rules: [] },
      actionConfig: [
        {
          type: 'RUN_SEO_CRAWL',
          config: { autoCreateTasks: true },
          executionMode: 'AUTO'
        }
      ],
      scheduleConfig: { frequency: 'WEEKLY', dayOfWeek: 1, timeOfDay: '02:00', timezone: 'Asia/Kolkata' },
      approvalMode: 'AUTO',
      enabled: true,
      priority: 'HIGH',
      version: 1,
      createdBy: 'system_template',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
  },
  {
    id: 'tpl_competitor_monitoring',
    name: 'Monitor competitor changes',
    description: 'Scans top 10 nearby competitors via Places API, alerts when a competitor rating or review volume changes substantially.',
    category: 'COMPETITOR',
    triggerType: 'SCHEDULE',
    triggerDescription: 'Every Wednesday at 06:00 AM',
    frequency: 'Weekly',
    approvalMode: 'AUTO',
    conditionSummary: 'Competitor rating change > 0.2 or review jump > 10',
    actionsSummary: 'Record competitor snapshot, compare baseline, dispatch alert if market shifts',
    priority: 'MEDIUM',
    defaultEnabled: true,
    ruleFactory: (businessId, organizationId, locationId) => ({
      id: `rule_competitor_scan_${businessId}`,
      organizationId,
      businessId,
      locationId,
      name: 'Competitor Monitoring',
      description: 'Weekly competitor benchmarking across 5 km radius in Chakan & Bhosari.',
      category: 'COMPETITOR',
      triggerType: 'SCHEDULE',
      triggerConfig: {},
      conditionConfig: { rules: [] },
      actionConfig: [
        {
          type: 'RUN_COMPETITOR_SCAN',
          config: { radiusMeters: 5000 },
          executionMode: 'AUTO'
        }
      ],
      scheduleConfig: { frequency: 'WEEKLY', dayOfWeek: 3, timeOfDay: '06:00', timezone: 'Asia/Kolkata' },
      approvalMode: 'AUTO',
      enabled: true,
      priority: 'MEDIUM',
      version: 1,
      createdBy: 'system_template',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
  },
  {
    id: 'tpl_visibility_grid',
    name: 'Monitor local visibility',
    description: 'Executes geo-grid proximity scans for core commercial query across 5x5 matrix to monitor local pack presence over time.',
    category: 'COMPETITOR',
    triggerType: 'SCHEDULE',
    triggerDescription: 'Every Thursday at 04:00 AM',
    frequency: 'Weekly',
    approvalMode: 'AUTO',
    conditionSummary: 'Track top 3 ranking coverage',
    actionsSummary: 'Run Places geo-coordinate matrix scan, update heatmap, alert if rank drops',
    priority: 'HIGH',
    defaultEnabled: true,
    ruleFactory: (businessId, organizationId, locationId) => ({
      id: `rule_visibility_grid_${businessId}`,
      organizationId,
      businessId,
      locationId,
      name: 'Local Visibility Grid Scan',
      description: 'Automated 5x5 heatmap scans for electrical supply queries in Chakan MIDC.',
      category: 'COMPETITOR',
      triggerType: 'SCHEDULE',
      triggerConfig: {},
      conditionConfig: { rules: [] },
      actionConfig: [
        {
          type: 'RUN_VISIBILITY_SCAN',
          config: { query: 'electrical shop chakan', gridSize: 5, radiusKm: 5 },
          executionMode: 'AUTO'
        }
      ],
      scheduleConfig: { frequency: 'WEEKLY', dayOfWeek: 4, timeOfDay: '04:00', timezone: 'Asia/Kolkata' },
      approvalMode: 'AUTO',
      enabled: true,
      priority: 'HIGH',
      version: 1,
      createdBy: 'system_template',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
  },
  {
    id: 'tpl_monthly_report',
    name: 'Create monthly report',
    description: 'Compiles full monthly analytics report (GBP, Reviews, SEO, GSC, GA4, Competitors) and generates a downloadable PDF and executive email.',
    category: 'ANALYTICS',
    triggerType: 'SCHEDULE',
    triggerDescription: '1st of every month at 08:00 AM',
    frequency: 'Monthly',
    approvalMode: 'AUTO',
    conditionSummary: 'Monthly execution schedule',
    actionsSummary: 'Generate comprehensive monthly growth PDF, notify client and agency management',
    priority: 'MEDIUM',
    defaultEnabled: true,
    ruleFactory: (businessId, organizationId, locationId) => ({
      id: `rule_monthly_report_${businessId}`,
      organizationId,
      businessId,
      locationId,
      name: 'Monthly Executive Report',
      description: 'Automated end-of-month performance review and PDF generation.',
      category: 'ANALYTICS',
      triggerType: 'SCHEDULE',
      triggerConfig: {},
      conditionConfig: { rules: [] },
      actionConfig: [
        {
          type: 'GENERATE_MONTHLY_REPORT',
          config: { generatePdf: true, sendDigest: true },
          executionMode: 'AUTO'
        }
      ],
      scheduleConfig: { frequency: 'MONTHLY', timeOfDay: '08:00', timezone: 'Asia/Kolkata' },
      approvalMode: 'AUTO',
      enabled: true,
      priority: 'MEDIUM',
      version: 1,
      createdBy: 'system_template',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
  },
  {
    id: 'tpl_google_disconnect_alert',
    name: 'Alert when Google disconnects',
    description: 'Continuously monitors OAuth token health, API credentials, and automatically refreshes tokens or triggers urgent reconnect notifications.',
    category: 'SYSTEM',
    triggerType: 'TOKEN_EXPIRING',
    triggerDescription: 'Token expiry detected or API auth error',
    frequency: 'Every 30 minutes',
    approvalMode: 'AUTO',
    conditionSummary: 'Token within 15m of expiry or re-auth required',
    actionsSummary: 'Attempt silent token refresh; if failed, pause sync and send critical notification',
    priority: 'CRITICAL',
    defaultEnabled: true,
    ruleFactory: (businessId, organizationId, locationId) => ({
      id: `rule_disconnect_guard_${businessId}`,
      organizationId,
      businessId,
      locationId,
      name: 'Google Integration Health Guard',
      description: 'Automated OAuth token refresh and immediate alert if permissions are revoked.',
      category: 'SYSTEM',
      triggerType: 'TOKEN_EXPIRING',
      triggerConfig: {},
      conditionConfig: { rules: [] },
      actionConfig: [
        {
          type: 'REFRESH_INTEGRATION_TOKEN',
          config: { provider: 'google' },
          executionMode: 'AUTO'
        }
      ],
      scheduleConfig: { frequency: '30_MIN' },
      approvalMode: 'AUTO',
      enabled: true,
      priority: 'CRITICAL',
      version: 1,
      createdBy: 'system_template',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
  },
  {
    id: 'tpl_weekly_ai_actions',
    name: 'Generate weekly AI actions',
    description: 'Synthesizes reviews, GSC queries, and profile gaps to populate the AI Action Center with prioritized next-best-actions.',
    category: 'AI',
    triggerType: 'SCHEDULE',
    triggerDescription: 'Every Tuesday at 08:00 AM',
    frequency: 'Weekly',
    approvalMode: 'AUTO',
    conditionSummary: 'Weekly automated review of data signals',
    actionsSummary: 'Scan profile completion, keyword drops, and unreplied reviews to generate AI Action items',
    priority: 'HIGH',
    defaultEnabled: true,
    ruleFactory: (businessId, organizationId, locationId) => ({
      id: `rule_ai_actions_${businessId}`,
      organizationId,
      businessId,
      locationId,
      name: 'AI Action Center Optimization Generator',
      description: 'Generates prioritized next-best-actions for business profile and SEO.',
      category: 'AI',
      triggerType: 'SCHEDULE',
      triggerConfig: {},
      conditionConfig: { rules: [] },
      actionConfig: [
        {
          type: 'GENERATE_AI_ACTIONS',
          config: { maxActions: 5 },
          executionMode: 'AUTO'
        }
      ],
      scheduleConfig: { frequency: 'WEEKLY', dayOfWeek: 2, timeOfDay: '08:00', timezone: 'Asia/Kolkata' },
      approvalMode: 'AUTO',
      enabled: true,
      priority: 'HIGH',
      version: 1,
      createdBy: 'system_template',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
  },
  {
    id: 'tpl_sync_google_data',
    name: 'Sync all Google data',
    description: 'Regularly syncs Google Business Profile reviews, performance metrics, and updates store location details.',
    category: 'GOOGLE',
    triggerType: 'SCHEDULE',
    triggerDescription: 'Every 15 minutes',
    frequency: 'Every 15 min',
    approvalMode: 'AUTO',
    conditionSummary: 'Every 15 minutes continuous sync',
    actionsSummary: 'Fetch new reviews, pull daily impressions/calls/clicks, reconcile local database',
    priority: 'HIGH',
    defaultEnabled: true,
    ruleFactory: (businessId, organizationId, locationId) => ({
      id: `rule_google_sync_${businessId}`,
      organizationId,
      businessId,
      locationId,
      name: 'Google Profile & Performance Continuous Sync',
      description: 'Continuously pulls Google Reviews, Calls, Views, and Directions telemetry.',
      category: 'GOOGLE',
      triggerType: 'SCHEDULE',
      triggerConfig: {},
      conditionConfig: { rules: [] },
      actionConfig: [
        {
          type: 'SYNC_GOOGLE_DATA',
          config: { syncReviews: true, syncPerformance: true, syncLocations: true },
          executionMode: 'AUTO'
        }
      ],
      scheduleConfig: { frequency: '15_MIN' },
      approvalMode: 'AUTO',
      enabled: true,
      priority: 'HIGH',
      version: 1,
      createdBy: 'system_template',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
  },
  {
    id: 'tpl_search_console_opportunities',
    name: 'Monitor Search Console opportunities',
    description: 'Detects high-impression, low-CTR queries ranking between position 4 and 15, and creates targeted title/meta optimization tasks.',
    category: 'SEO',
    triggerType: 'SCHEDULE',
    triggerDescription: 'Daily at 05:00 AM',
    frequency: 'Daily',
    approvalMode: 'AUTO',
    conditionSummary: 'Queries with impressions > 500 and CTR < 3% and position 4–15',
    actionsSummary: 'Extract CTR underperformers from GSC, generate page meta suggestions, assign tasks',
    priority: 'MEDIUM',
    defaultEnabled: true,
    ruleFactory: (businessId, organizationId, locationId) => ({
      id: `rule_gsc_opps_${businessId}`,
      organizationId,
      businessId,
      locationId,
      name: 'Search Console SEO Opportunity Detector',
      description: 'Analyzes organic search queries to identify low-hanging CTR opportunities.',
      category: 'SEO',
      triggerType: 'SCHEDULE',
      triggerConfig: {},
      conditionConfig: { rules: [] },
      actionConfig: [
        {
          type: 'SYNC_SEARCH_CONSOLE_OPPORTUNITIES',
          config: { minImpressions: 500, maxPosition: 15 },
          executionMode: 'AUTO'
        }
      ],
      scheduleConfig: { frequency: 'DAILY', timeOfDay: '05:00', timezone: 'Asia/Kolkata' },
      approvalMode: 'AUTO',
      enabled: true,
      priority: 'MEDIUM',
      version: 1,
      createdBy: 'system_template',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
  },
  {
    id: 'tpl_website_performance_anomaly',
    name: 'Monitor website performance',
    description: 'Monitors GA4 traffic and GBP website clicks. Detects anomalies such as >20% sudden drops in website clicks or calls.',
    category: 'ANALYTICS',
    triggerType: 'PERFORMANCE_SYNCED',
    triggerDescription: 'Daily performance telemetry sync',
    frequency: 'Daily',
    approvalMode: 'AUTO',
    conditionSummary: 'Website clicks drop > 20% compared to 30d baseline',
    actionsSummary: 'Raise high-priority performance alert, analyze root cause, notify business owner',
    priority: 'HIGH',
    defaultEnabled: true,
    ruleFactory: (businessId, organizationId, locationId) => ({
      id: `rule_perf_anomaly_${businessId}`,
      organizationId,
      businessId,
      locationId,
      name: 'Performance Anomaly & Traffic Drop Monitor',
      description: 'Detects significant drops in calls, directions, or website visits.',
      category: 'ANALYTICS',
      triggerType: 'PERFORMANCE_SYNCED',
      triggerConfig: {},
      conditionConfig: {
        logicalOperator: 'AND',
        rules: [
          { field: 'websiteClicksDropPct', operator: 'gte', value: 20 }
        ]
      },
      actionConfig: [
        {
          type: 'DISPATCH_ANOMALY_ALERT',
          config: { metric: 'websiteClicks' },
          executionMode: 'AUTO'
        }
      ],
      scheduleConfig: { frequency: 'DAILY', timeOfDay: '06:30', timezone: 'Asia/Kolkata' },
      approvalMode: 'AUTO',
      enabled: true,
      priority: 'HIGH',
      version: 1,
      createdBy: 'system_template',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
  }
];
