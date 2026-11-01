import React from 'react';
import { Navigate, useLocation, useParams, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth-context.tsx';
import { useBusiness } from '../lib/business-context.tsx';
import { ShieldAlert, Sparkles } from 'lucide-react';

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
    const fullRedirect = location.pathname + location.search;
    return <Navigate to={`/login?redirect=${encodeURIComponent(fullRedirect)}`} replace />;
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
              to="/app"
              className="w-full sm:w-auto px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl transition-colors"
            >
              Return to Client Portal
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

  // 3. EXEMPT ROUTES: Pricing, Shop Management, Hub, Billing Return
  // Critical Fix: These routes must NEVER be intercepted or redirected to onboarding,
  // preventing infinite redirect loops and blank white screens!
  const isPricingRoute =
    location.pathname === '/app/pricing' ||
    location.pathname === '/pricing';

  const isShopManagementRoute =
    location.pathname === '/app' ||
    location.pathname === '/app/shops' ||
    location.pathname === '/app/shops/create' ||
    location.pathname === '/app/shops/new' ||
    location.pathname === '/shops/create' ||
    location.pathname === '/app/businesses';

  const isBillingRoute =
    location.pathname.startsWith('/app/billing') ||
    location.pathname.startsWith('/billing');

  const isOnboardingRoute =
    location.pathname.startsWith('/onboarding') ||
    location.pathname.startsWith('/app/onboarding');

  // Immediately allow exempt routes to render
  if (isPricingRoute || isShopManagementRoute || isBillingRoute) {
    return <>{children}</>;
  }

  // 4. User has ZERO businesses -> route to Pricing to purchase first plan
  if (businesses.length === 0) {
    return <Navigate to="/app/pricing" replace />;
  }

  // 5. Resolve Target Business (from URL param or active selection)
  let targetBusiness = activeBusiness;
  if (params.businessId) {
    targetBusiness = businesses.find(b => b.id === params.businessId) || null;
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
              to="/app"
              className="inline-flex items-center justify-center px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition"
            >
              Return to Your Shops Hub
            </Link>
          </div>
        </div>
      );
    }
  }

  if (!targetBusiness) {
    targetBusiness = businesses[0];
  }

  const isPaid =
    (targetBusiness as any).paymentStatus === 'paid' ||
    (targetBusiness as any).paymentStatus === 'PAID' ||
    Boolean(targetBusiness.subscription) ||
    ((targetBusiness as any).amountPaid && (targetBusiness as any).amountPaid > 0);

  const isOnboardingComplete =
    targetBusiness.onboardingStatus === 'COMPLETED' || Boolean(targetBusiness.onboardingCompleted);

  // 6. If business onboarding is INCOMPLETE:
  if (!isOnboardingComplete) {
    // If unpaid, intercept attempts to enter dashboard or onboarding
    if (!isPaid) {
      if (location.pathname.startsWith('/app/dashboard') || isOnboardingRoute) {
        return <Navigate to={`/app/pricing?shopId=${targetBusiness.id}`} replace />;
      }
    }

    // If paid but onboarding incomplete, ensure user stays on onboarding for dashboard feature requests
    if (!isOnboardingRoute) {
      return <Navigate to={`/app/onboarding/${targetBusiness.id}`} replace />;
    }
    return <>{children}</>;
  }

  // 7. If business onboarding is COMPLETE:
  // Cannot re-enter onboarding
  if (isOnboardingRoute) {
    return <Navigate to={`/app/dashboard/${targetBusiness.id}`} replace />;
  }

  return <>{children}</>;
};
