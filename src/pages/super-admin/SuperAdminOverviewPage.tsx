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
  Copy,
  ArrowRight,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Compass,
  Inbox,
  UserCheck
} from 'lucide-react';
import { freshTestApi } from '../../lib/fresh-test-api.ts';

export const SuperAdminOverviewPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
        <p className="text-sm text-slate-500">Loading platform-wide administrative metrics...</p>
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

  const { clients, businesses, qr, ai, reviewJourney, masterCards } = overview;
  const cards = masterCards || {
    totalBusinesses: businesses?.total || 0,
    activeBusinesses: businesses?.active || 0,
    pendingOnboarding: businesses?.onboardingIncomplete || 0,
    expiredBusinesses: 0,
    activeSubscriptions: clients?.paid || 0,
    monthlyRevenue: 0,
    yearlyRevenue: 0,
    successfulPayments: clients?.paid || 0,
    failedPayments: 0,
    totalAiGenerations: ai?.totalGenerations || 0,
    totalAiRegenerations: 0,
    totalQrCodes: qr?.activeQrCodes || 0,
    totalQrScans: qr?.totalScans || 0,
    totalCrmLeads: 0,
    totalEmployees: 0,
    estimatedAiCost: 0,
    estimatedRevenue: 0,
    estimatedMargin: 0
  };

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
            Real-time telemetry across businesses, revenue, permanent dynamic QRs, Gemini AI cost, and customer journeys.
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
          <Link
            to="/super-admin/dynamic-qr"
            className="px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Dynamic QR</span>
          </Link>
          <Link
            to="/super-admin/ai-usage"
            className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Telemetry</span>
          </Link>
          <Link
            to="/super-admin/plans"
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <span>ReviewFlow Unlimited</span>
          </Link>
        </div>
      </div>

      {/* SECTION 4: EXACT 18 PRODUCTION DATABASE MASTER CARDS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span>Executive Platform Telemetry (18 Live Metrics)</span>
          </h2>
          <span className="text-[11px] text-slate-400 font-medium">Real-time sync</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
          {/* 1. Total Businesses */}
          <Link to="/super-admin/businesses" className="bg-white border border-slate-200 hover:border-blue-400 rounded-2xl p-4 shadow-xs transition-all block">
            <span className="text-[11px] font-semibold text-slate-500 block">Total Businesses</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{cards.totalBusinesses}</div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Registered shops</span>
          </Link>

          {/* 2. Active Businesses */}
          <Link to="/super-admin/businesses" className="bg-white border border-slate-200 hover:border-emerald-400 rounded-2xl p-4 shadow-xs transition-all block">
            <span className="text-[11px] font-semibold text-emerald-600 block">Active Businesses</span>
            <div className="text-2xl font-black text-emerald-600 mt-1">{cards.activeBusinesses}</div>
            <span className="text-[10px] text-emerald-600/80 mt-0.5 block">Operational</span>
          </Link>

          {/* 3. Pending Onboarding */}
          <Link to="/super-admin/businesses" className="bg-white border border-slate-200 hover:border-amber-400 rounded-2xl p-4 shadow-xs transition-all block">
            <span className="text-[11px] font-semibold text-amber-600 block">Pending Onboard</span>
            <div className="text-2xl font-black text-amber-600 mt-1">{cards.pendingOnboarding}</div>
            <span className="text-[10px] text-amber-600/80 mt-0.5 block">Setup required</span>
          </Link>

          {/* 4. Expired Businesses */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-rose-600 block">Expired Businesses</span>
            <div className="text-2xl font-black text-rose-600 mt-1">{cards.expiredBusinesses}</div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Need renewal</span>
          </div>

          {/* 5. Active Subscriptions */}
          <Link to="/super-admin/subscriptions" className="bg-white border border-slate-200 hover:border-blue-400 rounded-2xl p-4 shadow-xs transition-all block">
            <span className="text-[11px] font-semibold text-blue-600 block">Active Subscriptions</span>
            <div className="text-2xl font-black text-blue-600 mt-1">{cards.activeSubscriptions}</div>
            <span className="text-[10px] text-blue-600/80 mt-0.5 block">Unlimited Plan</span>
          </Link>

          {/* 6. Monthly Revenue */}
          <Link to="/super-admin/payments" className="bg-white border border-slate-200 hover:border-indigo-400 rounded-2xl p-4 shadow-xs transition-all block">
            <span className="text-[11px] font-semibold text-indigo-600 block">Monthly Revenue</span>
            <div className="text-2xl font-black text-slate-900 mt-1">₹{cards.monthlyRevenue.toLocaleString()}</div>
            <span className="text-[10px] text-indigo-600/80 mt-0.5 block">Recurring ₹999/mo</span>
          </Link>

          {/* 7. Yearly Revenue */}
          <Link to="/super-admin/payments" className="bg-white border border-slate-200 hover:border-indigo-400 rounded-2xl p-4 shadow-xs transition-all block">
            <span className="text-[11px] font-semibold text-indigo-600 block">Yearly Revenue</span>
            <div className="text-2xl font-black text-slate-900 mt-1">₹{cards.yearlyRevenue.toLocaleString()}</div>
            <span className="text-[10px] text-indigo-600/80 mt-0.5 block">Annual ₹9999/yr</span>
          </Link>

          {/* 8. Successful Payments */}
          <Link to="/super-admin/payments" className="bg-white border border-slate-200 hover:border-emerald-400 rounded-2xl p-4 shadow-xs transition-all block">
            <span className="text-[11px] font-semibold text-emerald-600 block">Paid Orders</span>
            <div className="text-2xl font-black text-emerald-600 mt-1">{cards.successfulPayments}</div>
            <span className="text-[10px] text-emerald-600/80 mt-0.5 block">Razorpay verified</span>
          </Link>

          {/* 9. Failed Payments */}
          <Link to="/super-admin/payments" className="bg-white border border-slate-200 hover:border-rose-400 rounded-2xl p-4 shadow-xs transition-all block">
            <span className="text-[11px] font-semibold text-rose-600 block">Failed Payments</span>
            <div className="text-2xl font-black text-rose-600 mt-1">{cards.failedPayments}</div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Gateway dropped</span>
          </Link>

          {/* 10. Total AI Generations */}
          <Link to="/super-admin/ai-usage" className="bg-white border border-slate-200 hover:border-purple-400 rounded-2xl p-4 shadow-xs transition-all block">
            <span className="text-[11px] font-semibold text-purple-600 block">Total AI Drafts</span>
            <div className="text-2xl font-black text-purple-600 mt-1">{cards.totalAiGenerations}</div>
            <span className="text-[10px] text-purple-600/80 mt-0.5 block">Punctuation-free</span>
          </Link>

          {/* 11. Total AI Regenerations */}
          <Link to="/super-admin/ai-usage" className="bg-white border border-slate-200 hover:border-purple-400 rounded-2xl p-4 shadow-xs transition-all block">
            <span className="text-[11px] font-semibold text-purple-600 block">AI Regenerations</span>
            <div className="text-2xl font-black text-purple-600 mt-1">{cards.totalAiRegenerations}</div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Customer rewrites</span>
          </Link>

          {/* 12. Total QR Codes */}
          <Link to="/super-admin/dynamic-qr" className="bg-white border border-slate-200 hover:border-blue-400 rounded-2xl p-4 shadow-xs transition-all block">
            <span className="text-[11px] font-semibold text-blue-600 block">Total QR Codes</span>
            <div className="text-2xl font-black text-blue-600 mt-1">{cards.totalQrCodes}</div>
            <span className="text-[10px] text-blue-600/80 mt-0.5 block">Dynamic redirects</span>
          </Link>

          {/* 13. Total QR Scans */}
          <Link to="/super-admin/dynamic-qr" className="bg-white border border-slate-200 hover:border-blue-400 rounded-2xl p-4 shadow-xs transition-all block">
            <span className="text-[11px] font-semibold text-blue-600 block">Total QR Scans</span>
            <div className="text-2xl font-black text-blue-600 mt-1">{cards.totalQrScans}</div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Physical stand scans</span>
          </Link>

          {/* 14. Total CRM Leads */}
          <Link to="/super-admin/crm" className="bg-white border border-slate-200 hover:border-amber-400 rounded-2xl p-4 shadow-xs transition-all block">
            <span className="text-[11px] font-semibold text-amber-600 block">Total CRM Leads</span>
            <div className="text-2xl font-black text-amber-600 mt-1">{cards.totalCrmLeads}</div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Sales inquiries</span>
          </Link>

          {/* 15. Total Employees */}
          <Link to="/super-admin/employees" className="bg-white border border-slate-200 hover:border-blue-400 rounded-2xl p-4 shadow-xs transition-all block">
            <span className="text-[11px] font-semibold text-blue-600 block">Total Employees</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{cards.totalEmployees}</div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">RBAC Staff</span>
          </Link>

          {/* 16. Estimated AI Cost */}
          <Link to="/super-admin/ai-usage" className="bg-white border border-slate-200 hover:border-rose-400 rounded-2xl p-4 shadow-xs transition-all block">
            <span className="text-[11px] font-semibold text-rose-600 block">Estimated AI Cost</span>
            <div className="text-2xl font-black text-rose-600 mt-1">₹{cards.estimatedAiCost}</div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Gemini tokens</span>
          </Link>

          {/* 17. Estimated Revenue */}
          <Link to="/super-admin/payments" className="bg-white border border-slate-200 hover:border-emerald-400 rounded-2xl p-4 shadow-xs transition-all block">
            <span className="text-[11px] font-semibold text-emerald-600 block">Total Revenue</span>
            <div className="text-2xl font-black text-emerald-600 mt-1">₹{cards.estimatedRevenue.toLocaleString()}</div>
            <span className="text-[10px] text-emerald-600/80 mt-0.5 block">Gross billing</span>
          </Link>

          {/* 18. Estimated Margin */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-emerald-700 block">Estimated Margin</span>
            <div className="text-2xl font-black text-emerald-700 mt-1">₹{cards.estimatedMargin.toLocaleString()}</div>
            <span className="text-[10px] text-emerald-700/80 mt-0.5 block">Net profit</span>
          </div>
        </div>
      </section>

      {/* SECTION 8.1: Clients Cards */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <span>Client Accounts</span>
          </h2>
          <Link to="/super-admin/clients" className="text-xs text-blue-600 hover:underline font-semibold">
            View All Clients &rarr;
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500">Total Clients</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{clients.total}</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-emerald-600">Active Clients</span>
            <div className="text-2xl font-black text-emerald-600 mt-1">{clients.active}</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-rose-600">Suspended</span>
            <div className="text-2xl font-black text-rose-600 mt-1">{clients.suspended}</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-blue-600">New (30 Days)</span>
            <div className="text-2xl font-black text-blue-600 mt-1">{clients.newThisMonth}</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-amber-600">Trial Clients</span>
            <div className="text-2xl font-black text-amber-600 mt-1">{clients.trial}</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-indigo-600">Paid Clients</span>
            <div className="text-2xl font-black text-indigo-600 mt-1">{clients.paid}</div>
          </div>
        </div>
      </section>

      {/* SECTION 8.2: Businesses Cards */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>Businesses & Google Review Readiness</span>
          </h2>
          <Link to="/super-admin/businesses" className="text-xs text-blue-600 hover:underline font-semibold">
            View All Businesses &rarr;
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500">Total Businesses</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{businesses.total}</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-emerald-600">Active Businesses</span>
            <div className="text-2xl font-black text-emerald-600 mt-1">{businesses.active}</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-amber-600">Onboarding Incomplete</span>
            <div className="text-2xl font-black text-amber-600 mt-1">{businesses.onboardingIncomplete}</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-teal-600">Review URL Configured</span>
            <div className="text-2xl font-black text-teal-600 mt-1">{businesses.googleUrlConfigured}</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-rose-600">Review URL Missing</span>
            <div className="text-2xl font-black text-rose-600 mt-1">{businesses.googleUrlNotConfigured}</div>
          </div>
        </div>
      </section>

      {/* SECTION 8.3 & 8.4: QR & AI Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* QR Metrics */}
        <section className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <QrCode className="w-4 h-4 text-emerald-600" />
              <span>QR Stands & Scans</span>
            </h2>
            <span className="text-xs text-slate-400 font-mono">Platform Volume</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
              <span className="text-[11px] text-slate-500">Active QR Stands</span>
              <div className="text-xl font-black text-slate-900 mt-1">{qr.activeQrCodes}</div>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
              <span className="text-[11px] text-slate-500">Total Scans (All-time)</span>
              <div className="text-xl font-black text-emerald-600 mt-1">{qr.totalScans}</div>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
              <span className="text-[11px] text-slate-500">Scans Today</span>
              <div className="text-xl font-black text-blue-600 mt-1">{qr.scansToday}</div>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
              <span className="text-[11px] text-slate-500">Scans This Week</span>
              <div className="text-xl font-black text-indigo-600 mt-1">{qr.scansThisWeek}</div>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 sm:col-span-2">
              <span className="text-[11px] text-slate-500">Scans This Month</span>
              <div className="text-xl font-black text-indigo-600 mt-1">{qr.scansThisMonth}</div>
            </div>
          </div>
        </section>

        {/* AI Metrics */}
        <section className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>AI Review Draft Engine</span>
            </h2>
            <span className="text-xs text-slate-400 font-mono">Gemini 2.5 Flash</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
              <span className="text-[11px] text-slate-500">Total AI Drafts</span>
              <div className="text-xl font-black text-slate-900 mt-1">{ai.totalGenerations}</div>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
              <span className="text-[11px] text-slate-500">Drafts Today</span>
              <div className="text-xl font-black text-amber-600 mt-1">{ai.generationsToday}</div>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
              <span className="text-[11px] text-slate-500">Drafts This Month</span>
              <div className="text-xl font-black text-indigo-600 mt-1">{ai.generationsThisMonth}</div>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
              <span className="text-[11px] text-slate-500">Failed Generations</span>
              <div className="text-xl font-black text-emerald-600 mt-1">{ai.failedGenerations}</div>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 sm:col-span-2">
              <span className="text-[11px] text-slate-500">Average Drafts / Client</span>
              <div className="text-xl font-black text-blue-600 mt-1">{ai.averagePerClient} drafts</div>
            </div>
          </div>
        </section>
      </div>

      {/* SECTION 8.5: Review Journey */}
      <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <Compass className="w-5 h-5 text-blue-600" />
            <span>Customer Review Journey Funnel</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Complete conversion sequence from initial QR scan in store to opening the direct Google Review dialogue.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Step 1</span>
            <div className="text-xs font-semibold text-slate-700">QR Scans</div>
            <div className="text-2xl font-black text-slate-900 pt-1">{reviewJourney.qrScans}</div>
            <div className="text-[10px] text-slate-500">In-store customer scans</div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Step 2</span>
            <div className="text-xs font-semibold text-slate-700">Review Page Opens</div>
            <div className="text-2xl font-black text-blue-600 pt-1">{reviewJourney.reviewPageOpens}</div>
            <div className="text-[10px] text-slate-500">Assistance page loaded</div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Step 3</span>
            <div className="text-xs font-semibold text-slate-700">AI Draft Generations</div>
            <div className="text-2xl font-black text-amber-600 pt-1">{reviewJourney.aiDraftGenerations}</div>
            <div className="text-[10px] text-slate-500">Wording drafts requested</div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Step 4</span>
            <div className="text-xs font-semibold text-slate-700">Copy Actions</div>
            <div className="text-2xl font-black text-indigo-600 pt-1">{reviewJourney.copyActions}</div>
            <div className="text-[10px] text-slate-500">Copied to clipboard</div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1 col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Step 5</span>
            <div className="text-xs font-semibold text-emerald-600">Google Link Clicks</div>
            <div className="text-2xl font-black text-emerald-600 pt-1">{reviewJourney.googleReviewLinkClicks}</div>
            <div className="text-[10px] text-slate-500">Opened review window</div>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200 text-slate-600 text-xs flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Honest Metric Separation: Never labeled as "Reviews Received" without GBP verified publication confirmation.</span>
          </span>
          <span className="font-mono text-[11px] text-blue-600 font-semibold">Audit Verified</span>
        </div>
      </section>
    </div>
  );
};
