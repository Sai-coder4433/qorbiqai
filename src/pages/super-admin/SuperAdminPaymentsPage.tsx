import React, { useState, useEffect } from 'react';
import {
  Receipt,
  CreditCard,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  RotateCcw,
  AlertCircle,
  FileText,
  DollarSign,
  ShieldCheck,
  Download,
  Lock,
  Calendar,
  Sparkles,
  Repeat,
  Check,
  Zap
} from 'lucide-react';

interface PaymentRecord {
  id: string;
  userId: string;
  businessId: string | null;
  subscriptionId: string;
  gateway?: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'AUTHORIZED' | 'PAID' | 'FAILED' | 'REFUNDED' | 'CANCELLED';
  paymentType: string;
  planId: string;
  planName?: string;
  billingInterval?: 'monthly' | 'yearly';
  billingModel?: 'ONE_TIME' | 'SUBSCRIPTION';
  purchaseType?: 'MONTHLY_PAY_ONCE' | 'MONTHLY_SUBSCRIPTION' | 'YEARLY_PAY_ONCE' | 'YEARLY_SUBSCRIPTION';
  autoRenew?: boolean;
  customerName?: string;
  customerEmail?: string;
  businessName?: string;
  transactionId?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  accessStart?: string;
  accessExpiry?: string | null;
  nextRenewal?: string | null;
  cancellationStatus?: string;
  subscriptionStatus?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  cashfreeOrderId?: string;
  cashfreePaymentId?: string;
  createdAt: string;
  verifiedAt?: string;
}

export const SuperAdminPaymentsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [purchaseTypeFilter, setPurchaseTypeFilter] = useState('ALL');
  const [refundingId, setRefundingId] = useState<string | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [processingRefund, setProcessingRefund] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/payments', {
        headers: {
          'x-admin-auth': 'superadmin',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load payments');
      setPayments(data.payments || []);
    } catch (err) {
      console.error('Error loading payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundingId) return;
    try {
      setProcessingRefund(true);
      const res = await fetch(`/api/admin/payments/${refundingId}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-auth': 'superadmin',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({ reason: refundReason })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to refund payment');

      setActionNotice(`Payment ${refundingId} refunded. Audit log created.`);
      setRefundingId(null);
      setRefundReason('');
      await loadPayments();
      setTimeout(() => setActionNotice(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Error processing refund');
    } finally {
      setProcessingRefund(false);
    }
  };

  const filteredPayments = payments.filter(p => {
    if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
    if (purchaseTypeFilter !== 'ALL') {
      const matchType = p.purchaseType || (p.billingInterval === 'yearly'
        ? (p.autoRenew ? 'YEARLY_SUBSCRIPTION' : 'YEARLY_PAY_ONCE')
        : (p.autoRenew ? 'MONTHLY_SUBSCRIPTION' : 'MONTHLY_PAY_ONCE'));
      if (matchType !== purchaseTypeFilter) return false;
    }
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      p.id.toLowerCase().includes(s) ||
      p.userId.toLowerCase().includes(s) ||
      (p.customerName && p.customerName.toLowerCase().includes(s)) ||
      (p.customerEmail && p.customerEmail.toLowerCase().includes(s)) ||
      (p.businessName && p.businessName.toLowerCase().includes(s)) ||
      (p.transactionId && p.transactionId.toLowerCase().includes(s)) ||
      (p.invoiceNumber && p.invoiceNumber.toLowerCase().includes(s)) ||
      (p.cashfreeOrderId && p.cashfreeOrderId.toLowerCase().includes(s)) ||
      (p.razorpayOrderId && p.razorpayOrderId.toLowerCase().includes(s))
    );
  });

  const totalCollected = payments
    .filter(p => p.status === 'PAID')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const totalRefunded = payments
    .filter(p => p.status === 'REFUNDED')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const totalMonthlyOneTime = payments.filter(p => p.purchaseType === 'MONTHLY_PAY_ONCE' && p.status === 'PAID').length;
  const totalMonthlySubs = payments.filter(p => p.purchaseType === 'MONTHLY_SUBSCRIPTION' && p.status === 'PAID').length;
  const totalYearlyOneTime = payments.filter(p => p.purchaseType === 'YEARLY_PAY_ONCE' && p.status === 'PAID').length;
  const totalYearlySubs = payments.filter(p => p.purchaseType === 'YEARLY_SUBSCRIPTION' && p.status === 'PAID').length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>Qorbiq AI Payments & Billing Ledger</span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700">
              Verified Gateway Audit
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Server-verified one-time transactions across Qorbiq AI 6 Months (₹1,800 INR, 180 Days) & 12 Months (₹2,999 INR, 365 Days), entitlement dates, and downloadable tax invoices.
          </p>
        </div>
        <button
          onClick={loadPayments}
          className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-2 transition-colors cursor-pointer shadow-xs self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {actionNotice && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Revenue Collected</span>
          <div className="text-2xl font-black text-slate-900">₹{totalCollected.toLocaleString()}</div>
          <div className="text-[10px] text-slate-500 font-medium pt-1">
            {payments.filter(p => p.status === 'PAID').length} server-verified transactions
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">6 Months Plan (₹1,800)</span>
          <div className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span className="text-blue-600">{payments.filter(p => p.planId === 'qorbiq_6_months' || p.amount === 1800).length} Paid</span>
          </div>
          <div className="text-[10px] text-slate-500 font-medium pt-1">
            One-Time Payment (180 Days Access)
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">12 Months Plan (₹2,999)</span>
          <div className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span className="text-emerald-600">{payments.filter(p => p.planId === 'qorbiq_12_months' || p.amount === 2999).length} Paid</span>
          </div>
          <div className="text-[10px] text-slate-500 font-medium pt-1">
            One-Time Payment (365 Days Access)
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Refunds & Disputed</span>
          <div className="text-2xl font-black text-rose-600">₹{totalRefunded.toLocaleString()}</div>
          <div className="text-[10px] text-slate-500 font-medium pt-1">
            {payments.filter(p => p.status === 'REFUNDED').length} refunded audits
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Customer, Email, Business, Payment ID, Order ID, Invoice #..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:outline-hidden focus:border-blue-600 font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Purchase Type Filter */}
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={purchaseTypeFilter}
              onChange={e => setPurchaseTypeFilter(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 font-semibold text-slate-700 focus:outline-hidden focus:border-blue-600 cursor-pointer"
            >
              <option value="ALL">All Purchase Types</option>
              <option value="MONTHLY_PAY_ONCE">Qorbiq AI – 6 Months (₹1,800, 180d)</option>
              <option value="YEARLY_PAY_ONCE">Qorbiq AI – 12 Months (₹2,999, 365d)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 font-semibold text-slate-700 focus:outline-hidden focus:border-blue-600 cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="PAID">Paid (Verified)</option>
              <option value="PENDING">Pending Authorization</option>
              <option value="REFUNDED">Refunded</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
            <p className="text-sm text-slate-500">Loading payment ledger...</p>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <Receipt className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-600">No payment records match filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Customer & Business</th>
                  <th className="py-3.5 px-4">Plan & Purchase Type</th>
                  <th className="py-3.5 px-4">Amount & Gateway</th>
                  <th className="py-3.5 px-4">Transaction / Order ID</th>
                  <th className="py-3.5 px-4">Payment Status</th>
                  <th className="py-3.5 px-4">Access Start & Expiry</th>
                  <th className="py-3.5 px-4">Next Renewal</th>
                  <th className="py-3.5 px-4">Cancellation</th>
                  <th className="py-3.5 px-4 text-right">Invoice & Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredPayments.map(p => {
                  const isAutoRenew = p.autoRenew ?? (p.billingModel === 'SUBSCRIPTION');
                  const isYearly = p.billingInterval === 'yearly' || p.amount >= 2000;
                  const durationLabel = isYearly ? '365 Days Access' : '30 Days Access';

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Customer & Business */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{p.customerName || 'Customer'}</div>
                        <div className="text-[11px] text-slate-500">{p.customerEmail || p.userId}</div>
                        <div className="text-[10px] text-blue-600 font-medium mt-0.5">
                          {p.businessName || 'Workspace Provisioned'}
                        </div>
                      </td>

                      {/* Plan & Purchase Type */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>Qorbiq AI {isYearly ? 'Yearly' : 'Monthly'}</span>
                        </div>
                        <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                          {isAutoRenew ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700">
                              <Repeat className="w-2.5 h-2.5" />
                              <span>Auto-Renew Subscription</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">
                              <Zap className="w-2.5 h-2.5" />
                              <span>Pay Once ({durationLabel})</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Amount & Gateway */}
                      <td className="py-3.5 px-4">
                        <div className="font-black text-sm text-slate-900">
                          ₹{p.amount.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mt-0.5">
                          {p.gateway || 'CASHFREE'}
                        </div>
                      </td>

                      {/* Transaction ID / Cashfree Order ID */}
                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        <div className="font-bold text-slate-800 truncate max-w-[150px]" title={p.transactionId || p.id}>
                          {p.transactionId || p.id}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[150px]" title={p.cashfreeOrderId || p.razorpayOrderId}>
                          {p.cashfreeOrderId || p.razorpayOrderId || p.id}
                        </div>
                        {p.invoiceNumber && (
                          <div className="text-[10px] font-bold text-emerald-600 mt-0.5">
                            {p.invoiceNumber}
                          </div>
                        )}
                      </td>

                      {/* Payment Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            p.status === 'PAID'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : p.status === 'REFUNDED'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : p.status === 'PENDING'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>

                      {/* Access Start & Expiry */}
                      <td className="py-3.5 px-4 text-[11px] text-slate-600">
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">Start</span>
                          {p.accessStart ? new Date(p.accessStart).toLocaleDateString('en-IN') : new Date(p.createdAt).toLocaleDateString('en-IN')}
                        </div>
                        <div className="mt-1">
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">Expires</span>
                          <span className="font-semibold text-slate-800">
                            {p.accessExpiry ? new Date(p.accessExpiry).toLocaleDateString('en-IN') : 'Active'}
                          </span>
                        </div>
                      </td>

                      {/* Next Renewal */}
                      <td className="py-3.5 px-4 text-[11px]">
                        {isAutoRenew ? (
                          <div>
                            <span className="text-indigo-700 font-semibold block">
                              {p.nextRenewal ? new Date(p.nextRenewal).toLocaleDateString('en-IN') : 'Next Billing Cycle'}
                            </span>
                            <span className="text-[10px] text-slate-400">Recurring Mandate</span>
                          </div>
                        ) : (
                          <div>
                            <span className="text-slate-500 font-medium block">No Mandate</span>
                            <span className="text-[10px] text-slate-400">Manual Renewal Required</span>
                          </div>
                        )}
                      </td>

                      {/* Cancellation Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            p.cancellationStatus === 'CANCELLED'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : p.cancellationStatus === 'PENDING_CANCELLATION'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : p.cancellationStatus === 'EXPIRED'
                              ? 'bg-slate-100 text-slate-600 border border-slate-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {p.cancellationStatus || 'ACTIVE'}
                        </span>
                      </td>

                      {/* Invoice Download PDF & Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {p.status === 'PAID' && p.invoiceId ? (
                            <a
                              href={`/api/admin/invoices/${p.invoiceId}/pdf?download=1`}
                              target="_blank"
                              rel="noreferrer"
                              title="Download Verified Tax PDF Invoice"
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Invoice PDF</span>
                            </a>
                          ) : (
                            <span
                              title="Invoice PDF strictly available for verified PAID transactions"
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-400 bg-slate-50 border border-slate-200 rounded-lg cursor-not-allowed opacity-60"
                            >
                              <Lock className="w-3.5 h-3.5" />
                              <span>Unverified</span>
                            </span>
                          )}

                          {p.status === 'PAID' && (
                            <button
                              onClick={() => {
                                setRefundingId(p.id);
                                setRefundReason('');
                              }}
                              className="px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                            >
                              Refund
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Refund Modal */}
      {refundingId && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
              <RotateCcw className="w-4 h-4" />
              <span>Confirm Refund</span>
            </div>
            <p className="text-xs text-slate-600">
              Are you sure you want to mark payment <span className="font-mono font-bold">{refundingId}</span> as refunded? This creates a security audit log.
            </p>
            <form onSubmit={handleRefund} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Refund Reason
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Customer requested refund / billing dispute"
                  value={refundReason}
                  onChange={e => setRefundReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-rose-500"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRefundingId(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingRefund}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
                >
                  {processingRefund ? 'Processing...' : 'Execute Refund'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
