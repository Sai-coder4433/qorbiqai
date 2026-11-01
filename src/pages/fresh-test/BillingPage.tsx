import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Check,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  Receipt,
  Clock,
  ArrowRight,
  Printer,
  Download,
  Lock,
  Sparkles,
  Calendar,
  X
} from 'lucide-react';
import { useAuth } from '../../lib/auth-context.tsx';
import { useBusiness } from '../../lib/business-context.tsx';
import { freshTestApi, SubscriptionData, QorbiqPlanItem } from '../../lib/fresh-test-api.ts';
import { openCashfreeCheckout } from '../../lib/cashfree.ts';

// Official Plans Configuration
const OFFICIAL_RENEWAL_PLANS: Record<'qorbiq_6_months' | 'qorbiq_12_months', QorbiqPlanItem> = {
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
    tagline: 'Flexible 6-Month AI review automation.',
    features: [
      '180 Days Full Access',
      'One-Time Payment — No Mandates',
      'Manual Renewal Only',
      'Unlimited AI review generation',
      'Permanent Dynamic QR with server redirect'
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
    tagline: 'Best Value: 1 Full Year access with ₹601 savings.',
    discount: 16.7,
    features: [
      '365 Days (1 Full Year) Access',
      'One-Time Payment — No Mandates',
      'Manual Renewal Only',
      'Save ₹601 vs two 6-month cycles',
      'Unlimited AI review generation',
      'Permanent Dynamic QR with server redirect'
    ]
  }
};

export const BillingPage: React.FC = () => {
  const { user } = useAuth();
  const { refreshBusinesses, activeBusiness } = useBusiness();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [invoices, setInvoices] = useState<any[]>([]);

  // Renewal selection and confirmation state (Requirement 8 & 10)
  const [selectedRenewalPlan, setSelectedRenewalPlan] = useState<'qorbiq_6_months' | 'qorbiq_12_months'>('qorbiq_12_months');
  const [confirmingPlan, setConfirmingPlan] = useState<QorbiqPlanItem | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

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

  const handleOpenConfirmModal = (planId: 'qorbiq_6_months' | 'qorbiq_12_months') => {
    setActionError(null);
    setConfirmingPlan(OFFICIAL_RENEWAL_PLANS[planId]);
  };

  const handleProceedWithRenewal = async () => {
    if (!confirmingPlan) return;

    try {
      setCheckoutLoading(true);
      setActionError(null);

      // Create server-side payment intent (Requirement 2, 3, 4)
      const intent = await freshTestApi.createPaymentIntent({
        planId: confirmingPlan.id,
        amount: confirmingPlan.price,
        durationDays: confirmingPlan.durationDays,
        gateway: 'CASHFREE',
        billingModel: 'ONE_TIME',
        autoRenew: false
      });

      if (intent.provider === 'CASHFREE' && intent.paymentSessionId) {
        await openCashfreeCheckout({
          paymentSessionId: intent.paymentSessionId,
          mode: intent.environment || 'sandbox'
        });
        return;
      }

      throw new Error('Cashfree payment session could not be established.');
    } catch (err: any) {
      if (err?.message === 'PAYMENT_CANCELLED') {
        setActionError('Renewal checkout was cancelled. No charge was processed.');
      } else {
        const rawMsg = err?.message || '';
        if (rawMsg.toLowerCase().includes('fetch failed') || rawMsg.toLowerCase().includes('enotfound')) {
          setActionError('Unable to connect to payment server. Please verify backend server is running and internet access is available.');
        } else {
          setActionError(rawMsg || 'Renewal checkout could not be initiated.');
        }
      }
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3 font-sans">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
        <p className="text-sm text-slate-500">Loading plan and billing entitlement...</p>
      </div>
    );
  }

  // Calculate status and entitlement
  const isExpired = subscription
    ? subscription.status === 'EXPIRED' ||
      subscription.status === 'expired' ||
      new Date(subscription.currentPeriodEnd).getTime() <= Date.now()
    : false;

  const isActive = subscription && !isExpired && (subscription.status === 'ACTIVE' || subscription.status === 'active' || subscription.status === 'trialing');

  const expiryDate = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd)
    : null;

  const rawStartDate = subscription?.currentPeriodStart || subscription?.createdAt;
  const startDate = rawStartDate ? new Date(rawStartDate) : null;

  const daysRemaining = expiryDate
    ? Math.max(0, Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const currentPlanName = subscription?.planName || (subscription?.billingInterval === 'yearly' ? 'Qorbiq AI – 12 Months' : 'Qorbiq AI – 6 Months');
  const currentDurationDays = subscription?.durationDays || (subscription?.billingInterval === 'yearly' ? 365 : 180);
  const currentPrice = subscription?.price || subscription?.amount || (subscription?.billingInterval === 'yearly' ? 2999 : 1800);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 font-sans">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-blue-600" />
            <span>Billing & Access Entitlement</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            View your active Qorbiq AI plan, access expiry date, verified invoices, and manual renewals.
          </p>
        </div>
      </div>

      {successNotice && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {actionError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Main Plan Status Card */}
      {subscription ? (
        <section className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-blue-600 shadow-xl space-y-6 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                {/* Status Badge */}
                {isActive && (
                  <span className="text-[10px] font-bold uppercase px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Active Access ({daysRemaining} Days Left)</span>
                  </span>
                )}
                {isExpired && (
                  <span className="text-[10px] font-bold uppercase px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-rose-600" />
                    <span>Access Expired · Manual Renewal Required</span>
                  </span>
                )}

                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  One-Time Payment
                </span>

                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  Auto Renewal: Disabled
                </span>

                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                  Renewal: Manual
                </span>
              </div>

              <h2 className="text-2xl font-black text-slate-900 mt-3">{currentPlanName}</h2>
              <p className="text-xs text-slate-500 mt-1 max-w-md">
                Full access to AI review generation, permanent dynamic QR codes, NFC support, and CRM portal.
              </p>
            </div>

            <div className="text-left sm:text-right">
              <div className="text-3xl font-black text-slate-900">
                ₹{currentPrice.toLocaleString()}{' '}
                <span className="text-xs text-slate-500 font-normal">INR ({currentDurationDays} Days)</span>
              </div>
              <span className="text-[11px] text-slate-500 block mt-1">
                {isExpired
                  ? `Expired on ${expiryDate?.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
                  : `Access valid until ${expiryDate?.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`}
              </span>
            </div>
          </div>

          {/* Entitlement Details Matrix */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Plan Name</span>
              <span className="font-semibold text-slate-900">{currentPlanName}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Access Duration</span>
              <span className="font-semibold text-slate-900">{currentDurationDays} Days</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Start Date</span>
              <span className="font-semibold text-slate-900">
                {startDate ? startDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Expiry Date</span>
              <span className={`font-semibold ${isExpired ? 'text-rose-600' : 'text-slate-900'}`}>
                {expiryDate ? expiryDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
              </span>
            </div>
          </div>

          {/* Expired Warning Banner if applicable */}
          {isExpired && (
            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 flex items-start gap-3 text-xs text-rose-800">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Your access period has finished.</strong>
                <p className="mt-0.5 text-rose-700">
                  Because auto-renewal is disabled, no recurring debit was attempted. Please select a plan below to renew your access manually.
                </p>
              </div>
            </div>
          )}
        </section>
      ) : (
        /* No Active Subscription */
        <section className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xs text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mx-auto">
            <CreditCard className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900">No Active Plan Found</h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Select one of our two official one-time payment plans below to activate your business workspace and dynamic QR stand.
            </p>
          </div>
        </section>
      )}

      {/* ============================================================= */}
      {/* REQUIREMENT 10: MANUAL PLAN RENEWAL SECTION */}
      {/* ============================================================= */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-blue-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Calendar className="w-4 h-4" />
            <span>Manual Plan Renewal</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            {isExpired ? 'Renew Your Access' : 'Renew or Extend Access'}
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Choose either plan to renew your business access. Both options are strictly One-Time Payments with zero recurring bank debits.
          </p>
        </div>

        {/* The Two Renewal Choices */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Plan 1: 6 Months */}
          <div
            onClick={() => setSelectedRenewalPlan('qorbiq_6_months')}
            className={`p-5 rounded-2xl border-2 transition-all cursor-pointer space-y-4 ${
              selectedRenewalPlan === 'qorbiq_6_months'
                ? 'border-blue-600 bg-blue-50/40 shadow-sm ring-1 ring-blue-600/20'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-full">
                  Half-Yearly
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">Qorbiq AI – 6 Months</h3>
                <p className="text-xs text-slate-500">180 Days Access · Manual Renewal</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-slate-900">₹1,800</span>
                <span className="text-[10px] text-slate-500 block font-semibold">INR (One-Time)</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
              <span className="text-slate-600">Auto Renewal: <strong className="text-rose-600">Disabled</strong></span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenConfirmModal('qorbiq_6_months');
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs"
              >
                Renew 6 Months (₹1,800)
              </button>
            </div>
          </div>

          {/* Plan 2: 12 Months */}
          <div
            onClick={() => setSelectedRenewalPlan('qorbiq_12_months')}
            className={`p-5 rounded-2xl border-2 transition-all cursor-pointer space-y-4 relative ${
              selectedRenewalPlan === 'qorbiq_12_months'
                ? 'border-blue-600 bg-blue-50/40 shadow-sm ring-1 ring-blue-600/20'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-full">
                    Yearly
                  </span>
                  <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Save ₹601
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-900 mt-1">Qorbiq AI – 12 Months</h3>
                <p className="text-xs text-slate-500">365 Days Access · Manual Renewal</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-slate-900">₹2,999</span>
                <span className="text-[10px] text-slate-500 block font-semibold">INR (One-Time)</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
              <span className="text-slate-600">Auto Renewal: <strong className="text-rose-600">Disabled</strong></span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenConfirmModal('qorbiq_12_months');
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs"
              >
                Renew 12 Months (₹2,999)
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================= */}
      {/* REQUIREMENT 9: VERIFIED PAYMENT INVOICES TABLE */}
      {/* ============================================================= */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-blue-600" />
            <span>Verified Tax Invoices & Receipts</span>
          </h3>
          <span className="text-[11px] font-mono text-emerald-600 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
            Cashfree Verified
          </span>
        </div>

        {invoices.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">
            No past billing invoices recorded yet. Invoices are generated only after verified successful payment.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                  <th className="py-2.5 px-3">Invoice Number</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Plan / Description</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">PDF Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {invoices.map((inv, idx) => (
                  <tr key={inv.id || idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-blue-600">
                      {inv.invoiceNumber || inv.id}
                    </td>
                    <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                      {inv.invoiceDate || inv.issuedAt || inv.createdAt
                        ? new Date(inv.invoiceDate || inv.issuedAt || inv.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })
                        : 'Recent'}
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-800">
                      {inv.items?.[0]?.description?.split('(')[0]?.trim() || inv.businessName || 'Qorbiq AI'}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900">
                      ₹{(inv.grandTotal ?? inv.totalAmount ?? inv.amount)?.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        PAID
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={`/api/invoices/${inv.id}/pdf`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                          title="Print / View Invoice"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print</span>
                        </a>
                        <a
                          href={`/api/invoices/${inv.id}/pdf?download=1`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition-colors"
                          title="Download Verified Tax PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download PDF</span>
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

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
                <h3 className="text-lg font-black text-slate-900">Confirm Plan Renewal</h3>
              </div>
              <button
                type="button"
                onClick={() => setConfirmingPlan(null)}
                disabled={checkoutLoading}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {actionError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{actionError}</span>
              </div>
            )}

            {/* Clear Order Summary (Requirement 8) */}
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
                  Disabled (Manual Only)
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
                onClick={handleProceedWithRenewal}
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
              <span>Cashfree PG 256-Bit SSL Encrypted Checkout</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
