import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  QrCode,
  Mail,
  Phone,
  MapPin,
  Clock,
  ShieldCheck,
  CreditCard,
  ExternalLink,
  ChevronRight,
  Sparkles,
  HelpCircle,
  FileCheck2,
  Lock
} from 'lucide-react';
import { freshTestApi } from '../../lib/fresh-test-api.ts';

interface ComplianceData {
  brandName: string;
  legalBusinessName: string;
  supportEmail: string;
  supportPhone?: string;
  address?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  country?: string;
  supportHours?: string;
  websiteUrl?: string;
  gstin?: string;
  taxApplicable?: boolean;
}

export const PublicFooter: React.FC = () => {
  const [compliance, setCompliance] = useState<ComplianceData>({
    brandName: 'Qorbiq AI',
    legalBusinessName: 'SAI ANIL CHAKANKAR',
    supportEmail: 'chakankarsai@gmail.com',
    supportPhone: '+91 9960549106',
    address: '',
    city: 'Pune',
    state: 'Maharashtra',
    pinCode: '',
    country: 'India',
    supportHours: 'Monday – Friday, 10:00 AM – 6:00 PM IST',
    websiteUrl: 'https://qorbiq.ai'
  });

  useEffect(() => {
    freshTestApi.getPublicComplianceSettings()
      .then((res: any) => {
        if (res?.complianceSettings) {
          setCompliance(res.complianceSettings);
        }
      })
      .catch(() => {
        // Fallback default is already set
      });
  }, []);

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800/80 pt-16 pb-12 font-sans selection:bg-blue-900 selection:text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 pb-12 border-b border-slate-800/80">
          {/* Brand Info (2 Columns on large screens) */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="inline-flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <span className="font-black text-xl tracking-tight text-white block">
                  {compliance.brandName || 'Qorbiq AI'}
                </span>
                <span className="text-[10px] text-blue-400 font-semibold tracking-wider uppercase block">
                  Reputation & Review Management Platform
                </span>
              </div>
            </Link>

            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Qorbiq AI is an AI-assisted business reputation management SaaS. We help verified local businesses streamline customer review assistance, generate dynamic QR destinations, and manage customer feedback transparently.
            </p>

            {/* Operating Entity & Trust Badges */}
            <div className="pt-2 space-y-2 text-xs">
              {compliance.legalBusinessName && (
                <div className="flex items-center gap-2 text-slate-300 font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Operated by: <strong className="text-white">{compliance.legalBusinessName}</strong></span>
                </div>
              )}
              {compliance.gstin ? (
                <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                  <FileCheck2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>GSTIN: <span className="font-mono text-slate-300">{compliance.gstin}</span></span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                  <FileCheck2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>Operating under applicable small business / composition threshold.</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                <CreditCard className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>Encrypted Payments processed securely via <strong>Cashfree Payments</strong></span>
              </div>
            </div>
          </div>

          {/* Navigation Column 1: Platform & Services */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-white">
              Platform & Features
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/features" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-slate-600" />
                  <span>Google Review Assistance</span>
                </Link>
              </li>
              <li>
                <Link to="/features#ai-engine" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-slate-600" />
                  <span>AI Response Drafting</span>
                </Link>
              </li>
              <li>
                <Link to="/features#dynamic-qr" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-slate-600" />
                  <span>Dynamic QR Code Generator</span>
                </Link>
              </li>
              <li>
                <Link to="/features#dashboard" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-slate-600" />
                  <span>Review Dashboard</span>
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-slate-600" />
                  <span>Transparent Pricing</span>
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-slate-600" />
                  <span>Client Dashboard Login</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Navigation Column 2: Legal & Compliance */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-white">
              Compliance & Legal
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/terms" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-slate-600" />
                  <span>Terms & Conditions</span>
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-slate-600" />
                  <span>Privacy Policy</span>
                </Link>
              </li>
              <li>
                <Link to="/refund-policy" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-slate-600" />
                  <span className="font-semibold text-blue-400 hover:text-blue-300">Cancellation & Refund Policy</span>
                </Link>
              </li>
              <li>
                <Link to="/subscription-terms" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-slate-600" />
                  <span>Subscription & Mandate Terms</span>
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-slate-600" />
                  <span>Contact & Grievance Officer</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Navigation Column 3: Contact & Support */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-white">
              Contact & Support
            </h4>
            <ul className="space-y-2.5 text-xs">
              {compliance.supportEmail && (
                <li className="flex items-start gap-2">
                  <Mail className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Support Email</span>
                    <a
                      href={`mailto:${compliance.supportEmail}`}
                      className="text-slate-200 hover:text-white font-medium hover:underline break-all"
                    >
                      {compliance.supportEmail}
                    </a>
                  </div>
                </li>
              )}
              {compliance.supportPhone && (
                <li className="flex items-start gap-2">
                  <Phone className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Helpline</span>
                    <a
                      href={`tel:${compliance.supportPhone.replace(/\s+/g, '')}`}
                      className="text-slate-200 hover:text-white font-medium hover:underline"
                    >
                      {compliance.supportPhone}
                    </a>
                  </div>
                </li>
              )}
              {compliance.address ? (
                <li className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Operating Office</span>
                    <span className="text-slate-300 leading-snug block">
                      {compliance.address}{compliance.city ? `, ${compliance.city}` : ''}{compliance.state ? `, ${compliance.state}` : ''}{compliance.pinCode ? ` - ${compliance.pinCode}` : ''}
                    </span>
                  </div>
                </li>
              ) : (compliance.city || compliance.state) ? (
                <li className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Location</span>
                    <span className="text-slate-300 leading-snug block">
                      {[compliance.city, compliance.state, compliance.country].filter(Boolean).join(', ')}
                    </span>
                  </div>
                </li>
              ) : null}
              {compliance.supportHours && (
                <li className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Business Hours</span>
                    <span className="text-slate-300">{compliance.supportHours}</span>
                  </div>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Platform Disclaimers */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="space-y-1 text-center md:text-left">
            <p>
              &copy; {currentYear} {compliance.brandName || 'Qorbiq AI'}. All rights reserved.
            </p>
            <p className="text-[11px] text-slate-500 leading-relaxed max-w-2xl">
              Disclaimer: Google, Google Business Profile, and the Google logo are registered trademarks of Google LLC. Qorbiq AI is an independent software tool and is not affiliated with, endorsed by, or sponsored by Google LLC.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
            <Link to="/terms" className="hover:text-slate-300 transition-colors">
              Terms of Service
            </Link>
            <span className="text-slate-700">•</span>
            <Link to="/privacy" className="hover:text-slate-300 transition-colors">
              Privacy Policy
            </Link>
            <span className="text-slate-700">•</span>
            <Link to="/refund-policy" className="hover:text-slate-300 transition-colors">
              Refund Policy
            </Link>
            <span className="text-slate-700">•</span>
            <Link to="/subscription-terms" className="hover:text-slate-300 transition-colors">
              Billing Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
