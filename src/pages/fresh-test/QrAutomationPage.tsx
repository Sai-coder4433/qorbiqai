import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  QrCode,
  Building2,
  CheckCircle2,
  AlertCircle,
  Download,
  Copy,
  ExternalLink,
  Printer,
  Sparkles,
  Camera,
  RefreshCw,
  Clock,
  Smartphone,
  Eye,
  Star,
  Layers,
  Calendar,
  Plus,
  Play,
  Pause,
  ShieldCheck
} from 'lucide-react';
import QRCode from 'qrcode';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import {
  freshTestApi,
  BusinessData,
  QrCodeData,
  AnalyticsData
} from '../../lib/fresh-test-api.ts';
import { CameraQrScannerModal } from '../../components/fresh-test/CameraQrScannerModal.tsx';
import { downloadUltraHdPng, downloadVectorSvg } from '../../lib/qr-generator.ts';

export const QrAutomationPage: React.FC = () => {
  // State: Business Setup
  const [business, setBusiness] = useState<BusinessData | null>(null);
  const [businessName, setBusinessName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [googleReviewUrl, setGoogleReviewUrl] = useState('');
  const [location, setLocation] = useState('');
  const [savingBusiness, setSavingBusiness] = useState(false);
  const [businessError, setBusinessError] = useState<string | null>(null);
  const [businessSuccess, setBusinessSuccess] = useState<string | null>(null);

  // State: QR Codes (Multi-QR System)
  const [qrCode, setQrCode] = useState<QrCodeData | null>(null);
  const [qrCodes, setQrCodes] = useState<QrCodeData[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [showNewQrModal, setShowNewQrModal] = useState(false);
  const [newQrPlacement, setNewQrPlacement] = useState('Billing Counter');
  const [customPlacement, setCustomPlacement] = useState('');
  const [creatingQr, setCreatingQr] = useState(false);
  const [generatingQr, setGeneratingQr] = useState(false);
  const [qrPngUrl, setQrPngUrl] = useState<string>('');
  const [qrSvgContent, setQrSvgContent] = useState<string>('');
  const [qrError, setQrError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // State: Analytics
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // State: Scanner Modal
  const [scannerOpen, setScannerOpen] = useState(false);

  // Print Modal
  const [showPrintModal, setShowPrintModal] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      // 1. Load Business Setup
      const biz = await freshTestApi.getBusiness();
      if (biz) {
        setBusiness(biz);
        setBusinessName(biz.businessName);
        setLogoUrl(biz.logoUrl || '');
        setGoogleReviewUrl(biz.googleReviewUrl);
        setLocation(biz.location || '');
      }

      // 2. Load Multi-QR Codes & Subscription
      const [qrs, sub] = await Promise.all([
        freshTestApi.getQrCodes().catch(() => []),
        freshTestApi.getSubscription().catch(() => null)
      ]);
      setQrCodes(qrs);
      if (sub) setSubscription(sub);

      if (qrs.length > 0) {
        setQrCode(qrs[0]);
        renderQrImages(qrs[0].destinationUrl);
      }

      // 3. Load Analytics
      refreshAnalytics();
    } catch (err: any) {
      console.warn('Initialization note:', err.message);
    }
  };

  const refreshAnalytics = async () => {
    try {
      setLoadingAnalytics(true);
      const data = await freshTestApi.getAnalytics();
      setAnalytics(data);
    } catch (e) {
      console.error('Failed to load analytics:', e);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const renderQrImages = async (url: string) => {
    try {
      const png = await QRCode.toDataURL(url, {
        width: 600,
        margin: 2,
        color: { dark: '#09090b', light: '#ffffff' }
      });
      setQrPngUrl(png);

      const svg = await QRCode.toString(url, {
        type: 'svg',
        margin: 2,
        color: { dark: '#09090b', light: '#ffffff' }
      });
      setQrSvgContent(svg);
    } catch (err) {
      console.error('Error generating QR previews:', err);
    }
  };

  const handleSaveBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBusiness(true);
    setBusinessError(null);
    setBusinessSuccess(null);

    try {
      const saved = await freshTestApi.saveBusiness({
        businessName: businessName.trim(),
        logoUrl: logoUrl.trim() || undefined,
        googleReviewUrl: googleReviewUrl.trim(),
        location: location.trim() || undefined
      });
      setBusiness(saved);
      setBusinessSuccess('Business setup saved successfully!');

      // If QR exists, re-sync safely without letting a sync error overwrite save success
      try {
        const qr = await freshTestApi.getQrCode();
        if (qr) {
          setQrCode(qr);
          renderQrImages(qr.destinationUrl);
        }
      } catch (qrSyncErr) {
        console.warn('QR sync note:', qrSyncErr);
      }
      setTimeout(() => setBusinessSuccess(null), 3500);
    } catch (err: any) {
      setBusinessError(err.message || 'Failed to save business settings');
    } finally {
      setSavingBusiness(false);
    }
  };

  const handleGenerateQr = async () => {
    setGeneratingQr(true);
    setQrError(null);

    try {
      // Auto-save business settings first if filled in the form
      if (businessName.trim() && googleReviewUrl.trim()) {
        const saved = await freshTestApi.saveBusiness({
          businessName: businessName.trim(),
          logoUrl: logoUrl.trim() || undefined,
          googleReviewUrl: googleReviewUrl.trim(),
          location: location.trim() || undefined
        });
        setBusiness(saved);
      } else if (!business || !business.googleReviewUrl) {
        setQrError('Please save your Business Setup and Google Review URL before generating a QR code.');
        setGeneratingQr(false);
        return;
      }

      const generated = await freshTestApi.generateQrCode();
      setQrCode(generated);
      const list = await freshTestApi.getQrCodes();
      setQrCodes(list);
      await renderQrImages(generated.destinationUrl);
      refreshAnalytics();
    } catch (err: any) {
      setQrError(err.message || 'Failed to generate QR code');
    } finally {
      setGeneratingQr(false);
    }
  };

  const handleCreateNewQr = async (label: string) => {
    if (!business || !business.googleReviewUrl) {
      setQrError('Please configure your Google Review URL before creating a QR stand.');
      return;
    }
    setCreatingQr(true);
    setQrError(null);
    try {
      const created = await freshTestApi.createQrCode(label);
      const list = await freshTestApi.getQrCodes();
      setQrCodes(list);
      setQrCode(created);
      await renderQrImages(created.destinationUrl);
      setShowNewQrModal(false);
      refreshAnalytics();
    } catch (err: any) {
      setQrError(err.message || 'Failed to create QR stand');
    } finally {
      setCreatingQr(false);
    }
  };

  const handleToggleQrStatus = async (id: string, currentStatus: 'ACTIVE' | 'PAUSED') => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      await freshTestApi.updateQrCode(id, { status: nextStatus });
      const list = await freshTestApi.getQrCodes();
      setQrCodes(list);
      if (qrCode?.id === id) {
        setQrCode({ ...qrCode, status: nextStatus });
      }
      refreshAnalytics();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleSelectActiveQr = (qr: QrCodeData) => {
    setQrCode(qr);
    renderQrImages(qr.destinationUrl);
  };

  const handleCopyQrLink = async () => {
    if (!qrCode) return;
    try {
      await navigator.clipboard.writeText(qrCode.destinationUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (err) {
      console.error('Copy link failed:', err);
    }
  };

  const [downloadingHdPng, setDownloadingHdPng] = useState(false);
  const [downloadingSvg, setDownloadingSvg] = useState(false);

  const handleDownloadPng = async (customUrl?: string, customLabel?: string) => {
    const url = customUrl || qrCode?.destinationUrl;
    if (!url) return;
    try {
      setDownloadingHdPng(true);
      const name = (business?.businessName || 'review-qr').toLowerCase().replace(/\s+/g, '-');
      const label = customLabel ? `-${customLabel.toLowerCase().replace(/\s+/g, '-')}` : '';
      await downloadUltraHdPng(url, `${name}${label}-3000x3000-hd.png`);
    } catch (err) {
      console.error('Download HD PNG failed:', err);
    } finally {
      setDownloadingHdPng(false);
    }
  };

  const handleDownloadSvg = async (customUrl?: string, customLabel?: string) => {
    const url = customUrl || qrCode?.destinationUrl;
    if (!url) return;
    try {
      setDownloadingSvg(true);
      const name = (business?.businessName || 'review-qr').toLowerCase().replace(/\s+/g, '-');
      const label = customLabel ? `-${customLabel.toLowerCase().replace(/\s+/g, '-')}` : '';
      await downloadVectorSvg(url, `${name}${label}-vector.svg`);
    } catch (err) {
      console.error('Download SVG failed:', err);
    } finally {
      setDownloadingSvg(false);
    }
  };

  const handleTestScan = () => {
    if (!qrCode) return;
    window.open(qrCode.destinationUrl, '_blank', 'noopener,noreferrer');
  };

  const handleScannerResult = (scannedUrl: string) => {
    setScannerOpen(false);
    if (scannedUrl.startsWith('http')) {
      window.location.href = scannedUrl;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const isSetupComplete = Boolean(business && business.businessName && business.googleReviewUrl);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top Banner & Scanner Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">QR Review Automation</h1>
            {isSetupComplete ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" /> Setup Complete
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                <AlertCircle className="w-3.5 h-3.5" /> Setup Incomplete
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Generate and manage your business&apos;s direct Google Review QR code stand and customer flow.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setScannerOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            <Camera className="w-4 h-4 text-slate-600" />
            <span>Scan QR</span>
          </button>
          <button
            type="button"
            onClick={refreshAnalytics}
            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
            title="Refresh Live Analytics"
          >
            <RefreshCw className={`w-4 h-4 ${loadingAnalytics ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Shop Setup & Wizard Banner */}
      <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900">
                {business?.businessName || 'Your Shop Profile'}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-semibold uppercase">
                {business?.category ? business.category.replace('_', ' ') : 'General'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure category details (Jewellery, Cafes, Garages, Salons, etc.), customer questions & AI tone.
            </p>
          </div>
        </div>
        <Link
          to="/app/onboarding"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-blue-700 border border-blue-200 text-xs font-bold rounded-xl shadow-xs shrink-0"
        >
          <span>Open Shop Wizard</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Main Grid: Business Setup + QR Generator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* A. Business Setup (5 Cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
              A. Business Setup
            </h2>
          </div>

          {businessSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{businessSuccess}</span>
            </div>
          )}

          {businessError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{businessError}</span>
            </div>
          )}

          <form onSubmit={handleSaveBusiness} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Business Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={businessName}
                onChange={e => setBusinessName(e.target.value)}
                placeholder="e.g. Atharva Electricals"
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Official Google Review URL <span className="text-rose-500">*</span>
              </label>
              <input
                type="url"
                required
                value={googleReviewUrl}
                onChange={e => setGoogleReviewUrl(e.target.value)}
                placeholder="https://g.page/r/your-id/review or https://search.google.com/local/writereview..."
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Must be an official HTTPS Google review destination. Customers will open this link directly.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Business Location (Optional)
              </label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="e.g. Chakan, Pune, Maharashtra"
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Logo URL (Optional)
              </label>
              <input
                type="url"
                value={logoUrl}
                onChange={e => setLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={savingBusiness}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {savingBusiness ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving Settings...</span>
                </>
              ) : (
                <span>Save Business Setup</span>
              )}
            </button>
          </form>
        </div>

        {/* B. QR Code Generator (7 Cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-blue-600" />
              <h2 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
                B. QR Code Generator
              </h2>
            </div>
            {qrCode && (
              <span className="text-[11px] font-mono px-2 py-0.5 bg-slate-100 rounded text-slate-600">
                Code: {qrCode.uniqueCode}
              </span>
            )}
          </div>

          {qrError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{qrError}</span>
            </div>
          )}

          {!qrCode ? (
            <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl space-y-4">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <QrCode className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-slate-900">No QR Code Generated Yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Click the button below to generate a permanent ReviewFlow QR stand for your business.
                </p>
              </div>
              <button
                type="button"
                onClick={handleGenerateQr}
                disabled={generatingQr || !isSetupComplete}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                {generatingQr ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Review QR Code</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {/* QR Preview & Details */}
              <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                {qrPngUrl ? (
                  <div className="w-40 h-40 bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs shrink-0 flex items-center justify-center">
                    <img src={qrPngUrl} alt="Review QR Code" className="w-full h-full object-contain" />
                  </div>
                ) : (
                  <div className="w-40 h-40 bg-slate-200 animate-pulse rounded-xl" />
                )}

                <div className="space-y-3 flex-1 text-center sm:text-left">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Permanent Redirect URL
                    </span>
                    <p className="font-mono text-xs text-blue-600 break-all select-all font-medium mt-0.5">
                      {qrCode.destinationUrl}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                    <button
                      type="button"
                      onClick={handleCopyQrLink}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer shadow-xs"
                    >
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleTestScan}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer shadow-xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                      <span>Test Scan</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleGenerateQr}
                      disabled={generatingQr}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                      title="Regenerate QR Code with latest business settings"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${generatingQr ? 'animate-spin' : ''}`} />
                      <span>{generatingQr ? 'Regenerating...' : 'Generate Again'}</span>
                    </button>
                  </div>

                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1 text-left">
                    <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Permanent Dynamic QR • Zero Expiry</span>
                    </div>
                    <p className="text-[11px] text-emerald-700 leading-relaxed">
                      Physical QR encodes permanent ReviewFlow route (<span className="font-mono">{qrCode.destinationUrl}</span>). If you change your Google link later, this QR keeps working automatically without reprinting.
                    </p>
                  </div>
                </div>
              </div>

              {/* Download & Print Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleDownloadPng()}
                  disabled={downloadingHdPng}
                  className="inline-flex flex-col items-center justify-center p-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-50"
                  title="Export 3000x3000px Ultra HD PNG for printing and NFC cards"
                >
                  <div className="inline-flex items-center gap-1.5">
                    <Download className="w-3.5 h-3.5 text-blue-400" />
                    <span>{downloadingHdPng ? 'Rendering 3000px...' : '3000×3000 HD PNG'}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-normal mt-0.5">Print-Ready • 300 DPI</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadSvg()}
                  disabled={downloadingSvg}
                  className="inline-flex flex-col items-center justify-center p-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-50"
                  title="Export lossless vector SVG for infinite resolution"
                >
                  <div className="inline-flex items-center gap-1.5">
                    <Download className="w-3.5 h-3.5 text-blue-200" />
                    <span>{downloadingSvg ? 'Exporting SVG...' : 'Vector SVG'}</span>
                  </div>
                  <span className="text-[10px] text-blue-200 font-normal mt-0.5">Lossless Vector Print</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowPrintModal(true)}
                  className="inline-flex flex-col items-center justify-center p-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl transition-all cursor-pointer"
                >
                  <div className="inline-flex items-center gap-1.5">
                    <Printer className="w-3.5 h-3.5 text-slate-600" />
                    <span>Print Stand PDF</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-normal mt-0.5">Table Tent & Standee</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Primary NFC Card & Stand System */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base text-slate-900">Primary NFC Review Card & Dynamic Stand QR</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                1 Active NFC Card (Unlimited)
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Your physical NFC card tap and counter stand QR both route to this permanent dynamic link. If you update your business details or Google URL, this link continues to work without reprogramming.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
              ReviewFlow Unlimited • NFC Included
            </span>
          </div>
        </div>

        {/* QR Stands Grid / Table */}
        {qrCodes.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <QrCode className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs font-semibold text-slate-700">No QR stands generated yet.</p>
            <p className="text-[11px] text-slate-400">Complete your business setup and generate your first QR code above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Placement Label</th>
                  <th className="py-3 px-4 font-semibold">Unique Code</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Created Date</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {qrCodes.map(q => {
                  const isSelected = qrCode?.id === q.id;
                  return (
                    <tr key={q.id} className={isSelected ? 'bg-blue-50/40' : 'hover:bg-slate-50/50'}>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{q.label}</span>
                          {isSelected && (
                            <span className="text-[10px] px-1.5 py-0.2 bg-blue-100 text-blue-700 rounded-md font-semibold">
                              Previewing
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">{q.destinationUrl}</span>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-600">{q.uniqueCode}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            q.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {q.status === 'ACTIVE' ? <CheckCircle2 className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                          <span>{q.status}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(q.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleSelectActiveQr(q)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs cursor-pointer"
                            title="Preview this QR stand"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadPng(q.destinationUrl, q.label)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs cursor-pointer flex items-center gap-0.5"
                            title="Download 3000x3000px Ultra HD PNG"
                          >
                            <Download className="w-3.5 h-3.5 text-slate-700" />
                            <span className="text-[10px] font-bold">3K</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadSvg(q.destinationUrl, q.label)}
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs cursor-pointer flex items-center gap-0.5"
                            title="Download lossless vector SVG"
                          >
                            <Download className="w-3.5 h-3.5 text-blue-600" />
                            <span className="text-[10px] font-bold">SVG</span>
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              await navigator.clipboard.writeText(q.destinationUrl);
                              alert('Copied URL for ' + q.label);
                            }}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs cursor-pointer"
                            title="Copy link"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleQrStatus(q.id, q.status)}
                            className={`p-1.5 rounded-lg text-xs cursor-pointer ${
                              q.status === 'ACTIVE'
                                ? 'bg-amber-50 hover:bg-amber-100 text-amber-700'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                            }`}
                            title={q.status === 'ACTIVE' ? 'Pause QR' : 'Reactivate QR'}
                          >
                            {q.status === 'ACTIVE' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* NEW QR STAND MODAL */}
      {showNewQrModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div>
              <h3 className="font-bold text-base text-slate-900">Add New QR Stand</h3>
              <p className="text-xs text-slate-500">
                Choose a placement point for this QR code. Scans will be tracked separately under this label.
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Placement Location
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {['Billing Counter', 'Shop Entrance', 'Table Stand', 'Delivery Packaging', 'Service Desk', 'Other'].map(loc => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => {
                      setNewQrPlacement(loc);
                    }}
                    className={`p-2.5 rounded-xl border text-left font-semibold transition-all cursor-pointer ${
                      newQrPlacement === loc
                        ? 'bg-blue-50 border-blue-400 text-blue-700'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {loc}
                  </button>
                ))}
              </div>

              {newQrPlacement === 'Other' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Custom Label</label>
                  <input
                    type="text"
                    value={customPlacement}
                    onChange={e => setCustomPlacement(e.target.value)}
                    placeholder="e.g. VIP Lounge or Counter 2"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNewQrModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={creatingQr}
                onClick={() => {
                  const label = newQrPlacement === 'Other' ? (customPlacement.trim() || 'Custom Stand') : newQrPlacement;
                  handleCreateNewQr(label);
                }}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50 shadow-xs"
              >
                {creatingQr ? 'Generating...' : 'Create Stand'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Business Owner Dashboard & Scan Analytics */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="font-bold text-base text-slate-900">QR Scan Analytics</h2>
            <p className="text-xs text-slate-500">
              Live statistics based on actual customer QR scans and review assistance events.
            </p>
          </div>
          <span className="text-[11px] px-2.5 py-1 bg-emerald-50 text-emerald-700 font-semibold rounded-full border border-emerald-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Firestore Data
          </span>
        </div>

        {/* 5 Core Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Total Scans
            </span>
            <div className="text-2xl font-bold text-slate-900">
              {analytics?.totalScans ?? 0}
            </div>
            <span className="text-[10px] text-slate-400">Lifetime scan events</span>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Scans Today
            </span>
            <div className="text-2xl font-bold text-blue-600">
              {analytics?.scansToday ?? 0}
            </div>
            <span className="text-[10px] text-slate-400">Since midnight</span>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              This Week
            </span>
            <div className="text-2xl font-bold text-slate-900">
              {analytics?.scansThisWeek ?? 0}
            </div>
            <span className="text-[10px] text-slate-400">Trailing 7 days</span>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              This Month
            </span>
            <div className="text-2xl font-bold text-slate-900">
              {analytics?.scansThisMonth ?? 0}
            </div>
            <span className="text-[10px] text-slate-400">Monthly total</span>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Active QR Codes
            </span>
            <div className="text-2xl font-bold text-emerald-600">
              {analytics?.activeQrCodes ?? (qrCode ? 1 : 0)}
            </div>
            <span className="text-[10px] text-slate-400">
              {qrCode ? `Created ${new Date(qrCode.createdAt).toLocaleDateString()}` : 'None'}
            </span>
          </div>
        </div>

        {/* Event Separation Metrics Bar */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-600" />
              Event Accuracy & Funnel Separation
            </span>
            <span className="text-[11px] text-slate-400">
              * Scan counts are not published reviews
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 text-xs">
            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-400 block font-medium">1. QR Scans</span>
              <span className="font-bold text-slate-900 text-sm">{analytics?.eventsBreakdown.qrScans ?? 0}</span>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-400 block font-medium">2. Flow Opened</span>
              <span className="font-bold text-slate-900 text-sm">{analytics?.eventsBreakdown.assistancePageViews ?? 0}</span>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-400 block font-medium">3. AI Drafts Made</span>
              <span className="font-bold text-blue-600 text-sm">{analytics?.eventsBreakdown.aiDraftsGenerated ?? 0}</span>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-400 block font-medium">4. Draft Copied</span>
              <span className="font-bold text-emerald-600 text-sm">{analytics?.eventsBreakdown.reviewsCopied ?? 0}</span>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-400 block font-medium">5. Google Clicked</span>
              <span className="font-bold text-purple-600 text-sm">{analytics?.eventsBreakdown.googleReviewClicks ?? 0}</span>
            </div>
          </div>
        </div>

        {/* Date-based Scan Chart: Render ONLY when real data exists; else show honest empty state */}
        <div className="space-y-3">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
            Scan Activity Over Time
          </h3>

          {analytics?.chartData && analytics.chartData.length > 0 ? (
            <div className="h-64 w-full bg-slate-50 border border-slate-200 rounded-xl p-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.chartData}>
                  <defs>
                    <linearGradient id="scansGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="date" tickLine={false} stroke="#94a3b8" fontSize={11} />
                  <YAxis tickLine={false} stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="scans"
                    stroke="#2563eb"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#scansGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center mx-auto">
                <Clock className="w-5 h-5" />
              </div>
              <p className="font-semibold text-xs text-slate-700">
                No scans yet. Download your QR code and test it to see activity here.
              </p>
              <p className="text-[11px] text-slate-400">
                Charts and time series will dynamically appear as real customers scan your stand.
              </p>
            </div>
          )}
        </div>

        {/* Recent Scan Activity */}
        <div className="space-y-3">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
            Recent Activity Feed
          </h3>
          {analytics?.recentActivity && analytics.recentActivity.length > 0 ? (
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Activity</th>
                    <th className="py-2.5 px-4 font-semibold">Type</th>
                    <th className="py-2.5 px-4 font-semibold">Source</th>
                    <th className="py-2.5 px-4 font-semibold">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {analytics.recentActivity.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-4 font-semibold text-slate-900">{item.label}</td>
                      <td className="py-2.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          {item.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-600">{item.source || 'Direct QR Scan'}</td>
                      <td className="py-2.5 px-4 text-slate-500">
                        {new Date(item.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-4 text-center border border-slate-100 rounded-xl text-xs text-slate-400">
              No recent scan events recorded.
            </div>
          )}
        </div>
      </div>

      {/* Print-Friendly Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-center">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Print Table Stand</h3>
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                Close
              </button>
            </div>

            <div className="p-6 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block">
                  Leave Us A Review
                </span>
                <h4 className="font-bold text-base text-slate-900">
                  {business?.businessName || 'Our Business'}
                </h4>
              </div>

              {qrPngUrl && (
                <img
                  src={qrPngUrl}
                  alt="Review Stand QR"
                  className="w-48 h-48 mx-auto bg-white p-2 border border-slate-200 rounded-xl shadow-xs"
                />
              )}

              <div className="flex items-center justify-center gap-1 text-amber-500">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>

              <p className="text-[11px] text-slate-500">
                Scan with any phone camera to leave a quick Google review.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="flex-1 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Stand</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Scanner Modal */}
      <CameraQrScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanResult={handleScannerResult}
      />
    </div>
  );
};
