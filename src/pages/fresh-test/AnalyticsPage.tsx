import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Calendar,
  Sparkles,
  ExternalLink,
  QrCode,
  Copy,
  RefreshCw,
  Compass,
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar
} from 'recharts';
import { freshTestApi, AnalyticsData } from '../../lib/fresh-test-api.ts';

export const AnalyticsPage: React.FC = () => {
  const [daysRange, setDaysRange] = useState<number>(30);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [daysRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const res = await freshTestApi.getAnalytics(daysRange);
      setData(res);
    } catch (err: any) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-12 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-blue-600" />
            <span>Review Activity Analytics</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Real-time tracking of in-store customer QR scans, draft generation, and Google Review destination opens.
          </p>
        </div>

        {/* Time Range Selector (Section 27: Today, 7 Days, 30 Days) */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-slate-200 shadow-2xs self-start sm:self-auto text-xs">
          {[
            { label: 'Today', days: 1 },
            { label: '7 Days', days: 7 },
            { label: '30 Days', days: 30 }
          ].map(t => (
            <button
              key={t.days}
              type="button"
              onClick={() => setDaysRange(t.days)}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                daysRange === t.days
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {loading || !data ? (
        <div className="py-24 text-center space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-xs text-slate-500">Aggregating review funnel analytics...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Summary KPI Cards (Section 26: Separate cards, never called "Reviews Received") */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Step 1</span>
              <div className="text-xs font-semibold text-slate-700">QR Scans</div>
              <div className="text-3xl font-black text-slate-900 pt-1">{data.eventsBreakdown.qrScans}</div>
              <span className="text-[11px] text-emerald-600 font-semibold">+{data.scansToday} today</span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Step 2</span>
              <div className="text-xs font-semibold text-slate-700">Page Opens</div>
              <div className="text-3xl font-black text-blue-600 pt-1">
                {data.eventsBreakdown.assistancePageViews}
              </div>
              <span className="text-[11px] text-slate-400">Mobile visits</span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Step 3</span>
              <div className="text-xs font-semibold text-slate-700">AI Drafts</div>
              <div className="text-3xl font-black text-amber-500 pt-1">
                {data.eventsBreakdown.aiDraftsGenerated}
              </div>
              <span className="text-[11px] text-slate-400">Wordings drafted</span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Step 4</span>
              <div className="text-xs font-semibold text-slate-700">Copy Actions</div>
              <div className="text-3xl font-black text-purple-600 pt-1">
                {data.eventsBreakdown.reviewsCopied}
              </div>
              <span className="text-[11px] text-slate-400">Copied to clipboard</span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1 col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Step 5</span>
              <div className="text-xs font-semibold text-emerald-700">Google Link Clicks</div>
              <div className="text-3xl font-black text-emerald-600 pt-1">
                {data.eventsBreakdown.googleReviewClicks}
              </div>
              <span className="text-[11px] text-emerald-700 font-semibold">Destination reached</span>
            </div>
          </div>

          {/* Main Visual Trend Chart (Section 27: Recharts) */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">Activity Over Time</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Daily trends of in-store QR scans and Google Review destination clicks.
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  <span>QR Scans</span>
                </span>
                <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>Google Link Clicks</span>
                </span>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="scansGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="googleGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '12px'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="scans"
                    name="QR Scans"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#scansGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="googleClicks"
                    name="Google Link Clicks"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#googleGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* QR Stand Breakdown by Placement (Section 27) */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900">QR Performance by Placement Stand</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Stand Placement Label</th>
                    <th className="py-3 px-4">Unique Code</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Scans Count</th>
                    <th className="py-3 px-4">AI Drafts</th>
                    <th className="py-3 px-4 text-right">Google Clicks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {data.qrBreakdown.map(q => (
                    <tr key={q.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-900">{q.label}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{q.uniqueCode}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            q.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {q.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{q.scans || q.totalScans || 0}</td>
                      <td className="py-3 px-4 text-purple-700 font-semibold">{q.aiDrafts || 0}</td>
                      <td className="py-3 px-4 text-right text-emerald-700 font-bold">{q.googleClicks || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
