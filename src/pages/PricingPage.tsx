import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  QrCode,
  ArrowRight,
  Check,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Zap,
  Globe,
  CheckCircle2,
  Calendar,
  CreditCard,
  Lock,
  X,
  Clock
} from 'lucide-react';
import { useAuth } from '../lib/auth-context.tsx';
import { useBusiness } from '../lib/business-context.tsx';
import { freshTestApi, QorbiqPlanItem } from '../lib/fresh-test-api.ts';
import { openRazorpayCheckout } from '../lib/razorpay.ts';
import { openCashfreeCheckout } from '../lib/cashfree.ts';
import { PublicNavbar } from '../components/public/PublicNavbar.tsx';
import { PublicFooter } from '../components/public/PublicFooter.tsx';

// Trusted Official Plan Specifications
const OFFICIAL_PLANS: Record<'qorbiq_6_months' | 'qorbiq_12_months', QorbiqPlanItem> = {
  qorbiq_6_months: {
    id: 'qorbiq_6_months',
    name: 'Qorbiq AI – 6 Months',
    price: 1800,
    currency: 'INR',
    durationDays: 180,
    billingType: 'One-Time Payment',
    autoRenew: false,
    renewal: 'Manual',
    description: '180 days direct access to Qorbiq AI with zero recurring debits or hidden mandates.',
    tagline: 'Flexible 6-Month AI review automation for growing local businesses.',
    features: [
      '180 Days Full Access',
      'One-Time Payment — No Mandates',
      'Manual Renewal Only',
      'Auto Renewal Disabled',
      'Unlimited AI review generation',
      'Unlimited review regeneration',
      'Permanent Dynamic QR with server redirect',
      '4K HD print & SVG vector QR download',
      'NFC smart stand & counter tag support',
      'Direct Google Review journey integration',
      'English, Hindi & Marathi natural support',
      'CRM lead tracking & sales follow-up portal',
      'Live scan & copy conversion analytics'
    ]
  },
  qorbiq_12_months: {
    id: 'qorbiq_12_months',
    name: 'Qorbiq AI – 12 Months',
    price: 2999,
    currency: 'INR',
    durationDays: 365,
    billingType: 'One-Time Payment',
    autoRenew: false,
    renewal: 'Manual',
    description: '365 days full access to Qorbiq AI with maximum annual savings and zero recurring debit.',
    tagline: 'Best Value: 1 Full Year access with ₹601 savings compared to two 6-month cycles.',
    discount: 16.7,
    features: [
      '365 Days Full Access (1 Full Year)',
      'One-Time Payment — No Mandates',
      'Manual Renewal Only',
      'Auto Renewal Disabled',
      'Save ₹601 compared to two 6-month cycles',
      'Unlimited AI review generation',
      'Unlimited review regeneration',
      'Permanent Dynamic QR with server redirect',
      '4K HD print & SVG vector QR download',
      'NFC smart stand & counter tag support',
      'Direct Google Review journey integration',
      'English, Hindi & Marathi natural support',
      'CRM lead tracking & sales follow-up portal',
      'Live scan & copy conversion analytics'
    ]
  }
};

export const PricingPage: React.FC = () => {
  const { user } = useAuth();
  const { refreshBusinesses } = useBusiness();
  const navigate = useNavigate();

  // Active highlighted plan tab
  const [activePlanId, setActivePlanId] = useState<'qorbiq_6_months' | 'qorbiq_12_months'>('qorbiq_12_months');

  // Checkout confirmation modal state (Requirement 8: Display selected plan and amount clearly before checkout)
  const [confirmingPlan, setConfirmingPlan] = useState<QorbiqPlanItem | null>(null);

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Live plans from backend
  const [plans, setPlans] = useState<Record<string, QorbiqPlanItem>>(OFFICIAL_PLANS);

  useEffect(() => {
    freshTestApi
      .getOfficialPlans()
      .then(res => {
        if (res?.plans && Array.isArray(res.plans) && res.plans.length > 0) {
          const map: Record<string, QorbiqPlanItem> = {};
          res.plans.forEach(p => {
            map[p.id] = p;
          });
          setPlans(prev => ({ ...prev, ...map }));
        }
      })
      .catch(() => {
        // Fallback to official config
      });
  }, []);

  const plan6 = plans['qorbiq_6_months'] || OFFICIAL_PLANS.qorbiq_6_months;
  const plan12 = plans['qorbiq_12_months'] || OFFICIAL_PLANS.qorbiq_12_months;

  // Step 1: Open order confirmation review before checkout
  const handleInitiateOrder = (plan: QorbiqPlanItem) => {
    setCheckoutError(null);
    if (!user) {
      navigate(`/signup?planId=${plan.id}&amount=${plan.price}`);
      return;
    }
    setConfirmingPlan(plan);
  };

  // Step 2: Confirm and launch Cashfree Checkout
  const handleProceedToCheckout = async () => {
    if (!confirmingPlan) return;

    try {
      setCheckoutLoading(true);
      setCheckoutError(null);

      // Backend derives price server-side using trusted server-side plan config
      const intent = await freshTestApi.createPaymentIntent({
        planId: confirmingPlan.id,
        amount: confirmingPlan.price,
        durationDays: confirmingPlan.durationDays,
        gateway: 'CASHFREE',
        billingModel: 'ONE_TIME',
        autoRenew: false
      });

      // Route through Cashfree JS SDK
      if (intent.provider === 'CASHFREE' && intent.paymentSessionId) {
        await openCashfreeCheckout({
          paymentSessionId: intent.paymentSessionId,
          mode: intent.environment || 'sandbox'
        });
        return;
      }

      // Fallback Razorpay checkout if active
      if (intent.provider === 'RAZORPAY') {
        const checkoutRes = await openRazorpayCheckout({
          key: intent.keyId,
          amount: intent.amount,
          currency: intent.currency,
          name: 'Qorbiq AI',
          description: `${confirmingPlan.name} (One-Time Payment)`,
          order_id: intent.orderId,
          prefill: {
            name: user?.displayName || '',
            email: user?.email || ''
          },
          theme: { color: '#2563eb' }
        });

        const verification = await freshTestApi.verifyPayment({
          paymentId: intent.paymentId,
          gateway: 'RAZORPAY',
          razorpay_payment_id: checkoutRes.razorpay_payment_id,
          razorpay_order_id: checkoutRes.razorpay_order_id || intent.orderId,
          razorpay_signature: checkoutRes.razorpay_signature
        });

        if (!verification.success || !verification.business) {
          throw new Error((verification as any).error || 'Server failed to verify payment.');
        }

        await refreshBusinesses();
        navigate(`/app/onboarding/${verification.business.id}`);
      }
    } catch (err: any) {
      if (err?.message === 'PAYMENT_CANCELLED') {
        setCheckoutError('Payment checkout was cancelled. No charges were made.');
      } else {
        const rawMsg = err?.message || '';
        if (rawMsg.toLowerCase().includes('fetch failed') || rawMsg.toLowerCase().includes('enotfound')) {
          setCheckoutError('Unable to connect to payment server. Please verify backend server is running and internet access is available.');
        } else {
          setCheckoutError(rawMsg || 'Payment initialization failed. Please try again.');
        }
      }
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      <PublicNavbar activePage="pricing" />

      <main className="flex-1 py-14 px-4 sm:px-6 max-w-6xl mx-auto space-y-12">
        {/* Header & Badges */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 px-3.5 py-1 rounded-full text-xs font-bold tracking-wide uppercase">
            <Lock className="w-3.5 h-3.5" />
            <span>Official One-Time Payment Plans</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
            Simple, Transparent Pricing
          </h1>

          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Choose exactly the access duration that works best for your business. Both plans are{' '}
            <strong className="text-slate-900 font-bold">100% One-Time Payments</strong> with{' '}
            <strong className="text-slate-900 font-bold">Zero Recurring Debits</strong>, no bank mandates, and manual renewal upon expiry.
          </p>

          {/* Plan Selector Buttons */}
          <div className="pt-2 flex items-center justify-center">
            <div className="bg-slate-200/80 p-1.5 rounded-2xl flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActivePlanId('qorbiq_6_months')}
                className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  activePlanId === 'qorbiq_6_months'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                6 Months (₹1,800 INR)
              </button>
              <button
                type="button"
                onClick={() => setActivePlanId('qorbiq_12_months')}
                className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activePlanId === 'qorbiq_12_months'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>12 Months (₹2,999 INR)</span>
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Save ₹601
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Global Error Notice */}
        {checkoutError && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-xs text-rose-700 font-medium max-w-2xl mx-auto">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{checkoutError}</span>
          </div>
        )}

        {/* THE TWO EXACT ONE-TIME PAYMENT PLANS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          
          {/* ========================================================= */}
          {/* PLAN 1: HALF-YEARLY (Qorbiq AI – 6 Months) */}
          {/* ========================================================= */}
          <div
            className={`bg-white rounded-3xl p-6 sm:p-8 border-2 transition-all flex flex-col justify-between space-y-6 relative ${
              activePlanId === 'qorbiq_6_months'
                ? 'border-blue-600 shadow-xl ring-2 ring-blue-600/10'
                : 'border-slate-200 shadow-xs hover:border-slate-300'
            }`}
          >
            <div className="space-y-6">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                    Half-Yearly Plan
                  </span>
                  <span className="text-xs font-bold text-slate-500">180 Days Access</span>
                </div>
                <h2 className="text-2xl font-black text-slate-900">{plan6.name}</h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {plan6.description}
                </p>
              </div>

              {/* Price Block */}
              <div className="pt-2 pb-3 border-b border-slate-100">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl sm:text-5xl font-black text-slate-900">
                    ₹{plan6.price.toLocaleString()}
                  </span>
                  <span className="text-sm font-bold text-slate-500">INR</span>
                  <span className="text-xs font-semibold text-slate-400">/ 180 Days</span>
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Single one-time payment of ₹1,800 · No automatic debits · Manual renewal
                </span>
              </div>

              {/* Policy & Specifications Matrix */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-3 text-slate-600">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Billing Type</span>
                    <span className="font-semibold text-slate-900">One-Time Payment</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Access Duration</span>
                    <span className="font-semibold text-slate-900">180 Days</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Auto Renewal</span>
                    <span className="font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md inline-block">
                      Disabled
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Renewal</span>
                    <span className="font-semibold text-slate-900">Manual</span>
                  </div>
                </div>
              </div>

              {/* Features List */}
              <div className="space-y-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  What&apos;s Included in 6 Months:
                </span>
                {plan6.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-xs text-slate-700">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <button
                type="button"
                onClick={() => handleInitiateOrder(plan6)}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer bg-slate-900 hover:bg-slate-800 text-white shadow-md hover:scale-[1.01]"
              >
                <span>Choose 6 Months — ₹1,800 INR</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
                <Lock className="w-3 h-3 text-slate-400" />
                <span>Cashfree 256-Bit SSL Encrypted PG Checkout</span>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* PLAN 2: YEARLY (Qorbiq AI – 12 Months) */}
          {/* ========================================================= */}
          <div
            className={`bg-white rounded-3xl p-6 sm:p-8 border-2 transition-all flex flex-col justify-between space-y-6 relative overflow-hidden ${
              activePlanId === 'qorbiq_12_months'
                ? 'border-blue-600 shadow-xl ring-2 ring-blue-600/10'
                : 'border-slate-200 shadow-xs hover:border-slate-300'
            }`}
          >
            {/* Best Value Ribbon */}
            <div className="absolute top-5 right-5">
              <span className="inline-flex items-center gap-1 bg-emerald-500 text-white font-black text-[10px] uppercase tracking-wider px-3 py-1 rounded-full shadow-xs">
                <Sparkles className="w-3 h-3" />
                <span>Best Value · Save ₹601</span>
              </span>
            </div>

            <div className="space-y-6">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                    Yearly Plan
                  </span>
                  <span className="text-xs font-bold text-slate-500">365 Days Access</span>
                </div>
                <h2 className="text-2xl font-black text-slate-900">{plan12.name}</h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {plan12.description}
                </p>
              </div>

              {/* Price Block */}
              <div className="pt-2 pb-3 border-b border-slate-100">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl sm:text-5xl font-black text-slate-900">
                    ₹{plan12.price.toLocaleString()}
                  </span>
                  <span className="text-sm font-bold text-slate-500">INR</span>
                  <span className="text-xs font-semibold text-slate-400">/ 365 Days</span>
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Single one-time payment of ₹2,999 · Save ₹601 vs two 6-month cycles · No mandates
                </span>
              </div>

              {/* Policy & Specifications Matrix */}
              <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-3 text-slate-600">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Billing Type</span>
                    <span className="font-semibold text-slate-900">One-Time Payment</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Access Duration</span>
                    <span className="font-semibold text-slate-900">365 Days (1 Full Year)</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Auto Renewal</span>
                    <span className="font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md inline-block">
                      Disabled
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Renewal</span>
                    <span className="font-semibold text-slate-900">Manual</span>
                  </div>
                </div>
              </div>

              {/* Features List */}
              <div className="space-y-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  What&apos;s Included in 12 Months:
                </span>
                {plan12.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-xs text-slate-700">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <button
                type="button"
                onClick={() => handleInitiateOrder(plan12)}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:scale-[1.01]"
              >
                <span>Choose 12 Months — ₹2,999 INR</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
                <Lock className="w-3 h-3 text-slate-400" />
                <span>Cashfree 256-Bit SSL Encrypted PG Checkout</span>
              </div>
            </div>
          </div>
        </div>

        {/* Clear Guarantee & Terms Highlights */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <span>Qorbiq AI Payment Policy & Deliverables</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-600 leading-relaxed">
            <div className="space-y-1.5">
              <span className="font-bold text-slate-900 block text-sm">1. Zero Auto-Debit Mandates</span>
              <p>
                Both plans are strictly one-time payments. We do not register e-NACH mandates or recurring UPI autopay debits. You are charged only once per purchase.
              </p>
            </div>
            <div className="space-y-1.5">
              <span className="font-bold text-slate-900 block text-sm">2. Guaranteed Access Period</span>
              <p>
                Your business workspace, dynamic QR codes, and AI review generation remain fully active for the exact duration of your plan (180 Days or 365 Days).
              </p>
            </div>
            <div className="space-y-1.5">
              <span className="font-bold text-slate-900 block text-sm">3. Verified Invoices & Security</span>
              <p>
                All payments are processed securely via Cashfree PG with server-side validation. Official PDF tax invoices are generated only after verified successful payment.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* ============================================================= */}
      {/* REQUIREMENT 8: ORDER CONFIRMATION MODAL BEFORE CHECKOUT */}
      {/* ============================================================= */}
      {confirmingPlan && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-extrabold flex items-center justify-center text-sm">
                  Q
                </div>
                <h3 className="text-lg font-black text-slate-900">Review Order Details</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setConfirmingPlan(null);
                  setCheckoutError(null);
                }}
                disabled={checkoutLoading}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {checkoutError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{checkoutError}</span>
              </div>
            )}

            {/* Clear Order Summary Table */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>Selected Plan:</span>
                <span className="font-bold text-slate-900">{confirmingPlan.name}</span>
              </div>

              <div className="flex justify-between items-center text-slate-600">
                <span>Access Duration:</span>
                <span className="font-bold text-slate-900">{confirmingPlan.durationDays} Days</span>
              </div>

              <div className="flex justify-between items-center text-slate-600">
                <span>Billing Type:</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  One-Time Payment
                </span>
              </div>

              <div className="flex justify-between items-center text-slate-600">
                <span>Auto Renewal:</span>
                <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md">
                  Disabled (Manual)
                </span>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                <span className="text-sm font-bold text-slate-900">Total Payable Amount:</span>
                <span className="text-2xl font-black text-blue-600">
                  ₹{confirmingPlan.price.toLocaleString()} INR
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={handleProceedToCheckout}
                disabled={checkoutLoading}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white shadow-md disabled:opacity-50"
              >
                {checkoutLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Connecting Cashfree Gateway...</span>
                  </>
                ) : (
                  <>
                    <span>Proceed to Cashfree Checkout — ₹{confirmingPlan.price.toLocaleString()}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setConfirmingPlan(null)}
                disabled={checkoutLoading}
                className="w-full py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                Cancel and return
              </button>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
              <Lock className="w-3 h-3 text-slate-400" />
              <span>Cashfree PG 256-Bit Encrypted Gateway</span>
            </div>
          </div>
        </div>
      )}

      <PublicFooter />
    </div>
  );
};
