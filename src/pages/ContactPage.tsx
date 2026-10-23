import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Building2,
  HelpCircle,
  FileQuestion,
  Sparkles
} from 'lucide-react';
import { PublicNavbar } from '../components/public/PublicNavbar.tsx';
import { PublicFooter } from '../components/public/PublicFooter.tsx';
import { freshTestApi } from '../lib/fresh-test-api.ts';

interface ComplianceSettings {
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
  slaResponseHours?: number;
  contactCategories?: string[];
}

export const ContactPage: React.FC = () => {
  const [settings, setSettings] = useState<ComplianceSettings>({
    brandName: 'Qorbiq AI',
    legalBusinessName: 'Qorbiq AI',
    supportEmail: 'support@qorbiq.ai',
    supportPhone: '+91 98765 43210',
    address: 'Level 4, Cyber City, Magarpatta',
    city: 'Pune',
    state: 'Maharashtra',
    pinCode: '411028',
    country: 'India',
    supportHours: 'Monday – Friday, 10:00 AM – 6:00 PM IST',
    websiteUrl: 'https://qorbiq.ai',
    slaResponseHours: 48,
    contactCategories: [
      'General enquiry',
      'Subscription and billing',
      'Technical support',
      'Account assistance',
      'QR/NFC product enquiry',
      'Other'
    ]
  });

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('General enquiry');
  const [message, setMessage] = useState('');
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [honeypot, setHoneypot] = useState('');

  // Status
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [referenceId, setReferenceId] = useState<string | null>(null);

  useEffect(() => {
    freshTestApi.getPublicComplianceSettings()
      .then((res: any) => {
        if (res?.complianceSettings) {
          setSettings(res.complianceSettings);
          if (res.complianceSettings.contactCategories?.length > 0) {
            setCategory(res.complianceSettings.contactCategories[0]);
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!fullName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!message.trim() || message.trim().length < 5) {
      setErrorMessage('Please enter a message of at least 5 characters.');
      return;
    }

    if (!consentAccepted) {
      setErrorMessage('Please acknowledge that you agree to our Privacy Policy.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await freshTestApi.submitContactForm({
        name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        businessName: businessName.trim() || undefined,
        category,
        message: message.trim(),
        honeypot: honeypot || undefined
      });

      setSuccessMessage(res.message || 'Your inquiry has been submitted successfully.');
      setReferenceId(res.referenceId || null);
      // Reset form
      setFullName('');
      setEmail('');
      setPhone('');
      setBusinessName('');
      setMessage('');
      setConsentAccepted(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit enquiry. Please try again or email us directly.');
    } finally {
      setSubmitting(false);
    }
  };

  const categories = settings.contactCategories || [
    'General enquiry',
    'Subscription and billing',
    'Technical support',
    'Account assistance',
    'QR/NFC product enquiry',
    'Other'
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      <PublicNavbar activePage="contact" />

      {/* Hero Header */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 text-center max-w-4xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-bold">
          <Mail className="w-3.5 h-3.5" />
          <span>Support & Customer Assistance</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
          Get in Touch with{' '}
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {settings.brandName || 'Qorbiq AI'}
          </span>
        </h1>

        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Have questions about our Google Business Profile reputation tools, ₹299/mo subscription plans, Cashfree payment mandates, or custom QR standees? Our support team is here to assist you.
        </p>
      </section>

      {/* Main Content: Info Cards & Interactive Form */}
      <section className="pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Column: Direct Contact Details & Truthful Expectations (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl p-7 border border-slate-200/90 shadow-2xs space-y-6">
              <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <span>Verified Contact Information</span>
              </h2>

              <div className="space-y-5 text-xs text-slate-600">
                {/* Email Channel */}
                {settings.supportEmail && (
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block">
                        Customer & Billing Support Email
                      </span>
                      <a
                        href={`mailto:${settings.supportEmail}`}
                        className="text-sm font-black text-slate-900 hover:text-blue-600 transition-colors break-all"
                      >
                        {settings.supportEmail}
                      </a>
                      <span className="text-slate-500 block mt-0.5 text-[11px]">
                        Primary channel for account, cancellation, and refund requests.
                      </span>
                    </div>
                  </div>
                )}

                {/* Phone Channel */}
                {settings.supportPhone && (
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block">
                        Direct Telephone Support
                      </span>
                      <a
                        href={`tel:${settings.supportPhone.replace(/\s+/g, '')}`}
                        className="text-sm font-black text-slate-900 hover:text-blue-600 transition-colors"
                      >
                        {settings.supportPhone}
                      </a>
                      <span className="text-slate-500 block mt-0.5 text-[11px]">
                        Available during standard business hours.
                      </span>
                    </div>
                  </div>
                )}

                {/* Physical Operating Office */}
                {settings.address && (
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block">
                        Operating Address
                      </span>
                      <p className="text-slate-800 font-semibold leading-relaxed text-xs">
                        {settings.address}
                        {settings.city ? `, ${settings.city}` : ''}
                        {settings.state ? `, ${settings.state}` : ''}
                        {settings.pinCode ? ` - ${settings.pinCode}` : ''}
                        {settings.country ? `, ${settings.country}` : ''}
                      </p>
                    </div>
                  </div>
                )}

                {/* Operating Business Hours */}
                {settings.supportHours && (
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block">
                        Operational Hours
                      </span>
                      <p className="text-slate-800 font-semibold text-xs">
                        {settings.supportHours}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Realistic Support SLA notice */}
              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 space-y-1.5 text-xs">
                <div className="flex items-center gap-2 text-blue-900 font-bold text-xs">
                  <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Truthful Support SLA</span>
                </div>
                <p className="text-blue-800 text-[11px] leading-relaxed">
                  We aim to acknowledge and address all support tickets, subscription enquiries, and billing questions within <strong>{settings.slaResponseHours || 48} business hours</strong>.
                </p>
              </div>
            </div>

            {/* Quick Links Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-3 text-xs">
              <h3 className="font-bold text-slate-900">Need Immediate Policy Guidance?</h3>
              <ul className="space-y-2 text-slate-600">
                <li>
                  <Link to="/refund-policy" className="text-blue-600 hover:underline flex items-center gap-1.5 font-medium">
                    <span>How to request a refund or cancel subscription</span>
                  </Link>
                </li>
                <li>
                  <Link to="/pricing" className="text-blue-600 hover:underline flex items-center gap-1.5 font-medium">
                    <span>Pricing details (₹299/mo and ₹2,999/yr)</span>
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="text-blue-600 hover:underline flex items-center gap-1.5 font-medium">
                    <span>Read our complete 24-section Terms & Conditions</span>
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column: Contact Us Form (7 Cols) */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-3xl p-7 sm:p-10 border border-slate-200/90 shadow-2xs space-y-6">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  Send Us an Inquiry
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Fill in the details below. All submissions are logged securely to our support queue.
                </p>
              </div>

              {/* Success Alert */}
              {successMessage && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <strong className="font-bold text-emerald-900 block">Enquiry Received!</strong>
                    <p>{successMessage}</p>
                    {referenceId && (
                      <span className="font-mono text-[11px] text-emerald-700 block">
                        Reference Ticket: #{referenceId}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Error Alert */}
              {errorMessage && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold text-rose-900 block">Submission Error</strong>
                    <p>{errorMessage}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Hidden Honeypot Field for anti-spam */}
                <input
                  type="text"
                  name="honeypot"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  className="hidden"
                  tabIndex={-1}
                  autoComplete="off"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5" htmlFor="fullName">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="fullName"
                      type="text"
                      required
                      placeholder="e.g. Ramesh Kulkarni"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                    />
                  </div>

                  {/* Email Address */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5" htmlFor="email">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      placeholder="ramesh@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Phone Number (Optional) */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5" htmlFor="phone">
                      Phone Number <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                    />
                  </div>

                  {/* Business Name (Optional) */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5" htmlFor="businessName">
                      Business Name <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      id="businessName"
                      type="text"
                      placeholder="e.g. Chai & Snacks Pune"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                    />
                  </div>
                </div>

                {/* Inquiry Category */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5" htmlFor="category">
                    Inquiry Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5" htmlFor="message">
                    Your Message / Query Details <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    id="message"
                    required
                    rows={4}
                    placeholder="Please describe how we can assist you. For billing or refund questions, please include your transaction ID or registered email."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all leading-relaxed"
                  />
                </div>

                {/* Privacy Consent Checkbox */}
                <div className="pt-1">
                  <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600">
                    <input
                      type="checkbox"
                      checked={consentAccepted}
                      onChange={(e) => setConsentAccepted(e.target.checked)}
                      className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>
                      I acknowledge and consent to the collection and processing of my contact information in accordance with Qorbiq AI's{' '}
                      <Link to="/privacy" target="_blank" className="text-blue-600 font-bold hover:underline">
                        Privacy Policy
                      </Link>
                      . We never sell your personal information.
                    </span>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-xs shadow-blue-600/30 hover:shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Transmitting Inquiry...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Inquiry</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};
