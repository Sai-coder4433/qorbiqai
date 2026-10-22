import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  QrCode,
  ArrowRight,
  Check,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  Clock,
  Lock,
  RefreshCw,
  AlertCircle,
  Zap,
  Globe,
  Smartphone
} from 'lucide-react';
import { useAuth } from '../lib/auth-context.tsx';
import { useBusiness } from '../lib/business-context.tsx';
import { freshTestApi } from '../lib/fresh-test-api.ts';
import { openRazorpayCheckout } from '../lib/razorpay.ts';
import { openCashfreeCheckout, redirectToCashfreeSubscription } from '../lib/cashfree.ts';

export const PricingPage: React.FC = () => {
  const { user } = useAuth();
  const { refreshBusinesses } = useBusiness();
  const navigate = useNavigate();

  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Live plan config from backend (default fallback ₹999 / ₹9999)
  const [planConfig, setPlanConfig] = useState({
    name: 'ReviewFlow Unlimited',
    monthlyPrice: 999,
    yearlyPrice: 9999,
    currency: 'INR'
  });

  useEffect(() => {
    fetch('/api/admin/plans')
      .then(res => res.json())
      .then(data => {
        if (data?.plan) {
          setPlanConfig({
            name: data.plan.name || 'ReviewFlow Unlimited',
            monthlyPrice: data.plan.monthlyPrice ?? 999,
            yearlyPrice: data.plan.yearlyPrice ?? 9999,
            currency: data.plan.currency || 'INR'
          });
        }
      })
      .catch(() => {
        // Default values intact
      });
  }, []);

  const currentPrice = billingInterval === 'yearly' ? planConfig.yearlyPrice : planConfig.monthlyPrice;
  const periodLabel = billingInterval === 'yearly' ? '/ year' : '/ month';

  const handleStartUnlimited = async () => {
    if (!user) {
      navigate(`/signup?interval=${billingInterval}`);
      return;
    }

    try {
      setCheckoutLoading(true);
      setCheckoutError(null);

      // Step 1: Create server-side payment intent for ReviewFlow / Qorbiq Unlimited
      const intent = await freshTestApi.createPaymentIntent({
        planId: 'reviewflow_unlimited',
        billingInterval
      });

      // Step 2: Route through Cashfree or Razorpay depending on backend active gateway
      if (intent.provider === 'CASHFREE') {
        // If recurring subscription authLink provided
        if (intent.authLink) {
          redirectToCashfreeSubscription(intent.authLink);
          return;
        }

        // If Cashfree PG hosted checkout session provided
        if (intent.paymentSessionId) {
          await openCashfreeCheckout({
            paymentSessionId: intent.paymentSessionId,
            mode: intent.environment || 'sandbox'
          });
          // Cashfree handles redirect to /billing/return?order_id=...&payment_id=...
          return;
        }
      }

      // Step 2b: Razorpay Checkout modal
      let checkoutRes;
      try {
        checkoutRes = await openRazorpayCheckout({
          key: intent.keyId,
          amount: intent.amount,
          currency: intent.currency,
          name: 'Qorbiq AI',
          description: `${planConfig.name} (${billingInterval === 'yearly' ? 'Annual' : 'Monthly'})`,
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

      // Step 3: Server-side cryptographic signature verification and atomic provisioning
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

      // Refresh business context
      await refreshBusinesses();

      // Step 4: Route immediately to fresh onboarding for this newly provisioned business
      navigate(`/app/onboarding/${verification.business.id}`);
    } catch (err: any) {
      setCheckoutError(err.message || 'Payment verification failed. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Navigation */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 h-16 flex items-center justify-between px-6 lg:px-12">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-xs">
            <QrCode className="w-4 h-4" />
          </div>
          <span className="font-extrabold text-base tracking-tight text-slate-900">
            ReviewFlow AI
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <Link to="/" className="text-xs font-semibold text-slate-600 hover:text-blue-600">
            Home
          </Link>
          <Link to="/login" className="text-xs font-semibold text-slate-600 hover:text-blue-600">
            Sign In
          </Link>
          <button
            onClick={handleStartUnlimited}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>Get Started</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Pricing Header */}
      <main className="flex-1 py-16 px-6 max-w-4xl mx-auto space-y-10">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            One Simple Plan · Zero Limits
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
            ReviewFlow Unlimited
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
            Everything your business needs to turn genuine customer visits into natural, high-converting Google Reviews.
          </p>

          {/* Monthly vs Yearly Billing Switcher */}
          <div className="pt-4 flex items-center justify-center">
            <div className="bg-slate-200/80 p-1 rounded-2xl flex items-center">
              <button
                type="button"
                onClick={() => setBillingInterval('monthly')}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  billingInterval === 'monthly'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Monthly Billing
              </button>
              <button
                type="button"
                onClick={() => setBillingInterval('yearly')}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  billingInterval === 'yearly'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Yearly Billing</span>
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Save ~17%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* REVIEWFLOW UNLIMITED MAIN CARD */}
        <div className="bg-white rounded-3xl border-2 border-blue-600 p-8 sm:p-10 shadow-xl space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-blue-600 text-white font-bold text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-bl-xl">
            All-In-One Unlimited
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black text-slate-900">ReviewFlow Unlimited</h2>
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-md border border-blue-200">
                  Complete Platform
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Full access to AI generation, dynamic QR, NFC, and CRM</p>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-4xl font-black text-slate-900">
                ₹{currentPrice.toLocaleString()} <span className="text-sm text-slate-500 font-normal">{periodLabel}</span>
              </div>
              <span className="text-[11px] text-emerald-600 font-semibold block mt-0.5">
                {billingInterval === 'yearly' ? 'Billed annually · Best value' : 'Cancel anytime · Instant activation'}
              </span>
            </div>
          </div>

          {/* Value Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">AI Assistance</span>
              <span className="text-lg font-black text-slate-900 block mt-1 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>Unlimited</span>
              </span>
              <span className="text-[11px] text-slate-500">Generations & rewrites</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Dynamic QR</span>
              <span className="text-lg font-black text-slate-900 block mt-1 flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-blue-600" />
                <span>Permanent</span>
              </span>
              <span className="text-[11px] text-slate-500">Never reprint stands</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Languages</span>
              <span className="text-lg font-black text-slate-900 block mt-1 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-emerald-600" />
                <span>EN / HI / MR</span>
              </span>
              <span className="text-[11px] text-slate-500">Zero punctuation rule</span>
            </div>
          </div>

          {/* Included Features List */}
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              Everything Included in ReviewFlow Unlimited:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
              {[
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
                'Dedicated isolated business dashboard',
                'No app or signup required for customers',
                'Cryptographically verified Razorpay billing'
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Checkout Action */}
          <div className="pt-2">
            {checkoutError && (
              <div className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-xs text-rose-700 font-medium">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{checkoutError}</span>
              </div>
            )}
            <button
              onClick={handleStartUnlimited}
              disabled={checkoutLoading}
              className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm sm:text-base rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 hover:scale-[1.01] cursor-pointer"
            >
              {checkoutLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying Subscription...</span>
                </>
              ) : (
                <>
                  <span>Subscribe to ReviewFlow Unlimited</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
            <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400 mt-3">
              <span>✓ Instant Provisioning</span>
              <span>•</span>
              <span>✓ Secure Razorpay Payment</span>
              <span>•</span>
              <span>✓ Cancel Anytime</span>
            </div>
          </div>
        </div>

        {/* FAQ or Assurance Section */}
        <div className="p-6 bg-white rounded-3xl border border-slate-200 space-y-4">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Why Choose Dynamic QR with ReviewFlow Unlimited?</span>
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Unlike static QR codes that encode a fixed Google link, ReviewFlow encodes a permanent dynamic redirect.
            If you ever update your store address, change your Google listing, or rename your business, your physical
            printed QR stands continue to work seamlessly without ever needing to be reprinted.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 px-6 text-xs text-center border-t border-slate-800">
        <p>&copy; {new Date().getFullYear()} ReviewFlow AI. All rights reserved.</p>
      </footer>
    </div>
  );
};
