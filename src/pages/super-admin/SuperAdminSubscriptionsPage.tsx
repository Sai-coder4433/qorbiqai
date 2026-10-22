import React, { useState, useEffect } from 'react';
import { CreditCard, Check, Sparkles, Sliders, ShieldCheck, RefreshCw, AlertCircle, Clock } from 'lucide-react';
import { freshTestApi } from '../../lib/fresh-test-api.ts';

export const SuperAdminSubscriptionsPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const res = await freshTestApi.getAdminSubscriptions();
      setData(res);
    } catch (err: any) {
      console.error('Failed to load subscriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-blue-600" />
            <span>Subscriptions & Plans</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            ReviewFlow Pro single purchasable plan configuration, subscription statuses, and unreleased feature roadmaps.
          </p>
        </div>
        <button
          onClick={loadSubscriptions}
          className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-2 cursor-pointer shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Main Purchasable Plan Card */}
      <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              Single Main Product Plan
            </span>
            <h2 className="text-2xl font-black text-slate-900 pt-2">{data?.plan?.name || 'ReviewFlow Pro'}</h2>
            <p className="text-xs text-slate-500 max-w-xl">{data?.plan?.tagline || 'Turn every genuine customer experience into a better-written review draft — and make your Google Review journey simple.'}</p>
          </div>
          <div className="text-left sm:text-right">
            <div className="text-3xl font-black text-slate-900">${data?.plan?.priceMonthly || 49} <span className="text-xs text-slate-400 font-normal">/ month</span></div>
            <span className="text-[11px] text-emerald-600 font-semibold">Active & Purchasable</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Monthly AI Allowance</span>
            <span className="text-slate-900 font-bold text-base mt-1 block">{data?.plan?.maxAiMonthly || 500} generations</span>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Active QR Codes</span>
            <span className="text-slate-900 font-bold text-base mt-1 block">{data?.plan?.maxQrCodes || 5} stands / account</span>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 col-span-2 sm:col-span-1">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Business Scope</span>
            <span className="text-slate-900 font-bold text-base mt-1 block">{data?.plan?.maxBusinesses || 1} business profile</span>
          </div>
        </div>

        {/* Feature list */}
        <div className="space-y-2 pt-2">
          <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">Included Features:</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs text-slate-700">
            {(data?.plan?.features || []).map((f: string, i: number) => (
              <div key={i} className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Unreleased Features Roadmap */}
      <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Future Roadmap Tiers & Features</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Strictly disabled from purchase until fully integrated and validated.</p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold uppercase">
            Coming Soon
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
          {(data?.comingSoon || []).map((item: any) => (
            <div key={item.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900">{item.name}</h3>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 font-bold uppercase">
                  {item.badge}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Active Subscribers List */}
      <section className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-xs">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Client Subscription Records ({data?.subscriptions?.length || 0})
        </h2>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs">Loading subscriptions...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Business</th>
                  <th className="py-3 px-4">Plan</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">AI Generations</th>
                  <th className="py-3 px-4">Next Renewal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {(data?.subscriptions || []).map((sub: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{sub.userName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{sub.userEmail}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-800">{sub.businessName}</td>
                    <td className="py-3 px-4 font-semibold text-blue-700">
                      {sub.subscription?.planName || 'ReviewFlow Pro'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        {sub.subscription?.status || 'Active'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {sub.subscription?.aiGenerationsUsedThisMonth || 0} / {sub.subscription?.maxAiMonthly || 500}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {sub.subscription?.currentPeriodEnd
                        ? new Date(sub.subscription.currentPeriodEnd).toLocaleDateString()
                        : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
