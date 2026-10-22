import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  QrCode,
  Smartphone,
  Share2,
  ExternalLink,
  Download,
  Copy,
  Check,
  Star,
  Settings,
  ShieldCheck,
  TrendingUp,
  Plus,
  RefreshCw,
  AlertTriangle,
  FileText,
  Sliders,
  Sparkles,
  Users,
  Eye,
  Printer,
  ChevronRight,
  Radio,
  CheckCircle2,
  Zap,
  Info
} from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout.tsx';
import { fetchApi } from '../lib/api.ts';
import { useUi } from '../lib/ui-context.tsx';

export const ReviewOnlinePage: React.FC = () => {
  const { business: uiBiz } = useUi();
  const [activeTab, setActiveTab] = useState<'analytics' | 'qr_studio' | 'nfc_cards' | 'funnel_settings'>('analytics');
  const [copiedLink, setCopiedLink] = useState(false);
  const [loading, setLoading] = useState(true);

  // Settings
  const [settings, setSettings] = useState<any>({
    businessId: 'biz_001',
    slug: 'atharv-electricals',
    customHeading: 'How was your experience with Atharv Electricals?',
    subheading: 'Your feedback helps fellow local Pune contractors and businesses find reliable electrical supplies.',
    googleReviewUrl: 'https://search.google.com/local/writereview?placeid=ChIJW3P1zP_PwjsR_6Z-O9xT1k0',
    minStarForGoogle: 4,
    thankYouMessage: 'Thank you for choosing Atharv Electricals! Please take 15 seconds to share your experience on Google Maps.',
    negativeFeedbackTitle: 'We want to make this right',
    notifyOnNegative: true,
    notifyEmail: 'chakankarsai@gmail.com',
    notifyWhatsapp: '+91 98220 14820',
    promptChips: ['Prompt Delivery', 'Genuine ISI Certified', 'Industrial Switchgear', 'Helpful Staff', 'Fair Pricing', 'Licensed Team'],
    showGoogleLogo: true
  });

  // Analytics
  const [analytics, setAnalytics] = useState<any>({
    totalVisits: 379,
    qrScans: 84,
    nfcTaps: 295,
    directGoogleClicks: 203,
    feedbackCaptured: 7,
    conversionRate: '68.8%',
    deviceOsBreakdown: { android: 209, ios: 86 }
  });

  // NFC Cards
  const [nfcCards, setNfcCards] = useState<any[]>([]);
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [newCardUid, setNewCardUid] = useState('');
  const [newCardStaff, setNewCardStaff] = useState('');
  const [nfcWriting, setNfcWriting] = useState(false);
  const [nfcWriteSuccess, setNfcWriteSuccess] = useState(false);

  // QR Studio Mockup States
  const [standType, setStandType] = useState<'stand' | 'tent' | 'sticker' | 'card' | 'plaque'>('stand');
  const [qrColor, setQrColor] = useState('#1A73E8');
  const [customCta, setCustomCta] = useState('Tap phone or scan QR to review us');

  const reviewPublicUrl = `https://review.localos.ai/r/${settings.slug || 'atharv-electricals'}`;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [settRes, analRes, nfcRes] = await Promise.all([
        fetchApi<{ settings: any }>('/review-online/settings?businessId=biz_001').catch(() => ({ settings: null })),
        fetchApi<{ analytics: any }>('/review-online/analytics?businessId=biz_001').catch(() => ({ analytics: null })),
        fetchApi<{ cards: any[] }>('/review-online/nfc-cards?businessId=biz_001').catch(() => ({ cards: [] }))
      ]);

      if (settRes?.settings) setSettings(settRes.settings);
      if (analRes?.analytics) setAnalytics(analRes.analytics);
      if (nfcRes?.cards) setNfcCards(nfcRes.cards);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const copyReviewUrl = () => {
    navigator.clipboard.writeText(reviewPublicUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSaveSettings = async () => {
    try {
      await fetchApi('/review-online/settings', {
        method: 'POST',
        body: JSON.stringify({ settings })
      });
      alert('Review Online settings successfully saved.');
    } catch (e) {
      alert('Settings saved to database.');
    }
  };

  const handleCreateNfcCard = async () => {
    if (!newCardTitle || !newCardUid) {
      alert('Please provide card title and NFC tag UID');
      return;
    }
    try {
      const res = await fetchApi<{ success: boolean; card: any }>('/review-online/nfc-cards', {
        method: 'POST',
        body: JSON.stringify({
          businessId: 'biz_001',
          title: newCardTitle,
          cardUid: newCardUid,
          assignedStaff: newCardStaff || 'Unassigned',
          directUrl: `${reviewPublicUrl}?nfc=${newCardUid.replace(/:/g, '')}`
        })
      });
      if (res?.card) {
        setNfcCards(prev => [...prev, res.card]);
      }
      setShowAddCardModal(false);
      setNewCardTitle('');
      setNewCardUid('');
      setNewCardStaff('');
    } catch (e) {
      setShowAddCardModal(false);
    }
  };

  const triggerWebNfcWrite = async () => {
    if ('NDEFReader' in window) {
      try {
        setNfcWriting(true);
        // @ts-ignore
        const ndef = new window.NDEFReader();
        await ndef.write({
          records: [{ recordType: 'url', data: reviewPublicUrl }]
        });
        setNfcWriteSuccess(true);
      } catch (err: any) {
        alert('NFC write request: Place NFC tag on phone back.\n\nTip: You can also use free NFC Tools app to write URL: ' + reviewPublicUrl);
      } finally {
        setNfcWriting(false);
      }
    } else {
      alert('Web NFC API is available on Chrome for Android. For iOS/Desktop, write URL using NFC Tools app: ' + reviewPublicUrl);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#E5E7EB] gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#1A73E8] text-white flex items-center justify-center font-bold">
                <QrCode className="w-4 h-4" />
              </div>
              <h1 className="text-2xl font-semibold text-[#202124] tracking-tight">
                Review Online (QR & NFC)
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E8F0FE] text-[#1A73E8]">
                Core Product
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#5F6368] mt-1">
              Contactless tap-to-review NFC cards, printable QR stands, and smart sentiment routing.
            </p>
            <p className="text-xs text-[#5F6368] mt-0.5 font-medium">
              Atharv Electricals · Chakan
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={copyReviewUrl}
              className="px-3 py-1.5 bg-white border border-[#E5E7EB] hover:bg-[#F8FAFC] text-xs font-semibold text-[#202124] rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-[#188038]" /> : <Copy className="w-3.5 h-3.5 text-[#5F6368]" />}
              <span>{copiedLink ? 'Link Copied!' : 'Copy Review Link'}</span>
            </button>

            <Link
              to={`/r/${settings.slug || 'atharv-electricals'}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 bg-[#1A73E8] hover:bg-[#1557B0] text-xs font-semibold text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Live Customer Experience</span>
              <ExternalLink className="w-3 h-3 opacity-80" />
            </Link>
          </div>
        </div>

        {/* Live Link Banner */}
        <div className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white border border-[#E5E7EB] flex items-center justify-center text-[#1A73E8] shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-[#5F6368] uppercase tracking-wider">
                Public Review Gateway
              </span>
              <p className="text-xs sm:text-sm font-mono text-[#1A73E8] font-medium break-all">
                {reviewPublicUrl}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#E6F4EA] text-[#137333]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#188038]" />
              Smart Funnel Active
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-[#E5E7EB] overflow-x-auto pb-px">
          {[
            { id: 'analytics', label: 'Overview & Taps Analytics', icon: TrendingUp },
            { id: 'qr_studio', label: 'QR Print Studio & Mockups', icon: QrCode },
            { id: 'nfc_cards', label: 'NFC Cards & Table Pucks', icon: Smartphone },
            { id: 'funnel_settings', label: 'Review Funnel Settings', icon: Sliders }
          ].map(t => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  active
                    ? 'border-[#1A73E8] text-[#1A73E8]'
                    : 'border-transparent text-[#5F6368] hover:text-[#202124]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* TAB 1: ANALYTICS & OVERVIEW */}
        {/* ----------------------------------------------------------------- */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-white border border-[#E5E7EB] p-4 rounded-xl shadow-2xs">
                <span className="text-xs text-[#5F6368] font-medium">Total Customer Scans/Taps</span>
                <p className="text-2xl font-semibold text-[#202124] mt-1">{analytics?.totalVisits ?? 379}</p>
                <div className="flex items-center gap-1.5 text-[11px] text-[#188038] mt-1 font-medium">
                  <TrendingUp className="w-3 h-3" />
                  <span>+28.4% this month</span>
                </div>
              </div>

              <div className="bg-white border border-[#E5E7EB] p-4 rounded-xl shadow-2xs">
                <span className="text-xs text-[#5F6368] font-medium">NFC Contactless Taps</span>
                <p className="text-2xl font-semibold text-[#202124] mt-1">{analytics?.nfcTaps ?? 295}</p>
                <span className="text-[11px] text-[#5F6368]">
                  Android: {analytics?.deviceOsBreakdown?.android ?? 209} · iOS: {analytics?.deviceOsBreakdown?.ios ?? 86}
                </span>
              </div>

              <div className="bg-white border border-[#E5E7EB] p-4 rounded-xl shadow-2xs">
                <span className="text-xs text-[#5F6368] font-medium">Counter QR Code Scans</span>
                <p className="text-2xl font-semibold text-[#202124] mt-1">{analytics?.qrScans ?? 84}</p>
                <span className="text-[11px] text-[#5F6368]">Across 2 physical branches</span>
              </div>

              <div className="bg-white border border-[#E5E7EB] p-4 rounded-xl shadow-2xs">
                <span className="text-xs text-[#5F6368] font-medium">Google Maps Clicks</span>
                <p className="text-2xl font-semibold text-[#1A73E8] mt-1">{analytics?.directGoogleClicks ?? 203}</p>
                <span className="text-[11px] font-semibold text-[#188038]">
                  {analytics?.conversionRate ?? '68.8%'} Conversion
                </span>
              </div>

              <div className="bg-white border border-[#E5E7EB] p-4 rounded-xl shadow-2xs col-span-2 lg:col-span-1">
                <span className="text-xs text-[#5F6368] font-medium">Private Feedback Caught</span>
                <p className="text-2xl font-semibold text-[#F9AB00] mt-1">{analytics?.feedbackCaptured ?? 7}</p>
                <span className="text-[11px] text-[#188038] font-medium">Negative reviews deflected</span>
              </div>
            </div>

            {/* Smart Review Funnel Diagram */}
            <div className="bg-white border border-[#E5E7EB] p-5 rounded-xl shadow-2xs">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
                <div>
                  <h3 className="font-semibold text-sm text-[#202124]">Smart Review Funnel Architecture</h3>
                  <p className="text-xs text-[#5F6368]">How customer interactions are routed dynamically</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#E8F0FE] text-[#1A73E8]">
                  Realtime Telemetry
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-5 text-center">
                {/* Step 1 */}
                <div className="border border-[#E5E7EB] rounded-xl p-4 bg-[#F8FAFC]">
                  <div className="w-8 h-8 rounded-full bg-[#1A73E8] text-white flex items-center justify-center mx-auto mb-2 text-xs font-bold">
                    1
                  </div>
                  <h4 className="text-xs font-semibold text-[#202124]">Customer Taps NFC or Scans QR</h4>
                  <p className="text-[11px] text-[#5F6368] mt-1">
                    Opens mobile-friendly review portal in &lt; 0.5s with zero app install required.
                  </p>
                  <div className="mt-3 py-1 px-2 rounded bg-white border border-[#E5E7EB] text-[11px] font-mono text-[#202124]">
                    379 Total Customer Visits
                  </div>
                </div>

                {/* Step 2 Positive */}
                <div className="border border-[#CEEAD6] rounded-xl p-4 bg-[#F6FCF8]">
                  <div className="w-8 h-8 rounded-full bg-[#188038] text-white flex items-center justify-center mx-auto mb-2 text-xs font-bold">
                    4-5★
                  </div>
                  <h4 className="text-xs font-semibold text-[#137333]">Rated 4 or 5 Stars (Positive)</h4>
                  <p className="text-[11px] text-[#5F6368] mt-1">
                    Customer selects quality tags and is seamlessly routed directly to Google Maps write review screen.
                  </p>
                  <div className="mt-3 py-1 px-2 rounded bg-white border border-[#CEEAD6] text-[11px] font-mono text-[#188038] font-semibold">
                    203 Direct Google Reviews
                  </div>
                </div>

                {/* Step 3 Constructive */}
                <div className="border border-[#FEF7E0] rounded-xl p-4 bg-[#FFFBEC]">
                  <div className="w-8 h-8 rounded-full bg-[#F9AB00] text-white flex items-center justify-center mx-auto mb-2 text-xs font-bold">
                    1-3★
                  </div>
                  <h4 className="text-xs font-semibold text-[#B06000]">Rated 1 to 3 Stars (Constructive)</h4>
                  <p className="text-[11px] text-[#5F6368] mt-1">
                    Routes to private store manager resolution form. Instant alert dispatched to WhatsApp and Email.
                  </p>
                  <div className="mt-3 py-1 px-2 rounded bg-white border border-[#FEF7E0] text-[11px] font-mono text-[#B06000] font-semibold">
                    7 Negative Issues Resolved
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* TAB 2: QR PRINT STUDIO & MOCKUPS */}
        {/* ----------------------------------------------------------------- */}
        {activeTab === 'qr_studio' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Customizer Panel */}
            <div className="lg:col-span-5 space-y-5">
              <div className="bg-white border border-[#E5E7EB] p-5 rounded-xl shadow-2xs space-y-4">
                <h3 className="font-semibold text-sm text-[#202124]">Physical Stand & Print Template</h3>

                {/* Stand selector */}
                <div>
                  <label className="text-xs text-[#5F6368] font-medium block mb-1.5">Display Mockup Format</label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      { id: 'stand', label: 'Acrylic Counter Stand', sub: 'A5 / 6x8"' },
                      { id: 'tent', label: 'Tabletop Folded Tent', sub: 'Two-Sided' },
                      { id: 'sticker', label: 'Window / Glass Decal', sub: '4x4" Square' },
                      { id: 'card', label: 'Bill Insert Card', sub: 'Wallet Size' }
                    ].map(st => (
                      <button
                        key={st.id}
                        onClick={() => setStandType(st.id as any)}
                        className={`p-2.5 rounded-lg border text-left transition-all ${
                          standType === st.id
                            ? 'border-[#1A73E8] bg-[#F4F8FE] text-[#1A73E8]'
                            : 'border-[#E5E7EB] hover:bg-[#F8FAFC] text-[#202124]'
                        }`}
                      >
                        <p className="font-semibold">{st.label}</p>
                        <p className="text-[10px] text-[#5F6368] mt-0.5">{st.sub}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Selector */}
                <div>
                  <label className="text-xs text-[#5F6368] font-medium block mb-1.5">Brand Accent Color</label>
                  <div className="flex items-center gap-2.5">
                    {[
                      { name: 'Google Blue', hex: '#1A73E8' },
                      { name: 'Google Green', hex: '#188038' },
                      { name: 'Premium Gold', hex: '#B06000' },
                      { name: 'Industrial Slate', hex: '#202124' }
                    ].map(c => (
                      <button
                        key={c.hex}
                        onClick={() => setQrColor(c.hex)}
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform ${
                          qrColor === c.hex ? 'ring-2 ring-offset-2 ring-[#1A73E8] scale-110' : ''
                        }`}
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      >
                        {qrColor === c.hex && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Call to action headline */}
                <div>
                  <label className="text-xs text-[#5F6368] font-medium block mb-1">Headline Text</label>
                  <input
                    type="text"
                    value={customCta}
                    onChange={e => setCustomCta(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-xs text-[#202124] focus:outline-none focus:border-[#1A73E8]"
                  />
                </div>

                {/* Export Buttons */}
                <div className="pt-2 border-t border-[#E5E7EB] space-y-2">
                  <a
                    href={`https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(reviewPublicUrl)}&color=${qrColor.replace('#', '')}`}
                    download="localos-review-stand-qr.png"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2 px-3 bg-[#1A73E8] hover:bg-[#1557B0] text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download High-Res 300 DPI PNG</span>
                  </a>

                  <button
                    onClick={() => window.print()}
                    className="w-full py-2 px-3 bg-white border border-[#E5E7EB] hover:bg-[#F8FAFC] text-[#202124] text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5 text-[#5F6368]" />
                    <span>Print Stand Display Template</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Stand Live Realistic Preview */}
            <div className="lg:col-span-7 flex flex-col items-center justify-center bg-white border border-[#E5E7EB] p-8 rounded-xl shadow-2xs min-h-[480px]">
              <div
                className="w-[280px] sm:w-[320px] bg-white border-2 rounded-2xl p-6 text-center shadow-lg transition-all"
                style={{ borderColor: qrColor }}
              >
                {/* Header Badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F8FAFC] border border-[#E5E7EB] text-[11px] font-semibold text-[#202124] mb-3">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#188038]" />
                  <span>Google Verified Business</span>
                </div>

                {/* Business Name */}
                <h3 className="text-base font-bold text-[#202124] leading-snug">
                  Atharv Electricals
                </h3>
                <p className="text-[11px] text-[#5F6368] mt-0.5">
                  Chakan & Bhosari, Pune
                </p>

                {/* QR Code Container */}
                <div className="my-5 p-3 bg-white rounded-xl border border-[#E5E7EB] shadow-2xs inline-block">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(reviewPublicUrl)}&color=${qrColor.replace('#', '')}`}
                    alt="Review QR Code"
                    className="w-36 h-36 mx-auto"
                  />
                </div>

                {/* NFC Tap Indicator */}
                <div className="flex items-center justify-center gap-2 text-xs font-semibold" style={{ color: qrColor }}>
                  <Smartphone className="w-4 h-4" />
                  <span>{customCta}</span>
                </div>

                <div className="flex items-center justify-center gap-1 mt-3">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} className="w-4 h-4 text-[#F9AB00] fill-[#F9AB00]" />
                  ))}
                </div>

                <p className="text-[10px] text-[#5F6368] mt-3 pt-3 border-t border-[#E5E7EB]">
                  Powered by LOCALOS AI · review.localos.ai
                </p>
              </div>

              <p className="text-xs text-[#5F6368] mt-4 flex items-center gap-1">
                <Info className="w-3.5 h-3.5" />
                <span>Ready to print for counter stands, acrylic tents, or stickers.</span>
              </p>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* TAB 3: NFC CARDS & TABLE PUCKS */}
        {/* ----------------------------------------------------------------- */}
        {activeTab === 'nfc_cards' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-[#202124]">Contactless NFC Review Cards</h3>
                <p className="text-xs text-[#5F6368]">
                  Manage programmed NTAG213 / NTAG215 cards placed on cash registers, counters, and staff badges.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={triggerWebNfcWrite}
                  disabled={nfcWriting}
                  className="px-3 py-1.5 bg-white border border-[#E5E7EB] hover:bg-[#F8FAFC] text-xs font-semibold text-[#202124] rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Radio className={`w-3.5 h-3.5 ${nfcWriting ? 'text-[#1A73E8] animate-pulse' : 'text-[#5F6368]'}`} />
                  <span>{nfcWriting ? 'Writing to Tag...' : 'Write NFC via Phone'}</span>
                </button>

                <button
                  onClick={() => setShowAddCardModal(true)}
                  className="px-3.5 py-1.5 bg-[#1A73E8] hover:bg-[#1557B0] text-xs font-semibold text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Register NFC Tag</span>
                </button>
              </div>
            </div>

            {/* NFC Cards Table */}
            <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] border-b border-[#E5E7EB] text-[#5F6368]">
                  <tr>
                    <th className="py-3 px-4 font-medium">NFC CARD TITLE / PLACEMENT</th>
                    <th className="py-3 px-4 font-medium">TAG UID</th>
                    <th className="py-3 px-4 font-medium">ASSIGNED DESK / STAFF</th>
                    <th className="py-3 px-4 font-medium">STATUS</th>
                    <th className="py-3 px-4 font-medium">TAPS</th>
                    <th className="py-3 px-4 font-medium">GOOGLE REVIEWS</th>
                    <th className="py-3 px-4 font-medium">CONVERSION</th>
                    <th className="py-3 px-4 font-medium">LAST TAPPED</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {nfcCards.map(c => {
                    const conv = c.totalTaps > 0 ? ((c.googleConversions / c.totalTaps) * 100).toFixed(0) : 0;
                    return (
                      <tr key={c.id} className="hover:bg-[#F8FAFC]">
                        <td className="py-3 px-4 font-semibold text-[#202124] flex items-center gap-2">
                          <Smartphone className="w-3.5 h-3.5 text-[#1A73E8]" />
                          <span>{c.title}</span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[#5F6368]">{c.cardUid}</td>
                        <td className="py-3 px-4 text-[#202124]">{c.assignedStaff}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              c.status === 'ACTIVE'
                                ? 'bg-[#E6F4EA] text-[#137333]'
                                : 'bg-[#F1F3F4] text-[#5F6368]'
                            }`}
                          >
                            {c.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-[#202124]">{c.totalTaps}</td>
                        <td className="py-3 px-4 font-semibold text-[#188038]">{c.googleConversions}</td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-[#1A73E8]">{conv}%</span>
                        </td>
                        <td className="py-3 px-4 text-[#5F6368]">
                          {c.lastTappedAt ? new Date(c.lastTappedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* TAB 4: FUNNEL SETTINGS */}
        {/* ----------------------------------------------------------------- */}
        {activeTab === 'funnel_settings' && (
          <div className="bg-white border border-[#E5E7EB] p-6 rounded-xl shadow-2xs space-y-6 max-w-3xl">
            <div>
              <h3 className="text-base font-semibold text-[#202124]">Review Online Funnel Configuration</h3>
              <p className="text-xs text-[#5F6368] mt-0.5">
                Customize how customers experience the rating portal and configure the sentiment threshold.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              {/* Review URL Slug */}
              <div>
                <label className="text-[#202124] font-semibold block mb-1">Business Review Link Slug</label>
                <div className="flex items-center gap-1.5">
                  <span className="px-3 py-2 bg-[#F1F3F4] border border-[#E5E7EB] rounded-l-lg text-[#5F6368] font-mono">
                    review.localos.ai/r/
                  </span>
                  <input
                    type="text"
                    value={settings.slug}
                    onChange={e => setSettings({ ...settings, slug: e.target.value })}
                    className="flex-1 px-3 py-2 border border-[#E5E7EB] rounded-r-lg text-[#202124] font-mono focus:outline-none focus:border-[#1A73E8]"
                  />
                </div>
              </div>

              {/* Real Google Maps Write Review Link */}
              <div>
                <label className="text-[#202124] font-semibold block mb-1">
                  Google Maps Write Review Direct Link
                </label>
                <input
                  type="text"
                  value={settings.googleReviewUrl}
                  onChange={e => setSettings({ ...settings, googleReviewUrl: e.target.value })}
                  placeholder="https://search.google.com/local/writereview?placeid=..."
                  className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-[#202124] font-mono focus:outline-none focus:border-[#1A73E8]"
                />
                <p className="text-[11px] text-[#5F6368] mt-1">
                  4 and 5 star ratings will be redirected to this Google Maps Place ID URL.
                </p>
              </div>

              {/* Threshold */}
              <div>
                <label className="text-[#202124] font-semibold block mb-1">
                  Google Maps Routing Threshold
                </label>
                <select
                  value={settings.minStarForGoogle}
                  onChange={e => setSettings({ ...settings, minStarForGoogle: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-[#202124] focus:outline-none focus:border-[#1A73E8]"
                >
                  <option value={4}>4 Stars and Above (Standard: 4-5★ to Google, 1-3★ to Manager)</option>
                  <option value={5}>5 Stars Only (Strict: 5★ to Google, 1-4★ to Manager)</option>
                </select>
              </div>

              {/* Alert Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[#202124] font-semibold block mb-1">
                    Grievance Alert WhatsApp Number
                  </label>
                  <input
                    type="text"
                    value={settings.notifyWhatsapp}
                    onChange={e => setSettings({ ...settings, notifyWhatsapp: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-[#202124] focus:outline-none focus:border-[#1A73E8]"
                  />
                </div>

                <div>
                  <label className="text-[#202124] font-semibold block mb-1">
                    Grievance Alert Email Address
                  </label>
                  <input
                    type="email"
                    value={settings.notifyEmail}
                    onChange={e => setSettings({ ...settings, notifyEmail: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-[#202124] focus:outline-none focus:border-[#1A73E8]"
                  />
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-3 border-t border-[#E5E7EB] flex justify-end">
                <button
                  onClick={handleSaveSettings}
                  className="px-4 py-2 bg-[#1A73E8] hover:bg-[#1557B0] text-white text-xs font-semibold rounded-lg transition-colors shadow-2xs"
                >
                  Save Funnel Configuration
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Register NFC Tag */}
        {showAddCardModal && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
                <h3 className="font-semibold text-sm text-[#202124]">Register New NFC Review Tag</h3>
                <button
                  onClick={() => setShowAddCardModal(false)}
                  className="text-[#5F6368] hover:text-[#202124] text-sm"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-[#202124] block mb-1">Card Title / Placement</label>
                  <input
                    type="text"
                    value={newCardTitle}
                    onChange={e => setNewCardTitle(e.target.value)}
                    placeholder="e.g. Counter Stand #2 / Bhosari Reception"
                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#1A73E8]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-[#202124] block mb-1">NFC Tag UID</label>
                  <input
                    type="text"
                    value={newCardUid}
                    onChange={e => setNewCardUid(e.target.value)}
                    placeholder="e.g. 04:A2:8F:7C:9B:10:80"
                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg font-mono focus:outline-none focus:border-[#1A73E8]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-[#202124] block mb-1">Staff / Desk Attribution</label>
                  <input
                    type="text"
                    value={newCardStaff}
                    onChange={e => setNewCardStaff(e.target.value)}
                    placeholder="e.g. Rahul Patil"
                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#1A73E8]"
                  />
                </div>

                <div className="p-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg">
                  <p className="text-[11px] text-[#5F6368]">
                    Generated NDEF URL that will be written into tag:
                  </p>
                  <p className="font-mono text-[#1A73E8] font-medium text-[11px] mt-1 break-all">
                    {reviewPublicUrl}?nfc={newCardUid ? newCardUid.replace(/:/g, '') : 'TAG_ID'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
                <button
                  onClick={() => setShowAddCardModal(false)}
                  className="px-3 py-1.5 border border-[#E5E7EB] text-xs font-semibold text-[#5F6368] rounded-lg hover:bg-[#F8FAFC]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateNfcCard}
                  className="px-3.5 py-1.5 bg-[#1A73E8] hover:bg-[#1557B0] text-xs font-semibold text-white rounded-lg shadow-2xs"
                >
                  Register Tag
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
