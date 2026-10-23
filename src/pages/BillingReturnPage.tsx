import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Clock, RefreshCw, ArrowRight, ShieldCheck } from 'lucide-react';
import { freshTestApi } from '../lib/fresh-test-api.ts';
import { useBusiness } from '../lib/business-context.tsx';

export function BillingReturnPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshBusinesses } = useBusiness();

  const [status, setStatus] = useState<'VERIFYING' | 'SUCCESS' | 'PENDING' | 'FAILED'>('VERIFYING');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [verifiedBusinessId, setVerifiedBusinessId] = useState<string | null>(null);
  const [verifiedSubId, setVerifiedSubId] = useState<string | null>(null);

  const orderId = searchParams.get('order_id') || searchParams.get('cf_order_id');
  const subscriptionId = searchParams.get('subscription_id') || searchParams.get('cf_subscription_id');
  const paymentId = searchParams.get('payment_id');

  const verifyCheckout = useCallback(async () => {
    setStatus('VERIFYING');
    setErrorMessage(null);

    // If no identifiers present in URL
    if (!orderId && !subscriptionId && !paymentId) {
      setStatus('FAILED');
      setErrorMessage('No valid payment or subscription reference found in return parameters.');
      return;
    }

    try {
      // Resolve paymentId if only orderId or subscriptionId provided
      const targetPaymentId = paymentId || `pay_${(orderId || subscriptionId || '').replace(/^order_cf_|^sub_cf_/, '')}`;

      const verification = await freshTestApi.verifyPayment({
        paymentId: targetPaymentId,
        gateway: 'CASHFREE',
        cfOrderId: orderId || undefined,
        cfSubscriptionId: subscriptionId || undefined,
        order_id: orderId || undefined,
        subscription_id: subscriptionId || undefined
      });

      if (verification.success && verification.business) {
        setStatus('SUCCESS');
        setVerifiedBusinessId(verification.business.id);
        setVerifiedSubId(verification.subscriptionId);
        await refreshBusinesses().catch(() => {});
      } else if ((verification as any).pending) {
        setStatus('PENDING');
        setErrorMessage((verification as any).message || 'Mandate authorization or payment is being processed by your bank.');
      } else {
        setStatus('FAILED');
        setErrorMessage((verification as any).error || 'Payment verification could not be confirmed.');
      }
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.toLowerCase().includes('pending') || msg.toLowerCase().includes('approval') || msg.toLowerCase().includes('202')) {
        setStatus('PENDING');
        setErrorMessage(msg || 'Mandate authorization is in progress with your bank.');
      } else {
        setStatus('FAILED');
        setErrorMessage(msg || 'Failed to verify payment status with Cashfree.');
      }
    }
  }, [orderId, subscriptionId, paymentId, refreshBusinesses]);

  useEffect(() => {
    verifyCheckout();
  }, [verifyCheckout]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200/80 shadow-xl p-6 sm:p-8 text-center space-y-6">
        
        {/* Brand Header */}
        <div className="flex items-center justify-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-sm shadow-xs">
            Q
          </div>
          <span className="font-extrabold text-lg text-slate-900 tracking-tight">Qorbiq AI</span>
        </div>

        {/* Status Views */}
        {status === 'VERIFYING' && (
          <div className="space-y-4 py-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <RefreshCw className="w-7 h-7 animate-spin" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Verifying Payment</h2>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
              Please wait while our server securely verifies your payment and subscription mandate with Cashfree...
            </p>
          </div>
        )}

        {status === 'SUCCESS' && (
          <div className="space-y-4 py-4 animate-in fade-in duration-300">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900">Subscription Activated!</h2>
              <p className="text-xs text-slate-500">
                Your payment and recurring mandate were cryptographically verified by Cashfree.
              </p>
            </div>

            {verifiedBusinessId && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-left space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-500">
                  <span>Business Workspace:</span>
                  <span className="font-mono font-semibold text-slate-800">{verifiedBusinessId}</span>
                </div>
                {verifiedSubId && (
                  <div className="flex justify-between items-center text-slate-500">
                    <span>Subscription Ref:</span>
                    <span className="font-mono font-semibold text-slate-800">{verifiedSubId.slice(0, 16)}...</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-slate-500">
                  <span>Plan:</span>
                  <span className="font-semibold text-blue-600">Qorbiq AI Unlimited</span>
                </div>
              </div>
            )}

            <button
              onClick={() => {
                if (verifiedBusinessId) {
                  navigate(`/app/onboarding/${verifiedBusinessId}`);
                } else {
                  navigate('/app/businesses');
                }
              }}
              className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 hover:scale-[1.01] cursor-pointer"
            >
              <span>Continue to Business Onboarding</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {status === 'PENDING' && (
          <div className="space-y-4 py-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <Clock className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900">Payment Pending Confirmation</h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                {errorMessage || 'Your recurring mandate authorization or initial payment is being processed by your bank. Your workspace will activate automatically as soon as bank confirmation arrives.'}
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={verifyCheckout}
                className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Re-check Verification Status</span>
              </button>
              <Link
                to="/app/billing"
                className="block w-full py-2.5 px-6 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
              >
                Go to Billing Dashboard
              </Link>
            </div>
          </div>
        )}

        {status === 'FAILED' && (
          <div className="space-y-4 py-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900">Payment Verification Failed</h2>
              <p className="text-xs text-rose-600 leading-relaxed font-medium">
                {errorMessage || 'Payment could not be verified by Cashfree.'}
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <Link
                to="/pricing"
                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl text-center"
              >
                Retry Subscription
              </Link>
              <button
                onClick={verifyCheckout}
                className="flex-1 py-3 px-4 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl cursor-pointer"
              >
                Retry Check
              </button>
            </div>
          </div>
        )}

        {/* Security Assurance */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
          <span>Secured with Cashfree HMAC-SHA256 verification</span>
        </div>
      </div>
    </div>
  );
}
