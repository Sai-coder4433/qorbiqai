import { googleOAuthService } from './oauth.service.ts';
import { GA4AnalyticsData } from '../../types/index.ts';

export class GoogleAnalyticsService {
  public async runReport(
    businessId: string,
    propertyId: string,
    days: number = 30
  ): Promise<GA4AnalyticsData> {
    const accessToken = await googleOAuthService.getValidAccessToken(businessId);
    
    // Normalize propertyId (ensure it starts with "properties/")
    const cleanProp = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;
    const url = `https://analyticsdata.googleapis.com/v1beta/${cleanProp}:runReport`;

    const body = {
      dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
      dimensions: [{ name: 'sessionDefaultChannelGroup' }],
      metrics: [
        { name: 'activeUsers' },
        { name: 'sessions' },
        { name: 'engagedSessions' },
        { name: 'engagementRate' },
        { name: 'conversions' }
      ]
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`GA4 API request failed (${res.status}): ${err}`);
    }

    const data = await res.json();
    const rows = data.rows || [];

    let totalUsers = 0;
    let totalSessions = 0;
    let totalEngagedSessions = 0;
    let totalConversions = 0;

    const sources = rows.map((r: any) => {
      const source = r.dimensionValues?.[0]?.value || 'Direct';
      const users = Number(r.metricValues?.[0]?.value || 0);
      const sessions = Number(r.metricValues?.[1]?.value || 0);
      const engaged = Number(r.metricValues?.[2]?.value || 0);
      const conversions = Number(r.metricValues?.[4]?.value || 0);

      totalUsers += users;
      totalSessions += sessions;
      totalEngagedSessions += engaged;
      totalConversions += conversions;

      return {
        source,
        medium: 'session',
        users,
        sessions
      };
    });

    const engagementRate = totalSessions > 0
      ? Number(((totalEngagedSessions / totalSessions) * 100).toFixed(2))
      : 0;

    // Fetch landing pages in separate report
    let landingPages: Array<{ pagePath: string; sessions: number; conversions: number }> = [];
    try {
      const pageRes = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
          dimensions: [{ name: 'pagePath' }],
          metrics: [{ name: 'sessions' }, { name: 'conversions' }],
          limit: 20
        })
      });
      if (pageRes.ok) {
        const pageData = await pageRes.json();
        landingPages = (pageData.rows || []).map((r: any) => ({
          pagePath: r.dimensionValues?.[0]?.value || '/',
          sessions: Number(r.metricValues?.[0]?.value || 0),
          conversions: Number(r.metricValues?.[1]?.value || 0)
        }));
      }
    } catch (e) {
      console.warn('GA4 landing pages query failed:', e);
    }

    return {
      propertyId,
      lastSyncedAt: new Date().toISOString(),
      activeUsers: totalUsers,
      sessions: totalSessions,
      engagedSessions: totalEngagedSessions,
      engagementRate,
      conversions: totalConversions,
      sources,
      landingPages
    };
  }
}

export const googleAnalyticsService = new GoogleAnalyticsService();
