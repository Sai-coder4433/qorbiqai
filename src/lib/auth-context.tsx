import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  User as FirebaseUser
} from 'firebase/auth';
import { auth, googleAuthProvider, isFirebaseConfigured } from './firebase.ts';
import { fetchApi } from './api.ts';
import { freshTestApi } from './fresh-test-api.ts';
import { syncUserProfileToFirestore } from './firestore-sync.ts';

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
  loginWithEmail: (email: string, pass: string) => Promise<AuthUser>;
  signupWithEmail: (
    email: string,
    pass: string,
    name: string,
    businessName?: string,
    phone?: string,
    termsAccepted?: boolean
  ) => Promise<void>;
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

function formatFirebaseAuthError(error: any): string {
  const code = error?.code || '';
  if (code === 'auth/user-not-found') {
    return 'No account exists with this email.';
  }
  if (code === 'auth/wrong-password') {
    return 'Incorrect password.';
  }
  if (code === 'auth/invalid-credential') {
    return 'Email or password is incorrect.';
  }
  if (code === 'auth/too-many-requests') {
    return 'Too many attempts. Please try again later.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Network error. Check your internet connection and try again.';
  }
  if (code === 'auth/email-already-in-use') {
    return 'An account already exists with this email.';
  }
  if (code === 'auth/weak-password') {
    return 'Password is too weak. Please use at least 6 characters.';
  }
  if (code === 'auth/invalid-email') {
    return 'Please enter a valid email address.';
  }
  if (code === 'auth/configuration-not-found') {
    return 'Firebase Authentication is initializing or not yet enabled in the Firebase Console. Please enable Email/Password sign-in in Firebase.';
  }
  return error?.message || 'Authentication failed. Please check your credentials.';
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [organization, setOrganization] = useState<OrganizationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const syncBackendUser = async (fbUser: FirebaseUser): Promise<AuthUser> => {
    try {
      const res = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName || fbUser.email?.split('@')[0]
        })
      });
      let data: any = {};
      try {
        const text = await res.text();
        if (text && text.trim()) data = JSON.parse(text);
      } catch {
        // Safe fallback
      }
      if (data && data.user) {
        const hasCompletedOnboarding = data.user.onboardingStatus === 'COMPLETED';
        const authUser: AuthUser = {
          uid: data.user.uid,
          email: data.user.email,
          displayName: data.user.displayName,
          photoURL: fbUser.photoURL,
          role: data.user.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'CLIENT',
          organizationId: 'org_' + data.user.uid,
          status: data.user.status || 'active',
          language: 'en',
          timezone: 'UTC',
          emailVerified: fbUser.emailVerified ?? data.user.emailVerified ?? false,
          onboardingStatus: hasCompletedOnboarding ? 'COMPLETED' : (data.user.onboardingStatus || 'NOT_STARTED'),
          onboardingCompletedAt: data.user.onboardingCompletedAt || (hasCompletedOnboarding ? new Date().toISOString() : null),
          onboardingVersion: data.user.onboardingVersion || 1
        };
        setUser(authUser);
        // Sync to Firestore without blocking
        syncUserProfileToFirestore(authUser).catch(() => {});
        return authUser;
      }
    } catch (err: any) {
      console.warn('[Auth] Server sync fallback:', err?.message);
    }

    const fallbackUser: AuthUser = {
      uid: fbUser.uid,
      email: fbUser.email,
      displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
      photoURL: fbUser.photoURL,
      role: 'CLIENT',
      organizationId: 'org_' + fbUser.uid,
      status: 'active',
      language: 'en',
      timezone: 'UTC',
      emailVerified: fbUser.emailVerified,
      onboardingStatus: 'NOT_STARTED',
      onboardingCompletedAt: null,
      onboardingVersion: 1
    };
    setUser(fallbackUser);
    syncUserProfileToFirestore(fallbackUser).catch(() => {});
    return fallbackUser;
  };

  useEffect(() => {
    if (!auth || !isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        await syncBackendUser(fbUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email: string, pass: string): Promise<AuthUser> => {
    setError(null);

    // Primary: Firebase Authentication as real source of truth for user credentials (Section 3, 5, 6)
    if (auth && isFirebaseConfigured) {
      try {
        const cred = await signInWithEmailAndPassword(auth, email, pass);
        const synced = await syncBackendUser(cred.user);
        return synced;
      } catch (fbErr: any) {
        const formatted = formatFirebaseAuthError(fbErr);
        // If it's a network error or Firebase config pending in console, try server auth
        if (fbErr?.code === 'auth/network-request-failed' || fbErr?.code === 'auth/configuration-not-found') {
          try {
            const res = await freshTestApi.clientLogin({ email, password: pass });
            if (res && res.user) {
              const hasCompleted = res.user.onboardingStatus === 'COMPLETED' || Boolean(res.business?.onboardingCompleted);
              const authUser: AuthUser = {
                uid: res.user.uid,
                email: res.user.email,
                displayName: res.user.displayName,
                role: res.user.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'CLIENT',
                organizationId: 'org_' + res.user.uid,
                status: res.user.status || 'active',
                language: 'en',
                timezone: 'UTC',
                emailVerified: res.user.emailVerified ?? false,
                onboardingStatus: hasCompleted ? 'COMPLETED' : (res.user.onboardingStatus || 'NOT_STARTED'),
                onboardingCompletedAt: res.user.onboardingCompletedAt || (hasCompleted ? new Date().toISOString() : null),
                onboardingVersion: res.user.onboardingVersion || 1
              };
              setUser(authUser);
              localStorage.setItem('saas_auth_user', JSON.stringify(authUser));
              return authUser;
            }
          } catch {
            // Keep original formatted Firebase error
          }
        }
        setError(formatted);
        throw new Error(formatted);
      }
    }

    // Secondary: Server-backed ReviewFlow authentication
    try {
      const res = await freshTestApi.clientLogin({ email, password: pass });
      if (res && res.user) {
        const hasCompletedOnboarding = res.user.onboardingStatus === 'COMPLETED' || Boolean(res.business?.onboardingCompleted);
        const authUser: AuthUser = {
          uid: res.user.uid,
          email: res.user.email,
          displayName: res.user.displayName,
          role: res.user.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'CLIENT',
          organizationId: 'org_' + res.user.uid,
          status: res.user.status || 'active',
          language: 'en',
          timezone: 'UTC',
          emailVerified: res.user.emailVerified ?? false,
          onboardingStatus: hasCompletedOnboarding ? 'COMPLETED' : (res.user.onboardingStatus || 'NOT_STARTED'),
          onboardingCompletedAt: res.user.onboardingCompletedAt || (hasCompletedOnboarding ? new Date().toISOString() : null),
          onboardingVersion: res.user.onboardingVersion || 1
        };
        setUser(authUser);
        localStorage.setItem('saas_auth_user', JSON.stringify(authUser));
        return authUser;
      }
    } catch (err: any) {
      const msg = err.message || 'Login failed. Please check your credentials.';
      setError(msg);
      throw new Error(msg);
    }
    throw new Error('Login failed: invalid response.');
  };

  const signupWithEmail = async (
    email: string,
    pass: string,
    name: string,
    businessName?: string,
    phone?: string,
    termsAccepted?: boolean
  ) => {
    setError(null);

    // Primary: Firebase Auth user creation (Section 7)
    if (auth && isFirebaseConfigured) {
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, pass);
        // Send email verification
        try {
          await sendEmailVerification(cred.user);
        } catch {
          // ignore verification send fail
        }

        // Register client profile safely with Firebase UID (Section 7, 8: NO BUSINESS CREATED)
        await freshTestApi.clientSignup({
          uid: cred.user.uid,
          email,
          password: pass,
          name,
          businessName,
          phone,
          termsAccepted: true,
          emailVerified: false
        });

        const authUser: AuthUser = {
          uid: cred.user.uid,
          email: cred.user.email,
          displayName: name.trim(),
          role: 'CLIENT',
          organizationId: 'org_' + cred.user.uid,
          status: 'active',
          language: 'en',
          timezone: 'UTC',
          emailVerified: false,
          onboardingStatus: 'NOT_STARTED',
          onboardingCompletedAt: null,
          onboardingVersion: 1
        };
        setUser(authUser);
        localStorage.setItem('saas_auth_user', JSON.stringify(authUser));
        return;
      } catch (fbErr: any) {
        if (fbErr?.code === 'auth/configuration-not-found' || fbErr?.code === 'auth/network-request-failed') {
          try {
            const res = await freshTestApi.clientSignup({
              email,
              password: pass,
              name,
              businessName,
              phone,
              termsAccepted: true,
              emailVerified: false
            });
            if (res && res.user) {
              const authUser: AuthUser = {
                uid: res.user.uid,
                email: res.user.email,
                displayName: res.user.displayName,
                role: 'CLIENT',
                organizationId: 'org_' + res.user.uid,
                status: 'active',
                language: 'en',
                timezone: 'UTC',
                emailVerified: false,
                onboardingStatus: 'NOT_STARTED',
                onboardingCompletedAt: null,
                onboardingVersion: 1
              };
              setUser(authUser);
              localStorage.setItem('saas_auth_user', JSON.stringify(authUser));
              return;
            }
          } catch (serverErr: any) {
            const serverMsg = serverErr.message || 'Signup failed.';
            setError(serverMsg);
            throw new Error(serverMsg);
          }
        }
        const formatted = formatFirebaseAuthError(fbErr);
        setError(formatted);
        throw new Error(formatted);
      }
    }

    // Secondary / Server-backed signup
    try {
      const res = await freshTestApi.clientSignup({
        email,
        password: pass,
        name,
        businessName,
        phone,
        termsAccepted,
        emailVerified: false
      });
      if (res && res.user) {
        const authUser: AuthUser = {
          uid: res.user.uid,
          email: res.user.email,
          displayName: res.user.displayName,
          role: res.user.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'CLIENT',
          organizationId: 'org_' + res.user.uid,
          status: res.user.status || 'active',
          language: 'en',
          timezone: 'UTC',
          emailVerified: false,
          onboardingStatus: 'NOT_STARTED',
          onboardingCompletedAt: null,
          onboardingVersion: 1
        };
        setUser(authUser);
        localStorage.setItem('saas_auth_user', JSON.stringify(authUser));
        return;
      }
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please try again.');
      throw err;
    }
  };

  const loginWithGoogle = async () => {
    setError(null);
    if (!auth || !isFirebaseConfigured) {
      throw new Error('Google Sign-In is not available. Please verify Firebase configuration.');
    }

    try {
      const cred = await signInWithPopup(auth, googleAuthProvider);
      if (cred && cred.user) {
        const synced = await syncBackendUser(cred.user);
        syncUserProfileToFirestore({
          uid: cred.user.uid,
          email: cred.user.email || '',
          displayName: cred.user.displayName || '',
          role: synced.role,
          status: 'active',
          onboardingStatus: synced.onboardingStatus
        });
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

  const logout = async () => {
    if (auth && isFirebaseConfigured) {
      await signOut(auth);
    }
    localStorage.removeItem('saas_auth_user');
    setUser(null);
    setOrganization(null);
    setFirebaseUser(null);
  };

  const resetPassword = async (email: string) => {
    setError(null);
    try {
      await freshTestApi.requestPasswordReset(email);
    } catch (err: any) {
      if (auth && isFirebaseConfigured) {
        await sendPasswordResetEmail(auth, email);
        return;
      }
      setError(err.message || 'Failed to request password reset.');
      throw err;
    }
  };

  const resendVerification = async () => {
    if (!auth || !isFirebaseConfigured) {
      if (user) {
        const updated = { ...user, emailVerified: true };
        setUser(updated);
        localStorage.setItem('saas_auth_user', JSON.stringify(updated));
      }
      return;
    }
    if (firebaseUser && !firebaseUser.emailVerified) {
      await sendEmailVerification(firebaseUser);
    }
  };

  const markEmailVerified = async () => {
    try {
      await freshTestApi.verifyEmail();
    } catch {
      // Local fallback
    }
    if (user) {
      const updated: AuthUser = { ...user, emailVerified: true };
      setUser(updated);
      localStorage.setItem('saas_auth_user', JSON.stringify(updated));
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
      localStorage.setItem('saas_auth_user', JSON.stringify(updated));
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
