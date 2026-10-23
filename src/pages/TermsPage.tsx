import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Printer,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  Scale,
  Calendar,
  ExternalLink,
  Building2,
  CheckCircle2,
  Mail
} from 'lucide-react';
import { PublicNavbar } from '../components/public/PublicNavbar.tsx';
import { PublicFooter } from '../components/public/PublicFooter.tsx';
import { freshTestApi } from '../lib/fresh-test-api.ts';

export const TermsPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState('section-1');
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

  const sections = [
    { id: 'section-1', title: '1. Introduction and Acceptance' },
    { id: 'section-2', title: '2. Eligibility and Account Registration' },
    { id: 'section-3', title: '3. Accurate Customer and Business Information' },
    { id: 'section-4', title: '4. Description of the Qorbiq AI Service' },
    { id: 'section-5', title: '5. Subscription Plans and Prices (₹299/mo & ₹2,999/yr)' },
    { id: 'section-6', title: '6. Monthly and Yearly Billing Intervals' },
    { id: 'section-7', title: '7. Recurring Billing Authorization & Mandates' },
    { id: 'section-8', title: '8. Payment Processing by Cashfree' },
    { id: 'section-9', title: '9. Subscription Activation and Access' },
    { id: 'section-10', title: '10. Renewal and Cancellation' },
    { id: 'section-11', title: '11. Taxes and Applicable Charges' },
    { id: 'section-12', title: '12. Refunds and Cancellation Requests' },
    { id: 'section-13', title: '13. Service Availability and Maintenance' },
    { id: 'section-14', title: '14. Acceptable Use Policy' },
    { id: 'section-15', title: '15. AI-Generated Content & Customer Responsibility' },
    { id: 'section-16', title: '16. Google Business Profile & Third-Party Dependencies' },
    { id: 'section-17', title: '17. Intellectual Property Rights' },
    { id: 'section-18', title: '18. User Data and Privacy' },
    { id: 'section-19', title: '19. Account Suspension and Termination' },
    { id: 'section-20', title: '20. Changes to the Service or Terms' },
    { id: 'section-21', title: '21. Limitation of Liability' },
    { id: 'section-22', title: '22. Governing Law and Dispute Jurisdiction' },
    { id: 'section-23', title: '23. Contact Information for Legal or Support Enquiries' },
    { id: 'section-24', title: '24. Effective Date and Revision History' }
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
      <PublicNavbar activePage="terms" />

      {/* Header Banner */}
      <section className="bg-white border-b border-slate-200 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
              <Scale className="w-3.5 h-3.5 text-blue-600" />
              <span>Legal Document & User Agreement</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Terms & Conditions
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
              <span>Print Terms</span>
            </button>
            <Link
              to="/refund-policy"
              className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl border border-blue-200 transition-colors flex items-center gap-1.5"
            >
              <span>Refund Policy</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Main Body with Sticky Sidebar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Sticky Table of Contents (4 cols) */}
          <aside className="hidden lg:block lg:col-span-4 sticky top-24 space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs max-h-[calc(100vh-120px)] overflow-y-auto">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-3">
                Table of Contents (24 Sections)
              </span>
              <nav className="space-y-1">
                {sections.map((sec) => (
                  <button
                    key={sec.id}
                    onClick={() => scrollTo(sec.id)}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors block truncate ${
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
          </aside>

          {/* Legal Text Content (8 cols) */}
          <main className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-2xs space-y-10 text-xs text-slate-700 leading-relaxed">
            {/* Operational notice */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold block">Important Notice:</strong>
                <span>
                  These Terms of Service govern your use of the Qorbiq AI software application. Please read these terms carefully before creating an account, selecting a subscription, or authorizing payments.
                </span>
              </div>
            </div>

            {/* SECTION 1 */}
            <section id="section-1" className="space-y-3 scroll-mt-24">
              <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-2">
                1. Introduction and Acceptance
              </h2>
              <p>
                Welcome to <strong>Qorbiq AI</strong> ("we", "our", "us", or "Platform"). These Terms & Conditions ("Terms") constitute a legally binding agreement between the registered business user, subscriber, or representative ("Customer", "User", or "You") and the legal operator of Qorbiq AI (<strong>{compliance.legalBusinessName}</strong>).
              </p>
              <p>
                By registering an account, accessing our dashboard, configuring dynamic QR codes, drafting review responses with our AI engine, or purchasing a subscription, you confirm that you have read, understood, and agreed to be bound by these Terms and our companion <Link to="/privacy" className="text-blue-600 hover:underline font-bold">Privacy Policy</Link> and <Link to="/refund-policy" className="text-blue-600 hover:underline font-bold">Cancellation & Refund Policy</Link>. If you do not agree to these terms, you must discontinue use immediately.
              </p>
            </section>

            {/* SECTION 2 */}
            <section id="section-2" className="space-y-3 scroll-mt-24">
              <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-2">
                2. Eligibility and Account Registration
              </h2>
              <p>
                To be eligible to create an account and subscribe to Qorbiq AI, you represent and warrant that:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>You are at least 18 years of age and legally competent to enter into commercial contracts under applicable law.</li>
                <li>You are registering on behalf of a genuine commercial enterprise, professional practice, or store location, and possess authority to bind said business.</li>
                <li>All registration information submitted (including email, password, business category, and store location) is accurate, current, and verifiable.</li>
                <li>You are responsible for maintaining the confidentiality of your credentials and all activities occurring under your account.</li>
              </ul>
            </section>

            {/* SECTION 3 */}
            <section id="section-3" className="space-y-3 scroll-mt-24">
              <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-2">
                3. Accurate Customer and Business Information
              </h2>
              <p>
                Customers agree to maintain truthful business information throughout their subscription. You must provide a valid Google Business Profile destination URL, real store address, and functional contact email. Qorbiq AI reserves the right to suspend workspaces that impersonate existing registered trademarks, publish deceptive destination links, or fail ownership verification.
              </p>
            </section>

            {/* SECTION 4 */}
            <section id="section-4" className="space-y-3 scroll-mt-24">
              <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-2">
                4. Description of the Qorbiq AI Service
              </h2>
              <p>
                Qorbiq AI is a cloud-based software-as-a-service (SaaS) platform providing reputation management and Google review assistance tools for physical and local businesses. The Service comprises:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Dynamic QR Code Routing:</strong> Generating and redirecting dynamic QR codes to verified customer review destinations.</li>
                <li><strong>Customer Review Flow:</strong> Mobile-responsive review assistance flows where visiting patrons can select positive visit highlights.</li>
                <li><strong>AI-Assisted Response Drafting:</strong> Suggesting draft responses to customer reviews using Google Gemini AI models for human review and verification.</li>
                <li><strong>Review Analytics:</strong> Aggregating in-store scan events, device categories, and customer feedback trends.</li>
                <li><strong>Countertop Hardware Standees:</strong> Optional physical acrylic QR & NFC tabletop display standees manufactured for subscribing venues.</li>
              </ul>
            </section>

            {/* SECTION 5 */}
            <section id="section-5" className="space-y-3 scroll-mt-24">
              <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-2">
                5. Subscription Plans and Prices (₹299/mo & ₹2,999/yr)
              </h2>
              <p>
                Qorbiq AI provides two standardized, transparent subscription billing tiers for full access to the SaaS platform:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex justify-between items-center mb-1">
                    <strong className="text-slate-900 font-bold text-sm">Qorbiq AI Monthly</strong>
                    <span className="font-black text-blue-600 text-sm">₹299 / month</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Billed every month. Access to all active reputation management features, dynamic QR routing, and AI drafting for the billing month.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200">
                  <div className="flex justify-between items-center mb-1">
                    <strong className="text-blue-900 font-bold text-sm">Qorbiq AI Yearly</strong>
                    <span className="font-black text-blue-700 text-sm">₹2,999 / year</span>
                  </div>
                  <p className="text-[11px] text-blue-900/80">
                    Billed every year. Equivalent to ₹249.92/month. Saves ₹589 (16.4%) compared with 12 consecutive monthly billing payments of ₹299 (₹3,588).
                  </p>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 pt-1">
                Prices are displayed in Indian Rupees (INR) and independently verified on our backend servers prior to payment session creation.
              </p>
            </section>

            {/* SECTION 6 */}
            <section id="section-6" className="space-y-3 scroll-mt-24">
              <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-2">
                6. Monthly and Yearly Billing Intervals
              </h2>
              <p>
                Subscriptions are billed strictly on the cycle selected at checkout:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Monthly Interval:</strong> Renews automatically every 30 days from the payment verification timestamp unless cancelled prior to renewal.</li>
                <li><strong>Yearly Interval:</strong> Renews automatically every 365 days from the activation timestamp unless cancelled prior to the anniversary date.</li>
              </ul>
            </section>

            {/* SECTION 7 */}
            <section id="section-7" className="space-y-3 scroll-mt-24">
              <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-2">
                7. Recurring Billing Authorization & Mandates
              </h2>
              <p>
                By subscribing, you authorize Qorbiq AI and our payment processing partner, Cashfree Payments India Pvt. Ltd., to initiate recurring charges or pre-debit notifications in accordance with Reserve Bank of India (RBI) e-mandate regulations. Prior to any recurring billing execution, automated pre-debit notifications may be transmitted to your registered payment instrument (card, UPI Autopay, or netbanking mandate).
              </p>
            </section>

            {/* SECTION 8 */}
            <section id="section-8" className="space-y-3 scroll-mt-24">
              <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-2">
                8. Payment Processing by Cashfree
              </h2>
              <p>
                All electronic payment collections, UPI authorizations, card checkouts, and recurring mandates are processed securely via <strong>Cashfree Payments India Pvt. Ltd.</strong> ("Cashfree").
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Qorbiq AI never collects, receives, or stores raw payment card numbers, CVVs, or bank netbanking passwords on our application servers.</li>
                <li>All sensitive transaction data is encrypted and transmitted directly to PCI-DSS certified payment processing gateways.</li>
                <li>We store only cryptographic order identifiers, payment session tokens, and mandate reference IDs for invoice generation and status synchronization.</li>
              </ul>
            </section>

            {/* SECTION 9 */}
            <section id="section-9" className="space-y-3 scroll-mt-24">
              <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-2">
                9. Subscription Activation and Access
              </h2>
              <p>
                Access to paid subscription capabilities (such as dynamic QR updates, analytics downloads, and AI drafting) is activated strictly upon <strong>server-side cryptographic verification</strong> of the payment status from Cashfree webhooks or payment verification APIs. Qorbiq AI does not activate paid entitlements merely upon frontend client redirect without verified gateway confirmation.
              </p>
            </section>

            {/* SECTION 10 */}
            <section id="section-10" className="space-y-3 scroll-mt-24">
              <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-2">
                10. Renewal and Cancellation
              </h2>
              <p>
                You may cancel your recurring subscription at any time:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Self-Service:</strong> Navigate to your Account Dashboard &rarr; <Link to="/app/billing" className="text-blue-600 hover:underline font-bold">Billing</Link> and select "Cancel Recurring Subscription".</li>
                <li><strong>Support Assistance:</strong> Email us at <a href={`mailto:${compliance.supportEmail}`} className="text-blue-600 hover:underline font-bold">{compliance.supportEmail}</a> from your registered email address with your Workspace ID.</li>
              </ul>
              <p>
                Upon cancellation, your existing paid entitlements remain fully active until the conclusion of your current prepaid billing period. Recurring mandates are cancelled with Cashfree so no future debits take place. Cancelling a subscription stops future billing and does not automatically trigger a refund for elapsed service periods.
              </p>
            </section>

            {/* SECTION 11 */}
            <section id="section-11" className="space-y-3 scroll-mt-24">
              <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-2">
                11. Taxes and Applicable Charges
              </h2>
              <p>
                Goods and Services Tax (GST) is levied strictly in compliance with prevailing Indian taxation statutes. Where the operating business is registered under GST, valid tax invoices with GSTIN, HSN/SAC code 998315, and CGST/SGST/IGST breakdowns are automatically issued. If operating below mandatory registration thresholds, subscriptions are invoiced as inclusive of applicable charges without separate GST levy.
              </p>
            </section>

            {/* SECTION 12 */}
            <section id="section-12" className="space-y-3 scroll-mt-24">
              <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-2">
                12. Refunds and Cancellation Requests
              </h2>
              <p>
                Refund eligibility, review procedures, processing timelines, and exceptions for physical customized hardware products are governed strictly by our dedicated <Link to="/refund-policy" className="text-blue-600 hover:underline font-bold">Cancellation & Refund Policy</Link>. Duplicate payments, verified billing errors, or service non-activation after verified gateway capture are eligible for full reversals.
              </p>
            </section>

            {/* SECTION 13 */}
            <section id="section-13" className="space-y-3 scroll-mt-24">
              <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-2">
                13. Service Availability and Maintenance
              </h2>
              <p>
                We strive to maintain 99.9% uptime for customer-facing QR redirect routes. However, occasional scheduled maintenance, hosting network outages, or third-party cloud infrastructure maintenance (Cloudflare, Firebase) may cause brief temporary interruptions. We do not offer cash SLA penalty credits for ordinary maintenance windows.
              </p>
            </section>

            {/* SECTION 14 */}
            <section id="section-14" className="space-y-3 scroll-mt-24">
              <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-2">
                14. Acceptable Use Policy
              </h2>
              <p>
                Customers agree never to utilize Qorbiq AI for any unlawful or abusive purpose, including but not limited to:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Generating fabricated, automated, compensated, or fictitious customer reviews.</li>
                <li>Conducting review gating or deceptive filtering designed to block critical consumer reviews from reaching public platforms in violation of Google or regulatory guidelines.</li>
                <li>Uploading malware, malicious redirect URLs, phishing destinations, or adult content to dynamic QR codes.</li>
                <li>Attempting to reverse engineer, scrape, bypass rate limits, or disrupt our backend APIs and databases.</li>
              </ul>
            </section>

            {/* SECTION 15 */}
            <section id="section-15" className="space-y-3 scroll-mt-24">
              <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-2">
                15. AI-Generated Content & Customer Responsibility
              </h2>
              <p>
                Review response drafts generated by Qorbiq AI are produced using automated large language models (Google Gemini). Customers expressly acknowledge that:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>AI responses are drafts intended to assist the business owner, not final published representations without human review.</li>
                <li>The customer is solely responsible for reviewing, verifying accuracy, and approving any response before publishing it on Google.</li>
                <li>Qorbiq AI is not liable for errors, inaccuracies, defamatory statements, or unintended remarks in AI-drafted responses approved by the customer.</li>
              </ul>
            </section>

            {/* SECTION 16 */}
            <section id="section-16" className="space-y-3 scroll-mt-24">
              <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-2">
                16. Google Business Profile & Third-Party Dependencies
              </h2>
              <p>
                Qorbiq AI provides software assistance tools for businesses maintaining Google Business Profiles. Customers acknowledge:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Qorbiq AI is not affiliated with, endorsed by, or partnered with Google LLC.</li>
                <li>Google maintains autonomous moderation algorithms; Qorbiq AI cannot guarantee that any customer review will be published, appear publicly, or remain undeleted by Google.</li>
                <li>Customers must adhere to all applicable third-party platform terms and Google Maps policies.</li>
              </ul>
            </section>

            {/* SECTION 17 */}
            <section id="section-17" className="space-y-3 scroll-mt-24">
              <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-2">
                17. Intellectual Property Rights
              </h2>
              <p>
                All software code, brand designs, logos, UI designs, and documentation comprising Qorbiq AI are the exclusive intellectual property of {compliance.legalBusinessName}. Customers are granted a non-exclusive, non-transferable, revocable license to access the platform during an active subscription.
              </p>
            </section>

            {/* SECTION 18 */}
            <section id="section-18" className="space-y-3 scroll-mt-24">
              <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-2">
                18. User Data and Privacy
              </h2>
              <p>
                Our collection, retention, and handling of account credentials, workspace data, and scan metadata is governed by our <Link to="/privacy" className="text-blue-600 hover:underline font-bold">Privacy Policy</Link>, which is incorporated into these Terms by reference.
              </p>
            </section>

            {/* SECTION 19 */}
            <section id="section-19" className="space-y-3 scroll-mt-24">
              <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-2">
                19. Account Suspension and Termination
              </h2>
              <p>
                We reserve the right to temporarily suspend or permanently terminate access to any account without liability if we reasonably determine that the account is engaged in fraudulent activities, repeated chargeback abuse, fake review fabrication, or material violation of these Terms.
              </p>
            </section>

            {/* SECTION 20 */}
            <section id="section-20" className="space-y-3 scroll-mt-24">
              <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-2">
                20. Changes to the Service or Terms
              </h2>
              <p>
                We may modify these Terms periodically to reflect changes in our service offerings, regulatory updates, or payment gateway requirements. Notice of material revisions will be provided via email or an in-app banner at least 15 days prior to taking effect. Continued use of the platform constitutes acceptance.
              </p>
            </section>

            {/* SECTION 21 */}
            <section id="section-21" className="space-y-3 scroll-mt-24">
              <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-2">
                21. Limitation of Liability
              </h2>
              <p>
                To the maximum extent permitted by applicable Indian law, in no event shall Qorbiq AI, its developers, or its operator ({compliance.legalBusinessName}) be liable for any indirect, incidental, punitive, or consequential damages (including loss of business profits or reputation) arising out of your use or inability to use the service. Our aggregate liability for all claims related to the service shall not exceed the subscription fees actually paid by you during the three (3) months immediately preceding the event giving rise to liability.
              </p>
            </section>

            {/* SECTION 22 */}
            <section id="section-22" className="space-y-3 scroll-mt-24">
              <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-2">
                22. Governing Law and Dispute Jurisdiction
              </h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of India. Any legal dispute, controversy, or claim arising out of or relating to these Terms shall be subject to the exclusive jurisdiction of the competent courts situated in <strong>Pune, Maharashtra, India</strong>.
              </p>
            </section>

            {/* SECTION 23 */}
            <section id="section-23" className="space-y-3 scroll-mt-24">
              <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-2">
                23. Contact Information for Legal or Support Enquiries
              </h2>
              <p>
                For legal notices, contract enquiries, or questions regarding these Terms, please contact our administrative office:
              </p>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs text-slate-700">
                <p><strong>Entity / Operator:</strong> {compliance.legalBusinessName}</p>
                <p><strong>Public Brand:</strong> {compliance.brandName}</p>
                <p><strong>Email:</strong> <a href={`mailto:${compliance.supportEmail}`} className="text-blue-600 hover:underline">{compliance.supportEmail}</a></p>
                <p><strong>Address:</strong> {compliance.address}</p>
              </div>
            </section>

            {/* SECTION 24 */}
            <section id="section-24" className="space-y-3 scroll-mt-24">
              <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-2">
                24. Effective Date and Revision History
              </h2>
              <p>
                These Terms were initially established on <strong>{compliance.policyEffectiveDate}</strong> and last amended for full Cashfree Payment Gateway compliance on <strong>{compliance.policyLastUpdated}</strong>.
              </p>
            </section>
          </main>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
};
