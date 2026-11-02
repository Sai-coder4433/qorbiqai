import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase.ts';

/**
 * Direct Firestore Synchronization Service for ReviewFlow AI
 * Project: localos-ai-prod-saas
 * Real Source of Truth: Firestore Database
 */

export interface FirestoreUserProfile {
  uid: string;
  ownerId?: string;
  fullName?: string;
  displayName?: string | null;
  email?: string | null;
  phone?: string;
  mobile?: string;
  role?: string;
  status?: 'active' | 'invited' | 'suspended' | string;
  accountStatus?: string;
  profileCompleted?: boolean;
  onboardingStatus?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  onboardingCompletedAt?: any;
  createdAt?: any;
  updatedAt?: any;
}

export interface FirestoreBusinessRecord {
  id: string;
  ownerUid: string;
  businessName: string;
  category: string;
  subcategory?: string;
  description: string;
  city: string;
  state: string;
  country: string;
  primaryLanguage: string;
  googleReviewUrl: string;
  googleReviewVerified?: boolean;
  uniqueQrCode?: string;
  dynamicQrUrl?: string;
  qrStatus?: 'ACTIVE' | 'PAUSED' | 'DISABLED';
  nfcStatus?: 'ACTIVE' | 'DISABLED';
  scanCount?: number;
  lastScannedAt?: any;
  logoUrl?: string;
  onboardingStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  onboardingCompleted: boolean;
  onboardingCompletedAt?: any;
  aiTopics?: Array<{ id: string; topic: string; description: string }>;
  createdAt: any;
  updatedAt: any;
}

export interface FirestoreQrRecord {
  id: string;
  businessId: string;
  ownerUid: string;
  uniqueCode: string;
  destinationUrl: string;
  status: 'ACTIVE' | 'PAUSED';
  scansCount: number;
  createdAt: any;
  updatedAt: any;
}

export interface FirestoreSubscriptionRecord {
  id: string;
  ownerUid: string;
  businessId?: string;
  planId: string;
  planName: string;
  status: 'active' | 'trialing' | 'expired' | 'suspended';
  priceMonthly: number;
  currency: string;
  currentPeriodEnd: any;
  createdAt: any;
}

/**
 * Save / sync user and owner profile to Firestore (both owners/{uid} and users/{uid})
 */
export async function syncUserProfileToFirestore(user: Partial<FirestoreUserProfile> & { uid: string }) {
  if (!db) return;
  try {
    const userRef = doc(db, 'users', user.uid);
    const ownerRef = doc(db, 'owners', user.uid);
    const fullName = user.fullName || user.displayName || user.email?.split('@')[0] || 'Business Owner';
    const mobile = user.mobile || user.phone || '';
    const cleanRole = user.role || 'BUSINESS_OWNER';

    const profilePayload = {
      uid: user.uid,
      ownerId: user.uid,
      fullName,
      displayName: fullName,
      email: user.email ? user.email.toLowerCase().trim() : '',
      mobile,
      phone: mobile,
      role: cleanRole,
      status: user.status || 'active',
      accountStatus: user.accountStatus || 'active',
      profileCompleted: true,
      onboardingStatus: user.onboardingStatus || 'NOT_STARTED',
      onboardingCompletedAt: user.onboardingCompletedAt || null,
      createdAt: user.createdAt || serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await Promise.all([
      setDoc(userRef, profilePayload, { merge: true }),
      setDoc(ownerRef, profilePayload, { merge: true })
    ]);
  } catch (err: any) {
    console.warn('[FirestoreSync] Failed to sync user/owner profile:', err.message);
  }
}

/**
 * Save business / shop profile to Firestore (synced to both businesses and shops)
 */
function stripUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as Partial<T>;
}

export async function syncBusinessToFirestore(business: Partial<FirestoreBusinessRecord> & { ownerUid: string }) {
  if (!db) return;
  try {
    const businessId = business.id || `shop_${business.ownerUid}_${Date.now()}`;
    const bizRef = doc(db, 'businesses', businessId);
    const shopRef = doc(db, 'shops', businessId);

    const cleaned = stripUndefined({
      ...business,
      id: businessId,
      shopId: businessId,
      ownerUid: business.ownerUid,
      ownerId: business.ownerUid,
      updatedAt: serverTimestamp(),
      createdAt: business.createdAt || serverTimestamp()
    });

    await Promise.all([
      setDoc(bizRef, cleaned, { merge: true }),
      setDoc(shopRef, cleaned, { merge: true })
    ]);

    // Also sync public QR config if uniqueQrCode or googleReviewUrl is present
    const uniqueCode = business.uniqueQrCode || `code_${business.ownerUid.replace(/[^a-zA-Z0-9]/g, '').substring(0, 8)}`;
    if (uniqueCode && (business.googleReviewUrl || business.businessName)) {
      await syncPublicQrConfigToFirestore({
        uniqueCode,
        businessId,
        ownerUid: business.ownerUid,
        businessName: business.businessName || '',
        googleReviewUrl: business.googleReviewUrl || '',
        dynamicUrl: business.dynamicQrUrl || `https://qorbiqai.com/r/${uniqueCode}`,
        status: (business.qrStatus as any) || 'ACTIVE',
        nfcStatus: (business.nfcStatus as any) || 'ACTIVE'
      });
    }
  } catch (err: any) {
    console.warn('[FirestoreSync] Failed to sync business/shop:', err.message);
  }
}

/**
 * Fetch all shops owned by a specific owner directly from Firestore
 * Queries both businesses and shops collections with rule-compliant filters
 */
export async function fetchOwnerShopsFromFirestore(ownerUid: string): Promise<any[]> {
  if (!db || !ownerUid) return [];
  const resultsMap = new Map<string, any>();
  try {
    // 1. Query businesses collection by ownerUid
    try {
      const qBizUid = query(collection(db, 'businesses'), where('ownerUid', '==', ownerUid));
      const snapBizUid = await getDocs(qBizUid);
      snapBizUid.forEach(d => {
        resultsMap.set(d.id, { id: d.id, shopId: d.id, ...d.data() });
      });
    } catch (e1: any) {
      console.warn('[FirestoreSync] businesses by ownerUid notice:', e1.message);
    }

    // 2. Query businesses collection by ownerId (legacy fallback)
    try {
      const qBizId = query(collection(db, 'businesses'), where('ownerId', '==', ownerUid));
      const snapBizId = await getDocs(qBizId);
      snapBizId.forEach(d => {
        resultsMap.set(d.id, { id: d.id, shopId: d.id, ...d.data() });
      });
    } catch (e2: any) {
      console.warn('[FirestoreSync] businesses by ownerId notice:', e2.message);
    }

    // 3. Query shops collection by ownerUid
    try {
      const qShopsUid = query(collection(db, 'shops'), where('ownerUid', '==', ownerUid));
      const snapShopsUid = await getDocs(qShopsUid);
      snapShopsUid.forEach(d => {
        const existing = resultsMap.get(d.id) || {};
        resultsMap.set(d.id, { ...existing, id: d.id, shopId: d.id, ...d.data() });
      });
    } catch (e3: any) {
      console.warn('[FirestoreSync] shops by ownerUid notice:', e3.message);
    }

    // 4. Query shops collection by ownerId
    try {
      const qShopsId = query(collection(db, 'shops'), where('ownerId', '==', ownerUid));
      const snapShopsId = await getDocs(qShopsId);
      snapShopsId.forEach(d => {
        const existing = resultsMap.get(d.id) || {};
        resultsMap.set(d.id, { ...existing, id: d.id, shopId: d.id, ...d.data() });
      });
    } catch (e4: any) {
      console.warn('[FirestoreSync] shops by ownerId notice:', e4.message);
    }

    // 5. Check direct doc biz_${ownerUid}
    try {
      const directRef = doc(db, 'businesses', `biz_${ownerUid}`);
      const directSnap = await getDoc(directRef);
      if (directSnap.exists()) {
        const d = directSnap.data();
        resultsMap.set(directSnap.id, { id: directSnap.id, shopId: directSnap.id, ...d });
      }
    } catch {}

    return Array.from(resultsMap.values());
  } catch (err: any) {
    console.warn('[FirestoreSync] Failed to fetch owner shops:', err.message);
    return Array.from(resultsMap.values());
  }
}

/**
 * Save public QR routing configuration to Firestore for unauthenticated edge redirects
 */
export async function syncPublicQrConfigToFirestore(config: {
  uniqueCode: string;
  businessId: string;
  ownerUid: string;
  businessName: string;
  googleReviewUrl: string;
  dynamicUrl: string;
  status: 'ACTIVE' | 'PAUSED' | 'DISABLED';
  nfcStatus?: 'ACTIVE' | 'DISABLED';
}) {
  if (!db) return;
  try {
    const configRef = doc(db, 'public_qr_configs', config.uniqueCode);
    const cleaned = stripUndefined({
      ...config,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp()
    });
    await setDoc(configRef, cleaned, { merge: true });
  } catch (err: any) {
    console.warn('[FirestoreSync] Failed to sync public QR config:', err.message);
  }
}


/**
 * Save QR code to Firestore
 */
export async function syncQrCodeToFirestore(qr: Partial<FirestoreQrRecord> & { id: string; ownerUid: string }) {
  if (!db) return;
  try {
    const qrRef = doc(db, 'qr_codes', qr.id);
    await setDoc(qrRef, {
      ...qr,
      updatedAt: serverTimestamp(),
      createdAt: qr.createdAt || serverTimestamp()
    }, { merge: true });
  } catch (err: any) {
    console.warn('[FirestoreSync] Failed to sync QR code:', err.message);
  }
}

/**
 * Save Subscription to Firestore
 */
export async function syncSubscriptionToFirestore(sub: Partial<FirestoreSubscriptionRecord> & { id: string; ownerUid: string }) {
  if (!db) return;
  try {
    const subRef = doc(db, 'subscriptions', sub.id);
    await setDoc(subRef, {
      ...sub,
      createdAt: sub.createdAt || serverTimestamp()
    }, { merge: true });
  } catch (err: any) {
    console.warn('[FirestoreSync] Failed to sync subscription:', err.message);
  }
}

/**
 * Load user and owner profile from Firestore (checks owners/{uid} first, then users/{uid})
 */
export async function loadUserProfileFromFirestore(uid: string): Promise<FirestoreUserProfile | null> {
  if (!db || !uid) return null;
  try {
    const ownerRef = doc(db, 'owners', uid);
    const ownerSnap = await getDoc(ownerRef);
    if (ownerSnap.exists()) {
      return ownerSnap.data() as FirestoreUserProfile;
    }

    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return userSnap.data() as FirestoreUserProfile;
    }
  } catch (err: any) {
    console.warn('[FirestoreSync] Failed to load owner/user profile:', err.message);
  }
  return null;
}

/**
 * Safely auto-heal / recover missing owner profile in Firestore (Requirement 2 & 3)
 */
export async function recoverOwnerProfileInFirestore(fbUser: {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  phoneNumber?: string | null;
}): Promise<FirestoreUserProfile> {
  const existing = await loadUserProfileFromFirestore(fbUser.uid);
  if (existing) return existing;

  const fullName = fbUser.displayName || fbUser.email?.split('@')[0] || 'Business Owner';
  const profile: FirestoreUserProfile = {
    uid: fbUser.uid,
    ownerId: fbUser.uid,
    fullName,
    displayName: fullName,
    email: fbUser.email ? fbUser.email.toLowerCase().trim() : '',
    mobile: fbUser.phoneNumber || '',
    phone: fbUser.phoneNumber || '',
    role: 'BUSINESS_OWNER',
    status: 'active',
    accountStatus: 'active',
    profileCompleted: true,
    onboardingStatus: 'NOT_STARTED',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  await syncUserProfileToFirestore(profile);
  return profile;
}

/**
 * Load business for owner from Firestore
 */
export async function loadBusinessFromFirestore(ownerUid: string): Promise<FirestoreBusinessRecord | null> {
  if (!db) return null;
  try {
    const businessId = `biz_${ownerUid}`;
    const bizRef = doc(db, 'businesses', businessId);
    const snap = await getDoc(bizRef);
    if (snap.exists()) {
      return snap.data() as FirestoreBusinessRecord;
    }
  } catch (err: any) {
    console.warn('[FirestoreSync] Failed to load business:', err.message);
  }
  return null;
}
