export type BillingInterval = 'monthly' | 'yearly' | 'one_time';
export type PaymentStatus = 'PENDING' | 'AUTHORIZED' | 'PAID' | 'FAILED' | 'CANCELLED' | 'REFUNDED' | 'HALTED';
export type SubscriptionStatus = 'ACTIVE' | 'TRIALING' | 'PENDING' | 'PAUSED' | 'HALTED' | 'CANCELLED' | 'EXPIRED';

export interface PlanConfig {
  id: string;
  name: string;
  tagline: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  description: string;
  features: string[];
  currentVersion: number;
  trialDays: number;
  discount: number;
  paymentGateway: 'razorpay' | 'cashfree';
  planStatus: 'ACTIVE' | 'ARCHIVED';
}

export interface CreateSubscriptionIntentOptions {
  planId: string;
  billingInterval: BillingInterval;
  amount: number;
  currency: string;
  userId: string;
  customerEmail?: string;
  customerPhone?: string;
  customerName?: string;
  idempotencyKey?: string;
  businessName?: string;
  billingModel?: 'SUBSCRIPTION' | 'ORDER' | 'STANDARD';
  returnUrl?: string;
  notes?: Record<string, string>;
}

export interface PaymentIntentResult {
  provider: 'RAZORPAY' | 'CASHFREE';
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
  billingInterval: BillingInterval;
  businessName: string;
  description: string;
}

export interface VerifyPaymentParams {
  paymentId: string;
  userId: string;
  providerPaymentId?: string;
  providerOrderId?: string;
  providerSubscriptionId?: string;
  providerSignature?: string;
  cfPaymentId?: string;
  cfOrderId?: string;
  cfSubscriptionId?: string;
}

export interface PaymentVerificationResult {
  valid: boolean;
  error?: string;
  orderStatus?: string;
  subscriptionStatus?: string;
  providerPaymentId?: string;
  isPending?: boolean;
}

export interface NormalizedWebhookEvent {
  provider: 'RAZORPAY' | 'CASHFREE';
  eventType: string;
  rawEvent: string;
  orderId?: string;
  paymentId?: string;
  subscriptionId?: string;
  amount?: number;
  currency?: string;
  status: 'PAID' | 'FAILED' | 'HALTED' | 'CANCELLED' | 'PENDING' | 'RENEWED' | 'REFUNDED';
  refundId?: string;
  refundAmount?: number;
  eventId?: string;
  metadata?: Record<string, any>;
}

export interface RefundOptions {
  paymentId: string;
  providerPaymentId?: string;
  amount?: number;
  reason?: string;
}

export interface RefundResult {
  success: boolean;
  refundId?: string;
  amount?: number;
  currency?: string;
  error?: string;
}

/**
 * Modular Payment Gateway Provider Interface
 * Allows seamless extension to Cashfree or Stripe without rewriting core models.
 */
export interface IPaymentGatewayProvider {
  readonly name: 'RAZORPAY' | 'CASHFREE';
  getPublishableKey(): string;
  createSubscriptionIntent(options: CreateSubscriptionIntentOptions): Promise<PaymentIntentResult>;
  verifyPaymentSignature(params: VerifyPaymentParams): Promise<PaymentVerificationResult>;
  verifyWebhookSignature(rawBody: string | Buffer, signature: string, timestamp?: string): boolean;
  parseWebhookEvent(body: any): NormalizedWebhookEvent | null;
  processRefund(options: RefundOptions): Promise<RefundResult>;
  cancelSubscription?(subscriptionId: string, reason?: string): Promise<{ success: boolean; error?: string; localOnly?: boolean }>;
}

