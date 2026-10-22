import React from 'react';
import { Navigate, useLocation, useParams, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth-context.tsx';
import { useBusiness } from '../lib/business-context.tsx';
import { ShieldAlert, Sparkles, Building2 } from 'lucide-react';

interface AuthGateProps {
  children: React.ReactNode;
  requireSuperAdmin?: boolean;
}

export const AuthGate: React.FC<AuthGateProps> = ({ children, requireSuperAdmin = false }) => {
  const { user, loading: authLoading } = useAuth();
  const { businesses, activeBusiness, loading: bizLoading } = useBusiness();
  const location = useLocation();
  const params = useParams<{ businessId?: string }>();

  // Full page skeleton loader — ensures zero dashboard flash before validation
  if (authLoading || (user && bizLoading)) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
        <div className="w-full max-w-sm bg-white rounded-3xl border border-slate-200/80 p-8 shadow-sm text-center space-y-4 animate-pulse">
          <div className="w-12 h-12 bg-blue-100 rounded-2xl mx-auto flex items-center justify-center text-blue-600">
            <Sparkles className="w-6 h-6 animate-spin" />
          </div>
          <div>
            <div className="h-4 bg-slate-200 rounded w-1/2 mx-auto mb-2" />
            <div className="h-3 bg-slate-100 rounded w-3/4 mx-auto" />
          </div>
          <div className="pt-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Verifying Workspace & Permissions...
          </div>
        </div>
      </div>
    );
  }

  // 1. Not Authenticated -> Redirect to Login
  if (!user) {
    if (requireSuperAdmin) {
      return <Navigate to="/super-admin/login" replace />;
    }
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // 2. Super Admin Check
  if (requireSuperAdmin && user.role !== 'SUPER_ADMIN') {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 bg-rose-950 text-rose-400 border border-rose-800 rounded-2xl flex items-center justify-center mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">403 — Access Denied</h2>
            <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
              Super Admin authorization is strictly required to access this portal. Your account does not have administrative privileges.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
            <Link
              to="/app/dashboard"
              className="w-full sm:w-auto px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl transition-colors"
            >
              Return to Client App
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Super Admin bypass for client workspace checks
  if (user.role === 'SUPER_ADMIN') {
    return <>{children}</>;
  }

  // 3. User has ZERO businesses
  if (businesses.length === 0) {
    const isPricingOrBusinesses =
      location.pathname === '/app/pricing' ||
      location.pathname === '/pricing' ||
      location.pathname === '/app/businesses';

    if (!isPricingOrBusinesses) {
      return <Navigate to="/app/pricing" replace />;
    }
    return <>{children}</>;
  }

  // 4. Resolve Target Business (from URL param or active selection)
  let targetBusiness = activeBusiness;
  if (params.businessId) {
    targetBusiness = businesses.find(b => b.id === params.businessId) || null;
    // TEST 9: User tries to access Business B using Business A URL or unowned business -> 403
    if (!targetBusiness) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-4 shadow-sm">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">403 — Access Denied</h2>
            <p className="text-xs text-slate-600">
              You do not have permission to view or manage this business workspace.
            </p>
            <Link
              to="/app/dashboard"
              className="inline-flex items-center justify-center px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition"
            >
              Return to Your Active Business
            </Link>
          </div>
        </div>
      );
    }
  }

  if (!targetBusiness) {
    targetBusiness = businesses[0];
  }

  const isOnboardingComplete =
    targetBusiness.onboardingStatus === 'COMPLETED' || Boolean(targetBusiness.onboardingCompleted);

  const isOnboardingRoute =
    location.pathname.startsWith('/onboarding') ||
    location.pathname.startsWith('/app/onboarding');

  // 5. If business onboarding is INCOMPLETE:
  // Must NOT render /app/dashboard. Direct URL access must not bypass guard.
  if (!isOnboardingComplete) {
    if (!isOnboardingRoute) {
      return <Navigate to={`/app/onboarding/${targetBusiness.id}`} replace />;
    }
    return <>{children}</>;
  }

  // 6. If business onboarding is COMPLETE:
  // Cannot re-enter onboarding.
  if (isOnboardingRoute) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return <>{children}</>;
};
