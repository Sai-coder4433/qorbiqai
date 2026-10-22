import React, { useEffect, useState } from 'react';
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

  useEffect(() => {
    let isMounted = true;

    async function verifyCheckout() {
      // If no identifiers present in URL
      if (!orderId && !subscriptionId && !paymentId) {
        if (isMounted) {
          setStatus('FAILED');
          setErrorMessage('No valid payment or subscription reference found in return parameters.');
        }
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

        if (!isMounted) return;

        if (verification.success && verification.business) {
          setStatus('SUCCESS');
          setVerifiedBusinessId(verification.business.id);
          setVerifiedSubId(verification.subscriptionId);
          await refreshBusinesses().catch(() => {});
        } else {
          setStatus('FAILED');
          setErrorMessage((verification as any).error || 'Payment verification could not be confirmed.');
        }
      } catch (err: any) {
        if (!isMounted) return;
        const msg = err.message || '';
        if (msg.toLowerCase().includes('pending') || msg.toLowerCase().includes('approval')) {
          setStatus('PENDING');
        } else {
          setStatus('FAILED');
          setErrorMessage(msg || 'Failed to verify payment status with Cashfree.');
        }
      }
    }

    verifyCheckout();

    return () => {
      isMounted = false;
    };
  }, [orderId, subscriptionId, paymentId]);

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
              Please wait while our server securely verifies your payment and subscription with Cashfree...
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
                Your payment was verified cryptographically by Cashfree.
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
                  <span className="font-semibold text-blue-600">ReviewFlow / Qorbiq Unlimited</span>
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
                Your payment is being processed by the bank or UPI network. Your business workspace will be activated automatically once the webhook confirmation arrives.
              </p>
            </div>
            <Link
              to="/app/billing"
              className="block w-full py-3 px-6 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl"
            >
              View Billing Status
            </Link>
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
                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl"
              >
                Return to Pricing
              </Link>
              <Link
                to="/app/billing"
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Go to Billing
              </Link>
            </div>
          </div>
        )}

        {/* Security Assurance */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
          <span>Secured with 256-bit cryptographic verification</span>
        </div>
      </div>
    </div>
  );
}
