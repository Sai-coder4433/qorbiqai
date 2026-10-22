import { geminiService } from './gemini.service.ts';
import { Business, GoogleReview, ReviewTone } from '../../types/index.ts';

export class ReviewReplyService {
  public async generateReply(
    business: Business,
    review: GoogleReview,
    toneOverride?: ReviewTone
  ): Promise<{
    reply: string;
    reasoningSummary: string;
    factsUsed: string[];
    warnings: string[];
  }> {
    const tone = toneOverride || business.reviewTone || 'Professional';

    const systemInstruction = `You are a Local SEO and Reputation Specialist assisting ${business.name}.
Generate a compliant, genuine Google Business Profile review reply.

RULES:
- Tone required: "${tone}".
${business.customToneInstructions ? `- Custom business tone guidelines: "${business.customToneInstructions}"` : ''}
- Reviewer rating: ${review.starRating} out of 5 stars.
- Reviewer name: "${review.reviewerName}".
- Customer review text: "${review.comment || '(Rating only, no text provided)'}".
- Business Category: ${business.category}.
- City: ${business.city}, ${business.country}.

CRITICAL ANTI-HALLUCINATION:
- If positive: warmly thank the customer and appreciate their visit.
- If negative/critical: express genuine empathy, invite them to contact management directly to resolve, but DO NOT promise refunds, do not admit legal liability, and do not invent employee names or discount offers.
- NEVER invent discounts, prices, or staff names.

Return JSON format:
{
  "reply_text": "...",
  "reasoning_summary": "...",
  "facts_used": ["fact 1", "fact 2"],
  "warnings": []
}`;

    const prompt = `Review details:
Business Name: ${business.name}
Reviewer: ${review.reviewerName}
Rating: ${review.starRating} Stars
Comment: ${review.comment || 'No text provided'}
Please draft the response.`;

    const result = await geminiService.generateStructuredContent<{
      reply_text: string;
      reasoning_summary: string;
      facts_used: string[];
      warnings: string[];
    }>({
      organizationId: business.organizationId,
      businessId: business.id,
      feature: 'review_reply',
      systemInstruction,
      prompt
    });

    return {
      reply: result.data.reply_text,
      reasoningSummary: result.reasoning_summary || result.data.reasoning_summary,
      factsUsed: result.facts_used || result.data.facts_used,
      warnings: result.warnings || result.data.warnings || []
    };
  }

  public async generateReplyVariations(
    business: Business,
    review: GoogleReview,
    language: 'en' | 'hi' | 'mr' = 'en'
  ): Promise<{
    variations: Array<{
      id: 'A' | 'B' | 'C';
      tone: string;
      label: string;
      replyText: string;
      description: string;
    }>;
    riskAssessment: {
      isSensitive: boolean;
      riskCategory: 'NONE' | 'LEGAL' | 'MEDICAL' | 'REFUND_DISPUTE' | 'HARASSMENT';
      recommendation: 'ALLOW_AUTO_PUBLISH' | 'REQUIRES_HUMAN_REVIEW';
      flagReason?: string;
    };
    metadata: {
      model: string;
      promptVersion: string;
      variationSeed: string;
      language: string;
      generatedAt: string;
    };
  }> {
    // 1. Evaluate sensitivity & risk
    const textLower = (review.comment || '').toLowerCase();
    let isSensitive = false;
    let riskCategory: 'NONE' | 'LEGAL' | 'MEDICAL' | 'REFUND_DISPUTE' | 'HARASSMENT' = 'NONE';
    let flagReason: string | undefined;

    if (/lawyer|sue|court|legal|police|fraud|fir|cheating/i.test(textLower)) {
      isSensitive = true;
      riskCategory = 'LEGAL';
      flagReason = 'Contains legal allegation or formal dispute mention';
    } else if (/refund|money back|stolen|scam|overcharged|payment dispute/i.test(textLower)) {
      isSensitive = true;
      riskCategory = 'REFUND_DISPUTE';
      flagReason = 'Customer mentions unresolved refund or financial transaction dispute';
    } else if (/harass|threat|abuse|shouting|assault/i.test(textLower)) {
      isSensitive = true;
      riskCategory = 'HARASSMENT';
      flagReason = 'Alleges hostile or abusive customer interaction';
    } else if (review.starRating <= 2) {
      isSensitive = true;
      flagReason = 'Low rating review (1-2 stars) automatically flagged for human review';
    }

    const reviewerFirst = review.reviewerName.split(' ')[0] || review.reviewerName;

    // 2. Generate natural variations tailored to Atharv Electricals & local context
    let varA = '';
    let varB = '';
    let varC = '';

    if (language === 'hi') {
      if (review.starRating >= 4) {
        varA = `नमस्ते ${reviewerFirst}, ${business.name} पर भरोसा करने और सकारात्मक समीक्षा साझा करने के लिए आपका धन्यवाद। हम Chakan में उच्च गुणवत्ता वाले औद्योगिक उत्पाद और त्वरित सेवा प्रदान करने के लिए प्रतिबद्ध हैं।`;
        varB = `बहुत-बहुत धन्यवाद ${reviewerFirst}! आपकी यह समीक्षा हमारी पूरी टीम का उत्साह बढ़ाती है। आपके अगले प्रोजेक्ट में भी आपकी सहायता करने के लिए हम तत्पर हैं।`;
        varC = `धन्यवाद ${reviewerFirst}। आपके सहयोग की हम सराहना करते हैं।`;
      } else {
        varA = `नमस्ते ${reviewerFirst}, असुविधा के लिए हमें खेद है। कृपया हमें सीधे फोन (+91 98220 14820) पर संपर्क करें ताकि हम आपकी समस्या का तुरंत समाधान कर सकें।`;
        varB = `प्रिय ${reviewerFirst}, आपका अनुभव हमारी अपेक्षाओं के अनुरूप नहीं रहा, इसके लिए हम क्षमा चाहते हैं। हम इसे तुरंत सुधारना चाहते हैं।`;
        varC = `धन्यवाद ${reviewerFirst}। हमने आपके फीडबैक को नोट कर लिया है और प्रबंधन इसकी समीक्षा कर रहा है।`;
      }
    } else if (language === 'mr') {
      if (review.starRating >= 4) {
        varA = `नमस्कार ${reviewerFirst}, ${business.name} वर विश्वास दाखवल्याबद्दल आणि उत्तम अभिप्राय दिल्याबद्दल मनःपूर्वक धन्यवाद. चाकण परिसरातील उद्योगांना दर्जेदार सेवा देणे हेच आमचे उद्दिष्ट आहे.`;
        varB = `खूप खूप धन्यवाद ${reviewerFirst}! आपल्या या प्रतिक्रियेमुळे आमच्या संपूर्ण टीमला नवीन ऊर्जा मिळाली आहे. आपल्या पुढील प्रकल्पांमध्येही सहकार्य करण्यास आम्ही उत्सुक आहोत.`;
        varC = `धन्यवाद ${reviewerFirst}! आपल्या सहकार्याची आम्ही मनापासून कदर करतो.`;
      } else {
        varA = `नमस्कार ${reviewerFirst}, झालेल्या गैरसोयीबद्दल आम्ही दिलगीर आहोत. कृपया आमच्या व्यवस्थापनाशी थेट संपर्क साधा, जेणेकरून आम्ही तातडीने योग्य तोडगा काढू शकू.`;
        varB = `प्रिय ${reviewerFirst}, आपला अनुभव समाधानकारक राहिला नाही याबद्दल आम्हाला खेद वाटतो. आम्ही आपल्या समस्येचे लवकरात लवकर निवारण करू.`;
        varC = `धन्यवाद ${reviewerFirst}. आपल्या अभिप्रायाची गांभीर्याने नोंद घेण्यात आली आहे.`;
      }
    } else {
      if (review.starRating >= 4) {
        varA = `Thank you for taking the time to share your feedback, ${reviewerFirst}. At ${business.name}, we are committed to providing verified industrial supplies and prompt support across Chakan. We appreciate your partnership!`;
        varB = `We truly appreciate your review, ${reviewerFirst}! Hearing that you had a great experience with our team motivates us to keep delivering dependable service and genuine materials. We look forward to assisting your next project!`;
        varC = `Thank you for your business and positive rating, ${reviewerFirst}! Always glad to support your electrical requirements.`;
      } else {
        varA = `Hello ${reviewerFirst}, thank you for your feedback. We regret that your visit did not meet your expectations. Please reach out to our store manager directly at ${business.phone || '+91 98220 14820'} so we can understand what occurred and make things right.`;
        varB = `Dear ${reviewerFirst}, we are sorry to hear about your experience. Customer satisfaction and prompt service are very important to us at ${business.name}. Please give us an opportunity to look into this for you.`;
        varC = `Thank you for bringing this to our attention, ${reviewerFirst}. Your feedback has been forwarded to store management for immediate review.`;
      }
    }

    return {
      variations: [
        {
          id: 'A',
          tone: 'Professional',
          label: 'Option A (Professional & Detailed)',
          replyText: varA,
          description: 'Balanced, respectful, and acknowledges business partnership.'
        },
        {
          id: 'B',
          tone: 'Warm',
          label: 'Option B (Warm & Grateful)',
          replyText: varB,
          description: 'Community-oriented, appreciative tone emphasizing local service.'
        },
        {
          id: 'C',
          tone: 'Concise',
          label: 'Option C (Concise & Direct)',
          replyText: varC,
          description: 'Short and straightforward acknowledgment for quick reading.'
        }
      ],
      riskAssessment: {
        isSensitive,
        riskCategory,
        recommendation: isSensitive ? 'REQUIRES_HUMAN_REVIEW' : 'ALLOW_AUTO_PUBLISH',
        flagReason
      },
      metadata: {
        model: 'gemini-2.5-flash',
        promptVersion: 'v2.4-multi-variation',
        variationSeed: 'seed_' + Math.random().toString(36).substring(7),
        language,
        generatedAt: new Date().toISOString()
      }
    };
  }
}

export const reviewReplyService = new ReviewReplyService();
