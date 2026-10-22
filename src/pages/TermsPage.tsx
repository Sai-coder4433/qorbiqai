import React from 'react';
import { Header, Footer } from '../components/layout/Header.tsx';

export const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#202124] mb-4">Terms of Service</h1>
        <p className="text-xs text-[#5F6368] mb-8">Last Updated: September 27, 2026</p>

        <div className="bg-white border border-[#DADCE0] p-8 rounded-2xl space-y-6 text-sm text-[#3C4043] leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-[#202124] mb-2">1. Acceptance of Terms</h2>
            <p>
              By accessing and using LOCALOS AI ("Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, you must not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#202124] mb-2">2. Google API Compliance & Review Integrity</h2>
            <p>
              LOCALOS AI operates strictly via official Google APIs (Google Business Profile, Search Console, Places API, Google Analytics). The platform strictly forbids:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-xs">
              <li>Buying, trading, or incentivizing customer reviews.</li>
              <li>Review gating: selectively soliciting positive reviews while suppressing negative feedback.</li>
              <li>Automated submission of reviews to Google consumer endpoints on behalf of third parties.</li>
              <li>Fabricating customer experiences or business statistics.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#202124] mb-2">3. Account & Token Security</h2>
            <p>
              You authorize LOCALOS AI to interact with your connected Google services using OAuth 2.0. We store tokens using AES-256-GCM encryption. We never request or store Google account passwords.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#202124] mb-2">4. AI Automation & User Responsibility</h2>
            <p>
              Gemini AI models generate drafts based on your verified business data. While we implement strict anti-hallucination guardrails, you remain responsible for final approval and compliance of published replies and content.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#202124] mb-4">Privacy Policy</h1>
        <p className="text-xs text-[#5F6368] mb-8">Last Updated: September 27, 2026</p>

        <div className="bg-white border border-[#DADCE0] p-8 rounded-2xl space-y-6 text-sm text-[#3C4043] leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-[#202124] mb-2">1. Google User Data Policy Compliance</h2>
            <p>
              LOCALOS AI's use and transfer of information received from Google APIs adheres to the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noreferrer" className="text-[#1A73E8] underline font-medium">Google API Services User Data Policy</a>, including the Limited Use requirements.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#202124] mb-2">2. Information We Access</h2>
            <p>When you authenticate with Google, we request permission to access:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-xs">
              <li><strong>Business Profile data:</strong> Locations, profile information, reviews, posts, media, and performance statistics.</li>
              <li><strong>Search Console data:</strong> Search queries, clicks, impressions, and indexation metrics.</li>
              <li><strong>Google Analytics 4:</strong> Aggregate web traffic and engagement metrics.</li>
              <li><strong>User identity:</strong> Email address for authentication and notification delivery.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#202124] mb-2">3. Data Retention & Tenant Isolation</h2>
            <p>
              All customer business records and OAuth credentials are stored in tenant-isolated databases with Row Level Security (RLS) enforcement. We do not sell your business data, reviews, or metrics to any third party.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};
