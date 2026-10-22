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
  ShieldCheck
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
  billingInterval?: 'monthly' | 'yearly';
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
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      p.id.toLowerCase().includes(s) ||
      p.userId.toLowerCase().includes(s) ||
      (p.businessId && p.businessId.toLowerCase().includes(s)) ||
      (p.razorpayOrderId && p.razorpayOrderId.toLowerCase().includes(s))
    );
  });

  const totalCollected = payments
    .filter(p => p.status === 'PAID')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const totalRefunded = payments
    .filter(p => p.status === 'REFUNDED')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>Billing & Payments Ledger</span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700">
              Immutable Records
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Section 9 & 10: Server-verified payments, subscription activations, gateway transaction audit history, and manual refund administration.
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
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Collected</span>
          <div className="text-2xl font-black text-slate-900">₹{totalCollected.toLocaleString()}</div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Paid Transactions</span>
          <div className="text-2xl font-black text-emerald-600">
            {payments.filter(p => p.status === 'PAID').length}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Failed / Pending</span>
          <div className="text-2xl font-black text-amber-600">
            {payments.filter(p => p.status === 'PENDING' || p.status === 'FAILED').length}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Refunded</span>
          <div className="text-2xl font-black text-rose-600">₹{totalRefunded.toLocaleString()}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Payment ID, User UID, Business ID, Order ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:outline-hidden focus:border-blue-600 font-medium"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 font-semibold text-slate-700 focus:outline-hidden focus:border-blue-600"
          >
            <option value="ALL">All Payments</option>
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending</option>
            <option value="REFUNDED">Refunded</option>
            <option value="FAILED">Failed</option>
          </select>
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
            <p className="text-sm font-semibold text-slate-600">No payment records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Payment ID / Order</th>
                  <th className="py-3.5 px-4">User / Business</th>
                  <th className="py-3.5 px-4">Plan & Interval</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredPayments.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono">
                      <div className="font-bold text-slate-900">{p.id}</div>
                      <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                        <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-bold text-[9px]">
                          {p.gateway || (p.cashfreeOrderId ? 'CASHFREE' : 'RAZORPAY')}
                        </span>
                        <span>{p.cashfreeOrderId || p.razorpayOrderId || 'Direct'}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800 font-mono text-[11px] truncate max-w-[140px]">
                        {p.userId}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {p.businessId ? `Biz: ${p.businessId}` : 'New Business Provisioning'}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">ReviewFlow Unlimited</div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                        {p.billingInterval || 'Monthly'}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-black text-sm text-slate-900">
                        ₹{p.amount}
                      </span>
                    </td>

                    <td className="py-3 px-4">
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

                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>

                    <td className="py-3 px-4 text-right">
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
                    </td>
                  </tr>
                ))}
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
