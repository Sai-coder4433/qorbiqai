import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Sparkles,
  RefreshCw,
  TrendingUp,
  DollarSign,
  Clock,
  Layers,
  Zap,
  CheckCircle2,
  XCircle,
  Building2,
  Calendar,
  AlertCircle
} from 'lucide-react';

interface BusinessUsage {
  businessId: string;
  businessName: string;
  count: number;
  cost: number;
}

interface RecentUsageRecord {
  id: string;
  businessId: string;
  generationType: 'generate' | 'regenerate';
  inputTokens: number;
  outputTokens: number;
  aiModel: string;
  estimatedCost: number;
  latencyMs: number;
  status: 'SUCCESS' | 'FAILED';
  timestamp: string;
}

export const SuperAdminAiUsagePage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/admin/ai-usage', {
        headers: {
          'x-admin-auth': 'superadmin',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load AI usage metrics');
      setMetrics(data);
    } catch (err: any) {
      setError(err.message || 'Error loading AI metrics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
        <p className="text-sm text-slate-500">Loading internal AI token usage & cost telemetry...</p>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 space-y-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600" />
          <span className="font-bold text-sm">Failed to Load AI Telemetry</span>
        </div>
        <p className="text-xs text-rose-600/90">{error}</p>
        <button
          onClick={loadMetrics}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  const {
    totalGenerations = 0,
    successfulGenerations = 0,
    failedGenerations = 0,
    regenerations = 0,
    inputTokens = 0,
    outputTokens = 0,
    estimatedAiCost = 0,
    actualAiCost = 0,
    averageCost = 0,
    averageLatencyMs = 0,
    byBusiness = [],
    recentRecords = []
  } = metrics;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>AI Cost & Token Observatory</span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700">
              Super Admin Only
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Section 33 & 36: ReviewFlow Unlimited provides customers with unlimited AI reviews without visible quotas, while backend monitors tokens, provider costs, and latency.
          </p>
        </div>
        <button
          onClick={loadMetrics}
          className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-2 transition-colors cursor-pointer shadow-xs self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Generations</span>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">{totalGenerations}</div>
          <span className="text-[11px] text-emerald-600 font-semibold block">
            {successfulGenerations} successful • {failedGenerations} failed
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Regenerations</span>
          <div className="text-2xl sm:text-3xl font-black text-purple-600">{regenerations}</div>
          <span className="text-[11px] text-slate-500 block">
            Alternative phrasing requests
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Token Volume</span>
          <div className="text-2xl sm:text-3xl font-black text-blue-600">
            {(inputTokens + outputTokens).toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500 block font-mono">
            {inputTokens.toLocaleString()} in • {outputTokens.toLocaleString()} out
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-blue-950 text-white shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-300">Estimated AI Cost</span>
          <div className="text-2xl sm:text-3xl font-black text-white">
            ₹{estimatedAiCost}
          </div>
          <span className="text-[11px] text-slate-300 block">
            Avg: ₹{averageCost} / request • {averageLatencyMs}ms latency
          </span>
        </div>
      </div>

      {/* Breakdown Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Highest Usage Businesses Table */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Building2 className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">Highest Usage Businesses</h2>
          </div>

          <div className="space-y-3">
            {byBusiness.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No business usage logged yet.</p>
            ) : (
              byBusiness.slice(0, 10).map((b: BusinessUsage, idx: number) => (
                <div
                  key={b.businessId}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-900 block truncate max-w-[150px]">
                      {idx + 1}. {b.businessName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{b.businessId}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900 block">{b.count} gens</span>
                    <span className="text-[11px] text-slate-500">₹{b.cost.toFixed(2)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Live Generation Telemetry Log */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">Recent Generation Telemetry</h2>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Last 50 requests</span>
          </div>

          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold text-[10px] sticky top-0">
                <tr>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Model</th>
                  <th className="py-2.5 px-3">Tokens</th>
                  <th className="py-2.5 px-3">Latency</th>
                  <th className="py-2.5 px-3">Cost</th>
                  <th className="py-2.5 px-3 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {recentRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 font-sans text-xs">
                      No recent AI generation requests logged.
                    </td>
                  </tr>
                ) : (
                  recentRecords.map((r: RecentUsageRecord) => (
                    <tr key={r.id} className="hover:bg-slate-50/60">
                      <td className="py-2 px-3">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase font-sans ${
                            r.generationType === 'regenerate'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {r.generationType}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-700">{r.aiModel}</td>
                      <td className="py-2 px-3 text-slate-600">
                        {r.inputTokens}+{r.outputTokens}
                      </td>
                      <td className="py-2 px-3 text-slate-600">{r.latencyMs}ms</td>
                      <td className="py-2 px-3 font-bold text-slate-900">₹{r.estimatedCost}</td>
                      <td className="py-2 px-3 text-right text-slate-400 font-sans text-[10px]">
                        {new Date(r.timestamp).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
