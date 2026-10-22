# LOCALOS AI - Production Deployment Guide

## 1. Hosting Architecture
- **Frontend SPA:** Cloudflare Pages (or Firebase Hosting)
  - Build command: `npm run build`
  - Output directory: `dist`
  - SPA Routing: Configured with `_routes.json` or Cloudflare Worker fallback to `index.html`.
- **Backend API & Server:**
  - Node.js Express server on Google Cloud Run or Firebase Cloud Functions (2nd Gen).
  - Listens on `PORT` environment variable (defaults to `3000`).

---

## 2. Cloudflare Pages & Custom Domain Routing
- Root Domain: `localos.ai` & `www.localos.ai`
- Customer Sub-path Routing: `localos.ai/:businessSlug` & `localos.ai/r/:businessSlug`
- Custom Tenant Domains:
  - CNAME pointer to `domains.localos.ai`
  - Cloudflare Custom Hostnames / SSL for SaaS
  - Edge worker resolves `req.headers.host` against `custom_domains` collection in Firestore/KV and renders the tenant's published website.

---

## 3. Environment Variables
Verify all variables in `.env` before production deployment:
```env
# Firebase Public Configuration
VITE_FIREBASE_API_KEY=your_firebase_web_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id

# Server-Side Secrets (NEVER client-side)
GEMINI_API_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
ENCRYPTION_KEY=
```
