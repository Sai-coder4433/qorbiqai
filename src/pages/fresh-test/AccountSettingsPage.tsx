import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Shield,
  CheckCircle2,
  Lock,
  Sparkles,
  Zap,
  QrCode,
  CreditCard,
  Check,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../lib/auth-context.tsx';
import { freshTestApi, SubscriptionData, PlanDefinition } from '../../lib/fresh-test-api.ts';

export const AccountSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [subData, setSubData] = useState<{ subscription: SubscriptionData; plan: PlanDefinition } | null>(null);
  const [allPlans, setAllPlans] = useState<PlanDefinition[]>([]);
  const [loadingSub, setLoadingSub] = useState(true);
  const [upgradingPlan, setUpgradingPlan] = useState<string | null>(null);
  const [upgradeSuccess, setUpgradeSuccess] = useState<string | null>(null);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);

  useEffect(() => {
    loadSubscriptionAndPlans();
  }, []);

  const loadSubscriptionAndPlans = async () => {
    try {
      setLoadingSub(true);
      const [sub, plansRes] = await Promise.all([
        freshTestApi.getSubscription().catch(() => null),
        freshTestApi.getPlans().catch(() => null)
      ]);
      if (sub) setSubData(sub);
      if (plansRes && plansRes.mainPlan) setAllPlans([plansRes.mainPlan]);
    } catch (e: any) {
      console.warn('Subscription fetch:', e.message);
    } finally {
      setLoadingSub(false);
    }
  };

  const handleUpgrade = async (planId: string) => {
    setUpgradeError(null);
    setUpgradeSuccess(null);
    setUpgradingPlan(planId);
    try {
      const res = await freshTestApi.upgradeSubscription(planId);
      setSubData(res);
      setUpgradeSuccess(`🎉 Successfully switched to ${res.plan.name} plan (Testing Mode)!`);
      setTimeout(() => setUpgradeSuccess(null), 4000);
    } catch (e: any) {
      setUpgradeError(e.message || 'Upgrade failed');
    } finally {
      setUpgradingPlan(null);
    }
  };

  const currentPlan = subData?.plan;
  const currentSub = subData?.subscription;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-1">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Account & Subscription</h1>
        <p className="text-xs text-slate-500">
          Manage your ReviewFlow profile, tier allowances, and subscription plan.
        </p>
      </div>

      {upgradeSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{upgradeSuccess}</span>
        </div>
      )}

      {upgradeError && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="font-semibold">{upgradeError}</span>
        </div>
      )}

      {/* Grid: Profile & Current Subscription */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <User className="w-4 h-4 text-blue-600" />
            <span>Profile Details</span>
          </h2>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Display Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  readOnly
                  value={user?.displayName || 'Business Owner'}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  readOnly
                  value={user?.email || ''}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">System Role</label>
              <div className="relative">
                <Shield className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  readOnly
                  value={user?.role || 'BUSINESS_OWNER'}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Current Subscription Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <span>Active Plan & Limits</span>
          </h2>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-lg font-bold text-slate-900">{currentPlan?.name || 'Free Trial'}</span>
                <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold uppercase">
                  {currentSub?.status || 'active'}
                </span>
              </div>
              <span className="text-sm font-bold text-slate-700">
                {currentPlan?.priceMonthly ? `₹${currentPlan.priceMonthly}/mo` : 'Free'}
              </span>
            </div>

            {/* Quota Progress */}
            <div className="space-y-2 pt-2 border-t border-slate-200 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 flex items-center gap-1">
                  <QrCode className="w-3.5 h-3.5 text-blue-600" />
                  QR Stand Limit:
                </span>
                <span className="font-bold text-slate-900">
                  {currentPlan?.maxQrCodes ?? 1} QR Stands
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-600 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  AI Monthly Drafts:
                </span>
                <span className="font-bold text-slate-900">
                  {currentSub?.aiGenerationsUsedThisMonth ?? 0} / {currentPlan?.maxAiMonthly ?? 50}
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 leading-tight">
            <strong>Testing Mode Active:</strong> Online payments are in simulated mode. Upgrades are verified server-side without real credit card charges.
          </div>
        </div>
      </div>

      {/* Subscription Plans Selection */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div>
          <h2 className="text-base font-bold text-slate-900">Available Subscription Tiers</h2>
          <p className="text-xs text-slate-500">
            Scale your review collection across multiple physical counters, tables, or store branches in India.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {allPlans.map(plan => {
            const isCurrent = currentSub?.planId === plan.id;
            return (
              <div
                key={plan.id}
                className={`p-5 rounded-2xl border flex flex-col justify-between transition-all ${
                  isCurrent
                    ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/20'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{plan.name}</span>
                    {plan.badge && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold">
                        {plan.badge}
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-900">
                      {plan.priceMonthly === 0 ? 'Free' : `₹${plan.priceMonthly}`}
                    </span>
                    {plan.priceMonthly > 0 && <span className="text-xs text-slate-400">/ month</span>}
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed">{plan.description}</p>

                  <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                    <div className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{plan.maxQrCodes} Active QR Stand{plan.maxQrCodes > 1 ? 's' : ''}</span>
                    </div>
                    <div className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{plan.maxAiMonthly.toLocaleString()} AI Drafts / mo</span>
                    </div>
                    {plan.features.map((feat, idx) => (
                      <div key={idx} className="text-slate-600 text-[11px] flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-slate-400" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  {isCurrent ? (
                    <button
                      type="button"
                      disabled
                      className="w-full py-2 bg-slate-100 text-slate-500 text-xs font-semibold rounded-xl"
                    >
                      Current Plan
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleUpgrade(plan.id)}
                      disabled={upgradingPlan === plan.id}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl cursor-pointer disabled:opacity-50 transition-colors shadow-xs"
                    >
                      {upgradingPlan === plan.id ? 'Switching...' : 'Switch Plan (Test Mode)'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
