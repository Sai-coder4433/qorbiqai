import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  ShieldCheck,
  LayoutDashboard,
  Users,
  Building2,
  CreditCard,
  BarChart3,
  Sliders,
  FileText,
  LogOut,
  ChevronRight,
  Menu,
  X,
  Lock,
  Inbox,
  UserCheck,
  QrCode,
  Cpu,
  Receipt,
  Layers,
  Settings as SettingsIcon,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../lib/auth-context.tsx';

interface SuperAdminLayoutProps {
  children: React.ReactNode;
}

export const SuperAdminLayout: React.FC<SuperAdminLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleAdminLogout = async () => {
    await logout();
    navigate('/super-admin/login');
  };

  // SECTION 3: EXACT 12 SUPER ADMIN SIDEBAR SECTIONS
  const navItems = [
    {
      label: 'Dashboard',
      path: '/super-admin',
      icon: LayoutDashboard,
      active: location.pathname === '/super-admin' || location.pathname === '/super-admin/dashboard'
    },
    {
      label: 'Businesses',
      path: '/super-admin/businesses',
      icon: Building2,
      active: location.pathname === '/super-admin/businesses' || location.pathname.startsWith('/super-admin/clients')
    },
    {
      label: 'Subscriptions',
      path: '/super-admin/subscriptions',
      icon: CreditCard,
      active: location.pathname === '/super-admin/subscriptions'
    },
    {
      label: 'Payments',
      path: '/super-admin/payments',
      icon: Receipt,
      active: location.pathname === '/super-admin/payments'
    },
    {
      label: 'Plans & Pricing',
      path: '/super-admin/plans',
      icon: Layers,
      active: location.pathname === '/super-admin/plans'
    },
    {
      label: 'Dynamic QR',
      path: '/super-admin/dynamic-qr',
      icon: QrCode,
      active: location.pathname === '/super-admin/dynamic-qr'
    },
    {
      label: 'AI Usage',
      path: '/super-admin/ai-usage',
      icon: Cpu,
      active: location.pathname === '/super-admin/ai-usage'
    },
    {
      label: 'Employees',
      path: '/super-admin/employees',
      icon: UserCheck,
      active: location.pathname === '/super-admin/employees'
    },
    {
      label: 'CRM',
      path: '/super-admin/crm',
      icon: Inbox,
      active: location.pathname === '/super-admin/crm' || location.pathname === '/super-admin/leads'
    },
    {
      label: 'Analytics',
      path: '/super-admin/analytics',
      icon: BarChart3,
      active: location.pathname === '/super-admin/analytics'
    },
    {
      label: 'Audit Logs',
      path: '/super-admin/audit-logs',
      icon: FileText,
      active: location.pathname === '/super-admin/audit-logs'
    },
    {
      label: 'Settings',
      path: '/super-admin/settings',
      icon: SettingsIcon,
      active: location.pathname === '/super-admin/settings' || location.pathname === '/super-admin/system'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row font-sans">
      {/* Mobile Top Bar */}
      <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-xs">
            <Lock className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-sm tracking-tight text-slate-900">ReviewFlow Admin</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Super Admin White/Clean Brand Sidebar */}
      <aside
        className={`${
          mobileMenuOpen ? 'block' : 'hidden'
        } md:block w-full md:w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 p-5 space-y-6 md:min-h-screen`}
      >
        <div className="space-y-6">
          {/* Header Brand */}
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="font-extrabold text-sm tracking-tight text-slate-900 block leading-tight">
                  ReviewFlow AI
                </span>
                <span className="text-[10px] text-blue-600 font-mono tracking-wider uppercase font-semibold">
                  Super Admin Master
                </span>
              </div>
            </div>
            <div className="mt-2 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-medium">Master Security</span>
              </span>
              <span className="font-mono text-slate-400">v3.0</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
              Management
            </div>
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    item.active
                      ? 'bg-blue-50 text-blue-700 shadow-xs border-r-2 border-blue-600'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${item.active ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.active && <ChevronRight className="w-3.5 h-3.5 text-blue-600 opacity-70" />}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Super Admin Session & Logout */}
        <div className="border-t border-slate-200 pt-4 space-y-3">
          <div className="px-3 py-2.5 bg-slate-50 rounded-xl space-y-1 border border-slate-200">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-blue-600" />
              <span>Super Administrator</span>
            </div>
            <div className="font-semibold text-xs text-slate-900 truncate">
              {user?.displayName || 'Sai Chakankar'}
            </div>
            <div className="text-[11px] text-slate-500 truncate font-mono">{user?.email || 'chakankarsai@gmail.co'}</div>
          </div>

          <button
            type="button"
            onClick={handleAdminLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 p-4 sm:p-8 overflow-y-auto bg-slate-50">
        <div className="max-w-7xl mx-auto">{children}</div>
      </div>
    </div>
  );
};
