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
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../lib/auth-context.tsx';
import { useBusiness } from '../lib/business-context.tsx';
import { freshTestApi } from '../lib/fresh-test-api.ts';
import { openRazorpayCheckout } from '../lib/razorpay.ts';
import { openCashfreeCheckout, redirectToCashfreeSubscription } from '../lib/cashfree.ts';
import { PublicNavbar } from '../components/public/PublicNavbar.tsx';
import { PublicFooter } from '../components/public/PublicFooter.tsx';

export const PricingPage: React.FC = () => {
  const { user } = useAuth();
  const { refreshBusinesses } = useBusiness();
  const navigate = useNavigate();

  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Live plan config from backend (strictly official ₹299 / ₹2,999)
  const [planConfig, setPlanConfig] = useState({
    name: 'Qorbiq AI Unlimited',
    monthlyPrice: 299,
    yearlyPrice: 2999,
    currency: 'INR'
  });

  useEffect(() => {
    fetch('/api/admin/plans')
      .then(res => res.json())
      .then(data => {
        if (data?.plan) {
          setPlanConfig({
            name: data.plan.name || 'Qorbiq AI Unlimited',
            monthlyPrice: data.plan.monthlyPrice ?? 299,
            yearlyPrice: data.plan.yearlyPrice ?? 2999,
            currency: data.plan.currency || 'INR'
          });
        }
      })
      .catch(() => {
        // Fallback defaults to official ₹299 / ₹2,999
      });
  }, []);

  const handleSubscribe = async (interval: 'monthly' | 'yearly') => {
    if (!user) {
      navigate(`/signup?interval=${interval}`);
      return;
    }

    try {
      setCheckoutLoading(true);
      setCheckoutError(null);

      // Step 1: Create server-side payment intent. Backend derives price server-side.
      const intent = await freshTestApi.createPaymentIntent({
        planId: 'reviewflow_unlimited',
        billingInterval: interval
      });

      // Step 2: Route through Cashfree
      if (intent.provider === 'CASHFREE') {
        // If Cashfree recurring subscription authorization link is returned
        if (intent.authLink) {
          redirectToCashfreeSubscription(intent.authLink);
          return;
        }

        // If Cashfree hosted checkout paymentSessionId is returned
        if (intent.paymentSessionId) {
          await openCashfreeCheckout({
            paymentSessionId: intent.paymentSessionId,
            mode: intent.environment || 'sandbox'
          });
          // Cashfree handles redirect to /billing/return?order_id=...&payment_id=...
          return;
        }
      }

      // Step 2b: Fallback Razorpay checkout
      let checkoutRes;
      try {
        checkoutRes = await openRazorpayCheckout({
          key: intent.keyId,
          amount: intent.amount,
          currency: intent.currency,
          name: 'Qorbiq AI',
          description: `${planConfig.name} (${interval === 'yearly' ? 'Yearly' : 'Monthly'})`,
          order_id: intent.orderId,
          prefill: {
            name: user.displayName || '',
            email: user.email || ''
          },
          theme: {
            color: '#2563eb'
          }
        });
      } catch (checkoutErr: any) {
        if (checkoutErr?.message === 'PAYMENT_CANCELLED') {
          setCheckoutError('Payment was cancelled. Your subscription was not activated.');
        } else {
          setCheckoutError(checkoutErr?.message || 'Payment checkout could not be completed.');
        }
        setCheckoutLoading(false);
        return;
      }

      // Step 3: Server-side cryptographic signature verification
      const verification = await freshTestApi.verifyPayment({
        paymentId: intent.paymentId,
        gateway: 'RAZORPAY',
        razorpay_payment_id: checkoutRes.razorpay_payment_id,
        razorpay_order_id: checkoutRes.razorpay_order_id || intent.orderId,
        razorpay_subscription_id: checkoutRes.razorpay_subscription_id || intent.subscriptionId,
        razorpay_signature: checkoutRes.razorpay_signature
      });

      if (!verification.success || !verification.business) {
        throw new Error((verification as any).error || 'Server failed to verify payment.');
      }

      await refreshBusinesses();
      navigate(`/app/onboarding/${verification.business.id}`);
    } catch (err: any) {
      setCheckoutError(err.message || 'Payment initialization failed. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const featuresList = [
    'Unlimited AI review generation',
    'Unlimited regeneration & fresh phrasing',
    'Zero-punctuation natural review output',
    'Permanent Dynamic QR with server redirect',
    '4K HD print & SVG vector QR download',
    'NFC counter tag & smart stand support',
    'Direct Google Review journey integration',
    'English, Hindi & Marathi natural support',
    'Customer experience topics & highlight tags',
    'Lead CRM & sales follow-up portal',
    'Real-time scan & copy conversion analytics',
    'Dedicated isolated business workspace'
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Navigation */}
      <PublicNavbar activePage="pricing" />

      {/* Main Content */}
      <main className="flex-1 py-14 px-6 max-w-5xl mx-auto space-y-12">
        {/* Title & Plan Switcher */}
        <div className="text-center space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            Official SaaS Pricing
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
            Simple, Transparent Pricing
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
            Choose the plan that fits your business. Scale your Google reviews with automated AI assistance, permanent dynamic QR stands, and verified customer feedback.
          </p>

          {/* Toggle Switcher */}
          <div className="pt-2 flex items-center justify-center">
            <div className="bg-slate-200/80 p-1 rounded-2xl flex items-center">
              <button
                type="button"
                onClick={() => setSelectedPlan('monthly')}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedPlan === 'monthly'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Monthly Plan (₹299/mo)
              </button>
              <button
                type="button"
                onClick={() => setSelectedPlan('yearly')}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedPlan === 'yearly'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Yearly Plan (₹2,999/yr)</span>
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Best Value
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Checkout Error Notice */}
        {checkoutError && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-xs text-rose-700 font-medium">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{checkoutError}</span>
          </div>
        )}

        {/* PRICING CARDS: TWO OFFICIAL PLANS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          
          {/* MONTHLY PLAN CARD */}
          <div
            className={`bg-white rounded-3xl p-8 border-2 transition-all flex flex-col justify-between space-y-6 relative ${
              selectedPlan === 'monthly'
                ? 'border-blue-600 shadow-xl ring-2 ring-blue-600/10'
                : 'border-slate-200 shadow-xs hover:border-slate-300'
            }`}
          >
            <div className="space-y-6">
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Flexible Monthly Subscription
                </span>
                <h3 className="text-2xl font-black text-slate-900">Qorbiq AI Monthly</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Ideal for businesses starting out with review automation. Billed every 1 month.
                </p>
              </div>

              <div className="pt-2 pb-4 border-b border-slate-100">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-900">
                    ₹{planConfig.monthlyPrice.toLocaleString()}
                  </span>
                  <span className="text-sm font-semibold text-slate-500">/month</span>
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Billed every 1 month · Auto-renews via authorized mandate
                </span>
              </div>

              {/* Features list */}
              <div className="space-y-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Everything Included:
                </span>
                {featuresList.slice(0, 8).map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-700">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 space-y-3">
              <button
                onClick={() => {
                  setSelectedPlan('monthly');
                  handleSubscribe('monthly');
                }}
                disabled={checkoutLoading}
                className="w-full py-3.5 px-6 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer bg-slate-900 hover:bg-slate-800 text-white shadow-xs"
              >
                {checkoutLoading && selectedPlan === 'monthly' ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Initializing Cashfree...</span>
                  </>
                ) : (
                  <>
                    <span>Choose Monthly Plan (₹299/mo)</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
              <p className="text-[11px] text-slate-400 text-center">
                Auto-renews monthly · Cancel anytime via app
              </p>
            </div>
          </div>

          {/* YEARLY PLAN CARD (BEST VALUE) */}
          <div
            className={`bg-white rounded-3xl p-8 border-2 transition-all flex flex-col justify-between space-y-6 relative ${
              selectedPlan === 'yearly'
                ? 'border-blue-600 shadow-2xl ring-2 ring-blue-600/20'
                : 'border-slate-300 shadow-md hover:border-blue-500'
            }`}
          >
            {/* Best Value Badge */}
            <div className="absolute -top-3.5 right-6 bg-blue-600 text-white font-extrabold text-[10px] uppercase tracking-widest px-3.5 py-1 rounded-full shadow-xs">
              Best Value
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 font-semibold">
                    Annual Commitment
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Save ₹589/year
                  </span>
                </div>
                <h3 className="text-2xl font-black text-slate-900">Qorbiq AI Yearly</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Best value for continuous review growth. Billed every 1 year.
                </p>
              </div>

              <div className="pt-2 pb-4 border-b border-slate-100">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-900">
                    ₹{planConfig.yearlyPrice.toLocaleString()}
                  </span>
                  <span className="text-sm font-semibold text-slate-500">/year</span>
                </div>
                <div className="mt-1 space-y-0.5">
                  <span className="text-[11px] text-emerald-600 font-bold block">
                    Save ₹589/year compared with 12 monthly payments (₹3,588/yr)
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    Billed every 1 year · Auto-renews via authorized mandate
                  </span>
                </div>
              </div>

              {/* Features list */}
              <div className="space-y-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Everything in Monthly, plus:
                </span>
                {featuresList.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-700">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 space-y-3">
              <button
                onClick={() => {
                  setSelectedPlan('yearly');
                  handleSubscribe('yearly');
                }}
                disabled={checkoutLoading}
                className="w-full py-3.5 px-6 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:scale-[1.01]"
              >
                {checkoutLoading && selectedPlan === 'yearly' ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Initializing Cashfree...</span>
                  </>
                ) : (
                  <>
                    <span>Choose Yearly Plan — Save ₹589/yr</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
              <p className="text-[11px] text-slate-400 text-center">
                Auto-renews yearly · Cancel anytime via app
              </p>
            </div>
          </div>

        </div>

        {/* MANDATE, RENEWAL & CANCELLATION TERMS NOTICE */}
        <div className="p-6 bg-white rounded-3xl border border-slate-200/90 space-y-4">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Recurring Billing & Cancellation Policy</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 leading-relaxed">
            <div className="space-y-1">
              <span className="font-semibold text-slate-800 block">Automatic Renewal Mandate</span>
              <p>
                All paid subscription plans automatically renew according to your authorized recurring payment mandate at the selected billing interval (every 1 month for Monthly, every 1 year for Yearly).
              </p>
            </div>
            <div className="space-y-1">
              <span className="font-semibold text-slate-800 block">Self-Service Customer Cancellation</span>
              <p>
                You can cancel your subscription at any time directly through the application from your Billing settings. Following cancellation, your business workspace and dynamic QR codes remain fully functional until the end of the current paid billing period.
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="text-slate-500">Need more information before subscribing?</span>
            <div className="flex flex-wrap items-center gap-4 text-blue-600 font-semibold">
              <Link to="/subscription-terms" className="hover:underline">Subscription Terms</Link>
              <Link to="/refund-policy" className="hover:underline">Cancellation & Refund Policy</Link>
              <Link to="/terms" className="hover:underline">Terms of Service</Link>
              <Link to="/privacy" className="hover:underline">Privacy Policy</Link>
              <Link to="/contact" className="hover:underline">Contact Support</Link>
            </div>
          </div>
        </div>

        {/* Dynamic QR Feature Assurance */}
        <div className="p-6 bg-slate-100/70 rounded-3xl border border-slate-200 text-xs text-slate-600 space-y-2">
          <span className="font-bold text-slate-800 block flex items-center gap-1.5">
            <QrCode className="w-4 h-4 text-blue-600" />
            <span>Permanent Dynamic QR Technology</span>
          </span>
          <p>
            Your dynamic QR codes use server-level redirection. Even if your Google listing link or physical store details change in the future, your existing printed counter stands and NFC tags continue to work seamlessly without reprinting.
          </p>
        </div>
      </main>

      {/* Footer */}
      <PublicFooter />
    </div>
  );
};
