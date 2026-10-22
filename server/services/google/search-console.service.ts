import { googleOAuthService } from './oauth.service.ts';
import { SearchConsoleData } from '../../types/index.ts';

export class GoogleSearchConsoleService {
  public async listSites(businessId: string): Promise<Array<{ siteUrl: string; permissionLevel: string }>> {
    const accessToken = await googleOAuthService.getValidAccessToken(businessId);
    const res = await fetch('https://www.googleapis.com/webmasters/v3/sites', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Search Console sites fetch failed (${res.status}): ${err}`);
    }

    const data = await res.json();
    return (data.siteEntry || []).map((s: any) => ({
      siteUrl: s.siteUrl,
      permissionLevel: s.permissionLevel
    }));
  }

  public async queryAnalytics(
    businessId: string,
    siteUrl: string,
    startDate?: string,
    endDate?: string
  ): Promise<SearchConsoleData> {
    const accessToken = await googleOAuthService.getValidAccessToken(businessId);

    // Default to last 28 days if not specified
    if (!endDate) {
      const d = new Date();
      d.setDate(d.getDate() - 2); // Search Console typically lags 2 days
      endDate = d.toISOString().split('T')[0];
    }
    if (!startDate) {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      startDate = d.toISOString().split('T')[0];
    }

    const encodedSite = encodeURIComponent(siteUrl);
    const url = `https://www.googleapis.com/webmasters/v3/sites/${encodedSite}/searchAnalytics/query`;

    // 1. Fetch query dimensions
    const queryRes = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        startDate,
        endDate,
        dimensions: ['query'],
        rowLimit: 50
      })
    });

    if (!queryRes.ok) {
      const err = await queryRes.text();
      throw new Error(`Search Console queries request failed: ${err}`);
    }

    const queryData = await queryRes.json();
    const queryRows = (queryData.rows || []).map((r: any) => ({
      query: r.keys[0],
      clicks: Math.round(r.clicks || 0),
      impressions: Math.round(r.impressions || 0),
      ctr: Number(((r.ctr || 0) * 100).toFixed(2)),
      position: Number((r.position || 0).toFixed(1))
    }));

    // 2. Fetch page dimensions
    const pageRes = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        startDate,
        endDate,
        dimensions: ['page'],
        rowLimit: 50
      })
    });

    const pageData = pageRes.ok ? await pageRes.json() : { rows: [] };
    const pageRows = (pageData.rows || []).map((r: any) => ({
      page: r.keys[0],
      clicks: Math.round(r.clicks || 0),
      impressions: Math.round(r.impressions || 0),
      ctr: Number(((r.ctr || 0) * 100).toFixed(2)),
      position: Number((r.position || 0).toFixed(1))
    }));

    // Aggregate totals
    const totalClicks = queryRows.reduce((sum: number, r: any) => sum + r.clicks, 0);
    const totalImpressions = queryRows.reduce((sum: number, r: any) => sum + r.impressions, 0);
    const avgCtr = totalImpressions > 0 ? Number(((totalClicks / totalImpressions) * 100).toFixed(2)) : 0;
    const avgPosition = queryRows.length > 0 
      ? Number((queryRows.reduce((sum: number, r: any) => sum + r.position, 0) / queryRows.length).toFixed(1)) 
      : 0;

    return {
      siteUrl,
      lastSyncedAt: new Date().toISOString(),
      clicks: totalClicks,
      impressions: totalImpressions,
      ctr: avgCtr,
      position: avgPosition,
      queries: queryRows,
      pages: pageRows
    };
  }
}

export const googleSearchConsoleService = new GoogleSearchConsoleService();
