import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Check,
  Sparkles,
  QrCode,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  Clock,
  ArrowRight,
  Zap,
  Globe,
  Receipt,
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

  useEffect(() => {
    loadBilling();
  }, [activeBusiness?.id]);

  const loadBilling = async () => {
    try {
      setLoading(true);
      const [subRes, invRes] = await Promise.all([
        freshTestApi.getSubscription().catch(() => ({ subscription: null })),
        freshTestApi.getBillingHistory().catch(() => ({ invoices: [] }))
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

      // Step 1: Create payment intent on backend for target interval
      const intent = await freshTestApi.createPaymentIntent({
        planId: 'reviewflow_unlimited',
        billingInterval: targetInterval
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

      // Step 2b: Open Razorpay checkout
      let checkoutRes;
      try {
        checkoutRes = await openRazorpayCheckout({
          key: intent.keyId,
          amount: intent.amount,
          currency: intent.currency,
          name: 'Qorbiq AI',
          description: `ReviewFlow / Qorbiq Unlimited (${targetInterval === 'yearly' ? 'Annual' : 'Monthly'})`,
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

      setSuccessNotice('🎉 Subscription successfully updated and verified by backend!');
      await refreshBusinesses();
      await loadBilling();
      setTimeout(() => setSuccessNotice(null), 4000);
    } catch (err: any) {
      setUpgradeError(err.message || 'Billing change failed');
    } finally {
      setActivating(false);
    }
  };

  if (loading || !subscription) {
    return (
      <div className="py-20 text-center space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
        <p className="text-sm text-slate-500">Loading plan subscription details...</p>
      </div>
    );
  }

  const isMonthly = (subscription as any).billingInterval !== 'yearly';
  const planPrice = (subscription as any).price || (isMonthly ? 999 : 9999);
  const isSubscriptionActive = subscription.status === 'active' || subscription.status === 'ACTIVE' || subscription.status === 'trialing';
  const providerName = (subscription as any).provider || 'CASHFREE';

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-blue-600" />
            <span>Billing & Subscription</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Manage your Qorbiq AI / ReviewFlow Unlimited subscription, billing cycle, and verified receipts.
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
      <section className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-blue-600 shadow-xl space-y-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                Single Commercial Plan
              </span>
              <span
                className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                  isSubscriptionActive
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {isSubscriptionActive ? 'Active Subscription' : 'Expired'}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                Gateway: {providerName}
              </span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 mt-1">ReviewFlow / Qorbiq Unlimited</h2>
            <p className="text-xs text-slate-500 mt-0.5 max-w-md">
              Complete access to AI generation, permanent dynamic QR codes, NFC stand, and CRM suite.
            </p>
          </div>

          <div className="text-left sm:text-right">
            <div className="text-3xl font-black text-slate-900">
              ₹{planPrice.toLocaleString()} <span className="text-xs text-slate-500 font-normal">{isMonthly ? '/ month' : '/ year'}</span>
            </div>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              Renews on {new Date(subscription.currentPeriodEnd).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>

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

        {/* Switch Billing Cycle */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <span className="font-bold text-xs text-slate-900">
              {isMonthly ? 'Switch to Annual Billing' : 'Current Plan: Annual Billing'}
            </span>
            <p className="text-xs text-slate-500">
              {isMonthly
                ? 'Save ~17% by switching to Yearly billing (₹9,999/yr) — 2 months free.'
                : 'You are on the best-value yearly billing plan.'}
            </p>
          </div>
          {isMonthly ? (
            <button
              type="button"
              onClick={() => handleSwitchInterval('yearly')}
              disabled={activating}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer disabled:opacity-50"
            >
              {activating ? 'Switching...' : 'Upgrade to Yearly (Save 17%)'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleSwitchInterval('monthly')}
              disabled={activating}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl transition-colors shrink-0 cursor-pointer disabled:opacity-50"
            >
              {activating ? 'Switching...' : 'Switch to Monthly'}
            </button>
          )}
        </div>
      </section>

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
            No past billing invoices recorded yet. New receipts appear here automatically upon payment capture.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                  <th className="py-2.5 px-3">Invoice Ref</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Gateway</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {invoices.map((inv, idx) => (
                  <tr key={inv.id || idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3 font-mono font-medium text-slate-900">
                      {inv.id}
                    </td>
                    <td className="py-3 px-3 text-slate-500">
                      {inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : 'Recent'}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-900">
                      ₹{inv.amount}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-xs text-slate-500 leading-relaxed pt-2 border-t border-slate-100">
          All payments and subscription renewals are cryptographically verified through server webhooks.
          GST-compliant receipts and invoice downloads are dispatched to <strong>{user?.email}</strong> following every successful payment event.
        </p>
      </section>
    </div>
  );
};
