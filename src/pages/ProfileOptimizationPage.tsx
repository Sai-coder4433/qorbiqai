import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Building2,
  MapPin,
  Clock,
  Phone,
  Globe,
  Tag,
  Check,
  RefreshCw
} from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout.tsx';
import { fetchApi } from '../lib/api.ts';
import { useUi } from '../lib/ui-context.tsx';

export const ProfileOptimizationPage: React.FC = () => {
  const { business: uiBiz } = useUi();
  const [loading, setLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [appliedFields, setAppliedFields] = useState<Record<string, boolean>>({});

  const [profileData, setProfileData] = useState({
    name: 'Atharv Electricals',
    primaryCategory: 'Electrical Supply Store',
    secondaryCategories: ['Electrical Contractor', 'Industrial Equipment Supplier'],
    address: 'Talegaon-Chakan Rd, Opp. MIDC Phase II, Chakan, Pune, Maharashtra 410501',
    phone: '+91 98220 14820',
    website: 'https://atharvaelectricals.in',
    hours: 'Monday – Saturday: 08:30 AM – 08:30 PM (Sunday Closed)',
    description: 'Premier supplier of industrial electrical switchgears, HT/LT power cables, distribution panels, and commercial electrical contracting services in Chakan MIDC.',
    services: ['Industrial Switchgear Supply', 'HT/LT Power Cables', 'Distribution Panel Fabrication', 'Electrical Contracting', 'Transformer Installation']
  });

  const suggestions = [
    {
      field: 'Business Description',
      key: 'description',
      currentValue: profileData.description,
      aiSuggestion: 'Authorized industrial electrical distributor in Chakan MIDC Phase I & II. We supply certified switchgears (Schneider, L&T, Siemens), Polycab HT/LT cables, custom control panels, and licensed industrial contracting services with 24/7 breakdown support.',
      reason: 'Incorporates high-intent local contractor queries: "Chakan MIDC Phase II switchgear", "Polycab cable supplier", and "licensed industrial contracting".'
    },
    {
      field: 'Primary Category',
      key: 'primaryCategory',
      currentValue: profileData.primaryCategory,
      aiSuggestion: 'Electrical Supply Store & Industrial Equipment Supplier',
      reason: 'Broadens Google Maps discovery for manufacturing plant maintenance teams searching for B2B industrial electricals.'
    },
    {
      field: 'Special & Holiday Hours',
      key: 'hours',
      currentValue: profileData.hours,
      aiSuggestion: 'Set upcoming Diwali & National holiday hours in advance to maintain the Verified Operating Hours badge on Google Maps.',
      reason: 'Prevents customer drop-off during festival seasons and avoids "hours may differ" flags.'
    }
  ];

  const handleApply = (key: string, val: string) => {
    setProfileData(prev => ({ ...prev, [key]: val }));
    setAppliedFields(prev => ({ ...prev, [key]: true }));
  };

  const handleOptimizeWithAi = () => {
    setOptimizing(true);
    setTimeout(() => {
      setOptimizing(false);
    }, 600);
  };

  return (
    <DashboardLayout>
      {/* 8. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#E5E7EB] mb-6 gap-4">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-semibold text-[#202124] tracking-tight">
            Business Profile
          </h1>
          <p className="text-xs sm:text-sm text-[#5F6368] mt-0.5">
            Optimize your Google Business Profile fields and local ranking signals.
          </p>
          <p className="text-xs text-[#5F6368] mt-1 font-medium">
            Atharv Electricals · Chakan
          </p>
        </div>

        <button
          onClick={handleOptimizeWithAi}
          disabled={optimizing}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1A73E8] hover:bg-[#1557B0] text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50 self-start sm:self-auto"
        >
          <Sparkles className={`w-3.5 h-3.5 ${optimizing ? 'animate-spin' : ''}`} />
          <span>{optimizing ? 'Analyzing with AI...' : 'Optimize with AI'}</span>
        </button>
      </div>

      {/* 23. TWO-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* LEFT COLUMN (2 Cols): Business Information */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
            <h3 className="font-semibold text-sm text-[#202124] mb-4">
              Core Identity & Contact Information
            </h3>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-[#5F6368] block mb-1">Business Name</span>
                  <div className="p-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg font-medium text-[#202124]">
                    {profileData.name}
                  </div>
                </div>
                <div>
                  <span className="text-[#5F6368] block mb-1">Primary Category</span>
                  <div className="p-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg font-medium text-[#202124]">
                    {profileData.primaryCategory}
                  </div>
                </div>
              </div>

              <div>
                <span className="text-[#5F6368] block mb-1">Full Store Address</span>
                <div className="p-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg font-medium text-[#202124]">
                  {profileData.address}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-[#5F6368] block mb-1">Verified Phone Number</span>
                  <div className="p-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg font-medium text-[#202124]">
                    {profileData.phone}
                  </div>
                </div>
                <div>
                  <span className="text-[#5F6368] block mb-1">Website URL</span>
                  <div className="p-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg font-medium text-[#202124]">
                    {profileData.website}
                  </div>
                </div>
              </div>

              <div>
                <span className="text-[#5F6368] block mb-1">Operating Hours</span>
                <div className="p-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg font-medium text-[#202124]">
                  {profileData.hours}
                </div>
              </div>
            </div>
          </div>

          {/* Profile Fields with AI Suggestions */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
            <h3 className="font-semibold text-sm text-[#202124] mb-4">
              AI Field Optimization & Suggestions
            </h3>

            <div className="space-y-5">
              {suggestions.map((sug, i) => (
                <div key={i} className="border-b border-[#E5E7EB] pb-5 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-xs text-[#202124]">
                      {sug.field}
                    </span>
                    {appliedFields[sug.key] && (
                      <span className="text-[11px] font-medium text-[#188038] flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        Applied to Profile
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-[11px] text-[#5F6368] block mb-0.5">Current Value:</span>
                      <p className="p-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg text-[#5F6368]">
                        {sug.currentValue}
                      </p>
                    </div>

                    <div>
                      <span className="text-[11px] text-[#1A73E8] font-medium block mb-0.5">AI Suggestion:</span>
                      <p className="p-2.5 bg-[#E8F0FE]/60 border border-[#D2E3FC] rounded-lg text-[#202124]">
                        {sug.aiSuggestion}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-[#5F6368]">{sug.reason}</span>
                      {!appliedFields[sug.key] ? (
                        <button
                          onClick={() => handleApply(sug.key, sug.aiSuggestion)}
                          className="px-3 py-1 bg-white border border-[#E5E7EB] hover:bg-[#F8FAFC] text-xs font-medium text-[#1A73E8] rounded-md transition-colors"
                        >
                          Apply
                        </button>
                      ) : (
                        <span className="text-xs text-[#188038] font-medium">Synced</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (1 Col): Optimization Score */}
        <div className="space-y-5">
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 sticky top-20">
            <h3 className="font-semibold text-sm text-[#202124] mb-3">
              Profile Health
            </h3>

            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-3xl font-semibold text-[#202124] font-mono tabular-nums">
                92
              </span>
              <span className="text-sm text-[#5F6368]">/ 100</span>
            </div>

            {/* Health Checklist per spec */}
            <div className="space-y-2.5 text-xs text-[#202124] border-t border-[#E5E7EB] pt-4 mb-5">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#188038] shrink-0" />
                <span>Business description</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#188038] shrink-0" />
                <span>Hours</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#188038] shrink-0" />
                <span>Services</span>
              </div>
              <div className="flex items-center gap-2 text-[#B06000]">
                <AlertTriangle className="w-4 h-4 text-[#F9AB00] shrink-0" />
                <span>2 attributes missing</span>
              </div>
              <div className="flex items-center gap-2 text-[#B06000]">
                <AlertTriangle className="w-4 h-4 text-[#F9AB00] shrink-0" />
                <span>3 media categories incomplete</span>
              </div>
            </div>

            <button
              onClick={handleOptimizeWithAi}
              disabled={optimizing}
              className="w-full py-2 px-3 bg-[#1A73E8] hover:bg-[#1557B0] text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Optimize with AI</span>
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
