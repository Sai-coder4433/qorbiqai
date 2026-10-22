import React, { useState } from 'react';
import {
  LineChart,
  Search,
  Sparkles,
  BarChart3,
  TrendingUp,
  Globe
} from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout.tsx';
import { useUi } from '../lib/ui-context.tsx';

export const SearchConsolePage: React.FC = () => {
  const { business: uiBiz } = useUi();
  const [activeTab, setActiveTab] = useState<'QUERIES' | 'PAGES'>('QUERIES');

  const queries = [
    { query: 'electrical shop chakan', clicks: 112, impressions: 4821, ctr: '2.3%', position: '8.4' },
    { query: 'polycab cable dealer chakan midc', clicks: 94, impressions: 2340, ctr: '4.0%', position: '4.2' },
    { query: 'schneider switchgear distributor pune', clicks: 48, impressions: 1420, ctr: '3.4%', position: '5.8' },
    { query: 'electrical contractor chakan phase 2', clicks: 42, impressions: 1180, ctr: '3.6%', position: '3.7' },
    { query: 'industrial panel board wiring chakan', clicks: 36, impressions: 940, ctr: '3.8%', position: '6.1' }
  ];

  const pages = [
    { page: 'https://atharvaelectricals.in/', clicks: 230, impressions: 8400, ctr: '2.7%', position: '6.2' },
    { page: 'https://atharvaelectricals.in/services/industrial-contracting', clicks: 68, impressions: 2100, ctr: '3.2%', position: '4.8' },
    { page: 'https://atharvaelectricals.in/products/polycab-cables', clicks: 44, impressions: 1650, ctr: '2.6%', position: '5.1' }
  ];

  return (
    <DashboardLayout>
      {/* Search Console Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#E5E7EB] mb-6 gap-4">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-semibold text-[#202124] tracking-tight">
            Search Console
          </h1>
          <p className="text-xs sm:text-sm text-[#5F6368] mt-0.5">
            Organic Google Search impressions, clicks and average keyword rank.
          </p>
          <p className="text-xs text-[#5F6368] mt-1 font-medium">
            Atharv Electricals · Chakan
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E5E7EB] rounded-lg text-xs font-medium text-[#188038]">
            <span className="w-2 h-2 rounded-full bg-[#188038]"></span>
            <span>GSC Connected</span>
          </div>
        </div>
      </div>

      {/* Primary KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
          <span className="text-xs text-[#5F6368]">Total Search Clicks</span>
          <p className="text-2xl font-semibold text-[#202124] font-mono tabular-nums mt-1">342</p>
          <span className="text-[11px] text-[#188038] font-medium">+14.2% this month</span>
        </div>
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
          <span className="text-xs text-[#5F6368]">Total Impressions</span>
          <p className="text-2xl font-semibold text-[#202124] font-mono tabular-nums mt-1">12,150</p>
          <span className="text-[11px] text-[#188038] font-medium">+18.6% vs last 30d</span>
        </div>
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
          <span className="text-xs text-[#5F6368]">Average CTR</span>
          <p className="text-2xl font-semibold text-[#202124] font-mono tabular-nums mt-1">2.8%</p>
          <span className="text-[11px] text-[#5F6368]">Industry average: 2.1%</span>
        </div>
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
          <span className="text-xs text-[#5F6368]">Average Position</span>
          <p className="text-2xl font-semibold text-[#202124] font-mono tabular-nums mt-1">5.8</p>
          <span className="text-[11px] text-[#188038] font-medium">Page 1 visibility</span>
        </div>
      </div>

      {/* Tabs & Table */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden mb-6">
        <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between">
          <div className="flex items-center gap-1 bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg p-0.5 text-xs font-medium">
            <button
              onClick={() => setActiveTab('QUERIES')}
              className={`px-3 py-1 rounded-md transition-colors ${
                activeTab === 'QUERIES' ? 'bg-white text-[#1A73E8] shadow-xs' : 'text-[#5F6368] hover:text-[#202124]'
              }`}
            >
              Top Queries
            </button>
            <button
              onClick={() => setActiveTab('PAGES')}
              className={`px-3 py-1 rounded-md transition-colors ${
                activeTab === 'PAGES' ? 'bg-white text-[#1A73E8] shadow-xs' : 'text-[#5F6368] hover:text-[#202124]'
              }`}
            >
              Landing Pages
            </button>
          </div>

          <span className="text-xs text-[#5F6368]">Last synced: Today, 18:30</span>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-[#F8FAFC] text-[#5F6368] font-medium border-b border-[#E5E7EB]">
            <tr>
              <th className="py-3 px-4">{activeTab === 'QUERIES' ? 'Search Query' : 'Page URL'}</th>
              <th className="py-3 px-4 text-right">Clicks</th>
              <th className="py-3 px-4 text-right">Impressions</th>
              <th className="py-3 px-4 text-right">CTR</th>
              <th className="py-3 px-4 text-right">Position</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB]">
            {activeTab === 'QUERIES' ? (
              queries.map((q, idx) => (
                <tr key={idx} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="py-3 px-4 font-medium text-[#202124]">{q.query}</td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-[#1A73E8] font-semibold">{q.clicks}</td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-[#202124]">{q.impressions}</td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-[#202124]">{q.ctr}</td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-[#202124]">{q.position}</td>
                </tr>
              ))
            ) : (
              pages.map((p, idx) => (
                <tr key={idx} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="py-3 px-4 font-medium text-[#202124] truncate max-w-xs">{p.page}</td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-[#1A73E8] font-semibold">{p.clicks}</td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-[#202124]">{p.impressions}</td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-[#202124]">{p.ctr}</td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-[#202124]">{p.position}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
};

export { AnalyticsPage, LocalAnalyticsPage } from './LocalAnalyticsPage.tsx';

