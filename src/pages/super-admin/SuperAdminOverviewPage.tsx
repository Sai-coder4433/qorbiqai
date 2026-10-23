import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Building2,
  QrCode,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Clock,
  Compass,
  CreditCard,
  Receipt,
  Package,
  Truck,
  DollarSign,
  AlertTriangle,
  Radio,
  Sliders,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  ChevronRight
} from 'lucide-react';
import { freshTestApi } from '../../lib/fresh-test-api.ts';

export const SuperAdminOverviewPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Quick Action: Suspension Modal
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [suspendType, setSuspendType] = useState<'user' | 'business'>('business');
  const [targetId, setTargetId] = useState('');
  const [suspendReason, setSuspendReason] = useState('');
  const [suspendSubmitting, setSuspendSubmitting] = useState(false);

  useEffect(() => {
    loadOverview();
  }, []);

  const loadOverview = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await freshTestApi.getAdminOverview();
      setOverview(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load Super Admin overview metrics.');
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteSuspension = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetId.trim() || !suspendReason.trim()) return;

    try {
      setSuspendSubmitting(true);
      if (suspendType === 'user') {
        await freshTestApi.suspendClient(targetId.trim(), suspendReason.trim());
      } else {
        await freshTestApi.suspendBusiness(targetId.trim(), suspendReason.trim());
      }
      alert(`Successfully suspended ${suspendType} with recorded reason.`);
      setSuspendModalOpen(false);
      setTargetId('');
      setSuspendReason('');
      await loadOverview();
    } catch (err: any) {
      alert(err.message || 'Failed to execute suspension.');
    } finally {
      setSuspendSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
        <p className="text-sm text-slate-500">Loading platform-wide live administrative telemetry...</p>
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 space-y-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600" />
          <span className="font-bold text-base">Error Loading Overview</span>
        </div>
        <p className="text-xs text-rose-600/90">{error}</p>
        <button
          onClick={loadOverview}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-xs font-semibold rounded-xl text-white transition-colors cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  const {
    totalRegisteredUsers = 0,
    totalBusinesses = 0,
    activeMonthlySubscriptions = 0,
    activeYearlySubscriptions = 0,
    pendingSubscriptions = 0,
    failedSubscriptions = 0,
    cancelledSubscriptions = 0,
    expiredSubscriptions = 0,
    monthlyRecurringRevenue = 0,
    annualRecurringRevenue = 0,
    annualRecurringRevenueLabel = 'Estimated Run-Rate ARR (MRR × 12)',
    totalVerifiedPayments = 0,
    totalVerifiedRevenue = 0,
    standeeOrdersAwaiting = 0,
    standeeOrdersDispatched = 0,
    standeeOrdersDelivered = 0,
    nfcProductsOrdered = 0,
    totalQrCodes = 0,
    totalAiGenerations = 0,
    totalAiRegenerations = 0,
    estimatedAiCost = 0,
    aiUsageTrends = [],
    recentTransactions = [],
    recentActivity = [],
    clients = {},
    businesses = {},
    qr = {},
    ai = {},
    reviewJourney = {}
  } = overview;

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>SaaS Control Center</span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">
              Live Production
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time verified data across businesses, recurring revenue, standee fulfillment, dynamic QR codes, and Gemini AI.
          </p>
        </div>
        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={loadOverview}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setSuspendModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-bold text-rose-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Quick Suspend</span>
          </button>
          <Link
            to="/super-admin/invoices"
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Invoices Ledger</span>
          </Link>
          <Link
            to="/super-admin/orders"
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Package className="w-3.5 h-3.5" />
            <span>Standee Orders</span>
          </Link>
        </div>
      </div>

      {/* CORE REVENUE & RUN-RATE TELEMETRY */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span>Subscription & Verified Revenue Telemetry</span>
          </h2>
          <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            Cashfree Verified
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* MRR */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Monthly Recurring (MRR)</span>
            <div className="text-3xl font-black text-slate-900 mt-2">₹{monthlyRecurringRevenue.toLocaleString()}</div>
            <span className="text-[11px] text-slate-400 mt-1 block">Active recurring monthly revenue</span>
          </div>

          {/* ARR with explicit label */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block">Annual Run-Rate (ARR)</span>
            <div className="text-3xl font-black text-blue-600 mt-2">₹{annualRecurringRevenue.toLocaleString()}</div>
            <span className="text-[11px] text-blue-600/80 mt-1 block font-medium">
              {annualRecurringRevenueLabel}
            </span>
          </div>

          {/* Total Verified Revenue */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">Total Verified Revenue</span>
            <div className="text-3xl font-black text-emerald-600 mt-2">₹{totalVerifiedRevenue.toLocaleString()}</div>
            <span className="text-[11px] text-emerald-600/80 mt-1 block font-medium">
              {totalVerifiedPayments} payments settled
            </span>
          </div>

          {/* Standees / Hardware Revenue */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <span className="text-xs font-bold text-purple-600 uppercase tracking-wider block">NFC & Standee Pipeline</span>
            <div className="text-3xl font-black text-purple-600 mt-2">{nfcProductsOrdered}</div>
            <span className="text-[11px] text-purple-600/80 mt-1 block font-medium">
              NFC & QR units ordered
            </span>
          </div>
        </div>
      </section>

      {/* PLATFORM OPERATIONS METRICS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span>Platform Overview & Fulfillment Status</span>
          </h2>
          <span className="text-[11px] text-slate-400 font-medium">Live sync</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
          {/* Registered Users */}
          <Link to="/super-admin/clients" className="bg-white border border-slate-200 hover:border-blue-400 rounded-2xl p-4 shadow-xs transition-all block">
            <span className="text-[11px] font-semibold text-slate-500 block">Registered Users</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{totalRegisteredUsers}</div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Client accounts</span>
          </Link>

          {/* Businesses */}
          <Link to="/super-admin/businesses" className="bg-white border border-slate-200 hover:border-blue-400 rounded-2xl p-4 shadow-xs transition-all block">
            <span className="text-[11px] font-semibold text-slate-500 block">Total Workspaces</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{totalBusinesses}</div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Managed businesses</span>
          </Link>

          {/* Monthly Subscriptions */}
          <Link to="/super-admin/subscriptions" className="bg-white border border-slate-200 hover:border-blue-400 rounded-2xl p-4 shadow-xs transition-all block">
            <span className="text-[11px] font-semibold text-blue-600 block">Active Monthly (₹299)</span>
            <div className="text-2xl font-black text-blue-600 mt-1">{activeMonthlySubscriptions}</div>
            <span className="text-[10px] text-blue-600/80 mt-0.5 block">Every 1 month</span>
          </Link>

          {/* Yearly Subscriptions */}
          <Link to="/super-admin/subscriptions" className="bg-white border border-slate-200 hover:border-blue-400 rounded-2xl p-4 shadow-xs transition-all block">
            <span className="text-[11px] font-semibold text-indigo-600 block">Active Yearly (₹2,999)</span>
            <div className="text-2xl font-black text-indigo-600 mt-1">{activeYearlySubscriptions}</div>
            <span className="text-[10px] text-indigo-600/80 mt-0.5 block">Every 1 year</span>
          </Link>

          {/* Standees Awaiting Dispatch */}
          <Link to="/super-admin/orders" className="bg-white border border-slate-200 hover:border-amber-400 rounded-2xl p-4 shadow-xs transition-all block">
            <span className="text-[11px] font-semibold text-amber-600 block">Awaiting Dispatch</span>
            <div className="text-2xl font-black text-amber-600 mt-1">{standeeOrdersAwaiting}</div>
            <span className="text-[10px] text-amber-600/80 mt-0.5 block">Standees in production</span>
          </Link>

          {/* Standees Dispatched */}
          <Link to="/super-admin/orders" className="bg-white border border-slate-200 hover:border-blue-400 rounded-2xl p-4 shadow-xs transition-all block">
            <span className="text-[11px] font-semibold text-blue-600 block">Dispatched / In Transit</span>
            <div className="text-2xl font-black text-blue-600 mt-1">{standeeOrdersDispatched}</div>
            <span className="text-[10px] text-blue-600/80 mt-0.5 block">With tracking link</span>
          </Link>

          {/* Standees Delivered */}
          <Link to="/super-admin/orders" className="bg-white border border-slate-200 hover:border-emerald-400 rounded-2xl p-4 shadow-xs transition-all block">
            <span className="text-[11px] font-semibold text-emerald-600 block">Standees Delivered</span>
            <div className="text-2xl font-black text-emerald-600 mt-1">{standeeOrdersDelivered}</div>
            <span className="text-[10px] text-emerald-600/80 mt-0.5 block">At merchant store</span>
          </Link>

          {/* QR Codes */}
          <Link to="/super-admin/dynamic-qr" className="bg-white border border-slate-200 hover:border-blue-400 rounded-2xl p-4 shadow-xs transition-all block">
            <span className="text-[11px] font-semibold text-blue-600 block">Total QR Codes</span>
            <div className="text-2xl font-black text-blue-600 mt-1">{totalQrCodes}</div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Permanent redirects</span>
          </Link>

          {/* AI Generations */}
          <Link to="/super-admin/ai-usage" className="bg-white border border-slate-200 hover:border-purple-400 rounded-2xl p-4 shadow-xs transition-all block">
            <span className="text-[11px] font-semibold text-purple-600 block">AI Drafts Generated</span>
            <div className="text-2xl font-black text-purple-600 mt-1">{totalAiGenerations}</div>
            <span className="text-[10px] text-purple-600/80 mt-0.5 block">Punctuation-free</span>
          </Link>

          {/* AI Regenerations */}
          <Link to="/super-admin/ai-usage" className="bg-white border border-slate-200 hover:border-purple-400 rounded-2xl p-4 shadow-xs transition-all block">
            <span className="text-[11px] font-semibold text-purple-600 block">AI Rewrites</span>
            <div className="text-2xl font-black text-purple-600 mt-1">{totalAiRegenerations}</div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Length/vibe switches</span>
          </Link>

          {/* Estimated AI Cost */}
          <Link to="/super-admin/ai-usage" className="bg-white border border-slate-200 hover:border-rose-400 rounded-2xl p-4 shadow-xs transition-all block">
            <span className="text-[11px] font-semibold text-rose-600 block">Gemini AI Cost</span>
            <div className="text-2xl font-black text-rose-600 mt-1">₹{estimatedAiCost}</div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">API usage cost</span>
          </Link>

          {/* Invoices link */}
          <Link to="/super-admin/invoices" className="bg-white border border-slate-200 hover:border-blue-400 rounded-2xl p-4 shadow-xs transition-all block">
            <span className="text-[11px] font-semibold text-slate-600 block">Sequential Invoices</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{totalVerifiedPayments}</div>
            <span className="text-[10px] text-blue-600 mt-0.5 block">QOR-2026-XXXX &rarr;</span>
          </Link>
        </div>
      </section>

      {/* SUBSCRIPTION HEALTH & LIFECYCLE BREAKDOWN */}
      <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-blue-600" />
            <span>Subscription Lifecycle Health & Gateway Alerts</span>
          </h2>
          <Link to="/super-admin/subscriptions" className="text-xs text-blue-600 font-semibold hover:underline">
            Manage All Subscriptions &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
          <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-2xl space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-800 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Active Plans</span>
            </div>
            <div className="text-2xl font-black text-emerald-900">
              {activeMonthlySubscriptions + activeYearlySubscriptions}
            </div>
            <div className="text-[10px] text-emerald-700">Paid & active mandates</div>
          </div>

          <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-2xl space-y-1">
            <div className="flex items-center gap-1.5 text-amber-800 text-xs font-bold">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Pending</span>
            </div>
            <div className="text-2xl font-black text-amber-900">{pendingSubscriptions}</div>
            <div className="text-[10px] text-amber-700">Awaiting authorization</div>
          </div>

          <div className="bg-rose-50/70 border border-rose-200 p-4 rounded-2xl space-y-1">
            <div className="flex items-center gap-1.5 text-rose-800 text-xs font-bold">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Failed</span>
            </div>
            <div className="text-2xl font-black text-rose-900">{failedSubscriptions}</div>
            <div className="text-[10px] text-rose-700">Payment charges dropped</div>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-1">
            <div className="flex items-center gap-1.5 text-slate-700 text-xs font-bold">
              <XCircle className="w-4 h-4 text-slate-500" />
              <span>Cancelled</span>
            </div>
            <div className="text-2xl font-black text-slate-800">{cancelledSubscriptions}</div>
            <div className="text-[10px] text-slate-500">Auto-renewal stopped</div>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-1 col-span-2 sm:col-span-1">
            <div className="flex items-center gap-1.5 text-slate-700 text-xs font-bold">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>Expired</span>
            </div>
            <div className="text-2xl font-black text-slate-700">{expiredSubscriptions}</div>
            <div className="text-[10px] text-slate-500">Grace period ended</div>
          </div>
        </div>
      </section>

      {/* AI USAGE & 7-DAY TRENDS */}
      {aiUsageTrends && aiUsageTrends.length > 0 && (
        <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>AI Usage & Cost Trends (Last 7 Days)</span>
            </h2>
            <Link to="/super-admin/ai-usage" className="text-xs text-purple-600 font-semibold hover:underline">
              View Detailed AI Telemetry &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-7 gap-3">
            {aiUsageTrends.map((trend: any, idx: number) => (
              <div
                key={idx}
                className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 space-y-1 text-center"
              >
                <div className="text-[10px] font-bold text-slate-400 uppercase">
                  {new Date(trend.date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })}
                </div>
                <div className="text-lg font-black text-slate-900">{trend.generations}</div>
                <div className="text-[10px] text-slate-500">{trend.regenerations} rewrites</div>
                <div className="text-[10px] font-semibold text-rose-600">₹{trend.estimatedCost}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* RECENT TRANSACTIONS TABLE */}
      <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-blue-600" />
            <span>Recent Platform Transactions (Latest 10)</span>
          </h2>
          <Link to="/super-admin/invoices" className="text-xs text-blue-600 font-semibold hover:underline">
            View All Invoices &rarr;
          </Link>
        </div>

        {recentTransactions.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">
            No transactions recorded yet. Payments and standee orders will appear here automatically.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Transaction ID</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Description / Plan</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Gateway</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {recentTransactions.map((tx: any, idx: number) => (
                  <tr key={tx.id || idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-mono font-medium text-blue-600">
                      {tx.id}
                    </td>
                    <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                      {tx.timestamp ? new Date(tx.timestamp).toLocaleString('en-IN') : 'Recent'}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-900">
                      {tx.plan || tx.description || 'Subscription'}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900">
                      ₹{tx.amount}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        {tx.gateway || 'CASHFREE'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          tx.status === 'SUCCESS' || tx.status === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* SUSPENSION QUICK-ACTION MODAL */}
      {suspendModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleExecuteSuspension}
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Suspend Account or Business</h3>
                <span className="text-xs text-slate-500">Recorded audit justification required</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Target Type</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSuspendType('business')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl border cursor-pointer ${
                    suspendType === 'business'
                      ? 'bg-rose-50 border-rose-300 text-rose-700'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  Business Workspace
                </button>
                <button
                  type="button"
                  onClick={() => setSuspendType('user')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl border cursor-pointer ${
                    suspendType === 'user'
                      ? 'bg-rose-50 border-rose-300 text-rose-700'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  Client User Account
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                {suspendType === 'business' ? 'Business ID' : 'Client User ID'}{' '}
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                placeholder={suspendType === 'business' ? 'e.g. biz_...' : 'e.g. usr_... or client ID'}
                required
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Mandatory Suspension Reason <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="Explain violation, chargeback fraud, or reason for suspension..."
                required
                rows={3}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setSuspendModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={suspendSubmitting || !targetId.trim() || !suspendReason.trim()}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                {suspendSubmitting ? 'Suspending...' : 'Confirm Suspension'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
