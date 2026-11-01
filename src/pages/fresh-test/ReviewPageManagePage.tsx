import React, { useState } from 'react';
import {
  Globe,
  Copy,
  ExternalLink,
  Check,
  CheckCircle2,
  RefreshCw,
  QrCode,
  Smartphone,
  ShieldCheck,
  Radio,
  Sliders,
  Sparkles
} from 'lucide-react';
import { useBusiness } from '../../lib/business-context.tsx';

export const ReviewPageManagePage: React.FC = () => {
  const { activeBusiness } = useBusiness();

  const [copiedLink, setCopiedLink] = useState(false);
  const [directMode, setDirectMode] = useState(false);
  const [copiedDirect, setCopiedDirect] = useState(false);

  const canonicalOrigin = typeof window !== 'undefined' && window.location.origin.includes('localhost')
    ? 'https://qorbiqai.com'
    : (typeof window !== 'undefined' ? window.location.origin : 'https://qorbiqai.com');

  const uniqueCode = activeBusiness?.uniqueCode || (activeBusiness ? `code_${activeBusiness.id.replace('biz_', '').substring(0, 8)}` : '');
  const publicReviewUrl = `${canonicalOrigin}/r/${uniqueCode}`;
  const directRedirectUrl = `${canonicalOrigin}/r/${uniqueCode}?direct=1`;

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(publicReviewUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyDirect = async () => {
    await navigator.clipboard.writeText(directRedirectUrl);
    setCopiedDirect(true);
    setTimeout(() => setCopiedDirect(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            <Globe className="w-3.5 h-3.5" />
            <span>Public Customer Review Flow</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Customer Review Page Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage and preview the interactive page your customers see when scanning your stand or tapping your NFC card.
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.open(publicReviewUrl, '_blank', 'noopener,noreferrer')}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-colors self-start sm:self-center"
        >
          <ExternalLink className="w-4 h-4" />
          <span>Open Live Customer Flow</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: URLs & Settings */}
        <div className="lg:col-span-6 space-y-5">
          {/* Main URL Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-blue-600" />
                <span>Primary Dynamic Review URL</span>
              </span>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Live & Active
              </span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3">
              <span className="font-mono text-xs text-blue-700 font-bold truncate">
                {publicReviewUrl}
              </span>
              <button
                type="button"
                onClick={handleCopyLink}
                className="p-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg cursor-pointer transition-colors shrink-0"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              This permanent link powers your QR stands, NFC counter cards, and table tent templates. It never changes even if you update your Google Review URL later.
            </p>
          </div>

          {/* Google Destination URL */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
              Verified Google Review Destination
            </span>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-xs text-slate-800 truncate">
              {activeBusiness?.googleReviewUrl || 'Not configured'}
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              When customers complete their draft and tap "Continue to Google Review", they are taken directly to this official Google write-review form.
            </p>
          </div>

          {/* Direct Redirect Mode Option */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  Instant Google Redirect URL
                </span>
                <span className="text-[11px] text-slate-500">
                  Bypasses the AI assistant and redirects straight to Google Maps
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyDirect}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                {copiedDirect ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedDirect ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="font-mono text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200 truncate">
              {directRedirectUrl}
            </div>
          </div>
        </div>

        {/* Right Column: Live Mobile Mockup Preview */}
        <div className="lg:col-span-6 flex flex-col items-center">
          <div className="w-full max-w-sm bg-slate-900 rounded-[40px] p-4 shadow-2xl border-4 border-slate-800 space-y-3">
            {/* Mobile Speaker Bar */}
            <div className="w-24 h-4 bg-slate-800 rounded-full mx-auto" />

            {/* Mobile Screen Content */}
            <div className="bg-slate-50 rounded-[30px] p-5 space-y-4 text-slate-900 min-h-[460px] flex flex-col justify-between">
              <div className="space-y-4 text-center">
                {/* Business Header */}
                <div className="w-12 h-12 bg-white rounded-2xl mx-auto shadow-xs border border-slate-200 flex items-center justify-center font-bold text-blue-600 text-lg">
                  {activeBusiness?.businessName?.charAt(0) || 'Q'}
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">{activeBusiness?.businessName || 'spiral katta'}</h3>
                  <span className="text-[10px] text-slate-500">Google Review Assistance</span>
                </div>

                {/* Simulated Language Pills */}
                <div className="flex items-center justify-center gap-1.5 pt-1">
                  <span className="px-2 py-0.5 bg-blue-600 text-white rounded-full text-[10px] font-bold">English</span>
                  <span className="px-2 py-0.5 bg-white border border-slate-200 text-slate-600 rounded-full text-[10px] font-bold">मराठी</span>
                  <span className="px-2 py-0.5 bg-white border border-slate-200 text-slate-600 rounded-full text-[10px] font-bold">हिन्दी</span>
                </div>

                {/* Simulated Experience Card */}
                <div className="p-3 bg-white rounded-2xl border border-slate-200 text-left space-y-2 shadow-xs">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">How was your visit?</div>
                  <div className="flex flex-wrap gap-1">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-[9px] font-bold">Food Quality ✓</span>
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-[9px] font-bold">Quick Service ✓</span>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-lg text-[9px]">Ambience</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-xl text-[10px] text-slate-600 italic">
                    "Had misal pav and tea, authentic taste and great hospitality"
                  </div>
                </div>

                {/* AI Draft Preview */}
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-left space-y-1.5">
                  <span className="text-[10px] font-bold text-emerald-800 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    <span>AI Review Draft Ready</span>
                  </span>
                  <p className="text-[10px] text-emerald-950 leading-relaxed font-medium">
                    "Delicious misal pav and authentic flavors! Quick service, hygienic seating, and courteous staff. Highly recommended!"
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  className="w-full py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Review</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.open(activeBusiness?.googleReviewUrl || publicReviewUrl, '_blank')}
                  className="w-full py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Continue to Google Review</span>
                </button>
              </div>
            </div>
          </div>
          <span className="text-xs text-slate-500 mt-3 text-center">
            Live interactive customer review layout
          </span>
        </div>
      </div>
    </div>
  );
};
