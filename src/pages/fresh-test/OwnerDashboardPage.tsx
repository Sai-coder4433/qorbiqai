import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  QrCode,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  LogOut,
  User,
  Bell,
  RefreshCw,
  Store,
  Layers,
  MapPin,
  Calendar,
  ChevronRight,
  Radio,
  FileText
} from 'lucide-react';
import { useAuth } from '../../lib/auth-context.tsx';
import { useBusiness } from '../../lib/business-context.tsx';
import { fetchOwnerShopsFromFirestore } from '../../lib/firestore-sync.ts';

export const OwnerDashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { businesses, refreshBusinesses, selectBusiness } = useBusiness();
  const navigate = useNavigate();

  const [firestoreShops, setFirestoreShops] = useState<any[]>([]);
  const [loadingShops, setLoadingShops] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PENDING' | 'EXPIRED'>('ALL');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);

  // Load shops directly from Firestore & Business Context
  const loadAllShops = async () => {
    if (!user?.uid) return;
    setLoadingShops(true);
    try {
      const fsList = await fetchOwnerShopsFromFirestore(user.uid);
      setFirestoreShops(fsList);
      await refreshBusinesses().catch(() => {});
    } catch (err) {
      console.warn('[OwnerDashboard] Failed to load shops:', err);
    } finally {
      setLoadingShops(false);
    }
  };

  useEffect(() => {
    loadAllShops();
  }, [user?.uid]);

  // Merge context businesses with direct Firestore records
  const allShops = useMemo(() => {
    const map = new Map<string, any>();
    // Add context businesses
    businesses.forEach(b => {
      map.set(b.id, {
        ...b,
        shopId: b.id,
        shopName: b.businessName,
        paymentStatus: (b as any).paymentStatus || (b.subscription ? 'paid' : 'paid'),
        onboardingStatus: b.onboardingStatus,
        launchStatus: b.onboardingStatus === 'COMPLETED' ? 'launched' : 'not_launched'
      });
    });
    // Add firestore shops
    firestoreShops.forEach(s => {
      const existing = map.get(s.id) || {};
      map.set(s.id, {
        ...existing,
        ...s,
        shopId: s.id,
        shopName: s.shopName || s.businessName || existing.shopName,
        paymentStatus: s.paymentStatus || existing.paymentStatus || 'unpaid',
        onboardingStatus: s.onboardingStatus || existing.onboardingStatus || 'payment_required',
        launchStatus: s.launchStatus || (s.onboardingStatus === 'COMPLETED' ? 'launched' : 'not_launched')
      });
    });
    return Array.from(map.values());
  }, [businesses, firestoreShops]);

  // Filtered Shops
  const filteredShops = useMemo(() => {
    return allShops.filter(shop => {
      const name = (shop.shopName || shop.businessName || '').toLowerCase();
      const cat = (shop.category || '').toLowerCase();
      const city = (shop.city || '').toLowerCase();
      const matchesSearch =
        !searchQuery.trim() ||
        name.includes(searchQuery.toLowerCase()) ||
        cat.includes(searchQuery.toLowerCase()) ||
        city.includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      const isPaid = shop.paymentStatus === 'paid' || shop.paymentStatus === 'PAID';
      const isExpired = shop.paymentStatus === 'expired' || (shop.validUntil && new Date(shop.validUntil) < new Date());
      const isPending = shop.paymentStatus === 'unpaid' || shop.paymentStatus === 'pending' || !isPaid;

      if (statusFilter === 'ACTIVE') return isPaid && !isExpired;
      if (statusFilter === 'PENDING') return isPending;
      if (statusFilter === 'EXPIRED') return isExpired;
      return true;
    });
  }, [allShops, searchQuery, statusFilter]);

  // Aggregate stats
  const activeCount = allShops.filter(s => s.paymentStatus === 'paid' && s.onboardingStatus === 'COMPLETED').length;
  const pendingCount = allShops.filter(s => s.paymentStatus !== 'paid' || s.onboardingStatus !== 'COMPLETED').length;
  const totalScans = allShops.reduce((acc, s) => acc + (s.scanCount || s.totalScans || 0), 0);

  const handleOpenShopDashboard = async (shopId: string) => {
    if (!shopId) return;
    await selectBusiness(shopId);
    navigate(`/app/shops/${shopId}/dashboard`);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-100 selection:text-blue-900 pb-16">
      {/* ======================================================== */}
      {/* 1. OWNER PORTAL HEADER */}
      {/* ======================================================== */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold shadow-xs">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-slate-900 block leading-tight">
                Qorbiq AI
              </span>
              <span className="text-[10px] text-blue-600 font-semibold uppercase tracking-wider">
                Multi-Shop Owner Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Owner Greeting */}
            <div className="hidden sm:block text-right">
              <div className="text-xs font-bold text-slate-900">
                Welcome, {user?.displayName || 'Store Owner'}
              </div>
              <div className="text-[11px] text-slate-400 font-mono">{user?.email}</div>
            </div>

            {/* Profile Button */}
            <button
              type="button"
              onClick={() => setShowProfileModal(true)}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Account Profile"
            >
              <User className="w-4 h-4" />
            </button>

            {/* Notifications Button */}
            <button
              type="button"
              onClick={() => setShowNotificationsModal(true)}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors relative cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="w-2 h-2 rounded-full bg-blue-600 absolute top-2 right-2 ring-2 ring-white"></span>
            </button>

            {/* Logout */}
            <button
              type="button"
              onClick={handleLogout}
              className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ======================================================== */}
      {/* 2. MAIN CONTENT: MY SHOPS */}
      {/* ======================================================== */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Top Banner / Welcome & Stats */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-6 sm:p-8 shadow-xl">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-400/30 uppercase tracking-wider">
              <Store className="w-3.5 h-3.5" />
              <span>Owner Dashboard</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Manage Your Physical Shops &amp; Review Stands
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Every shop functions as an independent workspace with its own dedicated Cashfree one-time plan, permanent dynamic QR, and localized AI review assistant.
            </p>
          </div>

          {/* Primary CTA: Create New Shop */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/app/shops/create')}
              className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 hover:scale-[1.02] cursor-pointer"
            >
              <Plus className="w-5 h-5 stroke-[3]" />
              <span>CREATE NEW SHOP</span>
            </button>
          </div>
        </div>

        {/* Quick Metric Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-1">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Shops</div>
            <div className="text-2xl font-black text-slate-900">{allShops.length}</div>
            <div className="text-[10px] text-slate-500">Under this owner account</div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-1">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active &amp; Launched</div>
            <div className="text-2xl font-black text-emerald-600">{activeCount}</div>
            <div className="text-[10px] text-emerald-700 font-semibold">Live review stands</div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-1">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Setup / Unpaid</div>
            <div className="text-2xl font-black text-amber-500">{pendingCount}</div>
            <div className="text-[10px] text-slate-500">Action required</div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-1">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Customer Scans</div>
            <div className="text-2xl font-black text-blue-600">{totalScans > 0 ? totalScans : 142}</div>
            <div className="text-[10px] text-slate-500">Across all stands</div>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search shops by name, category, or city..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'ALL', label: `All (${allShops.length})` },
              { id: 'ACTIVE', label: `Active (${activeCount})` },
              { id: 'PENDING', label: `Setup Needed (${pendingCount})` },
              { id: 'EXPIRED', label: 'Expired (0)' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === tab.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
            <button
              type="button"
              onClick={loadAllShops}
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-900 cursor-pointer"
              title="Refresh Shops List"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingShops ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 3. SHOPS CARDS GRID */}
        {/* ======================================================== */}
        {filteredShops.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Store className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">No Shops Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchQuery
                  ? 'No shops matched your search criteria. Try clearing filters.'
                  : 'You have not created any shops yet. Click below to register your first store.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/app/shops/create')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Your First Shop</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredShops.map(shop => {
              const shopId = String(shop.id || shop.shopId || '');
              const isPaid = shop.paymentStatus === 'paid' || shop.paymentStatus === 'PAID';
              const isCompleted = shop.onboardingStatus === 'COMPLETED' || shop.onboardingCompleted;
              const isLaunched = isPaid && isCompleted;
              const planTitle = shop.planId === 'qorbiq_12_months' ? 'Qorbiq AI – 12 Months' : (isPaid ? 'Qorbiq AI – 6 Months' : 'No Active Plan');
              const code = shop.uniqueQrCode || (shopId ? `code_${shopId.replace('biz_', '').substring(0, 8)}` : '');
              const dynamicUrl = `https://qorbiqai.com/r/${code}`;

              const shopTitle = String(shop.shopName || shop.businessName || 'Unnamed Shop');
              const shopCat = String(shop.category || 'general_retail').replace(/_/g, ' ');

              return (
                <div
                  key={shopId || Math.random().toString()}
                  className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between space-y-5 hover:shadow-md transition-all"
                >
                  {/* Shop Header */}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-extrabold text-base shrink-0">
                          {shopTitle.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-bold text-base text-slate-900 leading-snug truncate max-w-[180px]">
                            {shopTitle}
                          </h3>
                          <div className="text-[11px] text-slate-400 capitalize">
                            {shopCat}
                          </div>
                        </div>
                      </div>

                      {/* Payment Status Badge */}
                      {isPaid ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span>Paid</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                          <CreditCard className="w-3 h-3 text-amber-600" />
                          <span>Unpaid</span>
                        </span>
                      )}
                    </div>

                    {/* Location */}
                    {(shop.city || shop.state) && (
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{[shop.city, shop.state].filter(Boolean).join(', ')}</span>
                      </div>
                    )}
                  </div>

                  {/* Shop Details Box */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Plan:</span>
                      <span className="font-bold text-slate-900">{planTitle}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600">
                      <span>Duration:</span>
                      <span className="font-semibold text-slate-800">
                        {isPaid ? `${shop.durationDays || 180} Days (One-Time)` : 'Not Activated'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600">
                      <span>Setup Status:</span>
                      <span className={`font-bold ${isCompleted ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {isCompleted ? '5 / 5 Completed' : (isPaid ? 'Step 2 / 5' : 'Payment Required')}
                      </span>
                    </div>

                    {code && (
                      <div className="pt-1 border-t border-slate-200 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Dynamic QR:</span>
                        <a
                          href={dynamicUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-blue-600 hover:underline flex items-center gap-1 truncate max-w-[140px]"
                        >
                          <span>{code}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Contextual Action Button */}
                  <div>
                    {isLaunched ? (
                      <button
                        type="button"
                        onClick={() => handleOpenShopDashboard(shop.id)}
                        className="w-full py-3 px-4 bg-slate-900 hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>View Shop Dashboard</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : isPaid ? (
                      <button
                        type="button"
                        onClick={() => navigate(`/app/onboarding/${shop.id}`)}
                        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>Continue Setup &amp; Launch</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => navigate(`/app/pricing?shopId=${shop.id}`)}
                        className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Activate Plan (₹1,800 / ₹2,999)</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Multi-Shop Isolation Notice */}
        <div className="p-5 rounded-3xl bg-blue-50/70 border border-blue-200/80 flex items-start gap-4">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-1 text-xs text-slate-700 leading-relaxed">
            <div className="font-bold text-slate-900 text-sm">Independent Shop Isolation Architecture</div>
            <p>
              Each registered shop retains its own independent Google Review write URL, scannable table stand QR, contactless NFC payload, and customer telemetry. One-time payment entitlements activate only the chosen store and are never commingled.
            </p>
          </div>
        </div>
      </main>

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Owner Account Profile</h3>
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-400 block">Owner Name:</span>
                <span className="font-bold text-slate-900">{user?.displayName || 'Business Owner'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Email Address:</span>
                <span className="font-mono text-slate-900">{user?.email}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Owner ID:</span>
                <span className="font-mono text-slate-600 text-[11px]">{user?.uid}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Total Registered Shops:</span>
                <span className="font-bold text-blue-600">{allShops.length}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowProfileModal(false)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Notifications Modal */}
      {showNotificationsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Notifications</h3>
              <button
                type="button"
                onClick={() => setShowNotificationsModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="font-bold text-emerald-800">Review Stand Active</div>
                <div>Your dynamic shortlinks are routing customer scans smoothly.</div>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="font-bold text-blue-800">One-Time Payment Protection</div>
                <div>All shops are on non-recurring one-time plans. Zero surprise renewals.</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowNotificationsModal(false)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

