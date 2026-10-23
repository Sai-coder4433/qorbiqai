import React from 'react';
import { Link } from 'react-router-dom';
import {
  QrCode,
  Sparkles,
  MessageSquare,
  BarChart3,
  Building2,
  CheckCircle2,
  ArrowRight,
  Shield,
  Smartphone,
  Check,
  HelpCircle,
  Clock,
  Layers,
  Settings,
  Languages
} from 'lucide-react';
import { PublicNavbar } from '../components/public/PublicNavbar.tsx';
import { PublicFooter } from '../components/public/PublicFooter.tsx';

export const FeaturesPage: React.FC = () => {
  const implementedFeatures = [
    {
      id: 'gbp-assistance',
      icon: Building2,
      badge: 'Profile Management',
      title: 'Google Business Profile Management Assistance',
      description: 'Streamline your Google Business Profile review presence. Connect your business location, verify your direct Google review link, and give customers a frictionless path to leave authentic feedback.',
      capabilities: [
        'Place ID verification and direct review destination link validation',
        'Single-scan access for in-store customers to your official Google review dialog',
        'Multi-business workspace organization for owners managing one or more locations',
        'Continuous link health monitoring to ensure customers never hit 404 error pages'
      ]
    },
    {
      id: 'ai-drafting',
      icon: Sparkles,
      badge: 'Assisted Responses',
      title: 'AI-Assisted Review Response Drafting',
      description: 'Generate context-aware, respectful, and professional draft responses to customer reviews in seconds using Google Gemini AI models. Every draft is presented to the business owner for human review and verification.',
      capabilities: [
        'Contextual response drafts tailored to sentiment (positive, neutral, critical)',
        'Multi-language drafting assistance in English, Hindi, and Marathi',
        'Tone customization: warm, formal, professional, or conversational',
        'Full owner control: edit, refine, or approve drafts before replying on Google'
      ]
    },
    {
      id: 'review-dashboard',
      icon: MessageSquare,
      badge: 'Centralized Operations',
      title: 'Unified Review Management Dashboard',
      description: 'Keep track of customer feedback and review assistance sessions in one centralized, intuitive interface designed specifically for local store managers and business owners.',
      capabilities: [
        'Consolidated activity timeline of customer review flows',
        'Filter reviews by customer experience topics and sentiment',
        'Internal private feedback routing to address issues before escalation',
        'One-click export of customer feedback records'
      ]
    },
    {
      id: 'dynamic-qr',
      icon: QrCode,
      badge: 'Hardware & Digital QR',
      title: 'Dynamic QR Code Generation for Review Destinations',
      description: 'Generate high-resolution dynamic QR codes that link directly to your business review destination. Update your destination URL at any time from your dashboard without ever reprinting your QR signs.',
      capabilities: [
        'Permanent dynamic routing (destination can be updated in real time)',
        'High-resolution vector SVG and ultra-crisp print-ready PNG downloads',
        'Customizable brand accents and logos embedded directly in QR graphics',
        'Countertop physical acrylic standee compatibility with NFC tap support'
      ]
    },
    {
      id: 'reputation-analytics',
      icon: BarChart3,
      badge: 'Data Insights',
      title: 'Reputation Tracking & Real-Time Analytics',
      description: 'Measure the impact of your in-store customer engagement. Track daily scan volume, peak visiting hours, device types, and review conversion rates from your analytics dashboard.',
      capabilities: [
        'Real-time scan counter and daily engagement trend charts',
        'Device and platform breakdown (iOS Safari, Android Chrome, Tablet)',
        'Customer topic popularity breakdown (Food quality, staff courtesy, ambience)',
        'Review completion rate indicators to optimize in-store staff performance'
      ]
    },
    {
      id: 'business-tools',
      icon: Settings,
      badge: 'Workspace Controls',
      title: 'Business-Level Management Tools',
      description: 'Granular controls for business profiles, staff assignments, and customizable customer survey question cards tailored to your industry niche.',
      capabilities: [
        'Customizable customer experience cards matching your industry category',
        'Staff permission management and employee tracking',
        'Pre-configured industry categories: Restaurants, Clinics, Salons, Retail, Auto',
        'Secure multi-tenant data isolation with strict Firebase role-based access'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      <PublicNavbar activePage="features" />

      {/* Hero Section */}
      <section className="py-20 lg:py-24 px-4 sm:px-6 lg:px-8 text-center max-w-4xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-bold">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span>Real, Implemented Platform Deliverables</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          Everything You Need to Manage Your <br />
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Google Reviews & Reputation
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Qorbiq AI gives modern local businesses and multi-location managers practical, AI-assisted tools to gather genuine customer reviews, draft verified responses, and track customer satisfaction.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            to="/pricing"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-xl shadow-xs shadow-blue-600/30 transition-all flex items-center gap-2"
          >
            <span>View Pricing Plans (From ₹299/mo)</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/contact"
            className="px-6 py-3 bg-white hover:bg-slate-100 text-slate-700 font-bold text-sm rounded-xl border border-slate-200 transition-colors"
          >
            Schedule a Demo
          </Link>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {implementedFeatures.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.id}
                id={feat.id}
                className="bg-white rounded-3xl p-7 border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-blue-200 transition-all flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 uppercase tracking-wider">
                      {feat.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">
                      {feat.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                      {feat.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Key Capabilities:
                    </span>
                    <ul className="space-y-2">
                      {feat.capabilities.map((cap, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{cap}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100">
                  <Link
                    to="/signup"
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group"
                  >
                    <span>Get started with this feature</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Honest Scope & AI Ethics Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl p-8 sm:p-12 text-white shadow-xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold">
            <Shield className="w-3.5 h-3.5" />
            <span>Ethical Review Guidelines & Platform Compliance</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Honest Deliverables & Truthful Platform Disclosures
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-slate-300 leading-relaxed">
            <div className="space-y-2 bg-white/5 p-4 rounded-2xl border border-white/10">
              <strong className="text-white block text-sm">Human Review Always Required</strong>
              <p>
                Our AI-assisted drafting engine provides suggestions to help business owners respond faster. AI-generated text is not automatically published to your profile without your explicit human verification and approval.
              </p>
            </div>

            <div className="space-y-2 bg-white/5 p-4 rounded-2xl border border-white/10">
              <strong className="text-white block text-sm">Strictly No Fake Reviews</strong>
              <p>
                Qorbiq AI is an assistance tool for real customers visiting your real physical location. We strictly prohibit fake review generation, bot manipulation, review gating, or deceptive practices in compliance with Google policies and consumer protection law.
              </p>
            </div>

            <div className="space-y-2 bg-white/5 p-4 rounded-2xl border border-white/10">
              <strong className="text-white block text-sm">No Publication Guarantee</strong>
              <p>
                Whether a customer review appears and remains visible on Google is solely at the discretion of Google's automated moderation and review policies. Qorbiq AI cannot guarantee review publication or rankings.
              </p>
            </div>

            <div className="space-y-2 bg-white/5 p-4 rounded-2xl border border-white/10">
              <strong className="text-white block text-sm">Independent Technology Platform</strong>
              <p>
                Qorbiq AI is an independent software tool. We are not officially affiliated with Google LLC. Google, Google Business Profile, and the Google logo are trademarks of Google LLC.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 text-center px-4 max-w-4xl mx-auto space-y-4">
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
          Ready to Elevate Your Business Reputation?
        </h2>
        <p className="text-sm text-slate-600 max-w-xl mx-auto">
          Start with our monthly plan for ₹299/mo or save with annual billing at ₹2,999/yr. Cancel recurring billing at any time.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Link
            to="/pricing"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
          >
            <span>Explore Plans & Subscribe</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            to="/contact"
            className="px-6 py-3 bg-white text-slate-700 font-bold text-xs rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            Contact Support
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};
