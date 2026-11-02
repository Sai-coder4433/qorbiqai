import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  QrCode,
  LayoutDashboard,
  Store,
  Sparkles,
  Globe,
  Radio,
  BarChart3,
  CreditCard,
  Receipt,
  ShieldCheck,
  Settings,
  LifeBuoy,
  LogOut,
  User,
  Bell,
  ChevronDown,
  Plus,
  Menu,
  X,
  ExternalLink,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../lib/auth-context.tsx';
import { useBusiness } from '../../lib/business-context.tsx';

interface OwnerAppLayoutProps {
  children: React.ReactNode;
}

export const OwnerAppLayout: React.FC<OwnerAppLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams<{ shopId?: string; businessId?: string }>();
  const currentRouteShopId = params.shopId || params.businessId;

  const { user, logout } = useAuth();
  const {
    businesses,
    activeBusiness,
    selectBusiness,
    refreshBusinesses,
    switching
  } = useBusiness();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [shopSwitcherOpen, setShopSwitcherOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Sync route shopId with active business
  useEffect(() => {
    if (currentRouteShopId && (!activeBusiness || activeBusiness.id !== currentRouteShopId)) {
      const match = businesses.find(b => b.id === currentRouteShopId);
      if (match) {
        selectBusiness(currentRouteShopId);
      }
    }
  }, [currentRouteShopId, activeBusiness, businesses, selectBusiness]);

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) {
        setShopSwitcherOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectShop = async (shopId: string) => {
    setShopSwitcherOpen(false);
    await selectBusiness(shopId);
    navigate(`/app/shops/${shopId}/dashboard`);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Determine effective active shop ID
  const effectiveShopId = currentRouteShopId || activeBusiness?.id || (businesses[0]?.id || '');
  const cleanPath = (location.pathname.replace(/\/+$/, '') || '/').toLowerCase();

  // Part 2 EXACT 12 Navigation Items
  const sidebarItems = [
    {
      label: 'Overview',
      path: '/app',
      icon: LayoutDashboard,
      active: cleanPath === '/app'
    },
    {
      label: 'My Shops',
      path: '/app/shops',
      icon: Store,
      active: cleanPath === '/app/shops' || cleanPath === '/app/businesses' || cleanPath === '/app/shops/create'
    },
    {
      label: 'AI Review Generator',
      path: effectiveShopId ? `/app/shops/${effectiveShopId}/ai-reviews` : '/app/ai-generator',
      icon: Sparkles,
      active: cleanPath.includes('/ai-reviews') || cleanPath === '/app/ai-generator'
    },
    {
      label: 'Review Page',
      path: effectiveShopId ? `/app/shops/${effectiveShopId}/review-page` : '/app/review-page',
      icon: Globe,
      active: cleanPath.includes('/review-page')
    },
    {
      label: 'QR Management',
      path: effectiveShopId ? `/app/shops/${effectiveShopId}/qr` : '/app/qr',
      icon: QrCode,
      active: cleanPath.includes('/qr')
    },
    {
      label: 'NFC Management',
      path: effectiveShopId ? `/app/shops/${effectiveShopId}/nfc` : '/app/nfc',
      icon: Radio,
      active: cleanPath.includes('/nfc')
    },
    {
      label: 'Analytics',
      path: effectiveShopId ? `/app/shops/${effectiveShopId}/analytics` : '/app/analytics',
      icon: BarChart3,
      active: cleanPath.includes('/analytics') || cleanPath === '/app/activity'
    },
    {
      label: 'Billing & Payments',
      path: '/app/billing',
      icon: CreditCard,
      active: cleanPath === '/app/billing' || cleanPath.startsWith('/app/billing/')
    },
    {
      label: 'Invoices',
      path: '/app/invoices',
      icon: Receipt,
      active: cleanPath === '/app/invoices' || cleanPath.includes('/invoices')
    },
    {
      label: 'Plan & Validity',
      path: '/app/pricing',
      icon: ShieldCheck,
      active: cleanPath === '/app/pricing' || cleanPath === '/pricing'
    },
    {
      label: 'Settings',
      path: effectiveShopId ? `/app/shops/${effectiveShopId}/settings` : '/app/settings',
      icon: Settings,
      active: cleanPath.includes('/settings')
    },
    {
      label: 'Help & Support',
      path: '/app/support',
      icon: LifeBuoy,
      active: cleanPath === '/app/support'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* ============================================================= */}
      {/* 1. MASTER HEADER (Strict Requirement Part 2) */}
      {/* Qorbiq AI logo | Owner Name | Notifications | Profile | Logout */}
      {/* ============================================================= */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          {/* Logo & Mobile Menu Trigger */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link to="/app" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold shadow-xs group-hover:scale-105 transition-transform">
                <QrCode className="w-5 h-5" />
              </div>
              <div className="leading-none">
                <span className="font-extrabold text-base tracking-tight text-slate-900 block">
                  Qorbiq AI
                </span>
                <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">
                  Owner Portal
                </span>
              </div>
            </Link>

            {/* Active Shop Selector Dropdown */}
            <div className="relative ml-4 hidden sm:block" ref={switcherRef}>
              <button
                type="button"
                onClick={() => setShopSwitcherOpen(!shopSwitcherOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-xs font-bold text-slate-800 transition-colors cursor-pointer"
              >
                <Store className="w-3.5 h-3.5 text-blue-600" />
                <span className="max-w-[140px] truncate">
                  {activeBusiness ? activeBusiness.businessName : (businesses[0]?.businessName || 'Select Shop')}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${shopSwitcherOpen ? 'rotate-180' : ''}`} />
              </button>

              {shopSwitcherOpen && (
                <div className="absolute left-0 mt-2 w-64 bg-white rounded-2xl border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Switch Shop Workspace
                  </div>
                  <div className="max-h-56 overflow-y-auto divide-y divide-slate-100">
                    {businesses.map(b => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => handleSelectShop(b.id)}
                        className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-slate-50 cursor-pointer ${
                          (activeBusiness?.id === b.id || currentRouteShopId === b.id) ? 'bg-blue-50/60 font-bold text-blue-700' : 'text-slate-700'
                        }`}
                      >
                        <span className="truncate">{b.businessName}</span>
                        {((b as any).paymentStatus === 'paid' || (b as any).paymentStatus === 'PAID') ? (
                          <span className="w-2 h-2 rounded-full bg-emerald-500" title="Paid" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-amber-400" title="Unpaid" />
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="pt-2 px-2 border-t border-slate-100 mt-1">
                    <Link
                      to="/app/shops/create"
                      onClick={() => setShopSwitcherOpen(false)}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create New Shop</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Header Navigation: Owner greeting, Notifications, Profile, Logout */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Owner Greeting */}
            <div className="hidden md:block text-right pr-2 border-r border-slate-200">
              <div className="text-xs font-bold text-slate-900">
                Welcome, {user?.displayName || 'Store Owner'}
              </div>
              <div className="text-[11px] text-slate-400 font-mono truncate max-w-[180px]">
                {user?.email}
              </div>
            </div>

            {/* Notification Center */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors relative cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="w-2 h-2 rounded-full bg-blue-600 absolute top-2 right-2 ring-2 ring-white" />
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-slate-200 shadow-xl p-4 z-50 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-slate-900">Notification Center</span>
                    <span className="text-[10px] text-blue-600 font-semibold">2 New</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-100">
                      <div className="font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Dynamic Stands Active</span>
                      </div>
                      <p className="text-[11px] text-emerald-700 mt-0.5">
                        Your permanent QR &amp; NFC stand links are routing live customer feedback.
                      </p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-blue-50 text-blue-900 border border-blue-100">
                      <div className="font-bold flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                        <span>Cashfree Payment Protection</span>
                      </div>
                      <p className="text-[11px] text-blue-700 mt-0.5">
                        All plans are strictly one-time payments with zero automatic renewals.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Menu */}
            <Link
              to="/app/profile"
              className={`p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors ${
                cleanPath === '/app/profile' ? 'bg-blue-50 text-blue-600' : ''
              }`}
              title="Owner Profile & Security"
            >
              <User className="w-4 h-4" />
            </Link>

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

      {/* ============================================================= */}
      {/* 2. BODY LAYOUT: SIDEBAR + MAIN CONTENT */}
      {/* ============================================================= */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6">
        {/* Desktop Sidebar (Exact 12 Menu Items from Part 2) */}
        <aside className="hidden lg:block w-64 shrink-0 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-3 shadow-xs space-y-1">
            <div className="px-3 pt-2 pb-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
              Navigation Menu
            </div>
            {sidebarItems.map(item => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                    item.active
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${item.active ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Quick Stand Link Card */}
          {activeBusiness && (
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-4 shadow-sm space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[11px] text-blue-400 uppercase tracking-wider">Active Stand</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <div className="font-bold truncate">{activeBusiness.businessName}</div>
              <div className="text-[11px] text-slate-400 font-mono truncate">
                code: {activeBusiness.uniqueQrCode || `code_${activeBusiness.id.replace('biz_', '').substring(0, 8)}`}
              </div>
              <a
                href={`https://qorbiqai.com/r/${activeBusiness.uniqueQrCode || `code_${activeBusiness.id.replace('biz_', '').substring(0, 8)}`}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-blue-300 hover:text-white font-bold text-[11px] pt-1"
              >
                <span>Test Public Review Page</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setMobileMenuOpen(false)} />
            <div className="relative w-72 max-w-[80%] bg-white h-full shadow-2xl p-5 flex flex-col justify-between overflow-y-auto">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-blue-600" />
                    <span>Qorbiq AI Menu</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1">
                  {sidebarItems.map(item => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.label}
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold ${
                          item.active ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-rose-50 text-rose-600 font-bold text-xs"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Routed View */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
};

