import Razorpay from 'razorpay';
import crypto from 'crypto';
import {
  IPaymentGatewayProvider,
  CreateSubscriptionIntentOptions,
  PaymentIntentResult,
  VerifyPaymentParams,
  PaymentVerificationResult,
  NormalizedWebhookEvent,
  RefundOptions,
  RefundResult
} from './types.ts';

export class RazorpayProvider implements IPaymentGatewayProvider {
  readonly name = 'RAZORPAY' as const;
  private client: any | null = null;

  constructor() {
    this.initClient();
  }

  private initClient(): any | null {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (keyId && keySecret) {
      try {
        this.client = new Razorpay({
          key_id: keyId,
          key_secret: keySecret
        });
        return this.client;
      } catch (err: any) {
        console.warn('[RazorpayProvider] SDK initialization warning:', err.message);
      }
    }
    return null;
  }

  public getPublishableKey(): string {
    return process.env.RAZORPAY_KEY_ID || '';
  }

  public async createSubscriptionIntent(
    options: CreateSubscriptionIntentOptions
  ): Promise<PaymentIntentResult> {
    const keyId = this.getPublishableKey();
    if (!keyId || keyId.includes('1234567890abcdef')) {
      throw new Error('Razorpay Test Key ID is not set. Please replace placeholder RAZORPAY_KEY_ID in .env with your real key from dashboard.razorpay.com');
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret || keySecret.includes('your_razorpay_key_secret_here')) {
      throw new Error('Razorpay Key Secret is not set. Please replace placeholder RAZORPAY_KEY_SECRET in .env with your real key secret from dashboard.razorpay.com');
    }

    const paymentId = 'pay_intent_' + crypto.randomBytes(8).toString('hex');
    const amountInPaise = Math.round(options.amount * 100);

    let orderId = 'order_' + crypto.randomBytes(8).toString('hex');
    let subscriptionId: string | undefined = undefined;

    // Call live/test Razorpay API server-side
    const rzp = this.client || this.initClient();
    if (rzp) {
      try {
        const order = await rzp.orders.create({
          amount: amountInPaise,
          currency: options.currency || 'INR',
          receipt: `rcpt_${options.userId.substring(0, 10)}_${Date.now()}`,
          notes: {
            userId: options.userId,
            planId: options.planId,
            billingInterval: options.billingInterval,
            idempotencyKey: options.idempotencyKey || '',
            ...(options.notes || {})
          }
        });
        if (order && order.id) {
          orderId = order.id;
        }
      } catch (apiErr: any) {
        const errorDesc = apiErr?.error?.description || apiErr.message;
        console.error('[RazorpayProvider] orders.create API error:', errorDesc);
        if (errorDesc === 'Authentication failed' || apiErr?.statusCode === 401) {
          throw new Error('Razorpay API Authentication failed: Invalid RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET in .env. Please update them with your real test keys from Razorpay Dashboard.');
        }
        throw new Error(
          apiErr?.error?.description ||
          `Failed to create Razorpay Order on server: ${apiErr.message}`
        );
      }
    } else {
      throw new Error('Razorpay client could not be initialized with provided credentials.');
    }

    return {
      provider: 'RAZORPAY',
      paymentId,
      orderId,
      subscriptionId,
      amount: options.amount,
      currency: options.currency || 'INR',
      keyId,
      planId: options.planId,
      billingInterval: options.billingInterval,
      businessName: options.businessName || 'ReviewFlow AI Subscription',
      description: `ReviewFlow Unlimited (${options.billingInterval === 'yearly' ? 'Yearly' : 'Monthly'})`
    };
  }

  public async verifyPaymentSignature(
    params: VerifyPaymentParams
  ): Promise<PaymentVerificationResult> {
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return { valid: false, error: 'Server environment missing RAZORPAY_KEY_SECRET.' };
    }

    if (!params.providerSignature) {
      return { valid: false, error: 'Missing Razorpay signature.' };
    }

    // 1. Order-based checkout signature check: hmac(order_id + '|' + payment_id)
    if (params.providerOrderId && params.providerPaymentId) {
      const payload = `${params.providerOrderId}|${params.providerPaymentId}`;
      const expected = crypto.createHmac('sha256', keySecret).update(payload).digest('hex');
      if (crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(params.providerSignature))) {
        return { valid: true };
      }
    }

    // 2. Subscription-based checkout signature check: hmac(payment_id + '|' + subscription_id)
    if (params.providerSubscriptionId && params.providerPaymentId) {
      const payload = `${params.providerPaymentId}|${params.providerSubscriptionId}`;
      const expected = crypto.createHmac('sha256', keySecret).update(payload).digest('hex');
      if (
        params.providerSignature.length === expected.length &&
        crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(params.providerSignature))
      ) {
        return { valid: true };
      }
    }

    return {
      valid: false,
      error: 'Cryptographic signature verification failed. Tampered or invalid payment payload.'
    };
  }

  public verifyWebhookSignature(rawBody: string | Buffer, signature: string): boolean {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret || !signature) {
      return false;
    }

    try {
      const expected = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
      const sigBuf = Buffer.from(signature);
      const expBuf = Buffer.from(expected);
      if (sigBuf.length !== expBuf.length) return false;
      return crypto.timingSafeEqual(sigBuf, expBuf);
    } catch (err) {
      console.error('[RazorpayProvider] Webhook signature verification error:', err);
      return false;
    }
  }

  public parseWebhookEvent(body: any): NormalizedWebhookEvent | null {
    if (!body || !body.event) return null;

    const event = body.event;
    const payload = body.payload;
    const paymentEntity = payload?.payment?.entity;
    const orderEntity = payload?.order?.entity;
    const subscriptionEntity = payload?.subscription?.entity;
    const refundEntity = payload?.refund?.entity;

    const orderId = paymentEntity?.order_id || orderEntity?.id;
    const paymentId = paymentEntity?.id;
    const subscriptionId = subscriptionEntity?.id || paymentEntity?.subscription_id;
    const amount = paymentEntity?.amount ? paymentEntity.amount / 100 : undefined;
    const currency = paymentEntity?.currency || 'INR';

    let status: NormalizedWebhookEvent['status'] = 'PENDING';

    switch (event) {
      case 'payment.captured':
      case 'order.paid':
      case 'subscription.authenticated':
      case 'subscription.activated':
        status = 'PAID';
        break;
      case 'subscription.charged':
        status = 'RENEWED';
        break;
      case 'payment.failed':
        status = 'FAILED';
        break;
      case 'subscription.halted':
      case 'subscription.pending':
        status = 'HALTED';
        break;
      case 'subscription.cancelled':
        status = 'CANCELLED';
        break;
      case 'refund.processed':
      case 'refund.created':
        status = 'REFUNDED';
        break;
      default:
        status = 'PENDING';
    }

    return {
      provider: 'RAZORPAY',
      eventType: event,
      rawEvent: event,
      orderId,
      paymentId,
      subscriptionId,
      amount,
      currency,
      status,
      refundId: refundEntity?.id,
      refundAmount: refundEntity?.amount ? refundEntity.amount / 100 : undefined,
      metadata: {
        notes: paymentEntity?.notes || orderEntity?.notes || subscriptionEntity?.notes
      }
    };
  }

  public async processRefund(options: RefundOptions): Promise<RefundResult> {
    const rzp = this.client || this.initClient();
    if (!rzp) {
      return { success: false, error: 'Razorpay client is not initialized.' };
    }

    if (!options.providerPaymentId) {
      return { success: false, error: 'Razorpay Payment ID is required for refund processing.' };
    }

    try {
      const refundParams: any = {
        notes: { reason: options.reason || 'Super Admin Refund' }
      };
      if (options.amount) {
        refundParams.amount = Math.round(options.amount * 100);
      }

      const res = await rzp.payments.refund(options.providerPaymentId, refundParams);
      return {
        success: true,
        refundId: res.id,
        amount: res.amount ? res.amount / 100 : options.amount,
        currency: res.currency || 'INR'
      };
    } catch (err: any) {
      console.error('[RazorpayProvider] Refund processing error:', err?.error?.description || err.message);
      return {
        success: false,
        error: err?.error?.description || err.message || 'Refund processing failed'
      };
    }
  }
}
