# ReviewFlow — Firebase QR Review Automation SaaS
## Fresh Testing Version Setup & Configuration Guide

This guide documents the isolated fresh testing environment, Firebase configuration, AI integration, Super Admin security, and end-to-end testing verification.

---

### 1. Isolated Fresh Testing Scope & Data Structure

The application has been reset to an isolated testing scope with zero legacy dependencies or mock data:
* **Frontend Scope**: Minimal sidebar with **QR Review Automation** (`/app`), **Account Settings** (`/app/settings`), and **Super Admin** (`/super-admin`). Legacy modules (CRM, e-commerce, website builder, etc.) are disabled.
* **Firestore Collections**: All records reside strictly in dedicated test collections:
  * `test_users` — Registered accounts, roles (`BUSINESS_OWNER` or `SUPER_ADMIN`), status.
  * `test_businesses` — Business name, logo URL, validated Google Review URL, location.
  * `test_qr_codes` — Permanent QR code ID, unique code slug, destination URL, status (`ACTIVE` or `PAUSED`).
  * `test_qr_scan_events` — Individual scan records (timestamp, user agent, device family).
  * `test_review_assistance_events` — Funnel actions (`PAGE_VIEW`, `AI_DRAFT_GENERATED`, `REVIEW_COPIED`, `GOOGLE_REVIEW_CLICKED`).
  * `test_admin_audit_logs` — Administrative security actions and timestamped audit trails.
  * `test_system_settings` — AI provider status, Firebase health, version.

---

### 2. Environment Variables Checklist (`.env`)

```env
# Server Host
APP_URL="http://localhost:3000"
PORT="3000"

# Firebase Client SDK
VITE_FIREBASE_API_KEY="your-firebase-api-key"
VITE_FIREBASE_AUTH_DOMAIN="your-app.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-app"
VITE_FIREBASE_STORAGE_BUCKET="your-app.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
VITE_FIREBASE_APP_ID="your-app-id"

# Google Gemini AI (Server-Side only)
GEMINI_API_KEY="your-gemini-api-key"
GEMINI_MODEL="gemini-2.5-flash"
```

> **Security Note**: Never expose `GEMINI_API_KEY` on the client. AI calls are exclusively mediated through the backend `/api/test/ai/review-draft` endpoint.

---

### 3. Initial Super Admin Provisioning

Super Admin clearance is never granted simply because an email contains `"admin"`, nor does the backend trust client-supplied role values.
* Access is verified server-side against the trusted admin allowlist (`server/fresh-test/store.ts`):
  * `admin@reviewflow.com`
  * `superadmin@reviewflow.ai`
  * `admin@testsaas.com`
* To provision a custom Super Admin, add their email to `SUPER_ADMIN_ALLOWLIST` in `server/fresh-test/store.ts` or set the `role: 'SUPER_ADMIN'` custom claim via Firebase Admin SDK.
* Non-admin users attempting to access `/super-admin` or privileged endpoints receive an HTTP 403 Forbidden with an Access Denied screen.

---

### 4. Firestore Security Rules Deployment

The updated `firestore.rules` enforces:
1. Business owners can only read and write their own `test_businesses` and `test_qr_codes`.
2. Public users cannot write directly to `test_qr_scan_events` or `test_review_assistance_events` (all events pass through authenticated or server-side endpoints).
3. `test_admin_audit_logs` is strictly restricted to `SUPER_ADMIN`.

Deploy rules to Firebase:
```bash
firebase deploy --only firestore:rules
```

---

### 5. Running & Testing

1. **Start the local server**:
   ```bash
   npm run dev
   ```
2. **Execute the automated test suite**:
   ```bash
   npx tsx tests/fresh-test.test.ts
   ```
   *Verifies URL validation, role assignment, idempotent QR generation, scan tracking, and audit logging.*
3. **Verify the Customer QR Flow**:
   - Log in as business owner at `http://localhost:3000/login`.
   - Enter your Business Name and official Google Review URL (e.g. `https://g.page/r/.../review`).
   - Click **Generate Review QR Code**.
   - Download the high-res PNG or SVG, or click **Test Scan** (`/r/:uniqueCode`).
   - On the customer page (`/review/c/:uniqueCode`), write feedback, click **Generate Review Draft**, click **Copy Review**, and click **Open Google Review Page**.
   - Refresh the owner dashboard to view the real-time scan count and event funnel.
4. **Access the Super Admin Panel**:
   - Sign in as `admin@reviewflow.com` (password: `password123`).
   - Navigate to `http://localhost:3000/super-admin` to review cross-business metrics, manage accounts, and inspect system audit logs.
