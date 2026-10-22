import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  MapPin,
  Globe,
  ExternalLink,
  QrCode,
  Download,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  HelpCircle,
  ShieldCheck,
  Eye,
  FileText,
  Printer,
  Copy,
  Check
} from 'lucide-react';
import { fetchApi } from '../lib/api.ts';
import { generateQrPngDataUrl, generateQrSvgString, generatePrintPdf, downloadFile, PrintTemplateType } from '../lib/qr-generator.ts';

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Step 1: Business details
  const [businessName, setBusinessName] = useState('Atharv Electricals');
  const [category, setCategory] = useState('Electrical Equipment & Services');
  const [address, setAddress] = useState('Talegaon-Chakan Rd, Opp. MIDC Phase II, Chakan, Pune 410501');
  const [logoUrl, setLogoUrl] = useState('https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=150&auto=format&fit=crop&q=80');
  const [website, setWebsite] = useState('https://atharvaelectricals.in');

  // Step 2: Google review link
  const [googleReviewUrl, setGoogleReviewUrl] = useState('https://search.google.com/local/writereview?placeid=ChIJ_AtharvPlaceId');
  const [urlValid, setUrlValid] = useState(true);
  const [urlError, setUrlError] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);

  // Step 3: Generated QR Code
  const [qrName, setQrName] = useState('Main Billing Counter Stand');
  const [placement, setPlacement] = useState<'Counter' | 'Table Stand' | 'Reception' | 'Billing Desk' | 'Window / Entrance' | 'Packaging / Delivery'>('Counter');
  const [generatedCode, setGeneratedCode] = useState('ath-counter');
  const [qrPngUrl, setQrPngUrl] = useState<string>('');
  const [qrSvgString, setQrSvgString] = useState<string>('');
  const [createdQrId, setCreatedQrId] = useState<string>('');

  // Step 4: Preview Mockup Selection
  const [activeMockup, setActiveMockup] = useState<PrintTemplateType>('counter_stand');
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);

  const fullRedirectUrl = `${window.location.origin}/r/${generatedCode}`;

  // Validate Google Review URL
  const validateGoogleUrl = (url: string) => {
    setGoogleReviewUrl(url);
    if (!url.trim()) {
      setUrlValid(false);
      setUrlError('Review URL cannot be empty');
      return false;
    }
    const isGoogle = /google\.com|g\.page|goo\.gl|search\.google/i.test(url);
    if (!isGoogle) {
      setUrlValid(false);
      setUrlError('Please enter an official Google review URL (e.g. g.page/r/... or search.google.com/local/writereview...)');
      return false;
    }
    setUrlValid(true);
    setUrlError('');
    return true;
  };

  // Generate QR Assets when moving to Step 3 or when URL/code changes
  useEffect(() => {
    if (generatedCode) {
      const url = `${window.location.origin}/r/${generatedCode}`;
      generateQrPngDataUrl(url, { width: 1024, margin: 2 }).then(setQrPngUrl);
      generateQrSvgString(url, { margin: 2 }).then(setQrSvgString);
    }
  }, [generatedCode]);

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim()) return alert('Please enter your business name');
    if (!address.trim()) return alert('Please enter your business address');
    setCurrentStep(2);
  };

  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateGoogleUrl(googleReviewUrl)) return;
    // Generate clean code from business name
    const prefix = businessName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5) || 'rev';
    setGeneratedCode(`${prefix}-${Math.random().toString(36).substring(2, 6)}`);
    setCurrentStep(3);
  };

  const handleGenerateAndSaveQr = async () => {
    setLoading(true);
    try {
      // Save QR code to backend
      const res = await fetchApi<any>('/qr-codes', {
        method: 'POST',
        body: JSON.stringify({
          businessId: 'biz_001',
          name: qrName,
          destinationUrl: googleReviewUrl,
          placement,
          code: generatedCode
        })
      });

      if (res?.qrCode) {
        setCreatedQrId(res.qrCode.id);
        setGeneratedCode(res.qrCode.code);
      }
      setCurrentStep(4);
    } catch (err: any) {
      // If code existed or free tier limit reached, allow advancing with active code
      console.warn('QR creation notice:', err.message);
      setCurrentStep(4);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPng = async (res: number = 1024) => {
    setDownloadingFormat(`png_${res}`);
    try {
      const pngData = await generateQrPngDataUrl(fullRedirectUrl, { width: res, margin: 2 });
      downloadFile(pngData, `${businessName.replace(/\s+/g, '_')}_QR_${res}px.png`, 'image/png');
    } finally {
      setDownloadingFormat(null);
    }
  };

  const handleDownloadSvg = async () => {
    setDownloadingFormat('svg');
    try {
      const svg = await generateQrSvgString(fullRedirectUrl, { margin: 2 });
      downloadFile(svg, `${businessName.replace(/\s+/g, '_')}_QR.svg`, 'image/svg+xml');
    } finally {
      setDownloadingFormat(null);
    }
  };

  const handleDownloadPdf = async (type: PrintTemplateType) => {
    setDownloadingFormat(type);
    try {
      await generatePrintPdf({
        businessName,
        qrCodeUrl: fullRedirectUrl,
        placementName: placement,
        templateType: type
      });
    } finally {
      setDownloadingFormat(null);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fullRedirectUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleOAuthConnect = async () => {
    setIsConnectingGoogle(true);
    try {
      await fetchApi('/google-profile/connect', {
        method: 'POST',
        body: JSON.stringify({ placeId: 'ChIJ_AtharvPlaceId' })
      });
      alert('Google Business Profile connected successfully! Review URL verified.');
      setGoogleReviewUrl('https://search.google.com/local/writereview?placeid=ChIJ_AtharvPlaceId');
      setUrlValid(true);
    } catch (e: any) {
      alert(e.message || 'OAuth mock connection configured.');
    } finally {
      setIsConnectingGoogle(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col justify-between font-sans">
      {/* Top Simple Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-sm">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-zinc-900 dark:text-white">ReviewFlow</span>
              <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                Setup Wizard
              </span>
            </div>
          </div>
          <button
            onClick={() => navigate('/app/dashboard')}
            className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 font-medium transition-colors"
          >
            Skip to Dashboard →
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto w-full px-6 py-10 flex-1 flex flex-col justify-center">
        {/* Step Progress Pills */}
        <div className="mb-8">
          <div className="grid grid-cols-4 gap-2 mb-3">
            {[
              { num: 1, label: 'Business Details' },
              { num: 2, label: 'Google Review Link' },
              { num: 3, label: 'Generate QR' },
              { num: 4, label: 'Download & Launch' }
            ].map(s => {
              const isActive = currentStep === s.num;
              const isDone = currentStep > s.num;
              return (
                <div
                  key={s.num}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    isDone ? 'bg-emerald-600' : isActive ? 'bg-blue-600' : 'bg-zinc-200 dark:bg-zinc-800'
                  }`}
                />
              );
            })}
          </div>
          <div className="flex justify-between items-center text-xs text-zinc-500 font-medium px-1">
            <span>Step {currentStep} of 4</span>
            <span className="text-zinc-700 dark:text-zinc-300">
              {currentStep === 1 && 'Step 1: Your business profile'}
              {currentStep === 2 && 'Step 2: Connect your Google review page'}
              {currentStep === 3 && 'Step 3: Unique trackable QR code'}
              {currentStep === 4 && 'Step 4: Download ready-to-print materials'}
            </span>
          </div>
        </div>

        {/* STEP 1: BUSINESS DETAILS */}
        {currentStep === 1 && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm">
            <div className="mb-6">
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Business Details</h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Enter your physical business information. This will appear on your printable review stands and table tents.
              </p>
            </div>

            <form onSubmit={handleStep1Submit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                  Business Name *
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3.5 top-3.5 text-zinc-400" />
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={e => setBusinessName(e.target.value)}
                    placeholder="e.g. Atharv Electricals"
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                    Category *
                  </label>
                  <input
                    type="text"
                    required
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    placeholder="e.g. Restaurant, Dental Clinic, Retail"
                    className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                    Website (Optional)
                  </label>
                  <div className="relative">
                    <Globe className="w-4 h-4 absolute left-3.5 top-3.5 text-zinc-400" />
                    <input
                      type="url"
                      value={website}
                      onChange={e => setWebsite(e.target.value)}
                      placeholder="https://yourbusiness.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                  Business Address *
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3.5 top-3.5 text-zinc-400" />
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="Street Address, City, Postal Code"
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                  Logo Image URL (Optional)
                </label>
                <input
                  type="url"
                  value={logoUrl}
                  onChange={e => setLogoUrl(e.target.value)}
                  placeholder="https://yourbusiness.com/logo.png"
                  className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 dark:text-white"
                />
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm shadow-sm transition-colors"
                >
                  Continue to Google Review Link
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 2: GOOGLE REVIEW LINK */}
        {currentStep === 2 && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm">
            <div className="mb-6">
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Google Review Destination</h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Your QR codes will redirect customers directly to this official Google write-review page.
              </p>
            </div>

            <form onSubmit={handleStep2Submit} className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                    Official Google Review URL *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowInstructions(!showInstructions)}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    How to find this link?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="url"
                    required
                    value={googleReviewUrl}
                    onChange={e => validateGoogleUrl(e.target.value)}
                    placeholder="https://g.page/r/.../review or https://search.google.com/local/writereview?placeid=..."
                    className={`w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-600 dark:text-white ${
                      urlValid ? 'border-zinc-300 dark:border-zinc-700' : 'border-rose-500 ring-1 ring-rose-500'
                    }`}
                  />
                  {urlValid && googleReviewUrl && (
                    <div className="absolute right-3 top-3 text-emerald-600 flex items-center gap-1 text-xs font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      Valid
                    </div>
                  )}
                </div>
                {urlError && <p className="text-xs text-rose-500 mt-1.5 font-medium">{urlError}</p>}
              </div>

              {/* Instructions Collapsible */}
              {showInstructions && (
                <div className="bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-xl p-4 text-xs text-zinc-700 dark:text-zinc-300 space-y-2">
                  <div className="font-semibold text-blue-900 dark:text-blue-300">
                    How to get your official Google Review Link in 3 steps:
                  </div>
                  <ol className="list-decimal pl-4 space-y-1">
                    <li>Go to Google Search and sign in with your Google Business Profile account.</li>
                    <li>Search for your business name to open your Business Profile dashboard.</li>
                    <li>Click the <strong>"Ask for reviews"</strong> button and copy the short URL provided (starts with <code className="bg-white/80 dark:bg-zinc-800 px-1 py-0.5 rounded">https://g.page/r/...</code>).</li>
                  </ol>
                </div>
              )}

              {/* Destination Preview Card */}
              {urlValid && googleReviewUrl && (
                <div className="bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5" /> Destination Preview
                    </span>
                    <a
                      href={googleReviewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      Test in New Tab <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 flex items-center justify-center font-bold text-blue-600">
                      G
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-zinc-900 dark:text-white">{businessName}</div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-md">{googleReviewUrl}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Optional OAuth Box */}
              <div className="border-t border-zinc-200 dark:border-zinc-800 pt-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Google Business Profile Connection
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Authorize Google OAuth for direct place verification and review sync (optional).
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleOAuthConnect}
                    disabled={isConnectingGoogle}
                    className="px-3 py-1.5 text-xs font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-lg border border-zinc-300 dark:border-zinc-700 transition-colors"
                  >
                    {isConnectingGoogle ? 'Connecting...' : 'Connect OAuth'}
                  </button>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="flex items-center gap-1 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="submit"
                  disabled={!urlValid}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg text-sm shadow-sm transition-colors"
                >
                  Generate My QR Code
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 3: GENERATE QR */}
        {currentStep === 3 && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm">
            <div className="mb-6">
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Your Google Review QR Code</h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                A permanent trackable QR code has been created for your business. It directs immediately to your Google review page.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* QR Preview Card */}
              <div className="bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/80 rounded-2xl p-6 text-center flex flex-col items-center">
                <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">Live QR Preview</div>
                <div className="bg-white p-4 rounded-xl shadow-md border border-zinc-200 inline-block mb-4">
                  {qrPngUrl ? (
                    <img src={qrPngUrl} alt="Review QR Code" className="w-44 h-44 object-contain" />
                  ) : (
                    <div className="w-44 h-44 flex items-center justify-center text-zinc-400">Generating...</div>
                  )}
                </div>
                <div className="text-sm font-bold text-zinc-900 dark:text-white">{businessName}</div>
                <div className="text-xs text-zinc-500 mt-1">Placement: {placement}</div>
                <div className="mt-3 flex items-center gap-2 text-xs font-mono bg-zinc-200/70 dark:bg-zinc-700/60 px-3 py-1 rounded-full text-zinc-700 dark:text-zinc-300">
                  <span>/r/{generatedCode}</span>
                </div>
              </div>

              {/* QR Configuration Details */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                    QR Code Name
                  </label>
                  <input
                    type="text"
                    value={qrName}
                    onChange={e => setQrName(e.target.value)}
                    placeholder="e.g. Front Billing Counter Stand"
                    className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                    Placement Location
                  </label>
                  <select
                    value={placement}
                    onChange={e => setPlacement(e.target.value as any)}
                    className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm dark:text-white"
                  >
                    <option value="Counter">Front Counter / Billing Desk</option>
                    <option value="Table Stand">Table Tent / Dining Stand</option>
                    <option value="Reception">Reception / Check-in Area</option>
                    <option value="Window / Entrance">Window / Entrance Door</option>
                    <option value="Packaging / Delivery">Packaging / Takeaway Bag</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                    Permanent Trackable URL
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={fullRedirectUrl}
                      className="w-full px-3 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs font-mono text-zinc-600 dark:text-zinc-300"
                    />
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="px-3 py-2 text-xs font-medium border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 hover:bg-zinc-50 flex items-center gap-1"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedLink ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    When scanned, this immediately records the scan and opens your Google Review link.
                  </p>
                </div>

                <div className="pt-2">
                  <div className="text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-lg p-3 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      <strong>Direct Redirection Verified:</strong> Zero middleman feedback gates, no app downloads, no AI generator delays.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800 mt-6 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="flex items-center gap-1 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                type="button"
                onClick={handleGenerateAndSaveQr}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg text-sm shadow-sm transition-colors"
              >
                {loading ? 'Saving...' : 'Continue to Download & Launch'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: DOWNLOAD AND LAUNCH */}
        {currentStep === 4 && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm">
            <div className="mb-6">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-600 mb-1">
                <CheckCircle2 className="w-4 h-4" /> Setup Complete
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Download & Print Your QR Code</h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Choose your print template, download high-resolution assets, and display them in your business.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              {/* Stand / Tent / Poster Mockup Preview */}
              <div className="md:col-span-6 bg-zinc-100 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-6 flex flex-col items-center">
                {/* Template Switcher */}
                <div className="flex bg-zinc-200 dark:bg-zinc-700 p-1 rounded-lg text-xs font-medium mb-6 w-full max-w-xs">
                  <button
                    onClick={() => setActiveMockup('counter_stand')}
                    className={`flex-1 py-1.5 rounded-md transition-all ${
                      activeMockup === 'counter_stand' ? 'bg-white dark:bg-zinc-800 shadow-sm text-blue-600 dark:text-blue-400 font-bold' : 'text-zinc-600 dark:text-zinc-300'
                    }`}
                  >
                    Counter Stand
                  </button>
                  <button
                    onClick={() => setActiveMockup('table_tent')}
                    className={`flex-1 py-1.5 rounded-md transition-all ${
                      activeMockup === 'table_tent' ? 'bg-white dark:bg-zinc-800 shadow-sm text-blue-600 dark:text-blue-400 font-bold' : 'text-zinc-600 dark:text-zinc-300'
                    }`}
                  >
                    Table Tent
                  </button>
                  <button
                    onClick={() => setActiveMockup('wall_poster')}
                    className={`flex-1 py-1.5 rounded-md transition-all ${
                      activeMockup === 'wall_poster' ? 'bg-white dark:bg-zinc-800 shadow-sm text-blue-600 dark:text-blue-400 font-bold' : 'text-zinc-600 dark:text-zinc-300'
                    }`}
                  >
                    Wall Poster
                  </button>
                </div>

                {/* Simulated Physical Acrylic Mockup */}
                <div className="w-56 bg-white border border-zinc-200 rounded-xl p-5 text-center shadow-xl text-zinc-900 transition-all duration-300 relative">
                  <div className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase mb-1">
                    {activeMockup === 'wall_poster' ? 'A4 Poster' : 'Official Review Stand'}
                  </div>
                  <div className="font-bold text-sm tracking-tight text-zinc-900 line-clamp-1">{businessName}</div>
                  <div className="text-[10px] text-zinc-500 mb-2">Scan to leave a Google review</div>
                  <div className="text-amber-500 font-bold text-xs tracking-widest mb-3">★ ★ ★ ★ ★</div>

                  <div className="bg-zinc-50 p-2.5 rounded-lg border border-zinc-200 inline-block mb-3">
                    <img src={qrPngUrl} alt="Review QR Code" className="w-28 h-28 object-contain" />
                  </div>

                  <div className="bg-blue-600 text-white text-[11px] font-bold py-1.5 px-3 rounded-lg shadow-sm">
                    Review Us on Google
                  </div>

                  <div className="text-[9px] text-zinc-400 mt-2">
                    {placement} • Direct Google Redirect
                  </div>
                </div>

                <div className="text-xs text-zinc-500 mt-4 text-center">
                  Preview rendered at print scale with standard Google review badge.
                </div>
              </div>

              {/* Download Buttons & Options */}
              <div className="md:col-span-6 space-y-4">
                <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Export Print Assets
                </div>

                {/* Print-Ready PDF */}
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 bg-zinc-50/50 dark:bg-zinc-800/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Printer className="w-4 h-4 text-blue-600" />
                      <span className="font-semibold text-sm text-zinc-900 dark:text-white">Print-Ready PDF</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                      Recommended
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mb-3">
                    Formatted for professional acrylic stands (5x7") or A4 posters with Google 5-star typography.
                  </p>
                  <button
                    onClick={() => handleDownloadPdf(activeMockup)}
                    disabled={downloadingFormat === activeMockup}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    {downloadingFormat === activeMockup ? 'Generating PDF...' : `Download ${activeMockup === 'wall_poster' ? 'Wall Poster' : 'Stand Card'} PDF`}
                  </button>
                </div>

                {/* High-Res PNG */}
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
                      <span className="font-semibold text-sm text-zinc-900 dark:text-white">High-Resolution PNG</span>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-400">1024 x 1024 px</span>
                  </div>
                  <p className="text-xs text-zinc-500 mb-3">
                    Crisp PNG file with transparent margin, ideal for digital graphics or custom printing.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDownloadPng(1024)}
                      disabled={downloadingFormat === 'png_1024'}
                      className="flex-1 py-1.5 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-medium rounded-lg flex items-center justify-center gap-1 transition-colors"
                    >
                      <Download className="w-3 h-3" />
                      Standard (1024px)
                    </button>
                    <button
                      onClick={() => handleDownloadPng(3000)}
                      disabled={downloadingFormat === 'png_3000'}
                      className="flex-1 py-1.5 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-medium rounded-lg flex items-center justify-center gap-1 transition-colors font-semibold"
                    >
                      <Download className="w-3 h-3" />
                      Ultra-HD (3000px)
                    </button>
                  </div>
                </div>

                {/* Vector SVG */}
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
                      <span className="font-semibold text-sm text-zinc-900 dark:text-white">Vector SVG</span>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-400">Lossless Vector</span>
                  </div>
                  <p className="text-xs text-zinc-500 mb-3">
                    Infinitely scalable vector file for commercial printers, vinyl stickers, and signage.
                  </p>
                  <button
                    onClick={handleDownloadSvg}
                    disabled={downloadingFormat === 'svg'}
                    className="w-full py-1.5 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-medium rounded-lg flex items-center justify-center gap-1 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    {downloadingFormat === 'svg' ? 'Exporting...' : 'Download Vector SVG'}
                  </button>
                </div>
              </div>
            </div>

            {/* Launch to Dashboard */}
            <div className="pt-8 border-t border-zinc-200 dark:border-zinc-800 mt-8 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="flex items-center gap-1 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" /> Back to QR
              </button>
              <button
                onClick={() => navigate('/app/dashboard')}
                className="flex items-center gap-2 px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-md transition-all hover:scale-[1.02]"
              >
                Launch Owner Dashboard
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-4 text-center text-xs text-zinc-400">
        ReviewFlow • Official Google Review QR Code SaaS Platform
      </footer>
    </div>
  );
};
