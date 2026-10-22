import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Download,
  Copy,
  ExternalLink,
  Edit2,
  Trash2,
  Power,
  RefreshCw,
  Search,
  Filter,
  Check,
  AlertCircle,
  BarChart3,
  Building2,
  Plus,
  X,
  Smartphone,
  Eye,
  CheckCircle2,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import {
  generateUltraHdQrPngDataUrl,
  downloadUltraHdPng,
  downloadVectorSvg
} from '../../lib/qr-generator.ts';

interface DynamicQrCode {
  qrId: string;
  businessId: string;
  shopSlug: string;
  routePath: string;
  destinationUrl: string;
  status: 'ACTIVE' | 'PAUSED' | 'DISABLED' | 'ARCHIVED';
  description: string;
  scanCount: number;
  lastScannedAt?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export const SuperAdminDynamicQrPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [qrCodes, setQrCodes] = useState<DynamicQrCode[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Edit Destination Modal State
  const [editingQr, setEditingQr] = useState<DynamicQrCode | null>(null);
  const [newDestination, setNewDestination] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Create QR Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createBusinessId, setCreateBusinessId] = useState('');
  const [createShopSlug, setCreateShopSlug] = useState('');
  const [createDestination, setCreateDestination] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // QR Preview Modal State
  const [previewQr, setPreviewQr] = useState<DynamicQrCode | null>(null);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);

  // Analytics Modal State
  const [selectedAnalyticsQr, setSelectedAnalyticsQr] = useState<DynamicQrCode | null>(null);
  const [qrAnalyticsData, setQrAnalyticsData] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  useEffect(() => {
    loadQrCodes();
  }, [statusFilter]);

  const loadQrCodes = async () => {
    try {
      setLoading(true);
      const url = new URL('/api/admin/dynamic-qr', credentialsOrigin());
      if (statusFilter !== 'ALL') url.searchParams.set('status', statusFilter);
      if (search.trim()) url.searchParams.set('search', search.trim());

      const res = await fetch(url.toString(), {
        headers: {
          'x-admin-auth': 'superadmin',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load QR codes');

      setQrCodes(data.qrCodes || []);
      setAnalytics(data.analytics || null);
    } catch (err) {
      console.error('Error loading dynamic QR codes:', err);
    } finally {
      setLoading(false);
    }
  };

  const credentialsOrigin = () => window.location.origin;

  const handleCopyUrl = (qr: DynamicQrCode) => {
    const fullUrl = `https://reviewflow.ai${qr.routePath}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(qr.qrId);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleOpenPreview = async (qr: DynamicQrCode) => {
    setPreviewQr(qr);
    const fullUrl = `https://reviewflow.ai${qr.routePath}`;
    const dataUrl = await generateUltraHdQrPngDataUrl(fullUrl, { width: 1024 });
    setPreviewDataUrl(dataUrl);
  };

  const handleDownload4kPng = async (qr: DynamicQrCode) => {
    const fullUrl = `https://reviewflow.ai${qr.routePath}`;
    await downloadUltraHdPng(fullUrl, `ReviewFlow-DynamicQR-${qr.businessId}-${qr.shopSlug}-4000px`);
  };

  const handleDownloadSvg = async (qr: DynamicQrCode) => {
    const fullUrl = `https://reviewflow.ai${qr.routePath}`;
    await downloadVectorSvg(fullUrl, `ReviewFlow-DynamicQR-${qr.businessId}-${qr.shopSlug}-vector`);
  };

  const handleOpenEdit = (qr: DynamicQrCode) => {
    setEditingQr(qr);
    setNewDestination(qr.destinationUrl);
    setNewDescription(qr.description || '');
    setEditError(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQr) return;
    try {
      setSavingEdit(true);
      setEditError(null);

      const res = await fetch(`/api/admin/dynamic-qr/${editingQr.qrId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-auth': 'superadmin',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          destinationUrl: newDestination,
          description: newDescription
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update destination');

      setEditingQr(null);
      await loadQrCodes();
    } catch (err: any) {
      setEditError(err.message || 'Error updating destination');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleToggleStatus = async (qr: DynamicQrCode) => {
    const newStatus = qr.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    try {
      const res = await fetch(`/api/admin/dynamic-qr/${qr.qrId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-auth': 'superadmin',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        await loadQrCodes();
      }
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const handleDelete = async (qrId: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this dynamic QR record?')) return;
    try {
      const res = await fetch(`/api/admin/dynamic-qr/${qrId}`, {
        method: 'DELETE',
        headers: {
          'x-admin-auth': 'superadmin',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      if (res.ok) {
        await loadQrCodes();
      }
    } catch (err) {
      console.error('Failed to delete QR:', err);
    }
  };

  const handleOpenAnalytics = async (qr: DynamicQrCode) => {
    setSelectedAnalyticsQr(qr);
    setLoadingAnalytics(true);
    try {
      const res = await fetch(`/api/admin/dynamic-qr/${qr.qrId}/analytics`, {
        headers: {
          'x-admin-auth': 'superadmin',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      const data = await res.json();
      setQrAnalyticsData(data.analytics || null);
    } catch (err) {
      console.error('Failed to load QR analytics:', err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const handleCreateQr = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      setCreateError(null);

      const res = await fetch('/api/admin/dynamic-qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-auth': 'superadmin',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          businessId: createBusinessId.trim(),
          shopSlug: createShopSlug.trim() || undefined,
          destinationUrl: createDestination.trim() || undefined,
          description: createDescription.trim() || undefined
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create QR code');

      setShowCreateModal(false);
      setCreateBusinessId('');
      setCreateShopSlug('');
      setCreateDestination('');
      setCreateDescription('');
      await loadQrCodes();
    } catch (err: any) {
      setCreateError(err.message || 'Error creating dynamic QR');
    } finally {
      setCreating(false);
    }
  };

  const filteredQrs = qrCodes.filter(q => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      q.qrId.toLowerCase().includes(s) ||
      q.businessId.toLowerCase().includes(s) ||
      q.shopSlug.toLowerCase().includes(s) ||
      (q.description && q.description.toLowerCase().includes(s))
    );
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>Dynamic QR Master Control</span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">
              Never Expiring
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Section 15-26: Truly dynamic QR codes resolving permanent redirect routes (`https://reviewflow.ai/r/biz_ID/slug/qr`). Changing destination or shop name never breaks physical stands.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Stand</span>
          </button>
          <button
            onClick={loadQrCodes}
            className="p-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 transition-colors cursor-pointer shadow-xs"
            title="Refresh list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Analytics Highlights */}
      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Scans</span>
            <div className="text-2xl font-black text-slate-900">{analytics.totalScans || 0}</div>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Scans Today</span>
            <div className="text-2xl font-black text-blue-600">{analytics.scansToday || 0}</div>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">This Week</span>
            <div className="text-2xl font-black text-emerald-600">{analytics.scansThisWeek || 0}</div>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">This Month</span>
            <div className="text-2xl font-black text-purple-600">{analytics.scansThisMonth || 0}</div>
          </div>
        </div>
      )}

      {/* Controls & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by business ID, slug, QR ID, description..."
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
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PAUSED">Paused</option>
            <option value="DISABLED">Disabled</option>
          </select>
        </div>
      </div>

      {/* Main QR Codes Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
            <p className="text-sm text-slate-500">Loading dynamic QR records...</p>
          </div>
        ) : filteredQrs.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <QrCode className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-600">No dynamic QR codes found</p>
            <p className="text-xs text-slate-400">Try adjusting filters or create a new dynamic stand.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Stand / Business</th>
                  <th className="py-3.5 px-4">Permanent Dynamic URL</th>
                  <th className="py-3.5 px-4">Destination URL</th>
                  <th className="py-3.5 px-4">Scans</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredQrs.map(qr => {
                  const dynamicUrl = `https://reviewflow.ai${qr.routePath}`;
                  return (
                    <tr key={qr.qrId} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleOpenPreview(qr)}
                            className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 hover:border-blue-500 cursor-pointer group"
                            title="Preview QR"
                          >
                            <QrCode className="w-5 h-5 text-slate-700 group-hover:text-blue-600 transition-colors" />
                          </button>
                          <div>
                            <div className="font-bold text-slate-900 text-xs">
                              {qr.description || 'Dynamic Review Stand'}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                              ID: {qr.businessId} • {qr.shopSlug}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px]">
                        <div className="flex items-center gap-1.5 max-w-xs truncate">
                          <span className="text-blue-600 truncate">{dynamicUrl}</span>
                          <button
                            onClick={() => handleCopyUrl(qr)}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
                            title="Copy Dynamic URL"
                          >
                            {copiedId === qr.qrId ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="py-3 px-4 max-w-xs truncate">
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-600 truncate">
                          <span className="truncate">{qr.destinationUrl}</span>
                          <button
                            onClick={() => handleOpenEdit(qr)}
                            className="p-1 text-slate-400 hover:text-blue-600 cursor-pointer shrink-0"
                            title="Edit Destination URL"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleOpenAnalytics(qr)}
                          className="font-bold text-slate-900 hover:text-blue-600 flex items-center gap-1 cursor-pointer"
                        >
                          <span>{qr.scanCount}</span>
                          <BarChart3 className="w-3 h-3 text-slate-400" />
                        </button>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            qr.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : qr.status === 'PAUSED'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {qr.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleDownload4kPng(qr)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                            title="Download 4000x4000 HD PNG"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDownloadSvg(qr)}
                            className="px-2 py-1 text-[10px] font-bold text-slate-600 hover:text-blue-600 rounded-md hover:bg-slate-100 cursor-pointer font-mono"
                            title="Download Vector SVG"
                          >
                            SVG
                          </button>
                          <a
                            href={qr.routePath}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100"
                            title="Test QR Redirect"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => handleToggleStatus(qr)}
                            className={`p-1.5 rounded-lg cursor-pointer ${
                              qr.status === 'ACTIVE'
                                ? 'text-slate-400 hover:text-amber-600'
                                : 'text-slate-400 hover:text-emerald-600'
                            }`}
                            title={qr.status === 'ACTIVE' ? 'Disable Stand' : 'Enable Stand'}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(qr.qrId)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                            title="Delete Stand"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* MODAL 1: Edit Destination Modal */}
      {editingQr && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Change Destination URL</h3>
              </div>
              <button
                onClick={() => setEditingQr(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-900 text-xs space-y-1">
              <span className="font-bold block flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Zero Stand Reprints Guarantee (Section 19)</span>
              </span>
              <p className="text-[11px] text-blue-800">
                The printed physical QR continues to work unchanged. Updating the destination will immediately route scans to your new URL without regenerating the QR.
              </p>
            </div>

            {editError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">
                  Current Dynamic Path
                </label>
                <input
                  type="text"
                  disabled
                  value={`https://reviewflow.ai${editingQr.routePath}`}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs font-mono text-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">
                  Target Destination URL (HTTP / HTTPS)
                </label>
                <input
                  type="text"
                  required
                  placeholder="https://reviewflow.ai/review/c/biz_... or custom URL"
                  value={newDestination}
                  onChange={e => setNewDestination(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-blue-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">
                  Description / Label
                </label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-blue-600"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingQr(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {savingEdit ? 'Updating...' : 'Save New Destination'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Create Dynamic QR Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Create New Dynamic QR Stand</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {createError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateQr} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">
                  Target Business ID
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. biz_8F72A"
                  value={createBusinessId}
                  onChange={e => setCreateBusinessId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-blue-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">
                  Shop Slug (Routing metadata)
                </label>
                <input
                  type="text"
                  placeholder="e.g. sai-footwear"
                  value={createShopSlug}
                  onChange={e => setCreateShopSlug(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-blue-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">
                  Target Destination URL (Defaults to customer review page)
                </label>
                <input
                  type="text"
                  placeholder="https://reviewflow.ai/review/c/..."
                  value={createDestination}
                  onChange={e => setCreateDestination(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-blue-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">
                  Description / Placement Label
                </label>
                <input
                  type="text"
                  placeholder="e.g. Front Cashier Desk Stand"
                  value={createDescription}
                  onChange={e => setCreateDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-blue-600"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Dynamic Stand'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: QR Preview & Download Modal */}
      {previewQr && previewDataUrl && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-5 shadow-2xl border border-slate-200 text-center">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 truncate">
                {previewQr.description || 'Dynamic Review QR'}
              </h3>
              <button
                onClick={() => setPreviewQr(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs inline-block">
              <img
                src={previewDataUrl}
                alt="Dynamic QR Code"
                className="w-48 h-48 mx-auto"
              />
            </div>

            <div className="text-[11px] text-slate-500 font-mono break-all px-2">
              https://reviewflow.ai{previewQr.routePath}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => handleDownload4kPng(previewQr)}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                4000px HD PNG
              </button>
              <button
                onClick={() => handleDownloadSvg(previewQr)}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-bold rounded-xl transition-colors cursor-pointer font-mono"
              >
                Vector SVG
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: QR Analytics Modal */}
      {selectedAnalyticsQr && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">QR Scan Analytics</h3>
                <span className="text-[10px] text-slate-400 font-mono">
                  {selectedAnalyticsQr.description || selectedAnalyticsQr.qrId}
                </span>
              </div>
              <button
                onClick={() => setSelectedAnalyticsQr(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {loadingAnalytics ? (
              <div className="py-12 text-center space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
                <p className="text-xs text-slate-400">Loading scan metrics...</p>
              </div>
            ) : qrAnalyticsData ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Total</span>
                    <span className="text-lg font-black text-slate-900">{qrAnalyticsData.totalScans}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Today</span>
                    <span className="text-lg font-black text-blue-600">{qrAnalyticsData.scansToday}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">This Week</span>
                    <span className="text-lg font-black text-emerald-600">{qrAnalyticsData.scansThisWeek}</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-700 block">Device Breakdown</span>
                  <div className="grid grid-cols-3 gap-2 text-xs text-slate-600">
                    <div className="p-2 rounded-lg bg-slate-50">
                      Mobile: <span className="font-bold text-slate-900">{qrAnalyticsData.deviceBreakdown?.mobile || 0}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50">
                      Desktop: <span className="font-bold text-slate-900">{qrAnalyticsData.deviceBreakdown?.desktop || 0}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50">
                      Tablet: <span className="font-bold text-slate-900">{qrAnalyticsData.deviceBreakdown?.tablet || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-6">No scan records available yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
