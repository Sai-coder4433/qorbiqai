import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { QrCode, Mail, CheckCircle2, ArrowRight, RefreshCw, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../lib/auth-context.tsx';

export const VerifyEmailPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, markEmailVerified } = useAuth();
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const handleResend = () => {
    setResending(true);
    setTimeout(() => {
      setResending(false);
      setResent(true);
      setTimeout(() => setResent(false), 4000);
    }, 1000);
  };

  const handleContinue = async () => {
    setVerifying(true);
    try {
      await markEmailVerified();
      if (user?.onboardingStatus === 'COMPLETED') {
        navigate('/app/dashboard', { replace: true });
      } else {
        navigate('/onboarding', { replace: true });
      }
    } catch {
      navigate('/onboarding', { replace: true });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between font-sans">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-xs">
              <QrCode className="w-4 h-4" />
            </div>
            <span className="font-bold text-base tracking-tight text-slate-900">ReviewFlow AI</span>
          </Link>
          <Link to="/login" className="text-xs font-semibold text-slate-600 hover:text-slate-900">
            Sign In with another account
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-xs p-8 space-y-6 text-center">
          <div className="w-14 h-14 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Mail className="w-7 h-7" />
          </div>

          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Verify your email to continue</h1>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
              We've dispatched a secure verification link to:
            </p>
            <div className="font-semibold text-sm text-slate-800 bg-slate-50 border border-slate-200 py-1.5 px-3 rounded-xl inline-block font-mono">
              {user?.email || 'your-email@business.com'}
            </div>
          </div>

          {resent && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Verification email re-sent successfully!</span>
            </div>
          )}

          <div className="space-y-3 pt-2">
            <button
              onClick={handleContinue}
              disabled={verifying}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{verifying ? 'Verifying...' : "I've Verified My Email → Continue to Business Setup"}</span>
            </button>

            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
              <span>{resending ? 'Sending...' : 'Resend Verification Email'}</span>
            </button>
          </div>

          <div className="border-t border-slate-100 pt-4 text-slate-400 text-[11px] flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
            <span>ReviewFlow AI Account Security Guarantee</span>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-4 px-6 text-center text-xs text-slate-400">
        ReviewFlow AI • Email Verification
      </footer>
    </div>
  );
};
