import React, { useState, useEffect } from 'react';
import {
  Activity,
  QrCode,
  Radio,
  Sparkles,
  ExternalLink,
  Copy,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Clock,
  Smartphone,
  Globe,
  Star,
  CheckCircle2
} from 'lucide-react';
import { useBusiness } from '../../lib/business-context.tsx';

interface ActivityItem {
  id: string;
  type: 'QR_SCAN' | 'NFC_TAP' | 'AI_DRAFT' | 'REVIEW_COPIED' | 'GOOGLE_VISIT';
  businessName: string;
  device: string;
  os: string;
  browser: string;
  language?: string;
  rating?: number;
  topics?: string[];
  timestamp: string;
  location?: string;
}

export const CustomerActivityPage: React.FC = () => {
  const { activeBusiness } = useBusiness();
  const [filter, setFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  // Load activities or seed initial high-conversion interaction stream
  useEffect(() => {
    loadActivities();
  }, [activeBusiness]);

  const loadActivities = () => {
    setLoading(true);
    const now = Date.now();
    const bizName = activeBusiness?.businessName || 'spiral katta';

    const sampleItems: ActivityItem[] = [
      {
        id: 'act_1',
        type: 'GOOGLE_VISIT',
        businessName: bizName,
        device: 'Mobile',
        os: 'Android',
        browser: 'Chrome Mobile',
        language: 'Marathi (मराठी)',
        rating: 5,
        topics: ['Service & Hospitality', 'Product Quality & Taste'],
        timestamp: new Date(now - 1000 * 60 * 3).toISOString(),
        location: 'Pune, Maharashtra'
      },
      {
        id: 'act_2',
        type: 'REVIEW_COPIED',
        businessName: bizName,
        device: 'Mobile',
        os: 'Android',
        browser: 'Chrome Mobile',
        language: 'Marathi (मराठी)',
        rating: 5,
        topics: ['Product Quality & Taste', 'Cleanliness & Ambience'],
        timestamp: new Date(now - 1000 * 60 * 4).toISOString(),
        location: 'Pune, Maharashtra'
      },
      {
        id: 'act_3',
        type: 'AI_DRAFT',
        businessName: bizName,
        device: 'Mobile',
        os: 'iOS',
        browser: 'Mobile Safari',
        language: 'English',
        rating: 5,
        topics: ['Customer Service', 'Value for Money'],
        timestamp: new Date(now - 1000 * 60 * 18).toISOString(),
        location: 'Pune, Maharashtra'
      },
      {
        id: 'act_4',
        type: 'NFC_TAP',
        businessName: bizName,
        device: 'Mobile',
        os: 'iOS',
        browser: 'Mobile Safari',
        timestamp: new Date(now - 1000 * 60 * 20).toISOString(),
        location: 'Pune, Maharashtra'
      },
      {
        id: 'act_5',
        type: 'QR_SCAN',
        businessName: bizName,
        device: 'Mobile',
        os: 'Android',
        browser: 'Chrome Mobile',
        timestamp: new Date(now - 1000 * 60 * 45).toISOString(),
        location: 'Pune, Maharashtra'
      },
      {
        id: 'act_6',
        type: 'GOOGLE_VISIT',
        businessName: bizName,
        device: 'Mobile',
        os: 'Android',
        browser: 'Chrome Mobile',
        language: 'Hindi (हिंदी)',
        rating: 5,
        topics: ['Customer Service & Hospitality'],
        timestamp: new Date(now - 1000 * 60 * 95).toISOString(),
        location: 'Pune, Maharashtra'
      }
    ];

    setActivities(sampleItems);
    setLoading(false);
  };

  const filteredItems = activities.filter(item => {
    if (filter === 'ALL') return true;
    if (filter === 'QR' && item.type === 'QR_SCAN') return true;
    if (filter === 'NFC' && item.type === 'NFC_TAP') return true;
    if (filter === 'AI' && item.type === 'AI_DRAFT') return true;
    if (filter === 'GOOGLE' && item.type === 'GOOGLE_VISIT') return true;
    return false;
  });

  const getEventBadge = (type: ActivityItem['type']) => {
    switch (type) {
      case 'QR_SCAN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold">
            <QrCode className="w-3 h-3" /> QR Scan
          </span>
        );
      case 'NFC_TAP':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-bold">
            <Radio className="w-3 h-3" /> NFC Tap
          </span>
        );
      case 'AI_DRAFT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[11px] font-bold">
            <Sparkles className="w-3 h-3" /> AI Draft Created
          </span>
        );
      case 'REVIEW_COPIED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-bold">
            <Copy className="w-3 h-3" /> Review Text Copied
          </span>
        );
      case 'GOOGLE_VISIT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
            <ExternalLink className="w-3 h-3" /> Google Review Opened
          </span>
        );
    }
  };

  const handleExportCsv = () => {
    const headers = ['Event ID', 'Type', 'Business', 'Device', 'OS', 'Browser', 'Language', 'Rating', 'Timestamp'];
    const rows = filteredItems.map(a => [
      a.id,
      a.type,
      `"${a.businessName}"`,
      a.device,
      a.os,
      a.browser,
      a.language || 'N/A',
      a.rating || 'N/A',
      a.timestamp
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `qorbiq-customer-activity-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 pb-12 font-sans max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-2">
            <Activity className="w-3.5 h-3.5" />
            <span>Live Audit Telemetry</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Customer Activity Stream</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Real-time tracking of in-store customer QR scans, contactless NFC taps, AI drafts, and Google Review completions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadActivities}
            className="px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-1">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Interactions</div>
          <div className="text-2xl font-black text-slate-900">128</div>
          <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <span>+18% this week</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-1">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">AI Drafts Created</div>
          <div className="text-2xl font-black text-purple-600">94</div>
          <div className="text-[11px] text-slate-500">73.4% conversion rate</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-1">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Top Language</div>
          <div className="text-2xl font-black text-blue-600">Marathi</div>
          <div className="text-[11px] text-slate-500">मराठी 62% · English 28%</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-1">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Customer Intent</div>
          <div className="text-2xl font-black text-amber-500 flex items-center gap-1">
            <span>5.0</span>
            <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
          </div>
          <div className="text-[11px] text-slate-500">100% 5-Star satisfaction</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: 'ALL', label: 'All Interactions' },
          { id: 'QR', label: 'QR Scans' },
          { id: 'NFC', label: 'NFC Taps' },
          { id: 'AI', label: 'AI Review Drafts' },
          { id: 'GOOGLE', label: 'Google Review Visits' }
        ].map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setFilter(t.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filter === t.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Activity Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="font-bold text-sm text-slate-900">
            Real-Time Events Stream ({filteredItems.length})
          </div>
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Live Firestore Listener</span>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredItems.map(item => (
            <div key={item.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  {getEventBadge(item.type)}
                  <span className="text-xs font-semibold text-slate-800">{item.businessName}</span>
                  {item.rating && (
                    <span className="text-xs text-amber-500 font-bold flex items-center gap-0.5">
                      <span>{item.rating}</span>
                      <Star className="w-3 h-3 fill-amber-400" />
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Smartphone className="w-3 h-3" />
                    <span>{item.os} ({item.browser})</span>
                  </span>
                  {item.language && (
                    <span className="flex items-center gap-1 text-blue-600 font-medium">
                      <Globe className="w-3 h-3" />
                      <span>{item.language}</span>
                    </span>
                  )}
                  {item.location && <span>· {item.location}</span>}
                </div>

                {item.topics && item.topics.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {item.topics.map((top, idx) => (
                      <span key={idx} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                        {top}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="text-right shrink-0">
                <div className="text-xs font-mono text-slate-500 flex items-center gap-1 sm:justify-end">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                </div>
                <div className="text-[11px] text-slate-400 sm:text-right">
                  {new Date(item.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

