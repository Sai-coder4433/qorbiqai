export type UserRole = 'BUSINESS_OWNER' | 'SUPER_ADMIN';

export interface TestUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  status: 'active' | 'suspended';
  createdAt: string;
  updatedAt: string;
}

export type BusinessCategory =
  | 'jewellery'
  | 'restaurant_cafe'
  | 'salon_beauty'
  | 'garage_auto'
  | 'clothing_retail'
  | 'electronics'
  | 'grocery_general'
  | 'medical_wellness'
  | 'hotel_hospitality'
  | 'professional_services'
  | 'other';

export interface TestBusiness {
  id: string;
  ownerUid: string;
  businessName: string;
  category: BusinessCategory;
  customCategory?: string;
  description?: string;
  country: string;
  state: string;
  city: string;
  preferredLanguage: string;
  logoUrl?: string;
  website?: string;
  phone?: string;
  
  // Category-specific details (Section 4.Step 2)
  categoryDetails: Record<string, any>;
  customFields?: Array<{ key: string; value: string }>;
  
  // Google Review Setup (Section 4.Step 3)
  googleReviewUrl: string;
  googlePlaceName?: string;
  location?: string;
  googleProfileConnected: boolean;

  // Customer Experience Configuration (Section 4.Step 4)
  customerHeading?: string;
  welcomeMessage?: string;
  brandAccentColor?: string;
  supportedLanguages?: string[];
  tonePreference?: 'natural' | 'simple' | 'warm' | 'professional' | 'conversational';
  visitQuestions?: string[];

  // Onboarding Status
  onboardingCompleted: boolean;
  onboardingStep: number;
  status: 'active' | 'suspended';
  createdAt: string;
  updatedAt: string;
}

export interface TestQrCode {
  id: string;
  businessId: string;
  ownerUid: string;
  label: string; // e.g. "Billing Counter", "Entrance", "Table 1"
  uniqueCode: string;
  destinationUrl: string;
  status: 'ACTIVE' | 'PAUSED';
  createdAt: string;
  updatedAt: string;
}

export type ScanEventType = 'QR_SCAN';

export interface TestQrScanEvent {
  id: string;
  businessId: string;
  qrCodeId: string;
  uniqueCode: string;
  eventType: ScanEventType;
  userAgent: string;
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'unknown';
  source?: string;
  createdAt: string;
}

export type ReviewAssistanceEventType =
  | 'PAGE_VIEW'
  | 'AI_DRAFT_GENERATED'
  | 'REVIEW_COPIED'
  | 'GOOGLE_REVIEW_CLICKED';

export interface TestReviewAssistanceEvent {
  id: string;
  businessId: string;
  qrCodeId: string;
  uniqueCode: string;
  eventType: ReviewAssistanceEventType;
  createdAt: string;
}

export interface TestSubscription {
  id: string;
  ownerUid: string;
  planId: 'free_trial' | 'starter' | 'growth' | 'pro' | 'enterprise';
  status: 'active' | 'trialing' | 'expired' | 'suspended';
  currentPeriodEnd: string;
  aiGenerationsUsedThisMonth: number;
  maxQrCodes: number;
  maxAiMonthly: number;
  createdAt: string;
  updatedAt: string;
}

export interface TestPlanDefinition {
  id: 'free_trial' | 'starter' | 'growth' | 'pro' | 'enterprise';
  name: string;
  priceMonthly: number;
  currency: string;
  description: string;
  maxQrCodes: number;
  maxAiMonthly: number;
  features: string[];
  badge?: string;
}

export interface TestAdminAuditLog {
  id: string;
  actorUid: string;
  actorEmail: string;
  action: string;
  targetType: 'business' | 'user' | 'subscription' | 'system';
  targetId: string;
  details: string;
  createdAt: string;
}

export interface TestSystemSettings {
  aiProvider: 'gemini' | 'openai' | 'none';
  aiConfigured: boolean;
  firebaseStatus: 'connected' | 'demo_mode';
  qrEngineStatus: 'active' | 'standby';
  maintenanceMode: boolean;
  version: string;
  updatedAt: string;
}
