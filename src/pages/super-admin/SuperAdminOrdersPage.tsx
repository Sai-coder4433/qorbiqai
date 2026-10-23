import React, { useState, useEffect } from 'react';
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  Search,
  ExternalLink,
  MapPin,
  Phone,
  User,
  Sliders,
  CheckSquare,
  Square,
  Repeat,
  XCircle,
  Send,
  Eye,
  QrCode,
  Radio
} from 'lucide-react';
import { freshTestApi } from '../../lib/fresh-test-api.ts';
import {
  StandeeProductOrder,
  ProductActivationRecord,
  StandeeOrderStatus
} from '../../../server/reviewflow/types.ts';

const ALL_ORDER_STATUSES: StandeeOrderStatus[] = [
  'DRAFT',
  'PAYMENT_PENDING',
  'PAYMENT_FAILED',
  'PAID',
  'ORDER_CONFIRMED',
  'IN_PRODUCTION',
  'QR_GENERATED',
  'NFC_ENCODED',
  'QUALITY_CHECKED',
  'PACKED',
  'DISPATCHED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
  'RETURNED'
];

export const SuperAdminOrdersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'orders' | 'activations'>('orders');
  const [orders, setOrders] = useState<StandeeProductOrder[]>([]);
  const [activations, setActivations] = useState<ProductActivationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Selected Order for Tracking / Status Update
  const [trackingModalOrder, setTrackingModalOrder] = useState<StandeeProductOrder | null>(null);
  const [courierProvider, setCourierProvider] = useState('Delhivery');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [trackingNotes, setTrackingNotes] = useState('');
  const [trackingUpdating, setTrackingUpdating] = useState(false);

  // Status Change Modal
  const [statusModalOrder, setStatusModalOrder] = useState<StandeeProductOrder | null>(null);
  const [newStatus, setNewStatus] = useState<StandeeOrderStatus>('IN_PRODUCTION');
  const [statusNotes, setStatusNotes] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(false);

  // Order Details Modal
  const [selectedOrder, setSelectedOrder] = useState<StandeeProductOrder | null>(null);

  // Reprint Modal
  const [reprintActivation, setReprintActivation] = useState<ProductActivationRecord | null>(null);
  const [reprintReason, setReprintReason] = useState('');
  const [reprintSubmitting, setReprintSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [ordersRes, activationsRes] = await Promise.all([
        freshTestApi.getAdminOrders(),
        freshTestApi.getAdminActivations()
      ]);
      setOrders(ordersRes.orders || []);
      setActivations(activationsRes.activations || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load order & hardware operations.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusModalOrder) return;
    try {
      setStatusUpdating(true);
      await freshTestApi.updateAdminOrderStatus(statusModalOrder.id, newStatus, statusNotes);
      setStatusModalOrder(null);
      setStatusNotes('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update order status');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleAssignTracking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingModalOrder || !trackingNumber.trim()) return;
    try {
      setTrackingUpdating(true);
      await freshTestApi.assignCourierTracking(
        trackingModalOrder.id,
        {
          courierProvider,
          trackingNumber: trackingNumber.trim(),
          trackingUrl: trackingUrl.trim() || undefined,
          notes: trackingNotes.trim() || undefined
        }
      );
      setTrackingModalOrder(null);
      setTrackingNumber('');
      setTrackingUrl('');
      setTrackingNotes('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to assign tracking');
    } finally {
      setTrackingUpdating(false);
    }
  };

  const handleToggleChecklist = async (
    activationId: string,
    key: 'qrGenerated' | 'nfcEncoded' | 'qualityChecked' | 'packed',
    currentVal: boolean
  ) => {
    try {
      await freshTestApi.updateActivationChecklist(activationId, {
        [key]: !currentVal
      });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update checklist item');
    }
  };

  const handleRequestReprint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reprintActivation || !reprintReason.trim()) return;
    try {
      setReprintSubmitting(true);
      await freshTestApi.recordReprint(reprintActivation.id, reprintReason.trim());
      setReprintActivation(null);
      setReprintReason('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to record reprint request');
    } finally {
      setReprintSubmitting(false);
    }
  };

  // Filtered Orders
  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === 'ALL' || o.orderStatus === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesStatus;

    const matchesQuery =
      o.orderNumber.toLowerCase().includes(q) ||
      o.businessName?.toLowerCase().includes(q) ||
      o.shippingAddress?.fullName?.toLowerCase().includes(q) ||
      o.shippingAddress?.city?.toLowerCase().includes(q) ||
      o.shippingAddress?.pinCode?.includes(q) ||
      o.trackingNumber?.toLowerCase().includes(q);

    return matchesStatus && matchesQuery;
  });

  // KPI Calculations
  const totalOrdersCount = orders.length;
  const awaitingDispatchCount = orders.filter((o) =>
    ['PAID', 'ORDER_CONFIRMED', 'IN_PRODUCTION', 'QR_GENERATED', 'NFC_ENCODED', 'QUALITY_CHECKED', 'PACKED'].includes(
      o.orderStatus
    )
  ).length;
  const dispatchedCount = orders.filter((o) =>
    ['DISPATCHED', 'OUT_FOR_DELIVERY'].includes(o.orderStatus)
  ).length;
  const deliveredCount = orders.filter((o) => o.orderStatus === 'DELIVERED').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Package className="w-7 h-7 text-blue-600" />
            <span>NFC & QR Standee Operations</span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700">
              Hardware Fulfillment
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            End-to-end fulfillment pipeline for physical review stands, NFC chip encoding, quality assurance, courier tracking, and reprint audits.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block">Total Standee Orders</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalOrdersCount}</div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Lifetime orders</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-medium text-amber-600 block">Awaiting Dispatch</span>
          <div className="text-2xl font-black text-amber-600 mt-1">{awaitingDispatchCount}</div>
          <span className="text-[10px] text-amber-600/80 mt-0.5 block">In production & packaging</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-medium text-blue-600 block">Dispatched / In Transit</span>
          <div className="text-2xl font-black text-blue-600 mt-1">{dispatchedCount}</div>
          <span className="text-[10px] text-blue-600/80 mt-0.5 block">Assigned tracking URL</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-medium text-emerald-600 block">Delivered to Merchant</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">{deliveredCount}</div>
          <span className="text-[10px] text-emerald-600/80 mt-0.5 block">Successfully received</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 cursor-pointer transition-colors border-b-2 ${
            activeTab === 'orders'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Orders Management ({orders.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('activations')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 cursor-pointer transition-colors border-b-2 ${
            activeTab === 'activations'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>Hardware Activations & Checklist ({activations.length})</span>
        </button>
      </div>

      {/* TAB 1: ORDERS */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {/* Search & Filter Toolbar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by order number (e.g. QOR-ORD-...), recipient, business, city, PIN, tracking..."
                className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Statuses ({orders.length})</option>
                {ALL_ORDER_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            {filteredOrders.length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <Package className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-700">No Orders Found</p>
                <p className="text-xs text-slate-400">
                  {orders.length === 0
                    ? 'Orders will appear here as merchants place orders for physical QR or NFC standees.'
                    : 'No orders match the selected filter.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Order #</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Customer & Business</th>
                      <th className="py-3 px-4">Items Ordered</th>
                      <th className="py-3 px-4">Shipping Destination</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Order Status</th>
                      <th className="py-3 px-4">Tracking</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                          {order.orderNumber}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                          {new Date(order.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short'
                          })}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">
                            {order.shippingAddress?.fullName || 'Customer'}
                          </div>
                          <div className="text-[11px] text-slate-500 font-medium">
                            {order.businessName || 'Business Workspace'}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {order.shippingAddress?.phone}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          {order.items?.map((it, idx) => (
                            <div key={idx} className="text-slate-800">
                              <span className="font-semibold">{it.productName}</span>{' '}
                              <span className="text-[10px] text-slate-500">×{it.quantity}</span>
                            </div>
                          ))}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-slate-800 truncate max-w-[150px]">
                            {order.shippingAddress?.city}, {order.shippingAddress?.state}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            PIN: {order.shippingAddress?.pinCode}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                          ₹{order.totalAmount}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase ${
                              order.orderStatus === 'DELIVERED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : order.orderStatus === 'DISPATCHED' || order.orderStatus === 'OUT_FOR_DELIVERY'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : order.orderStatus === 'CANCELLED' || order.orderStatus === 'PAYMENT_FAILED'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {order.orderStatus.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {order.trackingNumber ? (
                            <div>
                              <div className="font-semibold text-slate-900">{order.courierProvider}</div>
                              {order.trackingUrl ? (
                                <a
                                  href={order.trackingUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[10px] text-blue-600 hover:underline font-mono flex items-center gap-1"
                                >
                                  <span>{order.trackingNumber}</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              ) : (
                                <span className="text-[10px] font-mono text-slate-500">
                                  {order.trackingNumber}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Not Dispatched</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedOrder(order)}
                              title="Full Order Details"
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setTrackingModalOrder(order);
                                setCourierProvider(order.courierProvider || 'Delhivery');
                                setTrackingNumber(order.trackingNumber || '');
                                setTrackingUrl(order.trackingUrl || '');
                              }}
                              title="Assign Courier & Tracking"
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Truck className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setStatusModalOrder(order);
                                setNewStatus(order.orderStatus);
                              }}
                              title="Update Status"
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Sliders className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: HARDWARE ACTIVATIONS & PREPARATION CHECKLIST */}
      {activeTab === 'activations' && (
        <div className="space-y-4">
          <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 text-xs text-blue-900 flex items-start gap-3">
            <Radio className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold">Hardware Provisioning & Operational Checklist</p>
              <p className="text-blue-800 leading-relaxed">
                Before physical dispatch, verify the dynamic QR print, encode the NTAG213/215 NFC chip with the permanent ReviewFlow redirect URL, perform physical quality checks, and record reprint requests with audit justifications.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activations.map((act) => (
              <div
                key={act.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600">
                      {act.productType.replace(/_/g, ' ')}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm mt-0.5">{act.productName}</h3>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Business: <span className="font-semibold text-slate-800">{act.businessName}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setReprintActivation(act);
                      setReprintReason('');
                    }}
                    className="px-2.5 py-1 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Repeat className="w-3.5 h-3.5" />
                    <span>Reprint / Re-encode</span>
                  </button>
                </div>

                {/* Target URL */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Encoded Destination URL
                  </span>
                  <a
                    href={act.destinationUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline font-mono text-[11px] flex items-center gap-1 break-all"
                  >
                    <span>{act.destinationUrl}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </div>

                {/* Preparation Checklist */}
                <div>
                  <span className="text-xs font-bold text-slate-700 block mb-2">Fulfillment Checklist</span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() =>
                        handleToggleChecklist(
                          act.id,
                          'qrGenerated',
                          !!act.hardwareChecklist?.qrGenerated
                        )
                      }
                      className={`p-2.5 rounded-xl border flex items-center gap-2 text-left cursor-pointer transition-colors ${
                        act.hardwareChecklist?.qrGenerated
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-semibold'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      {act.hardwareChecklist?.qrGenerated ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <span>QR Print Ready</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleToggleChecklist(
                          act.id,
                          'nfcEncoded',
                          !!act.hardwareChecklist?.nfcEncoded
                        )
                      }
                      className={`p-2.5 rounded-xl border flex items-center gap-2 text-left cursor-pointer transition-colors ${
                        act.hardwareChecklist?.nfcEncoded
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-semibold'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      {act.hardwareChecklist?.nfcEncoded ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <span>NFC Chip Encoded</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleToggleChecklist(
                          act.id,
                          'qualityChecked',
                          !!act.hardwareChecklist?.qualityChecked
                        )
                      }
                      className={`p-2.5 rounded-xl border flex items-center gap-2 text-left cursor-pointer transition-colors ${
                        act.hardwareChecklist?.qualityChecked
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-semibold'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      {act.hardwareChecklist?.qualityChecked ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <span>Quality Inspected</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleToggleChecklist(act.id, 'packed', !!act.hardwareChecklist?.packed)
                      }
                      className={`p-2.5 rounded-xl border flex items-center gap-2 text-left cursor-pointer transition-colors ${
                        act.hardwareChecklist?.packed
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-semibold'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      {act.hardwareChecklist?.packed ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <span>Boxed & Packed</span>
                    </button>
                  </div>
                </div>

                {/* Reprint History */}
                {act.reprintHistory && act.reprintHistory.length > 0 && (
                  <div className="border-t border-slate-100 pt-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Reprint Audit Logs ({act.reprintHistory.length})
                    </span>
                    <div className="space-y-1">
                      {act.reprintHistory.map((rep, idx) => (
                        <div key={idx} className="text-[11px] text-slate-600 bg-amber-50/60 p-2 rounded-lg border border-amber-100">
                          <span className="font-semibold text-amber-900">
                            {new Date(rep.requestedAt || rep.date).toLocaleDateString()}:
                          </span>{' '}
                          {rep.reason}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* COURIER & TRACKING MODAL */}
      {trackingModalOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleAssignTracking}
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Assign Courier Tracking</h3>
                <span className="font-mono text-xs text-blue-600">{trackingModalOrder.orderNumber}</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Courier Provider</label>
              <select
                value={courierProvider}
                onChange={(e) => setCourierProvider(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              >
                <option value="Delhivery">Delhivery</option>
                <option value="BlueDart">Blue Dart</option>
                <option value="DTDC">DTDC</option>
                <option value="India Post">India Post Speed Post</option>
                <option value="Shadowfax">Shadowfax</option>
                <option value="Ecom Express">Ecom Express</option>
                <option value="Other">Other / Hand Delivered</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Tracking AWB / Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="e.g. DELH123456789"
                required
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Live Tracking URL (Optional)
              </label>
              <input
                type="url"
                value={trackingUrl}
                onChange={(e) => setTrackingUrl(e.target.value)}
                placeholder="https://www.delhivery.com/track/package/..."
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Dispatch Notes</label>
              <input
                type="text"
                value={trackingNotes}
                onChange={(e) => setTrackingNotes(e.target.value)}
                placeholder="e.g. Standard stand box + 2 NFC stickers included"
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setTrackingModalOrder(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={trackingUpdating || !trackingNumber.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                {trackingUpdating ? 'Saving...' : 'Dispatch & Save'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STATUS UPDATE MODAL */}
      {statusModalOrder && (
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
                <h3 className="font-bold text-base text-slate-900">Update Order Lifecycle</h3>
                <span className="font-mono text-xs text-blue-600">{statusModalOrder.orderNumber}</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">New Lifecycle Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as any)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              >
                {ALL_ORDER_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Transition Audit Note</label>
              <textarea
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                placeholder="Optional explanation for internal logs..."
                rows={2}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setStatusModalOrder(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={statusUpdating}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                {statusUpdating ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* REPRINT MODAL */}
      {reprintActivation && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleRequestReprint}
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
                <Repeat className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Record Reprint / Re-encode</h3>
                <span className="text-xs text-slate-500">{reprintActivation.productName}</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Reason for Hardware Reprint <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={reprintReason}
                onChange={(e) => setReprintReason(e.target.value)}
                placeholder="e.g. Standee acrylic cracked in shipping, customer requested logo update, NFC chip corrupted..."
                required
                rows={3}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setReprintActivation(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={reprintSubmitting || !reprintReason.trim()}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                {reprintSubmitting ? 'Recording...' : 'Authorize Reprint'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ORDER DETAILS MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-blue-600">{selectedOrder.orderNumber}</span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">Physical Product Order</h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Shipping Address
                </span>
                <div className="font-bold text-slate-900">{selectedOrder.shippingAddress?.fullName}</div>
                <div className="text-slate-600">{selectedOrder.shippingAddress?.streetAddress}</div>
                {selectedOrder.shippingAddress?.landmark && (
                  <div className="text-slate-500">Landmark: {selectedOrder.shippingAddress.landmark}</div>
                )}
                <div className="text-slate-800 font-semibold">
                  {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} —{' '}
                  <span className="font-mono">{selectedOrder.shippingAddress?.pinCode}</span>
                </div>
                <div className="text-slate-600 pt-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{selectedOrder.shippingAddress?.phone}</span>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-700 block mb-1.5">Items</span>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {selectedOrder.items?.map((it, idx) => (
                    <div key={idx} className="p-3 flex justify-between items-center bg-white">
                      <div>
                        <div className="font-semibold text-slate-900">{it.productName}</div>
                        <div className="text-[10px] text-slate-500">Qty: {it.quantity} × ₹{it.unitPrice}</div>
                      </div>
                      <div className="font-bold text-slate-900">₹{it.amount}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 font-bold text-slate-900 border-t border-slate-100">
                <span>Total Amount Paid:</span>
                <span className="text-base text-blue-600">₹{selectedOrder.totalAmount}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
