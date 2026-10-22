import crypto from 'crypto';
import { CashfreeProvider } from '../server/reviewflow/payments/cashfree.provider.ts';
import { paymentGatewayRegistry } from '../server/reviewflow/payments/index.ts';
import { reviewFlowStore } from '../server/reviewflow/store.ts';

async function runTests() {
  console.log('====================================================');
  console.log('🧪 QORBIQ AI / CASHFREE & PAYMENT INTEGRATION TESTS');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(title: string, condition: boolean, detail?: string) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${title}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${title} - Detail: ${detail || 'Assertion failed'}`);
    }
  }

  // ----------------------------------------------------------------
  // Test 1: Gateway Registry & Active Provider Resolution
  // ----------------------------------------------------------------
  console.log('--- 1. Gateway Registry Tests ---');
  try {
    const cfProvider = paymentGatewayRegistry.getProvider('CASHFREE');
    assert('Cashfree provider is registered and resolved', cfProvider.name === 'CASHFREE');

    const rzpProvider = paymentGatewayRegistry.getProvider('RAZORPAY');
    assert('Razorpay provider is registered and resolved', rzpProvider.name === 'RAZORPAY');

    const activeGateway = paymentGatewayRegistry.getActiveGatewayName();
    assert('Active gateway is resolved correctly', activeGateway === 'CASHFREE' || activeGateway === 'RAZORPAY');
  } catch (err: any) {
    assert('Gateway Registry failed', false, err.message);
  }

  // ----------------------------------------------------------------
  // Test 2: Validation of Missing / Placeholder Credentials
  // ----------------------------------------------------------------
  console.log('\n--- 2. Missing & Placeholder Credentials Validation ---');
  try {
    const dummyProvider = new CashfreeProvider();
    let threwError = false;
    let errorMsg = '';
    try {
      // Should reject placeholder 'your_cashfree_app_id'
      await dummyProvider.createSubscriptionIntent({
        planId: 'reviewflow_unlimited',
        billingInterval: 'monthly',
        amount: 999,
        currency: 'INR',
        userId: 'test_user_123'
      });
    } catch (e: any) {
      threwError = true;
      errorMsg = e.message;
    }
    assert('Rejects placeholder/missing credentials securely', threwError);
    assert('Error message specifically points out credentials', errorMsg.includes('Cashfree'));
  } catch (err: any) {
    assert('Credentials check failed', false, err.message);
  }

  // ----------------------------------------------------------------
  // Test 3: Cryptographic Webhook Signature Verification
  // ----------------------------------------------------------------
  console.log('\n--- 3. Cryptographic Webhook Signature Verification ---');
  try {
    const testSecret = 'cf_secret_key_testing_1234567890';
    process.env.CASHFREE_SECRET_KEY = testSecret;

    const cf = new CashfreeProvider();
    const rawBody = JSON.stringify({
      type: 'PAYMENT_SUCCESS_WEBHOOK',
      data: {
        order: { order_id: 'order_cf_test_999', order_amount: 999.00, order_currency: 'INR' },
        payment: { cf_payment_id: 888777, payment_status: 'SUCCESS' }
      }
    });

    const timestamp = Date.now().toString();
    const signedPayload = timestamp + rawBody;
    const validSignature = crypto
      .createHmac('sha256', testSecret)
      .update(signedPayload)
      .digest('base64');

    const isValid = cf.verifyWebhookSignature(rawBody, validSignature, timestamp);
    assert('Valid HMAC-SHA256 signature is accepted', isValid === true);

    const isTamperedInvalid = cf.verifyWebhookSignature(rawBody, 'invalid_signature_xyz', timestamp);
    assert('Tampered signature is strictly rejected', isTamperedInvalid === false);

    const isTamperedBodyInvalid = cf.verifyWebhookSignature(rawBody + 'tampered', validSignature, timestamp);
    assert('Tampered body with original signature is strictly rejected', isTamperedBodyInvalid === false);
  } catch (err: any) {
    assert('Signature verification test failed', false, err.message);
  }

  // ----------------------------------------------------------------
  // Test 4: Webhook Event Parsing & Normalization
  // ----------------------------------------------------------------
  console.log('\n--- 4. Webhook Event Normalization ---');
  try {
    const cf = new CashfreeProvider();

    // 4a. Order Paid Success
    const paidEvent = cf.parseWebhookEvent({
      type: 'PAYMENT_SUCCESS_WEBHOOK',
      data: {
        order: { order_id: 'order_cf_paid_123', order_amount: 999 },
        payment: { cf_payment_id: 10101 }
      }
    });
    assert('PAYMENT_SUCCESS_WEBHOOK normalizes to PAID', paidEvent?.status === 'PAID' && paidEvent?.orderId === 'order_cf_paid_123');

    // 4b. Subscription Status Change (Active)
    const subActiveEvent = cf.parseWebhookEvent({
      type: 'SUBSCRIPTION_STATUS_CHANGE_WEBHOOK',
      data: {
        subscription: { subscription_id: 'sub_cf_123', subscription_status: 'ACTIVE', plan_recurring_amount: 999 }
      }
    });
    assert('SUBSCRIPTION_STATUS_CHANGE_WEBHOOK (ACTIVE) normalizes to PAID', subActiveEvent?.status === 'PAID');

    // 4c. Subscription Status Change (Cancelled)
    const subCancelEvent = cf.parseWebhookEvent({
      type: 'SUBSCRIPTION_STATUS_CHANGE_WEBHOOK',
      data: {
        subscription: { subscription_id: 'sub_cf_123', subscription_status: 'CANCELLED' }
      }
    });
    assert('SUBSCRIPTION_STATUS_CHANGE_WEBHOOK (CANCELLED) normalizes to CANCELLED', subCancelEvent?.status === 'CANCELLED');

    // 4d. Refund Processed
    const refundEvent = cf.parseWebhookEvent({
      type: 'REFUND_STATUS_WEBHOOK',
      data: {
        refund: { order_id: 'order_cf_paid_123', cf_refund_id: 'rf_999', refund_amount: 999 }
      }
    });
    assert('REFUND_STATUS_WEBHOOK normalizes to REFUNDED', refundEvent?.status === 'REFUNDED');
  } catch (err: any) {
    assert('Event normalization failed', false, err.message);
  }

  // ----------------------------------------------------------------
  // Test 5: Database Idempotency & Duplicate Prevention
  // ----------------------------------------------------------------
  console.log('\n--- 5. Database Idempotency & Duplicate Prevention ---');
  try {
    const testUserId = 'test_user_idempotent_' + Date.now();
    const idempotencyKey = 'idem_key_' + Date.now();

    // Step 5a: Create initial payment intent
    const payment1 = reviewFlowStore.createPaymentIntent({
      userId: testUserId,
      planId: 'reviewflow_unlimited',
      amount: 999,
      currency: 'INR',
      billingInterval: 'monthly',
      idempotencyKey,
      gateway: 'CASHFREE',
      cashfreeOrderId: 'order_cf_idem_123'
    });
    assert('Initial payment intent created successfully', Boolean(payment1.id));

    // Step 5b: Re-submit same intent with same idempotencyKey -> must return identical payment
    const payment2 = reviewFlowStore.createPaymentIntent({
      userId: testUserId,
      planId: 'reviewflow_unlimited',
      amount: 999,
      currency: 'INR',
      billingInterval: 'monthly',
      idempotencyKey,
      gateway: 'CASHFREE',
      cashfreeOrderId: 'order_cf_idem_123'
    });
    assert('Duplicate payment creation prevented via idempotency key', payment1.id === payment2.id);

    // Step 5c: Activation and provisioning
    const activation = await reviewFlowStore.verifyPaymentAndActivate({
      paymentId: payment1.id,
      userId: testUserId,
      gateway: 'CASHFREE',
      cfOrderId: 'order_cf_idem_123',
      cfPaymentId: 'pay_cf_12345',
      autoBypassSigCheck: true
    });
    assert('Payment activation succeeds and provisions business', activation.success && Boolean(activation.business?.id));
    assert('Newly provisioned business requires onboarding (NOT_STARTED)', activation.business?.onboardingStatus === 'NOT_STARTED');

    // Step 5d: Duplicate activation call -> must return same business without creating a duplicate
    const duplicateActivation = await reviewFlowStore.verifyPaymentAndActivate({
      paymentId: payment1.id,
      userId: testUserId,
      gateway: 'CASHFREE',
      cfOrderId: 'order_cf_idem_123',
      cfPaymentId: 'pay_cf_12345',
      autoBypassSigCheck: true
    });
    assert('Duplicate business activation prevented (idempotent)', duplicateActivation.business?.id === activation.business?.id);
  } catch (err: any) {
    assert('Idempotency tests failed', false, err.message);
  }

  // ----------------------------------------------------------------
  // Test 6: Cross-User Authorization & Isolation
  // ----------------------------------------------------------------
  console.log('\n--- 6. Cross-User Authorization & Isolation ---');
  try {
    const userA = 'user_owner_A_' + Date.now();
    const userB = 'attacker_user_B_' + Date.now();

    const paymentA = reviewFlowStore.createPaymentIntent({
      userId: userA,
      planId: 'reviewflow_unlimited',
      amount: 999,
      currency: 'INR',
      billingInterval: 'monthly',
      gateway: 'CASHFREE',
      cashfreeOrderId: 'order_cf_usera_123'
    });

    // Attacker User B tries to verify User A's payment
    const unauthorizedAttempt = await reviewFlowStore.verifyPaymentAndActivate({
      paymentId: paymentA.id,
      userId: userB,
      gateway: 'CASHFREE',
      cfOrderId: 'order_cf_usera_123'
    });

    assert('Cross-user payment activation blocked (UNAUTHORIZED_PAYMENT)', unauthorizedAttempt.success === false && unauthorizedAttempt.error === 'UNAUTHORIZED_PAYMENT');
  } catch (err: any) {
    assert('Cross-user isolation check failed', false, err.message);
  }

  // ----------------------------------------------------------------
  // Summary
  // ----------------------------------------------------------------
  console.log('\n====================================================');
  console.log(`📊 TEST RESULTS: ${passed} / ${total} checks passed (${Math.round((passed / total) * 100)}%)`);
  console.log('====================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error('Test runner fatal error:', e);
  process.exit(1);
});
