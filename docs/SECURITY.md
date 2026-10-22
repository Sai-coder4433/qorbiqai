# LOCALOS AI - Security & Compliance Specification

## 1. Zero Trust Principles
1. **No Client-Side Secrets:** Gemini API keys, Google client secrets, Razorpay secrets, encryption keys, and service account tokens are strictly maintained server-side in secure environment variables.
2. **Never Trust Frontend Assertions:**
   - Role claims (e.g. `SUPER_ADMIN`) must be validated against database records and verified auth tokens.
   - Payment success callbacks from the browser are strictly treated as pending until verified via HMAC signature or server-side webhook.
   - Google connection status requires an active, decryptable token exchange.
3. **No Mock or Fake Data in Production:** All external services display their genuine state: `CONFIGURED`, `NOT_CONFIGURED`, `PENDING_APPROVAL`, or `ERROR`.

---

## 2. Authentication & Authorization (RBAC)
### Roles
- `SUPER_ADMIN`: Global platform administrator with access to all organizations, feature flags, and audit logs.
- `AGENCY_OWNER`: Organization owner capable of managing tenant plans, multiple businesses, staff, and billing.
- `ADMIN`: Organization administrator managing business configuration and team permissions.
- `MANAGER`: Day-to-day operations manager managing reviews, posts, media, and customer websites.
- `STAFF`: Restricted team member with read access and draft creation capabilities.
- `CLIENT`: Read-only reporting access for end clients.

### Permissions Matrix
- `organization.read`, `organization.update`
- `business.read`, `business.write`
- `location.read`, `location.write`
- `reviews.read`, `reviews.reply`, `reviews.publish`
- `posts.read`, `posts.create`, `posts.publish`
- `analytics.read`, `seo.read`, `seo.write`
- `automation.read`, `automation.create`, `automation.approve`, `automation.execute`
- `billing.read`, `billing.manage`
- `team.manage`, `api.manage`

---

## 3. Token Encryption & Secrets at Rest
- Sensitive credentials (Google OAuth refresh tokens, external API keys) are encrypted using **AES-256-GCM** with random 12-byte initialization vectors (IVs) and authentication tags.
- Secrets are never logged to console or included in error traces.

---

## 4. Rate Limiting & Abuse Prevention
- Public Review generation (`/api/ai/generate-review`): Protected by IP rate limits, session tokens, and input validation to prevent model exhaustion.
- Auth endpoints (`/api/auth/*`): Strict rate limits to mitigate brute-force attacks.
- Webhook endpoints: Protected by HMAC signature validation and timestamp replay attack prevention (5-minute tolerance window).

---

## 5. Security Headers & Network Protection
- Strict Content Security Policy (CSP).
- HTTP Strict Transport Security (`HSTS`: `max-age=31536000; includeSubDomains; preload`).
- `X-Content-Type-Options: nosniff`.
- `X-Frame-Options: SAMEORIGIN` (except for whitelisted review widget embeds).
- `Referrer-Policy: strict-origin-when-cross-origin`.
