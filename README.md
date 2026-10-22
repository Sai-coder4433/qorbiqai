# Qorbiq AI (ReviewFlow AI)

> Autonomous AI Reputation Engine, Dynamic QR Smart Stands & Multi-Gateway SaaS Platform for Modern Local Businesses.

---

## 🌟 Overview

**Qorbiq AI** is a full-stack, enterprise-grade SaaS application designed to help brick-and-mortar stores, restaurants, clinics, and service businesses effortlessly collect authentic 5-star customer reviews, automate local SEO, and manage customer reputation.

### Key Highlights
- **Natural AI Review Generation**: Zero-punctuation natural review output in English, Hindi, and Marathi with customer sentiment and topic tagging.
- **Dynamic Smart QR & NFC**: Permanent dynamic QR codes with smart server-side redirect routing—never reprint physical stands when destination links change.
- **Multi-Gateway Payment System**: Production-grade support for **Cashfree** (Payment Gateway & Recurring Subscriptions) and **Razorpay**, complete with cryptographic HMAC-SHA256 signature verification and idempotency protection.
- **Isolated Multi-Tenant Architecture**: Strict per-business data isolation (`biz_<id>`), mandatory onboarding wizard, and localized analytics.
- **Dual Super Admin & CRM Portals**: Complete business audit logs, AI token usage metrics, lead management, and employee management.
- **Cloudflare Pages Deployment Ready**: Optimized for Cloudflare Pages edge functions (`functions/api/`, `functions/r/`, `public/_routes.json`) paired with persistent Node.js API runtime.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Recharts, Motion |
| **Backend Runtime** | Node.js (v20+), Express, TypeScript (`tsx`) |
| **Edge Functions** | Cloudflare Pages Functions (`functions/api/`, `functions/r/`) |
| **Authentication & Database** | Firebase Authentication, Google OAuth 2.0, Firestore & Local Atomic Storage |
| **AI Models** | Google Gemini 2.5 Flash / Flash-Lite via `@google/genai` |
| **Payment Gateways** | Cashfree PG & Subscriptions (`@cashfreepayments/cashfree-js`), Razorpay Subscriptions |
| **QR & NFC Generation** | Vector SVG / 4K HD Print QR generation (`qrcode`), jsQR camera scanning |

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: v20.18.0 or later (Node 22 LTS supported)
- **npm**: v10+

### 2. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/Sai-coder4433/qorbiqai.git
cd qorbiqai
npm install
```

### 3. Environment Configuration
Copy the sample environment file and configure your credentials:
```bash
cp .env.example .env
```

Key variables to configure in `.env`:
```env
# Application URL
APP_URL="http://localhost:3000"
APP_BASE_URL="http://localhost:3000"

# Google Gemini AI
GEMINI_API_KEY="your_gemini_api_key"
GEMINI_MODEL="gemini-2.5-flash-lite"

# Active Payment Gateway ('CASHFREE' or 'RAZORPAY')
PAYMENT_GATEWAY="CASHFREE"

# Cashfree Credentials (https://www.cashfree.com/devstudio)
CASHFREE_APP_ID="your_cashfree_app_id"
CASHFREE_SECRET_KEY="your_cashfree_secret_key"
CASHFREE_ENV="sandbox" # or "production"
CASHFREE_API_VERSION="2023-08-01"

# Razorpay Credentials (Optional / Alternative)
RAZORPAY_KEY_ID="rzp_test_your_key"
RAZORPAY_KEY_SECRET="your_razorpay_secret"
RAZORPAY_WEBHOOK_SECRET="your_webhook_secret"

# Firebase Client SDK
VITE_FIREBASE_API_KEY="your_firebase_web_api_key"
VITE_FIREBASE_AUTH_DOMAIN="localos-ai-prod-saas.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="localos-ai-prod-saas"
VITE_FIREBASE_STORAGE_BUCKET="localos-ai-prod-saas.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="625748049908"
VITE_FIREBASE_APP_ID="1:625748049908:web:bd232258d7cd85150803a1"
```

### 4. Running Locally
Start both the Express backend and the Vite frontend dev server concurrently:
```bash
npm run dev
```
Open your browser at `http://localhost:3000`.

---

## 🧪 Testing & Validation

Run the end-to-end payment gateway validation suite (Cashfree, Razorpay, HMAC verification, idempotency, onboarding guards):
```bash
npx tsx scripts/test-cashfree-integration.ts
```

Run TypeScript and production build checks:
```bash
npm run lint
npm run build
```

---

## 🌐 Cloudflare Pages Deployment

### Build Configuration
In your Cloudflare Pages dashboard:
- **Framework preset**: `Vite`
- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Root directory**: `/`

### Architecture
- **Static Assets & SPA**: Served directly from Cloudflare's global edge CDN via `dist/`.
- **Edge Proxy**: Cloudflare Pages Functions located in `functions/api/[[catchall]].ts` and `functions/r/[[catchall]].ts` automatically route dynamic API requests and QR redirect shortlinks to your backend.
- **Backend Service**: Run the Node.js Express server (`server.ts`) on Render, Railway, Fly.io, or VPS, and set `BACKEND_API_URL` in Cloudflare Pages environment variables.

---

## 🔒 Security Best Practices

- **Zero Secret Exposure**: Server secrets (`CASHFREE_SECRET_KEY`, `RAZORPAY_KEY_SECRET`, `GEMINI_API_KEY`) are kept exclusively on the server runtime and never bundled in the frontend.
- **HMAC-SHA256 Signature Verification**: All webhook requests from Cashfree and Razorpay are verified cryptographically using timing-safe buffer comparisons.
- **Idempotency Guard**: Double payment clicks or duplicate webhook retries are deduplicated at the database layer.
- **Cross-Tenant Isolation**: Business endpoints strictly validate session context against the caller's authorized `businessId`.

---

## 📄 License
Private & Proprietary. All rights reserved © 2026 Qorbiq AI / Sai Chakankar.
