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

export class CashfreeProvider implements IPaymentGatewayProvider {
  readonly name = 'CASHFREE' as const;

  private getAppId(): string {
    return (process.env.CASHFREE_APP_ID || process.env.CASHFREE_CLIENT_ID || '').trim();
  }

  private getSecretKey(): string {
    return (process.env.CASHFREE_SECRET_KEY || process.env.CASHFREE_CLIENT_SECRET || '').trim();
  }

  private getEnvironment(): 'sandbox' | 'production' {
    const env = (process.env.CASHFREE_ENV || 'sandbox').toLowerCase().trim();
    return env === 'production' ? 'production' : 'sandbox';
  }

  private getBaseUrl(): string {
    return this.getEnvironment() === 'production'
      ? 'https://api.cashfree.com'
      : 'https://sandbox.cashfree.com';
  }

  private getApiVersion(): string {
    return (process.env.CASHFREE_API_VERSION || '2023-08-01').trim();
  }

  private getAppBaseUrl(): string {
    return (process.env.APP_BASE_URL || process.env.APP_URL || 'http://localhost:3000').replace(/\/+$/, '');
  }

  public getPublishableKey(): string {
    return this.getAppId();
  }

  private validateCredentials(): void {
    const appId = this.getAppId();
    if (!appId || appId.includes('your_cashfree_app_id') || appId === 'placeholder') {
      throw new Error(
        'Cashfree App ID is missing or set to placeholder. Please configure CASHFREE_APP_ID in your server environment.'
      );
    }

    const secretKey = this.getSecretKey();
    if (!secretKey || secretKey.includes('your_cashfree_secret_key') || secretKey === 'placeholder') {
      throw new Error(
        'Cashfree Secret Key is missing or set to placeholder. Please configure CASHFREE_SECRET_KEY in your server environment.'
      );
    }
  }

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'x-client-id': this.getAppId(),
      'x-client-secret': this.getSecretKey(),
      'x-api-version': this.getApiVersion(),
      'x-request-id': crypto.randomUUID()
    };
  }

  /**
   * Cleans and formats phone numbers to standard 10-digit Indian mobile number for Cashfree
   */
  private formatPhoneNumber(rawPhone?: string): string {
    if (!rawPhone) return '9999999999';
    const digits = rawPhone.replace(/\D/g, '');
    if (digits.length >= 10) {
      return digits.slice(-10);
    }
    return digits.padEnd(10, '0');
  }

  /**
   * Step 1: Create Cashfree Subscription or Payment Gateway Order Intent
   */
  public async createSubscriptionIntent(
    options: CreateSubscriptionIntentOptions
  ): Promise<PaymentIntentResult> {
    this.validateCredentials();

    const paymentId = 'pay_cf_' + crypto.randomBytes(8).toString('hex');
    const customerPhone = this.formatPhoneNumber(options.customerPhone);
    const customerEmail = (options.customerEmail || 'billing@qorbiq.ai').trim();
    const customerName = (options.customerName || 'Subscriber').trim();
    const appBaseUrl = this.getAppBaseUrl();

    // Prefer Recurring Subscription if billingModel is 'SUBSCRIPTION' or when configured
    const useSubscriptionModel = options.billingModel === 'SUBSCRIPTION';

    if (useSubscriptionModel) {
      try {
        const subResult = await this.createRecurringSubscription(options, {
          paymentId,
          customerEmail,
          customerPhone,
          customerName,
          appBaseUrl
        });
        return subResult;
      } catch (subErr: any) {
        console.warn('[CashfreeProvider] Subscription creation fallback notice:', subErr.message);
        // If merchant account doesn't have Subscriptions enabled, fallback to Payment Gateway Order
      }
    }

    // Default & Direct: Cashfree Payment Gateway Order
    return await this.createPgOrder(options, {
      paymentId,
      customerEmail,
      customerPhone,
      customerName,
      appBaseUrl
    });
  }

  /**
   * Cashfree Payment Gateway Order Creation (/pg/orders)
   * Produces payment_session_id for seamless hosted checkout via Cashfree JS SDK
   */
  private async createPgOrder(
    options: CreateSubscriptionIntentOptions,
    meta: {
      paymentId: string;
      customerEmail: string;
      customerPhone: string;
      customerName: string;
      appBaseUrl: string;
    }
  ): Promise<PaymentIntentResult> {
    const orderId = 'order_cf_' + crypto.randomBytes(8).toString('hex');
    const returnUrl = options.returnUrl || `${meta.appBaseUrl}/billing/return?order_id={order_id}&payment_id=${meta.paymentId}`;
    const notifyUrl = `${meta.appBaseUrl}/api/webhooks/cashfree`;

    const requestBody = {
      order_id: orderId,
      order_amount: Math.round(options.amount * 100) / 100,
      order_currency: options.currency || 'INR',
      customer_details: {
        customer_id: `cust_${options.userId.substring(0, 20)}`,
        customer_email: meta.customerEmail,
        customer_phone: meta.customerPhone,
        customer_name: meta.customerName
      },
      order_meta: {
        return_url: returnUrl,
        notify_url: notifyUrl,
        payment_methods: 'cc,dc,upi,nb,app'
      },
      order_note: `Qorbiq AI Subscription (${options.billingInterval})`,
      order_tags: {
        userId: options.userId,
        planId: options.planId,
        billingInterval: options.billingInterval,
        paymentId: meta.paymentId,
        idempotencyKey: options.idempotencyKey || ''
      }
    };

    const response = await fetch(`${this.getBaseUrl()}/pg/orders`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(requestBody)
    });

    const data: any = await response.json();

    if (!response.ok || data.type === 'error' || data.code) {
      console.error('[CashfreeProvider] Create order error response:', data);
      const errMsg = data.message || data.error?.message || `Cashfree Order API failed with status ${response.status}`;
      throw new Error(errMsg);
    }

    return {
      provider: 'CASHFREE',
      paymentId: meta.paymentId,
      orderId: data.order_id || orderId,
      paymentSessionId: data.payment_session_id,
      environment: this.getEnvironment(),
      amount: options.amount,
      currency: options.currency || 'INR',
      keyId: this.getPublishableKey(),
      planId: options.planId,
      billingInterval: options.billingInterval,
      businessName: options.businessName || 'Qorbiq AI Subscription',
      description: `Qorbiq AI Unlimited (${options.billingInterval === 'yearly' ? 'Yearly' : 'Monthly'})`
    };
  }

  /**
   * Cashfree Subscriptions (Recurring Mandate) Flow (/pg/plans + /pg/subscriptions)
   */
  private async createRecurringSubscription(
    options: CreateSubscriptionIntentOptions,
    meta: {
      paymentId: string;
      customerEmail: string;
      customerPhone: string;
      customerName: string;
      appBaseUrl: string;
    }
  ): Promise<PaymentIntentResult> {
    const planId = `qorbiq_${options.planId}_${options.billingInterval}_${Math.round(options.amount)}`.substring(0, 40);

    // 1. Ensure Plan exists or create it
    try {
      const planRes = await fetch(`${this.getBaseUrl()}/pg/plans`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          plan_id: planId,
          plan_name: options.billingInterval === 'yearly' ? 'Qorbiq AI Yearly Plan' : 'Qorbiq AI Monthly Plan',
          plan_type: 'PERIODIC',
          plan_currency: options.currency || 'INR',
          plan_recurring_amount: Math.round(options.amount * 100) / 100,
          plan_max_amount: Math.round(options.amount * 100) / 100,
          plan_max_cycles: options.billingInterval === 'yearly' ? 10 : 120,
          plan_intervals: 1,
          plan_interval_type: options.billingInterval === 'yearly' ? 'YEAR' : 'MONTH',
          plan_note: options.billingInterval === 'yearly'
            ? 'Qorbiq AI Yearly Subscription (₹2,999/yr)'
            : 'Qorbiq AI Monthly Subscription (₹299/mo)'
        })
      });
      if (!planRes.ok && planRes.status !== 409) {
        const planErr = await planRes.json().catch(() => ({}));
        console.warn('[CashfreeProvider] Plan creation notice:', planErr);
      }
    } catch (e: any) {
      console.warn('[CashfreeProvider] Plan check warning:', e.message);
    }

    // 2. Create Subscription
    const subscriptionId = 'sub_cf_' + crypto.randomBytes(8).toString('hex');
    const returnUrl = options.returnUrl || `${meta.appBaseUrl}/billing/return?subscription_id={subscription_id}&payment_id=${meta.paymentId}`;

    const subBody = {
      subscription_id: subscriptionId,
      customer_details: {
        customer_id: `cust_${options.userId.substring(0, 20)}`,
        customer_name: meta.customerName,
        customer_email: meta.customerEmail,
        customer_phone: meta.customerPhone
      },
      plan_details: {
        plan_id: planId
      },
      authorization_details: {
        authorization_amount: Math.round(options.amount * 100) / 100,
        authorization_amount_refund: false,
        payment_methods: ['upi', 'card', 'enach']
      },
      subscription_meta: {
        return_url: returnUrl,
        notification_channel: ['EMAIL', 'SMS']
      },
      subscription_note: `Qorbiq AI ${options.billingInterval} subscription`
    };

    const subRes = await fetch(`${this.getBaseUrl()}/pg/subscriptions`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(subBody)
    });

    const subData: any = await subRes.json();

    if (!subRes.ok || subData.type === 'error' || subData.code) {
      throw new Error(subData.message || 'Failed to create Cashfree Subscription.');
    }

    return {
      provider: 'CASHFREE',
      paymentId: meta.paymentId,
      subscriptionId: subData.subscription_id || subscriptionId,
      authLink: subData.auth_link,
      environment: this.getEnvironment(),
      amount: options.amount,
      currency: options.currency || 'INR',
      keyId: this.getPublishableKey(),
      planId: options.planId,
      billingInterval: options.billingInterval,
      businessName: options.businessName || 'Qorbiq AI Subscription',
      description: `Qorbiq AI Unlimited (${options.billingInterval})`
    };
  }

  /**
   * Cancel Subscription on Cashfree
   * Official Cashfree Subscriptions manage endpoint: POST /pg/subscriptions/{id}/manage with action CANCEL
   */
  public async cancelSubscription(
    subscriptionId: string,
    reason = 'Customer requested cancellation'
  ): Promise<{ success: boolean; error?: string; localOnly?: boolean }> {
    const appId = this.getAppId();
    if (!appId || appId.includes('your_cashfree_app_id') || appId === 'placeholder') {
      return { success: true, localOnly: true };
    }

    try {
      const response = await fetch(`${this.getBaseUrl()}/pg/subscriptions/${subscriptionId}/manage`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          subscription_id: subscriptionId,
          action: 'CANCEL'
        })
      });

      const data: any = await response.json().catch(() => ({}));

      if (!response.ok && response.status !== 200) {
        // Fallback to legacy endpoint if manage route is unsupported
        const altRes = await fetch(`${this.getBaseUrl()}/pg/subscriptions/${subscriptionId}/cancel`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ cancel_reason: reason })
        });
        if (!altRes.ok) {
          const altData = await altRes.json().catch(() => ({}));
          return {
            success: false,
            error: data.message || altData.message || `Cashfree subscription cancel failed with status ${response.status}`
          };
        }
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Step 2: Server-side Verification of Payment/Order or Subscription
   * Queries Cashfree API directly to prevent trusting client-side parameters.
   * Does NOT assume successful authorization always means payment collected.
   */
  public async verifyPaymentSignature(
    params: VerifyPaymentParams
  ): Promise<PaymentVerificationResult> {
    this.validateCredentials();

    const orderId = params.cfOrderId || params.providerOrderId;
    const subscriptionId = params.cfSubscriptionId || params.providerSubscriptionId;

    // 1. Verify via Subscription if subscriptionId provided
    if (subscriptionId) {
      try {
        const subRes = await fetch(`${this.getBaseUrl()}/pg/subscriptions/${subscriptionId}`, {
          method: 'GET',
          headers: this.getHeaders()
        });

        if (subRes.ok) {
          const subData: any = await subRes.json();
          const subStatus = (subData.subscription_status || '').toUpperCase();

          if (subStatus === 'INITIALIZED' || subStatus === 'BANK_APPROVAL_PENDING') {
            return {
              valid: false,
              isPending: true,
              subscriptionStatus: subStatus,
              error: `Subscription mandate is ${subStatus === 'INITIALIZED' ? 'pending customer authorization' : 'undergoing bank processing'}. Recurring payment not yet collected.`
            };
          }

          if (subStatus === 'ACTIVE') {
            // Check if initial payment has been collected
            let isPaymentCollected = false;
            let collectedPaymentId = subData.subscription_id;
            try {
              const paymentsRes = await fetch(`${this.getBaseUrl()}/pg/subscriptions/${subscriptionId}/payments`, {
                method: 'GET',
                headers: this.getHeaders()
              });
              if (paymentsRes.ok) {
                const paymentsList: any[] = await paymentsRes.json();
                if (Array.isArray(paymentsList)) {
                  const successfulPayment = paymentsList.find(
                    p => (p.payment_status || p.status || '').toUpperCase() === 'SUCCESS'
                  );
                  if (successfulPayment) {
                    isPaymentCollected = true;
                    collectedPaymentId = String(successfulPayment.cf_payment_id || successfulPayment.payment_id || collectedPaymentId);
                  }
                }
              }
            } catch (payErr: any) {
              console.warn('[CashfreeProvider] Subscription payments fetch warning:', payErr.message);
            }

            if (isPaymentCollected) {
              return {
                valid: true,
                subscriptionStatus: 'ACTIVE',
                providerPaymentId: collectedPaymentId
              };
            }

            return {
              valid: false,
              isPending: true,
              subscriptionStatus: 'ACTIVE',
              error: 'Mandate is active, but initial payment collection is pending confirmation from bank.'
            };
          }

          if (subStatus === 'CANCELLED' || subStatus === 'FAILED' || subStatus === 'ON_HOLD') {
            return {
              valid: false,
              subscriptionStatus: subStatus,
              error: `Cashfree subscription is ${subStatus}.`
            };
          }
        }
      } catch (subErr: any) {
        console.warn('[CashfreeProvider] Subscription check warning:', subErr.message);
      }
    }

    // 2. Verify via Order if orderId provided
    if (orderId) {
      try {
        const orderRes = await fetch(`${this.getBaseUrl()}/pg/orders/${orderId}`, {
          method: 'GET',
          headers: this.getHeaders()
        });

        if (!orderRes.ok) {
          const errData = await orderRes.json().catch(() => ({}));
          return {
            valid: false,
            error: errData.message || `Cashfree Order check failed with status ${orderRes.status}`
          };
        }

        const orderData: any = await orderRes.json();
        const orderStatus = (orderData.order_status || '').toUpperCase();

        if (orderStatus === 'PAID') {
          let cfPaymentId = params.cfPaymentId || params.providerPaymentId;
          try {
            const paymentsRes = await fetch(`${this.getBaseUrl()}/pg/orders/${orderId}/payments`, {
              method: 'GET',
              headers: this.getHeaders()
            });
            if (paymentsRes.ok) {
              const paymentsData: any[] = await paymentsRes.json();
              if (Array.isArray(paymentsData)) {
                const successfulPayment = paymentsData.find(
                  p => (p.payment_status || '').toUpperCase() === 'SUCCESS'
                );
                if (successfulPayment) {
                  cfPaymentId = String(successfulPayment.cf_payment_id || successfulPayment.payment_id);
                }
              }
            }
          } catch {
            // Secondary payment detail fetch is non-fatal
          }

          return {
            valid: true,
            orderStatus: 'PAID',
            providerPaymentId: cfPaymentId || orderId
          };
        }

        if (orderStatus === 'EXPIRED' || orderStatus === 'TERMINATED') {
          return {
            valid: false,
            orderStatus,
            error: `Order has ${orderStatus.toLowerCase()}. Payment was not completed.`
          };
        }

        return {
          valid: false,
          isPending: orderStatus === 'ACTIVE',
          orderStatus,
          error: `Order status is "${orderStatus}". Payment is not yet completed.`
        };
      } catch (apiErr: any) {
        console.error('[CashfreeProvider] Order verification error:', apiErr.message);
        return {
          valid: false,
          error: `Error communicating with Cashfree API: ${apiErr.message}`
        };
      }
    }

    return {
      valid: false,
      error: 'Missing order_id or subscription_id for Cashfree verification.'
    };
  }

  /**
   * Cryptographic Webhook Signature Verification
   * Formula: Base64(HMAC_SHA256(timestamp + rawBody, secretKey))
   */
  public verifyWebhookSignature(
    rawBody: string | Buffer,
    signature: string,
    timestamp?: string
  ): boolean {
    const secretKey = this.getSecretKey();
    if (!secretKey || !signature) {
      return false;
    }

    try {
      const rawBodyStr = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');

      // Cashfree official: timestamp + rawBody
      if (timestamp) {
        const signedPayload = timestamp + rawBodyStr;
        const computedSignature = crypto
          .createHmac('sha256', secretKey)
          .update(signedPayload)
          .digest('base64');

        if (crypto.timingSafeEqual(Buffer.from(signature, 'utf8'), Buffer.from(computedSignature, 'utf8'))) {
          return true;
        }
      }

      // Fallback check: rawBody only (for legacy payloads)
      const computedLegacySignature = crypto
        .createHmac('sha256', secretKey)
        .update(rawBodyStr)
        .digest('base64');

      if (signature.length === computedLegacySignature.length) {
        return crypto.timingSafeEqual(
          Buffer.from(signature, 'utf8'),
          Buffer.from(computedLegacySignature, 'utf8')
        );
      }

      return false;
    } catch (err: any) {
      console.error('[CashfreeProvider] Webhook signature verification error:', err.message);
      return false;
    }
  }

  /**
   * Normalize Cashfree Webhook Events
   */
  public parseWebhookEvent(body: any): NormalizedWebhookEvent | null {
    if (!body) return null;

    const eventType = body.type || body.event || '';
    const data = body.data || body;
    const eventId = String(body.event_id || data.event_id || body.event_time || (eventType + '_' + (data.order?.order_id || data.subscription?.subscription_id || Date.now())));

    // 1. Payment Success
    if (
      eventType === 'PAYMENT_SUCCESS_WEBHOOK' ||
      eventType === 'ORDER_PAID_SUCCESS' ||
      eventType === 'PAYMENT_CAPTURED'
    ) {
      const order = data.order || data;
      const payment = data.payment || {};
      return {
        provider: 'CASHFREE',
        eventType,
        rawEvent: eventType,
        eventId,
        orderId: order.order_id,
        paymentId: payment.cf_payment_id ? String(payment.cf_payment_id) : undefined,
        amount: Number(order.order_amount || payment.payment_amount || 0),
        currency: order.order_currency || 'INR',
        status: 'PAID',
        metadata: data
      };
    }

    // 2. Subscription Payment Success (Recurring Renewal Debit)
    if (
      eventType === 'SUBSCRIPTION_PAYMENT_SUCCESS_WEBHOOK' ||
      eventType === 'SUBSCRIPTION_PAYMENT_SUCCESS'
    ) {
      const sub = data.subscription || data;
      const payment = data.payment || {};
      const resolvedPaymentId = payment.cf_payment_id || data.cf_payment_id || payment.payment_id || data.payment_id;
      const resolvedAmount = payment.payment_amount ?? data.payment_amount ?? sub.plan_recurring_amount ?? sub.amount ?? data.amount ?? 0;
      return {
        provider: 'CASHFREE',
        eventType,
        rawEvent: eventType,
        eventId,
        subscriptionId: sub.subscription_id || data.subscription_id,
        orderId: payment.order_id || sub.cf_order_id || data.cf_order_id,
        paymentId: resolvedPaymentId ? String(resolvedPaymentId) : undefined,
        amount: Number(resolvedAmount),
        currency: sub.plan_currency || data.currency || 'INR',
        status: 'RENEWED',
        metadata: data
      };
    }

    // 3. Subscription Status Changed / Mandate Authorization
    if (
      eventType === 'SUBSCRIPTION_STATUS_CHANGE_WEBHOOK' ||
      eventType === 'SUBSCRIPTION_STATUS_CHANGE' ||
      eventType === 'SUBSCRIPTION_STATUS_CHANGED' ||
      eventType === 'SUBSCRIPTION_AUTH_STATUS'
    ) {
      const sub = data.subscription || data;
      const subStatus = (sub.subscription_status || data.status || '').toUpperCase();
      let status: NormalizedWebhookEvent['status'] = 'PENDING';
      if (subStatus === 'ACTIVE') status = 'PAID';
      else if (subStatus === 'CANCELLED') status = 'CANCELLED';
      else if (subStatus === 'HALTED' || subStatus === 'SUSPENDED' || subStatus === 'ON_HOLD') status = 'HALTED';

      return {
        provider: 'CASHFREE',
        eventType,
        rawEvent: eventType,
        eventId,
        subscriptionId: sub.subscription_id,
        amount: Number(sub.plan_recurring_amount || sub.amount || 0),
        currency: sub.plan_currency || 'INR',
        status,
        metadata: data
      };
    }

    // 4. Payment Failed / User Dropped / Subscription Payment Failed
    if (
      eventType === 'PAYMENT_FAILED_WEBHOOK' ||
      eventType === 'ORDER_FAILED' ||
      eventType === 'PAYMENT_USER_DROPPED' ||
      eventType === 'SUBSCRIPTION_PAYMENT_FAILED' ||
      eventType === 'SUBSCRIPTION_PAYMENT_FAILED_WEBHOOK' ||
      eventType === 'SUBSCRIPTION_PAYMENT_DECLINED'
    ) {
      const order = data.order || data;
      const sub = data.subscription || data;
      return {
        provider: 'CASHFREE',
        eventType,
        rawEvent: eventType,
        eventId,
        orderId: order.order_id,
        subscriptionId: sub.subscription_id,
        status: 'FAILED',
        metadata: data
      };
    }

    // 5. Refund Processed
    if (eventType === 'REFUND_STATUS_WEBHOOK' || eventType === 'REFUND_PROCESSED') {
      const refund = data.refund || data;
      return {
        provider: 'CASHFREE',
        eventType,
        rawEvent: eventType,
        eventId,
        orderId: refund.order_id,
        refundId: refund.cf_refund_id ? String(refund.cf_refund_id) : refund.refund_id,
        refundAmount: Number(refund.refund_amount || 0),
        status: 'REFUNDED',
        metadata: data
      };
    }

    return null;
  }

  /**
   * Process Refund via Cashfree (/pg/orders/{order_id}/refunds)
   */
  public async processRefund(options: RefundOptions): Promise<RefundResult> {
    this.validateCredentials();

    if (!options.paymentId) {
      return { success: false, error: 'Payment ID is required for refund processing.' };
    }

    const refundId = 'rfnd_cf_' + crypto.randomBytes(6).toString('hex');
    const orderId = options.providerPaymentId || options.paymentId;

    try {
      const response = await fetch(`${this.getBaseUrl()}/pg/orders/${orderId}/refunds`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          refund_id: refundId,
          refund_amount: options.amount,
          refund_note: options.reason || 'Customer requested refund via Super Admin portal'
        })
      });

      const data: any = await response.json();

      if (!response.ok || data.type === 'error' || data.code) {
        return {
          success: false,
          error: data.message || `Cashfree refund failed with status ${response.status}`
        };
      }

      return {
        success: true,
        refundId: data.cf_refund_id ? String(data.cf_refund_id) : refundId,
        amount: data.refund_amount || options.amount,
        currency: data.refund_currency || 'INR'
      };
    } catch (err: any) {
      return {
        success: false,
        error: `Cashfree refund exception: ${err.message}`
      };
    }
  }
}
