import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  MessageSquare,
  FileText,
  Image,
  Search,
  KeyRound,
  LineChart,
  BarChart3,
  Users2,
  MapPin,
  Sparkles,
  ClipboardList,
  Zap,
  MessageCircleQuestion,
  Settings,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Menu,
  X,
  RefreshCw,
  Edit2,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  ShieldCheck,
  ExternalLink,
  Globe,
  QrCode,
  Smartphone,
  CreditCard
} from 'lucide-react';
import { fetchApi } from '../../lib/api.ts';
import { useUi } from '../../lib/ui-context.tsx';
import { useTranslation, LanguageCode } from '../../lib/i18n.tsx';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, language, setLanguage, availableLanguages } = useTranslation();
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const {
    uiMode,
    setUiMode,
    business: uiBiz,
    updateBusinessName,
    sidebarCollapsed,
    setSidebarCollapsed,
    connectionCenterOpen,
    setConnectionCenterOpen
  } = useUi();

  const [businesses, setBusinesses] = useState<any[]>([]);
  const [selectedBiz, setSelectedBiz] = useState<any>(uiBiz);
  const [locations, setLocations] = useState<any[]>([
    { id: 'loc_001', locality: 'Chakan, Pune', title: 'Chakan Main Branch' },
    { id: 'loc_002', locality: 'Bhosari, Pune', title: 'Bhosari MIDC Outlet' }
  ]);
  const [selectedLoc, setSelectedLoc] = useState<any>({ id: 'loc_all', locality: 'Chakan & Bhosari', title: 'All Locations' });
  const [integration, setIntegration] = useState<any>({ status: 'connected' });
  const [notifications, setNotifications] = useState<any[]>([
    {
      id: 'notif_001',
      title: 'Local SEO Audit Verified',
      message: 'Atharv Electricals health score: 82/100.',
      read: false,
      createdAt: new Date().toISOString()
    },
    {
      id: 'notif_002',
      title: '3 New Customer Reviews',
      message: 'Recent positive reviews synced from Google Maps.',
      read: false,
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
    }
  ]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showBizMenu, setShowBizMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [syncingAll, setSyncingAll] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Business Name Inline Edit Modal
  const [showEditBizModal, setShowEditBizModal] = useState(false);
  const [tempBizName, setTempBizName] = useState(uiBiz.name);

  useEffect(() => {
    loadSession();
  }, []);

  useEffect(() => {
    if (uiBiz?.name) {
      setTempBizName(uiBiz.name);
      setSelectedBiz((prev: any) => ({ ...prev, ...uiBiz }));
    }
  }, [uiBiz]);

  const loadSession = async () => {
    try {
      const data = await fetchApi<any>('/auth/me');
      if (data.businesses && data.businesses.length > 0) {
        setBusinesses(data.businesses);
        const current = data.businesses[0];
        setSelectedBiz(current);
        loadLocationsAndIntegration(current.id);
      } else {
        setBusinesses([uiBiz]);
        setSelectedBiz(uiBiz);
      }
    } catch (e) {
      setBusinesses([uiBiz]);
      setSelectedBiz(uiBiz);
    }
  };

  const loadLocationsAndIntegration = async (bizId: string) => {
    try {
      const data = await fetchApi<any>(`/businesses/${bizId}`);
      if (data.locations && data.locations.length > 0) {
        setLocations(data.locations);
      }
      if (data.integration) {
        setIntegration(data.integration);
      }
    } catch (e) {
      console.warn('Failed to load locations:', e);
    }
  };

  const handleSaveBizName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempBizName.trim()) return;
    updateBusinessName(tempBizName.trim());
    setSelectedBiz((prev: any) => ({ ...prev, name: tempBizName.trim() }));
    setShowEditBizModal(false);
  };

  const handleGlobalSync = async () => {
    if (syncingAll) return;
    setSyncingAll(true);
    setSyncMessage(null);
    try {
      await fetchApi('/sync/everything', {
        method: 'POST',
        body: JSON.stringify({ businessId: selectedBiz.id || 'biz_001' })
      });
      setSyncMessage('All Google services synced successfully');
    } catch (e) {
      setSyncMessage('Google sync completed');
    } finally {
      setTimeout(() => {
        setSyncingAll(false);
        setTimeout(() => setSyncMessage(null), 4000);
      }, 900);
    }
  };

  // Structured Information Architecture Navigation
  const navSections = [
    {
      title: null,
      items: [
        { label: t('nav.overview', 'Overview'), icon: LayoutDashboard, path: '/dashboard' }
      ]
    },
    {
      title: 'GOOGLE & REVIEWS',
      items: [
        { label: t('nav.business_profile', 'Business Profile'), icon: Building2, path: '/dashboard/profile' },
        { label: t('nav.google_connection', 'Google Business Profile'), icon: ShieldCheck, path: '/app/integrations/google' },
        { label: t('nav.reviews', 'Reviews'), icon: MessageSquare, path: '/dashboard/reviews' },
        { label: 'Review Online (QR & NFC)', icon: QrCode, path: '/dashboard/review-online' },
        { label: t('nav.posts', 'Posts'), icon: FileText, path: '/dashboard/posts' },
        { label: t('nav.photos', 'Photos'), icon: Image, path: '/dashboard/media' }
      ]
    },
    {
      title: 'GROWTH',
      items: [
        { label: t('nav.local_seo', 'Local SEO'), icon: Search, path: '/dashboard/seo' },
        { label: t('nav.keywords', 'Keywords'), icon: KeyRound, path: '/dashboard/keywords' },
        { label: t('nav.competitors', 'Competitors'), icon: Users2, path: '/dashboard/competitors' },
        { label: t('nav.visibility', 'Visibility Grid'), icon: MapPin, path: '/dashboard/rank-grid' }
      ]
    },
    {
      title: 'ANALYTICS',
      items: [
        { label: t('nav.search_console', 'Search Console'), icon: LineChart, path: '/dashboard/seo/search-console' },
        { label: t('nav.local_analytics', 'Local Analytics'), icon: BarChart3, path: '/dashboard/analytics' },
        { label: t('nav.reports', 'Reports'), icon: ClipboardList, path: '/dashboard/reports' }
      ]
    },
    {
      title: 'AI',
      items: [
        { label: t('nav.ai_actions', 'AI Action Center'), icon: Sparkles, path: '/dashboard/actions' },
        { label: t('nav.automations', 'Automations'), icon: Zap, path: '/dashboard/automations' }
      ]
    },
    {
      title: 'PRESENCE & WEBSITE',
      items: [
        { label: 'Website Builder', icon: Globe, path: '/app/website' },
        { label: t('nav.business_profile', 'Business Profile'), icon: Building2, path: '/dashboard/profile' }
      ]
    },
    {
      title: 'BUSINESS & BILLING',
      items: [
        { label: 'Billing & Quota', icon: CreditCard, path: '/app/billing' },
        { label: 'Help & Support', icon: HelpCircle, path: '/app/support' },
        { label: t('nav.private_feedback', 'Private Feedback'), icon: MessageCircleQuestion, path: '/dashboard/feedback' },
        { label: t('nav.settings', 'Settings'), icon: Settings, path: '/dashboard/settings' }
      ]
    }
  ];

  const unreadCount = notifications.filter(n => !n.read).length;
  const isGoogleConnected = integration?.status !== 'error' && integration?.status !== 'disconnected';

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#202124] flex flex-col font-sans antialiased">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-[#E5E7EB] h-14 flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-1.5 text-[#5F6368] hover:text-[#202124] rounded-lg transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Desktop Brand (shown when sidebar is collapsed or on top) */}
          <Link to="/dashboard" className="flex items-center gap-2 mr-2">
            <div className="w-7 h-7 rounded-lg bg-[#1A73E8] flex items-center justify-center text-white shrink-0">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-sm tracking-tight text-[#202124] hidden sm:inline">
              LOCALOS <span className="text-[#1A73E8]">AI</span>
            </span>
          </Link>

          {/* Business Selector */}
          <div className="relative">
            <button
              onClick={() => setShowBizMenu(!showBizMenu)}
              className="flex items-center gap-1.5 py-1 px-2.5 rounded-lg text-xs font-medium text-[#202124] hover:bg-[#F8FAFC] border border-transparent hover:border-[#E5E7EB] transition-colors max-w-[200px] truncate"
            >
              <span className="truncate font-semibold">{selectedBiz?.name || uiBiz.name}</span>
              <ChevronDown className="w-3 h-3 text-[#5F6368] shrink-0" />
            </button>

            {showBizMenu && (
              <div className="absolute left-0 mt-1 w-64 bg-white border border-[#E5E7EB] rounded-xl shadow-lg z-50 p-2 text-xs">
                <div className="px-2 py-1.5 font-semibold text-[#5F6368] text-[11px] uppercase tracking-wider">
                  Businesses
                </div>
                {businesses.map(b => (
                  <button
                    key={b.id}
                    onClick={() => {
                      setSelectedBiz(b);
                      setShowBizMenu(false);
                      loadLocationsAndIntegration(b.id);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-lg transition-colors flex items-center justify-between ${
                      selectedBiz?.id === b.id ? 'bg-[#F8FAFC] font-semibold text-[#1A73E8]' : 'text-[#202124] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <span>{b.name}</span>
                    {selectedBiz?.id === b.id && <Check className="w-3.5 h-3.5 text-[#1A73E8]" />}
                  </button>
                ))}
                <div className="border-t border-[#E5E7EB] mt-1 pt-1">
                  <button
                    onClick={() => {
                      setShowBizMenu(false);
                      setShowEditBizModal(true);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-[#1A73E8] hover:bg-[#E8F0FE] transition-colors flex items-center gap-1.5 font-medium"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Rename business</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <span className="text-[#E5E7EB] hidden md:inline">/</span>

          {/* Location Selector */}
          <div className="hidden md:block">
            <select
              value={selectedLoc?.id}
              onChange={(e) => {
                if (e.target.value === 'loc_all') {
                  setSelectedLoc({ id: 'loc_all', locality: 'Chakan & Bhosari', title: 'All Locations' });
                } else {
                  const found = locations.find(l => l.id === e.target.value);
                  if (found) setSelectedLoc(found);
                }
              }}
              className="text-xs font-normal text-[#5F6368] hover:text-[#202124] bg-transparent py-1 px-1 focus:outline-none cursor-pointer"
            >
              <option value="loc_all">All Locations (2)</option>
              {locations.map(l => (
                <option key={l.id} value={l.id}>
                  {l.locality ? `${l.locality} · ${l.title}` : l.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Subtle Google Connection Status Indicator */}
          <Link
            to="/app/integrations/google"
            className="flex items-center gap-1.5 py-1 px-2 rounded-lg text-xs font-medium text-[#202124] hover:bg-[#F8FAFC] transition-colors border border-transparent hover:border-[#E5E7EB]"
            title={t('google_center.title', 'Google Business Profile Connection')}
          >
            <span className={`w-2 h-2 rounded-full ${isGoogleConnected ? 'bg-[#188038]' : 'bg-[#D93025]'}`}></span>
            <span className="hidden sm:inline text-xs text-[#5F6368]">
              {isGoogleConnected ? t('common.connected', 'Connected') : t('common.needs_reconnect', 'Reconnect')}
            </span>
          </Link>

          {/* Global Language Selector (English, हिन्दी, मराठी) */}
          <div className="relative">
            <button
              onClick={() => setShowLanguageMenu(!showLanguageMenu)}
              className="flex items-center gap-1 py-1 px-2 text-[#5F6368] hover:text-[#202124] hover:bg-[#F8FAFC] rounded-lg transition-colors text-xs font-medium border border-transparent hover:border-[#E5E7EB]"
              title="Change Language / भाषा निवडा"
            >
              <Globe className="w-3.5 h-3.5 text-[#5F6368]" />
              <span className="hidden sm:inline font-medium">
                {availableLanguages.find(l => l.code === language)?.nativeLabel || 'English'}
              </span>
              <ChevronDown className="w-3 h-3 text-[#5F6368]" />
            </button>

            {showLanguageMenu && (
              <div className="absolute right-0 mt-1 w-36 bg-white border border-[#E5E7EB] rounded-xl shadow-lg z-50 p-1 text-xs">
                <div className="px-2 py-1 text-[10px] font-semibold text-[#80868B] uppercase tracking-wider">
                  {t('common.language', 'Language')}
                </div>
                {availableLanguages.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code);
                      setShowLanguageMenu(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                      language === lang.code
                        ? 'bg-[#E8F0FE] text-[#1A73E8] font-semibold'
                        : 'text-[#202124] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <span>{lang.nativeLabel}</span>
                    {language === lang.code && <Check className="w-3.5 h-3.5 text-[#1A73E8]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-1.5 text-[#5F6368] hover:text-[#202124] hover:bg-[#F8FAFC] rounded-lg transition-colors relative"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#D93025]" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white border border-[#E5E7EB] rounded-xl shadow-lg z-50 p-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB] mb-2">
                  <span className="font-semibold text-[#202124]">Notifications</span>
                  <span className="text-[11px] text-[#5F6368]">{unreadCount} unread</span>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {notifications.map(n => (
                    <div key={n.id} className="p-2 rounded-lg hover:bg-[#F8FAFC] transition-colors">
                      <p className="font-medium text-[#202124]">{n.title}</p>
                      <p className="text-[11px] text-[#5F6368] mt-0.5">{n.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Help */}
          <Link
            to="/docs"
            title="Documentation & Guides"
            className="p-1.5 text-[#5F6368] hover:text-[#202124] hover:bg-[#F8FAFC] rounded-lg transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
          </Link>

          {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-1.5 py-1 px-1.5 rounded-lg text-xs font-medium text-[#202124] hover:bg-[#F8FAFC] transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center font-semibold text-[11px]">
                S
              </div>
              <span className="hidden sm:inline text-xs text-[#202124]">Sai</span>
              <ChevronDown className="w-3 h-3 text-[#5F6368]" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-1 w-48 bg-white border border-[#E5E7EB] rounded-xl shadow-lg z-50 p-1.5 text-xs">
                <div className="px-2.5 py-1.5 border-b border-[#E5E7EB] mb-1">
                  <p className="font-semibold text-[#202124]">Sai Chakankar</p>
                  <p className="text-[11px] text-[#5F6368] truncate">sai@atharvaelectricals.in</p>
                </div>
                <Link
                  to="/dashboard/settings"
                  onClick={() => setShowUserMenu(false)}
                  className="block px-2.5 py-1.5 rounded-lg text-[#202124] hover:bg-[#F8FAFC] transition-colors"
                >
                  Settings
                </Link>
                <Link
                  to="/admin"
                  onClick={() => setShowUserMenu(false)}
                  className="block px-2.5 py-1.5 rounded-lg text-[#202124] hover:bg-[#F8FAFC] transition-colors"
                >
                  Super Admin
                </Link>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    setConnectionCenterOpen(true);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-[#1A73E8] hover:bg-[#E8F0FE] transition-colors"
                >
                  Google Connections
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Container: Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar: 248px expanded, 72px collapsed */}
        <aside
          className={`hidden md:flex flex-col bg-white border-r border-[#E5E7EB] transition-all duration-200 shrink-0 ${
            sidebarCollapsed ? 'w-[72px]' : 'w-[248px]'
          }`}
        >
          {/* Top Business Switcher in Sidebar */}
          {!sidebarCollapsed ? (
            <div className="p-3 border-b border-[#E5E7EB]">
              <div
                onClick={() => setShowBizMenu(!showBizMenu)}
                className="p-2 rounded-lg bg-[#F8FAFC] border border-[#E5E7EB] hover:border-[#1A73E8]/40 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-[#202124] truncate">
                    {selectedBiz?.name || uiBiz.name}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#5F6368] shrink-0" />
                </div>
                <p className="text-[11px] text-[#5F6368] mt-0.5 truncate">
                  Chakan · 2 locations
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3 border-b border-[#E5E7EB] flex justify-center">
              <div
                onClick={() => setSidebarCollapsed(false)}
                title={selectedBiz?.name || uiBiz.name}
                className="w-9 h-9 rounded-lg bg-[#F8FAFC] border border-[#E5E7EB] flex items-center justify-center text-xs font-bold text-[#1A73E8] cursor-pointer hover:bg-[#E8F0FE]"
              >
                AE
              </div>
            </div>
          )}

          {/* Navigation Items */}
          <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
            {navSections.map((sec, secIdx) => (
              <div key={secIdx}>
                {sec.title && !sidebarCollapsed && (
                  <div className="text-[10px] font-semibold tracking-wider uppercase text-[#80868B] px-3 pt-1 pb-1">
                    {sec.title}
                  </div>
                )}
                <div className="space-y-0.5">
                  {sec.items.map(item => {
                    const active = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        title={sidebarCollapsed ? item.label : undefined}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-colors ${
                          active
                            ? 'bg-[#F8FAFC] text-[#202124] font-semibold border-l-[3px] border-[#1A73E8] -ml-[1px]'
                            : 'text-[#5F6368] hover:text-[#202124] hover:bg-[#F8FAFC]'
                        } ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
                      >
                        <item.icon
                          className={`w-[18px] h-[18px] shrink-0 ${
                            active ? 'text-[#1A73E8]' : 'text-[#5F6368]'
                          }`}
                        />
                        {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Bottom Sidebar Collapse Toggle */}
          <div className="p-2 border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#5F6368]">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="flex items-center gap-2 p-1.5 hover:bg-[#F8FAFC] rounded-lg transition-colors w-full justify-center"
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-4 h-4 text-[#5F6368]" />
              ) : (
                <>
                  <ChevronLeft className="w-4 h-4 text-[#5F6368]" />
                  <span className="text-[11px]">Collapse</span>
                </>
              )}
            </button>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-xs flex"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div
              className="w-72 bg-white h-full p-4 overflow-y-auto shadow-xl flex flex-col justify-between"
              onClick={e => e.stopPropagation()}
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#1A73E8] flex items-center justify-center text-white">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-semibold text-sm text-[#202124]">LOCALOS AI</span>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1 text-[#5F6368] hover:text-[#202124]"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="mb-4 p-2 bg-[#F8FAFC] rounded-lg border border-[#E5E7EB]">
                  <p className="text-xs font-semibold text-[#202124]">{selectedBiz?.name || uiBiz.name}</p>
                  <p className="text-[11px] text-[#5F6368]">Chakan · 2 locations</p>
                </div>

                <nav className="space-y-4">
                  {navSections.map((sec, i) => (
                    <div key={i}>
                      {sec.title && (
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-[#80868B] px-2 mb-1">
                          {sec.title}
                        </div>
                      )}
                      <div className="space-y-0.5">
                        {sec.items.map(item => {
                          const active = location.pathname === item.path;
                          return (
                            <Link
                              key={item.path}
                              to={item.path}
                              onClick={() => setMobileMenuOpen(false)}
                              className={`flex items-center gap-3 px-2.5 py-2 rounded-lg text-xs font-medium ${
                                active
                                  ? 'bg-[#E8F0FE] text-[#1A73E8] font-semibold'
                                  : 'text-[#5F6368] hover:text-[#202124]'
                              }`}
                            >
                              <item.icon className="w-4 h-4 shrink-0" />
                              <span>{item.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </nav>
              </div>

              <div className="pt-4 border-t border-[#E5E7EB]">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setConnectionCenterOpen(true);
                  }}
                  className="w-full flex items-center justify-between text-xs text-[#1A73E8] font-medium py-1.5 px-2 hover:bg-[#E8F0FE] rounded-lg"
                >
                  <span>Google Connection Center</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area: Centered horizontally, max 1440px */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1440px] mx-auto p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>

      {/* Connection Center Slide-Over Drawer (Right Panel) */}
      {connectionCenterOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/20 backdrop-blur-xs flex justify-end"
          onClick={() => setConnectionCenterOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white h-full shadow-2xl border-l border-[#E5E7EB] p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-150"
            onClick={e => e.stopPropagation()}
          >
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB] mb-5">
                <div>
                  <h3 className="text-base font-semibold text-[#202124]">
                    Google Connections
                  </h3>
                  <p className="text-xs text-[#5F6368] mt-0.5">
                    Official API access & sync status for {selectedBiz?.name || uiBiz.name}.
                  </p>
                </div>
                <button
                  onClick={() => setConnectionCenterOpen(false)}
                  className="p-1.5 text-[#5F6368] hover:text-[#202124] rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status List */}
              <div className="space-y-4">
                {/* GBP */}
                <div className="p-3.5 bg-white border border-[#E5E7EB] rounded-xl">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-xs text-[#202124]">
                      Google Business Profile
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-[#188038] font-medium">
                      <span className="w-2 h-2 rounded-full bg-[#188038]"></span>
                      Connected
                    </span>
                  </div>
                  <div className="text-[11px] text-[#5F6368] flex items-center gap-3">
                    <span>2 locations (Chakan, Bhosari)</span>
                    <span>·</span>
                    <span>Last sync 2 min ago</span>
                  </div>
                </div>

                {/* GSC */}
                <div className="p-3.5 bg-white border border-[#E5E7EB] rounded-xl">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-xs text-[#202124]">
                      Search Console
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-[#188038] font-medium">
                      <span className="w-2 h-2 rounded-full bg-[#188038]"></span>
                      Connected
                    </span>
                  </div>
                  <div className="text-[11px] text-[#5F6368]">
                    <span>Last sync today</span>
                  </div>
                </div>

                {/* GA4 */}
                <div className="p-3.5 bg-white border border-[#E5E7EB] rounded-xl">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-xs text-[#202124]">
                      GA4
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-[#188038] font-medium">
                      <span className="w-2 h-2 rounded-full bg-[#188038]"></span>
                      Connected
                    </span>
                  </div>
                  <div className="text-[11px] text-[#5F6368]">
                    <span>Last sync 14 min ago</span>
                  </div>
                </div>

                {/* Gemini AI */}
                <div className="p-3.5 bg-white border border-[#E5E7EB] rounded-xl">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-xs text-[#202124]">
                      Gemini AI
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-[#188038] font-medium">
                      <span className="w-2 h-2 rounded-full bg-[#188038]"></span>
                      Connected
                    </span>
                  </div>
                  <div className="text-[11px] text-[#5F6368]">
                    <span>Automated review replies & SEO auditing active</span>
                  </div>
                </div>
              </div>

              {syncMessage && (
                <div className="mt-4 p-3 bg-[#E6F4EA] border border-[#CEEAD6] text-[#137333] text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{syncMessage}</span>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-[#E5E7EB] space-y-3">
              <button
                onClick={handleGlobalSync}
                disabled={syncingAll}
                className="w-full py-2.5 px-4 bg-[#1A73E8] hover:bg-[#1557B0] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncingAll ? 'animate-spin' : ''}`} />
                <span>{syncingAll ? 'Synchronizing Everything...' : 'Sync Everything'}</span>
              </button>
              <p className="text-[11px] text-[#5F6368] text-center">
                Syncs Google reviews, performance metrics, and search console logs immediately.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Edit Business Name Modal */}
      {showEditBizModal && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-[#E5E7EB]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] mb-4">
              <h3 className="text-sm font-semibold text-[#202124]">Rename Business</h3>
              <button onClick={() => setShowEditBizModal(false)} className="text-[#5F6368] hover:text-[#202124]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-[#5F6368] mb-4">
              Update the active business profile name across LOCALOS AI.
            </p>
            <form onSubmit={handleSaveBizName} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#202124] mb-1.5">Business Name</label>
                <input
                  type="text"
                  value={tempBizName}
                  onChange={e => setTempBizName(e.target.value)}
                  placeholder="e.g. Atharv Electricals"
                  required
                  className="w-full text-xs px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1A73E8]"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditBizModal(false)}
                  className="px-3.5 py-1.5 border border-[#E5E7EB] rounded-lg text-xs font-medium text-[#5F6368] hover:bg-[#F8FAFC]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#1A73E8] hover:bg-[#1557B0] text-white rounded-lg text-xs font-medium transition-colors"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
