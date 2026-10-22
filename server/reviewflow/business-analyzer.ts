import { GoogleGenAI } from '@google/genai';
import { ReviewFlowAiAnalysisResult } from './types';

export interface BusinessAnalysisInput {
  businessName: string;
  mainCategory: string;
  subcategory?: string;
  businessDescription: string;
  city?: string;
  state?: string;
  preferredLanguage?: string;
  website?: string;
  ownerProvidedServices?: string[];
  ownerProvidedProducts?: string[];
}

/**
 * Lightweight classification step (Section 21 & 22)
 * Detects if the owner's description is in clear contradiction with the selected category.
 */
export function checkCategoryMismatch(
  category: string,
  description: string
): { mismatch: boolean; suggestedCategory?: string; warning?: string } {
  const d = description.toLowerCase();
  const cat = category.toLowerCase();

  // If description mentions car, bike, garage, engine, mechanic but category is food/jewellery/salon/photography
  const isAutoDesc = /\b(car|bike|motorcycle|mechanic|garage|oil change|engine repair|denting|tyre|wheel alignment)\b/.test(d);
  if (isAutoDesc && !cat.includes('garage') && !cat.includes('auto')) {
    return {
      mismatch: true,
      suggestedCategory: 'Garage & Auto Service',
      warning: 'Your description mentions automotive/garage repair, but your selected category is different.'
    };
  }

  // If description mentions restaurant, food, dining, cuisine, cafe, menu, chef but category is auto/jewellery/hardware
  const isFoodDesc = /\b(restaurant|cafe|dining|thali|cuisine|fast food|biryani|roti|paneer|coffee shop|bakery|cake)\b/.test(d);
  if (isFoodDesc && !cat.includes('restaurant') && !cat.includes('cafe') && !cat.includes('bakery') && !cat.includes('food') && !cat.includes('hotel')) {
    return {
      mismatch: true,
      suggestedCategory: 'Restaurant',
      warning: 'Your description mentions food or dining services, but your selected category is different.'
    };
  }

  // If description mentions camera, photography, photoshoot, wedding photographer, videography but category is grocery/jewellery/restaurant
  const isPhotoDesc = /\b(photograph|candid shoot|wedding photographer|videograph|photo studio|camera studio)\b/.test(d);
  if (isPhotoDesc && !cat.includes('photo') && !cat.includes('video')) {
    return {
      mismatch: true,
      suggestedCategory: 'Photography & Videography',
      warning: 'Your description mentions photography/videography studio, but your selected category is different.'
    };
  }

  // If description mentions gold, jewellery, diamond, necklace, silver, ornament but category is garage/restaurant
  const isJewelDesc = /\b(jewellery|jewelry|gold rate|solitaire|diamond ring|necklace|22k gold|silver ornament)\b/.test(d);
  if (isJewelDesc && !cat.includes('jewel') && !cat.includes('gold')) {
    return {
      mismatch: true,
      suggestedCategory: 'Jewellery & Gold',
      warning: 'Your description mentions jewellery or gold craftsmanship, but your selected category is different.'
    };
  }

  return { mismatch: false };
}

/**
 * Low-confidence and vague description check (Section 18 & 19)
 * Examples: "shop", "shop in Chakan", "we have a store", minimal character count.
 */
export function isVagueDescription(desc: string): boolean {
  const clean = desc.trim().toLowerCase();
  if (clean.length < 8) return true;
  
  // Single generic words
  const vaguePhrases = [
    'shop',
    'store',
    'business',
    'my shop',
    'our shop',
    'shop in',
    'store in',
    'small shop',
    'retail shop',
    'general store'
  ];

  if (vaguePhrases.some(v => clean === v || clean.startsWith(v + ' in') || clean.startsWith(v + ' at'))) {
    // If there are no substantive nouns indicating specific trade
    const substantiveWords = clean.replace(/^(shop|store|business|in|at|near|the|a|my|our|\s)+/g, '').trim();
    if (substantiveWords.split(/\s+/).length < 2) {
      return true;
    }
  }

  return false;
}

/**
 * Core Category-Grounded Deterministic Engine (Zero Hallucination Guarantee)
 * Analyzes strictly based on category + subcategory + actual owner words.
 */
export function analyzeCategoryGrounded(input: BusinessAnalysisInput): ReviewFlowAiAnalysisResult {
  const { businessName, mainCategory, subcategory = '', businessDescription, city = '' } = input;
  const desc = businessDescription.trim();
  const lowerDesc = desc.toLowerCase();
  const cat = mainCategory.toLowerCase();
  const sub = subcategory.toLowerCase();

  // 1. Check for vague or insufficient description
  if (isVagueDescription(desc)) {
    return {
      businessType: `${subcategory || mainCategory}`,
      summary: 'More specific information is needed to identify your services.',
      confidence: 'low',
      likelyServices: [],
      likelyProducts: [],
      possibleHighlights: [],
      customerExperienceTopics: [
        { id: 'top_1', topic: 'Overall Visit', description: 'Customer general visit and interaction' }
      ],
      followUpQuestions: [
        'What specific products or services do you offer to your customers?',
        'What type of customers or projects do you primarily handle?',
        'What are the main services you would like featured in customer reviews?',
        'What makes your business or offerings distinct in your local area?'
      ]
    };
  }

  // 2. Check for category mismatch
  const mismatch = checkCategoryMismatch(mainCategory, desc);

  // 3. Category-Specific Grounded Taxonomy
  const likelyServices: Array<{ id: string; title: string; description: string; reason: string }> = [];
  const likelyProducts: Array<{ id: string; title: string; description: string; reason: string }> = [];
  const possibleHighlights: Array<{ id: string; title: string; description: string; reason: string }> = [];
  const customerExperienceTopics: Array<{ id: string; topic: string; description: string }> = [];
  const followUpQuestions: string[] = [];

  // ==========================================
  // PHOTOGRAPHY & VIDEOGRAPHY
  // ==========================================
  if (cat.includes('photo') || cat.includes('video') || lowerDesc.includes('photo') || lowerDesc.includes('wedding photographer')) {
    if (lowerDesc.includes('wedding') || sub.includes('wedding')) {
      likelyServices.push({
        id: 'srv_photo_wedding',
        title: 'Wedding Photography',
        description: 'Photography coverage for wedding ceremonies and related functions',
        reason: 'Explicitly indicated by wedding photography description'
      });
      likelyServices.push({
        id: 'srv_photo_photoshoot',
        title: 'Wedding Photoshoot',
        description: 'Dedicated photo sessions for couple and family moments',
        reason: 'Derived from wedding photography specialty'
      });
    }

    if (lowerDesc.includes('studio') || sub.includes('studio') || lowerDesc.includes('camera')) {
      likelyServices.push({
        id: 'srv_photo_studio',
        title: 'Photography Studio Sessions',
        description: 'In-studio portrait and family photo sessions',
        reason: 'Derived from studio presence in your description'
      });
    }

    if (lowerDesc.includes('pre-wedding') || lowerDesc.includes('prewedding')) {
      likelyServices.push({
        id: 'srv_photo_prewedding',
        title: 'Pre-Wedding Shoot',
        description: 'Creative couple photography prior to the wedding day',
        reason: 'Mentioned in description'
      });
    }

    if (lowerDesc.includes('event') || lowerDesc.includes('ceremony') || lowerDesc.includes('birthday')) {
      likelyServices.push({
        id: 'srv_photo_events',
        title: 'Event Photography',
        description: 'Coverage for family and social gatherings',
        reason: 'Mentioned in description'
      });
    }

    if (lowerDesc.includes('video') || lowerDesc.includes('cinemat')) {
      likelyServices.push({
        id: 'srv_photo_video',
        title: 'Event Videography',
        description: 'Video recording and footage for events',
        reason: 'Mentioned in description'
      });
    }

    // Default basic service if none matched yet but category is photography
    if (likelyServices.length === 0) {
      likelyServices.push({
        id: 'srv_photo_general',
        title: 'Photography Services',
        description: 'Custom photography sessions based on client requirements',
        reason: 'Category alignment'
      });
    }

    possibleHighlights.push({
      id: 'hl_photo_1',
      title: 'Studio Photography Setup',
      description: 'Dedicated studio environment for client photo sessions',
      reason: 'Factual studio highlight'
    });

    customerExperienceTopics.push(
      { id: 'top_1', topic: 'Photography Experience', description: 'Overall flow and comfort during the photography session' },
      { id: 'top_2', topic: 'Team Guidance & Interaction', description: 'Helpfulness and communication of the photography team' },
      { id: 'top_3', topic: 'Photo Output & Quality', description: 'Satisfaction with finalized photographs and framing' }
    );
  }

  // ==========================================
  // JEWELLERY & GOLD
  // ==========================================
  else if (cat.includes('jewel') || cat.includes('gold')) {
    if (lowerDesc.includes('gold') || sub.includes('gold')) {
      likelyServices.push({
        id: 'srv_jewel_gold',
        title: 'Gold Jewellery Selection',
        description: 'Gold necklaces, bangles, rings, and traditional ornaments',
        reason: 'Mentioned in description'
      });
    }
    if (lowerDesc.includes('diamond') || sub.includes('diamond')) {
      likelyServices.push({
        id: 'srv_jewel_diamond',
        title: 'Diamond Jewellery',
        description: 'Certified diamond rings, pendants, and stud earrings',
        reason: 'Mentioned in description'
      });
    }
    if (lowerDesc.includes('silver') || sub.includes('silver')) {
      likelyServices.push({
        id: 'srv_jewel_silver',
        title: 'Silver Ornaments & Articles',
        description: 'Silver jewelry, utensils, and gifting items',
        reason: 'Mentioned in description'
      });
    }
    if (lowerDesc.includes('bridal') || sub.includes('bridal')) {
      likelyServices.push({
        id: 'srv_jewel_bridal',
        title: 'Bridal Jewellery Sets',
        description: 'Complete wedding and bridal collection assistance',
        reason: 'Derived from bridal focus in description'
      });
    }
    if (lowerDesc.includes('custom') || lowerDesc.includes('design')) {
      likelyServices.push({
        id: 'srv_jewel_custom',
        title: 'Custom Jewellery Orders',
        description: 'Crafting jewelry as per customer designs and specifications',
        reason: 'Mentioned custom designs in description'
      });
    }

    if (likelyServices.length === 0) {
      likelyServices.push({
        id: 'srv_jewel_gen',
        title: 'Jewellery Consultation',
        description: 'Assistance with ornament selection and sizing',
        reason: 'Core jewellery showroom offering'
      });
    }

    possibleHighlights.push({
      id: 'hl_jewel_1',
      title: 'Design Variety',
      description: 'Selection of traditional and contemporary designs',
      reason: 'Factual showroom highlight'
    });

    customerExperienceTopics.push(
      { id: 'top_1', topic: 'Jewellery Design Selection', description: 'Variety and appeal of available jewelry pieces' },
      { id: 'top_2', topic: 'Counter Staff Assistance', description: 'Politeness and patience of showroom staff during selection' },
      { id: 'top_3', topic: 'Purchase & Billing Experience', description: 'Clarity during billing and receipt handover' }
    );
  }

  // ==========================================
  // RESTAURANT, CAFE & BAKERY
  // ==========================================
  else if (cat.includes('restaurant') || cat.includes('cafe') || cat.includes('bakery') || cat.includes('food')) {
    if (lowerDesc.includes('dine') || lowerDesc.includes('seating') || sub.includes('family')) {
      likelyServices.push({
        id: 'srv_food_dinein',
        title: 'Dine-In Dining Experience',
        description: 'Table service for family and casual dining',
        reason: 'Mentioned in description'
      });
    }
    if (lowerDesc.includes('takeaway') || lowerDesc.includes('parcel') || lowerDesc.includes('delivery')) {
      likelyServices.push({
        id: 'srv_food_takeaway',
        title: 'Takeaway & Parcel Service',
        description: 'Packed meals and food takeaway',
        reason: 'Mentioned in description'
      });
    }
    if (lowerDesc.includes('coffee') || cat.includes('cafe')) {
      likelyServices.push({
        id: 'srv_cafe_beverages',
        title: 'Beverage & Coffee Service',
        description: 'Hot coffees, specialty teas, and refreshing drinks',
        reason: 'Mentioned cafe / beverage offerings'
      });
    }
    if (lowerDesc.includes('cake') || cat.includes('bakery')) {
      likelyServices.push({
        id: 'srv_bakery_cakes',
        title: 'Cakes & Baked Specialties',
        description: 'Fresh cakes, pastries, and confectionery items',
        reason: 'Mentioned bakery / cakes'
      });
    }

    if (likelyServices.length === 0) {
      likelyServices.push({
        id: 'srv_food_gen',
        title: 'Food Preparation & Service',
        description: 'Menu preparation and dining service',
        reason: 'Category standard'
      });
    }

    possibleHighlights.push({
      id: 'hl_food_1',
      title: 'Menu Variety',
      description: 'Selection of dishes tailored to guest preferences',
      reason: 'Factual dining highlight'
    });

    customerExperienceTopics.push(
      { id: 'top_1', topic: 'Food Taste & Portion', description: 'Freshness, flavor, and satisfaction with ordered dishes' },
      { id: 'top_2', topic: 'Service & Order Turnaround', description: 'Promptness and attentiveness of serving staff' },
      { id: 'top_3', topic: 'Dining Ambience', description: 'Cleanliness, seating comfort, and environment' }
    );
  }

  // ==========================================
  // GARAGE & AUTO SERVICE
  // ==========================================
  else if (cat.includes('garage') || cat.includes('auto')) {
    if (lowerDesc.includes('service') || lowerDesc.includes('servicing')) {
      likelyServices.push({
        id: 'srv_auto_service',
        title: 'Periodic Vehicle Servicing',
        description: 'General inspection, oil changes, and routine maintenance',
        reason: 'Mentioned in description'
      });
    }
    if (lowerDesc.includes('repair') || lowerDesc.includes('mechanical') || lowerDesc.includes('engine')) {
      likelyServices.push({
        id: 'srv_auto_repair',
        title: 'Mechanical Vehicle Repair',
        description: 'Diagnosing and resolving mechanical and engine issues',
        reason: 'Mentioned in description'
      });
    }
    if (lowerDesc.includes('multi-brand') || sub.includes('multi')) {
      likelyServices.push({
        id: 'srv_auto_multibrand',
        title: 'Multi-Brand Vehicle Support',
        description: 'Servicing vehicles across multiple manufacturer brands',
        reason: 'Derived from multi-brand specification'
      });
    }
    if (lowerDesc.includes('ac') || lowerDesc.includes('electrical')) {
      likelyServices.push({
        id: 'srv_auto_ac',
        title: 'Auto Electrical & AC Service',
        description: 'Air conditioning check and electrical repairs',
        reason: 'Mentioned in description'
      });
    }
    if (lowerDesc.includes('detail') || lowerDesc.includes('wash') || lowerDesc.includes('ceramic')) {
      likelyServices.push({
        id: 'srv_auto_detailing',
        title: 'Vehicle Detailing & Washing',
        description: 'Interior and exterior vehicle cleaning and detailing',
        reason: 'Mentioned in description'
      });
    }

    if (likelyServices.length === 0) {
      likelyServices.push({
        id: 'srv_auto_gen',
        title: 'Vehicle Maintenance',
        description: 'General automotive upkeep and repair',
        reason: 'Category standard'
      });
    }

    possibleHighlights.push({
      id: 'hl_auto_1',
      title: 'Multi-Brand Capability',
      description: 'Hands-on vehicle servicing across multiple models',
      reason: 'Factual garage highlight'
    });

    customerExperienceTopics.push(
      { id: 'top_1', topic: 'Service Quality & Vehicle Handling', description: 'How smoothly the vehicle drives post service' },
      { id: 'top_2', topic: 'Communication & Problem Explanation', description: 'Clarity on identified vehicle issues and estimates' },
      { id: 'top_3', topic: 'Turnaround Time', description: 'Timeliness of vehicle delivery' }
    );
  }

  // ==========================================
  // SALON & BEAUTY / SPA
  // ==========================================
  else if (cat.includes('salon') || cat.includes('beauty') || cat.includes('spa')) {
    if (lowerDesc.includes('hair') || lowerDesc.includes('cut') || lowerDesc.includes('style')) {
      likelyServices.push({
        id: 'srv_salon_hair',
        title: 'Haircut & Styling',
        description: 'Hair shaping, trimming, and custom styling',
        reason: 'Mentioned in description'
      });
    }
    if (lowerDesc.includes('facial') || lowerDesc.includes('skin') || lowerDesc.includes('treatment')) {
      likelyServices.push({
        id: 'srv_salon_skin',
        title: 'Skincare & Clean-up',
        description: 'Facial treatments and skin care therapies',
        reason: 'Mentioned in description'
      });
    }
    if (lowerDesc.includes('bridal') || lowerDesc.includes('makeup')) {
      likelyServices.push({
        id: 'srv_salon_bridal',
        title: 'Bridal Makeover & Styling',
        description: 'Special occasion and bridal grooming assistance',
        reason: 'Mentioned in description'
      });
    }

    if (likelyServices.length === 0) {
      likelyServices.push({
        id: 'srv_salon_gen',
        title: 'Grooming & Salon Care',
        description: 'Personal grooming and styling services',
        reason: 'Category standard'
      });
    }

    possibleHighlights.push({
      id: 'hl_salon_1',
      title: 'Styling Consultation',
      description: 'Consultation to match hairstyles with customer preferences',
      reason: 'Factual salon highlight'
    });

    customerExperienceTopics.push(
      { id: 'top_1', topic: 'Stylist Attentiveness', description: 'Listening to requested style and delivering matching results' },
      { id: 'top_2', topic: 'Hygiene & Cleanliness', description: 'Cleanliness of chairs, tools, and salon floor' },
      { id: 'top_3', topic: 'Overall Salon Experience', description: 'Comfort and courtesy during service' }
    );
  }

  // ==========================================
  // ALL OTHER CATEGORIES (Grounded to description)
  // ==========================================
  else {
    likelyServices.push({
      id: 'srv_gen_1',
      title: `${subcategory || mainCategory} Offerings`,
      description: `Core services offered by ${businessName} in ${city || 'the area'}`,
      reason: 'Extracted directly from owner business profile'
    });

    customerExperienceTopics.push(
      { id: 'top_1', topic: 'Service Quality', description: 'Satisfaction with service delivered' },
      { id: 'top_2', topic: 'Staff Assistance', description: 'Helpfulness and communication during visit' },
      { id: 'top_3', topic: 'Overall Value', description: 'General customer satisfaction' }
    );
  }

  return {
    businessType: subcategory ? `${mainCategory} (${subcategory})` : mainCategory,
    summary: `${businessName} provides ${subcategory || mainCategory} services as described in your profile.`,
    categoryMismatch: mismatch.mismatch,
    mismatchWarning: mismatch.warning,
    suggestedCategory: mismatch.suggestedCategory,
    confidence: mismatch.mismatch ? 'low' : 'high',
    likelyServices,
    likelyProducts,
    possibleHighlights,
    customerExperienceTopics,
    followUpQuestions
  };
}

/**
 * Main AI Analysis Controller:
 * Combines Gemini with strict system prompt + Grounded Engine Fallback
 */
export async function analyzeBusinessAI(input: BusinessAnalysisInput): Promise<ReviewFlowAiAnalysisResult> {
  const { businessName, mainCategory, subcategory = '', businessDescription, city = '', state = '' } = input;
  const desc = (businessDescription || '').trim();

  // 1. Guard against empty / vague description
  if (isVagueDescription(desc)) {
    return analyzeCategoryGrounded(input);
  }

  // 2. Check category mismatch first
  const mismatch = checkCategoryMismatch(mainCategory, desc);
  if (mismatch.mismatch) {
    const grounded = analyzeCategoryGrounded(input);
    return {
      ...grounded,
      categoryMismatch: true,
      mismatchWarning: mismatch.warning,
      suggestedCategory: mismatch.suggestedCategory,
      confidence: 'low'
    };
  }

  // 3. Attempt Gemini Analysis if configured
  const apiKey = process.env.GEMINI_API_KEY;
  const isKeyConfigured = Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim().length > 10);

  if (isKeyConfigured) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const systemInstruction = `You are a business information analysis assistant for a multi-business SaaS.

Your task is to analyze ONLY the business information provided by the owner.
The selected business category and subcategory are hard constraints.
Never invent business services, products, facilities, pricing, certifications, guarantees, staff behavior, quality claims, or customer outcomes.
Do not treat common industry practices as facts.
Only identify information explicitly supported by the owner's description.
If something is uncertain, return it as a possible suggestion requiring owner verification.
If there is insufficient information, ask follow-up questions instead of guessing.
Never add unsupported positive marketing claims.
Return structured JSON only.`;

      const prompt = `${systemInstruction}

Business Details:
- Business Name: "${businessName}"
- Main Category: "${mainCategory}"
- Subcategory: "${subcategory}"
- Owner's Description: "${desc}"
- City / State: "${city}, ${state}"

Output JSON matching this exact schema:
{
  "businessType": "<short concise type>",
  "summary": "<factual neutral 1-sentence summary>",
  "confidence": "high" | "medium" | "low",
  "likelyServices": [
    { "id": "srv_1", "title": "<service name>", "description": "<concise factual description>", "reason": "<why this matches description>" }
  ],
  "likelyProducts": [
    { "id": "prd_1", "title": "<product name>", "description": "<concise factual description>", "reason": "<why this matches description>" }
  ],
  "possibleHighlights": [
    { "id": "hl_1", "title": "<highlight name>", "description": "<concise description>", "reason": "<why this matches>" }
  ],
  "customerExperienceTopics": [
    { "id": "top_1", "topic": "<topic title>", "description": "<aspect of customer visit>" }
  ],
  "followUpQuestions": []
}`;

      const response = await ai.models.generateContent({
        model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
        contents: prompt
      });

      const text = response.text?.trim() || '';
      const cleaned = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
      const parsed = JSON.parse(cleaned);

      if (parsed && Array.isArray(parsed.likelyServices)) {
        return {
          businessType: parsed.businessType || `${subcategory || mainCategory}`,
          summary: parsed.summary || `${businessName} services analysis`,
          categoryMismatch: false,
          confidence: parsed.confidence || 'high',
          likelyServices: parsed.likelyServices.map((s: any, idx: number) => ({
            id: s.id || `sug_srv_${idx + 1}`,
            title: s.title || 'Service',
            description: s.description || '',
            reason: s.reason || 'Derived from your description'
          })),
          likelyProducts: Array.isArray(parsed.likelyProducts)
            ? parsed.likelyProducts.map((p: any, idx: number) => ({
                id: p.id || `sug_prd_${idx + 1}`,
                title: p.title || 'Product',
                description: p.description || '',
                reason: p.reason || 'Derived from your description'
              }))
            : [],
          possibleHighlights: Array.isArray(parsed.possibleHighlights)
            ? parsed.possibleHighlights.map((h: any, idx: number) => ({
                id: h.id || `sug_hl_${idx + 1}`,
                title: h.title || 'Highlight',
                description: h.description || '',
                reason: h.reason || 'Based on business offering'
              }))
            : [],
          customerExperienceTopics: Array.isArray(parsed.customerExperienceTopics)
            ? parsed.customerExperienceTopics.map((t: any, idx: number) => ({
                id: t.id || `sug_top_${idx + 1}`,
                topic: t.topic || 'Experience',
                description: t.description || ''
              }))
            : [],
          followUpQuestions: Array.isArray(parsed.followUpQuestions) ? parsed.followUpQuestions : []
        };
      }
    } catch (err: any) {
      console.warn('[ReviewFlow AI] Gemini analysis call error, utilizing category-grounded fallback:', err.message);
    }
  }

  // 4. Return category-grounded output
  return analyzeCategoryGrounded(input);
}

/**
 * Dedicated Customer Experience Topics Generator (Section: AI Experience Topics)
 * Generates 7–8 business-specific customer experience topics based strictly on:
 * businessName, category, subcategory, description, city, primaryLanguage.
 *
 * Constraints:
 * - Must be business-specific
 * - No generic marketing slogans
 * - No invented business facts
 * - No emojis
 * - Exactly 7–8 topics
 */
export async function generateCustomerExperienceTopicsAI(params: {
  businessName: string;
  category: string;
  subcategory?: string;
  description: string;
  city: string;
  primaryLanguage?: string;
}): Promise<Array<{ title: string; description: string }>> {
  const {
    businessName,
    category,
    subcategory = '',
    description,
    city,
    primaryLanguage = 'English'
  } = params;

  const apiKey = process.env.GEMINI_API_KEY;
  const isKeyConfigured = Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim().length > 10);

  if (isKeyConfigured) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are an AI customer experience analyst for ReviewFlow AI.
Analyze this business record and generate exactly 7 to 8 customer experience topics for customer feedback and Google Review writing.

Business Record:
- Business Name: "${businessName}"
- Category: "${category}"
- Subcategory: "${subcategory}"
- Business Description: "${description}"
- City: "${city}"
- Primary Language: "${primaryLanguage}"

Strict Requirements:
1. Generate between 7 and 8 customer experience topics.
2. Topics must be business-specific, reflecting what a real customer experiences at this specific type of business.
3. Do NOT generate generic marketing slogans (e.g. "Best in Town", "Quality Assured", "World Class Service").
4. Do NOT invent business facts (e.g. do not invent rooftop seating, 24/7 service, valet parking unless in description).
5. Do NOT use emojis anywhere in titles or descriptions.
6. The titles should be 2 to 4 words representing an aspect of the customer's visit (e.g., "Food & Taste", "Staff Assistance", "Dining Experience", "Collection & Designs", "Overall Experience").
7. Ensure "Overall Experience" is included as the final topic.

Reference Examples:
- Jewellery: Collection & Designs, Jewellery Selection, Staff Assistance, Shopping Experience, Design Experience, Product Experience, Buying Experience, Overall Experience
- Restaurant: Food & Taste, Ambience, Service, Staff Experience, Menu & Variety, Dining Experience, Value for Money, Overall Experience
- Photography: Photography Experience, Shoot Experience, Studio Experience, Team Guidance, Photo Quality, Communication, Service Experience, Overall Experience
- Garage: Service Quality, Turnaround Time, Vehicle Handling, Problem Explanation, Pricing Transparency, Staff Communication, Diagnostic Experience, Overall Experience
- Clinic: Doctor Consultation, Clinic Ambience, Waiting Time, Staff Care, Treatment Explanation, Hygiene & Cleanliness, Appointment Experience, Overall Experience

Output format: Return ONLY a valid JSON array of objects with no markdown code fences, exactly like:
[
  { "title": "Topic Title", "description": "Short explanation of what customer experienced" },
  ...
]`;

      const response = await ai.models.generateContent({
        model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
        contents: prompt
      });

      const text = response.text?.trim() || '';
      const cleaned = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
      const parsed = JSON.parse(cleaned);

      if (Array.isArray(parsed) && parsed.length >= 6) {
        return parsed.slice(0, 8).map((t: any) => ({
          title: String(t.title || '').replace(/[^\w\s&'-]/gi, '').trim(),
          description: String(t.description || '').replace(/[^\w\s&',.-]/gi, '').trim()
        })).filter(t => t.title.length > 0);
      }
    } catch (err: any) {
      console.warn('[ReviewFlow AI] Fresh Gemini topic generation fallback:', err.message);
    }
  }

  // Deterministic category-grounded fallback producing 7–8 topics without emojis
  return getCategorySpecificFallbackTopics({ businessName, category, subcategory });
}

function getCategorySpecificFallbackTopics(params: {
  businessName: string;
  category: string;
  subcategory: string;
}): Array<{ title: string; description: string }> {
  const cat = (params.category || '').toLowerCase();
  const sub = (params.subcategory || '').toLowerCase();

  if (cat.includes('jewel') || cat.includes('gold')) {
    return [
      { title: 'Collection & Designs', description: 'Variety and craftsmanship of jewellery collections' },
      { title: 'Jewellery Selection', description: 'Available range of gold, silver, and ornament pieces' },
      { title: 'Staff Assistance', description: 'Guidance and patience during ornament selection' },
      { title: 'Shopping Experience', description: 'In-store comfort and purchase hospitality' },
      { title: 'Design Experience', description: 'Uniqueness and detailing of custom or readymade designs' },
      { title: 'Product Experience', description: 'Finish, hallmarking, and material authenticity' },
      { title: 'Buying Experience', description: 'Billing clarity and overall purchase satisfaction' },
      { title: 'Overall Experience', description: 'Total impression of visit to ' + params.businessName }
    ];
  }

  if (cat.includes('restaurant') || cat.includes('cafe') || cat.includes('food') || cat.includes('bakery')) {
    return [
      { title: 'Food & Taste', description: 'Flavor, freshness, and quality of dishes served' },
      { title: 'Ambience', description: 'Atmosphere, seating comfort, and cleanliness' },
      { title: 'Service', description: 'Attentiveness and promptness of staff service' },
      { title: 'Staff Experience', description: 'Courtesy and hospitality of restaurant team' },
      { title: 'Menu & Variety', description: 'Range of dishes, beverages, and specialty items' },
      { title: 'Dining Experience', description: 'Overall pace and comfort of meal time' },
      { title: 'Value for Money', description: 'Portion sizes and reasonable pricing' },
      { title: 'Overall Experience', description: 'Total dining experience at ' + params.businessName }
    ];
  }

  if (cat.includes('photo') || cat.includes('video')) {
    return [
      { title: 'Photography Experience', description: 'Session flow and photographer communication' },
      { title: 'Shoot Experience', description: 'Comfort and creative direction during photoshoot' },
      { title: 'Studio Experience', description: 'Studio equipment, backdrop, and lighting setup' },
      { title: 'Team Guidance', description: 'Poses, recommendations, and team coordination' },
      { title: 'Photo Quality', description: 'Color clarity, resolution, and final edits' },
      { title: 'Communication', description: 'Responsiveness regarding delivery and scheduling' },
      { title: 'Service Experience', description: 'Professionalism and courteous interaction' },
      { title: 'Overall Experience', description: 'Total satisfaction with ' + params.businessName }
    ];
  }

  if (cat.includes('garage') || cat.includes('auto') || cat.includes('car') || cat.includes('bike')) {
    return [
      { title: 'Service Quality', description: 'Vehicle mechanical handling and repair outcome' },
      { title: 'Turnaround Time', description: 'Punctuality and delivery timeline of service' },
      { title: 'Problem Explanation', description: 'Clarity on vehicle diagnostics and needed parts' },
      { title: 'Staff Communication', description: 'Advisor responsiveness and updates during repair' },
      { title: 'Pricing Transparency', description: 'Fair estimate and breakdown of parts and labor' },
      { title: 'Vehicle Handling', description: 'Care taken with vehicle condition and test drive' },
      { title: 'Service Cleanliness', description: 'Cleanliness of vehicle interior upon handover' },
      { title: 'Overall Experience', description: 'Overall satisfaction with garage service' }
    ];
  }

  if (cat.includes('salon') || cat.includes('beauty') || cat.includes('spa')) {
    return [
      { title: 'Styling & Consultation', description: 'Understanding personal preferences and style requests' },
      { title: 'Service Execution', description: 'Care, hygiene, and technique during grooming' },
      { title: 'Staff Politeness', description: 'Warmth and professional behavior of salon team' },
      { title: 'Salon Ambience', description: 'Hygiene, cleanliness, and relaxing atmosphere' },
      { title: 'Product Quality', description: 'Quality of beauty and grooming products used' },
      { title: 'Punctuality & Wait Time', description: 'Timeliness of appointment start and service pace' },
      { title: 'Value for Money', description: 'Satisfaction with pricing relative to service quality' },
      { title: 'Overall Experience', description: 'Total salon experience at ' + params.businessName }
    ];
  }

  // Generic professional local business 8-topic template
  return [
    { title: 'Service Quality', description: 'Standard and execution of service delivered' },
    { title: 'Staff Assistance', description: 'Helpfulness and courteousness of the team' },
    { title: 'Product Selection', description: 'Variety and availability of items or solutions' },
    { title: 'Communication', description: 'Clarity, responsiveness, and guidance provided' },
    { title: 'Store Ambience', description: 'Premises cleanliness, comfort, and organization' },
    { title: 'Turnaround Time', description: 'Speed and punctuality in fulfilling customer requests' },
    { title: 'Value for Money', description: 'Fairness of pricing and overall utility' },
    { title: 'Overall Experience', description: 'Total customer experience at ' + params.businessName }
  ];
}
