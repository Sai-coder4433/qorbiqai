import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  QrCode,
  Settings,
  LogOut,
  ShieldCheck,
  Building2,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../../lib/auth-context.tsx';

interface FreshAppLayoutProps {
  children: React.ReactNode;
}

export const FreshAppLayout: React.FC<FreshAppLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    {
      label: 'QR Review Dashboard',
      path: '/app',
      icon: QrCode,
      active: location.pathname === '/app' || location.pathname === '/app/qr-automation'
    },
    {
      label: 'Shop Setup & Wizard',
      path: '/app/onboarding',
      icon: Building2,
      active: location.pathname === '/app/onboarding'
    },
    {
      label: 'Plans & Settings',
      path: '/app/settings',
      icon: Settings,
      active: location.pathname === '/app/settings'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row font-sans">
      {/* Mobile Top Bar */}
      <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <Link to="/app" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white">
            <QrCode className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm tracking-tight text-slate-900">ReviewFlow</span>
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Minimal Sidebar (Section 3) */}
      <aside
        className={`${
          mobileMenuOpen ? 'block' : 'hidden'
        } md:block w-full md:w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 p-5 space-y-6 md:min-h-screen`}
      >
        <div className="space-y-6">
          {/* Logo / Brand */}
          <Link to="/app" className="hidden md:flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-slate-900 block leading-tight">
                ReviewFlow
              </span>
              <span className="text-[10px] text-slate-400 font-medium">QR Automation SaaS</span>
            </div>
          </Link>

          {/* Minimal Navigation */}
          <nav className="space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
              Menu
            </div>
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    item.active
                      ? 'bg-blue-50 text-blue-700'
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
          {/* Super Admin Console Button if authorized */}
          {user?.role === 'SUPER_ADMIN' && (
            <Link
              to="/super-admin"
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors"
            >
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              <span>Super Admin Panel</span>
            </Link>
          )}

          <div className="px-3 py-2 bg-slate-50 rounded-xl space-y-0.5">
            <div className="font-semibold text-xs text-slate-900 truncate">
              {user?.displayName || 'User'}
            </div>
            <div className="text-[11px] text-slate-500 truncate font-mono">{user?.email}</div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Page Content */}
      <div className="flex-1 p-4 sm:p-8 overflow-y-auto">
        {children}
      </div>
    </div>
  );
};
