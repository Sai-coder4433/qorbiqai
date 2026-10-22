import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { QrCode, Lock, Mail, ArrowRight, AlertCircle, Building2, ShieldCheck, Sparkles } from 'lucide-react';
import { freshTestApi } from '../../lib/fresh-test-api.ts';

export const CrmLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage('Please enter your sales email address and password.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      const res = await freshTestApi.crmLogin(email.trim(), password);
      if (res.user) {
        localStorage.setItem('rf_sales_user', JSON.stringify(res.user));
        navigate('/crm');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Sales login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSalesLogin = () => {
    setEmail('sales@reviewflow.com');
    setPassword('password123');
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between font-sans">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-xs">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-slate-900 block leading-tight">ReviewFlow AI</span>
              <span className="text-[10px] text-blue-600 font-semibold tracking-wider uppercase">Sales CRM Portal</span>
            </div>
          </Link>
          <Link to="/login" className="text-xs font-semibold text-slate-600 hover:text-slate-900 hover:underline">
            Client Portal &rarr;
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-xs p-8 space-y-6">
          <div className="text-center space-y-1">
            <div className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Authorized Sales & Account Executives</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Sales CRM Login</h1>
            <p className="text-xs text-slate-500">
              Sign in to manage client inquiries, pipeline, and renewals.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Sales Work Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                <input
                  type="email"
                  name="sales_email"
                  id="sales_email"
                  autoComplete="off"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="sales@reviewflow.com"
                  className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                <input
                  type="password"
                  name="sales_password"
                  id="sales_password"
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 px-4 rounded-xl font-bold text-xs sm:text-sm hover:bg-indigo-700 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Sales CRM'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Sales Button */}
          <div className="border-t border-slate-100 pt-4 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block text-center">
              Quick Test Credentials
            </span>
            <button
              type="button"
              onClick={handleQuickSalesLogin}
              className="w-full p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-700 text-left space-y-0.5 cursor-pointer"
            >
              <div className="font-semibold text-xs flex items-center justify-between">
                <span>Sales Representative</span>
                <span className="text-[10px] text-indigo-600 font-mono font-bold">1-Click Fill</span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">sales@reviewflow.com • password123</div>
            </button>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-4 px-6 text-center text-xs text-slate-400">
        ReviewFlow AI • Internal Sales & Pipeline Management
      </footer>
    </div>
  );
};
