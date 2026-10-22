import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  ShieldCheck,
  Building2,
  Users,
  Sliders,
  Activity,
  Search,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  QrCode,
  Sparkles,
  Server,
  Layers,
  Check,
  CreditCard,
  Eye,
  X,
  FileText
} from 'lucide-react';
import { freshTestApi, PlanDefinition } from '../../lib/fresh-test-api.ts';
import { useAuth } from '../../lib/auth-context.tsx';

export const SuperAdminPage: React.FC = () => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'businesses' | 'plans' | 'users' | 'settings'>('overview');
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  // Overview Data
  const [overview, setOverview] = useState<any>(null);

  // Businesses Data
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [businessSearch, setBusinessSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');

  // Client Detail Modal
  const [selectedClientDetail, setSelectedClientDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Plans Data
  const [plans, setPlans] = useState<PlanDefinition[]>([]);

  // Users Data
  const [usersList, setUsersList] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');

  // Settings & Logs
  const [settings, setSettings] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Action status
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      setAccessDenied(false);

      const [ov, biz, usrs, st, pl] = await Promise.all([
        freshTestApi.getAdminOverview(),
        freshTestApi.getAdminBusinesses(),
        freshTestApi.getAdminUsers(),
        freshTestApi.getAdminSettings(),
        freshTestApi.getPlans().catch(() => [])
      ]);

      setOverview(ov);
      setBusinesses(biz);
      setUsersList(usrs);
      setSettings(st.settings);
      setAuditLogs(st.auditLogs);
      setPlans((pl as any)?.mainPlan ? [(pl as any).mainPlan] : []);
    } catch (err: any) {
      if (err.message?.includes('Access Denied') || err.message?.includes('403')) {
        setAccessDenied(true);
      } else {
        console.error('Super Admin fetch error:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenClientDetail = async (id: string) => {
    try {
      setLoadingDetail(true);
      const detail = await freshTestApi.getAdminBusinessDetail(id);
      setSelectedClientDetail(detail);
    } catch (err: any) {
      alert(err.message || 'Failed to load client details');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleToggleBusinessStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    if (!confirm(`Are you sure you want to change this business status to ${nextStatus.toUpperCase()}?`)) {
      return;
    }

    try {
      setActionLoading(true);
      await freshTestApi.updateBusinessStatus(id, nextStatus as any);
      await loadAdminData();
      if (selectedClientDetail && selectedClientDetail.business.id === id) {
        selectedClientDetail.business.status = nextStatus;
        setSelectedClientDetail({ ...selectedClientDetail });
      }
    } catch (err: any) {
      alert(err.message || 'Status update failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdatePlan = async (id: string, planId: string) => {
    try {
      setActionLoading(true);
      await freshTestApi.updateClientPlan(id, planId);
      await loadAdminData();
      if (selectedClientDetail && selectedClientDetail.business.id === id) {
        selectedClientDetail.subscription.planId = planId;
        setSelectedClientDetail({ ...selectedClientDetail });
      }
      alert('Client plan successfully updated!');
    } catch (err: any) {
      alert(err.message || 'Plan update failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleUserStatus = async (uid: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    if (!confirm(`Are you sure you want to change user status to ${nextStatus.toUpperCase()}?`)) {
      return;
    }

    try {
      setActionLoading(true);
      await freshTestApi.updateUserStatus(uid, nextStatus as any);
      await loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Status update failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-600">Verifying Super Admin clearance...</p>
        </div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-xs space-y-4">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Access Denied: Super Admin Only</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            This module is strictly isolated and restricted to authorized platform administrators.
          </p>
          <div className="pt-2">
            <Link
              to="/app"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors"
            >
              <span>Return to Client Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const filteredBusinesses = businesses.filter(b => {
    const matchesSearch =
      (b.businessName || '').toLowerCase().includes(businessSearch.toLowerCase()) ||
      (b.ownerEmail || '').toLowerCase().includes(businessSearch.toLowerCase()) ||
      (b.category || '').toLowerCase().includes(businessSearch.toLowerCase());
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredUsers = usersList.filter(u =>
    (u.email || '').toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.displayName || '').toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Bar */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-30 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-slate-900 tracking-tight">ReviewFlow Super Admin</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 uppercase tracking-wider">
                Production-Enforced
              </span>
            </div>
            <p className="text-xs text-slate-500">Multi-tenant management & platform telemetry console</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadAdminData}
            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
            title="Refresh All Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            to="/app"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition-colors"
          >
            <span>Exit to Shop Dashboard</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Admin Navigation Tabs */}
      <div className="bg-white border-b border-slate-200 px-6">
        <div className="max-w-6xl mx-auto flex items-center gap-6 overflow-x-auto text-xs font-semibold">
          {[
            { id: 'overview', label: 'Global Overview', icon: Activity },
            { id: 'businesses', label: `Client Businesses (${businesses.length})`, icon: Building2 },
            { id: 'plans', label: 'Subscriptions & Plans', icon: CreditCard },
            { id: 'users', label: `User Accounts (${usersList.length})`, icon: Users },
            { id: 'settings', label: 'System Administration', icon: Sliders }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3.5 flex items-center gap-2 border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
                  active
                    ? 'border-purple-600 text-purple-700'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-purple-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tab Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full p-6 space-y-6">
        {/* OVERVIEW TAB (Section 8.A) */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-xs space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Registered Clients
                </span>
                <div className="text-2xl font-bold text-slate-900">{overview?.totalUsers ?? 0}</div>
                <span className="text-[10px] text-slate-500">Live Firebase accounts</span>
              </div>

              <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-xs space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Businesses
                </span>
                <div className="text-2xl font-bold text-slate-900">{overview?.totalBusinesses ?? 0}</div>
                <span className="text-[10px] text-slate-500">Active setups in India</span>
              </div>

              <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-xs space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Active QR Stands
                </span>
                <div className="text-2xl font-bold text-emerald-600">{overview?.totalActiveQrs ?? 0}</div>
                <span className="text-[10px] text-slate-500">Physical deployment points</span>
              </div>

              <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-xs space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Scans Recorded
                </span>
                <div className="text-2xl font-bold text-purple-600">{overview?.totalScans ?? 0}</div>
                <span className="text-[10px] text-slate-500">Verified QR redirects</span>
              </div>
            </div>

            {/* Event Separation Metrics Bar */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-purple-600" />
                  <span>Platform-Wide Funnel Metrics</span>
                </span>
                <span className="text-[11px] text-slate-400">
                  * Honest separation of draft generation vs google clicks
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">Total Scans</span>
                  <span className="text-xl font-bold text-slate-900">{overview?.totalScans ?? 0}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">AI Drafts Generated</span>
                  <span className="text-xl font-bold text-blue-600">
                    {businesses.reduce((acc, b) => acc + (b.aiGenerations || 0), 0)}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">Active Subscriptions</span>
                  <span className="text-xl font-bold text-emerald-600">{overview?.activeSubscriptions ?? 0}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">AI Provider Status</span>
                  <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 mt-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Gemini + Linguistic Fallback</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Recent System Activity */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
                Platform Administrative Audit Trail
              </h3>

              {overview?.recentActivity && overview.recentActivity.length > 0 ? (
                <div className="divide-y divide-slate-100 text-xs">
                  {overview.recentActivity.map((log: any) => (
                    <div key={log.id} className="py-2.5 flex items-center justify-between gap-4">
                      <div>
                        <span className="font-semibold text-slate-800">{log.action}</span>
                        <p className="text-[11px] text-slate-500 mt-0.5">{log.details}</p>
                      </div>
                      <span className="text-[11px] text-slate-400 shrink-0">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-4">No recent activity recorded.</p>
              )}
            </div>
          </div>
        )}

        {/* CLIENT MANAGEMENT TAB (Section 8.B) */}
        {activeTab === 'businesses' && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
                  Client Establishments & Shops
                </h3>
                <p className="text-xs text-slate-500">
                  Inspect client trade categories, manage status, update plans, and audit usage.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as any)}
                  className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active Only</option>
                  <option value="suspended">Suspended Only</option>
                </select>

                <div className="relative w-full sm:w-56">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={businessSearch}
                    onChange={e => setBusinessSearch(e.target.value)}
                    placeholder="Search shops..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Business / Category</th>
                    <th className="py-3 px-4 font-semibold">Owner Email</th>
                    <th className="py-3 px-4 font-semibold">Plan</th>
                    <th className="py-3 px-4 font-semibold">QR Stands</th>
                    <th className="py-3 px-4 font-semibold">Scans</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBusinesses.map(b => (
                    <tr key={b.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{b.businessName}</div>
                        <span className="text-[10px] text-slate-400 capitalize">
                          {b.category ? b.category.replace('_', ' ') : 'General'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">{b.ownerEmail}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-semibold rounded-md uppercase text-[10px]">
                          {b.planId || 'free_trial'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-semibold">{b.qrCount} stands</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{b.totalScans}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            b.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {b.status === 'active' ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <XCircle className="w-3 h-3" />
                          )}
                          <span>{b.status}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenClientDetail(b.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Details</span>
                          </button>
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => handleToggleBusinessStatus(b.id, b.status)}
                            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                              b.status === 'active'
                                ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                          >
                            {b.status === 'active' ? 'Suspend' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SUBSCRIPTION & PLAN MANAGEMENT (Section 8.D) */}
        {activeTab === 'plans' && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs space-y-6 p-6">
            <div>
              <h3 className="font-bold text-base text-slate-900">Subscription Tier Configurations</h3>
              <p className="text-xs text-slate-500">
                Configure limits, QR allowance, and monthly AI generation quotas for all subscription levels in India.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plans.map(p => (
                <div key={p.id} className="p-5 border border-slate-200 rounded-2xl bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{p.name}</span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-semibold">
                      ₹{p.priceMonthly}/mo
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{p.description}</p>
                  <div className="pt-2 border-t border-slate-200 text-xs space-y-1">
                    <div className="flex justify-between text-slate-700">
                      <span>Max QR Stands:</span>
                      <span className="font-bold text-slate-900">{p.maxQrCodes}</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>Max AI Drafts / mo:</span>
                      <span className="font-bold text-slate-900">{p.maxAiMonthly.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
                  Platform User Accounts
                </h3>
                <p className="text-xs text-slate-500">Client authentication credentials and role assignments.</p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  placeholder="Search users..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Display Name</th>
                    <th className="py-2.5 px-4 font-semibold">Email</th>
                    <th className="py-2.5 px-4 font-semibold">Role</th>
                    <th className="py-2.5 px-4 font-semibold">Status</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map(u => (
                    <tr key={u.uid} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-semibold text-slate-900">{u.displayName || 'User'}</td>
                      <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">{u.email}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          u.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          u.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {u.role !== 'SUPER_ADMIN' && (
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => handleToggleUserStatus(u.uid, u.status)}
                            className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer ${
                              u.status === 'active'
                                ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                          >
                            {u.status === 'active' ? 'Suspend' : 'Activate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SETTINGS TAB (Section 8.E) */}
        {activeTab === 'settings' && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs space-y-6 p-6">
            <div>
              <h3 className="font-bold text-base text-slate-900">System Administration & Health</h3>
              <p className="text-xs text-slate-500">Security configurations, AI provider logs, and maintenance controls.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Backend Status</span>
                <span className="font-bold text-emerald-600 text-sm flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Healthy & Online
                </span>
                <span className="text-[11px] text-slate-500">Isolated Firebase Schema</span>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">AI Review Engine</span>
                <span className="font-bold text-blue-600 text-sm">Gemini 2.5 Flash</span>
                <span className="text-[11px] text-slate-500">Fallback Linguistic Synthesis Ready</span>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">IP Rate Limiter</span>
                <span className="font-bold text-slate-900 text-sm">15 Drafts / Min</span>
                <span className="text-[11px] text-slate-500">Anti-Spam & DoS Protection</span>
              </div>
            </div>

            {/* Audit Logs */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">Recent Audit Logs</h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
                {auditLogs.slice(0, 10).map(l => (
                  <div key={l.id} className="p-3 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900">{l.action}</span>
                      <span className="text-slate-500 ml-2">by {l.actorEmail}</span>
                      <p className="text-[11px] text-slate-400 mt-0.5">{l.details}</p>
                    </div>
                    <span className="text-[10px] text-slate-400">{new Date(l.createdAt).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* INDIVIDUAL CLIENT DETAIL MODAL (Section 8.C) */}
      {selectedClientDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Client Details</span>
                <h3 className="font-bold text-lg text-slate-900">{selectedClientDetail.business.businessName}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedClientDetail(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Business Profile */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">Business Profile</h4>
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 block">Category:</span>
                  <span className="font-semibold text-slate-900 capitalize">
                    {selectedClientDetail.business.category?.replace('_', ' ') || 'General'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Location:</span>
                  <span className="font-semibold text-slate-900">
                    {selectedClientDetail.business.location || `${selectedClientDetail.business.city}, ${selectedClientDetail.business.state}`}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Google Review URL:</span>
                  <a
                    href={selectedClientDetail.business.googleReviewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 font-mono text-[11px] truncate block hover:underline"
                  >
                    {selectedClientDetail.business.googleReviewUrl}
                  </a>
                </div>
                <div>
                  <span className="text-slate-500 block">Tone Preference:</span>
                  <span className="font-semibold text-slate-900 capitalize">
                    {selectedClientDetail.business.tonePreference || 'Warm'}
                  </span>
                </div>
              </div>
            </div>

            {/* Plan Switcher */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">Change Subscription Plan</h4>
              <div className="flex items-center gap-3">
                <select
                  defaultValue={selectedClientDetail.subscription.planId}
                  onChange={e => handleUpdatePlan(selectedClientDetail.business.id, e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                >
                  {plans.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Max {p.maxQrCodes} QRs, ₹{p.priceMonthly}/mo)
                    </option>
                  ))}
                </select>
                <span className="text-xs text-slate-500">Plan limit enforces QR stand generation</span>
              </div>
            </div>

            {/* Usage Summary */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">Usage & Event Funnel</h4>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Total Scans</span>
                  <span className="text-lg font-bold text-slate-900">{selectedClientDetail.analytics.totalScans}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">AI Drafts</span>
                  <span className="text-lg font-bold text-blue-600">
                    {selectedClientDetail.analytics.eventsBreakdown?.aiDraftsGenerated || 0}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Google Clicks</span>
                  <span className="text-lg font-bold text-purple-600">
                    {selectedClientDetail.analytics.eventsBreakdown?.googleReviewClicks || 0}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedClientDetail(null)}
                className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
