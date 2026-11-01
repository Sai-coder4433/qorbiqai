import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  User as FirebaseUser
} from 'firebase/auth';
import { auth, googleAuthProvider, isFirebaseConfigured } from './firebase.ts';
import { freshTestApi } from './fresh-test-api.ts';
import {
  syncUserProfileToFirestore,
  syncBusinessToFirestore,
  loadUserProfileFromFirestore,
  recoverOwnerProfileInFirestore
} from './firestore-sync.ts';

export type UserRole =
  | 'SUPER_ADMIN'
  | 'AGENCY_OWNER'
  | 'ADMIN'
  | 'MANAGER'
  | 'STAFF'
  | 'CLIENT';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  phone?: string | null;
  role: UserRole;
  organizationId: string;
  status: 'active' | 'invited' | 'suspended';
  language: 'en' | 'hi' | 'mr';
  timezone: string;
  emailVerified: boolean;
  onboardingStatus?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  onboardingCompletedAt?: string | null;
  onboardingVersion?: number;
  createdAt?: string;
  lastLoginAt?: string;
}

export interface OrganizationInfo {
  id: string;
  name: string;
  slug: string;
  planId: string;
  subscriptionStatus: 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired' | 'suspended';
}

interface AuthContextType {
  user: AuthUser | null;
  firebaseUser: FirebaseUser | null;
  organization: OrganizationInfo | null;
  loading: boolean;
  error: string | null;
  onboardingStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  isOnboardingComplete: boolean;
  loginWithEmail: (email: string, pass: string, rememberMe?: boolean) => Promise<AuthUser>;
  signupWithEmail: (
    email: string,
    pass: string,
    name: string,
    businessName?: string,
    phone?: string,
    termsAccepted?: boolean
  ) => Promise<{ user: AuthUser; shopId: string }>;
  loginWithGoogle: () => Promise<void>;
  loginSuperAdmin: (email: string, pass: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  markEmailVerified: () => Promise<void>;
  setOnboardingStatus: (status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED') => void;
  hasPermission: (permission: string) => boolean;
  refreshUser: () => Promise<void>;
}

const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  SUPER_ADMIN: ['*'],
  AGENCY_OWNER: [
    'organization.read', 'organization.update',
    'business.read', 'business.write',
    'location.read', 'location.write',
    'reviews.read', 'reviews.reply', 'reviews.publish',
    'posts.read', 'posts.create', 'posts.publish',
    'analytics.read', 'seo.read', 'seo.write',
    'automation.read', 'automation.create', 'automation.approve', 'automation.execute',
    'billing.read', 'billing.manage',
    'team.manage', 'api.manage'
  ],
  ADMIN: [
    'organization.read',
    'business.read', 'business.write',
    'location.read', 'location.write',
    'reviews.read', 'reviews.reply', 'reviews.publish',
    'posts.read', 'posts.create', 'posts.publish',
    'analytics.read', 'seo.read', 'seo.write',
    'automation.read', 'automation.create', 'automation.approve',
    'team.manage'
  ],
  MANAGER: [
    'business.read',
    'location.read',
    'reviews.read', 'reviews.reply',
    'posts.read', 'posts.create',
    'analytics.read', 'seo.read',
    'automation.read'
  ],
  STAFF: [
    'business.read',
    'reviews.read',
    'posts.read',
    'analytics.read'
  ],
  CLIENT: [
    'business.read',
    'reviews.read',
    'analytics.read'
  ]
};

// Accurate user-friendly Firebase Error Mapping (Requirement 4)
export function formatFirebaseAuthError(error: any): string {
  const code = error?.code || '';
  if (code === 'auth/invalid-credential') {
    return 'Incorrect email or password. Please verify your credentials and try again.';
  }
  if (code === 'auth/user-not-found') {
    return 'No registered account found with this email. Please click "Create New Account" below.';
  }
  if (code === 'auth/wrong-password') {
    return 'Incorrect password. If you forgot your password, please use the "Forgot password?" link below.';
  }
  if (code === 'auth/invalid-email') {
    return 'Please enter a valid email address (e.g. name@company.com).';
  }
  if (code === 'auth/user-disabled') {
    return 'This account has been temporarily disabled. Please contact Qorbiq AI support.';
  }
  if (code === 'auth/too-many-requests') {
    return 'Too many failed login attempts. Access has been temporarily restricted for security. Please wait a moment or reset your password.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Network connection issue. Please check your internet connection and try again.';
  }
  if (code === 'auth/email-already-in-use') {
    return 'This email address is already registered. Please Sign In below or use Forgot Password.';
  }
  if (code === 'auth/weak-password') {
    return 'Password is too weak. Please use at least 6 characters.';
  }
  if (code === 'auth/popup-closed-by-user') {
    return 'Sign in window was closed before completing.';
  }
  if (code === 'permission-denied') {
    return 'Access denied by database security rules. Please verify your credentials.';
  }
  return error?.message || 'Authentication failed. Please verify your credentials.';
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem('saas_auth_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [organization, setOrganization] = useState<OrganizationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Authoritative user synchronization from Firebase User and Firestore Profile
   */
  const syncBackendUser = async (fbUser: FirebaseUser): Promise<AuthUser> => {
    const cleanEmail = (fbUser.email || '').toLowerCase().trim();
    const isSuperAdmin =
      cleanEmail === 'chakankarsai@gmail.com' ||
      cleanEmail === 'chakankarsai@gmail.co' ||
      fbUser.uid === '6d6krJBCmDVgpwDhmhzDNI72pYa2';

    // 1. Fetch Owner Profile from Firestore
    let profile = await loadUserProfileFromFirestore(fbUser.uid);

    // 2. Auto-heal missing profile if user exists in Firebase Auth but missing in Firestore (Requirement 2, 3, 7)
    if (!profile) {
      profile = await recoverOwnerProfileInFirestore({
        uid: fbUser.uid,
        email: cleanEmail,
        displayName: fbUser.displayName || cleanEmail.split('@')[0],
        phoneNumber: fbUser.phoneNumber || ''
      });
    }

    const hasCompletedOnboarding =
      profile?.onboardingStatus === 'COMPLETED' || isSuperAdmin;

    const authUser: AuthUser = {
      uid: fbUser.uid,
      email: cleanEmail,
      displayName: profile?.fullName || profile?.displayName || fbUser.displayName || cleanEmail.split('@')[0] || 'Business Owner',
      photoURL: fbUser.photoURL || null,
      phone: profile?.mobile || profile?.phone || fbUser.phoneNumber || '',
      role: isSuperAdmin ? 'SUPER_ADMIN' : 'CLIENT',
      organizationId: 'org_' + fbUser.uid,
      status: (profile?.status as any) || 'active',
      language: 'en',
      timezone: 'UTC',
      emailVerified: fbUser.emailVerified ?? false,
      onboardingStatus: hasCompletedOnboarding ? 'COMPLETED' : (profile?.onboardingStatus || 'NOT_STARTED'),
      onboardingCompletedAt: profile?.onboardingCompletedAt || (hasCompletedOnboarding ? new Date().toISOString() : null),
      onboardingVersion: 1
    };

    setUser(authUser);
    try {
      localStorage.setItem('saas_auth_user', JSON.stringify(authUser));
    } catch {}

    // Non-blocking sync to edge API
    fetch('/api/auth/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid: fbUser.uid,
        email: cleanEmail,
        displayName: authUser.displayName
      })
    }).catch(() => {});

    return authUser;
  };

  /**
   * Session Initialization via onAuthStateChanged (Requirement 6)
   */
  useEffect(() => {
    if (!auth || !isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    // Explicitly configure local persistence
    if (typeof window !== 'undefined') {
      setPersistence(auth, browserLocalPersistence).catch(() => {});
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          await syncBackendUser(fbUser);
        } catch (err) {
          console.warn('[Auth] Sync warning:', err);
        }
      } else {
        setUser(null);
        try {
          localStorage.removeItem('saas_auth_user');
        } catch {}
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /**
   * Client Login with Firebase Authentication as sole authority (Requirement 3 & 4)
   */
  const loginWithEmail = async (email: string, pass: string, rememberMe = true): Promise<AuthUser> => {
    setError(null);
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = pass;

    if (!cleanEmail) {
      const err = 'Please enter your registered email address.';
      setError(err);
      throw new Error(err);
    }
    if (!cleanPass) {
      const err = 'Please enter your account password.';
      setError(err);
      throw new Error(err);
    }

    if (!auth || !isFirebaseConfigured) {
      throw new Error('Authentication service is not configured. Please check Firebase initialization.');
    }

    // Set persistence based on "Remember Me" option
    try {
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
    } catch {}

    try {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, cleanPass);
      const synced = await syncBackendUser(cred.user);
      return synced;
    } catch (fbErr: any) {
      // Defensive retry with trimmed password if user accidentally copy-pasted with trailing space
      if (cleanPass !== cleanPass.trim()) {
        try {
          const cred = await signInWithEmailAndPassword(auth, cleanEmail, cleanPass.trim());
          const synced = await syncBackendUser(cred.user);
          return synced;
        } catch {}
      }

      const formatted = formatFirebaseAuthError(fbErr);
      setError(formatted);
      throw new Error(formatted);
    }
  };

  /**
   * Client Account Signup with Firebase Auth & Firestore Profile (Requirement 2 & 7)
   */
  const signupWithEmail = async (
    email: string,
    pass: string,
    name: string,
    businessName?: string,
    phone?: string,
    termsAccepted?: boolean
  ): Promise<{ user: AuthUser; shopId: string }> => {
    setError(null);
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const cleanPhone = (phone || '').trim();
    const cleanBiz = (businessName || '').trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      const msg = 'Please enter a valid email address.';
      setError(msg);
      throw new Error(msg);
    }
    if (!pass || pass.length < 6) {
      const msg = 'Password must be at least 6 characters long.';
      setError(msg);
      throw new Error(msg);
    }
    if (!cleanName) {
      const msg = 'Please enter your full name.';
      setError(msg);
      throw new Error(msg);
    }

    if (!auth || !isFirebaseConfigured) {
      throw new Error('Firebase Authentication is not available. Please verify configuration.');
    }

    // Ensure session persistence
    try {
      await setPersistence(auth, browserLocalPersistence);
    } catch {}

    let cred: any;
    try {
      cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
    } catch (createErr: any) {
      const formatted = formatFirebaseAuthError(createErr);
      setError(formatted);
      throw new Error(formatted);
    }

    const firebaseUid = cred.user.uid;

    // Send verification email non-blocking
    try {
      await sendEmailVerification(cred.user);
    } catch {}

    // Create Owner & User profile in Firestore (Requirement 2 & 7)
    await syncUserProfileToFirestore({
      uid: firebaseUid,
      ownerId: firebaseUid,
      fullName: cleanName,
      displayName: cleanName,
      email: cleanEmail,
      mobile: cleanPhone,
      phone: cleanPhone,
      role: 'BUSINESS_OWNER',
      status: 'active',
      accountStatus: 'active',
      profileCompleted: true,
      onboardingStatus: 'NOT_STARTED'
    });

    // Create initial Shop record in Firestore
    const shopId = `biz_${firebaseUid}`;
    await syncBusinessToFirestore({
      id: shopId,
      ownerUid: firebaseUid,
      businessName: cleanBiz || `${cleanName}'s Store`,
      category: 'Retail & Store',
      description: '',
      city: '',
      state: '',
      country: 'India',
      primaryLanguage: 'en',
      googleReviewUrl: '',
      phone: cleanPhone,
      onboardingStatus: 'NOT_STARTED',
      onboardingCompleted: false
    });

    // Sync to backend edge API
    try {
      await freshTestApi.clientSignup({
        uid: firebaseUid,
        email: cleanEmail,
        password: pass,
        name: cleanName,
        businessName: cleanBiz,
        phone: cleanPhone,
        termsAccepted: termsAccepted ?? true,
        emailVerified: false
      });
    } catch (e) {
      console.warn('[Auth] Edge sync notice:', e);
    }

    const authUser: AuthUser = {
      uid: firebaseUid,
      email: cleanEmail,
      displayName: cleanName,
      photoURL: null,
      phone: cleanPhone,
      role: 'CLIENT',
      organizationId: 'org_' + firebaseUid,
      status: 'active',
      language: 'en',
      timezone: 'UTC',
      emailVerified: false,
      onboardingStatus: 'NOT_STARTED',
      onboardingCompletedAt: null,
      onboardingVersion: 1
    };

    setUser(authUser);
    try {
      localStorage.setItem('saas_auth_user', JSON.stringify(authUser));
    } catch {}

    return { user: authUser, shopId };
  };

  /**
   * Google Sign-In
   */
  const loginWithGoogle = async () => {
    setError(null);
    if (!auth || !isFirebaseConfigured) {
      throw new Error('Google Sign-In is not available. Please verify Firebase configuration.');
    }

    try {
      const cred = await signInWithPopup(auth, googleAuthProvider);
      if (cred && cred.user) {
        await syncBackendUser(cred.user);
      }
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user') {
        return;
      }
      const formatted = formatFirebaseAuthError(err);
      setError(formatted);
      throw new Error(formatted);
    }
  };

  /**
   * Super Admin Login
   */
  const loginSuperAdmin = async (adminEmail: string, pass: string): Promise<AuthUser> => {
    setError(null);
    try {
      const res = await freshTestApi.adminLogin(adminEmail.trim(), pass.trim());
      if (res && res.success && res.user) {
        const adminUser: AuthUser = {
          uid: res.user.uid,
          email: res.user.email,
          displayName: res.user.displayName || 'Super Admin',
          role: 'SUPER_ADMIN',
          organizationId: 'platform_master',
          status: 'active',
          language: 'en',
          timezone: 'UTC',
          emailVerified: true,
          onboardingStatus: 'COMPLETED',
          onboardingCompletedAt: new Date().toISOString(),
          onboardingVersion: 1
        };
        setUser(adminUser);
        localStorage.setItem('saas_auth_user', JSON.stringify(adminUser));
        syncUserProfileToFirestore(adminUser);
        return adminUser;
      }
      throw new Error('Access Denied: Invalid administrator credentials or unauthorized account.');
    } catch (err: any) {
      const msg = err.message || 'Access Denied: Invalid administrator credentials.';
      setError(msg);
      throw new Error(msg);
    }
  };

  /**
   * Real Firebase Password Reset Email (Requirement 5)
   */
  const resetPassword = async (email: string) => {
    setError(null);
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      const err = 'Please enter a valid email address.';
      setError(err);
      throw new Error(err);
    }

    if (!auth || !isFirebaseConfigured) {
      throw new Error('Firebase Authentication is not available.');
    }

    try {
      await sendPasswordResetEmail(auth, cleanEmail);
    } catch (err: any) {
      const formatted = formatFirebaseAuthError(err);
      setError(formatted);
      throw new Error(formatted);
    }
  };

  /**
   * Sign Out
   */
  const logout = async () => {
    try {
      if (auth && isFirebaseConfigured) {
        await signOut(auth);
      }
    } catch (e) {
      console.warn('[Auth] Sign out notice:', e);
    }
    try {
      localStorage.removeItem('saas_auth_user');
    } catch {}
    setUser(null);
    setOrganization(null);
    setFirebaseUser(null);
  };

  const resendVerification = async () => {
    if (firebaseUser && !firebaseUser.emailVerified) {
      await sendEmailVerification(firebaseUser);
    }
  };

  const markEmailVerified = async () => {
    if (user) {
      const updated: AuthUser = { ...user, emailVerified: true };
      setUser(updated);
      try {
        localStorage.setItem('saas_auth_user', JSON.stringify(updated));
      } catch {}
    }
  };

  const setOnboardingStatus = (status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED') => {
    if (user) {
      const updated: AuthUser = {
        ...user,
        onboardingStatus: status,
        onboardingCompletedAt: status === 'COMPLETED' ? (user.onboardingCompletedAt || new Date().toISOString()) : user.onboardingCompletedAt
      };
      setUser(updated);
      try {
        localStorage.setItem('saas_auth_user', JSON.stringify(updated));
      } catch {}
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    const permissions = ROLE_PERMISSIONS[user.role] || [];
    return permissions.includes('*') || permissions.includes(permission);
  };

  const refreshUser = async () => {
    if (firebaseUser) {
      await syncBackendUser(firebaseUser);
    }
  };

  const currentOnboardingStatus = user?.onboardingStatus || 'NOT_STARTED';
  const isOnboardingComplete = currentOnboardingStatus === 'COMPLETED';

  const value = useMemo(
    () => ({
      user,
      firebaseUser,
      organization,
      loading,
      error,
      onboardingStatus: currentOnboardingStatus,
      isOnboardingComplete,
      loginWithEmail,
      signupWithEmail,
      loginWithGoogle,
      loginSuperAdmin,
      logout,
      resetPassword,
      resendVerification,
      markEmailVerified,
      setOnboardingStatus,
      hasPermission,
      refreshUser
    }),
    [user, firebaseUser, organization, loading, error, currentOnboardingStatus, isOnboardingComplete, loginSuperAdmin]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
