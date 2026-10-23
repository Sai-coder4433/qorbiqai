import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  Plus,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  QrCode,
  Sparkles,
  RefreshCw,
  MapPin,
  Clock,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  X,
  Layers,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../lib/auth-context.tsx';
import { useBusiness } from '../../lib/business-context.tsx';
import { freshTestApi } from '../../lib/fresh-test-api.ts';
import { openRazorpayCheckout } from '../../lib/razorpay.ts';
import { openCashfreeCheckout, redirectToCashfreeSubscription } from '../../lib/cashfree.ts';

export const BusinessesPage: React.FC = () => {
  const { user } = useAuth();
  const { businesses, activeBusiness, selectBusiness, refreshBusinesses, loading } = useBusiness();
  const navigate = useNavigate();

  // Dynamic backend pricing configuration state (Requirement 2)
  const [planConfig, setPlanConfig] = useState<{
    monthlyPrice: number;
    yearlyPrice: number;
    currency: string;
    discount: number;
    features: string[];
  }>({
    monthlyPrice: 299,
    yearlyPrice: 2999,
    currency: 'INR',
    discount: 16.4,
    features: ['Unlimited AI Review Generations', 'Permanent Dynamic QR Redirect', 'HD QR & NFC Support']
  });

  useEffect(() => {
    freshTestApi.getPlanConfig().then((res) => {
      if (res && res.plan) {
        setPlanConfig({
          monthlyPrice: res.plan.monthlyPrice,
          yearlyPrice: res.plan.yearlyPrice,
          currency: res.plan.currency || 'INR',
          discount: res.plan.discount || 17,
          features: res.plan.features || []
        });
      }
    }).catch((err) => {
      console.warn('[BusinessesPage] Could not load dynamic plan config:', err);
    });
  }, []);

  const intervals = [
    {
      id: 'monthly',
      name: 'Monthly Unlimited',
      price: `₹${planConfig.monthlyPrice.toLocaleString()}`,
      period: '/month',
      description: 'Flexible monthly billing with full platform access',
      features: ['Unlimited AI Review Generations', 'Permanent Dynamic QR Redirect', 'HD QR & NFC Support']
    },
    {
      id: 'yearly',
      name: 'Yearly Unlimited',
      price: `₹${planConfig.yearlyPrice.toLocaleString()}`,
      period: '/year',
      popular: true,
      description: `Best value annual plan · 2 months free (Save ${planConfig.discount}%)`,
      features: ['Unlimited AI Review Generations', 'Permanent Dynamic QR Redirect', 'HD QR & NFC Support', 'Priority Gemini Speed']
    }
  ];

  // Add Business via Razorpay subscription modal state
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const handleOpenAddModal = () => {
    setPaymentError(null);
    setShowPurchaseModal(true);
  };

  const handlePurchaseBusiness = async () => {
    setPaymentError(null);
    setPaymentProcessing(true);

    try {
      // Step 1: Create pending payment intent on server (server-side only)
      const intent = await freshTestApi.createPaymentIntent({
        planId: 'reviewflow_unlimited',
        billingInterval,
        idempotencyKey: `biz_create_${user?.uid}_${Date.now()}`
      });

      // Step 2: Route through Cashfree or Razorpay
      if (intent.provider === 'CASHFREE') {
        if (intent.authLink) {
          redirectToCashfreeSubscription(intent.authLink);
          return;
        }

        if (intent.paymentSessionId) {
          await openCashfreeCheckout({
            paymentSessionId: intent.paymentSessionId,
            mode: intent.environment || 'sandbox'
          });
          return;
        }
      }

      // Step 2b: Open authentic Razorpay Checkout modal
      let checkoutRes;
      try {
        checkoutRes = await openRazorpayCheckout({
          key: intent.keyId,
          amount: intent.amount,
          currency: intent.currency,
          name: 'Qorbiq AI',
          description: `Subscription for new business workspace (UNLIMITED)`,
          order_id: intent.orderId,
          subscription_id: intent.subscriptionId,
          prefill: {
            name: user?.displayName || '',
            email: user?.email || ''
          },
          theme: {
            color: '#2563eb'
          }
        });
      } catch (checkoutErr: any) {
        if (checkoutErr?.message === 'PAYMENT_CANCELLED') {
          setPaymentError('Payment was cancelled. Your new business was not activated.');
        } else {
          setPaymentError(checkoutErr?.message || 'Payment checkout could not be completed.');
        }
        setPaymentProcessing(false);
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

      // Close modal and refresh business list
      setShowPurchaseModal(false);
      await refreshBusinesses();

      // Step 4: Immediately route to fresh onboarding wizard for this new business
      navigate(`/app/onboarding/${verification.business.id}`);
    } catch (err: any) {
      setPaymentError(err.message || 'Payment verification failed. Please try again or contact support.');
    } finally {
      setPaymentProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
        <p className="text-sm text-slate-500 font-medium">Loading your business workspaces...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 font-sans max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">My Businesses</h1>
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
              {businesses.length} {businesses.length === 1 ? 'Workspace' : 'Workspaces'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Each business maintains isolated AI topics, QR stands, review analytics, and billing subscription.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Business</span>
        </button>
      </div>

      {/* Business List */}
      {businesses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Building2 className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base font-bold text-slate-900">No Business Workspaces Found</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Subscribe to ReviewFlow to set up your business workspace, verify your Google Review destination, and generate tailored AI experience topics.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs inline-flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Subscribe & Add Business</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {businesses.map((biz) => {
            const isActive = biz.id === activeBusiness?.id;
            const isCompleted = biz.onboardingStatus === 'COMPLETED' || biz.onboardingCompleted;
            const topics = biz.experienceCards || [];

            return (
              <div
                key={biz.id}
                className={`bg-white rounded-2xl border p-5 space-y-4 transition-all relative flex flex-col justify-between ${
                  isActive
                    ? 'border-blue-500 shadow-md ring-2 ring-blue-500/20'
                    : 'border-slate-200/80 hover:border-slate-300 shadow-xs'
                }`}
              >
                <div className="space-y-3">
                  {/* Top Bar: Icon, Name & Status Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      {biz.logoUrl ? (
                        <img
                          src={biz.logoUrl}
                          alt={biz.businessName}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-base border border-blue-100 shrink-0">
                          <Building2 className="w-5 h-5" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-900 text-sm truncate">
                          {biz.businessName || 'Unnamed Business'}
                        </h3>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <span className="font-medium text-blue-600">{biz.category || 'General'}</span>
                          {biz.subcategory && <span>• {biz.subcategory}</span>}
                        </div>
                      </div>
                    </div>

                    {isActive && (
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold shrink-0">
                        Current Active
                      </span>
                    )}
                  </div>

                  {/* Onboarding Status Badge */}
                  <div className="pt-1">
                    {isCompleted ? (
                      <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-lg text-[11px] font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Active & Onboarding Completed</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-1 text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg text-[11px] font-semibold">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>Setup Needed (Step {biz.onboardingStep || 1}/5)</span>
                        </div>
                        <Link
                          to={`/app/onboarding/${biz.id}`}
                          className="text-[10px] text-amber-900 underline font-bold hover:text-amber-700"
                        >
                          Resume
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {biz.description ? (
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {biz.description}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No business description provided yet.</p>
                  )}

                  {/* Location & Google Link */}
                  <div className="text-[11px] text-slate-500 space-y-1 pt-1">
                    {biz.city && (
                      <div className="flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{biz.city}{biz.state ? `, ${biz.state}` : ''}</span>
                      </div>
                    )}
                    {biz.googleReviewUrl ? (
                      <div className="flex items-center gap-1 truncate text-emerald-600">
                        <CheckCircle2 className="w-3 h-3 shrink-0" />
                        <span>Google Destination Linked</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 truncate text-amber-600">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>Google Review Link Missing</span>
                      </div>
                    )}
                  </div>

                  {/* Experience Topics Pill Summary */}
                  {topics.length > 0 && (
                    <div className="pt-2 border-t border-slate-100">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                        AI Experience Topics ({topics.length}):
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {topics.slice(0, 3).map((t, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-[10px] text-slate-700 font-medium"
                          >
                            {t.title}
                          </span>
                        ))}
                        {topics.length > 3 && (
                          <span className="px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-[10px] text-slate-400">
                            +{topics.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions Footer */}
                <div className="pt-4 border-t border-slate-100 space-y-2">
                  {!isCompleted ? (
                    <Link
                      to={`/app/onboarding/${biz.id}`}
                      className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Complete Setup Wizard</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : (
                    <div className="flex items-center justify-between text-xs pt-1">
                      <div className="flex items-center gap-3">
                        <Link
                          to={`/app/dashboard/${biz.id}`}
                          onClick={() => selectBusiness(biz.id)}
                          className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Layers className="w-3.5 h-3.5" />
                          <span>Dashboard</span>
                        </Link>
                        <Link
                          to="/app/qr"
                          onClick={() => selectBusiness(biz.id)}
                          className="text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1 cursor-pointer"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>QR Stands</span>
                        </Link>
                      </div>

                      {!isActive && (
                        <button
                          type="button"
                          onClick={() => selectBusiness(biz.id)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                        >
                          Switch To
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* RAZORPAY SUBSCRIPTION PURCHASE MODAL */}
      {showPurchaseModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowPurchaseModal(false)}
              disabled={paymentProcessing}
              className="absolute top-5 right-5 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-2">
                <CreditCard className="w-3.5 h-3.5" />
                <span>Isolated Workspace Subscription</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Subscribe for New Business
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Each business has its own dedicated ReviewFlow Unlimited subscription, permanent dynamic QR redirect, and CRM stream.
              </p>
            </div>

            {paymentError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{paymentError}</span>
              </div>
            )}

            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Billing Frequency:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {intervals.map((plan) => (
                  <div
                    key={plan.id}
                    onClick={() => setBillingInterval(plan.id as any)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                      billingInterval === plan.id
                        ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    {plan.popular && (
                      <span className="absolute -top-2.5 right-3 bg-emerald-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                        Save 17%
                      </span>
                    )}
                    <h4 className="font-bold text-slate-900 text-xs">{plan.name}</h4>
                    <div className="mt-2 text-lg font-black text-slate-900">
                      {plan.price}
                      <span className="text-[10px] text-slate-500 font-normal">{plan.period}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 leading-snug">{plan.description}</p>
                    <ul className="mt-3 space-y-1 text-[10px] text-slate-600 border-t border-slate-100 pt-2">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 text-[11px] text-slate-600 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Server-Verified Razorpay Checkout</span>
              </div>
              <p>
                Your card will be processed securely via Razorpay. Your business workspace will be atomically created only upon cryptographic signature verification on the server.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowPurchaseModal(false)}
                disabled={paymentProcessing}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePurchaseBusiness}
                disabled={paymentProcessing}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {paymentProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing Payment...</span>
                  </>
                ) : (
                  <>
                    <span>Proceed to Checkout</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
