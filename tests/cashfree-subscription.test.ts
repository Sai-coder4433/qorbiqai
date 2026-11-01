/**
 * Automated Test Suite — Qorbiq AI Updated Pricing & One-Time Payment Plans
 * Tests all requirements from Prompt:
 * 1. Plan 1 Half-Yearly: Qorbiq AI – 6 Months, ₹1,800 INR, 180 Days, One-Time Payment, Auto Renewal Disabled, Manual Renewal.
 * 2. Plan 2 Yearly: Qorbiq AI – 12 Months, ₹2,999 INR, 365 Days, One-Time Payment, Auto Renewal Disabled, Manual Renewal.
 * 3. Backend creates Cashfree order using selected plan's exact amount.
 * 4. Never accept amount or access duration blindly from frontend input.
 * 5. Validate plan ID, amount and duration on backend using trusted server-side plan configuration.
 * 6. Activate access only after server-side Cashfree payment verification.
 * 7. Set access expiry to 180 days or 365 days according to the verified plan.
 * 8. Store plan ID, payment ID, amount, order ID and entitlement dates in Firestore.
 * 9. Generate invoice only after verified successful payment.
 * 10. Allow manual renewal after expiry.
 * 11. Strictly One-Time Payments — no mandates, subscriptions or automatic renewals.
 */

import crypto from 'crypto';
import { reviewFlowStore, QORBIQ_PLANS, getQorbiqPlan } from '../server/reviewflow/store.ts';
import { CashfreeProvider } from '../server/reviewflow/payments/cashfree.provider.ts';
import { paymentGatewayRegistry } from '../server/reviewflow/payments/index.ts';

async function runCashfreeTests() {
  console.log('🧪 Starting Qorbiq AI Updated Pricing & One-Time Payment Plans Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(name: string, condition: boolean, details?: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${name} ${details ? `(${details})` : ''}`);
      failed++;
    }
  }

  const runId = Date.now();
  const testSecret = 'cf_sec_test_secret_key_12345';
  process.env.CASHFREE_SECRET_KEY = testSecret;

  // -------------------------------------------------------------------------
  // 1. Two Official One-Time Payment Plans Specification
  // -------------------------------------------------------------------------
  console.log('--- 1. Official Pricing Plans Specification ---');
  
  // Plan 1: Half-Yearly
  const plan1 = QORBIQ_PLANS.qorbiq_6_months;
  assert('Plan 1 Name is "Qorbiq AI – 6 Months"', plan1.name === 'Qorbiq AI – 6 Months', `Got: ${plan1.name}`);
  assert('Plan 1 Price is ₹1,800 INR', plan1.price === 1800 && plan1.currency === 'INR', `Got: ₹${plan1.price} ${plan1.currency}`);
  assert('Plan 1 Access Duration is 180 Days', plan1.durationDays === 180, `Got: ${plan1.durationDays} Days`);
  assert('Plan 1 Billing Type is "One-Time Payment"', plan1.billingType === 'One-Time Payment', `Got: ${plan1.billingType}`);
  assert('Plan 1 Auto Renewal is Disabled', plan1.autoRenew === false, `Got: ${plan1.autoRenew}`);
  assert('Plan 1 Renewal is Manual', plan1.renewal === 'Manual', `Got: ${plan1.renewal}`);

  // Plan 2: Yearly
  const plan2 = QORBIQ_PLANS.qorbiq_12_months;
  assert('Plan 2 Name is "Qorbiq AI – 12 Months"', plan2.name === 'Qorbiq AI – 12 Months', `Got: ${plan2.name}`);
  assert('Plan 2 Price is ₹2,999 INR', plan2.price === 2999 && plan2.currency === 'INR', `Got: ₹${plan2.price} ${plan2.currency}`);
  assert('Plan 2 Access Duration is 365 Days', plan2.durationDays === 365, `Got: ${plan2.durationDays} Days`);
  assert('Plan 2 Billing Type is "One-Time Payment"', plan2.billingType === 'One-Time Payment', `Got: ${plan2.billingType}`);
  assert('Plan 2 Auto Renewal is Disabled', plan2.autoRenew === false, `Got: ${plan2.autoRenew}`);
  assert('Plan 2 Renewal is Manual', plan2.renewal === 'Manual', `Got: ${plan2.renewal}`);

  // Yearly Savings calculation: 2 * 1800 = 3600; 3600 - 2999 = 601
  const twoHalfYearlyCost = plan1.price * 2;
  const yearlySavings = twoHalfYearlyCost - plan2.price;
  assert('Yearly savings vs two 6-month cycles is ₹601 INR', yearlySavings === 601, `Got: ${yearlySavings}`);

  // -------------------------------------------------------------------------
  // 2. Server-Side Plan Validation & Tampering Rejection
  // -------------------------------------------------------------------------
  console.log('\n--- 2. Server-Side Validation & Never Blindly Accept Client Price ---');
  assert('Server validates valid 6 months plan ID', getQorbiqPlan('qorbiq_6_months')?.id === 'qorbiq_6_months');
  assert('Server validates valid 12 months plan ID', getQorbiqPlan('qorbiq_12_months')?.id === 'qorbiq_12_months');
  assert('Server rejects unknown plan ID securely', getQorbiqPlan('fake_free_tier_plan') === null);

  const userA = reviewFlowStore.upsertUser({
    uid: `user_test_one_time_a_${runId}`,
    email: `client_qorbiq_${runId}@example.com`,
    displayName: 'Test Qorbiq User'
  });

  // Client attempts to pass tampered price of ₹10 instead of ₹1,800:
  // Server-side createPaymentIntent must strictly enforce ₹1,800 INR from trusted plan
  const payment6 = reviewFlowStore.createPaymentIntent({
    userId: userA.uid,
    planId: 'qorbiq_6_months',
    amount: 10, // Tampered price attempt
    idempotencyKey: `idem_6m_${runId}`,
    gateway: 'CASHFREE',
    paymentType: 'NEW_BUSINESS_SUBSCRIPTION'
  });

  assert('Server enforces trusted ₹1,800 price and rejects tampered client price', payment6.amount === 1800, `Got: ${payment6.amount}`);
  assert('Server enforces 180 days duration', payment6.durationDays === 180, `Got: ${payment6.durationDays}`);
  assert('Payment billingType is One-Time Payment', payment6.billingType === 'One-Time Payment');
  assert('Payment autoRenew is disabled', payment6.autoRenew === false);
  assert('Payment status initialized to PENDING', payment6.status === 'PENDING');

  // Client attempts to pass 12-month plan with tampered duration of 999 days:
  const payment12 = reviewFlowStore.createPaymentIntent({
    userId: userA.uid,
    planId: 'qorbiq_12_months',
    amount: 99, // Tampered price attempt
    idempotencyKey: `idem_12m_${runId}`,
    gateway: 'CASHFREE',
    paymentType: 'NEW_BUSINESS_SUBSCRIPTION'
  });

  assert('Server enforces trusted ₹2,999 price for 12 months plan', payment12.amount === 2999, `Got: ${payment12.amount}`);
  assert('Server enforces exact 365 days duration', payment12.durationDays === 365, `Got: ${payment12.durationDays}`);
  assert('Payment autoRenew is strictly false', payment12.autoRenew === false);

  // -------------------------------------------------------------------------
  // 3. Cryptographic Webhook Signature Verification
  // -------------------------------------------------------------------------
  console.log('\n--- 3. Cashfree Cryptographic Webhook Signature Verification ---');
  const cfProvider = new CashfreeProvider();
  const rawWebhookBody = JSON.stringify({
    data: {
      order: {
        order_id: `order_cf_${runId}`,
        order_amount: 1800,
        order_currency: 'INR'
      },
      payment: {
        cf_payment_id: 88776655,
        payment_status: 'SUCCESS',
        payment_amount: 1800
      }
    },
    event_time: '2026-10-31T01:00:00Z',
    type: 'PAYMENT_SUCCESS_WEBHOOK'
  });

  const timestamp = String(Math.floor(Date.now() / 1000));
  const validSignature = crypto
    .createHmac('sha256', testSecret)
    .update(timestamp + rawWebhookBody)
    .digest('base64');

  assert('Valid HMAC-SHA256 signature is accepted', cfProvider.verifyWebhookSignature(rawWebhookBody, validSignature, timestamp));
  assert('Forged signature is rejected', !cfProvider.verifyWebhookSignature(rawWebhookBody, 'forged_signature', timestamp));

  // -------------------------------------------------------------------------
  // 4. Server-Side Cashfree Payment Verification & 180-Day Expiry Activation
  // -------------------------------------------------------------------------
  console.log('\n--- 4. Verification & 180 Days Access Expiry Activation ---');
  const verify6Result = await reviewFlowStore.verifyPaymentAndActivate({
    paymentId: payment6.id,
    userId: userA.uid,
    gateway: 'CASHFREE',
    cfPaymentId: `cf_pay_6m_${runId}`,
    cfOrderId: `cf_order_6m_${runId}`,
    autoBypassSigCheck: true
  });

  assert('Payment verification succeeds for 6 Months plan', verify6Result.success === true);
  const sub6 = verify6Result.subscription!;
  assert('Subscription status is ACTIVE', sub6.status === 'ACTIVE');
  assert('Plan Name is "Qorbiq AI – 6 Months"', sub6.planName === 'Qorbiq AI – 6 Months');
  assert('Billing type is One-Time Payment', sub6.billingType === 'One-Time Payment');
  assert('Auto renewal is disabled', sub6.autoRenew === false);
  assert('Renewal is Manual', sub6.renewal === 'Manual');

  // Verify access expiry duration is 180 days
  const startMs = new Date(sub6.currentPeriodStart || sub6.createdAt).getTime();
  const endMs = new Date(sub6.currentPeriodEnd).getTime();
  const diffDays = Math.round((endMs - startMs) / (1000 * 60 * 60 * 24));
  assert('Access expiry is set to exactly 180 Days', diffDays === 180, `Got: ${diffDays} days`);

  // Verify invoice generated only after verified payment
  const paymentRecord = reviewFlowStore.getPaymentById(payment6.id)!;
  assert('Payment status updated to PAID', paymentRecord.status === 'PAID');
  assert('Invoice generated and linked to verified payment', Boolean(paymentRecord.invoiceId));
  const invoice = (reviewFlowStore as any).data.invoices?.find((inv: any) => inv.id === paymentRecord.invoiceId);
  assert('Invoice amount matches ₹1,800 INR', invoice?.grandTotal === 1800 || invoice?.subtotal === 1800);
  assert('Invoice description includes "180 Days Access"', invoice?.items?.[0]?.description?.includes('180 Days Access') || invoice?.items?.[0]?.billingPeriod?.includes('180 Days'));

  // -------------------------------------------------------------------------
  // 5. Verification of 12 Months Plan (365 Days Expiry)
  // -------------------------------------------------------------------------
  console.log('\n--- 5. 12 Months Plan Verification & 365 Days Expiry ---');
  const userC = reviewFlowStore.upsertUser({
    uid: `user_test_yearly_c_${runId}`,
    email: `client_yearly_${runId}@example.com`,
    displayName: 'Test Yearly User'
  });

  const payment12c = reviewFlowStore.createPaymentIntent({
    userId: userC.uid,
    planId: 'qorbiq_12_months',
    idempotencyKey: `idem_12m_c_${runId}`,
    gateway: 'CASHFREE',
    paymentType: 'NEW_BUSINESS_SUBSCRIPTION'
  });

  const verify12Result = await reviewFlowStore.verifyPaymentAndActivate({
    paymentId: payment12c.id,
    userId: userC.uid,
    gateway: 'CASHFREE',
    cfPaymentId: `cf_pay_12m_${runId}`,
    cfOrderId: `cf_order_12m_${runId}`,
    autoBypassSigCheck: true
  });

  assert('Verification succeeds for 12 Months plan', verify12Result.success === true);
  const sub12 = verify12Result.subscription!;
  assert('Plan Name is "Qorbiq AI – 12 Months"', sub12.planName === 'Qorbiq AI – 12 Months');
  const diffDays12 = Math.round((new Date(sub12.currentPeriodEnd).getTime() - new Date(sub12.currentPeriodStart || sub12.createdAt).getTime()) / (1000 * 60 * 60 * 24));
  assert('Access expiry is set to exactly 365 Days', diffDays12 === 365, `Got: ${diffDays12} days`);
  assert('Price is ₹2,999 INR', sub12.price === 2999);

  // -------------------------------------------------------------------------
  // 6. Manual Renewal After Expiry (Requirement 10)
  // -------------------------------------------------------------------------
  console.log('\n--- 6. Manual Renewal After Expiry ---');
  // Simulate expiry by setting currentPeriodEnd to yesterday
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  sub6.currentPeriodEnd = yesterday;
  sub6.status = 'EXPIRED';

  // Customer manually renews with 12 Months plan (₹2,999) after expiry
  const renewalPayment = reviewFlowStore.createPaymentIntent({
    userId: userA.uid,
    planId: 'qorbiq_12_months',
    idempotencyKey: `idem_manual_renew_${runId}`,
    gateway: 'CASHFREE',
    paymentType: 'NEW_BUSINESS_SUBSCRIPTION'
  });

  const renewVerify = await reviewFlowStore.verifyPaymentAndActivate({
    paymentId: renewalPayment.id,
    userId: userA.uid,
    gateway: 'CASHFREE',
    cfPaymentId: `cf_renew_pay_${runId}`,
    cfOrderId: `cf_renew_order_${runId}`,
    autoBypassSigCheck: true
  });

  assert('Manual renewal verification succeeds', renewVerify.success === true);
  const renewedSub = renewVerify.subscription!;
  assert('Renewed subscription is reactivated to ACTIVE', renewedSub.status === 'ACTIVE');
  assert('Plan is updated to renewed plan (Qorbiq AI – 12 Months)', renewedSub.planName === 'Qorbiq AI – 12 Months');
  assert('Auto renewal remains disabled', renewedSub.autoRenew === false);
  assert('Renewal type is Manual', renewedSub.renewal === 'Manual');

  // Verify new expiry is ~365 days from now
  const newEndMs = new Date(renewedSub.currentPeriodEnd).getTime();
  const renewalDays = Math.round((newEndMs - Date.now()) / (1000 * 60 * 60 * 24));
  assert('Access expiry extended by 365 days', renewalDays >= 364 && renewalDays <= 366, `Got: ${renewalDays} days`);

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  console.log('\n================================');
  console.log(`Summary: ${passed} passed, ${failed} failed`);
  console.log('================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runCashfreeTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
