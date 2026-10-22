import { geminiService } from './gemini.service.ts';
import { Business } from '../../types/index.ts';

export class ReviewGeneratorService {
  public async draftCustomerReview(
    business: Business,
    rating: number,
    selectedChips: string[],
    customerNote?: string
  ): Promise<{
    suggestedReview: string;
    reasoningSummary: string;
    factsUsed: string[];
  }> {
    const systemInstruction = `You are a writing assistant helping a verified customer draft their own review for ${business.name}.
Google Policy Compliance:
- The text must reflect ONLY what the customer experienced based strictly on their star rating (${rating}/5), the chips they selected (${selectedChips.join(', ')}), and their optional note ("${customerNote || 'none'}").
- NEVER invent facts, staff names, specific monetary amounts, or claims not provided.
- Keep the wording natural, honest, and helpful to other prospective local customers.
- Return ONLY JSON matching:
{
  "suggested_review": "...",
  "reasoning_summary": "...",
  "facts_used": ["..."]
}`;

    const prompt = `Customer Rating: ${rating} Stars
Selected Highlights: ${selectedChips.join(', ') || 'General Visit'}
Customer Note: ${customerNote || 'None'}
Business Name: ${business.name}
Business City: ${business.city}`;

    const result = await geminiService.generateStructuredContent<{
      suggested_review: string;
      reasoning_summary: string;
      facts_used: string[];
    }>({
      organizationId: business.organizationId,
      businessId: business.id,
      feature: 'customer_review_draft',
      systemInstruction,
      prompt
    });

    return {
      suggestedReview: result.data.suggested_review,
      reasoningSummary: result.reasoning_summary || '',
      factsUsed: result.facts_used || []
    };
  }
}

export const reviewGeneratorService = new ReviewGeneratorService();
