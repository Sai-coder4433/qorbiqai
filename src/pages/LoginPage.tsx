import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  QrCode,
  ArrowRight,
  Lock,
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X
} from 'lucide-react';
import { useAuth } from '../lib/auth-context.tsx';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { loginWithEmail, user } = useAuth();

  const redirectUrl = new URLSearchParams(window.location.search).get('redirect') || '/app/dashboard';

  const [email, setEmail] = useState('owner@atharvaelectricals.in');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Auto-redirect if already logged in
  React.useEffect(() => {
    if (user) {
      navigate(redirectUrl, { replace: true });
    }
  }, [user, navigate, redirectUrl]);

  // Forgot password modal
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    try {
      await loginWithEmail(email, password);
      navigate(redirectUrl);
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleInstantAccess = async (targetPath: string, asAdmin: boolean = true) => {
    setLoading(true);
    try {
      const demoEmail = asAdmin ? 'admin@reviewflow.com' : 'owner@atharvaelectricals.in';
      await loginWithEmail(demoEmail, 'password123');
      navigate(targetPath);
    } catch (e: any) {
      setErrorMessage(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;
    setResetSent(true);
    setTimeout(() => {
      setShowForgotModal(false);
      setResetSent(false);
      setResetEmail('');
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col justify-between font-sans">
      {/* Top Simple Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-xs">
              <QrCode className="w-4 h-4" />
            </div>
            <span className="font-bold text-base tracking-tight text-zinc-900 dark:text-white">ReviewFlow</span>
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleInstantAccess(redirectUrl, true)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors flex items-center gap-1.5"
            >
              <span>⚡ Quick Test Login</span>
            </button>
            <Link
              to="/onboarding"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Create Business Account →
            </Link>
          </div>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Sign In to ReviewFlow</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Access your Google Review QR performance, reviews, and operations dashboard.
            </p>
          </div>

          {/* Instant Test Mode Banner */}
          <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                <span>🚀</span> 1-Click Dashboard Access (Testing Mode)
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                Ready
              </span>
            </div>
            <p className="text-[11px] text-blue-700 dark:text-blue-300 leading-tight">
              Click any dashboard below to enter immediately with full Super Admin / Owner privileges:
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
              <button
                type="button"
                onClick={() => handleInstantAccess('/app/dashboard', true)}
                className="p-2 text-left bg-white dark:bg-zinc-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg transition-all text-zinc-800 dark:text-zinc-200 flex flex-col font-medium shadow-xs"
              >
                <span className="font-bold text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                  📊 Analytics Dashboard
                </span>
                <span className="text-[10px] text-zinc-500">6 core metrics & scans</span>
              </button>

              <button
                type="button"
                onClick={() => handleInstantAccess('/app/qr-codes', true)}
                className="p-2 text-left bg-white dark:bg-zinc-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg transition-all text-zinc-800 dark:text-zinc-200 flex flex-col font-medium shadow-xs"
              >
                <span className="font-bold text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  📱 QR Code Manager
                </span>
                <span className="text-[10px] text-zinc-500">Generate & print kits</span>
              </button>

              <button
                type="button"
                onClick={() => handleInstantAccess('/app/reviews', true)}
                className="p-2 text-left bg-white dark:bg-zinc-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg transition-all text-zinc-800 dark:text-zinc-200 flex flex-col font-medium shadow-xs"
              >
                <span className="font-bold text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  ⭐ Google Reviews
                </span>
                <span className="text-[10px] text-zinc-500">Reply & manage rating</span>
              </button>

              <button
                type="button"
                onClick={() => handleInstantAccess('/admin', true)}
                className="p-2 text-left bg-white dark:bg-zinc-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg transition-all text-zinc-800 dark:text-zinc-200 flex flex-col font-medium shadow-xs"
              >
                <span className="font-bold text-xs text-purple-600 dark:text-purple-400 flex items-center gap-1">
                  🛡️ Super Admin
                </span>
                <span className="text-[10px] text-zinc-500">All tenants & system</span>
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="name@business.com"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 dark:text-white"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 dark:text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 px-4 rounded-lg font-semibold text-xs hover:bg-blue-700 transition-colors shadow-xs disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Dashboard'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Pre-fill logins */}
          <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3 flex items-center justify-between text-xs text-zinc-500">
            <span>Pre-fill account:</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setEmail('owner@atharvaelectricals.in'); setPassword('password123'); }}
                className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                Owner
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => { setEmail('admin@reviewflow.com'); setPassword('password123'); }}
                className="text-purple-600 dark:text-purple-400 hover:underline font-medium"
              >
                Super Admin
              </button>
            </div>
          </div>

          <div className="text-center pt-1">
            <span className="text-xs text-zinc-500">Don't have a business account? </span>
            <Link to="/onboarding" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
              Create QR Now
            </Link>
          </div>
        </div>
      </main>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-zinc-900 dark:text-white">Reset Password</h3>
              <button onClick={() => setShowForgotModal(false)} className="text-zinc-400 hover:text-zinc-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {resetSent ? (
              <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 text-center text-xs text-emerald-700 dark:text-emerald-400 space-y-1">
                <CheckCircle2 className="w-5 h-5 mx-auto" />
                <div className="font-bold">Reset Email Sent!</div>
                <p>Check your inbox for password reset instructions.</p>
              </div>
            ) : (
              <form onSubmit={handleSendReset} className="space-y-4 text-xs">
                <p className="text-zinc-500 leading-relaxed">
                  Enter your business account email and we'll send you a password reset link.
                </p>
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={e => setResetEmail(e.target.value)}
                    placeholder="name@business.com"
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs dark:text-white"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-600 dark:text-zinc-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm"
                  >
                    Send Reset Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-4 text-center text-xs text-zinc-400">
        ReviewFlow • Direct Google Review QR Code Platform
      </footer>
    </div>
  );
};
