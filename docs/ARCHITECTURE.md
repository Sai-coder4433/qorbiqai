# LOCALOS AI - Production Architecture

## 1. System Overview
LOCALOS AI is a production-grade multi-tenant SaaS platform built to unify Local Presence, Google Business Profile (GBP) Management, AI-driven Review Generation, Reputation Protection, Website Building, and Growth Automations for local businesses and marketing agencies.

```
                                  ┌──────────────────────────────┐
                                  │   Cloudflare Edge Network    │
                                  │   (DNS, SSL, CDN, Workers)   │
                                  └──────────────┬───────────────┘
                                                 │
                   ┌─────────────────────────────┴────────────────────────────┐
                   ▼                                                          ▼
    ┌──────────────────────────────┐                           ┌──────────────────────────────┐
    │     Client Applications      │                           │      Public Landing &        │
    │  app.localos.ai / admin.*    │                           │    Public Review / Websites │
    │  (React 19, TS, Tailwind v4) │                           │     /r/:slug, /:siteSlug     │
    └──────────────┬───────────────┘                           └──────────────┬───────────────┘
                   │                                                          │
                   └─────────────────────────────┬────────────────────────────┘
                                                 ▼
                                  ┌──────────────────────────────┐
                                  │   LOCALOS API & Edge Layer   │
                                  │  - Auth & RBAC Interceptor   │
                                  │  - Rate Limiter & App Check  │
                                  │  - Idempotency & Queueing    │
                                  └──────────────┬───────────────┘
                                                 │
          ┌──────────────────────────────────────┼──────────────────────────────────────┐
          ▼                                      ▼                                      ▼
┌──────────────────┐                   ┌──────────────────┐                   ┌──────────────────┐
│  Firebase Auth   │                   │  Cloud Firestore │                   │  External APIs   │
│  - Email/Pass    │                   │  - Multi-Tenant  │                   │  - Google GBP    │
│  - Google OAuth  │                   │  - Realtime Sync │                   │  - Gemini 3.8    │
│  - App Check     │                   │  - Strict Rules  │                   │  - Razorpay      │
└──────────────────┘                   └──────────────────┘                   └──────────────────┘
```

---

## 2. Frontend Architecture
- **Framework:** React 19 + TypeScript + Vite.
- **Styling:** Tailwind CSS v4 with curated Google-inspired commercial palette:
  - Primary Blue: `#1A73E8`
  - Text Primary: `#202124`
  - Text Secondary: `#5F6368`
  - Surface Border: `#E0E3E7`
- **Routing:** `react-router-dom` with strict multi-tenant separation:
  - Public marketing: `/`, `/features`, `/solutions`, `/pricing`, `/about`, `/docs`, `/terms`, `/privacy`, `/login`, `/signup`
  - Client application: `/app/*` (`/app/dashboard`, `/app/reviews`, `/app/review-online`, `/app/website`, `/app/billing`, `/app/automations`, etc.)
  - Super Admin: `/admin/*` (`/admin/organizations`, `/admin/users`, `/admin/integrations`, `/admin/api-health`, `/admin/audit-logs`, etc.)
  - Public Review Experience: `/r/:businessSlug`
  - Customer Websites: `/:businessSlug` with custom domain routing support
  - Developer portal: `/developer/*`
- **State Management & Realtime:**
  - UI context (`UiContext`) with active organization, business, and location selection.
  - Multi-lingual i18n (`I18nProvider`) supporting English, Hindi, and Marathi.
  - Realtime Firestore snapshot listeners for live notifications, sync statuses, and reviews.

---

## 3. Backend & Services Architecture
- **Runtime:** Node.js (v20+) with TypeScript, deployable to Cloudflare Workers / Google Cloud Run / Firebase Functions (2nd gen).
- **Core Server-Side Modules:**
  1. `AIService`: Server-side Gemini integration using official `@google/genai` with strict validation, rate limiting, and prompt-injection defenses.
  2. `GoogleAuthService & GBP Services`: Secure OAuth 2.0 PKCE flow, encrypted refresh tokens, account discovery, and location synchronization.
  3. `PaymentService`: Server-side Razorpay order and subscription lifecycle management with verified HMAC SHA-256 webhook processing.
  4. `AutomationEngine`: Event-driven state machine listening for triggers (`NEW_REVIEW`, `NEGATIVE_SENTIMENT`, etc.) and executing queued actions.
  5. `TenantRouter`: Hostname and slug resolution middleware that routes custom domains and business slugs to published website configurations.

---

## 4. Multi-Tenant Isolation
- Every business resource belongs to an `organizationId`.
- Server-side middleware verifies the authenticated user's membership and permissions in the target organization before any read or write operation.
- No client-side role or organization override is permitted.
