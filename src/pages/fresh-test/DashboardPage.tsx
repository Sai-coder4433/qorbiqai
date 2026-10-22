import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import {
  QrCode,
  Sparkles,
  ExternalLink,
  Copy,
  BarChart3,
  Building2,
  RefreshCw,
  Printer,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Info,
  Plus,
  Clock,
  Zap
} from 'lucide-react';
import {
  freshTestApi,
  AnalyticsData,
  QrCodeData,
  CreditsOverview,
  SubscriptionData,
  BusinessData
} from '../../lib/fresh-test-api.ts';
import { useBusiness } from '../../lib/business-context.tsx';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { businessId: routeBusinessId } = useParams<{ businessId?: string }>();
  const {
    businesses,
    activeBusiness,
    activeSubscription,
    activeCredits,
    activeTopics,
    selectBusiness,
    switching
  } = useBusiness();

  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [primaryQr, setPrimaryQr] = useState<QrCodeData | null>(null);
  const [bannerMessage, setBannerMessage] = useState<string | null>(
    (location.state as any)?.infoMessage || null
  );
  const [successBanner, setSuccessBanner] = useState<string | null>(
    (location.state as any)?.successMessage || null
  );

  // Resolve which business to display - route param or active context
  const displayBusiness = activeBusiness;

  useEffect(() => {
    if (routeBusinessId && activeBusiness && routeBusinessId !== activeBusiness.id) {
      selectBusiness(routeBusinessId);
    }
  }, [routeBusinessId]);

  useEffect(() => {
    if (!switching && activeBusiness) {
      loadDashboardData(activeBusiness.id);
    } else if (!switching && !activeBusiness && businesses.length === 0) {
      // No businesses - send to pricing
      navigate('/app/pricing', { replace: true });
    }
  }, [activeBusiness?.id, switching]);

  const loadDashboardData = async (bizId: string) => {
    try {
      setLoading(true);

      // Validate onboarding is COMPLETED before showing dashboard
      const biz = await freshTestApi.getBusiness(bizId).catch(() => null);
      if (!biz || (biz.onboardingStatus !== 'COMPLETED' && !biz.onboardingCompleted)) {
        navigate(`/app/onboarding/${bizId}`, { replace: true });
        return;
      }

      const [an, qrs] = await Promise.all([
        freshTestApi.getAnalytics(30).catch(() => null),
        freshTestApi.getQrCodes().catch(() => [])
      ]);

      setAnalytics(an);
      const bizQrs = qrs.filter((q: any) => q.businessId === bizId || !q.businessId);
      if (bizQrs.length > 0) {
        setPrimaryQr(bizQrs[0]);
      } else {
        setPrimaryQr(null);
      }
    } catch (err: any) {
      console.error('[Dashboard] Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBusiness = () => {
    // Direct to pricing page - actual purchase happens there with Razorpay
    navigate('/app/pricing');
  };

  const handleSwitchToBusiness = async (bizId: string) => {
    await selectBusiness(bizId);
    navigate(`/app/dashboard/${bizId}`);
  };

  if (switching || (loading && !analytics)) {
    return (
      <div className="py-24 text-center space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
        <p className="text-sm text-slate-500">
          {switching ? 'Switching business...' : 'Loading business dashboard...'}
        </p>
      </div>
    );
  }

  if (!displayBusiness) {
    return (
      <div className="py-24 text-center space-y-4">
        <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
        <p className="text-sm text-slate-500">No business loaded. Please select a business from the sidebar.</p>
        <button
          type="button"
          onClick={() => navigate('/app/pricing')}
          className="px-5 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl cursor-pointer"
        >
          Add Your First Business
        </button>
      </div>
    );
  }

  const eventsBreakdown = analytics?.eventsBreakdown || {
    qrScans: 0,
    aiDraftsGenerated: 0,
    reviewsCopied: 0,
    googleReviewClicks: 0,
    assistancePageViews: 0
  };

  const expiryDate = activeSubscription?.currentPeriodEnd
    ? new Date(activeSubscription.currentPeriodEnd).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    : 'Active';

  const subscriptionStatus = (activeSubscription?.status || 'ACTIVE').toUpperCase();
  const isSubscriptionActive = subscriptionStatus === 'ACTIVE' || subscriptionStatus === 'TRIALING';

  return (
    <div className="space-y-6 pb-12 font-sans max-w-6xl mx-auto">
      {/* Banners */}
      {bannerMessage && (
        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{bannerMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setBannerMessage(null)}
            className="text-blue-500 hover:text-blue-700 font-bold p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}
      {successBanner && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessBanner(null)}
            className="text-emerald-500 hover:text-emerald-700 font-bold p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Business Welcome Bar */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100">
              Plan: ReviewFlow Unlimited
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md border ${
              isSubscriptionActive
                ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
                : 'text-rose-700 bg-rose-50 border-rose-100'
            }`}>
              {subscriptionStatus}
            </span>
            <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md">
              Renewal: {expiryDate}
            </span>
            {displayBusiness.googleReviewUrl ? (
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-100 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Google Review Ready</span>
              </span>
            ) : (
              <Link
                to={`/app/onboarding/${displayBusiness.id}`}
                className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-100 flex items-center gap-1 hover:underline"
              >
                <AlertCircle className="w-3 h-3" />
                <span>Configure Google Review Link</span>
              </Link>
            )}
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {displayBusiness.businessName}
          </h1>
          <p className="text-xs text-slate-500 max-w-xl">
            {displayBusiness.category?.replace(/_/g, ' ')} · {displayBusiness.city}, {displayBusiness.state}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/app/qr"
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>NFC & QR Stand</span>
          </Link>
          {primaryQr && (
            <a
              href={`/r/${primaryQr.uniqueCode}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-medium text-xs rounded-xl transition-colors flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Customer Flow</span>
            </a>
          )}
        </div>
      </div>

      {/* Subscription Expired Alert */}
      {!isSubscriptionActive && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-semibold">
              Subscription for <strong>{displayBusiness.businessName}</strong> is {subscriptionStatus}.
              Review generation is paused until renewed.
            </span>
          </div>
          <Link
            to="/app/billing"
            className="px-3 py-1.5 bg-rose-600 text-white font-bold rounded-xl ml-3 hover:bg-rose-700 transition-colors cursor-pointer whitespace-nowrap"
          >
            Renew Now
          </Link>
        </div>
      )}

      {/* Core Stats Grid */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Business & Hardware Status — {displayBusiness.businessName}
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">NFC Card</span>
            <div className="text-xl font-bold text-emerald-600 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
              <span>Active</span>
            </div>
            <span className="text-[10px] text-slate-400 truncate block">1 Primary Card</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">QR Stand</span>
            <div className="text-xl font-bold text-blue-600">Active</div>
            <span className="text-[10px] text-slate-400 truncate block">
              {primaryQr ? `Code: ${primaryQr.uniqueCode}` : 'Stand Ready'}
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">NFC / QR Scans</span>
            <div className="text-2xl font-black text-slate-900">{eventsBreakdown.qrScans}</div>
            <span className="text-[10px] text-emerald-600 font-medium">+{analytics?.scansToday || 0} today</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Generated</span>
            <div className="text-2xl font-black text-amber-500">{eventsBreakdown.aiDraftsGenerated}</div>
            <span className="text-[10px] text-slate-400">Customer drafts</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Regenerations</span>
            <div className="text-2xl font-black text-indigo-600">
              {(analytics?.eventsBreakdown as any)?.reviewsRegenerated || 0}
            </div>
            <span className="text-[10px] text-slate-400">Fresh wordings</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">AI Assistance</span>
            <div className="text-xl font-black text-emerald-600 flex items-center gap-1">
              <Zap className="w-4 h-4 fill-emerald-500 text-emerald-500" />
              <span>Unlimited</span>
            </div>
            <Link to="/app/billing" className="text-[10px] text-blue-600 hover:underline block font-medium">
              Plan: Active →
            </Link>
          </div>
        </div>
      </section>

      {/* Customer Conversion Funnel */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Customer Conversion Funnel — {displayBusiness.businessName}
          </h2>
          <span className="text-[11px] text-slate-400">Last 30 Days</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Customer Views</span>
            <div className="text-xl font-bold text-slate-900">{eventsBreakdown.assistancePageViews}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">AI Drafts</span>
            <div className="text-xl font-bold text-slate-900">{eventsBreakdown.aiDraftsGenerated}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Reviews Copied</span>
            <div className="text-xl font-bold text-slate-900">{eventsBreakdown.reviewsCopied}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-[10px] font-bold text-emerald-600 uppercase">Google Link Clicks</span>
            <div className="text-xl font-bold text-emerald-700">{eventsBreakdown.googleReviewClicks}</div>
          </div>
        </div>
      </section>

      {/* Experience Topics for this Business */}
      {activeTopics.length > 0 && (
        <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">
              Active Customer Experience Topics — {displayBusiness.businessName}
            </h2>
            <span className="text-xs text-slate-400">{activeTopics.length} topics configured</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeTopics.map(t => (
              <span key={t.id} className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-xs font-semibold">
                {t.title}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Primary QR Stand Card */}
      {primaryQr && (
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Primary QR Stand — {displayBusiness.businessName}</span>
            <h3 className="text-xl font-bold text-slate-900">{primaryQr.label || 'Counter Stand'}</h3>
            <p className="text-xs text-slate-600 max-w-md leading-relaxed">
              Place this stand at your billing counter. Customers scan to draft feedback in seconds. If your Google Review URL changes, only update this system — the physical stand never needs reprinting.
            </p>
            <div className="flex items-center gap-3 pt-2 justify-center md:justify-start text-xs font-mono text-slate-500">
              <span>Code: {primaryQr.uniqueCode}</span>
              <span>•</span>
              <span className="text-emerald-600 font-bold">{primaryQr.scanCount || 0} scans recorded</span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/app/qr"
              className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Download & Print Stand</span>
            </Link>
          </div>
        </section>
      )}

      {/* Recent Activity Stream */}
      <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            Recent Customer Activity — {displayBusiness.businessName}
          </h2>
          <span className="text-xs text-slate-400">Real-time updates</span>
        </div>

        {analytics?.recentActivity && analytics.recentActivity.length > 0 ? (
          <div className="divide-y divide-slate-100 text-xs">
            {analytics.recentActivity.slice(0, 8).map((act: any) => (
              <div key={act.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-50 text-slate-700 flex items-center justify-center font-bold">
                    {act.eventType === 'AI_DRAFT_GENERATED'
                      ? <Sparkles className="w-4 h-4 text-amber-500" />
                      : act.eventType === 'GOOGLE_REVIEW_CLICKED'
                      ? <ExternalLink className="w-4 h-4 text-emerald-500" />
                      : <Copy className="w-4 h-4 text-blue-500" />}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">
                      {act.eventType === 'AI_DRAFT_GENERATED'
                        ? 'Customer Generated AI Review Draft'
                        : act.eventType === 'GOOGLE_REVIEW_CLICKED'
                        ? 'Customer Clicked Open Google Review'
                        : act.eventType === 'REVIEW_COPIED'
                        ? 'Customer Copied Review Draft'
                        : 'Customer Opened Review Assistant'}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">Stand: {act.uniqueCode || primaryQr?.uniqueCode}</span>
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-400">
            No customer activity recorded yet for {displayBusiness.businessName}. Scans from your NFC card and QR stand will appear here.
          </div>
        )}
      </section>

      {/* All Businesses Section */}
      {businesses.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              All Business Workspaces
            </h2>
            <button
              type="button"
              onClick={handleAddBusiness}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors"
            >
              <Plus className="w-3 h-3" />
              <span>Add New Business</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {businesses.map(biz => {
              const isCurrentlyActive = biz.id === displayBusiness.id;
              const isCompleted = biz.onboardingStatus === 'COMPLETED' || biz.onboardingCompleted;
              const sub = biz.subscription;
              const subStatus = (sub?.status || 'ACTIVE').toUpperCase();
              return (
                <div
                  key={biz.id}
                  className={`bg-white rounded-2xl border p-4 shadow-xs space-y-3 transition-all ${
                    isCurrentlyActive ? 'border-blue-300 ring-1 ring-blue-200' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm shrink-0">
                        {(biz.businessName || 'B')[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-slate-900 truncate">
                          {biz.businessName || 'Unnamed Business'}
                        </div>
                        <div className="text-[11px] text-slate-500 capitalize">
                          {biz.category?.replace(/_/g, ' ') || 'General'}
                          {biz.city ? ` · ${biz.city}` : ''}
                        </div>
                      </div>
                    </div>
                    {isCurrentlyActive && (
                      <span className="text-[9px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 shrink-0">
                        Viewing
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      isCompleted
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {isCompleted ? '✓ Setup Complete' : '⚠ Setup Needed'}
                    </span>
                    {sub && (
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        subStatus === 'ACTIVE' || subStatus === 'TRIALING'
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        ReviewFlow Unlimited
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {!isCurrentlyActive && isCompleted && (
                      <button
                        type="button"
                        onClick={() => handleSwitchToBusiness(biz.id)}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                      >
                        Switch to this →
                      </button>
                    )}
                    {!isCompleted && (
                      <Link
                        to={`/app/onboarding/${biz.id}`}
                        className="text-xs font-semibold text-amber-600 hover:text-amber-800 transition-colors"
                      >
                        Complete Setup →
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Add New Business Tile */}
            <button
              type="button"
              onClick={handleAddBusiness}
              className="bg-white rounded-2xl border border-dashed border-slate-300 p-4 shadow-xs flex flex-col items-center justify-center gap-2 hover:bg-slate-50 hover:border-blue-400 transition-all min-h-[120px] cursor-pointer"
            >
              <Plus className="w-6 h-6 text-slate-400" />
              <div className="text-center">
                <div className="text-xs font-semibold text-slate-700">Add New Business</div>
                <div className="text-[10px] text-slate-400 mt-0.5">New subscription required</div>
              </div>
            </button>
          </div>
        </section>
      )}
    </div>
  );
};
