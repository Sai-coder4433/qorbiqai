import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Users,
  Building2,
  QrCode,
  Sparkles,
  CreditCard,
  FileText,
  ShieldCheck,
  ShieldAlert,
  ArrowLeft,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sliders,
  Check,
  Download,
  Copy
} from 'lucide-react';
import { freshTestApi } from '../../lib/fresh-test-api.ts';
import { downloadUltraHdPng, downloadVectorSvg } from '../../lib/qr-generator.ts';

export const SuperAdminClientDetailPage: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Limit change modal
  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const [newAiLimit, setNewAiLimit] = useState(500);
  const [newQrLimit, setNewQrLimit] = useState(5);
  const [limitLoading, setLimitLoading] = useState(false);

  // Status change modal
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<'active' | 'suspended'>('suspended');
  const [statusLoading, setStatusLoading] = useState(false);

  // QR Download state
  const [downloadingCode, setDownloadingCode] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleDownloadClientPng = async (uniqueCode: string, label: string) => {
    try {
      setDownloadingCode(`png_${uniqueCode}`);
      const bizName = (detail?.business?.businessName || 'client').toLowerCase().replace(/\s+/g, '-');
      const safeLabel = label.toLowerCase().replace(/\s+/g, '-');
      const redirectUrl = `${window.location.origin}/r/${uniqueCode}`;
      await downloadUltraHdPng(redirectUrl, `${bizName}-${safeLabel}-3000x3000-hd.png`);
    } catch (e) {
      console.error('Failed to download HD PNG:', e);
    } finally {
      setDownloadingCode(null);
    }
  };

  const handleDownloadClientSvg = async (uniqueCode: string, label: string) => {
    try {
      setDownloadingCode(`svg_${uniqueCode}`);
      const bizName = (detail?.business?.businessName || 'client').toLowerCase().replace(/\s+/g, '-');
      const safeLabel = label.toLowerCase().replace(/\s+/g, '-');
      const redirectUrl = `${window.location.origin}/r/${uniqueCode}`;
      await downloadVectorSvg(redirectUrl, `${bizName}-${safeLabel}-vector.svg`);
    } catch (e) {
      console.error('Failed to download SVG:', e);
    } finally {
      setDownloadingCode(null);
    }
  };

  useEffect(() => {
    if (clientId) {
      loadDetail(clientId);
    }
  }, [clientId]);

  const loadDetail = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await freshTestApi.getAdminClientDetail(id);
      setDetail(res);
      if (res?.ai?.planLimit) setNewAiLimit(res.ai.planLimit);
      if (res?.qr?.codes?.length) setNewQrLimit(Math.max(5, res.qr.codes.length));
    } catch (err: any) {
      setError(err.message || 'Failed to load client profile details.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLimits = async () => {
    if (!clientId) return;
    try {
      setLimitLoading(true);
      await freshTestApi.updateClientLimits(clientId, {
        maxAiMonthly: Number(newAiLimit),
        maxQrCodes: Number(newQrLimit)
      });
      setLimitModalOpen(false);
      await loadDetail(clientId);
    } catch (err: any) {
      alert(err.message || 'Failed to update plan limits.');
    } finally {
      setLimitLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!clientId) return;
    try {
      setStatusLoading(true);
      if (targetStatus === 'suspended') {
        await freshTestApi.suspendClient(clientId);
      } else {
        await freshTestApi.reactivateClient(clientId);
      }
      setStatusModalOpen(false);
      await loadDetail(clientId);
    } catch (err: any) {
      alert(err.message || 'Failed to update status.');
    } finally {
      setStatusLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
        <p className="text-xs text-slate-500">Loading comprehensive client profile...</p>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="p-8 text-center space-y-4 text-rose-600">
        <AlertCircle className="w-10 h-10 mx-auto text-rose-500" />
        <p className="text-sm font-semibold">{error || 'Client not found.'}</p>
        <Link
          to="/super-admin/clients"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-200"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Clients Table</span>
        </Link>
      </div>
    );
  }

  const { account, business, google, qr, ai, subscription, auditLogs } = detail;

  return (
    <div className="space-y-6">
      {/* Back button & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            to="/super-admin/clients"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{account.displayName}</h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  account.status === 'active'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {account.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{account.email} • UID: {account.uid}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setLimitModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Sliders className="w-3.5 h-3.5 text-blue-600" />
            <span>Edit Limits</span>
          </button>

          {account.status === 'active' ? (
            <button
              type="button"
              onClick={() => {
                setTargetStatus('suspended');
                setStatusModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-semibold text-rose-600 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Suspend Account</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setTargetStatus('active');
                setStatusModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold text-emerald-600 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Reactivate Account</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Account & Business & Google */}
        <div className="lg:col-span-2 space-y-6">
          {/* Business Profile */}
          <section className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>Business Profile</span>
            </h2>

            {business ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  {business.logoUrl ? (
                    <img
                      src={business.logoUrl}
                      alt={business.businessName}
                      className="w-14 h-14 rounded-2xl object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl border border-blue-200">
                      {business.businessName?.charAt(0) || 'B'}
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{business.businessName}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span className="capitalize">{business.category?.replace('_', ' ')}</span>
                      <span>•</span>
                      <span>{business.city}, {business.state}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Onboarding</span>
                    <span className="text-slate-900 font-semibold mt-0.5 block">
                      {business.onboardingCompleted ? 'Completed (100%)' : `Step ${business.onboardingStep}/6`}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Default Language</span>
                    <span className="text-slate-900 font-semibold mt-0.5 block">{business.preferredLanguage || 'English'}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Tone Style</span>
                    <span className="text-slate-900 font-semibold mt-0.5 block capitalize">{business.tonePreference || 'Natural'}</span>
                  </div>
                </div>

                {business.description && (
                  <div className="text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 leading-relaxed">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Description</span>
                    {business.description}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No business profile configured yet.</p>
            )}
          </section>

          {/* Google Review Destination */}
          <section className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-emerald-600" />
                <span>Google Review Destination</span>
              </h2>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  google.verified
                    ? 'bg-teal-50 border border-teal-200 text-teal-700'
                    : google.googleReviewUrl
                    ? 'bg-blue-50 border border-blue-200 text-blue-700'
                    : 'bg-rose-50 border border-rose-200 text-rose-700'
                }`}
              >
                {google.status}
              </span>
            </div>

            {google.googleReviewUrl ? (
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                  <div className="font-mono text-xs text-slate-800 truncate flex-1">
                    {google.googleReviewUrl}
                  </div>
                  <a
                    href={google.googleReviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 transition-colors"
                  >
                    <span>Test Review Link</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="text-[11px] text-slate-500 flex items-center gap-4">
                  {google.verifiedAt && (
                    <span>Last verified: {new Date(google.verifiedAt).toLocaleString()}</span>
                  )}
                  <span>Format: HTTPS Google Destination</span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
                Direct Google Review link has not been provided by this client yet.
              </div>
            )}
          </section>

          {/* QR Stands Performance */}
          <section className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <QrCode className="w-4 h-4 text-blue-600" />
                <span>QR Stands ({qr.codes.length})</span>
              </h2>
              <span className="text-xs text-slate-500 font-semibold">{qr.totalScans} total scans</span>
            </div>

            {/* Architecture Banner */}
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Permanent Dynamic QR • Zero Expiry</span>
              </div>
              <p className="text-[11px] text-emerald-700 leading-relaxed">
                Encoded URL is permanent (<span className="font-mono font-semibold">/r/[code]</span>). If the client ever changes their Google Review URL, all physical stands and NFC cards continue to route seamlessly without reprinting.
              </p>
            </div>

            {qr.codes.length > 0 ? (
              <div className="space-y-2.5">
                {qr.codes.map((q: any) => (
                  <div
                    key={q.id}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="font-semibold text-slate-900 flex items-center gap-2">
                        <span>{q.label}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                            q.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {q.status}
                        </span>
                      </div>
                      <div className="font-mono text-[11px] text-slate-400">
                        Code: {q.uniqueCode} • {q.scanCount || 0} scans • Route: /r/{q.uniqueCode}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                      <button
                        onClick={() => handleDownloadClientPng(q.uniqueCode, q.label)}
                        disabled={downloadingCode === `png_${q.uniqueCode}`}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
                        title="Download 3000x3000px Ultra HD PNG for NFC Card / Acrylic Stand"
                      >
                        <Download className="w-3 h-3 text-blue-400" />
                        <span>{downloadingCode === `png_${q.uniqueCode}` ? 'Rendering...' : '3K PNG'}</span>
                      </button>

                      <button
                        onClick={() => handleDownloadClientSvg(q.uniqueCode, q.label)}
                        disabled={downloadingCode === `svg_${q.uniqueCode}`}
                        className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
                        title="Download lossless vector SVG"
                      >
                        <Download className="w-3 h-3 text-blue-200" />
                        <span>{downloadingCode === `svg_${q.uniqueCode}` ? 'Exporting...' : 'SVG'}</span>
                      </button>

                      <button
                        onClick={async () => {
                          await navigator.clipboard.writeText(`${window.location.origin}/r/${q.uniqueCode}`);
                          setCopiedCode(q.uniqueCode);
                          setTimeout(() => setCopiedCode(null), 2000);
                        }}
                        className="px-2 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-semibold inline-flex items-center gap-1 shadow-xs cursor-pointer"
                        title="Copy permanent redirect link"
                      >
                        {copiedCode === q.uniqueCode ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedCode === q.uniqueCode ? 'Copied' : 'Copy'}</span>
                      </button>

                      <a
                        href={`/r/${q.uniqueCode}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-blue-600 text-[11px] font-semibold inline-flex items-center gap-1 shadow-xs"
                        title="Test redirect to ReviewFlow assistance page"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Test</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No QR codes generated yet.</p>
            )}
          </section>
        </div>

        {/* Right Column: AI Usage, Subscription & Audit Trail */}
        <div className="space-y-6">
          {/* AI Usage & Limits */}
          <section className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>AI Usage & Quota</span>
            </h2>

            <div className="space-y-3">
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-3xl font-black text-slate-900">{ai.generationsUsed}</span>
                  <span className="text-xs text-slate-400 ml-1.5">/ {ai.planLimit} monthly drafts</span>
                </div>
                <span className="text-xs font-bold text-blue-600 font-mono">{ai.usagePercentage}%</span>
              </div>

              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, ai.usagePercentage)}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] text-slate-600">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-slate-400">Failed Generations</span>
                  <span className="font-bold text-slate-900 block mt-0.5">{ai.failedGenerations}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-slate-400">Available Remaining</span>
                  <span className="font-bold text-emerald-600 block mt-0.5">
                    {Math.max(0, ai.planLimit - ai.generationsUsed)}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Subscription */}
          <section className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-blue-600" />
              <span>Subscription Details</span>
            </h2>

            {subscription ? (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Current Plan</span>
                  <span className="font-bold text-slate-900">{subscription.planName}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Subscription Status</span>
                  <span className="font-bold text-blue-700 uppercase text-[10px]">{subscription.status}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Monthly Rate</span>
                  <span className="font-bold text-slate-900">${subscription.priceMonthly} / mo</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Renewal Date</span>
                  <span className="text-slate-800">
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No subscription found.</p>
            )}
          </section>

          {/* Client Audit History */}
          <section className="bg-white border border-slate-200 rounded-3xl p-6 space-y-3 shadow-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" />
              <span>Client Audit History</span>
            </h2>

            {auditLogs && auditLogs.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {auditLogs.map((log: any) => (
                  <div key={log.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-blue-700">{log.action}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(log.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-slate-600 leading-snug">{log.details}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No audit records for this client.</p>
            )}
          </section>
        </div>
      </div>

      {/* Edit Limits Modal */}
      {limitModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="font-bold text-slate-900 text-base">Adjust Client Plan Limits</h3>
            <p className="text-xs text-slate-500">Configure customized quotas for this tenant.</p>

            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Max AI Drafts / Month</label>
                <input
                  type="number"
                  value={newAiLimit}
                  onChange={e => setNewAiLimit(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-blue-600 outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Max Active QR Stands</label>
                <input
                  type="number"
                  value={newQrLimit}
                  onChange={e => setNewQrLimit(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-blue-600 outline-hidden"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setLimitModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={limitLoading}
                onClick={handleUpdateLimits}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
              >
                {limitLoading ? 'Saving...' : 'Save Quotas'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Modal */}
      {statusModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="font-bold text-slate-900 text-base">
              {targetStatus === 'suspended' ? 'Suspend Client Account' : 'Reactivate Client Account'}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to change this client status to{' '}
              <strong className="text-slate-900 uppercase">{targetStatus}</strong>?
            </p>

            <div className="flex items-center justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setStatusModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={statusLoading}
                onClick={handleUpdateStatus}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white cursor-pointer ${
                  targetStatus === 'suspended' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {statusLoading ? 'Updating...' : `Confirm ${targetStatus}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
