import { auth } from './firebase.ts';

export interface BusinessCategoryInfo {
  id: string;
  name: string;
  icon: string;
  placeholderPrompt: string;
  topics: Array<{ id: string; label: string; text: string }>;
}

export interface BusinessData {
  id: string;
  ownerUid: string;
  businessName: string;
  category: string;
  mainCategory?: string;
  subcategory?: string;
  customCategory?: string;
  description?: string;
  country: string;
  state: string;
  city: string;
  preferredLanguage: string;
  primaryLanguage?: string; // alias for preferredLanguage
  email?: string;
  logoUrl?: string;
  website?: string;
  phone?: string;
  location?: string;
  categoryDetails: Record<string, any>;
  customFields?: Array<{ key: string; value: string }>;
  verifiedFacts?: Array<{
    id: string;
    businessId?: string;
    type: 'service' | 'product' | 'highlight' | 'trade_policy';
    title: string;
    description: string;
    source: 'owner' | 'ai';
    verified: boolean;
    createdAt?: string;
    updatedAt?: string;
  }>;
  googleReviewUrl: string;
  googleReviewVerified?: boolean;
  googleReviewStatus?: 'not_configured' | 'pending_verification' | 'owner_confirmed' | 'failed' | 'rejected' | 'unverified';
  googleReviewVerifiedAt?: string;
  googlePlaceName?: string;
  googleProfileConnected?: boolean;
  customerHeading?: string;
  welcomeMessage?: string;
  brandAccentColor?: string;
  supportedLanguages?: string[];
  tonePreference?: 'natural' | 'simple' | 'warm' | 'professional' | 'conversational';
  visitQuestions?: string[];
  experienceCards?: Array<{ id: string; icon?: string; title: string; placeholder?: string; enabled?: boolean; }>;
  onboardingStatus?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'REVIEW_URL_PENDING' | 'TOPICS_REVIEW' | 'QR_NFC_SETUP';
  onboardingCompleted: boolean;
  onboardingCompletedAt?: string;
  onboardingVersion?: string;
  businessProfileCompleted?: boolean;
  googleReviewConfigured?: boolean;
  aiTopicsGenerated?: boolean;
  nfcCardAssigned?: boolean;
  launchReady?: boolean;
  onboardingStep: number;
  status: 'active' | 'suspended';
  uniqueCode?: string;
  subscriptionId?: string;
  createdAt: string;
  updatedAt: string;
}


export interface ReviewFlowAiAnalysisResult {
  businessType: string;
  summary: string;
  categoryMismatch?: boolean;
  mismatchWarning?: string;
  suggestedCategory?: string;
  likelyServices: Array<{ id: string; title: string; description: string; reason?: string }>;
  likelyProducts: Array<{ id: string; title: string; description: string; reason?: string }>;
  possibleHighlights: Array<{ id: string; title: string; description: string; reason?: string }>;
  customerExperienceTopics: Array<{ id: string; topic: string; description: string }>;
  followUpQuestions: string[];
  isVague?: boolean;
  confidence: 'high' | 'medium' | 'low';
}

export interface NfcCardData {
  id: string;
  businessId: string;
  businessName?: string;
  ownerUid: string;
  uniqueCode: string;
  dynamicUrl: string;
  status: 'ACTIVE' | 'INACTIVE';
  totalTaps: number;
  lastTapAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QrCodeData {
  id: string;
  businessId: string;
  ownerUid: string;
  label: string;
  uniqueCode: string;
  destinationUrl: string;
  status: 'ACTIVE' | 'PAUSED';
  scanCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionData {
  id: string;
  ownerUid: string;
  businessId?: string; // isolated per-business subscription link
  planId: 'starter' | 'reviewflow_pro' | string;
  planName: string;
  status: 'active' | 'trialing' | 'expired' | 'suspended' | 'ACTIVE' | 'SUSPENDED';
  priceMonthly: number;
  currency: string;
  currentPeriodEnd: string;
  aiGenerationsUsedThisMonth: number;
  maxQrCodes: number;
  maxAiMonthly: number;
  maxBusinesses?: number;
  businessLimit?: number;
  nfcCardLimit?: number;
  paymentStatus?: 'paid' | 'test_paid' | 'pending';
  error?: string;
}

export interface PlanDefinition {
  id: string;
  name: string;
  priceMonthly: number;
  currency: string;
  description: string;
  tagline?: string;
  maxQrCodes: number;
  maxAiMonthly: number;
  maxBusinesses?: number;
  features: string[];
  badge?: string;
  launchReady?: boolean;
}

export interface AnalyticsData {
  totalScans: number;
  scansToday: number;
  scansThisWeek: number;
  scansThisMonth: number;
  activeQrCodes: number;
  totalQrCodes: number;
  eventsBreakdown: {
    qrScans: number;
    assistancePageViews: number;
    aiDraftsGenerated: number;
    reviewsCopied: number;
    googleReviewClicks: number;
  };
  chartData: Array<{ date: string; scans: number; aiDrafts?: number; googleClicks?: number }>;
  qrBreakdown: Array<{
    id: string;
    label: string;
    uniqueCode: string;
    status: 'ACTIVE' | 'PAUSED';
    scans?: number;
    totalScans?: number;
    aiDrafts?: number;
    googleClicks?: number;
  }>;
  recentActivity: Array<any>;
}

export interface CreditTransaction {
  id: string;
  clientId: string;
  businessId?: string;
  businessName?: string;
  type: 'PLAN_ALLOCATION' | 'PURCHASE' | 'REVIEW_GENERATION' | 'REVIEW_REGENERATION' | 'REFUND' | 'ADMIN_ADJUSTMENT';
  credits: number;
  amount?: number;
  currency?: string;
  status: 'COMPLETED' | 'PENDING' | 'REFUNDED' | 'FAILED';
  createdAt: string;
  note?: string;
}

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  currency: string;
  badge?: string;
  active: boolean;
}

export interface CreditsOverview {
  creditsAllocated: number;
  creditsUsed: number;
  creditsRemaining: number;
  transactions: CreditTransaction[];
  packages: CreditPackage[];
}

export interface CustomerQrLookup {
  id?: string;
  businessId?: string;
  uniqueCode: string;
  qrLabel: string;
  businessName: string;
  category: string;
  mainCategory?: string;
  subcategory?: string;
  logoUrl?: string;
  googleReviewUrl: string;
  location?: string;
  customerHeading?: string;
  welcomeMessage?: string;
  brandAccentColor?: string;
  supportedLanguages?: string[];
  tonePreference?: string;
  experienceCards?: Array<{
    id: string;
    icon: string;
    title: string;
    placeholder?: string;
    enabled?: boolean;
  }>;
}

export interface PaginatedClientsResult {
  clients: Array<{
    uid: string;
    clientName: string;
    email: string;
    businessId?: string;
    businessName: string;
    category: string;
    planName: string;
    planId: string;
    accountStatus: 'active' | 'suspended';
    subscriptionStatus: 'active' | 'trialing' | 'expired' | 'suspended';
    onboardingStatus: string;
    onboardingCompleted: boolean;
    qrCount: number;
    activeQrCount: number;
    totalScans: number;
    aiUsage: number;
    maxAiMonthly: number;
    googleReviewUrlStatus: 'Verified' | 'Configured' | 'Missing';
    googleReviewUrl: string;
    lastActivity: string;
    createdAt: string;
  }>;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasPrev: boolean;
    hasNext: boolean;
  };
}

export const BUSINESS_CATEGORIES: BusinessCategoryInfo[] = [
  {
    id: 'jewellery',
    name: 'Jewellery & Gold',
    icon: '💎',
    placeholderPrompt: 'Describe staff assistance, purity, designs shown, or purchase experience...',
    topics: [
      { id: 'designs', label: 'Designs & Collection', text: 'Impressed by the wide variety of modern and traditional designs.' },
      { id: 'staff', label: 'Helpful Staff', text: 'The staff patiently showed multiple items and explained purity.' },
      { id: 'pricing', label: 'Transparent Pricing', text: 'Clear billing, genuine hallmark certification, and honest making charges.' }
    ]
  },
  {
    id: 'restaurant_cafe',
    name: 'Restaurant & Café',
    icon: '🍽️',
    placeholderPrompt: 'Mention dishes ordered, taste, table service, ambience, or drink options...',
    topics: [
      { id: 'taste', label: 'Delicious Food', text: 'Food was freshly prepared, full of flavor, and well presented.' },
      { id: 'service', label: 'Prompt Service', text: 'The table service was courteous, quick, and attentive.' },
      { id: 'ambience', label: 'Welcoming Ambience', text: 'Clean seating, pleasant music, and wonderful atmosphere.' }
    ]
  },
  {
    id: 'salon_beauty',
    name: 'Salon & Spa',
    icon: '💇',
    placeholderPrompt: 'Mention stylist name, service done (haircut, facial, spa), hygiene...',
    topics: [
      { id: 'styling', label: 'Skilled Stylist', text: 'The stylist understood exactly what I wanted and gave great styling.' },
      { id: 'hygiene', label: 'Hygiene & Cleanliness', text: 'Sanitized tools, clean towels, and premium products used.' },
      { id: 'relaxation', label: 'Relaxing Experience', text: 'Calm setting and courteous service from start to finish.' }
    ]
  },
  {
    id: 'garage_auto',
    name: 'Automotive & Garage',
    icon: '🚗',
    placeholderPrompt: 'Describe vehicle service, repair quality, delivery time, pricing...',
    topics: [
      { id: 'repair', label: 'Thorough Service', text: 'Diagnosed the problem accurately and resolved it completely.' },
      { id: 'ontime', label: 'On-Time Delivery', text: 'Vehicle was serviced and handed over right at the promised time.' },
      { id: 'honest', label: 'Honest Billing', text: 'Genuine spare parts used with transparent estimate and billing.' }
    ]
  },
  {
    id: 'clothing_retail',
    name: 'Clothing & Boutique',
    icon: '👗',
    placeholderPrompt: 'Mention fabric quality, trial room experience, fitting, collection...',
    topics: [
      { id: 'collection', label: 'Trendy Collection', text: 'Great selection of stylish outfits for all occasions.' },
      { id: 'fabric', label: 'Premium Fabric', text: 'The fabric quality, stitching, and fitting were exceptional.' },
      { id: 'hospitality', label: 'Helpful Staff', text: 'Staff assisted with sizes and matching combinations.' }
    ]
  },
  {
    id: 'electronics',
    name: 'Electronics & Mobile',
    icon: '📱',
    placeholderPrompt: 'Mention product purchased, demo explanation, warranty, exchange...',
    topics: [
      { id: 'demo', label: 'Clear Demo', text: 'Staff explained the device features and helped with setup.' },
      { id: 'deal', label: 'Competitive Pricing', text: 'Got an authentic product with warranty and genuine pricing.' },
      { id: 'quick', label: 'Fast Billing', text: 'Quick payment, easy invoice generation, and supportive staff.' }
    ]
  },
  {
    id: 'medical_wellness',
    name: 'Clinic & Wellness',
    icon: '🩺',
    placeholderPrompt: 'Describe doctor consultation, wait time, clinic hygiene, care...',
    topics: [
      { id: 'consultation', label: 'Attentive Doctor', text: 'Doctor listened carefully, explained diagnosis, and prescribed right care.' },
      { id: 'clinic', label: 'Clean Clinic', text: 'Well-maintained waiting area and minimal delay for appointment.' },
      { id: 'staff', label: 'Supportive Team', text: 'Staff at reception and nursing were polite and caring.' }
    ]
  },
  {
    id: 'other',
    name: 'Other Local Business',
    icon: '🏢',
    placeholderPrompt: 'Share what you appreciated about your visit or interaction...',
    topics: [
      { id: 'quality', label: 'High Quality', text: 'High standard of service and attention to customer needs.' },
      { id: 'professional', label: 'Professional Team', text: 'Prompt communication, courteous behavior, and dependable service.' },
      { id: 'recommended', label: 'Recommended', text: 'Pleasant experience and would gladly recommend to others.' }
    ]
  }
];

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  try {
    const raw = localStorage.getItem('saas_auth_user');
    let localUser: any = null;
    if (raw) {
      try {
        localUser = JSON.parse(raw);
      } catch {}
    }

    if (localUser && (localUser.role === 'SUPER_ADMIN' || localUser.role === 'SALES_TEAM')) {
      if (localUser.uid) headers['x-user-uid'] = localUser.uid;
      if (localUser.email) headers['x-user-email'] = localUser.email;
    } else if (auth && auth.currentUser) {
      headers['x-user-uid'] = auth.currentUser.uid;
      if (auth.currentUser.email) headers['x-user-email'] = auth.currentUser.email;
    } else if (localUser) {
      if (localUser.uid) headers['x-user-uid'] = localUser.uid;
      if (localUser.email) headers['x-user-email'] = localUser.email;
    }
  } catch {
    // fallback
  }

  return headers;
}

/**
 * Final punctuation-free sanitizer requested by user
 * Strips [.,!?;:'"()[\]{}\-_/\\—–:;] and Devanagari dandas, normalizes whitespace.
 */
export function sanitizeReviewText(generatedText: string): string {
  if (!generatedText) return '';
  return generatedText
    .replace(/[.,!?;:'"()[\]{}\-_/\\—–:;\u0964\u0965]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function parseJsonResponse(res: Response, defaultError: string) {
  const text = await res.text();
  if (!text || !text.trim()) {
    return {};
  }
  try {
    const data = JSON.parse(text);
    if (!res.ok) throw new Error(data.error || defaultError);
    return data;
  } catch (err: any) {
    if (err.message && !err.message.includes('JSON')) throw err;
    if (!res.ok) throw new Error(`${defaultError} (Status ${res.status})`);
    throw new Error('Server returned an unexpected format. Please refresh the page.');
  }
}

export const freshTestApi = {
  // Client Authentication (Signup, Login, Forgot Password, Reset Password)
  async clientSignup(params: {
    uid?: string;
    email: string;
    password: string;
    name: string;
    businessName?: string;
    phone?: string;
    termsAccepted?: boolean;
    emailVerified?: boolean;
    role?: string;
  }): Promise<{ user: any; subscription?: any; business?: any; message: string }> {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    return await parseJsonResponse(res, 'Signup failed');
  },

  async clientLogin(params: {
    uid?: string;
    email: string;
    password: string;
  }): Promise<{ user: any; subscription?: any; business?: any; message: string }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    return await parseJsonResponse(res, 'Sign in failed');
  },

  async requestPasswordReset(email: string): Promise<{ success: boolean; message: string; resetCode?: string; resetToken?: string }> {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return await parseJsonResponse(res, 'Password recovery request failed');
  },

  async resetPassword(params: {
    email: string;
    code: string;
    newPassword: string;
  }): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    return await parseJsonResponse(res, 'Password reset failed');
  },

  async verifyEmail(): Promise<{ success: boolean; user: any; message: string }> {
    const res = await fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return await parseJsonResponse(res, 'Email verification failed');
  },

  async devReset(): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/dev/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return await parseJsonResponse(res, 'Development reset failed');
  },

  // Plans & Subscriptions
  async getPlans(): Promise<{ mainPlan: PlanDefinition; comingSoon: any[] }> {
    const res = await fetch('/api/plans');
    const data = await parseJsonResponse(res, 'Failed to load plans');
    return {
      mainPlan: data.mainPlan,
      comingSoon: data.comingSoon || []
    };
  },

  async getSubscription(): Promise<{ subscription: SubscriptionData; plan: PlanDefinition; usage: any }> {
    const res = await fetch('/api/subscription', { headers: getAuthHeaders() });
    return await parseJsonResponse(res, 'Failed to load subscription');
  },

  /** Get all subscriptions for the current user (one per business) */
  async getSubscriptions(): Promise<{ subscriptions: Array<SubscriptionData & { business: any }> }> {
    const res = await fetch('/api/subscriptions', { headers: getAuthHeaders() });
    return await parseJsonResponse(res, 'Failed to load subscriptions');
  },

  async getRazorpayConfig(): Promise<{ keyId: string }> {
    const res = await fetch('/api/config/razorpay');
    return await parseJsonResponse(res, 'Failed to load payment gateway config');
  },

  /** Load current plan configuration and dynamic prices from backend */
  async getPlanConfig(): Promise<{
    success: boolean;
    plan: {
      id: string;
      name: string;
      tagline: string;
      monthlyPrice: number;
      yearlyPrice: number;
      currency: string;
      features: string[];
      currentVersion: number;
      discount: number;
    };
  }> {
    const res = await fetch('/api/plans/reviewflow_unlimited');
    return await parseJsonResponse(res, 'Failed to load plan configuration');
  },

  /** Get payment gateway public configuration */
  async getPaymentGatewayConfig(): Promise<{
    activeGateway: 'CASHFREE' | 'RAZORPAY';
    cashfree: {
      appId: string;
      environment: 'sandbox' | 'production';
      apiVersion: string;
      isConfigured: boolean;
    };
    razorpay: {
      keyId: string;
      merchantName: string;
      currency: string;
      isConfigured: boolean;
    };
  }> {
    const res = await fetch('/api/config/payment-gateway');
    return await parseJsonResponse(res, 'Failed to load gateway configuration');
  },

  /** Create server-side pending subscription/payment intent */
  async createPaymentIntent(params: {
    planId: string;
    billingInterval?: 'monthly' | 'yearly';
    idempotencyKey?: string;
    gateway?: 'CASHFREE' | 'RAZORPAY';
    billingModel?: 'SUBSCRIPTION' | 'ORDER';
  }): Promise<{
    provider?: 'CASHFREE' | 'RAZORPAY';
    paymentId: string;
    orderId?: string;
    subscriptionId?: string;
    paymentSessionId?: string;
    authLink?: string;
    environment?: 'sandbox' | 'production';
    amount: number;
    currency: string;
    keyId: string;
    planId: string;
    billingInterval?: 'monthly' | 'yearly';
    businessName: string;
    description: string;
  }> {
    const res = await fetch('/api/subscriptions/intent', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(params)
    });
    return await parseJsonResponse(res, 'Failed to initialize checkout session');
  },

  /** Verify Cashfree or Razorpay payment and provision new business shell */
  async verifyPayment(params: {
    paymentId: string;
    gateway?: string;
    razorpay_payment_id?: string;
    razorpay_order_id?: string;
    razorpay_subscription_id?: string;
    razorpay_signature?: string;
    cfPaymentId?: string;
    cfOrderId?: string;
    cfSubscriptionId?: string;
    order_id?: string;
    payment_id?: string;
    subscription_id?: string;
    testModeBypass?: boolean;
  }): Promise<{
    success: boolean;
    businessId: string;
    subscriptionId: string;
    business: BusinessData;
    subscription: SubscriptionData;
  }> {
    const res = await fetch('/api/subscriptions/verify-payment', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(params)
    });
    return await parseJsonResponse(res, 'Payment verification failed');
  },

  /** Get customer billing history & past invoices */
  async getBillingHistory(): Promise<{ success: boolean; invoices: any[] }> {
    const res = await fetch('/api/billing/history', { headers: getAuthHeaders() });
    return await parseJsonResponse(res, 'Failed to load billing history');
  },

  // Experience Topics API
  async getBusinessTopics(businessId: string): Promise<{ topics: Array<{ id: string; title: string; description: string; sortOrder: number }> }> {
    const res = await fetch(`/api/businesses/${encodeURIComponent(businessId)}/topics`, { headers: getAuthHeaders() });
    return await parseJsonResponse(res, 'Failed to load experience topics');
  },

  async generateBusinessTopics(businessId: string, forceFresh?: boolean): Promise<{ success: boolean; topics: Array<{ id: string; title: string; description: string; sortOrder: number }> }> {
    const res = await fetch(`/api/businesses/${encodeURIComponent(businessId)}/generate-topics`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ forceFresh: Boolean(forceFresh) })
    });
    return await parseJsonResponse(res, 'Failed to generate experience topics');
  },

  async saveBusinessTopics(businessId: string, topics: Array<{ topicId?: string; title: string; description: string; sortOrder?: number }>): Promise<{ success: boolean; topics: any[] }> {
    const res = await fetch(`/api/businesses/${encodeURIComponent(businessId)}/topics`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ topics })
    });
    return await parseJsonResponse(res, 'Failed to save experience topics');
  },

  async completeBusinessOnboarding(businessId: string): Promise<{ success: boolean; business: BusinessData }> {
    const res = await fetch(`/api/businesses/${encodeURIComponent(businessId)}/complete-onboarding`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return await parseJsonResponse(res, 'Failed to complete onboarding setup');
  },

  async checkoutReviewFlowPro(paymentMethod: string = 'Test Checkout'): Promise<{ subscription: SubscriptionData }> {
    const res = await fetch('/api/billing/checkout', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ paymentMethod })
    });
    return await parseJsonResponse(res, 'Checkout failed');
  },

  // Business Profile & Google URL Verification
  async getBusiness(businessId?: string): Promise<BusinessData | null> {
    const query = businessId ? `?businessId=${encodeURIComponent(businessId)}` : '';
    const res = await fetch(`/api/business${query}`, { headers: getAuthHeaders() });
    const data = await parseJsonResponse(res, 'Failed to load business details');
    return data.business || null;
  },

  async saveBusiness(input: Partial<BusinessData>, businessId?: string): Promise<BusinessData> {
    const query = businessId ? `?businessId=${encodeURIComponent(businessId)}` : '';
    const res = await fetch(`/api/business${query}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(input)
    });
    const data = await parseJsonResponse(res, 'Failed to save business settings');
    return data.business;
  },

  async getBusinesses(): Promise<{ businesses: BusinessData[]; activeBusinessId: string }> {
    const res = await fetch('/api/businesses', { headers: getAuthHeaders() });
    const data = await parseJsonResponse(res, 'Failed to load businesses');
    return {
      businesses: data.businesses || [],
      activeBusinessId: data.activeBusinessId || ''
    };
  },

  async getBusinessById(id: string): Promise<BusinessData> {
    const res = await fetch(`/api/businesses/${id}`, { headers: getAuthHeaders() });
    const data = await parseJsonResponse(res, 'Failed to load business');
    return data.business;
  },

  async createBusiness(input: Partial<BusinessData>): Promise<BusinessData> {
    const res = await fetch('/api/businesses', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(input)
    });
    const data = await parseJsonResponse(res, 'Failed to create business');
    return data.business;
  },

  async updateBusiness(id: string, input: Partial<BusinessData>): Promise<BusinessData> {
    const res = await fetch(`/api/businesses/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(input)
    });
    const data = await parseJsonResponse(res, 'Failed to update business');
    return data.business;
  },

  async deleteBusiness(id: string): Promise<void> {
    const res = await fetch(`/api/businesses/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    await parseJsonResponse(res, 'Failed to delete business');
  },

  async setActiveBusiness(id: string): Promise<{ success: boolean; activeBusinessId: string }> {
    const res = await fetch(`/api/businesses/${id}/activate`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return await parseJsonResponse(res, 'Failed to activate business');
  },

  async getCredits(): Promise<CreditsOverview> {
    const res = await fetch('/api/credits', { headers: getAuthHeaders() });
    const data = await parseJsonResponse(res, 'Failed to load credits');
    return {
      creditsAllocated: data.creditsAllocated || 100,
      creditsUsed: data.creditsUsed || 0,
      creditsRemaining: data.creditsRemaining ?? 100,
      transactions: data.transactions || [],
      packages: data.packages || []
    };
  },

  /** Alias for getCredits — used by BusinessContext for per-business isolation */
  async getCreditsOverview(): Promise<CreditsOverview> {
    return this.getCredits();
  },

  async purchaseCredits(packageId: string): Promise<{ success: boolean; creditsRemaining: number; message: string }> {
    const res = await fetch('/api/credits/purchase', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ packageId })
    });
    return await parseJsonResponse(res, 'Failed to purchase credits');
  },

  async testGoogleUrl(url: string, confirmVerified: boolean = false): Promise<any> {
    const res = await fetch('/api/business/test-google-url', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ url, confirmVerified })
    });
    return await parseJsonResponse(res, 'Validation failed');
  },

  // Primary NFC Card & Dynamic QR System
  async getNfcCard(): Promise<NfcCardData | null> {
    const res = await fetch('/api/nfc-card', { headers: getAuthHeaders() });
    if (res.status === 404) return null;
    const data = await parseJsonResponse(res, 'Failed to load primary NFC card');
    return data.nfcCard || null;
  },

  async getQrCodes(): Promise<QrCodeData[]> {
    const res = await fetch('/api/qr-codes', { headers: getAuthHeaders() });
    const data = await parseJsonResponse(res, 'Failed to load QR codes');
    return data.qrCodes || [];
  },

  async getQrCode(): Promise<QrCodeData | null> {
    const list = await this.getQrCodes();
    return list.length > 0 ? list[0] : null;
  },

  async generateQrCode(label: string = 'Billing Counter'): Promise<QrCodeData> {
    return this.createQrCode(label);
  },

  async createQrCode(label: string = 'Billing Counter'): Promise<QrCodeData> {
    const res = await fetch('/api/qr-codes', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ label, regenerate: true })
    });
    const data = await parseJsonResponse(res, 'Failed to generate QR code');
    return data.qrCode;
  },

  async updateQrCode(id: string, updates: { label?: string; status?: 'ACTIVE' | 'PAUSED' }): Promise<QrCodeData> {
    const res = await fetch(`/api/qr-codes/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates)
    });
    const data = await parseJsonResponse(res, 'Failed to update QR code');
    return data.qrCode;
  },

  async deleteQrCode(id: string): Promise<void> {
    const res = await fetch(`/api/qr-codes/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    await parseJsonResponse(res, 'Failed to delete QR code');
  },

  async upgradeSubscription(planId: string): Promise<any> {
    return this.checkoutReviewFlowPro(planId);
  },

  // Analytics
  async getAnalytics(days: number = 30): Promise<AnalyticsData> {
    const res = await fetch(`/api/analytics?days=${days}`, { headers: getAuthHeaders() });
    return await parseJsonResponse(res, 'Failed to load analytics');
  },

  // Public Customer Review Flow
  async lookupQr(code: string): Promise<CustomerQrLookup> {
    const res = await fetch(`/api/public/qr-lookup/${encodeURIComponent(code)}`);
    return await parseJsonResponse(res, 'QR code not found or inactive');
  },

  async recordEvent(
    uniqueCode: string,
    eventType: 'PAGE_VIEW' | 'QR_SCAN' | 'CARD_SELECTED' | 'AI_DRAFT_GENERATED' | 'REVIEW_REGENERATED' | 'REVIEW_COPIED' | 'GOOGLE_REVIEW_CLICKED',
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uniqueCode, eventType, metadata })
      });
    } catch {
      // Non-blocking telemetry
    }
  },

  async generateAiDraft(params: {
    customerFeedback?: string;
    customerExperience?: string;
    customerText?: string;
    selectedExperienceCards?: string[];
    selectedCards?: string[];
    selectedTopics?: string[];
    language?: string;
    businessName?: string;
    businessId?: string;
    category?: string;
    tone?: string;
    uniqueCode?: string;
    sessionId?: string;
    iteration?: number;
    generationNumber?: number;
    requestId?: string;
  }): Promise<{
    draft: string;
    iteration: number;
    generationNumber?: number;
    sessionId?: string;
    generationId?: string;
    requestId?: string;
    wordCount?: number;
  }> {
    const payload = {
      ...params,
      requestId: params.requestId || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'req_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8))
    };
    const res = await fetch('/api/ai/review-draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await parseJsonResponse(res, 'Failed to generate AI review draft');
    const cleanDraft = sanitizeReviewText(data.draft || '');
    return {
      draft: cleanDraft,
      iteration: data.iteration || data.generationNumber || params.iteration || params.generationNumber || 1,
      generationNumber: data.generationNumber || data.iteration || 1,
      sessionId: data.sessionId,
      generationId: data.generationId,
      requestId: data.requestId || payload.requestId,
      wordCount: cleanDraft ? cleanDraft.split(/\s+/).filter(Boolean).length : 0
    };
  },

  async getAiObservabilityMetrics(): Promise<any> {
    const res = await fetch('/api/admin/ai/observability', {
      headers: getAuthHeaders()
    });
    const data = await parseJsonResponse(res, 'Failed to load AI observability metrics');
    return data.metrics;
  },

  async analyzeBusiness(params: {
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
  }): Promise<ReviewFlowAiAnalysisResult> {
    const res = await fetch('/api/ai/analyze-business', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    return await parseJsonResponse(res, 'Failed to analyze business information');
  },

  async detectCategory(description: string): Promise<{ suggestedCategory: string | null; suggestedSubcategory: string | null; label?: string; confidence: string }> {
    try {
      const res = await fetch('/api/ai/detect-category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description })
      });
      return await parseJsonResponse(res, 'Failed to detect category');
    } catch {
      return { suggestedCategory: null, suggestedSubcategory: null, confidence: 'low' };
    }
  },

  async suggestCustomFields(params: {
    businessName: string;
    category: string;
    description: string;
    city?: string;
  }): Promise<Array<{ id: string; title: string; description: string; category?: string; reason?: string; verified?: boolean; source?: string }>> {
    try {
      const res = await fetch('/api/ai/suggest-custom-fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      const data = await parseJsonResponse(res, 'Failed to suggest custom trade highlights');
      return (data.suggestions || []).map((s: any) => ({
        id: s.id || Math.random().toString(),
        title: s.title || s.key || 'Highlight',
        description: s.description || s.value || '',
        category: s.category || 'service',
        reason: s.reason || 'AI Suggestion — Verify',
        verified: Boolean(s.verified),
        source: s.source || 'ai'
      }));
    } catch (err: any) {
      console.warn('suggestCustomFields error:', err.message);
      return [];
    }
  },

  async getGeminiStatus(): Promise<{ configured: boolean; provider: string; model: string; status: string; lastCheckedAt?: string }> {
    const res = await fetch('/api/admin/gemini-status', { headers: getAuthHeaders() });
    return await parseJsonResponse(res, 'Failed to load Gemini status');
  },

  async testGeminiConnection(): Promise<{ success: boolean; status: string; model: string; latencyMs: number; error?: string; timestamp: string }> {
    const res = await fetch('/api/admin/test-gemini', {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return await parseJsonResponse(res, 'Gemini connection test failed');
  },

  // Super Admin Endpoints (Section 5, 6, 8, 9, 10)
  async adminLogin(email: string, password: string): Promise<{ success: boolean; user: any }> {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return await parseJsonResponse(res, 'Admin authentication failed');
  },

  async getAdminOverview() {
    const res = await fetch('/api/admin/overview', { headers: getAuthHeaders() });
    return await parseJsonResponse(res, 'Failed to load admin overview');
  },

  async getAdminClients(options?: { search?: string; filter?: string; page?: number; pageSize?: number }): Promise<PaginatedClientsResult> {
    const params = new URLSearchParams();
    if (options?.search) params.set('search', options.search);
    if (options?.filter) params.set('filter', options.filter);
    if (options?.page) params.set('page', String(options.page));
    if (options?.pageSize) params.set('pageSize', String(options.pageSize));

    const res = await fetch(`/api/admin/clients?${params.toString()}`, { headers: getAuthHeaders() });
    return await parseJsonResponse(res, 'Failed to load clients');
  },

  async getAdminClientDetail(clientId: string) {
    const res = await fetch(`/api/admin/clients/${clientId}`, { headers: getAuthHeaders() });
    return await parseJsonResponse(res, 'Failed to load client details');
  },

  async suspendClient(clientId: string) {
    const res = await fetch(`/api/admin/clients/${clientId}/suspend`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return await parseJsonResponse(res, 'Failed to suspend client');
  },

  async reactivateClient(clientId: string) {
    const res = await fetch(`/api/admin/clients/${clientId}/reactivate`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return await parseJsonResponse(res, 'Failed to reactivate client');
  },

  async updateClientLimits(clientId: string, limits: { maxAiMonthly?: number; maxQrCodes?: number; status?: string }) {
    const res = await fetch(`/api/admin/clients/${clientId}/limits`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(limits)
    });
    return await parseJsonResponse(res, 'Failed to update plan limits');
  },

  async getAdminBusinesses() {
    const res = await fetch('/api/admin/businesses', { headers: getAuthHeaders() });
    const data = await parseJsonResponse(res, 'Failed to load businesses');
    return data.businesses || [];
  },

  async getAdminSubscriptions() {
    const res = await fetch('/api/admin/subscriptions', { headers: getAuthHeaders() });
    return await parseJsonResponse(res, 'Failed to load subscriptions');
  },

  async getAdminSystem() {
    const res = await fetch('/api/admin/system', { headers: getAuthHeaders() });
    return await parseJsonResponse(res, 'Failed to load system settings');
  },

  async updateAdminSystem(updates: any) {
    const res = await fetch('/api/admin/system', {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates)
    });
    return await parseJsonResponse(res, 'Failed to update system settings');
  },

  async getFirebaseSyncStatus(): Promise<any> {
    const res = await fetch('/api/admin/firebase-sync/status', { headers: getAuthHeaders() });
    return await parseJsonResponse(res, 'Failed to load Firebase sync status');
  },

  async syncFirebaseDatabase(mode: 'push' | 'pull' = 'push'): Promise<any> {
    const res = await fetch('/api/admin/firebase-sync', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ mode })
    });
    return await parseJsonResponse(res, 'Failed to execute Firebase synchronization');
  },

  async getAdminAuditLogs(limit: number = 100) {
    const res = await fetch(`/api/admin/audit-logs?limit=${limit}`, { headers: getAuthHeaders() });
    const data = await parseJsonResponse(res, 'Failed to load audit logs');
    return data.logs || [];
  },

  async getAdminUsers() {
    const res = await this.getAdminClients({ pageSize: 100 });
    return res.clients || [];
  },

  async getAdminSettings() {
    const res = await this.getAdminSystem();
    const logs = await this.getAdminAuditLogs(20);
    return { settings: res.settings, auditLogs: logs };
  },

  async getAdminBusinessDetail(id: string) {
    return this.getAdminClientDetail(id);
  },

  async updateBusinessStatus(id: string, status: 'active' | 'suspended') {
    if (status === 'suspended') return this.suspendClient(id);
    return this.reactivateClient(id);
  },

  async updateClientPlan(id: string, _planId: string) {
    return this.checkoutReviewFlowPro('Admin Update');
  },

  async updateUserStatus(uid: string, status: 'active' | 'suspended') {
    if (status === 'suspended') return this.suspendClient(uid);
    return this.reactivateClient(uid);
  },

  // Super Admin Team & Employee Management
  async getAdminEmployees() {
    const res = await fetch('/api/admin/employees', { headers: getAuthHeaders() });
    const data = await parseJsonResponse(res, 'Failed to load employees');
    return data.employees || [];
  },

  async createAdminEmployee(params: {
    name: string;
    email: string;
    phone: string;
    password?: string;
    role?: string;
    department?: string;
    permissions?: string[];
  }) {
    const res = await fetch('/api/admin/employees', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(params)
    });
    return await parseJsonResponse(res, 'Failed to create employee');
  },

  async updateAdminEmployee(uid: string, updates: any) {
    const res = await fetch(`/api/admin/employees/${uid}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates)
    });
    return await parseJsonResponse(res, 'Failed to update employee');
  },

  async deleteAdminEmployee(uid: string) {
    const res = await fetch(`/api/admin/employees/${uid}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return await parseJsonResponse(res, 'Failed to remove employee');
  },

  // -------------------------------------------------------------
  // CRM API (Section 8-17)
  // -------------------------------------------------------------
  async submitLandingInquiry(params: {
    name: string;
    businessName: string;
    phone: string;
    email: string;
    category?: string;
    city?: string;
    googleBusinessUrl?: string;
    message?: string;
  }) {
    const res = await fetch('/api/crm/inquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    return await parseJsonResponse(res, 'Failed to submit inquiry');
  },

  async crmLogin(email: string, password: string) {
    const res = await fetch('/api/crm/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await parseJsonResponse(res, 'Sales login failed');
    if (data.user) {
      localStorage.setItem('rf_sales_user', JSON.stringify(data.user));
    }
    return data;
  },

  async getCrmMetrics() {
    const res = await fetch('/api/crm/metrics', { headers: getAuthHeaders() });
    const data = await parseJsonResponse(res, 'Failed to load CRM metrics');
    return data.metrics;
  },

  async getCrmLeads(filters?: { status?: string; search?: string; assignedSalesId?: string }) {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.search) params.set('search', filters.search);
    if (filters?.assignedSalesId) params.set('assignedSalesId', filters.assignedSalesId);

    const res = await fetch(`/api/crm/leads?${params.toString()}`, { headers: getAuthHeaders() });
    const data = await parseJsonResponse(res, 'Failed to load CRM leads');
    return data.leads || [];
  },

  async getCrmLeadById(id: string) {
    const res = await fetch(`/api/crm/leads/${id}`, { headers: getAuthHeaders() });
    return await parseJsonResponse(res, 'Failed to load lead details');
  },

  async createCrmLead(params: any) {
    const res = await fetch('/api/crm/leads', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(params)
    });
    return await parseJsonResponse(res, 'Failed to create lead');
  },

  async updateCrmLead(id: string, updates: any) {
    const res = await fetch(`/api/crm/leads/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates)
    });
    return await parseJsonResponse(res, 'Failed to update lead');
  },

  async convertLeadToClient(id: string) {
    const res = await fetch(`/api/crm/leads/${id}/convert`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return await parseJsonResponse(res, 'Failed to convert lead');
  },

  async addCrmNote(params: { leadId?: string; clientId?: string; text: string }) {
    const res = await fetch('/api/crm/notes', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(params)
    });
    return await parseJsonResponse(res, 'Failed to add note');
  },

  async logCrmCall(params: {
    leadId?: string;
    clientId?: string;
    phone: string;
    outcome: string;
    notes?: string;
    nextFollowUpAt?: string;
  }) {
    const res = await fetch('/api/crm/calls', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(params)
    });
    return await parseJsonResponse(res, 'Failed to log call');
  },

  async getCrmFollowUps(assignedUserId?: string, status?: string) {
    const params = new URLSearchParams();
    if (assignedUserId) params.set('assignedUserId', assignedUserId);
    if (status) params.set('status', status);

    const res = await fetch(`/api/crm/follow-ups?${params.toString()}`, { headers: getAuthHeaders() });
    const data = await parseJsonResponse(res, 'Failed to load follow-ups');
    return data.tasks || [];
  },

  async createCrmFollowUp(params: any) {
    const res = await fetch('/api/crm/follow-ups', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(params)
    });
    return await parseJsonResponse(res, 'Failed to schedule follow-up');
  },

  async updateCrmFollowUp(id: string, updates: any) {
    const res = await fetch(`/api/crm/follow-ups/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates)
    });
    return await parseJsonResponse(res, 'Failed to update follow-up');
  },

  async getCrmExpiringSubscriptions(days: number = 7) {
    const res = await fetch(`/api/crm/expiring-subscriptions?days=${days}`, { headers: getAuthHeaders() });
    const data = await parseJsonResponse(res, 'Failed to load expiring subscriptions');
    return data.subscriptions || [];
  },

  async getSalesUsers() {
    const res = await fetch('/api/crm/sales-users', { headers: getAuthHeaders() });
    const data = await parseJsonResponse(res, 'Failed to load sales users');
    return data.users || [];
  }
};
