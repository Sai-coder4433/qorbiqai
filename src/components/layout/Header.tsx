import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

export const Header: React.FC = () => {
  const location = useLocation();

  const navLinks = [
    { name: 'Features', path: '/features' },
    { name: 'Solutions', path: '/features#solutions' },
    { name: 'Pricing', path: '/pricing' },
    { name: 'Documentation', path: '/docs' },
    { name: 'Google Setup Guide', path: '/docs/google-setup' }
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#E5E7EB] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-lg bg-[#1A73E8] flex items-center justify-center text-white shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-base tracking-tight text-[#202124]">
            LOCALOS <span className="text-[#1A73E8]">AI</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-[#5F6368]">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`hover:text-[#1A73E8] transition-colors ${
                location.pathname === link.path ? 'text-[#1A73E8] font-semibold' : ''
              }`}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* CTA Buttons */}
        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="text-xs font-medium text-[#5F6368] hover:text-[#202124] px-3 py-1.5 rounded-lg transition-colors"
          >
            Sign in
          </Link>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#202124] bg-white hover:bg-[#F8FAFC] border border-[#E5E7EB] px-3 py-1.5 rounded-lg transition-colors"
          >
            <span>Dashboard</span>
          </Link>
          <Link
            to="/onboarding"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-white bg-[#1A73E8] hover:bg-[#1557B0] px-3.5 py-1.5 rounded-lg transition-colors"
          >
            <span>Start Free</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
};

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-[#DADCE0] mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#1A73E8] flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-bold text-lg text-[#202124]">LOCALOS AI</span>
            </div>
            <p className="text-sm text-[#5F6368] max-w-sm mb-4 leading-relaxed">
              Your AI Operating System for Local Business Growth. Connect Google Business Profile, Search Console, and Google Analytics to optimize visibility, manage reviews, and automate growth.
            </p>
            <div className="flex items-center gap-2 text-xs text-[#5F6368] bg-[#F8F9FA] border border-[#DADCE0] rounded-lg p-2.5 max-w-md">
              <ShieldCheck className="w-4 h-4 text-[#34A853] shrink-0" />
              <span>Strict Google API Compliance. We never buy reviews, scrape Google Maps, or display fabricated data.</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#202124] mb-3">Product</h4>
            <ul className="space-y-2 text-sm text-[#5F6368]">
              <li><Link to="/features" className="hover:text-[#1A73E8]">Google Business Profile</Link></li>
              <li><Link to="/features" className="hover:text-[#1A73E8]">AI Review Management</Link></li>
              <li><Link to="/features" className="hover:text-[#1A73E8]">Local SEO & Crawler</Link></li>
              <li><Link to="/features" className="hover:text-[#1A73E8]">Search Console Automation</Link></li>
              <li><Link to="/features" className="hover:text-[#1A73E8]">Geo-Grid Visibility</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#202124] mb-3">Resources</h4>
            <ul className="space-y-2 text-sm text-[#5F6368]">
              <li><Link to="/docs" className="hover:text-[#1A73E8]">Documentation</Link></li>
              <li><Link to="/docs/google-setup" className="hover:text-[#1A73E8]">Google OAuth Setup</Link></li>
              <li><Link to="/pricing" className="hover:text-[#1A73E8]">Pricing Plans</Link></li>
              <li><Link to="/r/apex-health-wellness" className="hover:text-[#1A73E8]">Customer Review Experience</Link></li>
              <li><Link to="/admin" className="hover:text-[#1A73E8]">Super Admin Panel</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#202124] mb-3">Legal & Security</h4>
            <ul className="space-y-2 text-sm text-[#5F6368]">
              <li><Link to="/privacy" className="hover:text-[#1A73E8]">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-[#1A73E8]">Terms of Service</Link></li>
              <li><a href="https://policies.google.com/terms" target="_blank" rel="noreferrer" className="hover:text-[#1A73E8]">Google Terms of Service</a></li>
              <li><a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noreferrer" className="hover:text-[#1A73E8]">Google API User Data Policy</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-[#DADCE0] flex flex-col sm:flex-row items-center justify-between text-xs text-[#5F6368]">
          <p>© {new Date().getFullYear()} LOCALOS AI Inc. All rights reserved.</p>
          <p className="mt-2 sm:mt-0">Enterprise-grade multi-tenant architecture with encrypted OAuth storage.</p>
        </div>
      </div>
    </footer>
  );
};
