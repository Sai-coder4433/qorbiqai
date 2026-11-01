import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  QrCode,
  LayoutDashboard,
  Building2,
  BarChart3,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  Sparkles,
  ChevronDown,
  Plus,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Check,
  AlertCircle,
  ExternalLink,
  Package,
  Radio,
  Globe,
  Activity,
  LifeBuoy,
  Store
} from 'lucide-react';
import { useAuth } from '../../lib/auth-context.tsx';
import { useBusiness } from '../../lib/business-context.tsx';
export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const {
    businesses,
    activeBusiness,
    activeSubscription,
    selectBusiness,
    refreshBusinesses,
    switching
  } = useBusiness();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) {
        setSwitcherOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSwitchBusiness = async (businessId: string) => {
    if (switching) return;
    setSwitcherOpen(false);
    await selectBusiness(businessId);
    navigate(`/app/dashboard/${businessId}`);
  };

  const handleStartPurchaseFlow = () => {
    setSwitcherOpen(false);
    navigate('/app/pricing');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    {
      label: 'My Shops (Owner Hub)',
      path: '/app/shops',
      icon: Store,
      active: location.pathname === '/app/shops' || location.pathname === '/app' || location.pathname === '/app/businesses'
    },
    {
      label: 'Dashboard Overview',
      path: activeBusiness ? `/app/dashboard/${activeBusiness.id}` : '/app/dashboard',
      icon: LayoutDashboard,
      active: location.pathname.includes('/app/dashboard')
    },
    {
      label: 'AI Review Generator',
      path: '/app/ai-generator',
      icon: Sparkles,
      active: location.pathname === '/app/ai-generator'
    },
    {
      label: 'Public Review Page',
      path: '/app/review-page',
      icon: Globe,
      active: location.pathname === '/app/review-page'
    },
    {
      label: 'QR Code Stand',
      path: '/app/qr',
      icon: QrCode,
      active: location.pathname === '/app/qr' || location.pathname === '/app/qr-automation'
    },
    {
      label: 'NFC Management',
      path: '/app/nfc',
      icon: Radio,
      active: location.pathname === '/app/nfc'
    },
    {
      label: 'Analytics & Scans',
      path: '/app/analytics',
      icon: BarChart3,
      active: location.pathname === '/app/analytics'
    },
    {
      label: 'Business Profile',
      path: '/app/business',
      icon: Building2,
      active: location.pathname === '/app/business' || location.pathname === '/app/businesses'
    },
    {
      label: 'Customer Activity',
      path: '/app/activity',
      icon: Activity,
      active: location.pathname === '/app/activity'
    },
    {
      label: 'Billing & Plan',
      path: '/app/billing',
      icon: CreditCard,
      active: location.pathname === '/app/billing'
    },
    {
      label: 'Order Standees',
      path: '/app/standees',
      icon: Package,
      active: location.pathname === '/app/standees' || location.pathname === '/app/shop'
    },
    {
      label: 'Help & Support',
      path: '/app/support',
      icon: LifeBuoy,
      active: location.pathname === '/app/support'
    },
    {
      label: 'Account Settings',
      path: '/app/settings',
      icon: Settings,
      active: location.pathname === '/app/settings'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Mobile Top Bar */}
      <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <Link to="/app/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white">
            <QrCode className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm tracking-tight text-slate-900">Qorbiq AI</span>
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Main Sidebar */}
      <aside
        className={`${
          mobileMenuOpen ? 'block' : 'hidden'
        } md:block w-full md:w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 p-5 space-y-5 md:min-h-screen`}
      >
        <div className="space-y-5">
          {/* Logo */}
          <Link to="/app/dashboard" className="hidden md:flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight text-slate-900 block leading-tight">
                Qorbiq AI
              </span>
              <span className="text-[10px] text-blue-600 font-semibold">Smart Review SaaS</span>
            </div>
          </Link>

          {/* Business Selector Popover */}
          <div className="relative" ref={switcherRef}>
            <button
              type="button"
              onClick={() => setSwitcherOpen(prev => !prev)}
              className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1 text-left hover:bg-blue-50 hover:border-blue-200 transition-colors"
            >
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <span>Active Business</span>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 uppercase">
                    Qorbiq Pro
                  </span>
                  <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${switcherOpen ? 'rotate-180' : ''}`} />
                </div>
              </div>
              <div className="font-bold text-xs text-slate-900 truncate">
                {activeBusiness?.businessName || (switching ? 'Switching business...' : 'No Business Selected')}
              </div>
              <div className="text-[11px] text-slate-500 capitalize truncate flex items-center justify-between">
                <span>{activeBusiness?.category ? activeBusiness.category.replace(/_/g, ' ') : 'Select a business'}</span>
                {activeBusiness && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase ${
                    activeBusiness.onboardingStatus === 'COMPLETED'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}>
                    {activeBusiness.onboardingStatus === 'COMPLETED' ? 'ACTIVE' : 'SETUP NEEDED'}
                  </span>
                )}
              </div>
            </button>

            {/* Dropdown Popover */}
            {switcherOpen && (
              <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                <div className="p-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 flex items-center justify-between">
                  <span>Your Businesses</span>
                  <span className="text-slate-400 font-mono text-[9px]">{businesses.length} total</span>
                </div>

                <div className="max-h-60 overflow-y-auto divide-y divide-slate-50">
                  {businesses.length === 0 && (
                    <div className="px-4 py-4 text-xs text-slate-400 text-center">
                      No businesses yet. Add your first business below.
                    </div>
                  )}

                  {businesses.map(biz => {
                    const isCompleted = biz.onboardingStatus === 'COMPLETED';
                    const isSelected = activeBusiness?.id === biz.id;
                    const planLabel = 'UNLIMITED';
                    const subStatus = (biz.subscription?.status || 'ACTIVE').toUpperCase();

                    return (
                      <div
                        key={biz.id}
                        className={`p-3 transition-colors flex items-start justify-between gap-2 ${
                          isSelected ? 'bg-blue-50/60' : 'hover:bg-slate-50'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            if (isCompleted) {
                              handleSwitchBusiness(biz.id);
                            } else {
                              navigate(`/app/onboarding/${biz.id}`);
                            }
                          }}
                          className="flex-1 text-left min-w-0 flex items-start gap-2.5 cursor-pointer"
                        >
                          <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                            {(biz.businessName || 'B')[0].toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-900 truncate">
                                {biz.businessName || 'Unnamed Business'}
                              </span>
                              {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                            </div>
                            <div className="text-[10px] text-slate-500 capitalize truncate">
                              {biz.category ? biz.category.replace(/_/g, ' ') : 'General'} • {planLabel}
                            </div>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                subStatus === 'ACTIVE'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                  : 'bg-rose-50 text-rose-700 border border-rose-100'
                              }`}>
                                {subStatus}
                              </span>
                              {isCompleted ? (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                                  ACTIVE
                                </span>
                              ) : (
                                <span
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSwitcherOpen(false);
                                    navigate(`/app/onboarding/${biz.id}`);
                                  }}
                                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 hover:bg-amber-200 cursor-pointer"
                                  title="Click to resume onboarding"
                                >
                                  Setup Needed
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Add New Business Trigger */}
                <div className="border-t border-slate-100 p-2 bg-slate-50/50 space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSwitcherOpen(false);
                      navigate('/app/shops/create');
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>CREATE NEW SHOP</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSwitcherOpen(false);
                      navigate('/app/shops');
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span>All Shops (Owner Hub)</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
              Business Portal
            </div>
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    item.active
                      ? 'bg-blue-50 text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${item.active ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Info & Logout */}
        <div className="border-t border-slate-100 pt-4 space-y-3">
          <div className="px-3 py-2.5 bg-slate-50 rounded-xl space-y-0.5">
            <div className="font-semibold text-xs text-slate-900 truncate">
              {user?.displayName || 'Business Owner'}
            </div>
            <div className="text-[11px] text-slate-500 truncate font-mono">{user?.email}</div>
            <div className="text-[10px] text-slate-400">
              {businesses.length} Business{businesses.length !== 1 ? 'es' : ''} Linked
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Page Content */}
      <main className="flex-1 p-4 sm:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
};
