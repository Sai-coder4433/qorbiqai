import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  RotateCcw,
  Printer,
  ChevronRight,
  ShieldCheck,
  CreditCard,
  AlertTriangle,
  Package,
  HelpCircle,
  Clock,
  CheckCircle2,
  Mail,
  FileText
} from 'lucide-react';
import { PublicNavbar } from '../components/public/PublicNavbar.tsx';
import { PublicFooter } from '../components/public/PublicFooter.tsx';
import { freshTestApi } from '../lib/fresh-test-api.ts';

export const RefundPolicyPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState('section-a');
  const [compliance, setCompliance] = useState({
    brandName: 'Qorbiq AI',
    legalBusinessName: 'Qorbiq AI',
    supportEmail: 'support@qorbiq.ai',
    address: 'Level 4, Cyber City, Magarpatta, Pune, Maharashtra 411028',
    policyEffectiveDate: '2026-01-01',
    policyLastUpdated: '2026-10-23',
    refundWindowDays: 7
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

  const sections = [
    { id: 'section-a', title: 'Part A: SaaS Subscription Cancellation' },
    { id: 'section-b', title: 'Part B: Refund Eligibility Criteria' },
    { id: 'section-c', title: 'Part C: Refund Request & Bank Processing' },
    { id: 'section-d', title: 'Part D: Physical QR & NFC Standee Hardware' },
    { id: 'section-e', title: 'Part E: Grievance Redressal & Support Channels' }
  ];

  const scrollTo = (id: string) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      <PublicNavbar activePage="refund" />

      {/* Header Banner */}
      <section className="bg-white border-b border-slate-200 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
              <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
              <span>Customer Protection & Fair Billing</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Cancellation & Refund Policy
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Effective Date: {compliance.policyEffectiveDate} | Last Updated: {compliance.policyLastUpdated}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200/80 transition-colors flex items-center gap-2 cursor-pointer print:hidden"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Policy</span>
            </button>
            <Link
              to="/contact"
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <span>Submit Refund Request</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Main Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Table of Contents (4 cols) */}
          <aside className="hidden lg:block lg:col-span-4 sticky top-24 space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-3">
                Policy Sections
              </span>
              <nav className="space-y-1">
                {sections.map((sec) => (
                  <button
                    key={sec.id}
                    onClick={() => scrollTo(sec.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-colors block truncate ${
                      activeSection === sec.id
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    {sec.title}
                  </button>
                ))}
              </nav>
            </div>

            {/* Quick summary card */}
            <div className="bg-slate-900 rounded-2xl p-5 text-white space-y-3 shadow-sm border border-slate-800 text-xs">
              <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider block">
                Quick Billing Summary
              </span>
              <ul className="space-y-2 text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Cancel anytime from your dashboard.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Keep access until paid period ends.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>100% refund on duplicate or billing errors.</span>
                </li>
              </ul>
            </div>
          </aside>

          {/* Legal Content (8 cols) */}
          <main className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-2xs space-y-10 text-xs text-slate-700 leading-relaxed">
            {/* Introductory Statement */}
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 text-blue-900 space-y-1.5">
              <strong className="text-sm font-bold block flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Fair and Transparent Policy Statement</span>
              </strong>
              <p className="text-[11px] text-blue-800 leading-relaxed">
                At <strong>Qorbiq AI</strong>, we want our subscribers to have total clarity regarding their subscription billing, renewal mandates, and how refund requests are handled. We operate with strict adherence to consumer protection standards and Reserve Bank of India (RBI) e-mandate guidelines.
              </p>
            </div>

            {/* PART A: SAAS SUBSCRIPTION CANCELLATION */}
            <section id="section-a" className="space-y-4 scroll-mt-24">
              <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Part A: SaaS Subscription Cancellation</span>
              </h2>

              <div className="space-y-3">
                <h3 className="font-bold text-slate-900 text-xs">1. How to Cancel Your Subscription</h3>
                <p>
                  Subscribers may cancel their Qorbiq AI recurring subscription at any time without penalty or cancellation fees using either of the following methods:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <strong className="text-slate-900 font-bold block text-xs">Self-Service via Dashboard</strong>
                    <p className="text-slate-600 text-[11px]">
                      Log in to your workspace, navigate to <strong>Billing &rarr; Subscription Details</strong>, and click <em>"Cancel Recurring Subscription"</em>. Cancellation is processed immediately.
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <strong className="text-slate-900 font-bold block text-xs">Support Email Assistance</strong>
                    <p className="text-slate-600 text-[11px]">
                      Email our billing desk at <a href={`mailto:${compliance.supportEmail}`} className="text-blue-600 font-bold hover:underline">{compliance.supportEmail}</a> from your registered email with your Workspace ID.
                    </p>
                  </div>
                </div>

                <h3 className="font-bold text-slate-900 text-xs pt-2">2. Effect of Cancellation on Active Access</h3>
                <p>
                  When you cancel a subscription:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  <li><strong>Active Through Expiry:</strong> You continue to enjoy full, uninterrupted access to all paid features (dynamic QR routing, AI response drafting, and review dashboard) through the final date of your paid billing period (month or year).</li>
                  <li><strong>Stopping Future Debits:</strong> Cancellation immediately halts all future recurring payment authorizations and cancels the active mandate recorded with Cashfree.</li>
                  <li><strong>No Automatic Reversal of Past Elapsed Fees:</strong> Cancelling an active recurring subscription stops future renewals; it does not automatically imply or constitute a refund of previously elapsed billing periods.</li>
                </ul>
              </div>
            </section>

            {/* PART B: REFUND ELIGIBILITY CRITERIA */}
            <section id="section-b" className="space-y-4 scroll-mt-24">
              <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-emerald-600" />
                <span>Part B: Refund Eligibility Criteria</span>
              </h2>

              <p>
                To maintain fairness and prevent billing disputes, Qorbiq AI provides refunds under the following verified conditions:
              </p>

              <div className="space-y-2.5">
                <div className="p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/50 flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 font-bold block text-xs">Duplicate or Redundant Debits:</strong>
                    <span className="text-slate-600 text-[11px]">
                      If your payment instrument was debited more than once for the same billing cycle due to a network glitch or gateway timeout, 100% of the duplicate debit will be refunded immediately upon verification.
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/50 flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 font-bold block text-xs">Service Non-Activation After Payment:</strong>
                    <span className="text-slate-600 text-[11px]">
                      If a successful payment has been captured by Cashfree but our platform fails to activate your workspace entitlements within 24 hours due to an unresolvable server failure, you are entitled to a full refund.
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/50 flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 font-bold block text-xs">Verified Technical Billing Errors:</strong>
                    <span className="text-slate-600 text-[11px]">
                      If our billing engine charged an incorrect amount not matching the published plan pricing (₹299/month or ₹2,999/year), the difference or full charge will be adjusted or refunded.
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/50 flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 font-bold block text-xs">Initial Evaluation Window (7 Days):</strong>
                    <span className="text-slate-600 text-[11px]">
                      If you subscribe to a paid plan and determine within <strong>7 days of initial subscription</strong> that the software does not meet your business requirements, you may submit a refund request for owner review, provided account usage has not violated our Acceptable Use Policy.
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-rose-100 bg-rose-50/50 space-y-1 text-slate-700">
                <strong className="text-rose-900 font-bold block text-xs">Non-Refundable Circumstances:</strong>
                <ul className="list-disc pl-5 space-y-1 text-[11px] text-slate-600">
                  <li>Accounts suspended or terminated due to fake review generation, spam, or Terms of Service violations.</li>
                  <li>Failure of third-party platforms (e.g., Google's autonomous moderation algorithms removing or filtering a customer review).</li>
                  <li>Refund requests submitted after the conclusion of an elapsed billing period without prior cancellation.</li>
                </ul>
              </div>
            </section>

            {/* PART C: REFUND REQUEST & BANK PROCESSING */}
            <section id="section-c" className="space-y-4 scroll-mt-24">
              <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-indigo-600" />
                <span>Part C: Refund Request & Bank Processing</span>
              </h2>

              <div className="space-y-3">
                <h3 className="font-bold text-slate-900 text-xs">1. How to Submit a Refund Claim</h3>
                <p>
                  To request a refund, please send an email to <a href={`mailto:${compliance.supportEmail}`} className="text-blue-600 font-bold hover:underline">{compliance.supportEmail}</a> or use our <Link to="/contact" className="text-blue-600 font-bold hover:underline">Contact Form</Link> with the subject line <code>"Refund Request - [Your Workspace ID]"</code> including:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  <li>Registered account email address and business name.</li>
                  <li>Cashfree Order ID, Payment Reference ID, or Invoice Number.</li>
                  <li>Exact date of charge and amount debited.</li>
                  <li>Reason for the refund request (e.g., duplicate charge, technical failure).</li>
                </ul>

                <h3 className="font-bold text-slate-900 text-xs pt-2">2. Review & Banking Timelines</h3>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900">Internal Audit & Review:</strong>
                      <span className="text-slate-600 block mt-0.5">
                        Our billing team reviews and validates all refund requests within <strong>2 to 3 business days</strong>. You will receive an email confirmation once approved.
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 pt-2 border-t border-slate-200">
                    <CreditCard className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900">Gateway & Bank Credit:</strong>
                      <span className="text-slate-600 block mt-0.5">
                        Approved refunds are credited directly back to the original source payment method (UPI account, credit card, debit card, or netbanking account) via Cashfree. Funds typically reflect in your account within <strong>5 to 7 banking working days</strong>, depending on your issuing bank.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* PART D: PHYSICAL STANDEE HARDWARE */}
            <section id="section-d" className="space-y-4 scroll-mt-24">
              <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-600" />
                <span>Part D: Physical QR & NFC Standee Hardware (If Ordered)</span>
              </h2>

              <p>
                Physical countertop standees are distinct custom-manufactured hardware products separate from digital SaaS subscriptions:
              </p>

              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <strong className="text-slate-900 font-bold block text-xs">Pre-Production Cancellation:</strong>
                  <p className="text-slate-600 text-[11px]">
                    Standee orders may be cancelled for a full refund within <strong>12 hours of order placement</strong>, provided custom UV laser printing and NFC chip encoding have not yet commenced.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <strong className="text-slate-900 font-bold block text-xs">Customized Product Policy:</strong>
                  <p className="text-slate-600 text-[11px]">
                    Because acrylic standees are custom-printed with your business trade name, logo, and unique QR code, completed hardware cannot be returned for buyer's remorse once laser printing and dispatch have occurred.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <strong className="text-slate-900 font-bold block text-xs">Damaged or Defective Deliveries:</strong>
                  <p className="text-slate-600 text-[11px]">
                    If a standee arrives damaged, cracked in transit, with defective NFC chips, or with printing errors attributable to our production facility, please notify us within <strong>48 hours of delivery</strong> with unboxing photographs or video proof. We will dispatch a free expedited replacement or issue a full refund.
                  </p>
                </div>
              </div>
            </section>

            {/* PART E: GRIEVANCE REDRESSAL */}
            <section id="section-e" className="space-y-3 scroll-mt-24">
              <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-blue-600" />
                <span>Part E: Grievance Redressal & Support Channels</span>
              </h2>

              <p>
                If you have an unresolved billing inquiry or dispute, our dedicated customer support team is available to assist you promptly:
              </p>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs text-slate-700">
                <p><strong>Business Brand:</strong> {compliance.brandName}</p>
                <p><strong>Operating Entity:</strong> {compliance.legalBusinessName}</p>
                <p><strong>Billing Support Email:</strong> <a href={`mailto:${compliance.supportEmail}`} className="text-blue-600 hover:underline">{compliance.supportEmail}</a></p>
                <p><strong>Physical Address:</strong> {compliance.address}</p>
                <p><strong>Operating Hours:</strong> Monday – Friday, 10:00 AM – 6:00 PM IST</p>
              </div>
            </section>
          </main>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
};
