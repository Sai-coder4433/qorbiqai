import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Printer,
  ChevronRight,
  Lock,
  Eye,
  Database,
  FileCheck2,
  Server,
  UserCheck,
  Mail,
  Scale
} from 'lucide-react';
import { PublicNavbar } from '../components/public/PublicNavbar.tsx';
import { PublicFooter } from '../components/public/PublicFooter.tsx';
import { freshTestApi } from '../lib/fresh-test-api.ts';

export const PrivacyPolicyPage: React.FC = () => {
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
    { id: 'section-1', title: '1. Who Operates Qorbiq AI' },
    { id: 'section-2', title: '2. Information Collected During Registration' },
    { id: 'section-3', title: '3. Business and Workspace Information' },
    { id: 'section-4', title: '4. Contact and Support Enquiries' },
    { id: 'section-5', title: '5. Subscription and Transaction Metadata' },
    { id: 'section-6', title: '6. Cashfree Payment Processing Disclosures' },
    { id: 'section-7', title: '7. Google Business Profile Data' },
    { id: 'section-8', title: '8. Review Text and AI-Generated Content' },
    { id: 'section-9', title: '9. QR Code Destinations and Scan Analytics' },
    { id: 'section-10', title: '10. Cookies, Authentication & Essential Logs' },
    { id: 'section-11', title: '11. Purposes and Lawful Grounds for Processing' },
    { id: 'section-12', title: '12. Third-Party Service Providers' },
    { id: 'section-13', title: '13. Data Storage, Retention and Deletion' },
    { id: 'section-14', title: '14. Security Measures and Encryption' },
    { id: 'section-15', title: '15. User Rights: Access, Correction & Deletion' },
    { id: 'section-16', title: '16. Marketing Communications & Opt-Out' },
    { id: 'section-17', title: '17. Protection of Children / Minors' },
    { id: 'section-18', title: '18. Cross-Border & International Data Transfers' },
    { id: 'section-19', title: '19. Policy Updates and Notifications' },
    { id: 'section-20', title: '20. Contact Details for Privacy & Grievances' }
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
      <PublicNavbar activePage="privacy" />

      {/* Header Banner */}
      <section className="bg-white border-b border-slate-200 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
              <Shield className="w-3.5 h-3.5 text-blue-600" />
              <span>Data Protection & Privacy Transparency</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Privacy Policy
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
              to="/terms"
              className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl border border-blue-200 transition-colors flex items-center gap-1.5"
            >
              <span>Terms of Service</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content with Sticky Table of Contents */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Sticky Table of Contents (4 cols) */}
          <aside className="hidden lg:block lg:col-span-4 sticky top-24 space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs max-h-[calc(100vh-120px)] overflow-y-auto">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-3">
                Privacy Sections (20 Topics)
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

          {/* Policy Text Content (8 cols) */}
          <main className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-2xs space-y-10 text-xs text-slate-700 leading-relaxed">
            {/* Introduction Overview Card */}
            <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-200/80 text-blue-900 text-xs space-y-2">
              <strong className="font-bold block text-sm flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-600" />
                <span>Our Privacy Commitment</span>
              </strong>
              <p className="leading-relaxed text-[11px] text-blue-800">
                At <strong>Qorbiq AI</strong>, we value the trust you place in our business reputation platform. This Privacy Policy describes transparently how we collect, process, store, and safeguard your personal and business data when you use our website, subscribe to our SaaS plans, scan our dynamic QR codes, or interact with our services.
              </p>
            </div>

            {/* SECTION 1 */}
            <section id="section-1" className="space-y-3 scroll-mt-24">
              <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-2">
                1. Who Operates Qorbiq AI
              </h2>
              <p>
                Qorbiq AI ("we", "our", or "us") is operated by <strong>{compliance.legalBusinessName}</strong>, having its principal operational location at {compliance.address}. We act as the data controller for account registration and billing information, and as a data processor for business review assistance data configured by our subscribers.
              </p>
            </section>

            {/* SECTION 2 */}
            <section id="section-2" className="space-y-3 scroll-mt-24">
              <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-2">
                2. Information Collected During Registration
              </h2>
              <p>
                When you create an account on Qorbiq AI, we collect:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Personal Identity Data:</strong> Full name, email address, contact telephone number.</li>
                <li><strong>Authentication Credentials:</strong> Securely salted password hashes managed via Google Firebase Authentication.</li>
                <li><strong>Account Role:</strong> Workspace owner, store manager, or administrator role metadata.</li>
              </ul>
            </section>

            {/* SECTION 3 */}
            <section id="section-3" className="space-y-3 scroll-mt-24">
              <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-2">
                3. Business and Workspace Information
              </h2>
              <p>
                To enable review assistance and QR routing, subscribers configure:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Commercial trade name, industry category (e.g., Restaurant, Clinic, Retail, Salon), and store location (city, state).</li>
                <li>Official Google Business Profile review destination URL and Google Place ID.</li>
                <li>Store branding assets (logo URL, preferred brand accent color, and customized customer greeting messages).</li>
              </ul>
            </section>

            {/* SECTION 4 */}
            <section id="section-4" className="space-y-3 scroll-mt-24">
              <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-2">
                4. Contact and Support Enquiries
              </h2>
              <p>
                When you submit an inquiry via our Contact Us form, email our support desk (<a href={`mailto:${compliance.supportEmail}`} className="text-blue-600 font-bold hover:underline">{compliance.supportEmail}</a>), or phone our helpline, we record your name, email, phone number, category of inquiry, and message content to respond to your request and maintain audit records.
              </p>
            </section>

            {/* SECTION 5 */}
            <section id="section-5" className="space-y-3 scroll-mt-24">
              <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-2">
                5. Subscription and Transaction Metadata
              </h2>
              <p>
                When you purchase a Qorbiq AI Monthly (₹299/mo) or Yearly (₹2,999/yr) subscription, we store:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Unique invoice numbers (e.g. QOR-2026-0001), transaction timestamp, amount paid (INR), and tax amounts.</li>
                <li>Selected billing cycle (Monthly or Yearly) and subscription renewal timestamps.</li>
                <li>Registered billing address provided for tax invoice generation.</li>
              </ul>
            </section>

            {/* SECTION 6 */}
            <section id="section-6" className="space-y-3 scroll-mt-24">
              <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-2">
                6. Cashfree Payment Processing Disclosures
              </h2>
              <p>
                All online transactions and recurring mandates are processed through <strong>Cashfree Payments India Pvt. Ltd.</strong> ("Cashfree"):
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>No Card Storage:</strong> Qorbiq AI does NOT store, process, or have access to your full credit card numbers, debit card numbers, CVVs, or online banking passwords.</li>
                <li><strong>Payment Tokens:</strong> Cashfree transmits cryptographic payment reference IDs, order session IDs, and mandate authorization tokens to our server.</li>
                <li><strong>PCI-DSS Compliance:</strong> All cardholder transactions are handled under Cashfree's PCI-DSS Level 1 certified environment with 256-bit TLS encryption.</li>
              </ul>
            </section>

            {/* SECTION 7 */}
            <section id="section-7" className="space-y-3 scroll-mt-24">
              <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-2">
                7. Google Business Profile Data
              </h2>
              <p>
                Qorbiq AI accesses Google Business Profile information only to the exact extent supplied by the business owner (namely your public review destination URL, place name, and place ID). We do not access, alter, or extract your Google account private data, passwords, or personal Google drive files.
              </p>
            </section>

            {/* SECTION 8 */}
            <section id="section-8" className="space-y-3 scroll-mt-24">
              <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-2">
                8. Review Text and AI-Generated Content
              </h2>
              <p>
                When drafting responses to reviews, snippets of the review text and chosen sentiment topics are processed via Google Gemini AI models through encrypted API requests. We do not use your private customer feedback to train public consumer foundation models. AI response suggestions are stored privately in your workspace database.
              </p>
            </section>

            {/* SECTION 9 */}
            <section id="section-9" className="space-y-3 scroll-mt-24">
              <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-2">
                9. QR Code Destinations and Scan Analytics
              </h2>
              <p>
                When in-store visitors scan your dynamic QR code (routed through /r/:code):
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>We record aggregated, privacy-preserving technical metadata: timestamp, browser family (Chrome/Safari), operating system (iOS/Android), and general device category.</li>
                <li>We do NOT track the personal identity, personal name, or precise GPS location of scanning customers without their consent.</li>
              </ul>
            </section>

            {/* SECTION 10 */}
            <section id="section-10" className="space-y-3 scroll-mt-24">
              <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-2">
                10. Cookies, Authentication & Essential Logs
              </h2>
              <p>
                We use strictly essential authentication cookies and session tokens (via Firebase Auth) required to keep you securely signed in to your dashboard. We do not deploy third-party advertising tracking cookies or sell your browsing history to data brokers.
              </p>
            </section>

            {/* SECTION 11 */}
            <section id="section-11" className="space-y-3 scroll-mt-24">
              <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-2">
                11. Purposes and Lawful Grounds for Processing
              </h2>
              <p>
                We process your information under the following lawful grounds:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Contractual Performance:</strong> Providing SaaS features, activating dynamic QR codes, issuing verified tax invoices, and delivering paid subscription services.</li>
                <li><strong>Legal & Tax Compliance:</strong> Maintaining statutory financial records, issuing GST tax invoices, and cooperating with lawful government inquiries.</li>
                <li><strong>Legitimate Interests:</strong> Preventing fraud, detecting automated bot attacks, ensuring platform uptime, and improving user experience.</li>
              </ul>
            </section>

            {/* SECTION 12 */}
            <section id="section-12" className="space-y-3 scroll-mt-24">
              <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-2">
                12. Third-Party Service Providers
              </h2>
              <p>
                We partner with trusted, industry-standard infrastructure providers to deliver Qorbiq AI:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Google Firebase:</strong> User authentication, secure token generation, and real-time Firestore database synchronization.</li>
                <li><strong>Cashfree Payments India Pvt. Ltd.:</strong> Electronic payment gateway, UPI Autopay, and recurring subscription mandates.</li>
                <li><strong>Google Cloud (Gemini API):</strong> Contextual review response drafting suggestions.</li>
                <li><strong>Cloudflare:</strong> Global CDN routing, DDoS mitigation, and SSL/TLS edge certificate termination.</li>
              </ul>
            </section>

            {/* SECTION 13 */}
            <section id="section-13" className="space-y-3 scroll-mt-24">
              <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-2">
                13. Data Storage, Retention and Deletion
              </h2>
              <p>
                Account and workspace data is retained for the duration of your active subscription. If an account is cancelled or deleted, customer data is purged from our production databases within 90 days, except where statutory financial retention obligations (e.g., tax invoices) require retention under Indian law.
              </p>
            </section>

            {/* SECTION 14 */}
            <section id="section-14" className="space-y-3 scroll-mt-24">
              <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-2">
                14. Security Measures and Encryption
              </h2>
              <p>
                We implement comprehensive technical and organizational security controls:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>End-to-end transport layer encryption (HTTPS/TLS 1.3) for all web traffic and API interactions.</li>
                <li>Strict server-side role-based access control (RBAC) preventing unauthorized access between multi-tenant workspaces.</li>
                <li>Regular automated backups and cryptographic secret separation preventing database credential exposure.</li>
              </ul>
            </section>

            {/* SECTION 15 */}
            <section id="section-15" className="space-y-3 scroll-mt-24">
              <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-2">
                15. User Rights: Access, Correction & Deletion
              </h2>
              <p>
                Subscribers have the right to:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Access all personal data and workspace details recorded in their profile.</li>
                <li>Correct inaccurate business addresses, contact numbers, or profile information.</li>
                <li>Request complete account deletion and data erasure by emailing <a href={`mailto:${compliance.supportEmail}`} className="text-blue-600 font-bold hover:underline">{compliance.supportEmail}</a>.</li>
              </ul>
            </section>

            {/* SECTION 16 */}
            <section id="section-16" className="space-y-3 scroll-mt-24">
              <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-2">
                16. Marketing Communications & Opt-Out
              </h2>
              <p>
                We may occasionally send operational service announcements, security alerts, and invoice summaries to your registered email. You may opt out of non-essential marketing emails at any time by clicking the unsubscribe link or contacting support.
              </p>
            </section>

            {/* SECTION 17 */}
            <section id="section-17" className="space-y-3 scroll-mt-24">
              <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-2">
                17. Protection of Children / Minors
              </h2>
              <p>
                Qorbiq AI is a commercial B2B software tool intended exclusively for business owners and adult professionals. We do not knowingly collect personal information from individuals under 18 years of age.
              </p>
            </section>

            {/* SECTION 18 */}
            <section id="section-18" className="space-y-3 scroll-mt-24">
              <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-2">
                18. Cross-Border & International Data Transfers
              </h2>
              <p>
                Our primary database servers and cloud infrastructure are hosted in enterprise data centers complying with applicable data sovereignty guidelines. In instances where third-party APIs (e.g. Google Cloud Gemini) process queries internationally, data transfers are protected under standard contractual clauses.
              </p>
            </section>

            {/* SECTION 19 */}
            <section id="section-19" className="space-y-3 scroll-mt-24">
              <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-2">
                19. Policy Updates and Notifications
              </h2>
              <p>
                We reserve the right to amend this Privacy Policy periodically. Any material modifications will be posted to this page with an updated "Last Updated" timestamp. We encourage you to review this policy periodically.
              </p>
            </section>

            {/* SECTION 20 */}
            <section id="section-20" className="space-y-3 scroll-mt-24">
              <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-2">
                20. Contact Details for Privacy & Grievances
              </h2>
              <p>
                If you have questions, concerns, or requests regarding this Privacy Policy or wish to exercise your data protection rights, please contact our Grievance Officer:
              </p>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs text-slate-700">
                <p><strong>Platform:</strong> {compliance.brandName}</p>
                <p><strong>Operating Entity:</strong> {compliance.legalBusinessName}</p>
                <p><strong>Privacy Email:</strong> <a href={`mailto:${compliance.supportEmail}`} className="text-blue-600 hover:underline">{compliance.supportEmail}</a></p>
                <p><strong>Postal Address:</strong> {compliance.address}</p>
              </div>
            </section>
          </main>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
};
