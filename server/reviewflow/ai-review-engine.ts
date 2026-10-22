import { GoogleGenAI } from '@google/genai';
import crypto from 'crypto';
import {
  ReviewFlowBusiness,
  ReviewFlowReviewSession,
  ReviewFlowReviewGeneration,
  ReviewFlowAiObservabilityMetrics
} from './types.ts';
import { reviewFlowStore } from './store.ts';

// ========================================================
// 23. FINAL PUNCTUATION-FREE SANITIZER
// Strips . , ! ? ; : ' " ( ) [ ] { } - _ / \ — – : ; and Devanagari dandas
// Removes emojis and markdown wrappers
// Output contains strictly words and single spaces
// ========================================================
export function sanitizeReviewText(generatedText: string): string {
  if (!generatedText) return '';
  return generatedText
    // Remove markdown code fences or quotes
    .replace(/^```[a-z]*\s*/i, '')
    .replace(/\s*```$/i, '')
    // Remove emojis
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}]/gu, ' ')
    // Remove all punctuation marks including Devanagari dandas
    .replace(/[.,!?;:'"()[\]{}\-_/\\—–:;`~*#@^+=<>|«»“”‘’\u0964\u0965]/g, ' ')
    // Normalize spaces
    .replace(/\s+/g, ' ')
    .trim();
}

// ========================================================
// 15. AI MODEL CONFIGURATION
// Centralized server-side configuration reusing existing Gemini setup
// ========================================================
export const AI_CONFIG = {
  PROVIDER: 'GEMINI',
  get MODEL() {
    const settings = reviewFlowStore.getSystemSettings();
    return settings?.aiModel || process.env.GEMINI_MODEL || 'gemini-3.8-flash';
  },
  FALLBACK_MODELS: ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-3.1-flash-lite'],
  MAX_OUTPUT_TOKENS: 350,
  BASE_TEMPERATURE: 0.85,
  MAX_RETRIES: 3 // up to 3 retries (4 total attempts)
};

// ========================================================
// 14. MASTER GEMINI SYSTEM PROMPT
// Strict natural human customer review engine
// ========================================================
export const REVIEWFLOW_MASTER_SYSTEM_PROMPT = `You are the ReviewFlow AI review writing engine.

Generate a fresh natural customer review based primarily on the customer's own experience.

The customer experience is the source of truth.

Selected topics provide context only and must never be treated as facts unless supported by customer input.

Every generation must be completely new.

Never copy or lightly paraphrase previous generated reviews.

Never reuse the same opening sentence.

Never reuse the same sentence structure.

Never reuse distinctive phrases from previous generations.

Preserve the customer's actual meaning and sentiment.

Do not invent products prices staff names offers facilities waiting times service details or any other unsupported facts.

The output must sound like a real human customer wrote it.

Do not mention AI.

Do not mention this instruction.

Do not use marketing language.

Do not force five-star language.

Do not exaggerate the experience.

Return only the review text.`;

// ========================================================
// 21. RETRY VARIATION PROMPT INSTRUCTION
// ========================================================
export const RETRY_VARIATION_INSTRUCTION = `The previous candidate was rejected because it was too similar to an existing review.

Generate another completely different version.

Change the opening.

Change sentence structure.

Change wording.

Change flow.

Do not reuse distinctive phrases.

Preserve only the customer's actual meaning.

Return only the new review.`;

// ========================================================
// AI OBSERVABILITY IN-MEMORY STATE (Section 29)
// ========================================================
const observabilityState = {
  totalGenerations: 0,
  successfulGenerations: 0,
  failedGenerations: 0,
  regenerations: 0,
  totalLatencyMs: 0,
  creditsConsumed: 0,
  lastSuccessfulRequestAt: undefined as string | undefined,
  lastFailedRequestAt: undefined as string | undefined,
  lastErrorMessage: undefined as string | undefined
};

// ========================================================
// 17 & 18. STRING NORMALIZATION & SIMILARITY CHECKING
// ========================================================
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s\u0900-\u097F]/g, ' ') // preserves Devanagari (Marathi/Hindi)
    .replace(/\s+/g, ' ')
    .trim();
}

export function countWords(text: string): number {
  if (!text || !text.trim()) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function extractNgrams(words: string[], n = 3): Set<string> {
  const ngrams = new Set<string>();
  if (words.length < n) {
    if (words.length > 0) ngrams.add(words.join(' '));
    return ngrams;
  }
  for (let i = 0; i <= words.length - n; i++) {
    ngrams.add(words.slice(i, i + n).join(' '));
  }
  return ngrams;
}

export function calculateNgramOverlap(textA: string, textB: string, n = 3): number {
  const wordsA = normalizeText(textA).split(/\s+/).filter(Boolean);
  const wordsB = normalizeText(textB).split(/\s+/).filter(Boolean);
  if (wordsA.length === 0 || wordsB.length === 0) return 0;

  const ngramsA = extractNgrams(wordsA, n);
  const ngramsB = extractNgrams(wordsB, n);

  let intersectionCount = 0;
  for (const g of ngramsA) {
    if (ngramsB.has(g)) intersectionCount++;
  }

  const unionCount = new Set([...ngramsA, ...ngramsB]).size;
  return unionCount === 0 ? 0 : intersectionCount / unionCount;
}

export function calculateTokenOverlap(wordsA: string[], wordsB: string[]): number {
  if (wordsA.length === 0 || wordsB.length === 0) return 0;
  const setA = new Set(wordsA);
  const setB = new Set(wordsB);
  let intersection = 0;
  for (const w of setA) {
    if (setB.has(w)) intersection++;
  }
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Checks for exact match, near duplicate, identical opening, or high n-gram overlap
 */
export function isRepetitiveGeneration(
  candidateText: string,
  previousReviews: string[]
): { repetitive: boolean; reason?: string; maxOverlap: number } {
  if (!previousReviews || previousReviews.length === 0) {
    return { repetitive: false, maxOverlap: 0 };
  }

  const normCandidate = normalizeText(candidateText);
  const candidateWords = normCandidate.split(/\s+/).filter(Boolean);
  let maxOverlapFound = 0;

  // Cliché openings to avoid repetitive starts
  const commonClicheOpenings = [
    'had a great experience',
    'had a really good experience',
    'really good experience',
    'overall a great experience',
    'it was a great experience',
    'had a good experience here',
    'great experience visiting'
  ];

  for (let i = 0; i < previousReviews.length; i++) {
    const prev = previousReviews[i];
    const normPrev = normalizeText(prev);

    // 1. Exact match (case, whitespace, and punctuation normalized)
    if (normCandidate === normPrev) {
      return {
        repetitive: true,
        reason: `Exact duplicate match with previous generation #${i + 1}`,
        maxOverlap: 1.0
      };
    }

    const prevWords = normPrev.split(/\s+/).filter(Boolean);

    // 2. Opening phrase check (first 3-4 words match)
    if (candidateWords.length >= 3 && prevWords.length >= 3) {
      const candPrefix3 = candidateWords.slice(0, 3).join(' ');
      const prevPrefix3 = prevWords.slice(0, 3).join(' ');
      if (candPrefix3 === prevPrefix3) {
        return {
          repetitive: true,
          reason: `Repeated opening phrase "${candPrefix3}" from generation #${i + 1}`,
          maxOverlap: 0.9
        };
      }
    }

    // 3. Opening sentence structural similarity check (2-gram overlap > 0.35)
    const candFirstSent = normCandidate.split(/[.!?\u0964]+/)[0] || normCandidate;
    const prevFirstSent = normPrev.split(/[.!?\u0964]+/)[0] || normPrev;
    const openOverlap = calculateNgramOverlap(candFirstSent, prevFirstSent, 2);
    if (openOverlap > 0.35) {
      return {
        repetitive: true,
        reason: `Opening sentence structural similarity (${Math.round(openOverlap * 100)}%) with generation #${i + 1}`,
        maxOverlap: openOverlap
      };
    }

    // 4. Cliché repeated opening check
    for (const cliche of commonClicheOpenings) {
      if (normCandidate.startsWith(cliche) && normPrev.startsWith(cliche)) {
        return {
          repetitive: true,
          reason: `Repeated cliché opening "${cliche}"`,
          maxOverlap: 0.8
        };
      }
    }

    // 5. N-gram phrase Jaccard overlap (> 0.40 considered too similar)
    const ngramOverlap = calculateNgramOverlap(candidateText, prev, 3);
    if (ngramOverlap > maxOverlapFound) {
      maxOverlapFound = ngramOverlap;
    }
    if (ngramOverlap > 0.40) {
      return {
        repetitive: true,
        reason: `High phrase overlap (${Math.round(ngramOverlap * 100)}%) with generation #${i + 1}`,
        maxOverlap: ngramOverlap
      };
    }

    // 6. Token / Word overlap (> 0.55 considered too similar)
    const tokenOverlap = calculateTokenOverlap(candidateWords, prevWords);
    if (tokenOverlap > 0.55) {
      return {
        repetitive: true,
        reason: `High vocabulary overlap (${Math.round(tokenOverlap * 100)}%) with generation #${i + 1}`,
        maxOverlap: tokenOverlap
      };
    }

    // 7. Closing sentence match
    if (candidateWords.length > 5 && prevWords.length > 5) {
      const candEnd4 = candidateWords.slice(-4).join(' ');
      const prevEnd4 = prevWords.slice(-4).join(' ');
      if (candEnd4 === prevEnd4) {
        return {
          repetitive: true,
          reason: `Identical closing phrase "${candEnd4}" with generation #${i + 1}`,
          maxOverlap: 0.75
        };
      }
    }
  }

  return { repetitive: false, maxOverlap: maxOverlapFound };
}

// ========================================================
// 14. DYNAMIC PROMPT BUILDER
// ========================================================
export function buildDynamicPrompt(params: {
  customerText: string;
  selectedTopics: string[];
  language: string;
  verifiedBusinessContext: string;
  previousReviews: string[];
  generationNumber: number;
  requestId: string;
  isRetry?: boolean;
}): string {
  const previousSection = params.previousReviews.length > 0
    ? params.previousReviews.map((r, i) => `${i + 1}. "${r}"`).join('\n')
    : 'None (First generation)';

  const topicsList = params.selectedTopics.length > 0
    ? params.selectedTopics.join(', ')
    : 'General visit experience';

  const customerText = params.customerText && params.customerText.trim().length > 0
    ? params.customerText.trim()
    : 'Positive overall experience';

  let prompt = `CUSTOMER EXPERIENCE:
${customerText}

SELECTED TOPICS:
${topicsList}

LANGUAGE:
${params.language}

BUSINESS CONTEXT:
${params.verifiedBusinessContext}

PREVIOUS REVIEWS TO AVOID:
${previousSection}

GENERATION NUMBER:
${params.generationNumber}

UNIQUE REQUEST ID:
${params.requestId}

VARIATION REQUIREMENT:
Create a completely fresh version that does not copy or closely paraphrase any previous review.`;

  if (params.isRetry) {
    prompt += `\n\nRETRY INSTRUCTION:\n${RETRY_VARIATION_INSTRUCTION}`;
  }

  return prompt;
}

// ========================================================
// REQUEST & RESPONSE INTERFACES
// ========================================================
export interface ReviewGenerationRequest {
  businessId: string;
  uniqueCode?: string;
  sessionId?: string;
  customerText: string;
  selectedTopics: string[];
  language?: string;
  generationNumber?: number;
  requestId?: string;
  ipAddress?: string;
}

export interface ReviewGenerationResult {
  draft: string;
  generationId: string;
  requestId: string;
  sessionId: string;
  generationNumber: number;
  wordCount: number;
  model: string;
  language: string;
  businessId: string;
  businessName: string;
  retryCount: number;
  latencyMs: number;
}

// ========================================================
// AI REVIEW ENGINE CLASS
// ========================================================
export class AiReviewEngine {
  /**
   * Securely initializes the Google GenAI client using the existing integrated configuration.
   * NEVER exposes API key to client or logs.
   */
  private getClient(): GoogleGenAI {
    const sysSettings = reviewFlowStore.getSystemSettings();
    const apiKey = (sysSettings?.geminiApiKey && sysSettings.geminiApiKey.trim().length > 10)
      ? sysSettings.geminiApiKey.trim()
      : process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim().length < 10) {
      throw new Error('Unable to generate a new review right now Please try again: Gemini API key is not configured.');
    }
    return new GoogleGenAI({ apiKey });
  }

  /**
   * Retrieves centralized Super Admin observability metrics (Section 29)
   */
  public getObservabilityMetrics(): ReviewFlowAiObservabilityMetrics {
    const sysSettings = reviewFlowStore.getSystemSettings();
    const apiKey = (sysSettings?.geminiApiKey && sysSettings.geminiApiKey.trim().length > 10)
      ? sysSettings.geminiApiKey.trim()
      : process.env.GEMINI_API_KEY;
    const isConfigured = Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim().length > 10);
    const avgLatency = observabilityState.successfulGenerations > 0
      ? Math.round(observabilityState.totalLatencyMs / observabilityState.successfulGenerations)
      : 0;

    return {
      provider: AI_CONFIG.PROVIDER,
      model: AI_CONFIG.MODEL,
      status: isConfigured ? 'Connected' : 'Unavailable',
      totalGenerations: observabilityState.totalGenerations,
      successfulGenerations: observabilityState.successfulGenerations,
      failedGenerations: observabilityState.failedGenerations,
      regenerations: observabilityState.regenerations,
      averageResponseTimeMs: avgLatency,
      creditsConsumed: observabilityState.creditsConsumed,
      lastSuccessfulRequestAt: observabilityState.lastSuccessfulRequestAt,
      lastFailedRequestAt: observabilityState.lastFailedRequestAt,
      lastErrorMessage: observabilityState.lastErrorMessage
    };
  }

  /**
   * Diagnostic test capability for Super Admin / Development (Section 30)
   */
  public async testGenerateReview(params: {
    customerText?: string;
    selectedTopics?: string[];
    language?: string;
    businessName?: string;
  }): Promise<{
    geminiRequestSent: boolean;
    model: string;
    requestId: string;
    generationId: string;
    responseReceived: boolean;
    rawText?: string;
    sanitizedReview?: string;
    generationTimeMs: number;
    similarityResult: { passed: boolean; checkedAgainstCount: number };
    finalStatus: string;
  }> {
    const startTime = Date.now();
    const testRequestId = 'test_' + crypto.randomUUID();
    const testGenId = 'gen_' + crypto.randomUUID();
    const modelToUse = AI_CONFIG.MODEL;

    const ai = this.getClient();
    const prompt = buildDynamicPrompt({
      customerText: params.customerText || 'food was good',
      selectedTopics: params.selectedTopics || ['Food and Taste'],
      language: params.language || 'English',
      verifiedBusinessContext: `${params.businessName || 'Test Restaurant'} (Restaurant)`,
      previousReviews: [],
      generationNumber: 1,
      requestId: testRequestId
    });

    const response = await ai.models.generateContent({
      model: modelToUse,
      contents: prompt,
      config: {
        systemInstruction: REVIEWFLOW_MASTER_SYSTEM_PROMPT,
        temperature: 0.85,
        maxOutputTokens: AI_CONFIG.MAX_OUTPUT_TOKENS
      }
    });

    const rawText = response.text?.trim() || '';
    const sanitized = sanitizeReviewText(rawText);
    const latency = Date.now() - startTime;

    return {
      geminiRequestSent: true,
      model: modelToUse,
      requestId: testRequestId,
      generationId: testGenId,
      responseReceived: Boolean(rawText),
      rawText,
      sanitizedReview: sanitized,
      generationTimeMs: latency,
      similarityResult: { passed: true, checkedAgainstCount: 0 },
      finalStatus: 'SUCCESS'
    };
  }

  /**
   * Generates or regenerates an authentic, completely new customer review draft.
   * Real Gemini request ONLY.
   * Absolutely NO static reviews, NO predefined arrays, NO fake fallbacks, NO cached responses.
   *
   * Flow per Sections 25 & 26:
   * 1. Unique requestId and generationId
   * 2. Original customer input is preserved as factual source
   * 3. Previous generations loaded strictly for this business & session
   * 4. Call Gemini with anti-repetition instructions
   * 5. Validate uniqueness & similarity
   * 6. Retry Gemini up to 3 times if candidate is too similar
   * 7. Sanitize punctuation (words and spaces only)
   * 8. Persist separate record in review_generations
   * 9. Return genuinely new review
   */
  public async generateReview(request: ReviewGenerationRequest): Promise<ReviewGenerationResult> {
    const startTime = Date.now();
    observabilityState.totalGenerations++;

    const requestId = request.requestId || ('req_' + crypto.randomUUID());
    const generationId = 'gen_' + crypto.randomUUID();

    // 1. Validate customer input: accepts short inputs (e.g. "good", "mast", "food was good")
    const cleanCustomerText = (request.customerText || '').trim();
    const topics = Array.isArray(request.selectedTopics) ? request.selectedTopics : [];
    if (topics.length === 0 && cleanCustomerText.length < 2) {
      throw new Error(
        'Please select at least one topic or tell us about your experience before generating a review.'
      );
    }

    // 2. Identify business context strictly (Section 34: Multi-business isolation)
    let business: ReviewFlowBusiness | undefined;
    if (request.businessId) {
      business = reviewFlowStore.getBusinessById(request.businessId);
    }
    if (!business && request.uniqueCode) {
      const qr = reviewFlowStore.getQrCodeByUniqueCode(request.uniqueCode);
      if (qr) {
        business = reviewFlowStore.getBusinessById(qr.businessId);
      }
    }
    if (!business) {
      throw new Error('Valid business workspace could not be identified for this review.');
    }

    // 3. Resolve or create review session
    let session: ReviewFlowReviewSession | undefined;
    if (request.sessionId) {
      session = reviewFlowStore.getReviewSessionById(request.sessionId);
    }

    const currentLang = request.language || business.preferredLanguage || 'English';

    if (!session) {
      session = reviewFlowStore.recordReviewSession({
        businessId: business.id,
        businessCode: request.uniqueCode || (business as any).uniqueCode || '',
        selectedTopics: topics,
        customerText: cleanCustomerText,
        language: currentLang,
        lastGenerationAt: new Date().toISOString()
      });
    } else {
      reviewFlowStore.updateReviewSession(session.id, {
        customerText: cleanCustomerText,
        selectedTopics: topics,
        language: currentLang
      });
    }

    // 4. Multi-business isolation: load previous generations strictly for this session AND business
    const existingGenerations = reviewFlowStore.getReviewGenerationsBySessionAndBusiness(session.id, business.id);
    const previousDrafts = existingGenerations
      .map(g => g.generatedText)
      .filter(text => Boolean(text && text.trim().length > 0));

    const generationNumber = (request.generationNumber && request.generationNumber > 0)
      ? request.generationNumber
      : existingGenerations.length + 1;

    if (generationNumber > 1) {
      observabilityState.regenerations++;
    }

    // Verified business context for prompt
    const verifiedBusinessContext = `${business.businessName} (${business.category}${business.subcategory ? `, ${business.subcategory}` : ''}${business.city ? `, in ${business.city}` : ''})`;

    // 5. Connect to Gemini AI
    let ai: GoogleGenAI;
    try {
      ai = this.getClient();
    } catch (clientErr: any) {
      observabilityState.failedGenerations++;
      observabilityState.lastFailedRequestAt = new Date().toISOString();
      observabilityState.lastErrorMessage = clientErr.message;
      throw clientErr;
    }

    const candidateModels = [
      AI_CONFIG.MODEL,
      ...AI_CONFIG.FALLBACK_MODELS.filter(m => m !== AI_CONFIG.MODEL)
    ];

    // 6. Generation & Retry Loop (Section 20 & 21)
    let candidateText = '';
    let candidateModel = AI_CONFIG.MODEL;
    let retryAttempt = 0;
    let lastSimilarityCheck: {
      passed: boolean;
      checkedAgainstCount: number;
      maxOverlap: number;
      reason?: string;
    } = {
      passed: true,
      checkedAgainstCount: previousDrafts.length,
      maxOverlap: 0
    };
    let lastError: Error | null = null;

    // Up to 3 internal retries (4 total attempts)
    for (let attempt = 0; attempt <= AI_CONFIG.MAX_RETRIES; attempt++) {
      const isRetry = attempt > 0;
      if (isRetry) {
        retryAttempt = attempt;
      }

      const currentModel = candidateModels[attempt % candidateModels.length];
      const temperature = Math.min(1.0, AI_CONFIG.BASE_TEMPERATURE + (attempt * 0.05));

      const dynamicPrompt = buildDynamicPrompt({
        customerText: cleanCustomerText,
        selectedTopics: topics,
        language: currentLang,
        verifiedBusinessContext,
        previousReviews: previousDrafts,
        generationNumber,
        requestId,
        isRetry
      });

      try {
        console.log(`[ReviewFlow AI] Calling Gemini (attempt ${attempt + 1}/${AI_CONFIG.MAX_RETRIES + 1}, model: ${currentModel}, reqId: ${requestId})`);

        const response = await ai.models.generateContent({
          model: currentModel,
          contents: dynamicPrompt,
          config: {
            systemInstruction: REVIEWFLOW_MASTER_SYSTEM_PROMPT,
            temperature,
            maxOutputTokens: AI_CONFIG.MAX_OUTPUT_TOKENS
          }
        });

        const rawText = response.text?.trim() || '';
        if (!rawText || rawText.length < 3) {
          throw new Error('Empty response received from Gemini.');
        }

        // Section 17 & 18: Exact & Near-duplicate checks BEFORE accepting
        const similarity = isRepetitiveGeneration(rawText, previousDrafts);
        if (similarity.repetitive) {
          console.warn(
            `[ReviewFlow AI] Candidate rejected due to repetition (${similarity.reason}). Triggering Gemini retry ${attempt + 1}/${AI_CONFIG.MAX_RETRIES}`
          );
          lastSimilarityCheck = {
            passed: false,
            checkedAgainstCount: previousDrafts.length,
            maxOverlap: similarity.maxOverlap,
            reason: similarity.reason
          };
          continue; // retry Gemini with variation instruction
        }

        // Passed similarity check!
        candidateText = rawText;
        candidateModel = currentModel;
        lastSimilarityCheck = {
          passed: true,
          checkedAgainstCount: previousDrafts.length,
          maxOverlap: similarity.maxOverlap
        };
        break; // Successfully got unique candidate
      } catch (geminiErr: any) {
        lastError = geminiErr;
        console.error(`[ReviewFlow AI] Gemini attempt ${attempt + 1} failed:`, geminiErr.message);
        if (attempt < AI_CONFIG.MAX_RETRIES) {
          await new Promise(r => setTimeout(r, 200 * (attempt + 1)));
        }
      }
    }

    // 7. CRITICAL: NO FALLBACK REVIEW (Section 13 & 38)
    // If Gemini fails or all candidates are rejected, return a REAL error
    // Never show a static review, sample review, or template array
    if (!candidateText) {
      observabilityState.failedGenerations++;
      observabilityState.lastFailedRequestAt = new Date().toISOString();
      observabilityState.lastErrorMessage = lastError ? lastError.message : 'Candidate rejected due to high similarity across all retries.';

      console.error('[ReviewFlow AI] Generation failed. Refusing to use fallback per production safety rules.', {
        requestId,
        businessId: business.id,
        retryAttempt,
        error: observabilityState.lastErrorMessage
      });

      throw new Error('Unable to generate a new review right now Please try again');
    }

    // 8. Section 23: Strict Punctuation Sanitization
    // Final output contains words and spaces only. No periods, commas, exclamation marks, etc.
    const finalReviewText = sanitizeReviewText(candidateText);
    const finalWordCount = countWords(finalReviewText);

    if (finalWordCount < 1) {
      observabilityState.failedGenerations++;
      throw new Error('Unable to generate a new review right now Please try again');
    }

    // Secondary uniqueness check on sanitized text against previous drafts
    const sanitizedRepetition = isRepetitiveGeneration(finalReviewText, previousDrafts);
    if (sanitizedRepetition.repetitive && previousDrafts.length > 0) {
      // In extreme edge case where punctuation stripping caused exact collision, record rejection
      lastSimilarityCheck = {
        passed: false,
        checkedAgainstCount: previousDrafts.length,
        maxOverlap: sanitizedRepetition.maxOverlap,
        reason: sanitizedRepetition.reason
      };
    }

    const latencyMs = Date.now() - startTime;

    // 9. Section 11: Database Storage
    // Store every generated review separately in review_generations collection
    const generationRecord: ReviewFlowReviewGeneration = reviewFlowStore.recordReviewGeneration({
      id: generationId,
      generationId,
      requestId,
      sessionId: session.id,
      businessId: business.id,
      generationNumber,
      language: currentLang,
      selectedTopics: topics,
      customerText: cleanCustomerText,
      generatedText: finalReviewText,
      model: candidateModel,
      wordCount: finalWordCount,
      status: 'SUCCESS',
      latencyMs,
      similarityCheck: lastSimilarityCheck,
      retryCount: retryAttempt
    });

    // 10. Update Observability Telemetry
    observabilityState.successfulGenerations++;
    observabilityState.totalLatencyMs += latencyMs;
    observabilityState.creditsConsumed++;
    observabilityState.lastSuccessfulRequestAt = new Date().toISOString();

    reviewFlowStore.recordAiUsage({
      businessId: business.id,
      subscriptionId: business.subscriptionId,
      sessionId: session.id,
      generationType: generationNumber > 1 ? 'regenerate' : 'generate',
      inputTokens: Math.max(50, finalWordCount * 4),
      outputTokens: Math.max(20, finalWordCount * 2),
      aiModel: candidateModel,
      aiProvider: 'GEMINI',
      estimatedCost: 0.05,
      latencyMs,
      status: 'SUCCESS'
    });

    // 11. Backend diagnostic log (Section 29)
    console.log('[ReviewFlow AI] Generation completed successfully:', {
      requestId,
      generationId: generationRecord.id,
      businessId: business.id,
      model: candidateModel,
      generationNumber,
      retryAttempt,
      latencyMs,
      wordCount: finalWordCount,
      status: 'SUCCESS'
    });

    return {
      draft: finalReviewText,
      generationId: generationRecord.id,
      requestId,
      sessionId: session.id,
      generationNumber,
      wordCount: finalWordCount,
      model: candidateModel,
      language: currentLang,
      businessId: business.id,
      businessName: business.businessName,
      retryCount: retryAttempt,
      latencyMs
    };
  }
}

export const aiReviewEngine = new AiReviewEngine();
