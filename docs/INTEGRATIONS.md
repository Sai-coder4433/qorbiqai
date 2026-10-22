# LOCALOS AI - Integrations Specification

## 1. Overview
LOCALOS AI connects with external providers for AI, Search, Identity, Payments, and Notifications. Every integration implements:
- Environment configuration status check
- Explicit states: `NOT_CONFIGURED`, `CONFIGURED`, `PENDING_APPROVAL`, `ERROR`
- Exponential backoff and retry handling
- Dead-letter handling for asynchronous worker jobs

---

## 2. Google Business Profile (GBP)
- **Scope:** `https://www.googleapis.com/auth/business.manage`
- **Feature Flag:** `GOOGLE_GBP_INTEGRATION`
- **Current Status:** `PENDING_APPROVAL` (Awaiting Google Cloud OAuth app verification).
- **Behavior when disabled/pending:** 
  The UI displays: *"Google Business Profile integration is awaiting API access. Direct live sync will activate once verified."*
- **Architecture:**
  - `GoogleAuthService`: OAuth2 server-side authorization code exchange and PKCE validation.
  - `GoogleAccountService`: Discovers business accounts under authorized Google credentials.
  - `GoogleLocationService`: Maps physical locations to Google Business Profile identifiers.
  - `GoogleReviewService`: Pulls verified reviews and publishes human-approved replies.
  - `GooglePostService`: Publishes offers, updates, and event posts.
  - `GooglePerformanceService`: Ingests official GBP Performance API daily search and view metrics.

---

## 3. Gemini AI (`@google/genai`)
- **Model:** `gemini-3.8-flash` / `gemini-2.5-flash`
- **Execution:** Strictly server-side (`AIService`).
- **Use Cases:**
  - Customer review generation based ONLY on customer-selected rating and chips (no fabricated facts).
  - Sentiment analysis and professional response drafting.
  - Social & Google Business update generation from verified business offerings.
  - Local SEO audit actionable task summarization.
- **Safety Constraints:**
  - Refusal to fabricate employee names, discounts, pricing, or experiences.
  - Rate limiting and token capping per organization tier.

---

## 4. Razorpay Payments & Subscriptions
- **Implementation:** Server-side `PaymentService` utilizing official Razorpay REST APIs.
- **Webhook Events:**
  - `payment.authorized`
  - `payment.captured`
  - `payment.failed`
  - `subscription.activated`
  - `subscription.charged`
  - `subscription.cancelled`
- **Verification:** All webhook payloads are validated against `RAZORPAY_WEBHOOK_SECRET` using `crypto.createHmac('sha256', secret)`.

---

## 5. Communications Providers
- **Email:** Pluggable `EmailProvider` interface supporting SMTP / Resend / SendGrid with HTML transactional templates.
- **WhatsApp:** `WhatsAppProvider` abstraction supporting Meta WhatsApp Cloud API with opt-in and rate-limiting controls.
- **Web Push:** Standard VAPID web push notifications for critical review alerts and system notifications.
