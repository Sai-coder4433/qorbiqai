import React, { useState, useEffect } from 'react';
import {
  FileText,
  Printer,
  Download,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Eye,
  Sliders,
  DollarSign,
  Receipt,
  Building2,
  Calendar,
  CreditCard
} from 'lucide-react';
import { freshTestApi } from '../../lib/fresh-test-api.ts';
import { ReviewFlowInvoice } from '../../../server/reviewflow/types.ts';

export const SuperAdminInvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<ReviewFlowInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ISSUED' | 'PAID' | 'REFUNDED' | 'CANCELLED'>('ALL');

  // Preview Modal
  const [selectedInvoice, setSelectedInvoice] = useState<ReviewFlowInvoice | null>(null);

  // Status Change Modal
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [targetInvoice, setTargetInvoice] = useState<ReviewFlowInvoice | null>(null);
  const [newStatus, setNewStatus] = useState<'REFUNDED' | 'CANCELLED'>('REFUNDED');
  const [statusReason, setStatusReason] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(false);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await freshTestApi.getAdminInvoices();
      setInvoices(res.invoices || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load invoices.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetInvoice || !statusReason.trim()) return;

    try {
      setStatusUpdating(true);
      await freshTestApi.updateAdminInvoiceStatus(targetInvoice.id, newStatus, statusReason.trim());
      setStatusModalOpen(false);
      setTargetInvoice(null);
      setStatusReason('');
      await loadInvoices();
    } catch (err: any) {
      alert(err.message || 'Failed to update invoice status');
    } finally {
      setStatusUpdating(false);
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    const query = searchQuery.toLowerCase().trim();
    if (!query) return matchesStatus;

    const matchesQuery =
      inv.invoiceNumber.toLowerCase().includes(query) ||
      inv.customerName?.toLowerCase().includes(query) ||
      inv.customerEmail?.toLowerCase().includes(query) ||
      inv.businessName?.toLowerCase().includes(query) ||
      inv.paymentId?.toLowerCase().includes(query) ||
      inv.transactionId?.toLowerCase().includes(query);

    return matchesStatus && matchesQuery;
  });

  // Aggregated Telemetry
  const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
  const totalPaidCount = invoices.filter((inv) => inv.status === 'PAID').length;
  const totalRefundedCount = invoices.filter((inv) => inv.status === 'REFUNDED').length;
  const totalCancelledCount = invoices.filter((inv) => inv.status === 'CANCELLED').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Receipt className="w-7 h-7 text-blue-600" />
            <span>Billing & Invoices</span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700">
              Tax & Compliance
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Sequential GST-compliant invoice registry (QOR-YYYY-XXXX), snapshot preservation, and verified transaction receipts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadInvoices}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block">Total Invoiced Amount</span>
          <div className="text-2xl font-black text-slate-900 mt-1">₹{totalInvoiced.toLocaleString()}</div>
          <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">Lifetime billing volume</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block">Paid Invoices</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">{totalPaidCount}</div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Settled via Cashfree/Razorpay</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block">Refunded Invoices</span>
          <div className="text-2xl font-black text-amber-600 mt-1">{totalRefundedCount}</div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Reversed with reason</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block">Cancelled</span>
          <div className="text-2xl font-black text-rose-600 mt-1">{totalCancelledCount}</div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Nullified orders</span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by invoice number (e.g. QOR-2026-0001), customer, business, payment ID..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {(['ALL', 'PAID', 'ISSUED', 'REFUNDED', 'CANCELLED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
            <p className="text-xs text-slate-500">Loading invoice ledger...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
            <p className="text-xs text-rose-600">{error}</p>
            <button
              onClick={loadInvoices}
              className="px-4 py-2 bg-rose-600 text-white text-xs font-semibold rounded-xl"
            >
              Retry
            </button>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Receipt className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No Invoices Found</p>
            <p className="text-xs text-slate-400">
              {searchQuery || statusFilter !== 'ALL'
                ? 'Try adjusting your search criteria or status filter.'
                : 'Invoices are automatically created sequentially whenever a Cashfree subscription or standee order payment is verified.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Customer & Business</th>
                  <th className="py-3 px-4">Tax / GST</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Gateway / Ref</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(inv.issuedAt || inv.createdAt || inv.invoiceDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{inv.customerName || 'Customer'}</div>
                      <div className="text-[11px] text-slate-500">{inv.customerEmail}</div>
                      {inv.businessName && (
                        <span className="inline-block mt-0.5 text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {inv.businessName}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {inv.taxAmount && inv.taxAmount > 0 ? (
                        <div>
                          <span className="font-semibold text-slate-900">₹{inv.taxAmount}</span>
                          <span className="text-[10px] text-slate-400 block">{inv.taxRate || 18}% GST</span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                          0% Tax Exempt
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-slate-900">
                      ₹{(inv.totalAmount || inv.grandTotal || 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-mono text-[11px] text-slate-600 truncate max-w-[120px]" title={inv.paymentId || inv.transactionId || ''}>
                        {inv.gateway || 'CASHFREE'}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 truncate max-w-[120px]">
                        {inv.paymentId || inv.transactionId || 'Direct'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase ${
                          inv.status === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : inv.status === 'ISSUED'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : inv.status === 'REFUNDED'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          title="View Details"
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <a
                          href={`/api/admin/invoices/${inv.id}/pdf`}
                          target="_blank"
                          rel="noreferrer"
                          title="Print / PDF Invoice"
                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Printer className="w-4 h-4" />
                        </a>

                        {inv.status === 'PAID' && (
                          <button
                            onClick={() => {
                              setTargetInvoice(inv);
                              setNewStatus('REFUNDED');
                              setStatusModalOpen(true);
                            }}
                            title="Refund or Cancel"
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Sliders className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* INVOICE PREVIEW MODAL */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block">Official Invoice</span>
                <h3 className="text-xl font-black text-slate-900 mt-0.5">{selectedInvoice.invoiceNumber}</h3>
                <span className="text-xs text-slate-400">
                  Issued on {new Date(selectedInvoice.issuedAt || selectedInvoice.createdAt || selectedInvoice.invoiceDate).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`/api/admin/invoices/${selectedInvoice.id}/pdf`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / Download PDF</span>
                </a>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <div>
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block">Sold By (Platform Operator)</span>
                <div className="font-bold text-slate-900 mt-1">{selectedInvoice.sellerDetails?.legalBusinessName || selectedInvoice.sellerDetails?.companyName || 'SAI ANIL CHAKANKAR'}</div>
                <div className="text-[11px] text-slate-500 font-medium">Brand: {selectedInvoice.sellerDetails?.brandName || 'Qorbiq AI'}</div>
                <div className="text-slate-600 mt-0.5 whitespace-pre-line">{selectedInvoice.sellerDetails?.registeredAddress || selectedInvoice.sellerDetails?.address || [selectedInvoice.sellerDetails?.city || 'Pune', selectedInvoice.sellerDetails?.state || 'Maharashtra'].join(', ')}</div>
                {selectedInvoice.sellerDetails?.gstin && (
                  <div className="text-blue-700 font-mono mt-1 font-semibold">
                    GSTIN: {selectedInvoice.sellerDetails.gstin}
                  </div>
                )}
              </div>
              <div>
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block">Billed To (Customer)</span>
                <div className="font-bold text-slate-900 mt-1">{selectedInvoice.customerName}</div>
                <div className="text-slate-600 mt-0.5">{selectedInvoice.customerEmail}</div>
                {selectedInvoice.customerPhone && <div className="text-slate-600">{selectedInvoice.customerPhone}</div>}
                {selectedInvoice.businessName && (
                  <div className="mt-1 font-semibold text-slate-700">Business: {selectedInvoice.businessName}</div>
                )}
              </div>
            </div>

            {/* Items Table */}
            <div>
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 block">Line Items</span>
              <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                <thead className="bg-slate-100 text-slate-600 font-bold">
                  <tr>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Unit Price</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedInvoice.items?.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 px-3 font-medium text-slate-800">{item.description}</td>
                      <td className="py-2.5 px-3 text-center text-slate-600">{item.quantity}</td>
                      <td className="py-2.5 px-3 text-right text-slate-600">₹{item.unitPrice}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">₹{item.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculations & Breakdown */}
            <div className="border-t border-slate-100 pt-3 flex flex-col items-end space-y-1 text-xs">
              <div className="flex justify-between w-48 text-slate-600">
                <span>Subtotal:</span>
                <span className="font-semibold">₹{selectedInvoice.baseAmount}</span>
              </div>
              {selectedInvoice.taxAmount !== undefined && selectedInvoice.taxAmount > 0 && (
                <div className="flex justify-between w-48 text-slate-600">
                  <span>GST ({selectedInvoice.taxRate || 18}%):</span>
                  <span className="font-semibold">₹{selectedInvoice.taxAmount}</span>
                </div>
              )}
              <div className="flex justify-between w-48 text-base font-black text-slate-900 border-t border-slate-200 pt-1 mt-1">
                <span>Total:</span>
                <span className="text-blue-600">₹{selectedInvoice.totalAmount}</span>
              </div>
            </div>

            {/* Gateway & Snapshot Details */}
            <div className="bg-blue-50/50 p-3.5 rounded-2xl border border-blue-100 text-[11px] text-slate-600 space-y-1">
              <div>
                <span className="font-semibold text-slate-800">Payment Gateway:</span> {selectedInvoice.gateway || 'CASHFREE'}
              </div>
              <div>
                <span className="font-semibold text-slate-800">Payment Ref / Order ID:</span>{' '}
                <span className="font-mono">{selectedInvoice.paymentId || selectedInvoice.transactionId || 'N/A'}</span>
              </div>
              {selectedInvoice.notes && (
                <div>
                  <span className="font-semibold text-slate-800">Audit Notes:</span> {selectedInvoice.notes}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* UPDATE STATUS MODAL */}
      {statusModalOpen && targetInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleUpdateStatus}
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Change Invoice Status</h3>
                <span className="font-mono text-xs text-blue-600">{targetInvoice.invoiceNumber}</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Target Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as any)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              >
                <option value="REFUNDED">REFUNDED — Mark transaction as returned</option>
                <option value="CANCELLED">CANCELLED — Void invoice record</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Mandatory Audit Reason <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder="Explain why this invoice is being refunded or cancelled (e.g. duplicate charge, customer cancellation)..."
                required
                rows={3}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setStatusModalOpen(false);
                  setTargetInvoice(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Dismiss
              </button>
              <button
                type="submit"
                disabled={statusUpdating || !statusReason.trim()}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                {statusUpdating ? 'Updating...' : 'Save Audit Change'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
