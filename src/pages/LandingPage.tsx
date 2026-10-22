import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  QrCode,
  ArrowRight,
  ShieldCheck,
  Star,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles,
  Smartphone,
  BarChart3,
  ExternalLink,
  ChevronRight,
  Building2,
  Check,
  MessageSquareQuote,
  Clock,
  HeartHandshake,
  Copy,
  Languages,
  Phone,
  Mail,
  MapPin,
  Send,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { freshTestApi } from '../lib/fresh-test-api.ts';

export const LandingPage: React.FC = () => {
  const [inquiryName, setInquiryName] = useState('');
  const [inquiryBusiness, setInquiryBusiness] = useState('');
  const [inquiryPhone, setInquiryPhone] = useState('');
  const [inquiryEmail, setInquiryEmail] = useState('');
  const [inquiryCategory, setInquiryCategory] = useState('Restaurant');
  const [inquiryCity, setInquiryCity] = useState('');
  const [inquiryGoogleUrl, setInquiryGoogleUrl] = useState('');
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [inquiryLoading, setInquiryLoading] = useState(false);
  const [inquirySubmitted, setInquirySubmitted] = useState(false);
  const [inquiryError, setInquiryError] = useState('');

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryName.trim() || !inquiryBusiness.trim() || !inquiryPhone.trim() || !inquiryEmail.trim()) {
      setInquiryError('Please fill in your name, business name, phone number, and email.');
      return;
    }

    setInquiryLoading(true);
    setInquiryError('');
    try {
      await freshTestApi.submitLandingInquiry({
        name: inquiryName.trim(),
        businessName: inquiryBusiness.trim(),
        phone: inquiryPhone.trim(),
        email: inquiryEmail.trim(),
        category: inquiryCategory,
        city: inquiryCity.trim() || 'Local',
        googleBusinessUrl: inquiryGoogleUrl.trim() || undefined,
        message: inquiryMessage.trim() || undefined
      });
      setInquirySubmitted(true);
    } catch (err: any) {
      setInquiryError(err.message || 'Failed to submit inquiry. Please try again.');
    } finally {
      setInquiryLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* 1. Header / Navigation */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 h-16 flex items-center justify-between px-6 lg:px-12">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-xs">
            <QrCode className="w-4 h-4" />
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-slate-900 block leading-tight">
              ReviewFlow AI
            </span>
            <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
              Google Review Assistant
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
          <a href="#how-it-works" className="hover:text-blue-600 transition-colors">How It Works</a>
          <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
          <Link to="/pricing" className="hover:text-blue-600 transition-colors">Pricing</Link>
          <a href="#security" className="hover:text-blue-600 transition-colors">Security</a>
          <a href="#faq" className="hover:text-blue-600 transition-colors">FAQ</a>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="text-xs font-semibold text-slate-700 hover:text-blue-600 px-3 py-2 transition-colors"
          >
            Sign In
          </Link>
          <Link
            to="/signup"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
          >
            <span>Create Account</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* 2. Hero Section (Section 13) */}
      <section className="py-20 lg:py-28 px-6 text-center max-w-5xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Production QR Customer Review Assistance SaaS</span>
        </div>

        {/* Section 13 Headline */}
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 leading-[1.12]">
          Turn Genuine Customer Experiences <br className="hidden sm:block" />
          <span className="text-blue-600">Into Better Reviews.</span>
        </h1>

        {/* Section 13 Supporting text */}
        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Give your customers a simple way to share their real experience, create a polished review draft, copy it, and continue directly to your Google Review page.
        </p>

        {/* CTA Buttons (Section 13) */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <Link
            to="/signup"
            className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
          >
            <span>Create Free Account</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/login"
            className="w-full sm:w-auto px-7 py-3.5 bg-white border border-slate-200 hover:bg-slate-50 font-semibold text-sm text-slate-800 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs"
          >
            <span>Sign In</span>
          </Link>
          <a
            href="#how-it-works"
            className="w-full sm:w-auto px-6 py-3.5 text-slate-500 hover:text-slate-800 font-semibold text-sm transition-colors flex items-center justify-center"
          >
            <span>See How It Works &darr;</span>
          </a>
        </div>

        {/* Non-promissory positioning badge (Section 13 & 45) */}
        <div className="pt-6">
          <p className="text-[11px] text-slate-400 font-medium">
            100% Google Review Policy Compliant • Never automates submissions • No review gating • Strictly honest customer feedback
          </p>
        </div>
      </section>

      {/* 3. How It Works (Section 1 & 13) */}
      <section id="how-it-works" className="py-16 bg-white border-y border-slate-200 px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Simple Process</span>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">How ReviewFlow Works</h2>
            <p className="text-sm text-slate-600">
              From scanning a desk stand to drafting genuine words and opening Google Review in under 30 seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 font-black text-base flex items-center justify-center">
                1
              </div>
              <h3 className="font-bold text-base text-slate-900">Place QR in Shop</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Configure your verified Google Review link, print your branded QR stand, and place it at your billing counter or tables.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 font-black text-base flex items-center justify-center">
                2
              </div>
              <h3 className="font-bold text-base text-slate-900">Customer Scans</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Customer scans the QR code with their mobile camera. No app download or customer registration required.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 font-black text-base flex items-center justify-center">
                3
              </div>
              <h3 className="font-bold text-base text-slate-900">AI Drafts Their Words</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                The customer describes their genuine experience. ReviewFlow rewrites only what they wrote into a polished, natural draft.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 font-black text-base flex items-center justify-center">
                4
              </div>
              <h3 className="font-bold text-base text-slate-900">Direct Google Review</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Customer copies the draft, clicks Open Google Review, and pastes their review. They independently decide whether to publish.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Why Businesses Use ReviewFlow (Section 13) */}
      <section className="py-20 px-6 max-w-6xl mx-auto space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">The Problem Solved</span>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Why Local Businesses Choose ReviewFlow</h2>
          <p className="text-sm text-slate-600">
            Customers genuinely appreciate your service, but typing a helpful Google review from a phone keyboard is tedious.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-7 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <MessageSquareQuote className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Solves "Writer's Block"</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Most happy customers leave only stars without text. ReviewFlow helps them express their authentic experience in clear sentences.
            </p>
          </div>

          <div className="bg-white p-7 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Languages className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Multi-Language Comfort</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Customers can speak or write in English, Hindi, Marathi, and more. Wording drafts adapt naturally to regional linguistic preferences.
            </p>
          </div>

          <div className="bg-white p-7 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Strictly Anti-Hallucination</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Our AI never invents facts, staff behaviour, or false claims. It strictly polishes what the customer explicitly experienced.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Features (Section 13) */}
      <section id="features" className="py-20 bg-slate-100/70 border-y border-slate-200 px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Everything Included</span>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Built For Local Commercial Success</h2>
            <p className="text-sm text-slate-600">
              Production-ready tools to turn in-store footfall into authentic online reputation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: QrCode,
                title: 'Trackable QR Codes',
                desc: 'Generate multiple location stands (Billing Counter, Entrance, Takeaway, Tables) with distinct scan counts.'
              },
              {
                icon: ExternalLink,
                title: 'Direct Google Destination',
                desc: 'Opens the exact official Google review window for your verified business in one click.'
              },
              {
                icon: Sparkles,
                title: 'Regenerate Draft Engine',
                desc: 'Customers can click Regenerate Draft to view fresh alternative phrasings without changing factual content.'
              },
              {
                icon: Copy,
                title: 'One-Click Clipboard Copy',
                desc: 'Instant tactile feedback on mobile devices so customers can paste easily into Google.'
              },
              {
                icon: BarChart3,
                title: 'Honest Journey Analytics',
                desc: 'Track QR Scans, Page Opens, AI Drafts, and Google Clicks separately without misleading metrics.'
              },
              {
                icon: Lock,
                title: 'Strict Multi-Tenant Isolation',
                desc: 'Zero data leakage. Every business account, QR code, and usage metric is strictly isolated.'
              }
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900">{f.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. Main Plan (Section 11 & 13) */}
      <section className="py-20 px-6 max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Simple Transparent Pricing</span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">One Plan. Everything You Need.</h2>
          <p className="text-sm text-slate-600">
            No tiered artificial restrictions. The complete ReviewFlow experience under a single monthly plan.
          </p>
        </div>

        {/* REVIEWFLOW PRO CARD (Section 11) */}
        <div className="bg-white rounded-3xl border-2 border-blue-600 p-8 sm:p-10 shadow-xl space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-blue-600 text-white font-bold text-[10px] uppercase tracking-widest px-4 py-1 rounded-bl-xl">
            Main Launch Plan
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <h3 className="text-2xl font-black text-slate-900">ReviewFlow Pro</h3>
              <p className="text-xs text-slate-600 mt-1 max-w-md">
                “Turn every genuine customer experience into a better-written review draft — and make your Google Review journey simple.”
              </p>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-4xl font-black text-slate-900">$49 <span className="text-sm text-slate-500 font-normal">/ mo</span></div>
              <span className="text-[11px] text-emerald-600 font-semibold">14-Day Full Testing Experience</span>
            </div>
          </div>

          {/* Included Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs text-slate-700">
            {[
              'Unlimited business profile management',
              'QR Review System with high-res PNG/SVG',
              'Up to 5 Trackable QR code stands',
              '500 AI-assisted review drafts / month',
              'Direct Google Review destination link',
              'Multi-language support (English, Hindi, Marathi)',
              'Regenerate Draft with alternative phrasings',
              'One-click Copy & direct Google Review open',
              'Mobile-friendly customer experience (No app needed)',
              'QR analytics & placement tracking',
              'Business performance dashboard',
              'Strict multi-tenant Firebase security'
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-blue-600 shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>

          <div className="pt-4">
            <Link
              to="/signup"
              className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm sm:text-base rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 hover:scale-[1.01]"
            >
              <span>Start With ReviewFlow Pro</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="text-center text-[11px] text-slate-400 mt-2.5">
              Instant activation • Test checkout available • Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* 7. Business Categories (Section 13) */}
      <section className="py-16 bg-white border-y border-slate-200 px-6">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-1.5">
            <h2 className="text-2xl font-black text-slate-900">Tailored For Every Local Category</h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Adapts customer draft wording appropriately to your trade and service nuances.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-center text-xs">
            {[
              { icon: '💎', name: 'Jewellery & Gold' },
              { icon: '🍽️', name: 'Restaurants & Cafes' },
              { icon: '💇', name: 'Salons & Spas' },
              { icon: '🚗', name: 'Auto & Garages' },
              { icon: '👗', name: 'Clothing Retail' },
              { icon: '📱', name: 'Electronics & Mobile' },
              { icon: '🩺', name: 'Clinics & Doctors' },
              { icon: '🏨', name: 'Hotels & Lodging' },
              { icon: '🛒', name: 'Grocery & Marts' },
              { icon: '💼', name: 'Professional Services' },
              { icon: '🏋️', name: 'Gyms & Fitness' },
              { icon: '🏢', name: 'Other Local Shops' }
            ].map((cat, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div className="text-2xl">{cat.icon}</div>
                <div className="font-bold text-slate-800">{cat.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Coming Soon Features (Section 12 & 13) */}
      <section className="py-16 px-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Future Roadmap</span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Coming Soon</h2>
          </div>
          <span className="px-3 py-1 bg-amber-100 text-amber-800 border border-amber-200 rounded-full text-[10px] font-bold uppercase">
            In Active Development
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              title: 'Google Business Profile 2-Way Sync',
              desc: 'Official GBP API integration to automatically display verified published reviews.'
            },
            {
              title: 'Multi-Location Enterprise Scope',
              desc: 'Centralized controls and franchise role permissions across dozens of physical branches.'
            },
            {
              title: 'Automated Post-Visit WhatsApp',
              desc: 'Follow-up customer review assistance links triggered automatically after checkout.'
            }
          ].map((item, i) => (
            <div key={i} className="p-5 rounded-3xl bg-white border border-slate-200 space-y-2 opacity-80">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-xs text-slate-900">{item.title}</h3>
                <Clock className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 9. Security Section (Section 13 & 37) */}
      <section id="security" className="py-16 bg-slate-900 text-white px-6">
        <div className="max-w-4xl mx-auto space-y-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Enterprise Multi-Tenant Security</h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
              Every client's QR codes, business settings, and analytics metrics are isolated using server-side authorization and strict Cloud Firestore Security Rules.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left text-xs">
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-1">
              <span className="font-bold text-blue-400 block">Server-Side AI API</span>
              <p className="text-slate-400 leading-relaxed">No private AI keys are ever exposed in frontend client code.</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-1">
              <span className="font-bold text-blue-400 block">Zero Customer Tracking</span>
              <p className="text-slate-400 leading-relaxed">Customers do not provide phone numbers, emails, or personal credentials.</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-1">
              <span className="font-bold text-blue-400 block">Isolated Super Admin</span>
              <p className="text-slate-400 leading-relaxed">Separate gateway with server-managed custom claims and audit logging.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 9.5 Section 8: Interested in ReviewFlow? Inquiry Form */}
      <section id="inquiry" className="py-20 px-6 max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            Get In Touch
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Interested in ReviewFlow?
          </h2>
          <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
            Speak directly with our team to explore tailored QR setups, multi-branch plans, and custom AI experience modeling.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10">
          {inquirySubmitted ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-50">
                <Check className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">Thank you. Our team will contact you shortly.</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                We've received your business inquiry. A sales specialist will reach out within 24 hours to guide you through your setup.
              </p>
              <button
                type="button"
                onClick={() => setInquirySubmitted(false)}
                className="mt-4 px-6 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
              >
                Submit another inquiry
              </button>
            </div>
          ) : (
            <form onSubmit={handleInquirySubmit} className="space-y-6">
              {inquiryError && (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{inquiryError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={inquiryName}
                    onChange={(e) => setInquiryName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Business Name *</label>
                  <input
                    type="text"
                    required
                    value={inquiryBusiness}
                    onChange={(e) => setInquiryBusiness(e.target.value)}
                    placeholder="e.g. Spice Symphony Fine Dine"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Phone *</label>
                  <input
                    type="tel"
                    required
                    value={inquiryPhone}
                    onChange={(e) => setInquiryPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Email *</label>
                  <input
                    type="email"
                    required
                    value={inquiryEmail}
                    onChange={(e) => setInquiryEmail(e.target.value)}
                    placeholder="rahul@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Business Category *</label>
                  <input
                    type="text"
                    required
                    value={inquiryCategory}
                    onChange={(e) => setInquiryCategory(e.target.value)}
                    placeholder="e.g. Restaurant, Dental Clinic, Salon"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">City *</label>
                  <input
                    type="text"
                    required
                    value={inquiryCity}
                    onChange={(e) => setInquiryCity(e.target.value)}
                    placeholder="e.g. Mumbai, Pune, Delhi"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Current Google Business Profile Link</span>
                  <span className="text-[11px] text-slate-400 font-normal">Optional</span>
                </label>
                <input
                  type="url"
                  value={inquiryGoogleUrl}
                  onChange={(e) => setInquiryGoogleUrl(e.target.value)}
                  placeholder="e.g. https://g.page/r/your-shop/review"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Message</label>
                <textarea
                  rows={3}
                  value={inquiryMessage}
                  onChange={(e) => setInquiryMessage(e.target.value)}
                  placeholder="Tell us about your business, current review goals, or any specific questions..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:border-blue-600 focus:outline-none resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={inquiryLoading}
                  className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {inquiryLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{inquiryLoading ? 'Submitting...' : 'Submit Inquiry'}</span>
                  {!inquiryLoading && <ArrowRight className="w-4 h-4" />}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* 10. FAQ Section (Section 13) */}
      <section id="faq" className="py-20 px-6 max-w-4xl mx-auto space-y-10">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Got Questions?</span>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-4">
          {[
            {
              q: 'Does ReviewFlow AI automatically publish reviews to Google?',
              a: 'Never. ReviewFlow AI assists the customer in drafting their genuine experience into a clear, editable review. The customer copies the draft, clicks Open Google Review, and independently decides whether to publish it on Google.'
            },
            {
              q: 'Is there any review gating (filtering negative feedback)?',
              a: 'No. ReviewFlow strictly complies with Google review guidelines. The "Open Google Review" button is always available and enabled, whether the customer had a positive, neutral, or critical experience.'
            },
            {
              q: 'What Google URL should I configure in the dashboard?',
              a: 'You should configure the direct Google Review link generated by your Google Business Profile (e.g. g.page/r/.../review). Our onboarding wizard provides step-by-step guidance and a direct verification test button.'
            },
            {
              q: 'Can the AI hallucinate or invent fake compliments?',
              a: 'No. Our server prompt strictly enforces that the draft must only reflect facts explicitly provided by the customer. It will never invent purchases, staff behaviour, or false claims.'
            },
            {
              q: 'Can I download vector QR codes for printing metal or acrylic stands?',
              a: 'Yes. ReviewFlow provides one-click high-resolution PNG and vector SVG downloads, as well as a pre-designed printable table stand card template.'
            }
          ].map((faq, i) => (
            <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 space-y-2">
              <h3 className="font-bold text-sm sm:text-base text-slate-900">{faq.q}</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 11. Final CTA (Section 13) */}
      <section className="py-16 bg-blue-600 text-white px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            Ready To Make Your Google Review Journey Simple?
          </h2>
          <p className="text-sm sm:text-base text-blue-100 max-w-xl mx-auto leading-relaxed">
            Create your business profile, set your direct review link, generate your shop QR stand, and help your customers share their genuine story today.
          </p>
          <div className="pt-2">
            <Link
              to="/pricing"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-700 font-bold text-sm sm:text-base rounded-2xl shadow-lg hover:bg-blue-50 transition-all hover:scale-[1.02]"
            >
              <span>Start With ReviewFlow Pro</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 12. Footer (Section 13) */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-6 border-t border-slate-800 text-xs">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
              <QrCode className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm text-white">ReviewFlow AI</span>
          </div>

          <div className="flex items-center gap-6 text-slate-400">
            <Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link to="/login" className="hover:text-white transition-colors">Client Login</Link>
            <Link to="/crm/login" className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors">
              Sales CRM Portal
            </Link>
            <Link to="/super-admin/login" className="text-purple-400 hover:text-purple-300 font-semibold transition-colors">
              Super Admin Gateway
            </Link>
          </div>

          <div className="text-[11px] text-slate-500">
            &copy; {new Date().getFullYear()} ReviewFlow AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};
