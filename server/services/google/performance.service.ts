import { googleOAuthService } from './oauth.service.ts';
import { GBPPerformanceData, PerformanceMetricPoint } from '../../types/index.ts';

export class GooglePerformanceService {
  public async getPerformance(businessId: string, locationName: string, days: number = 30): Promise<GBPPerformanceData> {
    const accessToken = await googleOAuthService.getValidAccessToken(businessId);
    
    // Calculate date ranges
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const dailyRange = {
      startDate: {
        year: startDate.getFullYear(),
        month: startDate.getMonth() + 1,
        day: startDate.getDate()
      },
      endDate: {
        year: endDate.getFullYear(),
        month: endDate.getMonth() + 1,
        day: endDate.getDate()
      }
    };

    const metrics = [
      'BUSINESS_IMPRESSIONS_DESKTOP_MAPS',
      'BUSINESS_IMPRESSIONS_MOBILE_MAPS',
      'BUSINESS_IMPRESSIONS_DESKTOP_SEARCH',
      'BUSINESS_IMPRESSIONS_MOBILE_SEARCH',
      'CALL_CLICKS',
      'WEBSITE_CLICKS',
      'BUSINESS_DIRECTION_REQUESTS',
      'BUSINESS_BOOKINGS',
      'BUSINESS_CONVERSATIONS'
    ];

    // Official API: https://businessprofileperformance.googleapis.com/v1/{location}:fetchMultiDailyMetricsTimeSeries
    const url = new URL(`https://businessprofileperformance.googleapis.com/v1/${locationName}:fetchMultiDailyMetricsTimeSeries`);
    metrics.forEach(m => url.searchParams.append('dailyMetrics', m));
    url.searchParams.append('dailyRange.startDate.year', String(dailyRange.startDate.year));
    url.searchParams.append('dailyRange.startDate.month', String(dailyRange.startDate.month));
    url.searchParams.append('dailyRange.startDate.day', String(dailyRange.startDate.day));
    url.searchParams.append('dailyRange.endDate.year', String(dailyRange.endDate.year));
    url.searchParams.append('dailyRange.endDate.month', String(dailyRange.endDate.month));
    url.searchParams.append('dailyRange.endDate.day', String(dailyRange.endDate.day));

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Performance API error (${res.status}): ${err}`);
    }

    const data = await res.json();
    return this.parsePerformanceTimeSeries(businessId, locationName, data, `${days}d`);
  }

  private parsePerformanceTimeSeries(businessId: string, locationId: string, raw: any, dateRange: string): GBPPerformanceData {
    const timeSeriesList = raw.multiDailyMetricTimeSeries || [];
    
    const extractSeries = (metricName: string): PerformanceMetricPoint[] => {
      const seriesObj = timeSeriesList.find((s: any) => s.dailyMetric === metricName);
      if (!seriesObj || !seriesObj.dailyMetricTimeSeries || !seriesObj.dailyMetricTimeSeries.timeSeries) {
        return [];
      }
      return seriesObj.dailyMetricTimeSeries.timeSeries.datedValues.map((v: any) => ({
        date: `${v.date.year}-${String(v.date.month).padStart(2, '0')}-${String(v.date.day).padStart(2, '0')}`,
        value: Number(v.value || 0)
      }));
    };

    const desktopMaps = extractSeries('BUSINESS_IMPRESSIONS_DESKTOP_MAPS');
    const mobileMaps = extractSeries('BUSINESS_IMPRESSIONS_MOBILE_MAPS');
    const desktopSearch = extractSeries('BUSINESS_IMPRESSIONS_DESKTOP_SEARCH');
    const mobileSearch = extractSeries('BUSINESS_IMPRESSIONS_MOBILE_SEARCH');
    const callClicks = extractSeries('CALL_CLICKS');
    const websiteClicks = extractSeries('WEBSITE_CLICKS');
    const directions = extractSeries('BUSINESS_DIRECTION_REQUESTS');
    const bookings = extractSeries('BUSINESS_BOOKINGS');
    const conversations = extractSeries('BUSINESS_CONVERSATIONS');

    const sum = (pts: PerformanceMetricPoint[]) => pts.reduce((acc, p) => acc + p.value, 0);

    const totalViews = sum(desktopMaps) + sum(mobileMaps);
    const totalSearches = sum(desktopSearch) + sum(mobileSearch);
    const totalCalls = sum(callClicks);
    const totalWebsiteClicks = sum(websiteClicks);
    const totalDirections = sum(directions);
    const totalBookings = sum(bookings);
    const totalConversations = sum(conversations);

    return {
      businessId,
      locationId,
      lastSyncedAt: new Date().toISOString(),
      dateRange,
      metrics: {
        businessImpressionsDesktopMaps: desktopMaps,
        businessImpressionsMobileMaps: mobileMaps,
        businessImpressionsDesktopSearch: desktopSearch,
        businessImpressionsMobileSearch: mobileSearch,
        callClicks,
        websiteClicks,
        businessDirections: directions,
        businessBookings: bookings,
        businessConversations: conversations
      },
      totals: {
        totalViews,
        totalSearches,
        totalCalls,
        totalWebsiteClicks,
        totalDirections,
        totalBookings,
        totalConversations,
        rating: 0, // Filled from location details
        reviewCount: 0
      }
    };
  }
}

export const googlePerformanceService = new GooglePerformanceService();
