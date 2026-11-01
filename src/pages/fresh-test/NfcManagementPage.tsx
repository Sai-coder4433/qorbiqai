import React, { useState, useEffect } from 'react';
import {
  Radio,
  Smartphone,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Cpu,
  Lock,
  Download,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Zap,
  ArrowRight
} from 'lucide-react';
import { useBusiness } from '../../lib/business-context.tsx';
import { freshTestApi } from '../../lib/fresh-test-api.ts';

export const NfcManagementPage: React.FC = () => {
  const { activeBusiness } = useBusiness();
  const [copied, setCopied] = useState(false);
  const [testingTap, setTestingTap] = useState(false);
  const [lockGuideOpen, setLockGuideOpen] = useState(false);

  const businessCode =
    (activeBusiness as any)?.uniqueQrCode ||
    activeBusiness?.uniqueCode ||
    (activeBusiness?.id ? `code_${activeBusiness.id.replace('biz_', '').substring(0, 8)}` : 'code_cGCE5A96');

  const nfcUrl = `https://qorbiqai.com/r/${businessCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(nfcUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleTestTap = () => {
    setTestingTap(true);
    window.open(nfcUrl, '_blank', 'noopener,noreferrer');
    setTimeout(() => setTestingTap(false), 1200);
  };

  return (
    <div className="space-y-8 pb-12 font-sans max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2">
            <Radio className="w-3.5 h-3.5" />
            <span>NFC Contactless Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>NFC Stand & Tag Management</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Program and manage contactless NFC tags embedded in your Qorbiq AI acrylic table stands and counter pucks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleTestTap}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
          >
            <Smartphone className="w-4 h-4" />
            <span>{testingTap ? 'Opening Live URL...' : 'Test NFC Live Tap'}</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </button>
        </div>
      </div>

      {/* Hero Configuration Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Permanent Tag URL Active
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              {activeBusiness?.businessName || 'Your Business'} — Contactless NFC Link
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Every NFC tag embedded in your acrylic stand points to this permanent dynamic shortlink. Even if your Google review destination changes in the future, your physical NFC chips will never need re-flashing.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2">
              <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-mono text-xs sm:text-sm text-slate-800 select-all truncate">
                {nfcUrl}
              </div>
              <button
                type="button"
                onClick={handleCopy}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied Link!' : 'Copy NFC URL'}</span>
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6 text-center space-y-3">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md">
              <Radio className="w-8 h-8 animate-pulse" />
            </div>
            <div className="text-xs font-bold text-slate-900">Tap to Review</div>
            <div className="text-[11px] text-slate-500 leading-tight">
              Hold any NFC-compatible Android or iPhone near the top of your stand to launch review assistance.
            </div>
            <div className="pt-2 text-[10px] font-mono text-blue-700 bg-white/80 py-1 px-2 rounded-lg border border-blue-200">
              Tag ID: {businessCode}
            </div>
          </div>
        </div>
      </div>

      {/* NFC Hardware Specifications */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2">
          <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider">
            <Cpu className="w-4 h-4" />
            <span>Supported Chipsets</span>
          </div>
          <div className="text-base font-bold text-slate-900">NTAG213 / NTAG215 / NTAG216</div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Standard Type 2 NFC tags compatible with 99.8% of modern Android smartphones and Apple iPhones (iPhone 7 and newer).
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2">
          <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-wider">
            <Zap className="w-4 h-4" />
            <span>Read Range & Speed</span>
          </div>
          <div className="text-base font-bold text-slate-900">0.5 cm – 3.0 cm (Sub-100ms)</div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Zero app installation required for customers. The native OS NFC prompt opens the browser instantly.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider">
            <Lock className="w-4 h-4" />
            <span>Write Protection</span>
          </div>
          <div className="text-base font-bold text-slate-900">Permanent Lock Option</div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Protect against in-store customer tampering by marking the NFC tag as read-only once programmed.
          </p>
        </div>
      </div>

      {/* Step-by-Step Programming Guide */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900">How to Flash a New NFC Standee in 60 Seconds</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Follow these simple steps using the free NFC Tools application on iOS or Android.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
              1
            </div>
            <div className="font-bold text-sm text-slate-900">Install "NFC Tools"</div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Download the free <strong>NFC Tools</strong> app by wakdev from Google Play Store or Apple App Store.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
              2
            </div>
            <div className="font-bold text-sm text-slate-900">Tap "Write" &gt; "Add Record"</div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Open NFC Tools, navigate to the <strong>Write</strong> tab, tap <strong>Add a record</strong>, and choose <strong>Custom URL / URI</strong>.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
              3
            </div>
            <div className="font-bold text-sm text-slate-900">Paste Permanent URL</div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Paste your link: <br />
              <code className="text-[11px] text-blue-700 font-mono bg-blue-50 px-1 py-0.5 rounded break-all">
                {nfcUrl}
              </code>
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
              4
            </div>
            <div className="font-bold text-sm text-slate-900">Tap "Write" &amp; Touch Tag</div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tap <strong>Write</strong> and touch the top-center back of your acrylic stand. You will hear a success chime!
            </p>
          </div>
        </div>

        {/* Lock Warning Banner */}
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800 space-y-1">
            <div className="font-bold">Recommendation for Public Retail Environments:</div>
            <p className="leading-relaxed">
              Once you confirm your stand redirects properly, you may use NFC Tools &gt; <em>Other</em> &gt; <em>Lock Tag</em>. This permanently freezes the tag so no one else can overwrite your review destination. Because Qorbiq AI uses a dynamic link, your Google Review target can still be changed in your dashboard at any time!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

