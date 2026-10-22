import { geminiService } from '../ai/gemini.service.ts';
import { Business } from '../../types/index.ts';

export interface KeywordCandidate {
  keyword: string;
  source: 'AI Suggested' | 'GBP Observed' | 'Search Console Observed';
  searchIntent: 'Commercial' | 'Informational' | 'Transactional' | 'Navigational';
  competition: 'High' | 'Medium' | 'Low';
  relevanceReason: string;
}

export class LocalKeywordService {
  public async generateCandidates(
    business: Business,
    neighborhoods: string[] = []
  ): Promise<KeywordCandidate[]> {
    const systemInstruction = `You are a Local SEO Keyword Research Engine.
Generate high-intent local search queries for ${business.name}.
CRITICAL DATA DISCLOSURE RULE:
- All generated keywords must be strictly tagged as "AI Suggested".
- NEVER fabricate search volumes or claim this represents Google proprietary search logs.
- Focus on localized long-tail variations combining service + city/neighborhood.

Return JSON:
{
  "keywords": [
    {
      "keyword": "...",
      "source": "AI Suggested",
      "searchIntent": "Commercial" | "Informational" | "Transactional" | "Navigational",
      "competition": "High" | "Medium" | "Low",
      "relevanceReason": "..."
    }
  ]
}`;

    const prompt = `Business Category: ${business.category}
City: ${business.city}
Country: ${business.country}
Target Neighborhoods: ${neighborhoods.join(', ') || business.city}
Experience Highlights: ${business.experienceChips.join(', ')}`;

    const res = await geminiService.generateStructuredContent<{ keywords: KeywordCandidate[] }>({
      organizationId: business.organizationId,
      businessId: business.id,
      feature: 'keyword_generation',
      systemInstruction,
      prompt
    });

    return (res.data.keywords || []).map(k => ({
      ...k,
      source: 'AI Suggested' // Guarantee anti-fabrication label
    }));
  }
}

export const localKeywordService = new LocalKeywordService();
