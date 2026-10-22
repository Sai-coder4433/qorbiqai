import { geminiService } from './gemini.service.ts';
import { Business, BusinessLocation, SearchConsoleData, GBPPerformanceData } from '../../types/index.ts';

export interface ProfileOptimizationSuggestion {
  field: string;
  current: string;
  suggested: string;
  reason: string;
  confidence: 'High' | 'Medium' | 'Low';
}

export interface SeoAutomationTask {
  title: string;
  why: string;
  evidence: string;
  suggestedChange: string;
  impactHypothesis: string;
  severity: 'High' | 'Medium' | 'Low';
}

export interface PerformanceAiReport {
  whatChanged: string[];
  whatImproved: string[];
  whatDeclined: string[];
  recommendedActions: string[];
}

export class SeoAnalyzerService {
  public async optimizeGBPProfile(
    business: Business,
    location: BusinessLocation
  ): Promise<ProfileOptimizationSuggestion[]> {
    const systemInstruction = `You are a Local SEO Specialist analyzing a Google Business Profile listing for ${business.name}.
Analyze ONLY the provided live profile data for local search visibility, clarity, and completeness.

Analyze:
1. Business Title: Ensure branding is clear without violating Google's guidelines (no keyword stuffing).
2. Primary & Additional Categories: Ensure exact relevance.
3. Description: Check for clear value proposition, mention of neighborhood/city (${location.locality || business.city}), core specializations.
4. Services & Attributes completeness.

Return a JSON array of suggestions:
{
  "suggestions": [
    {
      "field": "description" | "primaryCategory" | "additionalCategories" | "services",
      "current": "...",
      "suggested": "...",
      "reason": "...",
      "confidence": "High" | "Medium" | "Low"
    }
  ]
}`;

    const prompt = `Current Profile Data:
Business Name: ${business.name}
Location Title: ${location.title}
Primary Category: ${location.primaryCategory || business.category}
Additional Categories: ${location.additionalCategories ? location.additionalCategories.join(', ') : 'None'}
Address: ${location.addressLines.join(', ')}, ${location.locality}, ${location.administrativeArea}
Current Description: ${location.description || 'No description provided'}
Website: ${location.websiteUri || business.website || 'None'}
Phone: ${location.phoneNumber || business.phone || 'None'}`;

    const res = await geminiService.generateStructuredContent<{
      suggestions: ProfileOptimizationSuggestion[];
    }>({
      organizationId: business.organizationId,
      businessId: business.id,
      feature: 'profile_optimization',
      systemInstruction,
      prompt
    });

    return res.data.suggestions || [];
  }

  public async analyzeSearchConsole(
    business: Business,
    data: SearchConsoleData
  ): Promise<SeoAutomationTask[]> {
    const systemInstruction = `You are an organic Local Search Console optimization engine.
Analyze real Search Console queries and pages.
Identify:
1. High impressions with low CTR (< 3%) ripe for meta title & description CTR optimization.
2. Striking distance keywords (rank 4 to 15) that can move to top 3 with targeted content.
3. Queries with good clicks that need dedicated landing pages.

Return JSON:
{
  "tasks": [
    {
      "title": "...",
      "why": "...",
      "evidence": "...",
      "suggestedChange": "...",
      "impactHypothesis": "...",
      "severity": "High" | "Medium" | "Low"
    }
  ]
}`;

    const topQueries = data.queries.slice(0, 15);
    const topPages = data.pages.slice(0, 10);

    const prompt = `Search Console Data for ${data.siteUrl}:
Overall: ${data.clicks} clicks, ${data.impressions} impressions, ${data.ctr}% CTR, avg position ${data.position}

Top Queries:
${topQueries.map(q => `- "${q.query}": ${q.clicks} clicks, ${q.impressions} impr, ${q.ctr}% CTR, pos ${q.position}`).join('\n')}

Top Pages:
${topPages.map(p => `- ${p.page}: ${p.clicks} clicks, ${p.impressions} impr, ${p.ctr}% CTR, pos ${p.position}`).join('\n')}`;

    const res = await geminiService.generateStructuredContent<{ tasks: SeoAutomationTask[] }>({
      organizationId: business.organizationId,
      businessId: business.id,
      feature: 'search_console_analysis',
      systemInstruction,
      prompt
    });

    return res.data.tasks || [];
  }

  public async generatePerformanceSummary(
    business: Business,
    current: GBPPerformanceData
  ): Promise<PerformanceAiReport> {
    const systemInstruction = `You are an executive Local SEO reporting analyst.
Summarize the real Google Business Profile performance metrics.

RULES:
- ONLY reference real numbers provided in the data.
- NEVER invent reasons like "Google changed its algorithm" unless verified.
- Language must be factual: "Searches reached X, an increase of Y%."

Format JSON:
{
  "whatChanged": ["..."],
  "whatImproved": ["..."],
  "whatDeclined": ["..."],
  "recommendedActions": ["..."]
}`;

    const prompt = `Business: ${business.name}
Period: ${current.dateRange}
Totals:
- Total Profile Views (Maps): ${current.totals.totalViews}
- Total Search Impressions: ${current.totals.totalSearches}
- Call Clicks: ${current.totals.totalCalls}
- Website Clicks: ${current.totals.totalWebsiteClicks}
- Direction Requests: ${current.totals.totalDirections}
- Bookings: ${current.totals.totalBookings}
- Conversations: ${current.totals.totalConversations}`;

    const res = await geminiService.generateStructuredContent<PerformanceAiReport>({
      organizationId: business.organizationId,
      businessId: business.id,
      feature: 'performance_summary',
      systemInstruction,
      prompt
    });

    return res.data;
  }
}

export const seoAnalyzerService = new SeoAnalyzerService();
