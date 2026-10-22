import { geminiService } from './gemini.service.ts';
import { Business, PostType } from '../../types/index.ts';

export class PostGeneratorService {
  public async draftPost(params: {
    business: Business;
    topicType: PostType;
    facts: string;
    offerDetails?: { discountPercent?: number; couponCode?: string; validUntil?: string };
    eventDetails?: { title: string; startDate: string; endDate: string };
    ctaType?: 'LEARN_MORE' | 'BOOK' | 'ORDER' | 'SHOP' | 'SIGN_UP' | 'CALL';
  }): Promise<{
    summary: string;
    suggestedCtaType: string;
    callToActionUrl?: string;
    reasoningSummary: string;
    factsUsed: string[];
  }> {
    const systemInstruction = `You are a Local Social & SEO Specialist for ${params.business.name}.
Draft an engaging Google Business Profile Post.
Rules:
- Post Type: ${params.topicType}
- ONLY use the factual inputs provided.
- NO invented promotions, no exaggerated claims, no fake prices.
- Maximum 150-300 words, clear local appeal with call to action.

Return JSON:
{
  "summary": "...",
  "suggested_cta": "${params.ctaType || 'LEARN_MORE'}",
  "reasoning_summary": "...",
  "facts_used": ["..."]
}`;

    const prompt = `Business: ${params.business.name}
Category: ${params.business.category}
City: ${params.business.city}
Post Type: ${params.topicType}
Factual Details Provided by User: "${params.facts}"
${params.offerDetails ? `Offer: ${JSON.stringify(params.offerDetails)}` : ''}
${params.eventDetails ? `Event: ${JSON.stringify(params.eventDetails)}` : ''}`;

    const res = await geminiService.generateStructuredContent<{
      summary: string;
      suggested_cta: string;
      reasoning_summary: string;
      facts_used: string[];
    }>({
      organizationId: params.business.organizationId,
      businessId: params.business.id,
      feature: 'post_generator',
      systemInstruction,
      prompt
    });

    return {
      summary: res.data.summary,
      suggestedCtaType: res.data.suggested_cta || params.ctaType || 'LEARN_MORE',
      callToActionUrl: params.business.website,
      reasoningSummary: res.reasoning_summary || '',
      factsUsed: res.facts_used || []
    };
  }
}

export const postGeneratorService = new PostGeneratorService();
