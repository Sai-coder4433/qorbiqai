import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, Auth } from 'firebase/auth';
import {
  getFirestore,
  Firestore,
  doc,
  setDoc,
  getDocs,
  collection,
  serverTimestamp
} from 'firebase/firestore';
import { reviewFlowStore } from './store.ts';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "localos-ai-prod-saas.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "localos-ai-prod-saas",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "localos-ai-prod-saas.firebasestorage.app",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "625748049908",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:625748049908:web:bd232258d7cd85150803a1"
};

class FirebaseSyncService {
  private app: FirebaseApp | null = null;
  private db: Firestore | null = null;
  private auth: Auth | null = null;
  private lastSyncedAt: string | null = null;

  constructor() {
    this.init();
  }

  private init() {
    try {
      this.app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
      this.db = getFirestore(this.app);
      this.auth = getAuth(this.app);
    } catch (err: any) {
      console.warn('[FirebaseSyncService] Init notice:', err.message);
    }
  }

  private async ensureAuth(): Promise<void> {
    if (!this.app) {
      this.init();
    }
    if (!this.auth) return;
    if (this.auth.currentUser) return;

    try {
      await signInWithEmailAndPassword(this.auth, 'chakankarsai@gmail.com', 'Sai@@2907crm');
      console.log('[FirebaseSyncService] Authenticated as Super Admin with Firebase Auth');
    } catch (err: any) {
      console.warn('[FirebaseSyncService] Auth notice:', err.message);
    }
  }

  public getStatus() {
    const rawData = (reviewFlowStore as any).data || {};
    return {
      projectId: firebaseConfig.projectId,
      storageBucket: firebaseConfig.storageBucket,
      authDomain: firebaseConfig.authDomain,
      configured: true,
      lastSyncedAt: this.lastSyncedAt,
      localCounts: {
        users: (rawData.users || []).length,
        businesses: (rawData.businesses || []).length,
        qrCodes: (rawData.qrCodes || []).length,
        subscriptions: (rawData.subscriptions || []).length,
        crmLeads: (rawData.crmLeads || []).length,
        employees: (rawData.salesUsers || []).length
      }
    };
  }

  public async pushAllToFirestore(): Promise<{
    success: boolean;
    synced: {
      users: number;
      businesses: number;
      qrCodes: number;
      subscriptions: number;
      payments: number;
      crmLeads: number;
      employees: number;
    };
    errors: string[];
    projectId: string;
    timestamp: string;
  }> {
    if (!this.db) {
      this.init();
    }
    await this.ensureAuth();
    if (!this.db) {
      throw new Error('Firestore database instance could not be initialized.');
    }

    const db = this.db;
    const errors: string[] = [];
    const synced = {
      users: 0,
      businesses: 0,
      qrCodes: 0,
      subscriptions: 0,
      payments: 0,
      crmLeads: 0,
      employees: 0
    };

    const rawData = (reviewFlowStore as any).data || {};

    // 1. Sync Users
    for (const u of (rawData.users || [])) {
      try {
        const uRef = doc(db, 'users', u.uid);
        await setDoc(uRef, {
          uid: u.uid,
          email: u.email || '',
          displayName: u.displayName || u.name || '',
          phone: u.phone || '',
          role: u.role || 'CLIENT',
          status: u.status || 'active',
          onboardingStatus: u.onboardingStatus || 'NOT_STARTED',
          onboardingCompletedAt: u.onboardingCompletedAt || null,
          createdAt: u.createdAt || new Date().toISOString(),
          updatedAt: u.updatedAt || new Date().toISOString()
        }, { merge: true });
        synced.users++;
      } catch (err: any) {
        errors.push(`User ${u.uid}: ${err.message}`);
      }
    }

    // 2. Sync Businesses
    for (const b of (rawData.businesses || [])) {
      try {
        const bRef = doc(db, 'businesses', b.id);
        await setDoc(bRef, {
          id: b.id,
          ownerUid: b.ownerUid,
          businessName: b.businessName || '',
          category: b.category || '',
          subcategory: b.subcategory || '',
          description: b.description || '',
          city: b.city || '',
          state: b.state || '',
          country: b.country || 'India',
          primaryLanguage: b.preferredLanguage || 'English',
          googleReviewUrl: b.googleReviewUrl || '',
          googleReviewVerified: Boolean(b.googleReviewVerified),
          logoUrl: b.logoUrl || '',
          onboardingStatus: b.onboardingStatus || 'IN_PROGRESS',
          onboardingCompleted: Boolean(b.onboardingCompleted),
          onboardingCompletedAt: b.onboardingCompletedAt || null,
          experienceCards: b.experienceCards || [],
          createdAt: b.createdAt || new Date().toISOString(),
          updatedAt: b.updatedAt || new Date().toISOString()
        }, { merge: true });
        synced.businesses++;
      } catch (err: any) {
        errors.push(`Business ${b.id}: ${err.message}`);
      }
    }

    // 3. Sync QR Codes
    for (const q of (rawData.qrCodes || [])) {
      try {
        const qRef = doc(db, 'qr_codes', q.id);
        await setDoc(qRef, {
          id: q.id,
          businessId: q.businessId,
          ownerUid: q.ownerUid,
          uniqueCode: q.uniqueCode,
          destinationUrl: q.destinationUrl,
          label: q.label || 'Default Stand',
          status: q.status || 'ACTIVE',
          scanCount: q.scanCount || 0,
          createdAt: q.createdAt || new Date().toISOString(),
          updatedAt: q.updatedAt || new Date().toISOString()
        }, { merge: true });
        synced.qrCodes++;
      } catch (err: any) {
        errors.push(`QR ${q.id}: ${err.message}`);
      }
    }

    // 4. Sync Subscriptions (Requirement 4: 14 mandatory fields)
    for (const s of (rawData.subscriptions || [])) {
      try {
        const sRef = doc(db, 'subscriptions', s.id);
        await setDoc(sRef, {
          id: s.id,
          subscriptionId: s.id,
          userId: s.userId || s.ownerUid,
          ownerUid: s.ownerUid,
          businessId: s.businessId || null,
          planId: s.planId,
          planName: s.planName,
          planVersion: s.planVersion || 1,
          billingInterval: s.billingInterval || 'monthly',
          planPrice: s.price,
          price: s.price,
          priceMonthly: s.priceMonthly || s.price,
          currency: s.currency || 'INR',
          provider: s.provider || 'CASHFREE',
          cashfreeSubscriptionId: s.cashfreeSubscriptionId || s.providerSubscriptionId || null,
          cashfreeOrderId: s.cashfreeOrderId || null,
          cashfreePaymentId: s.cashfreePaymentId || null,
          verifiedPaymentStatus: s.paymentStatus || 'paid',
          paymentStatus: s.paymentStatus || 'paid',
          status: s.status || 'active',
          subscriptionCreationDate: s.createdAt || new Date().toISOString(),
          currentPeriodStart: s.currentPeriodStart || null,
          currentPeriodEnd: s.currentPeriodEnd,
          renewalDate: s.renewalDate || s.currentPeriodEnd || null,
          autoRenew: Boolean(s.autoRenew),
          renewalCount: s.renewalCount || 0,
          cancellationDetails: s.cancellationDetails || null,
          lastVerifiedWebhookEventId: s.lastVerifiedWebhookEventId || null,
          creditsRemaining: s.creditsRemaining || 0,
          creditsUsed: s.creditsUsed || 0,
          createdAt: s.createdAt || new Date().toISOString(),
          updatedAt: s.updatedAt || new Date().toISOString()
        }, { merge: true });
        synced.subscriptions++;
      } catch (err: any) {
        errors.push(`Subscription ${s.id}: ${err.message}`);
      }
    }

    // 4b. Sync Payments to Firestore (Requirement 4)
    for (const p of (rawData.payments || [])) {
      try {
        const pRef = doc(db, 'payments', p.id);
        await setDoc(pRef, {
          id: p.id,
          paymentId: p.id,
          userId: p.userId,
          businessId: p.businessId || null,
          subscriptionId: p.subscriptionId,
          amount: p.amount,
          planPrice: p.amount,
          currency: p.currency || 'INR',
          status: p.status,
          verifiedPaymentStatus: p.status,
          paymentType: p.paymentType,
          planId: p.planId,
          billingInterval: p.billingInterval || 'monthly',
          planVersion: p.planVersion || 1,
          gateway: p.gateway || 'CASHFREE',
          cashfreeOrderId: p.cashfreeOrderId || null,
          cashfreePaymentId: p.cashfreePaymentId || null,
          cashfreeSubscriptionId: p.cashfreeSubscriptionId || null,
          cashfreePaymentSessionId: p.cashfreePaymentSessionId || null,
          cashfreeAuthLink: p.cashfreeAuthLink || null,
          razorpayOrderId: p.razorpayOrderId || null,
          razorpayPaymentId: p.razorpayPaymentId || null,
          razorpaySubscriptionId: p.razorpaySubscriptionId || null,
          refundId: p.refundId || null,
          refundReason: p.refundReason || null,
          refundedAt: p.refundedAt || null,
          lastVerifiedWebhookEventId: p.lastVerifiedWebhookEventId || null,
          createdAt: p.createdAt || new Date().toISOString(),
          verifiedAt: p.verifiedAt || null,
          updatedAt: new Date().toISOString()
        }, { merge: true });
        synced.payments = (synced.payments || 0) + 1;
      } catch (err: any) {
        errors.push(`Payment ${p.id}: ${err.message}`);
      }
    }

    // 5. Sync CRM Inquiries & Leads
    for (const lead of (rawData.crmLeads || [])) {
      try {
        const leadRef = doc(db, 'crm_leads', lead.id);
        await setDoc(leadRef, {
          id: lead.id,
          name: lead.name || '',
          businessName: lead.businessName || '',
          phone: lead.phone || '',
          email: lead.email || '',
          category: lead.category || '',
          city: lead.city || '',
          message: lead.message || '',
          status: lead.status || 'NEW',
          assignedSalesId: lead.assignedSalesId || null,
          assignedSalesName: lead.assignedSalesName || null,
          createdAt: lead.createdAt || new Date().toISOString(),
          updatedAt: lead.updatedAt || new Date().toISOString()
        }, { merge: true });
        synced.crmLeads++;
      } catch (err: any) {
        errors.push(`Lead ${lead.id}: ${err.message}`);
      }
    }

    // 6. Sync Employees
    for (const emp of (rawData.salesUsers || [])) {
      try {
        const empRef = doc(db, 'employees', emp.uid);
        await setDoc(empRef, {
          uid: emp.uid,
          name: emp.name || '',
          email: emp.email || '',
          phone: emp.phone || '',
          role: emp.role || 'SALES_TEAM',
          department: emp.department || 'Sales',
          status: emp.status || 'active',
          permissions: emp.permissions || [],
          createdAt: emp.createdAt || new Date().toISOString(),
          updatedAt: emp.updatedAt || new Date().toISOString()
        }, { merge: true });
        synced.employees++;
      } catch (err: any) {
        errors.push(`Employee ${emp.uid}: ${err.message}`);
      }
    }

    this.lastSyncedAt = new Date().toISOString();

    const isSuccess = errors.length === 0 || (synced.users + synced.businesses + synced.qrCodes > 0);
    return {
      success: isSuccess,
      synced,
      errors: errors.slice(0, 10), // truncate errors for UI readability
      projectId: firebaseConfig.projectId,
      timestamp: this.lastSyncedAt
    };
  }

  public async pullAllFromFirestore(): Promise<{
    success: boolean;
    imported: {
      users: number;
      businesses: number;
      qrCodes: number;
      crmLeads: number;
    };
    errors: string[];
    timestamp: string;
  }> {
    if (!this.db) {
      this.init();
    }
    await this.ensureAuth();
    if (!this.db) {
      throw new Error('Firestore database instance could not be initialized.');
    }

    const db = this.db;
    const errors: string[] = [];
    const imported = {
      users: 0,
      businesses: 0,
      qrCodes: 0,
      crmLeads: 0
    };

    // 1. Pull Users
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      usersSnap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.uid) {
          reviewFlowStore.upsertUser({
            uid: data.uid,
            email: data.email || '',
            displayName: data.displayName || data.name || '',
            role: (data.role as any) || 'CLIENT',
            status: data.status || 'active'
          });
          imported.users++;
        }
      });
    } catch (e: any) {
      errors.push(`Pull users: ${e.message}`);
    }

    // 2. Pull Businesses
    try {
      const bizSnap = await getDocs(collection(db, 'businesses'));
      const rawData = (reviewFlowStore as any).data;
      if (!rawData.businesses) rawData.businesses = [];

      bizSnap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.id && data.ownerUid) {
          const idx = rawData.businesses.findIndex((b: any) => b.id === data.id);
          if (idx >= 0) {
            rawData.businesses[idx] = { ...rawData.businesses[idx], ...data };
          } else {
            rawData.businesses.push({
              id: data.id,
              ownerUid: data.ownerUid,
              businessName: data.businessName || 'Business',
              category: data.category || 'general',
              subcategory: data.subcategory || '',
              description: data.description || '',
              city: data.city || 'Pune',
              state: data.state || 'Maharashtra',
              country: data.country || 'India',
              preferredLanguage: data.primaryLanguage || 'English',
              googleReviewUrl: data.googleReviewUrl || '',
              logoUrl: data.logoUrl || '',
              createdAt: data.createdAt || new Date().toISOString(),
              updatedAt: data.updatedAt || new Date().toISOString()
            });
            imported.businesses++;
          }
        }
      });
      (reviewFlowStore as any).persist?.();
    } catch (e: any) {
      errors.push(`Pull businesses: ${e.message}`);
    }

    // 3. Pull CRM Leads
    try {
      const leadsSnap = await getDocs(collection(db, 'crm_leads'));
      leadsSnap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.name && data.phone) {
          const existing = reviewFlowStore.getCrmLeads().find(l => l.id === docSnap.id);
          if (!existing) {
            reviewFlowStore.createCrmInquiry({
              name: data.name,
              businessName: data.businessName || '',
              phone: data.phone,
              email: data.email || '',
              category: data.category || 'General',
              city: data.city || 'Local',
              message: data.message || ''
            });
            imported.crmLeads++;
          }
        }
      });
    } catch (e: any) {
      errors.push(`Pull leads: ${e.message}`);
    }

    this.lastSyncedAt = new Date().toISOString();

    return {
      success: errors.length === 0 || (imported.users + imported.businesses + imported.crmLeads > 0),
      imported,
      errors: errors.slice(0, 10),
      timestamp: this.lastSyncedAt
    };
  }

  /** Real-time sync of an individual payment record to Firestore (Requirement 4) */
  public async syncPaymentDoc(payment: any): Promise<void> {
    try {
      if (!this.db) this.init();
      if (!this.db) return;
      await this.ensureAuth();
      const pRef = doc(this.db, 'payments', payment.id);
      await setDoc(pRef, {
        id: payment.id,
        paymentId: payment.id,
        userId: payment.userId,
        businessId: payment.businessId || null,
        subscriptionId: payment.subscriptionId,
        amount: payment.amount,
        planPrice: payment.amount,
        currency: payment.currency || 'INR',
        status: payment.status,
        verifiedPaymentStatus: payment.status,
        paymentType: payment.paymentType,
        planId: payment.planId,
        billingInterval: payment.billingInterval || 'monthly',
        planVersion: payment.planVersion || 1,
        gateway: payment.gateway || 'CASHFREE',
        cashfreeOrderId: payment.cashfreeOrderId || null,
        cashfreePaymentId: payment.cashfreePaymentId || null,
        cashfreeSubscriptionId: payment.cashfreeSubscriptionId || null,
        cashfreePaymentSessionId: payment.cashfreePaymentSessionId || null,
        cashfreeAuthLink: payment.cashfreeAuthLink || null,
        razorpayOrderId: payment.razorpayOrderId || null,
        razorpayPaymentId: payment.razorpayPaymentId || null,
        razorpaySubscriptionId: payment.razorpaySubscriptionId || null,
        refundId: payment.refundId || null,
        refundReason: payment.refundReason || null,
        refundedAt: payment.refundedAt || null,
        lastVerifiedWebhookEventId: payment.lastVerifiedWebhookEventId || null,
        createdAt: payment.createdAt || new Date().toISOString(),
        verifiedAt: payment.verifiedAt || null,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err: any) {
      console.warn(`[FirebaseSyncService] Failed to sync payment ${payment.id}:`, err.message);
    }
  }

  /** Real-time sync of an individual subscription record to Firestore (Requirement 4: 14 mandatory fields) */
  public async syncSubscriptionDoc(subscription: any): Promise<void> {
    try {
      if (!this.db) this.init();
      if (!this.db) return;
      await this.ensureAuth();
      const sRef = doc(this.db, 'subscriptions', subscription.id);
      await setDoc(sRef, {
        id: subscription.id,
        subscriptionId: subscription.id,
        userId: subscription.userId || subscription.ownerUid,
        ownerUid: subscription.ownerUid,
        businessId: subscription.businessId || null,
        planId: subscription.planId,
        planName: subscription.planName,
        planVersion: subscription.planVersion || 1,
        billingInterval: subscription.billingInterval || 'monthly',
        planPrice: subscription.price,
        price: subscription.price,
        priceMonthly: subscription.priceMonthly || subscription.price,
        currency: subscription.currency || 'INR',
        provider: subscription.provider || 'CASHFREE',
        cashfreeSubscriptionId: subscription.cashfreeSubscriptionId || subscription.providerSubscriptionId || null,
        cashfreeOrderId: subscription.cashfreeOrderId || null,
        cashfreePaymentId: subscription.cashfreePaymentId || null,
        verifiedPaymentStatus: subscription.paymentStatus || 'paid',
        paymentStatus: subscription.paymentStatus || 'paid',
        status: subscription.status || 'active',
        subscriptionCreationDate: subscription.createdAt || new Date().toISOString(),
        currentPeriodStart: subscription.currentPeriodStart || null,
        currentPeriodEnd: subscription.currentPeriodEnd,
        renewalDate: subscription.renewalDate || subscription.currentPeriodEnd || null,
        autoRenew: Boolean(subscription.autoRenew),
        renewalCount: subscription.renewalCount || 0,
        cancellationDetails: subscription.cancellationDetails || null,
        lastVerifiedWebhookEventId: subscription.lastVerifiedWebhookEventId || null,
        createdAt: subscription.createdAt || new Date().toISOString(),
        updatedAt: subscription.updatedAt || new Date().toISOString()
      }, { merge: true });
    } catch (err: any) {
      console.warn(`[FirebaseSyncService] Failed to sync subscription ${subscription.id}:`, err.message);
    }
  }

  /** Generic real-time sync of an individual record to Firestore (supports 2 or 3 arguments) */
  public async syncRecord(colName: string, docIdOrData: any, maybeData?: any): Promise<void> {
    try {
      await this.ensureAuth();
      if (!this.db) return;
      const docId = maybeData ? String(docIdOrData) : String(docIdOrData?.id || docIdOrData?.uid || docIdOrData?.orderId || docIdOrData?.key || 'default');
      const data = maybeData !== undefined ? maybeData : docIdOrData;
      const ref = doc(this.db, colName, docId);
      await setDoc(ref, {
        ...data,
        _syncedAt: serverTimestamp()
      }, { merge: true });
    } catch (err: any) {
      console.warn(`[FirebaseSyncService] syncRecord ${colName} notice:`, err.message);
    }
  }
}

export const firebaseSyncService = new FirebaseSyncService();
