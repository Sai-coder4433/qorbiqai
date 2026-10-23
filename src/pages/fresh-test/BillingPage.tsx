import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Check,
  QrCode,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  Receipt,
  XCircle,
  Clock,
  ArrowRight,
  Printer,
  Download
} from 'lucide-react';
import { useAuth } from '../../lib/auth-context.tsx';
import { useBusiness } from '../../lib/business-context.tsx';
import { freshTestApi, SubscriptionData } from '../../lib/fresh-test-api.ts';
import { openRazorpayCheckout } from '../../lib/razorpay.ts';
import { openCashfreeCheckout, redirectToCashfreeSubscription } from '../../lib/cashfree.ts';

export const BillingPage: React.FC = () => {
  const { user } = useAuth();
  const { refreshBusinesses, activeBusiness } = useBusiness();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [activating, setActivating] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);

  // Cancellation Modal State
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  useEffect(() => {
    loadBilling();
  }, [activeBusiness?.id]);

  const loadBilling = async () => {
    try {
      setLoading(true);
      const [subRes, invRes] = await Promise.all([
        freshTestApi.getSubscription().catch(() => ({ subscription: null })),
        freshTestApi.getMyInvoices().catch(() => ({ invoices: [] }))
      ]);
      setSubscription(subRes.subscription);
      setInvoices(invRes.invoices || []);
    } catch (err: any) {
      console.error('Failed to load billing:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchInterval = async (targetInterval: 'monthly' | 'yearly') => {
    try {
      setActivating(true);
      setUpgradeError(null);
      setSuccessNotice(null);

      // Step 1: Create payment intent on backend for target interval (prices derived server-side)
      const intent = await freshTestApi.createPaymentIntent({
        planId: 'reviewflow_unlimited',
        billingInterval: targetInterval
      });

      // Step 2: Route through Cashfree
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

      // Step 2b: Fallback Razorpay checkout
      let checkoutRes;
      try {
        checkoutRes = await openRazorpayCheckout({
          key: intent.keyId,
          amount: intent.amount,
          currency: intent.currency,
          name: 'Qorbiq AI',
          description: `Qorbiq AI Unlimited (${targetInterval === 'yearly' ? 'Yearly' : 'Monthly'})`,
          order_id: intent.orderId,
          prefill: {
            name: user?.displayName || '',
            email: user?.email || ''
          },
          theme: {
            color: '#2563eb'
          }
        });
      } catch (checkoutErr: any) {
        if (checkoutErr?.message !== 'PAYMENT_CANCELLED') {
          setUpgradeError(checkoutErr?.message || 'Checkout failed');
        }
        setActivating(false);
        return;
      }

      // Step 3: Cryptographic signature verification on server
      const verification = await freshTestApi.verifyPayment({
        paymentId: intent.paymentId,
        gateway: 'RAZORPAY',
        razorpay_payment_id: checkoutRes.razorpay_payment_id,
        razorpay_order_id: checkoutRes.razorpay_order_id || intent.orderId,
        razorpay_subscription_id: checkoutRes.razorpay_subscription_id || intent.subscriptionId,
        razorpay_signature: checkoutRes.razorpay_signature
      });

      if (!verification.success) {
        throw new Error((verification as any).error || 'Server payment verification failed.');
      }

      setSuccessNotice('🎉 Subscription successfully updated and verified!');
      await refreshBusinesses();
      await loadBilling();
      setTimeout(() => setSuccessNotice(null), 4000);
    } catch (err: any) {
      setUpgradeError(err.message || 'Billing change failed');
    } finally {
      setActivating(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!subscription) return;
    try {
      setCancelLoading(true);
      setCancelError(null);

      const res = await freshTestApi.cancelSubscription({
        subscriptionId: subscription.id,
        reason: 'Cancelled by customer via self-service billing page'
      });

      if (!res.success) {
        throw new Error(res.message || 'Failed to cancel subscription.');
      }

      setShowCancelModal(false);
      setSuccessNotice('Subscription successfully cancelled. Your access remains active until the end of your billing cycle.');
      await loadBilling();
      setTimeout(() => setSuccessNotice(null), 6000);
    } catch (err: any) {
      setCancelError(err.message || 'Cancellation could not be completed. Please try again.');
    } finally {
      setCancelLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3 font-sans">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
        <p className="text-sm text-slate-500">Loading plan subscription details...</p>
      </div>
    );
  }

  const isMonthly = (subscription as any)?.billingInterval !== 'yearly';
  const planPrice = (subscription as any)?.price || (isMonthly ? 299 : 2999);
  const subStatus = (subscription?.status || 'inactive').toLowerCase();
  const isSubscriptionActive = subStatus === 'active' || subStatus === 'trialing';
  const isCancelled = subStatus === 'cancelled' || subStatus === 'cancellation_pending';
  const isPending = subStatus === 'pending' || subStatus === 'authorization_pending';
  const providerName = (subscription as any)?.provider || 'CASHFREE';

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-blue-600" />
            <span>Billing & Subscription</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Manage your Qorbiq AI subscription, billing cycle, renewal mandate, and verified invoices.
          </p>
        </div>
      </div>

      {successNotice && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {upgradeError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{upgradeError}</span>
        </div>
      )}

      {/* Main Plan Overview Card */}
      {subscription ? (
        <section className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-blue-600 shadow-xl space-y-6 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                  {isMonthly ? 'Monthly Subscription' : 'Yearly Subscription'}
                </span>
                
                {/* Status Badges */}
                {isSubscriptionActive && !isCancelled && (
                  <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Active Subscription
                  </span>
                )}
                {isPending && (
                  <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Mandate Authorization Pending</span>
                  </span>
                )}
                {isCancelled && (
                  <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    Cancellation Scheduled
                  </span>
                )}
                {!isSubscriptionActive && !isPending && !isCancelled && (
                  <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                    {subscription.status || 'Inactive'}
                  </span>
                )}

                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                  Gateway: {providerName}
                </span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 mt-2">Qorbiq AI Unlimited</h2>
              <p className="text-xs text-slate-500 mt-0.5 max-w-md">
                Complete access to AI generation, permanent dynamic QR codes, NFC stand, and CRM suite.
              </p>
            </div>

            <div className="text-left sm:text-right">
              <div className="text-3xl font-black text-slate-900">
                ₹{planPrice.toLocaleString()}{' '}
                <span className="text-xs text-slate-500 font-normal">
                  {isMonthly ? '/ month' : '/ year'}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                {isCancelled
                  ? `Access ends on ${new Date(subscription.currentPeriodEnd).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}`
                  : `Renews on ${new Date(subscription.renewalDate || subscription.currentPeriodEnd).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}`}
              </span>
            </div>
          </div>

          {/* Cancellation Notice if Cancellation Scheduled */}
          {isCancelled && (
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-800 space-y-1">
              <span className="font-bold block">Cancellation Confirmed</span>
              <p>
                Your subscription has been cancelled and will not renew automatically. You have full access to all features until{' '}
                <strong>
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                </strong>.
              </p>
            </div>
          )}

          {/* Feature Checklist */}
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              Plan Entitlements:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
              {[
                'Unlimited AI review generation',
                'Unlimited regeneration & alternative drafts',
                'Zero punctuation clean formatting',
                'Permanent Dynamic QR with server redirect',
                '4K HD print & SVG vector QR download',
                'NFC smart stand & counter tag support',
                'English, Hindi & Marathi natural support',
                'Direct Google Review journey integration',
                'CRM lead tracking & sales follow-up portal',
                'Live scan & copy conversion analytics'
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Switch Billing Cycle & Cancel Action */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <span className="font-bold text-xs text-slate-900">
                {isMonthly ? 'Switch to Annual Billing' : 'Current Plan: Annual Billing'}
              </span>
              <p className="text-xs text-slate-500">
                {isMonthly
                  ? 'Save ₹589/year by switching to Yearly billing (₹2,999/yr) compared with 12 monthly payments.'
                  : 'You are on the best-value yearly billing plan (₹2,999/year).'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {isMonthly ? (
                <button
                  type="button"
                  onClick={() => handleSwitchInterval('yearly')}
                  disabled={activating}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer disabled:opacity-50"
                >
                  {activating ? 'Switching...' : 'Upgrade to Yearly (Save ₹589/yr)'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSwitchInterval('monthly')}
                  disabled={activating}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl transition-colors shrink-0 cursor-pointer disabled:opacity-50"
                >
                  {activating ? 'Switching...' : 'Switch to Monthly (₹299/mo)'}
                </button>
              )}

              {/* Cancel Button */}
              {isSubscriptionActive && !isCancelled && (
                <button
                  type="button"
                  onClick={() => setShowCancelModal(true)}
                  className="px-4 py-2 border border-rose-200 hover:bg-rose-50 text-rose-600 font-semibold text-xs rounded-xl transition-colors shrink-0 cursor-pointer"
                >
                  Cancel Subscription
                </button>
              )}
            </div>
          </div>
        </section>
      ) : (
        /* No active subscription card */
        <section className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xs text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mx-auto">
            <CreditCard className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900">No Active Subscription</h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Subscribe to Qorbiq AI to activate your business dashboard, permanent dynamic QR codes, and AI review generation.
            </p>
          </div>
          <div className="pt-2">
            <a
              href="/pricing"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <span>View Plans (From ₹299/mo)</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </section>
      )}

      {/* Payment History / Invoices Table */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-blue-600" />
            <span>Billing Invoices & Payment History</span>
          </h3>
          <span className="text-[11px] font-mono text-emerald-600 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
            {providerName} Verified
          </span>
        </div>

        {invoices.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">
            No past billing invoices recorded yet. Receipts appear here automatically upon verified payment capture.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                  <th className="py-2.5 px-3">Invoice Number</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Gateway</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Invoice PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {invoices.map((inv, idx) => (
                  <tr key={inv.id || idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-blue-600">
                      {inv.invoiceNumber || inv.id}
                    </td>
                    <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                      {inv.issuedAt || inv.createdAt
                        ? new Date(inv.issuedAt || inv.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })
                        : 'Recent'}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-900">
                      ₹{inv.totalAmount || inv.amount}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 font-mono">
                        {inv.gateway || providerName}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          inv.status === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : inv.status === 'REFUNDED'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <a
                        href={`/api/invoices/${inv.id}/pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print PDF</span>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-xs text-slate-500 leading-relaxed pt-2 border-t border-slate-100">
          All payments and recurring mandate renewals are cryptographically verified through Cashfree webhooks.
        </p>
      </section>

      {/* CANCELLATION CONFIRMATION MODAL */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Cancel Recurring Subscription?</h3>
                <span className="text-xs text-slate-500">Self-service cancellation</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to cancel your Qorbiq AI recurring subscription?
              Your recurring mandate will be halted on Cashfree.
              Your business workspace and dynamic QR codes will remain active until the end of your prepaid period (
              <strong>
                {subscription ? new Date(subscription.currentPeriodEnd).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
              </strong>
              ). After this date, your subscription will not renew.
            </p>

            {cancelError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                {cancelError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelError(null);
                }}
                disabled={cancelLoading}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                Keep Subscription
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={cancelLoading}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {cancelLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Cancelling...</span>
                  </>
                ) : (
                  <span>Confirm Cancellation</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
