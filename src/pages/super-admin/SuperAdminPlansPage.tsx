import React, { useState, useEffect } from 'react';
import {
  Layers,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldCheck,
  Tag,
  ArrowRight,
  TrendingUp,
  History
} from 'lucide-react';

interface PlanDefinition {
  id: string;
  name: string;
  tagline: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  description: string;
  features: string[];
  trialDays: number;
  discount: number;
  paymentGateway: string;
  planStatus: 'ACTIVE' | 'ARCHIVED';
  currentVersion: number;
  updatedAt?: string;
}

interface PlanVersionRecord {
  id: string;
  planId: string;
  version: number;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  features: string[];
  effectiveFrom: string;
  createdBy: string;
}

export const SuperAdminPlansPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [plan, setPlan] = useState<PlanDefinition | null>(null);
  const [versions, setVersions] = useState<PlanVersionRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form edit state
  const [name, setName] = useState('Qorbiq AI Unlimited');
  const [monthlyPrice, setMonthlyPrice] = useState(299);
  const [yearlyPrice, setYearlyPrice] = useState(2999);
  const [currency, setCurrency] = useState('INR');
  const [description, setDescription] = useState('');
  const [trialDays, setTrialDays] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [paymentGateway, setPaymentGateway] = useState('razorpay');
  const [planStatus, setPlanStatus] = useState<'ACTIVE' | 'ARCHIVED'>('ACTIVE');
  const [featuresText, setFeaturesText] = useState('');

  useEffect(() => {
    loadPlan();
  }, []);

  const loadPlan = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/admin/plans', {
        headers: {
          'x-admin-auth': 'superadmin',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load plans');

      setPlan(data.plan);
      setVersions(data.versions || []);

      if (data.plan) {
        setName(data.plan.name || 'Qorbiq AI Unlimited');
        setMonthlyPrice(data.plan.monthlyPrice ?? 299);
        setYearlyPrice(data.plan.yearlyPrice ?? 2999);
        setCurrency(data.plan.currency || 'INR');
        setDescription(data.plan.description || '');
        setTrialDays(data.plan.trialDays ?? 0);
        setDiscount(data.plan.discount ?? 0);
        setPaymentGateway(data.plan.paymentGateway || 'razorpay');
        setPlanStatus(data.plan.planStatus || 'ACTIVE');
        setFeaturesText((data.plan.features || []).join('\n'));
      }
    } catch (err: any) {
      setError(err.message || 'Error loading plan definition');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const features = featuresText
        .split('\n')
        .map(f => f.trim())
        .filter(Boolean);

      const payload = {
        name,
        monthlyPrice: Number(monthlyPrice),
        yearlyPrice: Number(yearlyPrice),
        currency,
        description,
        features,
        trialDays: Number(trialDays),
        discount: Number(discount),
        paymentGateway,
        planStatus
      };

      const res = await fetch('/api/admin/plans', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-auth': 'superadmin',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update plan');

      setPlan(data.plan);
      if (data.newVersionCreated) {
        setSuccess(`🎉 Plan updated successfully! New version v${data.plan.currentVersion} created. Historical invoices remain protected.`);
      } else {
        setSuccess('🎉 Plan configuration updated successfully.');
      }

      await loadPlan();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.message || 'Error updating plan');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
        <p className="text-sm text-slate-500">Loading plan and version history...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>Plans & Pricing Management</span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700">
              One Plan Only
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Section 1 & 5: ReviewFlow Unlimited is the sole subscription model. Modifying pricing automatically creates a new version while locking past subscriptions.
          </p>
        </div>
        <button
          onClick={loadPlan}
          className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-2 transition-colors cursor-pointer shadow-xs self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {/* Plan Details & Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Editor Form */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">Current Plan Configuration</h2>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
              v{plan?.currentVersion || 1}
            </span>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Plan Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-hidden focus:border-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Currency
                </label>
                <select
                  value={currency}
                  onChange={e => setCurrency(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-hidden focus:border-blue-600 bg-white"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-blue-700">
                  Monthly Price ({currency === 'INR' ? '₹' : '$'})
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={monthlyPrice}
                  onChange={e => setMonthlyPrice(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-lg border border-blue-200 text-base font-bold text-slate-900 focus:outline-hidden focus:border-blue-600 bg-white"
                  required
                />
                <span className="text-[11px] text-blue-600/80 block">Default: ₹299/month</span>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-emerald-700">
                  Yearly Price ({currency === 'INR' ? '₹' : '$'})
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={yearlyPrice}
                  onChange={e => setYearlyPrice(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-lg border border-emerald-200 text-base font-bold text-slate-900 focus:outline-hidden focus:border-emerald-600 bg-white"
                  required
                />
                <span className="text-[11px] text-emerald-600/80 block">Default: ₹2,999/year</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Description
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-blue-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Trial Days
                </label>
                <input
                  type="number"
                  min="0"
                  value={trialDays}
                  onChange={e => setTrialDays(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Discount (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discount}
                  onChange={e => setDiscount(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Gateway
                </label>
                <select
                  value={paymentGateway}
                  onChange={e => setPaymentGateway(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-blue-600 bg-white"
                >
                  <option value="razorpay">Razorpay</option>
                  <option value="cashfree">Cashfree</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Included Features (one per line)
              </label>
              <textarea
                rows={6}
                value={featuresText}
                onChange={e => setFeaturesText(e.target.value)}
                placeholder="Unlimited AI review generation&#10;Permanent Dynamic QR..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 focus:outline-hidden focus:border-blue-600 leading-relaxed"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save & Deploy Pricing</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Version History & Immutability Rules */}
        <div className="space-y-6">
          {/* Card: Live Customer Preview */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-blue-950 text-white shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Customer View
              </span>
              <span className="text-xs font-mono text-blue-300">Live Active</span>
            </div>
            <div>
              <h3 className="text-xl font-black text-white">{name}</h3>
              <p className="text-xs text-slate-300 mt-1">Unlimited AI generations with zero customer limits</p>
            </div>
            <div className="pt-2 border-t border-white/10 flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">
                {currency === 'INR' ? '₹' : '$'}{monthlyPrice}
              </span>
              <span className="text-xs text-slate-400">/ month</span>
            </div>
            <div className="text-xs text-slate-300 flex items-center gap-1.5">
              <span>or</span>
              <span className="font-bold text-emerald-400">
                {currency === 'INR' ? '₹' : '$'}{yearlyPrice} / year
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                Save 17%
              </span>
            </div>
          </div>

          {/* Card: Version History */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Plan Version History</h3>
            </div>
            <p className="text-[11px] text-slate-500">
              Section 6: Every subscription locks in its original version and price. Past invoices are never rewritten.
            </p>

            <div className="space-y-3 pt-2">
              {versions.length === 0 ? (
                <div className="text-xs text-slate-400 italic">No historical versions recorded yet.</div>
              ) : (
                versions.map(v => (
                  <div
                    key={v.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 font-mono">Version v{v.version}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(v.effectiveFrom).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Monthly: ₹{v.monthlyPrice}</span>
                      <span>Yearly: ₹{v.yearlyPrice}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
