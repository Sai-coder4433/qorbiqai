# Multi-Shop ReviewFlow AI — Production SaaS Architecture & Operations Manual

This document details the multi-tenant architecture, security model, category-specific configurations, QR system, server-side AI drafting, Firestore data model, and testing procedures for **ReviewFlow AI**.

---

## 1. System Overview

ReviewFlow AI is a multi-tenant SaaS platform built for local businesses across India (Jewellery, Cafes/Restaurants, Salons, Garages, Clothing Stores, Electronics, Grocery, Healthcare, Hospitality, and Professional Services).

### Core Customer Flow
1. **Customer Scans QR Code** at a physical store touchpoint (e.g. Billing Counter, Table Stand, Packaging).
2. **Instant Lookup & Branding**: The customer review page renders with the establishment's logo, brand accent color, and trade-specific experience chips.
3. **AI Review Draft Generation**: Grounded strictly in the customer's actual input/selection without inventing facts or claiming unverified ratings.
4. **1-Click Copy & Open Google Review**: The draft is copied to the device clipboard, and the customer is directly redirected to the shop's official Google Review URL.
5. **Real-time Analytics**: Business owners track actual scan and engagement funnels in real time.

---

## 2. Multi-Shop Onboarding Wizard (5 Steps)

Accessible at `/app/onboarding`:

1. **Step 1 — Business Information**:
   - Business name, category selector (10+ Indian trades + "Other" with custom category), description, country (India), state, city, preferred primary language, logo, and phone.
2. **Step 2 — Shop-Specific Details**:
   - Dynamically renders trade fields based on the selected category:
     - **Jewellery**: Gold hallmarking (BIS 916), Diamond certification, Polki, custom bridal design, making charge transparency.
     - **Restaurant & Cafe**: Cuisines, dining options (Dine-in, Takeaway, Delivery), taste & hygiene highlights.
     - **Salon**: Hair, skin, spa, bridal treatments, sanitized tools, stylist punctuality.
     - **Garage**: Vehicle types (2-wheelers, 4-wheelers, EV), periodic service, engine overhaul, OBD scans, genuine spares.
     - **Clothing**: Ethnic wear, bridal lehenga, casuals, trial room amenities, alteration service.
     - **Electronics**: Smartphones, appliances, TVs, brand warranty, same-day installation.
     - **Custom Fields**: Dynamic key-value pairs supported for any shop type.
3. **Step 3 — Google Review Configuration**:
   - Google Review destination validation (`https://g.page/r/...`, `search.google.com/local/writereview...`, or `maps.app.goo.gl/...`).
   - "Test Review Link" button to verify destination in a new tab.
   - Honest connection status badge ("Manual URL Configuration Verified").
4. **Step 4 — Customer Experience Configuration**:
   - Customer-facing heading and welcome message.
   - Brand accent color picker (Royal Blue, Indigo, Emerald, Amber, Rose Red, Purple, Slate Navy).
   - Language selector (English, Hindi, Marathi, Gujarati, Tamil).
   - Tone selector (Warm & Friendly, Natural, Simple & Short, Professional, Casual).
5. **Step 5 — Preview & Publish**:
   - Interactive mobile and desktop simulator.
   - In-preview test AI draft generation.
   - "Save as Draft" and "Publish & Generate QR Stand" actions.

---

## 3. Multiple QR Code Management (Section 6)

Each establishment can deploy multiple physical QR stands according to their subscription plan:

- **Placement Points**: Billing Counter, Shop Entrance, Table Stand, Delivery Packaging, Service Desk, or custom placement.
- **Permanent URL**: `/r/:uniqueCode` and `/review/c/:uniqueCode` — if the Google Review URL changes in the future, physical QR stands remain active without reprinting.
- **Export Options**: High-resolution PNG and vector SVG downloads.
- **Print Layout**: One-click printable table-stand layout.
- **Control**: Toggle status between `ACTIVE` and `PAUSED` at any time.

---

## 4. Google Policy Safety Guardrails

ReviewFlow AI is strictly compliant with Google Business Profile policies:

- **No Review Gating**: All customers—regardless of sentiment—have unrestricted access to open the official Google Review URL.
- **No Incentives**: No discounts or gifts are offered in exchange for reviews.
- **No Fabricated Experiences**: Review drafts are grounded exclusively in what the customer selected or entered. If notes are insufficient, the engine prompts the customer rather than hallucinating details.
- **Independent Publication**: The customer reviews, edits, and voluntarily posts the review on Google. The platform never posts on the customer's behalf.

---

## 5. Subscription Tiers & Plan Enforcement

Managed server-side via `server/fresh-test/store.ts`:

| Plan | Price (INR) | Max QR Stands | Monthly AI Allowance | Features |
|---|---|---|---|---|
| **Free Trial** | ₹0 (14 Days) | 1 | 100 drafts | 1 QR Stand, Instant 302 redirect, Analytics |
| **Starter Shop** | ₹799 / mo | 3 | 500 drafts | 3 QR Stands (Counter, Entrance, Packaging), Multi-Language (EN, HI, MR) |
| **Growth Business** | ₹1,999 / mo | 10 | 2,500 drafts | 10 QR Stands, Table/Station labels, 30-Day Trend Charts |
| **Pro Multi-Location** | ₹4,999 / mo | 50 | 10,000 drafts | 50 QR Stands across branches, High-res Vector SVG & Print Kits |
| **Custom Enterprise** | ₹9,999 / mo | 999 | 50,000 drafts | Unlimited Stands, SLA Guarantee, Dedicated Server Allocation |

> **Testing Mode Active**: Plan upgrades in the current version are simulated server-side with instant quota updates, clearly labeled as testing mode.

---

## 6. Super Admin Console (`/super-admin`)

Protected by server-enforced role verification:

- **Global Overview**: Platform-wide registrations, active shops, active QR stands, total scans, and event funnel metrics.
- **Client Management Table**: Filterable by trade and status (Active/Suspended), with instant suspension toggle.
- **Client Detail Modal**: Full inspection of shop profile, trade details, Google URL, active QR stands, and plan switcher.
- **Subscriptions & Plans**: Live tier definitions and limits.
- **System Administration**: Backend health check, AI provider monitoring (Gemini 2.5 Flash + Linguistic Fallback), IP rate limiter (15 drafts/min), and audit logs.

---

## 7. Automated Test Suite (18 Scenarios)

To run the complete automated test suite:

```bash
npx tsx tests/fresh-test.test.ts
```

### Verified Scenarios:
1. User registration, login, roles & credentials.
2. Business onboarding & category-specific details.
3. Business-specific customer page lookup.
4. AI output grounded in submitted feedback.
5. No invented facts validation on short/blank input.
6. Draft variation without changing customer meaning.
7. Clipboard copy & telemetry events.
8. Multi-QR stand creation & placement labels.
9. Permanent redirect & Google destination validation.
10. Scan & usage event accuracy.
11. Multi-tenant cross-business data isolation.
12. Super Admin authorization enforcement.
13. Account suspension & plan quota enforcement.
14. AI provider failure & linguistic fallback synthesis.
15. Missing Google URL handling.
16. Subscription verification & plan limits.
17. Empty analytics & funnel metric separation.
18. Legacy isolation & clean architecture.

---

## 8. Environment Variables

Create `.env` with the following variables:

```env
PORT=3000
NODE_ENV=development

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash

# Firebase Client Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

---

## 9. Verification & Run Commands

```bash
# Install dependencies
npm install

# Start local server (frontend + API)
npm run dev

# Run automated test suite
npx tsx tests/fresh-test.test.ts

# Production build check
npm run build
```
