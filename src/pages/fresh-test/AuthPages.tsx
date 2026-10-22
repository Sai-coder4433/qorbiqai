import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  QrCode,
  ArrowRight,
  Lock,
  Mail,
  User,
  AlertCircle,
  CheckCircle2,
  Building2,
  Sparkles,
  Eye,
  EyeOff,
  KeyRound,
  ShieldCheck,
  RefreshCw,
  Phone
} from 'lucide-react';
import { useAuth } from '../../lib/auth-context.tsx';
import { freshTestApi } from '../../lib/fresh-test-api.ts';

// ========================================================
// CLIENT LOGIN PAGE
// ========================================================
export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithEmail, user, logout } = useAuth();

  const redirectUrl = new URLSearchParams(location.search).get('redirect') || '/app/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage('Please enter both your business email address and password.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      const loggedIn = await loginWithEmail(email.trim(), password);
      if (loggedIn.role === 'SUPER_ADMIN') {
        navigate('/super-admin');
      } else if (loggedIn.onboardingStatus !== 'COMPLETED') {
        navigate('/onboarding', { replace: true });
      } else {
        const target = redirectUrl && redirectUrl !== '/onboarding' && redirectUrl !== '/verify-email'
          ? redirectUrl
          : '/app/dashboard';
        navigate(target, { replace: true });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
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
          <Link
            to="/signup"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
          >
            Create New Account &rarr;
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-xs p-8 space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Business Sign In</h1>
            <p className="text-xs text-slate-500">
              Sign in to manage your Google Review QR stand and analytics.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Business Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                <input
                  type="email"
                  name="email"
                  id="login_email"
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="owner@business.com"
                  className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-blue-600 hover:underline font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  id="login_password"
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-10 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-4 rounded-xl font-bold text-xs sm:text-sm hover:bg-blue-700 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Dashboard'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="text-center pt-1">
            <span className="text-xs text-slate-500">Need a new business account? </span>
            <Link to="/signup" className="text-xs font-semibold text-blue-600 hover:underline">
              Create Shop Account
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-4 px-6 text-center text-xs text-slate-400">
        ReviewFlow AI • Strictly isolated client portal
      </footer>
    </div>
  );
};

// ========================================================
// CLIENT SIGNUP PAGE (CLEAN, NO BROWSER AUTO-FILL GLITCH)
// ========================================================
export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { signupWithEmail, user } = useAuth();

  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!businessName.trim()) {
      setErrorMessage('Please enter your business or store name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!phone.trim()) {
      setErrorMessage('Please enter your phone number.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify your password.');
      return;
    }
    if (!termsAccepted) {
      setErrorMessage('You must agree to the Terms and Privacy Policy to create an account.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      await signupWithEmail(
        email.trim(),
        password,
        name.trim(),
        businessName.trim(),
        phone.trim(),
        termsAccepted
      );
      navigate('/onboarding', { replace: true });
    } catch (err: any) {
      setErrorMessage(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
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
          <Link
            to="/login"
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 hover:underline"
          >
            Already have an account? Sign In &rarr;
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-xs p-8 space-y-6">
          <div className="text-center space-y-1">
            <div className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full mb-1">
              <Sparkles className="w-3 h-3" />
              <span>ReviewFlow Pro Initial Access</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Create Shop Account</h1>
            <p className="text-xs text-slate-500">
              Set up your business profile, dynamic QR stand, and AI review drafts.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            {/* Dummy invisible inputs to prevent Chrome password manager from autofilling saved admin account */}
            <input
              type="text"
              name="fake_autofill_preventer_username"
              style={{ display: 'none' }}
              tabIndex={-1}
              aria-hidden="true"
            />
            <input
              type="password"
              name="fake_autofill_preventer_password"
              style={{ display: 'none' }}
              tabIndex={-1}
              aria-hidden="true"
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Full Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                <input
                  type="text"
                  name="signup_fullname"
                  id="signup_fullname"
                  autoComplete="off"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  placeholder="Rahul Sharma"
                  className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Business / Store Name *
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                <input
                  type="text"
                  name="signup_storename"
                  id="signup_storename"
                  autoComplete="off"
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                  required
                  placeholder="e.g. Elegant Studio"
                  className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Business Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                <input
                  type="email"
                  name="signup_reg_email"
                  id="signup_reg_email"
                  autoComplete="new-off"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="owner@business.com"
                  className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Phone Number *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                <input
                  type="tel"
                  name="signup_phone"
                  id="signup_phone"
                  autoComplete="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  required
                  placeholder="+91 98765 43210"
                  className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Password *
                </label>
                <span className="text-[10px] text-slate-400">Min 6 characters</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="signup_reg_password"
                  id="signup_reg_password"
                  autoComplete="new-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-10 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Confirm Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="signup_reg_confirm_password"
                  id="signup_reg_confirm_password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Re-enter password"
                  className="w-full pl-9 pr-10 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Checkbox: I agree to Terms and Privacy Policy (Section 3) */}
            <div className="flex items-start gap-2.5 pt-1">
              <input
                type="checkbox"
                id="terms_agree"
                checked={termsAccepted}
                onChange={e => setTermsAccepted(e.target.checked)}
                required
                className="mt-0.5 rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer w-4 h-4"
              />
              <label htmlFor="terms_agree" className="text-xs text-slate-600 leading-snug cursor-pointer select-none">
                I agree to the <Link to="/terms" target="_blank" className="text-blue-600 hover:underline font-medium">Terms of Service</Link> and <Link to="/privacy" target="_blank" className="text-blue-600 hover:underline font-medium">Privacy Policy</Link>.
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-4 rounded-xl font-bold text-xs sm:text-sm hover:bg-blue-700 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <span>{loading ? 'Creating Your Account...' : 'Create Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="text-center pt-1">
            <span className="text-xs text-slate-500">Already registered? </span>
            <Link to="/login" className="text-xs font-semibold text-blue-600 hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-4 px-6 text-center text-xs text-slate-400">
        ReviewFlow AI • 14-Day Free Testing Experience
      </footer>
    </div>
  );
};

// ========================================================
// REAL WORKING FORGOT PASSWORD PAGE (2-STEP RESET)
// ========================================================
export const ForgotPasswordPage: React.FC = () => {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Step 1: Request Password Reset Code
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid registered email address.');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);
      setInfoMessage(null);

      const res = await freshTestApi.requestPasswordReset(email.trim());
      setStep(2);

      if (res.resetCode) {
        setResetCode(res.resetCode);
        setInfoMessage(`Verification Code: ${res.resetCode} (Valid for 30 minutes). Enter your new password below.`);
      } else {
        setInfoMessage('Password reset code generated. Please check and enter your 6-digit verification code.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to find an account with this email. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Submit New Password with Code
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetCode.trim()) {
      setErrorMessage('Please enter the 6-digit verification code.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify your new password.');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);

      const res = await freshTestApi.resetPassword({
        email: email.trim(),
        code: resetCode.trim(),
        newPassword
      });

      setSuccessMessage(res.message || 'Password has been updated successfully!');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to reset password. Please check your verification code.');
    } finally {
      setLoading(false);
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
          <Link to="/login" className="text-xs font-semibold text-blue-600 hover:underline">
            Back to Sign In
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-xs p-8 space-y-6">
          <div className="text-center space-y-1">
            <div className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full mb-1">
              <ShieldCheck className="w-3 h-3 text-blue-600" />
              <span>{step === 1 ? 'Step 1 of 2: Identity Verification' : 'Step 2 of 2: Create New Password'}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {step === 1 ? 'Reset Your Password' : 'Set New Password'}
            </h1>
            <p className="text-xs text-slate-500">
              {step === 1
                ? 'Enter your registered business email address to generate a recovery code.'
                : 'Enter your 6-digit verification code and your new password.'}
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {infoMessage && (
            <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1">
              <div className="flex items-center gap-2 font-bold text-blue-700">
                <KeyRound className="w-4 h-4 shrink-0" />
                <span>Verification Code Ready</span>
              </div>
              <p className="text-[11px] text-blue-800 leading-relaxed font-mono">
                {infoMessage}
              </p>
            </div>
          )}

          {successMessage ? (
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <div className="font-bold text-sm">Password Successfully Reset!</div>
              <p className="text-xs text-emerald-700 leading-relaxed">
                Your account password has been updated. You can now sign in with your new credentials.
              </p>
              <div className="pt-2">
                <Link
                  to="/login"
                  className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-xs transition-colors shadow-xs"
                >
                  <span>Sign In with New Password</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : step === 1 ? (
            /* STEP 1: Enter email */
            <form onSubmit={handleRequestReset} className="space-y-4" autoComplete="off">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Registered Business Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                  <input
                    type="email"
                    name="recovery_user_email"
                    id="recovery_user_email"
                    autoComplete="off"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="owner@business.com"
                    className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Verifying Account...' : 'Generate Recovery Code & Continue'}
              </button>
            </form>
          ) : (
            /* STEP 2: Enter code & new password */
            <form onSubmit={handleResetPassword} className="space-y-4" autoComplete="off">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    6-Digit Verification Code *
                  </label>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Change Email / Resend</span>
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                  <input
                    type="text"
                    name="verification_code"
                    id="verification_code"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={resetCode}
                    onChange={e => setResetCode(e.target.value.replace(/\D/g, ''))}
                    required
                    placeholder="123456"
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 font-mono tracking-widest text-center"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    New Password *
                  </label>
                  <span className="text-[10px] text-slate-400">Min 6 characters</span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="new_password_field"
                    id="new_password_field"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-10 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Confirm New Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirm_new_password_field"
                    id="confirm_new_password_field"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="Re-enter new password"
                    className="w-full pl-9 pr-10 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Updating Password...' : 'Save New Password'}
                </button>
              </div>
            </form>
          )}

          <div className="text-center pt-1">
            <Link to="/login" className="text-xs font-semibold text-slate-500 hover:text-slate-800">
              Remember your password? Sign In
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-4 px-6 text-center text-xs text-slate-400">
        ReviewFlow AI • Password Security & Recovery
      </footer>
    </div>
  );
};
