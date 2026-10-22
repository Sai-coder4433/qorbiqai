import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Sparkles, QrCode, ExternalLink, RefreshCw } from 'lucide-react';
import { freshTestApi } from '../../lib/fresh-test-api.ts';

export const SuperAdminAnalyticsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await freshTestApi.getAdminOverview();
      setOverview(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !overview) {
    return (
      <div className="py-20 text-center">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
        <p className="text-xs text-slate-500 mt-2">Loading platform analytics...</p>
      </div>
    );
  }

  const { qr, ai, reviewJourney, clients, businesses } = overview;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            <span>Platform-Wide Analytics</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Aggregated usage metrics across all client businesses and customer QR scans.
          </p>
        </div>
        <button
          onClick={loadData}
          className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-2 cursor-pointer shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-1 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500">Total In-Store QR Scans</span>
          <div className="text-3xl font-black text-slate-900">{qr.totalScans}</div>
          <span className="text-[10px] text-emerald-600 font-semibold">+{qr.scansToday} today</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-1 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500">AI Review Drafts Created</span>
          <div className="text-3xl font-black text-blue-600">{ai.totalGenerations}</div>
          <span className="text-[10px] text-blue-500 font-semibold">+{ai.generationsToday} today</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-1 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500">Review Draft Copies</span>
          <div className="text-3xl font-black text-indigo-600">{reviewJourney.copyActions}</div>
          <span className="text-[10px] text-slate-400">Ready to paste</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-1 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500">Google Link Clicks</span>
          <div className="text-3xl font-black text-emerald-600">{reviewJourney.googleReviewLinkClicks}</div>
          <span className="text-[10px] text-emerald-600 font-semibold">Destination reached</span>
        </div>
      </div>

      {/* Conversion Funnel Breakdown */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
        <h2 className="text-base font-bold text-slate-900">Full Review Journey Funnel Breakdown</h2>
        <div className="space-y-4">
          {[
            {
              step: '1. QR Stand Scan',
              count: reviewJourney.qrScans,
              pct: 100,
              desc: 'Customers who scanned a physical QR code'
            },
            {
              step: '2. Review Assistant Open',
              count: reviewJourney.reviewPageOpens,
              pct: reviewJourney.qrScans > 0 ? Math.round((reviewJourney.reviewPageOpens / reviewJourney.qrScans) * 100) : 0,
              desc: 'Customers who opened the experience page'
            },
            {
              step: '3. AI Draft Generated',
              count: reviewJourney.aiDraftGenerations,
              pct: reviewJourney.qrScans > 0 ? Math.round((reviewJourney.aiDraftGenerations / reviewJourney.qrScans) * 100) : 0,
              desc: 'Customers who requested a draft from their genuine notes'
            },
            {
              step: '4. Review Copied',
              count: reviewJourney.copyActions,
              pct: reviewJourney.qrScans > 0 ? Math.round((reviewJourney.copyActions / reviewJourney.qrScans) * 100) : 0,
              desc: 'Customers who copied their draft to clipboard'
            },
            {
              step: '5. Google Review Destination Clicked',
              count: reviewJourney.googleReviewLinkClicks,
              pct: reviewJourney.qrScans > 0 ? Math.round((reviewJourney.googleReviewLinkClicks / reviewJourney.qrScans) * 100) : 0,
              desc: 'Customers who continued to the official Google Review page'
            }
          ].map((item, idx) => (
            <div key={idx} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900">{item.step}</span>
                  <span className="text-slate-400 ml-2 text-[11px]">— {item.desc}</span>
                </div>
                <div className="font-mono text-slate-600">
                  <span className="font-bold text-slate-900">{item.count}</span> ({item.pct}%)
                </div>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all"
                  style={{ width: `${Math.max(2, item.pct)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
