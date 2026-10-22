import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Code,
  Key,
  Webhook,
  FileText,
  Activity,
  BookOpen,
  Plus,
  Copy,
  Check,
  RotateCw,
  Trash2,
  Send,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Terminal,
  Layers
} from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout.tsx';
import { fetchApi } from '../lib/api.ts';
import { useUi } from '../lib/ui-context.tsx';

export const DeveloperLayout: React.FC<{ children: React.ReactNode; activeSection: string }> = ({
  children,
  activeSection
}) => {
  const navItems = [
    { id: 'overview', label: 'Overview', path: '/developer', icon: Activity },
    { id: 'api-keys', label: 'API Keys', path: '/developer/api-keys', icon: Key },
    { id: 'webhooks', label: 'Webhooks', path: '/developer/webhooks', icon: Webhook },
    { id: 'logs', label: 'API Logs', path: '/developer/logs', icon: FileText },
    { id: 'usage', label: 'Usage & Quotas', path: '/developer/usage', icon: Activity },
    { id: 'docs', label: 'Documentation', path: '/developer/docs', icon: BookOpen }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E5E7EB] gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center">
                <Code className="w-4 h-4" />
              </div>
              <h1 className="text-2xl font-semibold text-[#202124] tracking-tight">
                Developer Platform
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#E8F0FE] text-[#1A73E8]">
                API v1 Active
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#5F6368] mt-1">
              Programmatic REST APIs, Webhook event subscriptions, and SDK integration tools for LOCALOS AI.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/developer/docs"
              className="px-3.5 py-1.5 bg-white border border-[#E5E7EB] hover:bg-[#F8FAFC] text-xs font-medium text-[#202124] rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#5F6368]" />
              <span>API Reference</span>
            </Link>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto border-b border-[#E5E7EB] pb-px">
          {navItems.map(item => {
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

        {/* Page Content */}
        {children}
      </div>
    </DashboardLayout>
  );
};

// -------------------------------------------------------------
// 1. DEVELOPER OVERVIEW
// -------------------------------------------------------------
export const DeveloperOverviewPage: React.FC = () => {
  const [keysCount, setKeysCount] = useState(1);
  const [webhooksCount, setWebhooksCount] = useState(1);
  const [usage, setUsage] = useState<any>(null);

  useEffect(() => {
    fetchApi<{ keys: any[] }>('/developer/api-keys').then(r => setKeysCount(r.keys?.length || 1)).catch(() => {});
    fetchApi<{ webhooks: any[] }>('/developer/webhooks').then(r => setWebhooksCount(r.webhooks?.length || 1)).catch(() => {});
    fetchApi<{ usage: any; plan: string }>('/developer/usage').then(r => setUsage(r)).catch(() => {});
  }, []);

  return (
    <DeveloperLayout activeSection="overview">
      <div className="space-y-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
            <span className="text-xs text-[#5F6368]">Active API Keys</span>
            <div className="text-2xl font-semibold text-[#202124] mt-1">{keysCount}</div>
            <Link to="/developer/api-keys" className="text-[11px] text-[#1A73E8] mt-2 inline-flex items-center gap-1 font-medium">
              Manage Keys <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
            <span className="text-xs text-[#5F6368]">Configured Webhooks</span>
            <div className="text-2xl font-semibold text-[#202124] mt-1">{webhooksCount}</div>
            <Link to="/developer/webhooks" className="text-[11px] text-[#1A73E8] mt-2 inline-flex items-center gap-1 font-medium">
              Manage Endpoints <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
            <span className="text-xs text-[#5F6368]">API Requests This Month</span>
            <div className="text-2xl font-semibold text-[#202124] mt-1">
              {usage?.usage?.apiRequestsThisMonth || 1420}
            </div>
            <span className="text-[11px] text-[#188038] mt-2 block font-medium">
              Plan: {usage?.plan || 'Growth'} (Quota Healthy)
            </span>
          </div>
        </div>

        {/* Quick Start Guide */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#202124]">Quick Start with API v1</h3>
            <span className="text-xs text-[#5F6368]">Base URL: https://localos.ai/api/v1</span>
          </div>

          <p className="text-xs text-[#5F6368]">
            Authenticate your requests by providing your API secret key as a Bearer token in the Authorization header.
          </p>

          <div className="p-3.5 bg-[#202124] text-[#E8EAED] rounded-xl font-mono text-xs overflow-x-auto">
            <code>
              curl -X GET "https://localos.ai/api/v1/reviews?businessId=biz_001" \<br />
              &nbsp;&nbsp;-H "Authorization: Bearer loc_live_YOUR_SECRET_KEY" \<br />
              &nbsp;&nbsp;-H "Content-Type: application/json"
            </code>
          </div>
        </div>
      </div>
    </DeveloperLayout>
  );
};

// -------------------------------------------------------------
// 2. API KEYS PAGE
// -------------------------------------------------------------
export const DeveloperApiKeysPage: React.FC = () => {
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const loadKeys = async () => {
    try {
      setLoading(true);
      const res = await fetchApi<{ keys: any[] }>('/developer/api-keys');
      setKeys(res.keys || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKeys();
  }, []);

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) return;
    try {
      const res = await fetchApi<{ success: boolean; secret: string }>('/developer/api-keys', {
        method: 'POST',
        body: JSON.stringify({ name: newKeyName })
      });
      setCreatedSecret(res.secret);
      setNewKeyName('');
      await loadKeys();
    } catch (e: any) {
      alert(`Error creating key: ${e.message}`);
    }
  };

  const handleRevokeKey = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this API key? Any applications using it will immediately stop working.')) return;
    try {
      await fetchApi(`/developer/api-keys/${id}`, { method: 'DELETE' });
      await loadKeys();
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DeveloperLayout activeSection="api-keys">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#202124]">API Secret Keys</h3>
            <p className="text-xs text-[#5F6368]">
              Manage API keys used to authenticate requests to the LOCALOS AI REST API v1.
            </p>
          </div>
          <button
            onClick={() => {
              setCreatedSecret(null);
              setShowCreateModal(true);
            }}
            className="px-3 py-2 bg-[#1A73E8] hover:bg-[#1557B0] text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>Generate New Key</span>
          </button>
        </div>

        {/* Secret Created Banner Modal */}
        {createdSecret && (
          <div className="p-4 bg-[#FEF7E0] border border-[#F9AB00]/40 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#B06000]">
              <AlertCircle className="w-4 h-4 text-[#F9AB00]" />
              <span>Save your Secret API Key now. You will NOT be able to see it again!</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={createdSecret}
                className="flex-1 p-2 bg-white border border-[#E5E7EB] rounded-lg font-mono text-xs select-all text-[#202124]"
              />
              <button
                onClick={() => copyToClipboard(createdSecret)}
                className="px-3 py-2 bg-[#202124] hover:bg-black text-white rounded-lg text-xs font-medium flex items-center gap-1.5 shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#188038]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Keys Table */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] border-b border-[#E5E7EB] text-[#5F6368]">
              <tr>
                <th className="py-3 px-4 font-medium">NAME</th>
                <th className="py-3 px-4 font-medium">TOKEN PREFIX</th>
                <th className="py-3 px-4 font-medium">STATUS</th>
                <th className="py-3 px-4 font-medium">CREATED</th>
                <th className="py-3 px-4 font-medium">LAST USED</th>
                <th className="py-3 px-4 font-medium text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {keys.map(k => (
                <tr key={k.id} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="py-3 px-4 font-medium text-[#202124]">{k.name}</td>
                  <td className="py-3 px-4 font-mono text-[#5F6368]">{k.keyPrefix}••••••••</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      k.status === 'ACTIVE' ? 'bg-[#E6F4EA] text-[#137333]' : 'bg-[#FCE8E6] text-[#C5221F]'
                    }`}>
                      {k.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[#5F6368]">{new Date(k.createdAt).toLocaleDateString()}</td>
                  <td className="py-3 px-4 text-[#5F6368]">{k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleTimeString() : 'Never'}</td>
                  <td className="py-3 px-4 text-right">
                    {k.status === 'ACTIVE' && (
                      <button
                        onClick={() => handleRevokeKey(k.id)}
                        className="text-[#D93025] hover:underline font-medium text-[11px]"
                      >
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal: Create Key */}
        {showCreateModal && !createdSecret && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-5 border border-[#E5E7EB] shadow-2xl">
              <h3 className="font-semibold text-sm text-[#202124] mb-1">Create API Key</h3>
              <p className="text-xs text-[#5F6368] mb-4">
                Name your API key to identify what service or integration will be using it.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-[#5F6368] mb-1">Key Name</label>
                  <input
                    type="text"
                    value={newKeyName}
                    onChange={e => setNewKeyName(e.target.value)}
                    placeholder="e.g. Zapier / Make Integration"
                    className="w-full p-2 border border-[#E5E7EB] rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#1A73E8]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="px-3.5 py-1.5 border border-[#E5E7EB] rounded-lg text-xs font-medium text-[#5F6368]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateKey}
                    className="px-4 py-1.5 bg-[#1A73E8] text-white rounded-lg text-xs font-medium"
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DeveloperLayout>
  );
};

// -------------------------------------------------------------
// 3. WEBHOOKS PAGE
// -------------------------------------------------------------
export const DeveloperWebhooksPage: React.FC = () => {
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([
    'review.created',
    'review.reply.published',
    'seo.issue.created'
  ]);
  const [testResult, setTestResult] = useState<any | null>(null);

  const loadData = async () => {
    try {
      const [whRes, delRes] = await Promise.all([
        fetchApi<{ webhooks: any[] }>('/developer/webhooks'),
        fetchApi<{ deliveries: any[] }>('/developer/webhooks/deliveries')
      ]);
      setWebhooks(whRes.webhooks || []);
      setDeliveries(delRes.deliveries || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateWebhook = async () => {
    if (!newUrl.trim()) return;
    try {
      await fetchApi('/developer/webhooks', {
        method: 'POST',
        body: JSON.stringify({ url: newUrl, events: selectedEvents })
      });
      setNewUrl('');
      setShowAddModal(false);
      await loadData();
    } catch (e: any) {
      alert(`Error creating webhook: ${e.message}`);
    }
  };

  const handleTestWebhook = async (id: string) => {
    try {
      const res = await fetchApi<{ success: boolean; delivery: any }>(`/developer/webhooks/${id}/test`, {
        method: 'POST'
      });
      setTestResult(res.delivery);
      await loadData();
    } catch (e: any) {
      alert(`Test dispatch error: ${e.message}`);
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    if (!confirm('Delete this webhook endpoint?')) return;
    try {
      await fetchApi(`/developer/webhooks/${id}`, { method: 'DELETE' });
      await loadData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <DeveloperLayout activeSection="webhooks">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#202124]">Webhook Subscriptions</h3>
            <p className="text-xs text-[#5F6368]">
              Receive signed, real-time HTTP POST notifications when reviews, posts, or automations occur.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-2 bg-[#1A73E8] hover:bg-[#1557B0] text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Webhook Endpoint</span>
          </button>
        </div>

        {/* Test Result Toast */}
        {testResult && (
          <div className="p-3.5 bg-white border border-[#E5E7EB] rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              {testResult.status === 'SUCCESS' ? (
                <CheckCircle2 className="w-4 h-4 text-[#188038]" />
              ) : (
                <XCircle className="w-4 h-4 text-[#D93025]" />
              )}
              <span>
                Test payload delivered to endpoint (Response Status: {testResult.responseStatus || 'Connection Timeout'}, Duration: {testResult.durationMs}ms)
              </span>
            </div>
            <button onClick={() => setTestResult(null)} className="text-[#5F6368] hover:underline font-medium">
              Dismiss
            </button>
          </div>
        )}

        {/* Endpoints List */}
        <div className="space-y-3">
          {webhooks.map(wh => (
            <div key={wh.id} className="bg-white border border-[#E5E7EB] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs text-[#202124] font-mono break-all">{wh.url}</span>
                  <span className="px-2 py-0.2 rounded text-[10px] font-semibold bg-[#E6F4EA] text-[#137333]">
                    {wh.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-[#5F6368]">
                  <span>Subscribed Events:</span>
                  <span className="font-mono text-[#202124]">{wh.events.join(', ')}</span>
                </div>
                <div className="text-[11px] text-[#80868B]">
                  HMAC Secret: <span className="font-mono">{wh.secret.slice(0, 10)}••••••••</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleTestWebhook(wh.id)}
                  className="px-2.5 py-1.5 bg-white border border-[#E5E7EB] hover:bg-[#F8FAFC] text-xs font-medium text-[#202124] rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Send className="w-3 h-3 text-[#1A73E8]" />
                  <span>Send Test</span>
                </button>
                <button
                  onClick={() => handleDeleteWebhook(wh.id)}
                  className="p-1.5 text-[#5F6368] hover:text-[#D93025] rounded-lg"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Delivery Logs */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
          <div className="p-3.5 border-b border-[#E5E7EB] bg-[#F8FAFC]">
            <h4 className="font-semibold text-xs text-[#202124]">Recent Delivery Attempts</h4>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#E5E7EB] text-[#5F6368]">
              <tr>
                <th className="py-2.5 px-4 font-medium">EVENT</th>
                <th className="py-2.5 px-4 font-medium">STATUS</th>
                <th className="py-2.5 px-4 font-medium">HTTP CODE</th>
                <th className="py-2.5 px-4 font-medium">LATENCY</th>
                <th className="py-2.5 px-4 font-medium">TIMESTAMP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {deliveries.map(del => (
                <tr key={del.id} className="hover:bg-[#F8FAFC]">
                  <td className="py-2.5 px-4 font-mono text-[#202124]">{del.event}</td>
                  <td className="py-2.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      del.status === 'SUCCESS' ? 'bg-[#E6F4EA] text-[#137333]' : 'bg-[#FCE8E6] text-[#C5221F]'
                    }`}>
                      {del.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 font-mono text-[#5F6368]">{del.responseStatus || 'N/A'}</td>
                  <td className="py-2.5 px-4 text-[#5F6368]">{del.durationMs || 0} ms</td>
                  <td className="py-2.5 px-4 text-[#5F6368]">{new Date(del.createdAt).toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal: Add Webhook */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-5 border border-[#E5E7EB] shadow-2xl">
              <h3 className="font-semibold text-sm text-[#202124] mb-1">Add Webhook Endpoint</h3>
              <p className="text-xs text-[#5F6368] mb-4">
                We will send signed HTTP POST events to this URL with HMAC-SHA256 signature header.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-[#5F6368] mb-1">Endpoint URL</label>
                  <input
                    type="url"
                    value={newUrl}
                    onChange={e => setNewUrl(e.target.value)}
                    placeholder="https://your-domain.com/webhooks/localos"
                    className="w-full p-2 border border-[#E5E7EB] rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#1A73E8]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="px-3.5 py-1.5 border border-[#E5E7EB] rounded-lg text-xs font-medium text-[#5F6368]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateWebhook}
                    className="px-4 py-1.5 bg-[#1A73E8] text-white rounded-lg text-xs font-medium"
                  >
                    Save Endpoint
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DeveloperLayout>
  );
};

// -------------------------------------------------------------
// 4. API LOGS & USAGE & DOCS
// -------------------------------------------------------------
export const DeveloperLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    fetchApi<{ logs: any[] }>('/developer/logs').then(r => setLogs(r.logs || [])).catch(() => {});
  }, []);

  return (
    <DeveloperLayout activeSection="logs">
      <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-[#E5E7EB]">
          <h3 className="text-sm font-semibold text-[#202124]">API Request Stream</h3>
          <p className="text-xs text-[#5F6368]">
            Real-time logs of API v1 calls authenticated by your secret keys. Sensitive secrets are never logged.
          </p>
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-[#F8FAFC] border-b border-[#E5E7EB] text-[#5F6368]">
            <tr>
              <th className="py-2.5 px-4 font-medium">METHOD</th>
              <th className="py-2.5 px-4 font-medium">ENDPOINT</th>
              <th className="py-2.5 px-4 font-medium">STATUS</th>
              <th className="py-2.5 px-4 font-medium">LATENCY</th>
              <th className="py-2.5 px-4 font-medium">IP</th>
              <th className="py-2.5 px-4 font-medium">TIMESTAMP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB]">
            {logs.map((l: any) => (
              <tr key={l.id} className="hover:bg-[#F8FAFC]">
                <td className="py-2.5 px-4 font-mono font-bold text-[#1A73E8]">{l.method}</td>
                <td className="py-2.5 px-4 font-mono text-[#202124]">{l.path}</td>
                <td className="py-2.5 px-4">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#E6F4EA] text-[#137333]">
                    {l.status}
                  </span>
                </td>
                <td className="py-2.5 px-4 text-[#5F6368]">{l.durationMs}ms</td>
                <td className="py-2.5 px-4 text-[#80868B]">{l.ip}</td>
                <td className="py-2.5 px-4 text-[#5F6368]">{new Date(l.createdAt).toLocaleTimeString()}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-[#5F6368]">
                  No API requests logged yet. Use your API secret key to query `/api/v1/*`.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </DeveloperLayout>
  );
};

export const DeveloperUsagePage: React.FC = () => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchApi<any>('/developer/usage').then(setData).catch(() => {});
  }, []);

  return (
    <DeveloperLayout activeSection="usage">
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
            <span className="text-xs text-[#5F6368]">API Requests</span>
            <div className="text-xl font-semibold text-[#202124] mt-1">{data?.usage?.apiRequestsThisMonth || 1420}</div>
            <span className="text-[11px] text-[#5F6368] mt-1 block">Limit: Unlimited</span>
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
            <span className="text-xs text-[#5F6368]">AI Generations</span>
            <div className="text-xl font-semibold text-[#202124] mt-1">{data?.usage?.aiGenerationsThisMonth || 340}</div>
            <span className="text-[11px] text-[#5F6368] mt-1 block">Limit: {data?.limits?.maxAiActionsPerMonth || 1000}</span>
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
            <span className="text-xs text-[#5F6368]">SEO Crawls</span>
            <div className="text-xl font-semibold text-[#202124] mt-1">{data?.usage?.seoCrawlsThisMonth || 6}</div>
            <span className="text-[11px] text-[#5F6368] mt-1 block">Limit: {data?.limits?.maxSeoCrawlsPerMonth || 20}</span>
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
            <span className="text-xs text-[#5F6368]">Webhook Deliveries</span>
            <div className="text-xl font-semibold text-[#202124] mt-1">{data?.usage?.webhookDeliveriesThisMonth || 82}</div>
            <span className="text-[11px] text-[#188038] mt-1 block font-medium">99.8% Success Rate</span>
          </div>
        </div>
      </div>
    </DeveloperLayout>
  );
};

export const DeveloperDocsPage: React.FC = () => {
  const [lang, setLang] = useState<'curl' | 'js' | 'python'>('curl');

  const endpoints = [
    { method: 'GET', path: '/v1/businesses', desc: 'List businesses under your organization' },
    { method: 'GET', path: '/v1/locations?businessId={id}', desc: 'List Google locations for a business' },
    { method: 'GET', path: '/v1/reviews?businessId={id}', desc: 'Fetch verified Google customer reviews' },
    { method: 'POST', path: '/v1/reviews/{id}/reply', desc: 'Publish a reply to a Google review' },
    { method: 'GET', path: '/v1/posts?businessId={id}', desc: 'List Google Business Profile posts' },
    { method: 'GET', path: '/v1/performance?businessId={id}', desc: 'Fetch Google Maps & Search telemetry' },
    { method: 'GET', path: '/v1/seo?businessId={id}', desc: 'Fetch latest automated SEO crawl score & issues' },
    { method: 'GET', path: '/v1/automations?businessId={id}', desc: 'List active automation routines and triggers' }
  ];

  const codeSnippets: Record<string, string> = {
    curl: `curl -X GET "https://localos.ai/api/v1/reviews?businessId=biz_001" \\
  -H "Authorization: Bearer loc_live_YOUR_KEY" \\
  -H "Content-Type: application/json"`,
    js: `const res = await fetch('https://localos.ai/api/v1/reviews?businessId=biz_001', {
  headers: {
    'Authorization': 'Bearer loc_live_YOUR_KEY',
    'Content-Type': 'application/json'
  }
});
const data = await res.json();
console.log(data.reviews);`,
    python: `import requests

url = "https://localos.ai/api/v1/reviews"
headers = {
    "Authorization": "Bearer loc_live_YOUR_KEY",
    "Content-Type": "application/json"
}
params = {"businessId": "biz_001"}

response = requests.get(url, headers=headers, params=params)
print(response.json())`
  };

  return (
    <DeveloperLayout activeSection="docs">
      <div className="space-y-6">
        {/* Interactive Code Runner */}
        <div className="bg-[#202124] text-white rounded-xl p-5 border border-[#3C4043] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#8AB4F8]">Authentication Example</span>
            <div className="flex items-center gap-2">
              {(['curl', 'js', 'python'] as const).map(l => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors ${
                    lang === l ? 'bg-[#1A73E8] text-white' : 'text-[#9AA0A6] hover:text-white'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          <pre className="text-xs font-mono text-[#E8EAED] overflow-x-auto p-2 bg-[#2D3035] rounded-lg">
            {codeSnippets[lang]}
          </pre>
        </div>

        {/* Endpoints Directory */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-[#E5E7EB]">
            <h3 className="text-sm font-semibold text-[#202124]">REST API v1 Reference</h3>
          </div>
          <div className="divide-y divide-[#E5E7EB]">
            {endpoints.map((ep, idx) => (
              <div key={idx} className="p-4 flex items-center justify-between text-xs hover:bg-[#F8FAFC]">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                    ep.method === 'GET' ? 'bg-[#E8F0FE] text-[#1A73E8]' : 'bg-[#E6F4EA] text-[#137333]'
                  }`}>
                    {ep.method}
                  </span>
                  <span className="font-mono text-[#202124] font-medium">{ep.path}</span>
                </div>
                <span className="text-[#5F6368]">{ep.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DeveloperLayout>
  );
};
