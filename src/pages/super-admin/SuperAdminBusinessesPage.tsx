import React, { useState, useEffect } from 'react';
import {
  Building2,
  Search,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  QrCode,
  Sparkles,
  Download,
  Copy,
  Check,
  X,
  ShieldCheck
} from 'lucide-react';
import { freshTestApi } from '../../lib/fresh-test-api.ts';
import { Link } from 'react-router-dom';
import { downloadUltraHdPng, downloadVectorSvg, generateQrPngDataUrl } from '../../lib/qr-generator.ts';

export const SuperAdminBusinessesPage: React.FC = () => {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'configured' | 'missing'>('all');

  // HD QR modal
  const [selectedBizForQr, setSelectedBizForQr] = useState<any | null>(null);
  const [qrPreviewUrl, setQrPreviewUrl] = useState<string>('');
  const [downloadingHdPng, setDownloadingHdPng] = useState(false);
  const [downloadingSvg, setDownloadingSvg] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    loadBusinesses();
  }, []);

  const loadBusinesses = async () => {
    try {
      setLoading(true);
      const list = await freshTestApi.getAdminBusinesses();
      setBusinesses(list || []);
    } catch (err: any) {
      console.error('Failed to load businesses:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = businesses.filter(b => {
    const q = search.toLowerCase();
    const matchSearch =
      b.businessName?.toLowerCase().includes(q) ||
      b.ownerEmail?.toLowerCase().includes(q) ||
      b.city?.toLowerCase().includes(q);
    if (!matchSearch) return false;

    if (filter === 'configured') return Boolean(b.googleReviewUrl && b.googleReviewUrl.trim());
    if (filter === 'missing') return !b.googleReviewUrl || !b.googleReviewUrl.trim();
    return true;
  });

  const openQrModal = async (b: any) => {
    setSelectedBizForQr(b);
    setCopiedLink(false);
    const code = b.primaryQrCode || (b.qrCodes && b.qrCodes[0]?.uniqueCode) || b.uniqueCode || b.id;
    const redirectUrl = `${window.location.origin}/r/${code}`;
    try {
      const preview = await generateQrPngDataUrl(redirectUrl, { width: 600, margin: 2 });
      setQrPreviewUrl(preview);
    } catch (e) {
      console.error('Failed to generate preview:', e);
    }
  };

  const handleDownloadModalPng = async () => {
    if (!selectedBizForQr) return;
    const code = selectedBizForQr.primaryQrCode || (selectedBizForQr.qrCodes && selectedBizForQr.qrCodes[0]?.uniqueCode) || selectedBizForQr.uniqueCode || selectedBizForQr.id;
    const redirectUrl = `${window.location.origin}/r/${code}`;
    try {
      setDownloadingHdPng(true);
      const name = (selectedBizForQr.businessName || 'business').toLowerCase().replace(/\s+/g, '-');
      await downloadUltraHdPng(redirectUrl, `${name}-3000x3000-hd.png`);
    } catch (e) {
      console.error('Failed to download HD PNG:', e);
    } finally {
      setDownloadingHdPng(false);
    }
  };

  const handleDownloadModalSvg = async () => {
    if (!selectedBizForQr) return;
    const code = selectedBizForQr.primaryQrCode || (selectedBizForQr.qrCodes && selectedBizForQr.qrCodes[0]?.uniqueCode) || selectedBizForQr.uniqueCode || selectedBizForQr.id;
    const redirectUrl = `${window.location.origin}/r/${code}`;
    try {
      setDownloadingSvg(true);
      const name = (selectedBizForQr.businessName || 'business').toLowerCase().replace(/\s+/g, '-');
      await downloadVectorSvg(redirectUrl, `${name}-vector.svg`);
    } catch (e) {
      console.error('Failed to download SVG:', e);
    } finally {
      setDownloadingSvg(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-600" />
            <span>Businesses Directory</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Global catalog of all registered business locations, dynamic QR codes, and Google review link configurations.
          </p>
        </div>
        <button
          onClick={loadBusinesses}
          className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-2 cursor-pointer shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Search & Filter */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search business, owner, city..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 outline-hidden"
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
              filter === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            All ({businesses.length})
          </button>
          <button
            onClick={() => setFilter('configured')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
              filter === 'configured'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Configured Link
          </button>
          <button
            onClick={() => setFilter('missing')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
              filter === 'missing'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Missing Link
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-20 text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
            <p className="text-xs text-slate-500 mt-2">Loading businesses...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-xs">No business records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Business / Category</th>
                  <th className="py-3.5 px-4">Owner / Account</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Google Review URL</th>
                  <th className="py-3.5 px-4">QR Stands</th>
                  <th className="py-3.5 px-4">Scans</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filtered.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{b.businessName}</div>
                      <div className="text-[10px] text-slate-500 capitalize">{b.category?.replace('_', ' ')}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-800 font-medium">{b.ownerName || 'Client'}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{b.ownerEmail}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {b.city ? `${b.city}, ${b.state}` : 'Not specified'}
                    </td>
                    <td className="py-3.5 px-4">
                      {b.googleReviewUrl ? (
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="font-mono text-[11px] text-emerald-700 truncate max-w-[160px]">
                            {b.googleReviewUrl}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-rose-600">
                          <span className="w-2 h-2 rounded-full bg-rose-500" />
                          <span className="text-[11px]">Missing</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {b.activeQrCount} active / {b.qrCount} total
                    </td>
                    <td className="py-3.5 px-4 text-emerald-600 font-semibold">{b.totalScans} scans</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openQrModal(b)}
                          className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
                          title="View Dynamic QR and Export 3000x3000px PNG or SVG"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>HD QR</span>
                        </button>
                        <Link
                          to={`/super-admin/clients/${b.ownerUid}`}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <span>Inspect</span>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DYNAMIC QR HD EXPORT MODAL */}
      {selectedBizForQr && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-base text-slate-900">
                  Dynamic QR • {selectedBizForQr.businessName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedBizForQr(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Architecture Banner */}
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Permanent Dynamic QR • Zero Expiry</span>
              </div>
              <p className="text-[11px] text-emerald-700 leading-relaxed">
                Encoded URL is permanent (<span className="font-mono font-semibold">/r/{selectedBizForQr.primaryQrCode || selectedBizForQr.uniqueCode || selectedBizForQr.id}</span>). Future changes to the Google Review URL or destination will update automatically without reprinting this physical QR!
              </p>
            </div>

            {/* QR Preview & Destination Details */}
            <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              {qrPreviewUrl ? (
                <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs shrink-0">
                  <img src={qrPreviewUrl} alt="QR Preview" className="w-32 h-32 object-contain" />
                </div>
              ) : (
                <div className="w-32 h-32 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shrink-0">
                  <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                </div>
              )}

              <div className="space-y-2.5 text-xs text-slate-600 flex-1">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Permanent Dynamic URL</div>
                  <div className="font-mono text-slate-900 font-semibold truncate max-w-[240px]">
                    {window.location.origin}/r/{selectedBizForQr.primaryQrCode || selectedBizForQr.uniqueCode || selectedBizForQr.id}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Google Review Target</div>
                  <div className="font-mono text-slate-600 truncate max-w-[240px]">
                    {selectedBizForQr.googleReviewUrl || 'Not configured'}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={async () => {
                      const code = selectedBizForQr.primaryQrCode || selectedBizForQr.uniqueCode || selectedBizForQr.id;
                      await navigator.clipboard.writeText(`${window.location.origin}/r/${code}`);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold inline-flex items-center gap-1 shadow-xs"
                  >
                    {copiedLink ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedLink ? 'Copied' : 'Copy Route'}</span>
                  </button>

                  <a
                    href={`/r/${selectedBizForQr.primaryQrCode || selectedBizForQr.uniqueCode || selectedBizForQr.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-blue-600 font-semibold inline-flex items-center gap-1 shadow-xs"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Test Route</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Print & Production Export Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleDownloadModalPng}
                disabled={downloadingHdPng}
                className="p-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer shadow-sm disabled:opacity-50"
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Download className="w-4 h-4 text-blue-400" />
                  <span>{downloadingHdPng ? 'Rendering 3000px...' : '3000×3000 PNG'}</span>
                </div>
                <span className="text-[10px] text-slate-400">Print-Ready 300 DPI for NFC Cards</span>
              </button>

              <button
                onClick={handleDownloadModalSvg}
                disabled={downloadingSvg}
                className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer shadow-sm disabled:opacity-50"
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Download className="w-4 h-4 text-blue-200" />
                  <span>{downloadingSvg ? 'Rendering SVG...' : 'Vector SVG'}</span>
                </div>
                <span className="text-[10px] text-blue-200">Lossless Vector for Large Signs</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
