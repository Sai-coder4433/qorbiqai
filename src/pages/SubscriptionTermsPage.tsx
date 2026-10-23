import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CreditCard,
  Printer,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  Sparkles,
  RefreshCw,
  FileText
} from 'lucide-react';
import { PublicNavbar } from '../components/public/PublicNavbar.tsx';
import { PublicFooter } from '../components/public/PublicFooter.tsx';
import { freshTestApi } from '../lib/fresh-test-api.ts';

export const SubscriptionTermsPage: React.FC = () => {
  const [compliance, setCompliance] = useState({
    brandName: 'Qorbiq AI',
    legalBusinessName: 'Qorbiq AI',
    supportEmail: 'support@qorbiq.ai',
    address: 'Level 4, Cyber City, Magarpatta, Pune, Maharashtra 411028',
    policyEffectiveDate: '2026-01-01',
    policyLastUpdated: '2026-10-23'
  });

  useEffect(() => {
    freshTestApi.getPublicComplianceSettings()
      .then((res: any) => {
        if (res?.complianceSettings) {
          setCompliance(prev => ({
            ...prev,
            ...res.complianceSettings
          }));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      <PublicNavbar activePage="subscription" />

      {/* Header Banner */}
      <section className="bg-white border-b border-slate-200 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
              <CreditCard className="w-3.5 h-3.5 text-blue-600" />
              <span>Billing Transparency & Mandate Disclosure</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Subscription & Billing Information
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Clear rules governing automated renewals, recurring charges, and Cashfree payment mandates.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/pricing"
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <span>View Pricing Page</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex-1 space-y-8 text-xs text-slate-700 leading-relaxed">
        {/* Transparent Pricing Cards */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs space-y-6">
          <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <span>Available Subscription Tiers</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Monthly */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">Qorbiq AI Monthly</h3>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">
                    Monthly Billing Interval
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-slate-900">₹299</span>
                  <span className="text-slate-400 text-[10px] block">/ month</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Access all implemented Qorbiq AI business reputation management features for 30 consecutive calendar days. Renews automatically each month until cancelled.
              </p>
            </div>

            {/* Yearly */}
            <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-3 relative overflow-hidden">
              <div className="absolute top-2 right-2 px-2 py-0.5 bg-blue-600 text-white text-[9px] font-black rounded-full uppercase tracking-wider">
                Best Value — Save 16.4%
              </div>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-extrabold text-sm text-blue-950">Qorbiq AI Yearly</h3>
                  <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider block mt-0.5">
                    Yearly Billing Interval
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-blue-700">₹2,999</span>
                  <span className="text-blue-900/60 text-[10px] block">/ year</span>
                </div>
              </div>
              <p className="text-[11px] text-blue-900/80 leading-relaxed">
                Full 365-day access. Equivalent comparison: 12 monthly payments of ₹299 = ₹3,588. Yearly plan costs ₹2,999, saving you ₹589 (~16.4%) per year.
              </p>
            </div>
          </div>
        </div>

        {/* How Recurring Billing Works */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs space-y-5">
          <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-emerald-600" />
            <span>How Recurring Mandates & Autopay Operate</span>
          </h2>

          <div className="space-y-4">
            <p>
              To ensure continuous, uninterrupted uptime for your customer-facing dynamic QR codes and AI review assistance dashboard, Qorbiq AI utilizes automated recurring payments through <strong>Cashfree Payments India Pvt. Ltd.</strong>
            </p>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">1</span>
                <div>
                  <strong className="text-slate-900 font-bold block">Mandate Authorization at Checkout:</strong>
                  <span className="text-slate-600 text-[11px]">
                    When you subscribe, you authorize a recurring payment mandate through Cashfree via your chosen payment instrument (UPI Autopay, Debit/Credit Card, or Netbanking Mandate).
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">2</span>
                <div>
                  <strong className="text-slate-900 font-bold block">RBI Mandate Compliance & Pre-Debit Alerts:</strong>
                  <span className="text-slate-600 text-[11px]">
                    In accordance with Reserve Bank of India (RBI) e-mandate directives, you will receive an advance pre-debit SMS/email notification from your issuing bank at least 24 to 48 hours prior to the scheduled deduction.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">3</span>
                <div>
                  <strong className="text-slate-900 font-bold block">Automated Sequential Tax Invoicing:</strong>
                  <span className="text-slate-600 text-[11px]">
                    Every successful payment triggers the generation of an immutable, sequential tax invoice (e.g. QOR-2026-0001) with itemized breakdown, printable PDF download, and email dispatch.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How to Cancel Mandate */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs space-y-4">
          <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Clock className="w-4 h-4 text-rose-600" />
            <span>How to Cancel Your Subscription Mandate</span>
          </h2>

          <p>
            You retain absolute autonomy over your subscription. You may cancel at any moment:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <strong className="text-slate-900 font-bold block text-xs">Self-Service in 2 Clicks</strong>
              <p className="text-slate-600 text-[11px]">
                Sign in to your account, open the <Link to="/app/billing" className="text-blue-600 font-bold hover:underline">Billing Page</Link>, and click <strong>"Cancel Recurring Subscription"</strong>. Your mandate is revoked immediately with Cashfree.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <strong className="text-slate-900 font-bold block text-xs">Email Support Cancellation</strong>
              <p className="text-slate-600 text-[11px]">
                Send an email to <a href={`mailto:${compliance.supportEmail}`} className="text-blue-600 font-bold hover:underline">{compliance.supportEmail}</a> requesting mandate cancellation. Our support team processes all cancellation requests within 24 business hours.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs">
            <strong>Important Policy Reminder:</strong> Once a subscription is cancelled, access continues until the end of your current paid billing period. Future debits are stopped permanently. For questions regarding duplicate charges or billing reversals, review our full <Link to="/refund-policy" className="text-blue-700 font-bold hover:underline">Cancellation & Refund Policy</Link>.
          </div>
        </div>

        {/* Helpful links */}
        <div className="text-center pt-4 space-y-2">
          <p className="text-slate-500 text-xs">
            Need additional assistance or corporate invoicing details?
          </p>
          <div className="flex justify-center gap-4 text-xs font-bold text-blue-600">
            <Link to="/contact" className="hover:underline">Contact Support Desk</Link>
            <span>•</span>
            <Link to="/terms" className="hover:underline">Read Terms & Conditions</Link>
            <span>•</span>
            <Link to="/privacy" className="hover:underline">Privacy Policy</Link>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};
