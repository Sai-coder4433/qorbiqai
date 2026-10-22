import React, { useState, useEffect } from 'react';
import {
  Inbox,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Phone,
  Mail,
  Building2,
  MapPin,
  ExternalLink,
  MessageSquare,
  UserCheck,
  RefreshCw,
  AlertCircle,
  Calendar,
  Sparkles,
  ArrowRight,
  UserPlus
} from 'lucide-react';
import { freshTestApi } from '../../lib/fresh-test-api.ts';

interface Lead {
  id: string;
  name: string;
  businessName: string;
  phone: string;
  email: string;
  category: string;
  city: string;
  googleBusinessUrl?: string;
  message?: string;
  status: 'NEW' | 'CONTACTED' | 'FOLLOW_UP' | 'DEMO_SCHEDULED' | 'NEGOTIATION' | 'CONVERTED' | 'NOT_INTERESTED' | 'LOST';
  assignedSalesId?: string;
  assignedSalesName?: string;
  createdAt: string;
  updatedAt: string;
}

export const SuperAdminLeadsPage: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [noteText, setNoteText] = useState('');
  const [notes, setNotes] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const [leadsList, empList] = await Promise.all([
        freshTestApi.getCrmLeads(),
        freshTestApi.getAdminEmployees().catch(() => [])
      ]);
      setLeads(leadsList || []);
      setEmployees(empList || []);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load inquiries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectLead = async (lead: Lead) => {
    setSelectedLead(lead);
    setNoteText('');
    try {
      const detail = await freshTestApi.getCrmLeadById(lead.id);
      setNotes(detail.notes || []);
    } catch {
      setNotes([]);
    }
  };

  const handleStatusChange = async (leadId: string, nextStatus: string) => {
    try {
      setActionLoading(true);
      const res = await freshTestApi.updateCrmLead(leadId, { status: nextStatus });
      setSuccessMessage(`Lead status updated to ${nextStatus}.`);
      setLeads(prev => prev.map(l => (l.id === leadId ? { ...l, status: nextStatus as any } : l)));
      if (selectedLead && selectedLead.id === leadId) {
        setSelectedLead({ ...selectedLead, status: nextStatus as any });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignLead = async (leadId: string, salesId: string) => {
    const emp = employees.find(e => e.uid === salesId);
    try {
      setActionLoading(true);
      await freshTestApi.updateCrmLead(leadId, {
        assignedSalesId: salesId,
        assignedSalesName: emp ? emp.name : 'Assigned Staff'
      });
      setSuccessMessage(`Lead assigned to ${emp ? emp.name : 'Staff'}.`);
      setLeads(prev =>
        prev.map(l =>
          l.id === leadId
            ? { ...l, assignedSalesId: salesId, assignedSalesName: emp ? emp.name : 'Staff' }
            : l
        )
      );
      if (selectedLead && selectedLead.id === leadId) {
        setSelectedLead({
          ...selectedLead,
          assignedSalesId: salesId,
          assignedSalesName: emp ? emp.name : 'Staff'
        });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to assign lead');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConvertToClient = async (lead: Lead) => {
    if (!window.confirm(`Convert "${lead.name}" (${lead.businessName}) to an active client?`)) return;
    try {
      setActionLoading(true);
      await freshTestApi.convertLeadToClient(lead.id);
      setSuccessMessage(`Lead successfully converted to active ReviewFlow client account!`);
      await loadData();
      if (selectedLead && selectedLead.id === lead.id) {
        setSelectedLead({ ...selectedLead, status: 'CONVERTED' });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to convert lead');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !noteText.trim()) return;
    try {
      setActionLoading(true);
      const res = await freshTestApi.addCrmNote({
        leadId: selectedLead.id,
        text: noteText.trim()
      });
      setNotes(prev => [res.note, ...prev]);
      setNoteText('');
      setSuccessMessage('Follow-up note added.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to add note');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch =
      lead.name.toLowerCase().includes(search.toLowerCase()) ||
      lead.businessName.toLowerCase().includes(search.toLowerCase()) ||
      lead.email.toLowerCase().includes(search.toLowerCase()) ||
      lead.phone.toLowerCase().includes(search.toLowerCase()) ||
      lead.city.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NEW':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">New Inquiry</span>;
      case 'CONTACTED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Contacted</span>;
      case 'FOLLOW_UP':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">Follow Up</span>;
      case 'CONVERTED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Converted</span>;
      case 'NOT_INTERESTED':
      case 'LOST':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">Closed</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Inbox className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900">Website Inquiries & CRM Leads</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time inquiries received from the landing page. Track prospects, assign staff, and convert into paying clients.
          </p>
        </div>
        <button
          onClick={loadData}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Leads</span>
        </button>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-700 font-bold">✕</button>
        </div>
      )}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-500 hover:text-emerald-700 font-bold">✕</button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs font-medium text-slate-500">Total Inquiries</div>
          <div className="text-2xl font-bold text-slate-900">{leads.length}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs font-medium text-slate-500">New Leads</div>
          <div className="text-2xl font-bold text-amber-600">
            {leads.filter(l => l.status === 'NEW').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs font-medium text-slate-500">In Follow Up</div>
          <div className="text-2xl font-bold text-blue-600">
            {leads.filter(l => l.status === 'FOLLOW_UP' || l.status === 'CONTACTED').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs font-medium text-slate-500">Converted Clients</div>
          <div className="text-2xl font-bold text-emerald-600">
            {leads.filter(l => l.status === 'CONVERTED').length}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by lead name, business, phone, email, or city..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:bg-white focus:border-blue-600"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-hidden focus:border-blue-600 cursor-pointer"
          >
            <option value="ALL">All Inquiries</option>
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="FOLLOW_UP">Follow Up</option>
            <option value="CONVERTED">Converted</option>
            <option value="NOT_INTERESTED">Closed / Lost</option>
          </select>
        </div>
      </div>

      {/* Main Content Layout: Leads List + Detail Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leads Table / List */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
              <span>Loading website inquiries...</span>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Inbox className="w-6 h-6" />
              </div>
              <div className="text-sm font-semibold text-slate-800">No inquiries found</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Inquiries submitted on the website contact form will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50/80 text-slate-500 uppercase text-[10px] font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Lead & Business</th>
                    <th className="px-5 py-3.5">Contact</th>
                    <th className="px-5 py-3.5">City & Category</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Assigned To</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {filteredLeads.map(lead => {
                    const isSelected = selectedLead?.id === lead.id;
                    return (
                      <tr
                        key={lead.id}
                        onClick={() => handleSelectLead(lead)}
                        className={`transition-colors cursor-pointer ${
                          isSelected ? 'bg-blue-50/80' : 'hover:bg-slate-50/70'
                        }`}
                      >
                        <td className="px-5 py-4">
                          <div className="font-semibold text-slate-900">{lead.name}</div>
                          <div className="text-[11px] text-blue-600 font-medium flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            <span>{lead.businessName}</span>
                          </div>
                        </td>

                        <td className="px-5 py-4 space-y-0.5">
                          <div className="flex items-center gap-1 text-slate-600">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{lead.phone}</span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-500 text-[11px]">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span className="truncate max-w-[140px]">{lead.email}</span>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="text-slate-800 font-medium">{lead.city || 'Local'}</div>
                          <div className="text-[11px] text-slate-500">{lead.category}</div>
                        </td>

                        <td className="px-5 py-4">{getStatusBadge(lead.status)}</td>

                        <td className="px-5 py-4">
                          <div className="text-xs text-slate-700">
                            {lead.assignedSalesName || 'Unassigned'}
                          </div>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleSelectLead(lead);
                            }}
                            className="px-2.5 py-1 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-semibold border border-blue-200 cursor-pointer"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Selected Lead Inspector Panel */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5 space-y-5">
          {selectedLead ? (
            <div className="space-y-5">
              {/* Header */}
              <div className="pb-4 border-b border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  {getStatusBadge(selectedLead.status)}
                  <span className="text-[11px] text-slate-400">
                    {new Date(selectedLead.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{selectedLead.name}</h3>
                  <div className="text-xs font-semibold text-blue-600 flex items-center gap-1 mt-0.5">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>{selectedLead.businessName}</span>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Phone:</span>
                  <a href={`tel:${selectedLead.phone}`} className="font-semibold text-blue-600 hover:underline">
                    {selectedLead.phone}
                  </a>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Email:</span>
                  <a href={`mailto:${selectedLead.email}`} className="font-semibold text-blue-600 hover:underline truncate max-w-[170px]">
                    {selectedLead.email}
                  </a>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">City / Location:</span>
                  <span className="font-semibold text-slate-800">{selectedLead.city || 'Local'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Business Category:</span>
                  <span className="font-semibold text-slate-800">{selectedLead.category}</span>
                </div>
                {selectedLead.googleBusinessUrl && (
                  <div className="pt-1 border-t border-slate-200/60">
                    <a
                      href={selectedLead.googleBusinessUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <span>Google Business Link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>

              {/* Inquiry Message */}
              {selectedLead.message && (
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">Client Message</span>
                  <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl text-xs text-slate-700 italic">
                    "{selectedLead.message}"
                  </div>
                </div>
              )}

              {/* Status & Staff Assignment Controls */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Update Lead Status</label>
                  <select
                    value={selectedLead.status}
                    onChange={e => handleStatusChange(selectedLead.id, e.target.value)}
                    disabled={actionLoading}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 outline-hidden cursor-pointer"
                  >
                    <option value="NEW">New Inquiry</option>
                    <option value="CONTACTED">Contacted</option>
                    <option value="FOLLOW_UP">Follow Up</option>
                    <option value="DEMO_SCHEDULED">Demo Scheduled</option>
                    <option value="NEGOTIATION">Negotiation</option>
                    <option value="CONVERTED">Converted to Client</option>
                    <option value="NOT_INTERESTED">Not Interested</option>
                    <option value="LOST">Lost</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Assign To Team Member</label>
                  <select
                    value={selectedLead.assignedSalesId || ''}
                    onChange={e => handleAssignLead(selectedLead.id, e.target.value)}
                    disabled={actionLoading}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 outline-hidden cursor-pointer"
                  >
                    <option value="">Unassigned</option>
                    {employees.map(emp => (
                      <option key={emp.uid} value={emp.uid}>
                        {emp.name} ({emp.department || emp.role})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedLead.status !== 'CONVERTED' && (
                  <button
                    onClick={() => handleConvertToClient(selectedLead)}
                    disabled={actionLoading}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Convert to Active Client</span>
                  </button>
                )}
              </div>

              {/* Notes & Activity History */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">Add Internal Note</span>
                <form onSubmit={handleAddNote} className="space-y-2">
                  <textarea
                    rows={2}
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    placeholder="e.g. Spoke to owner, interested in 2 QR stands for restaurant..."
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 outline-hidden"
                  />
                  <button
                    type="submit"
                    disabled={actionLoading || !noteText.trim()}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50"
                  >
                    Save Note
                  </button>
                </form>

                {notes.length > 0 && (
                  <div className="space-y-2 pt-2 max-h-40 overflow-y-auto">
                    {notes.map((n: any) => (
                      <div key={n.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60 text-[11px] space-y-1">
                        <div className="text-slate-800 font-medium">{n.text}</div>
                        <div className="text-slate-400 text-[10px] flex items-center justify-between">
                          <span>{n.authorName || 'Staff'}</span>
                          <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-20 text-center space-y-2">
              <Inbox className="w-8 h-8 text-slate-300 mx-auto" />
              <div className="text-xs font-semibold text-slate-700">Select an inquiry to view details</div>
              <p className="text-[11px] text-slate-400">
                Click on any lead from the list to see contact info, assign staff, and convert.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
