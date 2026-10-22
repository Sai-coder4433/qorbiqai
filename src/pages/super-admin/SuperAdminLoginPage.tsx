import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Lock, AlertCircle, ArrowRight, RefreshCw, KeyRound, Server } from 'lucide-react';
import { useAuth } from '../../lib/auth-context.tsx';

export const SuperAdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loginSuperAdmin } = useAuth();

  const [email, setEmail] = useState('chakankarsai@gmail.co');
  const [password, setPassword] = useState('Sai@@2907crm');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both administrator email and password.');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);

      // Authenticate via AuthContext with server validation
      await loginSuperAdmin(email.trim(), password.trim());

      // Navigate to Super Admin overview
      navigate('/super-admin');
    } catch (err: any) {
      if (err.message?.includes('disabled') || err.message?.includes('suspended')) {
        setErrorMessage('Account disabled: This administrator account has been deactivated.');
      } else {
        setErrorMessage('Access Denied: Invalid administrator credentials or incorrect password.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center items-center p-4 font-sans selection:bg-blue-100 selection:text-blue-900">
      <div className="w-full max-w-md space-y-8">
        {/* Brand & Security Header */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto shadow-md">
            <Lock className="w-7 h-7 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">ReviewFlow AI</h1>
            <p className="text-xs font-mono uppercase tracking-widest text-blue-600 mt-1 font-semibold">
              Super Admin Gateway
            </p>
          </div>
          <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
            Restricted access. All access attempts, session authorizations, and privileged operations are strictly audited.
          </p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-7 sm:p-8 shadow-xl space-y-5">
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-semibold block">Authorization Failed</span>
                <span className="text-[11px] text-rose-600/90 leading-tight block">{errorMessage}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="adminEmail" className="block text-xs font-semibold text-slate-700">
                Administrator Email
              </label>
              <input
                id="adminEmail"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="chakankarsai@gmail.co"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden transition-all font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="adminPassword" className="block text-xs font-semibold text-slate-700">
                Master Security Key / Password
              </label>
              <input
                id="adminPassword"
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden transition-all font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-50 active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying Server Permissions...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Authenticate as Super Admin</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Pre-fill test credentials for review verification */}
          <div className="pt-3 border-t border-slate-100">
            <div className="text-[11px] text-slate-500 flex items-center justify-between">
              <span>Super Admin Master:</span>
              <button
                type="button"
                onClick={() => {
                  setEmail('chakankarsai@gmail.co');
                  setPassword('Sai@@2907crm');
                }}
                className="text-blue-600 hover:text-blue-800 font-mono text-[11px] font-semibold underline cursor-pointer"
              >
                chakankarsai@gmail.co
              </button>
            </div>
          </div>
        </div>

        {/* Footer Link to Client Sign In */}
        <div className="text-center text-xs text-slate-500">
          <span>Are you a business owner? </span>
          <Link to="/login" className="text-blue-600 hover:underline font-semibold">
            Go to Client Login
          </Link>
        </div>
      </div>
    </div>
  );
};
