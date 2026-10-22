# LOCALOS AI - Database Schema & Multi-Tenant Design

## 1. Multi-Tenant Structure
Every tenant-owned document includes an `organizationId`. Queries and updates are scoped strictly by `organizationId` both in Firestore Security Rules and server-side route handlers.

---

## 2. Core Collections

### `organizations`
```typescript
{
  id: string;
  name: string;
  slug: string;
  planId: 'starter' | 'growth' | 'agency' | 'enterprise';
  subscriptionStatus: 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired' | 'suspended';
  trialEndsAt: string;
  currentPeriodEnd: string;
  maxLocations: number;
  maxBusinesses: number;
  aiCreditsMonthly: number;
  aiCreditsUsed: number;
  createdAt: string;
  updatedAt: string;
}
```

### `users`
```typescript
{
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'SUPER_ADMIN' | 'AGENCY_OWNER' | 'ADMIN' | 'MANAGER' | 'STAFF' | 'CLIENT';
  organizationId: string;
  status: 'active' | 'invited' | 'suspended';
  language: 'en' | 'hi' | 'mr';
  timezone: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
}
```

### `businesses` & `locations`
```typescript
{
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  logoUrl?: string;
  coverUrl?: string;
  phone?: string;
  whatsapp?: string;
  websiteUrl?: string;
  googleMapsUrl?: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  googlePlaceId?: string;
  googleLocationName?: string;
  status: 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
}
```

### `reviews` & `review_events`
```typescript
{
  id: string;
  organizationId: string;
  businessId: string;
  locationId: string;
  authorName: string;
  authorPhotoUrl?: string;
  rating: number; // 1-5
  comment: string;
  source: 'google' | 'localos_qr' | 'localos_nfc' | 'manual';
  status: 'published' | 'pending' | 'flagged';
  replyStatus: 'unreplied' | 'draft' | 'pending_approval' | 'published';
  replyText?: string;
  replyPublishedAt?: string;
  publishedAt: string;
  createdAt: string;
}
```

### `websites` (Customer Website Builder)
```typescript
{
  id: string;
  organizationId: string;
  businessId: string;
  slug: string; // e.g. "spiral-katta"
  customDomain?: string; // e.g. "spiralkatta.com"
  theme: 'restaurant' | 'cafe' | 'jewellery' | 'retail' | 'salon' | 'service' | 'real_estate' | 'professional';
  title: string;
  tagline: string;
  description: string;
  status: 'draft' | 'published' | 'unpublished';
  publishedVersion: number;
  draftData: WebsiteContent;
  publishedData?: WebsiteContent;
  seoMeta: {
    metaTitle: string;
    metaDescription: string;
    ogImage?: string;
  };
  updatedAt: string;
  publishedAt?: string;
}
```

### `custom_domains`
```typescript
{
  id: string;
  organizationId: string;
  businessId: string;
  hostname: string;
  status: 'pending' | 'verifying' | 'active' | 'failed' | 'disconnected';
  dnsRecordsRequired: Array<{
    type: 'CNAME' | 'A' | 'TXT';
    name: string;
    value: string;
  }>;
  verifiedAt?: string;
  createdAt: string;
}
```

### Other Tenant Collections
- `google_connections`: Encrypted OAuth tokens and connection state.
- `posts`: Google Business and social updates.
- `automation_rules` & `automation_runs`: Multi-step automation state machine.
- `subscriptions` & `invoices`: Razorpay billing records.
- `audit_logs`: Immutable security and operations log.
- `support_tickets`: Customer support tickets and resolution history.
