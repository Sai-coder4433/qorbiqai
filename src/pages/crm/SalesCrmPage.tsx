import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  QrCode,
  Users,
  Phone,
  Mail,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Clock3,
  TrendingUp,
  Search,
  Filter,
  Plus,
  ArrowRight,
  ExternalLink,
  Building2,
  FileText,
  Check,
  X,
  MessageSquare,
  LogOut,
  RefreshCw,
  UserCheck,
  ChevronRight,
  CalendarClock
} from 'lucide-react';
import { freshTestApi } from '../../lib/fresh-test-api.ts';

export const SalesCrmPage: React.FC = () => {
  const navigate = useNavigate();

  // Sales User Session
  const [salesUser, setSalesUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'leads' | 'renewals' | 'followups'>('leads');

  // CRM Data State
  const [metrics, setMetrics] = useState<any>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [expiringSubs, setExpiringSubs] = useState<any[]>([]);
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [renewalFilterDays, setRenewalFilterDays] = useState<number>(7);

  // Modals state
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);

  // Form states inside modals
  const [callOutcome, setCallOutcome] = useState('Interested');
  const [callNotes, setCallNotes] = useState('');
  const [callNextDate, setCallNextDate] = useState('');
  const [noteText, setNoteText] = useState('');
  const [taskType, setTaskType] = useState('Call');
  const [taskDate, setTaskDate] = useState(new Date().toISOString().split('T')[0]);
  const [taskTime, setTaskTime] = useState('11:00 AM');
  const [taskNotes, setTaskNotes] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Check Sales Auth
  useEffect(() => {
    const raw = localStorage.getItem('rf_sales_user') || localStorage.getItem('rf_active_user');
    if (!raw) {
      navigate('/crm/login');
      return;
    }
    try {
      const user = JSON.parse(raw);
      if (user.role !== 'SALES_TEAM' && user.role !== 'SUPER_ADMIN') {
        navigate('/crm/login');
        return;
      }
      setSalesUser(user);
    } catch {
      navigate('/crm/login');
    }
  }, [navigate]);

  // Load CRM Data
  const loadCrmData = async () => {
    try {
      setLoading(true);
      const [mRes, lRes, expRes, fRes] = await Promise.all([
        freshTestApi.getCrmMetrics().catch(() => null),
        freshTestApi.getCrmLeads({ status: selectedStatus !== 'ALL' ? selectedStatus : undefined, search: searchQuery }).catch(() => []),
        freshTestApi.getCrmExpiringSubscriptions(renewalFilterDays).catch(() => []),
        freshTestApi.getCrmFollowUps().catch(() => [])
      ]);

      if (mRes) setMetrics(mRes);
      setLeads(lRes || []);
      setExpiringSubs(expRes || []);
      setFollowUps(fRes || []);
    } catch (err: any) {
      console.error('Failed to load CRM data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (salesUser) {
      loadCrmData();
    }
  }, [salesUser, selectedStatus, renewalFilterDays]);

  const handleLogout = () => {
    localStorage.removeItem('rf_sales_user');
    navigate('/crm/login');
  };

  // Status update
  const handleUpdateStatus = async (leadId: string, newStatus: string) => {
    try {
      await freshTestApi.updateCrmLead(leadId, { status: newStatus });
      setLeads(prev => prev.map(l => (l.id === leadId ? { ...l, status: newStatus } : l)));
    } catch (err) {
      console.error(err);
    }
  };

  // Log Call submit
  const handleSaveCall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;
    try {
      setModalLoading(true);
      await freshTestApi.logCrmCall({
        leadId: selectedLead.id,
        clientId: selectedLead.clientId,
        phone: selectedLead.phone,
        outcome: callOutcome,
        notes: callNotes,
        nextFollowUpAt: callNextDate || undefined
      });
      setShowCallModal(false);
      setCallNotes('');
      setFeedbackMessage('Call record logged successfully!');
      setTimeout(() => setFeedbackMessage(null), 3000);
      loadCrmData();
    } catch (err: any) {
      alert(err.message || 'Failed to log call');
    } finally {
      setModalLoading(false);
    }
  };

  // Add Note submit
  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !noteText.trim()) return;
    try {
      setModalLoading(true);
      await freshTestApi.addCrmNote({
        leadId: selectedLead.id,
        clientId: selectedLead.clientId,
        text: noteText.trim()
      });
      setShowNoteModal(false);
      setNoteText('');
      setFeedbackMessage('Note added to lead file.');
      setTimeout(() => setFeedbackMessage(null), 3000);
      loadCrmData();
    } catch (err: any) {
      alert(err.message || 'Failed to add note');
    } finally {
      setModalLoading(false);
    }
  };

  // Schedule Task submit
  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;
    try {
      setModalLoading(true);
      await freshTestApi.createCrmFollowUp({
        leadId: selectedLead.id,
        clientId: selectedLead.clientId,
        clientName: selectedLead.name,
        businessName: selectedLead.businessName,
        phone: selectedLead.phone,
        type: taskType,
        dueDate: taskDate,
        time: taskTime,
        notes: taskNotes
      });
      setShowTaskModal(false);
      setTaskNotes('');
      setFeedbackMessage('Follow-up scheduled.');
      setTimeout(() => setFeedbackMessage(null), 3000);
      loadCrmData();
    } catch (err: any) {
      alert(err.message || 'Failed to schedule task');
    } finally {
      setModalLoading(false);
    }
  };

  // Convert to Client submit
  const handleConvertLead = async () => {
    if (!selectedLead) return;
    try {
      setModalLoading(true);
      const res = await freshTestApi.convertLeadToClient(selectedLead.id);
      setShowConvertModal(false);
      setFeedbackMessage(`Lead successfully converted to Client! Account created.`);
      setTimeout(() => setFeedbackMessage(null), 4000);
      loadCrmData();
    } catch (err: any) {
      alert(err.message || 'Failed to convert lead');
    } finally {
      setModalLoading(false);
    }
  };

  // Filtered Leads
  const filteredLeads = leads.filter(l => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      l.name?.toLowerCase().includes(q) ||
      l.businessName?.toLowerCase().includes(q) ||
      l.email?.toLowerCase().includes(q) ||
      l.phone?.includes(q) ||
      l.city?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* 1. Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-xs">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-slate-900 block leading-tight">ReviewFlow AI</span>
              <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Sales CRM</span>
            </div>
          </Link>
          <div className="h-6 w-px bg-slate-200 hidden sm:block" />
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <span>Agent:</span>
            <span className="font-bold text-slate-900">{salesUser?.displayName || 'Sales Representative'}</span>
            <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-bold uppercase ml-1">
              {salesUser?.role || 'SALES_TEAM'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadCrmData}
            title="Refresh Data"
            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            to="/app/dashboard"
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-2 py-1 hidden md:block"
          >
            Client App
          </Link>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-xs font-semibold rounded-xl text-slate-700 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Feedback Alert */}
      {feedbackMessage && (
        <div className="bg-emerald-600 text-white text-xs font-semibold px-6 py-2.5 text-center flex items-center justify-center gap-2 shadow-xs transition-all">
          <CheckCircle2 className="w-4 h-4" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* 2. Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Metric Cards (Section 10) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Leads</span>
            <div className="text-2xl font-black text-slate-900">{metrics?.totalLeads ?? 0}</div>
            <div className="text-[11px] text-blue-600 font-semibold">{metrics?.newLeads ?? 0} new incoming</div>
          </div>

          <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Follow-Up Required</span>
            <div className="text-2xl font-black text-amber-600">{metrics?.followUpRequired ?? 0}</div>
            <div className="text-[11px] text-slate-500 font-medium">In discussion</div>
          </div>

          <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Converted Clients</span>
            <div className="text-2xl font-black text-emerald-600">{metrics?.convertedClients ?? 0}</div>
            <div className="text-[11px] text-slate-500 font-medium">Active accounts</div>
          </div>

          <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Expiring Soon</span>
            <div className="text-2xl font-black text-rose-600">{metrics?.expiringSoon ?? 0}</div>
            <div className="text-[11px] text-rose-600 font-semibold">≤ 7 days window</div>
          </div>

          <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Today's Tasks</span>
            <div className="text-2xl font-black text-indigo-600">{metrics?.todayFollowUps ?? 0}</div>
            <div className="text-[11px] text-slate-500 font-medium">{metrics?.overdueFollowUps ?? 0} overdue</div>
          </div>

          <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Active Pipeline</span>
            <div className="text-2xl font-black text-slate-900">${metrics?.revenue ?? 49}</div>
            <div className="text-[11px] text-emerald-600 font-semibold">{metrics?.activeSubscriptions ?? 1} subscriptions</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('leads')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'leads'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Leads Pipeline ({leads.length})
            </button>

            <button
              onClick={() => setActiveTab('renewals')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'renewals'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>Renewals & Expiry</span>
              {metrics?.expiringSoon > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('followups')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'followups'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Tasks & Follow-ups ({followUps.length})
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* TAB 1: LEADS PIPELINE */}
        {/* ======================================================== */}
        {activeTab === 'leads' && (
          <div className="space-y-4">
            {/* Search & Status Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 border border-slate-200 rounded-2xl shadow-xs">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by name, business, phone, email, city..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:bg-white focus:border-blue-600"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto">
                {['ALL', 'NEW', 'CONTACTED', 'FOLLOW_UP', 'DEMO_SCHEDULED', 'CONVERTED'].map(st => (
                  <button
                    key={st}
                    onClick={() => setSelectedStatus(st)}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold uppercase transition-colors shrink-0 cursor-pointer ${
                      selectedStatus === st
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Leads Table */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Lead & Business</th>
                      <th className="py-3 px-4">Contact Details</th>
                      <th className="py-3 px-4">Location</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Sales Specialist</th>
                      <th className="py-3 px-4">Last Activity</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredLeads.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          No leads matching this filter. New inquiries from the landing page will appear here.
                        </td>
                      </tr>
                    ) : (
                      filteredLeads.map(lead => (
                        <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900">{lead.name}</div>
                            <div className="text-slate-500 flex items-center gap-1 text-[11px]">
                              <Building2 className="w-3 h-3 text-slate-400" />
                              <span>{lead.businessName}</span>
                              <span className="text-slate-300">•</span>
                              <span className="text-blue-600 font-medium">{lead.category}</span>
                            </div>
                            {lead.message && (
                              <p className="text-[11px] text-slate-400 italic line-clamp-1 mt-0.5">"{lead.message}"</p>
                            )}
                          </td>

                          <td className="py-3.5 px-4 space-y-0.5">
                            <a
                              href={`tel:${lead.phone}`}
                              className="font-mono text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                            >
                              <Phone className="w-3 h-3" />
                              <span>{lead.phone}</span>
                            </a>
                            <a
                              href={`mailto:${lead.email}`}
                              className="text-slate-500 hover:text-slate-800 flex items-center gap-1 text-[11px] truncate max-w-[180px]"
                            >
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span className="truncate">{lead.email}</span>
                            </a>
                          </td>

                          <td className="py-3.5 px-4 text-slate-600 font-medium">
                            {lead.city || '—'}
                          </td>

                          <td className="py-3.5 px-4">
                            <select
                              value={lead.status}
                              onChange={e => handleUpdateStatus(lead.id, e.target.value)}
                              className={`text-[11px] font-bold py-1 px-2 rounded-lg border focus:outline-hidden cursor-pointer ${
                                lead.status === 'NEW'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : lead.status === 'CONVERTED'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : lead.status === 'FOLLOW_UP'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-slate-50 text-slate-700 border-slate-200'
                              }`}
                            >
                              <option value="NEW">NEW</option>
                              <option value="CONTACTED">CONTACTED</option>
                              <option value="FOLLOW_UP">FOLLOW UP</option>
                              <option value="DEMO_SCHEDULED">DEMO SCHEDULED</option>
                              <option value="NEGOTIATION">NEGOTIATION</option>
                              <option value="CONVERTED">CONVERTED</option>
                              <option value="NOT_INTERESTED">NOT INTERESTED</option>
                            </select>
                          </td>

                          <td className="py-3.5 px-4 text-slate-600">
                            <span className="text-[11px] font-medium">{lead.assignedSalesName || 'Unassigned'}</span>
                          </td>

                          <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                            {lead.lastContactAt ? new Date(lead.lastContactAt).toLocaleDateString() : 'Never'}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Call Client via tel link & log outcome */}
                              <button
                                onClick={() => {
                                  setSelectedLead(lead);
                                  setShowCallModal(true);
                                }}
                                title="Call & Log Outcome"
                                className="p-1.5 border border-slate-200 rounded-lg hover:bg-blue-50 hover:text-blue-600 text-slate-600 cursor-pointer"
                              >
                                <Phone className="w-3.5 h-3.5" />
                              </button>

                              {/* Add Note */}
                              <button
                                onClick={() => {
                                  setSelectedLead(lead);
                                  setShowNoteModal(true);
                                }}
                                title="Add Sales Note"
                                className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-600 cursor-pointer"
                              >
                                <FileText className="w-3.5 h-3.5" />
                              </button>

                              {/* Schedule Task */}
                              <button
                                onClick={() => {
                                  setSelectedLead(lead);
                                  setShowTaskModal(true);
                                }}
                                title="Schedule Follow-up"
                                className="p-1.5 border border-slate-200 rounded-lg hover:bg-amber-50 hover:text-amber-600 text-slate-600 cursor-pointer"
                              >
                                <CalendarClock className="w-3.5 h-3.5" />
                              </button>

                              {/* Convert to Client */}
                              {lead.status !== 'CONVERTED' && (
                                <button
                                  onClick={() => {
                                    setSelectedLead(lead);
                                    setShowConvertModal(true);
                                  }}
                                  title="Convert to Active Client"
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg shadow-xs cursor-pointer flex items-center gap-1"
                                >
                                  <UserCheck className="w-3 h-3" />
                                  <span>Convert</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: SUBSCRIPTION EXPIRY & RENEWALS */}
        {/* ======================================================== */}
        {activeTab === 'renewals' && (
          <div className="space-y-4">
            <div className="bg-white p-4 border border-slate-200 rounded-2xl shadow-xs flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Subscription Expiry Monitoring</h3>
                <p className="text-xs text-slate-500">
                  Track client subscription end dates and proactively manage renewal contacts.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {[7, 3, 1].map(d => (
                  <button
                    key={d}
                    onClick={() => setRenewalFilterDays(d)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      renewalFilterDays === d
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Expiring in {d} Days
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Client & Business</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Plan Name</th>
                    <th className="py-3 px-4">End Date</th>
                    <th className="py-3 px-4">Days Left</th>
                    <th className="py-3 px-4">AI Credits Used</th>
                    <th className="py-3 px-4 text-right">Renewal Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {expiringSubs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No clients currently expiring within the selected window.
                      </td>
                    </tr>
                  ) : (
                    expiringSubs.map(sub => (
                      <tr key={sub.subscriptionId} className="hover:bg-slate-50/50">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{sub.clientName}</div>
                          <div className="text-[11px] text-slate-500">{sub.businessName}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <a href={`tel:${sub.clientPhone}`} className="text-blue-600 hover:underline font-mono font-semibold">
                            {sub.clientPhone || '—'}
                          </a>
                        </td>
                        <td className="py-3.5 px-4 font-medium">{sub.planName}</td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              sub.daysRemaining <= 0
                                ? 'bg-slate-200 text-slate-700'
                                : sub.daysRemaining <= 3
                                ? 'bg-rose-100 text-rose-700 font-extrabold'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {sub.daysRemaining <= 0 ? 'Expired' : `${sub.daysRemaining} days left`}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-mono">
                          {sub.creditsUsed} / {sub.creditsRemaining + sub.creditsUsed}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <a
                            href={`tel:${sub.clientPhone}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs"
                          >
                            <Phone className="w-3 h-3" />
                            <span>Call Renewal</span>
                          </a>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: TASKS & FOLLOW-UPS */}
        {/* ======================================================== */}
        {activeTab === 'followups' && (
          <div className="space-y-4">
            <div className="bg-white p-4 border border-slate-200 rounded-2xl shadow-xs flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Follow-up Tasks</h3>
                <p className="text-xs text-slate-500">
                  Daily calls, WhatsApp follow-ups, demos, and onboarding tasks.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {followUps.length === 0 ? (
                <div className="col-span-full py-12 text-center text-slate-400 bg-white border border-slate-200 rounded-2xl">
                  No pending follow-ups. Schedule one from any lead row.
                </div>
              ) : (
                followUps.map(task => (
                  <div key={task.id} className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 uppercase tracking-wider">
                        {task.type}
                      </span>
                      <span className={`text-[11px] font-semibold ${task.status === 'COMPLETED' ? 'text-emerald-600' : 'text-slate-500'}`}>
                        {task.status}
                      </span>
                    </div>

                    <div>
                      <div className="font-bold text-slate-900 text-sm">{task.clientName || 'Lead Contact'}</div>
                      <div className="text-xs text-slate-500">{task.businessName || 'Business Inquiry'}</div>
                      {task.phone && (
                        <a href={`tel:${task.phone}`} className="text-xs text-blue-600 font-mono font-medium block mt-0.5">
                          {task.phone}
                        </a>
                      )}
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded-xl text-xs text-slate-600">
                      {task.notes || 'No notes provided.'}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 pt-2">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Due: {task.dueDate} at {task.time}</span>
                      </div>
                      {task.status !== 'COMPLETED' && (
                        <button
                          onClick={async () => {
                            await freshTestApi.updateCrmFollowUp(task.id, { status: 'COMPLETED' });
                            loadCrmData();
                          }}
                          className="text-emerald-600 font-bold hover:underline cursor-pointer"
                        >
                          Mark Done
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* ======================================================== */}
      {/* MODAL 1: LOG CALL OUTCOME (Section 16) */}
      {/* ======================================================== */}
      {showCallModal && selectedLead && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">Log Sales Call</h3>
                <p className="text-xs text-slate-500">{selectedLead.name} • {selectedLead.businessName}</p>
              </div>
              <button onClick={() => setShowCallModal(false)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Direct Clickable Call Tel Link */}
            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">Direct Phone Dial</span>
                <span className="font-mono font-bold text-slate-900 text-sm">{selectedLead.phone}</span>
              </div>
              <a
                href={`tel:${selectedLead.phone}`}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Client</span>
              </a>
            </div>

            <form onSubmit={handleSaveCall} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Call Outcome *</label>
                <select
                  value={callOutcome}
                  onChange={e => setCallOutcome(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:bg-white"
                >
                  <option value="Interested">Interested</option>
                  <option value="Demo Required">Demo Required</option>
                  <option value="Call Later">Call Later</option>
                  <option value="Converted">Converted</option>
                  <option value="Renewal Confirmed">Renewal Confirmed</option>
                  <option value="Not Interested">Not Interested</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Call Notes / Discussion *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Summarize customer feedback, questions, pricing discussed..."
                  value={callNotes}
                  onChange={e => setCallNotes(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Next Follow-Up Date (Optional)</label>
                <input
                  type="date"
                  value={callNextDate}
                  onChange={e => setCallNextDate(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCallModal(false)}
                  className="w-1/3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="w-2/3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  {modalLoading ? 'Saving...' : 'Save Call Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: ADD NOTE */}
      {/* ======================================================== */}
      {showNoteModal && selectedLead && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">Add Sales Note</h3>
                <p className="text-xs text-slate-500">{selectedLead.name} • {selectedLead.businessName}</p>
              </div>
              <button onClick={() => setShowNoteModal(false)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNote} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Note Text *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="e.g. Client requested a customized Marathi desk stand sample..."
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:bg-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNoteModal(false)}
                  className="w-1/3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="w-2/3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  {modalLoading ? 'Saving...' : 'Add Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: SCHEDULE FOLLOW-UP TASK */}
      {/* ======================================================== */}
      {showTaskModal && selectedLead && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">Schedule Task</h3>
                <p className="text-xs text-slate-500">{selectedLead.name} • {selectedLead.businessName}</p>
              </div>
              <button onClick={() => setShowTaskModal(false)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Task Type *</label>
                  <select
                    value={taskType}
                    onChange={e => setTaskType(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Call">Call</option>
                    <option value="WhatsApp Follow-up">WhatsApp Follow-up</option>
                    <option value="Email Follow-up">Email Follow-up</option>
                    <option value="Meeting">Meeting</option>
                    <option value="Renewal Follow-up">Renewal Follow-up</option>
                    <option value="Payment Follow-up">Payment Follow-up</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={taskDate}
                    onChange={e => setTaskDate(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Time (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 11:30 AM"
                  value={taskTime}
                  onChange={e => setTaskTime(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Task Details</label>
                <textarea
                  rows={3}
                  placeholder="Notes about what needs to be discussed or delivered..."
                  value={taskNotes}
                  onChange={e => setTaskNotes(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="w-1/3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="w-2/3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  {modalLoading ? 'Scheduling...' : 'Schedule Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: CONVERT LEAD TO CLIENT */}
      {/* ======================================================== */}
      {showConvertModal && selectedLead && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <UserCheck className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="font-bold text-lg text-slate-900">Convert Lead to Client?</h3>
              <p className="text-xs text-slate-500">
                This will create a verified client account for <strong>{selectedLead.name}</strong> ({selectedLead.businessName}) and preserve all CRM history, notes, and calls.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl text-left text-xs space-y-1 border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-400">Account Email:</span>
                <span className="font-semibold text-slate-800">{selectedLead.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Business Name:</span>
                <span className="font-semibold text-slate-800">{selectedLead.businessName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Allocated Credits:</span>
                <span className="font-bold text-emerald-600">100 Credits (Pro Trial)</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConvertModal(false)}
                className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConvertLead}
                disabled={modalLoading}
                className="w-1/2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                {modalLoading ? 'Converting...' : 'Confirm Conversion'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
