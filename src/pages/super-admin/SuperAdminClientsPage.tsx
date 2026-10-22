import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  Eye,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Building2,
  CheckCircle2,
  XCircle,
  Sparkles,
  QrCode
} from 'lucide-react';
import { freshTestApi, PaginatedClientsResult } from '../../lib/fresh-test-api.ts';

export const SuperAdminClientsPage: React.FC = () => {
  const [data, setData] = useState<PaginatedClientsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination State (Section 9)
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'suspended' | 'trial' | 'paid' | 'incomplete' | 'url_missing' | 'high_usage'>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Suspend/Reactivate Modal
  const [actionModal, setActionModal] = useState<{ client: any; action: 'suspend' | 'reactivate' } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadClients();
  }, [search, filter, page, pageSize]);

  const loadClients = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await freshTestApi.getAdminClients({
        search: search.trim(),
        filter,
        page,
        pageSize
      });
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load client accounts.');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!actionModal) return;
    try {
      setActionLoading(true);
      if (actionModal.action === 'suspend') {
        await freshTestApi.suspendClient(actionModal.client.uid);
      } else {
        await freshTestApi.reactivateClient(actionModal.client.uid);
      }
      setActionModal(null);
      await loadClients();
    } catch (err: any) {
      alert(err.message || 'Failed to update client status');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            <span>Client Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Search, filter, inspect, and manage tenant accounts with cursor pagination and strict authorization.
          </p>
        </div>
        <button
          onClick={loadClients}
          className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-2 transition-colors cursor-pointer self-start sm:self-auto shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Search and Filters Bar (Section 9) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4 shadow-xs">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by client name, email, or business name..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 outline-hidden"
            />
          </div>

          {/* Page size dropdown */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <span className="text-xs text-slate-500">Rows:</span>
            <select
              value={pageSize}
              onChange={e => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:bg-white focus:border-blue-600 outline-hidden cursor-pointer"
            >
              <option value={5}>5 / page</option>
              <option value={10}>10 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
            </select>
          </div>
        </div>

        {/* Filters Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'all', label: 'All Accounts' },
            { id: 'active', label: 'Active' },
            { id: 'suspended', label: 'Suspended' },
            { id: 'trial', label: 'Trial' },
            { id: 'paid', label: 'Paid' },
            { id: 'incomplete', label: 'Incomplete Onboarding' },
            { id: 'url_missing', label: 'URL Missing' },
            { id: 'high_usage', label: 'High Usage (≥70%)' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => {
                setFilter(t.id as any);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                filter === t.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
            <p className="text-xs text-slate-500">Loading clients...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-3 text-rose-600">
            <AlertCircle className="w-8 h-8 mx-auto text-rose-500" />
            <p className="text-xs">{error}</p>
          </div>
        ) : !data || data.clients.length === 0 ? (
          <div className="py-20 text-center space-y-2 text-slate-400">
            <Users className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">No client records found</p>
            <p className="text-xs text-slate-500">Try adjusting your search criteria or filter tabs.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Client / Email</th>
                  <th className="py-3.5 px-4">Business</th>
                  <th className="py-3.5 px-4">Plan / Status</th>
                  <th className="py-3.5 px-4">Onboarding</th>
                  <th className="py-3.5 px-4">QR / Scans</th>
                  <th className="py-3.5 px-4">AI Usage</th>
                  <th className="py-3.5 px-4">Google URL</th>
                  <th className="py-3.5 px-4">Last Activity</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {data.clients.map(client => (
                  <tr key={client.uid} className="hover:bg-slate-50/70 transition-colors">
                    {/* Client & Email */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 truncate max-w-[140px]">
                        {client.clientName}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono truncate max-w-[140px]">
                        {client.email}
                      </div>
                    </td>

                    {/* Business Name & Category */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 truncate max-w-[150px]">
                        {client.businessName}
                      </div>
                      <div className="text-[10px] text-slate-500 capitalize">
                        {client.category.replace('_', ' ')}
                      </div>
                    </td>

                    {/* Plan & Account Status */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-blue-700 truncate">{client.planName}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            client.accountStatus === 'active' ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        />
                        <span className="text-[10px] uppercase font-bold text-slate-500">
                          {client.accountStatus}
                        </span>
                      </div>
                    </td>

                    {/* Onboarding Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          client.onboardingCompleted
                            ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                            : 'bg-amber-50 border border-amber-200 text-amber-700'
                        }`}
                      >
                        {client.onboardingStatus}
                      </span>
                    </td>

                    {/* QR Count & Total Scans */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">
                        {client.activeQrCount} active / {client.qrCount} total
                      </div>
                      <div className="text-[10px] text-emerald-600 font-semibold">
                        {client.totalScans} scans
                      </div>
                    </td>

                    {/* AI Usage */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">
                        {client.aiUsage} / {client.maxAiMonthly}
                      </div>
                      <div className="w-20 bg-slate-200 h-1.5 rounded-full mt-1 overflow-hidden">
                        <div
                          className="bg-blue-600 h-full rounded-full"
                          style={{
                            width: `${Math.min(100, (client.aiUsage / client.maxAiMonthly) * 100)}%`
                          }}
                        />
                      </div>
                    </td>

                    {/* Google Review URL Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          client.googleReviewUrlStatus === 'Verified'
                            ? 'bg-teal-50 border border-teal-200 text-teal-700'
                            : client.googleReviewUrlStatus === 'Configured'
                            ? 'bg-blue-50 border border-blue-200 text-blue-700'
                            : 'bg-rose-50 border border-rose-200 text-rose-700'
                        }`}
                      >
                        {client.googleReviewUrlStatus}
                      </span>
                    </td>

                    {/* Last Activity */}
                    <td className="py-3.5 px-4 text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(client.lastActivity).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/super-admin/clients/${client.uid}`}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                          title="View Full Client Inspection"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>

                        {client.accountStatus === 'active' ? (
                          <button
                            type="button"
                            onClick={() => setActionModal({ client, action: 'suspend' })}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 transition-colors cursor-pointer"
                            title="Suspend Client"
                          >
                            <ShieldAlert className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setActionModal({ client, action: 'reactivate' })}
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-600 transition-colors cursor-pointer"
                            title="Reactivate Client"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
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

        {/* Pagination Footer */}
        {data && (
          <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing {data.clients.length > 0 ? (data.pagination.page - 1) * data.pagination.pageSize + 1 : 0} to{' '}
              {Math.min(data.pagination.page * data.pagination.pageSize, data.pagination.total)} of{' '}
              <span className="font-bold text-slate-900">{data.pagination.total}</span> clients
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={!data.pagination.hasPrev}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>
              <span className="font-mono text-xs px-2 text-slate-600">
                Page {data.pagination.page} of {data.pagination.totalPages}
              </span>
              <button
                disabled={!data.pagination.hasNext}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Suspend/Reactivate */}
      {actionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  actionModal.action === 'suspend'
                    ? 'bg-rose-50 text-rose-600 border border-rose-200'
                    : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                }`}
              >
                {actionModal.action === 'suspend' ? (
                  <ShieldAlert className="w-5 h-5" />
                ) : (
                  <ShieldCheck className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {actionModal.action === 'suspend' ? 'Suspend Client Account' : 'Reactivate Client Account'}
                </h3>
                <p className="text-xs text-slate-500">{actionModal.client.clientName} ({actionModal.client.email})</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {actionModal.action === 'suspend'
                ? 'Suspending this client will immediately block their dashboard access and pause public review redirects. Their historical data and scan records remain preserved.'
                : 'Reactivating this client will restore their full dashboard capabilities and re-enable their active QR review stands.'}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setActionModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleAction}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-colors cursor-pointer ${
                  actionModal.action === 'suspend'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {actionLoading ? 'Updating...' : `Confirm ${actionModal.action === 'suspend' ? 'Suspension' : 'Reactivation'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
