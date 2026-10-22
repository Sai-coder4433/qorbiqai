import React, { useState } from 'react';
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Globe,
  Code2,
  Copy,
  Check,
  RefreshCw
} from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout.tsx';
import { useUi } from '../lib/ui-context.tsx';

export const SeoPage: React.FC = () => {
  const { business: uiBiz } = useUi();
  const [crawling, setCrawling] = useState(false);
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [fixedTasks, setFixedTasks] = useState<Record<string, boolean>>({});
  const [createdTasks, setCreatedTasks] = useState<Record<string, boolean>>({});

  const issues = [
    {
      id: 'iss_1',
      title: 'Missing industrial electrical service landing page',
      severity: 'High',
      type: 'Service Gap',
      impact: 'Limits discovery for "electrical contractors Chakan MIDC" queries.',
      recommendation: 'Publish a dedicated service page targeting industrial plant wiring & maintenance contracts.'
    },
    {
      id: 'iss_2',
      title: 'Weak homepage meta title',
      severity: 'Medium',
      type: 'Metadata',
      impact: 'Missing core geographic keywords and brand category.',
      recommendation: 'Update title to: "Atharv Electricals | Industrial Switchgear & Cables | Chakan, Pune".'
    },
    {
      id: 'iss_3',
      title: 'Missing LocalBusiness Schema.org geo coordinates',
      severity: 'Medium',
      type: 'Schema Markup',
      impact: 'Search crawlers cannot precisely map warehouse coordinates.',
      recommendation: 'Inject geo latitude (18.7618) and longitude (73.8587) into JSON-LD header.'
    },
    {
      id: 'iss_4',
      title: 'H1 tag lacks geographic location keyword',
      severity: 'Low',
      type: 'Heading Structure',
      impact: 'Minor ranking signal loss for local proximity.',
      recommendation: 'Adjust H1 heading to include "Chakan & Bhosari Industrial Area".'
    }
  ];

  const handleFix = (id: string) => {
    setFixedTasks(prev => ({ ...prev, [id]: true }));
  };

  const handleCreateTask = (id: string) => {
    setCreatedTasks(prev => ({ ...prev, [id]: true }));
  };

  const handleCopySchema = () => {
    const jsonLd = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'ElectricalSupplyStore',
      'name': 'Atharv Electricals',
      'telephone': '+91 98220 14820',
      'url': 'https://atharvaelectricals.in',
      'address': {
        '@type': 'PostalAddress',
        'streetAddress': 'Talegaon-Chakan Rd, Opp. MIDC Phase II',
        'addressLocality': 'Chakan, Pune',
        'addressRegion': 'MH',
        'postalCode': '410501',
        'addressCountry': 'IN'
      },
      'geo': {
        '@type': 'GeoCoordinates',
        'latitude': 18.7618,
        'longitude': 73.8587
      }
    }, null, 2);
    navigator.clipboard.writeText(jsonLd);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2000);
  };

  return (
    <DashboardLayout>
      {/* 24. LOCAL SEO HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#E5E7EB] mb-6 gap-4">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-semibold text-[#202124] tracking-tight">
            Local SEO
          </h1>
          <p className="text-xs sm:text-sm text-[#5F6368] mt-0.5">
            Find issues affecting your local visibility.
          </p>
          <p className="text-xs text-[#5F6368] mt-1 font-medium">
            Atharv Electricals · Chakan
          </p>
        </div>

        <button
          onClick={() => {
            setCrawling(true);
            setTimeout(() => setCrawling(false), 800);
          }}
          disabled={crawling}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1A73E8] hover:bg-[#1557B0] text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${crawling ? 'animate-spin' : ''}`} />
          <span>{crawling ? 'Crawling Site...' : 'Run Audit'}</span>
        </button>
      </div>

      {/* HEALTH SCORE & STATUS COUNTERS */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs text-[#5F6368] font-medium block">
            Health score
          </span>
          <div className="text-3xl font-semibold text-[#202124] font-mono tabular-nums mt-0.5">
            82 <span className="text-sm font-normal text-[#5F6368]">/ 100</span>
          </div>
        </div>

        <div className="flex items-center gap-6 sm:gap-10 text-xs">
          <div>
            <span className="text-[#5F6368] block">Critical</span>
            <span className="font-semibold text-[#D93025] text-lg font-mono tabular-nums">2</span>
          </div>
          <div>
            <span className="text-[#5F6368] block">Warnings</span>
            <span className="font-semibold text-[#F9AB00] text-lg font-mono tabular-nums">6</span>
          </div>
          <div>
            <span className="text-[#5F6368] block">Passed</span>
            <span className="font-semibold text-[#188038] text-lg font-mono tabular-nums">31</span>
          </div>
        </div>
      </div>

      {/* ISSUE LIST */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 mb-6">
        <h3 className="font-semibold text-sm text-[#202124] mb-4">
          Identified Issues & Tasks
        </h3>

        <div className="space-y-4">
          {issues.map(iss => {
            const isCritical = iss.severity === 'High';
            const isMedium = iss.severity === 'Medium';

            return (
              <div
                key={iss.id}
                className="border-b border-[#E5E7EB] pb-4 last:border-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isCritical ? 'bg-[#D93025]' : isMedium ? 'bg-[#F9AB00]' : 'bg-[#5F6368]'
                      }`}
                    ></span>
                    <h4 className="font-medium text-[#202124]">{iss.title}</h4>
                    <span className="text-[11px] text-[#5F6368]">· {iss.severity}</span>
                  </div>
                  <p className="text-[11px] text-[#5F6368] mt-0.5">{iss.impact}</p>
                  <p className="text-[11px] text-[#1A73E8] mt-0.5">{iss.recommendation}</p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                  <button
                    onClick={() => handleFix(iss.id)}
                    className="px-3 py-1 bg-white border border-[#E5E7EB] hover:bg-[#F8FAFC] text-xs font-medium text-[#202124] rounded-md transition-colors"
                  >
                    {fixedTasks[iss.id] ? 'Fixed ✓' : 'Fix'}
                  </button>
                  <button
                    onClick={() => handleCreateTask(iss.id)}
                    className="px-3 py-1 bg-white border border-[#E5E7EB] hover:bg-[#F8FAFC] text-xs font-medium text-[#5F6368] hover:text-[#202124] rounded-md transition-colors"
                  >
                    {createdTasks[iss.id] ? 'Task Created' : 'Create Task'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SCHEMA.ORG SNIPPET */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-sm text-[#202124]">
              LocalBusiness Schema.org Generator
            </h3>
            <p className="text-xs text-[#5F6368] mt-0.5">
              Verified JSON-LD markup ready for injection into website header.
            </p>
          </div>
          <button
            onClick={handleCopySchema}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E5E7EB] hover:bg-[#F8FAFC] text-xs font-medium text-[#202124] rounded-md transition-colors"
          >
            {copiedSchema ? <Check className="w-3.5 h-3.5 text-[#188038]" /> : <Copy className="w-3.5 h-3.5 text-[#5F6368]" />}
            <span>{copiedSchema ? 'Copied' : 'Copy JSON-LD'}</span>
          </button>
        </div>

        <pre className="p-4 bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg text-[11px] font-mono text-[#202124] overflow-x-auto leading-relaxed">
{`{
  "@context": "https://schema.org",
  "@type": "ElectricalSupplyStore",
  "name": "Atharv Electricals",
  "telephone": "+91 98220 14820",
  "url": "https://atharvaelectricals.in",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Talegaon-Chakan Rd, Opp. MIDC Phase II",
    "addressLocality": "Chakan, Pune",
    "addressRegion": "MH",
    "postalCode": "410501",
    "addressCountry": "IN"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 18.7618,
    "longitude": 73.8587
  }
}`}
        </pre>
      </div>
    </DashboardLayout>
  );
};
