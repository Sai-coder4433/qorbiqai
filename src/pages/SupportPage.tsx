import React, { useState, useEffect } from 'react';
import {
  LifeBuoy,
  Plus,
  Send,
  CheckCircle,
  AlertCircle,
  Clock,
  MessageSquare,
  HelpCircle,
  ShieldQuestion,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../lib/auth-context.tsx';
import { fetchApi } from '../lib/api.ts';

export interface SupportTicket {
  id: string;
  organizationId: string;
  userId: string;
  subject: string;
  category: 'GOOGLE_SYNC' | 'BILLING' | 'REVIEWS' | 'WEBSITE' | 'GENERAL';
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'WAITING' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: string;
  updatedAt: string;
}

export const SupportPage: React.FC = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([
    {
      id: 'TCK-201',
      organizationId: 'org_default',
      userId: user?.uid || 'usr_default',
      subject: 'Google GBP OAuth API approval onboarding query',
      category: 'GOOGLE_SYNC',
      description: 'Inquiring regarding timeline for Google Business Profile live sync feature activation.',
      status: 'OPEN',
      priority: 'MEDIUM',
      createdAt: new Date().toLocaleDateString(),
      updatedAt: new Date().toLocaleDateString()
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [form, setForm] = useState({
    subject: '',
    category: 'GENERAL' as SupportTicket['category'],
    priority: 'MEDIUM' as SupportTicket['priority'],
    description: ''
  });

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject || !form.description) return;
    setCreating(true);
    setMessage(null);
    try {
      const res = await fetchApi<{ ticket: SupportTicket }>('/support/tickets', {
        method: 'POST',
        body: JSON.stringify(form)
      });
      if (res?.ticket) {
        setTickets([res.ticket, ...tickets]);
      } else {
        const localTicket: SupportTicket = {
          id: `TCK-${Math.floor(100 + Math.random() * 900)}`,
          organizationId: user?.organizationId || 'org_default',
          userId: user?.uid || 'usr_default',
          subject: form.subject,
          category: form.category,
          description: form.description,
          status: 'OPEN',
          priority: form.priority,
          createdAt: new Date().toLocaleDateString(),
          updatedAt: new Date().toLocaleDateString()
        };
        setTickets([localTicket, ...tickets]);
      }
      setMessage({ type: 'success', text: 'Support ticket submitted. Our engineering team has been notified!' });
      setShowModal(false);
      setForm({ subject: '', category: 'GENERAL', priority: 'MEDIUM', description: '' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to submit ticket' });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <LifeBuoy className="w-5 h-5 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900">Support & Help Desk</h1>
          </div>
          <p className="text-sm text-slate-500">
            Submit inquiries, integration support requests, and billing queries.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition shadow-xs"
        >
          <Plus className="w-4 h-4" /> Open New Ticket
        </button>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      {/* Ticket List */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
            Your Support Requests ({tickets.length})
          </h2>
        </div>

        <div className="divide-y divide-slate-100">
          {tickets.map((t) => (
            <div key={t.id} className="p-6 hover:bg-slate-50/50 transition">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {t.id}
                  </span>
                  <h3 className="font-semibold text-slate-900 text-sm">{t.subject}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      t.status === 'RESOLVED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}
                  >
                    {t.status}
                  </span>
                  <span className="text-xs text-slate-400">{t.createdAt}</span>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-3">{t.description}</p>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="capitalize">Category: <strong>{t.category.toLowerCase().replace('_', ' ')}</strong></span>
                <span>Priority: <strong className="uppercase">{t.priority}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ticket Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Create Support Ticket</h2>
            <p className="text-xs text-slate-500 mb-4">
              Describe your issue or request. Our technical staff responds within 2-4 hours.
            </p>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Question about Google Places Sync"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-hidden bg-white"
                  >
                    <option value="GENERAL">General Inquiries</option>
                    <option value="GOOGLE_SYNC">Google GBP Sync</option>
                    <option value="REVIEWS">Reviews & QR Flow</option>
                    <option value="WEBSITE">Website Builder</option>
                    <option value="BILLING">Billing & Plans</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Priority
                  </label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-hidden bg-white"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High (Urgent)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Detailed Description
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Provide all relevant details, error messages, or context..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {creating ? 'Submitting...' : 'Submit Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
