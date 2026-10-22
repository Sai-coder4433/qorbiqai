import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, ShieldCheck, Key, CheckCircle2, ArrowRight } from 'lucide-react';
import { Header, Footer } from '../components/layout/Header.tsx';

export const GoogleSetupGuidePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link to="/docs" className="text-sm font-medium text-[#1A73E8] hover:underline mb-2 inline-block">
            ← Back to Documentation
          </Link>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#202124]">
            Google Cloud & OAuth 2.0 Setup Guide
          </h1>
          <p className="mt-3 text-base text-[#5F6368]">
            Step-by-step instructions to create your official Google Cloud project, enable required APIs, and configure server-side OAuth 2.0.
          </p>
        </div>

        <div className="bg-[#E8F0FE] border border-[#D2E3FC] p-4 rounded-xl flex items-start gap-3 mb-8">
          <ShieldCheck className="w-5 h-5 text-[#1A73E8] shrink-0 mt-0.5" />
          <div className="text-xs text-[#174EA6] leading-relaxed">
            <p className="font-semibold">Security & Policy Principle:</p>
            <p className="mt-0.5">
              LOCALOS AI NEVER asks for, accepts, or stores Google passwords. Authentication is conducted solely via standard Google OAuth 2.0 with encrypted token storage.
            </p>
          </div>
        </div>

        <div className="space-y-8 bg-white border border-[#DADCE0] p-6 sm:p-8 rounded-2xl">
          {/* Step A */}
          <div>
            <h2 className="text-lg font-bold text-[#202124] flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#1A73E8] text-white text-xs flex items-center justify-center font-bold">A</span>
              Create a Google Cloud Project
            </h2>
            <p className="text-sm text-[#5F6368] mt-2">
              Navigate to the <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" className="text-[#1A73E8] underline font-medium inline-flex items-center gap-1">Google Cloud Console <ExternalLink className="w-3 h-3" /></a> and create a new project named <code>LocalOS Growth Workspace</code>.
            </p>
          </div>

          {/* Step B */}
          <div>
            <h2 className="text-lg font-bold text-[#202124] flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#1A73E8] text-white text-xs flex items-center justify-center font-bold">B</span>
              Enable the Required Google APIs
            </h2>
            <p className="text-sm text-[#5F6368] mt-2">
              In the <strong>APIs & Services &gt; Library</strong>, search for and enable the following APIs:
            </p>
            <ul className="mt-3 space-y-1.5 text-xs text-[#202124] bg-[#F8F9FA] p-4 rounded-xl border border-[#DADCE0] font-mono">
              <li>✓ My Business Account Management API</li>
              <li>✓ My Business Business Information API</li>
              <li>✓ Business Profile Performance API (businessprofileperformance.googleapis.com)</li>
              <li>✓ Places API (New) (places.googleapis.com)</li>
              <li>✓ Google Search Console API (searchconsole.googleapis.com)</li>
              <li>✓ Google Analytics Data API (analyticsdata.googleapis.com)</li>
            </ul>
          </div>

          {/* Step C */}
          <div>
            <h2 className="text-lg font-bold text-[#202124] flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#1A73E8] text-white text-xs flex items-center justify-center font-bold">C</span>
              Configure OAuth Consent Screen
            </h2>
            <p className="text-sm text-[#5F6368] mt-2">
              Go to <strong>APIs & Services &gt; OAuth consent screen</strong>:
            </p>
            <ul className="mt-2 text-sm text-[#5F6368] list-disc list-inside space-y-1">
              <li>Select <strong>External</strong> User Type.</li>
              <li>Enter your App name: <code>LOCALOS AI</code>.</li>
              <li>Provide your user support email and developer contact email.</li>
            </ul>
          </div>

          {/* Step D & E */}
          <div>
            <h2 className="text-lg font-bold text-[#202124] flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#1A73E8] text-white text-xs flex items-center justify-center font-bold">D</span>
              Create Web OAuth 2.0 Credentials
            </h2>
            <p className="text-sm text-[#5F6368] mt-2">
              Go to <strong>APIs & Services &gt; Credentials &gt; Create Credentials &gt; OAuth client ID</strong>.
            </p>
            <div className="mt-3 bg-[#F8F9FA] p-4 rounded-xl border border-[#DADCE0] space-y-2 text-xs">
              <p><strong>Application Type:</strong> Web application</p>
              <p><strong>Authorized Redirect URIs:</strong></p>
              <code className="block bg-white p-2 border border-[#DADCE0] rounded text-[#1A73E8] font-mono select-all">
                https://ais-dev-zafpzy3wltapx43zbdz52z-219700500077.asia-east1.run.app/api/google/callback
              </code>
              <p className="text-[#5F6368]">For local testing: <code>http://localhost:3000/api/google/callback</code></p>
            </div>
          </div>

          {/* Step F */}
          <div>
            <h2 className="text-lg font-bold text-[#202124] flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#1A73E8] text-white text-xs flex items-center justify-center font-bold">E</span>
              Add Official Scopes
            </h2>
            <p className="text-sm text-[#5F6368] mt-2">
              Add the following scopes to your OAuth configuration:
            </p>
            <ul className="mt-2 space-y-1 text-xs text-[#202124] bg-[#F8F9FA] p-3 rounded-lg border border-[#DADCE0] font-mono">
              <li>https://www.googleapis.com/auth/business.manage</li>
              <li>https://www.googleapis.com/auth/webmasters.readonly</li>
              <li>https://www.googleapis.com/auth/analytics.readonly</li>
              <li>https://www.googleapis.com/auth/userinfo.email</li>
            </ul>
          </div>

          {/* Step G */}
          <div>
            <h2 className="text-lg font-bold text-[#202124] flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#1A73E8] text-white text-xs flex items-center justify-center font-bold">F</span>
              Copy Client ID & Secret to Environment
            </h2>
            <p className="text-sm text-[#5F6368] mt-2">
              Once created, copy the <strong>Client ID</strong> and <strong>Client Secret</strong> into your production environment variables:
            </p>
            <pre className="mt-3 bg-[#202124] text-white p-4 rounded-xl text-xs font-mono overflow-x-auto">
{`GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-your-client-secret"
GOOGLE_REDIRECT_URI="https://your-domain.com/api/google/callback"
GOOGLE_MAPS_API_KEY="AIzaSyYourPlacesApiKey"`}
            </pre>
          </div>
        </div>

        <div className="mt-8 flex justify-between items-center">
          <Link to="/docs" className="text-sm text-[#5F6368] hover:text-[#1A73E8]">
            ← Overview
          </Link>
          <Link
            to="/admin/integrations"
            className="inline-flex items-center gap-2 text-sm font-medium text-white bg-[#1A73E8] px-5 py-2.5 rounded-lg shadow-sm hover:bg-[#1557B0]"
          >
            <span>Test Integration Status in Admin</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export const DocsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      <Header />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10 text-center max-w-2xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#202124]">
            Documentation & Developer API
          </h1>
          <p className="mt-3 text-base text-[#5F6368]">
            Learn how LOCALOS AI connects to official Google APIs, automates review replies, crawls websites, and powers multi-tenant local SEO.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            to="/docs/google-setup"
            className="bg-white border border-[#DADCE0] p-6 rounded-2xl hover:border-[#1A73E8] hover:shadow-md transition-all group"
          >
            <Key className="w-8 h-8 text-[#1A73E8] mb-3 group-hover:scale-105 transition-transform" />
            <h3 className="font-bold text-base text-[#202124]">Google Setup Guide</h3>
            <p className="text-xs text-[#5F6368] mt-1">Configure Google Cloud, OAuth 2.0 consent, and Business Profile APIs.</p>
          </Link>

          <div className="bg-white border border-[#DADCE0] p-6 rounded-2xl">
            <ShieldCheck className="w-8 h-8 text-[#34A853] mb-3" />
            <h3 className="font-bold text-base text-[#202124]">Zero-Hallucination AI</h3>
            <p className="text-xs text-[#5F6368] mt-1">Structured Gemini 3.8 prompts strictly guarded against invented facts, staff names, or discounts.</p>
          </div>

          <div className="bg-white border border-[#DADCE0] p-6 rounded-2xl">
            <CheckCircle2 className="w-8 h-8 text-[#FBBC04] mb-3" />
            <h3 className="font-bold text-base text-[#202124]">Deterministic Audits</h3>
            <p className="text-xs text-[#5F6368] mt-1">Transparent 0-100 scoring based on documented profile completeness and technical SEO criteria.</p>
          </div>
        </div>

        {/* REST API Reference summary */}
        <div className="mt-12 bg-white border border-[#DADCE0] p-6 sm:p-8 rounded-2xl">
          <h2 className="text-xl font-bold text-[#202124] mb-4">REST API Architecture</h2>
          <p className="text-sm text-[#5F6368] mb-6">
            All endpoints enforce tenant isolation, input validation, and structured error responses.
          </p>

          <div className="space-y-3 font-mono text-xs">
            <div className="flex items-center gap-3 p-2.5 bg-[#F8F9FA] rounded-lg border border-[#DADCE0]">
              <span className="font-bold text-[#1A73E8] bg-[#E8F0FE] px-2 py-0.5 rounded">GET</span>
              <span className="text-[#202124]">/api/reviews?businessId=:id&filter=UNREPLIED</span>
            </div>
            <div className="flex items-center gap-3 p-2.5 bg-[#F8F9FA] rounded-lg border border-[#DADCE0]">
              <span className="font-bold text-[#137333] bg-[#E6F4EA] px-2 py-0.5 rounded">POST</span>
              <span className="text-[#202124]">/api/reviews/:id/generate-reply</span>
            </div>
            <div className="flex items-center gap-3 p-2.5 bg-[#F8F9FA] rounded-lg border border-[#DADCE0]">
              <span className="font-bold text-[#137333] bg-[#E6F4EA] px-2 py-0.5 rounded">POST</span>
              <span className="text-[#202124]">/api/seo/crawl</span>
            </div>
            <div className="flex items-center gap-3 p-2.5 bg-[#F8F9FA] rounded-lg border border-[#DADCE0]">
              <span className="font-bold text-[#1A73E8] bg-[#E8F0FE] px-2 py-0.5 rounded">GET</span>
              <span className="text-[#202124]">/api/search-console/analytics?businessId=:id</span>
            </div>
            <div className="flex items-center gap-3 p-2.5 bg-[#F8F9FA] rounded-lg border border-[#DADCE0]">
              <span className="font-bold text-[#137333] bg-[#E6F4EA] px-2 py-0.5 rounded">POST</span>
              <span className="text-[#202124]">/api/rank-grid/scan</span>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
