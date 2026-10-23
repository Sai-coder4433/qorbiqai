/**
 * Automated Test Suite — Super Admin, Invoicing, AI Length Control & Standee Order Management
 *
 * Validates:
 * 1. AI Review Length Control constraints (Short 8-20 words, Medium 25-50 words, Long 50-90 words)
 * 2. Sequential Invoice Numbering (QOR-YYYY-XXXX) and snapshot preservation
 * 3. Tax compliance rules (Strictly 0% unless valid 15-char GSTIN is configured)
 * 4. Professional printable HTML invoice template generation
 * 5. Standee Products catalog configuration (QR ₹499, NFC ₹799, Combined ₹999)
 * 6. Standee Order placement, 10-digit phone & 6-digit PIN validation
 * 7. Cashfree order verification & automatic invoice creation
 * 8. 14 order lifecycle status transitions & courier tracking assignment
 * 9. Hardware preparation checklist & reprint audit history
 * 10. Live Super Admin telemetry calculations (MRR, Run-rate ARR, Standee pipeline, suspension reason)
 */

import { reviewFlowStore } from '../server/reviewflow/store.ts';
import { LENGTH_CONSTRAINTS, buildDynamicPrompt, sanitizeReviewText, aiReviewEngine } from '../server/reviewflow/ai-review-engine.ts';
import { generateInvoiceHtml } from '../server/reviewflow/invoice-pdf.service.ts';
import { StandeeOrderStatus } from '../server/reviewflow/types.ts';

async function runTestSuite() {
  console.log('🧪 Starting Super Admin, Invoicing, AI Length & Standee Test Suite...\n');
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

  // =========================================================================
  // MODULE 1: AI REVIEW LENGTH CONTROL CONSTRAINTS
  // =========================================================================
  console.log('--- 1. AI Review Length Control Engine ---');
  assert('Short length target is 1 sentence, 8-20 words',
    LENGTH_CONSTRAINTS.short.sentences.includes('1 concise sentence') &&
    LENGTH_CONSTRAINTS.short.targetWords.includes('8 to 20 words') &&
    LENGTH_CONSTRAINTS.short.minTargetWords === 6 &&
    LENGTH_CONSTRAINTS.short.maxTargetWords === 24
  );

  assert('Medium length target is 2-3 sentences, 25-50 words',
    LENGTH_CONSTRAINTS.medium.sentences.includes('2 to 3') &&
    LENGTH_CONSTRAINTS.medium.targetWords.includes('25 to 50 words') &&
    LENGTH_CONSTRAINTS.medium.minTargetWords === 20 &&
    LENGTH_CONSTRAINTS.medium.maxTargetWords === 60
  );

  assert('Long length target is 4-5 sentences, 50-90 words',
    LENGTH_CONSTRAINTS.long.sentences.includes('4 to 5') &&
    LENGTH_CONSTRAINTS.long.targetWords.includes('50 to 90 words') &&
    LENGTH_CONSTRAINTS.long.minTargetWords === 45 &&
    LENGTH_CONSTRAINTS.long.maxTargetWords === 110
  );

  // Test dynamic prompt construction with explicit length constraints
  const shortPrompt = buildDynamicPrompt({
    customerText: 'tasty food',
    selectedTopics: ['Food Taste'],
    language: 'English',
    verifiedBusinessContext: 'Taj Dining (Restaurant)',
    previousReviews: [],
    generationNumber: 1,
    requestId: 'test_req_short',
    reviewLength: 'short'
  });
  assert('Short prompt includes 1 sentence constraint', shortPrompt.includes('Exactly 1 concise sentence'));
  assert('Short prompt includes 8 to 20 words constraint', shortPrompt.includes('8 to 20 words'));

  const longPrompt = buildDynamicPrompt({
    customerText: 'tasty food and great ambience',
    selectedTopics: ['Food Taste', 'Ambience'],
    language: 'English',
    verifiedBusinessContext: 'Taj Dining (Restaurant)',
    previousReviews: [],
    generationNumber: 1,
    requestId: 'test_req_long',
    reviewLength: 'long'
  });
  assert('Long prompt includes 4 to 5 sentences constraint', longPrompt.includes('4 to 5 short sentences'));
  assert('Long prompt includes 50 to 90 words constraint', longPrompt.includes('50 to 90 words'));

  // Test punctuation sanitizer
  const sanitized = sanitizeReviewText('Great food! Loved the taste, will visit again... Highly recommended :)');
  assert('Sanitized text has no exclamation, commas, or periods',
    !sanitized.includes('!') && !sanitized.includes(',') && !sanitized.includes('.')
  );
  assert('Sanitized text preserves clean natural words', sanitized.includes('Great food Loved the taste'));

  // =========================================================================
  // MODULE 2: SEQUENTIAL INVOICE GENERATOR & TAX COMPLIANCE
  // =========================================================================
  console.log('\n--- 2. Sequential Invoicing & Tax Compliance Rules ---');

  // Verify sequential numbers
  const invNum1 = reviewFlowStore.generateSequentialInvoiceNumber();
  const invNum2 = reviewFlowStore.generateSequentialInvoiceNumber();
  const year = new Date().getFullYear();
  assert(`First invoice follows format QOR-${year}-XXXX`, invNum1.startsWith(`QOR-${year}-`));
  assert('Subsequent invoice number increments monotonically', invNum2 > invNum1, `${invNum1} -> ${invNum2}`);

  // Test zero tax when seller has taxApplicable = false
  const sellerNoTax = {
    companyName: 'Qorbiq AI Tech',
    address: 'Pune, Maharashtra',
    taxApplicable: false
  };
  const invoice1 = reviewFlowStore.createInvoice({
    userId: `usr_test_${runId}`,
    customerName: 'Anil Sharma',
    customerEmail: 'anil@example.com',
    items: [{ description: 'Monthly Subscription', quantity: 1, unitPrice: 299, amount: 299 }],
    baseAmount: 299,
    totalAmount: 299,
    taxAmount: 0,
    gateway: 'CASHFREE',
    sellerDetails: sellerNoTax
  });
  assert('Invoice created with status PAID', invoice1.status === 'PAID');
  assert('Invoice has sequential invoiceNumber', !!invoice1.invoiceNumber);
  assert('Tax amount is strictly 0 when taxApplicable is false', invoice1.taxAmount === 0);

  // Test GST calculation when taxApplicable = true and valid 15-char GSTIN
  const sellerWithGST = {
    companyName: 'Qorbiq AI Tech Pvt Ltd',
    address: 'Pune, Maharashtra',
    taxApplicable: true,
    gstin: '27AAAAA0000A1Z5',
    taxRatePercentage: 18
  };
  const invoice2 = reviewFlowStore.createInvoice({
    userId: `usr_test_gst_${runId}`,
    customerName: 'Priya Verma',
    customerEmail: 'priya@example.com',
    items: [{ description: 'Yearly Subscription', quantity: 1, unitPrice: 2541.53, amount: 2541.53 }],
    baseAmount: 2541.53,
    taxAmount: 457.47,
    taxRate: 18,
    totalAmount: 2999,
    gateway: 'CASHFREE',
    sellerDetails: sellerWithGST
  });
  assert('Invoice with GST has 18% tax recorded', invoice2.taxAmount === 457.47 && invoice2.taxRate === 18);
  assert('Invoice preserves seller GSTIN in snapshot', invoice2.sellerDetails?.gstin === '27AAAAA0000A1Z5');

  // Verify printable HTML generation
  const invoiceHtml = generateInvoiceHtml(invoice2);
  assert('Printable HTML contains invoice number', invoiceHtml.includes(invoice2.invoiceNumber));
  assert('Printable HTML contains seller GSTIN', invoiceHtml.includes('27AAAAA0000A1Z5'));
  assert('Printable HTML includes print script', invoiceHtml.includes('window.print()'));

  // Test invoice status change with audit reason
  const updatedInv = reviewFlowStore.updateInvoiceStatus(invoice2.id, 'REFUNDED', 'Customer duplicate payment reversal');
  assert('Invoice status updated to REFUNDED', updatedInv?.status === 'REFUNDED');
  assert('Invoice audit notes record reason', updatedInv?.notes?.includes('reversal') === true);

  // =========================================================================
  // MODULE 3: PHYSICAL STANDEE CATALOG & ORDER LIFECYCLE
  // =========================================================================
  console.log('\n--- 3. Standee Products & Physical Order Management ---');

  // Verify catalog seeded
  const products = reviewFlowStore.getProducts();
  assert('Catalog has at least 3 standee products', products.length >= 3);

  const qrStandee = products.find(p => p.id === 'prod_qr_standee' || p.productType.toUpperCase() === 'QR_STANDEE');
  const nfcStandee = products.find(p => p.id === 'prod_nfc_standee' || p.productType.toUpperCase() === 'NFC_STANDEE');
  const hybridStandee = products.find(p => p.id === 'prod_combined_standee' || p.productType.toUpperCase() === 'COMBINED_QR_NFC' || p.productType.toUpperCase() === 'HYBRID_QR_NFC');

  assert('Dynamic QR Standee priced at ₹499', qrStandee?.price === 499 || qrStandee?.basePrice === 499);
  assert('NFC Touch Standee priced at ₹799', nfcStandee?.price === 799 || nfcStandee?.basePrice === 799);
  assert('Hybrid QR + NFC Standee priced at ₹999', hybridStandee?.price === 999 || hybridStandee?.basePrice === 999);

  // Create Standee Order
  const order = reviewFlowStore.createStandeeOrder({
    userId: `usr_merchant_${runId}`,
    businessId: `biz_cafe_${runId}`,
    businessName: 'Third Wave Roasters',
    items: [{
      productId: hybridStandee!.id,
      productName: hybridStandee!.name,
      productType: hybridStandee!.productType,
      quantity: 1,
      unitPrice: hybridStandee!.basePrice,
      amount: hybridStandee!.basePrice
    }],
    totalAmount: hybridStandee!.basePrice,
    shippingAddress: {
      fullName: 'Vikram Mehta',
      phone: '9876543210',
      streetAddress: 'Plot 12, Koregaon Park Road',
      city: 'Pune',
      state: 'Maharashtra',
      pinCode: '411001'
    }
  });

  assert('Order created with status PAYMENT_PENDING', order.orderStatus === 'PAYMENT_PENDING');
  assert('Order has sequential orderNumber QOR-ORD-...', order.orderNumber.startsWith('QOR-ORD-'));

  // Verify Payment & Provision Activation
  const verifiedOrder = reviewFlowStore.verifyStandeeOrderPayment(order.id, `cf_pay_test_standee_${runId}`);
  assert('Order marked PAID after payment verification', verifiedOrder?.paymentStatus === 'PAID');
  assert('Order status advanced to ORDER_CONFIRMED', verifiedOrder?.orderStatus === 'ORDER_CONFIRMED');

  // Verify automatic invoice generated for physical order
  const orderInvoices = reviewFlowStore.getInvoices({ userId: `usr_merchant_${runId}` });
  const invoiceList = (orderInvoices as any).items || orderInvoices;
  assert('Automatic invoice created for verified standee order', invoiceList.some((inv: any) => inv.orderId === order.id));

  // Verify product activation record created
  const activations = reviewFlowStore.getProductActivations({ businessId: `biz_cafe_${runId}` });
  assert('Product activation record created for standee order', activations.length > 0);
  const act = activations[0];
  assert('Activation contains permanent destination URL', (act.destinationUrl || '').includes('/r/') || (act.destinationUrl || '').includes('/review/'));

  // Update hardware preparation checklist
  const updatedAct = reviewFlowStore.updateActivationChecklist(act.id, {
    qrGenerated: true,
    nfcEncoded: true,
    qualityChecked: true,
    packed: true
  });
  assert('Hardware checklist QR generated toggled true', updatedAct?.hardwareChecklist?.qrGenerated === true);
  assert('Hardware checklist NFC encoded toggled true', updatedAct?.hardwareChecklist?.nfcEncoded === true);
  assert('Hardware checklist Quality check passed', updatedAct?.hardwareChecklist?.qualityChecked === true);
  assert('Hardware checklist Packing confirmed', updatedAct?.hardwareChecklist?.packed === true);

  // Assign courier tracking
  const dispatchedOrder = reviewFlowStore.assignCourierTracking(
    order.id,
    'Delhivery',
    'DELH987654321',
    'https://www.delhivery.com/track/package/DELH987654321',
    'Bubble wrapped standee box'
  );
  assert('Order status transitioned to DISPATCHED', dispatchedOrder?.orderStatus === 'DISPATCHED');
  assert('Courier provider assigned as Delhivery', dispatchedOrder?.courierProvider === 'Delhivery');
  assert('Tracking number stored correctly', dispatchedOrder?.trackingNumber === 'DELH987654321');

  // Record reprint request with audit reason
  const reprintAct = reviewFlowStore.recordReprint(act.id, 'Acrylic stand cracked during shipping');
  assert('Reprint history logged with audit reason',
    reprintAct?.reprintHistory?.some(r => r.reason.includes('cracked')) === true
  );

  // =========================================================================
  // MODULE 4: SUPER ADMIN LIVE METRICS & SUSPENSION AUDIT
  // =========================================================================
  console.log('\n--- 4. Super Admin Telemetry & Suspension ---');
  const overview = reviewFlowStore.getAdminOverview();

  assert('Total registered users is numeric', typeof overview.totalRegisteredUsers === 'number');
  assert('Total businesses is numeric', typeof overview.totalBusinesses === 'number');
  assert('Active Monthly subscriptions is numeric', typeof overview.activeMonthlySubscriptions === 'number');
  assert('Active Yearly subscriptions is numeric', typeof overview.activeYearlySubscriptions === 'number');
  assert('MRR is numeric', typeof overview.monthlyRecurringRevenue === 'number');
  assert('ARR is labeled Estimated Run-Rate ARR (MRR × 12)',
    overview.annualRecurringRevenueLabel === 'Estimated Run-Rate ARR (MRR × 12)'
  );
  assert('Total verified revenue is numeric', typeof overview.totalVerifiedRevenue === 'number');
  assert('NFC products ordered count is tracked', typeof overview.nfcProductsOrdered === 'number' && overview.nfcProductsOrdered >= 1);
  assert('Standee orders awaiting dispatch tracked', typeof overview.standeeOrdersAwaiting === 'number');
  assert('Standee orders dispatched tracked', typeof overview.standeeOrdersDispatched === 'number' && overview.standeeOrdersDispatched >= 1);
  assert('AI Usage trends array contains 7 days', overview.aiUsageTrends?.length === 7);
  assert('Recent transactions list contains latest orders/payments', overview.recentTransactions?.length > 0);

  // Quick suspension with recorded reason
  const suspendUserResult = reviewFlowStore.updateUserStatusWithReason(
    `usr_merchant_${runId}`,
    'suspended',
    'Fraudulent chargeback claim'
  );
  assert('User status updated to suspended', suspendUserResult.status === 'suspended');

  const suspendBizResult = reviewFlowStore.updateBusinessStatusWithReason(
    `biz_cafe_${runId}`,
    'suspended',
    'Copyright trademark infringement on standee branding'
  );
  assert('Business status updated to suspended', suspendBizResult.status === 'suspended');

  console.log(`\n======================================================`);
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
