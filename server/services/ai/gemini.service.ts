import { GoogleGenAI } from '@google/genai';
import { db } from '../../db/database.ts';

export class GeminiService {
  private ai: GoogleGenAI;
  private model: string;

  constructor() {
    this.model = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
    this.ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }

  public getModelName(): string {
    return this.model;
  }

  public async generateStructuredContent<T>(params: {
    organizationId: string;
    businessId?: string;
    feature: string;
    systemInstruction: string;
    prompt: string;
    temperature?: number;
  }): Promise<{ data: T; reasoning_summary?: string; facts_used?: string[]; warnings?: string[] }> {
    const fullSystemInstruction = `${params.systemInstruction}

CRITICAL ANTI-HALLUCINATION POLICY:
1. ONLY utilize facts explicitly provided in the prompt context.
2. NEVER invent: staff names, prices, discounts, coupons, guarantees, policies, event dates, contact numbers, or claims not given in the verified business data.
3. You must respond ONLY with a valid JSON object matching the requested schema. No code fences, no extra commentary.`;

    try {
      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: params.prompt,
        config: {
          systemInstruction: fullSystemInstruction,
          responseMimeType: 'application/json',
          temperature: params.temperature ?? 0.2
        }
      });

      const text = response.text || '{}';
      let parsed: any;
      try {
        parsed = JSON.parse(text);
      } catch (e) {
        // Fallback cleanup if model wrapped in markdown
        const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        parsed = JSON.parse(cleaned);
      }

      // Track usage
      const inputTokens = response.usageMetadata?.promptTokenCount || Math.ceil(params.prompt.length / 4);
      const outputTokens = response.usageMetadata?.candidatesTokenCount || Math.ceil(text.length / 4);
      const estimatedCostUsd = (inputTokens * 0.00000015) + (outputTokens * 0.0000006);

      db.trackAiUsage({
        organizationId: params.organizationId,
        businessId: params.businessId,
        feature: params.feature,
        model: this.model,
        inputTokens,
        outputTokens,
        estimatedCostUsd
      });

      return {
        data: parsed,
        reasoning_summary: parsed.reasoning_summary || 'Generated strictly following business context and Google policy.',
        facts_used: parsed.facts_used || [],
        warnings: parsed.warnings || []
      };
    } catch (err: any) {
      console.error(`Gemini API error in ${params.feature}:`, err);
      throw new Error(`AI generation failed: ${err.message || 'Unknown error'}`);
    }
  }
}

export const geminiService = new GeminiService();
