/**
 * REVIEWFLOW AI — Multi-Business Google Review Assistance SaaS
 * URL Routing Structure strictly matching Section 4
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';

// Providers & Protections
import { AuthProvider } from './lib/auth-context.tsx';
import { BusinessProvider } from './lib/business-context.tsx';
import { ProtectedRoute } from './components/ProtectedRoute.tsx';

// Layouts
import { AppLayout } from './components/layout/AppLayout.tsx';
import { SuperAdminLayout } from './components/super-admin/SuperAdminLayout.tsx';

// Public Pages (Section 4)
import { LandingPage } from './pages/LandingPage.tsx';
import { PricingPage } from './pages/PricingPage.tsx';
import { BillingReturnPage } from './pages/BillingReturnPage.tsx';
import { LoginPage, SignupPage, ForgotPasswordPage } from './pages/fresh-test/AuthPages.tsx';

// Client Auth Extras
import { VerifyEmailPage } from './pages/fresh-test/VerifyEmailPage.tsx';
import { ResetPasswordPage } from './pages/fresh-test/ResetPasswordPage.tsx';

// Sales CRM Portal (Section 6, 9-17)
import { CrmLoginPage } from './pages/crm/CrmLoginPage.tsx';
import { SalesCrmPage } from './pages/crm/SalesCrmPage.tsx';

// Customer Review Assistance Flow (Section 4 & 20-25)
import { CustomerReviewPage } from './pages/fresh-test/CustomerReviewPage.tsx';

// Client Application Pages (Section 4)
import { DashboardPage } from './pages/fresh-test/DashboardPage.tsx';
import { BusinessProfilePage } from './pages/fresh-test/BusinessProfilePage.tsx';
import { BusinessesPage } from './pages/fresh-test/BusinessesPage.tsx';
import { CreditsPage } from './pages/fresh-test/CreditsPage.tsx';
import { OnboardingWizardPage } from './pages/fresh-test/OnboardingWizardPage.tsx';
import { QrAutomationPage } from './pages/fresh-test/QrAutomationPage.tsx';
import { AnalyticsPage } from './pages/fresh-test/AnalyticsPage.tsx';
import { BillingPage } from './pages/fresh-test/BillingPage.tsx';
import { AccountSettingsPage } from './pages/fresh-test/AccountSettingsPage.tsx';

// Super Admin Pages (Section 4, 5, 6, 8, 9, 10)
import { SuperAdminLoginPage } from './pages/super-admin/SuperAdminLoginPage.tsx';
import { SuperAdminOverviewPage } from './pages/super-admin/SuperAdminOverviewPage.tsx';
import { SuperAdminClientsPage } from './pages/super-admin/SuperAdminClientsPage.tsx';
import { SuperAdminClientDetailPage } from './pages/super-admin/SuperAdminClientDetailPage.tsx';
import { SuperAdminBusinessesPage } from './pages/super-admin/SuperAdminBusinessesPage.tsx';
import { SuperAdminSubscriptionsPage } from './pages/super-admin/SuperAdminSubscriptionsPage.tsx';
import { SuperAdminAnalyticsPage } from './pages/super-admin/SuperAdminAnalyticsPage.tsx';
import { SuperAdminSystemPage } from './pages/super-admin/SuperAdminSystemPage.tsx';
import { SuperAdminAuditLogsPage } from './pages/super-admin/SuperAdminAuditLogsPage.tsx';
import { SuperAdminEmployeesPage } from './pages/super-admin/SuperAdminEmployeesPage.tsx';
import { SuperAdminLeadsPage } from './pages/super-admin/SuperAdminLeadsPage.tsx';
import { SuperAdminPlansPage } from './pages/super-admin/SuperAdminPlansPage.tsx';
import { SuperAdminDynamicQrPage } from './pages/super-admin/SuperAdminDynamicQrPage.tsx';
import { SuperAdminAiUsagePage } from './pages/super-admin/SuperAdminAiUsagePage.tsx';
import { SuperAdminPaymentsPage } from './pages/super-admin/SuperAdminPaymentsPage.tsx';

export default function App() {
  return (
    <AuthProvider>
      <BusinessProvider>
        <BrowserRouter>
          <Routes>
            {/* ======================================================== */}
            {/* 1. PUBLIC ROUTES (Section 4 & 6) */}
            {/* ======================================================== */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signin" element={<Navigate to="/login" replace />} />
            <Route path="/sign-in" element={<Navigate to="/login" replace />} />
            <Route path="/signon" element={<Navigate to="/login" replace />} />
            <Route path="/sign-on" element={<Navigate to="/login" replace />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/sign-up" element={<Navigate to="/signup" replace />} />
            <Route path="/register" element={<Navigate to="/signup" replace />} />
            <Route path="/create-account" element={<Navigate to="/signup" replace />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/billing/return" element={<BillingReturnPage />} />
            <Route path="/app/billing/return" element={<BillingReturnPage />} />

            {/* ======================================================== */}
            {/* 2. CUSTOMER REVIEW FLOW (/r/:code & /review/c/:code) */}
            {/* ======================================================== */}
            <Route path="/r/:code" element={<CustomerReviewPage />} />
            <Route path="/review/:uniqueQrCodeId" element={<CustomerReviewPage />} />
            <Route path="/review/c/:uniqueQrCodeId" element={<CustomerReviewPage />} />

            {/* ======================================================== */}
            {/* 2.5 SALES CRM */}
            {/* ======================================================== */}
            <Route path="/crm/login" element={<CrmLoginPage />} />
            <Route path="/crm" element={<SalesCrmPage />} />

            {/* ======================================================== */}
            {/* Onboarding Routes (Dedicated Setup Flow) */}
            {/* ======================================================== */}
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <OnboardingWizardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/onboarding/:businessId"
              element={
                <ProtectedRoute>
                  <OnboardingWizardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/onboarding"
              element={
                <ProtectedRoute>
                  <OnboardingWizardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/onboarding/:businessId"
              element={
                <ProtectedRoute>
                  <OnboardingWizardPage />
                </ProtectedRoute>
              }
            />

            {/* ======================================================== */}
            {/* 3. CLIENT APPLICATION (/app/*) */}
            {/* ======================================================== */}
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <Navigate to="/app/dashboard" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/dashboard"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <DashboardPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/dashboard/:businessId"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <DashboardPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/businesses"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <BusinessesPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/pricing"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <PricingPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/business"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <BusinessProfilePage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/business/:businessId"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <BusinessProfilePage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
          <Route
            path="/app/business"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <BusinessProfilePage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/credits"
            element={<Navigate to="/app/billing" replace />}
          />
          <Route
            path="/app/onboarding"
            element={<Navigate to="/onboarding" replace />}
          />
          <Route
            path="/app/qr"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <QrAutomationPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/qr-automation"
            element={<Navigate to="/app/qr" replace />}
          />
          <Route
            path="/app/analytics"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <AnalyticsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/billing"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <BillingPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/settings"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <AccountSettingsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* ======================================================== */}
          {/* 4. SUPER ADMIN PORTAL (Section 4, 5, 6, 8, 9, 10, 11) */}
          {/* ======================================================== */}
          <Route path="/super-admin/login" element={<SuperAdminLoginPage />} />

          <Route
            path="/super-admin"
            element={
              <ProtectedRoute requireSuperAdmin={true}>
                <SuperAdminLayout>
                  <SuperAdminOverviewPage />
                </SuperAdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/dashboard"
            element={
              <ProtectedRoute requireSuperAdmin={true}>
                <SuperAdminLayout>
                  <SuperAdminOverviewPage />
                </SuperAdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/businesses"
            element={
              <ProtectedRoute requireSuperAdmin={true}>
                <SuperAdminLayout>
                  <SuperAdminBusinessesPage />
                </SuperAdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/subscriptions"
            element={
              <ProtectedRoute requireSuperAdmin={true}>
                <SuperAdminLayout>
                  <SuperAdminSubscriptionsPage />
                </SuperAdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/payments"
            element={
              <ProtectedRoute requireSuperAdmin={true}>
                <SuperAdminLayout>
                  <SuperAdminPaymentsPage />
                </SuperAdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/plans"
            element={
              <ProtectedRoute requireSuperAdmin={true}>
                <SuperAdminLayout>
                  <SuperAdminPlansPage />
                </SuperAdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/dynamic-qr"
            element={
              <ProtectedRoute requireSuperAdmin={true}>
                <SuperAdminLayout>
                  <SuperAdminDynamicQrPage />
                </SuperAdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/ai-usage"
            element={
              <ProtectedRoute requireSuperAdmin={true}>
                <SuperAdminLayout>
                  <SuperAdminAiUsagePage />
                </SuperAdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/employees"
            element={
              <ProtectedRoute requireSuperAdmin={true}>
                <SuperAdminLayout>
                  <SuperAdminEmployeesPage />
                </SuperAdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/crm"
            element={
              <ProtectedRoute requireSuperAdmin={true}>
                <SuperAdminLayout>
                  <SuperAdminLeadsPage />
                </SuperAdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/leads"
            element={
              <ProtectedRoute requireSuperAdmin={true}>
                <SuperAdminLayout>
                  <SuperAdminLeadsPage />
                </SuperAdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/analytics"
            element={
              <ProtectedRoute requireSuperAdmin={true}>
                <SuperAdminLayout>
                  <SuperAdminAnalyticsPage />
                </SuperAdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/audit-logs"
            element={
              <ProtectedRoute requireSuperAdmin={true}>
                <SuperAdminLayout>
                  <SuperAdminAuditLogsPage />
                </SuperAdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/settings"
            element={
              <ProtectedRoute requireSuperAdmin={true}>
                <SuperAdminLayout>
                  <SuperAdminSystemPage />
                </SuperAdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/system"
            element={
              <ProtectedRoute requireSuperAdmin={true}>
                <SuperAdminLayout>
                  <SuperAdminSystemPage />
                </SuperAdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/clients"
            element={
              <ProtectedRoute requireSuperAdmin={true}>
                <SuperAdminLayout>
                  <SuperAdminClientsPage />
                </SuperAdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/clients/:clientId"
            element={
              <ProtectedRoute requireSuperAdmin={true}>
                <SuperAdminLayout>
                  <SuperAdminClientDetailPage />
                </SuperAdminLayout>
              </ProtectedRoute>
            }
          />

          {/* Legacy & Fallback Redirects */}
          <Route path="/admin" element={<Navigate to="/super-admin/login" replace />} />
          <Route path="/admin/*" element={<Navigate to="/super-admin/login" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </BusinessProvider>
  </AuthProvider>
  );
}
