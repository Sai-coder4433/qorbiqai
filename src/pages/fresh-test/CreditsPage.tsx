import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CreditCard,
  History,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  PlusCircle,
  X,
  Building2,
  ShieldCheck
} from 'lucide-react';
import { freshTestApi, CreditsOverview, CreditPackage } from '../../lib/fresh-test-api.ts';

export const CreditsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [creditsData, setCreditsData] = useState<CreditsOverview | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  useEffect(() => {
    loadCredits();
  }, []);

  const loadCredits = async () => {
    try {
      setLoading(true);
      const data = await freshTestApi.getCredits();
      setCreditsData(data);
    } catch (err: any) {
      console.error('Failed to load credits:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (pkg: CreditPackage) => {
    try {
      setPurchasing(true);
      setPurchaseError(null);
      setPurchaseSuccess(null);

      const res = await freshTestApi.purchaseCredits(pkg.id);
      setPurchaseSuccess(res.message || `Successfully purchased ${pkg.credits} credits!`);
      await loadCredits();
      setTimeout(() => {
        setShowPurchaseModal(false);
        setPurchaseSuccess(null);
      }, 2000);
    } catch (err: any) {
      setPurchaseError(err.message || 'Payment processing failed. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  if (loading || !creditsData) {
    return (
      <div className="py-24 text-center space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
        <p className="text-sm text-slate-500">Loading AI credits & usage...</p>
      </div>
    );
  }

  const { creditsAllocated, creditsUsed, creditsRemaining, transactions, packages } = creditsData;
  const percentageRemaining = Math.max(0, Math.min(100, Math.round((creditsRemaining / (creditsAllocated || 100)) * 100)));

  return (
    <div className="space-y-6 pb-12 font-sans max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900">AI Credits & Usage</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            1 credit is deducted per review draft or regeneration. Business analysis is free.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowPurchaseModal(true)}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Buy More Credits</span>
        </button>
      </div>

      {/* Credit Balance Card (Section 31) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              AI Review Credits
            </span>
            <div className="flex items-baseline gap-3 mt-1">
              <span className="text-4xl font-extrabold text-slate-900">
                {creditsRemaining}
              </span>
              <span className="text-sm text-slate-500 font-medium">
                / {creditsAllocated} allocated this cycle
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <div className="text-slate-400 font-medium">Used</div>
              <div className="text-lg font-bold text-slate-800">{creditsUsed}</div>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-center">
              <div className="text-blue-600 font-medium">Remaining</div>
              <div className="text-lg font-bold text-blue-700">{creditsRemaining}</div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-slate-500">
            <span>Usage</span>
            <span className="font-semibold text-slate-700">{percentageRemaining}% available</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                percentageRemaining > 25
                  ? 'bg-blue-600'
                  : percentageRemaining > 10
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${percentageRemaining}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>{creditsUsed} used</span>
            <span>{creditsRemaining} remaining</span>
          </div>
        </div>

        {creditsRemaining <= 15 && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>You are running low on AI review credits.</span>
            </div>
            <button
              onClick={() => setShowPurchaseModal(true)}
              className="text-xs font-bold text-amber-900 underline hover:no-underline cursor-pointer"
            >
              Top Up
            </button>
          </div>
        )}
      </div>

      {/* Credit Transactions History (Section 32) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-0">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Transaction History</h2>
            <p className="text-xs text-slate-500">Every credit deduction, allocation, and top-up is logged.</p>
          </div>
          <button
            onClick={loadCredits}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
            title="Refresh history"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Business</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4 text-right">Credits</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                      {new Date(tx.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {tx.businessName || 'ReviewFlow System'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="capitalize">
                        {tx.type.replace(/_/g, ' ').toLowerCase()}
                      </span>
                      {tx.note && <span className="text-[11px] text-slate-400 block">{tx.note}</span>}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold">
                      <span className={tx.credits < 0 ? 'text-slate-900' : 'text-emerald-600'}>
                        {tx.credits > 0 ? `+${tx.credits}` : tx.credits}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-400">
            No credit transactions recorded yet.
          </div>
        )}
      </div>

      {/* BUY MORE CREDITS MODAL (Section 36) */}
      {showPurchaseModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Buy More Review Credits</h3>
                <p className="text-xs text-slate-500">Top-up credits never expire and roll over automatically.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowPurchaseModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {purchaseSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{purchaseSuccess}</span>
              </div>
            )}

            {purchaseError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{purchaseError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-xs transition-all flex flex-col justify-between space-y-3 bg-white"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">{pkg.name}</span>
                      {pkg.badge && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100">
                          {pkg.badge}
                        </span>
                      )}
                    </div>
                    <div className="text-2xl font-black text-slate-900">
                      {pkg.credits} <span className="text-xs font-normal text-slate-500">Credits</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="font-bold text-slate-800 text-sm">
                      {pkg.currency === 'INR' ? '₹' : '$'}{pkg.price}
                    </span>
                    <button
                      type="button"
                      disabled={purchasing}
                      onClick={() => handlePurchase(pkg)}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {purchasing ? 'Processing...' : 'Buy Now'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-slate-50 text-slate-500 text-[11px] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Credits are added atomically to your account upon verified confirmation.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
