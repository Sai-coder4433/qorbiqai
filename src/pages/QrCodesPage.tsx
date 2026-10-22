import React, { useState, useEffect } from 'react';
import {
  QrCode as QrIcon,
  Plus,
  Search,
  ExternalLink,
  Copy,
  Check,
  Pause,
  Play,
  Trash2,
  Edit2,
  Download,
  Eye,
  Calendar,
  Layers,
  AlertCircle,
  HelpCircle,
  FileText,
  Printer,
  X,
  Sparkles,
  Link2
} from 'lucide-react';
import { fetchApi } from '../lib/api.ts';
import { generateQrPngDataUrl, generateQrSvgString, generatePrintPdf, downloadFile, PrintTemplateType } from '../lib/qr-generator.ts';
import { AppLayout } from '../components/layout/AppLayout.tsx';

interface QrItem {
  id: string;
  businessId: string;
  name: string;
  code: string;
  destinationUrl: string;
  status: 'ACTIVE' | 'PAUSED';
  placement: 'Counter' | 'Table Stand' | 'Reception' | 'Billing Desk' | 'Window / Entrance' | 'Packaging / Delivery' | 'Poster' | 'Business Card' | 'Other';
  totalScans: number;
  uniqueScans: number;
  lastScannedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const QrCodesPage: React.FC = () => {
  const [qrs, setQrs] = useState<QrItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCount, setActiveCount] = useState(1);
  const [maxAllowed, setMaxAllowed] = useState(1);
  const [canCreateActive, setCanCreateActive] = useState(false);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [selectedQrForPreview, setSelectedQrForPreview] = useState<QrItem | null>(null);
  const [selectedQrForEdit, setSelectedQrForEdit] = useState<QrItem | null>(null);
  const [selectedQrForDelete, setSelectedQrForDelete] = useState<QrItem | null>(null);
  const [selectedQrForExport, setSelectedQrForExport] = useState<QrItem | null>(null);

  // Form states
  const [newName, setNewName] = useState('');
  const [newDestination, setNewDestination] = useState('https://search.google.com/local/writereview?placeid=ChIJ_AtharvPlaceId');
  const [newPlacement, setNewPlacement] = useState<any>('Counter');
  const [editName, setEditName] = useState('');
  const [editDestination, setEditDestination] = useState('');
  const [editPlacement, setEditPlacement] = useState<any>('Counter');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Preview generated assets
  const [previewPngUrl, setPreviewPngUrl] = useState<string>('');
  const [activeMockup, setActiveMockup] = useState<PrintTemplateType>('counter_stand');

  const businessName = 'Atharv Electricals';

  const loadQrs = async () => {
    try {
      setLoading(true);
      const res = await fetchApi<any>('/qr-codes?businessId=biz_001');
      if (res?.qrCodes) {
        setQrs(res.qrCodes);
        setActiveCount(res.activeCount ?? res.qrCodes.filter((q: any) => q.status === 'ACTIVE').length);
        setMaxAllowed(res.maxActiveAllowed ?? 1);
        setCanCreateActive(res.canCreateActive ?? false);
      }
    } catch (e: any) {
      console.error('Failed to load QR codes:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQrs();
  }, []);

  // Update preview PNG whenever selectedQrForPreview changes
  useEffect(() => {
    if (selectedQrForPreview) {
      const redirectUrl = `${window.location.origin}/r/${selectedQrForPreview.code}`;
      generateQrPngDataUrl(redirectUrl, { width: 1024, margin: 2 }).then(setPreviewPngUrl);
    }
  }, [selectedQrForPreview]);

  const handleCreateQr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return alert('Name required');
    if (!newDestination.trim()) return alert('Destination URL required');

    setIsSubmitting(true);
    try {
      const res = await fetchApi<any>('/qr-codes', {
        method: 'POST',
        body: JSON.stringify({
          businessId: 'biz_001',
          name: newName.trim(),
          destinationUrl: newDestination.trim(),
          placement: newPlacement
        })
      });

      if (res?.qrCode) {
        setShowCreateModal(false);
        setNewName('');
        await loadQrs();
      }
    } catch (e: any) {
      if (e.message?.includes('limit reached')) {
        setShowCreateModal(false);
        setShowLimitModal(true);
      } else {
        alert(e.message || 'Failed to create QR');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateQr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQrForEdit) return;

    setIsSubmitting(true);
    try {
      await fetchApi<any>(`/qr-codes/${selectedQrForEdit.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editName.trim(),
          destinationUrl: editDestination.trim(),
          placement: editPlacement
        })
      });
      setSelectedQrForEdit(null);
      await loadQrs();
    } catch (e: any) {
      alert(e.message || 'Failed to update QR');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (qr: QrItem) => {
    const nextStatus = qr.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      const res = await fetchApi<any>(`/qr-codes/${qr.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: nextStatus })
      });
      if (res?.qrCode) {
        await loadQrs();
      }
    } catch (e: any) {
      if (e.message?.includes('limit reached')) {
        setShowLimitModal(true);
      } else {
        alert(e.message || 'Status update failed');
      }
    }
  };

  const handleDeleteQr = async () => {
    if (!selectedQrForDelete) return;
    try {
      await fetchApi(`/qr-codes/${selectedQrForDelete.id}`, { method: 'DELETE' });
      setSelectedQrForDelete(null);
      await loadQrs();
    } catch (e: any) {
      alert(e.message || 'Failed to delete');
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredQrs = qrs.filter(q =>
    q.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.placement.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Top Header & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">QR Code Management</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Create, configure, print, and track all Google Review QR codes for {businessName}.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (activeCount >= maxAllowed) {
                  setShowLimitModal(true);
                } else {
                  setShowCreateModal(true);
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create QR Code
            </button>
          </div>
        </div>

        {/* Plan Limit Usage Banner */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300">
              <Layers className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Subscription Plan Limit</div>
              <div className="text-sm font-bold text-zinc-900 dark:text-white">
                Free Launch Tier: {activeCount} of {maxAllowed} Active QR Code in use
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-48 bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  activeCount >= maxAllowed ? 'bg-amber-500' : 'bg-blue-600'
                }`}
                style={{ width: `${Math.min(100, (activeCount / maxAllowed) * 100)}%` }}
              />
            </div>
            <button
              onClick={() => setShowLimitModal(true)}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold"
            >
              Upgrade Plan
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by QR name, placement, or code..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        {/* QR Codes Table */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-5 py-3.5">QR Code & Placement</th>
                  <th className="px-5 py-3.5">Destination URL</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Total Scans</th>
                  <th className="px-5 py-3.5">Unique Visitors</th>
                  <th className="px-5 py-3.5">Last Scanned</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-zinc-400">
                      Loading QR codes...
                    </td>
                  </tr>
                ) : filteredQrs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-zinc-400">
                      No QR codes found. Create your first QR code to start collecting reviews.
                    </td>
                  </tr>
                ) : (
                  filteredQrs.map(qr => {
                    const redirectUrl = `${window.location.origin}/r/${qr.code}`;
                    return (
                      <tr key={qr.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                        {/* Name & Placement */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              onClick={() => setSelectedQrForPreview(qr)}
                              className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors shrink-0"
                            >
                              <QrIcon className="w-5 h-5 text-zinc-800 dark:text-zinc-200" />
                            </div>
                            <div>
                              <div className="font-semibold text-zinc-900 dark:text-white flex items-center gap-1.5">
                                {qr.name}
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5 font-mono">
                                <span>/r/{qr.code}</span>
                                <span>•</span>
                                <span className="text-zinc-500 font-sans">{qr.placement}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Destination */}
                        <td className="px-5 py-4 max-w-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate text-zinc-600 dark:text-zinc-400 font-mono text-[11px]">
                              {qr.destinationUrl}
                            </span>
                            <a
                              href={qr.destinationUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-zinc-400 hover:text-blue-600 shrink-0"
                              title="Open destination in new tab"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                              qr.status === 'ACTIVE'
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                qr.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-amber-500'
                              }`}
                            />
                            {qr.status === 'ACTIVE' ? 'Active' : 'Paused'}
                          </span>
                        </td>

                        {/* Scans */}
                        <td className="px-5 py-4 font-semibold text-zinc-900 dark:text-white">
                          {qr.totalScans || 0}
                        </td>

                        {/* Unique Visitors */}
                        <td className="px-5 py-4 text-zinc-600 dark:text-zinc-400">
                          {qr.uniqueScans || 0}
                        </td>

                        {/* Last Scanned */}
                        <td className="px-5 py-4 text-zinc-500">
                          {qr.lastScannedAt ? new Date(qr.lastScannedAt).toLocaleDateString() : 'Never'}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Copy Trackable Link */}
                            <button
                              onClick={() => handleCopy(redirectUrl, qr.id)}
                              className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
                              title="Copy trackable redirect link"
                            >
                              {copiedId === qr.id ? (
                                <Check className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>

                            {/* Preview */}
                            <button
                              onClick={() => setSelectedQrForPreview(qr)}
                              className="p-1.5 text-zinc-500 hover:text-blue-600 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
                              title="Preview QR & stands"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Export / Download */}
                            <button
                              onClick={() => setSelectedQrForExport(qr)}
                              className="p-1.5 text-zinc-500 hover:text-emerald-600 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
                              title="Download PNG, SVG, PDF"
                            >
                              <Download className="w-4 h-4" />
                            </button>

                            {/* Edit / Rename */}
                            <button
                              onClick={() => {
                                setSelectedQrForEdit(qr);
                                setEditName(qr.name);
                                setEditDestination(qr.destinationUrl);
                                setEditPlacement(qr.placement);
                              }}
                              className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
                              title="Edit name, destination, placement"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            {/* Pause / Resume */}
                            <button
                              onClick={() => handleToggleStatus(qr)}
                              className={`p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                                qr.status === 'ACTIVE'
                                  ? 'text-amber-600 hover:text-amber-700'
                                  : 'text-emerald-600 hover:text-emerald-700'
                              }`}
                              title={qr.status === 'ACTIVE' ? 'Pause QR Code' : 'Reactivate QR Code'}
                            >
                              {qr.status === 'ACTIVE' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => setSelectedQrForDelete(qr)}
                              className="p-1.5 text-zinc-400 hover:text-rose-600 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
                              title="Delete QR Code"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* CREATE QR MODAL */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                <h3 className="font-bold text-base text-zinc-900 dark:text-white">Create Google Review QR Code</h3>
                <button onClick={() => setShowCreateModal(false)} className="text-zinc-400 hover:text-zinc-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateQr} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                    QR Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Table Stand #4 or Reception Desk"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                    Placement
                  </label>
                  <select
                    value={newPlacement}
                    onChange={e => setNewPlacement(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs dark:text-white"
                  >
                    <option value="Counter">Counter / Billing Desk</option>
                    <option value="Table Stand">Table Stand / Tent Card</option>
                    <option value="Reception">Reception / Waiting Area</option>
                    <option value="Window / Entrance">Window / Entrance Door</option>
                    <option value="Packaging / Delivery">Packaging / Takeaway Bag</option>
                    <option value="Poster">Poster / Wall Frame</option>
                    <option value="Business Card">Business Card</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                    Official Google Review URL *
                  </label>
                  <input
                    type="url"
                    required
                    value={newDestination}
                    onChange={e => setNewDestination(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs font-mono dark:text-white"
                  />
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Direct write-review destination URL. Customers will open this page immediately on scan.
                  </p>
                </div>

                <div className="pt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm"
                  >
                    {isSubmitting ? 'Creating...' : 'Create & Activate'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* EDIT / UPDATE DESTINATION MODAL */}
        {selectedQrForEdit && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                <h3 className="font-bold text-base text-zinc-900 dark:text-white">Edit QR Code & Destination</h3>
                <button onClick={() => setSelectedQrForEdit(null)} className="text-zinc-400 hover:text-zinc-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateQr} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                    QR Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                    Placement
                  </label>
                  <select
                    value={editPlacement}
                    onChange={e => setEditPlacement(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs dark:text-white"
                  >
                    <option value="Counter">Counter / Billing Desk</option>
                    <option value="Table Stand">Table Stand / Tent Card</option>
                    <option value="Reception">Reception / Waiting Area</option>
                    <option value="Window / Entrance">Window / Entrance Door</option>
                    <option value="Packaging / Delivery">Packaging / Takeaway Bag</option>
                    <option value="Poster">Poster / Wall Frame</option>
                    <option value="Business Card">Business Card</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                    Google Review Destination URL
                  </label>
                  <input
                    type="url"
                    required
                    value={editDestination}
                    onChange={e => setEditDestination(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs font-mono dark:text-white"
                  />
                  <p className="text-[11px] text-zinc-500 mt-1 font-sans">
                    ✨ You can change this destination URL anytime without reprinting your existing QR codes!
                  </p>
                </div>

                <div className="pt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedQrForEdit(null)}
                    className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg font-medium text-zinc-600 dark:text-zinc-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm"
                  >
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* PLAN LIMIT REACHED MODAL */}
        {showLimitModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-xl text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-zinc-900 dark:text-white">Free Plan Limit Reached</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                The Free Launch plan allows <strong>1 active Google Review QR code</strong>. You can pause an existing QR code to activate another one, or join the early access waitlist for our Starter tier.
              </p>

              <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-left text-xs space-y-1">
                <div className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Starter Plan (Coming Soon)
                </div>
                <div className="text-zinc-500">• Up to 5 active QR codes with placement analytics</div>
                <div className="text-zinc-500">• Print-quality vector SVG and PDF stand exports</div>
              </div>

              <div className="pt-2 flex justify-center gap-3 text-xs">
                <button
                  onClick={() => setShowLimitModal(false)}
                  className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowLimitModal(false);
                    fetchApi('/subscription/waitlist', {
                      method: 'POST',
                      body: JSON.stringify({ planName: 'STARTER', email: 'owner@atharvaelectricals.in' })
                    });
                    alert('You are on the Starter Plan waitlist! We will notify you when activated.');
                  }}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm"
                >
                  Notify Me on Launch
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PREVIEW MODAL */}
        {selectedQrForPreview && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                <div>
                  <h3 className="font-bold text-base text-zinc-900 dark:text-white">{selectedQrForPreview.name}</h3>
                  <p className="text-xs text-zinc-500 font-mono">/r/{selectedQrForPreview.code}</p>
                </div>
                <button onClick={() => setSelectedQrForPreview(null)} className="text-zinc-400 hover:text-zinc-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mockup Preview Switcher */}
              <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg text-xs font-medium">
                <button
                  onClick={() => setActiveMockup('counter_stand')}
                  className={`flex-1 py-1 rounded transition-all ${
                    activeMockup === 'counter_stand' ? 'bg-white dark:bg-zinc-700 font-bold shadow-xs text-blue-600' : 'text-zinc-500'
                  }`}
                >
                  Counter Stand
                </button>
                <button
                  onClick={() => setActiveMockup('table_tent')}
                  className={`flex-1 py-1 rounded transition-all ${
                    activeMockup === 'table_tent' ? 'bg-white dark:bg-zinc-700 font-bold shadow-xs text-blue-600' : 'text-zinc-500'
                  }`}
                >
                  Table Tent
                </button>
                <button
                  onClick={() => setActiveMockup('wall_poster')}
                  className={`flex-1 py-1 rounded transition-all ${
                    activeMockup === 'wall_poster' ? 'bg-white dark:bg-zinc-700 font-bold shadow-xs text-blue-600' : 'text-zinc-500'
                  }`}
                >
                  Poster
                </button>
              </div>

              {/* Rendered Stand Mockup */}
              <div className="bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 rounded-xl p-6 flex flex-col items-center">
                <div className="w-52 bg-white border border-zinc-200 rounded-xl p-4 text-center shadow-lg text-zinc-900">
                  <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">Google Review</div>
                  <div className="font-bold text-xs tracking-tight text-zinc-900 truncate">{businessName}</div>
                  <div className="text-[9px] text-zinc-500 mb-1.5">Scan to leave a Google review</div>
                  <div className="text-amber-500 font-bold text-[11px] tracking-widest mb-2">★ ★ ★ ★ ★</div>

                  <div className="bg-zinc-50 p-2 rounded-lg border border-zinc-200 inline-block mb-2">
                    {previewPngUrl ? (
                      <img src={previewPngUrl} alt="QR Code" className="w-28 h-28 object-contain" />
                    ) : (
                      <div className="w-28 h-28 flex items-center justify-center text-xs text-zinc-400">Loading...</div>
                    )}
                  </div>

                  <div className="bg-blue-600 text-white text-[10px] font-bold py-1 px-2 rounded shadow-xs">
                    Review Us on Google
                  </div>
                  <div className="text-[8px] text-zinc-400 mt-1.5">
                    {selectedQrForPreview.placement} • Direct Redirection
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center text-xs">
                <a
                  href={`${window.location.origin}/r/${selectedQrForPreview.code}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
                >
                  Test Scan Redirect <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={() => {
                    const target = selectedQrForPreview;
                    setSelectedQrForPreview(null);
                    setSelectedQrForExport(target);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Assets
                </button>
              </div>
            </div>
          </div>
        )}

        {/* EXPORT / DOWNLOAD ASSETS MODAL */}
        {selectedQrForExport && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                <div>
                  <h3 className="font-bold text-base text-zinc-900 dark:text-white">Download Print Assets</h3>
                  <p className="text-xs text-zinc-500">{selectedQrForExport.name}</p>
                </div>
                <button onClick={() => setSelectedQrForExport(null)} className="text-zinc-400 hover:text-zinc-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                {/* PDF */}
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 bg-blue-50/30 dark:bg-blue-950/20">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                      <Printer className="w-4 h-4 text-blue-600" /> Ready-to-Print PDF
                    </span>
                    <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">5x7" Stand</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 mb-2">
                    Formatted for acrylic counter stands with Google 5-star badges and call-to-action.
                  </p>
                  <button
                    onClick={() => {
                      generatePrintPdf({
                        businessName,
                        qrCodeUrl: `${window.location.origin}/r/${selectedQrForExport.code}`,
                        placementName: selectedQrForExport.placement,
                        templateType: 'counter_stand'
                      });
                    }}
                    className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm"
                  >
                    Download Stand PDF
                  </button>
                </div>

                {/* PNG */}
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-zinc-600" /> Ultra HD PNG (300 DPI)
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">3000 x 3000 px</span>
                  </div>
                  <button
                    onClick={async () => {
                      const png = await generateQrPngDataUrl(`${window.location.origin}/r/${selectedQrForExport.code}`, { width: 3000, margin: 3 });
                      downloadFile(png, `${selectedQrForExport.name.replace(/\s+/g, '_')}_3000px_HD.png`, 'image/png');
                    }}
                    className="w-full py-1.5 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium rounded-lg text-zinc-800 dark:text-zinc-200 cursor-pointer"
                  >
                    Download 3000×3000 HD PNG
                  </button>
                </div>

                {/* SVG */}
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-zinc-600" /> Vector SVG
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">Lossless Vector</span>
                  </div>
                  <button
                    onClick={async () => {
                      const svg = await generateQrSvgString(`${window.location.origin}/r/${selectedQrForExport.code}`);
                      downloadFile(svg, `${selectedQrForExport.name.replace(/\s+/g, '_')}.svg`, 'image/svg+xml');
                    }}
                    className="w-full py-1.5 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium rounded-lg text-zinc-800 dark:text-zinc-200"
                  >
                    Download SVG
                  </button>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setSelectedQrForExport(null)}
                  className="px-4 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DELETE CONFIRMATION MODAL */}
        {selectedQrForDelete && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-sm w-full p-6 shadow-xl text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-zinc-900 dark:text-white">Delete QR Code?</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Are you sure you want to delete <strong>{selectedQrForDelete.name}</strong>? Physical prints of this QR code will stop redirecting customers to Google Reviews.
              </p>

              <div className="pt-2 flex justify-center gap-3 text-xs">
                <button
                  onClick={() => setSelectedQrForDelete(null)}
                  className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteQr}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg shadow-sm"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};
