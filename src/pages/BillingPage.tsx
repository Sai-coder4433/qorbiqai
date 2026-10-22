import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Zap,
  Building,
  Layers,
  ArrowRight,
  ShieldCheck,
  Bell,
  Check,
  Download,
  FileText
} from 'lucide-react';
import { fetchApi } from '../lib/api.ts';
import { AppLayout } from '../components/layout/AppLayout.tsx';

interface Plan {
  id: string;
  name: 'FREE' | 'STARTER' | 'GROWTH' | 'PRO';
  displayName: string;
  priceMonthly: number;
  currency: string;
  status: 'ACTIVE' | 'COMING_SOON';
  maxActiveQrCodes: number;
  features: string[];
}

export const BillingPage: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subData, setSubData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [waitlistModalPlan, setWaitlistModalPlan] = useState<Plan | null>(null);
  const [waitlistEmail, setWaitlistEmail] = useState('owner@atharvaelectricals.in');
  const [waitlistJoined, setWaitlistJoined] = useState(false);

  const loadSubscriptionInfo = async () => {
    try {
      setLoading(true);
      const [subRes, plansRes] = await Promise.all([
        fetchApi<any>('/subscription?businessId=biz_001'),
        fetchApi<any>('/subscription/plans')
      ]);
      if (subRes) setSubData(subRes);
      if (plansRes?.plans) setPlans(plansRes.plans);
    } catch (e) {
      console.error('Failed to load subscription:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptionInfo();
  }, []);

  const handleJoinWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistModalPlan) return;
    try {
      await fetchApi('/subscription/waitlist', {
        method: 'POST',
        body: JSON.stringify({
          planName: waitlistModalPlan.name,
          email: waitlistEmail
        })
      });
      setWaitlistJoined(true);
      setTimeout(() => {
        setWaitlistModalPlan(null);
        setWaitlistJoined(false);
      }, 2500);
    } catch (e: any) {
      alert(e.message || 'Waitlist registration completed');
    }
  };

  const usage = subData?.usage || {
    activeQrCodes: 1,
    maxActiveQrCodes: 1,
    percentageUsed: 100,
    totalScansThisMonth: 107
  };

  return (
    <AppLayout>
      <div className="space-y-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="border-b border-zinc-200 dark:border-zinc-800 pb-5">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Billing & Subscription
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Manage your subscription tier, monitor QR code usage limits, and preview upcoming expansion tiers.
          </p>
        </div>

        {/* Current Plan & Quota Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Plan Status */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Current Plan</div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-2xl font-bold text-zinc-900 dark:text-white">Free Launch</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                Active
              </span>
            </div>
            <div className="text-xs text-zinc-500 mt-2 leading-relaxed">
              Lifetime free access to 1 active Google Review QR code with direct redirection and real scan tracking.
            </div>
          </div>

          {/* QR Usage Limit */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">QR Quota Limit</div>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-2xl font-bold text-zinc-900 dark:text-white">{usage.activeQrCodes}</span>
              <span className="text-zinc-400 text-sm">/ {usage.maxActiveQrCodes} Active Code</span>
            </div>
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden mt-3">
              <div
                className={`h-full rounded-full ${usage.activeQrCodes >= usage.maxActiveQrCodes ? 'bg-amber-500' : 'bg-blue-600'}`}
                style={{ width: `${usage.percentageUsed}%` }}
              />
            </div>
            <div className="text-[11px] text-zinc-400 mt-2">
              {usage.activeQrCodes >= usage.maxActiveQrCodes ? 'Limit reached (1/1). Upgrade or pause to swap.' : 'Quota available.'}
            </div>
          </div>

          {/* Monthly Scans Recorded */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Scan Bandwidth</div>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{usage.totalScansThisMonth}</span>
              <span className="text-zinc-400 text-sm">scans this month</span>
            </div>
            <div className="text-xs text-zinc-500 mt-2">
              <strong>Unlimited scans:</strong> We never cap or throttle customer scan redirects on any plan.
            </div>
          </div>
        </div>

        {/* SUBSCRIPTION PLANS (Section 10) */}
        <div>
          <div className="mb-6">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Subscription Plans</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Only the Free plan is available for activation at launch. Advanced tiers will activate soon.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {/* PLAN 1: FREE (Launch Active) */}
            <div className="bg-white dark:bg-zinc-900 border-2 border-blue-600 rounded-2xl p-6 shadow-md flex flex-col justify-between relative">
              <div className="absolute -top-3 left-6 bg-blue-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
                Current Plan
              </div>
              <div>
                <div className="font-bold text-base text-zinc-900 dark:text-white mt-1">Free Launch</div>
                <div className="text-xs text-zinc-500 mt-0.5">Essential Google review setup for local stores.</div>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-zinc-900 dark:text-white">$0</span>
                  <span className="text-xs text-zinc-400">/ month</span>
                </div>

                <div className="border-t border-zinc-100 dark:border-zinc-800 my-4" />

                <ul className="space-y-2.5 text-xs text-zinc-700 dark:text-zinc-300">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>One business profile</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>1 active QR code</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Direct Google review redirect</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Basic scan analytics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>High-res PNG download</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Real-time dashboard</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6">
                <button
                  disabled
                  className="w-full py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-semibold text-xs rounded-xl cursor-default"
                >
                  Active Plan
                </button>
              </div>
            </div>

            {/* PLAN 2: STARTER (Coming Soon) */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between relative opacity-90 hover:opacity-100 transition-opacity">
              <div className="absolute -top-3 right-6 bg-zinc-800 text-zinc-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Coming Soon
              </div>
              <div>
                <div className="font-bold text-base text-zinc-900 dark:text-white mt-1">Starter</div>
                <div className="text-xs text-zinc-500 mt-0.5">Multi-location & placement tracking.</div>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-zinc-900 dark:text-white">$19</span>
                  <span className="text-xs text-zinc-400">/ month</span>
                </div>

                <div className="border-t border-zinc-100 dark:border-zinc-800 my-4" />

                <ul className="space-y-2.5 text-xs text-zinc-700 dark:text-zinc-300">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span><strong>Up to 5 active QR codes</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>Advanced scan trends & analytics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>Print-quality SVG vector export</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>Ready-to-print PDF stand templates</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>QR placement comparison</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>Extended 90-day history</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6">
                <button
                  onClick={() => setWaitlistModalPlan({ name: 'STARTER', displayName: 'Starter Tier' } as any)}
                  className="w-full py-2 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-semibold text-xs rounded-xl transition-colors"
                >
                  Join Waitlist
                </button>
              </div>
            </div>

            {/* PLAN 3: GROWTH (Coming Soon) */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between relative opacity-90 hover:opacity-100 transition-opacity">
              <div className="absolute -top-3 right-6 bg-zinc-800 text-zinc-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Coming Soon
              </div>
              <div>
                <div className="font-bold text-base text-zinc-900 dark:text-white mt-1">Growth</div>
                <div className="text-xs text-zinc-500 mt-0.5">Google API integration & reviews monitoring.</div>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-zinc-900 dark:text-white">$49</span>
                  <span className="text-xs text-zinc-400">/ month</span>
                </div>

                <div className="border-t border-zinc-100 dark:border-zinc-800 my-4" />

                <ul className="space-y-2.5 text-xs text-zinc-700 dark:text-zinc-300">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span><strong>Up to 20 active QR codes</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>Authorized Google Business Profile OAuth</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>Real-time review monitoring</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>Review response tools</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>Multi-location support</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>Executive reporting</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6">
                <button
                  onClick={() => setWaitlistModalPlan({ name: 'GROWTH', displayName: 'Growth Tier' } as any)}
                  className="w-full py-2 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-semibold text-xs rounded-xl transition-colors"
                >
                  Join Waitlist
                </button>
              </div>
            </div>

            {/* PLAN 4: PRO (Coming Soon) */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between relative opacity-90 hover:opacity-100 transition-opacity">
              <div className="absolute -top-3 right-6 bg-zinc-800 text-zinc-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Coming Soon
              </div>
              <div>
                <div className="font-bold text-base text-zinc-900 dark:text-white mt-1">Pro</div>
                <div className="text-xs text-zinc-500 mt-0.5">Enterprise franchises & team access.</div>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-zinc-900 dark:text-white">$99</span>
                  <span className="text-xs text-zinc-400">/ month</span>
                </div>

                <div className="border-t border-zinc-100 dark:border-zinc-800 my-4" />

                <ul className="space-y-2.5 text-xs text-zinc-700 dark:text-zinc-300">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span><strong>Unlimited active QR codes</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>Multi-branch franchise hub</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>Team role-based access</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>Webhook & REST API integrations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>Automated reputation digests</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>Dedicated account support</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6">
                <button
                  onClick={() => setWaitlistModalPlan({ name: 'PRO', displayName: 'Pro Tier' } as any)}
                  className="w-full py-2 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-semibold text-xs rounded-xl transition-colors"
                >
                  Join Waitlist
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Gateway Readiness & Architecture Notice */}
        <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
                Payment Gateway Integration Architecture (Razorpay / Stripe)
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed max-w-3xl">
                The database tables (<code>subscriptions</code>, <code>subscription_plans</code>, <code>usage_counters</code>) and webhook listeners are pre-configured for instant activation when paid tiers launch. Per our launch policy, no payments or dummy checkout flows are accepted until paid features are live.
              </p>
            </div>
          </div>
        </div>

        {/* Invoice & Billing History Structure */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Billing & Invoice History</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Records and receipts for your account.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-800/40 text-zinc-400 font-semibold uppercase">
                <tr>
                  <th className="px-4 py-3">Invoice ID</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20">
                  <td className="px-4 py-3 font-mono font-semibold text-zinc-900 dark:text-white">
                    INV-2026-001
                  </td>
                  <td className="px-4 py-3 text-zinc-500">
                    Oct 2, 2026
                  </td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                    Free Launch Plan
                  </td>
                  <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-white">
                    $0.00
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                      Paid
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => alert('Free Plan Receipt: $0.00 USD - Active.')}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 font-medium"
                    >
                      <Download className="w-3.5 h-3.5" /> View
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* WAITLIST MODAL */}
        {waitlistModalPlan && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                  Join Early Access for {waitlistModalPlan.name}
                </h3>
                <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                  Be the first to access multiple QR codes, print-ready PDF vector kits, and automated reputation features when this tier launches.
                </p>
              </div>

              {waitlistJoined ? (
                <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 text-center text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> You're on the priority waitlist!
                </div>
              ) : (
                <form onSubmit={handleJoinWaitlist} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                      Notification Email
                    </label>
                    <input
                      type="email"
                      required
                      value={waitlistEmail}
                      onChange={e => setWaitlistEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs dark:text-white"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setWaitlistModalPlan(null)}
                      className="px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-600 dark:text-zinc-400"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm"
                    >
                      Notify Me on Activation
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};
