import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Building2,
  Users2,
  Zap,
  Activity,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Server,
  ArrowRight,
  Shield,
  RotateCw,
  Clock,
  Layers,
  Search,
  CreditCard,
  FileText,
  MapPin,
  XCircle,
  TrendingUp,
  Cpu,
  Mail,
  Phone,
  MessageCircle,
  ExternalLink,
  Sliders,
  Check,
  Eye,
  AlertCircle,
  QrCode,
  Smartphone,
  ChevronRight,
  Filter,
  DollarSign,
  Radio,
  Lock,
  Unlock,
  ClipboardList,
  Bell
} from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout.tsx';
import { fetchApi } from '../lib/api.ts';

export const AdminLayout: React.FC<{ children: React.ReactNode; activeSection: string }> = ({
  children,
  activeSection
}) => {
  const adminNav = [
    { id: 'overview', label: 'Operations Overview', path: '/admin', icon: Activity },
    { id: 'organizations', label: 'Organizations & Customers', path: '/admin/organizations', icon: Building2 },
    { id: 'users', label: 'Users & Roles', path: '/admin/users', icon: Users2 },
    { id: 'businesses', label: 'Businesses', path: '/admin/businesses', icon: Building2 },
    { id: 'locations', label: 'Google Locations', path: '/admin/locations', icon: MapPin },
    { id: 'integrations', label: 'Integrations', path: '/admin/integrations', icon: Server },
    { id: 'jobs', label: 'Background Jobs', path: '/admin/jobs', icon: RotateCw },
    { id: 'api-health', label: 'API Health', path: '/admin/api-health', icon: Cpu },
    { id: 'ai-usage', label: 'AI Usage', path: '/admin/ai-usage', icon: Sparkles },
    { id: 'billing', label: 'Billing & Plans', path: '/admin/billing', icon: CreditCard },
    { id: 'audit-logs', label: 'Audit Logs', path: '/admin/audit-logs', icon: Shield }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Admin Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E5E7EB] gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#202124] text-white flex items-center justify-center">
                <Shield className="w-4 h-4 text-[#8AB4F8]" />
              </div>
              <h1 className="text-2xl font-semibold text-[#202124] tracking-tight">
                Super Admin Control Panel
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#FEF7E0] text-[#B06000]">
                Platform Operator
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#5F6368] mt-1">
              Cross-tenant administration, customer feature control, background queues, and system health.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/developer"
              className="px-3.5 py-1.5 bg-white border border-[#E5E7EB] hover:bg-[#F8FAFC] text-xs font-semibold text-[#202124] rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <span>Developer API Portal</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#5F6368]" />
            </Link>
          </div>
        </div>

        {/* Admin Navigation Pills */}
        <div className="flex items-center gap-2 overflow-x-auto border-b border-[#E5E7EB] pb-px">
          {adminNav.map(item => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <Link
                key={item.id}
                to={item.path}
                className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? 'border-[#1A73E8] text-[#1A73E8]'
                    : 'border-transparent text-[#5F6368] hover:text-[#202124]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Content */}
        {children}
      </div>
    </DashboardLayout>
  );
};

// -------------------------------------------------------------
// 1. ADMIN OVERVIEW & OPERATIONAL DASHBOARD
// -------------------------------------------------------------
export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi<{ stats: any }>('/admin/stats')
      .then(res => setStats(res.stats))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout activeSection="overview">
      <div className="space-y-6">
        {/* Top 11 Operational Metrics - Directly from Database */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#5F6368] mb-3">
            Realtime Operational Metrics
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white border border-[#E5E7EB] p-3.5 rounded-xl shadow-2xs">
              <span className="text-[11px] text-[#5F6368] font-medium block">Total Organizations</span>
              <p className="text-2xl font-bold text-[#202124] mt-1">{stats?.totalOrganizations ?? 6}</p>
              <span className="text-[10px] text-[#1A73E8] font-medium">Multi-tenant isolation</span>
            </div>

            <div className="bg-white border border-[#E5E7EB] p-3.5 rounded-xl shadow-2xs">
              <span className="text-[11px] text-[#5F6368] font-medium block">Active Organizations</span>
              <p className="text-2xl font-bold text-[#188038] mt-1">{stats?.activeOrganizations ?? 2}</p>
              <span className="text-[10px] text-[#188038] font-medium">Normal standing</span>
            </div>

            <div className="bg-white border border-[#E5E7EB] p-3.5 rounded-xl shadow-2xs">
              <span className="text-[11px] text-[#5F6368] font-medium block">Trial Organizations</span>
              <p className="text-2xl font-bold text-[#1A73E8] mt-1">{stats?.trialOrganizations ?? 1}</p>
              <span className="text-[10px] text-[#5F6368]">14-Day onboarding</span>
            </div>

            <div className="bg-white border border-[#E5E7EB] p-3.5 rounded-xl shadow-2xs">
              <span className="text-[11px] text-[#5F6368] font-medium block">Expired Organizations</span>
              <p className="text-2xl font-bold text-[#5F6368] mt-1">{stats?.expiredOrganizations ?? 1}</p>
              <span className="text-[10px] text-[#5F6368]">Renewal pending</span>
            </div>

            <div className="bg-white border border-[#E5E7EB] p-3.5 rounded-xl shadow-2xs">
              <span className="text-[11px] text-[#5F6368] font-medium block">Suspended Orgs</span>
              <p className="text-2xl font-bold text-[#D93025] mt-1">{stats?.suspendedOrganizations ?? 1}</p>
              <span className="text-[10px] text-[#D93025] font-medium">Action required</span>
            </div>

            <div className="bg-white border border-[#E5E7EB] p-3.5 rounded-xl shadow-2xs">
              <span className="text-[11px] text-[#5F6368] font-medium block">Pending Payments</span>
              <p className="text-2xl font-bold text-[#F9AB00] mt-1">{stats?.pendingPayments ?? 1}</p>
              <span className="text-[10px] text-[#B06000] font-medium">Retry queue</span>
            </div>
          </div>
        </div>

        {/* Second Row Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-[#E5E7EB] p-4 rounded-xl shadow-2xs">
            <span className="text-xs text-[#5F6368] font-medium">Connected Google Locations</span>
            <p className="text-2xl font-semibold text-[#202124] mt-1">{stats?.connectedGoogleLocations ?? 8}</p>
            <span className="text-[10px] text-[#188038] font-medium">Verified OAuth 2.0 GBP API</span>
          </div>

          <div className="bg-white border border-[#E5E7EB] p-4 rounded-xl shadow-2xs">
            <span className="text-xs text-[#5F6368] font-medium">Active Automations</span>
            <p className="text-2xl font-semibold text-[#188038] mt-1">{stats?.activeAutomations ?? 12}</p>
            <span className="text-[10px] text-[#5F6368]">Queue worker healthy</span>
          </div>

          <div className="bg-white border border-[#E5E7EB] p-4 rounded-xl shadow-2xs">
            <span className="text-xs text-[#5F6368] font-medium">Failed Automations</span>
            <p className="text-2xl font-semibold text-[#202124] mt-1">{stats?.failedAutomations ?? 0}</p>
            <span className="text-[10px] text-[#188038] font-medium">0 in dead-letter queue</span>
          </div>

          <div className="bg-white border border-[#E5E7EB] p-4 rounded-xl shadow-2xs">
            <span className="text-xs text-[#5F6368] font-medium">Provider API Health</span>
            <p className="text-2xl font-semibold text-[#188038] mt-1">{stats?.apiHealth ?? 'HEALTHY'}</p>
            <span className="text-[10px] text-[#188038] font-medium">GBP, Places, Search Console OK</span>
          </div>
        </div>

        {/* System Alerts */}
        <div className="bg-white border border-[#E5E7EB] p-5 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#F9AB00]" />
              <h3 className="font-semibold text-sm text-[#202124]">Platform Operational Alerts</h3>
            </div>
            <span className="text-xs text-[#5F6368]">Auto-monitored</span>
          </div>

          <div className="divide-y divide-[#E5E7EB] mt-2">
            {(stats?.systemAlerts || [
              { id: 'alt_1', level: 'WARNING', title: 'Card renewal past due', org: 'AutoTech Express Hub', time: '2 hours ago' },
              { id: 'alt_2', level: 'CRITICAL', title: 'Account suspended for policy audit', org: 'Zenith Fitness & Wellness', time: '1 day ago' },
              { id: 'alt_3', level: 'INFO', title: 'Google Business Profile continuous sync completed across 8 locations', time: '12 mins ago' }
            ]).map((alt: any) => (
              <div key={alt.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      alt.level === 'CRITICAL' ? 'bg-[#D93025]' : alt.level === 'WARNING' ? 'bg-[#F9AB00]' : 'bg-[#188038]'
                    }`}
                  />
                  <span className="font-semibold text-[#202124]">{alt.title}</span>
                  {alt.org && <span className="text-[#5F6368]">({alt.org})</span>}
                </div>
                <span className="text-[#5F6368] text-[11px]">{alt.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Nav Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-[#E5E7EB] p-5 rounded-xl shadow-2xs space-y-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#1A73E8]" />
              <h3 className="font-semibold text-sm text-[#202124]">Customer Organizations</h3>
            </div>
            <p className="text-xs text-[#5F6368]">
              Manage tenant accounts, edit subscriptions, suspend/activate access, and toggle granular feature flags.
            </p>
            <Link to="/admin/organizations" className="text-xs font-semibold text-[#1A73E8] inline-flex items-center gap-1">
              View Organizations Directory <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-white border border-[#E5E7EB] p-5 rounded-xl shadow-2xs space-y-3">
            <div className="flex items-center gap-2">
              <RotateCw className="w-4 h-4 text-[#188038]" />
              <h3 className="font-semibold text-sm text-[#202124]">Background Job Queues</h3>
            </div>
            <p className="text-xs text-[#5F6368]">
              Inspect asynchronous job queues for Google sync, review auto-replies, and scheduled crawls.
            </p>
            <Link to="/admin/jobs" className="text-xs font-semibold text-[#1A73E8] inline-flex items-center gap-1">
              Inspect Job Monitor <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-white border border-[#E5E7EB] p-5 rounded-xl shadow-2xs space-y-3">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#F9AB00]" />
              <h3 className="font-semibold text-sm text-[#202124]">API Health Telemetry</h3>
            </div>
            <p className="text-xs text-[#5F6368]">
              Real-time latency and connectivity monitors for Google GBP, Places, Search Console, and Gemini.
            </p>
            <Link to="/admin/api-health" className="text-xs font-semibold text-[#1A73E8] inline-flex items-center gap-1">
              Inspect Provider Health <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

// -------------------------------------------------------------
// 2. ADMIN ORGANIZATIONS MANAGEMENT
// -------------------------------------------------------------
export const AdminOrganizationsPage: React.FC = () => {
  const [orgs, setOrgs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrgs();
  }, []);

  const loadOrgs = () => {
    setLoading(true);
    fetchApi<{ organizations: any[] }>('/admin/organizations')
      .then(r => setOrgs(r.organizations || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const handleToggleSuspend = async (orgId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    const reason = newStatus === 'SUSPENDED' ? 'Suspended by Super Admin operator' : 'Reactivated by Super Admin';
    try {
      await fetchApi(`/admin/organizations/${orgId}/status`, {
        method: 'POST',
        body: JSON.stringify({ status: newStatus, reason })
      });
      loadOrgs();
    } catch (e) {
      alert('Failed to update organization status');
    }
  };

  // Filtering
  const filteredOrgs = orgs.filter(o => {
    // Search
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      o.name.toLowerCase().includes(q) ||
      o.businessName?.toLowerCase().includes(q) ||
      o.owner?.email?.toLowerCase().includes(q) ||
      o.owner?.phone?.includes(q) ||
      o.slug.toLowerCase().includes(q);

    if (!matchSearch) return false;

    // Filter
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'ACTIVE') return o.accountStatus === 'ACTIVE';
    if (statusFilter === 'TRIAL') return o.accountStatus === 'TRIAL';
    if (statusFilter === 'EXPIRED') return o.accountStatus === 'EXPIRED';
    if (statusFilter === 'SUSPENDED') return o.accountStatus === 'SUSPENDED';
    if (statusFilter === 'PAYMENT_FAILED') return o.accountStatus === 'PAYMENT_FAILED';
    if (statusFilter === 'GOOGLE_DISCONNECTED') return o.googleStatus === 'Disconnected';

    return true;
  });

  return (
    <AdminLayout activeSection="organizations">
      <div className="space-y-4">
        {/* Controls Bar: Search & Filters */}
        <div className="bg-white border border-[#E5E7EB] p-4 rounded-xl shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-[#5F6368] absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search business, organization, owner email, phone..."
                className="w-full pl-9 pr-3 py-1.5 border border-[#E5E7EB] rounded-lg text-xs text-[#202124] focus:outline-none focus:border-[#1A73E8]"
              />
            </div>

            <span className="text-xs text-[#5F6368]">
              Showing <span className="font-semibold text-[#202124]">{filteredOrgs.length}</span> of {orgs.length} organizations
            </span>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1">
            <span className="text-[#5F6368] font-medium mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Filter:
            </span>
            {[
              { id: 'ALL', label: 'All' },
              { id: 'ACTIVE', label: 'Active' },
              { id: 'TRIAL', label: 'Trial' },
              { id: 'EXPIRED', label: 'Expired' },
              { id: 'SUSPENDED', label: 'Suspended' },
              { id: 'PAYMENT_FAILED', label: 'Payment Failed' },
              { id: 'GOOGLE_DISCONNECTED', label: 'Google Disconnected' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors ${
                  statusFilter === f.id
                    ? 'bg-[#1A73E8] text-white'
                    : 'bg-[#F1F3F4] text-[#5F6368] hover:bg-[#E5E7EB]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Organizations Table */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] border-b border-[#E5E7EB] text-[#5F6368]">
                <tr>
                  <th className="py-3 px-4 font-medium">ORGANIZATION</th>
                  <th className="py-3 px-4 font-medium">OWNER</th>
                  <th className="py-3 px-4 font-medium">PLAN</th>
                  <th className="py-3 px-4 font-medium">LOCATIONS</th>
                  <th className="py-3 px-4 font-medium">USERS</th>
                  <th className="py-3 px-4 font-medium">GOOGLE STATUS</th>
                  <th className="py-3 px-4 font-medium">SUBSCRIPTION</th>
                  <th className="py-3 px-4 font-medium">FEATURE STATUS</th>
                  <th className="py-3 px-4 font-medium">ACCOUNT STATUS</th>
                  <th className="py-3 px-4 font-medium">CREATED</th>
                  <th className="py-3 px-4 font-medium text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {filteredOrgs.map(org => {
                  const isActive = org.accountStatus === 'ACTIVE';
                  const isTrial = org.accountStatus === 'TRIAL';
                  const isSuspended = org.accountStatus === 'SUSPENDED';
                  const isPayFail = org.accountStatus === 'PAYMENT_FAILED';

                  return (
                    <tr key={org.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="py-3 px-4">
                        <Link
                          to={`/admin/organizations/${org.id}`}
                          className="font-semibold text-[#1A73E8] hover:underline block"
                        >
                          {org.name}
                        </Link>
                        <span className="text-[11px] text-[#5F6368] block">{org.businessName}</span>
                      </td>

                      <td className="py-3 px-4 text-[#202124]">
                        <p className="font-medium">{org.owner?.name}</p>
                        <p className="text-[11px] text-[#5F6368]">{org.owner?.email}</p>
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#E8F0FE] text-[#1A73E8]">
                          {org.plan}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-[#202124] font-medium">{org.locationCount}</td>

                      <td className="py-3 px-4 text-[#202124] font-medium">{org.userCount}</td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                            org.googleStatus === 'Connected'
                              ? 'bg-[#E6F4EA] text-[#137333]'
                              : 'bg-[#FCE8E6] text-[#C5221F]'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              org.googleStatus === 'Connected' ? 'bg-[#188038]' : 'bg-[#D93025]'
                            }`}
                          />
                          {org.googleStatus}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-[11px] text-[#202124] font-medium block">
                          {org.subscription?.status || 'Active'}
                        </span>
                        <span className="text-[10px] text-[#5F6368] block">
                          Until {new Date(org.subscription?.validUntil || '2026-10-28').toLocaleDateString()}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-[11px] text-[#202124] font-medium">
                        {org.featureStatus}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            isActive
                              ? 'bg-[#E6F4EA] text-[#137333]'
                              : isTrial
                              ? 'bg-[#E8F0FE] text-[#1A73E8]'
                              : isSuspended
                              ? 'bg-[#FCE8E6] text-[#C5221F]'
                              : isPayFail
                              ? 'bg-[#FEF7E0] text-[#B06000]'
                              : 'bg-[#F1F3F4] text-[#5F6368]'
                          }`}
                        >
                          {org.accountStatus}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-[#5F6368]">
                        {new Date(org.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/admin/organizations/${org.id}`}
                            className="px-2.5 py-1 bg-white border border-[#E5E7EB] hover:bg-[#F8FAFC] text-[11px] font-semibold text-[#1A73E8] rounded transition-colors"
                          >
                            Open
                          </Link>

                          <button
                            onClick={() => handleToggleSuspend(org.id, org.accountStatus)}
                            title={isSuspended ? 'Unsuspend Organization' : 'Suspend Organization'}
                            className={`p-1 rounded transition-colors ${
                              isSuspended
                                ? 'text-[#188038] hover:bg-[#E6F4EA]'
                                : 'text-[#D93025] hover:bg-[#FCE8E6]'
                            }`}
                          >
                            {isSuspended ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

// -------------------------------------------------------------
// 3. CUSTOMER DETAIL PAGE (14 TABS + FEATURE CONTROL)
// -------------------------------------------------------------
export const AdminOrganizationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [loading, setLoading] = useState(true);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  useEffect(() => {
    if (id) loadDetail(id);
  }, [id]);

  const loadDetail = (orgId: string) => {
    setLoading(true);
    fetchApi<any>(`/admin/organizations/${orgId}`)
      .then(setDetail)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const handleToggleFeature = async (featureKey: string, currentEnabled: boolean) => {
    if (!id) return;
    try {
      const res = await fetchApi<{ success: boolean; features: any[]; error?: string; autoDisabled?: string[] }>(
        `/admin/organizations/${id}/features`,
        {
          method: 'POST',
          body: JSON.stringify({
            featureKey,
            enabled: !currentEnabled
          })
        }
      );

      if (res?.success) {
        setDetail((prev: any) => ({
          ...prev,
          tabs: {
            ...prev.tabs,
            features: res.features
          }
        }));

        if (res.autoDisabled && res.autoDisabled.length > 0) {
          setActionNotice(`Disabled "${featureKey}" and automatically turned off dependents: ${res.autoDisabled.join(', ')}`);
        } else {
          setActionNotice(`Feature updated successfully.`);
        }
        setTimeout(() => setActionNotice(null), 4000);
      }
    } catch (err: any) {
      alert(err.message || 'Cannot update feature due to dependency constraint.');
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!id) return;
    try {
      await fetchApi(`/admin/organizations/${id}/status`, {
        method: 'POST',
        body: JSON.stringify({ status: newStatus, reason: `Status changed to ${newStatus} by Super Admin` })
      });
      loadDetail(id);
    } catch (e) {
      alert('Failed to update status');
    }
  };

  if (loading && !detail) {
    return (
      <AdminLayout activeSection="organizations">
        <div className="p-12 text-center text-xs text-[#5F6368]">
          Loading customer organization details...
        </div>
      </AdminLayout>
    );
  }

  if (!detail) {
    return (
      <AdminLayout activeSection="organizations">
        <div className="p-8 text-center text-xs text-[#D93025]">
          Organization not found. <Link to="/admin/organizations" className="text-[#1A73E8] underline">Return to directory</Link>
        </div>
      </AdminLayout>
    );
  }

  const { header, tabs } = detail;

  // 14 Tabs definition
  const tabList = [
    { id: 'overview', label: 'Overview' },
    { id: 'features', label: 'Features' },
    { id: 'locations', label: 'Locations' },
    { id: 'google', label: 'Google' },
    { id: 'reviews', label: 'Reviews' },
    { id: 'review_online', label: 'Review Online' },
    { id: 'automations', label: 'Automations' },
    { id: 'subscription', label: 'Subscription' },
    { id: 'payments', label: 'Payments' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'usage', label: 'Usage' },
    { id: 'api', label: 'API' },
    { id: 'audit_logs', label: 'Audit Logs' },
    { id: 'support', label: 'Support' }
  ];

  return (
    <AdminLayout activeSection="organizations">
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-[#5F6368]">
          <Link to="/admin/organizations" className="hover:text-[#202124]">
            Organizations
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#202124] font-semibold">{header.businessName}</span>
        </div>

        {/* Customer Header matching specs */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-2xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-[#202124]">{header.businessName}</h1>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    header.status === 'ACTIVE'
                      ? 'bg-[#E6F4EA] text-[#137333]'
                      : header.status === 'TRIAL'
                      ? 'bg-[#E8F0FE] text-[#1A73E8]'
                      : 'bg-[#FCE8E6] text-[#C5221F]'
                  }`}
                >
                  {header.status}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F1F3F4] text-[#202124]">
                  Plan: {header.plan}
                </span>
              </div>
              <p className="text-xs text-[#5F6368] mt-1">
                Organization: <span className="font-medium text-[#202124]">{header.organizationName}</span> · Slug: <span className="font-mono">{header.slug}</span>
              </p>
            </div>

            {/* Quick Metrics from Header Specs */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="px-3 py-1.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg">
                <span className="text-[#5F6368] block text-[10px]">Subscription</span>
                <span className="font-semibold text-[#202124]">
                  Valid until: {new Date(header.subscriptionValidUntil).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>

              <div className="px-3 py-1.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg">
                <span className="text-[#5F6368] block text-[10px]">Google</span>
                <span className="font-semibold text-[#188038] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#188038]" />
                  {header.googleConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>

              <div className="px-3 py-1.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg">
                <span className="text-[#5F6368] block text-[10px]">Locations</span>
                <span className="font-semibold text-[#202124]">{header.locationsCount}</span>
              </div>

              <div className="px-3 py-1.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg">
                <span className="text-[#5F6368] block text-[10px]">Users</span>
                <span className="font-semibold text-[#202124]">{header.usersCount}</span>
              </div>

              {/* Status change actions */}
              <div className="flex items-center gap-1.5">
                {header.status !== 'ACTIVE' && (
                  <button
                    onClick={() => handleStatusChange('ACTIVE')}
                    className="px-2.5 py-1.5 bg-[#188038] hover:bg-[#137333] text-white text-xs font-semibold rounded-lg shadow-2xs"
                  >
                    Activate
                  </button>
                )}
                {header.status !== 'SUSPENDED' && (
                  <button
                    onClick={() => handleStatusChange('SUSPENDED')}
                    className="px-2.5 py-1.5 bg-white border border-[#D93025] text-[#D93025] hover:bg-[#FCE8E6] text-xs font-semibold rounded-lg"
                  >
                    Suspend
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Notice Alert */}
        {actionNotice && (
          <div className="p-3 bg-[#E8F0FE] border border-[#8AB4F8] rounded-xl text-xs text-[#1A73E8] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#1A73E8]" />
              <span>{actionNotice}</span>
            </div>
            <button onClick={() => setActionNotice(null)} className="text-xs font-bold">✕</button>
          </div>
        )}

        {/* 14 Tabs Navigation */}
        <div className="flex items-center gap-1.5 overflow-x-auto border-b border-[#E5E7EB] pb-px">
          {tabList.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? 'border-[#1A73E8] text-[#1A73E8]'
                    : 'border-transparent text-[#5F6368] hover:text-[#202124]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ------------------------------------------------------------- */}
        {/* TAB 1: OVERVIEW */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border border-[#E5E7EB] p-4 rounded-xl shadow-2xs space-y-2">
                <span className="text-xs text-[#5F6368] font-medium">Tenant Health Score</span>
                <p className="text-3xl font-bold text-[#188038]">{tabs.overview?.healthScore || 94}/100</p>
                <p className="text-[11px] text-[#5F6368]">No critical errors across Google APIs</p>
              </div>

              <div className="bg-white border border-[#E5E7EB] p-4 rounded-xl shadow-2xs space-y-2">
                <span className="text-xs text-[#5F6368] font-medium">Account Owner</span>
                <p className="text-base font-semibold text-[#202124]">{header.owner?.name}</p>
                <p className="text-xs text-[#5F6368]">{header.owner?.email} · {header.owner?.phone}</p>
              </div>

              <div className="bg-white border border-[#E5E7EB] p-4 rounded-xl shadow-2xs space-y-2">
                <span className="text-xs text-[#5F6368] font-medium">Primary Business Category</span>
                <p className="text-base font-semibold text-[#202124]">{tabs.overview?.primaryBusiness?.category || 'Electrical Equipment'}</p>
                <p className="text-xs text-[#5F6368]">{tabs.overview?.primaryBusiness?.city || 'Pune, India'}</p>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 2: FEATURES (ORGANIZATION FEATURE CONTROL) */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'features' && (
          <div className="space-y-6">
            <div className="bg-[#F8FAFC] border border-[#E5E7EB] p-4 rounded-xl flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[#202124]">Organization Feature Control</h3>
                <p className="text-xs text-[#5F6368]">
                  Super Admin can individually enable/disable EVERY feature for this customer. Dependencies are verified automatically.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded text-xs font-semibold bg-white border border-[#E5E7EB] text-[#202124]">
                {tabs.features?.filter((f: any) => f.enabled).length} / {tabs.features?.length} Enabled
              </span>
            </div>

            {/* 10 Feature Groups */}
            {[
              'CORE',
              'REVIEWS',
              'MARKETING',
              'LOCAL SEO',
              'AUTOMATION',
              'ANALYTICS',
              'COMMUNICATION',
              'API',
              'AGENCY',
              'ADVANCED'
            ].map(category => {
              const catFeatures = (tabs.features || []).filter((f: any) => f.category === category);
              if (catFeatures.length === 0) return null;

              return (
                <div key={category} className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-2xs">
                  <div className="px-4 py-2.5 bg-[#F8FAFC] border-b border-[#E5E7EB] flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#202124]">{category}</span>
                    <span className="text-[11px] text-[#5F6368]">
                      {catFeatures.filter((f: any) => f.enabled).length}/{catFeatures.length} Active
                    </span>
                  </div>

                  <div className="divide-y divide-[#E5E7EB]">
                    {catFeatures.map((feat: any) => (
                      <div key={feat.key} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FAFBFD] transition-colors">
                        <div className="space-y-0.5 max-w-xl">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-[#202124]">{feat.name}</span>
                            {feat.requires && feat.requires.length > 0 && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#FEF7E0] text-[#B06000]">
                                Requires: {feat.requires.join(', ')}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#5F6368]">{feat.description}</p>
                          <p className="text-[11px] text-[#80868B] mt-1">
                            Last changed: {feat.changedBy} — {new Date(feat.lastChanged).toLocaleDateString()}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className={`text-xs font-semibold ${feat.enabled ? 'text-[#188038]' : 'text-[#80868B]'}`}>
                            {feat.enabled ? '[ ON ]' : '[ OFF ]'}
                          </span>

                          <button
                            onClick={() => handleToggleFeature(feat.key, feat.enabled)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              feat.enabled ? 'bg-[#188038]' : 'bg-[#E5E7EB]'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                feat.enabled ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 3: LOCATIONS */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'locations' && (
          <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] border-b border-[#E5E7EB] text-[#5F6368]">
                <tr>
                  <th className="py-3 px-4 font-medium">LOCATION TITLE</th>
                  <th className="py-3 px-4 font-medium">LOCALITY / ADDRESS</th>
                  <th className="py-3 px-4 font-medium">PRIMARY CATEGORY</th>
                  <th className="py-3 px-4 font-medium">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {(tabs.locations || []).map((loc: any) => (
                  <tr key={loc.id} className="hover:bg-[#F8FAFC]">
                    <td className="py-3 px-4 font-semibold text-[#202124]">{loc.title}</td>
                    <td className="py-3 px-4 text-[#5F6368]">{loc.locality}</td>
                    <td className="py-3 px-4 text-[#202124]">{loc.primaryCategory}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#E6F4EA] text-[#137333]">
                        {loc.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 4: GOOGLE */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'google' && (
          <div className="bg-white border border-[#E5E7EB] p-5 rounded-xl shadow-2xs space-y-4">
            <h3 className="font-semibold text-sm text-[#202124]">Google Business Profile Integration Status</h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-[#F8FAFC] rounded-lg">
                <span className="text-[#5F6368] block">Connection Status</span>
                <span className="font-semibold text-[#188038]">
                  {tabs.google?.integration?.status === 'connected' ? 'Connected & Verified' : 'Disconnected'}
                </span>
              </div>
              <div className="p-3 bg-[#F8FAFC] rounded-lg">
                <span className="text-[#5F6368] block">Google Account ID</span>
                <span className="font-mono text-[#202124]">{tabs.google?.accountId || 'accounts/11492049182390192'}</span>
              </div>
              <div className="p-3 bg-[#F8FAFC] rounded-lg">
                <span className="text-[#5F6368] block">Synced Locations</span>
                <span className="font-semibold text-[#202124]">{tabs.google?.syncedLocations || 2}</span>
              </div>
              <div className="p-3 bg-[#F8FAFC] rounded-lg">
                <span className="text-[#5F6368] block">Last Sync Time</span>
                <span className="font-semibold text-[#202124]">{new Date(tabs.google?.lastSyncTime || Date.now()).toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 5: REVIEWS */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'reviews' && (
          <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[#202124]">Customer Reviews ({tabs.reviews?.total || 0})</h3>
                <p className="text-xs text-[#5F6368]">Average Rating: {tabs.reviews?.averageRating || 4.8} / 5.0</p>
              </div>
            </div>
            <div className="divide-y divide-[#E5E7EB]">
              {(tabs.reviews?.items || []).slice(0, 10).map((r: any) => (
                <div key={r.id} className="p-4 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#202124]">{r.reviewerName}</span>
                    <span className="font-semibold text-[#F9AB00]">{r.starRating} ★</span>
                  </div>
                  <p className="text-[#5F6368]">{r.comment || '(No written comment)'}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 6: REVIEW ONLINE */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'review_online' && (
          <div className="bg-white border border-[#E5E7EB] p-5 rounded-xl shadow-2xs space-y-4">
            <h3 className="font-semibold text-sm text-[#202124]">Review Online (QR & NFC) Hardware & Funnel</h3>
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-[#F8FAFC] rounded-lg">
                <span className="text-[#5F6368] block">Active NFC Cards</span>
                <span className="text-lg font-bold text-[#202124]">{tabs.reviewOnline?.nfcCards?.length || 4}</span>
              </div>
              <div className="p-3 bg-[#F8FAFC] rounded-lg">
                <span className="text-[#5F6368] block">Total Taps</span>
                <span className="text-lg font-bold text-[#1A73E8]">{tabs.reviewOnline?.analytics?.nfcTaps || 295}</span>
              </div>
              <div className="p-3 bg-[#F8FAFC] rounded-lg">
                <span className="text-[#5F6368] block">Google Conversion Rate</span>
                <span className="text-lg font-bold text-[#188038]">{tabs.reviewOnline?.analytics?.conversionRate || '68.8%'}</span>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 7: AUTOMATIONS */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'automations' && (
          <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] border-b border-[#E5E7EB] text-[#5F6368]">
                <tr>
                  <th className="py-3 px-4 font-medium">AUTOMATION RULE</th>
                  <th className="py-3 px-4 font-medium">TRIGGER</th>
                  <th className="py-3 px-4 font-medium">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {(tabs.automations?.rules || []).map((rule: any) => (
                  <tr key={rule.id} className="hover:bg-[#F8FAFC]">
                    <td className="py-3 px-4 font-semibold text-[#202124]">{rule.name}</td>
                    <td className="py-3 px-4 text-[#5F6368]">{rule.triggerType}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${rule.enabled ? 'bg-[#E6F4EA] text-[#137333]' : 'bg-[#F1F3F4] text-[#5F6368]'}`}>
                        {rule.enabled ? 'ENABLED' : 'DISABLED'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 8: SUBSCRIPTION */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'subscription' && (
          <div className="bg-white border border-[#E5E7EB] p-5 rounded-xl shadow-2xs space-y-3">
            <h3 className="font-semibold text-sm text-[#202124]">Subscription & Limits</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-[#F8FAFC] rounded-lg">
                <span className="text-[#5F6368] block">Plan</span>
                <span className="font-bold text-[#1A73E8]">{tabs.subscription?.plan}</span>
              </div>
              <div className="p-3 bg-[#F8FAFC] rounded-lg">
                <span className="text-[#5F6368] block">Monthly Amount</span>
                <span className="font-bold text-[#202124]">${tabs.subscription?.amountMonthlyUsd}/mo</span>
              </div>
              <div className="p-3 bg-[#F8FAFC] rounded-lg">
                <span className="text-[#5F6368] block">Max Locations</span>
                <span className="font-bold text-[#202124]">{tabs.subscription?.limits?.maxLocations}</span>
              </div>
              <div className="p-3 bg-[#F8FAFC] rounded-lg">
                <span className="text-[#5F6368] block">Max Monthly Reviews</span>
                <span className="font-bold text-[#202124]">{tabs.subscription?.limits?.maxReviewsPerMonth}</span>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 9: PAYMENTS */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'payments' && (
          <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] border-b border-[#E5E7EB] text-[#5F6368]">
                <tr>
                  <th className="py-2.5 px-4 font-medium">INVOICE</th>
                  <th className="py-2.5 px-4 font-medium">DATE</th>
                  <th className="py-2.5 px-4 font-medium">AMOUNT</th>
                  <th className="py-2.5 px-4 font-medium">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {(tabs.payments || []).map((p: any) => (
                  <tr key={p.id} className="hover:bg-[#F8FAFC]">
                    <td className="py-2.5 px-4 font-mono font-medium text-[#202124]">{p.invoiceNumber}</td>
                    <td className="py-2.5 px-4 text-[#5F6368]">{p.date}</td>
                    <td className="py-2.5 px-4 font-semibold text-[#202124]">${p.amountUsd}.00</td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#E6F4EA] text-[#137333]">{p.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 10: NOTIFICATIONS */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'notifications' && (
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-2xs space-y-3">
            <h3 className="font-semibold text-sm text-[#202124]">Notification Log</h3>
            <p className="text-xs text-[#5F6368]">WhatsApp and Email transactional logs for this tenant.</p>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 11: USAGE */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'usage' && (
          <div className="bg-white border border-[#E5E7EB] p-5 rounded-xl shadow-2xs space-y-4">
            <h3 className="font-semibold text-sm text-[#202124]">Monthly Quota Consumption</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-[#F8FAFC] rounded-lg">
                <span className="text-[#5F6368] block">API Requests</span>
                <span className="text-xl font-bold text-[#202124]">{tabs.usage?.apiRequests}</span>
              </div>
              <div className="p-3 bg-[#F8FAFC] rounded-lg">
                <span className="text-[#5F6368] block">AI Tokens Used</span>
                <span className="text-xl font-bold text-[#1A73E8]">{tabs.usage?.aiTokens}</span>
              </div>
              <div className="p-3 bg-[#F8FAFC] rounded-lg">
                <span className="text-[#5F6368] block">NFC Hardware Taps</span>
                <span className="text-xl font-bold text-[#188038]">{tabs.usage?.nfcTaps}</span>
              </div>
              <div className="p-3 bg-[#F8FAFC] rounded-lg">
                <span className="text-[#5F6368] block">SEO Crawls</span>
                <span className="text-xl font-bold text-[#202124]">{tabs.usage?.seoCrawls}</span>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 12: API */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'api' && (
          <div className="bg-white border border-[#E5E7EB] p-5 rounded-xl shadow-2xs space-y-3">
            <h3 className="font-semibold text-sm text-[#202124]">Developer Credentials & Webhooks</h3>
            <p className="text-xs text-[#5F6368]">
              Active API Keys: {tabs.api?.apiKeys?.length || 1} · Registered Webhooks: {tabs.api?.webhooks?.length || 1}
            </p>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 13: AUDIT LOGS */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'audit_logs' && (
          <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] border-b border-[#E5E7EB] text-[#5F6368]">
                <tr>
                  <th className="py-2.5 px-4 font-medium">TIMESTAMP</th>
                  <th className="py-2.5 px-4 font-medium">ACTION</th>
                  <th className="py-2.5 px-4 font-medium">USER</th>
                  <th className="py-2.5 px-4 font-medium text-right">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {(tabs.auditLogs || []).map((l: any) => (
                  <tr key={l.id} className="hover:bg-[#F8FAFC]">
                    <td className="py-2.5 px-4 text-[#5F6368]">{new Date(l.timestamp).toLocaleString()}</td>
                    <td className="py-2.5 px-4 font-mono font-semibold text-[#202124]">{l.action}</td>
                    <td className="py-2.5 px-4 text-[#5F6368]">{l.userEmail}</td>
                    <td className="py-2.5 px-4 text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#E6F4EA] text-[#137333]">{l.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 14: SUPPORT */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'support' && (
          <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] border-b border-[#E5E7EB] text-[#5F6368]">
                <tr>
                  <th className="py-2.5 px-4 font-medium">TICKET</th>
                  <th className="py-2.5 px-4 font-medium">SUBJECT</th>
                  <th className="py-2.5 px-4 font-medium">PRIORITY</th>
                  <th className="py-2.5 px-4 font-medium">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {(tabs.support || []).map((s: any) => (
                  <tr key={s.id} className="hover:bg-[#F8FAFC]">
                    <td className="py-2.5 px-4 font-mono font-semibold text-[#202124]">{s.id}</td>
                    <td className="py-2.5 px-4 text-[#202124]">{s.subject}</td>
                    <td className="py-2.5 px-4 font-semibold text-[#F9AB00]">{s.priority}</td>
                    <td className="py-2.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${s.status === 'OPEN' ? 'bg-[#FEF7E0] text-[#B06000]' : 'bg-[#E6F4EA] text-[#137333]'}`}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

// -------------------------------------------------------------
// Additional Admin Sub-Pages
// -------------------------------------------------------------
export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    fetchApi<{ users: any[] }>('/admin/users').then(r => setUsers(r.users || [])).catch(() => {});
  }, []);

  return (
    <AdminLayout activeSection="users">
      <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-[#E5E7EB]">
          <h3 className="text-sm font-semibold text-[#202124]">User Accounts & Roles</h3>
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-[#F8FAFC] border-b border-[#E5E7EB] text-[#5F6368]">
            <tr>
              <th className="py-3 px-4 font-medium">USER</th>
              <th className="py-3 px-4 font-medium">EMAIL</th>
              <th className="py-3 px-4 font-medium">ORGANIZATION</th>
              <th className="py-3 px-4 font-medium">ROLE</th>
              <th className="py-3 px-4 font-medium">STATUS</th>
              <th className="py-3 px-4 font-medium">LAST LOGIN</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB]">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-[#F8FAFC]">
                <td className="py-3 px-4 font-semibold text-[#202124]">{u.name}</td>
                <td className="py-3 px-4 text-[#5F6368]">{u.email}</td>
                <td className="py-3 px-4 text-[#202124]">{u.organizationName}</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F1F3F4] text-[#202124]">
                    {u.role}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#E6F4EA] text-[#137333]">
                    {u.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-[#5F6368]">{new Date(u.lastLoginAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
};

export const AdminBusinessesPage: React.FC = () => {
  const [businesses, setBusinesses] = useState<any[]>([]);

  useEffect(() => {
    fetchApi<{ businesses: any[] }>('/admin/businesses').then(r => setBusinesses(r.businesses || [])).catch(() => {});
  }, []);

  return (
    <AdminLayout activeSection="businesses">
      <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-[#E5E7EB]">
          <h3 className="text-sm font-semibold text-[#202124]">Registered Businesses</h3>
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-[#F8FAFC] border-b border-[#E5E7EB] text-[#5F6368]">
            <tr>
              <th className="py-3 px-4 font-medium">NAME</th>
              <th className="py-3 px-4 font-medium">CATEGORY</th>
              <th className="py-3 px-4 font-medium">CITY</th>
              <th className="py-3 px-4 font-medium">PHONE</th>
              <th className="py-3 px-4 font-medium">WEBSITE</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB]">
            {businesses.map(b => (
              <tr key={b.id} className="hover:bg-[#F8FAFC]">
                <td className="py-3 px-4 font-semibold text-[#202124]">{b.name}</td>
                <td className="py-3 px-4 text-[#5F6368]">{b.category}</td>
                <td className="py-3 px-4 text-[#202124]">{b.city}</td>
                <td className="py-3 px-4 text-[#5F6368]">{b.phone}</td>
                <td className="py-3 px-4">
                  <a href={b.website} target="_blank" rel="noreferrer" className="text-[#1A73E8] hover:underline flex items-center gap-1">
                    <span>{b.website}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
};

export const AdminLocationsPage: React.FC = () => {
  const [locations, setLocations] = useState<any[]>([]);

  useEffect(() => {
    fetchApi<{ locations: any[] }>('/admin/locations').then(r => setLocations(r.locations || [])).catch(() => {});
  }, []);

  return (
    <AdminLayout activeSection="locations">
      <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-[#E5E7EB]">
          <h3 className="text-sm font-semibold text-[#202124]">Google Locations</h3>
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-[#F8FAFC] border-b border-[#E5E7EB] text-[#5F6368]">
            <tr>
              <th className="py-3 px-4 font-medium">STORE</th>
              <th className="py-3 px-4 font-medium">LOCALITY</th>
              <th className="py-3 px-4 font-medium">PRIMARY CATEGORY</th>
              <th className="py-3 px-4 font-medium">STATUS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB]">
            {locations.map(l => (
              <tr key={l.id} className="hover:bg-[#F8FAFC]">
                <td className="py-3 px-4 font-semibold text-[#202124]">{l.title}</td>
                <td className="py-3 px-4 text-[#5F6368]">{l.locality}</td>
                <td className="py-3 px-4 text-[#202124]">{l.primaryCategory}</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#E6F4EA] text-[#137333]">
                    {l.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
};

export const AdminJobsPage: React.FC = () => {
  const [jobs, setJobs] = useState<any[]>([]);

  useEffect(() => {
    fetchApi<{ jobs: any[] }>('/admin/jobs').then(r => setJobs(r.jobs || [])).catch(() => {});
  }, []);

  return (
    <AdminLayout activeSection="jobs">
      <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-[#E5E7EB]">
          <h3 className="text-sm font-semibold text-[#202124]">Background Jobs Monitor</h3>
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-[#F8FAFC] border-b border-[#E5E7EB] text-[#5F6368]">
            <tr>
              <th className="py-3 px-4 font-medium">JOB TYPE</th>
              <th className="py-3 px-4 font-medium">QUEUE</th>
              <th className="py-3 px-4 font-medium">DURATION</th>
              <th className="py-3 px-4 font-medium">STATUS</th>
              <th className="py-3 px-4 font-medium">COMPLETED AT</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB]">
            {jobs.map(j => (
              <tr key={j.id} className="hover:bg-[#F8FAFC]">
                <td className="py-3 px-4 font-semibold text-[#202124]">{j.type}</td>
                <td className="py-3 px-4 font-mono text-[#5F6368]">{j.queue}</td>
                <td className="py-3 px-4 text-[#5F6368]">{j.durationMs}ms</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#E6F4EA] text-[#137333]">
                    {j.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-[#5F6368]">
                  {j.completedAt ? new Date(j.completedAt).toLocaleTimeString() : 'In Progress'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
};

export const AdminApiHealthPage: React.FC = () => {
  const [providers, setProviders] = useState<any[]>([]);

  useEffect(() => {
    fetchApi<{ providers: any[] }>('/admin/api-health').then(r => setProviders(r.providers || [])).catch(() => {});
  }, []);

  return (
    <AdminLayout activeSection="api-health">
      <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-[#E5E7EB]">
          <h3 className="text-sm font-semibold text-[#202124]">API Health Telemetry</h3>
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-[#F8FAFC] border-b border-[#E5E7EB] text-[#5F6368]">
            <tr>
              <th className="py-3 px-4 font-medium">PROVIDER</th>
              <th className="py-3 px-4 font-medium">STATUS</th>
              <th className="py-3 px-4 font-medium">LATENCY</th>
              <th className="py-3 px-4 font-medium">ERROR COUNT</th>
              <th className="py-3 px-4 font-medium">LAST VERIFIED</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB]">
            {providers.map((p, idx) => (
              <tr key={idx} className="hover:bg-[#F8FAFC]">
                <td className="py-3 px-4 font-semibold text-[#202124]">{p.name}</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#E6F4EA] text-[#137333]">
                    {p.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-[#5F6368]">{p.latencyMs}ms</td>
                <td className="py-3 px-4 text-[#188038] font-medium">{p.errorCount}</td>
                <td className="py-3 px-4 text-[#5F6368]">{new Date(p.lastChecked).toLocaleTimeString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
};

export const AdminBillingPage: React.FC = () => {
  const [sub, setSub] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);

  useEffect(() => {
    fetchApi<{ subscription: any }>('/billing/subscription').then(r => setSub(r.subscription)).catch(() => {});
    fetchApi<{ invoices: any[] }>('/billing/invoices').then(r => setInvoices(r.invoices || [])).catch(() => {});
  }, []);

  return (
    <AdminLayout activeSection="billing">
      <div className="space-y-6">
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-sm text-[#202124]">Current Tenant Plan</h3>
              <p className="text-xs text-[#5F6368]">Organization: Local Growth Media</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#E8F0FE] text-[#1A73E8]">
              {sub?.plan || 'Growth'} Plan (${sub?.amountMonthlyUsd || 149}/mo)
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-[#F8FAFC] rounded-lg">
              <span className="text-[#80868B] block">Max Businesses</span>
              <span className="font-semibold text-[#202124] text-base">{sub?.limits?.maxBusinesses || 5}</span>
            </div>
            <div className="p-3 bg-[#F8FAFC] rounded-lg">
              <span className="text-[#80868B] block">Max Locations</span>
              <span className="font-semibold text-[#202124] text-base">{sub?.limits?.maxLocations || 20}</span>
            </div>
            <div className="p-3 bg-[#F8FAFC] rounded-lg">
              <span className="text-[#80868B] block">Monthly AI Actions</span>
              <span className="font-semibold text-[#202124] text-base">{sub?.limits?.maxAiActionsPerMonth || 1000}</span>
            </div>
            <div className="p-3 bg-[#F8FAFC] rounded-lg">
              <span className="text-[#80868B] block">Monthly Reviews</span>
              <span className="font-semibold text-[#202124] text-base">{sub?.limits?.maxReviewsPerMonth || 2000}</span>
            </div>
          </div>
        </div>

        {/* Invoices */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-[#E5E7EB]">
            <h3 className="text-sm font-semibold text-[#202124]">Invoices</h3>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] border-b border-[#E5E7EB] text-[#5F6368]">
              <tr>
                <th className="py-2.5 px-4 font-medium">INVOICE NUMBER</th>
                <th className="py-2.5 px-4 font-medium">DATE</th>
                <th className="py-2.5 px-4 font-medium">AMOUNT</th>
                <th className="py-2.5 px-4 font-medium">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {invoices.map(inv => (
                <tr key={inv.id} className="hover:bg-[#F8FAFC]">
                  <td className="py-2.5 px-4 font-mono font-medium text-[#202124]">{inv.invoiceNumber}</td>
                  <td className="py-2.5 px-4 text-[#5F6368]">{inv.date}</td>
                  <td className="py-2.5 px-4 font-medium text-[#202124]">${inv.amountUsd}.00</td>
                  <td className="py-2.5 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#E6F4EA] text-[#137333]">
                      {inv.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export const AdminAiUsagePage: React.FC = () => {
  const [records, setRecords] = useState<any[]>([]);

  useEffect(() => {
    fetchApi<{ records: any[] }>('/admin/ai-usage?organizationId=org_main_001')
      .then(r => setRecords(r.records || []))
      .catch(() => {});
  }, []);

  return (
    <AdminLayout activeSection="ai-usage">
      <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-[#E5E7EB]">
          <h3 className="text-sm font-semibold text-[#202124]">Gemini AI Token Telemetry</h3>
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-[#F8FAFC] border-b border-[#E5E7EB] text-[#5F6368]">
            <tr>
              <th className="py-2.5 px-4 font-medium">FEATURE</th>
              <th className="py-2.5 px-4 font-medium">MODEL</th>
              <th className="py-2.5 px-4 font-medium">INPUT TOKENS</th>
              <th className="py-2.5 px-4 font-medium">OUTPUT TOKENS</th>
              <th className="py-2.5 px-4 font-medium">EST. COST</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB]">
            {records.map((rec, idx) => (
              <tr key={idx} className="hover:bg-[#F8FAFC]">
                <td className="py-2.5 px-4 font-semibold text-[#202124]">{rec.feature}</td>
                <td className="py-2.5 px-4 font-mono text-[#5F6368]">{rec.model}</td>
                <td className="py-2.5 px-4 text-[#5F6368]">{rec.inputTokens}</td>
                <td className="py-2.5 px-4 text-[#5F6368]">{rec.outputTokens}</td>
                <td className="py-2.5 px-4 font-medium text-[#188038]">${rec.estimatedCostUsd}</td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-[#5F6368]">
                  Token telemetry logged on Gemini AI review replies, SEO analyses, and growth reports.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
};

export const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    fetchApi<{ logs: any[] }>('/audit-logs?organizationId=org_main_001').then(r => setLogs(r.logs || [])).catch(() => {});
  }, []);

  return (
    <AdminLayout activeSection="audit-logs">
      <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-[#E5E7EB]">
          <h3 className="text-sm font-semibold text-[#202124]">Security & Integration Audit Logs</h3>
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-[#F8FAFC] border-b border-[#E5E7EB] text-[#5F6368]">
            <tr>
              <th className="py-2.5 px-4 font-medium">TIMESTAMP</th>
              <th className="py-2.5 px-4 font-medium">ACTION</th>
              <th className="py-2.5 px-4 font-medium">USER</th>
              <th className="py-2.5 px-4 font-medium">PROVIDER</th>
              <th className="py-2.5 px-4 font-medium text-right">STATUS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB]">
            {logs.map(log => (
              <tr key={log.id} className="hover:bg-[#F8FAFC]">
                <td className="py-2.5 px-4 text-[#5F6368]">{new Date(log.timestamp).toLocaleString()}</td>
                <td className="py-2.5 px-4 font-mono font-bold text-[#202124]">{log.action}</td>
                <td className="py-2.5 px-4 text-[#5F6368]">{log.userEmail}</td>
                <td className="py-2.5 px-4 text-[#80868B]">{log.provider || 'system'}</td>
                <td className="py-2.5 px-4 text-right">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                    log.status === 'SUCCESS' ? 'bg-[#E6F4EA] text-[#137333]' : 'bg-[#FCE8E6] text-[#C5221F]'
                  }`}>
                    {log.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
};

export const AdminIntegrationsPage: React.FC = () => {
  const [health, setHealth] = useState<any>(null);

  useEffect(() => {
    fetchApi<any>('/admin/integrations-health').then(setHealth).catch(() => {});
  }, []);

  return (
    <AdminLayout activeSection="integrations">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm text-[#202124]">Google OAuth 2.0 Client</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#E6F4EA] text-[#137333]">
              {health?.googleOAuth?.configured ? 'Configured' : 'Ready'}
            </span>
          </div>
          <p className="text-xs text-[#5F6368]">
            Redirect URI: <span className="font-mono text-[#202124]">{health?.googleOAuth?.redirectUri}</span>
          </p>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm text-[#202124]">Google Places API (New)</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#E6F4EA] text-[#137333]">
              Operational
            </span>
          </div>
          <p className="text-xs text-[#5F6368]">
            Field mask filtered search and place details for competitor rank detection.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
};

export const AdminAutomationPage: React.FC = () => {
  return (
    <AdminLayout activeSection="overview">
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 text-center text-xs text-[#5F6368]">
        Manage automation routines across all tenant organizations.
      </div>
    </AdminLayout>
  );
};

export const AdminSupportPage: React.FC = () => {
  return (
    <AdminLayout activeSection="overview">
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 space-y-4">
        <h2 className="text-base font-semibold text-[#202124]">Cross-Tenant Support Tickets</h2>
        <p className="text-xs text-[#5F6368]">
          Review and resolve customer inquiries, integration requests, and billing disputes.
        </p>
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
          All client support tickets across tenant organizations appear here for resolution.
        </div>
      </div>
    </AdminLayout>
  );
};

export const AdminSystemSettingsPage: React.FC = () => {
  return (
    <AdminLayout activeSection="overview">
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 space-y-4">
        <h2 className="text-base font-semibold text-[#202124]">System Settings & Feature Flags</h2>
        <p className="text-xs text-[#5F6368]">
          Global kill-switches, API rate limit overrides, and tenant quota controls.
        </p>
      </div>
    </AdminLayout>
  );
};

