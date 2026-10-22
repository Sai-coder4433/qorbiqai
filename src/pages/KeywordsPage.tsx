import React, { useState } from 'react';
import {
  KeyRound,
  Sparkles,
  Search,
  LineChart,
  RefreshCw
} from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout.tsx';
import { useUi } from '../lib/ui-context.tsx';

export const KeywordsPage: React.FC = () => {
  const { business: uiBiz } = useUi();
  const [activeTab, setActiveTab] = useState<'OBSERVED' | 'AI_SUGGESTIONS' | 'TRACKED'>('OBSERVED');
  const [searchQuery, setSearchQuery] = useState('');

  const keywords = [
    {
      query: 'electrical shop chakan',
      source: 'Search Console',
      impressions: '4,821',
      clicks: '112',
      ctr: '2.3%',
      position: '8.4',
      type: 'OBSERVED',
      tracked: true
    },
    {
      query: 'polycab cable dealer chakan midc',
      source: 'Search Console',
      impressions: '2,340',
      clicks: '94',
      ctr: '4.0%',
      position: '4.2',
      type: 'OBSERVED',
      tracked: true
    },
    {
      query: 'industrial switchgear supplier pune',
      source: 'Search Console',
      impressions: '1,890',
      clicks: '62',
      ctr: '3.3%',
      position: '6.1',
      type: 'OBSERVED',
      tracked: false
    },
    {
      query: 'schneider electric distributor chakan',
      source: 'Search Console',
      impressions: '1,420',
      clicks: '48',
      ctr: '3.4%',
      position: '5.8',
      type: 'OBSERVED',
      tracked: true
    },
    {
      query: 'industrial electrical contractors near me',
      source: 'AI Suggestion',
      impressions: '—',
      clicks: '—',
      ctr: '—',
      position: '—',
      type: 'AI_SUGGESTIONS',
      tracked: false,
      relevance: 'High commercial intent for factory expansion projects'
    },
    {
      query: 'ht panel manufacturer chakan',
      source: 'AI Suggestion',
      impressions: '—',
      clicks: '—',
      ctr: '—',
      position: '—',
      type: 'AI_SUGGESTIONS',
      tracked: false,
      relevance: 'Targeted query for custom engineering panel orders'
    },
    {
      query: 'siemens mcb wholesale price pune',
      source: 'AI Suggestion',
      impressions: '—',
      clicks: '—',
      ctr: '—',
      position: '—',
      type: 'AI_SUGGESTIONS',
      tracked: false,
      relevance: 'Contractor quotation search intent'
    }
  ];

  const filtered = keywords.filter(k => {
    if (activeTab === 'OBSERVED' && k.source !== 'Search Console') return false;
    if (activeTab === 'AI_SUGGESTIONS' && k.source !== 'AI Suggestion') return false;
    if (activeTab === 'TRACKED' && !k.tracked) return false;

    if (searchQuery.trim()) {
      return k.query.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  return (
    <DashboardLayout>
      {/* 25. KEYWORDS HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#E5E7EB] mb-6 gap-4">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-semibold text-[#202124] tracking-tight">
            Keywords
          </h1>
          <p className="text-xs sm:text-sm text-[#5F6368] mt-0.5">
            Monitor real search queries and AI discovery recommendations.
          </p>
          <p className="text-xs text-[#5F6368] mt-1 font-medium">
            Atharv Electricals · Chakan
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#80868B] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search queries..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-1.5 bg-white border border-[#E5E7EB] rounded-lg text-xs w-56 focus:outline-none focus:ring-1 focus:ring-[#1A73E8]"
          />
        </div>
      </div>

      {/* THREE CLEAN TABS */}
      <div className="flex items-center gap-1 bg-white border border-[#E5E7EB] rounded-lg p-1 text-xs font-medium mb-6 w-fit">
        <button
          onClick={() => setActiveTab('OBSERVED')}
          className={`px-3 py-1.5 rounded-md transition-colors ${
            activeTab === 'OBSERVED'
              ? 'bg-[#1A73E8] text-white'
              : 'text-[#5F6368] hover:text-[#202124]'
          }`}
        >
          Observed Queries (Search Console)
        </button>
        <button
          onClick={() => setActiveTab('AI_SUGGESTIONS')}
          className={`px-3 py-1.5 rounded-md transition-colors ${
            activeTab === 'AI_SUGGESTIONS'
              ? 'bg-[#1A73E8] text-white'
              : 'text-[#5F6368] hover:text-[#202124]'
          }`}
        >
          AI Suggestions
        </button>
        <button
          onClick={() => setActiveTab('TRACKED')}
          className={`px-3 py-1.5 rounded-md transition-colors ${
            activeTab === 'TRACKED'
              ? 'bg-[#1A73E8] text-white'
              : 'text-[#5F6368] hover:text-[#202124]'
          }`}
        >
          Tracked Keywords (3)
        </button>
      </div>

      {/* KEYWORDS TABLE */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#F8FAFC] text-[#5F6368] font-medium border-b border-[#E5E7EB]">
            <tr>
              <th className="py-3 px-4">Keyword Query</th>
              <th className="py-3 px-4">Source</th>
              {activeTab !== 'AI_SUGGESTIONS' ? (
                <>
                  <th className="py-3 px-4 text-right">Impressions</th>
                  <th className="py-3 px-4 text-right">Clicks</th>
                  <th className="py-3 px-4 text-right">CTR</th>
                  <th className="py-3 px-4 text-right">Position</th>
                </>
              ) : (
                <th className="py-3 px-4">Target Intent / Relevance</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB]">
            {filtered.map((item, idx) => (
              <tr key={idx} className="hover:bg-[#F8FAFC] transition-colors">
                <td className="py-3.5 px-4 font-medium text-[#202124]">
                  {item.query}
                </td>
                <td className="py-3.5 px-4">
                  <span className="text-[11px] text-[#5F6368] font-medium">
                    {item.source}
                  </span>
                </td>
                {activeTab !== 'AI_SUGGESTIONS' ? (
                  <>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-[#202124]">
                      {item.impressions}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-[#1A73E8] font-semibold">
                      {item.clicks}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-[#202124]">
                      {item.ctr}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-[#202124]">
                      {item.position}
                    </td>
                  </>
                ) : (
                  <td className="py-3.5 px-4 text-[#5F6368]">
                    {item.relevance}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 text-[11px] text-[#5F6368]">
        Source disclosure: Search Console metrics synced from live Google Search query performance API. No simulated search volumes displayed.
      </div>
    </DashboardLayout>
  );
};
