import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "localos-ai-prod-saas.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "localos-ai-prod-saas",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "localos-ai-prod-saas.firebasestorage.app",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "625748049908",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:625748049908:web:bd232258d7cd85150803a1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function syncAll() {
  console.log('🔄 Starting Firestore synchronization to project:', firebaseConfig.projectId);

  const dataPath = path.join(__dirname, '../.data-reviewflow.json');
  if (!fs.existsSync(dataPath)) {
    console.log('No local data file found.');
    return;
  }

  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

  // 1. Sync Users
  let syncedUsers = 0;
  for (const user of (data.users || [])) {
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || user.name || '',
        phone: user.phone || '',
        role: user.role || 'CLIENT',
        status: user.status || 'active',
        onboardingStatus: user.onboardingStatus || 'NOT_STARTED',
        onboardingCompletedAt: user.onboardingCompletedAt || null,
        createdAt: user.createdAt || serverTimestamp(),
        updatedAt: user.updatedAt || serverTimestamp()
      }, { merge: true });
      syncedUsers++;
    } catch (e: any) {
      console.warn(`User ${user.uid} sync warn:`, e.message);
    }
  }
  console.log(`✅ Synced ${syncedUsers} users to Firestore 'users' collection`);

  // 2. Sync Businesses
  let syncedBiz = 0;
  for (const biz of (data.businesses || [])) {
    try {
      const bizRef = doc(db, 'businesses', biz.id);
      await setDoc(bizRef, {
        id: biz.id,
        ownerUid: biz.ownerUid,
        businessName: biz.businessName || '',
        category: biz.category || '',
        subcategory: biz.subcategory || '',
        description: biz.description || '',
        city: biz.city || '',
        state: biz.state || '',
        country: biz.country || 'India',
        primaryLanguage: biz.preferredLanguage || 'English',
        googleReviewUrl: biz.googleReviewUrl || '',
        googleReviewVerified: Boolean(biz.googleReviewVerified),
        logoUrl: biz.logoUrl || '',
        onboardingStatus: biz.onboardingStatus || (biz.onboardingCompleted ? 'COMPLETED' : 'IN_PROGRESS'),
        onboardingCompleted: Boolean(biz.onboardingCompleted),
        onboardingCompletedAt: biz.onboardingCompletedAt || null,
        experienceCards: biz.experienceCards || [],
        createdAt: biz.createdAt || serverTimestamp(),
        updatedAt: biz.updatedAt || serverTimestamp()
      }, { merge: true });
      syncedBiz++;
    } catch (e: any) {
      console.warn(`Business ${biz.id} sync warn:`, e.message);
    }
  }
  console.log(`✅ Synced ${syncedBiz} businesses to Firestore 'businesses' collection`);

  // 3. Sync QR Codes
  let syncedQr = 0;
  for (const qr of (data.qrCodes || [])) {
    try {
      const qrRef = doc(db, 'qr_codes', qr.id);
      await setDoc(qrRef, {
        id: qr.id,
        businessId: qr.businessId,
        ownerUid: qr.ownerUid,
        uniqueCode: qr.uniqueCode,
        destinationUrl: qr.destinationUrl,
        label: qr.label || 'Default Stand',
        status: qr.status || 'ACTIVE',
        scansCount: qr.scanCount || 0,
        createdAt: qr.createdAt || serverTimestamp(),
        updatedAt: qr.updatedAt || serverTimestamp()
      }, { merge: true });
      syncedQr++;
    } catch (e: any) {
      console.warn(`QR ${qr.id} sync warn:`, e.message);
    }
  }
  console.log(`✅ Synced ${syncedQr} QR codes to Firestore 'qr_codes' collection`);

  // 4. Sync Subscriptions
  let syncedSubs = 0;
  for (const sub of (data.subscriptions || [])) {
    try {
      const subRef = doc(db, 'subscriptions', sub.id);
      await setDoc(subRef, {
        id: sub.id,
        ownerUid: sub.ownerUid,
        businessId: sub.businessId || null,
        planId: sub.planId,
        planName: sub.planName,
        status: sub.status || 'active',
        priceMonthly: sub.priceMonthly || 0,
        currency: sub.currency || 'USD',
        currentPeriodEnd: sub.currentPeriodEnd || null,
        createdAt: sub.createdAt || serverTimestamp()
      }, { merge: true });
      syncedSubs++;
    } catch (e: any) {
      console.warn(`Sub ${sub.id} sync warn:`, e.message);
    }
  }
  console.log(`✅ Synced ${syncedSubs} subscriptions to Firestore 'subscriptions' collection`);

  console.log('🎉 All ReviewFlow data successfully synced into Firestore for localos-ai-prod-saas!');
  process.exit(0);
}

syncAll().catch(err => {
  console.error('Fatal sync error:', err);
  process.exit(1);
});
