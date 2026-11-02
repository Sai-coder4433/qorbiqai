import React, { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  KeyRound,
  Store,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Copy,
  Clock,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../lib/auth-context.tsx';
import { useBusiness } from '../../lib/business-context.tsx';

export const OwnerProfilePage: React.FC = () => {
  const { user, requestPasswordReset } = useAuth();
  const { businesses } = useBusiness();

  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [copiedUid, setCopiedUid] = useState(false);

  const handleTriggerPasswordReset = async () => {
    if (!user?.email) return;
    try {
      setResetLoading(true);
      setResetError(null);
      await requestPasswordReset(user.email);
      setResetSent(true);
    } catch (err: any) {
      setResetError(err.message || 'Failed to send password reset email.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleCopyUid = () => {
    if (!user?.uid) return;
    navigator.clipboard.writeText(user.uid);
    setCopiedUid(true);
    setTimeout(() => setCopiedUid(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
          <User className="w-6 h-6 text-blue-600" />
          <span>Business Owner Profile</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your master business owner credentials, account security, and registered shop ownership.
        </p>
      </div>

      {/* Main Profile Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xl font-black shadow-md">
              {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'O'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-snug">
                {user?.displayName || 'Business Owner'}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  <ShieldCheck className="w-3 h-3 text-blue-600" />
                  <span>Business Owner Account</span>
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Active</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Credentials Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-blue-600" />
              <span>Email Address</span>
            </div>
            <div className="font-mono text-xs font-bold text-slate-900 break-all">{user?.email}</div>
            <div className="text-[10px] text-slate-400">Authenticated via Firebase</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-blue-600" />
              <span>Contact Phone</span>
            </div>
            <div className="text-xs font-bold text-slate-900">
              {(user as any)?.phone || (user as any)?.mobile || 'Provided at Business Onboarding'}
            </div>
            <div className="text-[10px] text-slate-400">Owner SMS &amp; notification channel</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Account UID</span>
              <button
                type="button"
                onClick={handleCopyUid}
                className="text-[10px] text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Copy className="w-3 h-3" />
                <span>{copiedUid ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
            <div className="font-mono text-[11px] font-bold text-slate-700 truncate">{user?.uid}</div>
            <div className="text-[10px] text-slate-400">Unique tenant identifier</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-blue-600" />
              <span>Managed Shops</span>
            </div>
            <div className="text-xs font-bold text-slate-900">{businesses.length} Physical Stores</div>
            <div className="text-[10px] text-slate-400">Isolated workspace entitlements</div>
          </div>
        </div>

        {/* Password & Security Section */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-blue-600" />
            <span>Account Password &amp; Recovery</span>
          </h3>
          <p className="text-xs text-slate-500">
            For security, passwords are encrypted by Google Firebase Authentication. You can request an official password recovery link delivered directly to your email.
          </p>

          {resetSent ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="text-xs text-emerald-900">
                <span className="font-bold">Password reset email sent!</span> Check your inbox at{' '}
                <span className="font-mono font-bold">{user?.email}</span> to update your password.
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleTriggerPasswordReset}
              disabled={resetLoading}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>{resetLoading ? 'Sending Reset Email...' : 'Send Password Reset Email'}</span>
            </button>
          )}

          {resetError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{resetError}</span>
            </div>
          )}
        </div>
      </div>

      {/* Associated Shops List */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Store className="w-4 h-4 text-blue-600" />
            <span>Your Registered Shops ({businesses.length})</span>
          </h3>
          <Link
            to="/app/shops/create"
            className="text-xs text-blue-600 hover:underline font-bold"
          >
            + Register Another Shop
          </Link>
        </div>

        {businesses.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">No registered shops found under this account.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {businesses.map(shop => {
              const isPaid = (shop as any).paymentStatus === 'paid' || (shop as any).paymentStatus === 'PAID';
              return (
                <div key={shop.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-xs">
                      {shop.businessName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900">{shop.businessName}</div>
                      <div className="text-[10px] text-slate-400 capitalize">
                        {shop.category ? shop.category.replace(/_/g, ' ') : 'General'} • {shop.city || 'India'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        isPaid ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {isPaid ? 'Paid' : 'Unpaid'}
                    </span>
                    <Link
                      to={`/app/shops/${shop.id}/dashboard`}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors"
                    >
                      <span>Open</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
