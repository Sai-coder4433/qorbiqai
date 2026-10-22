import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Download,
  Calendar,
  Building2,
  Search,
  Globe,
  MessageSquare,
  ArrowRight,
  Check,
  TrendingUp
} from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout.tsx';
import { useUi } from '../lib/ui-context.tsx';

export const ActionsPage: React.FC = () => {
  const { business: uiBiz } = useUi();
  const [activeTab, setActiveTab] = useState<'NEEDS_ATTENTION' | 'RECOMMENDED' | 'AUTOMATED' | 'COMPLETED'>('NEEDS_ATTENTION');
  const [completedItems, setCompletedItems] = useState<Record<string, boolean>>({});

  const allActions = [
    {
      id: 'act_1',
      title: 'Reply to 3 unanswered reviews',
      reason: 'Unanswered reviews hurt Google Maps conversion rate and local response rate signals.',
      source: 'Google Business Profile',
      priority: 'High',
      section: 'NEEDS_ATTENTION',
      ctaText: 'Review',
      link: '/dashboard/reviews?filter=UNREPLIED'
    },
    {
      id: 'act_2',
      title: 'Update festive holiday hours for Chakan & Bhosari branches',
      reason: 'Prevents Google from displaying "Hours may differ" badge during upcoming regional holidays.',
      source: 'Google Business Profile',
      priority: 'High',
      section: 'NEEDS_ATTENTION',
      ctaText: 'Update Hours',
      link: '/dashboard/profile'
    },
    {
      id: 'act_3',
      title: 'Add secondary category: Industrial Equipment Supplier',
      reason: 'Enables discovery when local engineering procurement teams search for B2B electrical components.',
      source: 'Google Business Profile',
      priority: 'Medium',
      section: 'RECOMMENDED',
      ctaText: 'Optimize',
      link: '/dashboard/profile'
    },
    {
      id: 'act_4',
      title: 'Inject Schema.org geo-coordinates on website header',
      reason: 'Helps Google Search reconcile exact warehouse coordinates in Chakan MIDC Phase II.',
      source: 'Local SEO Audit',
      priority: 'Medium',
      section: 'RECOMMENDED',
      ctaText: 'View Code',
      link: '/dashboard/seo'
    },
    {
      id: 'act_5',
      title: 'Publish weekly Google Post on Industrial Switchgear stock',
      reason: 'Regular posts increase listing interaction rate by 18% in Google Maps pack.',
      source: 'Google Posts Engine',
      priority: 'Low',
      section: 'RECOMMENDED',
      ctaText: 'Create Post',
      link: '/dashboard/posts'
    },
    {
      id: 'act_6',
      title: 'Automated 5-star review reply dispatched',
      reason: 'Replying promptly to verified customer Ramesh Patil within 3 minutes.',
      source: 'Review Auto-Reply Engine',
      priority: 'Routine',
      section: 'AUTOMATED',
      ctaText: 'View Reply',
      link: '/dashboard/reviews'
    },
    {
      id: 'act_7',
      title: 'Daily Search Console query reconciliation',
      reason: 'Synced 4,821 impressions and keyword positions.',
      source: 'Search Console Engine',
      priority: 'Routine',
      section: 'AUTOMATED',
      ctaText: 'View Data',
      link: '/dashboard/seo/search-console'
    },
    {
      id: 'act_8',
      title: 'High-resolution storefront photo published',
      reason: 'Exterior photo added with verified GPS metadata.',
      source: 'Google Business Profile',
      priority: 'Completed',
      section: 'COMPLETED',
      ctaText: 'View Media',
      link: '/dashboard/media'
    }
  ];

  const filteredActions = allActions.filter(act => {
    if (completedItems[act.id]) {
      return activeTab === 'COMPLETED';
    }
    return act.section === activeTab;
  });

  const handleComplete = (id: string) => {
    setCompletedItems(prev => ({ ...prev, [id]: true }));
  };

  return (
    <DashboardLayout>
      {/* 30. AI ACTION CENTER HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#E5E7EB] mb-6 gap-4">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-semibold text-[#202124] tracking-tight">
            AI Action Center
          </h1>
          <p className="text-xs sm:text-sm text-[#5F6368] mt-0.5">
            Your next best actions, based on your latest business data.
          </p>
          <p className="text-xs text-[#5F6368] mt-1 font-medium">
            Atharv Electricals · Chakan
          </p>
        </div>
      </div>

      {/* 4 SECTIONS TABS */}
      <div className="flex flex-wrap items-center gap-1 bg-white border border-[#E5E7EB] rounded-lg p-1 text-xs font-medium mb-6 w-fit">
        <button
          onClick={() => setActiveTab('NEEDS_ATTENTION')}
          className={`px-3 py-1.5 rounded-md transition-colors ${
            activeTab === 'NEEDS_ATTENTION'
              ? 'bg-[#1A73E8] text-white'
              : 'text-[#5F6368] hover:text-[#202124]'
          }`}
        >
          Needs Attention (2)
        </button>
        <button
          onClick={() => setActiveTab('RECOMMENDED')}
          className={`px-3 py-1.5 rounded-md transition-colors ${
            activeTab === 'RECOMMENDED'
              ? 'bg-[#1A73E8] text-white'
              : 'text-[#5F6368] hover:text-[#202124]'
          }`}
        >
          Recommended (3)
        </button>
        <button
          onClick={() => setActiveTab('AUTOMATED')}
          className={`px-3 py-1.5 rounded-md transition-colors ${
            activeTab === 'AUTOMATED'
              ? 'bg-[#1A73E8] text-white'
              : 'text-[#5F6368] hover:text-[#202124]'
          }`}
        >
          Automated (2)
        </button>
        <button
          onClick={() => setActiveTab('COMPLETED')}
          className={`px-3 py-1.5 rounded-md transition-colors ${
            activeTab === 'COMPLETED'
              ? 'bg-[#1A73E8] text-white'
              : 'text-[#5F6368] hover:text-[#202124]'
          }`}
        >
          Completed
        </button>
      </div>

      {/* ACTIONS LIST */}
      <div className="space-y-3">
        {filteredActions.length === 0 ? (
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-10 text-center text-xs text-[#5F6368]">
            <CheckCircle2 className="w-8 h-8 text-[#188038] mx-auto mb-2" />
            <p className="font-semibold text-[#202124] text-sm">All clear in this section</p>
            <p className="mt-1">No pending actions required right now.</p>
          </div>
        ) : (
          filteredActions.map(act => {
            const isHigh = act.priority === 'High';
            const isMedium = act.priority === 'Medium';

            return (
              <div
                key={act.id}
                className="bg-white border border-[#E5E7EB] rounded-xl p-5 hover:border-[#1A73E8]/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isHigh ? 'bg-[#D93025]' : isMedium ? 'bg-[#F9AB00]' : 'bg-[#188038]'
                      }`}
                    ></span>
                    <span className="text-[11px] font-medium text-[#5F6368]">
                      Priority: {act.priority}
                    </span>
                    <span className="text-[#9AA0A6]">·</span>
                    <span className="text-[11px] text-[#5F6368]">
                      Source: {act.source}
                    </span>
                  </div>

                  <h3 className="font-semibold text-sm text-[#202124]">
                    {act.title}
                  </h3>
                  <p className="text-xs text-[#5F6368] mt-1">
                    {act.reason}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                  {act.section !== 'COMPLETED' && (
                    <button
                      onClick={() => handleComplete(act.id)}
                      className="px-3 py-1.5 bg-white border border-[#E5E7EB] hover:bg-[#F8FAFC] text-xs font-medium text-[#5F6368] rounded-lg transition-colors"
                      title="Mark as done"
                    >
                      Dismiss
                    </button>
                  )}
                  <Link
                    to={act.link}
                    className="px-4 py-1.5 bg-[#1A73E8] hover:bg-[#1557B0] text-white text-xs font-medium rounded-lg transition-colors"
                  >
                    {act.ctaText}
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </DashboardLayout>
  );
};

export const ReportsPage: React.FC = () => {
  const { business: uiBiz } = useUi();
  const [downloading, setDownloading] = useState(false);

  const handleDownload = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      window.print();
    }, 500);
  };

  return (
    <DashboardLayout>
      {/* 28. REPORTS HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#E5E7EB] mb-6 gap-4">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-semibold text-[#202124] tracking-tight">
            Performance Report
          </h1>
          <p className="text-xs sm:text-sm text-[#5F6368] mt-0.5">
            September 2026 · Atharv Electricals, Chakan
          </p>
        </div>

        <button
          onClick={handleDownload}
          disabled={downloading}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1A73E8] hover:bg-[#1557B0] text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50 self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{downloading ? 'Preparing PDF...' : 'Download PDF'}</span>
        </button>
      </div>

      {/* CARDS: GBP | SEO | WEBSITE | REVIEWS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
          <div className="flex items-center justify-between text-xs text-[#5F6368]">
            <span className="font-medium">GBP Visibility</span>
            <Building2 className="w-4 h-4 text-[#5F6368]" />
          </div>
          <p className="text-2xl font-semibold text-[#202124] font-mono tabular-nums mt-2">18,450</p>
          <span className="text-[11px] text-[#188038] font-medium">+22.4% vs last month</span>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
          <div className="flex items-center justify-between text-xs text-[#5F6368]">
            <span className="font-medium">SEO Health</span>
            <Search className="w-4 h-4 text-[#5F6368]" />
          </div>
          <p className="text-2xl font-semibold text-[#202124] font-mono tabular-nums mt-2">82 / 100</p>
          <span className="text-[11px] text-[#188038] font-medium">31 audit checks passed</span>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
          <div className="flex items-center justify-between text-xs text-[#5F6368]">
            <span className="font-medium">Website Traffic</span>
            <Globe className="w-4 h-4 text-[#5F6368]" />
          </div>
          <p className="text-2xl font-semibold text-[#202124] font-mono tabular-nums mt-2">1,290</p>
          <span className="text-[11px] text-[#188038] font-medium">+18.2% click-through</span>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
          <div className="flex items-center justify-between text-xs text-[#5F6368]">
            <span className="font-medium">Customer Reviews</span>
            <MessageSquare className="w-4 h-4 text-[#5F6368]" />
          </div>
          <p className="text-2xl font-semibold text-[#202124] font-mono tabular-nums mt-2">4.9 ★</p>
          <span className="text-[11px] text-[#188038] font-medium">342 verified reviews</span>
        </div>
      </div>

      {/* PERFORMANCE TIMELINE CHART */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 mb-6">
        <h3 className="font-semibold text-sm text-[#202124] mb-1">
          Monthly Growth Trend (September 2026)
        </h3>
        <p className="text-xs text-[#5F6368] mb-6">
          Aggregate local search impressions across Google Maps and Desktop Web Search.
        </p>

        <div className="h-44 flex items-end gap-6 px-2">
          {[
            { label: 'Week 1', val: 3800 },
            { label: 'Week 2', val: 4200 },
            { label: 'Week 3', val: 4950 },
            { label: 'Week 4', val: 5500 }
          ].map((w, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2">
              <span className="text-xs font-mono font-medium text-[#202124]">{w.val}</span>
              <div className="w-full bg-[#F8FAFC] rounded-t relative flex items-end overflow-hidden h-28 border-x border-t border-[#E5E7EB]">
                <div
                  style={{ height: `${(w.val / 5500) * 100}%` }}
                  className="w-full bg-[#1A73E8] rounded-t"
                ></div>
              </div>
              <span className="text-xs text-[#5F6368]">{w.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* AI SUMMARY */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 mb-6 text-xs text-[#202124]">
        <h3 className="font-semibold text-sm text-[#202124] mb-3">AI Executive Summary</h3>
        <div className="space-y-2 text-[#5F6368] leading-relaxed">
          <p>
            During September 2026, <strong>Atharv Electricals</strong> achieved an overall visibility score of 87/100, ranking #1 for "electrical shop chakan" across a 5km radius in Chakan MIDC Phase II.
          </p>
          <p>
            Customer interactions surged by +22.4%, led by 482 phone inquiries and 640 directions requests from industrial plant procurement engineers. 28 new 5-star reviews were ingested and replied to within an average of 4.2 minutes.
          </p>
        </div>
      </div>

      {/* RECOMMENDED ACTIONS */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 text-xs">
        <h3 className="font-semibold text-sm text-[#202124] mb-3">Recommended Actions for October 2026</h3>
        <ul className="space-y-2 text-[#5F6368]">
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1A73E8] mt-1.5 shrink-0"></span>
            <span>Target high-intent keyword queries: "polycab cable dealer chakan" and "siemens industrial switchgear".</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1A73E8] mt-1.5 shrink-0"></span>
            <span>Configure Diwali holiday hours in advance on Google Business Profile to retain verified badge.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1A73E8] mt-1.5 shrink-0"></span>
            <span>Launch a quarterly review NFC card campaign at the Bhosari MIDC outlet counter.</span>
          </li>
        </ul>
      </div>
    </DashboardLayout>
  );
};
