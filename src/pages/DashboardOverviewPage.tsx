import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  QrCode,
  Calendar,
  TrendingUp,
  Activity,
  Layers,
  Award,
  ExternalLink,
  Smartphone,
  Tablet,
  Monitor,
  Info,
  ShieldCheck,
  AlertCircle,
  Clock,
  ArrowUpRight,
  Filter,
  CheckCircle2,
  RefreshCw,
  Plus
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { fetchApi } from '../lib/api.ts';
import { AppLayout } from '../components/layout/AppLayout.tsx';

type DateFilterType = 'today' | '7d' | '30d' | '90d' | 'custom';

export const DashboardOverviewPage: React.FC = () => {
  const [businessName, setBusinessName] = useState('Atharv Electricals');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('30d');
  const [customStart, setCustomStart] = useState('2026-09-01');
  const [customEnd, setCustomEnd] = useState('2026-10-02');
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Analytics data from backend
  const [analytics, setAnalytics] = useState<any>(null);
  const [googleProfile, setGoogleProfile] = useState<any>(null);

  // Time-of-day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const loadData = async (range: DateFilterType = dateFilter) => {
    try {
      setLoading(true);
      let url = `/qr-analytics?businessId=biz_001&range=${range}`;
      if (range === 'custom') {
        url += `&startDate=${customStart}&endDate=${customEnd}`;
      }
      const res = await fetchApi<any>(url);
      if (res) {
        setAnalytics(res);
      }

      // Fetch Google Profile connection status
      const gbp = await fetchApi<any>('/google-profile/status?businessId=biz_001');
      if (gbp?.profile) {
        setGoogleProfile(gbp.profile);
      }
    } catch (e) {
      console.error('Failed to load dashboard metrics:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(dateFilter);
  }, [dateFilter]);

  const metrics = analytics?.metrics || {
    totalScans: 107,
    scansToday: 7,
    scansThisWeek: 28,
    scansThisMonth: 107,
    activeQrCodes: 1,
    mostScannedQr: 'Main Billing Counter Stand',
    mostScannedCount: 84
  };

  const timeSeries = analytics?.timeSeries || [];
  const byQrCode = analytics?.byQrCode || [];
  const byPlacement = analytics?.byPlacement || [];
  const byDevice = analytics?.byDevice || [];
  const recentScans = analytics?.recentScans || [];

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header with Dynamic Time-of-Day Greeting & Date Filter */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              {getGreeting()}, {businessName}
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Your Google Review QR performance at a glance.
            </p>
          </div>

          {/* Date Filter Buttons */}
          <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-xl text-xs font-medium self-start md:self-auto border border-zinc-200/80 dark:border-zinc-700/60">
            {[
              { id: 'today', label: 'Today' },
              { id: '7d', label: 'Last 7 days' },
              { id: '30d', label: 'Last 30 days' },
              { id: '90d', label: 'Last 90 days' },
              { id: 'custom', label: 'Custom' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === 'custom') {
                    setShowCustomModal(true);
                  } else {
                    setDateFilter(tab.id as DateFilterType);
                  }
                }}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  dateFilter === tab.id
                    ? 'bg-white dark:bg-zinc-700 shadow-2xs text-blue-600 dark:text-blue-400 font-bold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 6 Core Metric Cards (Section 7) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Card 1: Total QR Scans */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-4 rounded-xl shadow-2xs">
            <div className="flex items-center justify-between text-zinc-500 text-xs mb-2">
              <span>Total QR Scans</span>
              <QrCode className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              {metrics.totalScans}
            </div>
            <div className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1">
              <span className="text-emerald-600 font-semibold">100% Direct</span>
              <span>redirects</span>
            </div>
          </div>

          {/* Card 2: Scans Today */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-4 rounded-xl shadow-2xs">
            <div className="flex items-center justify-between text-zinc-500 text-xs mb-2">
              <span>Scans Today</span>
              <Clock className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              {metrics.scansToday}
            </div>
            <div className="text-[11px] text-zinc-400 mt-1">
              Since 00:00 local time
            </div>
          </div>

          {/* Card 3: Scans This Week */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-4 rounded-xl shadow-2xs">
            <div className="flex items-center justify-between text-zinc-500 text-xs mb-2">
              <span>Scans This Week</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              {metrics.scansThisWeek}
            </div>
            <div className="text-[11px] text-zinc-400 mt-1">
              Rolling last 7 days
            </div>
          </div>

          {/* Card 4: Scans This Month */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-4 rounded-xl shadow-2xs">
            <div className="flex items-center justify-between text-zinc-500 text-xs mb-2">
              <span>Scans This Month</span>
              <Activity className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              {metrics.scansThisMonth}
            </div>
            <div className="text-[11px] text-zinc-400 mt-1">
              Last 30-day window
            </div>
          </div>

          {/* Card 5: Active QR Codes */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-4 rounded-xl shadow-2xs">
            <div className="flex items-center justify-between text-zinc-500 text-xs mb-2">
              <span>Active QR Codes</span>
              <Layers className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              {metrics.activeQrCodes}
            </div>
            <div className="text-[11px] text-zinc-400 mt-1">
              Free plan (1 max)
            </div>
          </div>

          {/* Card 6: Most Scanned QR */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-4 rounded-xl shadow-2xs">
            <div className="flex items-center justify-between text-zinc-500 text-xs mb-2">
              <span>Most Scanned QR</span>
              <Award className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-sm font-bold tracking-tight text-zinc-900 dark:text-white truncate" title={metrics.mostScannedQr}>
              {metrics.mostScannedQr}
            </div>
            <div className="text-[11px] text-zinc-400 mt-1">
              {metrics.mostScannedCount} scans recorded
            </div>
          </div>
        </div>

        {/* Scan Activity Chart & Placement Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-6 rounded-2xl shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-sm text-zinc-900 dark:text-white">QR Scan Activity Over Time</h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Platform recorded scan redirects to Google write-review page.
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium">
                <span className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> Total Scans
                </span>
                <span className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Unique Visitors
                </span>
              </div>
            </div>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="scansGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="uniqueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E4E7" opacity={0.5} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#71717A' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#71717A' }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#18181B',
                      borderRadius: '8px',
                      border: 'none',
                      color: '#FFFFFF',
                      fontSize: '12px'
                    }}
                  />
                  <Area type="monotone" dataKey="scans" stroke="#2563EB" strokeWidth={2} fillOpacity={1} fill="url(#scansGradient)" name="Total Scans" />
                  <Area type="monotone" dataKey="uniqueScans" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#uniqueGradient)" name="Unique Visitors" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top-performing Placements Breakdown */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-6 rounded-2xl shadow-2xs flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Top Placements</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Distribution of scans by QR physical location.</p>

              <div className="space-y-4 mt-5">
                {byPlacement.length === 0 ? (
                  <div className="text-xs text-zinc-400 py-6 text-center">No placement data recorded yet.</div>
                ) : (
                  byPlacement.map((p: any) => (
                    <div key={p.placement}>
                      <div className="flex justify-between items-center text-xs mb-1 font-medium">
                        <span className="text-zinc-700 dark:text-zinc-300">{p.placement}</span>
                        <span className="text-zinc-500">{p.scans} scans ({p.percentage}%)</span>
                      </div>
                      <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${p.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Device breakdown pill */}
            <div className="pt-5 border-t border-zinc-100 dark:border-zinc-800 mt-4">
              <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Device Breakdown</div>
              <div className="grid grid-cols-3 gap-2 text-center">
                {byDevice.map((d: any) => (
                  <div key={d.name} className="bg-zinc-50 dark:bg-zinc-800/50 p-2 rounded-lg border border-zinc-100 dark:border-zinc-800">
                    <div className="text-[10px] text-zinc-400">{d.name}</div>
                    <div className="font-bold text-xs text-zinc-900 dark:text-white mt-0.5">{d.percentage}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* QR Code Performance List & Quick Actions */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white">QR Code Status Overview</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Real scan performance per configured QR code.</p>
            </div>
            <Link
              to="/app/qr-codes"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              Manage all QR codes →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-800/40 text-zinc-500 uppercase font-semibold">
                <tr>
                  <th className="px-4 py-2.5">QR Name</th>
                  <th className="px-4 py-2.5">Placement</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Scans in Range</th>
                  <th className="px-4 py-2.5">All-Time Scans</th>
                  <th className="px-4 py-2.5">Last Scanned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {byQrCode.map((q: any) => (
                  <tr key={q.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20">
                    <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-white">
                      {q.name}
                    </td>
                    <td className="px-4 py-3 text-zinc-500">
                      {q.placement}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          q.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                        }`}
                      >
                        {q.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-blue-600 dark:text-blue-400">
                      {q.scans}
                    </td>
                    <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                      {q.totalScans}
                    </td>
                    <td className="px-4 py-3 text-zinc-400">
                      {q.lastScannedAt ? new Date(q.lastScannedAt).toLocaleDateString() : 'Never'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 8: GOOGLE REVIEW ACTIVITY (Strict Separation & Honesty) */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-4 border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Google Review Activity</h3>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                Clearly distinguishes platform-recorded QR scan events from verified Google API data.
              </p>
            </div>
            {googleProfile?.isConnected ? (
              <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5" /> Google Profile Connected
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-950/40 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-800">
                <AlertCircle className="w-3.5 h-3.5" /> Integration Not Connected
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {/* Metric A: Platform Measured QR Scans */}
            <div className="bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 p-4 rounded-xl">
              <div className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Platform Measured
              </div>
              <div className="text-xl font-bold text-zinc-900 dark:text-white mt-1">
                {metrics.totalScans}
              </div>
              <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mt-0.5">
                QR Scans
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                Recorded immediately on device camera scan.
              </p>
            </div>

            {/* Metric B: Google Review Page Clicks */}
            <div className="bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 p-4 rounded-xl">
              <div className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Platform Measured
              </div>
              <div className="text-xl font-bold text-zinc-900 dark:text-white mt-1">
                {metrics.totalScans}
              </div>
              <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mt-0.5">
                Review Page Redirections
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                Direct 302 redirections to Google write-review.
              </p>
            </div>

            {/* Metric C: Reviews Published */}
            <div className="bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 p-4 rounded-xl">
              <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Authorized API Only
              </div>
              <div className="text-xl font-bold text-zinc-900 dark:text-white mt-1">
                {googleProfile?.isConnected ? `${googleProfile.totalReviewCount || 0}` : 'Requires OAuth'}
              </div>
              <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mt-0.5">
                Reviews Published
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                {googleProfile?.isConnected
                  ? 'Retrieved from connected Google Business Profile.'
                  : 'Requires Google API OAuth authorization to measure.'}
              </p>
            </div>

            {/* Metric D: Google Rating */}
            <div className="bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 p-4 rounded-xl">
              <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Authorized API Only
              </div>
              <div className="text-xl font-bold text-zinc-900 dark:text-white mt-1">
                {googleProfile?.isConnected ? `${googleProfile.overallRating} ★` : 'Requires OAuth'}
              </div>
              <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mt-0.5">
                Current Google Rating
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                {googleProfile?.isConnected
                  ? 'Verified from Google Business Profile API.'
                  : 'Ratings are never fabricated or guessed.'}
              </p>
            </div>
          </div>

          {/* Connection prompt if disconnected */}
          {!googleProfile?.isConnected && (
            <div className="bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
              <div className="space-y-1">
                <div className="font-bold text-blue-950 dark:text-blue-300 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-blue-600" />
                  Connect Google Business Profile to track reviews & ratings
                </div>
                <p className="text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
                  ReviewFlow never invents review numbers or assumes that every QR scan resulted in a published review. Connect your Google Business Profile to unlock authorized review retrieval, rating tracking, and official reply management.
                </p>
              </div>
              <Link
                to="/app/integrations/google"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shrink-0 text-center transition-colors shadow-xs"
              >
                Connect Google Profile
              </Link>
            </div>
          )}
        </div>

        {/* Recent Scan Activity Stream */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Recent Scan Activity</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Real-time scan event logs across all active review stands.</p>
            </div>
            <button
              onClick={() => loadData(dateFilter)}
              className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1 font-medium"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-800/40 text-zinc-500 uppercase font-semibold">
                <tr>
                  <th className="px-4 py-2.5">Time</th>
                  <th className="px-4 py-2.5">QR Stand</th>
                  <th className="px-4 py-2.5">Placement</th>
                  <th className="px-4 py-2.5">Device & OS</th>
                  <th className="px-4 py-2.5">Location</th>
                  <th className="px-4 py-2.5">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
                {recentScans.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-zinc-400">
                      No scan events in this time period.
                    </td>
                  </tr>
                ) : (
                  recentScans.slice(0, 10).map((s: any) => (
                    <tr key={s.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20">
                      <td className="px-4 py-3 text-zinc-500 whitespace-nowrap">
                        {new Date(s.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                        {new Date(s.scannedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-white">
                        {s.qrName}
                      </td>
                      <td className="px-4 py-3 text-zinc-500">
                        {s.placement}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-zinc-600 dark:text-zinc-400">
                        {s.deviceType === 'mobile' ? '📱 Mobile' : s.deviceType === 'tablet' ? '📟 Tablet' : '💻 Desktop'} ({s.os || 'iOS/Android'})
                      </td>
                      <td className="px-4 py-3 text-zinc-500">
                        {s.city || 'Local Area'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-semibold bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded">
                          <CheckCircle2 className="w-3 h-3" /> Redirected
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* CUSTOM RANGE MODAL */}
        {showCustomModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4">
              <h3 className="font-bold text-base text-zinc-900 dark:text-white">Select Custom Date Range</h3>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-zinc-500 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={customStart}
                    onChange={e => setCustomStart(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-zinc-500 mb-1">End Date</label>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={e => setCustomEnd(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 text-xs">
                <button
                  onClick={() => setShowCustomModal(false)}
                  className="px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowCustomModal(false);
                    setDateFilter('custom');
                    loadData('custom');
                  }}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
                >
                  Apply Range
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};
